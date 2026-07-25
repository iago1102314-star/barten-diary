-- anon / authenticated から不要な TRUNCATE / REFERENCES を明示 REVOKE
-- 併せて分析 View に SELECT が無い状態を明示 REVOKE で固定する
--
-- 背景（2026-07 監査で本番 DB を実測）:
--   public の全テーブル・全 View で anon / authenticated が
--   "REFERENCES, TRIGGER, TRUNCATE" を保持していた。
--
--   TRUNCATE は RLS の対象外（RLS は SELECT/INSERT/UPDATE/DELETE にしか効かない）。
--   PostgREST に TRUNCATE を実行する経路は無く、anon キーは JWT であって
--   DB パスワードではないため、現時点で悪用経路は無い。
--   ただし最小権限違反であり、将来 SECURITY INVOKER の RPC を追加した際に
--   効いてくるので落としておく。
--
--   分析 View は 11 本すべて SECURITY DEFINER / owner = postgres で、
--   基底テーブルの RLS をバイパスして全ユーザー分を読む。
--   実測では anon / authenticated に SELECT が無く到達不能だが、
--   防壁が GRANT 1 枚だけなので、明示 REVOKE で宣言的に固定する。
--
-- このファイルは冪等（REVOKE は何度実行してもよい）。
-- 存在しないオブジェクトはスキップするので、View 未作成の環境でも通る。
--
-- 剥がさない権限（アプリが依存しているので温存する）:
--   access_logs  : INSERT  (anon, authenticated)
--   event_logs   : INSERT  (anon, authenticated)
--   feedbacks    : INSERT  (anon, authenticated)
--   diaries      : SELECT, INSERT, UPDATE, DELETE (authenticated のみ)
--   admin_users  : SELECT  (authenticated のみ)

-- ---------------------------------------------------------------
-- 1. テーブル — TRUNCATE / REFERENCES のみ REVOKE
-- ---------------------------------------------------------------
do $$
declare
  target text;
  targets text[] := array[
    'access_logs',
    'admin_users',
    'diaries',
    'event_logs',
    'feedbacks'
  ];
begin
  foreach target in array targets loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = target
        and c.relkind = 'r'
    ) then
      execute format(
        'revoke truncate, references on table public.%I from anon, authenticated',
        target
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------
-- 2. 分析 View — 全権限 REVOKE（SELECT が無い状態を固定）
-- ---------------------------------------------------------------
--
-- View は anon / authenticated から一切参照しない。
-- 管理者は Supabase Studio（postgres ロール）から読むため影響しない。
do $$
declare
  target text;
  targets text[] := array[
    'acquisition_ref_funnel',
    'analytics_visits_base',
    'daily_analysis_dashboard',
    'daily_dashboard',
    'daily_metrics_trend',
    'ref_funnel',
    'traffic_quality_summary',
    'visit_duration_summary',
    'visitor_metrics_trend',
    'visitor_retention_summary',
    'visitor_summary'
  ];
begin
  foreach target in array targets loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = target
        and c.relkind in ('v', 'm')
    ) then
      execute format(
        'revoke all on table public.%I from anon, authenticated',
        target
      );
    end if;
  end loop;
end $$;


-- ===============================================================
-- 適用前 / 適用後の確認 SQL（同じクエリを前後で実行して差分を見る）
-- ===============================================================
--
-- (a) anon / authenticated の権限一覧
--
-- select
--   table_name,
--   grantee,
--   string_agg(privilege_type, ', ' order by privilege_type) as privileges
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and grantee in ('anon', 'authenticated')
-- group by table_name, grantee
-- order by table_name, grantee;
--
-- (b) 分析 View に SELECT が残っていないか（適用後は 0 件であること）
--
-- select table_name, grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and grantee in ('anon', 'authenticated')
--   and privilege_type = 'SELECT'
--   and table_name in (
--     'acquisition_ref_funnel', 'analytics_visits_base',
--     'daily_analysis_dashboard', 'daily_dashboard', 'daily_metrics_trend',
--     'ref_funnel', 'traffic_quality_summary', 'visit_duration_summary',
--     'visitor_metrics_trend', 'visitor_retention_summary', 'visitor_summary'
--   );
--
-- (c) アプリが必要とする権限が残っているか（この 9 行が出ること）
--
-- select table_name, grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and grantee in ('anon', 'authenticated')
--   and (
--     (table_name in ('access_logs', 'event_logs', 'feedbacks')
--       and privilege_type = 'INSERT')
--     or (table_name = 'diaries' and grantee = 'authenticated'
--       and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE'))
--     or (table_name = 'admin_users' and grantee = 'authenticated'
--       and privilege_type = 'SELECT')
--   )
-- order by table_name, grantee, privilege_type;


-- ===============================================================
-- 適用後の期待状態
-- ===============================================================
--
-- テーブル（(a) の結果）:
--   access_logs  / anon           → INSERT, TRIGGER
--   access_logs  / authenticated  → INSERT, TRIGGER
--   admin_users  / anon           → TRIGGER
--   admin_users  / authenticated  → SELECT, TRIGGER
--   diaries      / anon           → TRIGGER
--   diaries      / authenticated  → DELETE, INSERT, SELECT, TRIGGER, UPDATE
--   event_logs   / anon           → INSERT, TRIGGER
--   event_logs   / authenticated  → INSERT, TRIGGER
--   feedbacks    / anon           → INSERT, TRIGGER
--   feedbacks    / authenticated  → INSERT, TRIGGER
--
-- 分析 View 11 本:
--   anon / authenticated の行が (a) から消える（権限ゼロ）
--
-- TRIGGER は今回の対象外なので残る。
-- （trigger 作成には関数作成権限も必要で、anon は public スキーマに CREATE を
--   持たないため単独では悪用できない。落とす場合は別 migration で扱う）


-- ===============================================================
-- ロールバック SQL
-- ===============================================================
--
-- 監査時点(2026-07-25)の実測状態に戻す。
-- TRUNCATE を anon に戻す操作なので、通常は実行する必要はない。
--
-- begin;
--
-- do $$
-- declare
--   target text;
--   targets text[] := array[
--     'access_logs', 'admin_users', 'diaries', 'event_logs', 'feedbacks',
--     'acquisition_ref_funnel', 'analytics_visits_base',
--     'daily_analysis_dashboard', 'daily_dashboard', 'daily_metrics_trend',
--     'ref_funnel', 'traffic_quality_summary', 'visit_duration_summary',
--     'visitor_metrics_trend', 'visitor_retention_summary', 'visitor_summary'
--   ];
-- begin
--   foreach target in array targets loop
--     if exists (
--       select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
--       where n.nspname = 'public' and c.relname = target
--         and c.relkind in ('r', 'v', 'm')
--     ) then
--       execute format(
--         'grant truncate, references on table public.%I to anon, authenticated',
--         target
--       );
--     end if;
--   end loop;
-- end $$;
--
-- commit;
