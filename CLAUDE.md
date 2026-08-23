# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server (Turbopack) on :3000
npm run build    # Production build
npm run lint     # ESLint
npm run worker   # BullMQ worker process (npx tsx start-worker.ts) — required for actual email/WhatsApp sending
```

There is no test framework configured.

## What this is

A multi-tenant bulk email + WhatsApp campaign SaaS: Next.js 16 (App Router, TypeScript strict), MongoDB/Mongoose, BullMQ + Redis, Stripe billing, deployed on Vercel. Path alias `@/*` maps to the repo root.

## Architecture

### Two processes

1. **Next.js app** — UI + API routes. Campaign send routes do not send email; they validate, set campaign status to `SENDING`, and enqueue one BullMQ job per recipient (`lib/queue.ts`).
2. **Worker** (`npm run worker` → `start-worker.ts` → `lib/worker.ts`) — separate long-running process that consumes the `email-queue` and `whatsapp-queue` BullMQ queues. Per job it: re-checks campaign status, upserts a `CampaignRecipient`, substitutes `{{firstName}}`/`{{email}}` variables, injects the open-tracking pixel, rewrites all `href`s through `/api/track/click`, appends the compliance/unsubscribe footer, then sends via `lib/email-service.ts`.

Both must be running locally to test end-to-end sending.

### Two Redis clients — not interchangeable

- `lib/redis.ts` — ioredis via `REDIS_URL` (TCP). Used only by BullMQ (queues + worker).
- `lib/ratelimit.ts` — `@upstash/redis` REST client via `UPSTASH_REDIS_REST_*`. Used only for rate limiting. Degrades to a no-op mock when the env vars are missing, so rate limiting silently disables in local dev.

### Two separate auth systems

- **Users**: NextAuth (JWT strategy, no adapter) with Google + credentials providers (`lib/auth.ts`). The session JWT carries `user.workspaceId` — this is the tenancy key. API routes use `requireAuth()` from `lib/api-utils.ts` and must scope every Mongo query by `workspaceId`.
- **Admin**: entirely separate from NextAuth. Credentials come from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars; a jose-signed JWT is stored in the `admin_token` cookie (`lib/admin-auth.ts`). Admin pages live under `app/admin/(dashboard)/`.

### Middleware lives in `proxy.ts` (Next.js 16 convention)

Root-level `proxy.ts` is the global middleware: per-IP rate limiting on `/api/*`, NextAuth gating of `/dashboard/*`, and `admin_token` verification for `/admin/*`. API routes are public at the middleware layer — each route enforces auth itself via `requireAuth()`.

### Email sending is SMTP-only (`lib/email-service.ts`)

There is no platform email provider — Amazon SES, SendGrid and the "shared sending" mode were removed. Every email goes through the **workspace's own SMTP account** (Settings → SMTP), so mail is sent from the user's real address. `lib/workspace-smtp.ts` (`getWorkspaceSmtpConfig`) is the single loader used by the worker, the test-email route and the send/schedule preflights. SMTP passwords and WhatsApp access tokens are encrypted at rest with AES-256-GCM (`lib/crypto.ts`, keyed by `ENCRYPTION_KEY` — falls back to an insecure dev key outside production).

- No SMTP configured = the send route returns 400 before enqueueing anything; the worker throws rather than silently logging.
- Transports are pooled per credential set; the password is part of the cache key so a credential change takes effect in the long-running worker.
- Deliverability lives in `sendEmail`: an auto-generated text/plain alternative (`htmlToText`), `List-Unsubscribe` + `List-Unsubscribe-Post` one-click headers, and an envelope sender aligned with `From` so SPF passes for DMARC.
- `Campaign.provider` is now only `"SMTP" | "WHATSAPP"`; `domainId` is gone from campaigns.

### Email authentication (`lib/email-auth.ts`)

The Domains feature no longer provisions anything — it is a read-only DNS checker. `checkDomainAuth(domain, selector?)` resolves SPF, DKIM and DMARC and returns PASS/WARN/FAIL plus a fix hint per record; results are cached on the `Domain` document and rendered by `components/settings/DomainList.tsx`. DKIM selectors cannot be discovered, so a list of common provider selectors is probed and the user can supply their own. A domain is `VERIFIED` only when all three pass.

**Existing databases need `npx tsx scripts/migrate-domain-indexes.ts --fix` once** to drop the legacy globally-unique `domainName_1` index.

### Onboarding

New workspaces (no `onboardingCompletedAt`, zero campaigns/contacts) are redirected from `/dashboard` (server component gate) to the `/dashboard/welcome` wizard. Completion/skip is recorded via `POST /api/onboarding`. The dashboard's setup checklist comes from the `checklist` block in `GET /api/dashboard/stats`. Global starter templates ("the gallery") live in `lib/gallery-templates.ts` — reseed with `POST /api/cron/seed-templates` (CRON_SECRET bearer); template `emailDesign` is `{ editor: "tiptap", content: <html string> }` and bodies must stay within the SimpleEmailEditor's schema (see authoring rules in that file).

### Contact import (shared email + WhatsApp format)

`lib/contact-import.ts` is the single source of truth for the canonical contact shape, used by the upload UI, `POST /api/contacts/lists/[id]/import` and the manual add-contact route. A contact needs **either** an `email` **or** a `whatsappNumber` — `email` is optional on the model, so every email send path must filter on `contact.email` being present (see `app/api/campaigns/[id]/send/route.ts` and `/api/cron/dispatch-scheduled`).

- A contact has exactly **four** user-facing fields: `fullName`, `email`, `phone`, `whatsappNumber` (`CONTACT_IMPORT_FIELDS`). Both the import mapping UI and `AddContactModal` expose that set and nothing else — keep them in step.
- `fullName` is stored split into `firstName`/`lastName` (`splitFullName`, rejoined for display/export with `joinFullName`) because `{{firstName}}` personalization reads those columns.
- WhatsApp consent is not a column: `whatsappOptIn` comes from the checkbox on the upload screen (or is implied by adding a number manually).
- Headers are auto-mapped through the alias table in `CONTACT_IMPORT_FIELDS`; the mapping UI just lets the user override it. `normalizeMapping` drops mapping keys outside the four canonical fields (legacy `name`/`firstName` → `fullName`, `number` → `whatsappNumber` + `phone`).
- Numbers are normalized to E.164 with `libphonenumber-js`. Storage: `whatsappNumber` = digits, no `+` (what the Graph API wants); `phone` = E.164 with `+`, falling back to the raw string.
- Dedupe key is email, or the WhatsApp number for email-less contacts (`contactKey`). Uniqueness per list is enforced by two **partial** unique indexes in `models/Contact.ts`.
- Import is batched (two lookup queries + `insertMany`/`bulkWrite`), not per-row.
- **Existing databases need `npx tsx scripts/migrate-contact-indexes.ts --fix` once** to drop the legacy `email_1_listId_1` unique index — otherwise email-less contacts fail to insert.

### Campaign lifecycle

Status flow: `DRAFT → SCHEDULED/SENDING → SENT` (or `CANCELLED`). Scheduled sends rely on a Vercel cron (`vercel.json`) hitting `/api/cron/dispatch-scheduled` every minute. Engagement flows back through public endpoints under `app/api/track/` (open pixel, click redirect) and `/api/unsubscribe`, updating `CampaignRecipient` status and campaign counters. Sends are suppressed for contacts not in `ACTIVE` status.

### Billing limits

`checkPlanLimits(workspaceId, "contacts" | "emails")` in `lib/stripe.ts` enforces per-plan quotas (defined in `SUBSCRIPTION_PLANS` there) and is called before dispatching email campaigns. Stripe webhook at `/api/billing/webhook` updates the workspace plan tier.

### WhatsApp channel

Campaigns have a `channel` field (`EMAIL` | `WHATSAPP`). WhatsApp uses Meta OAuth (`/api/whatsapp/oauth/*`), sends template messages via the Graph API (`lib/whatsapp-service.ts`), requires contacts with `whatsappNumber` + `whatsappOptIn`, and refreshes tokens via `/api/cron/whatsapp/refresh-tokens`. Meta webhook verification token is `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

### Frontend conventions

shadcn/ui (Radix) components in `components/ui/`, feature components grouped by domain in `components/<domain>/`. Email content is authored with a TipTap-based editor (`components/templates/SimpleEmailEditor.tsx`) that wraps output in email-safe HTML at save time and stores its JSON as `emailDesign: { editor: "tiptap", content }`; WhatsApp templates are built in `components/templates/WhatsappTemplateBuilder.tsx` and submitted to Meta for review. Client state via Zustand (`lib/store.ts`) and TanStack Query.

## Environment

Copy `.env.example` to `.env`. Minimum for local dev: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `REDIS_URL` (local Redis works) if running the worker. Email sending needs no env at all — SMTP credentials are per-workspace and entered in the UI. The worker loads `.env.local` then `.env` via dotenv; the Next app uses its normal env loading.
