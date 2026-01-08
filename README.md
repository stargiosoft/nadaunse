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

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4.0
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT-4o, Anthropic Claude, Google Gemini
- **Payment**: PortOne v2
- **Error Monitoring**: Sentry
- **Hosting**: Vercel

## 📚 문서

- [AI_ONBOARDING.md](./src/AI_ONBOARDING.md) - AI 작업 가이드
- [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) - 프로젝트 전체 컨텍스트
- [DECISIONS.md](./src/DECISIONS.md) - 아키텍처 결정 기록
- [DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md) - DB 스키마

## 🔗 Links

- **Figma**: [운세 서비스 홈 화면](https://www.figma.com/design/bc3Qpt5d7QS33QrqQuevI2)
- **GitHub**: https://github.com/stargiosoft/nadaunse
- **Vercel**: https://vercel.com/stargiosofts-projects/nadaunse

---

**최종 업데이트**: 2026-01-07
  