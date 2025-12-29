import * as Sentry from "@sentry/react";

// Sentry 초기화
Sentry.init({
  dsn: "https://39080e19aa10174928f35f1cfd924d45@o4510615959109632.ingest.us.sentry.io/4510615989059584",
  sendDefaultPii: true,
  // 환경 구분 (Vercel 환경변수 사용)
  environment: import.meta.env.MODE,
});
