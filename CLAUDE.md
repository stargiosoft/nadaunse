# CLAUDE.md - 나다운세 프로젝트 개발 규칙

> **이 파일은 Claude Code가 개발할 때 항상 참조하는 규칙입니다.**
> **수정 시 신중하게 검토해주세요.**

---

## 프로젝트 개요

- **서비스**: 타로/사주 운세 모바일 웹 서비스
- **URL**: https://nadaunse.com
- **GitHub**: https://github.com/stargiosoft/nadaunse

### Tech Stack
| 분류 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Tailwind CSS v4.0 + Vite |
| Backend | Supabase (PostgreSQL + Edge Functions 20개) |
| AI | OpenAI GPT-4o, Anthropic Claude-3.5-Sonnet, Google Gemini |
| 결제 | PortOne (구 아임포트) v2 |
| 알림 | TalkDream API (카카오 알림톡) |
| 에러 모니터링 | Sentry |
| 배포 | Vercel |

### 주요 통계
- **컴포넌트**: 51개
- **Edge Functions**: 20개
- **페이지**: 38개
- **UI 컴포넌트 (shadcn/ui)**: 48개

---

## 핵심 규칙 (Critical Rules)

### 1. 스타일링
- **Tailwind CSS만 사용** - inline style, CSS 파일 직접 작성 금지
- 색상/간격은 Tailwind 토큰 사용 (`bg-primary`, `p-4` 등)
- **폰트 클래스 사용 금지**: `text-*`, `font-*`, `leading-*` 클래스 사용 금지 (globals.css에 토큰 정의됨)

### 2. TypeScript
- **모든 파일 TypeScript 필수** - `.js` 파일 생성 금지
- `any` 타입 사용 금지 (불가피한 경우 주석으로 사유 명시)
- Supabase API 응답은 반드시 타입 체크

### 3. 개발/배포 환경 분리
```tsx
// 권장: /lib/env.ts 사용 (Figma Make 환경에서도 정확함)
import { DEV } from '../lib/env';
{DEV && <button>테스트 버튼</button>}

// 대안: import.meta.env.DEV (Figma Make에서 부정확할 수 있음)
{import.meta.env.DEV && <button>테스트 버튼</button>}
```

**환경 감지 유틸리티** (`/lib/env.ts`):
- `DEV`: 개발 환경 여부 (프로덕션에서 false)
- `isProduction()`: 프로덕션 도메인 체크
- `isDevelopment()`: 프로덕션이 아닌 모든 환경

**프로덕션 도메인**: `nadaunse.com`, `www.nadaunse.com`, `nadaunse.figma.site`

### 4. iOS Safari 최적화
```tsx
// overflow: hidden + border-radius 조합 시 transform-gpu 필수
<div className="overflow-hidden rounded-2xl transform-gpu">
  ...
</div>
```

### 5. Supabase 환경 분리
| 환경 | Project ID | 용도 |
|------|------------|------|
| Production | `kcthtpmxffppfbkjjkub` | nadaunse.com |
| Staging | `hyltbeewxaqashyivilu` | Preview/테스트 |

- **환경변수 사용**: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`
- **하드코딩 금지**: Supabase URL, Project ID 직접 작성 금지

### 6. 컴포넌트 재사용
- 새 컴포넌트 만들기 전 `components-inventory.md` 확인
- `/components/ui/` 에 shadcn/ui 컴포넌트 존재 (48개)

### 7. Edge Functions
- **소스 코드 위치**: `/supabase/functions/` (Supabase CLI 기본 경로)
- **배포 시**: `npx supabase functions deploy <함수명> --project-ref <project-id>`
- Deno runtime 사용
- CORS 헤더 필수 포함
- 에러 핸들링 + 구조화된 로깅
- **총 20개**: AI 생성(8), 쿠폰 관리(4), 사용자 관리(2), 알림(1), 결제/환불(3), 기타(2)

**배포 명령어 예시**:
```bash
# 스테이징 배포
npx supabase functions deploy generate-thumbnail --project-ref hyltbeewxaqashyivilu

# 프로덕션 배포
npx supabase functions deploy generate-thumbnail --project-ref kcthtpmxffppfbkjjkub
```

### 8. 사주 API 호출 (중요!)
- **Edge Function에서 서버 직접 호출**: `SAJU_API_KEY` 환경변수 사용
- **API URL**: `https://service.stargio.co.kr:8400/StargioSaju?birthday=...&lunar=True&gender=...=${SAJU_API_KEY}`
- **핵심 파일**: `generate-content-answers/index.ts`
- **상세 내용**: `DECISIONS.md` → "2026-01-13 사주 API 서버 직접 호출" 섹션

---

## 핵심 라이브러리

| 파일 | 역할 |
|------|------|
| `/lib/env.ts` | 환경 감지 (DEV, isProduction, isDevelopment) |
| `/lib/logger.ts` | 구조화된 로거 (민감정보 마스킹) |
| `/lib/sentry.ts` | Sentry 에러 모니터링 초기화 |
| `/lib/fetchWithRetry.ts` | 재시도 로직 (Exponential Backoff) |
| `/lib/freeContentService.ts` | 무료 콘텐츠 비즈니스 로직 |
| `/lib/coupon.ts` | 쿠폰 관리 로직 |

---

## 파일 구조 규칙

```
/src
├── components/     # React 컴포넌트 (51개)
├── pages/          # 페이지 컴포넌트 (38개)
├── lib/            # 비즈니스 로직, 유틸리티
├── utils/          # 순수 유틸리티 함수
├── hooks/          # Custom hooks
├── styles/         # Tailwind 설정
└── imports/        # SVG, 이미지 임포트

supabase/
├── functions/      # Edge Functions (20개)
├── migrations/     # SQL 마이그레이션 파일
└── *.md            # Supabase 관련 문서
```

---

## 문서 업데이트 규칙

코드 변경 시 관련 문서 업데이트 필수:
1. **README.md** - 프로젝트 개요
2. **AI_ONBOARDING.md** - AI 작업 가이드
3. **PROJECT_CONTEXT.md** - 프로젝트 전체 컨텍스트
4. **DECISIONS.md** - 아키텍처 결정 기록
5. **components-inventory.md** - 컴포넌트 목록 (51개)
6. **DATABASE_SCHEMA.md** - DB 스키마
7. **supabase/EDGE_FUNCTIONS_GUIDE.md** - Edge Functions (20개)
8. **supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md** - Triggers/Functions
9. **supabase/RLS_POLICIES.md** - RLS 정책

---

## Git 커밋 규칙

```bash
# 커밋 메시지 형식
<type>: <description>

# types
feat:     새 기능
fix:      버그 수정
docs:     문서 수정
style:    코드 스타일 (포맷팅)
refactor: 리팩토링
test:     테스트
chore:    기타 변경
```

---

## 금지 사항

- `any` 타입 사용
- inline style 사용
- `text-*`, `font-*`, `leading-*` Tailwind 클래스 사용
- 개발 전용 코드 프로덕션 노출
- Supabase 정보 하드코딩
- 문서 업데이트 없이 대규모 변경
- Production DB 직접 조작 (Staging에서 테스트 후 반영)
- 사주 API를 프론트엔드에서 호출 (API 키 노출 위험)

---

## 참고 문서

- [AI_ONBOARDING.md](./src/AI_ONBOARDING.md) - 빠른 시작 (5분)
- [PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md) - 전체 컨텍스트
- [DECISIONS.md](./src/DECISIONS.md) - 아키텍처 결정
- [DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md) - DB 스키마
- [components-inventory.md](./src/components-inventory.md) - 컴포넌트 목록

---

**최종 업데이트**: 2026-01-13
