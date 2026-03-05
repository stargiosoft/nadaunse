# ★GA_EVENTS_GUIDE★ - Google Analytics 4 이벤트 가이드

> **이 문서는 나다운세 서비스의 GA4 이벤트 트래킹 구현을 정리한 문서입니다.**
> **마케팅 퍼널 분석 및 사용자 행동 추적에 활용됩니다.**
> **최종 업데이트**: 2026-03-05

---

## 목차

1. [개요](#개요)
2. [0원 결제 제외 정책](#0원-결제-제외-정책)
3. [GA4 구매 여정 퍼널](#ga4-구매-여정-퍼널)
4. [페이지 타이틀 설정](#페이지-타이틀-설정)
5. [이벤트 목록](#이벤트-목록)
6. [이벤트 상세 명세](#이벤트-상세-명세)
7. [파일별 이벤트 호출 위치](#파일별-이벤트-호출-위치)
8. [GA4 보고서 매핑](#ga4-보고서-매핑)
9. [디버깅 방법](#디버깅-방법)

---

## 개요

### 핵심 파일
- **이벤트 정의**: `src/utils/analytics.ts`
- **GA4 측정 ID**: 환경변수 `VITE_GA_MEASUREMENT_ID`

### 주요 특징
- Safari ITP 대응 (쿠키 만료 2년, SameSite=Lax)
- 로그인 사용자 `user_id` 자동 설정
- 개발 환경에서 콘솔 로그 출력
- **0원 결제(쿠폰 100% 할인)는 구매 관련 이벤트에서 제외**

### 이벤트 전송 방식
```typescript
// gtag 함수를 통해 GA4로 이벤트 전송
window.gtag('event', eventName, parameters);
```

---

## 0원 결제 제외 정책

### 적용 대상 이벤트

| 이벤트 | 트리거 시점 | 0원 결제 |
|--------|-----------|---------|
| `add_to_cart` | 결제 페이지 진입 | ❌ **제외** |
| `begin_checkout` | 구매하기 버튼 클릭 | ❌ **제외** |
| `purchase` | 결제 완료 | ❌ **제외** |

### 제외 이유
1. **정확한 매출 분석**: 실제 수익이 발생한 구매만 추적
2. **퍼널 전환율 왜곡 방지**: 무료 전환이 유료 전환율에 영향 주지 않음
3. **마케팅 ROI 분석**: 실제 결제 사용자 기준 분석 가능

### 구현 코드
```typescript
// PaymentNew.tsx - add_to_cart
if (finalPrice > 0) {
  trackAddToCart({ ... });
}

// PaymentNew.tsx - begin_checkout
if (totalPrice > 0 && currentProduct) {
  trackBeginCheckout({ ... });
}

// analytics.ts - purchase
if (params.value <= 0) {
  console.log('📊 Purchase tracking skipped (0원 결제)');
  return;
}
```

---

## GA4 구매 여정 퍼널

### 표준 전자상거래 퍼널

```
세션 시작 → 제품 보기 → 장바구니에 추가 → 결제 시작 → 구매
(자동)      (view_item)   (add_to_cart)    (begin_checkout)  (purchase)
```

### 나다운세 구매 플로우

| 단계 | GA4 이벤트 | 트리거 시점 | 0원 결제 |
|------|-----------|------------|----------|
| 1. 콘텐츠 상세 조회 | `view_item` | 상품 페이지 진입 | ✅ 추적 |
| 2. 장바구니에 추가 | `add_to_cart` | **결제 페이지 진입** | ❌ 제외 |
| 3. 결제 시작 | `begin_checkout` | **구매하기 버튼 클릭** | ❌ 제외 |
| 4. 구매 완료 | `purchase` | 결제 완료 | ❌ 제외 |

### 예상 퍼널 지표

| 단계 | 예상 비율 | 비고 |
|------|----------|------|
| 세션 시작 | 100% | GA4 자동 수집 |
| 제품 보기 | ~50% | 콘텐츠 상세 페이지 조회 |
| 장바구니에 추가 | ~10% | 결제 페이지 진입 (0원 제외) |
| 결제 시작 | ~8% | 구매 버튼 클릭 (0원 제외) |
| 구매 | ~5% | 결제 완료 (0원 제외) |

---

## 페이지 타이틀 설정

### 일반 페이지 타이틀 (App.tsx PageTracker)

| 경로 패턴 | 페이지 타이틀 |
|----------|--------------|
| `/` | 나다운세 - AI 사주 타로 운세 |
| `/product/{id}/result` | 유료 운세 결과 \| 나다운세 |
| `/product/{id}/result/free` | 무료 운세 결과 \| 나다운세 |
| `/{id}/payment/new` | 결제 \| 나다운세 |
| `/login/new` | 로그인 \| 나다운세 |
| `/profile` | 마이페이지 \| 나다운세 |
| `/profile/nadaum-tags` | 나다움 태그 \| 나다운세 |
| `/pending-tags-check` | 태그 확인 중 \| 나다운세 |
| `/product/{id}/tag-loading` | 태그 추출 중 \| 나다운세 |
| `/paid/tag-loading` | 태그 추출 중 \| 나다운세 |
| `/master/stats` | 통계 대시보드 \| 나다운세 |
| `/nadaum-record/{id}` | [무료] 나다움 기록하기 \| 나다운세 |
| `/paid/nadaum-record` | [유료] 나다움 기록하기 \| 나다운세 |
| `/my-report-list` | 보고서 리스트 \| 나다운세 |
| `/report-weekly-detail/{id}` | 보고서 시작 \| 나다운세 |
| `/report-weekly-tarot/{id}` | 보고서 타로 셔플 \| 나다운세 |
| `/report-weekly-tarot-result/{id}` | 보고서 타로 결과 \| 나다운세 |
| `/report-weekly-mind-care/{id}` | 보고서 마음처방 \| 나다운세 |
| `/report-weekly-memo/{id}` | 보고서 나 응원하기 \| 나다운세 |
| `/report-completion/{id}` | 보고서 완료/쿠폰 \| 나다운세 |
| `/report-weekly/{id}/cheer-edit` | 나 응원하기 수정 \| 나다운세 |
| `/best-fortune` | BEST 운세 전체보기 \| 나다운세 |
| `/new-free` | NEW 무료 운세 전체보기 \| 나다운세 |
| `/search` | 검색 \| 나다운세 |
| `/saju-consult` | 사주 상담 \| 나다운세 |
| `/saju-consult/loading` | 사주 상담 생성 중 \| 나다운세 |
| `/saju-consult/result` | 사주 상담 결과 \| 나다운세 |
| `/saju-consult/result/recommended` | 추천 운세 전체보기 \| 나다운세 |
| `/taro-consult` | 타로 상담 \| 나다운세 |
| `/taro-consult/loading` | 타로 상담 생성 중 \| 나다운세 |
| `/taro-consult/result` | 타로 상담 결과 \| 나다운세 |

### 콘텐츠 상세 페이지: 이중 page_view 트래킹

콘텐츠 상세 페이지는 **2개의 page_view 이벤트**가 전송됩니다:

1. **일반 타이틀** (PageTracker) → 퍼널 분석용
2. **콘텐츠별 타이틀** (각 컴포넌트) → 개별 콘텐츠 성과 분석용

| 시점 | 타이틀 | 용도 |
|------|--------|------|
| 페이지 진입 즉시 | `유료 콘텐츠 상세 \| 나다운세` | 전체 퍼널 전환율 분석 |
| 콘텐츠 로드 후 | `[유료] 나는 과연 결혼할 수 있을까? \| 나다운세` | 개별 콘텐츠 성과 분석 |

#### GA에서 확인 예시

```
페이지 제목                                    | 조회수
---------------------------------------------|-------
유료 콘텐츠 상세 | 나다운세                      | 100   ← 전체 유료 상세 조회
[유료] 나는 과연 결혼할 수 있을까? | 나다운세      | 30    ← 개별 콘텐츠 조회
[유료] 올해 나의 재물운은? | 나다운세            | 25
[유료] 2026년 운세 총정리 | 나다운세             | 45
무료 콘텐츠 상세 | 나다운세                      | 200   ← 전체 무료 상세 조회
[무료] 오늘의 운세 | 나다운세                    | 150
```

### 설정 위치
- **일반 타이틀**: `src/App.tsx` (PageTracker 컴포넌트)
- **콘텐츠별 타이틀** (GA 트래킹 포함):
  - `src/components/MasterContentDetailPage.tsx` (유료) - `trackPageView` + `trackViewItem`
  - `src/components/FreeContentDetail.tsx` (무료) - `trackPageView` + `trackViewItem`

---

## 이벤트 목록

### 기본 이벤트

| # | 이벤트명 | 함수명 | 설명 |
|---|---------|--------|------|
| 1 | `login` | `trackLogin` | 로그인 완료 |
| 2 | `sign_up` | `trackSignUp` | 회원가입 완료 |
| 3 | `view_item_list` | `trackViewItemList` | 상품 목록 조회 |
| 4 | `select_item` | `trackSelectItem` | 상품 카드 클릭 |
| 5 | `view_item` | `trackViewItem` | 상품 상세 조회 |

### 전자상거래 이벤트 (GA4 표준)

| # | 이벤트명 | 함수명 | 설명 | 0원 제외 |
|---|---------|--------|------|---------|
| 6 | `add_to_cart` | `trackAddToCart` | 장바구니 추가 (결제 페이지 진입) | ✅ |
| 7 | `begin_checkout` | `trackBeginCheckout` | 결제 시작 (구매 버튼 클릭) | ✅ |
| 8 | `add_payment_info` | `trackAddPaymentInfo` | 결제수단 선택 | - |
| 9 | `purchase` | `trackPurchase` | 구매 완료 (레거시) | ✅ |

### 사용자 행동 이벤트

| # | 이벤트명 | 함수명 | 설명 |
|---|---------|--------|------|
| 10 | `view_result` | `trackViewResult` | 운세 결과 조회 |
| 11 | `click_banner` | `trackClickBanner` | 배너 클릭 |
| 12 | `click_product` | `trackClickProduct` | 상품 카드 클릭 |
| 13 | `filter_change` | `trackFilterChange` | 필터 변경 |
| 14 | `birth_info_submit` | `trackBirthInfoSubmit` | 생년월일 입력 완료 |
| 15 | `terms_agreed` | `trackTermsAgreed` | 약관 동의 완료 |
| 16 | `content_create` | `trackContentCreate` | 콘텐츠 생성 (마스터) |
| 17 | `logout` | `trackLogout` | 로그아웃 |

### 마케팅 퍼널 이벤트

| # | 이벤트명 | 함수명 | 설명 |
|---|---------|--------|------|
| 18 | `login_click` | `trackLoginClick` | 로그인 버튼 클릭 |
| 19 | `welcome_coupon_issued` | `trackWelcomeCouponIssued` | 웰컴 쿠폰 발급 |
| 20 | `free_content_click` | `trackFreeContentClick` | 무료 콘텐츠 클릭 |
| 21 | `free_birthinfo_submit` | `trackFreeBirthInfoSubmit` | 무료 사주 입력 완료 |
| 22 | `free_result_view` | `trackFreeResultView` | 무료 결과 조회 |
| 23 | `free_result_complete` | `trackFreeResultComplete` | 무료 결과 끝까지 봄 |
| 24 | `paid_content_view` | `trackPaidContentView` | 유료 콘텐츠 상세 조회 |
| 25 | `purchase_click` | `trackPurchaseClick` | 구매 버튼 클릭 |
| 26 | `checkout_start` | `trackCheckoutStart` | 결제 페이지 진입 |
| 27 | `coupon_apply` | `trackCouponApply` | 쿠폰 적용 |
| 28 | `payment_method_select` | `trackPaymentMethodSelect` | 결제 수단 선택 |
| 29 | `purchase` | `trackPurchaseComplete` | 구매 완료 (상세 버전) ✅ 0원 제외 |
| 30 | `paid_result_view` | `trackPaidResultView` | 유료 결과 조회 |
| 31 | `paid_result_complete` | `trackPaidResultComplete` | 유료 결과 끝까지 봄 |
| 32 | `revisit_coupon_issued` | `trackRevisitCouponIssued` | 재방문 쿠폰 발급 |

### 공유 리워드 이벤트

| # | 이벤트명 | 함수명 | 설명 |
|---|---------|--------|------|
| 34 | `share_modal_open` | `trackShareModalOpen` | 공유 바텀시트 열림 |
| 35 | `share_link_copy` | `trackShareLinkCopy` | 링크 복사 클릭 |
| 36 | `share_kakao` | `trackShareKakao` | 카카오톡 공유 클릭 |

> 모두 `content_id`, `is_logged_in` 파라미터 포함 → GA4에서 로그인/로그아웃 분기 분석 가능

### 상담 이벤트

| # | 이벤트명 | 함수명 | 설명 |
|---|---------|--------|------|
| 37 | `consult_login_click` | `trackConsultLoginClick` | 상담 로그인 유도 바텀시트에서 "로그인 하기" 클릭 |
| 38 | `consult_start_click` | `trackConsultStartClick` | 홈에서 상담 시작 버튼 클릭 |
| 39 | `consult_submit` | `trackConsultSubmit` | 상담 질문 제출 (로딩 진입 직전) |
| 40 | `consult_recommendation_click` | `trackConsultRecommendationClick` | 상담 결과에서 추천 콘텐츠 클릭 |

> - `consult_login_click`: `source` 파라미터 (`saju_consult` / `taro_consult` / `home`)
> - `consult_start_click`: `consult_type` 파라미터 (`saju` / `taro`)
> - `consult_submit`: `consult_type` + `is_logged_in` → 로그인 여부별 전환율 분석
> - `consult_recommendation_click`: `consult_type` + `content_id` → 상담→유료 전환 추적

---

## 이벤트 상세 명세

### add_to_cart (장바구니 추가) - 2026-01-26 추가

결제 페이지 진입 시 발생 (0원 결제 제외)

```typescript
trackAddToCart({
  id: 'content-123',
  title: '나는 과연 결혼할 수 있을까?',
  category: '연애/결혼',
  type: 'paid',
  discountPrice: 12900,
});

// GA4 전송 파라미터
{
  currency: 'KRW',
  value: 12900,
  items: [{
    item_id: 'content-123',
    item_name: '나는 과연 결혼할 수 있을까?',
    item_category: '연애/결혼',
    item_variant: '심화 해석판',
    price: 12900,
    quantity: 1
  }]
}
```

**호출 위치**: `PaymentNew.tsx` (useEffect)

---

### begin_checkout (결제 시작) - 트리거 시점 변경

구매하기 버튼 클릭 시 발생 (0원 결제 제외)

```typescript
trackBeginCheckout({
  id: 'content-123',
  title: '나는 과연 결혼할 수 있을까?',
  category: '연애/결혼',
  type: 'paid',
  discountPrice: 12900,
});

// GA4 전송 파라미터
{
  currency: 'KRW',
  value: 12900,
  items: [{
    item_id: 'content-123',
    item_name: '나는 과연 결혼할 수 있을까?',
    item_category: '연애/결혼',
    item_variant: '심화 해석판',
    price: 12900,
    quantity: 1
  }]
}
```

**호출 위치**: `PaymentNew.tsx` (handlePurchaseClick)

---

### purchase (구매 완료)

결제 완료 시 발생 (0원 결제 제외)

```typescript
trackPurchaseComplete({
  transactionId: 'order-abc123',
  contentId: 'content-123',
  contentTitle: '나는 과연 결혼할 수 있을까?',
  value: 9900,              // 실제 결제 금액 (쿠폰 적용 후)
  originalPrice: 12900,     // 정가
  paymentMethod: 'kakaopay',
  couponUsed: true,
  couponType: 'welcome',
  couponAmount: 3000,
});

// GA4 전송 파라미터
{
  transaction_id: 'order-abc123',
  value: 9900,
  currency: 'KRW',
  items: [{
    item_id: 'content-123',
    item_name: '나는 과연 결혼할 수 있을까?',
    price: 9900,             // 실제 결제 금액
    quantity: 1,
    item_category: '운세 콘텐츠'
  }],
  // 커스텀 파라미터
  payment_method: 'kakaopay',
  coupon_used: true,
  coupon_type: 'welcome',
  coupon_amount: 3000,
  original_price: 12900     // 정가 (별도 기록)
}
```

**호출 위치**: `PaymentNew.tsx`

---

### view_item (상품 상세 조회)

```typescript
trackViewItem({
  id: 'content-123',
  title: '나는 과연 결혼할 수 있을까?',
  category: '연애/결혼',
  type: 'paid',
  discountPrice: 12900,
});
```

**호출 위치**: `MasterContentDetailPage.tsx`

---

### consult_login_click (상담 로그인 유도 클릭) - 2026-03-05 추가

비회원이 상담 2회째 시도 시 로그인 바텀시트에서 "로그인 하기" 클릭

```typescript
trackConsultLoginClick('saju_consult');

// GA4 전송 파라미터
{
  source: 'saju_consult'  // 'saju_consult' | 'taro_consult' | 'home'
}
```

**호출 위치**: `SajuConsultPage.tsx`, `TaroConsultPage.tsx`, `HomeScreenNew.tsx` (LoginBottomSheet의 `onLoginClick` prop)

---

### consult_start_click (상담 시작 클릭) - 2026-03-05 추가

홈 화면에서 "상담 시작" 버튼 클릭 시 발생 (결과 보기는 제외)

```typescript
trackConsultStartClick('saju');

// GA4 전송 파라미터
{
  consult_type: 'saju'  // 'saju' | 'taro'
}
```

**호출 위치**: `HomeScreenNew.tsx` (상담 카드 버튼 onClick)

---

### consult_submit (상담 질문 제출) - 2026-03-05 추가

상담 페이지에서 질문 입력 후 로딩 페이지 진입 직전 발생

```typescript
trackConsultSubmit('saju', true);

// GA4 전송 파라미터
{
  consult_type: 'saju',  // 'saju' | 'taro'
  is_logged_in: true
}
```

**호출 위치**: `SajuConsultPage.tsx` (handleSubmit, onConsultComplete), `TaroConsultPage.tsx` (handleSubmit)

---

### consult_recommendation_click (추천 콘텐츠 클릭) - 2026-03-05 추가

상담 결과 페이지에서 추천 캐러셀의 유료 콘텐츠 클릭 시 발생

```typescript
trackConsultRecommendationClick('saju', 'content-123');

// GA4 전송 파라미터
{
  consult_type: 'saju',  // 'saju' | 'taro'
  content_id: 'content-123'
}
```

**호출 위치**: `SajuConsultResultPage.tsx`, `TaroConsultResultPage.tsx` (RecommendedCarousel onCardClick)

---

### 기타 이벤트 (간략)

| 이벤트 | 주요 파라미터 | 호출 위치 |
|--------|-------------|----------|
| `login_click` | `method` | `LoginPageNew.tsx` |
| `welcome_coupon_issued` | `coupon_amount` | `WelcomeCouponPage.tsx` |
| `free_content_click` | `content_id`, `content_title` | `HomePage.tsx` |
| `free_birthinfo_submit` | `content_id`, `is_logged_in` | `FreeBirthInfoInput.tsx` |
| `paid_content_view` | `content_id`, `content_title`, `price` | `MasterContentDetailPage.tsx` |
| `purchase_click` | `content_id`, `content_title`, `price` | `MasterContentDetailPage.tsx` |
| `coupon_apply` | `content_id`, `coupon_type`, `discount_amount` | `CouponBottomSheetNew.tsx` |
| `payment_method_select` | `method` | `PaymentNew.tsx` |
| `paid_result_view` | `order_id`, `content_id` | `UnifiedResultPage.tsx` |
| `paid_result_complete` | `order_id`, `content_id` | `UnifiedResultPage.tsx` |
| `revisit_coupon_issued` | `order_id`, `coupon_amount` | `ResultCompletePage.tsx` |

---

## 파일별 이벤트 호출 위치

| 파일 | 이벤트 |
|------|--------|
| `HomePage.tsx` | `free_content_click`, `view_item_list` |
| `LoginPageNew.tsx` | `login_click`, `login`, `sign_up` |
| `WelcomeCouponPage.tsx` | `welcome_coupon_issued` |
| `FreeBirthInfoInput.tsx` | `free_birthinfo_submit` |
| `MasterContentDetailPage.tsx` | `paid_content_view`, `purchase_click`, `view_item` |
| `PaymentNew.tsx` | `add_to_cart`, `begin_checkout`, `payment_method_select`, `purchase` |
| `CouponBottomSheetNew.tsx` | `coupon_apply` |
| `UnifiedResultPage.tsx` | `paid_result_view`, `paid_result_complete`, `free_result_view`, `free_result_complete` |
| `ResultCompletePage.tsx` | `revisit_coupon_issued` |
| `ShareRewardModal.tsx` | `share_modal_open`, `share_link_copy`, `share_kakao` |
| `HomeScreenNew.tsx` | `consult_start_click`, `consult_login_click` |
| `SajuConsultPage.tsx` | `consult_submit`, `consult_login_click` |
| `TaroConsultPage.tsx` | `consult_submit`, `consult_login_click` |
| `SajuConsultResultPage.tsx` | `consult_recommendation_click` |
| `TaroConsultResultPage.tsx` | `consult_recommendation_click` |

---

## GA4 보고서 매핑

### 판매 촉진 > 개요
- **총수익**: `purchase` 이벤트의 `value`
- **전체 구매자 수**: `purchase` 이벤트 발생 사용자 수
- **항목 이름별 구매한 상품**: `items[].item_name`

### 판매 촉진 > 구매 여정
| GA4 단계 | 이벤트 | 트리거 시점 |
|---------|--------|-----------|
| 세션 시작 | `session_start` | 자동 수집 |
| 제품 보기 | `view_item` | 상품 상세 페이지 |
| 장바구니에 추가 | `add_to_cart` | 결제 페이지 진입 |
| 결제 시작 | `begin_checkout` | 구매 버튼 클릭 |
| 구매 | `purchase` | 결제 완료 |

### 페이지 및 화면
- **유료/무료 구분**: `[유료]`, `[무료]` 접두사로 필터링
- **콘텐츠별 성과**: 개별 콘텐츠 타이틀로 확인

### 사용자 > 이벤트
모든 커스텀 이벤트 확인 가능:
- `free_content_click`, `login_click`, `welcome_coupon_issued`
- `coupon_apply`, `revisit_coupon_issued` 등

---

## 디버깅 방법

### 1. 개발 환경 콘솔 로그
개발 환경(`import.meta.env.DEV`)에서 자동 출력:
```
📊 Event: add_to_cart { currency: 'KRW', value: 12900, items: [...] }
📊 Event: begin_checkout { currency: 'KRW', value: 12900, items: [...] }
📊 Purchase tracking skipped (0원 결제): order-abc123
```

### 2. GA4 DebugView
1. Chrome에서 [GA Debugger 확장 프로그램](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) 설치
2. 확장 프로그램 활성화
3. GA4 → **관리** → **DebugView**에서 상세 이벤트 확인

### 3. GA4 실시간
GA4 → **실시간** → 이벤트 카드에서 실시간으로 이벤트 확인

### 4. 네트워크 탭
브라우저 개발자 도구 → Network → `collect?` 필터링하여 GA4 요청 확인

---

## 주의사항

1. **GA4 데이터 지연**: 표준 보고서는 24-48시간 후 반영
2. **items 배열 필수**: 전자상거래 이벤트는 반드시 `items` 배열 포함
3. **currency 필수**: 금액 관련 이벤트는 `currency: 'KRW'` 필수
4. **0원 결제 제외**: `add_to_cart`, `begin_checkout`, `purchase`는 0원 결제 시 이벤트 미전송
5. **중복 이벤트 주의**: 페이지 리렌더링 시 중복 발생하지 않도록 조건 체크
6. **유료 `/result` page_view 최초 1회 전송**: orderId당 최초 조회 시에만 page_view 전송 (구매 내역 재조회 시 제외, localStorage `viewed_paid_result_orders` 키로 관리)
7. **무료 `/product/:id/result/free` page_view 최초 1회 전송**: recordId당 최초 조회 시에만 page_view 전송 (재조회 시 제외, localStorage `viewed_free_result_records` 키로 관리)

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-21 | 마케팅 퍼널 이벤트 추가 (18-32번) |
| 2026-01-22 | purchase 이벤트 price 수정 (정가 → 실결제금액) |
| 2026-01-26 | 0원 결제 GA 트래킹 제외 정책 추가 |
| 2026-01-26 | `add_to_cart` 이벤트 추가 (구매 여정 퍼널 연결) |
| 2026-01-26 | `begin_checkout` 트리거 시점 변경 (페이지 진입 → 버튼 클릭) |
| 2026-01-26 | 페이지 타이틀 유료/무료 구분 추가 (`[유료]`, `[무료]` 접두사) |
| 2026-01-26 | 유료 운세 결과 타이틀 명확화 (`운세 결과` → `유료 운세 결과`) |
| 2026-01-26 | 콘텐츠 상세 이중 page_view - 일반 타이틀(퍼널용) + 콘텐츠별 타이틀(성과분석용) |
| 2026-01-28 | `/result` page_view orderId당 최초 1회만 전송 (구매 내역 재조회 제외) |
| 2026-01-29 | 무료 `/product/:id/result/free` page_view recordId당 최초 1회만 전송 (재조회 시 제외) |
| 2026-02-02 | 나다움 기록하기 페이지 타이틀 추가 (`[무료]`, `[유료]` 구분) |
| 2026-02-02 | 나다움 태그 페이지 타이틀 추가 (`/profile/nadaum-tags`) |
| 2026-02-05 | 주간 보고서 페이지 타이틀 추가 (보고서 리스트, 보고서 시작, 타로 셔플/결과, 마음처방, 나 응원하기, 완료/쿠폰) |
| 2026-02-12 | 누락 페이지 타이틀 일괄 등록 (태그 확인 중, 태그 추출 중, 통계 대시보드) - "나다운세"로만 찍히던 이슈 해결 |
| 2026-03-04 | 공유 리워드 이벤트 추가 (34-36번: `share_modal_open`, `share_link_copy`, `share_kakao`) |
| 2026-03-05 | 홈 고도화 페이지 타이틀 추가 (BEST 운세, NEW 무료 운세, 검색, 사주/타로 상담, 상담 로딩/결과, 추천 운세 전체보기) |
| 2026-03-05 | 상담 이벤트 추가 (37-40번: `consult_login_click`, `consult_start_click`, `consult_submit`, `consult_recommendation_click`) |

---

## 참고 자료

- [GA4 전자상거래 이벤트](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [GA4 이벤트 파라미터](https://support.google.com/analytics/answer/9267744)
- [GA4 DebugView](https://support.google.com/analytics/answer/7201382)
