import { z } from "zod";
import raw from "@/data/flashcards/code-of-ethics.json";

/**
 * Code of Ethics flashcards. One JSON file under data/flashcards/.
 * Validated at import, so a malformed card fails the build, not a study session.
 */

export const DOMAINS = ["Care", "Integrity", "Competency", "Collaboration", "Using the Code"] as const;
export type Domain = (typeof DOMAINS)[number];

const Flashcard = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  domain: z.enum(DOMAINS),
  /** Shown on the card, e.g. "Care principle 2". */
  section: z.string(),
  front: z.string(),
  /** Paraphrased from the Code, never quoted at length. */
  back: z.string(),
  /** Clause references, e.g. "Care 2b, 2e". */
  source: z.string(),
});
export type Flashcard = z.infer<typeof Flashcard>;

const Deck = z.object({
  source: z.string(),
  review: z.object({ status: z.enum(["draft", "reviewed"]), version: z.string() }),
  cards: z.array(Flashcard).min(1),
});

export const CODE_OF_ETHICS = Deck.parse(raw);

/** Cards per study session. */
export const SESSION_SIZE = 12;
