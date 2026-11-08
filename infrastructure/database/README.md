# Database infrastructure

The target database is Neon PostgreSQL. Drizzle schema definitions live in
`schema.ts` and `auth-schema.ts`; reviewed, generated SQL migrations live in `migrations/versions/`.
Drizzle Kit and its configuration are isolated in this package, separately
from the NestJS API runtime dependencies.

## Migration Policy

> [!CAUTION]
> **NEVER USE `drizzle-kit push` OR `db:push` WITH NEON.**
> `drizzle-kit push` bypasses version-controlled migration files and attempts direct, unmonitored schema mutation on the live database. In a team or production environment with Neon database branching and pooling, `push` causes unrecoverable schema drift, destroys the `__drizzle_migrations` ledger, risks accidental data loss, and prevents rollbacks. The `db:push` script is hard-disabled across all packages.

### Approved Migration Workflow

For every database change:

1. **Update Drizzle Schema**: Modify `schema.ts` or `auth-schema.ts`.
2. **Generate Migration SQL**:
   ```bash
   pnpm run db:generate
   ```
   Drizzle Kit analyzes schema differences against `migrations/versions/meta` and produces a versioned SQL file in `migrations/versions/`.
3. **Review Generated SQL**: Inspect the SQL diff in Git to confirm safety, indexes, constraints, and backwards compatibility.
4. **Apply Migrations**:
   ```bash
   pnpm run db:migrate
   ```
   This automatically verifies the schema state and applies pending migrations using `MIGRATION_DATABASE_URL` (direct unpooled connection) via the `@neondatabase/serverless` driver.

5. **Verify Integrity**:
   ```bash
   pnpm run db:check
   ```

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
