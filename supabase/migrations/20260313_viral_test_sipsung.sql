-- 운테 궁합: 십성(十星) 기반 결과 매칭 지원
-- 궁합 테스트는 day_master 대신 relation_type으로 결과 매칭

-- 1. relation_type 컬럼 추가
ALTER TABLE viral_test_results
  ADD COLUMN IF NOT EXISTS relation_type text;

-- 2. day_master nullable로 변경 (궁합 테스트는 day_master 없음)
ALTER TABLE viral_test_results
  ALTER COLUMN day_master DROP NOT NULL;

-- 3. relation_type 유니크 인덱스 (궁합 테스트용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_viral_test_results_test_relation
  ON viral_test_results (test_id, relation_type)
  WHERE relation_type IS NOT NULL;

-- 4. relation_type 검색용 인덱스
CREATE INDEX IF NOT EXISTS idx_viral_test_results_relation
  ON viral_test_results (test_id, relation_type)
  WHERE relation_type IS NOT NULL;
