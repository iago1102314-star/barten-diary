-- feedbacks — 本番ポリシー乖離の修正（migration 008 が意図した状態へ収束させる）
--
-- 背景（2026-07 監査で本番 DB を実測）:
--   本番の public.feedbacks に、008 が想定しない INSERT ポリシーが 2 件残っていた。
--     - "Anyone can insert feedback"  … 008 L27 で drop するはずだったもの
--     - "Anyone can submit feedback"  … どの migration にも存在しない
--   PostgreSQL の permissive ポリシーは同一コマンドに対して OR 結合されるため、
--   anon の INSERT 実効条件が
--       (user_id is null) OR (type/body/rating の妥当性のみ)
--   になり、anon が user_id に任意の UUID を入れて INSERT できる状態だった。
--   （user_id は auth.users への FK なので実在 UUID が必要。悪用の痕跡はなし）
--
--   併せて "Users cannot read feedback"（SELECT / using false）も
--   migration に存在しないまま本番にだけ在った。読み取り禁止は維持したいので、
--   このファイルで明示的に宣言し直す。
--
-- このファイルは冪等。SQL Editor で何度実行してもよい。
-- 既存 migration は書き換えていない。

alter table public.feedbacks enable row level security;

-- ---------------------------------------------------------------
-- 1. ポリシーを 008 の意図どおりに作り直す
-- ---------------------------------------------------------------

-- 余分な 2 件を除去（user_id 偽装経路の封鎖）
drop policy if exists "Anyone can insert feedback" on public.feedbacks;
drop policy if exists "Anyone can submit feedback" on public.feedbacks;

-- 正規の 3 件を drop → create（冪等化のため）
drop policy if exists "Anon can insert feedback" on public.feedbacks;
drop policy if exists "Authenticated can insert feedback" on public.feedbacks;
drop policy if exists "Users cannot read feedback" on public.feedbacks;

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

-- アプリからは読まない。GRANT に SELECT が無いことと合わせて二重に禁止する
create policy "Users cannot read feedback"
on public.feedbacks
for select
to anon, authenticated
using (false);

-- ---------------------------------------------------------------
-- 2. body 長の CHECK 制約を明示的に追加
-- ---------------------------------------------------------------
--
-- これまで body 長 (1〜2000) は
--   - アプリ側 validateFeedbackInput（lib/feedback/validate-feedback.ts）
--   - 上で drop した "Anyone can insert feedback" ポリシーの with check
-- の 2 か所でしか担保されていなかった。テーブル制約として固定する。
--
-- `not valid` を付ける理由:
--   OR 結合の影響で「user_id is null だけ満たす」経路から
--   2000 文字超の行が過去に入っている可能性を排除できないため、
--   既存行のスキャンで migration が失敗しないようにする。
--   新規 INSERT / UPDATE には即座に適用される。
--   既存行が clean だと確認できたら、後述の validate を実行してよい。

alter table public.feedbacks
  drop constraint if exists feedbacks_body_length_check;

alter table public.feedbacks
  add constraint feedbacks_body_length_check
  check (char_length(body) >= 1 and char_length(body) <= 2000)
  not valid;

-- type / rating は既にテーブル制約がある（008 L10-11）ので重複させない:
--   feedbacks_type_check    … type in ('review','bug','suggestion')
--   feedbacks_rating_check  … rating is null or (rating >= 1 and rating <= 5)
--   feedbacks_platform_check … platform in ('PWA','Browser')  （009）
--
-- 【注意 / 今回は意図的に入れていない】
--   drop した "Anyone can insert feedback" は
--   「review なら rating 1-5 必須 / bug・suggestion なら rating null」
--   という type と rating の結合条件も持っていた。
--   このファイルでポリシーを整理すると、その結合条件は DB から失われる。
--   アプリ側（validateFeedbackInput L35-46）では従来どおり検証されるため
--   正常な UI 経由の送信は変わらないが、DB 単体の検証は緩くなる。
--   結合条件も DB で固定したい場合は、次のコメントを外して実行する。
--
-- alter table public.feedbacks
--   drop constraint if exists feedbacks_review_rating_check;
-- alter table public.feedbacks
--   add constraint feedbacks_review_rating_check
--   check (
--     (type = 'review' and rating is not null and rating >= 1 and rating <= 5)
--     or (type <> 'review' and rating is null)
--   )
--   not valid;


-- ===============================================================
-- 適用前の確認 SQL
-- ===============================================================
--
-- (a) 現在のポリシー（適用前は 5 件、適用後は 3 件になる想定）
--
-- select policyname, cmd, roles::text, qual as using_expr, with_check as check_expr
-- from pg_policies
-- where schemaname = 'public' and tablename = 'feedbacks'
-- order by cmd, policyname;
--
-- (b) body 長制約に違反する既存行があるか（0 件なら validate してよい）
--
-- select count(*) as violating_rows
-- from public.feedbacks
-- where char_length(body) < 1 or char_length(body) > 2000;
--
-- (c) review と rating の結合条件に違反する既存行があるか（参考）
--
-- select count(*) as violating_rows
-- from public.feedbacks
-- where (type = 'review' and (rating is null or rating < 1 or rating > 5))
--    or (type <> 'review' and rating is not null);
--
-- (d) 現在のテーブル制約一覧
--
-- select conname, pg_get_constraintdef(oid) as definition, convalidated
-- from pg_constraint
-- where conrelid = 'public.feedbacks'::regclass and contype = 'c'
-- order by conname;


-- ===============================================================
-- 適用後の期待ポリシー一覧（(a) の結果がこうなること）
-- ===============================================================
--
-- | policyname                     | cmd    | roles                 | using | with_check                                   |
-- |--------------------------------|--------|-----------------------|-------|----------------------------------------------|
-- | Anon can insert feedback       | INSERT | {anon}                | null  | (user_id IS NULL)                            |
-- | Authenticated can insert ...   | INSERT | {authenticated}       | null  | (user_id IS NULL) OR (user_id = auth.uid())  |
-- | Users cannot read feedback     | SELECT | {anon,authenticated}  | false | null                                         |
--
-- 期待される効果:
--   - anon は user_id を偽装できない（user_id is null 以外は必ず拒否）
--   - authenticated は自分の uid か null のみ
--   - anon / authenticated からの SELECT は不可
--   - UPDATE / DELETE ポリシーは存在しない（= 不可）


-- ===============================================================
-- 制約を検証済みにする（上記 (b) が 0 件だった場合のみ任意で実行）
-- ===============================================================
--
-- alter table public.feedbacks validate constraint feedbacks_body_length_check;


-- ===============================================================
-- ロールバック SQL
-- ===============================================================
--
-- 本番の「適用前の状態」に戻す。監査時点(2026-07-25)の実測値を再現する。
-- なお "Anyone can insert feedback" / "Anyone can submit feedback" は
-- user_id 偽装を許す穴なので、通常は戻す必要はない。
--
-- begin;
--
-- alter table public.feedbacks
--   drop constraint if exists feedbacks_body_length_check;
-- alter table public.feedbacks
--   drop constraint if exists feedbacks_review_rating_check;
--
-- drop policy if exists "Anyone can insert feedback" on public.feedbacks;
-- create policy "Anyone can insert feedback"
-- on public.feedbacks
-- for insert
-- to anon, authenticated
-- with check (
--   type = any (array['review'::text, 'bug'::text, 'suggestion'::text])
--   and body is not null
--   and char_length(body) > 0
--   and char_length(body) <= 2000
--   and (
--     (type = 'review' and rating >= 1 and rating <= 5)
--     or (type = any (array['bug'::text, 'suggestion'::text]) and rating is null)
--   )
-- );
--
-- drop policy if exists "Anyone can submit feedback" on public.feedbacks;
-- create policy "Anyone can submit feedback"
-- on public.feedbacks
-- for insert
-- to anon, authenticated
-- with check (
--   type = any (array['review'::text, 'bug'::text, 'suggestion'::text])
--   and body is not null
--   and char_length(body) > 0
--   and char_length(body) <= 2000
--   and (type = 'review' or rating is null)
-- );
--
-- commit;
