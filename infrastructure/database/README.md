# Database infrastructure

The target database is Neon PostgreSQL. Drizzle schema definitions live in
`schema.ts`; reviewed, generated SQL migrations live in `migrations/versions/`.
Drizzle Kit and its configuration are isolated in this package, separately
from the Deno API runtime dependencies.

For every schema change, update the Drizzle schema, run `db:generate`, review
the generated SQL, and apply through `db:migrate`. The `db:migrate` package
script always runs `db:generate` before applying migrations, so it cannot be
used to skip migration generation. Do not invoke Drizzle Kit's migrate command
directly. `db:migrate:apply` is an implementation detail of the package script.
Never use `drizzle-kit push` or `db:push`; the package script intentionally
fails to prevent that non-reproducible workflow.

The development migrations contain provider-neutral principal and RBAC tables
alongside the Better Auth identity/session tables. They have been applied to
the configured Neon development database and verified there; no user or
production records were inserted. These migrations do not describe or alter
the existing Supabase schema. Do not seed demo fixtures or production records.

The Supabase SDK and Edge Function scaffold have been removed from the
application runtime. The external Supabase project remains untouched because
its data and user accounts have not been verified as migrated. Keep source
credentials out of browser configuration and source control. Database URLs
belong in ignored local environment files or an approved secret manager, never
in this directory or an Angular bundle.
