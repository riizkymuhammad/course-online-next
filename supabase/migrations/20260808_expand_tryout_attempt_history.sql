drop function if exists public.get_tryout_attempt_history();

create function public.get_tryout_attempt_history()
returns table (
  attempt_id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  tryout_id uuid,
  tryout_title text,
  learning_path_title text,
  status text,
  score numeric,
  total_questions integer,
  answered_questions integer,
  unanswered_answers integer,
  correct_answers integer,
  wrong_answers integer,
  current_question_order integer,
  last_activity_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  duration_seconds integer
)
language sql
security definer
set search_path = public, auth
as $$
  select
    ta.id,
    ta.user_id,
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(u.email), ''),
      'User'
    ),
    u.email,
    t.id,
    t.title,
    coalesce(nullif(trim(lp.title), ''), 'Tanpa Learning Path'),
    ta.status,
    ta.score,
    ta.total_questions,
    ta.answered_questions,
    ta.unanswered_answers,
    ta.correct_answers,
    ta.wrong_answers,
    ta.current_question_order,
    ta.last_activity_at,
    ta.started_at,
    ta.submitted_at,
    ta.duration_seconds
  from public.tryout_attempts ta
  inner join public.tryouts t on t.id = ta.tryout_id
  inner join auth.users u on u.id = ta.user_id
  left join public.learning_paths lp on lp.id = t.learning_path_id
  order by ta.started_at desc;
$$;

grant execute on function public.get_tryout_attempt_history() to authenticated;
