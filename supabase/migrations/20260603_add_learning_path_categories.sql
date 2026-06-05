alter table public.learning_paths
  add column if not exists category text,
  add column if not exists sub_category text,
  add column if not exists sub_sub_category text;
