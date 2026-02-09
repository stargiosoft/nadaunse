-- anonymous_free_views 일일 자동 정리
-- 매일 KST 09:00 (UTC 00:00)에 전날 이전 데이터 삭제
-- viewed_date는 KST 기준이므로 CURRENT_DATE(UTC) 미만 = 어제 이전 레코드

-- 기존 스케줄 삭제 (있으면)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-anonymous-free-views');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- pg_cron 스케줄 등록
SELECT cron.schedule(
  'cleanup-anonymous-free-views',
  '0 0 * * *',  -- 매일 UTC 00:00 (KST 09:00)
  $$DELETE FROM public.anonymous_free_views WHERE viewed_date < CURRENT_DATE;$$
);

COMMENT ON COLUMN public.anonymous_free_views.viewed_date IS 'KST 기준 조회 날짜 (매일 09:00 KST 자동 정리)';
