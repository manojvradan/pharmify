/**
 * Regenerates lib/cases/index.generated.ts from the files in data/cases/.
 * Runs before every build (package.json "prebuild"), so adding a case is just adding its JSON.
 *   npm run cases:index
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

// A path in a variable, so TypeScript doesn't ask for an import it can't type-check from here.
const lib = new URL("../lib/cases/caseIndex.ts", import.meta.url).href;
const { CASE_INDEX_PATH, renderCaseIndex } = (await import(lib)) as typeof import("../lib/cases/caseIndex");

const root = new URL("../", import.meta.url);
const out = new URL(CASE_INDEX_PATH, root);
const next = renderCaseIndex(readdirSync(new URL("data/cases/", root)));
let prev = "";
try {
  prev = readFileSync(out, "utf8");
} catch {}
if (prev !== next) {
  writeFileSync(out, next);
  console.log(`Updated ${CASE_INDEX_PATH}`);
}
