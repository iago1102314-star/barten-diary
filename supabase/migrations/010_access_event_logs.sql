-- access_logs / event_logs — バーテン日記固有の行動ログ（insert のみ・読み取りは管理者）
--
-- クライアント（anon / authenticated）から INSERT のみ許可。
-- SELECT は RLS ポリシーなし → service_role（Supabase Dashboard / 管理ツール）のみ。

create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  ref text,
  path text not null,
  screen_width int,
  screen_height int,
  user_agent text
);

create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  ref text,
  metadata jsonb
);

create index if not exists access_logs_created_at_idx
  on public.access_logs (created_at desc);

create index if not exists access_logs_session_id_idx
  on public.access_logs (session_id);

create index if not exists event_logs_created_at_idx
  on public.event_logs (created_at desc);

create index if not exists event_logs_session_id_idx
  on public.event_logs (session_id);

create index if not exists event_logs_event_name_idx
  on public.event_logs (event_name);

grant usage on schema public to anon, authenticated;
grant insert on table public.access_logs to anon, authenticated;
grant insert on table public.event_logs to anon, authenticated;

alter table public.access_logs enable row level security;
alter table public.event_logs enable row level security;

drop policy if exists "Anon can insert access logs" on public.access_logs;
drop policy if exists "Authenticated can insert access logs" on public.access_logs;
drop policy if exists "Anon can insert event logs" on public.event_logs;
drop policy if exists "Authenticated can insert event logs" on public.event_logs;

create policy "Anon can insert access logs"
on public.access_logs
for insert
to anon
with check (user_id is null);

create policy "Authenticated can insert access logs"
on public.access_logs
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

create policy "Anon can insert event logs"
on public.event_logs
for insert
to anon
with check (user_id is null);

create policy "Authenticated can insert event logs"
on public.event_logs
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());
