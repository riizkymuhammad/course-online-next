alter table public.tryouts
  add column if not exists ai_generation_run_id text,
  add column if not exists ai_generation_error text,
  add column if not exists ai_generation_started_at timestamptz,
  add column if not exists ai_generation_completed_at timestamptz;

create index if not exists idx_tryouts_ai_generation_status
  on public.tryouts (ai_generation_status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tryout-materials',
  'tryout-materials',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
