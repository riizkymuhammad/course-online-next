create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tryout_attempts (
  id uuid primary key default gen_random_uuid(),
  tryout_id uuid not null references public.tryouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  total_questions integer not null default 0,
  answered_questions integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  unanswered_answers integer not null default 0,
  score numeric(6,2) not null default 0,
  max_score numeric(6,2) not null default 100,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tryout_attempts_status_check
    check (status in ('in_progress', 'submitted', 'graded', 'cancelled')),
  constraint tryout_attempts_total_questions_check
    check (total_questions >= 0),
  constraint tryout_attempts_answered_questions_check
    check (answered_questions >= 0),
  constraint tryout_attempts_correct_answers_check
    check (correct_answers >= 0),
  constraint tryout_attempts_wrong_answers_check
    check (wrong_answers >= 0),
  constraint tryout_attempts_unanswered_answers_check
    check (unanswered_answers >= 0),
  constraint tryout_attempts_duration_seconds_check
    check (duration_seconds is null or duration_seconds >= 0),
  constraint tryout_attempts_score_check
    check (score >= 0),
  constraint tryout_attempts_max_score_check
    check (max_score > 0)
);

create index if not exists idx_tryout_attempts_tryout_id
  on public.tryout_attempts (tryout_id);

create index if not exists idx_tryout_attempts_user_id
  on public.tryout_attempts (user_id);

create index if not exists idx_tryout_attempts_status
  on public.tryout_attempts (status);

create index if not exists idx_tryout_attempts_started_at
  on public.tryout_attempts (started_at desc);

create index if not exists idx_tryout_attempts_user_tryout
  on public.tryout_attempts (user_id, tryout_id);

create table if not exists public.tryout_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.tryout_attempts(id) on delete cascade,
  tryout_id uuid not null references public.tryouts(id) on delete cascade,
  tryout_question_id uuid not null references public.tryout_questions(id) on delete cascade,
  selected_option_id uuid references public.tryout_question_options(id) on delete set null,
  is_correct boolean,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tryout_attempt_answers_attempt_question_unique
    unique (attempt_id, tryout_question_id)
);

create index if not exists idx_tryout_attempt_answers_attempt_id
  on public.tryout_attempt_answers (attempt_id);

create index if not exists idx_tryout_attempt_answers_tryout_id
  on public.tryout_attempt_answers (tryout_id);

create index if not exists idx_tryout_attempt_answers_tryout_question_id
  on public.tryout_attempt_answers (tryout_question_id);

create index if not exists idx_tryout_attempt_answers_selected_option_id
  on public.tryout_attempt_answers (selected_option_id);

create trigger set_tryout_attempts_updated_at
before update on public.tryout_attempts
for each row
execute function public.set_current_timestamp_updated_at();

create trigger set_tryout_attempt_answers_updated_at
before update on public.tryout_attempt_answers
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.tryout_attempts enable row level security;
alter table public.tryout_attempt_answers enable row level security;

create policy "Users can view their own tryout attempts"
on public.tryout_attempts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own tryout attempts"
on public.tryout_attempts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own in-progress tryout attempts"
on public.tryout_attempts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can view their own tryout attempt answers"
on public.tryout_attempt_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.tryout_attempts ta
    where ta.id = tryout_attempt_answers.attempt_id
      and ta.user_id = auth.uid()
  )
);

create policy "Users can insert their own tryout attempt answers"
on public.tryout_attempt_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.tryout_attempts ta
    where ta.id = tryout_attempt_answers.attempt_id
      and ta.user_id = auth.uid()
      and ta.status = 'in_progress'
  )
);

create policy "Users can update their own tryout attempt answers"
on public.tryout_attempt_answers
for update
to authenticated
using (
  exists (
    select 1
    from public.tryout_attempts ta
    where ta.id = tryout_attempt_answers.attempt_id
      and ta.user_id = auth.uid()
      and ta.status = 'in_progress'
  )
)
with check (
  exists (
    select 1
    from public.tryout_attempts ta
    where ta.id = tryout_attempt_answers.attempt_id
      and ta.user_id = auth.uid()
      and ta.status = 'in_progress'
  )
);
