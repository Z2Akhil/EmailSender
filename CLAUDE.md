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
2. **Worker** (`npm run worker` → `start-worker.ts` → `lib/worker.ts`) — separate long-running process that consumes the `email-queue` and `whatsapp-queue` BullMQ queues. Per job it: re-checks campaign/domain status, upserts a `CampaignRecipient`, substitutes `{{firstName}}`/`{{email}}` variables, injects the open-tracking pixel, rewrites all `href`s through `/api/track/click`, appends the compliance/unsubscribe footer, then sends via `lib/email-service.ts`.

Both must be running locally to test end-to-end sending.

### Two Redis clients — not interchangeable

- `lib/redis.ts` — ioredis via `REDIS_URL` (TCP). Used only by BullMQ (queues + worker).
- `lib/ratelimit.ts` — `@upstash/redis` REST client via `UPSTASH_REDIS_REST_*`. Used only for rate limiting. Degrades to a no-op mock when the env vars are missing, so rate limiting silently disables in local dev.

### Two separate auth systems

- **Users**: NextAuth (JWT strategy, no adapter) with Google + credentials providers (`lib/auth.ts`). The session JWT carries `user.workspaceId` — this is the tenancy key. API routes use `requireAuth()` from `lib/api-utils.ts` and must scope every Mongo query by `workspaceId`.
- **Admin**: entirely separate from NextAuth. Credentials come from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars; a jose-signed JWT is stored in the `admin_token` cookie (`lib/admin-auth.ts`). Admin pages live under `app/admin/(dashboard)/`.

### Middleware lives in `proxy.ts` (Next.js 16 convention)

Root-level `proxy.ts` is the global middleware: per-IP rate limiting on `/api/*`, NextAuth gating of `/dashboard/*`, and `admin_token` verification for `/admin/*`. API routes are public at the middleware layer — each route enforces auth itself via `requireAuth()`.

### Email provider chain (`lib/email-service.ts`)

Per send: workspace custom SMTP (if configured) → Amazon SES → SendGrid → log-only if nothing is configured. Custom SMTP passwords and WhatsApp access tokens are encrypted at rest with AES-256-GCM (`lib/crypto.ts`, keyed by `ENCRYPTION_KEY` — falls back to an insecure dev key outside production).

### Campaign lifecycle

Status flow: `DRAFT → SCHEDULED/SENDING → SENT` (or `CANCELLED`). Scheduled sends rely on a Vercel cron (`vercel.json`) hitting `/api/cron/dispatch-scheduled` every minute. Engagement flows back through public endpoints under `app/api/track/` (open pixel, click redirect, bounce) and `/api/unsubscribe`, updating `CampaignRecipient` status and campaign counters. Sends are suppressed for contacts not in `ACTIVE` status.

### Billing limits

`checkPlanLimits(workspaceId, "contacts" | "emails")` in `lib/stripe.ts` enforces per-plan quotas (defined in `SUBSCRIPTION_PLANS` there) and is called before dispatching email campaigns. Stripe webhook at `/api/billing/webhook` updates the workspace plan tier.

### WhatsApp channel

Campaigns have a `channel` field (`EMAIL` | `WHATSAPP`). WhatsApp uses Meta OAuth (`/api/whatsapp/oauth/*`), sends template messages via the Graph API (`lib/whatsapp-service.ts`), requires contacts with `whatsappNumber` + `whatsappOptIn`, and refreshes tokens via `/api/cron/whatsapp/refresh-tokens`. Meta webhook verification token is `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

### Frontend conventions

shadcn/ui (Radix) components in `components/ui/`, feature components grouped by domain in `components/<domain>/`. Email content is authored with a TipTap-based editor (`components/templates/SimpleEmailEditor.tsx`) that wraps output in email-safe HTML at save time and stores its JSON as `emailDesign: { editor: "tiptap", content }`; WhatsApp templates are built in `components/templates/WhatsappTemplateBuilder.tsx` and submitted to Meta for review. Client state via Zustand (`lib/store.ts`) and TanStack Query.

## Environment

Copy `.env.example` to `.env`. Minimum for local dev: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `REDIS_URL` (local Redis works) if running the worker. The worker loads `.env.local` then `.env` via dotenv; the Next app uses its normal env loading.
