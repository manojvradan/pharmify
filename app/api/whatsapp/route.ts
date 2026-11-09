import { after } from "next/server";
import { handleMessage } from "@/lib/bot/handle";
import { allowedNumbers, normaliseNumber, parseWebhook, validSignature } from "@/lib/bot/whatsapp";

/** Drafting with the model happens after the response, within this limit. */
export const maxDuration = 60;

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
  const messages = parseWebhook(body).filter((m) => allowed.has(normaliseNumber(m.from)));
  if (messages.length > 0) {
    after(async () => {
      // In order, so a quick "yes" after a draft is handled after the draft.
      for (const m of messages) await handleMessage(m);
    });
  }
  return new Response("OK", { status: 200 });
}
