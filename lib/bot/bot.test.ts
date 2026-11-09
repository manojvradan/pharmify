import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BUTTON, type Pending, route } from "./route";
import { ticketPreview } from "./tickets";
import { allowedNumbers, type Incoming, normaliseNumber, parseWebhook, validSignature } from "./whatsapp";

const text = (t: string): Incoming => ({ id: "w1", from: "61400000000", kind: "text", text: t });
const button = (id: string): Incoming => ({ id: "w1", from: "61400000000", kind: "button", buttonId: id });
const ticket: Pending = { kind: "ticket", request: "dark mode", draft: { kind: "feature", title: "Add dark mode", description: "x" } };

describe("route", () => {
  it.each([
    ["ticket: add dark mode", "add dark mode"],
    ["Ticket - add dark mode", "add dark mode"],
    ["feature let me replay a case", "let me replay a case"],
    ["BUG: the timer skips", "the timer skips"],
  ])("%s starts a ticket", (msg, request) => {
    expect(route(text(msg), null)).toEqual({ type: "ticket-new", request });
  });

  it("a bare keyword asks what the ticket is about", () => {
    expect(route(text("ticket"), null)).toEqual({ type: "ticket-empty" });
  });

  it("doesn't treat words that merely start with a keyword as one", () => {
    expect(route(text("tickets are great"), null)).toEqual({ type: "help" });
  });

  it.each(["add question", "Add a question please", "new case"])("%s is a question", (msg) => {
    expect(route(text(msg), null)).toEqual({ type: "question" });
  });

  it("a document is a question", () => {
    expect(route({ id: "w1", from: "1", kind: "document", mediaId: "m" }, null)).toEqual({ type: "question" });
  });

  it("with a draft open: yes creates, cancel drops, anything else revises", () => {
    expect(route(text("yes"), ticket)).toEqual({ type: "ticket-confirm" });
    expect(route(text("Create it!"), ticket)).toEqual({ type: "ticket-confirm" });
    expect(route(text("cancel"), ticket)).toEqual({ type: "cancel" });
    expect(route(text("make it about mobile too"), ticket)).toEqual({ type: "ticket-revise", feedback: "make it about mobile too" });
  });

  it("a new ticket keyword replaces an open draft", () => {
    expect(route(text("ticket: something else"), ticket)).toEqual({ type: "ticket-new", request: "something else" });
  });

  it("yes with nothing open is not a confirmation", () => {
    expect(route(text("yes"), null)).toEqual({ type: "help" });
  });

  it("buttons only act on an open draft", () => {
    expect(route(button(BUTTON.createTicket), ticket)).toEqual({ type: "ticket-confirm" });
    expect(route(button(BUTTON.createTicket), null)).toEqual({ type: "stale-button" });
    expect(route(button(BUTTON.cancel), null)).toEqual({ type: "stale-button" });
  });
});

describe("whatsapp", () => {
  it("checks Meta's signature over the raw body", () => {
    const body = '{"a":1}';
    const sig = `sha256=${createHmac("sha256", "secret").update(body).digest("hex")}`;
    expect(validSignature(body, sig, "secret")).toBe(true);
    expect(validSignature(body, sig, "other")).toBe(false);
    expect(validSignature('{"a":2}', sig, "secret")).toBe(false);
    expect(validSignature(body, null, "secret")).toBe(false);
    expect(validSignature(body, "sha256=abc", "secret")).toBe(false);
  });

  it("normalises allowed numbers", () => {
    expect(normaliseNumber("+61 412 345-678")).toBe("61412345678");
    expect(allowedNumbers("+61 412 345 678, 61400000000,")).toEqual(new Set(["61412345678", "61400000000"]));
  });

  it("parses text, button and document messages, and ignores status updates", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "x",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [{ wa_id: "61400000000", profile: { name: "Sam" } }],
                messages: [
                  { from: "61400000000", id: "a", timestamp: "1", type: "text", text: { body: "ticket: hi" } },
                  { from: "61400000000", id: "b", timestamp: "1", type: "interactive", interactive: { type: "button_reply", button_reply: { id: "cancel", title: "Cancel" } } },
                  { from: "61400000000", id: "c", timestamp: "1", type: "document", document: { id: "m1", filename: "case.pdf", mime_type: "application/pdf" } },
                  { from: "61400000000", id: "d", timestamp: "1", type: "sticker", sticker: { id: "s" } },
                ],
              },
            },
            { field: "messages", value: { messaging_product: "whatsapp", statuses: [{ id: "a", status: "read" }] } },
          ],
        },
      ],
    };
    expect(parseWebhook(payload)).toEqual([
      { id: "a", from: "61400000000", name: "Sam", kind: "text", text: "ticket: hi" },
      { id: "b", from: "61400000000", name: "Sam", kind: "button", buttonId: "cancel" },
      { id: "c", from: "61400000000", name: "Sam", kind: "document", mediaId: "m1", filename: "case.pdf", mimeType: "application/pdf", caption: undefined },
      { id: "d", from: "61400000000", name: "Sam", kind: "other", type: "sticker" },
    ]);
    expect(parseWebhook({ nonsense: true })).toEqual([]);
  });

  it("shows Markdown headings as WhatsApp bold", () => {
    expect(ticketPreview({ kind: "feature", title: "T", description: "## Request\n**hi**" })).toBe("🎫 *T*\n_feature_\n\n*Request*\n*hi*");
  });
});
