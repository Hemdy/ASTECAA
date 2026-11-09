# ASTECAA Cloudflare & Resend Production Setup Guide

This guide walks you through setting up your **Cloudflare** account (Workers, Pages, R2 Storage, DNS) and **Resend** (Email Dispatch) for the ASTECAA Alumni Platform.

---

## Architecture Overview

```
                                      [User Browser]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [astecaa.org / admin]                         [api.astecaa.org]
            Cloudflare Pages (SPA)                   Cloudflare Worker Edge Router
          - /admin/* -> Admin App                                  │
          - /*       -> Website App           ┌────────────────────┴────────────────────┐
                                              ▼                                         ▼
                                      [Direct R2 Bucket]                       [Backend NestJS API]
                                     (/media/* cache & stream)                 - Neon PostgreSQL (WS)
                                                                               - Better Auth Sessions
                                                                               - Resend Email Dispatch
```

---

## 1. Cloudflare Account & API Tokens

### Step 1.1: Locate Your Account ID
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select your account from the top left.
3. In the right-hand sidebar of any domain or the Workers overview, copy your **Account ID** (a 32-character hex string).

### Step 1.2: Generate an API Token for Deployments
1. In the top right user menu, click **My Profile** > **API Tokens**.
2. Click **Create Token** > **Create Custom Token**.
3. Name: `ASTECAA Deployment Token`.
4. Permissions:
   - **Account** > **Cloudflare Pages** > **Edit**
   - **Account** > **Workers Scripts** > **Edit**
   - **Account** > **Workers R2 Storage** > **Edit**
   - **Zone** > **DNS** > **Edit**
   - **Zone** > **Workers Routes** > **Edit**
5. Click **Continue to summary** and **Create Token**. Save this token securely.

---

## 2. Cloudflare R2 Object Storage (Media & Files)

### Step 2.1: Create the Bucket
1. In Cloudflare dashboard, navigate to **R2 Object Storage**.
2. Click **Create bucket**.
3. Bucket name: `astecaa-media`.
4. Location: Select **Automatic** or your preferred region. Click **Create bucket**.

### Step 2.2: Enable Public Access or Custom Domain
1. In the `astecaa-media` bucket settings, go to the **Settings** tab.
2. Under **Public Access**, click **Connect Domain**.
3. Enter your domain: `media.astecaa.org` (Cloudflare will automatically manage the SSL certificate and DNS record).

### Step 2.3: Generate R2 S3-Compatible API Credentials
1. Go to **R2 Object Storage** > **Manage R2 API Tokens** (in the right sidebar).
2. Click **Create API token**.
3. Permissions: **Object Read & Write**.
4. Specify bucket: Apply to `astecaa-media` (or all buckets).
5. Copy the generated credentials:
   - `Access Key ID`
   - `Secret Access Key`
   - Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## 3. Resend Email Setup & Cloudflare DNS Verification

### Step 3.1: Add Domain to Resend
1. Sign in to your [Resend Dashboard](https://resend.com/).
2. Navigate to **Domains** and click **Add Domain**.
3. Enter `astecaa.org` (or a subdomain like `notifications.astecaa.org`).
4. Select your sending region (e.g. US or EU).

### Step 3.2: Configure DNS Records in Cloudflare DNS
Go to **Cloudflare Dashboard** > **Websites** > `astecaa.org` > **DNS** > **Records**. Add the DNS records provided by Resend:

| Type  | Name / Host               | Target / Value                             | Proxy Status | TTL  |
|-------|---------------------------|--------------------------------------------|--------------|------|
| TXT   | `resend._domainkey`       | `k=rsa; p=MIGfMA0GCSqGSIb3DQE...` (Resend) | DNS only     | Auto |
| MX    | `send` (or `@`)           | `feedback-smtp.resend.com` (Priority: 10)  | DNS only     | Auto |
| TXT   | `send` (or `@`)           | `v=spf1 include:amazonses.com ~all`        | DNS only     | Auto |
| TXT   | `_dmarc`                  | `v=DMARC1; p=none;`                        | DNS only     | Auto |

*Note: Make sure the **Proxy status** for email records (MX and TXT) is set to **DNS only** (grey cloud), not Proxied.*

Click **Verify Records** in Resend. Once verified, create your API Key in Resend under **API Keys** with "Sending access".

---

## 4. Environment Variables Configuration

In your `.env` file (and in your production host environment manager):

```env
# Cloudflare R2 Storage
R2_ACCOUNT_ID="your-32-character-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="astecaa-media"
R2_PUBLIC_URL="https://media.astecaa.org"

# Resend Email Dispatch
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="ASTECAA <notifications@astecaa.org>"

# App and Auth Secrets
APP_ENV="production"
ALLOWED_ORIGINS="https://astecaa.org,https://www.astecaa.org,https://admin.astecaa.org"
BETTER_AUTH_SECRET="a-secure-random-32-char-secret"
BETTER_AUTH_URL="https://api.astecaa.org"
DATABASE_URL="postgresql://user:pass@ep-cool-neon-db.pooler.neon.tech/astecaa?sslmode=require"
MIGRATION_DATABASE_URL="postgresql://user:pass@ep-cool-neon-db.neon.tech/astecaa?sslmode=require"
```

---

## 5. Deploying the Cloudflare Worker Edge Gateway

The repository includes `wrangler.toml` and `infrastructure/cloudflare/worker.ts` configured to serve R2 media directly from the edge, handle CORS preflights, and route API calls.

### Step 5.1: Authenticate Wrangler
```bash
pnpm dlx wrangler login
```

### Step 5.2: Deploy the Edge Worker
```bash
pnpm dlx wrangler deploy
```

---

## 6. Deploying the Frontend Applications (Cloudflare Pages)

The monorepo builds both the public alumni website and the admin console into a unified `dist/astecaa/browser` bundle with SPA rewrites (`_redirects`):

### Step 6.1: Build Frontends
```bash
export ASTECAA_API_URL="https://api.astecaa.org"
export ASTECAA_WEBSITE_URL="https://astecaa.org"
export ASTECAA_ADMIN_URL="https://admin.astecaa.org"
pnpm run build
```

### Step 6.2: Deploy via Wrangler
```bash
pnpm dlx wrangler pages deploy dist/astecaa/browser --project-name=astecaa-portal
```

Or connect your GitHub repository in the Cloudflare Pages dashboard:
- **Build command:** `pnpm run build`
- **Build output directory:** `dist/astecaa/browser`
- **Root directory:** `/`

The `_redirects` file automatically handles both applications:
```
/admin/*   /admin/index.html   200
/*         /index.html         200
```

---

## 7. Verification Checklist

- [ ] **Alumni Website:** Navigate to `https://astecaa.org` — home, timeline, events, gallery, and community wall render.
- [ ] **Admin Console:** Navigate to `https://admin.astecaa.org` (or `https://astecaa.org/admin`) — sign in with your super admin account.
- [ ] **Event Registration:** Test registering for an event as an alumnus — verify RSVP confirmation email arrives via Resend.
- [ ] **Community Wall:** Sign in as an alumnus, visit `/community`, observe that member fields are automatically populated, post a note, and test adding reactions (❤️, 👏, 🎉, 🔥) and replies.
- [ ] **Alumni Dashboard:** Visit `/dashboard` — verify your registered events, active elections, and community notes appear with live counts.
- [ ] **Media Uploads:** In Admin Gallery/Media, upload a photo — verify it stores in Cloudflare R2 and serves via `media.astecaa.org` or `/media/*`.
