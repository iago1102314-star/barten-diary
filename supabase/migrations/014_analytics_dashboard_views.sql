-- β版運営ダッシュボード — View（SQL Editor で一度実行）
--
-- 毎朝: select * from public.daily_dashboard;
-- 日別推移: select * from public.daily_metrics_trend order by report_date desc;
--
-- 対象は is_admin = false のみ。日付は Asia/Tokyo。

create or replace view public.daily_dashboard as
with today as (
  select (timezone('Asia/Tokyo', now()))::date as report_date
),
access as (
  select count(*)::bigint as access_count
  from public.access_logs a
  cross join today t
  where a.is_admin = false
    and (a.created_at at time zone 'Asia/Tokyo')::date = t.report_date
),
events as (
  select
    count(*) filter (where e.event_name = 'record_start')::bigint
      as record_start_count,
    count(*) filter (where e.event_name = 'record_finish')::bigint
      as record_finish_count,
    count(*) filter (where e.event_name = 'generate_success')::bigint
      as generate_success_count,
    count(*) filter (where e.event_name = 'generate_failed')::bigint
      as generate_failed_count,
    count(*) filter (where e.event_name = 'login_success')::bigint
      as login_success_count,
    count(*) filter (where e.event_name = 'save_diary')::bigint
      as save_diary_count,
    avg((e.metadata->>'duration')::numeric) filter (
      where e.event_name = 'record_finish'
        and e.metadata ? 'duration'
    ) as avg_record_duration_sec
  from public.event_logs e
  cross join today t
  where e.is_admin = false
    and (e.created_at at time zone 'Asia/Tokyo')::date = t.report_date
),
feedbacks as (
  select count(*)::bigint as feedback_count
  from public.feedbacks f
  cross join today t
  where f.is_admin = false
    and (f.created_at at time zone 'Asia/Tokyo')::date = t.report_date
)
select
  t.report_date,
  a.access_count,
  e.record_start_count,
  e.record_finish_count,
  e.generate_success_count,
  e.generate_failed_count,
  e.login_success_count,
  e.save_diary_count,
  f.feedback_count,
  round(e.avg_record_duration_sec::numeric, 1) as avg_record_duration_sec,
  round(
  100.0 * e.generate_success_count
    / nullif(e.generate_success_count + e.generate_failed_count, 0),
  1
  ) as generate_success_rate_pct,
  round(
  100.0 * e.save_diary_count / nullif(e.generate_success_count, 0),
  1
  ) as save_rate_pct
from today t
cross join access a
cross join events e
cross join feedbacks f;

create or replace view public.daily_metrics_trend as
with day_series as (
  select series_day::date as report_date
  from generate_series(
    (timezone('Asia/Tokyo', now()))::date - 90,
    (timezone('Asia/Tokyo', now()))::date,
    '1 day'::interval
  ) as series_day
),
access as (
  select
    (created_at at time zone 'Asia/Tokyo')::date as report_date,
    count(*)::bigint as access_count
  from public.access_logs
  where is_admin = false
  group by 1
),
events as (
  select
    (created_at at time zone 'Asia/Tokyo')::date as report_date,
    count(*) filter (where event_name = 'record_start')::bigint
      as record_start_count,
    count(*) filter (where event_name = 'record_finish')::bigint
      as record_finish_count,
    count(*) filter (where event_name = 'generate_success')::bigint
      as generate_success_count,
    count(*) filter (where event_name = 'generate_failed')::bigint
      as generate_failed_count,
    count(*) filter (where event_name = 'login_success')::bigint
      as login_success_count,
    count(*) filter (where event_name = 'save_diary')::bigint
      as save_diary_count,
    avg((metadata->>'duration')::numeric) filter (
      where event_name = 'record_finish'
        and metadata ? 'duration'
    ) as avg_record_duration_sec
  from public.event_logs
  where is_admin = false
  group by 1
),
feedbacks as (
  select
    (created_at at time zone 'Asia/Tokyo')::date as report_date,
    count(*)::bigint as feedback_count
  from public.feedbacks
  where is_admin = false
  group by 1
)
select
  d.report_date,
  coalesce(a.access_count, 0) as access_count,
  coalesce(e.record_start_count, 0) as record_start_count,
  coalesce(e.record_finish_count, 0) as record_finish_count,
  coalesce(e.generate_success_count, 0) as generate_success_count,
  coalesce(e.generate_failed_count, 0) as generate_failed_count,
  coalesce(e.login_success_count, 0) as login_success_count,
  coalesce(e.save_diary_count, 0) as save_diary_count,
  coalesce(f.feedback_count, 0) as feedback_count,
  round(coalesce(e.avg_record_duration_sec, 0)::numeric, 1)
    as avg_record_duration_sec,
  round(
    100.0 * coalesce(e.generate_success_count, 0)
      / nullif(
        coalesce(e.generate_success_count, 0)
          + coalesce(e.generate_failed_count, 0),
        0
      ),
    1
  ) as generate_success_rate_pct,
  round(
    100.0 * coalesce(e.save_diary_count, 0)
      / nullif(coalesce(e.generate_success_count, 0), 0),
    1
  ) as save_rate_pct
from day_series d
left join access a using (report_date)
left join events e using (report_date)
left join feedbacks f using (report_date)
order by d.report_date desc;
