CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"exam_sitting" text,
	"state" text,
	"internship_stage" text,
	"mic_checked_at" timestamp with time zone,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
