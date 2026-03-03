# 나다운세 (nadaunse)

> 타로/사주 운세 모바일 웹 서비스
> **Production**: https://nadaunse.com

## 🚀 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
```

## 📋 환경 설정

### Supabase 환경 분리

| 환경 | Project ID | URL |
|------|------------|-----|
| **Production** | `kcthtpmxffppfbkjjkub` | https://kcthtpmxffppfbkjjkub.supabase.co |
| **Staging** | `hyltbeewxaqashyivilu` | https://hyltbeewxaqashyivilu.supabase.co |

### Vercel 환경변수

```bash
# Production
VITE_SUPABASE_PROJECT_ID=kcthtpmxffppfbkjjkub
VITE_SUPABASE_ANON_KEY=<production-anon-key>
VITE_KAKAO_AUTH_SECRET=<kakao-auth-secret>
VITE_SENTRY_DSN=<sentry-dsn>

# Preview/Staging
VITE_SUPABASE_PROJECT_ID=hyltbeewxaqashyivilu
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
VITE_KAKAO_AUTH_SECRET=<kakao-auth-secret>
VITE_SENTRY_DSN=<sentry-dsn>
```

### 로컬 개발 (.env.local)

```bash
VITE_SUPABASE_PROJECT_ID=hyltbeewxaqashyivilu
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
```

## 🛠️ Tech Stack

| 분류 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Tailwind CSS v4.0 + Vite |
| Backend | Supabase (PostgreSQL + Edge Functions 38개) |
| AI | OpenAI GPT-4o/GPT-5.1, Anthropic Claude-3.5-Sonnet, Google Gemini |
| 자동화 | pg_cron + pg_net (주간 보고서 자동 발송) |
| 결제 | PortOne v2 |
| 알림 | TalkDream API (카카오 알림톡) |
| 에러 모니터링 | Sentry |
| 배포 | Vercel |

## 📊 주요 통계

> 상세 통계는 [components-inventory.md](./src/components-inventory.md) 참조

## 📚 문서

| 문서 | 설명 |
|------|------|
| **[CLAUDE.md](./CLAUDE.md)** ⭐ | **개발 규칙 + AI 작업 가이드 (통합본, 필독!)** |
| [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) | 프로젝트 전체 컨텍스트 |
| [DECISIONS.md](./src/DECISIONS.md) | 아키텍처 결정 기록 |
| [DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md) | DB 스키마 |
| [components-inventory.md](./src/components-inventory.md) | 컴포넌트 목록 |
| [EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md) | Edge Functions 가이드 |

> **참고**: AI_ONBOARDING.md는 CLAUDE.md에 통합되었습니다.

## 🔗 Links

- **Figma**: [운세 서비스 홈 화면](https://www.figma.com/design/bc3Qpt5d7QS33QrqQuevI2)
- **GitHub**: https://github.com/stargiosoft/nadaunse
- **Vercel**: https://vercel.com/stargiosofts-projects/nadaunse

## 🆕 최근 주요 변경사항 (2026-02-15)

### 스테이징/프로덕션 주간 보고서 일정 분리
- **WEEK_START_DAY 환경변수**: 프로덕션=0(일~토), 스테이징=3(수~화)
- **pg_cron 스케줄**: 프로덕션 일요일 `*/10 3-12 * * 0`, 스테이징 수요일 `*/10 3-12 * * 3`
- **영향**: `generate-weekly-reports-batch`, `generate-weekly-report`

### 알림톡 SITE_URL 환경변수 적용
- **기능**: `send-alimtalk`, `send-report-alimtalk`에서 SITE_URL 환경변수 사용
- **효과**: 스테이징에서 프로덕션 URL 발송 방지
- **스테이징**: `SITE_URL=https://staging.nadaunse.com`

### get-failed-reports KST→UTC 타임존 수정
- **문제**: 관리자 패널 실패 보고서 조회 시 날짜 필터가 KST→UTC 변환 없이 사용되어 18명이 잘못 카운트됨
- **수정**: `weekStartDate`/`weekEndDate`를 UTC로 변환 후 `created_at` 비교

### deploy-staging.bat --no-verify-jwt 누락 수정
- **수정**: 6개 함수에 누락된 `--no-verify-jwt` 플래그 추가
- **함수**: `generate-weekly-report`, `generate-weekly-reports-batch`, `send-report-alimtalk`, `payment-webhook`, `cleanup-unconfirmed-tags`, `sentry-slack-webhook`

## 🆕 최근 주요 변경사항 (2026-02-10~11)

### Google OAuth 팝업 모드 전환
- **변경**: Google OAuth redirect 방식 → 팝업/새 탭 방식으로 전환
- **원인**: iOS Safari에서 Google OAuth redirect가 히스토리 스택에 3-4개 항목 추가 → 뒤로가기 오작동
- **영향**: auth.ts, AuthCallback.tsx, LoginPageNew.tsx, ExistingAccountPageNew.tsx
- **상세**: [DECISIONS.md](./src/DECISIONS.md) → "2026-02-11 Google OAuth 팝업 모드 전환"

### 유료 콘텐츠 통합 결과 페이지 (UnifiedResultPage)
- **변경**: SajuResultPage + TarotResultPage → UnifiedResultPage로 통합
- **효과**: 코드 중복 제거, 유지보수성 향상

### 주간 보고서 컴포넌트 추가
- **추가**: MyReportEmpty, WeeklyReportLoading, ReceiveMyAnalysis
- **효과**: 빈 상태 UI, 로딩 상태, 분석 수신 플로우 개선

> 이전 변경사항은 `git log`로 확인할 수 있습니다.

---

**최종 업데이트**: 2026-03-03
