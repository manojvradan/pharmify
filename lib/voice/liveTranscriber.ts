import { MIC_SAMPLE_RATE } from "./format";

/**
 * Runs in the audio thread: averages the microphone down to 16 kHz (a box filter, enough
 * for speech) and posts 100 ms frames of 16-bit PCM. "flush" posts whatever is left.
 */
const WORKLET = `
class Pcm16 extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${MIC_SAMPLE_RATE};
    this.phase = 0; this.sum = 0; this.count = 0;
    this.frame = new Int16Array(${MIC_SAMPLE_RATE / 10}); this.n = 0;
    this.port.onmessage = () => {
      this.port.postMessage({ pcm: this.frame.slice(0, this.n).buffer, last: true });
      this.n = 0;
    };
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.sum += ch[i]; this.count++; this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        const s = Math.max(-1, Math.min(1, this.sum / this.count));
        this.sum = 0; this.count = 0;
        this.frame[this.n++] = s * 0x7fff;
        if (this.n === this.frame.length) {
          this.port.postMessage({ pcm: this.frame.buffer, last: false }, [this.frame.buffer]);
          this.frame = new Int16Array(${MIC_SAMPLE_RATE / 10}); this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("pcm16-downsampler", Pcm16);
`;

const loaded = new WeakMap<AudioContext, Promise<void>>();

function loadWorklet(ctx: AudioContext): Promise<void> {
  let p = loaded.get(ctx);
  if (!p) {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
    p = ctx.audioWorklet.addModule(url).finally(() => URL.revokeObjectURL(url));
    loaded.set(ctx, p);
  }
  return p;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** How long to wait, after letting go, for the final words before falling back to uploading. */
const COMMIT_TIMEOUT_MS = 4000;

/** Loads the audio worklet ahead of the first press, so no speech is lost while it loads. */
export function prepareLiveTranscription(ctx: AudioContext): void {
  void loadWorklet(ctx).catch(() => {});
}

export function liveTranscriptionSupported(): boolean {
  return typeof AudioWorkletNode !== "undefined" && typeof WebSocket !== "undefined";
}

/**
 * Streams one "hold to speak" answer to ElevenLabs' live transcription (Scribe v2
 * Realtime) while the candidate is talking, so the words are ready about a quarter of a
 * second after they let go. Audio is buffered until the connection is up, so nothing is
 * lost while it connects. `finish()` resolves to the text, "" if nothing was said, or
 * null if live transcription failed (the caller then uploads the recording instead).
 */
export class LiveTranscriber {
  private ws: WebSocket | null = null;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private sink: GainNode | null = null;
  private queue: string[] = [];
  private ready = false;
  private failed = false;
  private done = false;
  private committed: ((text: string | null) => void) | null = null;
  private flushed: ((pcm: ArrayBuffer) => void) | null = null;
  private result: string | null | undefined;

  /** `url` is a promise for the token URL from /api/session/listen/token. */
  constructor(
    private readonly ctx: AudioContext,
    private readonly stream: MediaStream,
    private readonly url: Promise<string>,
  ) {}

  async start(): Promise<void> {
    await loadWorklet(this.ctx);
    if (this.done) return;
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "pcm16-downsampler");
    // A silent path to the speakers keeps the worklet running in every browser.
    this.sink = this.ctx.createGain();
    this.sink.gain.value = 0;
    this.source.connect(this.node).connect(this.sink).connect(this.ctx.destination);
    this.node.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; last: boolean }>) => {
      if (e.data.last) this.flushed?.(e.data.pcm);
      else this.sendAudio(e.data.pcm, false);
    };
    void this.ctx.resume();

    this.url.then(
      (url) => {
        if (this.done) return;
        const ws = new WebSocket(url);
        this.ws = ws;
        ws.onmessage = (e) => this.onMessage(String(e.data));
        ws.onerror = () => this.fail("connection error");
        ws.onclose = (e) => {
          if (this.result === undefined) this.fail(`closed ${e.code}`);
        };
      },
      () => this.fail("no token"),
    );
  }

  /** Stops listening and waits for the final transcript. */
  async finish(): Promise<string | null> {
    const node = this.node;
    if (!node || this.failed) return this.close(null);
    const rest = await Promise.race([
      new Promise<ArrayBuffer>((r) => {
        this.flushed = r;
        node.port.postMessage("flush");
      }),
      new Promise<ArrayBuffer>((r) => setTimeout(() => r(new ArrayBuffer(0)), 300)),
    ]);
    this.disconnectMic();
    if (this.failed) return this.close(null);
    const text = new Promise<string | null>((r) => (this.committed = r));
    // The last chunk carries the commit; send a little silence if nothing was left over.
    this.sendAudio(rest.byteLength ? rest : new ArrayBuffer(MIC_SAMPLE_RATE / 50), true);
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), COMMIT_TIMEOUT_MS));
    return this.close(await Promise.race([text, timeout]));
  }

  cancel(): void {
    this.close(null);
  }

  private sendAudio(pcm: ArrayBuffer, commit: boolean) {
    const msg = JSON.stringify({
      message_type: "input_audio_chunk",
      audio_base_64: toBase64(pcm),
      commit,
      sample_rate: MIC_SAMPLE_RATE,
    });
    if (this.ready && this.ws?.readyState === WebSocket.OPEN) this.ws.send(msg);
    else this.queue.push(msg);
  }

  private onMessage(data: string) {
    let m: { message_type?: string; text?: string; error?: string };
    try {
      m = JSON.parse(data);
    } catch {
      return;
    }
    switch (m.message_type) {
      case "session_started":
        this.ready = true;
        for (const msg of this.queue.splice(0)) this.ws?.send(msg);
        break;
      case "committed_transcript":
        this.result = (m.text ?? "").trim();
        this.committed?.(this.result);
        break;
      case "insufficient_audio_activity":
        // Connected fine, but heard nothing: an empty answer, not a failure.
        this.result = "";
        this.committed?.("");
        break;
      case "partial_transcript":
      case "committed_transcript_with_timestamps":
      case "warning":
        break;
      default:
        if (m.message_type) this.fail(`${m.message_type}: ${m.error ?? ""}`);
    }
  }

  private fail(why: string) {
    if (this.failed || this.result !== undefined) return;
    console.warn("[voice] live transcription failed, will upload instead:", why);
    this.failed = true;
    this.committed?.(null);
  }

  private disconnectMic() {
    this.source?.disconnect();
    this.node?.disconnect();
    this.sink?.disconnect();
    if (this.node) this.node.port.onmessage = null;
    this.source = this.node = this.sink = null;
  }

  private close(text: string | null): string | null {
    this.done = true;
    this.disconnectMic();
    this.queue = [];
    const ws = this.ws;
    this.ws = null;
    if (ws) ws.onclose = ws.onerror = ws.onmessage = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close();
    return text;
  }
}
