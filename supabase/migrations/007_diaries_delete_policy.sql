-- 夜のメモの削除
grant delete on table public.diaries to authenticated;

create policy "Users can delete own diaries"
on public.diaries
for delete
to authenticated
using (auth.uid() = user_id);
