// A/B 가격 테스트 서비스 (임시 실험용)
// AB_TEST_ENABLED = false 로 변경하면 모든 사용자 그룹 A (원래 가격)

const AB_TEST_ENABLED = true;
const AB_TEST_PRICE = 2900;
const AB_TEST_NAME = 'price_test_v1';
const ANON_ID_KEY = 'ab_anonymous_id_v1';
const GROUP_CACHE_KEY = 'ab_group_v1';

/** 간단한 문자열 해시 (결정적) */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer
  }
  return Math.abs(hash);
}

/** 비로그인 사용자용 anonymous ID (localStorage) */
function getAnonymousId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

/** 사용자 그룹 반환 (같은 브라우저에서는 로그인 여부와 무관하게 동일 그룹) */
export function getABGroup(userId?: string): 'A' | 'B' {
  if (!AB_TEST_ENABLED) return 'A';

  // localStorage에 캐싱된 그룹이 있으면 그대로 사용 (로그인/비로그인 전환 시 가격 유지)
  const cached = localStorage.getItem(GROUP_CACHE_KEY);
  if (cached === 'A' || cached === 'B') return cached;

  // 최초 결정: anonymous ID 기반 해시 (user.id 무시 → 로그인 전후 일관성)
  const id = getAnonymousId();
  const hash = simpleHash(id + AB_TEST_NAME);
  const group = hash % 2 === 0 ? 'A' : 'B';
  localStorage.setItem(GROUP_CACHE_KEY, group);
  return group;
}

/** 현재 사용자의 userId를 localStorage에서 가져옴 */
function getCurrentUserId(): string | undefined {
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.id;
    }
  } catch {
    // ignore
  }
  return undefined;
}

/** AB 그룹에 따라 price_original, price_discount, discount_rate 오버라이드 */
export function getABPrice(content: {
  price_original: number;
  price_discount: number;
  discount_rate: number;
}): { price_original: number; price_discount: number; discount_rate: number } {
  const group = getABGroup(getCurrentUserId());
  if (group === 'A') {
    return {
      price_original: content.price_original,
      price_discount: content.price_discount,
      discount_rate: content.discount_rate,
    };
  }
  // 그룹 B: 정상가 9,900원, 할인가 2,900원
  const AB_ORIGINAL_PRICE = 9900;
  const newDiscount = AB_ORIGINAL_PRICE > 0
    ? Math.round((1 - AB_TEST_PRICE / AB_ORIGINAL_PRICE) * 100)
    : 0;
  return {
    price_original: AB_ORIGINAL_PRICE,
    price_discount: AB_TEST_PRICE,
    discount_rate: newDiscount,
  };
}

/** orders 테이블 기록용 라벨 (예: price_test_v1_A) */
export function getABGroupLabel(): string {
  const group = getABGroup(getCurrentUserId());
  return `${AB_TEST_NAME}_${group}`;
}
