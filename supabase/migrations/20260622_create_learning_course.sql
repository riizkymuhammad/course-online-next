create table if not exists public.learning_course (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  course_module_id uuid not null references public.course_modules(id) on delete cascade,
  status text not null default 'reading'::text,
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_course_user_module_unique unique (user_id, course_module_id),
  constraint check_learning_course_status check (status = any (array['reading'::text, 'complete'::text]))
);

create index if not exists idx_learning_course_user_course
  on public.learning_course (user_id, course_id, last_opened_at desc);

create index if not exists idx_learning_course_module
  on public.learning_course (course_module_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_learning_course_updated_at') then
    create trigger set_learning_course_updated_at
    before update on public.learning_course
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;
end $$;

alter table public.learning_course enable row level security;

drop policy if exists "Users can view own learning course" on public.learning_course;
drop policy if exists "Users can insert own learning course" on public.learning_course;
drop policy if exists "Users can update own learning course" on public.learning_course;
drop policy if exists "Users can delete own learning course" on public.learning_course;

create policy "Users can view own learning course"
on public.learning_course
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own learning course"
on public.learning_course
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own learning course"
on public.learning_course
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own learning course"
on public.learning_course
for delete
to authenticated
using (auth.uid() = user_id);
