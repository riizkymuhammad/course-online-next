create or replace function public.delete_tryout_with_relations(p_tryout_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_thumbnail_path text;
begin
  if not (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
    or (auth.jwt() -> 'app_metadata' ->> 'user_role') in ('admin', 'super_admin')
    or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin'
    or (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    or (auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true'
  ) then
    raise exception 'Only admins can delete tryouts' using errcode = '42501';
  end if;

  select thumbnail_path
  into deleted_thumbnail_path
  from public.tryouts
  where id = p_tryout_id
  for update;

  if not found then
    raise exception 'Tryout not found' using errcode = 'P0002';
  end if;

  delete from public.tryout_attempt_answers
  where tryout_id = p_tryout_id;

  delete from public.tryout_attempts
  where tryout_id = p_tryout_id;

  delete from public.tryout_question_options
  where tryout_question_id in (
    select id
    from public.tryout_questions
    where tryout_id = p_tryout_id
  );

  delete from public.tryout_questions
  where tryout_id = p_tryout_id;

  delete from public.tryouts
  where id = p_tryout_id;

  return deleted_thumbnail_path;
end;
$$;

revoke all on function public.delete_tryout_with_relations(uuid) from public;
grant execute on function public.delete_tryout_with_relations(uuid) to authenticated;
