import { z } from "zod";
import { CAST_IDS, type CastId } from "@/lib/cast";
import { VOICE_KEYS, type VoiceKey } from "@/lib/voice/voices";

/**
 * A case in the question bank. One JSON file per case under data/cases/.
 * Everything the actor may say comes from here; the model improvises only the wording.
 */

export const AgentId = z.enum(["patient", "prescriber"]);
export type AgentId = z.infer<typeof AgentId>;

const Persona = z.object({
  /** Shown on the switch in the session UI, e.g. "Patient · Mr R." */
  label: z.string(),
  /** Name the actor answers to, e.g. "Mr R." */
  name: z.string(),
  /** Age, manner, health literacy, how hard they push back. */
  description: z.string(),
  /**
   * Where they are and how they are talking to the pharmacist, e.g. "You have phoned the
   * pharmacy about your mother." Defaults to the counter (patient) or a phone call about
   * one of your patients (prescriber).
   */
  situation: z.string().optional(),
  /** Whether they speak as a member of the public or as a health professional. Defaults by slot. */
  standing: z.enum(["public", "professional"]).optional(),
  /** Which cast character draws this persona (lib/cast.ts). Defaults by standing. */
  avatar: z.enum(CAST_IDS).optional(),
  /** Which Australian voice they speak in (lib/voice/voices.ts). Defaults to the avatar's voice. */
  voice: z.enum(VOICE_KEYS).optional(),
  /** Said word for word, without the model, when the candidate first opens this agent. */
  openingLine: z.string().optional(),
  /** What the persona may say without being asked. */
  publicFacts: z.array(z.string()),
});

const HiddenFact = z.object({
  id: z.string(),
  agent: AgentId,
  /** The fact as the persona would know it. Only reaches the actor once unlocked. */
  fact: z.string(),
  /**
   * Short phrases that unlock the fact. A trigger matches when every one of its
   * words appears in what the candidate said to that agent (after normalising).
   */
  triggers: z.array(z.string()).min(1),
  /** The question a strong candidate would ask; shown in the debrief. */
  unlockHint: z.string(),
});

export const CaseRecord = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  category: z.enum(["ethical", "legal", "clinical"]),
  /** One of the Board's problem types, or the ethical/legal theme. */
  problemType: z.string(),
  setting: z.string(),
  questionSheet: z.string(),
  documents: z.object({
    prescription: z
      .object({
        item: z.string(),
        directions: z.string(),
        footer: z.string(),
      })
      .optional(),
    dispensingHistory: z.array(z.object({ item: z.string(), date: z.string() })).optional(),
    notes: z.array(z.string()).optional(),
  }),
  agents: z.object({
    patient: Persona,
    prescriber: Persona.optional(),
  }),
  hiddenFacts: z.array(HiddenFact),
  /** Grader-only. Never sent to the actor or the browser. */
  answerKey: z.object({
    plantedProblem: z.string(),
    acceptableResolutions: z.array(z.string()),
    unacceptableActions: z.array(z.string()),
    counsellingPoints: z.array(z.string()),
    codePrinciples: z.array(z.string()).default([]),
    legal: z.array(z.string()).default([]),
    modelAnswer: z.string(),
  }),
  review: z.object({
    status: z.enum(["draft", "reviewed"]),
    reviewer: z.string().optional(),
    date: z.string().optional(),
    version: z.string(),
  }),
  sources: z.array(z.string()).default([]),
});
export type CaseRecord = z.infer<typeof CaseRecord>;

/** The part of a case that is safe to send to the browser: no hidden facts, no answer key. */
export type PublicCase = {
  id: string;
  title: string;
  category: CaseRecord["category"];
  setting: string;
  questionSheet: string;
  documents: CaseRecord["documents"];
  agents: { id: AgentId; label: string; name: string; openingLine?: string; avatar: CastId; voice: VoiceKey }[];
  draft: boolean;
  /** Role play (clinical) or a spoken explanation (ethical, legal). See lib/cases/format.ts. */
  format: "roleplay" | "explain";
  /** Length of the timed part, in seconds. */
  partSeconds: number;
};

/** One line of a conversation with one agent. `t` is seconds since the part started. */
export const Turn = z.object({
  role: z.enum(["candidate", "actor"]),
  text: z.string().max(4000),
  t: z.number().int().min(0),
});
export type Turn = z.infer<typeof Turn>;
