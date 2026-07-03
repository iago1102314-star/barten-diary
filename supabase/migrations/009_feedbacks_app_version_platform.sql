-- feedbacks — app_version / platform 列の追加

alter table public.feedbacks
  add column if not exists app_version text not null default '',
  add column if not exists platform text not null default 'Browser';

alter table public.feedbacks
  drop constraint if exists feedbacks_platform_check;

alter table public.feedbacks
  add constraint feedbacks_platform_check
  check (platform in ('PWA', 'Browser'));
