import "server-only";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { type CaseDraft, caseSummary, draftCase } from "./cases";
import { publishCase } from "./github";
import { createIssue } from "./linear";
import { ASK_QUESTION, ASK_SUGGESTION, BUTTON, HELP_TEXT, type Pending, route } from "./route";
import { draftTicket, ticketPreview, type TicketDraft } from "./tickets";
import { type Incoming, sendButtons, sendText } from "./whatsapp";

const SITE_URL = process.env.SITE_URL ?? "https://pharmify.au";

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
  await sendButtons(to, "Send this to the dev team? Or reply with anything you'd like to change.", [
    { id: BUTTON.createTicket, title: "Send it" },
    { id: BUTTON.cancel, title: "Cancel" },
  ]);
}

async function getDraft(phone: string, id: string) {
  const [row] = await db()
    .select()
    .from(schema.botCaseDrafts)
    .where(and(eq(schema.botCaseDrafts.id, id), eq(schema.botCaseDrafts.phone, phone)));
  return row;
}

/** Saves a draft (new, or replacing the open one) and sends its summary, preview link and buttons. */
async function showQuestion(to: string, draft: CaseDraft, existingId?: string): Promise<void> {
  const values = { record: draft.record, categoryReason: draft.categoryReason, assumptions: draft.assumptions, problems: draft.problems, updatedAt: new Date() };
  let row: { id: string; token: string };
  if (existingId) {
    [row] = await db().update(schema.botCaseDrafts).set(values).where(eq(schema.botCaseDrafts.id, existingId)).returning();
  } else {
    [row] = await db()
      .insert(schema.botCaseDrafts)
      .values({ ...values, phone: to, token: randomBytes(18).toString("base64url") })
      .returning();
  }
  await setPending(to, { kind: "question", draftId: row.id });
  await sendText(to, caseSummary(draft, `${SITE_URL}/preview/${row.id}?t=${row.token}`));
  const ok = draft.problems.length === 0;
  await sendButtons(
    to,
    ok ? "Put this question live? Or reply with what to change." : "Reply with what to change, and I'll fix it and check again.",
    ok
      ? [
          { id: BUTTON.approveQuestion, title: "Approve" },
          { id: BUTTON.cancel, title: "Discard" },
        ]
      : [{ id: BUTTON.cancel, title: "Discard" }],
  );
}

/** Handles one message from an allowed number. Errors are reported back in the chat. */
export async function handleMessage(msg: Incoming): Promise<void> {
  if (!(await firstTime(msg.id))) return;
  const to = msg.from;
  const who = msg.name ?? "the team";
  try {
    const pending = await getPending(to);
    const intent = route(msg, pending);
    switch (intent.type) {
      case "help":
        return void (await sendButtons(to, HELP_TEXT, [
          { id: BUTTON.menuSuggest, title: "Suggest a feature" },
          { id: BUTTON.menuQuestion, title: "Add a question" },
        ]));
      case "ticket-await":
        await setPending(to, { kind: "ticket-await" });
        return void (await sendText(to, ASK_SUGGESTION));
      case "ticket-new": {
        const draft = await draftTicket(intent.request);
        await setPending(to, { kind: "ticket", request: intent.request, draft });
        return void (await showTicket(to, draft));
      }
      case "ticket-revise": {
        if (pending?.kind !== "ticket") return;
        const draft = await draftTicket(pending.request, { previous: pending.draft as TicketDraft, feedback: intent.feedback });
        await setPending(to, { ...pending, draft });
        return void (await showTicket(to, draft));
      }
      case "ticket-confirm": {
        if (pending?.kind !== "ticket") return;
        // Cleared first, so a double tap on "Send it" can't file it twice.
        await setPending(to, null);
        const issue = await createIssue({ title: pending.draft.title, description: pending.draft.description });
        return void (await sendText(to, `✅ Sent to the dev team! It's on their list as ${issue.identifier}: "${issue.title}".`));
      }

      case "question-await":
        await setPending(to, { kind: "question-await" });
        return void (await sendText(to, ASK_QUESTION));
      case "question-new": {
        await sendText(to, "📝 Got it! I'm turning it into a practice case and writing the answer scheme. This takes a minute or two.");
        const draft = await draftCase({ source: intent.source, sentBy: msg.name });
        return void (await showQuestion(to, draft));
      }
      case "question-revise": {
        if (pending?.kind !== "question") return;
        const row = await getDraft(to, pending.draftId);
        if (!row || row.status !== "draft") return void (await setPending(to, null));
        await sendText(to, "✏️ Updating the draft…");
        const draft = await draftCase({ previous: row.record, feedback: intent.feedback });
        return void (await showQuestion(to, draft, row.id));
      }
      case "question-approve": {
        if (pending?.kind !== "question") return;
        const row = await getDraft(to, pending.draftId);
        if (!row || row.status !== "draft") return void (await sendText(to, "That one's already been dealt with."));
        if (row.problems.length > 0) {
          return void (await sendText(to, "This draft still fails the checks, so I can't put it live. Reply with what to change."));
        }
        // Cleared first, so a double tap can't publish twice.
        await setPending(to, null);
        const result = await publishCase(row.record, who);
        await db()
          .update(schema.botCaseDrafts)
          .set({ status: "published", prUrl: result.prUrl, updatedAt: new Date() })
          .where(eq(schema.botCaseDrafts.id, row.id));
        return void (await sendText(
          to,
          result.merged
            ? `🚀 Approved! "${row.record.title}" will be in the question bank in about 2 minutes, marked as not yet reviewed by a pharmacist.`
            : `I saved "${row.record.title}", but couldn't put it live automatically, so the dev team needs to finish it off (send them this link):\n${result.prUrl}`,
        ));
      }

      case "cancel":
        await setPending(to, null);
        if (pending?.kind === "question") {
          await db()
            .update(schema.botCaseDrafts)
            .set({ status: "discarded", updatedAt: new Date() })
            .where(and(eq(schema.botCaseDrafts.id, pending.draftId), eq(schema.botCaseDrafts.status, "draft")));
        }
        return void (await sendText(to, pending ? "Okay, dropped it." : "Nothing to cancel."));
      case "stale-button":
        return void (await sendText(to, "That one's already been dealt with."));
      case "unsupported":
        return void (await sendText(to, 'I can read text, documents and photos. Say "help" to see what I can do.'));
    }
  } catch (err) {
    console.error("[whatsapp] handling failed", err);
    await sendText(to, `Sorry, something went wrong: ${err instanceof Error ? err.message : "unknown error"}`).catch(() => {});
  }
}
