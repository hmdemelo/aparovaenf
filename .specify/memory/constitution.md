<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles: template placeholders -> Aprovaenf project principles
Added sections: Product & Technical Constraints; Development Workflow
Removed sections: none
Templates requiring updates: no template changes required
Follow-up TODOs: none
-->

# aprovaenf Constitution

## Core Principles

### I. Mobile-First Learning Value

Every shipped feature MUST improve the student's ability to answer health contest
questions quickly, clearly, and confidently on a phone. The first-class learning
loop is: choose context, read one question, answer, see explanation, continue.
Desktop and tablet views MUST support the same learning loop without becoming the
primary design driver.

Rationale: the product promise is a TikTok-style question feed for concursos da
saude, so implementation decisions that slow the student loop must be justified.

### II. Secure Data Boundaries

Authentication, authorization, payment state, trial limits, favorites, history,
author ownership, and admin actions MUST be enforced server-side. Row Level
Security MUST protect sensitive Supabase tables. Secrets MUST live only in
environment variables or provider secret stores. The Supabase service role and
Abacate Pay secrets MUST never reach browser code.

Rationale: the MVP handles accounts, subscriptions, learning history, and author
content; a small user base does not reduce the need for secure boundaries.

### III. Test-First Delivery

New behavior MUST be covered by tests before implementation where practical.
Critical flows require E2E coverage: trial limit, signup gate, subscription
unlock, favorite persistence, author question publishing, admin moderation, and
payment webhook activation. Coverage target is 80% across unit, integration, and
E2E tests once the application code exists.

Rationale: trial, billing, and access rules are core revenue logic and cannot be
validated by manual clicking alone.

### IV. Simple Modular Architecture

The MVP MUST be a modular full-stack monolith unless a concrete production
constraint proves otherwise. Avoid microsservices, Redis, dedicated queues,
native apps, realtime, semantic search, and IA in the first production release.
Business rules MUST live in domain modules rather than scattered through UI code.

Rationale: the first scale target is about 100 users at launch and 500 in the
next month, so clarity and speed matter more than premature distribution.

### V. Observable Operations

The system MUST record enough events and logs to explain trial conversion,
checkout starts, subscription activations, question answers, favorite attempts,
author publishing, and payment webhook results. Operational failures MUST be
visible in Vercel or Supabase logs before users need to report them.

Rationale: the initial release is a validation loop; without events, the team
cannot know where students drop, why payments fail, or which content performs.

## Product & Technical Constraints

- Product name: aprovaenf.
- Launch careers: Enfermagem and Tecnico em enfermagem.
- Medico remains second phase.
- Content type: text only in MVP.
- Trial: 2 answered questions before signup and 3 after signup.
- No subscription: no review of the 5 trial questions after trial ends.
- Favorites persist only for subscribers.
- General question comment is required.
- Alternative-level comment is optional.
- Payment provider: Abacate Pay.
- Monthly plan: R$ 29,90.
- Annual plan: R$ 287,00 with parceling allowed by Abacate Pay.
- Architecture: Next.js, TypeScript, React, Tailwind CSS, Supabase Postgres,
  Supabase Auth, Vercel, Supabase Pro.
- No separate Supabase staging project for the first deploy.
- Vercel Preview is used for build and controlled-flow validation.
- Tests that write data, alter subscriptions, or simulate payment MUST not use
  real production users while there is no isolated staging database.

## Development Workflow

1. Spec Kit artifacts define scope before implementation: constitution, spec,
   implementation plan, research, data model, contracts, quickstart, tasks.
2. ECC workflow governs execution: plan, TDD, review, security, verification.
3. For every implementation slice: write failing tests, implement the minimal
   behavior, refactor, then run build/type/lint/test gates.
4. Security review is mandatory before real authentication, payments, or public
   production launch.
5. Documentation updates travel with behavior changes when product rules change.

## Governance

This constitution supersedes ad hoc implementation preferences. Changes require
updating this file, documenting the reason, and checking affected Spec Kit
artifacts. Versioning follows semantic versioning:

- MAJOR: principle removal or incompatible governance change.
- MINOR: new principle or materially expanded required practice.
- PATCH: clarification, typo, or non-semantic refinement.

Every implementation plan MUST include a Constitution Check. Any violation must
state why the simpler or safer option is insufficient.

**Version**: 1.0.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-01
