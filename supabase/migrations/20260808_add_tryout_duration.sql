alter table public.tryouts
  add column if not exists duration_minutes integer not null default 60;

alter table public.tryouts
  drop constraint if exists tryouts_duration_minutes_check;

alter table public.tryouts
  add constraint tryouts_duration_minutes_check
  check (duration_minutes between 1 and 1440);

