import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instance: NeonHttpDatabase<typeof schema> | undefined;

/**
 * Neon over HTTP: one round trip per query, no connection pool to manage, which suits
 * short serverless requests. Created lazily so a missing DATABASE_URL fails the
 * request that needs it, not the build.
 */
export function db() {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Pull the Neon env vars into .env.local.");
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}

export { schema };
