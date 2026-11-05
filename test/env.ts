import { readFileSync } from "node:fs";

/** Reads .env.local for live evals and DB tests (API key, DATABASE_URL). Never used by `npm test`. */
export function loadEnvLocal(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .map((l) => l.trim().match(/^([A-Z0-9_]+)=(.*)$/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]),
    );
  } catch {
    return {};
  }
}

/** Live evals: hit a running dev server and cost API calls, so they never run with `npm test`. */
