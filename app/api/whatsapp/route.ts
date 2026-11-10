import { after } from "next/server";
import { handleMessage } from "@/lib/bot/handle";
import { allowedNumbers, normaliseNumber, parseWebhook, validSignature } from "@/lib/bot/whatsapp";

function mask(n: string): string {
  const d = normaliseNumber(n);
  return d.length > 6 ? `${d.slice(0, 4)}…${d.slice(-3)}` : `${d.length} digits`;
}

/** The keys of a payload, nested, with no values: enough to see what Meta changed. */
function shape(v: unknown, depth = 0): string {
  if (depth > 6) return "…";
  if (Array.isArray(v)) return `[${v.length ? shape(v[0], depth + 1) : ""}]`;
  if (v && typeof v === "object") {
    return `{${Object.entries(v)
      .map(([k, x]) => `${k}:${shape(x, depth + 1)}`)
      .join(",")}}`;
  }
  return typeof v;
}

/** Drafting with the model happens after the response, within this limit (a case can take a few minutes). */
export const maxDuration = 300;

/** Meta's one-off check when the webhook URL is saved: echo the challenge if the token matches. */
export function GET(req: Request) {
  const url = new URL(req.url);
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === token) {
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Every message to the bot's number. Answers 200 straight away (Meta retries slow or
 * failed webhooks) and does the work in after(). Only signed requests from Meta, and
 * only messages from WHATSAPP_ALLOWED_NUMBERS, get anywhere.
 */
export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return new Response("Not configured", { status: 500 });
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return new Response("Bad signature", { status: 401 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const allowed = allowedNumbers();
  const parsed = parseWebhook(body);
  const messages = parsed.filter((m) => allowed.has(normaliseNumber(m.from)));
  // Say why nothing happened, without logging whole numbers or message text.
  for (const m of parsed) {
    if (!messages.includes(m)) console.warn(`[whatsapp] ignored ${m.kind} from ${mask(m.from)} (not in WHATSAPP_ALLOWED_NUMBERS)`);
  }
  if (parsed.length === 0 && raw.includes('"messages"')) {
    console.warn(`[whatsapp] couldn't read a message from this webhook; shape: ${shape(body)}`);
  }
  if (messages.length > 0) {
    after(async () => {
      // In order, so a quick "yes" after a draft is handled after the draft.
      for (const m of messages) await handleMessage(m);
    });
  }
  return new Response("OK", { status: 200 });
}
