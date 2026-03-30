# 보안 규칙 (모든 코딩 작업에 자동 적용)

## 절대 금지
- API 키, 시크릿 하드코딩 → 환경변수 필수 (`VITE_*`, `Deno.env.get()`)
- `error.message` 사용자 직접 노출 → 일반 메시지만 표시, 상세는 `console.error`
- 외부 이미지 URL 직접 사용 (CSP 위반)

## Edge Function 필수 패턴
- CORS: `supabase/functions/server/cors.ts` 사용 필수
- 허용 Origin: `nadaunse.com`, `www.nadaunse.com`, `staging.nadaunse.com`, `localhost:*`
- JWT 불필요 함수 10개: generate-saju-answer, generate-tarot-answer, send-alimtalk, generate-weekly-report, send-report-alimtalk, generate-sitemap, generate-upsell-mapping, generate-nadaum-analysis, mind-talk-chat, get-failed-reports

## CSP 허용 범위 (이 외 추가 시 반드시 확인)
- img-src: `self`, `data:`, `blob:`, `*.supabase.co`, `*.kakaocdn.net`, `wcs.pstatic.net`
- connect-src: `*.supabase.co`, `*.sentry.io`, `kakao`, `iamport/portone`, `GA`, `naver`
- frame-src: `iamport/portone`, `kakao`, `kakaopay`, `danal`, `teledit`, `inicis`, `toss`
- CSP 변경 후 **모든 결제 수단 × PC/모바일** 테스트 필수 (3주 결제 장애 전례)

## 에러 처리
```tsx
// ✅
console.error('로그인 에러:', error);
alert('로그인에 실패했습니다. 다시 시도해주세요.');

// ❌
alert('로그인 실패: ' + error.message);
```

## 인시던트 대응
- API 키 유출 시: 즉시 로테이션 → Vercel + Supabase Secrets 동기 업데이트
- .env 커밋 시: `git rm --cached` → `.gitignore` 보강 → 시크릿 로테이션

## 상세 문서: `src/docs/develop/★SECURITY★.md`
