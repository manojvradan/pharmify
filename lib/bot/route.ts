import type { CaseSource } from "./cases";
import type { Incoming } from "./whatsapp";

/**
 * What the bot is waiting on for one person. Kept per phone number in the database.
 * Nothing is filed or published until they confirm.
 */
export type Pending =
  | { kind: "ticket"; request: string; draft: { kind: string; title: string; description: string } }
  /** Said "add question" without the question: the next document or text is it. */
  | { kind: "question-await" }
  /** A drafted question (bot_case_drafts row) waiting for approve, changes, or discard. */
  | { kind: "question"; draftId: string }
  | null;

export const BUTTON = { createTicket: "ticket:create", approveQuestion: "question:approve", cancel: "cancel" } as const;

export type Intent =
  | { type: "help" }
  | { type: "ticket-new"; request: string }
  | { type: "ticket-empty" }
  | { type: "ticket-confirm" }
  | { type: "ticket-revise"; feedback: string }
  | { type: "question-await" }
  | { type: "question-new"; source: CaseSource }
  | { type: "question-approve" }
  | { type: "question-revise"; feedback: string }
  | { type: "cancel" }
  | { type: "stale-button" }
  | { type: "unsupported" };

const TICKET = /^\s*(?:ticket|feature|bug|idea)\b\s*[:\-–—]?\s*/i;
const QUESTION = /^\s*(?:add|new)\s+(?:a\s+)?(?:question|case)\b\s*[:\-–—]?\s*/i;
const CONFIRM = /^\s*(?:y|yes|yep|yeah|create|create it|confirm|ok|okay|go|do it|send it|approve|approved|publish|ship it|👍)\s*[.!]*\s*$/i;
const CANCEL = /^\s*(?:cancel|no|nope|stop|discard|never ?mind)\s*[.!]*\s*$/i;
/** Text after "add question" this long is the question itself, not a remark. */
const PASTED_QUESTION_MIN = 80;

/**
 * Decides what a message means, given what the bot is waiting on. Keywords first, so
 * it's predictable and free; no model call is needed to route.
 */
export function route(msg: Incoming, pending: Pending): Intent {
  if (msg.kind === "button") {
    if (msg.buttonId === BUTTON.cancel) return pending ? { type: "cancel" } : { type: "stale-button" };
    if (msg.buttonId === BUTTON.createTicket) return pending?.kind === "ticket" ? { type: "ticket-confirm" } : { type: "stale-button" };
    if (msg.buttonId === BUTTON.approveQuestion) return pending?.kind === "question" ? { type: "question-approve" } : { type: "stale-button" };
    return { type: "stale-button" };
  }
  // A file is always a question to draft, whatever else was going on.
  if (msg.kind === "document" || msg.kind === "image") {
    return {
      type: "question-new",
      source: { kind: "media", mediaId: msg.mediaId, mimeType: msg.mimeType, filename: msg.kind === "document" ? msg.filename : undefined, caption: msg.caption },
    };
  }
  if (msg.kind === "other") return { type: "unsupported" };

  const text = msg.text.trim();
  if (QUESTION.test(text)) {
    const rest = text.replace(QUESTION, "").trim();
    return rest.length >= PASTED_QUESTION_MIN ? { type: "question-new", source: { kind: "text", text: rest } } : { type: "question-await" };
  }
  if (TICKET.test(text)) {
    const request = text.replace(TICKET, "").trim();
    return request ? { type: "ticket-new", request } : { type: "ticket-empty" };
  }
  if (CANCEL.test(text)) return { type: "cancel" };
  switch (pending?.kind) {
    case "ticket":
      // Anything else while a draft is open is a change to it.
      return CONFIRM.test(text) ? { type: "ticket-confirm" } : { type: "ticket-revise", feedback: text };
    case "question":
      return CONFIRM.test(text) ? { type: "question-approve" } : { type: "question-revise", feedback: text };
    case "question-await":
      return { type: "question-new", source: { kind: "text", text } };
  }
  // Greetings, "help", and anything without a keyword get the menu.
  return { type: "help" };
}

export const HELP_TEXT = `Hi! Here's what I can do:

🎫 *Make a Linear ticket*
Start with "ticket", e.g.
_ticket: let candidates replay a case from the debrief_
I'll show you a preview before anything is created.

📝 *Add a question*
Send the question as a PDF, Word doc or photo (or say "add question" and paste it). I'll draft it, send you a preview to check, and put it live when you approve.

Say "cancel" any time to drop what we're working on.`;
