# ASTEC Environment Variable Specification

**Status:** Specification for the Neon foundation and staged auth/API work.

## 1. Database foundation variables

| Variable | Required when | Purpose / handling |
|---|---|---|
| `DATABASE_URL` | Running API database code or DB smoke test | Neon runtime connection URL. Prefer Neon’s pooled endpoint for a serverless API. Keep server-side only; TLS required. Never log or expose it to Angular. |
| `MIGRATION_DATABASE_URL` | Applying a migration | Separate Neon development connection URL for migration tooling; use the direct/non-pooled endpoint and a least-privilege migration role. Configure only when intentionally applying a migration. |
| `APP_ENV` | API execution | `development`, `test`, or `production`. Production enables secure auth cookies and requires HTTPS browser/API origins and a TLS-enforced database URL. |
| `LOG_LEVEL` | API execution | Structured log verbosity. Do not enable sensitive payload or SQL parameter logging in production. |
| `ALLOWED_ORIGINS` | Standalone auth API | Comma-separated exact browser origins. Used for credentialed CORS and Better Auth trusted origins. |
| `ASTEC_API_HOST` / `ASTEC_API_PORT` | Standalone API server | Bind hostname and port; development defaults are `127.0.0.1:8000`. |
| `ASTECAA_API_URL` | Building the combined static website/admin deployment | Public HTTPS origin for the independently deployed API. Not a secret; the build generates `api-config.js` from this value. Never set to localhost in production. |

Connection URL example shape (placeholders only):

```text
postgresql://<USER>:<PASSWORD>@<NEON-POOLER-HOST>/<DATABASE>?sslmode=require
```

The migration URL should use the direct endpoint and a migration credential,
not the API runtime's pooled credential. Keep both URLs in the ignored
`apps/api/.env` or an approved secret manager. Do not put either in the root
Angular environment configuration or any `VITE_`/browser-prefixed variable.

## 2. Authentication API variables

| Variable | Required when | Purpose / handling |
|---|---|---|
| `BETTER_AUTH_URL` | Running standalone auth API | Exact HTTP(S) API origin; HTTPS is enforced except on localhost. |
| `BETTER_AUTH_SECRET` | Running standalone auth API | Server-only secret of at least 32 characters. Generate a high-entropy value locally; never commit or expose it. |

The Better Auth API and browser clients use Neon-backed session identities and
roles. Existing Supabase accounts have not been verified as migrated; no
administrator login is guaranteed until account identity mapping and role
provisioning are complete. Member self-registration and password recovery also
remain unavailable until transactional email and secure provisioning exist.

## 3. Planned storage variables (not consumed yet)

| Variable | Purpose |
|---|---|
| `STORAGE_ENDPOINT` | S3-compatible endpoint, for example an R2 account endpoint. |
| `STORAGE_BUCKET` | Private bucket/container name for the environment. |
| `STORAGE_ACCESS_KEY_ID` | Server-side storage credential identifier. |
| `STORAGE_SECRET_ACCESS_KEY` | Server-side storage secret. |
| `STORAGE_PUBLIC_BASE_URL` | Optional approved public CDN/custom-domain base URL. |
| `STORAGE_MAX_UPLOAD_BYTES` | API-enforced upload size limit. |

Never provide storage credentials to the browser; it receives only short-lived,
scoped presigned URLs after API authorization.

## 4. Planned email variables (not consumed yet)

| Variable | Purpose |
|---|---|
| `EMAIL_PROVIDER` | Approved provider adapter identifier. |
| `EMAIL_API_KEY` | Server-only API credential. |
| `EMAIL_FROM` | Verified sender address. |
| `EMAIL_REPLY_TO` | Optional monitored reply address. |

Email provider, sending domain, consent, retry, and deliverability behavior
remain decisions for the email milestone.

## 5. Planned observability/deployment variables

| Variable | Purpose |
|---|---|
| `ASTEC_API_HOST` | Bind address; production host/container may override. |
| `ASTEC_API_PORT` | Local API port if a standalone server is introduced. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional approved OpenTelemetry collector endpoint. |
| `OTEL_SERVICE_NAME` | Service label for traces/metrics. |

Add a provider-specific telemetry token only after the provider is selected;
never add arbitrary secrets to a public Angular build.

## 6. Secret-management rules

1. Use local ignored `apps/api/.env` only for development. Use the deployment
   platform's secret manager for hosted environments.
2. Keep runtime and migration DB credentials separate, rotate them independently,
   and scope access to the minimum required privileges.
3. Use distinct values per environment. Never copy a production `.env` into a
   development machine or test fixture.
4. Redact database URLs, auth cookies/tokens, mail keys, storage credentials,
   reset links, and user payloads from logs/errors.
5. `.env.example` contains names and safe placeholders only; it is not a source
   of usable credentials.
6. The root `.env` is now removed from Git tracking but remains in the local
   working directory. Its prior commits may still contain secrets; rotate any
   potentially exposed credentials and use the repository owner's approved
   history-remediation process. Keep a protected local copy only if needed for
   an authorized source-data export.
