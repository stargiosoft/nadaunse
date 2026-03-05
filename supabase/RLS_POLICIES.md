# RLS (Row Level Security) 정책 가이드

> **최종 업데이트**: 2026-03-05

## 개요

나다운세 프로젝트의 Supabase RLS 정책을 정리한 문서입니다.
Staging과 Production 환경 모두 동일한 정책이 적용되어 있습니다.

> **환경 정보** (Supabase Project ID 등)는 [CLAUDE.md](../CLAUDE.md) 참조

---

## 단순 정책 요약

아래 테이블은 기본 `auth.uid() = user_id` 패턴 또는 단일 조건만 사용하는 단순 정책입니다.

| 테이블 | RLS | 정책 | 조건 |
|--------|-----|------|------|
| `coupons` | Enabled | Anyone can view (SELECT) | `true` |
| `free_content_records` | Enabled | Users SELECT own | `auth.uid() = user_id` |
| `free_content_records` | Enabled | Users INSERT own | `auth.uid() = user_id` |
| `user_trait_tags` | Enabled | Users SELECT own | `auth.uid() = user_id` |
| `user_trait_tags` | Enabled | Users INSERT own | `auth.uid() = user_id` |
| `user_trait_tags` | Enabled | Users DELETE own | `auth.uid() = user_id` |
| `sprout_transactions` | Enabled | Users SELECT own | `auth.uid() = user_id` |
| `sprout_transactions` | Enabled | Masters can view all | `users.role = 'master'` |
| `sprout_packages` | Enabled | Authenticated SELECT active | `is_active = true` |
| `anonymous_free_views` | Enabled | (정책 없음 — Service Role Key 전용) | - |
| `anonymous_consult_views` | - | RLS 없음 (Service Role Key 전용) | - |
| `user_consult_daily` | Enabled | (정책 없음 — Service Role Key 전용) | - |
| `user_situation_summaries` | Enabled | Service role full access (ALL) | `true` (Service Role 전용) |
| `referral_signups` | Enabled | Users SELECT own | `auth.uid() = referrer_id` |
| `share_rewards` | Enabled | Users SELECT own | `auth.uid() = user_id` |

---

## 테이블별 상세 정책

### 1. `alimtalk_logs` (알림톡 로그)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| System can insert alimtalk_logs | INSERT | public | `true` (누구나 삽입 가능) |
| Users can view own alimtalk_logs | SELECT | public | `auth.uid() = user_id` |
| Master can view all alimtalk_logs | SELECT | authenticated | `users.role = 'master'` (통계 대시보드용) |

**RLS 상태**: Enabled

---

### 2. `master_content_questions` (콘텐츠 질문)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Anyone can view questions | SELECT | public | `true` |
| Master can manage questions | ALL | public | `users.role = 'master'` |

**RLS 상태**: Disabled (정책은 존재하나 RLS 비활성화)

---

### 3. `master_contents` (콘텐츠 마스터)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Anyone can view master contents | SELECT | anon, authenticated | `true` |
| Service role can manage master contents | ALL | service_role | `true` |

**RLS 상태**: Disabled (정책은 존재하나 RLS 비활성화)

---

### 4. `order_results` (주문 결과/AI 결과)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| System can manage order_results | ALL | public | `true` |
| Users can view own order_results | SELECT | public | `auth.uid() = orders.user_id` (조인) |

**RLS 상태**: Enabled

---

### 5. `orders` (주문)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Authenticated users can insert orders | INSERT | authenticated | `auth.uid() = user_id` |
| Service role can insert orders | INSERT | service_role | `true` |
| Service role can update orders | UPDATE | service_role | `true` |
| Users can update own orders | UPDATE | authenticated | `auth.uid() = user_id` |
| Users can view own orders | SELECT | authenticated | `auth.uid() = user_id` |

**RLS 상태**: Enabled

---

### 6. `saju_records` (사주 정보)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Master can view all saju records | SELECT | authenticated | `users.role = 'master'` |
| Service role can manage saju records | ALL | service_role | `true` |
| Users can delete their own saju records | DELETE | public | `auth.uid() = user_id` |
| Users can insert own saju records | INSERT | authenticated | `auth.uid() = user_id` |
| Users can update own saju records | UPDATE | authenticated | `auth.uid() = user_id` |
| Users can view own saju records | SELECT | authenticated | `auth.uid() = user_id` |

**RLS 상태**: Enabled

---

### 7. `user_coupons` (사용자 쿠폰)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| System can insert user_coupons | INSERT | public | `true` |
| Users can update own coupons | UPDATE | public | `auth.uid() = user_id` |
| Users can view own coupons | SELECT | public | `auth.uid() = user_id` |
| Authenticated can view all user_coupons | SELECT | authenticated | `true` |

**RLS 상태**: Enabled

---

### 8. `users` (사용자)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Enable insert for authenticated users | INSERT | authenticated | `auth.uid() = id` |
| Service role can insert users | INSERT | service_role | `true` |
| Users can update own data | UPDATE | authenticated | `auth.uid() = id` |
| Users can view own data | SELECT | authenticated | `true` (인증된 사용자는 모든 유저 조회 가능) |

**RLS 상태**: Enabled

---

### 9. `weekly_reports` (주간 보고서)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Users can view own weekly reports | SELECT | authenticated | `auth.uid() = user_id` |
| Authenticated can view all weekly_reports | SELECT | authenticated | `true` |
| Users can update own weekly reports | UPDATE | authenticated | `auth.uid() = user_id` |
| Service role can manage weekly reports | ALL | service_role | `true` |

**RLS 상태**: Enabled

---

### 10. `weekly_report_sections` (주간 보고서 섹션)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Users can view own report sections | SELECT | authenticated | `auth.uid() = weekly_reports.user_id` (조인) |
| Service role can manage report sections | ALL | service_role | `true` |

**RLS 상태**: Enabled

---

### 11. `report_tarot_selections` (보고서 타로 선택)

| 정책명 | 명령 | 대상 | 조건 |
|--------|------|------|------|
| Users can view own tarot selections | SELECT | authenticated | `auth.uid() = weekly_reports.user_id` (조인) |
| Authenticated can view all report_tarot_selections | SELECT | authenticated | `true` |
| Users can update own tarot selections | UPDATE | authenticated | `auth.uid() = weekly_reports.user_id` (조인) |
| Service role can manage tarot selections | ALL | service_role | `true` |

**RLS 상태**: Enabled

**user_viewed 패턴**:
```typescript
// 타로 1회 제한 체크 (user_viewed = true인 경우만 뽑기 완료로 간주)
const { count } = await supabase
  .from('report_tarot_selections')
  .select('id', { count: 'exact', head: true })
  .eq('report_id', id)
  .eq('user_viewed', true);
```

---

## 정책 요약

| 테이블 | 정책 수 | RLS 상태 |
|--------|---------|----------|
| alimtalk_logs | 3 | Enabled |
| coupons | 1 | Enabled |
| free_content_records | 2 | Enabled |
| user_trait_tags | 3 | Enabled |
| master_content_questions | 2 | Disabled |
| master_contents | 2 | Disabled |
| order_results | 2 | Enabled |
| orders | 5 | Enabled |
| saju_records | 6 | Enabled |
| user_coupons | 3 | Enabled |
| users | 4 | Enabled |
| weekly_reports | 3 | Enabled |
| weekly_report_sections | 2 | Enabled |
| report_tarot_selections | 3 | Enabled |
| anonymous_free_views | 0 | Enabled (Service Role 전용) |
| user_situation_summaries | 1 | Enabled (Service Role 전용) |
| sprout_transactions | 2 | Enabled |
| sprout_packages | 1 | Enabled |
| referral_signups | 1 | Enabled |
| share_rewards | 1 | Enabled |
| anonymous_consult_views | 0 | RLS 없음 (Service Role 전용) |
| user_consult_daily | 0 | Enabled (Service Role 전용) |
| **총계** | **47** | - |

---

## 역할(Role) 설명

| 역할 | 설명 |
|------|------|
| `anon` | 익명 사용자 (로그인하지 않은 사용자) |
| `authenticated` | 인증된 사용자 (로그인한 사용자) |
| `service_role` | 서비스 역할 (Edge Function 등에서 사용) |
| `public` | 모든 역할 (anon + authenticated) |

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

4. **SECURITY DEFINER 함수 (EXECUTE 권한 제한)**
   - `process_payment_complete`, `process_refund`, `process_sprout_charge`, `process_sprout_deduct`, `process_share_reward` 함수는 SECURITY DEFINER로 실행
   - 함수 소유자(postgres) 권한으로 실행되어 RLS 정책 우회
   - **`REVOKE EXECUTE FROM PUBLIC, authenticated, anon`** 적용 → 클라이언트에서 `supabase.rpc()` 직접 호출 불가 (403)
   - Edge Function(service_role)에서만 호출 가능
   - 관련 문서: [DATABASE_TRIGGERS_AND_FUNCTIONS.md](./DATABASE_TRIGGERS_AND_FUNCTIONS.md)

5. **`protect_sprout_balance` 트리거 (users 테이블)**
   - `users` 테이블은 RLS disabled (UNRESTRICTED) 상태
   - BEFORE UPDATE 트리거로 `current_user IN ('authenticated','anon')` 시 `sprout_balance` 변경 차단
   - SECURITY DEFINER 함수(current_user='postgres')는 통과
