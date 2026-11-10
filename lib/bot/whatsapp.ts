import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * WhatsApp Cloud API (Meta). Meta calls /api/whatsapp for every message sent to the
 * bot's number; replies go out through the Graph API with a long-lived access token.
 *
 *   WHATSAPP_TOKEN            access token (System User token, or the temporary one while testing)
 *   WHATSAPP_PHONE_NUMBER_ID  the bot number's id (not the number itself)
 *   WHATSAPP_APP_SECRET       the Meta app's secret, to check each webhook really came from Meta
 *   WHATSAPP_VERIFY_TOKEN     any string; typed into Meta's webhook setup once to prove you own the URL
 *   WHATSAPP_ALLOWED_NUMBERS  comma-separated numbers allowed to use the bot, with country code
 */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/** Meta signs the raw body with the app secret: `X-Hub-Signature-256: sha256=<hex>`. */
export function validSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const given = Buffer.from(header.slice("sha256=".length), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Digits only, so "+61 412 345 678" and "61412345678" compare equal. */
export function normaliseNumber(n: string): string {
  return n.replace(/\D/g, "");
}

export function allowedNumbers(raw = process.env.WHATSAPP_ALLOWED_NUMBERS ?? ""): Set<string> {
  return new Set(raw.split(",").map(normaliseNumber).filter(Boolean));
}

/** One message from a person, reduced to what the bot acts on. */
export type Incoming = {
  /** WhatsApp's message id ("wamid..."), used to ignore Meta's retries. */
  id: string;
  from: string;
  name?: string;
} & (
  | { kind: "text"; text: string }
  | { kind: "button"; buttonId: string }
  | { kind: "document"; mediaId: string; filename?: string; mimeType?: string; caption?: string }
  | { kind: "image"; mediaId: string; mimeType?: string; caption?: string }
  | { kind: "other"; type: string }
);

// Only the fields used; Meta sends more, and `passthrough` isn't needed to ignore them.
const Message = z.object({
  from: z.string(),
  id: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  interactive: z
    .object({ type: z.string(), button_reply: z.object({ id: z.string(), title: z.string() }).optional() })
    .optional(),
  document: z
    .object({ id: z.string(), filename: z.string().optional(), mime_type: z.string().optional(), caption: z.string().optional() })
    .optional(),
  image: z.object({ id: z.string(), mime_type: z.string().optional(), caption: z.string().optional() }).optional(),
});
const Payload = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            contacts: z.array(z.object({ wa_id: z.string(), profile: z.object({ name: z.string() }).optional() })).optional(),
            messages: z.array(Message).optional(),
          }),
        }),
      ),
    }),
  ),
});

/** The messages in one webhook call. Delivery receipts ("statuses") and anything unparseable give none. */
export function parseWebhook(body: unknown): Incoming[] {
  const parsed = Payload.safeParse(body);
  if (!parsed.success) return [];
  const out: Incoming[] = [];
  for (const entry of parsed.data.entry) {
    for (const { value } of entry.changes) {
      const names = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));
      for (const m of value.messages ?? []) {
        const base = { id: m.id, from: m.from, name: names.get(m.from) };
        if (m.type === "text" && m.text) out.push({ ...base, kind: "text", text: m.text.body });
        else if (m.type === "interactive" && m.interactive?.button_reply)
          out.push({ ...base, kind: "button", buttonId: m.interactive.button_reply.id });
        else if (m.type === "document" && m.document)
          out.push({
            ...base,
            kind: "document",
            mediaId: m.document.id,
            filename: m.document.filename,
            mimeType: m.document.mime_type,
            caption: m.document.caption,
          });
        else if (m.type === "image" && m.image)
          out.push({ ...base, kind: "image", mediaId: m.image.id, mimeType: m.image.mime_type, caption: m.image.caption });
        else out.push({ ...base, kind: "other", type: m.type });
      }
    }
  }
  return out;
}

async function send(to: string, message: Record<string, unknown>): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${env("WHATSAPP_PHONE_NUMBER_ID")}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...message }),
  });
  if (!res.ok) throw new Error(`WhatsApp send failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

/** Larger files are refused before downloading; a question sheet is never this big. */
const MEDIA_MAX_BYTES = 20 * 1024 * 1024;

/** Downloads a file someone sent: Meta gives a short-lived URL for the media id, which needs the token too. */
export async function downloadMedia(mediaId: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const auth = { Authorization: `Bearer ${env("WHATSAPP_TOKEN")}` };
  const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`, { headers: auth });
  const meta = (await metaRes.json().catch(() => null)) as { url?: string; mime_type?: string; file_size?: number } | null;
  if (!metaRes.ok || !meta?.url) throw new Error(`Couldn't find that file on WhatsApp (${metaRes.status})`);
  if ((meta.file_size ?? 0) > MEDIA_MAX_BYTES) throw new Error("That file is over 20 MB. Send a smaller one.");
  const fileRes = await fetch(meta.url, { headers: auth });
  if (!fileRes.ok) throw new Error(`Couldn't download that file (${fileRes.status})`);
  return { bytes: Buffer.from(await fileRes.arrayBuffer()), mimeType: meta.mime_type ?? "application/octet-stream" };
}

/** WhatsApp's limits: 4096 characters for a text, 1024 for a message with buttons, 20 for a button title. */
const TEXT_MAX = 4096;
const BUTTON_BODY_MAX = 1024;

function clip(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export function sendText(to: string, text: string): Promise<void> {
  return send(to, { type: "text", text: { body: clip(text, TEXT_MAX), preview_url: true } });
}

/** A message with up to three reply buttons. Pressing one comes back as a `button` message with its id. */
export function sendButtons(to: string, text: string, buttons: { id: string; title: string }[]): Promise<void> {
  return send(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: clip(text, BUTTON_BODY_MAX) },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: clip(b.title, 20) } })) },
    },
  });
}
