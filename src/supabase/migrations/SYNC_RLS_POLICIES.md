# RLS 정책 동기화 가이드 (Production → Staging)

## 📊 현재 상태 분석

### Staging (nadaunse-staging)
**모든 테이블이 UNRESTRICTED** ⚠️
- alimtalk_logs
- coupons
- master_content_questions
- master_contents
- order_results
- orders
- saju_records
- user_coupons
- users

### Production (nadaunse-production)
**일부 테이블만 UNRESTRICTED** ✅
- alimtalk_logs: RLS 활성화
- coupons: RLS 활성화
- master_content_questions: UNRESTRICTED
- master_contents: UNRESTRICTED
- order_results: RLS 활성화
- orders: RLS 활성화
- saju_records: RLS 활성화
- user_coupons: RLS 활성화
- users: UNRESTRICTED

---

## 🎯 목표

Production의 RLS 정책을 Staging으로 **완전히 복사**

---

## 📝 방법 1: SQL로 RLS 정책 추출 및 적용

### Step 1: Production에서 RLS 정책 추출

```bash
# Production Supabase에 연결
supabase link --project-ref hyltbeewxaqashyivilu

# RLS 정책 추출
supabase db dump --data-only=false --role-only=false > production_rls.sql
```

또는 **PostgreSQL 직접 쿼리**:

```sql
-- Production DB에서 실행
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

### Step 2: 각 테이블별 RLS 정책 확인

아래 SQL을 **Production DB**에서 실행하여 정확한 RLS 정책을 추출합니다:

```sql
-- 1️⃣ alimtalk_logs
SELECT pg_get_ruledef(oid) 
FROM pg_policy 
WHERE polrelid = 'public.alimtalk_logs'::regclass;

-- 2️⃣ coupons
SELECT pg_get_ruledef(oid) 
FROM pg_policy 
WHERE polrelid = 'public.coupons'::regclass;

-- 3️⃣ order_results
SELECT pg_get_ruledef(oid) 
FROM pg_policy 
WHERE polrelid = 'public.order_results'::regclass;

-- 4️⃣ orders
SELECT pg_get_ruledef(oid) 
FROM pg_policy 
WHERE polrelid = 'public.orders'::regclass;

-- 5️⃣ saju_records
SELECT pg_get_ruledef(oid) 
FROM pg_policy 
WHERE polrelid = 'public.saju_records'::regclass;

-- 6️⃣ user_coupons
SELECT pg_get_ruledef(oid) 
FROM pg_policy 
WHERE polrelid = 'public.user_coupons'::regclass;
```

---

### Step 3: Staging에 RLS 정책 적용

```bash
# Staging Supabase에 연결
supabase link --project-ref kcthtpmxffppfbkjjkub

# SQL 파일 적용 (Step 2에서 추출한 정책을 파일로 저장 후)
psql -h db.kcthtpmxffppfbkjjkub.supabase.co -U postgres < sync_rls_policies.sql
```

---

## 📝 방법 2: Supabase Dashboard에서 수동 복사

### 각 테이블별로 진행:

1. **Production Dashboard 열기**
   ```
   https://supabase.com/dashboard/project/hyltbeewxaqashyivilu/editor
   ```

2. **테이블 선택 → RLS 탭 클릭**

3. **각 정책의 SQL 복사**
   - Policy name
   - Definition (SQL)
   - Target roles

4. **Staging Dashboard에서 동일하게 생성**
   ```
   https://supabase.com/dashboard/project/kcthtpmxffppfbkjjkub/editor
   ```

---

## 📝 방법 3: Supabase CLI로 자동 동기화 (권장)

### Step 1: Production RLS 정책 덤프

```bash
# Production 프로젝트 연결
supabase link --project-ref hyltbeewxaqashyivilu

# Schema 전체 덤프 (RLS 포함)
supabase db dump --schema public > production_schema.sql
```

### Step 2: RLS 정책만 추출

`production_schema.sql` 파일에서 **RLS 관련 부분만 추출**:

```bash
# RLS 정책만 grep으로 추출
grep -A 20 "CREATE POLICY" production_schema.sql > rls_policies_only.sql
grep -A 5 "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" production_schema.sql >> rls_policies_only.sql
```

### Step 3: Staging에 적용

```bash
# Staging 프로젝트 연결
supabase link --project-ref kcthtpmxffppfbkjjkub

# RLS 정책 적용
supabase db push rls_policies_only.sql
```

---

## 🔍 적용 후 검증

### Staging DB에서 확인

```sql
-- 모든 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- RLS가 활성화된 테이블 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**기대 결과:**
- `alimtalk_logs`: rowsecurity = true
- `coupons`: rowsecurity = true
- `master_content_questions`: rowsecurity = false (UNRESTRICTED)
- `master_contents`: rowsecurity = false (UNRESTRICTED)
- `order_results`: rowsecurity = true
- `orders`: rowsecurity = true
- `saju_records`: rowsecurity = true
- `user_coupons`: rowsecurity = true
- `users`: rowsecurity = false (UNRESTRICTED)

---

## ⚠️ 주의사항

### 1. RLS 활성화 시 접근 권한 변경
RLS를 활성화하면 **정책에 맞지 않는 쿼리는 차단**됩니다.

### 2. Service Role Key는 RLS 무시
Edge Functions에서 **Service Role Key**를 사용하면 RLS를 무시합니다.

### 3. 테스트 필수
Staging에 적용 후 **반드시 전체 기능 테스트**를 수행하세요:
- 로그인/회원가입
- 주문 생성
- 쿠폰 발급
- 사주 기록 조회

---

## 🚀 빠른 실행 명령어 (전체 프로세스)

```bash
# 1. Production RLS 덤프
supabase link --project-ref hyltbeewxaqashyivilu
supabase db dump --schema public > production_full_schema.sql

# 2. Staging에 적용
supabase link --project-ref kcthtpmxffppfbkjjkub
supabase db reset  # ⚠️ 주의: 모든 데이터 삭제됨
supabase db push production_full_schema.sql

# 3. 검증
supabase db diff
```

---

## 📚 관련 문서

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 정책](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Triggers & Functions](/supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)
