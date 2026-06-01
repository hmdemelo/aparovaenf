# Quickstart Validation: aprovaenf MVP

This quickstart describes how the MVP should be validated once implementation
starts. It is not a setup guide for the current static prototype.

## 1. Local Setup

1. Install dependencies.
2. Copy `.env.example` to `.env.local`.
3. Start Supabase local.
4. Run database migrations.
5. Seed careers, boards, subjects, authors, and sample questions.
6. Start the Next.js dev server.

## 2. Quality Gates

Run before every merge:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

## 3. Critical Manual Smoke

### Student Trial

1. Open the landing page.
2. Select Enfermagem.
3. Answer 2 questions without signup.
4. Confirm signup is required.
5. Create account.
6. Answer 3 more questions.
7. Confirm paywall appears.

### Author

1. Log in as author.
2. Create question with at least two alternatives.
3. Try to publish without general comment and confirm it fails.
4. Add general comment.
5. Publish and confirm it can appear in feed.

### Billing

1. Reach paywall.
2. Start monthly checkout.
3. Start annual checkout.
4. Simulate webhook.
5. Confirm subscription unlocks feed.

### Subscriber Features

1. Log in as active subscriber.
2. Favorite a question.
3. Confirm favorite persists.
4. Answer incorrectly.
5. Confirm error history includes the question.

### Admin

1. Log in as admin.
2. View users and subscription status.
3. View questions.
4. Unpublish a question.
5. Confirm it no longer appears in feed.

## 4. Production Readiness

- Supabase Pro production project configured.
- Vercel production environment variables configured.
- Abacate Pay plans and webhook configured.
- Terms and privacy pages published.
- Backups active.
- Vercel logs and analytics active.
- Product events recording key funnel actions.
