-- diaries テーブル
create table public.diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger diaries_set_updated_at
before update on public.diaries
for each row
execute function public.set_updated_at();

-- RLS
alter table public.diaries enable row level security;

create policy "Users can read own diaries"
on public.diaries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own diaries"
on public.diaries
for insert
to authenticated
with check (auth.uid() = user_id);

-- テーブル権限（RLS の前にロールへ GRANT が必要）
grant usage on schema public to authenticated;
grant select, insert on table public.diaries to authenticated;
