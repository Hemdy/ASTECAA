# ASTECAA ALUMNI PLATFORM
## MASTER PROPOSAL & SERVICE AGREEMENT

**Document Reference:** PSA-ASTECAA-2026-01  
**Date:** November 9, 2026  
**Status:** Ready for Client Execution & Deployment Activation  

---

### PARTIES

This **Master Proposal and Service Agreement** (the "Agreement") is entered into as of **November 9, 2026**, by and between:

1. **THE SERVICE PROVIDER / LEAD DEVELOPER:**  
   **[Engineering Team / Developer Name / Digital Agency]**  
   *Address / Contact:* [Provider Address / Email / Phone]  
   (Hereinafter referred to as the **"Service Provider"**)

   AND

2. **THE CLIENT:**  
   **Air Force Comprehensive School Owerrinta Alumni Association (ASTECAA)**  
   *Represented by:* The Executive Committee & Board of Trustees  
   *Contact Email:* [executives@astecaa.org / Contact Person Email]  
   (Hereinafter referred to as the **"Client"** or **"ASTECAA"**)

---

## 1. EXECUTIVE SUMMARY & PROJECT BACKGROUND

The **ASTECAA Alumni Platform** is an enterprise-grade, high-performance community archive, engagement portal, and administrative ecosystem developed to connect alumni of Air Force Comprehensive School (ASTEC) Owerrinta across multiple graduating classes, professions, and geographical regions.

The development phase has reached **100% Engineering Completion**. All core systems, interfaces, database schemas, voting mechanisms, media storage adapters, and administrative tools have been built, integrated, and verified in pre-production.

The platform is now **Ready for Production Deployment**. To transition from staging to public live operation, the Client must formalize this agreement and provide the initial commitment to fund foundational infrastructure costs (including domain acquisition, secure edge routing, production database provisioning, cloud object storage, and verified email delivery).

---

## 2. SCOPE OF DELIVERABLES & TECHNICAL SPECIFICATIONS

The delivered platform is structured as a modern, high-performance TypeScript monorepo (`pnpm`) comprising the following independent, enterprise-grade deliverables:

```
ASTECAA Ecosystem
├── apps/
│   ├── website/         # Public Alumni Web Portal (Angular 21)
│   ├── admin/           # Administrative CMS & Governance Portal (Angular 21)
│   └── api/             # Modular NestJS REST API & Business Logic Layer
├── infrastructure/
│   ├── database/        # Serverless Neon PostgreSQL + Drizzle ORM Migrations
│   └── cloudflare/      # Edge Worker Router & Media Cache
└── packages/
    ├── types/           # Shared TypeScript domain contracts
    ├── api-client/      # Reusable client-side API integrations
    ├── config/          # Dynamic URL configuration & environment resolution
    ├── ui/              # Shared UI directives, toasts, and layout tokens
    └── validation/      # Shared schema validation (Zod / custom rules)
```

### 2.1 Deliverable A: Public Alumni Web Portal (`apps/website`)
- **Heritage Visual Design System**: Bespoke aesthetic honoring the institution’s history (Parchment Cream `#f8f3e8`, Deep Ink `#3a2a20`, Gilded Gold `#c49a45`, Wax Seal Burgundy `#7a3e3e`), utilizing **Plus Jakarta Sans** and **Inter** typography, paired with crisp **Remix Icons**.
- **Interactive Historical Timeline**: Chronological interactive journey from the school’s inception in 1998 through modern milestones, featuring historical photographs, founder quotes, and rich narratives.
- **Archival Media Gallery**: High-resolution digital archive organized by albums and graduating sets, with lightbox zoom, category filtering, and direct asset caching.
- **Events & RSVP Hub**: Published event listings with rich multi-day itineraries, guest speakers, capacity tracking, venue maps, and automated registration confirmations.
- **Community Wall & Social Interaction**: Real-time memory and tribute sharing, threaded discussions, per-user unique emoji/heart reactions, and user moderation flags.
- **Alumni Dashboard & Profile Portal**: Member authentication, profile editing, graduation set identification, attendance records, and active ballot notifications.

### 2.2 Deliverable B: Administrative Management Console (`apps/admin`)
- **Role-Based Access Control (RBAC)**: Secure access restricted to verified administrators and electoral committee officers with cryptographic session validation.
- **Content Management System (CMS)**:
  - *Events CMS*: Creation, scheduling, draft/publish workflows, ticketing thresholds, and attendee export.
  - *Announcements & Stories*: Dynamic institutional blog posts, news bulletins, and broadcast announcements.
  - *Milestone & Gallery Manager*: Direct drag-and-drop media uploads to cloud storage, album categorization, and caption curation.
  - *Community Moderation*: Review queue for flagged messages, pinned highlights, and abuse controls.
- **System Metrics & Overview**: Real-time counters for registered alumni, ballot turnouts, upcoming events, and storage utilization.

### 2.3 Deliverable C: Democratic Elections & Voting Engine (`apps/api/src/voting`)
- **Tamper-Evident Digital Balloting**: Full election management for executive positions, candidate manifestos, and photographic profiles.
- **One-Person, One-Vote Integrity**: Cryptographically hashed voter IDs (`voter_hash`) preventing double voting while ensuring full voter anonymity (the system records *that* an authorized alumnus voted, without exposing *who* they voted for).
- **Two-Factor OTP Voter Authentication**: Time-sensitive verification codes dispatched to registered alumni emails/phones prior to ballot release.
- **Audit Trails & Results Publishing**: Real-time tallying with scheduled release controls to ensure fair, transparent alumni governance.

### 2.4 Deliverable D: Backend Architecture & Infrastructure Layer
- **NestJS Enterprise REST API**: Modular service architecture with clean dependency injection, structured validation pipes, and automated health checks (`/health`).
- **Neon Serverless PostgreSQL Database**: High-concurrency SQL database with pooling, automated branches, and strict version-controlled Drizzle migrations (eliminating un-reviewed database drift).
- **Cloudflare R2 Object Storage**: S3-compatible cloud storage for media, photos, and documents with zero egress bandwidth charges.
- **Cloudflare Edge Gateway & Pages**: Blazing-fast edge routing via Cloudflare Workers, global CDN distribution, and HTTP/3 automated SSL.
- **Transactional Email Dispatch**: Integration with **Resend** for password resets, event confirmations, invitation links, and voting OTPs with SPF/DKIM/DMARC authentication.

---

## 3. DEPLOYMENT & ROLLOUT PLAN

Production deployment will commence immediately upon receipt of the initial commitment payment and client authorization.

| Phase | Milestone Description | Target Timeline | Deliverable / Output |
|:---|:---|:---:|:---|
| **Phase 1: Procurement & Cloud Initialization** | Acquisition of `astecaa.org` domain, setup of Cloudflare DNS zone, creation of production Neon PostgreSQL database, R2 bucket binding, and Resend email domain configuration. | Day 1 – 2 | Live DNS zone, verified email sending records, secure production storage bucket. |
| **Phase 2: Production Build & Deployment** | Execution of production Drizzle migrations, compilation of optimized Angular bundles, deployment of NestJS API to container host, and binding of Cloudflare Pages & Worker Edge Router. | Day 3 – 4 | Live website (`https://astecaa.org`), live admin portal (`https://admin.astecaa.org`), live API gateway (`https://api.astecaa.org`). |
| **Phase 3: Verification & Administrative Handover** | End-to-end smoke testing, SSL certificate verification, seeding of primary executive admin accounts, delivery of administrative credentials, and committee walkthrough. | Day 5 | Fully operational live platform, verified admin access, operational handbooks. |

---

## 4. FINANCIAL TERMS & COST BREAKDOWN

### 4.1 Cost Structure Summary
To ensure transparency, costs are partitioned into **Professional Development / Delivery Fees** and **Essential Infrastructure Pass-Through Costs**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOTAL INVESTMENT SUMMARY                                               │
├─────────────────────────────────────────────────┬──────────────────────┤
│ 1. Platform Engineering & Architecture Delivery │ $3,850.00            │
│ 2. Production Deployment & Cloud Setup Service  │ $650.00              │
│ 3. Essential Year-1 Infrastructure & Domain     │ $380.00              │
├─────────────────────────────────────────────────┼──────────────────────┤
│ TOTAL CONTRACT VALUE                            │ $4,880.00            │
│                                                 │                      │
│ INITIAL DEPLOYMENT COMMITMENT (DUE NOW)          │ $2,440.00 (50%)      │
│ FINAL BALANCE UPON HANDOVER (DUE UPON GO-LIVE)  │ $2,440.00 (50%)      │
└─────────────────────────────────────────────────┴──────────────────────┘
```
*(Note: Equivalent payment in Nigerian Naira [NGN] or alternative international currency can be accommodated based on the prevailing CBN / official rate at the time of invoice issuance).*

### 4.2 Itemized Cloud Infrastructure Pass-Through (Year 1 Estimates)
The initial commitment funds direct 3rd-party vendor costs required to launch and keep the platform online:

| Infrastructure Component | Purpose / Tier | Estimated Annual Allocation |
|:---|:---|:---:|
| **Custom Domain (`astecaa.org`)** | 1-Year registration, WHOIS privacy protection, DNS management | $35.00 |
| **Cloudflare Pro / Edge Infrastructure** | Global CDN, DDoS protection, edge routing worker, zero-egress R2 | $120.00 |
| **Neon PostgreSQL Production Tier** | Managed serverless compute, automated backups, connection pooler | $150.00 |
| **Resend Email Delivery Gateway** | Verified transactional sending domain, 50,000+ monthly emails | $75.00 |
| **Total Pass-Through Allocation** | *Direct infrastructure cost for Year 1* | **$380.00** |

---

## 5. TERMS OF SERVICE & LEGAL PROVISIONS

### 5.1 Intellectual Property & Ownership
1. **Full Transfer**: Upon full and final settlement of all contract fees, the Service Provider transfers all rights, title, copyright, and interest in the custom source code, database architecture, design assets, and documentation to ASTECAA.
2. **Third-Party Open Source**: Open-source libraries (Angular, NestJS, Drizzle, Better Auth, Linux/Node tools) remain governed by their respective permissive licenses (MIT, Apache 2.0).

### 5.2 Warranty & Post-Launch Support
1. **30-Day Stabilization Warranty**: The Service Provider provides thirty (30) calendar days of complimentary post-deployment warranty support covering any latent software defects, critical bugs, broken links, or configuration adjustments resulting from the original scope.
2. **Excluded from Warranty**: New feature additions, scope modifications, third-party network outages, or alterations made by unauthorized third parties.

### 5.3 Client Obligations & Dependencies
To ensure an expedient launch, the Client agrees to:
1. Approve domain naming preferences (`astecaa.org` primary, with fallbacks `astecaa.com` / `astecaa.net`).
2. Designate a Primary Executive Administrator who will receive master credentials and coordinate initial member onboarding.
3. Timely process the initial deployment commitment invoice to facilitate domain and cloud resource acquisition.

### 5.4 Confidentiality & Data Security
Both parties agree to treat all member information, database records, security keys, and strategic discussions as strictly confidential. No alumni personal data will be sold, leased, or transferred to third parties.

---

## 6. ACCEPTANCE & SIGN-OFF

By signing below, the parties agree to the terms, scope, and payment schedule set forth in this Agreement.

**FOR THE SERVICE PROVIDER:**

___________________________________________________  
**Signature**

___________________________________________________  
**Printed Name & Title**

___________________________________________________  
**Date**


**FOR THE CLIENT (ASTECAA EXECUTIVE COMMITTEE):**

___________________________________________________  
**Signature (President / General Secretary / Trustee)**

___________________________________________________  
**Printed Name & Title**

___________________________________________________  
**Date**

