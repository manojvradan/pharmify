import { defineConfig } from "vitest/config";
import base from "./vitest.config";

/** Live evals: hit a running dev server and cost API calls, so they never run with `npm test`. */
export default defineConfig({
  ...base,
  test: { ...base.test, include: ["evals/**/*.eval.ts"], testTimeout: 60_000 },
});
