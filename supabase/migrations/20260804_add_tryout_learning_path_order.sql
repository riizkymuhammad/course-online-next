alter table public.tryouts
  add column if not exists learning_path_order integer;

create index if not exists tryouts_learning_path_order_idx
  on public.tryouts (learning_path_id, learning_path_order);

with ranked_tryouts as (
  select id, row_number() over (
    partition by learning_path_id
    order by updated_at desc nulls last, created_at desc nulls last, id
  ) - 1 as position
  from public.tryouts
  where learning_path_id is not null
)
update public.tryouts as tryout
set learning_path_order = ranked_tryouts.position
from ranked_tryouts
where tryout.id = ranked_tryouts.id
  and tryout.learning_path_order is null;
