-- AI日記用カラム追加
alter table public.diaries
  add column if not exists transcript text,
  add column if not exists master_comment text;
