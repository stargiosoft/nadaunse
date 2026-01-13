# 🚀 빠른 시작 가이드

Supabase에서 마이그레이션을 5분 안에 실행하는 방법입니다.

---

## ⚡ 1분 요약

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. **SQL Editor** 클릭
3. 아래 SQL 복사 & 붙여넣기 (⚠️ -- 주석 라인부터 복사하세요)
4. **RUN** 클릭

---

## 📝 복사할 SQL (아래 내용만 복사하세요)

---
-- saju_records 테이블에 calendar_type, zodiac 컬럼 추가

-- 1. 컬럼 추가
ALTER TABLE saju_records
ADD COLUMN IF NOT EXISTS calendar_type text DEFAULT 'solar',
ADD COLUMN IF NOT EXISTS zodiac text;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN saju_records.calendar_type IS '양력/음력 구분: solar(양력), lunar(음력)';
COMMENT ON COLUMN saju_records.zodiac IS '띠 정보: 쥐띠, 소띠, 호랑이띠, 토끼띠, 용띠, 뱀띠, 말띠, 양띠, 원숭이띠, 닭띠, 개띠, 돼지띠';

-- 3. 띠 계산 함수 생성
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

-- 4. 기존 데이터에 띠 자동 계산 (NULL인 경우만)
UPDATE saju_records
SET zodiac = calculate_zodiac(birth_date)
WHERE zodiac IS NULL;

-- 5. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_saju_records_zodiac ON saju_records(zodiac);
CREATE INDEX IF NOT EXISTS idx_saju_records_calendar_type ON saju_records(calendar_type);
---

## ✅ 실행 확인

실행 후 다음 쿼리로 확인:

---
-- 새로 추가된 컬럼 확인
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'saju_records'
AND column_name IN ('calendar_type', 'zodiac');

-- 데이터 확인
SELECT 
  full_name,
  birth_date,
  calendar_type,
  zodiac
FROM saju_records
LIMIT 5;
---

예상 결과:
```
calendar_type | zodiac
--------------+--------
solar         | 쥐띠
solar         | 원숭이띠
lunar         | 용띠
```

---

## 🔧 트러블슈팅

### 에러: "column already exists"
- 이미 실행되었습니다. 확인 쿼리로 검증하세요.

### 에러: "permission denied"
- Supabase 대시보드의 **Service Role Key**로 로그인했는지 확인

### 에러: "syntax error at or near ```"
- ⚠️ markdown 코드 블록 표시(\`\`\`sql)까지 복사하셨습니다
- 위의 "복사할 SQL" 섹션에서 `---` 구분선 사이의 내용만 복사하세요

### 기존 데이터에 zodiac이 NULL
- UPDATE 쿼리를 다시 실행하세요:

---
UPDATE saju_records
SET zodiac = calculate_zodiac(birth_date)
WHERE zodiac IS NULL;
---

## 📞 도움말

- [전체 마이그레이션 문서](./README.md)
- [DB 스키마 문서](../../DATABASE_SCHEMA.md)
- [Supabase 공식 문서](https://supabase.com/docs)

---

**작성일**: 2024-12-18