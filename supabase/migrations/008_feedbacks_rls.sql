-- feedbacks — フィードバック送信（ゲスト可・アプリからの読み取りなし）
--
-- 既に public.feedbacks がある場合も、このファイルだけ SQL Editor で実行可。
-- "permission denied for table feedbacks" (42501) の修正用。

-- テーブル未作成の環境向け（既存ならスキップ）
create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  type text not null check (type in ('review', 'bug', 'suggestion')),
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  body text not null,
  page_path text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

-- ロールへ INSERT 権限（RLS より先に必要）
grant usage on schema public to anon, authenticated;
grant insert on table public.feedbacks to anon, authenticated;

alter table public.feedbacks enable row level security;

-- 既存ポリシーがあれば置き換え
drop policy if exists "Anon can insert feedback" on public.feedbacks;
drop policy if exists "Authenticated can insert feedback" on public.feedbacks;
drop policy if exists "Anyone can insert feedback" on public.feedbacks;

-- 未ログイン: user_id は null のみ
create policy "Anon can insert feedback"
on public.feedbacks
for insert
to anon
with check (user_id is null);

-- ログイン済み: 自分の user_id または null（ゲスト扱い）
create policy "Authenticated can insert feedback"
on public.feedbacks
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());
