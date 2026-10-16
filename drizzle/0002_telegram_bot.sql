CREATE TABLE "bot_sessions" (
	"chat_id" bigint PRIMARY KEY NOT NULL,
	"state" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bot_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bot_updates" (
	"update_id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bot_updates" ENABLE ROW LEVEL SECURITY;