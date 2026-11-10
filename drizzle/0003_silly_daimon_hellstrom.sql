CREATE TABLE "bot_case_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"token" text NOT NULL,
	"record" jsonb NOT NULL,
	"assumptions" jsonb NOT NULL,
	"problems" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"pr_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
