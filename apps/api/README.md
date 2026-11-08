# ASTECAA API

The independent API runs on Deno and uses Neon PostgreSQL through Drizzle.
Better Auth handles browser sessions under `/api/auth/*`; event APIs use
published Neon content for public reads and Neon-backed role checks for admin
operations.

## Local development

Configure the ignored `apps/api/.env` file with development-only values from
the root `.env.example`, then run:

```powershell
deno task --cwd apps/api check
deno task --cwd apps/api serve:api
```

The API requires `DATABASE_URL`, `BETTER_AUTH_URL`, and a server-only
`BETTER_AUTH_SECRET` of at least 32 characters. Browser origins must be listed
exactly in `ALLOWED_ORIGINS`. Migrations are never applied at API startup.

## Database changes

Drizzle schema definitions and migrations live under
`infrastructure/database`. For schema changes, generate and review SQL with
`db:generate`, then apply with `db:migrate`. The migration script generates
again before applying. Never use `db:push`.

## Current transition status

- Event content reads and writes use Neon.
- Admin API authorization validates Better Auth sessions and Neon role
  assignments.
- Admin and member browser services now use the Better Auth API instead of the
  Supabase SDK.
- No production Supabase data or accounts have been verified as migrated.
  Existing admin accounts therefore have no guaranteed Neon identity or role.
- Member self-registration and password recovery remain disabled until secure
  account provisioning and transactional email are implemented.
- Media storage, other CMS entities, and remaining demo-backed features are not
  migrated. Do not treat this API slice as a completed platform cutover.

The Supabase SDK and Edge Function scaffold have been removed from the
application runtime. The external Supabase project has not been deleted or
modified; keep it available until authorized data export, account mapping,
acceptance testing, and rollback criteria are complete.

Production hosts must set `globalThis.__ASTECAA_API_URL__` before bootstrapping
each Angular application and configure the corresponding exact origin in
`ALLOWED_ORIGINS`.
