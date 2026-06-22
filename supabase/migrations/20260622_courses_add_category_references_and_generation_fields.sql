-- Create the complete course data model, including source PDF metadata,
-- taxonomy references, AI output, sections, and modules.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid null references public.learning_paths(id) on update cascade on delete set null,
  title text not null,
  slug text null,
  description text null,
  thumbnail text null,
  section_count integer not null default 0,
  module_count integer not null default 0,
  status text not null default 'published'::text,
  material_file_url text null,
  material_file_name text null,
  material_file_type text null,
  material_file_size bigint null,
  ai_generation_status text not null default 'pending'::text,
  ai_generation_notes text null,
  ai_generated_summary text null,
  course_outline jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_course_status check (status = any (array['draft'::text, 'published'::text, 'archived'::text])),
  constraint check_course_ai_generation_status check (
    ai_generation_status = any (array['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])
  ),
  constraint check_course_section_count check (section_count >= 0),
  constraint check_course_module_count check (module_count >= 0),
  constraint check_course_material_file_size check (material_file_size is null or material_file_size >= 0)
);

alter table public.courses
  add column if not exists category_id uuid,
  add column if not exists sub_category_id uuid,
  add column if not exists description text,
  add column if not exists material_file_url text,
  add column if not exists material_file_name text,
  add column if not exists material_file_type text,
  add column if not exists material_file_size bigint,
  add column if not exists ai_generation_status text not null default 'pending',
  add column if not exists ai_generation_notes text,
  add column if not exists ai_generated_summary text,
  add column if not exists course_outline jsonb;

create unique index if not exists idx_sub_categories_id_category_id_unique
  on public.sub_categories (id, category_id);

alter table public.courses
  drop constraint if exists courses_category_id_fkey,
  drop constraint if exists courses_sub_category_id_fkey,
  drop constraint if exists courses_sub_category_matches_category_fkey,
  drop constraint if exists courses_sub_category_requires_category_check;

alter table public.courses
  add constraint courses_category_id_fkey
    foreign key (category_id)
    references public.categories(id)
    on update cascade
    on delete set null,
  add constraint courses_sub_category_id_fkey
    foreign key (sub_category_id)
    references public.sub_categories(id)
    on update cascade
    on delete set null,
  add constraint courses_sub_category_matches_category_fkey
    foreign key (sub_category_id, category_id)
    references public.sub_categories(id, category_id)
    on update cascade,
  add constraint courses_sub_category_requires_category_check
    check (sub_category_id is null or category_id is not null);

create index if not exists idx_courses_category_id
  on public.courses (category_id);

create index if not exists idx_courses_sub_category_id
  on public.courses (sub_category_id);

create index if not exists idx_courses_ai_generation_status
  on public.courses (ai_generation_status);

create unique index if not exists idx_courses_slug_unique
  on public.courses (lower(slug))
  where slug is not null;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_courses_updated_at') then
    create trigger set_courses_updated_at
    before update on public.courses
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;
end $$;

create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text null,
  section_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_sections_course_order_unique unique (course_id, section_order),
  constraint course_sections_order_positive check (section_order > 0)
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_section_id uuid not null references public.course_sections(id) on delete cascade,
  title text not null,
  description text null,
  content_markdown text null,
  learning_objectives jsonb null,
  estimated_minutes integer null,
  module_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_modules_section_order_unique unique (course_section_id, module_order),
  constraint course_modules_order_positive check (module_order > 0),
  constraint course_modules_estimated_minutes_positive check (
    estimated_minutes is null or estimated_minutes > 0
  )
);

alter table public.course_modules
  add column if not exists content_markdown text,
  add column if not exists learning_objectives jsonb,
  add column if not exists estimated_minutes integer;

create index if not exists idx_course_sections_course_id
  on public.course_sections (course_id, section_order);

create index if not exists idx_course_modules_section_id
  on public.course_modules (course_section_id, module_order);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_course_sections_updated_at') then
    create trigger set_course_sections_updated_at
    before update on public.course_sections
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_course_modules_updated_at') then
    create trigger set_course_modules_updated_at
    before update on public.course_modules
    for each row
    execute function public.set_current_timestamp_updated_at();
  end if;
end $$;

alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.course_modules enable row level security;

drop policy if exists "Public can view published courses" on public.courses;
drop policy if exists "Admins can manage courses" on public.courses;
drop policy if exists "Public can view published course sections" on public.course_sections;
drop policy if exists "Admins can manage course sections" on public.course_sections;
drop policy if exists "Public can view published course modules" on public.course_modules;
drop policy if exists "Admins can manage course modules" on public.course_modules;

create policy "Public can view published courses"
on public.courses
for select
to anon, authenticated
using (status = 'published');

create policy "Admins can manage courses"
on public.courses
for all
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

create policy "Public can view published course sections"
on public.course_sections
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = course_sections.course_id
      and courses.status = 'published'
  )
);

create policy "Admins can manage course sections"
on public.course_sections
for all
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

create policy "Public can view published course modules"
on public.course_modules
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.course_sections
    join public.courses on courses.id = course_sections.course_id
    where course_sections.id = course_modules.course_section_id
      and courses.status = 'published'
  )
);

create policy "Admins can manage course modules"
on public.course_modules
for all
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
