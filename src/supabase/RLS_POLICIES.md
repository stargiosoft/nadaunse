# RLS (Row Level Security) 정책 가이드

> **최종 업데이트**: 2026-01-07

## 개요

나다운세 프로젝트의 Supabase RLS 정책을 정리한 문서입니다.
Staging과 Production 환경 모두 동일한 정책이 적용되어 있습니다.

---

## 환경 정보

| 환경 | Project ID | 용도 |
|------|------------|------|
| Production | `kcthtpmxffppfbkjjkub` | nadaunse.com |
| Staging | `hyltbeewxaqashyivilu` | Preview/테스트 |

---

## 테이블별 정책

### 1. `alimtalk_logs` (알림톡 로그)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| System can insert alimtalk_logs | INSERT | public | `true` (누구나 삽입 가능) |
| Users can view own alimtalk_logs | SELECT | public | `auth.uid() = user_id` |

**RLS 상태**: Enabled

---

### 2. `coupons` (쿠폰 마스터)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Anyone can view coupons | SELECT | public | `true` (누구나 조회 가능) |

**RLS 상태**: Enabled

---

### 3. `master_content_questions` (콘텐츠 질문)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Anyone can view questions | SELECT | public | `true` |
| Master can manage questions | ALL | public | `users.role = 'master'` |

**RLS 상태**: Disabled (정책은 존재하나 RLS 비활성화)

---

### 4. `master_contents` (콘텐츠 마스터)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Anyone can view master contents | SELECT | anon, authenticated | `true` |
| Service role can manage master contents | ALL | service_role | `true` |

**RLS 상태**: Disabled (정책은 존재하나 RLS 비활성화)

---

### 5. `order_results` (주문 결과/AI 결과)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| System can manage order_results | ALL | public | `true` |
| Users can view own order_results | SELECT | public | `auth.uid() = orders.user_id` (조인) |

**RLS 상태**: Enabled

---

### 6. `orders` (주문)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Authenticated users can insert orders | INSERT | authenticated | `auth.uid() = user_id` |
| Service role can insert orders | INSERT | service_role | `true` |
| Service role can update orders | UPDATE | service_role | `true` |
| Users can update own orders | UPDATE | authenticated | `auth.uid() = user_id` |
| Users can view own orders | SELECT | authenticated | `auth.uid() = user_id` |

**RLS 상태**: Enabled

---

### 7. `saju_records` (사주 정보)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Service role can manage saju records | ALL | service_role | `true` |
| Users can delete their own saju records | DELETE | public | `auth.uid() = user_id` |
| Users can insert own saju records | INSERT | authenticated | `auth.uid() = user_id` |
| Users can update own saju records | UPDATE | authenticated | `auth.uid() = user_id` |
| Users can view own saju records | SELECT | authenticated | `auth.uid() = user_id` |

**RLS 상태**: Enabled

---

### 8. `user_coupons` (사용자 쿠폰)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| System can insert user_coupons | INSERT | public | `true` |
| Users can update own coupons | UPDATE | public | `auth.uid() = user_id` |
| Users can view own coupons | SELECT | public | `auth.uid() = user_id` |

**RLS 상태**: Enabled

---

### 9. `users` (사용자)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Enable insert for authenticated users | INSERT | authenticated | `auth.uid() = id` |
| Service role can insert users | INSERT | service_role | `true` |
| Users can update own data | UPDATE | authenticated | `auth.uid() = id` |
| Users can view own data | SELECT | authenticated | `true` (인증된 사용자는 모든 유저 조회 가능) |

**RLS 상태**: Enabled

---

## 정책 요약

| 테이블 | 정책 수 | RLS 상태 |
|--------|---------|----------|
| alimtalk_logs | 2 | Enabled |
| coupons | 1 | Enabled |
| master_content_questions | 2 | Disabled |
| master_contents | 2 | Disabled |
| order_results | 2 | Enabled |
| orders | 5 | Enabled |
| saju_records | 5 | Enabled |
| user_coupons | 3 | Enabled |
| users | 4 | Enabled |
| **총계** | **26** | - |

---

## 역할(Role) 설명

| 역할 | 설명 |
|------|------|
| `anon` | 익명 사용자 (로그인하지 않은 사용자) |
| `authenticated` | 인증된 사용자 (로그인한 사용자) |
| `service_role` | 서비스 역할 (Edge Function 등에서 사용) |
| `public` | 모든 역할 (anon + authenticated) |

---

## 정책 이관 스크립트

Staging → Production 정책 이관 시 사용:

```
scripts/migrate_rls_policies_to_production.sql
```

---

## 정책 조회 SQL

```sql
-- 모든 정책 조회
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text,
  with_check::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 테이블별 정책 수 조회
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

---

## 주의사항

1. **master_contents, master_content_questions**는 RLS가 Disabled 상태입니다.
   - 공개 콘텐츠라서 누구나 접근 가능해야 함
   - 정책은 존재하지만 RLS가 비활성화되어 있어 실제로 적용되지 않음

2. **service_role**은 RLS를 우회합니다.
   - Edge Function에서 service_role 키로 접근 시 모든 데이터 접근 가능

3. **정책 변경 시** 반드시 Staging에서 먼저 테스트 후 Production에 적용하세요.

4. **SECURITY DEFINER 함수** (NEW - 2026-01-07)
   - `process_payment_complete`, `process_refund` 함수는 SECURITY DEFINER로 실행
   - 함수 소유자(postgres) 권한으로 실행되어 RLS 정책 우회
   - Edge Functions에서만 호출되도록 설계 (클라이언트 직접 호출 금지)
   - 관련 문서: [DATABASE_TRIGGERS_AND_FUNCTIONS.md](./DATABASE_TRIGGERS_AND_FUNCTIONS.md)
