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
| Backend | Supabase (PostgreSQL + Edge Functions 20개) |
| AI | OpenAI GPT-4o, Anthropic Claude-3.5-Sonnet, Google Gemini |
| 결제 | PortOne v2 |
| 알림 | TalkDream API (카카오 알림톡) |
| 에러 모니터링 | Sentry |
| 배포 | Vercel |

## 📊 주요 통계

- **컴포넌트**: 51개
- **Edge Functions**: 20개
- **페이지**: 38개
- **UI 컴포넌트 (shadcn/ui)**: 48개

## 📚 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 개발 규칙 (필독) |
| [AI_ONBOARDING.md](./src/AI_ONBOARDING.md) | AI 작업 가이드 (5분) |
| [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) | 프로젝트 전체 컨텍스트 |
| [DECISIONS.md](./src/DECISIONS.md) | 아키텍처 결정 기록 |
| [DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md) | DB 스키마 |
| [components-inventory.md](./src/components-inventory.md) | 컴포넌트 목록 (51개) |
| [EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md) | Edge Functions (20개) |

## 🔗 Links

- **Figma**: [운세 서비스 홈 화면](https://www.figma.com/design/bc3Qpt5d7QS33QrqQuevI2)
- **GitHub**: https://github.com/stargiosoft/nadaunse
- **Vercel**: https://vercel.com/stargiosofts-projects/nadaunse

## 🆕 최근 주요 변경사항 (2026-01-13)

### 사주 API 프론트엔드 직접 호출
- **문제**: Edge Function에서 사주 API 호출 시 빈 응답 반환
- **해결**: 프론트엔드(브라우저)에서 직접 호출 후 Edge Function에 전달
- **핵심 파일**: `/lib/sajuApi.ts`
- **상세**: [DECISIONS.md](./src/DECISIONS.md) 참조

### 썸네일 이미지 캐시 버스팅
- 썸네일 재생성 시 브라우저 캐시로 인한 표시 문제 해결
- `imageCacheBuster` 상태로 URL 버전 관리

---

**최종 업데이트**: 2026-01-13
