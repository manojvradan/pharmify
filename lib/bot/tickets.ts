import "server-only";

import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { anthropic } from "@/lib/anthropic";

export const BOT_MODEL = process.env.BOT_MODEL ?? "claude-sonnet-5-5";

export const TicketDraft = z.object({
  kind: z.enum(["feature", "bug", "task"]),
  /** Short, imperative, under ~70 characters. */
  title: z.string(),
  /** Markdown for the Linear issue body. */
  description: z.string(),
});
export type TicketDraft = z.infer<typeof TicketDraft>;

const SYSTEM = `You turn WhatsApp messages into Linear tickets for Pharmify, a web app where Australian pharmacy interns practise for their oral exam. Candidates role-play cases with an AI patient and prescriber (typed or by voice), get graded with a debrief, and study flashcards.

Write the ticket from what the requester said:
- title: short and specific, imperative mood, under 70 characters, no prefix like "Feature:".
- kind: feature (something new or changed), bug (something broken), or task (anything else).
- description: Markdown. Start with a "## Request" section quoting the requester's words exactly. The requester is a pharmacist, not a developer: keep the wording plain. Then "## Details": a few bullet points restating what they want, in plain terms an engineer can act on. Add "## Open questions" only if something important is genuinely unclear.

Only use what the requester said. Do not invent requirements, designs, acceptance criteria, or technical approaches they didn't mention.`;

/** Drafts a ticket from a request, or revises `previous` with the requester's feedback. */
export async function draftTicket(request: string, revise?: { previous: TicketDraft; feedback: string }): Promise<TicketDraft> {
  const content = revise
    ? `Original request:\n${request}\n\nCurrent draft:\n${JSON.stringify(revise.previous, null, 2)}\n\nThe requester wants these changes. Apply them and keep everything else:\n${revise.feedback}`
    : `Request:\n${request}`;
  const response = await anthropic().beta.messages.parse({
    model: BOT_MODEL,
    max_tokens: 2000,
    output_config: { effort: "low", format: betaZodOutputFormat(TicketDraft) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (!response.parsed_output) throw new Error(`Couldn't draft the ticket (${response.stop_reason})`);
  return response.parsed_output;
}

/** How a draft looks in WhatsApp, which renders *bold* and _italic_ but not Markdown headings. */
export function ticketPreview(d: TicketDraft): string {
  const body = d.description
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .trim();
  const kind = { feature: "New feature or change", bug: "Something's not working", task: "Other" }[d.kind];
  return `💡 Here's your suggestion, written up for the dev team:\n\n*${d.title}*\n_${kind}_\n\n${body}`;
}
