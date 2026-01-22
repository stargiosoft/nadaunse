// Google Analytics 4 Utility Functions

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// GA Measurement ID (환경변수 또는 기본값)
const GA_MEASUREMENT_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) || 'G-XXXXXXXXXX';

// 개발환경 체크
const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

// GA 초기화
export const initGA = () => {
  if (typeof window === 'undefined') return;

  // gtag 함수 초기화
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  // GA 스크립트 로드
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // GA 설정 (Safari ITP 대응 포함)
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // 수동으로 페이지뷰 전송
    cookie_update: true, // 쿠키 만료 시간 갱신 (재방문 시)
    cookie_expires: 63072000, // 쿠키 만료: 2년 (초 단위)
    cookie_flags: 'SameSite=Lax;Secure', // 보안 쿠키 설정
  });

  // 로그인된 사용자가 있으면 user_id 설정 (재방문 추적 개선)
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user?.id) {
        window.gtag('config', GA_MEASUREMENT_ID, { user_id: user.id });
        if (isDevelopment) {
          console.log('👤 GA user_id set from localStorage:', user.id);
        }
      }
    }
  } catch (e) {
    // user 파싱 실패 시 무시
  }

  if (isDevelopment) {
    console.log('🔍 GA4 initialized:', GA_MEASUREMENT_ID);
  }
};

// 페이지뷰 트래킹
export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });

  if (isDevelopment) {
    console.log('📄 Page View:', { path, title });
  }
};

// 사용자 ID 설정
export const setUserId = (userId: string) => {
  if (!window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
  });

  if (isDevelopment) {
    console.log('👤 User ID Set:', userId);
  }
};

// 사용자 속성 설정
export const setUserProperties = (properties: Record<string, any>) => {
  if (!window.gtag) return;

  window.gtag('set', 'user_properties', properties);

  if (isDevelopment) {
    console.log('👤 User Properties:', properties);
  }
};

// 이벤트 트래킹 헬퍼
const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (!window.gtag) return;

  window.gtag('event', eventName, eventParams);

  if (isDevelopment) {
    console.log(`📊 Event: ${eventName}`, eventParams);
  }
};

// 1. 로그인
export const trackLogin = (method: string = 'kakao') => {
  trackEvent('login', { method });
};

// 2. 회원가입
export const trackSignUp = (method: string = 'kakao') => {
  trackEvent('sign_up', { method });
};

// 3. 상품 목록 조회
export const trackViewItemList = (items: any[], listName: string = 'product_list') => {
  trackEvent('view_item_list', {
    item_list_id: listName,
    item_list_name: listName,
    items: items.map((item, index) => ({
      item_id: item.id?.toString(),
      item_name: item.title,
      item_category: item.category,
      item_variant: item.type === 'paid' ? '심화 해석판' : '무료 체험판',
      price: item.type === 'paid' ? item.discountPrice : 0,
      index,
    })),
  });
};

// 4. 상품 선택 (카드 클릭)
export const trackSelectItem = (item: any, listName: string = 'product_list') => {
  trackEvent('select_item', {
    item_list_id: listName,
    item_list_name: listName,
    items: [
      {
        item_id: item.id?.toString(),
        item_name: item.title,
        item_category: item.category,
        item_variant: item.type === 'paid' ? '심화 해석판' : '무료 체험판',
        price: item.type === 'paid' ? item.discountPrice : 0,
      },
    ],
  });
};

// 5. 상품 상세 조회
export const trackViewItem = (item: any) => {
  trackEvent('view_item', {
    currency: 'KRW',
    value: item.type === 'paid' ? item.discountPrice : 0,
    items: [
      {
        item_id: item.id?.toString(),
        item_name: item.title,
        item_category: item.category,
        item_variant: item.type === 'paid' ? '심화 해석판' : '무료 체험판',
        price: item.type === 'paid' ? item.discountPrice : 0,
        quantity: 1,
      },
    ],
  });
};

// 6. 결제 시작
export const trackBeginCheckout = (item: any) => {
  trackEvent('begin_checkout', {
    currency: 'KRW',
    value: item.discountPrice,
    items: [
      {
        item_id: item.id?.toString(),
        item_name: item.title,
        item_category: item.category,
        item_variant: '심화 해석판',
        price: item.discountPrice,
        quantity: 1,
      },
    ],
  });
};

// 7. 결제수단 선택
export const trackAddPaymentInfo = (paymentType: 'kakaopay' | 'card', item: any) => {
  trackEvent('add_payment_info', {
    currency: 'KRW',
    value: item.discountPrice,
    payment_type: paymentType,
    items: [
      {
        item_id: item.id?.toString(),
        item_name: item.title,
        item_category: item.category,
        item_variant: '심화 해석판',
        price: item.discountPrice,
        quantity: 1,
      },
    ],
  });
};

// 8. 구매 완료
export const trackPurchase = (
  transactionId: string,
  item: any,
  paymentMethod: string
) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: item.discountPrice,
    currency: 'KRW',
    payment_type: paymentMethod,
    items: [
      {
        item_id: item.id?.toString(),
        item_name: item.title,
        item_category: item.category,
        item_variant: '심화 해석판',
        price: item.discountPrice,
        quantity: 1,
      },
    ],
  });
};

// 9. 사주 결과 조회
export const trackViewResult = (
  itemId: string,
  resultType: 'paid' | 'free',
  itemName?: string
) => {
  trackEvent('view_result', {
    item_id: itemId,
    item_name: itemName,
    result_type: resultType,
  });
};

// 10. 배너 클릭
export const trackClickBanner = (bannerId: string, bannerName: string) => {
  trackEvent('click_banner', {
    banner_id: bannerId,
    banner_name: bannerName,
  });
};

// 11. 상품 카드 클릭
export const trackClickProduct = (item: any, listName: string = 'product_list') => {
  trackEvent('click_product', {
    item_id: item.id?.toString(),
    item_name: item.title,
    list_name: listName,
  });
};

// 12. 필터 변경
export const trackFilterChange = (filterType: string, filterValue: string) => {
  trackEvent('filter_change', {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

// 13. 생년월일 입력 완료
export const trackBirthInfoSubmit = (itemId: string, itemType: 'paid' | 'free') => {
  trackEvent('birth_info_submit', {
    item_id: itemId,
    item_type: itemType,
  });
};

// 14. 약관 동의 완료
export const trackTermsAgreed = () => {
  trackEvent('terms_agreed');
};

// 15. 콘텐츠 생성 (마스터)
export const trackContentCreate = (contentType: string, contentId?: string) => {
  trackEvent('content_create', {
    content_type: contentType,
    content_id: contentId,
  });
};

// 16. 로그아웃
export const trackLogout = () => {
  trackEvent('logout');
};

// ============================================
// 마케팅 퍼널 이벤트 (2026-01-21 추가)
// ============================================

// 17. 로그인 버튼 클릭
export const trackLoginClick = (method: 'kakao' | 'google') => {
  trackEvent('login_click', { method });
};

// 18. 웰컴 쿠폰 발급
export const trackWelcomeCouponIssued = (couponAmount: number = 3000) => {
  trackEvent('welcome_coupon_issued', { coupon_amount: couponAmount });
};

// 19. 무료 콘텐츠 클릭
export const trackFreeContentClick = (contentId: string, title: string) => {
  trackEvent('free_content_click', {
    content_id: contentId,
    content_title: title,
  });
};

// 20. 무료 사주 입력 완료
export const trackFreeBirthInfoSubmit = (contentId: string, isLoggedIn: boolean) => {
  trackEvent('free_birthinfo_submit', {
    content_id: contentId,
    is_logged_in: isLoggedIn,
  });
};

// 21. 무료 결과 조회
export const trackFreeResultView = (contentId: string) => {
  trackEvent('free_result_view', { content_id: contentId });
};

// 22. 무료 결과 끝까지 봄
export const trackFreeResultComplete = (contentId: string) => {
  trackEvent('free_result_complete', { content_id: contentId });
};

// 23. 유료 콘텐츠 상세 조회
export const trackPaidContentView = (contentId: string, title: string, price: number) => {
  trackEvent('paid_content_view', {
    content_id: contentId,
    content_title: title,
    price: price,
  });
};

// 24. 구매 버튼 클릭
export const trackPurchaseClick = (contentId: string, title: string, price: number) => {
  trackEvent('purchase_click', {
    content_id: contentId,
    content_title: title,
    price: price,
  });
};

// 25. 결제 페이지 진입
export const trackCheckoutStart = (contentId: string, title: string, price: number) => {
  trackEvent('checkout_start', {
    content_id: contentId,
    content_title: title,
    price: price,
  });
};

// 26. 쿠폰 적용
export const trackCouponApply = (
  contentId: string,
  couponType: 'welcome' | 'revisit',
  discountAmount: number
) => {
  trackEvent('coupon_apply', {
    content_id: contentId,
    coupon_type: couponType,
    discount_amount: discountAmount,
  });
};

// 27. 결제 수단 선택
export const trackPaymentMethodSelect = (method: 'kakaopay' | 'card') => {
  trackEvent('payment_method_select', { method });
};

// 28. 구매 완료 (GA4 전자상거래 표준 형식 + 쿠폰 정보)
// ⭐ 2026-01-22 수정: items[0].price에 실제 결제 금액(value) 전송
// - 이전: originalPrice (정가) → GA에서 잘못된 수익 표시
// - 수정: value (쿠폰 적용 후 최종 결제 금액) → 실제 수익 반영
export const trackPurchaseComplete = (params: {
  transactionId: string;
  contentId: string;
  contentTitle: string;
  value: number;
  originalPrice: number;
  paymentMethod: string;
  couponUsed: boolean;
  couponType?: 'welcome' | 'revisit' | null;
  couponAmount?: number;
}) => {
  // GA4 전자상거래 표준: items 배열 필수
  trackEvent('purchase', {
    transaction_id: params.transactionId,
    value: params.value,
    currency: 'KRW',
    // GA4 필수: items 배열
    items: [
      {
        item_id: params.contentId,
        item_name: params.contentTitle,
        price: params.value, // ⭐ 실제 결제 금액 (쿠폰 적용 후)
        quantity: 1,
        item_category: '운세 콘텐츠',
      },
    ],
    // 커스텀 파라미터
    payment_method: params.paymentMethod,
    coupon_used: params.couponUsed,
    coupon_type: params.couponType || 'none',
    coupon_amount: params.couponAmount || 0,
    original_price: params.originalPrice, // ⭐ 정가는 커스텀 파라미터로 별도 기록
  });
};

// 29. 유료 결과 조회
export const trackPaidResultView = (orderId: string, contentId: string) => {
  trackEvent('paid_result_view', {
    order_id: orderId,
    content_id: contentId,
  });
};

// 30. 유료 결과 끝까지 봄
export const trackPaidResultComplete = (orderId: string, contentId: string) => {
  trackEvent('paid_result_complete', {
    order_id: orderId,
    content_id: contentId,
  });
};

// 31. 재방문 쿠폰 발급
export const trackRevisitCouponIssued = (orderId: string, couponAmount: number = 3000) => {
  trackEvent('revisit_coupon_issued', {
    order_id: orderId,
    coupon_amount: couponAmount,
  });
};