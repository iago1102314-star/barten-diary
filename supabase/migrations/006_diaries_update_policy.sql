-- 夜のメモ本文の手直し（body のみ更新）
grant update on table public.diaries to authenticated;

create policy "Users can update own diaries"
on public.diaries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
