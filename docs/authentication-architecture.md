# ASTEC Authentication Architecture

**Status:** Provider recommendation for approval; not implemented.

## 1. Recommendation

**Preferred candidate: Better Auth**, with a mandatory Deno 2 integration spike
before Phase 6. Use its PostgreSQL-backed identity/session facilities with
Neon, server-managed sessions, and a browser-facing same-origin API where
possible. The Angular applications use HTTPS requests and do not make
authorization decisions. Keep authentication tables provider-managed and map
the provider's immutable `(issuer, subject)` pair to `auth_identities`, which
links to the application principal in `app_users`.

This choice minimizes separate identity infrastructure and has documented
PostgreSQL support. It is not yet a verified fit for this repository: the
reviewed Better Auth documentation does not list a first-party Angular SDK or
Deno integration. A generic browser client/REST flow and Deno web-standard
handler may work, but must be proven for cookie, CSRF, reset, verification,
deployment, and dependency behavior. Do not start account migration until this
gate passes.

**Fallback: Keycloak over OpenID Connect** if Better Auth fails the Deno or
operational acceptance tests. It has a JavaScript adapter and standardized
OIDC flows, but adds an independently operated identity service and distinct
identity database/configuration. **Clerk** is a managed alternative if reduced
identity operations outweigh vendor dependence and cost; its reviewed SDK
catalog did not list Angular.

## 2. Option comparison

| Criterion | Better Auth | Keycloak | Clerk |
|---|---|---|---|
| Angular browser integration | No first-party Angular SDK found in reviewed docs; use generic browser HTTP/client integration and test | `keycloak-js` JavaScript OIDC adapter; Angular integration can wrap standards-based client | JavaScript SDK exists, but official framework catalog reviewed does not list Angular |
| Deno API | No official Deno integration found; Deno 2 Node/npm compatibility is not a product-specific guarantee | OIDC protocol decouples API runtime; API must validate tokens or use a supported adapter | Backend verification SDK/framework fit must be tested for Deno |
| Neon/PostgreSQL | Documented PostgreSQL adapter; natural persistence fit | Keycloak owns its own supported database; not normally app identity tables in Neon | Managed service; Neon remains application DB, identity records are provider-owned |
| Sessions | Database-backed cookie sessions; suitable for same-origin web API; configure cookie/CSRF protections | OIDC tokens and adapter-managed browser session; define refresh/token lifetime carefully | Managed session/token model; integrate verified session on API |
| Email verification / reset | Built-in flows and hooks available subject to configuration and email provider | Built-in account flows via realm configuration; delivery infrastructure still required | Managed account flows subject to plan/configuration |
| Roles / permissions | Application roles/permissions should be modeled and enforced server-side | Realm/client roles and groups; still map to ASTEC capabilities | Organizations/roles/features vary; enforce ASTEC resource authorization in API |
| MFA path | Plugin/feature support must be verified for required factors and version | Established realm-based MFA configuration | Provider-supported features and plan limits must be validated |
| Operations / portability | Library plus ASTEC-controlled DB/runtime; less separate infra, more integration ownership | Self-hosted or managed Keycloak operations, upgrades, availability, DB and realm backup | Lowest identity-platform operations, highest service/vendor dependency |
| Preliminary fit | **Preferred, conditional** | Strong protocol fallback | Conditional managed alternative |

No option can be selected solely from a feature list; data residency, support,
availability objectives, MFA requirements, cost, and operator capacity remain
open.

## 3. Authentication and authorization boundaries

```mermaid
sequenceDiagram
  participant B as Angular browser
  participant A as ASTEC API
  participant I as Identity service
  participant D as Neon
  B->>I: Sign in / verification / password reset
  I-->>B: Establish provider-managed session or OIDC session
  B->>A: HTTPS request + session cookie or access token
  A->>I: Validate session/token; resolve immutable subject
  A->>D: Load app principal and capability grants
  D-->>A: User state and roles/permissions
  A->>A: Authorize operation and resource ownership
  A-->>B: Explicit API DTO or 401/403
```

- Authentication answers who the requester is. Authorization answers whether
  they may perform this specific operation on this resource.
- Website and admin route guards are presentation aids only. API endpoints
  authenticate and authorize independently.
- Keep admin role assignment and permission checks in the API; default deny.
- Separate member identity from member profile data and from administrative
  permissions. Do not infer admin status from email domain or profile existence.
- Use issuer plus opaque subject as the mapping key; subject uniqueness is
  scoped to its issuer. Email may change and must not be used for automatic
  account linking without verified control.

## 4. Session, browser, and API security

Preferred browser pattern is same-site HTTPS and server-managed `Secure`,
`HttpOnly`, appropriately `SameSite` cookies. If cross-origin deployment is
unavoidable, precisely configure origins, credentials, cookie domain, and
preflight; never use wildcard CORS with credentials.

- Add CSRF defenses for cookie-authenticated state-changing requests, including
  origin checks and the selected provider/library's CSRF mechanism.
- Set idle and absolute session expiry, rotate session identifiers after
  authentication/privilege changes, revoke on sign-out and credential reset.
- Do not place long-lived access/session tokens in local storage.
- Apply rate limits and abuse monitoring to login, reset, verification, OTP,
  and public form endpoints.
- Require verified email where product policy requires it; throttle and expire
  verification/reset tokens and never reveal whether an account exists in
  public reset responses.
- Use MFA for privileged administrators before production CMS access, subject
  to the selected provider's verified capability and recovery process.
- Log identity subject and safe event codes, not secrets, raw tokens, or
  passwords. Add audit events for role changes and privileged account actions.

## 5. Angular integration model

The two apps should call a shared typed API client in `packages/api-client`.
It should wrap `HttpClient`, handle session credentials according to the final
deployment arrangement, and return domain DTOs. Authentication screens can
call the approved provider's browser endpoints/client. Do not include an
identity secret in browser config. The API determines the current principal and
returns only the caller's permitted profile/capabilities.

Before committing to the cookie architecture, test website and admin on their
actual production origins, including CSRF, logout, session expiry, simultaneous
tabs, browser refresh, and CORS.

## 6. Existing account transition

The source audit shows Supabase Auth sign-up/sign-in/reset in the website and
sign-in/reset in admin, plus direct `members` and `profiles` lookups. It does
not verify the live identity schema, account status, email verification,
providers, or password-hash format.

1. Inventory source auth users and profiles through authorized, read-only
   access; store no credentials in reports.
2. Create an explicit, access-controlled mapping from old provider subject to
   new provider subject/application user ID. Reconcile duplicate or shared
   emails manually under a documented policy.
3. Do not assume password hashes are exportable or compatible. Prefer a
   controlled password reset/re-enrollment flow; only consider hash migration
   if both providers document and security approves compatible algorithms,
   parameters, and import support.
4. Preserve verified account identity and user-owned records. Avoid matching
   by unverified email alone.
5. Run pilot account verification and recovery before bulk migration; maintain
   a temporary, explicit source-to-target lookup during cutover.
6. Revoke/expire old sessions only at the approved cutover point and provide a
   user communication and support path.
7. Retain Supabase Auth until new sign-in, email verification, reset, admin
   MFA, authorization, and rollback acceptance criteria pass.

## 7. Required proof-of-concept acceptance gate

Use synthetic accounts and a disposable Neon database only. Demonstrate:

- Deno 2 deployment and local integration of the selected Better Auth version.
- PostgreSQL schema generation/migrations and Neon driver/pool behavior.
- Angular website and admin sign-in, sign-out, session restore and expiry.
- Sign-up, verification, reset, rate limiting, and provider email delivery.
- CSRF and CORS protections for both browser apps.
- Admin/member capability enforcement by the API, including denied requests.
- MFA enablement/recovery for an administrator or a documented fallback.
- Identity mapping and account reset path without importing live passwords.

If any mandatory item fails or is unsupported, stop and evaluate Keycloak OIDC
or another approved identity provider before Phase 6.

## 8. Official references

- [Better Auth PostgreSQL adapter](https://www.better-auth.com/docs/adapters/postgresql)
- [Better Auth database concepts](https://www.better-auth.com/docs/concepts/database)
- [Better Auth session management](https://www.better-auth.com/docs/concepts/session-management)
- [Keycloak JavaScript adapter](https://www.keycloak.org/securing-apps/javascript-adapter)
- [Keycloak securing applications](https://www.keycloak.org/securing-apps)
- [Clerk JavaScript SDK catalog](https://clerk.com/docs/reference/objects/clerk)
- [Deno Node/npm compatibility](https://docs.deno.com/runtime/fundamentals/node/)
