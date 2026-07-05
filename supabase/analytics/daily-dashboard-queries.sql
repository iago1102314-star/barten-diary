-- β版運営ダッシュボード — 個別クエリ（Supabase SQL Editor 用）
--
-- 日付は Asia/Tokyo の「今日」。is_admin = false のみ対象。
-- View を使う場合は先に supabase/migrations/014_analytics_dashboard_views.sql を実行。

-- ─────────────────────────────────────────────────────────────
-- ① 今日のアクセス数
-- ─────────────────────────────────────────────────────────────
select count(*) as access_count
from public.access_logs
where is_admin = false
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ② 今日の録音開始数
-- ─────────────────────────────────────────────────────────────
select count(*) as record_start_count
from public.event_logs
where is_admin = false
  and event_name = 'record_start'
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ③ 今日の録音完了数
-- ─────────────────────────────────────────────────────────────
select count(*) as record_finish_count
from public.event_logs
where is_admin = false
  and event_name = 'record_finish'
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ④ 今日の日記生成成功数
-- ─────────────────────────────────────────────────────────────
select count(*) as generate_success_count
from public.event_logs
where is_admin = false
  and event_name = 'generate_success'
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ⑤ 今日の日記生成失敗数
-- ─────────────────────────────────────────────────────────────
select count(*) as generate_failed_count
from public.event_logs
where is_admin = false
  and event_name = 'generate_failed'
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ⑥ 今日の Google ログイン数
-- ─────────────────────────────────────────────────────────────
select count(*) as login_success_count
from public.event_logs
where is_admin = false
  and event_name = 'login_success'
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ⑦ 今日の日記保存数
-- ─────────────────────────────────────────────────────────────
select count(*) as save_diary_count
from public.event_logs
where is_admin = false
  and event_name = 'save_diary'
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ⑧ 今日のフィードバック数
-- ─────────────────────────────────────────────────────────────
select count(*) as feedback_count
from public.feedbacks
where is_admin = false
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ⑨ ref ランキング（直近30日・JST）
-- ─────────────────────────────────────────────────────────────
select
  coalesce(nullif(trim(ref), ''), '(なし)') as ref,
  count(*) as access_count
from public.access_logs
where is_admin = false
  and (created_at at time zone 'Asia/Tokyo')::date
    >= ((timezone('Asia/Tokyo', now()))::date - interval '30 days')::date)
group by 1
order by access_count desc, ref asc;

-- ─────────────────────────────────────────────────────────────
-- ⑩ 酒ランキング（直近30日・drink_selected）
-- ─────────────────────────────────────────────────────────────
select
  metadata->>'drinkId' as drink_id,
  count(*) as select_count
from public.event_logs
where is_admin = false
  and event_name = 'drink_selected'
  and metadata ? 'drinkId'
  and (created_at at time zone 'Asia/Tokyo')::date
    >= ((timezone('Asia/Tokyo', now()))::date - interval '30 days')::date)
group by 1
order by select_count desc, drink_id asc;

-- ─────────────────────────────────────────────────────────────
-- ⑪ 平均録音時間（秒・今日）
-- ─────────────────────────────────────────────────────────────
select round(avg((metadata->>'duration')::numeric), 1) as avg_record_duration_sec
from public.event_logs
where is_admin = false
  and event_name = 'record_finish'
  and metadata ? 'duration'
  and (created_at at time zone 'Asia/Tokyo')::date
    = (timezone('Asia/Tokyo', now()))::date;

-- ─────────────────────────────────────────────────────────────
-- ⑫ 日記生成成功率（今日・%）
-- ─────────────────────────────────────────────────────────────
with counts as (
  select
    count(*) filter (where event_name = 'generate_success') as success_count,
    count(*) filter (where event_name = 'generate_failed') as failed_count
  from public.event_logs
  where is_admin = false
    and event_name in ('generate_success', 'generate_failed')
    and (created_at at time zone 'Asia/Tokyo')::date
      = (timezone('Asia/Tokyo', now()))::date
)
select
  success_count,
  failed_count,
  round(
    100.0 * success_count / nullif(success_count + failed_count, 0),
    1
  ) as generate_success_rate_pct
from counts;

-- ─────────────────────────────────────────────────────────────
-- ⑬ 保存率（今日・生成成功に対する save_diary の割合・%）
-- ─────────────────────────────────────────────────────────────
with counts as (
  select
    count(*) filter (where event_name = 'generate_success') as success_count,
    count(*) filter (where event_name = 'save_diary') as save_count
  from public.event_logs
  where is_admin = false
    and event_name in ('generate_success', 'save_diary')
    and (created_at at time zone 'Asia/Tokyo')::date
      = (timezone('Asia/Tokyo', now()))::date
)
select
  success_count,
  save_count,
  round(100.0 * save_count / nullif(success_count, 0), 1) as save_rate_pct
from counts;

-- ─────────────────────────────────────────────────────────────
-- 毎朝見る一覧（View 利用）
-- ─────────────────────────────────────────────────────────────
-- select * from public.daily_dashboard;

-- ─────────────────────────────────────────────────────────────
-- 日別推移（View 利用・直近90日）
-- ─────────────────────────────────────────────────────────────
-- select
--   "日付",
--   "アクセス数",
--   "日記生成成功",
--   "保存数",
--   "生成成功率（%）",
--   "保存率（%）"
-- from public.daily_metrics_trend
-- order by "日付" desc;
