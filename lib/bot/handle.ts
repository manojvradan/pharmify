import "server-only";

import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createIssue } from "./linear";
import { BUTTON, HELP_TEXT, type Pending, route } from "./route";
import { draftTicket, ticketPreview, type TicketDraft } from "./tickets";
import { type Incoming, sendButtons, sendText } from "./whatsapp";

/** True the first time a message id is seen. Meta retries a webhook it thinks failed. */
async function firstTime(messageId: string): Promise<boolean> {
  const rows = await db().insert(schema.botMessages).values({ id: messageId }).onConflictDoNothing().returning();
  return rows.length > 0;
}

async function getPending(phone: string): Promise<Pending> {
  const [row] = await db().select().from(schema.botThreads).where(eq(schema.botThreads.phone, phone));
  return row?.pending ?? null;
}

async function setPending(phone: string, pending: Pending): Promise<void> {
  await db()
    .insert(schema.botThreads)
    .values({ phone, pending, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.botThreads.phone, set: { pending, updatedAt: new Date() } });
}

async function showTicket(to: string, draft: TicketDraft): Promise<void> {
  await sendText(to, ticketPreview(draft));
  await sendButtons(to, "Create this ticket? Or reply with what to change.", [
    { id: BUTTON.createTicket, title: "Create ticket" },
    { id: BUTTON.cancel, title: "Cancel" },
  ]);
}

/** Handles one message from an allowed number. Errors are reported back in the chat. */
export async function handleMessage(msg: Incoming): Promise<void> {
  if (!(await firstTime(msg.id))) return;
  const to = msg.from;
  try {
    const pending = await getPending(to);
    const intent = route(msg, pending);
    switch (intent.type) {
      case "help":
        return void (await sendText(to, HELP_TEXT));
      case "ticket-empty":
        return void (await sendText(to, 'What should the ticket be about? e.g. "ticket: add a dark mode"'));
      case "ticket-new": {
        const draft = await draftTicket(intent.request);
        await setPending(to, { kind: "ticket", request: intent.request, draft });
        return void (await showTicket(to, draft));
      }
      case "ticket-revise": {
        if (pending?.kind !== "ticket") return;
        const draft = await draftTicket(pending.request, {
          previous: pending.draft as TicketDraft,
          feedback: intent.feedback,
        });
        await setPending(to, { ...pending, draft });
        return void (await showTicket(to, draft));
      }
      case "ticket-confirm": {
        if (pending?.kind !== "ticket") return;
        // Cleared first, so a double tap on "Create ticket" can't file it twice.
        await setPending(to, null);
        const issue = await createIssue({ title: pending.draft.title, description: pending.draft.description });
        return void (await sendText(to, `✅ Created ${issue.identifier}: ${issue.title}\n${issue.url}`));
      }
      case "cancel":
        await setPending(to, null);
        return void (await sendText(to, pending ? "Okay, dropped it." : "Nothing to cancel."));
      case "stale-button":
        return void (await sendText(to, "That one's already been dealt with."));
      case "question":
        return void (await sendText(to, "Adding questions is coming soon. For now I can make Linear tickets: start a message with \"ticket\"."));
      case "unsupported":
        return void (await sendText(to, "I can only read text messages (and documents, soon). Say \"help\" to see what I can do."));
    }
  } catch (err) {
    console.error("[whatsapp] handling failed", err);
    await sendText(to, `Sorry, something went wrong: ${err instanceof Error ? err.message : "unknown error"}`).catch(() => {});
  }
}
