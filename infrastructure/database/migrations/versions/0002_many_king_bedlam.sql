DROP INDEX "app_users_email_normalized_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_email_normalized_uidx" ON "app_users" USING btree ("email_normalized");