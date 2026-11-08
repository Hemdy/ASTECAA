# ASTEC Infrastructure Setup Guide

This guide covers local Neon database development and migration commands. It
does not provision a Neon project, complete production authentication,
storage/email, migrate Supabase data, or complete the platform cutover.

## 1. Prerequisites

- Windows PowerShell or another supported shell.
- Node.js 20.19+ for the database migration CLI. The Angular project may have
  its own Node requirement; do not change its runtime for this backend setup.
- Deno 2 for the API runtime/check. The repository environment does not have a
  global Deno install; this change was checked using an isolated Deno 2.9.6
  invocation. Install Deno from the official instructions for normal use.
- A disposable **development** Neon project/branch and connection URLs, created
  by an authorized operator.
- Git-ignored `apps/api/.env` created locally from `.env.example`.

Official references:

- [Deno installation](https://docs.deno.com/runtime/getting_started/installation/)
- [Neon connection strings](https://neon.com/docs/connect/connect-from-any-app)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)
- [Drizzle with Neon](https://orm.drizzle.team/docs/connect-neon)
- [Drizzle Kit migrations](https://orm.drizzle.team/docs/kit-overview)

Do not use the deprecated `deployctl` instructions in the Neon Deno guide as a
production deployment path. Hosting selection is still open.

## 2. Local configuration

From the repository root in PowerShell, create the API-local env file only if
it does not already exist. This deliberately does not overwrite the existing
root `.env`, which may contain existing workspace or source-project values:

```powershell
if (-not (Test-Path apps/api/.env)) {
  Copy-Item .env.example apps/api/.env
} else {
  Write-Error "apps/api/.env already exists; review it locally and do not overwrite it."
}
```

Edit `apps/api/.env` locally and provide only disposable development values:

- `DATABASE_URL`: runtime URL, preferably Neon pooled endpoint, with TLS.
- `MIGRATION_DATABASE_URL`: direct development endpoint and migration role,
  only when applying migrations.

Do not paste connection strings into chat, source code, task output, logs, or
Angular configuration. Do not reuse a production connection string for local
development. New database commands read only `apps/api/.env`, not the root
`.env`.

## 3. Install API dependencies

From repository root:

```powershell
npm install --prefix apps/api
npm install --prefix infrastructure/database
```

The first command installs only API runtime dependencies and updates
`apps/api/package-lock.json`. The second installs migration-only tooling and
updates `infrastructure/database/package-lock.json`. Neither changes the root
Angular dependencies.

## 4. Check schema and generate migration SQL

```powershell
deno task --cwd apps/api check:db
npm run db:generate --prefix infrastructure/database
```

Review the generated SQL under `infrastructure/database/migrations/` before
applying it. Generated SQL is versioned source; no schema is applied by
generation.

## 5. Apply only to an explicitly configured development database

Confirm `apps/api/.env` contains a disposable development
`MIGRATION_DATABASE_URL`, then
run:

```powershell
npm run db:migrate --prefix infrastructure/database
```

The package's `db:migrate` script always runs `db:generate` before applying
pending migrations. Generate and review the SQL before invoking `db:migrate`;
the script regenerates once more as a guard against applying schema changes
without a corresponding generated migration. It reads `apps/api/.env` for the
database URL. This is an explicit development migration operation. Never run
this command with a production connection string without a separately approved
release procedure, reviewed backup, and accountable operator.

For the event CMS migration, run the read-only target preflight first and verify
the table after applying:

```powershell
deno task --cwd apps/api cms:migration:preflight
npm run db:migrate --prefix infrastructure/database
deno task --cwd apps/api cms:migration:verify
```

The preflight connects using `MIGRATION_DATABASE_URL` and confirms the event
table is absent before migration; verification confirms it exists afterward.

## 6. Verify connectivity without changing data

```powershell
deno task --cwd apps/api db:smoke
```

The smoke check executes `SELECT 1` and reports success/failure without printing
the connection URL. The Neon npm driver's Node compatibility layer reads
`USERNAME` and checks `NODE_PG_FORCE_NATIVE` during initialization; the task
grants access only to those variables plus `DATABASE_URL`. It does not create,
update, or delete database records.

## 7. Migration operating rules

- API startup never applies migrations.
- Use the `infrastructure/database` `db:generate` script to produce SQL from
  reviewed schema changes.
- Use `db:migrate` to apply migrations; it runs `db:generate` first. Do not
  invoke Drizzle Kit's migrate command directly or use `db:migrate:apply`.
- Never use `drizzle-kit push` or `db:push`. The `db:push` package script is
  intentionally blocked.
- Review every generated SQL diff, especially `DROP`, `ALTER`, indexes,
  defaults, and foreign-key delete behavior.
- Apply only to disposable development first; test from a clean database and
  verify the migration ledger.
- Prefer forward-fix migrations over destructive rollback. Document recovery
  before production.
- Keep migration credentials separate from the runtime account. Do not grant
  DDL to normal API runtime credentials.
- No production data import, external Supabase project operation, or service
  cutover is part of this guide. Keep the source project available until the
  authorized export, identity mapping, acceptance, and rollback gates pass.
- Production static builds require `ASTECAA_API_URL`; the root build writes
  that public API origin to the published `api-config.js`. Never put backend
  credentials in this value or in frontend build variables.
