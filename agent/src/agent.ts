/**
 * Pharmify's hands-free voice agent (LiveKit Agents). It joins one exam session's room,
 * listens, decides when the candidate has finished talking, and speaks as the patient or
 * prescriber. It does not decide what the character says: each turn goes to the web
 * app's /api/session/turn, exactly like a typed turn, so the fact gate, the server clock
 * and the saved transcript stay in one place. The agent only does ears and mouth.
 *
 *   npm run dev     run locally against the app on localhost (reads ../.env.local)
 *   lk agent deploy build and deploy to LiveKit Cloud (see README.md)
 */
import { type JobContext, type JobProcess, ServerOptions, cli, defineAgent, inference, llm, log, voice } from "@livekit/agents";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as silero from "@livekit/agents-plugin-silero";
import { ReadableStream } from "node:stream/web";
import { fileURLToPath } from "node:url";
import {
  AGENT_TICKET_HEADER,
  type AgentJobMetadata,
  type CharacterId,
  TOPIC_ENDED,
  TOPIC_SWITCH,
  VOICE_AGENT_NAME,
} from "./protocol.ts";

/** Same low-latency voice model as the app's own voice mode (lib/voice/elevenlabs.ts). */
const TTS_MODEL = "eleven_flash_v2_5";
/** How long to wait for the app to start answering a turn before apologising instead. */
const TURN_TIMEOUT_MS = 20_000;
/** Said when a turn fails, so the candidate hears something rather than silence. */
const RETRY_LINE = "Sorry, I didn't quite catch that. Could you say it again?";

type Logger = ReturnType<typeof log>;

/** A one-line reply, for when the app can't give one. */
function line(text: string): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue(text);
      controller.close();
    },
  });
}

/** Checks the dispatch metadata the app's /api/livekit/token wrote, so a bad job fails with a clear error. */
function parseJob(raw: string): AgentJobMetadata {
  const job = JSON.parse(raw || "null") as Partial<AgentJobMetadata> | null;
  if (
    !job ||
    typeof job.sessionId !== "string" ||
    typeof job.ticket !== "string" ||
    typeof job.apiBase !== "string" ||
    !Array.isArray(job.characters) ||
    job.characters.length === 0 ||
    !job.characters.every((c) => typeof c?.id === "string" && typeof c.voiceId === "string" && typeof c.name === "string")
  ) {
    throw new Error("Job metadata is missing or malformed (dispatch it through /api/livekit/token)");
  }
  return job as AgentJobMetadata;
}

function elevenLabsKey(): string {
  const k = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY is not set");
  return k;
}

/**
 * The session only runs the reply step when it has an LLM, but replies here come from
 * the app (see Character.llmNode), so this one is never called.
 */
class AppReplies extends llm.LLM {
  label(): string {
    return "pharmify.turn-api";
  }
  chat(): llm.LLMStream {
    throw new Error("Replies come from /api/session/turn via Character.llmNode");
  }
}

type CharacterInfo = AgentJobMetadata["characters"][number];

/** One person in the role play, with their own voice. */
class Character extends voice.Agent {
  info: CharacterInfo;
  job: AgentJobMetadata;
  opened = false;
  onEnded: () => void;
  logger: Logger;

  constructor(info: CharacterInfo, job: AgentJobMetadata, onEnded: () => void, logger: Logger) {
    super({
      // Not sent to any model; the app holds the character's real instructions.
      instructions: `You are ${info.name}.`,
      tts: new elevenlabs.TTS({ apiKey: elevenLabsKey(), voiceId: info.voiceId, model: TTS_MODEL, languageCode: "en" }),
    });
    this.info = info;
    this.job = job;
    this.onEnded = onEnded;
    this.logger = logger.child({ character: info.id });
  }

  /** The scripted opening line, the first time the candidate turns to this character. */
  async onEnter(): Promise<void> {
    if (this.opened) return;
    this.opened = true;
    if (this.info.openingLine) this.session.say(this.info.openingLine);
  }

  /** What the candidate just said goes to the app; its streamed reply is what gets spoken. */
  async llmNode(chatCtx: llm.ChatContext): Promise<ReadableStream<string> | null> {
    const said = [...chatCtx.items]
      .reverse()
      .find((i): i is llm.ChatMessage => i instanceof llm.ChatMessage && i.role === "user")
      ?.textContent?.trim();
    if (!said) return null;

    // Times out only the wait for the app to start answering; the reply itself may stream for longer.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(new Error("turn timed out")), TURN_TIMEOUT_MS);
    const startedAt = performance.now();
    let res: Response;
    try {
      res = await fetch(`${this.job.apiBase}/api/session/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json", [AGENT_TICKET_HEADER]: this.job.ticket },
        body: JSON.stringify({ sessionId: this.job.sessionId, agent: this.info.id, text: said }),
        signal: abort.signal,
      });
    } catch (err) {
      this.logger.error({ err, ms: Math.round(performance.now() - startedAt) }, "turn request failed");
      return line(RETRY_LINE);
    } finally {
      clearTimeout(timer);
    }
    const ms = Math.round(performance.now() - startedAt);
    if (res.status === 409) {
      // The server's clock ran out: tell the browser, which ends the part and grades it.
      this.logger.info("part over (server clock)");
      this.onEnded();
      return null;
    }
    if (!res.ok || !res.body) {
      this.logger.error({ status: res.status, ms, body: (await res.text().catch(() => "")).slice(0, 200) }, "turn failed");
      return line(RETRY_LINE);
    }
    this.logger.debug({ ms }, "turn answering");
    // Cancelling this stream (the candidate interrupted) cancels the request, which stops the model.
    const reader = res.body.getReader();
    const logger = this.logger;
    const decoder = new TextDecoder();
    return new ReadableStream<string>({
      async pull(controller) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (err) {
          // The reply broke off mid-stream: end the line with what was said rather than fail the turn.
          logger.error({ err }, "turn stream broke off");
          controller.close();
          return;
        }
        if (chunk.done) {
          const rest = decoder.decode();
          if (rest) controller.enqueue(rest);
          controller.close();
        } else {
          controller.enqueue(decoder.decode(chunk.value, { stream: true }));
        }
      },
      cancel(reason) {
        void reader.cancel(reason);
      },
    });
  }
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const job = parseJob(ctx.job.metadata);
    const logger = log().child({ sessionId: job.sessionId, jobId: ctx.job.id });
    const ended = () => {
      ctx.room.localParticipant?.sendText("ended", { topic: TOPIC_ENDED }).catch((err) => logger.warn({ err }, "couldn't send ended"));
    };
    const characters = new Map<CharacterId, Character>(
      job.characters.map((c) => [c.id, new Character(c, job, ended, logger)]),
    );
    const first = characters.get("patient") ?? [...characters.values()][0];
    if (!first) throw new Error(`Session ${job.sessionId} has no characters`);

    const session = new voice.AgentSession({
      stt: new elevenlabs.STT({
        apiKey: elevenLabsKey(),
        model: "scribe_v2_realtime",
        languageCode: "en",
        // Without this the plugin commits only when the session flushes it, which it doesn't
        // at the end of speech: in testing the final words arrived ~17 s late. ElevenLabs'
        // own silence detection commits half a second after the candidate stops instead.
        serverVad: { vadSilenceThresholdSecs: 0.5 },
      }),
      llm: new AppReplies(),
      vad: ctx.proc.userData.vad as silero.VAD,
      // Decides from how the candidate sounds whether they've finished, not just from a pause.
      turnHandling: { turnDetection: new inference.TurnDetector() },
    });

    let current = first;
    // The browser says who the candidate turned to (the patient/prescriber switch).
    ctx.room.registerTextStreamHandler(TOPIC_SWITCH, async (reader) => {
      const next = characters.get((await reader.readAll()).trim() as CharacterId);
      if (!next || next === current) return;
      current = next;
      session.interrupt();
      session.updateAgent(next);
    });

    await session.start({ agent: first, room: ctx.room });
    await ctx.connect();
    logger.info({ characters: job.characters.map((c) => c.id) }, "joined session room");
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: VOICE_AGENT_NAME }));
