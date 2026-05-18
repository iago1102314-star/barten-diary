-- 既に 001 を実行済みで "permission denied for table diaries" が出る場合に実行
grant usage on schema public to authenticated;
grant select, insert on table public.diaries to authenticated;
