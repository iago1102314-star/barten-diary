-- access_logs / event_logs — 管理者アクセス除外用フラグ

alter table public.access_logs
  add column if not exists is_admin boolean not null default false;

alter table public.event_logs
  add column if not exists is_admin boolean not null default false;
