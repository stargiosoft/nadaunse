# Database Migrations

Supabase 데이터베이스 마이그레이션 스크립트 모음입니다.

---

## 📋 마이그레이션 목록

### 1. `20241218_add_calendar_type_and_zodiac_to_saju_records.sql`

**작성일**: 2024-12-18  
**목적**: `saju_records` 테이블에 양력/음력 구분 및 띠 정보 컬럼 추가

**변경 내용**:
- `calendar_type` 컬럼 추가 (text, 기본값: 'solar')
- `zodiac` 컬럼 추가 (text, nullable)
- 띠 계산 함수 `calculate_zodiac()` 생성
- 기존 데이터에 띠 자동 계산 및 업데이트
- 검색 성능 향상을 위한 인덱스 추가

---

## 🚀 마이그레이션 실행 방법

### 방법 1: Supabase Dashboard (추천)

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭
5. 마이그레이션 SQL 파일 내용을 복사하여 붙여넣기
6. **RUN** 버튼 클릭하여 실행

### 방법 2: Supabase CLI

```bash
# Supabase CLI 설치 (처음 한 번만)
npm install -g supabase

# 프로젝트 연결
supabase login
supabase link --project-ref <your-project-ref>

# 마이그레이션 실행
supabase db push
```

### 방법 3: psql (PostgreSQL CLI)

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/20241218_add_calendar_type_and_zodiac_to_saju_records.sql
```

---

## ✅ 마이그레이션 확인

마이그레이션 실행 후 다음 쿼리로 확인:

```sql
-- 1. 컬럼이 추가되었는지 확인
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'saju_records'
AND column_name IN ('calendar_type', 'zodiac');

-- 2. 기존 데이터에 zodiac이 업데이트되었는지 확인
SELECT 
  full_name,
  birth_date,
  calendar_type,
  zodiac
FROM saju_records
LIMIT 10;

-- 3. 인덱스가 생성되었는지 확인
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'saju_records'
AND indexname LIKE 'idx_saju_records_%';
```

---

## 🔄 롤백 (Rollback)

마이그레이션을 되돌려야 할 경우:

```sql
-- 1. 컬럼 삭제
ALTER TABLE saju_records
DROP COLUMN IF EXISTS calendar_type,
DROP COLUMN IF EXISTS zodiac;

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS calculate_zodiac(timestamptz);

-- 3. 인덱스 삭제
DROP INDEX IF EXISTS idx_saju_records_zodiac;
DROP INDEX IF EXISTS idx_saju_records_calendar_type;
```

---

## 📝 주의사항

1. **프로덕션 환경**: 반드시 백업 후 실행
2. **다운타임**: 컬럼 추가는 빠르지만, 대량 UPDATE는 시간이 걸릴 수 있음
3. **기존 데이터**: `zodiac`이 NULL인 레코드만 자동 계산됨
4. **calendar_type**: 기본값은 'solar'(양력)이며, 필요시 수동으로 'lunar'(음력)로 변경

---

## 🔗 관련 문서

- [DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md) - 전체 DB 스키마 문서
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

---

**문서 작성일**: 2024-12-18  
**최종 수정일**: 2024-12-18
