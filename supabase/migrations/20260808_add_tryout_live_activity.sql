alter table public.tryout_attempts
  add column if not exists current_question_id uuid references public.tryout_questions(id) on delete set null,
  add column if not exists current_question_order integer,
  add column if not exists last_activity_at timestamptz;

alter table public.tryout_attempts
  drop constraint if exists tryout_attempts_current_question_order_check;

alter table public.tryout_attempts
  add constraint tryout_attempts_current_question_order_check
  check (current_question_order is null or current_question_order > 0);

create index if not exists idx_tryout_attempts_live_activity
  on public.tryout_attempts (status, last_activity_at desc)
  where status = 'in_progress';

