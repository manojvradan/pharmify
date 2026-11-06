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
import { type JobContext, type JobProcess, ServerOptions, cli, defineAgent, inference, llm, voice } from "@livekit/agents";
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

  constructor(info: CharacterInfo, job: AgentJobMetadata, onEnded: () => void) {
    super({
      // Not sent to any model; the app holds the character's real instructions.
      instructions: `You are ${info.name}.`,
      tts: new elevenlabs.TTS({ apiKey: elevenLabsKey(), voiceId: info.voiceId, model: TTS_MODEL, languageCode: "en" }),
    });
    this.info = info;
    this.job = job;
    this.onEnded = onEnded;
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

    const res = await fetch(`${this.job.apiBase}/api/session/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [AGENT_TICKET_HEADER]: this.job.ticket },
      body: JSON.stringify({ sessionId: this.job.sessionId, agent: this.info.id, text: said }),
    });
    if (res.status === 409) {
      // The server's clock ran out: tell the browser, which ends the part and grades it.
      this.onEnded();
      return null;
    }
    if (!res.ok || !res.body) {
      console.error(`[agent] turn failed ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      return null;
    }
    // Cancelling this stream (the candidate interrupted) cancels the request, which stops the model.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    return new ReadableStream<string>({
      async pull(controller) {
        const { value, done } = await reader.read();
        if (done) {
          const rest = decoder.decode();
          if (rest) controller.enqueue(rest);
          controller.close();
        } else {
          controller.enqueue(decoder.decode(value, { stream: true }));
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
    const job = JSON.parse(ctx.job.metadata) as AgentJobMetadata;
    const ended = () => {
      void ctx.room.localParticipant?.sendText("ended", { topic: TOPIC_ENDED });
    };
    const characters = new Map<CharacterId, Character>(job.characters.map((c) => [c.id, new Character(c, job, ended)]));
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
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: VOICE_AGENT_NAME }));
