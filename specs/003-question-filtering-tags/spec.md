# Feature Specification: Question Filtering and Tagging

**Feature Branch**: `003-question-filtering-tags`  
**Created**: 2026-06-03  
**Status**: Draft  
**Input**: User requirement: "filtrar por tags dinâmicas cadastradas pelos autores e bancas pesquisáveis/cadastráveis inline (+ se não encontrado)"

## User Scenarios & Testing

### User Story 1 - Author creates tags dynamically (Priority: P1)

As an author editing or creating a question, I want to add dynamic tag labels (sub-subjects) so that the question is categorized with granular detail.

**Why this priority**: Core classification method.

**Independent Test**: An author opens `/author/questions/new`, types a tag "pni-2026" in the tag input, selects "Create tag: pni-2026", saves the question, and the tag persists in the database and is associated with this question.

**Acceptance Scenarios**:
1. **Given** an author is editing a question, **When** they type a tag name that already exists, **Then** the autocomplete suggests it.
2. **Given** an author is editing a question, **When** they type a new tag name and press "Create", **Then** the tag is created in the db and associated with the question.
3. **Given** an author saves the question, **When** they reload the page, **Then** all assigned tags are displayed on the question.

---

### User Story 2 - Author registers a board (banca) inline (Priority: P1)

As an author, I want to select a board (banca) for a question, and if it does not exist, quickly add it inline via a "+" button so that my flow is not interrupted.

**Why this priority**: Required for agile curation.

**Independent Test**: An author searches for "INDEC" in the board dropdown, sees no results, clicks the "+" button next to the input, registers "INDEC", and it is created and selected.

**Acceptance Scenarios**:
1. **Given** an author searches for a board that exists, **When** they type its name, **Then** the board is shown in the search results and no "+" button is displayed.
2. **Given** an author searches for a board that does not exist, **When** the query returns no matches, **Then** a "+" button is displayed next to the input.
3. **Given** the "+" button is clicked, **When** they confirm the name, **Then** the board is created in the db, selected automatically in the dropdown, and available to other authors.

---

### User Story 3 - Student filters feed by Career, Subject, Board, and Tags (Priority: P1)

As a student (or visitor), I want to filter my question feed by Career, Subject, Board, and/or Tags so that I can practice specific questions.

**Why this priority**: Core value of custom study.

**Independent Test**: A student selects "Enfermeiro(a)", filters by subject "Saúde Pública", board "FGV", and tag "imunizacao", and only gets questions matching all these parameters.

**Acceptance Scenarios**:
1. **Given** a student is on the feed, **When** they select "FGV" as the board, **Then** only FGV questions are shown.
2. **Given** a student selects a tag filter, **When** the feed updates, **Then** only questions containing that tag are served.

---

### Edge Cases

- A tag name has trailing/leading whitespace or special characters (must be cleaned and slugified).
- An author adds duplicate tags to a question (handled gracefully/prevented by UI).
- An author tries to create a board that already exists but was typed differently (slug conflict, e.g. "fgv" vs "FGV" - handle collision gracefully).
- Filtering the feed with a combination of criteria that results in zero questions (should show a friendly "No questions found" message and a reset filters button).

## Requirements

### Functional Requirements

- **FR-001**: The system MUST store dynamic tags in a `tags` table and map them to questions in `question_tags`.
- **FR-002**: Authors MUST be able to write and select multiple tags for a question in the editor.
- **FR-003**: Board select input MUST be a search/autocomplete input.
- **FR-004**: The system MUST display a "+" button next to the board search input ONLY when the query returns no results.
- **FR-005**: Clicking the board "+" button MUST create a new board in the `boards` table and automatically select it for the current question.
- **FR-006**: The student feed MUST accept optional query parameters for `subject_id`, `board_id`, and `tag_ids`.
- **FR-007**: The feed service MUST filter questions by these active selections.

### Key Entities

- **Tag**: Granular label created dynamically by authors (e.g. `name`, `slug`).
- **QuestionTag**: Join table mapping a Question to multiple Tags.
- **Board**: Reference board (existing entity, expanded with inline author creation).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Authors can add a new tag in under 5 seconds inline.
- **SC-002**: Authors can register a new board inline in under 10 seconds.
- **SC-003**: Question filtering returns results in under 300ms.
