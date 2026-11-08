CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"long_description" text DEFAULT '' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"time" text DEFAULT '' NOT NULL,
	"venue" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"poster" text DEFAULT '' NOT NULL,
	"banner" text DEFAULT '' NOT NULL,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"organizer" text DEFAULT '' NOT NULL,
	"organizer_role" text DEFAULT '' NOT NULL,
	"organizer_photo" text DEFAULT '' NOT NULL,
	"capacity" integer NOT NULL,
	"registered" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_status_check" CHECK ("events"."status" in ('draft', 'published', 'scheduled', 'archived')),
	CONSTRAINT "events_capacity_check" CHECK ("events"."capacity" > 0),
	CONSTRAINT "events_registered_check" CHECK ("events"."registered" >= 0 and "events"."registered" <= "events"."capacity"),
	CONSTRAINT "events_end_date_check" CHECK ("events"."end_date" is null or "events"."end_date" >= "events"."start_date")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_uidx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_status_start_date_idx" ON "events" USING btree ("status","start_date");--> statement-breakpoint
CREATE INDEX "events_featured_status_idx" ON "events" USING btree ("featured","status");