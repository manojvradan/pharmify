import { defineConfig } from "vitest/config";
import base from "./vitest.config";
import { loadEnvLocal } from "./test/env";

/** Integration tests against the real Neon database in .env.local. Opt-in: `npm run test:db`. */
export default defineConfig({
  ...base,
  test: { ...base.test, include: ["**/*.db.test.ts"], exclude: ["node_modules", ".next"], testTimeout: 30_000, env: loadEnvLocal() },
});
