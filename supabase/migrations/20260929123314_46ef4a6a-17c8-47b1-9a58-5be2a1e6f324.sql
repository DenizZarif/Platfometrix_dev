create table public.stack_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text check (category in ('bi','crm','warehouse')),
  tool_id text,
  name text not null,
  answers jsonb,
  stage text not null default 'evaluating'
    check (stage in ('evaluating','implementing','live','under_review','retired')),
  source text not null default 'manual' check (source in ('manual','saved_result')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.stack_items to authenticated;
grant all on public.stack_items to service_role;

create table public.stack_checklist_items (
  id uuid primary key default gen_random_uuid(),
  stack_item_id uuid not null references public.stack_items(id) on delete cascade,
  kind text not null default 'setup' check (kind in ('setup')),
  label text not null,
  detail text,
  done boolean not null default false,
  owner text,
  target_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.stack_checklist_items to authenticated;
grant all on public.stack_checklist_items to service_role;

alter table public.stack_items enable row level security;
alter table public.stack_checklist_items enable row level security;

create policy "Users manage their own stack items" on public.stack_items
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own stack checklist items" on public.stack_checklist_items
  for all to authenticated using (
    exists (select 1 from public.stack_items si where si.id = stack_item_id and si.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.stack_items si where si.id = stack_item_id and si.user_id = auth.uid())
  );

create index stack_items_user_idx on public.stack_items(user_id);
create index stack_checklist_items_item_idx on public.stack_checklist_items(stack_item_id);