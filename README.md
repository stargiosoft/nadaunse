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
| Backend | Supabase (PostgreSQL + Edge Functions 24개) |
| AI | OpenAI GPT-4o, Anthropic Claude-3.5-Sonnet, Google Gemini |
| 결제 | PortOne v2 |
| 알림 | TalkDream API (카카오 알림톡) |
| 에러 모니터링 | Sentry |
| 배포 | Vercel |

## 📊 주요 통계

- **컴포넌트**: 69개 (주간 보고서 8개 + 통계 대시보드 2개 포함)
- **Edge Functions**: 26개
- **페이지**: 41개
- **UI 컴포넌트 (shadcn/ui)**: 48개

## 📚 문서

| 문서 | 설명 |
|------|------|
| **[CLAUDE.md](./CLAUDE.md)** ⭐ | **개발 규칙 + AI 작업 가이드 (통합본, 필독!)** |
| [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) | 프로젝트 전체 컨텍스트 |
| [DECISIONS.md](./src/DECISIONS.md) | 아키텍처 결정 기록 |
| [DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md) | DB 스키마 |
| [components-inventory.md](./src/components-inventory.md) | 컴포넌트 목록 (69개) |
| [EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md) | Edge Functions (24개) |

> **참고**: AI_ONBOARDING.md는 CLAUDE.md에 통합되었습니다.

## 🔗 Links

- **Figma**: [운세 서비스 홈 화면](https://www.figma.com/design/bc3Qpt5d7QS33QrqQuevI2)
- **GitHub**: https://github.com/stargiosoft/nadaunse
- **Vercel**: https://vercel.com/stargiosofts-projects/nadaunse

## 🆕 최근 주요 변경사항 (2026-01-14)

### iOS Safari 무한 스와이프 뒤로가기 지원
- **문제**: 홈 ↔ 콘텐츠 반복 이동 후 스와이프 뒤로가기 시 페이지 종료
- **해결**: 동적 버퍼 재충전으로 무한 스와이프 지원
- **핵심 원리**: `pushState`의 특성(현재 위치 뒤 엔트리 삭제)을 활용
- **상세**: [DECISIONS.md](./src/DECISIONS.md) 참조

### 사주 API 서버 직접 호출 (SAJU_API_KEY)
- Edge Function에서 `SAJU_API_KEY` 환경변수를 사용하여 서버 직접 호출
- 브라우저 헤더 흉내 + 재시도 로직 포함
- **핵심 파일**: `supabase/functions/generate-content-answers/index.ts`

### 썸네일 이미지 캐시 버스팅
- 썸네일 재생성 시 브라우저 캐시로 인한 표시 문제 해결
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

**최종 업데이트**: 2026-02-02
