# Tasks: Admin Panel User and Question Management Separation

- [x] T001 Create `components/admin-sidebar.tsx` with collapsible states and admin navigation links
- [x] T002 Create `app/(admin)/admin/layout.tsx` incorporating admin authentication context and sidebar component
- [x] T003 Update `app/(admin)/admin/page.tsx` to remove duplicate aside framework and database lists (users & questions), keeping only general stats
- [x] T004 Create `app/(admin)/admin/users/page.tsx` displaying the users table
- [x] T005 Create `app/(admin)/admin/questions/page.tsx` displaying the questions table with unpublish moderation capability
- [x] T006 Update `app/(admin)/admin/authors/page.tsx` to strip duplicate sidebar shell code
- [x] T007 Update `app/(admin)/admin/subjects/page.tsx` to strip duplicate sidebar shell code
- [x] T008 Update E2E test `tests/e2e/admin-moderation.spec.ts` to navigate to `/admin/questions`
- [x] T009 Verify code via `npm run typecheck`, `npm run lint`, `npm run test:integration`, and E2E tests
