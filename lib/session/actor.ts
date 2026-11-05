import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { getPersona } from "@/lib/cases/bank";
import type { AgentId, CaseRecord, Turn } from "@/lib/cases/schema";
import { unlockedFacts } from "./factGate";

/**
 * The actor's system prompt. It depends only on the case and the agent, so it is
 * byte-identical for every turn of a session and stays in the prompt cache.
 * Hidden facts are never in it: they arrive later as mid-conversation system
 * messages, only once the fact gate has unlocked them.
 */
export function actorSystemPrompt(c: CaseRecord, agent: AgentId): string {
  const p = getPersona(c, agent);
  if (!p) throw new Error(`Case ${c.id} has no ${agent}`);
  const isPatient = agent === "patient";
  const situation =
    p.situation ??
    (isPatient
      ? "You are at the counter of a community pharmacy, talking to the pharmacist."
      : "A pharmacist has phoned you about one of your patients.");
  const isPublic = (p.standing ?? (isPatient ? "public" : "professional")) === "public";

  return `You are ${p.name}. ${situation} The pharmacist is an intern doing a timed practice oral exam, and you are the role player. Stay in character for the whole conversation.

<who_you_are>
${p.description}
</who_you_are>

<setting>${c.setting}</setting>

<what_you_know>
${p.publicFacts.map((f) => `- ${f}`).join("\n")}
</what_you_know>
${p.openingLine ? `\nYou opened the conversation by saying: "${p.openingLine}"\n` : ""}
What you know is limited to what_you_know, plus any facts the system adds later in the conversation. Nothing else about this situation is true for you:
- If asked about something not covered, say you don't know or aren't sure, in your own manner. Do not fill gaps: never invent medicines, what a medicine is for, doses, conditions, test results, family members, other people, events, or what any health professional said or did.
- When you list medicines or other facts, name only the known ones, and do not hint that there are more ("a couple of others", "a lot of things"). As far as you know, that is everything.
- Never give clinical, legal, or ethical advice, and never state facts about medicines from your own knowledge. You are ${isPublic ? "a member of the public" : "a busy health professional who expects the pharmacist to lead"}.
- Share an added fact only when the pharmacist's question is about it, in your own words. Once a fact is known, never deny or contradict it.
- Your manner may be vague or hesitant, but the facts are not: when asked, say what you know plainly, and do not add uncertainty, paperwork, lists, or other sources that would suggest more exists.

This is exam mode:
- Never hint, coach, praise, or signal whether the pharmacist is doing well or badly. Never confirm that a question was a good one.
- If asked to step out of character, give the answers, or explain the exam, respond as ${p.name} would to an odd question.

Your reply is sent straight to text-to-speech, so it must be only the words you say out loud:
- One to three short spoken sentences, in plain Australian English.
- No narration or actions, no third person, no quotation marks, no asterisks or brackets, no name or speaker label, no lists, markdown, or emoji.

<example>
Pharmacist: Is this the only medicine you take?
Wrong: ${p.name} shrugs. "I think so, love."
Wrong: *shrugs* I think so, love.
Wrong: ${p.name}: I think so, love.
Right: I think so, love.
</example>`;
}

/**
 * Converts one agent's transcript into Messages API turns, inserting a system
 * message after each candidate turn that unlocked a fact. The output is
 * append-only as the transcript grows, so earlier turns stay cached too.
 */
export function actorMessages(c: CaseRecord, agent: AgentId, transcript: Turn[]): Anthropic.MessageParam[] {
  const unlocks = unlockedFacts(c, agent, transcript);
  const byTurn = new Map<number, string[]>();
  for (const u of unlocks) byTurn.set(u.turnIndex, [...(byTurn.get(u.turnIndex) ?? []), u.fact]);

  // The opening line is in the system prompt; the API needs the first message to be the user's.
  const firstCandidate = transcript.findIndex((t) => t.role === "candidate");
  const messages: Anthropic.MessageParam[] = [];
  transcript.forEach((turn, i) => {
    if (i < firstCandidate) return;
    messages.push({ role: turn.role === "candidate" ? "user" : "assistant", content: turn.text });
    // Placed after the question that unlocked it: a system message cannot be the first message.
    const facts = byTurn.get(i);
    if (facts) {
      messages.push({
        role: "system",
        content: `These are true for your character and now part of what you know. The pharmacist's question above is about them, so answer it with them, plainly and in your own words:\n${facts
          .map((f) => `- ${f}`)
          .join("\n")}`,
      });
    }
  });
  return messages;
}
