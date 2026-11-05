import { defineConfig } from "vitest/config";
import { loadEnvLocal } from "./test/env";
import base from "./vitest.config";

export default defineConfig({
  ...base,
  test: { ...base.test, include: ["evals/**/*.eval.ts"], testTimeout: 60_000, env: loadEnvLocal() },
});
