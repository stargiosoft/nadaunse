# ★GA_EVENTS_GUIDE★ - Google Analytics 4 이벤트 가이드

> **이 문서는 나다운세 서비스의 GA4 이벤트 트래킹 구현을 정리한 문서입니다.**
> **마케팅 퍼널 분석 및 사용자 행동 추적에 활용됩니다.**

---

## 목차

1. [개요](#개요)
2. [GA4 전자상거래 표준 이벤트](#ga4-전자상거래-표준-이벤트)
3. [마케팅 퍼널 이벤트](#마케팅-퍼널-이벤트)
4. [이벤트 상세 명세](#이벤트-상세-명세)
5. [파일별 이벤트 호출 위치](#파일별-이벤트-호출-위치)
6. [GA4 보고서 매핑](#ga4-보고서-매핑)
7. [디버깅 방법](#디버깅-방법)

---

## 개요

### 핵심 파일
- **이벤트 정의**: `src/utils/analytics.ts`
- **GA4 측정 ID**: 환경변수 `VITE_GA_MEASUREMENT_ID`

### 이벤트 전송 방식
```typescript
// gtag 함수를 통해 GA4로 이벤트 전송
window.gtag('event', eventName, parameters);
```

---

## GA4 전자상거래 표준 이벤트

GA4 "판매 촉진" 및 "구매 여정" 보고서에 데이터가 표시되려면 **표준 이벤트 형식**을 준수해야 합니다.

### 필수 이벤트 (구매 여정)

| 단계 | 이벤트 이름 | 필수 파라미터 |
|------|------------|--------------|
| 1. 세션 시작 | `session_start` | GA4 자동 수집 |
| 2. 제품 보기 | `view_item` | `currency`, `value`, `items[]` |
| 3. 결제 시작 | `begin_checkout` | `currency`, `value`, `items[]` |
| 4. 결제수단 추가 | `add_payment_info` | `currency`, `value`, `payment_type`, `items[]` |
| 5. 구매 완료 | `purchase` | `transaction_id`, `currency`, `value`, `items[]` |

### items 배열 형식 (필수)

```typescript
items: [
  {
    item_id: string,      // 상품 ID (필수)
    item_name: string,    // 상품명 (필수)
    item_category: string,// 카테고리
    price: number,        // 가격
    quantity: number,     // 수량
    discount: number,     // 할인액
  }
]
```

---

## 마케팅 퍼널 이벤트

### 퍼널 구조

```
[유입] → [무료 체험] → [회원가입] → [유료 전환] → [결제] → [리텐션]
```

### 퍼널별 이벤트 목록

| 퍼널 단계 | 이벤트 | 설명 |
|----------|--------|------|
| **유입** | `session_start` | 세션 시작 (자동) |
| **무료 체험** | `free_content_click` | 무료 콘텐츠 클릭 |
| | `free_birthinfo_submit` | 무료 사주 정보 입력 완료 |
| | `free_result_view` | 무료 결과 조회 |
| | `free_result_complete` | 무료 결과 완독 |
| **회원가입** | `login_click` | 로그인 버튼 클릭 |
| | `sign_up` | 회원가입 완료 |
| | `welcome_coupon_issued` | 웰컴 쿠폰 발급 |
| **유료 전환** | `paid_content_view` | 유료 콘텐츠 상세 조회 |
| | `purchase_click` | 구매하기 버튼 클릭 |
| | `view_item` | 상품 상세 조회 (GA4 표준) |
| **결제** | `begin_checkout` | 결제 시작 (GA4 표준) |
| | `payment_method_select` | 결제수단 선택 |
| | `add_payment_info` | 결제정보 입력 (GA4 표준) |
| | `coupon_apply` | 쿠폰 적용 |
| | `purchase` | 구매 완료 (GA4 표준) |
| **결과 조회** | `paid_result_view` | 유료 결과 조회 |
| | `paid_result_complete` | 유료 결과 완독 |
| **리텐션** | `revisit_coupon_issued` | 재방문 쿠폰 발급 |

---

## 이벤트 상세 명세

### 1. free_content_click
무료 콘텐츠 클릭 시 발생

```typescript
trackFreeContentClick(contentId: string)

// 파라미터
{
  content_id: string  // 콘텐츠 ID
}
```

**호출 위치**: `HomePage.tsx`

---

### 2. free_birthinfo_submit
무료 사주 정보 입력 완료 시 발생

```typescript
trackFreeBirthInfoSubmit(contentId: string, isLoggedIn: boolean)

// 파라미터
{
  content_id: string,   // 콘텐츠 ID
  is_logged_in: boolean // 로그인 여부
}
```

**호출 위치**: `FreeBirthInfoInput.tsx`

---

### 3. login_click
로그인 버튼 클릭 시 발생

```typescript
trackLoginClick(method: 'kakao' | 'apple' | 'google', fromPage: string)

// 파라미터
{
  method: string,    // 로그인 방식
  from_page: string  // 진입 페이지
}
```

**호출 위치**: `LoginPageNew.tsx`

---

### 4. welcome_coupon_issued
웰컴 쿠폰 발급 시 발생

```typescript
trackWelcomeCouponIssued(userId: string, couponAmount: number)

// 파라미터
{
  user_id: string,      // 사용자 ID
  coupon_amount: number // 쿠폰 금액
}
```

**호출 위치**: `WelcomeCouponPage.tsx`

---

### 5. paid_content_view
유료 콘텐츠 상세 페이지 조회 시 발생

```typescript
trackPaidContentView(contentId: string, contentTitle: string)

// 파라미터
{
  content_id: string,    // 콘텐츠 ID
  content_title: string  // 콘텐츠 제목
}
```

**호출 위치**: `MasterContentDetailPage.tsx`

---

### 6. purchase_click
구매하기 버튼 클릭 시 발생

```typescript
trackPurchaseClick(contentId: string, price: number)

// 파라미터
{
  content_id: string, // 콘텐츠 ID
  price: number       // 가격
}
```

**호출 위치**: `MasterContentDetailPage.tsx`

---

### 7. view_item (GA4 표준)
상품 상세 조회 시 발생

```typescript
trackViewItem(item: {
  id: string,
  title: string,
  category: string,
  type: 'paid' | 'free',
  discountPrice: number
})

// 파라미터 (GA4 표준)
{
  currency: 'KRW',
  value: number,
  items: [{
    item_id: string,
    item_name: string,
    item_category: string,
    item_variant: string,
    price: number,
    quantity: 1
  }]
}
```

**호출 위치**: `MasterContentDetailPage.tsx`

---

### 8. begin_checkout (GA4 표준)
결제 시작 시 발생

```typescript
trackBeginCheckout(item: {
  id: string,
  title: string,
  category: string,
  discountPrice: number
})

// 파라미터 (GA4 표준)
{
  currency: 'KRW',
  value: number,
  items: [{
    item_id: string,
    item_name: string,
    item_category: string,
    item_variant: '심화 해석판',
    price: number,
    quantity: 1
  }]
}
```

**호출 위치**: `PaymentNew.tsx`

---

### 9. payment_method_select
결제수단 선택 시 발생

```typescript
trackPaymentMethodSelect(method: 'kakaopay' | 'card')

// 파라미터
{
  method: string  // 결제수단
}
```

**호출 위치**: `PaymentNew.tsx`

---

### 10. coupon_apply
쿠폰 적용 시 발생

```typescript
trackCouponApply(contentId: string, couponType: 'welcome' | 'revisit', discountAmount: number)

// 파라미터
{
  content_id: string,      // 콘텐츠 ID
  coupon_type: string,     // 쿠폰 유형 (welcome/revisit)
  discount_amount: number  // 할인 금액
}
```

**호출 위치**: `CouponBottomSheetNew.tsx`

---

### 11. purchase (GA4 표준)
구매 완료 시 발생

```typescript
trackPurchaseComplete({
  transactionId: string,
  contentId: string,
  contentTitle: string,
  value: number,
  originalPrice: number,
  paymentMethod: string,
  couponUsed: boolean,
  couponType?: 'welcome' | 'revisit' | null,
  couponAmount?: number
})

// 파라미터 (GA4 표준)
{
  transaction_id: string,
  value: number,
  currency: 'KRW',
  items: [{
    item_id: string,
    item_name: string,
    price: number,
    discount: number,
    quantity: 1,
    item_category: '운세 콘텐츠'
  }],
  // 커스텀 파라미터
  payment_method: string,
  coupon_used: boolean,
  coupon_type: string,
  coupon_amount: number
}
```

**호출 위치**: `PaymentNew.tsx`

---

### 12. paid_result_view
유료 결과 조회 시 발생

```typescript
trackPaidResultView(orderId: string, contentId: string)

// 파라미터
{
  order_id: string,   // 주문 ID
  content_id: string  // 콘텐츠 ID
}
```

**호출 위치**: `UnifiedResultPage.tsx`

---

### 13. paid_result_complete
유료 결과 완독 시 발생

```typescript
trackPaidResultComplete(orderId: string, contentId: string)

// 파라미터
{
  order_id: string,   // 주문 ID
  content_id: string  // 콘텐츠 ID
}
```

**호출 위치**: `UnifiedResultPage.tsx`

---

### 14. revisit_coupon_issued
재방문 쿠폰 발급 시 발생

```typescript
trackRevisitCouponIssued(orderId: string, couponAmount: number)

// 파라미터
{
  order_id: string,     // 주문 ID
  coupon_amount: number // 쿠폰 금액
}
```

**호출 위치**: `ResultCompletePage.tsx`

---

## 파일별 이벤트 호출 위치

| 파일 | 이벤트 |
|------|--------|
| `HomePage.tsx` | `free_content_click` |
| `LoginPageNew.tsx` | `login_click` |
| `WelcomeCouponPage.tsx` | `welcome_coupon_issued` |
| `FreeBirthInfoInput.tsx` | `free_birthinfo_submit` |
| `MasterContentDetailPage.tsx` | `paid_content_view`, `purchase_click`, `view_item` |
| `PaymentNew.tsx` | `begin_checkout`, `payment_method_select`, `purchase` |
| `CouponBottomSheetNew.tsx` | `coupon_apply` |
| `UnifiedResultPage.tsx` | `paid_result_view`, `paid_result_complete` |
| `ResultCompletePage.tsx` | `revisit_coupon_issued` |

---

## GA4 보고서 매핑

### 판매 촉진 > 개요
- **총수익**: `purchase` 이벤트의 `value`
- **전체 구매자 수**: `purchase` 이벤트 발생 사용자 수
- **항목 이름별 구매한 상품**: `items[].item_name`

### 판매 촉진 > 구매 여정
| GA4 단계 | 이벤트 |
|---------|--------|
| 세션 시작 | `session_start` (자동) |
| 제품 보기 | `view_item` |
| 장바구니에 추가 | (해당 없음) |
| 결제 시작 | `begin_checkout` |
| 구매 | `purchase` |

### 사용자 > 이벤트
모든 커스텀 이벤트 확인 가능:
- `free_content_click`
- `login_click`
- `welcome_coupon_issued`
- `coupon_apply`
- `revisit_coupon_issued`
- 등

---

## 디버깅 방법

### 1. 실시간 확인
GA4 → **실시간** → 이벤트 카드에서 실시간으로 이벤트 확인

### 2. DebugView
1. Chrome에서 [GA Debugger 확장 프로그램](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) 설치
2. 확장 프로그램 활성화
3. GA4 → **관리** → **DebugView**에서 상세 이벤트 확인

### 3. 브라우저 콘솔
개발 환경에서 `console.log`로 이벤트 전송 확인:
```typescript
// analytics.ts의 trackEvent 함수에 로그 추가
console.log('📊 GA Event:', eventName, params);
```

### 4. 네트워크 탭
브라우저 개발자 도구 → Network → `collect?` 필터링하여 GA4 요청 확인

---

## 쿠폰 트래킹 상세

### 쿠폰 유형 구분
- **welcome**: 웰컴 쿠폰 (신규 가입)
- **revisit**: 재방문 쿠폰 (결과 완독 후)

### 쿠폰 관련 이벤트 흐름
```
[신규 가입] → welcome_coupon_issued
     ↓
[결제 시] → coupon_apply (coupon_type: 'welcome')
     ↓
[구매 완료] → purchase (coupon_used: true, coupon_type: 'welcome')
     ↓
[결과 완독] → revisit_coupon_issued
     ↓
[재구매 시] → coupon_apply (coupon_type: 'revisit')
     ↓
[구매 완료] → purchase (coupon_used: true, coupon_type: 'revisit')
```

---

## 주의사항

1. **GA4 데이터 지연**: 표준 보고서는 24-48시간 후 반영
2. **items 배열 필수**: 전자상거래 이벤트는 반드시 `items` 배열 포함
3. **currency 필수**: 금액 관련 이벤트는 `currency: 'KRW'` 필수
4. **중복 이벤트 주의**: 페이지 리렌더링 시 중복 발생하지 않도록 조건 체크

---

**최종 업데이트**: 2026-01-21
