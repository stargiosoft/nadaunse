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
| Backend | Supabase (PostgreSQL + Edge Functions 32개) |
| AI | OpenAI GPT-4o/GPT-5.1, Anthropic Claude-3.5-Sonnet, Google Gemini |
| 자동화 | pg_cron + pg_net (주간 보고서 자동 발송) |
| 결제 | PortOne v2 |
| 알림 | TalkDream API (카카오 알림톡) |
| 에러 모니터링 | Sentry |
| 배포 | Vercel |

## 📊 주요 통계

- **컴포넌트**: 69개 (주간 보고서 8개 + 통계 대시보드 2개 포함)
- **Edge Functions**: 32개 (주간 보고서 4개 포함)
- **페이지**: 41개
- **UI 컴포넌트 (shadcn/ui)**: 52개

## 📚 문서

| 문서 | 설명 |
|------|------|
| **[CLAUDE.md](./CLAUDE.md)** ⭐ | **개발 규칙 + AI 작업 가이드 (통합본, 필독!)** |
| [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) | 프로젝트 전체 컨텍스트 |
| [DECISIONS.md](./src/DECISIONS.md) | 아키텍처 결정 기록 |
| [DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md) | DB 스키마 |
| [components-inventory.md](./src/components-inventory.md) | 컴포넌트 목록 (69개) |
| [EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md) | Edge Functions (32개) |

> **참고**: AI_ONBOARDING.md는 CLAUDE.md에 통합되었습니다.

## 🔗 Links

- **Figma**: [운세 서비스 홈 화면](https://www.figma.com/design/bc3Qpt5d7QS33QrqQuevI2)
- **GitHub**: https://github.com/stargiosoft/nadaunse
- **Vercel**: https://vercel.com/stargiosofts-projects/nadaunse

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

## 🆕 최근 주요 변경사항 (2026-02-09)

### rejected_tags 태그 제외 시스템
- **기능**: 나다움 기록하기에서 미선택 태그를 `users.rejected_tags`에 누적 저장
- **효과**: 다음 콘텐츠 태그 추출 시 AI가 거부된 태그 자동 제외
- **영향**: CheckRecordMe, extract-trait-tags, UnifiedResultPage, App.tsx

### 유료 콘텐츠 초개인화 풀이 (프로덕션 배포)
- **기능**: 사주/타로 풀이 시 사용자의 나다움 태그를 AI 프롬프트에 반영
- **효과**: 최근 4주 태그(우선) + 누적 태그(보조)로 개인화된 답변 생성
- **영향**: generate-content-answers, generate-saju-answer, generate-tarot-answer

### 미션성공쿠폰 추가 + 쿠폰 발급 프로세스 변경
- **기능**: 주간 보고서 1회차 → 미션성공쿠폰, 2회차+ → 재방문쿠폰 발급
- **현황**: 프로덕션에는 쿠폰 데이터만 추가, 발급 로직은 스테이징에서 테스트 중

### last_login_at 갱신 로직 통합
- **변경**: HomePage 전용 → App.tsx `recordTodayVisit()` (모든 페이지 방문 시)
- **효과**: StatsDashboard contentUsageRate > 100% 문제 해결
- **영향**: auth.ts, HomePage.tsx, statsService.ts

### 무료 콘텐츠 일일 제한 upsert 방식
- **방식**: anonymous_free_views에 upsert (fingerprint + content_id + viewed_date UNIQUE 인덱스 기반)
- **효과**: 같은 콘텐츠 재조회 시 중복 방지, 다른 콘텐츠 조회만 일일 제한에 카운트

## 🆕 최근 주요 변경사항 (2026-02-03)

### 주간 보고서 자동 발송 시스템
- **pg_cron + pg_net**: 매주 자동 보고서 생성 및 알림톡 발송
- **GPT-5.1 기반**: 사주/태그 데이터 기반 맞춤형 보고서 생성
- **배치 처리**: concurrency 3, 2초 간격, 60초 시간 제한 (shutdown 방지)
- **selfContinue 패턴**: 시간 제한 시 서버가 자동으로 자기 자신 재호출 (클라이언트 개입 불필요)
- **관리자 패널**: 실패 보고서 조회 및 재발송 기능 (fire-and-forget)

### 관리자 기능 (마스터 계정 전용)
- **실패 보고서 조회**: 주차별 발송 실패 통계
- **재발송 기능**: 1회 호출로 서버에서 자동 처리 (브라우저 닫아도 됨)
- **태그 관리**: 미확인 태그 정리 기능

### Edge Functions 추가 (4개)
- `generate-weekly-report`: GPT-5.1 보고서 생성
- `generate-weekly-reports-batch`: 배치 처리
- `send-report-alimtalk`: 알림톡 발송
- `get-failed-reports`: 실패 보고서 조회
- `imageCacheBuster` 상태로 URL 버전 관리

## 🆕 최근 주요 변경사항 (2026-01-29)

### 나다움 태그 기록 기능 (무료/유료 통합)
- **기능**: 운세 결과에서 GPT-5-nano로 성향 태그(장점 2개, 단점 1개) 추출
- **적용 범위**: 무료 콘텐츠 + 유료 콘텐츠(심화 해석판)
- **Edge Functions**: `extract-trait-tags` (추출), `save-trait-tags` (저장)
- **DB 테이블**: `user_trait_tags` (사용자별 나다움 태그 저장)
- **상세**: [DECISIONS.md](./src/DECISIONS.md) → "2026-01-29 무료/유료 콘텐츠 나다움 태그 통합 플로우"

## 🆕 최근 주요 변경사항 (2026-02-02)

### 나다움 보고서 (주간 보고서) 기능
- **기능**: 1주간 쌓인 나다움 태그를 분석하여 주간 성향 보고서 생성
- **핵심 플로우**: 보고서 생성 → 타로 카드 뽑기 → 마음 챙김 메시지 → 나에게 응원 한마디 → 쿠폰 발급
- **DB 테이블**: `weekly_reports`, `weekly_report_sections`, `report_tarot_selections`
- **컴포넌트**: 9개 (MyReportList, MyReportWeekly, ReportWeeklyDetail, ReportWeeklyTarot, ReportWeeklyTarotResult, ReportWeeklyMindCare, ReportWeeklyMemo, ReportWeeklyMemoEdit, CompletionCoupon)
- **주요 패턴**:
  - `user_viewed` 플래그로 실제 사용자 상호작용 추적
  - 보고서별 1회 타로 뽑기 제한
  - 응원글 저장 시 보고서 목록 캐시 무효화
- **상세**: [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) → "6. 나다움 보고서 플로우"

### 통계 대시보드 (Master 전용)
- **기능**: Google Analytics 4 실시간/기간별 통계 조회
- **Edge Function**: `get-ga-stats` (GA Data API 연동)
- **컴포넌트**: `StatsDashboard.tsx`, `statsService.ts`
- **주요 기능**:
  - 실시간 활성 사용자 수
  - 기간별 활성 사용자, 신규 사용자 통계
  - 날짜 범위 선택

---

**최종 업데이트**: 2026-02-12
