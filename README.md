# aprovaenf 🚀

A full-stack, responsive web application for practicing healthcare contest (*concursos da saúde*) questions, designed with a mobile-first, vertical swipe interface inspired by modern content feeds.

## Technical Stack

- **Core**: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security, Supabase Auth).
- **Payment & Subscriptions**: Abacate Pay integration.
- **Verification**: Vitest (Unit & Integration), Playwright (E2E), Axe (Accessibility testing).
- **Deployment**: Vercel (Frontend & Serverless Handlers) and Supabase Pro (Production Database).

---

## Current Application Surface

- **Public landing**: career selection, trial explanation, pricing, and direct entry into the question feed. The current landing does not show an author/testimonial section.
- **Student feed**: mobile-first question flow with answer feedback, required general comment, optional selected-alternative comment, favorites for subscribers, and paywall after trial exhaustion.
- **Author panel**: question list, author metrics, question creation/editing, account popup, password change, and logout.
- **Admin panel**: dashboard metrics, users/questions overview, subject management, author provisioning, author profile editing, question unpublishing, bulk question import (scoped to authors via CSV upload with row-level validation), template downloading, and logout.
- **Desktop/tablet shell**: admin and author panels use a centered beige frame with a 35px browser margin, fixed 200px left sidebar, logout at the sidebar footer, and a white right content panel with independent vertical scrolling.
- **Admin author management**: `/admin/authors` uses dialogs for both creating new authors and editing author profile fields. The page intentionally has no fixed top form.

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: Current LTS version (v20+ recommended).
- **Docker**: Required to run Supabase locally.
- **Supabase CLI**: Installed globally or run via `npx`.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Variables
Copy the environment variables template and configure it:
```bash
cp .env.example .env.local
```
Configure the variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (use your local Supabase credentials).
- `SUPABASE_SERVICE_ROLE_KEY` (used server-side for admin tasks; keep strictly secure).
- `NEXT_PUBLIC_APP_URL` (set to `http://localhost:3000` locally).
- `ABACATE_PAY_API_KEY` (sandbox/production token from Abacate Pay dashboard).
- `ABACATE_PAY_WEBHOOK_SECRET` (webhook validation key).

### 4. Supabase Local Instance
Start the local Supabase environment (launches PostgreSQL, Auth, and Studio):
```bash
npx supabase start
```
This automatically applies all versioned migrations located in `supabase/migrations/` and seeds the database using `supabase/seed.sql`.

### 5. Generate TypeScript Types
If you modify database schemas in `supabase/migrations/`, regenerate TypeScript definitions:
```bash
npx supabase gen types typescript --local > lib/db/database.types.ts
```

### 6. Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in the browser.

---

## Verification & Testing

Verify that all parts of the application function correctly before committing or deploying.

### Linting & Formatting
```bash
npm run lint
```

### TypeScript Compilation (Type checking)
```bash
npm run typecheck
```

### Run Unit Tests (Vitest)
Executes rapid unit and business-logic tests (trial limits, validations, permissions) without database requirements:
```bash
npm run test
```

### Run Integration Tests (Vitest + Local DB)
Runs integration suites (question fetching, repository queries, checkouts, webhook idempotency) against the running local Supabase:
```bash
# Requires "npx supabase start" to be running
npm run test:integration
```

### Run End-to-End Tests (Playwright)
Validates critical user flows (anonymous trial to signup, paywall blocking, subscriber favoriting, author question publication, and admin provisioning):
```bash
# Requires "npm run dev" and "npx supabase start" to be running
npm run test:e2e
```

### Run Production Build
Ensure that Next.js packages, bundles, and optimizes routes successfully:
```bash
npm run build
```

---

## Production Deployment Guide

Follow this systematic sequence to launch **aprovaenf** in production:

### Step 1: Set Up Supabase Pro
1. Create a new organization and project on [Supabase Pro](https://supabase.com).
2. Go to Project Settings -> Database -> Connection string (URI) to get your transaction connection string.
3. Apply all database migrations to your production database using the Supabase CLI:
   ```bash
   npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
   ```
4. Seed lookup data (Careers, Boards, Subjects) using SQL or direct migration scripts. Keep student/author sandbox data out of production.

### Step 2: Configure Abacate Pay
1. Log in to your [Abacate Pay](https://abacatepay.com) developer panel.
2. Create two recurring or standard billing plans matching the product spec:
   - **Monthly**: R$ 29,90
   - **Annual**: R$ 287,00 (supports installment parceling)
3. Add a Webhook Endpoint pointing to your production site:
   ```text
   https://[YOUR-PRODUCTION-URL]/api/webhooks/abacate-pay
   ```
4. Copy the webhook secret validation key and api token.

### Step 3: Deploy on Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Set the framework to **Next.js** (detected automatically).
3. Configure the **Environment Variables** in Vercel settings (select Production/Preview environments):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Select **"Sensitive"** and restrict it to production server routes)
   - `NEXT_PUBLIC_APP_URL` (Your production domain, e.g., `https://aprovaenf.com.br`)
   - `ABACATE_PAY_API_KEY` (Production secret api token)
   - `ABACATE_PAY_WEBHOOK_SECRET` (Webhook signature validation secret)
4. Trigger the deployment. Vercel will compile, typecheck, lint, and publish the application.
5. Point your custom domain and ensure HTTPS is active.

### Step 4: Post-Deploy Smoke Test
Run through the primary user loop in production:
1. Access the landing page anonymously and answer exactly 2 questions.
2. Verify that the signup gate forces account creation on the 3rd question.
3. Complete registration, answer 3 more questions, and confirm the paywall renders.
4. Test a payment link redirect to Abacate Pay.
5. In the admin dashboard, verify that telemetry events are tracking successfully in Supabase logs.
