# ASTECAA

ASTECAA is organized as a pnpm monorepo with independent Angular website and admin
applications, a clean Node.js API using Neon PostgreSQL and Drizzle ORM, and shared TypeScript packages.

## Applications

- `apps/website` — public website (`pnpm run start:website`)
- `apps/admin` — admin dashboard (`pnpm run start:admin`; browse to `/admin`)
- `apps/api` — Node.js REST API with Better Auth and Neon PostgreSQL (`pnpm run start:api`)

## Shared Packages and Infrastructure

- `packages/ui` — Angular UI shared by applications
- `packages/api-client` — shared browser-side data access
- `packages/types` — shared domain types
- `packages/validation` — shared validation primitives
- `packages/config` — shared API URL configuration
- `infrastructure/database` — Drizzle ORM schema and migrations for Neon PostgreSQL
- `infrastructure/deployment` — deployment guides and operational documentation
- `docs` — architecture notes and technical decisions

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   # Add your Neon connection strings and auth secrets
   ```
3. Run the development servers:
   ```bash
   # In terminal 1: Start API
   pnpm run start:api

   # In terminal 2: Start Website
   pnpm run start:website

   # In terminal 3: Start Admin (optional)
   pnpm run start:admin
   ```

## Building for Production

Build all packages, applications, and API:
```bash
# Set production API URL for the frontend bundle:
export ASTECAA_API_URL="https://api.astecaa.org"

# Build frontends and API:
pnpm run build
pnpm run build:api
```

The website output is written to `dist/astecaa/browser`; the admin app is written under its `/admin` subdirectory.
The API output is compiled to `apps/api/dist`.

## Database Management (Neon & Drizzle ORM)

Schema definitions and migrations live in `infrastructure/database`.

> **CRITICAL RULE**: **NEVER USE `push` / `db:push` WITH NEON.** Always use version-controlled migrations to prevent schema drift and protect Neon database branches.

- **Generate migrations**: `pnpm run db:generate` (creates versioned `.sql` under `migrations/versions/`)
- **Review schema integrity**: `pnpm run db:check`
- **Apply migrations**: `pnpm run db:migrate` (applies pending migrations to Neon using `MIGRATION_DATABASE_URL`)
