// ─── 상담 상태 스토리지 키 (결과 페이지에서도 공유) ─────────────────────────
export const CONSULT_STORAGE_KEY = {
  saju: 'consult_status_saju',
  taro: 'consult_status_taro',
} as const;

// lastResult 마커 키 — markConsultCompleted 호출 시 함께 저장, 날짜 무관 영구 보존
export const LAST_RESULT_KEY = {
  saju: 'saju_last_result',
  taro: 'taro_last_result',
} as const;

export type ConsultKey    = keyof typeof CONSULT_STORAGE_KEY;
export type ConsultStatus = 'idle' | 'completed';

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export function readConsultStatus(storageKey: string): ConsultStatus {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 'idle';
    const { status, date } = JSON.parse(raw);
    return date === todayDateStr() ? (status as ConsultStatus) : 'idle';
  } catch {
    return 'idle';
  }
}

/** 결과 페이지에서 호출 — 해당 상담을 당일 완료 상태로 마킹 */
export function markConsultCompleted(key: ConsultKey) {
  localStorage.setItem(
    CONSULT_STORAGE_KEY[key],
    JSON.stringify({ status: 'completed', date: todayDateStr() }),
  );
  // Dev 토글 유효성 확인용 lastResult 마커 (날짜 무관 영구 저장)
  localStorage.setItem(LAST_RESULT_KEY[key], '1');
}
