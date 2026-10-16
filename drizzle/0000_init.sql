CREATE TABLE "gallery_items" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"sub" text NOT NULL,
	"image" jsonb NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "masterclass_sessions" (
	"masterclass_id" text NOT NULL,
	"start" timestamp NOT NULL,
	"end" time NOT NULL,
	"seats_left" integer NOT NULL,
	CONSTRAINT "masterclass_sessions_masterclass_id_start_pk" PRIMARY KEY("masterclass_id","start")
);
--> statement-breakpoint
ALTER TABLE "masterclass_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "masterclasses" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"desc" text NOT NULL,
	"about" text NOT NULL,
	"hours" double precision NOT NULL,
	"price" integer NOT NULL,
	"capacity" integer NOT NULL,
	"image" jsonb NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "masterclasses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"format" text NOT NULL,
	"text" text NOT NULL,
	"made" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "masterclass_sessions" ADD CONSTRAINT "masterclass_sessions_masterclass_id_masterclasses_id_fk" FOREIGN KEY ("masterclass_id") REFERENCES "public"."masterclasses"("id") ON DELETE cascade ON UPDATE no action;