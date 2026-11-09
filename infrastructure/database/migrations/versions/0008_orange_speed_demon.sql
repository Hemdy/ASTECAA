CREATE TABLE "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text DEFAULT 'system' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_notifications_read_idx" ON "admin_notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "admin_notifications_created_at_idx" ON "admin_notifications" USING btree ("created_at");