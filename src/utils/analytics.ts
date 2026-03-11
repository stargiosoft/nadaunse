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

// 관리자(master) GA 제외 플래그 (localStorage 캐시로 앱 재시작 시에도 즉시 적용)
let _isMasterUser = typeof localStorage !== 'undefined' && localStorage.getItem('ga_master_excluded') === 'true';

export const setMasterUser = (isMaster: boolean) => {
  _isMasterUser = isMaster;
  if (isMaster) {
    localStorage.setItem('ga_master_excluded', 'true');
  } else {
    localStorage.removeItem('ga_master_excluded');
  }
  if (isDevelopment) {
    console.log(`📊 GA 관리자 제외: ${isMaster}`);
  }
};

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
  if (!window.gtag || _isMasterUser) return;

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
  if (!window.gtag || _isMasterUser) return;

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

// 6. 장바구니에 추가 (GA4 표준 전자상거래 이벤트)
// ⭐ 2026-01-26 추가: 구매 여정 퍼널 연결을 위해 필수
export const trackAddToCart = (item: any) => {
  trackEvent('add_to_cart', {
    currency: 'KRW',
    value: item.discountPrice || item.price || 0,
    items: [
      {
        item_id: item.id?.toString(),
        item_name: item.title,
        item_category: item.category,
        item_variant: item.type === 'paid' ? '심화 해석판' : '무료 체험판',
        price: item.discountPrice || item.price || 0,
        quantity: 1,
      },
    ],
  });
};

// 7. 결제 시작 (GA4 표준 전자상거래 이벤트)
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

// 8. 결제수단 선택
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

// 9. 구매 완료
// ⭐ 2026-01-26 수정: 0원 결제 시 GA 트래킹 제외
export const trackPurchase = (
  transactionId: string,
  item: any,
  paymentMethod: string
) => {
  // 0원 결제는 GA 트래킹 제외
  if (!item.discountPrice || item.discountPrice <= 0) {
    if (isDevelopment) {
      console.log('📊 Purchase tracking skipped (0원 결제):', transactionId);
    }
    return;
  }

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

// 10. 사주 결과 조회
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

// 11. 배너 클릭
export const trackClickBanner = (bannerId: string, bannerName: string) => {
  trackEvent('click_banner', {
    banner_id: bannerId,
    banner_name: bannerName,
  });
};

// 12. 상품 카드 클릭
export const trackClickProduct = (item: any, listName: string = 'product_list') => {
  trackEvent('click_product', {
    item_id: item.id?.toString(),
    item_name: item.title,
    list_name: listName,
  });
};

// 13. 필터 변경
export const trackFilterChange = (filterType: string, filterValue: string) => {
  trackEvent('filter_change', {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

// 14. 생년월일 입력 완료
export const trackBirthInfoSubmit = (itemId: string, itemType: 'paid' | 'free') => {
  trackEvent('birth_info_submit', {
    item_id: itemId,
    item_type: itemType,
  });
};

// 15. 약관 동의 완료
export const trackTermsAgreed = () => {
  trackEvent('terms_agreed');
};

// 16. 콘텐츠 생성 (마스터)
export const trackContentCreate = (contentType: string, contentId?: string) => {
  trackEvent('content_create', {
    content_type: contentType,
    content_id: contentId,
  });
};

// 17. 로그아웃
export const trackLogout = () => {
  trackEvent('logout');
};

// ============================================
// 마케팅 퍼널 이벤트 (2026-01-21 추가)
// ============================================

// 18. 로그인 버튼 클릭
export const trackLoginClick = (method: 'kakao' | 'google') => {
  trackEvent('login_click', { method });
};

// 19. 웰컴 쿠폰 발급
export const trackWelcomeCouponIssued = (couponAmount: number = 3000) => {
  trackEvent('welcome_coupon_issued', { coupon_amount: couponAmount });
};

// 20. 무료 콘텐츠 클릭
export const trackFreeContentClick = (contentId: string, title: string) => {
  trackEvent('free_content_click', {
    content_id: contentId,
    content_title: title,
  });
};

// 21. 무료 사주 입력 완료
export const trackFreeBirthInfoSubmit = (contentId: string, isLoggedIn: boolean) => {
  trackEvent('free_birthinfo_submit', {
    content_id: contentId,
    is_logged_in: isLoggedIn,
  });
};

// 22. 무료 결과 조회
export const trackFreeResultView = (contentId: string) => {
  trackEvent('free_result_view', { content_id: contentId });
};

// 23. 무료 결과 끝까지 봄
export const trackFreeResultComplete = (contentId: string) => {
  trackEvent('free_result_complete', { content_id: contentId });
};

// 24. 유료 콘텐츠 상세 조회
export const trackPaidContentView = (contentId: string, title: string, price: number) => {
  trackEvent('paid_content_view', {
    content_id: contentId,
    content_title: title,
    price: price,
  });
};

// 25. 구매 버튼 클릭
export const trackPurchaseClick = (contentId: string, title: string, price: number) => {
  trackEvent('purchase_click', {
    content_id: contentId,
    content_title: title,
    price: price,
  });
};

// 26. 결제 페이지 진입
export const trackCheckoutStart = (contentId: string, title: string, price: number) => {
  trackEvent('checkout_start', {
    content_id: contentId,
    content_title: title,
    price: price,
  });
};

// 27. 쿠폰 적용
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

// 28. 결제 수단 선택
export const trackPaymentMethodSelect = (method: 'kakaopay' | 'card') => {
  trackEvent('payment_method_select', { method });
};

// 29. 구매 완료 (GA4 전자상거래 표준 형식 + 쿠폰 정보)
// ⭐ 2026-01-22 수정: items[0].price에 실제 결제 금액(value) 전송
// - 이전: originalPrice (정가) → GA에서 잘못된 수익 표시
// - 수정: value (쿠폰 적용 후 최종 결제 금액) → 실제 수익 반영
// ⭐ 2026-01-26 수정: 0원 결제(쿠폰 100% 할인) 시 GA 트래킹 제외
// - 실제 매출이 발생한 구매만 추적하여 정확한 수익 분석
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
  // 0원 결제(쿠폰 100% 할인)는 GA 트래킹 제외
  if (params.value <= 0) {
    if (isDevelopment) {
      console.log('📊 Purchase tracking skipped (0원 결제):', params.transactionId);
    }
    return;
  }

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

// 30. 유료 결과 조회
export const trackPaidResultView = (orderId: string, contentId: string) => {
  trackEvent('paid_result_view', {
    order_id: orderId,
    content_id: contentId,
  });
};

// 31. 유료 결과 끝까지 봄
export const trackPaidResultComplete = (orderId: string, contentId: string) => {
  trackEvent('paid_result_complete', {
    order_id: orderId,
    content_id: contentId,
  });
};

// 32. 재방문 쿠폰 발급
export const trackRevisitCouponIssued = (orderId: string, couponAmount: number = 3000) => {
  trackEvent('revisit_coupon_issued', {
    order_id: orderId,
    coupon_amount: couponAmount,
  });
};

// 33. 이번 주 보고서 먼저 받기 클릭
export const trackEarlyReportRequest = (tagCount: number) => {
  trackEvent('early_report_request', {
    tag_count: tagCount,
  });
};

// ============================================
// 공유 리워드 이벤트 (2026-03-04 추가)
// ============================================

// 34. 공유 바텀시트 열림
export const trackShareModalOpen = (contentId: string, isLoggedIn: boolean) => {
  trackEvent('share_modal_open', {
    content_id: contentId,
    is_logged_in: isLoggedIn,
  });
};

// 35. 링크 복사 클릭
export const trackShareLinkCopy = (contentId: string, isLoggedIn: boolean) => {
  trackEvent('share_link_copy', {
    content_id: contentId,
    is_logged_in: isLoggedIn,
  });
};

// 36. 카카오톡 공유 클릭
export const trackShareKakao = (contentId: string, isLoggedIn: boolean) => {
  trackEvent('share_kakao', {
    content_id: contentId,
    is_logged_in: isLoggedIn,
  });
};

// ============================================
// 상담 이벤트 (2026-03-05 추가)
// ============================================

// 37. 상담 로그인 유도 바텀시트에서 "로그인 하기" 클릭
export const trackConsultLoginClick = (source: 'saju_consult' | 'taro_consult' | 'home') => {
  trackEvent('consult_login_click', { source });
};

// 38. 상담 유형 선택 페이지에서 사주/타로 선택 클릭
export const trackConsultStartClick = (consultType: 'saju' | 'taro') => {
  trackEvent('consult_start_click', { consult_type: consultType });
};

// 38-1. 홈에서 "마음 털어놓기" 버튼 클릭 (상담 진입)
export const trackConsultEntryClick = (source: 'home_new' | 'home_result') => {
  trackEvent('consult_entry_click', { source });
};

// 38-2. 상담 유형 선택 페이지 조회
export const trackConsultTypeSelectView = () => {
  trackEvent('consult_type_select_view');
};

// 39. 상담 질문 제출 (로딩 페이지 진입 직전)
export const trackConsultSubmit = (consultType: 'saju' | 'taro', isLoggedIn: boolean) => {
  trackEvent('consult_submit', { consult_type: consultType, is_logged_in: isLoggedIn });
};

// 40. 상담 결과에서 추천 콘텐츠 클릭
export const trackConsultRecommendationClick = (consultType: 'saju' | 'taro', contentId: string) => {
  trackEvent('consult_recommendation_click', { consult_type: consultType, content_id: contentId });
};

// ============================================
// 나다움 분석 이벤트 (2026-03-11 추가)
// ============================================

// 41. 나다움 분석 메인 페이지 조회
export const trackNadaumPageView = (isLoggedIn: boolean, tagCount: number, isUnlocked: boolean) => {
  trackEvent('nadaum_page_view', {
    is_logged_in: isLoggedIn,
    tag_count: tagCount,
    is_unlocked: isUnlocked,
  });
};

// 42. 나다움 카테고리 카드 클릭
export const trackNadaumCategoryClick = (category: string, isUnlocked: boolean) => {
  trackEvent('nadaum_category_click', {
    category,
    is_unlocked: isUnlocked,
  });
};

// 43. 나다움 분석 상세 조회 (AI 분석 완료 시)
export const trackNadaumAnalysisView = (category: string, tagCount: number, isCached: boolean) => {
  trackEvent('nadaum_analysis_view', {
    category,
    tag_count: tagCount,
    is_cached: isCached,
  });
};

// 44. 나다움 분석 다시 분석 클릭
export const trackNadaumRefresh = (category: string, tagCount: number) => {
  trackEvent('nadaum_refresh', {
    category,
    tag_count: tagCount,
  });
};

// 45. 나다움 DNA 리포트 새로고침 (메인 페이지)
export const trackNadaumDnaRefresh = (tagCount: number) => {
  trackEvent('nadaum_dna_refresh', {
    tag_count: tagCount,
  });
};

// 46. 나다움 로그인 유도 클릭
export const trackNadaumLoginClick = () => {
  trackEvent('nadaum_login_click', { source: 'nadaum' });
};

// 47. 나다움 태그 모으기 CTA 클릭
export const trackNadaumCollectTagClick = (source: 'main' | 'category') => {
  trackEvent('nadaum_collect_tag_click', { source });
};

// ============================================
// 마음톡 이벤트 (2026-03-11 추가)
// ============================================

// 48. 마음톡 페이지 조회
export const trackMindTalkPageView = (isLoggedIn: boolean) => {
  trackEvent('mindtalk_page_view', {
    is_logged_in: isLoggedIn,
  });
};

// 49. 마음톡 모드 변경
export const trackMindTalkModeChange = (mode: 'general' | 'saju' | 'tarot') => {
  trackEvent('mindtalk_mode_change', {
    mode,
  });
};

// 50. 마음톡 메시지 전송
export const trackMindTalkMessageSend = (mode: 'general' | 'saju' | 'tarot', round: number, isSuggestion: boolean, isPaid: boolean) => {
  trackEvent('mindtalk_message_send', {
    mode,
    round,
    is_suggestion: isSuggestion,
    is_paid: isPaid,
  });
};

// 51. 마음톡 타로 카드 뽑기
export const trackMindTalkTarotDraw = (cardCount: number) => {
  trackEvent('mindtalk_tarot_draw', {
    card_count: cardCount,
  });
};

// 52. 마음톡 새싹 부족 (충전소 표시)
export const trackMindTalkSproutInsufficient = (mode: 'saju' | 'tarot', currentBalance: number) => {
  trackEvent('mindtalk_sprout_insufficient', {
    mode,
    current_balance: currentBalance,
  });
};

// 53. 마음톡 로그인 유도 클릭
export const trackMindTalkLoginClick = () => {
  trackEvent('mindtalk_login_click', { source: 'mindtalk' });
};

// 54. 마음톡 새 대화 시작 (라운드 증가)
export const trackMindTalkNewRound = (mode: 'general' | 'saju' | 'tarot', newRound: number) => {
  trackEvent('mindtalk_new_round', {
    mode,
    round: newRound,
  });
};