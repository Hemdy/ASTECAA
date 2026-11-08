CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"graduation_year" integer,
	"department" text,
	"biography" text,
	"manifesto" text,
	"photo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_voters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"voter_hash" text NOT NULL,
	"voter_email_normalized" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"results_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "elections_dates_check" CHECK ("elections"."end_date" >= "elections"."start_date")
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"email_normalized" text NOT NULL,
	"phone" text,
	"graduation_year" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_normalized" text NOT NULL,
	"role_code" text DEFAULT 'alumni' NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_status_check" CHECK ("invitations"."status" in ('pending', 'accepted', 'revoked', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voter_otp_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email_normalized" text NOT NULL,
	"phone" text NOT NULL,
	"graduation_year" text NOT NULL,
	"otp_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"voter_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "graduation_year" text;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_voters" ADD CONSTRAINT "election_voters_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_app_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voter_otp_requests" ADD CONSTRAINT "voter_otp_requests_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidates_position_id_sort_order_idx" ON "candidates" USING btree ("position_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "election_voters_election_voter_uidx" ON "election_voters" USING btree ("election_id","voter_hash");--> statement-breakpoint
CREATE INDEX "elections_active_dates_idx" ON "elections" USING btree ("is_active","start_date","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "event_registrations_event_email_uidx" ON "event_registrations" USING btree ("event_id","email_normalized");--> statement-breakpoint
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_registrations_user_id_idx" ON "event_registrations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_uidx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_email_normalized_idx" ON "invitations" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "positions_election_id_sort_order_idx" ON "positions" USING btree ("election_id","sort_order");--> statement-breakpoint
CREATE INDEX "voter_otp_requests_election_email_idx" ON "voter_otp_requests" USING btree ("election_id","email_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_election_position_voter_uidx" ON "votes" USING btree ("election_id","position_id","voter_hash");--> statement-breakpoint
CREATE INDEX "votes_candidate_id_idx" ON "votes" USING btree ("candidate_id");