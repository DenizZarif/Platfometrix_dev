create table public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  category text not null check (category in ('bi','crm','warehouse')),
  label text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.group_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.group_sessions(id) on delete cascade,
  participant_name text not null,
  answers jsonb not null,
  results jsonb not null,
  submitted_at timestamptz not null default now()
);
grant select, insert on public.group_sessions to anon, authenticated;
grant select, insert on public.group_submissions to anon, authenticated;
grant all on public.group_sessions to service_role;
grant all on public.group_submissions to service_role;
alter table public.group_sessions enable row level security;
alter table public.group_submissions enable row level security;
create policy "Anyone can create a group session" on public.group_sessions for insert to anon, authenticated with check (true);
create policy "Anyone can read a group session" on public.group_sessions for select to anon, authenticated using (true);
create policy "Anyone can submit to a group session" on public.group_submissions for insert to anon, authenticated with check (true);
create policy "Anyone can read group submissions" on public.group_submissions for select to anon, authenticated using (true);