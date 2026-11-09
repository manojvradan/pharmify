import type { Incoming } from "./whatsapp";

/**
 * What the bot is waiting on for one person. Kept per phone number in the database.
 * A ticket is never filed until they confirm the preview.
 */
export type Pending = { kind: "ticket"; request: string; draft: { kind: string; title: string; description: string } } | null;

export const BUTTON = { createTicket: "ticket:create", cancel: "cancel" } as const;

export type Intent =
  | { type: "help" }
  | { type: "ticket-new"; request: string }
  | { type: "ticket-empty" }
  | { type: "ticket-confirm" }
  | { type: "ticket-revise"; feedback: string }
  | { type: "cancel" }
  | { type: "stale-button" }
  | { type: "question" }
  | { type: "unsupported" };

const TICKET = /^\s*(?:ticket|feature|bug|idea)\b\s*[:\-–—]?\s*/i;
const QUESTION = /^\s*(?:add|new)\s+(?:a\s+)?(?:question|case)\b/i;
const CONFIRM = /^\s*(?:y|yes|yep|yeah|create|create it|confirm|ok|okay|go|do it|send it|approve|👍)\s*[.!]*\s*$/i;
const CANCEL = /^\s*(?:cancel|no|nope|stop|discard|never ?mind)\s*[.!]*\s*$/i;

/**
 * Decides what a message means, given what the bot is waiting on. Keywords first, so
 * it's predictable and free; no model call is needed to route.
 */
export function route(msg: Incoming, pending: Pending): Intent {
  if (msg.kind === "button") {
    if (msg.buttonId === BUTTON.cancel) return pending ? { type: "cancel" } : { type: "stale-button" };
    if (msg.buttonId === BUTTON.createTicket) return pending?.kind === "ticket" ? { type: "ticket-confirm" } : { type: "stale-button" };
    return { type: "stale-button" };
  }
  if (msg.kind === "document") return { type: "question" };
  if (msg.kind === "other") return { type: "unsupported" };

  const text = msg.text.trim();
  if (QUESTION.test(text)) return { type: "question" };
  if (TICKET.test(text)) {
    const request = text.replace(TICKET, "").trim();
    return request ? { type: "ticket-new", request } : { type: "ticket-empty" };
  }
  if (pending?.kind === "ticket") {
    if (CONFIRM.test(text)) return { type: "ticket-confirm" };
    if (CANCEL.test(text)) return { type: "cancel" };
    // Anything else while a draft is open is a change to it.
    return { type: "ticket-revise", feedback: text };
  }
  if (CANCEL.test(text)) return { type: "cancel" };
  // Greetings, "help", and anything without a keyword get the menu.
  return { type: "help" };
}

export const HELP_TEXT = `Hi! Here's what I can do:

🎫 *Make a Linear ticket*
Start with "ticket", e.g.
_ticket: let candidates replay a case from the debrief_
I'll show you a preview before anything is created.

📝 *Add a question* (coming soon)
Send a document and say "add question".

Say "cancel" any time to drop what we're working on.`;
