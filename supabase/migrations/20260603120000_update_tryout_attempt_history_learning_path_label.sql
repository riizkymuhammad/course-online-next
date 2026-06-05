create or replace function public.get_tryout_attempt_history()
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
  correct_answers integer,
  wrong_answers integer,
  started_at timestamptz,
  submitted_at timestamptz,
  duration_seconds integer
)
language sql
security definer
set search_path = public, auth
as $$
  select
    ta.id as attempt_id,
    ta.user_id,
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(u.email), ''),
      'User'
    ) as user_name,
    u.email as user_email,
    t.id as tryout_id,
    t.title as tryout_title,
    coalesce(
      nullif(
        concat_ws(
          ' > ',
          nullif(trim(lp.category), ''),
          nullif(trim(lp.sub_category), ''),
          nullif(trim(lp.sub_sub_category), '')
        ),
        ''
      ),
      lp.title,
      'Tanpa Learning Path'
    ) as learning_path_title,
    ta.status,
    ta.score,
    ta.total_questions,
    ta.correct_answers,
    ta.wrong_answers,
    ta.started_at,
    ta.submitted_at,
    ta.duration_seconds
  from public.tryout_attempts ta
  inner join public.tryouts t on t.id = ta.tryout_id
  left join public.learning_paths lp on lp.id = t.learning_path_id
  inner join auth.users u on u.id = ta.user_id
  order by ta.started_at desc;
$$;

grant execute on function public.get_tryout_attempt_history() to authenticated;
