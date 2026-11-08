# Deployment

ASTECAA is deployed as two artifacts:
1. Static Angular frontend bundle (`apps/website` and `apps/admin`).
2. Node.js API service (`apps/api`) running on Neon PostgreSQL with Drizzle ORM and Better Auth.

## Static Frontend Deployment

Run `pnpm run build` to build both Angular applications and write the runtime configuration:
- The website application is output to `dist/astecaa/browser`.
- The admin dashboard application is output under `/admin` (`dist/astecaa/browser/admin`).

Before building for production, set the non-secret `ASTECAA_API_URL` environment variable to the API's HTTPS origin:
```bash
export ASTECAA_API_URL="https://api.astecaa.org"
pnpm run build
```
The build process invokes `scripts/write-api-config.mjs`, which generates `api-config.js` in the output bundle and configures `globalThis.__ASTECAA_API_URL__`.

Configure your static web host (such as Cloudflare Pages, Vercel, AWS S3/CloudFront) with standard single-page app (SPA) rewrite rules:
- `/admin/*` -> `/admin/index.html`
- `/*` -> `/index.html`

## API Deployment

The API is a standard Node.js application built with TypeScript and NestJS. It can be hosted on any Node 22+ runtime (such as Railway, Fly.io, AWS ECS, or Google Cloud Run).

### Build & Run

```bash
pnpm --filter @astec/api build
pnpm --filter @astec/api start
```

### Required Environment Variables

Set the following secrets in your hosting provider's environment/secret manager:
- `DATABASE_URL`: Neon pooled PostgreSQL connection string (with `sslmode=require`).
- `BETTER_AUTH_SECRET`: Random secret of at least 32 characters for session signing.
- `BETTER_AUTH_URL`: Canonical public URL of the API (e.g. `https://api.astecaa.org`).
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend origins (e.g. `https://astecaa.org,https://www.astecaa.org`).
- `APP_ENV`: Set to `production`.
- `ASTEC_API_PORT` or `PORT`: HTTP port to bind (default: `8000`).
- `ASTEC_API_HOST`: Network interface to bind (default: `0.0.0.0` in production).

### Health & Readiness Probes

- Liveness probe: `GET /health` (returns `{ status: "ok" }`).
- Readiness probe: `GET /ready` (executes `SELECT 1` on Neon PostgreSQL; returns `{ status: "ready" }`).

## Database Migrations

Drizzle schema definitions and migrations live in `infrastructure/database`. Run migrations against the target Neon database branch using `MIGRATION_DATABASE_URL`:
```bash
pnpm --filter @astec/database db:migrate
```
Migrations are never executed on API process startup.
