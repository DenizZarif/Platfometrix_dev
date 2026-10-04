alter table public.stack_items
  add column item_type text not null default 'tool'
  check (item_type in ('tool','data_source'));