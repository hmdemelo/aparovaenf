# Implementation Plan: Admin Panel User and Question Management Separation

**Branch**: `004-admin-panel-refactor` | **Date**: 2026-06-03 | **Spec**: [spec.md](file:///Users/hugo/projetos/aprovaenf/specs/004-admin-panel-refactor/spec.md)

## Summary
Refactor the admin panel route `/admin` to show only general metrics (Visão geral and Funil), and delegate User and Question management into separate subpages: `/admin/users` and `/admin/questions`. Introduce a shared, collapsible layout sidebar across all admin subpages to avoid duplicate structures and keep the UI cohesive.

---

## Technical Context

- **Language/Version**: TypeScript, Next.js 15+ (App Router)
- **Styling**: Vanilla CSS, tailwindcss config integration (if any), custom classes (`aprova-*` variables in `globals.css`)
- **Testing**: Vitest (integration), Playwright (E2E)

---

## Constitution Check

1. **Mobile-First Learning Loop**: Non student-facing pages, but must render properly and shrink sidebar to only icons on narrow screens.
2. **Secure Data Boundaries**:
   - Authentication check MUST be handled at the shared layout level `/app/(admin)/admin/layout.tsx` using `resolveAdminContext()`.
   - Protect all pages underneath `/admin` from non-admin roles.
3. **Test-First Delivery**:
   - Update `tests/e2e/admin-moderation.spec.ts` to navigate to `/admin/questions` to verify unpublishing.
   - Run typecheck, lint, and full test suite to guarantee zero regression.

---

## Proposed Changes

### 1. Components & Shared Layout

#### [NEW] [admin-sidebar.tsx](file:///Users/hugo/projetos/aprovaenf/components/admin-sidebar.tsx)
Create a retractable admin sidebar component similar to `AuthorSidebar`.
- Navigation items:
  - Painel: `/admin` (icon: `BarChart3`)
  - Usuários: `/admin/users` (icon: `Users`)
  - Questões: `/admin/questions` (icon: `BookOpen`)
  - Autores: `/admin/authors` (icon: `PenTool`)
  - Assuntos: `/admin/subjects` (icon: `Layers`)
- Collapsed state stored in localStorage (`aprovaenf:admin-sidebar-collapsed`).

#### [NEW] [layout.tsx](file:///Users/hugo/projetos/aprovaenf/app/(admin)/admin/layout.tsx)
Create the shared admin layout file.
- Perform admin session/role check:
  ```typescript
  const ctx = await resolveAdminContext()
  if (!ctx.ok) redirect('/login?next=/admin')
  ```
- Render layout shell with margin frame:
  ```tsx
  <main className="aprova-frame-main min-h-screen px-4 py-6 sm:py-8">
    <div className="aprova-admin-shell mx-auto flex w-full max-w-[980px] max-md:flex-col">
      <AdminSidebar />
      <section className="aprova-content-panel min-w-0 flex-1 bg-white px-5 py-6 sm:px-[30px]">
        {children}
      </section>
    </div>
  </main>
  ```

---

### 2. Admin Pages

#### [MODIFY] [page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(admin)/admin/page.tsx)
- Remove duplicate aside/nav structure.
- Remove user list table and query from DB (`listUsers`).
- Remove questions table and query from DB (`listAllQuestions`).
- Render only "Visão geral" and "Funil" metrics.

#### [NEW] [page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(admin)/admin/users/page.tsx)
Create the users management subpage.
- Fetch users via `listUsers(ctx.db)`.
- Render the table of users (extracted from dashboard page).

#### [NEW] [page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(admin)/admin/questions/page.tsx)
Create the questions management subpage.
- Fetch questions via `listAllQuestions(ctx.db)`.
- Render the table of questions with `UnpublishButton` (extracted from dashboard page).

#### [MODIFY] [page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(admin)/admin/authors/page.tsx)
- Remove layout wrapper (main container, aside, and content section).
- Keep only page content (`<AdminAuthorsManager authors={authors} />`).

#### [MODIFY] [page.tsx](file:///Users/hugo/projetos/aprovaenf/app/(admin)/admin/subjects/page.tsx)
- Remove layout wrapper.
- Keep only page content (CreateSubjectForm and list of subjects).

---

### 3. E2E Tests

#### [MODIFY] [admin-moderation.spec.ts](file:///Users/hugo/projetos/aprovaenf/tests/e2e/admin-moderation.spec.ts)
- Update login destination to `/admin/questions` (or navigate there after logging in).
- Keep the moderation assertions as is.

---

## Verification Plan

### Automated Tests
- Run `npm run test:integration` to check integration tests.
- Run `npx playwright test` to run the E2E suites.
- Run `npm run typecheck` and `npm run lint`.

### Manual Verification
- Log in as admin.
- Verify dashboard `/admin` is clean.
- Click through all navigation items (Usuários, Questões, Autores, Assuntos) and confirm paths and views.
- Try collapsing/expanding the sidebar and check persistence across reloads.
