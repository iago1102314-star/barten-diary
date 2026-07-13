-- daily_analysis_dashboard — 毎朝1本で見る統合日次分析 View
--
-- 使い方:
--   select * from public.daily_analysis_dashboard;
--
-- 列の出所（既存定義の再利用）:
-- ┌─────────────────────────┬──────────────────────────────────────────────────┐
-- │ 列グループ               │ ソース                                            │
-- ├─────────────────────────┼──────────────────────────────────────────────────┤
-- │ date                    │ day_series（014 daily_metrics_trend と同じ90日）    │
-- │ visitor 系              │ analytics_visits_base + visitor_first_visit       │
-- │                         │ （015 visitor_metrics_trend と同じ定義）           │
-- │ total_visits / quality  │ analytics_visits_base.traffic_quality             │
-- │                         │ （015 traffic_quality_summary と同じ分類）        │
-- │ *_visits ファネル        │ analytics_visits_base.reached_* (bool_or由来)     │
-- │                         │ （015 ref_funnel の visit 単位到達と同じ）         │
-- │ *_rate_pct              │ 当日 total_visits を分母（015 ref_funnel 同様）   │
-- │ 滞在系                   │ analytics_visits_base.duration_sec_estimated      │
-- │                         │ （015 visit_duration_summary と同じ母集団・式）   │
-- │ diaries_created         │ public.diaries（is_admin=false, JST日付）         │
-- │ feedback_count          │ public.feedbacks（014 daily_metrics_trend 同様）  │
-- └─────────────────────────┴──────────────────────────────────────────────────┘
--
-- 既存 View は変更しない。読み取り専用の追加のみ。

drop view if exists public.daily_analysis_dashboard;

create view public.daily_analysis_dashboard as
with day_series as (
  select series_day::date as report_date
  from generate_series(
    (timezone('Asia/Tokyo', now()))::date - 90,
    (timezone('Asia/Tokyo', now()))::date,
    '1 day'::interval
  ) as series_day
),
visitor_first_visit as (
  select
    visitor_id,
    min(visit_date_jst) as first_visit_date
  from public.analytics_visits_base
  group by visitor_id
),
daily_visitors as (
  select distinct
    visit_date_jst as report_date,
    visitor_id
  from public.analytics_visits_base
),
visitor_stats as (
  select
    dv.report_date,
    count(*) as total_visitors,
    count(*) filter (
      where vfv.first_visit_date = dv.report_date
    ) as new_visitors,
    count(*) filter (
      where vfv.first_visit_date < dv.report_date
    ) as returning_visitors
  from daily_visitors dv
  join visitor_first_visit vfv using (visitor_id)
  group by dv.report_date
),
visit_stats as (
  select
    visit_date_jst as report_date,
    count(*) as total_visits,
    count(*) filter (where traffic_quality = 'likely_human') as likely_human,
    count(*) filter (where traffic_quality = 'likely_bot') as likely_bot,
    count(*) filter (where traffic_quality = 'unknown') as unknown,
    count(*) filter (where reached_home_open) as home_open_visits,
    count(*) filter (where reached_counter_enter) as counter_enter_visits,
    count(*) filter (where reached_drink_selected) as drink_selected_visits,
    count(*) filter (where reached_record_start) as record_start_visits,
    count(*) filter (where reached_record_finish) as record_finish_visits,
    count(*) filter (where reached_generate_success) as generate_success_visits,
    count(*) filter (where reached_save_diary) as save_diary_visits
  from public.analytics_visits_base
  group by visit_date_jst
),
duration_stats as (
  select
    visit_date_jst as report_date,
    count(*) as visits_with_duration,
    round(avg(duration_sec_estimated)::numeric, 1) as avg_duration_sec,
    round(
      percentile_cont(0.5) within group (order by duration_sec_estimated)::numeric,
      1
    ) as median_duration_sec,
    count(*) filter (where duration_sec_estimated < 10) as visits_under_10_sec,
    count(*) filter (where duration_sec_estimated < 30) as visits_under_30_sec,
    count(*) filter (where duration_sec_estimated >= 60) as visits_60_sec_plus
  from public.analytics_visits_base
  where duration_sec_estimated is not null
  group by visit_date_jst
),
diaries_stats as (
  select
    (created_at at time zone 'Asia/Tokyo')::date as report_date,
    count(*)::bigint as diaries_created
  from public.diaries
  where is_admin = false
  group by 1
),
feedback_stats as (
  select
    (created_at at time zone 'Asia/Tokyo')::date as report_date,
    count(*)::bigint as feedback_count
  from public.feedbacks
  where is_admin = false
  group by 1
)
select
  d.report_date as date,

  -- visitor（015 visitor_metrics_trend 準拠）
  coalesce(vs.total_visitors, 0) as total_visitors,
  coalesce(vs.new_visitors, 0) as new_visitors,
  coalesce(vs.returning_visitors, 0) as returning_visitors,
  round(
    100.0 * coalesce(vs.returning_visitors, 0)
      / nullif(coalesce(vs.total_visitors, 0), 0),
    1
  ) as returning_rate_pct,
  round(
    coalesce(vt.total_visits, 0)::numeric
      / nullif(coalesce(vs.total_visitors, 0), 0),
    2
  ) as avg_visits_per_visitor,

  -- visit / traffic quality（015 traffic_quality_summary 準拠）
  coalesce(vt.total_visits, 0) as total_visits,
  coalesce(vt.likely_human, 0) as likely_human,
  coalesce(vt.likely_bot, 0) as likely_bot,
  coalesce(vt.unknown, 0) as unknown,
  round(
    100.0 * coalesce(vt.likely_human, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as likely_human_pct,
  round(
    100.0 * coalesce(vt.likely_bot, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as likely_bot_pct,
  round(
    100.0 * coalesce(vt.unknown, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as unknown_pct,

  -- visit 単位ファネル（015 ref_funnel の reached_* 集計と同型）
  coalesce(vt.home_open_visits, 0) as home_open_visits,
  coalesce(vt.counter_enter_visits, 0) as counter_enter_visits,
  coalesce(vt.drink_selected_visits, 0) as drink_selected_visits,
  coalesce(vt.record_start_visits, 0) as record_start_visits,
  coalesce(vt.record_finish_visits, 0) as record_finish_visits,
  coalesce(vt.generate_success_visits, 0) as generate_success_visits,
  coalesce(vt.save_diary_visits, 0) as save_diary_visits,

  -- 主要到達率（分母 = 当日 total_visits）
  round(
    100.0 * coalesce(vt.home_open_visits, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as home_open_rate_pct,
  round(
    100.0 * coalesce(vt.counter_enter_visits, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as counter_enter_rate_pct,
  round(
    100.0 * coalesce(vt.drink_selected_visits, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as drink_selected_rate_pct,
  round(
    100.0 * coalesce(vt.record_start_visits, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as record_start_rate_pct,
  round(
    100.0 * coalesce(vt.generate_success_visits, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as generate_success_rate_pct,
  round(
    100.0 * coalesce(vt.save_diary_visits, 0)
      / nullif(coalesce(vt.total_visits, 0), 0),
    1
  ) as save_diary_rate_pct,

  -- 滞在（015 visit_duration_summary 準拠）
  coalesce(ds.visits_with_duration, 0) as visits_with_duration,
  coalesce(ds.avg_duration_sec, 0) as avg_duration_sec,
  coalesce(ds.median_duration_sec, 0) as median_duration_sec,
  coalesce(ds.visits_under_10_sec, 0) as visits_under_10_sec,
  coalesce(ds.visits_under_30_sec, 0) as visits_under_30_sec,
  coalesce(ds.visits_60_sec_plus, 0) as visits_60_sec_plus,

  -- 本番成果
  coalesce(di.diaries_created, 0) as diaries_created,
  coalesce(fb.feedback_count, 0) as feedback_count

from day_series d
left join visitor_stats vs using (report_date)
left join visit_stats vt using (report_date)
left join duration_stats ds using (report_date)
left join diaries_stats di using (report_date)
left join feedback_stats fb using (report_date)
order by d.report_date desc;
