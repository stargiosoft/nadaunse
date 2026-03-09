# CLAUDE.md - 나다운세 프로젝트 개발 규칙

> **이 파일은 Claude Code가 개발할 때 항상 참조하는 규칙입니다.**

---

## 프로젝트 개요

- **서비스**: 타로/사주 운세 모바일 웹 서비스 | **URL**: https://nadaunse.com
- **GitHub**: https://github.com/stargiosoft/nadaunse

| 분류 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Tailwind CSS v4.0 + Vite |
| Backend | Supabase (PostgreSQL + Edge Functions 42개) |
| AI | OpenAI GPT-4o/GPT-5.1, Claude-3.5-Sonnet, Gemini |
| 자동화 | pg_cron + pg_net (주간 보고서) |
| 결제 | PortOne v2 |
| 알림 | TalkDream API (카카오 알림톡) |
| 에러 모니터링 | Sentry |
| 배포 | Vercel |

**주요 통계**: 컴포넌트 72개 | Edge Functions 42개 | 페이지 52개 | shadcn/ui 48개 | 타로 78장

---

## 핵심 규칙 (Critical Rules)

### 1. 스타일링
- **Tailwind CSS 우선** - CSS 파일 직접 작성 금지
- **폰트 클래스 사용 금지**: `text-*`, `font-*`, `leading-*` (globals.css에 토큰 정의됨)
- **Tailwind v4 Arbitrary Value 제한**: HEX 색상, 픽셀 spacing 등 작동 안 할 수 있음
  - 1순위: globals.css에 CSS 변수 정의 → 2순위: inline style

### 2. TypeScript
- 모든 파일 TypeScript 필수 (.js 금지) | `any` 타입 금지 | Supabase 응답 타입 체크 필수

### 3. 개발/배포 환경 분리
```tsx
import { DEV } from '../lib/env';  // 권장 (Figma Make에서도 정확)
{DEV && <button>테스트 버튼</button>}
```
- `DEV`, `isProduction()`, `isDevelopment()` — `/lib/env.ts`
- **프로덕션 도메인**: `nadaunse.com`, `www.nadaunse.com`, `nadaunse.figma.site`

### 4. iOS Safari 최적화
- `overflow: hidden` + `border-radius` 조합 시 `transform-gpu` 필수

### 5. 이미지 처리 (CSP 제한)
- **외부 이미지 URL 사용 금지** — `/public` 폴더에 저장, 절대 경로 사용
- CSP 허용: `self`, `data:`, `blob:`, `https://*.supabase.co`, `https://*.kakaocdn.net`

### 6. Supabase 환경 분리

| 환경 | Project ID |
|------|------------|
| Production | `kcthtpmxffppfbkjjkub` |
| Staging | `hyltbeewxaqashyivilu` |

- 환경변수 사용 필수: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY` | 하드코딩 금지

### 7. 컴포넌트 재사용
- 새 컴포넌트 전 `components-inventory.md` 확인 | `/components/ui/` shadcn/ui 48개

### 8. Edge Functions

- Deno runtime | CORS 헤더 필수 | 에러 핸들링 + 구조화된 로깅
- **소스**: `/supabase/functions/` | **총 42개**

**배포 (반드시 스크립트 사용)**:
```bash
npm run deploy:prod          # 프로덕션 전체
npm run deploy:prod:core     # 핵심만
npm run deploy:staging       # 스테이징 전체
```

**특정 함수 배포**:
```bash
npx supabase functions deploy <함수명> --project-ref kcthtpmxffppfbkjjkub
# 내부 호출 함수는 --no-verify-jwt 필수!
npx supabase functions deploy generate-saju-answer --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
```

**--no-verify-jwt 필수 함수**: `generate-saju-answer`, `generate-tarot-answer`, `send-alimtalk`, `generate-weekly-report`, `send-report-alimtalk`, `generate-sitemap`, `generate-upsell-mapping`

**배포 스크립트**: `/scripts/` (deploy-production.bat, deploy-staging.bat, deploy-core.bat)

### 9. 사주 API 호출 (중요!)
- Edge Function에서 서버 직접 호출 (`SAJU_API_KEY` + 브라우저 헤더 흉내)
- 재시도 3번 (1초, 2초 간격) | 프론트엔드 직접 호출 금지
- 핵심 파일: `supabase/functions/generate-content-answers/index.ts`

### 10. Serena 사용 (토큰 절약)

**필수 워크플로우**: `get_symbols_overview` → `find_symbol()` → `find_referencing_symbols` → 수정

- 파일 전체 읽기 금지 → Serena로 필요한 심볼만 조회
- 수정 전 `find_referencing_symbols`로 영향도 체크 필수
- **예외**: 설정 파일(.env, package.json 등), 문서 파일(.md, .yaml 등)

### 11. 캐싱 전략

| 리소스 | 캐싱 방법 | 만료 |
|--------|----------|------|
| 타로 카드 이미지 (78장) | Cache API + 메모리 | 7일 |
| 콘텐츠 썸네일 | Cache API + 메모리 | 1일 |
| 무료 콘텐츠 목록 | localStorage | 5분 |
| 사주 정보 목록 | localStorage | 세션 |
| 스크롤 위치 | sessionStorage | 세션 |

**필수 패턴**: 싱글톤 Cache 인스턴스 + 메모리 캐시 우선 + 배치 처리 (최대 6개씩)
**참고 파일**: `tarotImageCache.ts`, `thumbnailCache.ts`, `vercel.json`

### 12. 보안

| 원칙 | 설명 |
|------|------|
| 시크릿 하드코딩 금지 | 환경변수 필수 |
| 에러 메시지 일반화 | `error.message` 직접 노출 금지 |
| 입력값 검증 | 서버에서 재검증 |
| CORS 화이트리스트 | `server/cors.ts` 사용 필수 |

**보안 문서**: `src/docs/★SECURITY★.md`

---

## 핵심 라이브러리

| 파일 | 역할 |
|------|------|
| `/lib/env.ts` | 환경 감지 (DEV, isProduction) |
| `/lib/logger.ts` | 구조화된 로거 (민감정보 마스킹) |
| `/lib/sentry.ts` | Sentry 에러 모니터링 |
| `/lib/fetchWithRetry.ts` | 재시도 (Exponential Backoff) |
| `/lib/freeContentService.ts` | 무료 콘텐츠 비즈니스 로직 |
| `/lib/freeContentLimitService.ts` | 비회원 일일 제한 |
| `/lib/coupon.ts` | 쿠폰 관리 |
| `/lib/consultStatus.ts` | 상담 상태 관리 |
| `/lib/consultLimitService.ts` | 비회원 상담 1회 제한 |
| `/lib/consultRecommendationService.ts` | AI 카테고리 기반 추천 |

---

## 파일 구조

```
/src
├── components/     # React 컴포넌트 (72개)
├── pages/          # 페이지 컴포넌트 (52개)
├── lib/            # 비즈니스 로직, 유틸리티
├── utils/          # 순수 유틸리티 함수
├── hooks/          # Custom hooks
├── styles/         # Tailwind 설정
└── imports/        # SVG, 이미지 임포트

supabase/
├── functions/      # Edge Functions (41개)
├── migrations/     # SQL 마이그레이션
└── *.md            # Supabase 문서
```

---

## FigmaMake 통합 규칙

FigmaMake 코드는 Tailwind arbitrary value를 사용하지만, globals.css base typography가 덮어쓰므로 변환 필수:

| 속성 | 방법 |
|------|------|
| 타이포그래피 (fontSize, fontWeight, lineHeight, letterSpacing) | **inline style** |
| 색상 (color, backgroundColor, borderColor) | **inline style** |
| 레이아웃 (flex, items-center, justify-between) | Tailwind OK |
| 간격 (gap, padding, margin) | Tailwind OK (arbitrary는 inline) |

**체크리스트**: `text-[*]`/`font-[*]`/`leading-[*]` → inline style | `bg-[#...]`/`text-[#...]` → inline style | SVG → `/imports/` 분리

---

## 문서 업데이트 규칙

| 변경사항 | 문서 |
|----------|------|
| 개발 규칙 | **CLAUDE.md** |
| 환경 설정 | **README.md** |
| 아키텍처/플로우 | **PROJECT_CONTEXT.md** |
| 설계 결정 | **DECISIONS.md** |
| 컴포넌트 추가 | **components-inventory.md** |
| DB 스키마 | **DATABASE_SCHEMA.md** |
| Edge Function 추가 | **EDGE_FUNCTIONS_GUIDE.md** |
| Trigger/Function 추가 | **DATABASE_TRIGGERS_AND_FUNCTIONS.md** |
| RLS 정책 | **RLS_POLICIES.md** |
| 보안 정책 | **src/docs/★SECURITY★.md** |

---

## Git 커밋 규칙

```bash
<type>: <description>
# types: feat, fix, docs, style, refactor, test, chore
```

---

## 문서 이정표

| 문서 | 용도 |
|------|------|
| **[PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md)** | 아키텍처, 플로우, 파일 참조, 버그 패턴 |
| **[DECISIONS.md](./src/DECISIONS.md)** | 설계 의도 기록 (ADR) |
| **[DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md)** | 테이블 구조, 컬럼, 제약조건 |
| **[RLS_POLICIES.md](./supabase/RLS_POLICIES.md)** | RLS 정책 |
| **[DATABASE_TRIGGERS_AND_FUNCTIONS.md](./supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** | Triggers, Functions, pg_cron |
| **[EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md)** | Edge Functions 상세 |
| **[components-inventory.md](./src/components-inventory.md)** | 컴포넌트 분류/위치 |
| **[README.md](./README.md)** | 환경 설정, 빠른 시작 |
| **[★SECURITY★.md](./src/docs/★SECURITY★.md)** | 보안 가이드 |

---

**최종 업데이트**: 2026-03-06
