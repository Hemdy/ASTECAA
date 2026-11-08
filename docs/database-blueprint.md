# ASTEC Database Blueprint

**Status:** Initial identity/RBAC and event CMS migrations have been applied to
the development Neon database. Other tables below remain a proposed logical
schema and have not been migrated.
**Database target:** Neon PostgreSQL. **ORM candidate:** Drizzle.
**Approval gate:** Confirm product semantics, live source data, privacy, and
identity mapping before creating migrations.

## 1. Design principles

- PostgreSQL is the source of truth for ASTEC-owned application data.
- Use server-generated UUIDs for application entities; `timestamptz` for
  instants, `date` for date-only values, `text` for user-facing text, and
  explicit `boolean` and integer values.
- Keep identity-provider credentials/session internals under the chosen
  provider's schema ownership. Map its opaque subject to `app_users`; never
  treat an email address as a durable identity key.
- Use normalized tables and foreign keys for relationships. Use `jsonb` only
  for explicitly versioned flexible settings, not as a substitute for core
  relational structure.
- Store files in object storage; store metadata and object keys in PostgreSQL.
- Derive counters such as view, comment, attendee and like totals from canonical
  rows or a separately designed event/aggregation mechanism. Do not import
  fixture counters as facts.
- Never promote hard-coded demo fixtures to production records.
- Keep schema migrations separate from application repositories and business
  logic.

## 2. Evidence and scope

The source inventory in [data-architecture-audit.md](./data-architecture-audit.md)
shows browser-authenticated access to `members` and `profiles`, with actual
live schema, data, constraints, policies, and production status unverified.
The inventory also found fixture-backed events, stories, gallery/community
content, admin roles, forms, and voting. The proposal below represents
candidate product entities, not verified production rows.

Projects, services, and publications are not established data entities in the
audited source. Do not add them without confirmed requirements and provenance.

## 3. Identity and access control

Identity-provider tables are provider-managed. The exact fields/schema must be
generated and reviewed against the selected Better Auth version or the
alternative OIDC provider; do not hand-create a partial imitation of provider
tables.

| Table | Proposed columns and constraints |
|---|---|
| `app_users` | `id uuid PK`; `email text NOT NULL`; `email_normalized text NOT NULL`; `full_name text`; `phone text`; `status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending','disabled'))`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Index `email_normalized` uniquely only if one-account-per-email policy is approved. This is the application principal, not the identity provider's user table. |
| `auth_identities` | `id uuid PK`; `user_id uuid NOT NULL FK -> app_users.id`; `issuer text NOT NULL`; `subject text NOT NULL`; `email_verified boolean NOT NULL DEFAULT false`; timestamps; `UNIQUE (issuer, subject)`. Keep provider subject opaque. Link multiple identities to one user only through a verified account-linking workflow. |
| `member_profiles` | `user_id uuid PK FK -> app_users.id ON DELETE CASCADE`; `graduation_year smallint`; `graduation_set text`; `created_at`, `updated_at timestamptz NOT NULL`. Do not duplicate profile email/name/phone unless history or domain rules require it. |
| `roles` | `id uuid PK`; `code text NOT NULL UNIQUE`; `name text NOT NULL`; `description text`; `system_managed boolean NOT NULL DEFAULT false`; timestamps. |
| `permissions` | `id uuid PK`; `code text NOT NULL UNIQUE`; `description text NOT NULL`; `created_at timestamptz NOT NULL`. Stable permission codes are API capabilities, not UI labels. |
| `user_roles` | `user_id uuid FK -> app_users`; `role_id uuid FK -> roles`; `assigned_by uuid FK -> app_users`; `created_at timestamptz`; composite PK `(user_id, role_id)`. Add scope only if multi-organization tenancy is confirmed. |
| `role_permissions` | `role_id uuid FK -> roles`; `permission_id uuid FK -> permissions`; composite PK `(role_id, permission_id)`. |

Indexes: unique `(issuer, subject)`; the approved email lookup/uniqueness index;
`user_roles(role_id, user_id)` and `role_permissions(permission_id, role_id)`
for reverse authorization lookups. Admin status and role checks are performed
server-side.

The development database contains `app_users`, `auth_identities`, `roles`,
`permissions`, `user_roles`, and `role_permissions` for provider-neutral
principal/RBAC storage, Better Auth provider-managed tables, and the `events`
table described below. It contains no production or demo content rows.
Authentication and remaining feature tables require their corresponding
milestone and product decisions.

## 4. CMS and public content

| Table | Proposed columns and constraints |
|---|---|
| `cms_pages` | `id uuid PK`; `slug text NOT NULL UNIQUE`; `title text NOT NULL`; `status text NOT NULL CHECK (status IN ('draft','review','published','archived'))`; `seo_title text`; `seo_description text`; `published_at timestamptz`; `created_by`, `updated_by uuid FK -> app_users`; timestamps. Index `(status, published_at DESC)` for published pages. |
| `page_sections` | `id uuid PK`; `page_id uuid NOT NULL FK -> cms_pages ON DELETE CASCADE`; `section_type text NOT NULL`; `heading text`; `content text`; `settings jsonb NOT NULL DEFAULT '{}'`; `sort_order integer NOT NULL CHECK (sort_order >= 0)`; timestamps. Index `(page_id, sort_order)`; validate section-type payloads at API boundary. |
| `events` | `id uuid PK`; `slug text NOT NULL UNIQUE`; `title text NOT NULL`; `subtitle text`; `description text`; `long_description text`; `starts_at timestamptz NOT NULL`; `ends_at timestamptz`; `venue text`; `city text`; `category text`; `capacity integer CHECK (capacity IS NULL OR capacity > 0)`; `status text NOT NULL CHECK (status IN ('draft','scheduled','published','archived'))`; `featured boolean NOT NULL DEFAULT false`; nullable poster/banner media FKs; creator/updater user FKs; timestamps. Check `ends_at IS NULL OR ends_at >= starts_at`. Index `(status, starts_at)`, `(featured, starts_at)` only if query patterns need it. |
| `event_schedule_items` | `id uuid PK`; `event_id uuid NOT NULL FK -> events ON DELETE CASCADE`; `starts_at timestamptz`; `title text NOT NULL`; `detail text`; `sort_order integer NOT NULL CHECK (sort_order >= 0)`; timestamps. Index `(event_id, sort_order)`. |
| `event_tags` | `event_id uuid FK -> events ON DELETE CASCADE`; `tag text NOT NULL`; composite PK `(event_id, tag)`; index `(tag, event_id)` only if tag search is required. |
| `event_registrations` | `id uuid PK`; `event_id uuid NOT NULL FK -> events`; nullable `user_id uuid FK -> app_users`; `name text NOT NULL`; `email text NOT NULL`; `phone text`; `graduation_year smallint`; `status text NOT NULL CHECK (status IN ('pending','confirmed','cancelled','attended'))`; `registered_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Index `(event_id, status)` and `(user_id, registered_at DESC)`; duplicate registration and capacity rules require an approved transactional policy before a unique constraint is chosen. |
| `stories` | `id uuid PK`; `slug text NOT NULL UNIQUE`; `title text NOT NULL`; `excerpt text`; `body text NOT NULL`; `author_user_id uuid FK -> app_users`; `author_display_name text`; `category text`; nullable `cover_media_id uuid FK -> media_assets`; `status text NOT NULL CHECK (status IN ('draft','review','published','archived'))`; `published_at timestamptz`; creator/updater FKs; timestamps. Index `(status, published_at DESC)` and `(category, published_at DESC)` when used. |
| `announcements` | `id uuid PK`; `title text NOT NULL`; `body text NOT NULL`; `channel text NOT NULL CHECK (channel IN ('site','email','push'))`; `status text NOT NULL CHECK (status IN ('draft','scheduled','published','archived'))`; `pinned boolean NOT NULL DEFAULT false`; `publish_at timestamptz`; creator/updater FKs; timestamps. Index `(status, publish_at)`. Delivery is tracked separately; publishing does not prove email delivery. |
| `timeline_entries` | `id uuid PK`; `year smallint`; `occurred_on date`; `title text NOT NULL`; `story text NOT NULL`; nullable media FK; `quote text`; `quote_author text`; `sort_order integer NOT NULL`; `status text NOT NULL`; timestamps. Check at least one of `year` or `occurred_on` is supplied; index `(status, sort_order)`. |

### Implemented development event schema

Migration `0003` provides the first event CMS slice. It uses `start_date` and
`end_date` as date-only fields to match the current event editor, keeps bounded
gallery, schedule, and tag values in validated `jsonb`, and stores image URLs
as metadata strings until the media-assets milestone exists. Event ownership,
registration rows, normalized schedules/tags, and media foreign keys remain
future work; do not treat this initial schema as the final normalized target.
The development `events` table has no imported rows.

Status vocabularies should become PostgreSQL enums only after expected
evolution and migration practices are agreed; `text` with checks is proposed
for easier controlled evolution.

## 5. Media and gallery

| Table | Proposed columns and constraints |
|---|---|
| `media_assets` | `id uuid PK`; `provider text NOT NULL`; `bucket text NOT NULL`; `object_key text NOT NULL`; `original_filename text NOT NULL`; `mime_type text NOT NULL`; `byte_size bigint NOT NULL CHECK (byte_size >= 0)`; `checksum text`; `alt_text text`; `caption text`; `visibility text NOT NULL CHECK (visibility IN ('public','private'))`; `status text NOT NULL CHECK (status IN ('pending','available','quarantined','deleted'))`; `uploaded_by uuid FK -> app_users`; timestamps. Unique `(provider, bucket, object_key)`; indexes `(uploaded_by, created_at DESC)` and `(status, created_at)` for moderation/cleanup. |
| `albums` | `id uuid PK`; `slug text NOT NULL UNIQUE`; `title text NOT NULL`; `description text`; `year smallint`; `status text NOT NULL`; creator/updater FKs; timestamps. Index `(status, year DESC)`. |
| `gallery_items` | `id uuid PK`; `album_id uuid NOT NULL FK -> albums ON DELETE CASCADE`; `media_id uuid NOT NULL FK -> media_assets`; `caption text`; `featured boolean NOT NULL DEFAULT false`; `sort_order integer NOT NULL CHECK (sort_order >= 0)`; `status text NOT NULL`; timestamps. Index `(album_id, sort_order)` and `(media_id)`. Decide whether an asset can belong to multiple albums before changing to a many-to-many junction. |

Object bytes do not belong in PostgreSQL. Enforce file type, byte limit,
ownership, scan/quarantine state, and visibility in the API and storage policy.
See [storage-architecture.md](./storage-architecture.md).

## 6. Community, moderation, and inbound forms

| Table | Proposed columns and constraints |
|---|---|
| `community_posts` | `id uuid PK`; nullable `author_user_id uuid FK -> app_users`; `author_display_name text`; `message text NOT NULL`; `location text` only if collection is approved; `status text NOT NULL CHECK (status IN ('pending','approved','rejected','hidden'))`; `pinned boolean NOT NULL DEFAULT false`; `created_at`, `updated_at`, nullable `published_at timestamptz`. Index `(status, created_at DESC)`, `(published_at DESC)` for public feed. |
| `event_comments` | `id uuid PK`; `event_id uuid NOT NULL FK -> events ON DELETE CASCADE`; nullable `author_user_id uuid FK -> app_users`; `author_display_name text`; `message text NOT NULL`; `status text NOT NULL CHECK (status IN ('pending','approved','rejected','hidden'))`; timestamps. Index `(event_id, status, created_at DESC)` and moderation index `(status, created_at DESC)`. |
| `comment_reports` | `id uuid PK`; `comment_id uuid NOT NULL FK -> event_comments ON DELETE CASCADE`; nullable reporter user FK; `reason text NOT NULL`; `status text NOT NULL`; `created_at timestamptz NOT NULL`; `resolved_by uuid FK -> app_users`; `resolved_at timestamptz`. Index `(status, created_at)`. |
| `contact_submissions` | `id uuid PK`; `name text NOT NULL`; `email text NOT NULL`; `subject text NOT NULL`; `message text NOT NULL`; `status text NOT NULL CHECK (status IN ('new','read','replied','closed'))`; nullable `assigned_to uuid FK -> app_users`; `received_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`; `retention_until timestamptz`. Index `(status, received_at DESC)` and `(assigned_to, status)`. Do not store CAPTCHA challenge tokens. |
| `newsletter_subscriptions` | `id uuid PK`; `email text NOT NULL`; `email_normalized text NOT NULL UNIQUE`; `name text`; `status text NOT NULL CHECK (status IN ('pending','subscribed','unsubscribed'))`; `consent_source text NOT NULL`; `consented_at timestamptz`; `confirmed_at timestamptz`; `unsubscribed_at timestamptz`; timestamps. Store only provider-appropriate hashed verification/unsubscribe tokens with expiration if required. |

PII collection, access, retention, erasure, email normalization, and consent
wording require product/legal approval. Do not import the current fake admin
contact inbox as real submissions.

## 7. Elections and voting

Voting requires a separate product/security decision. The current service uses
fixtures, in-memory counts, and a fixed demo OTP; it is not a ballot system.
The candidate relational model below is suitable only as a domain starting
point, not a guarantee of secret, tamper-proof, legally valid elections.

| Table | Proposed columns and constraints |
|---|---|
| `elections` | `id uuid PK`; `title text NOT NULL`; `description text`; `starts_at`, `ends_at timestamptz NOT NULL`; `status text NOT NULL CHECK (status IN ('draft','scheduled','open','closed','results_published','cancelled'))`; `results_published_at timestamptz`; creator/updater user FKs; timestamps. Check `ends_at > starts_at`; index `(status, starts_at)`. |
| `election_positions` | `id uuid PK`; `election_id uuid NOT NULL FK -> elections ON DELETE CASCADE`; `title text NOT NULL`; `description text`; `sort_order integer NOT NULL`; `selections_allowed smallint NOT NULL DEFAULT 1 CHECK (selections_allowed > 0)`; `UNIQUE (election_id, title)`; index `(election_id, sort_order)`. |
| `candidates` | `id uuid PK`; `position_id uuid NOT NULL FK -> election_positions ON DELETE CASCADE`; `full_name text NOT NULL`; `graduation_year smallint`; `department text`; `biography text`; `manifesto text`; nullable `photo_media_id uuid FK -> media_assets`; `sort_order integer NOT NULL`; `status text NOT NULL`; `UNIQUE (position_id, id)` to support composite ballot FK; index `(position_id, sort_order)`. |
| `election_eligibility` | `id uuid PK`; `election_id uuid NOT NULL FK -> elections`; `user_id uuid NOT NULL FK -> app_users`; `status text NOT NULL CHECK (status IN ('eligible','revoked'))`; `created_at timestamptz NOT NULL`; `UNIQUE (election_id, user_id)`. Index `(election_id, status)`. This table must not be joined to a ballot if secret ballots are required. |
| `election_ballots` | `id uuid PK`; `election_id uuid NOT NULL FK -> elections`; `cast_at timestamptz NOT NULL`; `receipt_digest text UNIQUE` only if an approved receipt protocol requires it. No voter identity column in this table. Index `(election_id, cast_at)`. |
| `ballot_selections` | `ballot_id uuid NOT NULL FK -> election_ballots ON DELETE CASCADE`; `position_id uuid NOT NULL FK -> election_positions`; `candidate_id uuid NOT NULL`; composite PK `(ballot_id, position_id)`; composite FK `(position_id, candidate_id) -> candidates(position_id, id)`. Index `(position_id, candidate_id)` for tallying. |
| `election_participation` | `election_id uuid NOT NULL FK -> elections`; `eligibility_id uuid NOT NULL FK -> election_eligibility`; `participated_at timestamptz NOT NULL`; composite PK `(election_id, eligibility_id)`. This records participation and must be operationally separated from ballot identity/content. |

The separation above is not sufficient by itself to provide cryptographic
unlinkability: a trusted ballot-issuance/casting protocol and operational
separation are still required. If the election needs secrecy, independent
verification, coercion resistance, or legally binding results, commission a
specialist design and review before any implementation. Otherwise describe the
system honestly as a private access-controlled poll, not a secret election.

## 8. Audit, settings, and asynchronous delivery

| Table | Proposed columns and constraints |
|---|---|
| `audit_logs` | `id uuid PK`; nullable `actor_user_id uuid FK -> app_users ON DELETE SET NULL`; `action text NOT NULL`; `resource_type text NOT NULL`; `resource_id text`; `request_id text`; `created_at timestamptz NOT NULL`; `metadata jsonb NOT NULL DEFAULT '{}'`. Index `(created_at DESC)`, `(actor_user_id, created_at DESC)`, `(resource_type, resource_id, created_at DESC)`. Exclude secrets, full credentials, and unnecessary message/PII payloads. Treat rows as append-only at the application-role level. |
| `site_settings` | `key text PK`; `value jsonb NOT NULL`; `schema_version integer NOT NULL`; `updated_by uuid FK -> app_users`; `updated_at timestamptz NOT NULL`. Validate the JSON shape in code. Never store provider secrets here. |
| `outbox_messages` | `id uuid PK`; `kind text NOT NULL`; `payload jsonb NOT NULL`; `status text NOT NULL CHECK (status IN ('pending','processing','sent','failed'))`; `attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0)`; `available_at timestamptz NOT NULL`; `created_at timestamptz NOT NULL`; `processed_at timestamptz`; `last_error_code text`. Index `(status, available_at)` for worker claims. Claim rows transactionally; apply idempotency at delivery boundary. Payload must be minimized and access-controlled. |

## 9. Relationship and index summary

The detailed ER diagram and cardinalities are in
[database-relationships.md](./database-relationships.md). Besides indexes listed
above:

- Index referencing FK columns used in joins, authorization checks, deletes,
  and moderation queries; PostgreSQL does not automatically index every FK
  referencing column.
- Add indexes from observed query plans, not by indexing every display field.
- Use full-text indexes only after the search behavior and language are
  specified.
- Set explicit delete behavior: cascade only dependent rows; preserve audit
  history and user-owned records according to retention rules.
- Use transactional services for publishing, capacity-limited registration,
  role changes, and election state transitions.

## 10. Migration, seeds, and access ownership

- Migrations are ordered, reviewed SQL under
  `infrastructure/database/migrations/`; migration runner and schema ownership
  must be selected during Phase 5.
- Seed only stable reference rows and deterministic development fixtures.
  Production seeds must not create administrators, members, elections, ballots,
  subscribers, or CMS content without verified business authority.
- Data imports require a source snapshot, explicit source-to-target mapping,
  identity reconciliation, row counts, FK/orphan checks, duplicate checks,
  representative record review, and auditable approval.
- Runtime call path: HTTP route -> authenticate/authorize -> validate ->
  service -> transaction/repository -> Neon. No direct SQL from Angular.
- Use a narrowly privileged runtime database role and a separate migration
  role. Keep credentials server-side and out of logs.
