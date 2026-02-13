-- =====================================================
-- weekly_reports 테이블 UNIQUE 제약 조건 추가
-- 동일 사용자의 동일 주차 보고서 중복 생성 방지
--
-- 배경:
--   pg_cron이 10분 간격으로 batch 함수를 호출하는데,
--   앞선 호출이 아직 실행 중이면 동일 유저에 대해
--   중복 보고서가 생성될 수 있음 (SELECT-then-INSERT 패턴)
--   DB 레벨에서 유일성을 보장하여 데이터 무결성 확보
-- =====================================================

-- 1. 기존 중복 데이터 확인 (있으면 오래된 것 삭제)
DO $$
DECLARE
  v_duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT user_id, week_start_date, COUNT(*) as cnt
    FROM weekly_reports
    GROUP BY user_id, week_start_date
    HAVING COUNT(*) > 1
  ) dups;

  IF v_duplicate_count > 0 THEN
    RAISE NOTICE '⚠️ 중복 보고서 % 건 발견 - 최신 1건만 남기고 삭제', v_duplicate_count;

    -- 중복 중 가장 최근(created_at 기준) 1건만 남기고 삭제
    DELETE FROM report_tarot_selections
    WHERE report_id IN (
      SELECT id FROM weekly_reports wr
      WHERE EXISTS (
        SELECT 1 FROM weekly_reports wr2
        WHERE wr2.user_id = wr.user_id
          AND wr2.week_start_date = wr.week_start_date
          AND wr2.created_at > wr.created_at
      )
    );

    DELETE FROM weekly_report_sections
    WHERE report_id IN (
      SELECT id FROM weekly_reports wr
      WHERE EXISTS (
        SELECT 1 FROM weekly_reports wr2
        WHERE wr2.user_id = wr.user_id
          AND wr2.week_start_date = wr.week_start_date
          AND wr2.created_at > wr.created_at
      )
    );

    DELETE FROM weekly_reports wr
    WHERE EXISTS (
      SELECT 1 FROM weekly_reports wr2
      WHERE wr2.user_id = wr.user_id
        AND wr2.week_start_date = wr.week_start_date
        AND wr2.created_at > wr.created_at
    );

    RAISE NOTICE '✅ 중복 보고서 정리 완료';
  ELSE
    RAISE NOTICE '✅ 중복 보고서 없음 - 바로 제약 조건 추가';
  END IF;
END $$;

-- 2. UNIQUE 제약 조건 추가
ALTER TABLE weekly_reports
ADD CONSTRAINT unique_weekly_reports_user_week
UNIQUE (user_id, week_start_date);

-- 3. 확인
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'weekly_reports'::regclass;
