# Feature Specification: Admin Panel User and Question Management Separation

**Feature Branch**: `004-admin-panel-refactor`  
**Created**: 2026-06-03  
**Status**: Completed  
**Input**: User requirement: "inclua gestao de usuarios e questoes na interface do admin tambem. no painel inicial deixe somente as informações gerais da plataforma(abstraia sobre quais outras podem ser incluidas)"

## User Scenarios & Testing

### User Story 1 - High-level Admin Dashboard (Priority: P1)

As an admin, I want to access `/admin` and view only the general information, metrics, and funnel data of the platform so that I get a clear, clutter-free summary of operational metrics.

**Why this priority**: Core dashboard page simplified for high-level monitoring.

**Independent Test**: An admin logs in and opens `/admin`. They should see the "Visão geral" metrics and "Funil" metrics cards. The user listing and question moderation lists must not be visible on this page.

**Acceptance Scenarios**:
1. **Given** an authenticated admin is on `/admin`, **When** the page renders, **Then** they see cards for Users, Authors, Active Subscriptions, and Published Questions.
2. **Given** an admin is on `/admin`, **When** the page renders, **Then** the conversion funnel steps (Landing, Career Selected, etc.) are displayed.
3. **Given** the dashboard is loaded, **When** they inspect the page, **Then** no user list table or question list table is loaded or displayed.

---

### User Story 2 - User Management Page (Priority: P1)

As an admin, I want to access a dedicated User Management page at `/admin/users` to view and audit all registered users, their roles, and subscription statuses.

**Why this priority**: Essential administrative capability split out for clarity.

**Independent Test**: An admin clicks on "Usuários" in the sidebar navigation or goes to `/admin/users`, seeing the table of all registered users with email, profile role, and subscription details.

**Acceptance Scenarios**:
1. **Given** an admin is on `/admin/users`, **When** the page renders, **Then** they see a table of users sorted by creation date.
2. **Given** the user table, **When** they view rows, **Then** they see email, role (e.g. `student`, `author`, `admin`), and current subscription details.

---

### User Story 3 - Question Management Page (Priority: P1)

As an admin, I want to moderate questions in a dedicated Question Management page at `/admin/questions` so that I can see all platform questions and unpublish them if necessary.

**Why this priority**: Required for curation and moderation.

**Independent Test**: An admin navigates to `/admin/questions`, locates a published question, clicks "Despublicar", and verifies the question is set to unpublished.

**Acceptance Scenarios**:
1. **Given** an admin is on `/admin/questions`, **When** the page renders, **Then** they see a list of all questions with statement, author, subject, and status.
2. **Given** a question is published, **When** the admin clicks the "Despublicar" button, **Then** the question is unpublished and the button disappears.

---

### User Story 4 - Collapsible Navigation Sidebar (Priority: P1)

As an admin, I want a consistent, retractable sidebar layout across all administrative subpages (`/admin`, `/admin/users`, `/admin/questions`, `/admin/authors`, `/admin/subjects`) to quickly toggle between sections and optimize screen space.

**Why this priority**: Consistent and premium visual design, aligned with the author panel experience.

**Independent Test**: An admin navigates through `/admin` subpages. The sidebar is visible, matches the desktop shell, and collapses to show only icons when the collapse button is clicked.

**Acceptance Scenarios**:
1. **Given** an admin is on any `/admin/*` page, **When** they look at the sidebar, **Then** the active link matches their current route.
2. **Given** the sidebar is expanded, **When** they click the collapse icon (`ChevronLeft`), **Then** it shrinks to show only icons.
3. **Given** the sidebar is collapsed, **When** they click the expand icon (`ChevronRight`), **Then** it expands to show full text labels.

## Edge Cases

- Admin accesses user/question routes directly without active session (should redirect to `/login?next=...`).
- A question statement is very long (should truncate/clamp properly in the questions table).
- Screen resized to mobile view (sidebar should collapse to a horizontal/responsive list or match standard mobile layout in authors view).

## Requirements

### Functional Requirements

- **FR-001**: The system MUST restrict access to `/admin`, `/admin/users`, `/admin/questions`, `/admin/authors`, and `/admin/subjects` to users with the `admin` role.
- **FR-002**: The admin area MUST use a shared layout file `app/(admin)/admin/layout.tsx` to handle authentication, context resolution, and sidebar layout.
- **FR-003**: The admin sidebar MUST be a client component supporting collapsible state stored in local storage (`aprovaenf:admin-sidebar-collapsed`).
- **FR-004**: The `/admin` page MUST render only metrics cards (Visão geral and Funil) and a link/button to authors management.
- **FR-005**: The `/admin/users` page MUST render the user listing table.
- **FR-006**: The `/admin/questions` page MUST render the questions table with moderation capabilities (unpublish).
- **FR-007**: The sidebar navigation MUST contain links to: Panel, Users, Questions, Authors, Subjects.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admin dashboard loads metrics in under 300ms.
- **SC-002**: Navigation between admin subpages takes under 200ms.
- **SC-003**: User and question listings render tables with up to 100 rows cleanly and responsively.
