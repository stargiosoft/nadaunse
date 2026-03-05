/**
 * @file consultLimitService.ts
 * @description 비회원 사주/타로 상담 체험 1회 제한 서비스 (localStorage 기반)
 *
 * - 비로그인 유저: 사주+타로 통합 최초 1회 체험 가능
 * - localStorage는 UX 최적화용 (서버 사이드가 권위적)
 * - 서버: anonymous_consult_views 테이블 fingerprint UNIQUE 제약
 */

const STORAGE_KEY = 'anonymous_consult_used_v1';

/**
 * 이미 상담 체험을 사용했는지 확인 (localStorage 기준)
 */
export function hasUsedConsult(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * 상담 체험 사용 기록 (Edge Function 성공 후 호출)
 */
export function recordConsultUsed(type: 'saju' | 'taro'): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
    console.log(`📊 [consultLimit] 상담 체험 사용 기록: ${type}`);
  } catch {
    console.error('❌ [consultLimit] localStorage 저장 실패');
  }
}
