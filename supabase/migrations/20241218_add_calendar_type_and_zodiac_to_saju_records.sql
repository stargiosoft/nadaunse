-- ==========================================
-- Migration: Add calendar_type and zodiac columns to saju_records
-- Date: 2024-12-18
-- Description: 
--   - calendar_type: 양력/음력 구분 (solar/lunar)
--   - zodiac: 띠 정보 (쥐띠, 소띠, 호랑이띠 등)
-- ==========================================

-- 1. calendar_type 컬럼 추가 (양력/음력 구분)
ALTER TABLE saju_records
ADD COLUMN IF NOT EXISTS calendar_type text DEFAULT 'solar';

-- 2. zodiac 컬럼 추가 (띠 정보)
ALTER TABLE saju_records
ADD COLUMN IF NOT EXISTS zodiac text;

-- 3. 컬럼 코멘트 추가 (문서화)
COMMENT ON COLUMN saju_records.calendar_type IS '양력/음력 구분: solar(양력), lunar(음력)';
COMMENT ON COLUMN saju_records.zodiac IS '띠 정보: 쥐띠, 소띠, 호랑이띠, 토끼띠, 용띠, 뱀띠, 말띠, 양띠, 원숭이띠, 닭띠, 개띠, 돼지띠';

-- 4. (선택사항) 기존 데이터에 대한 띠 계산 함수
-- 생년(year)을 기준으로 띠를 계산하는 PostgreSQL 함수
CREATE OR REPLACE FUNCTION calculate_zodiac(birth_date timestamptz)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_val integer;
  zodiac_arr text[] := ARRAY['원숭이띠', '닭띠', '개띠', '돼지띠', '쥐띠', '소띠', '호랑이띠', '토끼띠', '용띠', '뱀띠', '말띠', '양띠'];
BEGIN
  year_val := EXTRACT(YEAR FROM birth_date)::integer;
  RETURN zodiac_arr[(year_val % 12) + 1];
END;
$$;

-- 5. (선택사항) 기존 데이터에 띠 자동 계산 및 업데이트
-- ⚠️ 주의: 이 쿼리는 기존 zodiac 값이 NULL인 레코드만 업데이트합니다
UPDATE saju_records
SET zodiac = calculate_zodiac(birth_date)
WHERE zodiac IS NULL;

-- 6. (선택사항) 인덱스 추가 - zodiac 검색 성능 향상
CREATE INDEX IF NOT EXISTS idx_saju_records_zodiac ON saju_records(zodiac);
CREATE INDEX IF NOT EXISTS idx_saju_records_calendar_type ON saju_records(calendar_type);

-- ==========================================
-- Migration Complete
-- ==========================================

-- 확인 쿼리 (실행 후 확인용)
-- SELECT 
--   column_name, 
--   data_type, 
--   column_default,
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'saju_records'
-- AND column_name IN ('calendar_type', 'zodiac');
