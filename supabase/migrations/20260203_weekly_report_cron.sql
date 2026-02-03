-- =====================================================
-- 주간 보고서 자동 발송 스케줄 (pg_cron + pg_net)
-- 매주 화요일 15:30 KST (06:30 UTC)에 Edge Function 호출
-- =====================================================

-- 1. pg_net extension 활성화 (HTTP 요청용)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. 기존 스케줄 삭제 (있으면)
DO $$
BEGIN
  PERFORM cron.unschedule('weekly-report-batch');
  RAISE NOTICE 'Existing schedule removed: weekly-report-batch';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron not available';
  WHEN OTHERS THEN
    -- 스케줄이 없으면 무시
    RAISE NOTICE 'No existing schedule to remove';
END $$;

-- 3. 새 스케줄 등록
-- 매주 일요일 12:00 UTC = 21:00 KST
-- Vault에서 service_role_key 가져와서 사용
DO $$
DECLARE
  v_supabase_url text := 'https://hyltbeewxaqashyivilu.supabase.co';  -- STAGING
  v_function_url text;
BEGIN
  v_function_url := v_supabase_url || '/functions/v1/generate-weekly-reports-batch';

  PERFORM cron.schedule(
    'weekly-report-batch',
    '30 6 * * 2',  -- 매주 화요일 06:30 UTC (KST 15:30)
    $$
    SELECT net.http_post(
      url := 'https://hyltbeewxaqashyivilu.supabase.co/functions/v1/generate-weekly-reports-batch',  -- STAGING
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := '{}'::jsonb
    );
    $$
  );

  RAISE NOTICE 'pg_cron schedule created: weekly-report-batch (30 6 * * 2 = 매주 화요일 15:30 KST)';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron or pg_net not available, skipping schedule creation';
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create schedule: %', SQLERRM;
END $$;

-- 4. 스케줄 확인용 뷰 (선택적)
-- SELECT * FROM cron.job WHERE jobname = 'weekly-report-batch';

-- 5. 수동 테스트용 함수
CREATE OR REPLACE FUNCTION trigger_weekly_report_batch()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text := 'https://hyltbeewxaqashyivilu.supabase.co';  -- STAGING
  v_function_url text;
  v_service_key text;
  v_response_id bigint;
BEGIN
  v_function_url := v_supabase_url || '/functions/v1/generate-weekly-reports-batch';

  -- Vault에서 service_role_key 가져오기
  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF v_service_key IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'service_role_key not found in vault'
    );
  END IF;

  SELECT net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb
  ) INTO v_response_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Weekly report batch triggered',
    'request_id', v_response_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END $$;

COMMENT ON FUNCTION trigger_weekly_report_batch() IS '주간 보고서 배치 수동 실행 (테스트용)';

-- =====================================================
-- 사용법:
--
-- 1. 스케줄 확인:
--    SELECT * FROM cron.job WHERE jobname = 'weekly-report-batch';
--
-- 2. 수동 실행 (테스트):
--    SELECT trigger_weekly_report_batch();
--
-- 3. 스케줄 삭제:
--    SELECT cron.unschedule('weekly-report-batch');
--
-- 4. 실행 로그 확인:
--    SELECT * FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-report-batch')
--    ORDER BY start_time DESC LIMIT 10;
-- =====================================================
