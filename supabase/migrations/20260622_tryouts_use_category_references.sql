-- Replace duplicated category labels in tryouts with references to master data.
-- The migration stops if a legacy label has no matching master record, so no
-- category information is discarded silently.

alter table public.tryouts
  add column if not exists category_id uuid,
  add column if not exists sub_category_id uuid;

update public.tryouts as tryout
set category_id = category.id
from public.categories as category
where tryout.category_id is null
  and nullif(trim(tryout.category), '') is not null
  and lower(category.name) = lower(trim(tryout.category));

update public.tryouts as tryout
set sub_category_id = sub_category.id
from public.sub_categories as sub_category
where tryout.sub_category_id is null
  and tryout.category_id = sub_category.category_id
  and nullif(trim(tryout.sub_category), '') is not null
  and lower(sub_category.name) = lower(trim(tryout.sub_category));

do $$
begin
  if exists (
    select 1
    from public.tryouts
    where nullif(trim(category), '') is not null
      and category_id is null
  ) then
    raise exception 'Tidak semua kategori tryout lama cocok dengan public.categories. Tambahkan master kategori atau perbaiki data sebelum migrasi dijalankan.';
  end if;

  if exists (
    select 1
    from public.tryouts
    where nullif(trim(sub_category), '') is not null
      and sub_category_id is null
  ) then
    raise exception 'Tidak semua sub kategori tryout lama cocok dengan public.sub_categories pada kategori yang sama. Perbaiki master data sebelum migrasi dijalankan.';
  end if;
end $$;

create unique index if not exists idx_sub_categories_id_category_id_unique
  on public.sub_categories (id, category_id);

alter table public.tryouts
  drop constraint if exists tryouts_category_id_fkey,
  drop constraint if exists tryouts_sub_category_id_fkey,
  drop constraint if exists tryouts_sub_category_matches_category_fkey,
  drop constraint if exists tryouts_sub_category_requires_category_check;

alter table public.tryouts
  add constraint tryouts_category_id_fkey
    foreign key (category_id)
    references public.categories(id)
    on update cascade
    on delete set null,
  add constraint tryouts_sub_category_id_fkey
    foreign key (sub_category_id)
    references public.sub_categories(id)
    on update cascade
    on delete set null,
  add constraint tryouts_sub_category_matches_category_fkey
    foreign key (sub_category_id, category_id)
    references public.sub_categories(id, category_id)
    on update cascade,
  add constraint tryouts_sub_category_requires_category_check
    check (sub_category_id is null or category_id is not null);

create index if not exists idx_tryouts_category_id
  on public.tryouts (category_id);

create index if not exists idx_tryouts_sub_category_id
  on public.tryouts (sub_category_id);

-- Category labels appear on public tryout pages, so anonymous visitors need
-- read-only access to this non-sensitive master data.
drop policy if exists "Authenticated can view categories" on public.categories;
drop policy if exists "Authenticated can view sub categories" on public.sub_categories;
drop policy if exists "Public can view categories" on public.categories;
drop policy if exists "Public can view sub categories" on public.sub_categories;

create policy "Public can view categories"
on public.categories
for select
to anon, authenticated
using (true);

create policy "Public can view sub categories"
on public.sub_categories
for select
to anon, authenticated
using (true);

alter table public.tryouts
  drop column if exists category,
  drop column if exists sub_category;
