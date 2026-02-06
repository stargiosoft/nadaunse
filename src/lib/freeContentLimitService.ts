/**
 * @file freeContentLimitService.ts
 * @description 비회원 무료 콘텐츠 일일 제한 서비스 (localStorage 기반)
 *
 * - 비로그인 유저: 하루 3개까지 무료 콘텐츠 조회 가능
 * - localStorage에 날짜별 조회 카운트 저장
 * - 같은 콘텐츠 재조회는 카운트 증가 안 함
 * - 날짜 기준: KST (한국 서비스)
 */

const STORAGE_KEY = 'free_content_views_v1';
const DAILY_LIMIT = 3;

interface FreeContentViewData {
  date: string;       // "YYYY-MM-DD" (KST)
  count: number;
  contentIds: string[];
}

/**
 * KST 기준 오늘 날짜 문자열 반환
 */
function getTodayKST(): string {
  const now = new Date();
  // UTC + 9시간 = KST
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  return kstDate.toISOString().split('T')[0];
}

/**
 * localStorage에서 조회 데이터 로드
 * - 날짜가 다르면 자동 리셋
 */
function loadViewData(): FreeContentViewData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { date: getTodayKST(), count: 0, contentIds: [] };
    }

    const data: FreeContentViewData = JSON.parse(raw);
    const today = getTodayKST();

    // 날짜가 다르면 리셋
    if (data.date !== today) {
      return { date: today, count: 0, contentIds: [] };
    }

    return data;
  } catch {
    return { date: getTodayKST(), count: 0, contentIds: [] };
  }
}

/**
 * localStorage에 조회 데이터 저장
 */
function saveViewData(data: FreeContentViewData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('❌ [freeContentLimit] localStorage 저장 실패');
  }
}

/**
 * 일일 제한에 도달했는지 확인 (즉시 체크, 0ms)
 */
export function hasReachedLocalLimit(): boolean {
  const data = loadViewData();
  return data.count >= DAILY_LIMIT;
}

/**
 * 남은 조회 횟수 반환
 */
export function getRemainingViews(): number {
  const data = loadViewData();
  return Math.max(0, DAILY_LIMIT - data.count);
}

/**
 * 무료 콘텐츠 조회 기록 (성공 후 호출)
 * - 같은 콘텐츠는 중복 카운트 안 함
 */
export function recordFreeContentView(contentId: string): void {
  const data = loadViewData();

  // 이미 오늘 본 콘텐츠면 카운트 증가 안 함
  if (data.contentIds.includes(contentId)) {
    console.log('ℹ️ [freeContentLimit] 이미 오늘 본 콘텐츠:', contentId);
    return;
  }

  data.contentIds.push(contentId);
  data.count = data.contentIds.length;
  saveViewData(data);
  console.log(`📊 [freeContentLimit] 조회 기록: ${data.count}/${DAILY_LIMIT} (contentId: ${contentId})`);
}

/**
 * 같은 콘텐츠를 오늘 이미 조회했는지 확인
 */
export function wasContentViewedToday(contentId: string): boolean {
  const data = loadViewData();
  return data.contentIds.includes(contentId);
}

/**
 * 일일 제한 상수
 */
export const FREE_CONTENT_DAILY_LIMIT = DAILY_LIMIT;
