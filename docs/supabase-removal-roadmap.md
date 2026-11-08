# Supabase Removal Roadmap

**Status:** The browser Supabase SDK and legacy Edge Function scaffold have
been removed from application source. No Supabase connection, data, account,
file, or deployment was migrated or changed; the external project remains
untouched. This code cleanup does not satisfy migration or decommissioning
acceptance gates.

## 1. Guardrails

- The existing Supabase project remains available and untouched as the source
  for authorized data/account discovery and migration.
- Runtime removal happened before data/account migration completed. Do not
  deploy this state as a production cutover: existing source accounts have no
  guaranteed Neon identity or administrator role, and member registration and
  password recovery are unavailable.
- Live schema, rows, policies, Auth configuration, buckets, and deployed
  functions were not verified in the repository audit. Obtain authorized
  read-only discovery and record evidence before mapping.
- Current content, CMS, users, contacts, newsletter, registration, community,
  and voting fixtures/memory are not verified production data. Exclude them
  from production imports unless owners identify and approve source-of-truth
  records.
- Never assume password hashes are migratable. Never match identity solely by
  unverified email. Preserve a controlled mapping of old subject to new
  principal.
- Rollback must preserve write integrity. Define a cutover/write-freeze or
  verified dual-write/reconciliation strategy before production traffic moves.

## 2. Phase sequence

| Phase | Deliverable and exit criteria | Dependencies / safeguards |
|---|---|---|
| **4 — Approved independent architecture and database blueprint** | Approve target system boundaries, Deno/Neon/Drizzle spike plan, schema, auth provider, storage adapter, email/job approach, permission model, privacy/retention, migration gates and ownership. | Current documents are proposals only. No implementation authorized until explicit approval. |
| **5 — Neon development database and migrations** | Create isolated development Neon DB; prove Deno/Drizzle driver and migration tooling; apply reviewed baseline migrations; test rollback/forward-fix and backup/restore; seed only deterministic reference/development fixtures. | Must not touch Supabase. Do not place sample/demo content or real user data in production. |
| **6 — Independent authentication** | Complete Better Auth Deno proof of concept or select Keycloak fallback; implement verified login, logout, signup/verification, recovery, session lifecycle, admin MFA, identity mapping and audit flows. | Synthetic users first. Define old/new subject mapping and reset/re-enrollment; no assumed password import. |
| **7 — Backend API and authorization** | Implement `/api/v1` modules, validation, repositories, services, capability enforcement, error handling, logging, transactions and OpenAPI. Test against Neon. | API server-side authz is mandatory; Angular guards are not security controls. |
| **8 — File storage and email services** | Implement provider-neutral storage and mail adapters, secure upload/download flow, object metadata, quarantine, outbox and worker/scheduler. | R2/email credentials remain server-side; synthetic assets and recipient tests; define retention. |
| **9 — CMS connected to persistent data** | Connect admin content pages, events, stories, media, settings, roles and moderation to API; publishing becomes durable and audited. | Reconcile mock UI roles with approved permissions; seed only intentionally curated content. |
| **10 — Public website connected to API** | Replace fixture-backed public data where approved; connect registration, contact, newsletter and community forms; explicit failure states and SEO/cache behavior. | Preserve static content until API sources are acceptance-tested. No false success toasts. |
| **11 — Supabase data and account migration** | Authorized schema/data export, transformation, import, identity mapping, object copy, row/object reconciliation, pilot and controlled cutover. | Freeze source/dual-write design, consent/retention, mapping review, verified production labels and rollback rehearsal. |
| **12 — Security testing and Supabase decommissioning** | Independent security/acceptance tests, production monitoring, rollback window, sign-off, then decommission only approved external Supabase services. | Runtime SDK/scaffold cleanup is already present in source but is not a cutover. All data/account migration and acceptance criteria must pass; backups and retention obligations must be documented; owner explicitly authorizes external decommissioning. |

## 3. Discovery and inventory before migration

With authorized credentials and least-privilege read access, separately inventory:

1. PostgreSQL schemas, tables, columns/types, primary/foreign keys, unique/check
   constraints, indexes, sequences, views, extensions, triggers and functions.
2. RLS enablement, policies, grants, ownership, service-role access paths and
   any SQL RPC usage.
3. Auth users, identities/providers, verification status, MFA, configuration,
   session and reset behavior, rate limits, and exportable account identifiers.
4. Storage buckets, object paths, metadata, policies, public access, signed URL
   dependencies, size/checksum and references from records.
5. Edge Function code/deployments, secrets names (never values), schedules,
   logs, external calls and production traffic.
6. Realtime publications/subscriptions and actual application usage.
7. Data classification, ownership, consent, retention, legal holds, volume,
   data quality, duplicates and authoritative source for each entity.

Record timestamp, project identity, tool/version, scope, and evidence status.
Do not include secret values in reports or commit exports. Snapshot and protect
the source before any approved migration operations.

## 4. Migration mechanics

### Database

- Map verified source columns and relationships to approved target migrations;
  do not infer live constraints from TypeScript.
- Export a consistent snapshot; transform dates/timezones, enums, IDs and
  ownership through versioned, repeatable scripts.
- Use explicit ID mapping where provider IDs cannot be retained. Preserve
  mapping provenance and restrict access.
- Load parent records before dependents, then verify row counts, nulls,
  duplicate keys, FK orphans, check violations and representative content.
- Compare application-level queries and reports before switching reads.

### Accounts

- Create and test new identity behavior first. Preserve verified identity
  associations and access controls.
- Use provider-supported migration only after hash format/import support is
  independently verified; otherwise use password reset/re-enrollment.
- Pilot by account cohorts. Confirm verification, recovery, admin MFA, lockout,
  role mapping, and support workflow.
- Do not bulk link by email alone or expose mapping exports to frontend code.

### Storage

- Copy verified production objects only; do not treat static fixture assets as
  user uploads by default.
- Preserve access classification and object-to-record references. Validate
  checksums, sizes, content type, access and CDN behavior.
- Keep source objects available during the rollback period; delete only under
  explicit retention/decommission approval.

### API and Angular cutover

- Implement replacements behind typed clients and environment-controlled
  endpoints. Keep provider-specific calls out of Angular components.
- Run old and new systems in a controlled parallel test where writes are
  disabled or an approved reconciliation process exists. Do not improvise
  dual-write.
- Cut traffic by a defined cohort or maintenance window. Record start/end,
  rollback trigger, source write policy, and accountable approver.

## 5. Acceptance checklist before decommission

- Every production dataset has a verified owner, classification, target mapping,
  count/reconciliation evidence, retention decision and acceptance sign-off.
- Website/admin user journeys pass end-to-end against the new API and Neon:
  sign-in/out/reset/verification, permissions, content publishing, media,
  events, contact, newsletter and any approved community/voting functions.
- No unauthorized access, cross-account data exposure, CSRF bypass, unsafe
  upload, privilege escalation, or sensitive logging issue remains unresolved.
- Identity mapping and recovery have been tested with a pilot; admin MFA and
  emergency access/recovery are operational.
- Object counts/checksums and public/private authorization are verified.
- Database backups and restore are rehearsed; migrations are reversible or have
  an approved forward-fix plan.
- Monitoring, alerts, incident ownership, key rotation and provider support
  contacts are in place.
- Rollback is rehearsed and the old system can be restored without losing
  writes or violating the chosen consistency model.
- Legal/retention obligations for Supabase data, backups, logs, and accounts
  have been reviewed.
- Product and technical owners explicitly approve decommission.

Only after all items pass should the team remove Supabase SDK/config and
deployment dependencies from the applications/API, archive required evidence,
and decommission database, authentication, storage and Edge Functions
separately according to provider procedures. A package reference disappearing
from `package.json` is not proof that all runtime paths have been replaced.

## 6. Rollback principles

- Define objective triggers (auth failure rate, data mismatch, API error rate,
  media access failures, job backlog) and a decision owner before cutover.
- Keep the source readable and operational for the agreed window.
- For writes, select one authoritative writer at any time unless a tested
  reconciliation system exists. Reconcile or replay writes before switching
  back.
- Preserve migration maps, source snapshots, audit evidence and object copies
  under approved access/retention controls.
- Never roll back by deleting the target or resetting production data without
  an explicit approved recovery plan.

## 7. Dependencies and decision log

Critical prerequisites:

1. Approve this architecture and database proposal (Phase 4).
2. Complete Deno + Neon + Drizzle + auth compatibility spike.
3. Confirm product rules: canonical roles, content workflows, account identity,
   registration and form retention, media privacy, and election requirements.
4. Obtain authorized Supabase discovery and label production data.
5. Approve migration, rollback, security and acceptance owners.

This document does not approve data extraction, schema creation, authentication
replacement, storage copying, production cutover, or Supabase shutdown.
