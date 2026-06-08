alter table public.tryouts
  add column if not exists category text,
  add column if not exists sub_category text;
