# ASTEC Architecture Approval Checklist

**Review date:** 2026-11-04
**Review result:** Phase 5 is approved to begin with the isolated Neon
development database foundation. This is not approval for production database
changes, authentication, deployment, production data migration, or Supabase
decommissioning.

## 1. Cross-document consistency review

| Area | Finding / resolution | Gate |
|---|---|---|
| Application boundaries | Website/admin remain separate Angular apps; API is the only future persistence boundary. | Accepted |
| Neon and Drizzle | Neon HTTP is chosen for the initial connection probe and simple statements. Interactive transaction requirements are explicitly not covered by this connection foundation. | Implement foundation; re-evaluate driver before transaction-dependent features |
| Deno compatibility | Deno npm compatibility and Neon’s serverless npm driver provide a documented local-runtime path. Drizzle publishes Neon adapters, but the complete Deno + Drizzle Kit toolchain is not explicitly certified in the reviewed docs and must be checked locally. | Run Deno type/check and package tests before using the DB module |
| Migration tooling | Drizzle Kit is a development/release CLI, separate from the Deno request runtime. Generate reviewed SQL; do not auto-push schema or run migrations at API startup. | Use the dedicated migration URL and explicit command |
| Better Auth | PostgreSQL is supported, but no first-party Angular or Deno integration was found in the reviewed docs. Provider, Deno handler, MFA, cookies/CSRF, and migration behavior remain unverified. | Deferred to Phase 6 proof of concept; not included in Phase 5 code/schema |
| User identity model | A single `app_users.auth_subject` was insufficient to scope subjects by issuer or support safely linked identities. Replaced with `auth_identities(issuer, subject)` mapping to an app principal. | Provider-neutral schema included in initial DB migration |
| Deployment | Neon’s Deno guide marks its `deployctl`/Deno Deploy Classic instructions deprecated. No host is selected in this blueprint. | Select and verify hosting before deployment work; do not use the deprecated path |
| Background jobs | PostgreSQL outbox is compatible with the target design, but queue/worker hosting is independent and unselected. | Select worker/scheduler before email or other asynchronous integrations |
| Storage and email | R2 and email remain adapter-level proposals; neither provider is selected or configured. | Deferred to their implementation milestones |
| Demo/production data | Static fixtures and in-memory UI records are not production data. | No fixture or Supabase data is imported in Phase 5 |
| Existing Supabase | Current app and API Supabase integrations remain intact. | Do not remove SDK, config, endpoints, or services in this phase |

## 2. Compatibility evidence

Evidence checked against official documentation on 2026-11-04:

- Deno documents npm package compatibility and local dependency installation:
  [Deno Node/npm compatibility](https://docs.deno.com/runtime/fundamentals/node/).
- Neon documents its `@neondatabase/serverless` npm driver and HTTP/WebSocket
  connection modes. HTTP is for single queries and known, non-interactive
  transactions; WebSockets are required for interactive transactions/sessions:
  [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver).
- Neon has a Deno integration guide for local Deno runtime use, but it warns
  that its Deno Deploy Classic/`deployctl` instructions are deprecated:
  [Neon Deno guide](https://neon.com/docs/guides/deno).
- Drizzle documents Neon HTTP and WebSocket drivers:
  [Drizzle with Neon](https://orm.drizzle.team/docs/connect-neon).
- Drizzle Kit documents SQL migration generation and application:
  [Drizzle Kit overview](https://orm.drizzle.team/docs/kit-overview) and
  [migration fundamentals](https://orm.drizzle.team/docs/migrations).
- Better Auth documents PostgreSQL adapters and cookie-based sessions, but the
  reviewed documentation did not establish first-party Deno or Angular
  integration:
  [PostgreSQL adapter](https://www.better-auth.com/docs/adapters/postgresql),
  [session management](https://www.better-auth.com/docs/concepts/session-management).

Repository validation environment at review: Node.js and npm are available.
Deno 2.9.6 was run through an isolated npm-exec invocation (not installed
globally); database module type-check and local constructor tests pass. No
Neon development credentials were supplied, so a live connection or migration
application cannot be claimed.

The API workspace was audited after pinning its migration-tool dependencies;
`npm audit --prefix apps/api` reported zero vulnerabilities. The Drizzle Kit
transitive esbuild version is pinned to a patched release through an npm
override, and migration generation/checks pass with that override.

## 3. Phase 5 scope approval

The initial implementation is limited to:

- Deno-side Neon HTTP client construction and a safe `SELECT 1` connectivity
  probe.
- A provider-neutral initial identity/RBAC schema: `app_users`,
  `auth_identities`, `roles`, `permissions`, `user_roles`,
  `role_permissions`.
- Drizzle Kit config and a generated SQL migration for that schema.
- Separate runtime and migration connection variables.
- Documentation and safe environment placeholders.

It does **not** include authentication provider tables/flows, role seed data,
CMS or other feature tables, an API endpoint, data migration, Neon project
provisioning, or applying the migration to any remote database.

## 4. Security and operational checklist

- [ ] Keep runtime `DATABASE_URL` server-side and use a Neon pooled connection
  string for the serverless HTTP client when Neon provides one.
- [ ] Keep `MIGRATION_DATABASE_URL` separate, least-privileged, and direct
  (non-pooled) for DDL/migration tooling.
- [ ] Require TLS in connection URLs; never log URLs or connection errors'
  arbitrary messages.
- [ ] Use independent development/staging/production Neon projects or branches
  and credentials; no production URL in local examples.
- [ ] Apply reviewed migrations explicitly; never run destructive schema push
  against a shared or production database.
- [ ] Define backup/restore and migration rollback or forward-fix policy before
  production.
- [ ] Validate that neither Angular bundle references DB credentials.
- [ ] Preserve Supabase runtime paths and data during this phase.
- [ ] The repository currently has a tracked `.env` according to git status.
  `.gitignore` cannot untrack an existing file; do not include it in commits or
  reports. The owner should assess its contents privately, remove it from
  version control/history through an approved process, and rotate any real
  credentials if they were committed.

## 5. Decision record

**Approved for this phase:** Deno remains the API runtime candidate; Neon
PostgreSQL remains the target; Drizzle ORM and Drizzle Kit are used for the
database foundation and generated SQL migration. Neon HTTP is restricted to
connectivity checks and independent statements in this milestone.

**Still conditional:** the production hosting platform, interactive-transaction
driver, Better Auth (or OIDC alternative), email provider, storage provider,
and production schema/data mapping.

No live database operation was performed in this review. A development
migration may be applied only to an explicitly configured disposable Neon
branch using the documented command. Production database changes remain
outside Phase 5 approval.
