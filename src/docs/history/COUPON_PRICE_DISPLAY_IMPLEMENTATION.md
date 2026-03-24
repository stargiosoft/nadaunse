# 🎟️ 유료 상품 상세 페이지 - 쿠폰 기반 가격 노출 구현 완료

> **작성일**: 2024-12-17  
> **화면코드**: ND_DA_001  
> **화면명**: 심화 해석판_상품 상세  
> **파일**: `/components/MasterContentDetailPage.tsx`

---

## ✅ **구현 완료 사항**

### **1. 쿠폰 종류 및 할인 금액**
| 쿠폰명 | 할인금액 | 발급 조건 |
|--------|----------|-----------|
| **가입축하쿠폰** | 5,000원 | 첫 회원가입 시 자동 발급 |
| **재방문 쿠폰** | 3,000원 | 결제 완료 후 '풀이 마지막' 페이지에서 자동 발급 |

---

### **2. 가격 노출 로직**

#### **우선순위:**
```
가입축하쿠폰 (5,000원) > 재방문 쿠폰 (3,000원)
```

#### **조건별 UI 노출:**

| 조건 | 혜택가 표시 | 안내 문구 | 클릭 동작 |
|------|-------------|-----------|-----------|
| **로그아웃 상태** | 7,900원 (첫 구매 혜택가) | "첫 구매 쿠폰 받고 7,900원으로 풀이 보기 >" | 로그인 페이지 이동 |
| **로그인 + 가입축하쿠폰 보유** | 7,900원 (첫 구매 혜택가) | "첫 구매 쿠폰 받고 7,900원으로 풀이 보기 >" | 결제 페이지 이동 |
| **로그인 + 재방문쿠폰만 보유** | 9,900원 (재구매 혜택가) | "재구매 쿠폰 받고 9,900원으로 풀이 보기 >" | 결제 페이지 이동 |
| **로그인 + 쿠폰 없음** | ❌ 미노출 | ❌ 미노출 | - |

---

## 🔧 **주요 코드 수정**

### **1. 쿠폰 조회 로직 (이미 구현됨)**

```typescript
// 🎫 로그인 유저인 경우 쿠폰 조회
if (userJson) {
  try {
    const user = JSON.parse(userJson);
    const { data: couponsData, error: couponsError } = await supabase
      .from('user_coupons')
      .select(`
        id,
        is_used,
        expired_at,
        coupons (
          name,
          discount_amount,
          coupon_type
        )
      `)
      .eq('user_id', user.id)
      .eq('is_used', false);

    if (couponsError) {
      console.error('❌ 쿠폰 조회 실패:', couponsError);
    } else {
      // 만료되지 않은 쿠폰만 필터링
      const validCoupons = (couponsData || []).filter((coupon: any) => {
        if (!coupon.expired_at) return true;
        return new Date(coupon.expired_at) > new Date();
      }) as UserCoupon[];
      
      setUserCoupons(validCoupons);
      console.log('🎟️ [쿠폰 조회] 사용 가능한 쿠폰:', validCoupons.length, '개');
      validCoupons.forEach((coupon, idx) => {
        console.log(`  [${idx + 1}] 쿠폰명: "${coupon.coupons.name}", 할인금액: ${coupon.coupons.discount_amount}원`);
      });
    }
  } catch (error) {
    console.error('쿠폰 조회 중 오류:', error);
  }
}
```

---

### **2. 쿠폰 타입 체크 수정**

#### **변경 전:**
```typescript
const hasWelcomeCoupon = userCoupons.some(c => c.coupons.coupon_type === 'welcome' && !c.is_used);
const hasRepurchaseCoupon = userCoupons.some(c => c.coupons.coupon_type === 'repurchase' && !c.is_used);
```

#### **변경 후:**
```typescript
// ⭐ 쿠폰명으로 정확히 구분 (coupon_type이 아닌 name 사용)
const hasWelcomeCoupon = userCoupons.some(c => c.coupons.name === '가입축하쿠폰' && !c.is_used);
const hasRevisitCoupon = userCoupons.some(c => c.coupons.name === '재방문 쿠폰' && !c.is_used);
```

---

### **3. 최종 혜택가 표시 (Line 586-644)**

```typescript
{/* 최종 혜택가 (조건부 표시) */}
{(() => {
  // ⭐ 쿠폰명으로 정확히 구분
  const hasWelcomeCoupon = userCoupons.some(c => c.coupons.name === '가입축하쿠폰' && !c.is_used);
  const hasRevisitCoupon = userCoupons.some(c => c.coupons.name === '재방문 쿠폰' && !c.is_used);
  
  // Case 1: 로그아웃 상태 - 가입축하쿠폰 적용가 표시
  if (!isLoggedIn) {
    const finalPrice = (content.price_discount || 0) - 5000;
    return (
      <div className="...">
        <p>{finalPrice.toLocaleString()}원</p>
        <p>첫 구매 혜택가</p>
      </div>
    );
  }
  
  // Case 2: 로그인 + 가입축하쿠폰 보유 (우선순위 1)
  if (hasWelcomeCoupon) {
    const finalPrice = (content.price_discount || 0) - 5000;
    return (
      <div className="...">
        <p>{finalPrice.toLocaleString()}원</p>
        <p>첫 구매 혜택가</p>
      </div>
    );
  }
  
  // Case 3: 로그인 + 재방문쿠폰만 보유 (우선순위 2)
  if (hasRevisitCoupon) {
    const finalPrice = (content.price_discount || 0) - 3000;
    return (
      <div className="...">
        <p>{finalPrice.toLocaleString()}원</p>
        <p>재구매 혜택가</p>
      </div>
    );
  }
  
  // Case 4: 로그인 + 쿠폰 없음 - 미노출
  return null;
})()}
```

---

### **4. 쿠폰 안내 버튼 (Line 650-795)**

```typescript
{/* 쿠폰 안내 버튼 (조건부 렌더링) */}
{(() => {
  const hasWelcomeCoupon = userCoupons.some(c => c.coupons.name === '가입축하쿠폰' && !c.is_used);
  const hasRevisitCoupon = userCoupons.some(c => c.coupons.name === '재방문 쿠폰' && !c.is_used);
  
  // Case 1: 로그아웃 상태 - 가입축하쿠폰 안내
  if (!isLoggedIn) {
    return (
      <button onClick={onPurchase}>
        "첫 구매 쿠폰 받고 {finalPrice}원으로 풀이 보기 >"
      </button>
    );
  }
  
  // Case 2: 로그인 + 가입축하쿠폰 보유
  if (hasWelcomeCoupon) {
    return (
      <button onClick={onPurchase}>
        "첫 구매 쿠폰 받고 {finalPrice}원으로 풀이 보기 >"
      </button>
    );
  }
  
  // Case 3: 로그인 + 재방문쿠폰만 보유
  if (hasRevisitCoupon) {
    return (
      <button onClick={onPurchase}>
        "재구매 쿠폰 받고 {finalPrice}원으로 풀이 보기 >"
      </button>
    );
  }
  
  // Case 4: 로그인 + 쿠폰 없음 - 미노출
  return null;
})()}
```

---

## 🎯 **작동 플로우**

### **시나리오 1: 로그아웃 사용자**
```
1. 상품 상세 페이지 접속
2. 쿠폰 조회 스킵 (로그아웃 상태)
3. UI 표시:
   - 할인가: 12,900원
   - 혜택가: 7,900원 (첫 구매 혜택가)
   - 버튼: "첫 구매 쿠폰 받고 7,900원으로 풀이 보기 >"
4. 버튼 클릭 → /login/new 로그인 페이지로 이동
```

### **시나리오 2: 가입축하쿠폰 보유 사용자**
```
1. 상품 상세 페이지 접속
2. 쿠폰 조회 → 가입축하쿠폰 발견
3. UI 표시:
   - 할인가: 12,900원
   - 혜택가: 7,900원 (첫 구매 혜택가)
   - 버튼: "첫 구매 쿠폰 받고 7,900원으로 풀이 보기 >"
4. 버튼 클릭 → /master/content/detail/{id}/payment 결제 페이지로 이동
```

### **시나리오 3: 재방문쿠폰만 보유 사용자**
```
1. 상품 상세 페이지 접속
2. 쿠폰 조회 → 재방문 쿠폰만 발견 (가입축하쿠폰 이미 사용함)
3. UI 표시:
   - 할인가: 12,900원
   - 혜택가: 9,900원 (재구매 혜택가)
   - 버튼: "재구매 쿠폰 받고 9,900원으로 풀이 보기 >"
4. 버튼 클릭 → /master/content/detail/{id}/payment 결제 페이지로 이동
```

### **시나리오 4: 쿠폰 없는 사용자**
```
1. 상품 상세 페이지 접속
2. 쿠폰 조회 → 사용 가능한 쿠폰 없음
3. UI 표시:
   - 할인가: 12,900원
   - 혜택가: ❌ 미노출
   - 버튼: ❌ 미노출
4. 하단 "구매하기" 버튼만 표시
```

---

## 🧪 **테스트 케이스**

### **✅ 체크리스트**

- [x] API: 사용자 보유 쿠폰 조회 (user_coupons + coupons JOIN)
- [x] UI: 최종 혜택가 영역 (조건부 노출)
- [x] UI: 쿠폰 안내 버튼 (조건부 노출)
- [x] 로직: 로그아웃 시 가입축하쿠폰 혜택가 기본 노출
- [x] 로직: 가입축하쿠폰 > 재방문쿠폰 우선순위 적용
- [x] 로직: 쿠폰 없는 경우 혜택가/안내 문구 미노출
- [x] 클릭: 로그아웃 → 로그인 페이지
- [x] 클릭: 로그인 → 결제 페이지

---

## 📊 **디버깅 로그**

### **쿠폰 조회 성공 시:**
```
🎟️ [쿠폰 조회] 사용 가능한 쿠폰: 2 개
  [1] 쿠폰명: "가입축하쿠폰", 할인금액: 5000원
  [2] 쿠폰명: "재방문 쿠폰", 할인금액: 3000원
```

### **쿠폰 없음:**
```
🎟️ [쿠폰 조회] 사용 가능한 쿠폰: 0 개
```

---

## 🔗 **관련 파일**

- **상품 상세 페이지**: `/components/MasterContentDetailPage.tsx`
- **결제 페이지**: `/components/PaymentNew.tsx`
- **쿠폰 서비스**: `/lib/coupon.ts`
- **DB 스키마**: `/DATABASE_SCHEMA.md`

---

## 📝 **주의사항**

1. **쿠폰명 정확히 매칭**: 
   - DB에 저장된 쿠폰명이 정확히 `'가입축하쿠폰'`, `'재방문 쿠폰'`이어야 함
   - 오타나 공백 주의

2. **만료일 체크**:
   - `expired_at`이 `null`인 경우 무제한 쿠폰
   - `expired_at`이 과거인 경우 필터링됨

3. **사용 여부 체크**:
   - `is_used = false`인 쿠폰만 조회
   - 이미 사용한 쿠폰은 노출되지 않음

---

**문서 끝**
