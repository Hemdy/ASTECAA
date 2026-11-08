# ASTECAA API

The ASTECAA API is a modular Node.js service built with NestJS, Drizzle ORM, and Neon PostgreSQL.
Better Auth manages browser authentication sessions under `/api/auth/*`; CMS endpoints use Neon PostgreSQL for public reads and role-checked admin operations.

## Local Development

Configure `.env` in the repository root:
```bash
# Required environment variables
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<NEON-POOLER-HOST>/<DATABASE>?sslmode=require"
MIGRATION_DATABASE_URL="postgresql://<MIGRATION_USER>:<PASSWORD>@<NEON-DIRECT-HOST>/<DATABASE>?sslmode=require"
BETTER_AUTH_SECRET="your-random-secret-key-of-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:8000"
ALLOWED_ORIGINS="http://localhost:4200,http://localhost:4300"
APP_ENV="development"
ASTEC_API_PORT=8000
ASTEC_API_HOST=127.0.0.1
```

Run development commands from the repository root:
```bash
# Start API in watch mode
pnpm run start:api

# Run smoke test against Neon
pnpm --filter @astec/api test

# Build API for production
pnpm run build:api
```

## Production Deployment

Start the compiled service:
```bash
node apps/api/dist/main.js
```

## Database Changes

Drizzle schema definitions and migrations live under `infrastructure/database`.
- Edit schema in `infrastructure/database/schema.ts`
- Generate migrations: `pnpm run db:generate`
- Review SQL in `infrastructure/database/migrations/versions/`
- Apply migrations: `pnpm run db:migrate`

Never use `db:push`.
