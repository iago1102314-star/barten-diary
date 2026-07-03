-- diaries / feedbacks — 管理者アクセス除外用フラグ

alter table public.diaries
  add column if not exists is_admin boolean not null default false;

alter table public.feedbacks
  add column if not exists is_admin boolean not null default false;
