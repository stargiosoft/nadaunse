-- user_consult_daily 일일 자동 정리
-- 매일 KST 09:00 (UTC 00:00)에 전날 이전 데이터 삭제
-- anonymous_free_views cron과 동일 패턴

-- 기존 스케줄 삭제 (있으면)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-user-consult-daily');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- pg_cron 스케줄 등록
SELECT cron.schedule(
  'cleanup-user-consult-daily',
  '0 0 * * *',  -- 매일 UTC 00:00 (KST 09:00)
  $$DELETE FROM public.user_consult_daily WHERE consulted_date < CURRENT_DATE;$$
);
