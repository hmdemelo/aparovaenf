-- 004_feed.sql
-- Feed support: random next-question selection kept in the database so the
-- client never loads large candidate lists (performance decision in research.md).

-- Returns a random published question id for the given career, optionally
-- filtered by board, excluding a set of already-answered question ids.
-- SECURITY INVOKER (default): runs under the caller's RLS, and published
-- questions are readable by everyone, so anonymous trial sessions can call it.
create or replace function next_feed_question(
  p_career_id uuid,
  p_board_id uuid default null,
  p_exclude uuid[] default '{}'
)
returns uuid
language sql
stable
as $$
  select q.id
  from questions q
  where q.status = 'published'
    and q.career_id = p_career_id
    and (p_board_id is null or q.board_id = p_board_id)
    and not (q.id = any (p_exclude))
  order by random()
  limit 1;
$$;
