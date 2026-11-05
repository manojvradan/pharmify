/** Clean-up for actor replies before they are shown or spoken. Pure, so it can be unit tested. */

/**
 * Removes a leading speaker label ("Mr R.: ", "Patient: ") from the start of a reply.
 * Returns undefined while the text is still too short to decide.
 */
export function stripSpeakerLabel(text: string, name: string, final = false): string | undefined {
  const label = new RegExp(`^\\s*(?:${escapeRegExp(name)}|patient|prescriber|doctor|gp)\\s*:\\s*`, "i");
  const m = text.match(label);
  if (m) return text.slice(m[0].length);
  // A label can only be a prefix; wait until the text is long enough to rule one out.
  if (!final && text.length < name.length + 32 && !/[.!?,]\s/.test(text)) return undefined;
  return text;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
