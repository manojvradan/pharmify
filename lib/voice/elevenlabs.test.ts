import { describe, expect, it } from "vitest";
import { phraseEnd } from "./elevenlabs";

describe("phraseEnd", () => {
  it("waits for a finished sentence", () => {
    expect(phraseEnd("Yeah, my friend said")).toBe(0);
    // The full stop needs the space after it: "it." might still become "it.com" or "it..."
    expect(phraseEnd("Yeah, my friend said you might have it.")).toBe(0);
    expect(phraseEnd("You might have it. I've")).toBe("You might have it. ".length);
  });

  it("cuts after the last finished sentence, keeping closing quotes with it", () => {
    const text = 'Is that a problem? She said "fine." Then I';
    expect(text.slice(0, phraseEnd(text))).toBe('Is that a problem? She said "fine." ');
  });

  it("speaks a long clause at its comma rather than waiting for the full stop", () => {
    const short = "Look, I just need it";
    expect(phraseEnd(short)).toBe(0);
    const long = "I've been to every pharmacy between here and the coast this week, and nobody";
    expect(long.slice(0, phraseEnd(long))).toBe("I've been to every pharmacy between here and the coast this week, ");
  });
});
