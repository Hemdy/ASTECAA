# Deployment

The root `netlify.toml` is intentionally retained because Netlify discovers it
at the repository root. It builds both Angular applications and publishes the
website bundle, with the admin bundle under `/admin`.

The API is an independent Deno service and is deployed separately from the
Angular applications. Configure `DATABASE_URL`, `BETTER_AUTH_URL`,
`BETTER_AUTH_SECRET`, and an explicit comma-separated `ALLOWED_ORIGINS` value
through the deployment platform's secret manager. The deployment target and
production rollout remain to be selected and validated.

The API container is built from the repository root with
`docker build -f apps/api/Dockerfile -t asteccaa-api .`. The image uses the
repository's Deno lockfile in frozen mode. Configure its required secrets and
environment variables through the container host; do not pass a local `.env`
file into the build. Route liveness checks to `/health` and readiness checks
to `/ready` on port `8000`.

The static website/admin deployment requires the non-secret `ASTECAA_API_URL`
build variable. The root `npm run build` validates it and writes
`api-config.js` into the published directory; the script sets the API origin
for both Angular applications. Production URLs must use HTTPS. Configure the
API and frontend on the same site (for example `api.example.org` and
`www.example.org`) so browser session cookies can be used reliably. Do not
deploy with a localhost API URL.

Before deploying, run the reviewed migration workflow against the intended
Neon production branch, provision and verify the initial administrator through
an approved secure procedure (not yet implemented), and verify `/health`,
`/ready`, admin login,
event CRUD, browser CORS, and cookie behavior on the actual production
hostnames. Do not promote the current deployment while those checks or the
account/data migration remain incomplete.

The root `.env` was removed from Git tracking, with the local copy preserved.
Rotate any credentials that may have appeared in its Git history, and complete
approved history remediation before treating the repository as secret-clean.

The API host must bind to the container's public interface in production (the
default is `0.0.0.0` when `APP_ENV=production`). Store all credentials in the
host's secret manager. Never expose database URLs or Better Auth secrets to
the frontend build environment.

The former Supabase Edge Function scaffold is no longer an application runtime.
Do not delete or decommission the external Supabase project until data and
account migration has been verified and accepted.
