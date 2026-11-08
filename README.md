# ASTECAA

ASTECAA is organized as a monorepo with independent Angular website and admin
applications, a Deno API using Neon PostgreSQL, and shared TypeScript packages.

## Applications

- `apps/website` — public website (`npm run start:website`)
- `apps/admin` — admin dashboard (`npm run start:admin`; browse to `/admin`)
- `apps/api` — independent Deno API with Better Auth and Neon; see its README

## Shared packages and infrastructure

- `packages/ui` — Angular UI shared by applications
- `packages/api-client` — shared browser-side data access
- `packages/types` — shared domain types
- `packages/validation` — shared validation primitives
- `packages/config` — shared API URL configuration
- `infrastructure/database` — database migration/configuration location
- `infrastructure/deployment` — deployment notes; root `netlify.toml` is used by Netlify
- `docs` — architecture notes and decisions

Run `npm run build` to build both Angular apps for the combined static
deployment. Set the non-secret `ASTECAA_API_URL` environment variable to the
API's HTTPS origin before building the deployment bundle. Local development
continues to use `http://localhost:8000` automatically.
The website output is written to `dist/astecaa/browser`; the admin app is written
under its `/admin` subdirectory.

Events are the first Neon-backed CMS slice. Most other CMS data and the election
service still contain local demo state. Authentication account migration,
registration, password recovery, media storage, and production cutover are
incomplete; do not treat the repository as a completed Supabase migration.
