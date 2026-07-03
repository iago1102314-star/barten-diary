-- admin_users — ログイン管理者の行動ログ除外判定
--
-- クライアント（authenticated）は自分が管理者かどうかの SELECT のみ可能。
-- INSERT / UPDATE / DELETE は SQL Editor（service_role）から手動登録。

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade unique,
  email text unique,
  created_at timestamptz not null default now(),
  constraint admin_users_identity_check check (
    user_id is not null or email is not null
  )
);

create index if not exists admin_users_user_id_idx
  on public.admin_users (user_id);

create index if not exists admin_users_email_idx
  on public.admin_users (lower(email));

grant usage on schema public to authenticated;
grant select on table public.admin_users to authenticated;

alter table public.admin_users enable row level security;

drop policy if exists "Users can check own admin status" on public.admin_users;

create policy "Users can check own admin status"
on public.admin_users
for select
to authenticated
using (
  user_id = auth.uid()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
