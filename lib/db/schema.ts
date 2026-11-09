import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Pending } from "@/lib/bot/route";
import type { Debrief } from "@/lib/session/report";

/**
 * Users live in Clerk; tables here store the Clerk user id as `user_id`.
 * Deleting a user's data means deleting their sessions (turns, debriefs and
 * usage cascade) — see `deleteUserData` in lib/session/store.ts.
 */

export const sessionStatus = pgEnum("session_status", ["live", "grading", "graded"]);

/** One attempt at one case. The server's `started_at` is the clock; the browser's timer is only a display. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    caseId: text("case_id").notNull(),
    /** The case record's `review.version` at the time, so old debriefs stay explainable after edits. */
    caseVersion: text("case_version").notNull(),
    status: sessionStatus("status").notNull().default("live"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    /** Seconds used, capped at the part length. Set when the session ends. */
    timeUsed: integer("time_used"),
  },
  (t) => [index("sessions_user_started_idx").on(t.userId, t.startedAt)],
);

/** Every line said, in order. Append-only while the session is live. */
export const turns = pgTable(
  "turns",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    agent: text("agent", { enum: ["patient", "prescriber"] }).notNull(),
    role: text("role", { enum: ["candidate", "actor"] }).notNull(),
    text: text("text").notNull(),
    /** Seconds since the session started, from the server clock. */
    t: integer("t").notNull(),
    /** On candidate turns: fact ids this turn unlocked (from the fact gate), for analysis. */
    unlockedFactIds: text("unlocked_fact_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("turns_session_idx").on(t.sessionId, t.id)],
);

/** The graded report, one per session. Stored whole so the debrief page renders exactly what was graded. */
export const debriefs = pgTable("debriefs", {
  sessionId: uuid("session_id")
    .primaryKey()
    .references(() => sessions.id, { onDelete: "cascade" }),
  debrief: jsonb("debrief").$type<Debrief>().notNull(),
  graderModel: text("grader_model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One model call. Token counts, not dollars: prices change, so cost is computed when reporting. */
export const usageEvents = pgTable(
  "usage_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    kind: text("kind", { enum: ["actor", "grader"] }).notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    /** Request start to first streamed token (actor only). */
    ttftMs: integer("ttft_ms"),
    durationMs: integer("duration_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("usage_session_idx").on(t.sessionId)],
);

/**
 * Onboarding answers, one row per Clerk user. A user with no row, or with
 * `onboarded_at` null, hasn't finished onboarding. Allowed values are in lib/onboarding.ts.
 */
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  /** "YYYY-MM"; null means not booked yet (or not answered, if onboarding isn't done). */
  examSitting: text("exam_sitting"),
  /** State or territory, e.g. "NSW": legal cases follow its rules. */
  state: text("state"),
  internshipStage: text("internship_stage"),
  micCheckedAt: timestamp("mic_checked_at", { withTimezone: true }),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * WhatsApp bot: what it is waiting on for each person (e.g. a ticket draft to confirm).
 * Keyed by phone number; the allowed numbers are in WHATSAPP_ALLOWED_NUMBERS.
 */
export const botThreads = pgTable("bot_threads", {
  phone: text("phone").primaryKey(),
  pending: jsonb("pending").$type<Pending>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** WhatsApp message ids already handled, so Meta's retries of the same webhook are ignored. */
export const botMessages = pgTable("bot_messages", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Pilot waitlist from the landing page. Not tied to a Clerk user. */
export const pilotSignups = pgTable("pilot_signups", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
