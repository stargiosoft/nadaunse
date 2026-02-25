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
| Backend | Supabase (PostgreSQL + Edge Functions 34개) |
| AI | OpenAI GPT-4o/GPT-5.1, Anthropic Claude-3.5-Sonnet, Google Gemini |
| 자동화 | pg_cron + pg_net (주간 보고서 자동 발송) |
| 결제 | PortOne (구 아임포트) v2 |
| 알림 | TalkDream API (카카오 알림톡) |
| 에러 모니터링 | Sentry |
| 배포 | Vercel |

### 주요 통계
- **컴포넌트**: 69개 (주간 보고서 8개 + 통계 대시보드 2개 포함)
- **Edge Functions**: 34개 (주간 보고서 4개 포함)
- **페이지**: 41개
- **UI 컴포넌트 (shadcn/ui)**: 52개
- **타로 카드 덱**: 78장

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
- **외부 이미지 URL 사용 금지**: CSP(Content Security Policy)로 인해 외부 도메인 이미지가 차단됨
- **이미지 저장 위치**: `/public` 폴더에 저장
- **참조 방법**: 절대 경로 사용 (예: `/my-image.jpg`)
- **잘못된 예시**: `https://i.postimg.cc/...`, `https://cdn.example.com/...`

```tsx
// ❌ 잘못된 예시 - CSP에 의해 차단됨
const bgImage = "https://i.postimg.cc/WzwkjYXT/background.jpg";

// ✅ 올바른 예시 - public 폴더에 저장 후 절대 경로 사용
// 파일 위치: /Users/star/nadaunse/public/background.jpg
const bgImage = "/background.jpg";

<img src={bgImage} alt="Background" />
```

**CSP 허용 도메인**:
- `self` (같은 도메인)
- `data:`, `blob:` (인라인 데이터)
- `https://*.supabase.co` (Supabase Storage)
- `https://*.kakaocdn.net` (카카오 이미지)

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
- **소스 코드 위치**: `/supabase/functions/` (Supabase CLI 기본 경로)
- Deno runtime 사용
- CORS 헤더 필수 포함
- 에러 핸들링 + 구조화된 로깅
- **총 34개**: AI 생성(10), 주간 보고서(4), 쿠폰 관리(4), 결제/환불(3), 모니터링/통계(3), 마스터 콘텐츠(2), SEO(2), 소유자 확인(2), 알림(1), 사용자(1), 구매 가이드(1), 유틸리티(1), 만세력(1)
- **⚠️ Request Timeout**: 150초 (모든 플랜 동일, Pro도 동일). Wall clock(Pro 400초)과 별개
- **Self-Continue 패턴**: 장시간 함수(`generate-content-answers`, `generate-weekly-reports-batch`)는 timeout 전에 안전 종료 후 자기 재호출로 미완료 작업을 이어서 처리
- **환경변수 (Edge Functions)**:
  - `SITE_URL`: 알림톡 버튼 URL 도메인 (프로덕션: `https://nadaunse.com`, 스테이징: `https://staging.nadaunse.com`). `send-alimtalk`, `send-report-alimtalk`에서 사용
  - `WEEK_START_DAY`: 주간 보고서 주차 시작 요일 (프로덕션: `0`=일요일, 스테이징: `3`=수요일). `generate-weekly-reports-batch`, `generate-weekly-report`에서 사용

**⚠️ 배포 시 반드시 스크립트 사용 (수동 배포 금지)**:
```bash
# 프로덕션 전체 배포 (권장)
npm run deploy:prod

# 또는 핵심 함수만 빠르게 배포
npm run deploy:prod:core

# 스테이징 전체 배포
npm run deploy:staging
```

**🚨 --no-verify-jwt 필수 함수 (내부 호출, 외부 서버 콜백, pg_cron, 공개 접근용) - 총 11개**:
| 함수 | 이유 |
|------|------|
| `generate-saju-answer` | `generate-content-answers`에서 내부 호출 |
| `generate-tarot-answer` | `generate-content-answers`에서 내부 호출 |
| `send-alimtalk` | `generate-content-answers`에서 내부 호출 |
| `generate-weekly-report` | `generate-weekly-reports-batch`에서 내부 호출 |
| `send-report-alimtalk` | `generate-weekly-report`에서 내부 호출 |
| `generate-weekly-reports-batch` | pg_cron 스케줄러 호출 (사용자 JWT 없음) |
| `cleanup-unconfirmed-tags` | pg_cron 스케줄러 호출 (사용자 JWT 없음) |
| `payment-webhook` | PortOne 서버 콜백 (외부 결제 서버, JWT 없음) |
| `sentry-slack-webhook` | Sentry 서버 콜백 (외부 모니터링 서버, JWT 없음) |
| `generate-sitemap` | Google 크롤러가 인증 없이 sitemap.xml 접근 필요 |
| `get-manse-data` | 비로그인 사용자 만세력 공개 접근 |

- 위 함수들은 Service Role Key로 호출되거나, 외부 서버 콜백이거나, pg_cron 스케줄러 호출이므로 JWT 검증 비활성화 필수
- **수동 배포 시 `--no-verify-jwt` 누락하면 "Invalid JWT" 401 에러 발생**
- 배포 스크립트 사용하면 자동으로 플래그 적용됨

**배포 스크립트 위치**: `/scripts/`
```
scripts/
├── deploy-production.bat   # 프로덕션 전체 배포 (34개)
├── deploy-staging.bat      # 스테이징 전체 배포 (34개)
├── deploy-core.bat         # 핵심 함수만 배포 (4개)
└── README.md               # 상세 가이드
```

**특정 함수만 배포해야 할 때**:
```bash
# 프로덕션 (일반 함수)
npx supabase functions deploy <함수명> --project-ref kcthtpmxffppfbkjjkub

# 프로덕션 (내부 호출 함수 - --no-verify-jwt 필수!)
npx supabase functions deploy generate-saju-answer --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
```

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

#### 토큰 절약 효과
```
기존 방식: Read "src/components/UserProfile.tsx" → 500줄 전체 로드
Serena 방식: find_symbol("UserProfile") → 해당 컴포넌트 30줄만 로드
→ 94% 토큰 절약!
```

**프로젝트 규모** (컴포넌트 69개, 페이지 41개, Edge Functions 34개)에서 Serena는 필수입니다.

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

#### 코드 작성 시 체크리스트

```typescript
// ❌ 잘못된 예시
alert('에러: ' + error.message);  // 에러 상세 노출
const API_KEY = 'sk-xxxx';         // 시크릿 하드코딩
fetch(userInput);                  // 입력값 미검증

// ✅ 올바른 예시
console.error('에러:', error);     // 콘솔에만 상세 기록
alert('처리에 실패했습니다.');      // 일반 메시지 표시
const API_KEY = Deno.env.get('API_KEY');  // 환경변수 사용
```

#### Edge Function 보안 템플릿

```typescript
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

serve(async (req) => {
  // 1. CORS 처리
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }
  const corsHeaders = getCorsHeaders(req);

  // 2. 인증 검증 (필요한 경우)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: '인증이 필요합니다' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 3. 입력값 검증
  // 4. 비즈니스 로직
  // 5. 에러 처리 (상세 정보는 로그에만)
});
```

#### 보안 문서

- **상세 가이드**: `src/docs/★SECURITY★.md`
- **적용된 보안 조치**: CORS, CSP, 보안 헤더, npm 취약점 해결
- **향후 TODO**: Rate Limiting, CSP Nonce, SRI

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

---

## 파일 구조 규칙

```
/src
├── components/     # React 컴포넌트 (55개)
├── pages/          # 페이지 컴포넌트 (41개)
├── lib/            # 비즈니스 로직, 유틸리티
├── utils/          # 순수 유틸리티 함수
├── hooks/          # Custom hooks
├── styles/         # Tailwind 설정
└── imports/        # SVG, 이미지 임포트

supabase/
├── functions/      # Edge Functions (34개)
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

```tsx
// ❌ className="text-[15px] text-[#368683] font-medium bg-[#f0f8f8]"
// ✅ style={{ fontSize: '15px', color: '#368683', fontWeight: 500, backgroundColor: '#f0f8f8' }}
// ✅ className="flex gap-4 items-center rounded-2xl px-6 py-4" (레이아웃 OK)
```

### 통합 체크리스트
- [ ] `text-[*]`, `font-[*]`, `leading-[*]`, `bg-[#...]`, `border-[#...]` → inline style
- [ ] SVG 경로 → `src/imports/` 폴더로 분리

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

### 시나리오 1: iOS에서 둥근 모서리가 안 보여요
**해결**: `overflow-hidden rounded-*` 조합에 `transform-gpu` 추가
```tsx
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." alt="..." />
</div>
```

### 시나리오 2: 개발용 버튼이 프로덕션에 보여요
**해결**: `DEV` 플래그로 감싸기 (디버깅 버튼, 테스트 버튼, 개발자 로그 등)
```tsx
import { DEV } from '../lib/env';
{DEV && <button onClick={handleTest}>테스트 버튼</button>}
```

### 시나리오 3: 버그 수정 작업 흐름
1. `PROJECT_CONTEXT.md` → "주요 버그 유형 & 체크리스트" 확인
2. Serena `find_symbol` / `find_referencing_symbols`로 관련 코드 탐색
3. 수정 코드 작성 (TypeScript, 구조화된 로깅 준수)

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
| **[EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md)** | 34개 Edge Function 목록, 배포 방법 |
| **[components-inventory.md](./src/components-inventory.md)** | 컴포넌트 분류, 파일 위치, shadcn/ui |
| **[★SECURITY★.md](./src/docs/★SECURITY★.md)** | CORS, CSP, 보안 헤더, 에러 처리 |

---

**최종 업데이트**: 2026-02-25
