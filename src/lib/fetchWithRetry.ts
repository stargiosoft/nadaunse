/**
 * Exponential Backoff 재시도 로직
 * - 5xx 서버 에러 + 네트워크 에러만 재시도
 * - 4xx 클라이언트 에러는 재시도 안함
 */

import { logger } from './logger';

interface RetryOptions {
  /** 최대 재시도 횟수 (기본: 3) */
  maxRetries?: number;
  /** 초기 대기 시간 ms (기본: 1000) */
  initialDelayMs?: number;
  /** 최대 대기 시간 ms (기본: 10000) */
  maxDelayMs?: number;
  /** 재시도 가능한 상태 코드 (기본: 5xx) */
  retryableStatuses?: number[];
  /** 타임아웃 ms (기본: 30000) */
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [500, 502, 503, 504],
  timeoutMs: 120000, // Edge Function은 최대 60초 소요될 수 있으므로 120초로 증가
};

/**
 * 지연 유틸리티 (jitter 포함)
 */
function delay(ms: number): Promise<void> {
  // 10% jitter 추가 (동시 요청 분산)
  const jitter = ms * 0.1 * Math.random();
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * 재시도 가능한 에러인지 확인
 */
function isRetryable(status: number, retryableStatuses: number[]): boolean {
  return retryableStatuses.includes(status);
}

/**
 * 네트워크 에러인지 확인
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // fetch의 네트워크 에러는 TypeError로 발생
    return error.message.includes('Failed to fetch') ||
           error.message.includes('Network request failed') ||
           error.message.includes('NetworkError');
  }
  if (error instanceof Error) {
    return error.name === 'AbortError' ||
           error.message.includes('timeout') ||
           error.message.includes('ECONNREFUSED') ||
           error.message.includes('ETIMEDOUT');
  }
  return false;
}

/**
 * Exponential Backoff으로 fetch 재시도
 *
 * @example
 * ```ts
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= opts.maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 성공 또는 재시도 불가능한 상태 코드
      if (response.ok || !isRetryable(response.status, opts.retryableStatuses)) {
        return response;
      }

      // 재시도 가능한 상태 코드
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      logger.warn(`[fetchWithRetry] 재시도 가능한 에러 (${response.status}), 시도 ${attempt + 1}/${opts.maxRetries + 1}`);

    } catch (error) {
      clearTimeout(timeoutId);

      if (!isNetworkError(error)) {
        // 네트워크 에러가 아니면 즉시 throw
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`[fetchWithRetry] 네트워크 에러, 시도 ${attempt + 1}/${opts.maxRetries + 1}:`, lastError.message);
    }

    // 마지막 시도면 재시도 안함
    if (attempt === opts.maxRetries) {
      break;
    }

    // Exponential Backoff 대기
    const delayMs = Math.min(
      opts.initialDelayMs * Math.pow(2, attempt),
      opts.maxDelayMs
    );
    logger.debug(`[fetchWithRetry] ${delayMs}ms 후 재시도...`);
    await delay(delayMs);

    attempt++;
  }

  // 모든 재시도 실패
  logger.error(`[fetchWithRetry] ${opts.maxRetries + 1}회 시도 후 최종 실패`);
  throw lastError || new Error('Unknown fetch error');
}

/**
 * Supabase Edge Function 호출용 헬퍼
 */
export async function callEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
  options?: RetryOptions & { accessToken?: string }
): Promise<T> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = `https://${projectId}.supabase.co/functions/v1/${functionName}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${options?.accessToken || anonKey}`,
  };

  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    },
    options
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge Function 에러 (${response.status}): ${errorText}`);
  }

  return response.json();
}

export default fetchWithRetry;
