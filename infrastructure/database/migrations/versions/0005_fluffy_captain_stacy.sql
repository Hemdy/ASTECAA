CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"channel" text DEFAULT 'site' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"graduation_year" text,
	"location" text,
	"avatar" text,
	"message" text NOT NULL,
	"page" text DEFAULT 'community' NOT NULL,
	"target_id" text,
	"status" text DEFAULT 'approved' NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"album" text NOT NULL,
	"year" integer NOT NULL,
	"media_type" text DEFAULT 'photo' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"size" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"media_type" text DEFAULT 'image' NOT NULL,
	"size_bytes" integer,
	"size_formatted" text,
	"folder" text DEFAULT 'General' NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"id" text PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"category" text DEFAULT 'History' NOT NULL,
	"cover" text,
	"author" text NOT NULL,
	"author_avatar" text,
	"status" text DEFAULT 'published' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"story" text NOT NULL,
	"quote" text,
	"quote_author" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "announcements_status_pinned_idx" ON "announcements" USING btree ("status","pinned");--> statement-breakpoint
CREATE INDEX "community_messages_page_status_idx" ON "community_messages" USING btree ("page","status");--> statement-breakpoint
CREATE INDEX "community_messages_pinned_idx" ON "community_messages" USING btree ("pinned");--> statement-breakpoint
CREATE INDEX "community_messages_created_at_idx" ON "community_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gallery_items_album_idx" ON "gallery_items" USING btree ("album");--> statement-breakpoint
CREATE INDEX "gallery_items_year_idx" ON "gallery_items" USING btree ("year");--> statement-breakpoint
CREATE INDEX "media_files_folder_idx" ON "media_files" USING btree ("folder");--> statement-breakpoint
CREATE UNIQUE INDEX "stories_slug_uidx" ON "stories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "stories_status_idx" ON "stories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stories_category_idx" ON "stories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "timeline_milestones_year_idx" ON "timeline_milestones" USING btree ("year");--> statement-breakpoint
CREATE INDEX "timeline_milestones_sort_order_idx" ON "timeline_milestones" USING btree ("sort_order");