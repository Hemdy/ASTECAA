# ASTEC Infrastructure Implementation Milestones

Milestones are ordered and independently verifiable. The Neon development
foundation and event CMS vertical slice are implemented. The Better Auth
browser/API integration is in progress; existing account migration, member
registration, password recovery, storage, and remaining CMS/API features are
not complete. The external Supabase project has not been modified.

## 1. Neon database connection

**Scope:** Deno API database factory using Neon HTTP; no feature endpoints.

Acceptance:

- Pinned Neon/Drizzle dependencies install in the API workspace.
- Deno type-check passes for database module and smoke script.
- Missing/malformed `DATABASE_URL` fails explicitly without printing values.
- `SELECT 1` succeeds on an authorized disposable development Neon branch.
- Connection failures return non-zero and logs do not reveal URL/token contents.
- Browser builds pass. Deno was not available in the latest validation
  environment, so re-run API checks before release.

**Current status:** Deno 2.9.6 checks and the live Neon database smoke check
pass against the configured development project.

## 2. Database schema and migrations

**Scope:** Principal/identity/RBAC tables and the first `events` CMS table.

Acceptance:

- Schema defines `app_users`, `auth_identities`, `roles`, `permissions`,
  `user_roles`, and `role_permissions` with the reviewed keys and constraints.
- Drizzle Kit generates a reviewed SQL migration under
  `infrastructure/database/migrations/versions/`.
- Reviewed SQL is generated and applied through `db:migrate`; a second
  invocation is safe/no-op. `db:push` is explicitly forbidden.
- No demo/production rows are seeded.
- Migration URL is separate from runtime URL and is not included in client code.
- Destructive migration review and backup/forward-fix plan are documented.

**Current status:** Development migrations are applied and verified on Neon.
The events table is empty; no fixtures or production rows were imported.

## 3. Event CMS vertical slice

**Scope:** Admin event CRUD over the API, Neon persistence, and public published
event reads for homepage, event listing, and event detail pages.

Acceptance:

- Admin CRUD requires a verified active admin; public reads return published
  events only.
- Event input is validated in the API and constrained by database checks.
- Admin writes persist in Neon; public page reads use the API, not event
  fixtures.
- API, admin, website, and schema checks pass. No `db:push` is used.

**Current status:** Implemented on the Neon development database. Admin API
authorization uses Better Auth sessions and Neon role assignments. No
provisioned admin identity is verified yet.

## 4. Authentication integration

**In progress.** Better Auth is configured against Neon, browser login/session
calls are routed through the standalone API, and admin API authorization checks
Neon identity and role records. Public signup and password recovery remain
disabled until email delivery and safe role provisioning are implemented.
Existing Supabase accounts have not been mapped into Neon.

Acceptance still requires: Deno checks, synthetic sign-in/out and session
tests, email verification/reset, session expiry/revocation, CSRF/CORS, admin
MFA/recovery, issuer/subject mapping, and denied authorization tests on the
selected host.

## 5. User and role management

**In progress.** Neon identity/role authorization protects event management.
General user management, role assignment/provisioning routes, and audit
records remain deferred.

Acceptance: API-only create/read/update/disable and role assignment; least
privilege, audit records, ownership checks, concurrency and negative
authorization tests pass. No role data is seeded from UI fixtures.

## 6. Backend API foundation

**In progress.** The standalone Deno API provides Better Auth endpoints, a
current-identity endpoint, and event routes. Other feature modules, OpenAPI,
rate limits, and production observability remain deferred.

Acceptance: `/api/v1` routing, OpenAPI, request IDs, schema validation,
structured redacted errors, health/readiness, CORS, rate limits, database
transactions as required, and HTTP contract tests pass.

## 7. File storage integration

**Deferred; provider decision required.**

Acceptance: private staging upload, short-lived scoped grant, API-side metadata
verification, MIME/size limits, ownership/authorization, public/private
delivery, delete retry, and provider error tests pass with synthetic files.

## 8. Email integration

**Deferred; provider/domain decision required.**

Acceptance: verified sender, safe templates, outbox atomicity, retry and
idempotency behavior, bounce/failure handling, no sensitive log exposure, and
synthetic recipient tests pass.

## 9. API documentation and testing

**Deferred until API features exist.**

Acceptance: OpenAPI accurately describes supported endpoints/auth/errors;
unit, migration, repository, authorization, HTTP contract, integration, and
failure-path tests pass; runbooks and monitoring are approved.
