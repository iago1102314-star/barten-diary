-- 酒の余韻
alter table public.diaries
  add column if not exists drink_note text;
