-- =====================================================
-- 미확인 태그 자동 정리 시스템
-- 3일 이상 지난 is_confirmed=false 태그를 자동 삭제하고
-- __SKIPPED__ 마커로 대체하는 함수 및 스케줄 생성
-- =====================================================

-- 1. 정리 대상 그룹 조회 함수
-- 유료: source_order_id 기준 그룹핑
-- 무료: user_id + source_content_id + created_at(초 단위) 기준 그룹핑
CREATE OR REPLACE FUNCTION get_stale_unconfirmed_tag_groups()
RETURNS TABLE (
  user_id uuid,
  source_content_id uuid,
  source_order_id uuid,
  source_type text,
  tag_count bigint,
  oldest_created_at timestamptz,
  created_at_second text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- 유료 콘텐츠: source_order_id 기준 그룹핑
  SELECT
    t.user_id,
    t.source_content_id,
    t.source_order_id,
    t.source_type,
    COUNT(*)::bigint AS tag_count,
    MIN(t.created_at) AS oldest_created_at,
    NULL::text AS created_at_second
  FROM public.user_trait_tags t
  WHERE t.is_confirmed = false
    AND t.source_type = 'paid_content'
    AND t.source_order_id IS NOT NULL
    AND t.tag_name != '__SKIPPED__'
    AND t.created_at < NOW() - INTERVAL '3 days'
  GROUP BY t.user_id, t.source_content_id, t.source_order_id, t.source_type

  UNION ALL

  -- 무료 콘텐츠: user_id + source_content_id + created_at 초 단위 그룹핑
  SELECT
    t.user_id,
    t.source_content_id,
    NULL::uuid AS source_order_id,
    t.source_type,
    COUNT(*)::bigint AS tag_count,
    MIN(t.created_at) AS oldest_created_at,
    TO_CHAR(t.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at_second
  FROM public.user_trait_tags t
  WHERE t.is_confirmed = false
    AND t.source_type = 'free_content'
    AND t.tag_name != '__SKIPPED__'
    AND t.created_at < NOW() - INTERVAL '3 days'
  GROUP BY t.user_id, t.source_content_id, t.source_type, TO_CHAR(t.created_at, 'YYYY-MM-DD HH24:MI:SS');
END;
$$;

-- 2. 그룹 삭제 + __SKIPPED__ 마커 삽입 함수
CREATE OR REPLACE FUNCTION process_stale_tag_group(
  p_user_id uuid,
  p_source_content_id uuid,
  p_source_order_id uuid,
  p_source_type text,
  p_created_at_second text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count int;
  v_first_tag record;
BEGIN
  -- 1. 삭제 전 첫 번째 태그 정보 저장 (마커 생성용)
  IF p_source_type = 'paid_content' AND p_source_order_id IS NOT NULL THEN
    -- 유료 콘텐츠: source_order_id 기준
    SELECT * INTO v_first_tag
    FROM public.user_trait_tags
    WHERE user_id = p_user_id
      AND source_order_id = p_source_order_id
      AND is_confirmed = false
      AND tag_name != '__SKIPPED__'
    LIMIT 1;

    -- 2. 해당 그룹의 미확인 태그 삭제
    DELETE FROM public.user_trait_tags
    WHERE user_id = p_user_id
      AND source_order_id = p_source_order_id
      AND is_confirmed = false
      AND tag_name != '__SKIPPED__';

  ELSE
    -- 무료 콘텐츠: user_id + source_content_id + created_at 초 단위
    SELECT * INTO v_first_tag
    FROM public.user_trait_tags
    WHERE user_id = p_user_id
      AND source_content_id = p_source_content_id
      AND source_type = 'free_content'
      AND is_confirmed = false
      AND tag_name != '__SKIPPED__'
      AND TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') = p_created_at_second
    LIMIT 1;

    -- 2. 해당 그룹의 미확인 태그 삭제
    DELETE FROM public.user_trait_tags
    WHERE user_id = p_user_id
      AND source_content_id = p_source_content_id
      AND source_type = 'free_content'
      AND is_confirmed = false
      AND tag_name != '__SKIPPED__'
      AND TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') = p_created_at_second;
  END IF;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- 3. __SKIPPED__ 마커 삽입 (삭제된 태그가 있는 경우에만)
  IF v_deleted_count > 0 AND v_first_tag IS NOT NULL THEN
    INSERT INTO public.user_trait_tags (
      user_id,
      tag_name,
      tag_type,
      source_content_id,
      source_order_id,
      source_type,
      is_confirmed,
      created_at
    ) VALUES (
      p_user_id,
      '__SKIPPED__',
      'neutral',
      v_first_tag.source_content_id,
      v_first_tag.source_order_id,
      v_first_tag.source_type,
      true,  -- SKIPPED 마커는 확정 상태로 저장
      v_first_tag.created_at  -- 원본 태그의 created_at 유지
    );
  END IF;

  RETURN jsonb_build_object(
    'deleted_count', v_deleted_count,
    'skip_marker_inserted', (v_deleted_count > 0 AND v_first_tag IS NOT NULL)
  );
END;
$$;

-- 3. pg_cron 스케줄 등록 (매일 UTC 00:00 = KST 09:00)
-- 주의: pg_cron extension이 활성화되어 있어야 함
DO $$
BEGIN
  -- 기존 스케줄 삭제 (있으면)
  PERFORM cron.unschedule('cleanup-unconfirmed-tags');
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron not available, skipping schedule creation';
  WHEN OTHERS THEN
    -- 스케줄이 없으면 무시
    NULL;
END $$;

-- 새 스케줄 등록
DO $$
DECLARE
  v_project_url text;
  v_service_key text;
BEGIN
  -- Edge Function URL 구성
  -- 참고: Supabase에서 pg_cron은 Edge Function을 HTTP로 직접 호출할 수 없음
  -- 대신 pg_net extension 또는 데이터베이스 함수를 직접 호출하는 방식 사용

  -- pg_cron으로 직접 데이터베이스 함수 호출 (Edge Function 우회)
  PERFORM cron.schedule(
    'cleanup-unconfirmed-tags',
    '0 0 * * *',  -- 매일 UTC 00:00 (KST 09:00)
    $$
    DO $inner$
    DECLARE
      v_group record;
      v_result jsonb;
    BEGIN
      FOR v_group IN SELECT * FROM get_stale_unconfirmed_tag_groups() LOOP
        SELECT process_stale_tag_group(
          v_group.user_id,
          v_group.source_content_id,
          v_group.source_order_id,
          v_group.source_type,
          v_group.created_at_second
        ) INTO v_result;

        RAISE NOTICE 'Processed group: user_id=%, result=%', v_group.user_id, v_result;
      END LOOP;
    END $inner$;
    $$
  );

  RAISE NOTICE 'pg_cron schedule created: cleanup-unconfirmed-tags (0 0 * * *)';
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'pg_cron not available, skipping schedule creation';
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to create schedule: %', SQLERRM;
END $$;

-- 코멘트
COMMENT ON FUNCTION get_stale_unconfirmed_tag_groups() IS '3일 이상 된 미확인 태그 그룹 조회 (정리 대상)';
COMMENT ON FUNCTION process_stale_tag_group(uuid, uuid, uuid, text, text) IS '미확인 태그 그룹 삭제 및 __SKIPPED__ 마커 삽입';
