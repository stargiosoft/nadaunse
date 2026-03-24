# 🎟️ 재방문 쿠폰 중복 발급 방지 - 마이그레이션 완료 ✅

> **작성일**: 2024-12-17  
> **목적**: 한 주문당 1번만 재방문 쿠폰을 발급하도록 수정  
> **상태**: ✅ **DB 마이그레이션 완료**, ✅ **로컬 Edge Function 수정 완료**

---

## 🎯 완료된 작업

### ✅ Step 1: SQL 실행 완료
```sql
-- user_coupons 테이블에 컬럼 추가
ALTER TABLE user_coupons
ADD COLUMN source_order_id uuid REFERENCES orders(id);

-- 성능 향상을 위한 인덱스 추가
CREATE INDEX idx_user_coupons_source_order 
ON user_coupons(user_id, coupon_id, source_order_id);
```

### ✅ Step 2: Edge Function 수정 완료
**파일**: `/supabase/functions/issue-revisit-coupon/index.ts`

---

## 🚀 남은 작업: Edge Function 배포

로컬 파일은 이미 수정되었으니, 이제 **Supabase에 배포**만 하면 됩니다!

### 옵션 1: Supabase CLI로 배포 (추천) 🖥️

```bash
# Supabase CLI 로그인
supabase login

# Edge Function 배포
supabase functions deploy issue-revisit-coupon

# 배포 확인
supabase functions list
```

### 옵션 2: Supabase Dashboard에서 수동 배포 🌐

1. **Supabase Dashboard** 접속
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Edge Functions** 메뉴 이동
   - 왼쪽 메뉴에서 **"Edge Functions"** 클릭

3. **`issue-revisit-coupon`** 함수 선택

4. **코드 수정**
   - **Edit** 버튼 클릭
   - `/supabase/functions/issue-revisit-coupon/index.ts` 내용 복사
   - 전체 붙여넣기

5. **배포**
   - **Deploy** 버튼 클릭
   - ✅ 배포 완료!

---

## 📋 문제점

현재 재방문 쿠폰이 **한 주문당 여러 번 발급** 가능합니다:

1. 유료 콘텐츠 완료 후 쿠폰 발급 → "발급 완료" 표시
2. 구매내역에서 같은 상품 "운세 보기" 클릭 → 다시 쿠폰 발급 가능
3. **문제**: 사용자가 한 주문으로 무한정 쿠폰을 받을 수 있음

---

## ✅ 해결 방안

`user_coupons` 테이블에 **`source_order_id`** 컬럼을 추가하여, "어느 주문을 완료한 후 발급받았는지"를 기록합니다.

### 테이블 구조 변경

**기존:**
```sql
user_coupons
  - used_order_id: 쿠폰을 **사용한** 주문 ID
```

**변경 후:**
```sql
user_coupons
  - used_order_id: 쿠폰을 **사용한** 주문 ID
  - source_order_id: 쿠폰이 **발급된 원인이 된** 주문 ID (NEW!)
```

---

## 🛠️ 마이그레이션 단계

### 1️⃣ Supabase SQL Editor에서 실행

```sql
-- 1. user_coupons 테이블에 source_order_id 컬럼 추가
ALTER TABLE user_coupons
ADD COLUMN source_order_id uuid REFERENCES orders(id);

-- 2. 인덱스 추가 (쿠폰 발급 중복 체크 성능 향상)
CREATE INDEX idx_user_coupons_source_order 
ON user_coupons(user_id, coupon_id, source_order_id);

-- 3. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_coupons'
ORDER BY ordinal_position;
```

---

## 🧪 테스트 시나리오

### ✅ 정상 발급
1. 유료 콘텐츠 구매 완료
2. 마지막 페이지(10/10)에서 "다음" 클릭
3. `/result/complete` 페이지 이동
4. **쿠폰 카드 클릭해서 발급** (토스트 표시)

### ✅ 중복 발급 방지
1. 구매내역 페이지에서 같은 상품 "운세 보기" 클릭
2. 마지막 페이지(10/10)에서 "다음" 클릭
3. `/result/complete` 페이지 이동
4. **쿠폰 카드에 "발급 완료" 표시** (중복 발급 안 됨)

---

## 🔍 디버깅 로그

### 프론트엔드 (브라우저 콘솔)

**정상 발급:**
```
🎟️ 재구매 쿠폰 발급 시작: { userId: '...', orderId: '...' }
✅ 쿠폰 발급 성공: { success: true, coupon: {...}, message: '쿠폰이 발급되었습니다' }
```

**중복 발급 시도:**
```
🎟️ 재구매 쿠폰 발급 시작: { userId: '...', orderId: '...' }
❌ 쿠폰 발급 실패: { message: '이 주문에 대한 쿠폰이 이미 발급되었습니다' }
```

### 서버 (Edge Function 로그)

**정상 발급:**
```
쿠폰 발급 성공: user_id=xxx, source_order_id=yyy, coupon_id=zzz
```

**중복 발급 방지:**
```
이미 발급된 쿠폰: user_id=xxx, source_order_id=yyy
```

---

## 📊 DB 확인 쿼리

```sql
-- 1. source_order_id 컬럼 확인
SELECT * FROM user_coupons 
WHERE source_order_id IS NOT NULL 
LIMIT 10;

-- 2. 특정 사용자의 재방문 쿠폰 발급 내역
SELECT 
  uc.id,
  uc.user_id,
  uc.source_order_id,
  uc.is_used,
  uc.issued_at,
  c.name AS coupon_name,
  o.gname AS order_product_name
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
LEFT JOIN orders o ON uc.source_order_id = o.id
WHERE uc.user_id = 'YOUR_USER_ID'
  AND c.name = '재방문 쿠폰'
ORDER BY uc.issued_at DESC;

-- 3. 중복 발급 체크 (같은 주문으로 2번 이상 발급된 경우 찾기)
SELECT 
  source_order_id,
  user_id,
  COUNT(*) as issue_count
FROM user_coupons
WHERE source_order_id IS NOT NULL
GROUP BY source_order_id, user_id
HAVING COUNT(*) > 1;
```

---

## 📝 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|-----------|--------|
| 2024-12-17 | `source_order_id` 컬럼 추가 및 중복 발급 방지 로직 구현 | AI Assistant |

---

**문서 끝**
