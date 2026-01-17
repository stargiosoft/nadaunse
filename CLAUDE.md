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
- **Edge Function에서 서버 직접 호출**: `SAJU_API_KEY` 환경변수 사용 (IP 화이트리스트 + 키 인증)
- **브라우저 헤더 필수**: User-Agent, Origin, Referer 등 브라우저 헤더 포함하여 호출
- **재시도 로직**: 최대 3번 재시도 (1초, 2초 간격)
- **API URL**: `https://service.stargio.co.kr:8400/StargioSaju?birthday=...&lunar=True&gender=...&apiKey=${SAJU_API_KEY}`
- **핵심 파일**: `supabase/functions/generate-content-answers/index.ts` (96-174번 줄)
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

### 왜 특별한 처리가 필요한가?
FigmaMake가 생성하는 코드는 기본적으로 Tailwind arbitrary value를 사용합니다 (`text-[15px]`, `bg-[#f0f8f8]` 등).
하지만 이 프로젝트의 `globals.css`에 정의된 base typography가 Tailwind 클래스를 덮어쓰기 때문에,
FigmaMake 코드를 그대로 통합하면 **디자인이 완전히 깨집니다** (텍스트가 세로로 표시되는 등의 문제).

### 통합 시 필수 변환 규칙

| 속성 | 변환 방법 |
|------|----------|
| 타이포그래피 (fontSize, fontWeight, lineHeight, letterSpacing) | **반드시 inline style** |
| 색상 (color, backgroundColor, borderColor) | **반드시 inline style** |
| 레이아웃 (flex, items-center, justify-between) | Tailwind 클래스 OK |
| 간격 (gap, padding, margin) | Tailwind 클래스 OK (arbitrary value는 inline style) |
| 크기 (width, height, maxWidth) | inline style 권장 |

### 권장 FigmaMake 프롬프트

FigmaMake에 아래 프롬프트를 사용하면 통합이 더 수월합니다:

```
코드 생성 규칙:
1. 모든 텍스트 스타일(fontSize, fontWeight, lineHeight, color, letterSpacing)은
   반드시 inline style로 작성하세요. Tailwind의 text-*, font-*, leading-* 클래스를 사용하지 마세요.
2. 배경색, 테두리색 등 색상 관련 속성도 inline style로 작성하세요.
3. 레이아웃(flex, grid, items-center 등)은 Tailwind 클래스를 사용해도 됩니다.
4. fontFamily는 'Pretendard Variable'을 사용하세요.
5. gap, padding 등 spacing에서 arbitrary value가 필요하면 inline style을 사용하세요.
```

### 통합 체크리스트
- [ ] 모든 `text-[*]`, `font-[*]`, `leading-[*]` 클래스를 inline style로 변환
- [ ] 모든 `bg-[#...]`, `text-[#...]`, `border-[#...]` 색상 클래스를 inline style로 변환
- [ ] SVG 경로는 별도 파일로 분리 (`src/imports/` 폴더)
- [ ] 일러스트/아이콘 컴포넌트도 inline style 적용

---

## 작업 유형별 가이드

### 🐛 버그 수정

**필수 문서**:
1. `PROJECT_CONTEXT.md` - 전체 시스템 이해
2. `DECISIONS.md` - 설계 의도 확인

**체크리스트**:
- [ ] Critical Rules 위반 여부 확인
- [ ] 개발 환경에서만 발생하는지 확인 (`import.meta.env.DEV`)
- [ ] 관련 Edge Function 로그 확인
- [ ] Sentry 에러 로그 확인

---

### ✨ 새 기능 추가

**필수 문서**:
1. `PROJECT_CONTEXT.md` - Critical Rules, 파일 구조
2. `components-inventory.md` - 재사용 가능한 컴포넌트 확인 (51개)
3. `DATABASE_SCHEMA.md` - DB 스키마 (테이블 추가 필요 시)
4. `DECISIONS.md` - 기존 설계 패턴 확인

**체크리스트**:
- [ ] 기존 컴포넌트 재사용 가능한지 확인
- [ ] DB 스키마 변경 필요한지 확인
- [ ] Edge Function 추가 필요한지 확인
- [ ] 무료/유료 분기 필요한지 확인
- [ ] 개발 전용 기능인지 확인 (배포 시 제외 필요)

---

### 🎨 UI 수정

**필수 문서**:
1. `PROJECT_CONTEXT.md` - Critical Rules (스타일링 규칙)
2. `/styles/globals.css` - Tailwind 토큰 확인
3. `components-inventory.md` - UI 컴포넌트 위치

**절대 금지**:
- ❌ `text-*`, `font-*`, `leading-*` 클래스 사용
- ❌ `styled-components` 사용
- ❌ Tailwind 외 CSS 라이브러리 사용
- ⚠️ `inline style`은 **FigmaMake 통합 시 타이포그래피/색상에 한해 허용**

**iOS Safari 체크리스트**:
- [ ] `overflow: hidden` + `border-radius` 조합 사용 시 `transform-gpu` 추가
- [ ] 실제 iOS Safari에서 둥근 모서리 확인

---

### 📊 데이터 작업

**필수 문서**:
1. `DATABASE_SCHEMA.md` - 전체 DB 구조 파악
2. `PROJECT_CONTEXT.md` - RLS 정책, Edge Functions
3. `supabase/EDGE_FUNCTIONS_GUIDE.md` - Edge Functions 20개 목록

**체크리스트**:
- [ ] RLS 정책 추가 필요한지 확인
- [ ] 마이그레이션 SQL 파일 작성
- [ ] Edge Function에서 접근 가능한지 확인
- [ ] Service Role Key 필요한지 확인

---

### 🔧 리팩토링

**필수 문서**:
1. `DECISIONS.md` - 기존 설계 의도 이해
2. `PROJECT_CONTEXT.md` - Critical Rules 준수

**체크리스트**:
- [ ] 기능 변경 없이 코드만 개선하는지 확인
- [ ] 기존 설계 패턴 유지
- [ ] TypeScript 타입 정확히 정의
- [ ] 개발 전용 코드는 `import.meta.env.DEV`로 분리 유지

---

### 📱 모바일 최적화

**필수 문서**:
1. `PROJECT_CONTEXT.md` - 모바일 최적화 규칙
2. `/styles/globals.css` - 반응형 토큰

**iOS Safari 렌더링 이슈 해결법**:
```tsx
// ✅ 올바른 예시
<div className="overflow-hidden rounded-2xl transform-gpu">
  {/* 둥근 모서리가 정상적으로 보임 */}
</div>

// ❌ 잘못된 예시 - iOS에서 잘림
<div className="overflow-hidden rounded-2xl">
  {/* iOS Safari에서 둥근 모서리가 잘릴 수 있음 */}
</div>
```

---

## 핵심 시나리오 5가지

### 시나리오 1: iOS에서 둥근 모서리가 안 보여요 (모바일 최적화)

**문제**: iOS Safari에서 `overflow: hidden` + `border-radius` 조합이 작동 안 함

**해결**:
```tsx
// Before
<div className="overflow-hidden rounded-2xl">
  <img src="..." alt="..." />
</div>

// After - transform-gpu 추가
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." alt="..." />
</div>
```

**검증**:
- [ ] iOS Safari 실제 기기에서 확인
- [ ] Android Chrome에서도 정상 작동 확인

---

### 시나리오 2: 개발용 버튼이 프로덕션에 보여요 (환경 분리)

**문제**: 개발 전용 UI가 프로덕션에 노출됨

**해결**:
```tsx
// Before - 프로덕션에도 노출됨
<button onClick={handleTest}>테스트 버튼</button>

// After - 개발 환경에서만 보임
{import.meta.env.DEV && (
  <button onClick={handleTest}>테스트 버튼</button>
)}
```

**적용 대상**:
- [ ] 디버깅 버튼
- [ ] UI 테스팅용 직접 이동 버튼
- [ ] 개발자 전용 로그
- [ ] 에러 페이지 테스트 버튼

---

### 시나리오 3: 스크롤 복원이 안 돼요 (버그 수정)

**Step 1**: `PROJECT_CONTEXT.md` 전체 읽기

**Step 2**: 버그 체크리스트 확인 (PROJECT_CONTEXT.md → "주요 버그 유형 & 체크리스트")

**Step 3**: 관련 파일 찾기
```bash
# scrollRestoreLogger 검색
```

**Step 4**: 로그 분석 (사용자에게 콘솔 로그 요청)

**Step 5**: 수정 코드 작성 (TypeScript, JSDoc, 구조화된 로깅 준수)

---

### 시나리오 4: 프로필 페이지에 별점 평가 추가 (새 기능)

**Step 1**: 기존 구조 파악
- `components-inventory.md`에서 프로필 관련 컴포넌트 확인
- `DATABASE_SCHEMA.md`에서 DB 스키마 확인

**Step 2**: 설계 결정
- [ ] 별점 데이터를 어디에 저장? (새 테이블 vs 기존 테이블)
- [ ] 로그인 필수? (유료 vs 무료)
- [ ] UI 컴포넌트 재사용 가능? (components/ui/*)

**Step 3**: `DECISIONS.md` 업데이트
```markdown
## [2026-01-17] 별점 평가 시스템 추가

### 결정 사항
- 새 테이블 `content_ratings` 생성
- RLS 정책: 본인만 수정 가능
- UI: shadcn/ui의 Star 아이콘 사용

### 근거
- 기존 orders 테이블과 분리 (확장성)
```

**Step 4**: 구현 (TypeScript, Tailwind, RLS 정책)

---

### 시나리오 5: 로딩 페이지 디자인 변경 (UI 수정)

**Step 1**: Critical Rules 확인
- ❌ `text-2xl`, `font-bold` 같은 폰트 클래스 사용 금지
- ✅ `globals.css`의 토큰만 사용

**Step 2**: 기존 파일 찾기 (LoadingPage 검색)

**Step 3**: Tailwind 우선, 타이포그래피는 inline style 허용
```tsx
// ✅ 올바른 예시 - 레이아웃은 Tailwind
<div className="flex items-center justify-center h-screen bg-gray-50">
  <div className="space-y-4">
    <h1>로딩 중...</h1>
  </div>
</div>

// ✅ FigmaMake 통합 시 - 타이포그래피는 inline style 허용
<p style={{ fontSize: '15px', fontWeight: 500, color: '#368683' }}>텍스트</p>

// ❌ 잘못된 예시
<div className="text-2xl">  {/* 폰트 클래스 금지 */}
```

---

## 금지 사항

- `any` 타입 사용
- inline style 사용 **(예외: FigmaMake 통합 시 타이포그래피/색상은 허용)**
- `text-*`, `font-*`, `leading-*` Tailwind 클래스 사용
- 개발 전용 코드 프로덕션 노출
- Supabase 정보 하드코딩
- 문서 업데이트 없이 대규모 변경
- Production DB 직접 조작 (Staging에서 테스트 후 반영)
- 사주 API를 프론트엔드에서 호출 (API 키 노출 위험)
- Edge Function에서 사주 API 호출 시 브라우저 헤더 누락 (차단될 수 있음)

---

## 핵심 문서 이정표

이 프로젝트에는 여러 참고 문서가 있습니다. 작업 유형에 따라 아래 문서를 참고하세요.

### 📌 필수 문서 (자주 참조)

| 문서 | 언제 읽나요? | 주요 내용 |
|------|-------------|----------|
| **[PROJECT_CONTEXT.md](./src/PROJECT_CONTEXT.md)** | 모든 작업 시작 전 | 전체 아키텍처, 무료/유료 플로우, 주요 버그 패턴 |
| **[DECISIONS.md](./src/DECISIONS.md)** | 리팩토링, 설계 변경 전 | "왜 이렇게 구현했는가?" 설계 의도 기록 (ADR) |

### 🗄️ 데이터베이스 관련

| 문서 | 언제 읽나요? | 주요 내용 |
|------|-------------|----------|
| **[DATABASE_SCHEMA.md](./src/DATABASE_SCHEMA.md)** | DB 작업 시 | 테이블 구조, 컬럼, 타입, 제약조건, 인덱스 |
| **[supabase/RLS_POLICIES.md](./supabase/RLS_POLICIES.md)** | 권한 문제 디버깅 시 | 9개 테이블의 26개 RLS 정책, Staging↔Production 동기화 |
| **[supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md](./supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** | DB 자동화 작업 시 | 5개 Triggers, 5개 Functions, updated_at 자동 갱신 패턴 |

### ⚡ Supabase Edge Functions

| 문서 | 언제 읽나요? | 주요 내용 |
|------|-------------|----------|
| **[supabase/EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md)** | Edge Function 작업 시 | 20개 함수 목록, 입력/출력 형식, 배포 방법 |

### 🎨 컴포넌트 & UI

| 문서 | 언제 읽나요? | 주요 내용 |
|------|-------------|----------|
| **[components-inventory.md](./src/components-inventory.md)** | 컴포넌트 찾기, 재사용 검토 시 | 51개 컴포넌트 분류, 파일 위치, shadcn/ui 48개 |

### 🚀 시작 가이드

| 문서 | 언제 읽나요? | 주요 내용 |
|------|-------------|----------|
| **[README.md](./README.md)** | 프로젝트 처음 시작할 때 | 환경 설정, 빠른 시작, Supabase/Vercel 설정 |

### 📋 작업 시나리오별 문서 참고 순서

#### 🐛 버그 수정
1. PROJECT_CONTEXT.md (전체 시스템 이해)
2. DECISIONS.md (설계 의도 확인)
3. 관련 파일 찾기

#### ✨ 새 기능 추가
1. PROJECT_CONTEXT.md (Critical Rules, 파일 구조)
2. components-inventory.md (재사용 가능한 컴포넌트)
3. DATABASE_SCHEMA.md (DB 스키마 변경 필요 시)
4. DECISIONS.md (설계 패턴 확인)

#### 🎨 UI 수정
1. PROJECT_CONTEXT.md (스타일링 규칙)
2. /styles/globals.css (Tailwind 토큰)
3. components-inventory.md (UI 컴포넌트 위치)

#### 📊 DB 작업
1. DATABASE_SCHEMA.md (전체 DB 구조)
2. RLS_POLICIES.md (권한 정책)
3. DATABASE_TRIGGERS_AND_FUNCTIONS.md (자동화 로직)
4. EDGE_FUNCTIONS_GUIDE.md (Edge Function 접근)

#### 🔧 리팩토링
1. DECISIONS.md (기존 설계 의도)
2. PROJECT_CONTEXT.md (Critical Rules)

#### 📱 모바일 최적화
1. PROJECT_CONTEXT.md (모바일 최적화 규칙)
2. /styles/globals.css (반응형 토큰)

---

**최종 업데이트**: 2026-01-17
