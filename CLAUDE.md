# CLAUDE.md - 나다운세 프로젝트 개발 규칙

> **이 파일은 Claude Code가 개발할 때 항상 참조하는 규칙입니다.**
> **수정 시 신중하게 검토해주세요.**

---

## 프로젝트 개요

- **서비스**: 타로/사주 운세 모바일 웹 서비스
- **URL**: https://nadaunse.com
- **GitHub**: https://github.com/stargiosoft/nadaunse

> Tech Stack → [README.md](./README.md) 참조 | 통계 → [components-inventory.md](./src/components-inventory.md) 참조

---

## 핵심 규칙 (Critical Rules)

### 1. 스타일링
- **Tailwind CSS 우선 사용** - CSS 파일 직접 작성 금지
- 색상/간격은 Tailwind 토큰 사용 (`bg-primary`, `p-4` 등)
- **폰트 클래스 사용 금지**: `text-*`, `font-*`, `leading-*` 클래스 사용 금지 (globals.css에 토큰 정의됨)
- **Tailwind Arbitrary Value 제한**:
  - Tailwind v4에서 일부 arbitrary value가 작동하지 않을 수 있음
  - 특히 HEX 색상(`bg-[#f0f8f8]`), 픽셀 단위 spacing(`px-[7px]`) 등
  - **해결 방법**:
    1. **1순위**: globals.css에 CSS 변수로 정의 후 Tailwind 토큰 사용
    2. **2순위**: inline style 사용 (임시 해결책, 예외 허용)
  - 참고: `DECISIONS.md` → "2026-01-16 Tailwind CSS v4 Arbitrary Value 제한"

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

### 5. 이미지 처리 (CSP 제한)
- **외부 이미지 URL 사용 금지** → `/public` 폴더에 저장 후 절대 경로 사용 (`/my-image.jpg`)
- **CSP 허용 도메인**: `self`, `data:`, `blob:`, `*.supabase.co`, `*.kakaocdn.net`

### 6. Supabase 환경 분리
| 환경 | Project ID | 용도 |
|------|------------|------|
| Production | `kcthtpmxffppfbkjjkub` | nadaunse.com |
| Staging | `hyltbeewxaqashyivilu` | Preview/테스트 |

- **환경변수 사용**: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`
- **하드코딩 금지**: Supabase URL, Project ID 직접 작성 금지

### 7. 컴포넌트 재사용
- 새 컴포넌트 만들기 전 `components-inventory.md` 확인
- `/components/ui/` 에 shadcn/ui 컴포넌트 존재 (52개)

### 8. Edge Functions
- **소스 코드**: `/supabase/functions/` (Deno runtime, CORS 필수, 에러 핸들링 + 구조화된 로깅)
- **⚠️ Request Timeout**: 150초. Self-Continue 패턴으로 장시간 함수 처리
- **환경변수**: `SITE_URL` (알림톡 도메인), `WEEK_START_DAY` (주간 보고서 주차 시작 요일)
- **배포**: `npm run deploy:prod` / `npm run deploy:staging` (수동 배포 금지)
- **상세**: [EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md) 참조

**🚨 --no-verify-jwt 필수 함수 (11개)** — 수동 배포 시 누락하면 401 에러:

| 함수 | 이유 |
|------|------|
| `generate-saju-answer` | `generate-content-answers`에서 내부 호출 |
| `generate-tarot-answer` | `generate-content-answers`에서 내부 호출 |
| `send-alimtalk` | `generate-content-answers`에서 내부 호출 |
| `generate-weekly-report` | `generate-weekly-reports-batch`에서 내부 호출 |
| `send-report-alimtalk` | `generate-weekly-report`에서 내부 호출 |
| `generate-weekly-reports-batch` | pg_cron 스케줄러 호출 |
| `cleanup-unconfirmed-tags` | pg_cron 스케줄러 호출 |
| `payment-webhook` | PortOne 서버 콜백 |
| `sentry-slack-webhook` | Sentry 서버 콜백 |
| `generate-sitemap` | 공개 접근 (SEO) |
| `get-manse-data` | 비로그인 공개 접근 |

### 9. 사주 API 호출 (중요!)
- **Edge Function에서 서버 직접 호출**: `SAJU_API_KEY` 환경변수 사용 (IP 화이트리스트 + 키 인증)
- **브라우저 헤더 필수**: User-Agent, Origin, Referer 등 브라우저 헤더 포함하여 호출
- **재시도 로직**: 최대 3번 재시도 (1초, 2초 간격)
- **API URL**: `https://service.stargio.co.kr:8400/StargioSaju?birthday=...&lunar=True&gender=...&apiKey=${SAJU_API_KEY}`
- **핵심 파일**: `supabase/functions/generate-content-answers/index.ts` (96-174번 줄)
- **상세 내용**: `DECISIONS.md` → "2026-01-13 사주 API 서버 직접 호출" 섹션

### 10. Serena 사용 (MANDATORY - 토큰 절약)

**Serena는 LSP 기반 심볼 검색/편집 도구로, 파일 전체를 읽지 않고 필요한 코드만 조회하여 토큰을 대폭 절약합니다.**

#### 필수 워크플로우
1. **코드 탐색 시작**: `get_symbols_overview` → 프로젝트 전체 구조 파악
2. **특정 코드 찾기**: `find_symbol("함수명")` → 클래스/함수/변수 정확한 위치 찾기
3. **영향도 분석**: `find_referencing_symbols` → 수정 전 의존성/참조 확인 (필수!)
4. **코드 수정**: `replace_symbol`, `insert_after_symbol`, `insert_before_symbol`

#### 절대 규칙
- ❌ **파일 전체 읽기 금지**: Read 도구로 500줄 파일 전체 읽기 금지 → Serena로 필요한 심볼(함수/클래스)만 조회
- ❌ **grep/ripgrep 금지**: 문자열 검색 대신 Serena 시맨틱 검색 사용
- ✅ **수정 전 영향도 체크 필수**: `find_referencing_symbols`로 해당 코드를 참조하는 곳 확인
- ✅ **컴포넌트 찾기**: `find_symbol("MyComponent")` → `components-inventory.md` 검색보다 정확

#### 예외 (Serena 사용 안 함)
- 설정 파일: `.env`, `package.json`, `tsconfig.json`, `vite.config.ts` 등
- Serena 인덱싱 안 된 파일: `.md`, `.yaml`, `.txt` 등 문서 파일
- 단순 텍스트 파일: `README.md`, `CHANGELOG.md` 등

→ Serena는 파일 전체 대신 필요한 심볼만 로드하여 **~94% 토큰 절약**

### 11. 캐싱 전략 (Cache Strategy)

**새로운 기능을 개발할 때 항상 캐싱을 염두에 두세요.**

#### 캐시 계층 구조

| 순서 | 방법 | 속도 | 용도 |
|------|------|------|------|
| 1 | Memory Cache (Map) | 0.01ms | 타로 이미지, 썸네일 URL |
| 2 | Cache API | 10-50ms | 타로 이미지, 썸네일 이미지 (50MB+) |
| 3 | HTTP Cache | Vercel 설정 | JS/CSS 1년, 이미지 1일 |
| 4 | localStorage | 5-10ms | 사주 정보, 무료 콘텐츠 (5-10MB) |
| 5 | sessionStorage | 5-10ms | 스크롤 위치, 폼 상태 |

#### 필수 패턴
- **싱글톤 Cache 인스턴스**: `caches.open()` 1회만 호출, 이후 재사용
- **메모리 캐시 우선**: Map → Cache API → Network 순서로 조회
- **배치 처리**: 동시 fetch 최대 6개씩 (`Promise.allSettled`)
- **만료 시간 포함**: localStorage 저장 시 `{ data, timestamp }` 구조

#### 캐싱 체크리스트
- [ ] 데이터 변경 빈도? (만료 시간 결정)
- [ ] 데이터 크기? (localStorage 5-10MB vs Cache API 50MB+)
- [ ] 동시 요청? (배치 처리 필요)

#### 참고 파일
- **구현 예시**: `src/lib/tarotImageCache.ts`, `src/lib/thumbnailCache.ts`
- **HTTP 캐시**: `vercel.json`
- **상세 문서**: `DECISIONS.md` → "2026-01-20 캐싱 전략"

### 11. 보안 (Security)

**새로운 기능 개발 시 반드시 보안 점검을 수행하세요.**

#### 필수 보안 원칙

| 원칙 | 설명 |
|------|------|
| **시크릿 하드코딩 금지** | API 키, 비밀번호는 반드시 환경변수 사용 |
| **에러 메시지 일반화** | 사용자에게 상세 에러 노출 금지 (`error.message` 직접 표시 금지) |
| **입력값 검증** | 사용자 입력은 항상 서버에서 재검증 |
| **CORS 화이트리스트** | Edge Function은 `server/cors.ts` 사용 필수 |

#### 보안 문서
- **상세 가이드**: `src/docs/★SECURITY★.md` (CORS, CSP, 보안 헤더, Edge Function 템플릿 포함)

---

## 핵심 라이브러리

| 파일 | 역할 |
|------|------|
| `/lib/env.ts` | 환경 감지 (DEV, isProduction, isDevelopment) |
| `/lib/logger.ts` | 구조화된 로거 (민감정보 마스킹) |
| `/lib/sentry.ts` | Sentry 에러 모니터링 초기화 |
| `/lib/fetchWithRetry.ts` | 재시도 로직 (Exponential Backoff) |
| `/lib/freeContentService.ts` | 무료 콘텐츠 비즈니스 로직 + 유료 추천 (캐시/추천 로직) |
| `/lib/freeContentLimitService.ts` | 비회원 무료 콘텐츠 일일 제한 (localStorage 기반) |
| `/lib/coupon.ts` | 쿠폰 관리 로직 |
| `/lib/shareRewardService.ts` | 공유 리워드 (레퍼럴 캡처/처리, 리워드 상태 조회) |

---

## 파일 구조 규칙

```
/src
├── components/     # React 컴포넌트
├── pages/          # 페이지 컴포넌트
├── lib/            # 비즈니스 로직, 유틸리티
├── utils/          # 순수 유틸리티 함수
├── hooks/          # Custom hooks
├── styles/         # Tailwind 설정
└── imports/        # SVG, 이미지 임포트

supabase/
├── functions/      # Edge Functions
├── migrations/     # SQL 마이그레이션 파일
└── *.md            # Supabase 관련 문서
```

---

## 문서 업데이트 규칙

코드 변경 시 관련 문서 업데이트 필수:

| 변경사항 | 업데이트할 문서 |
|----------|----------------|
| 개발 규칙/컨벤션 변경 | **CLAUDE.md** (이 문서) |
| 환경 설정 변경 | **README.md** |
| 아키텍처/플로우 변경 | **PROJECT_CONTEXT.md** |
| 설계 결정 추가 | **DECISIONS.md** |
| 컴포넌트 추가 | **components-inventory.md** |
| DB 스키마 변경 | **DATABASE_SCHEMA.md** |
| Edge Function 추가 | **supabase/EDGE_FUNCTIONS_GUIDE.md** |
| Trigger/Function 추가 | **supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md** |
| RLS 정책 변경 | **supabase/RLS_POLICIES.md** |
| 보안 정책 변경 | **src/docs/★SECURITY★.md** |

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

## FigmaMake 통합 가이드

> `globals.css`의 base typography가 Tailwind 클래스를 덮어쓰므로, FigmaMake 코드 그대로 통합 시 디자인이 깨집니다.

### 필수 변환 규칙

| 속성 | 변환 방법 |
|------|----------|
| 타이포그래피 (fontSize, fontWeight, lineHeight, letterSpacing) | **반드시 inline style** |
| 색상 (color, backgroundColor, borderColor) | **반드시 inline style** |
| 레이아웃 (flex, items-center, justify-between) | Tailwind 클래스 OK |
| 간격 (gap, padding, margin) | Tailwind 클래스 OK (arbitrary value는 inline style) |
| 크기 (width, height, maxWidth) | inline style 권장 |

→ `text-[*]`, `font-[*]`, `leading-[*]`, `bg-[#...]`, `border-[#...]` → **inline style** 변환 필수. SVG → `src/imports/` 분리

---

## 작업 유형별 가이드

| 작업 유형 | 참고 문서 | 핵심 체크 |
|-----------|----------|-----------|
| **버그 수정** | PROJECT_CONTEXT.md, DECISIONS.md | Critical Rules 위반 여부, 환경 분기, Sentry 로그 |
| **새 기능** | PROJECT_CONTEXT.md, components-inventory.md, DATABASE_SCHEMA.md | 기존 컴포넌트 재사용, DB 변경, 무료/유료 분기 |
| **UI 수정** | globals.css, components-inventory.md | 폰트 클래스 금지, iOS Safari `transform-gpu` |
| **DB 작업** | DATABASE_SCHEMA.md, RLS_POLICIES.md, EDGE_FUNCTIONS_GUIDE.md | RLS 정책, 마이그레이션 SQL, Service Role Key |
| **리팩토링** | DECISIONS.md, PROJECT_CONTEXT.md | 기능 변경 없이 코드만 개선, 설계 패턴 유지 |
| **모바일 최적화** | PROJECT_CONTEXT.md, globals.css | `overflow-hidden + rounded` → `transform-gpu` 필수 |

---

## 핵심 시나리오

- **iOS 둥근 모서리 안 보임** → `overflow-hidden rounded-*` 조합에 `transform-gpu` 추가
- **개발용 버튼 프로덕션 노출** → `import { DEV } from '../lib/env'` + `{DEV && <button>}`
- **버그 수정** → PROJECT_CONTEXT.md "주요 버그 유형" 확인 → Serena로 코드 탐색 → TypeScript + 구조화된 로깅

---

## 금지 사항

### 코드 품질
- `any` 타입 사용
- inline style 사용 **(예외: FigmaMake 통합 시 타이포그래피/색상은 허용)**
- `text-*`, `font-*`, `leading-*` Tailwind 클래스 사용
- **외부 이미지 URL 사용 (CSP 차단됨)** - `/public` 폴더에 저장 후 절대 경로 사용
- 문서 업데이트 없이 대규모 변경

### 환경/배포
- 개발 전용 코드 프로덕션 노출
- Production DB 직접 조작 (Staging에서 테스트 후 반영)

### 보안 (CRITICAL)
- ❌ **API 키/시크릿 하드코딩** → 환경변수 사용 필수
- ❌ **에러 상세 메시지 사용자 노출** → `alert(error.message)` 금지
- ❌ **CORS `*` 설정** → `server/cors.ts` 화이트리스트 사용
- ❌ **사주 API 프론트엔드 호출** → Edge Function에서만 호출
- ❌ **npm 취약점 방치** → 배포 전 `npm audit` 확인 필수
- ❌ **Supabase 정보 하드코딩** → 환경변수 사용

---

## 핵심 문서 이정표

| 문서 | 용도 |
|------|------|
| **[PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md)** | 전체 아키텍처, 플로우, 버그 패턴 |
| **[DECISIONS.md](./src/DECISIONS.md)** | 설계 의도 기록 (ADR) |
| **[DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md)** | 테이블 구조, 타입, 제약조건, 인덱스 |
| **[RLS_POLICIES.md](./supabase/RLS_POLICIES.md)** | 9개 테이블 26개 RLS 정책 |
| **[DATABASE_TRIGGERS_AND_FUNCTIONS.md](./supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** | Triggers, Functions, pg_cron Jobs |
| **[EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md)** | 38개 Edge Function 목록, 배포 방법 |
| **[components-inventory.md](./src/components-inventory.md)** | 컴포넌트 분류, 파일 위치, shadcn/ui |
| **[★SECURITY★.md](./src/docs/★SECURITY★.md)** | CORS, CSP, 보안 헤더, 에러 처리 |

---

**최종 업데이트**: 2026-03-03
