-- =====================================================
-- 주간 보고서 배치 스케줄 변경: 10분 간격 반복 호출
-- 변경 이유: 96명+ 대상에서 Edge Function 타임아웃(400초)으로
--   1회 호출에 전체 처리 불가 → 10분 간격 반복 호출로 이어하기 패턴 적용
-- 배치 함수가 이미 생성된 보고서를 자동 스킵하므로 중복 처리 없음
-- =====================================================

-- 1. 기존 스케줄 삭제
DO $$
BEGIN
  PERFORM cron.unschedule('weekly-report-batch');
  RAISE NOTICE 'Existing schedule removed: weekly-report-batch';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No existing schedule to remove: %', SQLERRM;
END $$;

-- 2. 새 스케줄 등록
-- 매주 일요일 03:00~12:59 UTC (12:00~21:59 KST), 10분 간격
-- ┌───────── minute (*/10 = 매 10분)
-- │ ┌─────── hour (3-12 = UTC 03~12시 = KST 12~21시)
-- │ │ ┌───── day of month (* = 매일)
-- │ │ │ ┌─── month (* = 매월)
-- │ │ │ │ ┌─ day of week (0 = 일요일)
-- │ │ │ │ │
-- */10 3-12 * * 0
--
-- 예상 동작:
--   12:00 KST → 1차 호출 (~24명 처리)
--   12:10 KST → 2차 호출 (~24명 처리, 기존 24명 스킵)
--   ...
--   전체 완료 후 → "대상 0명" 즉시 반환
--
-- 처리량 계산 (concurrency 3 기준):
--   100명: ~5회 호출, ~50분 완료
--   500명: ~21회 호출, ~3.5시간 완료
--   1000명: ~42회 호출, ~7시간 완료

-- ⚠️ 아래 URL을 환경에 맞게 변경하세요:
--   Production: https://kcthtpmxffppfbkjjkub.supabase.co
--   Staging:    https://hyltbeewxaqashyivilu.supabase.co

DO $$
BEGIN
  PERFORM cron.schedule(
    'weekly-report-batch',
    '*/10 3-12 * * 0',  -- 매주 일요일 10분 간격 (KST 12:00~21:59)
    $$
    SELECT net.http_post(
      url := 'https://kcthtpmxffppfbkjjkub.supabase.co/functions/v1/generate-weekly-reports-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := '{}'::jsonb
    );
    $$
  );

  RAISE NOTICE 'pg_cron schedule created: weekly-report-batch (*/10 3-12 * * 0 = 매주 일요일 KST 12:00~21:59, 10분 간격)';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron or pg_net not available, skipping schedule creation';
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create schedule: %', SQLERRM;
END $$;

-- 3. 수동 테스트용 함수 업데이트 (Production URL)
CREATE OR REPLACE FUNCTION trigger_weekly_report_batch()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text := 'https://kcthtpmxffppfbkjjkub.supabase.co';
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
-- 확인 & 운영:
--
-- 1. 스케줄 확인:
--    SELECT * FROM cron.job WHERE jobname = 'weekly-report-batch';
--
-- 2. 수동 실행 (테스트):
--    SELECT trigger_weekly_report_batch();
--
-- 3. 실행 로그 확인:
--    SELECT * FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-report-batch')
--    ORDER BY start_time DESC LIMIT 20;
--
-- 4. 스케줄 일시 중지:
--    SELECT cron.unschedule('weekly-report-batch');
--
-- 5. 스케줄 재등록:
--    위 DO $$ 블록 다시 실행
-- =====================================================
