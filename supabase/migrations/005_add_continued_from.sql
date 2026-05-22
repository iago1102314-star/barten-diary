-- 過去ボトルから続ける（MLP: メタ情報のみ）
alter table public.diaries
  add column if not exists continued_from_diary_id uuid references public.diaries (id) on delete set null,
  add column if not exists continued_from_bottle_tag text;
