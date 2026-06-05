-- Imported drafts may be incomplete so authors can classify them later.
-- Published questions remain fully classified at the database boundary.

alter table questions
  alter column career_id drop not null,
  alter column subject_id drop not null,
  alter column difficulty drop not null;

alter table questions
  add constraint questions_published_classification_complete
  check (
    status <> 'published'
    or (
      career_id is not null
      and subject_id is not null
      and difficulty is not null
    )
  );
