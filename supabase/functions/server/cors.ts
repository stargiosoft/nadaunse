/**
 * CORS 유틸리티 - Edge Functions 공통 사용
 *
 * 허용 도메인:
 * - https://nadaunse.com (프로덕션)
 * - https://www.nadaunse.com (프로덕션)
 * - https://staging.nadaunse.com (스테이징)
 * - https://nadaunse-*.vercel.app (Vercel Preview)
 * - http://localhost:* (로컬 개발)
 */

const ALLOWED_ORIGINS = [
  'https://nadaunse.com',
  'https://www.nadaunse.com',
  'https://staging.nadaunse.com',
];

/**
 * Origin이 허용된 도메인인지 확인
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // 정확히 일치하는 도메인
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // 로컬 개발 환경 (localhost 모든 포트)
  if (origin.startsWith('http://localhost:') || origin === 'http://localhost') {
    return true;
  }

  // Vercel Preview 배포 (nadaunse-*.vercel.app)
  if (origin.match(/^https:\/\/nadaunse(-[a-z0-9-]+)?\.vercel\.app$/)) {
    return true;
  }

  return false;
}

/**
 * 요청의 Origin에 따라 CORS 헤더 생성
 * 허용되지 않은 Origin은 헤더에 포함하지 않음 (브라우저가 차단)
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin!;
  }

  return headers;
}

/**
 * CORS preflight 응답 생성
 */
export function handleCorsPreflightRequest(request: Request): Response {
  return new Response('ok', { headers: getCorsHeaders(request) });
}

/**
 * CORS 헤더가 포함된 JSON 응답 생성
 */
export function jsonResponse(
  request: Request,
  data: unknown,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * CORS 헤더가 포함된 에러 응답 생성
 */
export function errorResponse(
  request: Request,
  message: string,
  status: number = 500
): Response {
  return jsonResponse(request, { success: false, error: message }, status);
}
