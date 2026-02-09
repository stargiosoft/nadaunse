-- Fix weekly_reports: KST 기준 날짜 보정 + 토요일 기준 월/주차 재계산
--
-- 문제 1: week_start_date가 UTC 변환으로 인해 토요일로 저장된 경우
--   예: 실제 일요일 2/1 KST → DB에 1/31(토)로 저장
--
-- 문제 2: month/week가 일요일(시작일) 기준으로 계산되어 월 경계 주차가 누락
--   예: 2/1~2/7 주간이 "1월 5주차"로 분류 → "2월 1주차"가 사라짐
--
-- 해결:
--   1. week_start_date가 토요일이면 일요일로 보정 (+1일)
--   2. week_end_date(토요일) 기준으로 month/year/week 재계산

UPDATE weekly_reports
SET
  -- week_start_date가 토요일(DOW=6)이면 일요일로 보정
  week_start_date = CASE
    WHEN EXTRACT(DOW FROM week_start_date) = 6 THEN week_start_date + INTERVAL '1 day'
    ELSE week_start_date
  END,
  -- 토요일(week_end_date) 기준 연/월 재계산
  year = EXTRACT(YEAR FROM week_end_date)::int,
  month = EXTRACT(MONTH FROM week_end_date)::int,
  -- 토요일 기준 주차 재계산: CEIL((일자 + 해당월1일의요일) / 7)
  week = CEIL(
    (EXTRACT(DAY FROM week_end_date) + EXTRACT(DOW FROM DATE_TRUNC('month', week_end_date))) / 7.0
  )::int;
