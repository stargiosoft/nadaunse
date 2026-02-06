-- =====================================================
-- 주간 클릭수 리셋 시스템
-- 매주 월요일 00:00 KST (일요일 15:00 UTC)에 weekly_clicks 리셋
-- =====================================================

-- 1. last_weekly_clicks 컬럼 추가
ALTER TABLE master_contents
ADD COLUMN IF NOT EXISTS last_weekly_clicks INTEGER DEFAULT 0;

-- 2. 현재 누적된 weekly_clicks 초기화 (리셋 로직 없이 누적되었으므로)
UPDATE master_contents SET weekly_clicks = 0;

-- 3. 기존 스케줄 삭제 (있으면)
DO $$
BEGIN
  PERFORM cron.unschedule('weekly-clicks-reset');
  RAISE NOTICE 'Existing schedule removed: weekly-clicks-reset';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron not available';
  WHEN OTHERS THEN
    RAISE NOTICE 'No existing schedule to remove';
END $$;

-- 4. pg_cron job 등록: 매주 월요일 00:00 KST (일요일 15:00 UTC)
DO $$
BEGIN
  PERFORM cron.schedule(
    'weekly-clicks-reset',
    '0 15 * * 0',  -- 매주 일요일 15:00 UTC = 월요일 00:00 KST
    $$
    UPDATE master_contents
    SET last_weekly_clicks = weekly_clicks,
        weekly_clicks = 0;
    $$
  );

  RAISE NOTICE 'pg_cron schedule created: weekly-clicks-reset (0 15 * * 0 = 매주 월요일 00:00 KST)';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron not available, skipping schedule creation';
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create schedule: %', SQLERRM;
END $$;

-- 5. 수동 실행 함수 (테스트용)
CREATE OR REPLACE FUNCTION reset_weekly_clicks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE master_contents
  SET last_weekly_clicks = weekly_clicks,
      weekly_clicks = 0;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Weekly clicks reset completed',
    'updated_count', v_updated_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END $$;

COMMENT ON FUNCTION reset_weekly_clicks() IS '주간 클릭수 리셋 수동 실행 (테스트용): weekly_clicks → last_weekly_clicks 이동 후 0으로 리셋';

-- =====================================================
-- 사용법:
--
-- 1. 스케줄 확인:
--    SELECT * FROM cron.job WHERE jobname = 'weekly-clicks-reset';
--
-- 2. 수동 실행 (테스트):
--    SELECT reset_weekly_clicks();
--
-- 3. 스케줄 삭제:
--    SELECT cron.unschedule('weekly-clicks-reset');
--
-- 4. 실행 로그 확인:
--    SELECT * FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-clicks-reset')
--    ORDER BY start_time DESC LIMIT 10;
-- =====================================================
