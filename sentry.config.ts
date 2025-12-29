import * as Sentry from "@sentry/react";

// Sentry DSN (환경변수 우선, 없으면 기본값)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ||
  "https://39080e19aa10174928f35f1cfd924d45@o4510615959109632.ingest.us.sentry.io/4510615989059584";

// 조건부 초기화 (DSN이 있을 때만)
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: true,
    // 환경 구분 (Vercel 환경변수 사용)
    environment: import.meta.env.MODE,
    // 성능 모니터링
    integrations: [Sentry.browserTracingIntegration()],
    // 프로덕션에선 10% 샘플링, 개발에선 100%
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });

  console.log(`🔍 [Sentry] 초기화 완료 (${import.meta.env.MODE})`);
}

// 사용자 정보 설정 함수 (로그인 후 호출)
export function setSentryUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}

// 커스텀 에러 리포팅 함수
export function captureError(error: Error, context?: { tags?: Record<string, string>; extra?: Record<string, any> }) {
  Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
  });
}
