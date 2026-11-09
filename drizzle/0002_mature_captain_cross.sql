CREATE TABLE "bot_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_threads" (
	"phone" text PRIMARY KEY NOT NULL,
	"pending" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
