create table if not exists public.gemini_usage_logs (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  model text not null,
  request_count integer not null default 1,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  resource_id uuid null,
  resource_title text null,
  user_id uuid null references auth.users(id) on delete set null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  constraint gemini_usage_logs_request_count_positive check (request_count > 0),
  constraint gemini_usage_logs_input_tokens_nonnegative check (input_tokens >= 0),
  constraint gemini_usage_logs_output_tokens_nonnegative check (output_tokens >= 0),
  constraint gemini_usage_logs_total_tokens_nonnegative check (total_tokens >= 0)
);

create index if not exists idx_gemini_usage_logs_created_at
  on public.gemini_usage_logs (created_at desc);

create index if not exists idx_gemini_usage_logs_model_created_at
  on public.gemini_usage_logs (model, created_at desc);

create index if not exists idx_gemini_usage_logs_feature_created_at
  on public.gemini_usage_logs (feature, created_at desc);

alter table public.gemini_usage_logs enable row level security;

drop policy if exists "Admins can view gemini usage logs" on public.gemini_usage_logs;
drop policy if exists "Admins can insert gemini usage logs" on public.gemini_usage_logs;

create policy "Admins can view gemini usage logs"
on public.gemini_usage_logs
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can insert gemini usage logs"
on public.gemini_usage_logs
for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);

comment on table public.gemini_usage_logs is
  'Local Gemini API usage log for dashboard quota estimates. Rows are written after successful AI generation requests.';
