alter table public.tryouts
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tryout-thumbnails',
  'tryout-thumbnails',
  true,
  1048576,
  array['image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can view tryout thumbnails'
  ) then
    create policy "Public can view tryout thumbnails"
    on storage.objects
    for select
    to public
    using (bucket_id = 'tryout-thumbnails');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated can upload tryout thumbnails'
  ) then
    create policy "Authenticated can upload tryout thumbnails"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'tryout-thumbnails');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated can update tryout thumbnails'
  ) then
    create policy "Authenticated can update tryout thumbnails"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'tryout-thumbnails')
    with check (bucket_id = 'tryout-thumbnails');
  end if;
end $$;
