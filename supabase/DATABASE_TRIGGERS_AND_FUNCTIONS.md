# Database Triggers and Functions

본 문서는 Supabase 데이터베이스의 Triggers와 Functions를 정리한 문서입니다.

> **Triggers**: 6개 | **Functions**: 11개 | **pg_cron Jobs**: 4개
> **최종 업데이트**: 2026-03-04
> **환경**: Production & Staging 공통
> **필수 문서**: [CLAUDE.md](../../CLAUDE.md) - 개발 규칙

---

## 목차

- [Database Triggers](#database-triggers)
- [Database Functions](#database-functions)
- [pg_cron 스케줄 작업](#pg_cron-스케줄-작업)
- [Trigger-Function 매핑](#trigger-function-매핑)

---

## Database Triggers

데이터베이스 테이블에 자동으로 실행되는 트리거 목록입니다.

| Trigger Name | 테이블 | 시점 | 이벤트 | 실행 함수 | 설명 |
|---|---|---|---|---|---|
| `update_questions_updated_at` | `master_content_questions` | BEFORE | UPDATE | `update_updated_at_column()` | `updated_at` 자동 갱신 |
| `update_master_contents_updated_at` | `master_contents` | BEFORE | UPDATE | `update_updated_at_column()` | `updated_at` 자동 갱신 |
| `update_order_results_updated_at` | `order_results` | BEFORE | UPDATE | `update_updated_at_column()` | `updated_at` 자동 갱신 |
| `trigger_fill_gname` | `orders` | BEFORE | INSERT, UPDATE | `fill_gname_from_content()` | `content_id` 기반으로 `gname` 자동 채움 |
| `update_orders_updated_at` | `orders` | BEFORE | UPDATE | `update_updated_at_column()` | `updated_at` 자동 갱신 |
| `protect_sprout_balance_trigger` | `users` | BEFORE | UPDATE | `protect_sprout_balance()` | `sprout_balance` 직접 수정 차단 (authenticated/anon) |

---

## Database Functions

데이터베이스에서 사용되는 함수 목록입니다.

### 1. `calculate_zodiac`
**목적**: 생년월일을 기반으로 띠(Zodiac)를 계산
**파라미터**: `birth_date` (timestamp with time zone)
**반환값**: `text` - 띠 이름 (예: '원숭이띠', '닭띠', '말띠' 등)
**사용처**: 직접 호출 (쿼리에서 사용)

### 2. `fill_gname_from_content`
**목적**: 주문 생성/업데이트 시 `master_contents.title`을 `orders.gname`에 자동 복사
**반환값**: `trigger`
**사용처**: Trigger `trigger_fill_gname` (orders 테이블, BEFORE INSERT/UPDATE)

### 3. `handle_new_user`
**목적**: 신규 사용자 인증 시 `users` 테이블에 레코드 자동 생성 + 웰컴 새싹 20개 지급
**반환값**: `trigger` (SECURITY DEFINER)
**사용처**: Trigger `on_auth_user_created` (auth.users 테이블, AFTER INSERT)

### 4. `update_updated_at`
**목적**: `updated_at` 필드를 현재 시각으로 자동 갱신 (범용 함수 1)
**반환값**: `trigger`
**사용처**: 선언되었으나 실제 트리거에 연결되지 않음 (삭제 고려)

### 5. `update_updated_at_column`
**목적**: `updated_at` 필드를 현재 시각으로 자동 갱신 (범용 함수 2, 실제 사용 중)
**반환값**: `trigger`
**사용처**: Trigger 4개 (`master_content_questions`, `master_contents`, `order_results`, `orders`)

### 6. `process_payment_complete`
**목적**: 결제 완료 시 주문 생성 + 쿠폰 사용을 단일 트랜잭션으로 원자적 처리
**파라미터**: `p_user_id` (uuid), `p_content_id` (uuid), `p_payment_key` (text), `p_amount` (integer), `p_coupon_id` (uuid, optional)
**반환값**: `jsonb` - `{ success, order_id, final_amount }` 또는 `{ success: false, error }`  (SECURITY DEFINER)
**사용처**: Edge Function `process-payment`에서 호출

### 7. `process_refund`
**목적**: 환불 처리 시 주문 상태 업데이트 + 쿠폰 복원을 원자적으로 처리
**파라미터**: `p_order_id` (uuid), `p_refund_amount` (integer), `p_refund_reason` (text, optional)
**반환값**: `jsonb` - `{ success, order_id, refund_amount, coupon_restored }` 또는 `{ success: false, error }` (SECURITY DEFINER)
**사용처**: Edge Function `process-refund`에서 호출

### 8. `process_sprout_charge`
**목적**: 새싹 충전 처리 - 잔액 증가 + 주문 기록 + 거래 내역을 단일 트랜잭션으로 원자적 처리
**파라미터**: `p_user_id` (uuid), `p_base_amount` (int), `p_bonus_amount` (int), `p_total_amount` (int), `p_price_krw` (int), `p_package_name` (text), `p_imp_uid` (text), `p_merchant_uid` (text), `p_pay_method` (text), `p_pg_provider` (text)
**반환값**: `jsonb` - `{ success, order_id, new_balance }` 또는 `{ success: false, error }` (SECURITY DEFINER)
**사용처**: Edge Function `sprout-charge`에서 호출

### 9. `process_sprout_deduct`
**목적**: 새싹 차감 처리 - 잔액 부족 검증 + 잔액 차감 + 거래 내역을 단일 트랜잭션으로 원자적 처리
**파라미터**: `p_user_id` (uuid), `p_content_id` (text), `p_amount` (integer)
**반환값**: `jsonb` - `{ success, new_balance }` 또는 `{ success: false, error }` (SECURITY DEFINER)
**사용처**: Edge Function `sprout-deduct`에서 호출

### 10. `reset_weekly_clicks`
**목적**: 주간 클릭수를 수동으로 리셋 (테스트/긴급 대응용)
**반환값**: `jsonb` - `{ success, updated_count }` (SECURITY DEFINER)
**사용처**: pg_cron `weekly-clicks-reset` 또는 수동 실행

### 11. `get_fibonacci`
**목적**: 피보나치 수열 계산 (공유 리워드 회차별 필요 인원 산출)
**파라미터**: `n` (integer) — 회차 번호
**반환값**: `integer` — n번째 피보나치 수 (1,1,2,3,5,8...)
**사용처**: `process_share_reward` 함수 내부 호출 (IMMUTABLE)

### 12. `process_share_reward`
**목적**: 공유 리워드 원자적 처리 — 자기 추천/중복 체크 → 회차 카운트 증가 → 달성 시 새싹 30 지급 → 다음 회차 생성
**파라미터**: `p_referrer_id` (uuid), `p_referred_id` (uuid), `p_ip_fingerprint` (text), `p_is_suspicious` (boolean)
**반환값**: `jsonb` - `{ success, reward_granted, current_round, current_count, required_count }` (SECURITY DEFINER)
**사용처**: Edge Function `process-referral`에서 호출. 부정 의심(`p_is_suspicious=true`) 시 기록만 하고 카운트/리워드 스킵

---

## pg_cron 스케줄 작업

| Job Name | 스케줄 | 대상 | 설명 |
|----------|--------|------|------|
| `weekly-report-batch` | 프로덕션: `*/10 3-12 * * 0` (일 12:00~21:00 KST) / 스테이징: `*/10 3-12 * * 3` (수) | Edge Function `generate-weekly-reports-batch` | 주간 보고서 일괄 생성 + 알림톡 발송. concurrency 3, 120초 제한, selfContinue 패턴. Vault `service_role_key` 인증. 환경변수 `WEEK_START_DAY` 사용 |
| `cleanup-unconfirmed-tags` | `0 0 * * *` (매일 09:00 KST) | DB Function `get_stale_unconfirmed_tag_groups()` + `process_stale_tag_group()` | 24시간 이상 미확인(`is_confirmed = false`) 나다움 태그 그룹 자동 삭제 |
| `cleanup-anonymous-free-views` | `0 0 * * *` (매일 09:00 KST) | 테이블 `anonymous_free_views` | 전날 이전 비회원 무료 콘텐츠 조회 기록 자동 삭제 |
| `weekly-clicks-reset` | `0 15 * * 0` (월 00:00 KST) | 테이블 `master_contents` | `weekly_clicks` → `last_weekly_clicks` 보관 후 0으로 리셋 |

### pg_cron 관련 테이블

| 테이블 | 설명 |
|--------|------|
| `cron.job` | 등록된 스케줄 작업 목록 |
| `cron.job_run_details` | 실행 이력 및 결과 |

### Vault 시크릿

| 시크릿 이름 | 용도 | 설정 방법 |
|-------------|------|----------|
| `service_role_key` | Edge Function 인증 | `vault.create_secret('key', 'service_role_key', 'description')` |

### pg_cron 모니터링 / 수동 실행

```sql
-- 실행 로그 확인
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-report-batch')
ORDER BY start_time DESC LIMIT 10;

-- 주간 보고서 수동 실행
SELECT trigger_weekly_report_batch();
```

---

## Trigger-Function 매핑

| Trigger Name | Table Name | Function Name | Timing | Event |
|---|---|---|---|---|
| `update_questions_updated_at` | `master_content_questions` | `update_updated_at_column` | BEFORE | UPDATE |
| `update_master_contents_updated_at` | `master_contents` | `update_updated_at_column` | BEFORE | UPDATE |
| `update_order_results_updated_at` | `order_results` | `update_updated_at_column` | BEFORE | UPDATE |
| `trigger_fill_gname` | `orders` | `fill_gname_from_content` | BEFORE | INSERT, UPDATE |
| `update_orders_updated_at` | `orders` | `update_updated_at_column` | BEFORE | UPDATE |
| `protect_sprout_balance_trigger` | `users` | `protect_sprout_balance` | BEFORE | UPDATE |

---

## 참고사항

### 1. 결제/환불/새싹 PostgreSQL Functions ↔ Edge Function 연동

| PostgreSQL Function | 연동 Edge Function | 용도 |
|---------------------|-------------------|------|
| `process_payment_complete` | `process-payment` | 결제 트랜잭션 원자적 처리 |
| `process_refund` | `process-refund` | 환불 + 쿠폰 복원 |
| `process_sprout_charge` | `sprout-charge` | 새싹 충전 (잔액 증가 + 주문 + 거래 기록) |
| `process_sprout_deduct` | `sprout-deduct` | 새싹 차감 (잔액 감소 + 거래 기록) |

**공통 설계 원칙**: SECURITY DEFINER (RLS 우회), 트랜잭션 원자성, FOR UPDATE 행 잠금, EXCEPTION WHEN OTHERS 에러 핸들링

**⚠️ 보안**: 위 함수들은 `PUBLIC`, `authenticated`, `anon` 역할에서 EXECUTE 권한 제거됨. Edge Function(service_role)에서만 호출 가능. 클라이언트에서 `supabase.rpc()` 직접 호출 시 `403 permission denied` 반환

### 2. `updated_at` 자동 갱신 패턴

- `update_updated_at()` - 선언되었으나 실제 트리거에 연결되지 않음 (삭제 고려)
- `update_updated_at_column()` - 실제 사용 중 (4개 테이블)

### 3. `handle_new_user` 트리거 확인 필요

본 문서에는 함수만 정의되어 있으며, `auth.users` 테이블에 대한 트리거 연결은 별도 확인 필요:
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_schema = 'auth' AND event_object_table = 'users';
```

### 4. Production vs Staging 환경 차이

pg_cron 스케줄만 다르며 (`WEEK_START_DAY`: 프로덕션 0=일요일, 스테이징 3=수요일), 나머지 Trigger/Function은 동일.

---

## 나다움 태그 관련

`user_trait_tags` 테이블은 Trigger 없이 Edge Function에서 직접 INSERT됩니다.

| Edge Function | 테이블 | 작업 |
|--------------|--------|------|
| `extract-trait-tags` | - | GPT-5-nano로 태그 추출 (DB 저장 안 함) |
| `save-trait-tags` | `user_trait_tags` | 사용자가 선택한 태그 INSERT |

---

## 나다움 보고서 (주간 보고서) 관련

주간 보고서 관련 테이블은 별도의 Trigger 없이 클라이언트에서 직접 CRUD 작업을 수행합니다.

### 관련 테이블

| 테이블 | 설명 | Trigger |
|--------|------|---------|
| `weekly_reports` | 주간 보고서 메타데이터 + 응원글 | 없음 |
| `weekly_report_sections` | 섹션별 태그 분석 결과 (JSONB) | 없음 |
| `report_tarot_selections` | 보고서별 타로 선택 기록 | 없음 |

### 주요 데이터 흐름

1. **보고서 생성** (시스템): `weekly_reports` INSERT → `weekly_report_sections` INSERT
2. **타로 카드 뽑기** (사용자): `report_tarot_selections` UPDATE (`user_viewed = true`)
3. **응원글 저장** (사용자): `weekly_reports` UPDATE (`self_encouragement` 필드)
4. **쿠폰 발급** (tag_count>=5): `user_coupons` INSERT (서버 사이드 검증)

### user_viewed 패턴

| user_viewed | 의미 |
|-------------|------|
| `false` | 시스템이 미리 생성한 데이터 (pre-generated) |
| `true` | 사용자가 실제로 카드를 뽑음 |

### ON DELETE CASCADE

`weekly_report_sections`, `report_tarot_selections`는 `report_id` FK에 ON DELETE CASCADE 설정.
**주의**: 쿠폰 테이블의 `source_order_id` FK는 제거됨 (보고서 ID 저장을 위해).

---

## 관련 문서

- [Edge Functions 가이드](/supabase/EDGE_FUNCTIONS_GUIDE.md)
- [데이터베이스 스키마](/DATABASE_SCHEMA.md)
- [마이그레이션 가이드](/supabase/migrations/README.md)
