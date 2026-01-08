# Database Triggers and Functions

본 문서는 Supabase 데이터베이스의 Triggers와 Functions를 정리한 문서입니다.

> **최종 업데이트**: 2026-01-07
> **환경**: Production & Staging 공통
> **필수 문서**: [CLAUDE.md](../../CLAUDE.md) - 개발 규칙

---

## 목차

- [Database Triggers](#database-triggers)
- [Database Functions](#database-functions)
- [Trigger-Function 매핑](#trigger-function-매핑)

---

## Database Triggers

데이터베이스 테이블에 자동으로 실행되는 트리거 목록입니다.

### 1. `update_questions_updated_at`
- **테이블**: `master_content_questions`
- **실행 시점**: `BEFORE UPDATE`
- **실행 함수**: `update_updated_at_column()`
- **방향**: `ROW`
- **설명**: 질문 레코드가 업데이트될 때 `updated_at` 컬럼을 자동으로 현재 시각으로 갱신

### 2. `update_master_contents_updated_at`
- **테이블**: `master_contents`
- **실행 시점**: `BEFORE UPDATE`
- **실행 함수**: `update_updated_at_column()`
- **방향**: `ROW`
- **설명**: 마스터 콘텐츠가 업데이트될 때 `updated_at` 컬럼을 자동으로 현재 시각으로 갱신

### 3. `update_order_results_updated_at`
- **테이블**: `order_results`
- **실행 시점**: `BEFORE UPDATE`
- **실행 함수**: `update_updated_at_column()`
- **방향**: `ROW`
- **설명**: 주문 결과가 업데이트될 때 `updated_at` 컬럼을 자동으로 현재 시각으로 갱신

### 4. `trigger_fill_gname`
- **테이블**: `orders`
- **실행 시점**: `BEFORE INSERT, UPDATE`
- **실행 함수**: `fill_gname_from_content()`
- **방향**: `ROW`
- **설명**: 주문 생성 또는 업데이트 시 `content_id`를 기반으로 `gname` 필드를 자동으로 채움

### 5. `update_orders_updated_at`
- **테이블**: `orders`
- **실행 시점**: `BEFORE UPDATE`
- **실행 함수**: `update_updated_at_column()`
- **방향**: `ROW`
- **설명**: 주문이 업데이트될 때 `updated_at` 컬럼을 자동으로 현재 시각으로 갱신

---

## Database Functions

데이터베이스에서 사용되는 함수 목록입니다.

### 1. `calculate_zodiac`

**목적**: 생년월일을 기반으로 띠(Zodiac)를 계산

```sql
CREATE OR REPLACE FUNCTION public.calculate_zodiac(birth_date timestamp with time zone)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  year_val integer;
  zodiac_arr text[] := ARRAY['원숭이띠', '닭띠', '개띠', '돼지띠', '쥐띠', '소띠', '호랑이띠', '토끼띠', '용띠', '뱀띠', '말띠', '양띠'];
BEGIN
  year_val := EXTRACT(YEAR FROM birth_date)::integer;
  RETURN zodiac_arr[(year_val % 12) + 1];
END;
$function$
```

**파라미터**:
- `birth_date` (timestamp with time zone): 생년월일

**반환값**: `text` - 띠 이름 (예: '원숭이띠', '닭띠', ...)

**사용 예시**:
```sql
SELECT calculate_zodiac('1990-05-15'::timestamp);
-- 결과: '말띠'
```

---

### 2. `fill_gname_from_content`

**목적**: 주문 생성/업데이트 시 콘텐츠 제목을 `gname`에 자동으로 복사

```sql
CREATE OR REPLACE FUNCTION public.fill_gname_from_content()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- content_id가 있으면 title을 gname에 복사
  IF NEW.content_id IS NOT NULL THEN
    SELECT title INTO NEW.gname
    FROM master_contents
    WHERE id = NEW.content_id;
  END IF;
  
  RETURN NEW;
END;
$function$
```

**트리거 타입**: `BEFORE INSERT, UPDATE`

**연결된 테이블**: `orders`

**설명**: 
- `orders` 테이블의 `content_id`가 있을 경우
- `master_contents` 테이블에서 해당 콘텐츠의 `title`을 조회
- `gname` 필드에 자동으로 채워넣음

---

### 3. `handle_new_user`

**목적**: 신규 사용자 인증 시 `users` 테이블에 자동으로 레코드 생성

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, provider, provider_id, email, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google'),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
```

**트리거 타입**: `AFTER INSERT` (auth.users 테이블)

**권한**: `SECURITY DEFINER` - 함수 소유자의 권한으로 실행

**설명**:
- Supabase Auth의 `auth.users` 테이블에 새 사용자가 추가되면 자동 실행
- `public.users` 테이블에 사용자 정보를 복사
- 이미 존재하는 경우 중복 삽입을 방지 (`ON CONFLICT DO NOTHING`)

---

### 4. `update_updated_at`

**목적**: `updated_at` 필드를 현재 시각으로 자동 갱신 (범용 함수 1)

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
```

**트리거 타입**: `BEFORE UPDATE`

**설명**: 
- 레코드가 업데이트될 때 `updated_at` 필드를 자동으로 현재 시각으로 설정
- 여러 테이블에서 재사용 가능한 범용 함수

---

### 5. `update_updated_at_column`

**목적**: `updated_at` 필드를 현재 시각으로 자동 갱신 (범용 함수 2)

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
```

**트리거 타입**: `BEFORE UPDATE`

**설명**: 
- `update_updated_at`와 동일한 기능 (`NOW()` vs `now()`)
- 실제 프로젝트에서 사용 중인 함수

**연결된 테이블**:
- `master_content_questions`
- `master_contents`
- `order_results`
- `orders`

---

### 6. `process_payment_complete` (NEW - 2026-01-07)

**목적**: 결제 완료 시 주문 생성과 쿠폰 사용을 단일 트랜잭션으로 원자적 처리

```sql
CREATE OR REPLACE FUNCTION public.process_payment_complete(
  p_user_id uuid,
  p_content_id uuid,
  p_payment_key text,
  p_amount integer,
  p_coupon_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_order_id uuid;
  v_discount_amount integer := 0;
  v_final_amount integer;
BEGIN
  -- 1. 쿠폰 유효성 검증 및 할인금액 계산
  IF p_coupon_id IS NOT NULL THEN
    SELECT discount_amount INTO v_discount_amount
    FROM user_coupons
    WHERE id = p_coupon_id
      AND user_id = p_user_id
      AND used_at IS NULL
      AND expires_at > NOW();

    IF v_discount_amount IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired coupon';
    END IF;
  END IF;

  -- 2. 최종 결제금액 계산
  v_final_amount := GREATEST(p_amount - v_discount_amount, 0);

  -- 3. 주문 생성
  INSERT INTO orders (
    user_id, content_id, payment_key, amount,
    discount_amount, final_amount, status, webhook_verified_at
  )
  VALUES (
    p_user_id, p_content_id, p_payment_key, p_amount,
    v_discount_amount, v_final_amount, 'completed', NOW()
  )
  RETURNING id INTO v_order_id;

  -- 4. 쿠폰 사용 처리 (원자적)
  IF p_coupon_id IS NOT NULL THEN
    UPDATE user_coupons
    SET used_at = NOW(), used_order_id = v_order_id
    WHERE id = p_coupon_id;
  END IF;

  -- 5. 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'final_amount', v_final_amount
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$
```

**파라미터**:
- `p_user_id` (uuid): 사용자 ID
- `p_content_id` (uuid): 콘텐츠 ID
- `p_payment_key` (text): 포트원 결제 키
- `p_amount` (integer): 원래 결제 금액
- `p_coupon_id` (uuid, optional): 사용할 쿠폰 ID

**반환값**: `jsonb` - 처리 결과 (`success`, `order_id`, `final_amount` 또는 `error`)

**특징**:
- `SECURITY DEFINER`: 함수 소유자 권한으로 실행 (RLS 우회)
- 트랜잭션 원자성 보장: 주문 생성 + 쿠폰 사용이 함께 성공/실패
- 예외 처리: 실패 시 롤백 및 에러 메시지 반환

**사용 예시**:
```sql
SELECT process_payment_complete(
  'user-uuid',
  'content-uuid',
  'payment_key_123',
  15000,
  'coupon-uuid'
);
-- 결과: {"success": true, "order_id": "...", "final_amount": 12000}
```

---

### 7. `process_refund` (NEW - 2026-01-07)

**목적**: 환불 처리 시 주문 상태 업데이트와 쿠폰 복원을 원자적으로 처리

```sql
CREATE OR REPLACE FUNCTION public.process_refund(
  p_order_id uuid,
  p_refund_amount integer,
  p_refund_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_order RECORD;
  v_coupon_id uuid;
BEGIN
  -- 1. 주문 정보 조회 및 잠금
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status = 'refunded' THEN
    RAISE EXCEPTION 'Order already refunded';
  END IF;

  -- 2. 주문 상태 환불로 변경
  UPDATE orders
  SET
    status = 'refunded',
    refund_amount = p_refund_amount,
    refund_reason = p_refund_reason,
    refunded_at = NOW()
  WHERE id = p_order_id;

  -- 3. 사용된 쿠폰이 있으면 복원
  SELECT id INTO v_coupon_id
  FROM user_coupons
  WHERE used_order_id = p_order_id;

  IF v_coupon_id IS NOT NULL THEN
    UPDATE user_coupons
    SET
      used_at = NULL,
      used_order_id = NULL
    WHERE id = v_coupon_id;
  END IF;

  -- 4. 결과 반환
  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'refund_amount', p_refund_amount,
    'coupon_restored', v_coupon_id IS NOT NULL
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$
```

**파라미터**:
- `p_order_id` (uuid): 환불할 주문 ID
- `p_refund_amount` (integer): 환불 금액
- `p_refund_reason` (text, optional): 환불 사유

**반환값**: `jsonb` - 처리 결과 (`success`, `order_id`, `refund_amount`, `coupon_restored` 또는 `error`)

**특징**:
- `FOR UPDATE`: 행 잠금으로 동시성 문제 방지
- 쿠폰 자동 복원: 환불 시 사용된 쿠폰의 `used_at`, `used_order_id` NULL로 복원
- 중복 환불 방지: 이미 환불된 주문은 예외 발생

**사용 예시**:
```sql
SELECT process_refund(
  'order-uuid',
  15000,
  '고객 요청으로 인한 환불'
);
-- 결과: {"success": true, "order_id": "...", "refund_amount": 15000, "coupon_restored": true}
```

---

## Trigger-Function 매핑

트리거와 함수의 연결 관계를 정리한 표입니다.

| Trigger Name | Table Name | Function Name | Timing | Event |
|---|---|---|---|---|
| `update_questions_updated_at` | `master_content_questions` | `update_updated_at_column` | BEFORE | UPDATE |
| `update_master_contents_updated_at` | `master_contents` | `update_updated_at_column` | BEFORE | UPDATE |
| `update_order_results_updated_at` | `order_results` | `update_updated_at_column` | BEFORE | UPDATE |
| `trigger_fill_gname` | `orders` | `fill_gname_from_content` | BEFORE | INSERT, UPDATE |
| `update_orders_updated_at` | `orders` | `update_updated_at_column` | BEFORE | UPDATE |

---

## 참고사항

### 1. 결제/환불 PostgreSQL Functions (NEW - 2026-01-07)

새로 추가된 `process_payment_complete`와 `process_refund` 함수는 **Edge Functions와 연동**하여 사용됩니다:

| PostgreSQL Function | 연동 Edge Function | 용도 |
|---------------------|-------------------|------|
| `process_payment_complete` | `/process-payment` | 결제 트랜잭션 원자적 처리 |
| `process_refund` | `/process-refund` | 환불 + 쿠폰 복원 |

**설계 원칙**:
- **SECURITY DEFINER**: RLS 정책 우회하여 신뢰된 서버 로직만 실행
- **원자성 보장**: 여러 테이블 업데이트가 하나의 트랜잭션으로 처리
- **에러 핸들링**: `EXCEPTION WHEN OTHERS` 블록으로 안전하게 실패 처리

### 2. `updated_at` 자동 갱신 패턴

현재 프로젝트에서는 **두 가지 유사한 함수**가 존재합니다:
- `update_updated_at()` - 선언되었으나 실제 트리거에 연결되지 않음
- `update_updated_at_column()` - 실제 사용 중

**권장사항**:
- `update_updated_at()` 함수는 사용하지 않으므로 삭제 고려
- 또는 모든 트리거를 `update_updated_at()`로 통일

### 3. `handle_new_user` 트리거 확인 필요

본 문서에는 함수만 정의되어 있으며, `auth.users` 테이블에 대한 트리거 연결은 조회되지 않았습니다.

**확인 방법**:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users';
```

**예상 트리거**:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 4. Production vs Staging 환경 차이 확인

본 문서는 단일 환경 기준으로 작성되었습니다. 

**권장 작업**:
- Staging 환경에서 동일한 SQL 쿼리 실행
- Production과 차이점 비교
- 필요시 `/supabase/DATABASE_TRIGGERS_STAGING.md` 별도 작성

---

## 관련 문서

- [Edge Functions 가이드](/supabase/EDGE_FUNCTIONS_GUIDE.md)
- [데이터베이스 스키마](/DATABASE_SCHEMA.md)
- [마이그레이션 가이드](/supabase/migrations/README.md)
