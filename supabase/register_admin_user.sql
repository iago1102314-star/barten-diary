-- 自分の Google ログインユーザーを admin_users に登録する
--
-- Supabase Dashboard > SQL Editor で実行してください。
-- YOUR_GOOGLE_EMAIL@gmail.com を自分の Google アカウントのメールに置き換えます。

-- 方法A: メールのみで登録（ログイン前でも可。初回ログイン後に is_admin が有効になる）
insert into public.admin_users (email)
values ('YOUR_GOOGLE_EMAIL@gmail.com')
on conflict (email) do nothing;

-- 方法B: 既に Google ログイン済みなら user_id も紐づける（推奨）
insert into public.admin_users (user_id, email)
select id, email
from auth.users
where lower(email) = lower('YOUR_GOOGLE_EMAIL@gmail.com')
on conflict (user_id) do update
  set email = excluded.email;

-- 登録確認（service_role / SQL Editor のみ。クライアントからは見えない）
-- select * from public.admin_users where lower(email) = lower('YOUR_GOOGLE_EMAIL@gmail.com');
