create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_categories_name_unique
  on public.categories (lower(name));

create index if not exists idx_categories_name
  on public.categories (name);

create table if not exists public.sub_categories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_sub_categories_category_name_unique
  on public.sub_categories (category_id, lower(name));

create index if not exists idx_sub_categories_category_id
  on public.sub_categories (category_id);

create index if not exists idx_sub_categories_name
  on public.sub_categories (name);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_categories_updated_at'
  ) then
    create trigger set_categories_updated_at
    before update on public.categories
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_sub_categories_updated_at'
  ) then
    create trigger set_sub_categories_updated_at
    before update on public.sub_categories
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;
end $$;

alter table public.categories enable row level security;
alter table public.sub_categories enable row level security;

drop policy if exists "Authenticated can view categories" on public.categories;
drop policy if exists "Admins can insert categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;
drop policy if exists "Authenticated can view sub categories" on public.sub_categories;
drop policy if exists "Admins can insert sub categories" on public.sub_categories;
drop policy if exists "Admins can update sub categories" on public.sub_categories;
drop policy if exists "Admins can delete sub categories" on public.sub_categories;

create policy "Authenticated can view categories"
on public.categories
for select
to authenticated
using (true);

create policy "Admins can insert categories"
on public.categories
for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can update categories"
on public.categories
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can delete categories"
on public.categories
for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Authenticated can view sub categories"
on public.sub_categories
for select
to authenticated
using (true);

create policy "Admins can insert sub categories"
on public.sub_categories
for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can update sub categories"
on public.sub_categories
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);

create policy "Admins can delete sub categories"
on public.sub_categories
for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
  or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
  or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
);
