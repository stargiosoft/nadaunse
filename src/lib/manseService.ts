import { supabase } from './supabase';

// 캐시 구조
interface ManseCache {
  data: Record<string, unknown>;
  sajuFingerprint: string;
  timestamp: number;
}

// primarySaju에서 필요한 필드
interface PrimarySaju {
  id: string;
  birth_date: string;
  birth_time?: string;
  gender: string;
  calendar_type?: string;
}

// 비로그인용 요청 파라미터
interface MansePublicParams {
  birthday: string;  // "199112251430" 형식
  gender: string;    // "male" | "female"
  lunar: string;     // "true" | "false"
}

const CACHE_KEY = 'manse_data_cache';

/**
 * 사주 정보로 고유 fingerprint 생성
 * 동일한 생년월일이면 만세력 결과가 동일하므로 fingerprint로 캐시 무효화 판단
 */
function createFingerprint(saju: PrimarySaju): string {
  return `${saju.id}_${saju.birth_date}_${saju.gender}_${saju.calendar_type || 'solar'}`;
}

/**
 * birth_date + birth_time → API birthday 파라미터 변환
 * "1991-12-25T09:00:00+09:00" + "14:30" → "199112251430"
 * birth_time 없음/모름 → "1200" (정오 기본값)
 */
function formatBirthday(birthDate: string, birthTime?: string): string {
  const datePart = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate.split(' ')[0];
  const dateOnly = datePart.replace(/-/g, '');

  let timeOnly = '1200'; // 기본값: 정오
  if (birthTime) {
    // "14:30" → "1430", "午(오시)" 같은 한글 시간은 기본값 사용
    const timeMatch = birthTime.match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      timeOnly = timeMatch[1].padStart(2, '0') + timeMatch[2];
    }
  }

  return dateOnly + timeOnly;
}

/**
 * localStorage에서 캐시 읽기
 */
function getCachedData(fingerprint: string): Record<string, unknown> | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: ManseCache = JSON.parse(cached);
    if (parsed.sajuFingerprint !== fingerprint) {
      // fingerprint 변경 → 캐시 무효화
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * localStorage에 캐시 저장
 */
function setCachedData(data: Record<string, unknown>, fingerprint: string): void {
  try {
    const cache: ManseCache = {
      data,
      sajuFingerprint: fingerprint,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 용량 초과 등 무시
  }
}

/**
 * 만세력 데이터 조회 (캐시 → API 호출)
 */
export async function getManseData(
  primarySaju: PrimarySaju
): Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }> {
  const fingerprint = createFingerprint(primarySaju);

  // 1. 캐시 확인
  const cached = getCachedData(fingerprint);
  if (cached) {
    return { success: true, data: cached };
  }

  // 2. API 호출
  try {
    const birthday = formatBirthday(primarySaju.birth_date, primarySaju.birth_time);

    // 성별 변환
    let gender = primarySaju.gender;
    if (gender === '남' || gender === 'male') gender = 'male';
    else if (gender === '여' || gender === 'female') gender = 'female';

    // lunar 판단
    const lunar = primarySaju.calendar_type === 'lunar' ? 'true' : 'false';

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;

    const response = await fetch(`${supabaseUrl}/functions/v1/get-manse-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ birthday, gender, lunar }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: (errorData as Record<string, string>).error || '만세력 조회에 실패했습니다' };
    }

    const result = await response.json();

    if (result.success && result.data) {
      // 캐시 저장
      setCachedData(result.data, fingerprint);
      return { success: true, data: result.data };
    }

    return { success: false, error: '만세력 데이터를 가져올 수 없습니다' };
  } catch {
    return { success: false, error: '네트워크 연결을 확인해주세요' };
  }
}

/**
 * 비로그인용 만세력 데이터 조회 (auth 토큰 없이 anon key만 사용)
 */
export async function getManseDataPublic(
  params: MansePublicParams
): Promise<{ success: true; data: Record<string, unknown> } | { success: false; error: string }> {
  // 캐시 확인 (birthday 기반 fingerprint)
  const fingerprint = `public_${params.birthday}_${params.gender}_${params.lunar}`;
  const cached = getCachedData(fingerprint);
  if (cached) {
    return { success: true, data: cached };
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;

    const response = await fetch(`${supabaseUrl}/functions/v1/get-manse-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: (errorData as Record<string, string>).error || '만세력 조회에 실패했습니다' };
    }

    const result = await response.json();

    if (result.success && result.data) {
      setCachedData(result.data, fingerprint);
      return { success: true, data: result.data };
    }

    return { success: false, error: '만세력 데이터를 가져올 수 없습니다' };
  } catch {
    return { success: false, error: '네트워크 연결을 확인해주세요' };
  }
}

export { formatBirthday };
