# 📧 BulkMailer — Bulk Email Marketing Platform
### Project Idea & Planning Document

---

## 💡 Project Overview

**BulkMailer** is a web-based bulk email marketing platform that allows businesses and individuals to upload contact lists and send mass emails for marketing, promotions, announcements, and informational purposes — all using their own email or a configured sending service.

Think of it as a **simplified, affordable alternative to Mailchimp** — built for small businesses, local entrepreneurs, and agencies who want a clean, easy-to-use tool without the complexity or high cost of enterprise solutions.

---

## 🎯 Problem It Solves

- Small businesses struggle with expensive email tools like Mailchimp or HubSpot
- Non-technical users find complex platforms overwhelming
- Local businesses need a simple: **upload list → pick template → send** workflow
- Agencies want a white-label tool they can offer to their own clients

---

## 👤 Target Users

- Small and medium businesses (SMBs)
- Local shops, restaurants, clinics, salons
- Digital marketing agencies
- E-commerce store owners
- Event organizers
- Freelancers managing client campaigns

---

## ✅ Core Features (MVP)

### 1. Authentication
- Sign up / Login with email & password
- Google OAuth login
- Role-based access: Admin, Member

### 2. Contact Management
- Upload contacts via CSV or Excel file
- Manual contact entry
- View, search, filter, and delete contacts
- Group contacts into **Lists / Audiences**
- Detect and remove duplicate emails automatically

### 3. Email Campaign Builder
- Drag-and-drop email template editor (or block-based)
- Pre-built customizable templates (welcome, offer, newsletter, announcement)
- Personalization tags: `{{first_name}}`, `{{company}}`, etc.
- Plain text fallback option
- Preview email before sending (desktop & mobile view)

### 4. Campaign Sending
- Send immediately or **schedule for later**
- Select target contact list
- Set sender name & reply-to address
- Integration with sending services: **SendGrid / Amazon SES / Mailgun**
- Batch sending to avoid spam filters

### 5. Analytics Dashboard
- Open rate
- Click-through rate (CTR)
- Bounce rate
- Unsubscribe rate
- Delivery status per recipient
- Campaign comparison charts

### 6. Compliance & Legal
- Auto-inject **Unsubscribe** link in every email (CAN-SPAM / GDPR requirement)
- Manage unsubscribed contacts (suppress from future sends)
- Sender information footer (required by law)
- Double opt-in option for new subscribers

---

## 🚀 Future Features (Post-MVP)

- A/B testing (test subject lines or content)
- Email automation sequences (drip campaigns)
- Landing page / sign-up form builder
- SMTP integration (use their own email server)
- White-label mode for agencies
- Team collaboration & workspaces
- AI subject line generator
- Webhook support for integrations
- API access for developers

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Full-stack React framework, SSR & SSG |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS v4** | Utility-first styling, rapid UI development |
| **React Hook Form + Zod** | Form handling and validation |
| **Zustand** | Lightweight client state management |
| **TanStack Query** | Server state, caching, background refetching |

### Backend (Next.js API Routes / Server Actions)
| Technology | Purpose |
|---|---|
| **Next.js API Routes** | Backend endpoints inside the same project |
| **Mongoose** | MongoDB ODM for schema definition and queries |
| **MongoDB** | Primary database (hosted on MongoDB Atlas) |
| **NextAuth.js v4** | Authentication (credentials + Google OAuth, JWT strategy) |
| **BullMQ + Redis** | Background job queue for bulk email sending |
| **csv-parse** | Parse uploaded CSV contact files |
| **xlsx** | Parse uploaded Excel contact files |

### Email Sending
| Service | Role |
|---|---|
| **SendGrid** | Primary email delivery API (free tier: 100/day) |
| **Amazon SES** | Scalable low-cost alternative ($0.10 per 1000 emails) |
| **Nodemailer** | SMTP fallback / custom server support |

### Infrastructure & Deployment
| Technology | Purpose |
|---|---|
| **Vercel** | Frontend + API deployment (Next.js native) |
| **MongoDB Atlas** | Managed MongoDB database (free tier available) |
| **Upstash Redis** | Serverless Redis for job queues and caching |
| **Cloudinary / S3** | Image uploads (email assets) |
| **Resend** | Transactional emails (password reset, notifications) |

---

## 🗂️ Database Schema (MongoDB Collections)

```
users
  - _id, name, email, password (hashed), image, plan, emailVerified, createdAt, updatedAt

workspaces
  - _id, name, ownerId (ref: users), createdAt, updatedAt

workspaceMembers
  - _id, userId (ref: users), workspaceId (ref: workspaces), role (OWNER/ADMIN/MEMBER), joinedAt

contactlists
  - _id, name, workspaceId (ref: workspaces), contactCount, createdAt, updatedAt

contacts
  - _id, email, firstName, lastName, company, phone, listId (ref: contactlists), status (ACTIVE/UNSUBSCRIBED/BOUNCED), createdAt, updatedAt
  - Index: { email, listId } unique

campaigns
  - _id, name, subject, htmlContent, textContent, fromName, fromEmail, replyTo
  - status (DRAFT/SCHEDULED/SENDING/SENT/CANCELLED), scheduledAt, sentAt
  - workspaceId (ref: workspaces), templateId (ref: templates), recipientListId
  - Analytics: totalRecipients, sentCount, openCount, clickCount, bounceCount, unsubscribeCount
  - createdAt, updatedAt

campaignrecipients
  - _id, campaignId (ref: campaigns), contactId (ref: contacts), email
  - status (PENDING/DELIVERED/OPENED/CLICKED/BOUNCED/UNSUBSCRIBED/FAILED)
  - openedAt, clickedAt, bouncedAt, createdAt, updatedAt
  - Index: { campaignId, contactId } unique

templates
  - _id, name, description, htmlContent, thumbnail, workspaceId (ref: workspaces), isGlobal, createdAt, updatedAt
```

---

## 🖥️ Pages & Routes

```
/                        → Landing page (marketing)
/login                   → Login page
/signup                  → Sign up page

/dashboard               → Overview stats
/dashboard/contacts      → Contact lists management
/dashboard/contacts/upload → Upload CSV/Excel
/dashboard/campaigns     → All campaigns
/dashboard/campaigns/new → Create new campaign
/dashboard/campaigns/[id] → Campaign details & analytics
/dashboard/templates     → Browse & edit templates
/dashboard/settings      → Account, billing, SMTP settings
```

---

## 📐 Project Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── contacts/
│   │   ├── campaigns/
│   │   ├── templates/
│   │   └── settings/
│   └── api/
│       ├── auth/
│       ├── contacts/
│       ├── campaigns/
│       └── email/
├── components/
│   ├── layout/          (Sidebar, Topbar)
│   ├── auth/            (LoginForm, SignupForm)
│   ├── dashboard/
│   ├── campaigns/
│   └── contacts/
├── lib/
│   ├── db.ts            (Mongoose connection singleton)
│   ├── auth.ts          (NextAuth config — JWT strategy)
│   ├── email.ts         (SendGrid/SES helper)
│   ├── queue.ts         (BullMQ setup)
│   └── validations/
├── models/
│   ├── User.ts          (Mongoose User model)
│   ├── Workspace.ts     (Workspace + WorkspaceMember models)
│   ├── Contact.ts       (ContactList + Contact models)
│   ├── Campaign.ts      (Campaign + CampaignRecipient models)
│   └── Template.ts      (Template model)
├── types/
└── public/
```

---

## 🗓️ Development Phases

### Phase 1 — Foundation (Week 1–2) ✅ IN PROGRESS
- Project setup: Next.js 16, TypeScript, Tailwind CSS v4
- MongoDB + Mongoose schema design
- Authentication system (NextAuth.js v4, JWT strategy)
- Basic dashboard layout & navigation

### Phase 2 — Contact Management (Week 3)
- CSV/Excel upload and parsing
- Contact list CRUD operations
- Duplicate detection
- Unsubscribe management

### Phase 3 — Campaign Builder (Week 4–5)
- Template system (pre-built templates)
- Basic email editor (HTML or block-based)
- Personalization tag support
- Campaign draft saving

### Phase 4 — Sending Engine (Week 6)
- SendGrid API integration
- Background job queue with BullMQ + Redis
- Scheduled sending
- Bounce & unsubscribe webhook handling

### Phase 5 — Analytics (Week 7)
- Tracking pixel for open rates
- Click tracking via redirect URLs
- Dashboard analytics charts (recharts)
- Per-campaign reporting

### Phase 6 — Polish & Launch (Week 8)
- Billing integration (Stripe)
- Landing page
- Email compliance (unsubscribe, footer)
- Performance optimization
- Testing & deployment to Vercel

---

## 💰 Monetization Plan

| Plan | Price | Contacts | Emails/Month |
|---|---|---|---|
| **Free** | $0 | 500 | 1,000 |
| **Starter** | $9/mo | 2,500 | 15,000 |
| **Growth** | $29/mo | 10,000 | 100,000 |
| **Pro** | $79/mo | 50,000 | Unlimited |

Additional revenue streams:
- Premium template packs
- Agency/White-label licensing
- Pay-as-you-go email credits

---

## ⚠️ Key Risks & How to Handle Them

| Risk | Solution |
|---|---|
| Emails landing in spam | Use SendGrid/SES, warm up IPs, follow best practices |
| Legal compliance issues | Always include unsubscribe + sender info |
| Abuse (spam users) | Email verification, rate limits, abuse detection |
| Scaling costs | Start with SES (very cheap at scale) |
| Competition from Mailchimp | Focus on simplicity + price + local market |

---

## 📦 Key Dependencies (package.json highlights)

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "mongoose": "^8.0.0",
    "mongodb": "^6.0.0",
    "next-auth": "^4.0.0",
    "bullmq": "^4.0.0",
    "ioredis": "^5.0.0",
    "@sendgrid/mail": "^7.0.0",
    "csv-parse": "^5.0.0",
    "xlsx": "^0.18.0",
    "zod": "^3.0.0",
    "react-hook-form": "^7.0.0",
    "zustand": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.0.0",
    "stripe": "^14.0.0"
  }
}
```

---

*Document created: February 2026*
*Project: BulkMailer — Bulk Email Marketing Platform*
*Database: MongoDB + Mongoose (migrated from PostgreSQL + Prisma)*
