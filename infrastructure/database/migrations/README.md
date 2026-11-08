# Database migrations

Drizzle Kit generates ordered PostgreSQL SQL migrations under `versions/`.
For every schema change, generate and review SQL and snapshots, then run the
package `db:migrate` script. It runs generation before applying pending
migrations. Never use `drizzle-kit push` or `db:push`, and never apply from API
startup. Use the separate `MIGRATION_DATABASE_URL` only for an explicitly
authorized development migration.

Migrations `0000` through `0003` are applied to the configured Neon development
database. Migration `0003` creates the initial events CMS table. The schema was
not derived from live Supabase tables, and no demo or production content was
imported. Supabase discovery and production data mapping remain separate
later-phase work.
