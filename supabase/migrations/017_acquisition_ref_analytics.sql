-- acquisition_ref 追加 + ref / acquisition_ref 分析 View 更新
--
-- 本番反映以降の新規ログが正式データ。
-- 既存行の ref / acquisition_ref は変更しない。
--
-- ref 意味（新仕様）:
--   ref = 今回 visit の流入元（URL ?ref= のみ。なければ NULL → View では direct）
--   acquisition_ref = visitor 初回獲得媒体（初回 URL ref のみ記録、上書きなし）
--
-- 既存 barten-behavior-ref から acquisition_ref への自動移行は行わない。

alter table public.access_logs
  add column if not exists acquisition_ref text;

alter table public.event_logs
  add column if not exists acquisition_ref text;

create index if not exists access_logs_acquisition_ref_idx
  on public.access_logs (acquisition_ref);

-- 依存順に drop（葉 → 根。analytics_visits_base は最後）
drop view if exists public.daily_analysis_dashboard;
drop view if exists public.acquisition_ref_funnel;
drop view if exists public.ref_funnel;
drop view if exists public.visitor_summary;
drop view if exists public.visitor_metrics_trend;
drop view if exists public.visitor_retention_summary;
drop view if exists public.visit_duration_summary;
drop view if exists public.traffic_quality_summary;
drop view if exists public.analytics_visits_base;

-- analytics_visits_base: ref=direct（NULL/空）、acquisition_ref=unknown（未記録）
create view public.analytics_visits_base as
with visit_access as (
  select distinct on (visit_key)
    visit_key,
    coalesce(visitor_id, session_id) as visitor_id,
    coalesce(visit_id, session_id) as visit_id,
    coalesce(nullif(btrim(ref), ''), 'direct') as ref_label,
    coalesce(nullif(btrim(acquisition_ref), ''), 'unknown') as acquisition_ref_label,
    created_at as first_access_at,
    user_agent,
    is_admin
  from (
    select
      coalesce(visit_id, session_id) as visit_key,
      visitor_id,
      visit_id,
      session_id,
      ref,
      acquisition_ref,
      created_at,
      user_agent,
      is_admin
    from public.access_logs
  ) raw
  where is_admin = false
  order by visit_key, created_at asc
),
visit_events as (
  select
    coalesce(visit_id, session_id) as visit_key,
    bool_or(event_name = 'home_open') as reached_home_open,
    bool_or(event_name = 'counter_enter') as reached_counter_enter,
    bool_or(event_name = 'drink_selected') as reached_drink_selected,
    bool_or(event_name = 'record_start') as reached_record_start,
    bool_or(event_name = 'record_finish') as reached_record_finish,
    bool_or(event_name = 'generate_success') as reached_generate_success,
    bool_or(event_name = 'login_success') as reached_login_success,
    bool_or(event_name = 'save_diary') as reached_save_diary,
    count(*) filter (where event_name not in ('visit_start', 'visit_end')) as event_count,
    count(*) filter (
      where event_name in (
        'home_open', 'counter_enter', 'drink_selected',
        'record_start', 'record_finish',
        'generate_success', 'generate_failed', 'save_diary'
      )
    ) as funnel_event_count,
    min(created_at) filter (where event_name not in ('visit_start', 'visit_end')) as first_event_at,
    max(created_at) filter (where event_name not in ('visit_start', 'visit_end')) as last_event_at,
    max(
      case event_name
        when 'feedback_submit' then 90
        when 'save_diary' then 80
        when 'generate_success' then 70
        when 'generate_failed' then 65
        when 'record_finish' then 60
        when 'record_start' then 50
        when 'drink_selected' then 40
        when 'counter_enter' then 30
        when 'home_open' then 20
        when 'login_success' then 10
        when 'visit_start' then 5
        else 0
      end
    ) as max_funnel_score,
    max(created_at) filter (where event_name = 'visit_end') as visit_end_at,
    max((metadata->>'durationSec')::numeric) filter (where event_name = 'visit_end')
      as visit_end_duration_sec,
    max(metadata->>'lastEvent') filter (where event_name = 'visit_end')
      as visit_end_last_event
  from public.event_logs
  where is_admin = false
  group by coalesce(visit_id, session_id)
),
visit_rapid as (
  select coalesce(visit_id, session_id) as visit_key
  from public.event_logs
  where is_admin = false
    and event_name in (
      'home_open', 'counter_enter', 'drink_selected',
      'record_start', 'record_finish',
      'generate_success', 'generate_failed', 'save_diary'
    )
  group by coalesce(visit_id, session_id)
  having count(distinct event_name) >= 2
     and extract(epoch from (max(created_at) - min(created_at))) <= 1
),
ua_volume as (
  select
    coalesce(nullif(btrim(user_agent), ''), '(empty)') as ua_norm,
    count(distinct coalesce(visit_id, session_id)) as ua_visit_count
  from public.access_logs
  where is_admin = false
  group by coalesce(nullif(btrim(user_agent), ''), '(empty)')
)
select
  va.visit_key,
  va.visitor_id,
  va.visit_id,
  va.ref_label,
  va.acquisition_ref_label,
  va.first_access_at,
  (va.first_access_at at time zone 'Asia/Tokyo')::date as visit_date_jst,
  va.user_agent,
  coalesce(ve.event_count, 0) as event_count,
  coalesce(ve.funnel_event_count, 0) as funnel_event_count,
  ve.first_event_at,
  ve.last_event_at,
  ve.max_funnel_score,
  ve.reached_home_open,
  ve.reached_counter_enter,
  ve.reached_drink_selected,
  ve.reached_record_start,
  ve.reached_record_finish,
  ve.reached_generate_success,
  ve.reached_login_success,
  ve.reached_save_diary,
  ve.visit_end_at,
  ve.visit_end_duration_sec,
  ve.visit_end_last_event,
  coalesce(
    ve.visit_end_duration_sec,
    case
      when ve.last_event_at is not null
        then round(extract(epoch from (ve.last_event_at - va.first_access_at))::numeric, 0)
      else null
    end
  ) as duration_sec_estimated,
  (vr.visit_key is not null) as flag_rapid_funnel,
  (
    va.user_agent ~* (
      'bot|crawler|spider|slurp|headless|phantomjs|puppeteer|playwright|'
      || 'selenium|webdriver|lighthouse|pagespeed|gtmetrix|pingdom|uptime|'
      || 'monitor|preview|facebookexternalhit|twitterbot|slackbot|discordbot|'
      || 'linkedinbot|whatsapp|telegrambot|line-poker|embedly|redditbot|'
      || 'applebot|googlebot|bingbot|duckduckbot|yandexbot|baiduspider|'
      || 'semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|'
      || 'curl/|wget/|python-requests|okhttp|go-http-client|java/|'
      || 'scrapy|httpclient|postman|insomnia|prerender|rendertron|'
      || 'archive\.org|heritrix|nutch'
    )
  ) as flag_bot_ua,
  (coalesce(uv.ua_visit_count, 0) >= 5) as flag_bulk_ua,
  case
    when va.user_agent ~* (
      'bot|crawler|spider|slurp|headless|phantomjs|puppeteer|playwright|'
      || 'selenium|webdriver|lighthouse|pagespeed|gtmetrix|pingdom|uptime|'
      || 'monitor|preview|facebookexternalhit|twitterbot|slackbot|discordbot|'
      || 'linkedinbot|whatsapp|telegrambot|line-poker|embedly|redditbot|'
      || 'applebot|googlebot|bingbot|duckduckbot|yandexbot|baiduspider|'
      || 'semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider|'
      || 'curl/|wget/|python-requests|okhttp|go-http-client|java/|'
      || 'scrapy|httpclient|postman|insomnia|prerender|rendertron|'
      || 'archive\.org|heritrix|nutch'
    ) then 'likely_bot'
    when coalesce(ve.funnel_event_count, 0) = 0 then 'unknown'
    when vr.visit_key is not null then 'likely_bot'
    when coalesce(uv.ua_visit_count, 0) >= 5
      and not coalesce(ve.reached_counter_enter, false)
      then 'likely_bot'
    when coalesce(ve.reached_counter_enter, false)
      and not (
        va.user_agent ~* (
          'bot|crawler|spider|slurp|headless|phantomjs|puppeteer|playwright|'
          || 'selenium|webdriver'
        )
      )
      then 'likely_human'
    when coalesce(ve.reached_home_open, false)
      and coalesce(ve.funnel_event_count, 0) >= 1
      then 'unknown'
    else 'unknown'
  end as traffic_quality
from visit_access va
left join visit_events ve on ve.visit_key = va.visit_key
left join visit_rapid vr on vr.visit_key = va.visit_key
left join ua_volume uv
  on uv.ua_norm = coalesce(nullif(btrim(va.user_agent), ''), '(empty)');

-- visitor_summary（既存仕様維持）
create view public.visitor_summary as
with today as (
  select (timezone('Asia/Tokyo', now()))::date as report_date
),
visitor_first_visit as (
  select visitor_id, min(visit_date_jst) as first_visit_date
  from public.analytics_visits_base
  group by visitor_id
),
today_visits as (
  select distinct visitor_id, visit_key
  from public.analytics_visits_base v
  cross join today t
  where v.visit_date_jst = t.report_date
),
today_visitors as (
  select distinct visitor_id from today_visits
),
classified as (
  select
    tv.visitor_id,
    (vfv.first_visit_date = t.report_date) as is_new_visitor,
    (select count(*) from today_visits tv2 where tv2.visitor_id = tv.visitor_id)
      as visits_today
  from today_visitors tv
  cross join today t
  join visitor_first_visit vfv on vfv.visitor_id = tv.visitor_id
),
totals as (
  select
    count(*) as total_visitors,
    count(*) filter (where is_new_visitor) as new_visitors,
    count(*) filter (where not is_new_visitor) as returning_visitors,
    sum(visits_today) as total_visits_today
  from classified
)
select
  t.report_date as "日付",
  coalesce(tot.total_visitors, 0) as total_visitors,
  coalesce(tot.new_visitors, 0) as new_visitors,
  coalesce(tot.returning_visitors, 0) as returning_visitors,
  round(
    100.0 * coalesce(tot.returning_visitors, 0)
      / nullif(coalesce(tot.total_visitors, 0), 0),
    1
  ) as returning_rate_pct,
  round(
    coalesce(tot.total_visits_today, 0)::numeric
      / nullif(coalesce(tot.total_visitors, 0), 0),
    2
  ) as avg_visits_per_visitor,
  (
    select count(*)
    from (
      select visitor_id
      from public.analytics_visits_base
      group by visitor_id
      having count(distinct visit_key) >= 2
    ) multi
  ) as visitors_with_2plus_visits_all_time
from today t
cross join totals tot;

create view public.visitor_metrics_trend as
with day_series as (
  select series_day::date as report_date
  from generate_series(
    (timezone('Asia/Tokyo', now()))::date - 90,
    (timezone('Asia/Tokyo', now()))::date,
    '1 day'::interval
  ) as series_day
),
visitor_first_visit as (
  select visitor_id, min(visit_date_jst) as first_visit_date
  from public.analytics_visits_base
  group by visitor_id
),
daily_visitors as (
  select visit_date_jst as report_date, visitor_id
  from public.analytics_visits_base
  group by visit_date_jst, visitor_id
)
select
  d.report_date as "日付",
  count(dv.visitor_id) as total_visitors,
  count(dv.visitor_id) filter (where vfv.first_visit_date = d.report_date) as new_visitors,
  count(dv.visitor_id) filter (where vfv.first_visit_date < d.report_date) as returning_visitors,
  round(
    100.0 * count(dv.visitor_id) filter (where vfv.first_visit_date < d.report_date)
      / nullif(count(dv.visitor_id), 0),
    1
  ) as returning_rate_pct
from day_series d
left join daily_visitors dv on dv.report_date = d.report_date
left join visitor_first_visit vfv on vfv.visitor_id = dv.visitor_id
group by d.report_date
order by d.report_date desc;

create view public.visitor_retention_summary as
with visitor_first_visit as (
  select visitor_id, min(visit_date_jst) as cohort_date
  from public.analytics_visits_base
  group by visitor_id
),
visitor_visit_days as (
  select distinct visitor_id, visit_date_jst as visit_date
  from public.analytics_visits_base
),
cohorts as (
  select cohort_date, count(*) as cohort_size
  from visitor_first_visit
  where cohort_date <= (timezone('Asia/Tokyo', now()))::date - 1
  group by cohort_date
),
day1 as (
  select vfv.cohort_date, count(distinct vvd.visitor_id) as retained
  from visitor_first_visit vfv
  join visitor_visit_days vvd
    on vvd.visitor_id = vfv.visitor_id
   and vvd.visit_date = vfv.cohort_date + 1
  group by vfv.cohort_date
),
day7 as (
  select vfv.cohort_date, count(distinct vvd.visitor_id) as retained
  from visitor_first_visit vfv
  join visitor_visit_days vvd
    on vvd.visitor_id = vfv.visitor_id
   and vvd.visit_date = vfv.cohort_date + 7
  group by vfv.cohort_date
)
select
  c.cohort_date as "コホート日",
  c.cohort_size as "新規visitor数",
  coalesce(d1.retained, 0) as "Day1再訪数",
  round(100.0 * coalesce(d1.retained, 0) / nullif(c.cohort_size, 0), 1) as "Day1 retention（%）",
  coalesce(d7.retained, 0) as "Day7再訪数",
  round(100.0 * coalesce(d7.retained, 0) / nullif(c.cohort_size, 0), 1) as "Day7 retention（%）"
from cohorts c
left join day1 d1 on d1.cohort_date = c.cohort_date
left join day7 d7 on d7.cohort_date = c.cohort_date
order by c.cohort_date desc;

-- ref_funnel: 今回 visit の ref（direct = 直接流入）
create view public.ref_funnel as
with today as (
  select (timezone('Asia/Tokyo', now()))::date as report_date
),
base as (
  select * from public.analytics_visits_base v
  cross join today t
  where v.visit_date_jst = t.report_date
),
ref_stats as (
  select
    ref_label,
    count(*) as access_count,
    count(*) filter (where reached_home_open) as home_open_count,
    count(*) filter (where reached_counter_enter) as counter_enter_count,
    count(*) filter (where reached_drink_selected) as drink_selected_count,
    count(*) filter (where reached_record_start) as record_start_count,
    count(*) filter (where reached_record_finish) as record_finish_count,
    count(*) filter (where reached_generate_success) as generate_success_count,
    count(*) filter (where reached_login_success) as login_login_success_count,
    count(*) filter (where reached_save_diary) as save_diary_count
  from base
  group by ref_label
)
select
  t.report_date as "日付",
  rs.ref_label as ref,
  rs.access_count,
  rs.home_open_count,
  rs.counter_enter_count,
  rs.drink_selected_count,
  rs.record_start_count,
  rs.record_finish_count,
  rs.generate_success_count,
  rs.login_login_success_count as login_success_count,
  rs.save_diary_count,
  round(100.0 * rs.home_open_count / nullif(rs.access_count, 0), 1) as home_open_rate_from_access_pct,
  round(100.0 * rs.counter_enter_count / nullif(rs.access_count, 0), 1) as counter_enter_rate_from_access_pct,
  round(100.0 * rs.drink_selected_count / nullif(rs.access_count, 0), 1) as drink_selected_rate_from_access_pct,
  round(100.0 * rs.record_start_count / nullif(rs.access_count, 0), 1) as record_start_rate_from_access_pct,
  round(100.0 * rs.record_finish_count / nullif(rs.access_count, 0), 1) as record_finish_rate_from_access_pct,
  round(100.0 * rs.generate_success_count / nullif(rs.access_count, 0), 1) as generate_success_rate_from_access_pct,
  round(100.0 * rs.login_login_success_count / nullif(rs.access_count, 0), 1) as login_success_rate_from_access_pct,
  round(100.0 * rs.save_diary_count / nullif(rs.access_count, 0), 1) as save_diary_rate_from_access_pct,
  round(100.0 * rs.counter_enter_count / nullif(rs.home_open_count, 0), 1) as counter_enter_rate_from_home_open_pct,
  round(100.0 * rs.drink_selected_count / nullif(rs.counter_enter_count, 0), 1) as drink_selected_rate_from_counter_enter_pct,
  round(100.0 * rs.record_start_count / nullif(rs.drink_selected_count, 0), 1) as record_start_rate_from_drink_selected_pct,
  round(100.0 * rs.record_finish_count / nullif(rs.record_start_count, 0), 1) as record_finish_rate_from_record_start_pct,
  round(100.0 * rs.generate_success_count / nullif(rs.record_finish_count, 0), 1) as generate_success_rate_from_record_finish_pct,
  round(100.0 * rs.save_diary_count / nullif(rs.generate_success_count, 0), 1) as save_diary_rate_from_generate_success_pct
from today t
cross join ref_stats rs
order by rs.access_count desc, rs.ref_label;

create view public.visit_duration_summary as
with today as (
  select (timezone('Asia/Tokyo', now()))::date as report_date
),
base as (
  select * from public.analytics_visits_base v
  cross join today t
  where v.visit_date_jst = t.report_date
    and v.duration_sec_estimated is not null
),
agg as (
  select
    count(*) as visits_with_duration,
    round(avg(duration_sec_estimated)::numeric, 1) as avg_duration_sec,
    round(percentile_cont(0.5) within group (order by duration_sec_estimated)::numeric, 1) as median_duration_sec,
    count(*) filter (where duration_sec_estimated < 10) as visits_under_10_sec,
    count(*) filter (where duration_sec_estimated < 30) as visits_under_30_sec,
    count(*) filter (where duration_sec_estimated >= 60) as visits_60_sec_plus
  from base
),
last_event_counts as (
  select coalesce(visit_end_last_event, '(unknown)') as last_event, count(*) as visit_count
  from base
  group by coalesce(visit_end_last_event, '(unknown)')
)
select
  t.report_date as "日付",
  coalesce(a.visits_with_duration, 0) as visits_with_duration,
  coalesce(a.avg_duration_sec, 0) as avg_duration_sec,
  coalesce(a.median_duration_sec, 0) as median_duration_sec,
  coalesce(a.visits_under_10_sec, 0) as visits_under_10_sec,
  coalesce(a.visits_under_30_sec, 0) as visits_under_30_sec,
  coalesce(a.visits_60_sec_plus, 0) as visits_60_sec_plus,
  (
    select jsonb_agg(
      jsonb_build_object('lastEvent', lec.last_event, 'visitCount', lec.visit_count)
      order by lec.visit_count desc
    )
    from last_event_counts lec
  ) as exit_by_last_event
from today t
left join agg a on true;

create view public.traffic_quality_summary as
with today as (
  select (timezone('Asia/Tokyo', now()))::date as report_date
),
base as (
  select * from public.analytics_visits_base v
  cross join today t
  where v.visit_date_jst = t.report_date
)
select
  t.report_date as "日付",
  count(*) as total_visits,
  count(*) filter (where traffic_quality = 'likely_human') as likely_human,
  count(*) filter (where traffic_quality = 'likely_bot') as likely_bot,
  count(*) filter (where traffic_quality = 'unknown') as unknown,
  round(100.0 * count(*) filter (where traffic_quality = 'likely_human') / nullif(count(*), 0), 1) as likely_human_pct,
  round(100.0 * count(*) filter (where traffic_quality = 'likely_bot') / nullif(count(*), 0), 1) as likely_bot_pct,
  round(100.0 * count(*) filter (where traffic_quality = 'unknown') / nullif(count(*), 0), 1) as unknown_pct
from today t
cross join base b
group by t.report_date;

-- acquisition_ref_funnel: 初回獲得媒体別・visitor 単位到達（全期間）
create view public.acquisition_ref_funnel as
with visitor_acquisition as (
  select
    visitor_id,
    coalesce(nullif(btrim(max(acquisition_ref)), ''), 'unknown') as acquisition_ref
  from public.access_logs
  where is_admin = false
  group by visitor_id
),
visitor_reach as (
  select
    va.acquisition_ref,
    va.visitor_id,
    count(av.visit_key) as visits_for_visitor,
    bool_or(av.reached_home_open) as reached_home_open,
    bool_or(av.reached_counter_enter) as reached_counter_enter,
    bool_or(av.reached_drink_selected) as reached_drink_selected,
    bool_or(av.reached_record_start) as reached_record_start,
    bool_or(av.reached_record_finish) as reached_record_finish,
    bool_or(av.reached_generate_success) as reached_generate_success,
    bool_or(av.reached_login_success) as reached_login_success,
    bool_or(av.reached_save_diary) as reached_save_diary
  from visitor_acquisition va
  left join public.analytics_visits_base av on av.visitor_id = va.visitor_id
  group by va.acquisition_ref, va.visitor_id
)
select
  acquisition_ref,
  count(*) as visitors,
  coalesce(sum(visits_for_visitor), 0) as visits,
  count(*) filter (where reached_home_open) as home_open,
  count(*) filter (where reached_counter_enter) as counter_enter,
  count(*) filter (where reached_drink_selected) as drink_selected,
  count(*) filter (where reached_record_start) as record_start,
  count(*) filter (where reached_record_finish) as record_finish,
  count(*) filter (where reached_generate_success) as generate_success,
  count(*) filter (where reached_login_success) as login_success,
  count(*) filter (where reached_save_diary) as save_diary,
  round(100.0 * count(*) filter (where reached_home_open) / nullif(count(*), 0), 1) as home_open_visitor_rate_pct,
  round(100.0 * count(*) filter (where reached_counter_enter) / nullif(count(*), 0), 1) as counter_enter_visitor_rate_pct,
  round(100.0 * count(*) filter (where reached_drink_selected) / nullif(count(*), 0), 1) as drink_selected_visitor_rate_pct,
  round(100.0 * count(*) filter (where reached_record_start) / nullif(count(*), 0), 1) as record_start_visitor_rate_pct,
  round(100.0 * count(*) filter (where reached_record_finish) / nullif(count(*), 0), 1) as record_finish_visitor_rate_pct,
  round(100.0 * count(*) filter (where reached_generate_success) / nullif(count(*), 0), 1) as generate_success_visitor_rate_pct,
  round(100.0 * count(*) filter (where reached_login_success) / nullif(count(*), 0), 1) as login_success_visitor_rate_pct,
  round(100.0 * count(*) filter (where reached_save_diary) / nullif(count(*), 0), 1) as save_diary_visitor_rate_pct
from visitor_reach
group by acquisition_ref
order by visitors desc, acquisition_ref;

-- daily_analysis_dashboard（016 再作成）
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
  select visitor_id, min(visit_date_jst) as first_visit_date
  from public.analytics_visits_base
  group by visitor_id
),
daily_visitors as (
  select distinct visit_date_jst as report_date, visitor_id
  from public.analytics_visits_base
),
visitor_stats as (
  select
    dv.report_date,
    count(*) as total_visitors,
    count(*) filter (where vfv.first_visit_date = dv.report_date) as new_visitors,
    count(*) filter (where vfv.first_visit_date < dv.report_date) as returning_visitors
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
    round(percentile_cont(0.5) within group (order by duration_sec_estimated)::numeric, 1) as median_duration_sec,
    count(*) filter (where duration_sec_estimated < 10) as visits_under_10_sec,
    count(*) filter (where duration_sec_estimated < 30) as visits_under_30_sec,
    count(*) filter (where duration_sec_estimated >= 60) as visits_60_sec_plus
  from public.analytics_visits_base
  where duration_sec_estimated is not null
  group by visit_date_jst
),
diaries_stats as (
  select (created_at at time zone 'Asia/Tokyo')::date as report_date, count(*)::bigint as diaries_created
  from public.diaries where is_admin = false group by 1
),
feedback_stats as (
  select (created_at at time zone 'Asia/Tokyo')::date as report_date, count(*)::bigint as feedback_count
  from public.feedbacks where is_admin = false group by 1
)
select
  d.report_date as date,
  coalesce(vs.total_visitors, 0) as total_visitors,
  coalesce(vs.new_visitors, 0) as new_visitors,
  coalesce(vs.returning_visitors, 0) as returning_visitors,
  round(100.0 * coalesce(vs.returning_visitors, 0) / nullif(coalesce(vs.total_visitors, 0), 0), 1) as returning_rate_pct,
  round(coalesce(vt.total_visits, 0)::numeric / nullif(coalesce(vs.total_visitors, 0), 0), 2) as avg_visits_per_visitor,
  coalesce(vt.total_visits, 0) as total_visits,
  coalesce(vt.likely_human, 0) as likely_human,
  coalesce(vt.likely_bot, 0) as likely_bot,
  coalesce(vt.unknown, 0) as unknown,
  round(100.0 * coalesce(vt.likely_human, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as likely_human_pct,
  round(100.0 * coalesce(vt.likely_bot, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as likely_bot_pct,
  round(100.0 * coalesce(vt.unknown, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as unknown_pct,
  coalesce(vt.home_open_visits, 0) as home_open_visits,
  coalesce(vt.counter_enter_visits, 0) as counter_enter_visits,
  coalesce(vt.drink_selected_visits, 0) as drink_selected_visits,
  coalesce(vt.record_start_visits, 0) as record_start_visits,
  coalesce(vt.record_finish_visits, 0) as record_finish_visits,
  coalesce(vt.generate_success_visits, 0) as generate_success_visits,
  coalesce(vt.save_diary_visits, 0) as save_diary_visits,
  round(100.0 * coalesce(vt.home_open_visits, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as home_open_rate_pct,
  round(100.0 * coalesce(vt.counter_enter_visits, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as counter_enter_rate_pct,
  round(100.0 * coalesce(vt.drink_selected_visits, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as drink_selected_rate_pct,
  round(100.0 * coalesce(vt.record_start_visits, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as record_start_rate_pct,
  round(100.0 * coalesce(vt.generate_success_visits, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as generate_success_rate_pct,
  round(100.0 * coalesce(vt.save_diary_visits, 0) / nullif(coalesce(vt.total_visits, 0), 0), 1) as save_diary_rate_pct,
  coalesce(ds.visits_with_duration, 0) as visits_with_duration,
  coalesce(ds.avg_duration_sec, 0) as avg_duration_sec,
  coalesce(ds.median_duration_sec, 0) as median_duration_sec,
  coalesce(ds.visits_under_10_sec, 0) as visits_under_10_sec,
  coalesce(ds.visits_under_30_sec, 0) as visits_under_30_sec,
  coalesce(ds.visits_60_sec_plus, 0) as visits_60_sec_plus,
  coalesce(di.diaries_created, 0) as diaries_created,
  coalesce(fb.feedback_count, 0) as feedback_count
from day_series d
left join visitor_stats vs using (report_date)
left join visit_stats vt using (report_date)
left join duration_stats ds using (report_date)
left join diaries_stats di using (report_date)
left join feedback_stats fb using (report_date)
order by d.report_date desc;
