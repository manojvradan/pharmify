import type { CaseSource } from "./cases";
import type { Incoming } from "./whatsapp";

/**
 * What the bot is waiting on for one person. Kept per phone number in the database.
 * Nothing is sent or published until they confirm.
 *
 * Internally a feature suggestion is a "ticket" (it becomes a Linear issue); the person
 * only ever sees "suggestion" and "the dev team".
 */
export type Pending =
  /** Chose "Suggest a feature": the next text is the suggestion. */
  | { kind: "ticket-await" }
  /** A written-up suggestion waiting for send, changes, or cancel. */
  | { kind: "ticket"; request: string; draft: { kind: string; title: string; description: string } }
  /** Chose "Add a question": the next document or text is the question. */
  | { kind: "question-await" }
  /** A drafted question (bot_case_drafts row) waiting for approve, changes, or discard. */
  | { kind: "question"; draftId: string }
  | null;

export const BUTTON = {
  menuSuggest: "menu:suggest",
  menuQuestion: "menu:question",
  createTicket: "ticket:create",
  approveQuestion: "question:approve",
  cancel: "cancel",
} as const;

export type Intent =
  | { type: "help" }
  | { type: "ticket-await" }
  | { type: "ticket-new"; request: string }
  | { type: "ticket-confirm" }
  | { type: "ticket-revise"; feedback: string }
  | { type: "question-await" }
  | { type: "question-new"; source: CaseSource }
  | { type: "question-approve" }
  | { type: "question-revise"; feedback: string }
  | { type: "cancel" }
  | { type: "stale-button" }
  | { type: "unsupported" };

/** "suggest: …", "feature: …", "idea …" (and the old "ticket: …") start a suggestion. */
const SUGGEST = /^\s*(?:suggest(?:ion)?|feature(?:\s+request)?|idea|ticket|bug)\b\s*[:\-–—]?\s*/i;
const QUESTION = /^\s*(?:add|new)\s+(?:a\s+)?(?:question|case)\b\s*[:\-–—]?\s*/i;
const CONFIRM = /^\s*(?:y|yes|yep|yeah|send|send it|create|create it|confirm|ok|okay|go|do it|approve|approved|publish|ship it|👍)\s*[.!]*\s*$/i;
const CANCEL = /^\s*(?:cancel|no|nope|stop|discard|never ?mind)\s*[.!]*\s*$/i;
/** Text after "add question" or "suggest" this long is the content itself, not a remark. */
const PASTED_QUESTION_MIN = 80;

/**
 * Decides what a message means, given what the bot is waiting on. Keywords and buttons
 * only, so it's predictable and free; no model call is needed to route.
 */
export function route(msg: Incoming, pending: Pending): Intent {
  if (msg.kind === "button") {
    switch (msg.buttonId) {
      case BUTTON.menuSuggest:
        return { type: "ticket-await" };
      case BUTTON.menuQuestion:
        return { type: "question-await" };
      case BUTTON.cancel:
        return pending ? { type: "cancel" } : { type: "stale-button" };
      case BUTTON.createTicket:
        return pending?.kind === "ticket" ? { type: "ticket-confirm" } : { type: "stale-button" };
      case BUTTON.approveQuestion:
        return pending?.kind === "question" ? { type: "question-approve" } : { type: "stale-button" };
    }
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
  if (SUGGEST.test(text)) {
    const request = text.replace(SUGGEST, "").trim();
    return request ? { type: "ticket-new", request } : { type: "ticket-await" };
  }
  if (CANCEL.test(text)) return { type: "cancel" };
  switch (pending?.kind) {
    case "ticket-await":
      return { type: "ticket-new", request: text };
    case "ticket":
      // Anything else while a write-up is open is a change to it.
      return CONFIRM.test(text) ? { type: "ticket-confirm" } : { type: "ticket-revise", feedback: text };
    case "question-await":
      return { type: "question-new", source: { kind: "text", text } };
    case "question":
      return CONFIRM.test(text) ? { type: "question-approve" } : { type: "question-revise", feedback: text };
  }
  // Nothing in progress: "1" and "2" pick from the menu.
  if (/^\s*1\s*[.)]?\s*$/.test(text)) return { type: "ticket-await" };
  if (/^\s*2\s*[.)]?\s*$/.test(text)) return { type: "question-await" };
  // Greetings, "help", and anything else get the menu.
  return { type: "help" };
}

/** The menu. Sent with two buttons, so it must stay under WhatsApp's 1024 characters. */
export const HELP_TEXT = `Hi! 👋 I'm the Pharmify bot. What would you like to do?

1️⃣ *Suggest a feature*
Tell me something you'd like Pharmify to do or do differently, in your own words. I'll write it up, show you, and send it to the dev team when you say so.

2️⃣ *Add to the question bank*
Send me an exam question: a PDF, Word doc or photo, or just paste the text. I'll turn it into a practice case, work out whether it's legal, ethical or complex clinical, write a full answer scheme, and show you a preview. Nothing goes live until you approve it.

Tap a button or reply 1 or 2. Say "cancel" any time to stop.`;

export const ASK_SUGGESTION = "💡 What would you like Pharmify to do or do differently? Describe it in your own words, as much or as little as you like.";
export const ASK_QUESTION = "📝 Send me the question: a PDF, Word doc or photo, or paste the text here.";
