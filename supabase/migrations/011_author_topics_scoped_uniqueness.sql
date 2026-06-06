-- 011_author_topics_scoped_uniqueness.sql
-- Drop global tag uniqueness constraints, split multi-discipline tags, and enforce scoped uniqueness.

-- 1. Drop existing global unique constraints
alter table public.tags drop constraint if exists tags_name_key;
alter table public.tags drop constraint if exists tags_slug_key;

-- 2. Split tags associated with questions in multiple subjects
do $$
declare
  r_tag record;
  r_sub record;
  new_tag_id uuid;
begin
  for r_tag in
    select t.id, t.name, t.slug, t.created_by_kind, t.created_by_author_id
    from public.tags t
    join public.question_tags qt on qt.tag_id = t.id
    join public.questions q on q.id = qt.question_id
    where q.subject_id is not null
    group by t.id, t.name, t.slug, t.created_by_kind, t.created_by_author_id
    having count(distinct q.subject_id) > 1
  loop
    declare
      first_subject_id uuid := null;
      sub_count int := 0;
    begin
      for r_sub in
        select distinct q.subject_id
        from public.question_tags qt
        join public.questions q on q.id = qt.question_id
        where qt.tag_id = r_tag.id and q.subject_id is not null
      loop
        sub_count := sub_count + 1;
        if sub_count = 1 then
          first_subject_id := r_sub.subject_id;
          update public.tags
          set subject_id = first_subject_id
          where id = r_tag.id;
        else
          new_tag_id := gen_random_uuid();
          insert into public.tags (id, name, slug, subject_id, created_by_kind, created_by_author_id)
          values (new_tag_id, r_tag.name, r_tag.slug, r_sub.subject_id, r_tag.created_by_kind, r_tag.created_by_author_id);

          update public.question_tags qt
          set tag_id = new_tag_id
          from public.questions q
          where qt.question_id = q.id
            and qt.tag_id = r_tag.id
            and q.subject_id = r_sub.subject_id;
        end if;
      end loop;
    end;
  end loop;
end $$;

-- 3. Create scoped uniqueness constraints/indexes
create unique index unique_tag_subject_slug 
  on public.tags (subject_id, slug) 
  where subject_id is not null;

create unique index unique_tag_legacy_slug 
  on public.tags (slug) 
  where subject_id is null;
