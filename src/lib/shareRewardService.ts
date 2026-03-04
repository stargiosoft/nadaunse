/**
 * 공유 리워드 서비스
 * - 레퍼럴 코드 캡처/관리
 * - 공유 링크 생성
 * - 리워드 상태 조회
 */

import { projectId } from '../utils/supabase/info';

const PENDING_REFERRAL_KEY = 'pending_referral_code';
const REFERRAL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7일

interface PendingReferral {
  code: string;
  savedAt: number;
}

interface ShareRewardStatus {
  referralCode: string;
  currentRound: number;
  requiredCount: number;
  currentCount: number;
  totalRewardsEarned: number;
  totalFriendsReferred: number;
}

/**
 * URL에서 ref 파라미터를 캡처하여 localStorage에 저장
 * App.tsx 마운트 시 호출
 */
export function captureReferralFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');

    if (!refCode) return;

    // 이미 로그인된 사용자면 무시 (기존 회원은 레퍼럴 대상 아님)
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
      console.log('🔗 [레퍼럴] 로그인 상태 → ref 파라미터 무시');
      return;
    }

    const pending: PendingReferral = {
      code: refCode.trim(),
      savedAt: Date.now(),
    };

    localStorage.setItem(PENDING_REFERRAL_KEY, JSON.stringify(pending));
    console.log('🔗 [레퍼럴] ref 코드 저장:', refCode);

    // URL에서 ref 파라미터 제거 (깔끔한 URL 유지)
    params.delete('ref');
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  } catch (e) {
    console.error('🔗 [레퍼럴] ref 캡처 실패:', e);
  }
}

/**
 * 저장된 레퍼럴 코드 조회 (만료 체크 포함)
 */
export function getPendingReferral(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_REFERRAL_KEY);
    if (!raw) return null;

    const pending: PendingReferral = JSON.parse(raw);

    // 7일 초과 → 만료 처리
    if (Date.now() - pending.savedAt > REFERRAL_EXPIRY_MS) {
      localStorage.removeItem(PENDING_REFERRAL_KEY);
      console.log('🔗 [레퍼럴] 만료된 ref 코드 삭제');
      return null;
    }

    return pending.code;
  } catch {
    localStorage.removeItem(PENDING_REFERRAL_KEY);
    return null;
  }
}

/**
 * 레퍼럴 코드 삭제
 */
export function clearPendingReferral(): void {
  localStorage.removeItem(PENDING_REFERRAL_KEY);
}

/**
 * 레퍼럴 처리 (회원가입 완료 후 호출)
 * AuthCallback에서 신규 사용자 감지 시 호출
 *
 * fingerprint는 서버(Edge Function)에서 IP+UA 기반으로 생성
 * → 클라이언트 조작 불가, generate-free-preview와 동일 방식
 */
export async function processReferral(accessToken: string): Promise<boolean> {
  const refCode = getPendingReferral();
  if (!refCode) return false;

  try {
    console.log('🔗 [레퍼럴] 처리 시작:', refCode);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/process-referral`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referral_code: refCode,
        }),
      }
    );

    const result = await response.json();
    console.log('🔗 [레퍼럴] 처리 결과:', result);

    // 성공이든 실패든 pending 삭제 (재시도 방지)
    clearPendingReferral();

    return result.success === true;
  } catch (e) {
    console.error('🔗 [레퍼럴] 처리 실패:', e);
    clearPendingReferral();
    return false;
  }
}

/**
 * 공유 리워드 상태 조회
 */
export async function fetchShareRewardStatus(accessToken: string): Promise<ShareRewardStatus | null> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/get-share-reward-status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const result = await response.json();
    if (!result.success) return null;

    return {
      referralCode: result.referralCode,
      currentRound: result.currentRound,
      requiredCount: result.requiredCount,
      currentCount: result.currentCount,
      totalRewardsEarned: result.totalRewardsEarned,
      totalFriendsReferred: result.totalFriendsReferred,
    };
  } catch (e) {
    console.error('📊 [리워드상태] 조회 실패:', e);
    return null;
  }
}

/**
 * 공유 링크 생성
 */
export function generateShareLink(contentId: string, referralCode: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/product/${contentId}?ref=${referralCode}`;
}
