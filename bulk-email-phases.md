# 🗓️ BulkMailer — Development Phases Roadmap

---

## Overview

| Phase | Name | Duration | Status |
|---|---|---|---|
| Phase 1 | Foundation & Setup | Week 1–2 | ✅ Done |
| Phase 2 | Contact Management | Week 3 | ✅ Done |
| Phase 3 | Campaign Builder | Week 4–5 | 🔄 In Progress |
| Phase 4 | Sending Engine | Week 6 | 🔲 Not Started |
| Phase 5 | Analytics | Week 7 | 🔲 Not Started |
| Phase 6 | Polish & Launch | Week 8 | 🔲 Not Started |

---

## Phase 1 — Foundation & Setup
**Duration:** Week 1–2
**Goal:** Get the project skeleton ready with auth, database, and core layout.

### Tasks

#### Project Initialization
- [x] Create Next.js 16 project with TypeScript
- [x] Configure Tailwind CSS v4 (CSS-based, no config file)
- [x] Install and configure Radix UI primitives
- [x] Initialize Git repository and folder structure

#### Database (MongoDB + Mongoose)
- [x] Set up MongoDB (Atlas or local)
- [x] Install and configure Mongoose ODM
- [x] Design and write Mongoose schemas:
  - [x] User model (`models/User.ts`)
  - [x] Workspace + WorkspaceMember models (`models/Workspace.ts`)
  - [x] ContactList + Contact models (`models/Contact.ts`)
  - [x] Campaign + CampaignRecipient models (`models/Campaign.ts`)
  - [x] Template model (`models/Template.ts`)
- [x] MongoDB connection singleton (`lib/db.ts`)
- [x] Seed database with test data (manual via MongoDB Atlas or Compass)

#### Authentication
- [x] Install and configure NextAuth.js v4 (JWT strategy)
- [x] Email & password login (Mongoose-based credentials provider)
- [x] Google OAuth login (auto-creates user + workspace in MongoDB)
- [x] Protected routes (proxy.ts for Next.js 16)
- [x] Session handling across the app

#### Layout & Navigation
- [x] Landing page (hero, features, pricing, CTA)
- [x] Login & Signup pages with form validation
- [x] Dashboard shell layout (sidebar + topbar)
- [x] Placeholder pages: contacts, campaigns, templates, settings

### Deliverables
- [x] Working app with login/signup
- [x] Dashboard layout accessible after login
- [x] MongoDB connected via Mongoose

---

## Phase 2 — Contact Management
**Duration:** Week 3
**Goal:** Allow users to upload, manage, and organize their contact lists.

### Tasks

#### Contact Upload
- [x] CSV file upload UI (drag & drop)
- [x] Excel (.xlsx) file upload support
- [x] Parse uploaded file using `csv-parse` and `xlsx`
- [x] Map columns (email, first name, last name, etc.)
- [x] Preview contacts before confirming import
- [x] Handle errors (missing email column, invalid emails)

#### Contact List Management
- [x] Create / rename / delete contact lists
- [x] View all contacts in a list (paginated table)
- [x] Search and filter contacts
- [x] Manual contact add (single entry form)
- [x] Delete individual contacts
- [x] Export contacts back to CSV

#### Data Integrity
- [x] Validate email format on import
- [x] Detect and skip duplicate emails within the same list
- [x] Show import summary (total imported, skipped, errors)

#### Unsubscribe Handling
- [x] Mark contacts as unsubscribed
- [ ] Suppress unsubscribed contacts from future sends automatically (Phase 4)
- [x] View unsubscribed contacts list (filtered view)

### Deliverables
- Users can upload CSV/Excel files and manage contact lists
- Invalid and duplicate entries handled gracefully
- Unsubscribe suppression working

---

## Phase 3 — Campaign Builder
**Duration:** Week 4–5
**Goal:** Let users create, design, and save email campaigns.

### Tasks

#### Template System
- [ ] Build 5–8 pre-built email templates (welcome, offer, newsletter, announcement, follow-up)
- [ ] Template browse page with thumbnails
- [ ] Save custom templates for reuse
- [ ] Duplicate existing templates

#### Email Editor
- [ ] Block-based email editor (or integrate Unlayer editor)
- [ ] Edit subject line
- [ ] Edit sender name and reply-to email
- [ ] Personalization tags support: `{{first_name}}`, `{{email}}`, `{{company}}`
- [ ] Plain text version toggle
- [ ] Image upload support (Cloudinary or S3)

#### Campaign Management
- [ ] Create new campaign (name, subject, template, contact list)
- [ ] Save as draft
- [ ] Edit existing draft
- [ ] Duplicate campaigns
- [ ] Delete campaigns
- [ ] Campaign list page with status filters (draft, scheduled, sent)

#### Preview & Testing
- [ ] Desktop and mobile preview toggle
- [ ] Send test email to own address before going live
- [ ] Validate: subject line not empty, list selected, sender set

### Deliverables
- Users can build emails using pre-made or custom templates
- Personalization tags work in preview
- Campaigns can be saved as drafts and edited

---

## Phase 4 — Sending Engine
**Duration:** Week 6
**Goal:** Actually send emails in bulk — reliably, at scale, without blocking the app.

### Tasks

#### Email Provider Integration
- [ ] Integrate SendGrid API (`@sendgrid/mail`)
- [ ] Integrate Amazon SES as backup/alternative
- [ ] Abstract sending logic into a unified `email.ts` service
- [ ] Allow users to connect their own SMTP in settings (optional)

#### Background Job Queue
- [ ] Set up Redis (Upstash for serverless)
- [ ] Configure BullMQ for email job queue
- [ ] Create email worker that processes jobs in batches
- [ ] Rate limiting per job (respect provider limits)
- [ ] Retry logic for failed sends

#### Campaign Sending Flow
- [ ] "Send Now" button triggers campaign dispatch
- [ ] Schedule send for a future date/time
- [ ] Cancel scheduled campaign
- [ ] Sending progress indicator (e.g., 450 / 2000 sent)
- [ ] Per-recipient status tracking in MongoDB (delivered, failed, bounced)

#### Compliance (Legal Requirements)
- [ ] Auto-inject unsubscribe link in every email footer
- [ ] Auto-inject sender physical address in footer
- [ ] Handle unsubscribe webhook from SendGrid (auto-suppress contact)
- [ ] Handle bounce webhook (mark contact as bounced in MongoDB)

### Deliverables
- Bulk emails send reliably in background without crashing the app
- Scheduled sending works
- Unsubscribe and bounce webhooks handled automatically

---

## Phase 5 — Analytics
**Duration:** Week 7
**Goal:** Give users meaningful data about how their campaigns perform.

### Tasks

#### Tracking Setup
- [ ] Open rate: embed invisible 1x1 tracking pixel in emails
- [ ] Click rate: wrap all links through a redirect tracking URL (`/track/click?id=...`)
- [ ] Record open and click events in MongoDB (CampaignRecipient collection)

#### Campaign Analytics Page
- [ ] Per-campaign stats: sent, delivered, opened, clicked, bounced, unsubscribed
- [ ] Timeline chart: opens/clicks over 24–48 hours after send
- [ ] Top clicked links list
- [ ] Per-recipient status table (with search)

#### Dashboard Overview
- [ ] Total emails sent (all time and this month)
- [ ] Average open rate across all campaigns
- [ ] Average click-through rate
- [ ] Recent campaigns list with quick stats
- [ ] Charts using Recharts

#### Export
- [ ] Export campaign report as CSV
- [ ] Export recipient status list

### Deliverables
- Open and click tracking working end-to-end
- Campaign analytics page fully populated
- Dashboard overview stats live

---

## Phase 6 — Polish & Launch
**Duration:** Week 8
**Goal:** Make the product ready for real users — billing, performance, compliance, and deployment.

### Tasks

#### Billing & Plans
- [ ] Integrate Stripe for subscriptions
- [ ] Free, Starter, Growth, Pro plan tiers
- [ ] Usage limits enforced per plan (contacts, emails/month)
- [ ] Upgrade/downgrade flow
- [ ] Billing portal (manage subscription, view invoices)

#### Landing Page
- [ ] Hero section with value proposition
- [ ] Features section
- [ ] Pricing table
- [ ] Testimonials / social proof (placeholder)
- [ ] CTA: Sign up for free

#### Performance & Security
- [ ] Implement API rate limiting
- [ ] Add input sanitization and XSS protection
- [ ] Optimize MongoDB queries (add indexes)
- [ ] Image optimization (Next.js Image component)
- [ ] Lazy loading for large contact tables

#### Testing
- [ ] Unit tests for core utilities (email parsing, validation)
- [ ] Integration tests for API routes
- [ ] End-to-end test: upload contacts → create campaign → send → check analytics

#### Deployment
- [ ] Deploy to Vercel (production)
- [ ] Set up MongoDB Atlas (production cluster)
- [ ] Set up environment variables securely
- [ ] Configure custom domain
- [ ] Set up error monitoring (Sentry)
- [ ] Set up uptime monitoring

#### Final Checks
- [ ] GDPR compliance review
- [ ] CAN-SPAM compliance review
- [ ] Cross-browser testing
- [ ] Mobile responsiveness audit
- [ ] Accessibility audit (a11y)

### Deliverables
- Stripe billing live and enforcing plan limits
- App deployed to production with custom domain
- Error monitoring and uptime alerts configured
- Ready for real users 🚀

---

## 📊 Total Timeline Summary

```
Week 1  ██████████  Foundation (Part 1)
Week 2  ██████████  Foundation (Part 2)
Week 3  ██████████  Contact Management
Week 4  ██████████  Campaign Builder (Part 1)
Week 5  ██████████  Campaign Builder (Part 2)
Week 6  ██████████  Sending Engine
Week 7  ██████████  Analytics
Week 8  ██████████  Polish & Launch
```

**Total estimated time:** 8 weeks for a fully functional MVP ready for paying users.

---

## 🧱 Phase Dependencies

```
Phase 1 (Auth + MongoDB)
    └── Phase 2 (Contacts)
            └── Phase 3 (Campaign Builder)
                    └── Phase 4 (Sending Engine)
                            └── Phase 5 (Analytics)
                                    └── Phase 6 (Launch)
```

Each phase builds directly on the previous one. Do not skip or reorder phases.

---

*Document created: February 2026*
*Project: BulkMailer — Development Phases Roadmap*
*Database: MongoDB + Mongoose (migrated from PostgreSQL + Prisma)*
