# 나다운세 (nadaunse)

> 타로/사주 운세 모바일 웹 서비스
> **Production**: https://nadaunse.com

## 빠른 시작

```bash
npm install
npm run dev
```

## 환경 설정

### Supabase

| 환경 | Project ID | URL |
|------|------------|-----|
| Production | `kcthtpmxffppfbkjjkub` | https://kcthtpmxffppfbkjjkub.supabase.co |
| Staging | `hyltbeewxaqashyivilu` | https://hyltbeewxaqashyivilu.supabase.co |

### 환경변수

```bash
# Production
VITE_SUPABASE_PROJECT_ID=kcthtpmxffppfbkjjkub
VITE_SUPABASE_ANON_KEY=<production-anon-key>
VITE_KAKAO_AUTH_SECRET=<kakao-auth-secret>
VITE_SENTRY_DSN=<sentry-dsn>

# Preview/Staging (.env.local)
VITE_SUPABASE_PROJECT_ID=hyltbeewxaqashyivilu
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
```

## Tech Stack

| 분류 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Tailwind CSS v4.0 + Vite |
| Backend | Supabase (PostgreSQL + Edge Functions 46개) |
| AI | OpenAI GPT-4o/GPT-5.1, Claude-3.5-Sonnet, Gemini |
| 결제 | PortOne v2 |
| 배포 | Vercel |

## 문서

| 문서 | 설명 |
|------|------|
| **[CLAUDE.md](./CLAUDE.md)** | 개발 규칙 (필독) |
| [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) | 프로젝트 아키텍처/플로우 |
| [DECISIONS.md](./src/DECISIONS.md) | 아키텍처 결정 기록 |
| [DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md) | DB 스키마 |
| [components-inventory.md](./src/components-inventory.md) | 컴포넌트 목록 |
| [EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md) | Edge Functions |

## Links

- **Figma**: [운세 서비스 홈 화면](https://www.figma.com/design/bc3Qpt5d7QS33QrqQuevI2)
- **GitHub**: https://github.com/stargiosoft/nadaunse
- **Vercel**: https://vercel.com/stargiosofts-projects/nadaunse

---

**최종 업데이트**: 2026-03-11
