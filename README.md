# ASTECAA

ASTECAA is an alumni community and archive platform organized as a high-performance `pnpm` monorepo. It features independent Angular frontend applications for both public alumni members and administrators, a NestJS REST API with Neon PostgreSQL and Drizzle ORM, Cloudflare R2 object storage, and shared TypeScript libraries.

---

## Architecture Overview

```
ASTECAA/
├── apps/
│   ├── website/             # Public Angular application (events, timeline, gallery, community wall, voting)
│   ├── admin/               # Administrative CMS & portal (/admin)
│   └── api/                 # NestJS REST backend (auth, RBAC, events, CMS, Cloudflare R2 storage)
├── infrastructure/
│   └── database/            # Drizzle ORM schema, Neon connection, versioned migrations
├── packages/
│   ├── types/               # Shared domain interfaces & contracts
│   ├── api-client/          # Shared browser-side services (Auth, Events, CMS, Voting, Users)
│   ├── config/              # Dynamic URL configuration & environment resolution
│   ├── ui/                  # Shared Angular UI directives, toast, notifications
│   └── validation/          # Shared validation schemas & utilities
└── scripts/                 # Development and build tooling
```

---

## Applications

- **Website (`apps/website`)**: Public-facing platform for alumni. Includes dynamic Events, interactive Timeline, archival Gallery, Community Wall with real-time posting and likes, and secure alumni voting ballots.
- **Admin Console (`apps/admin`)**: Granular RBAC-protected management console for Super Admins and managers (Events, Gallery, Media Library, Community Stories, Announcements, Moderation, and Homepage Settings).
- **Backend API (`apps/api`)**: Modular NestJS service backed by Neon serverless PostgreSQL, Better Auth sessions, and Cloudflare R2 storage.

---

## Design System & Typography

- **Typography**: Clean, contemporary typography using **Plus Jakarta Sans** for headlines/display and **Inter** for body text, configured with modern CSS font-stack fallbacks (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Iconography**: Standardized on **Remix Icons** (`remixicon`) across the entire website and administrative dashboard, replacing emoji glyphs with consistent, high-fidelity vector icons (`ri-*`).
- **Color Palette**: Retains the association's warm heritage aesthetic: Parchment cream (`#f8f3e8`), Deep Ink (`#3a2a20`), Gilded Gold (`#c49a45`), Wax Seal Burgundy (`#7a3e3e`), and Forest Green (`#5b6d5b`).

---

## Cloudflare R2 & Media Storage

The platform integrates **Cloudflare R2** (S3-compatible object storage) for fast, globally-distributed media storage with zero egress fees:
- Direct upload support from the user's filesystem (`<input type="file">` and drag-and-drop) in Gallery, Media Library, Event creation, and Community Stories.
- **Graceful Local Fallback**: If R2 environment variables are omitted in local development, uploads seamlessly fall back to local disk storage (`uploads/`) served statically at `/uploads/*`.

### R2 Environment Variables (`.env`)
```bash
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="astecaa-media"
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev" # or custom domain https://media.astecaa.org
```

---

## Database Management (Neon PostgreSQL & Drizzle ORM)

All database schema definitions and migration journals are located in `infrastructure/database`.

> ⚠️ **CRITICAL RULE**: **NEVER USE `db:push` or `drizzle-kit push` WITH NEON.** Always use version-controlled SQL migrations to protect Neon branches and prevent schema drift.

- **Generate migrations**: `pnpm run db:generate` (creates versioned SQL under `migrations/versions/`)
- **Verify schema integrity**: `pnpm run db:check`
- **Apply migrations**: `pnpm run db:migrate` (executes pending migrations against Neon using `MIGRATION_DATABASE_URL`)

---

## Local Development Setup

1. **Install dependencies** (use `pnpm` exclusively):
   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Ensure DATABASE_URL and MIGRATION_DATABASE_URL point to your Neon database
   ```

3. **Run database migrations**:
   ```bash
   pnpm run db:migrate
   ```

4. **Launch development servers**:
   ```bash
   # Terminal 1 — Backend API (port 8000)
   pnpm run start:api

   # Terminal 2 — Public Website (port 4200)
   pnpm run start:website

   # Terminal 3 — Admin Dashboard (port 4300, browse to /admin)
   pnpm run start:admin
   ```

---

## Building for Production

```bash
# Set production API URL for the frontend bundle:
export ASTECAA_API_URL="https://api.astecaa.org"

# Build all Angular applications and shared assets:
pnpm run build

# Build NestJS API backend:
pnpm run build:api
```

- Public website output is written to `dist/astecaa/browser`.
- Admin console bundle is located at `dist/astecaa/browser/admin`.
- API server builds to `apps/api/dist/main.js`.
