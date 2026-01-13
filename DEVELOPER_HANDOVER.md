# 개발 인수인계서 (Developer Handover Document)

> **프로젝트**: 나다운세 (Nadaunse) - 타로/사주 운세 모바일 웹 서비스
> **URL**: https://nadaunse.com
> **GitHub**: https://github.com/stargiosoft/nadaunse
> **작성일**: 2026-01-13
> **버전**: 1.0.0

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [개발 환경 구성](#2-개발-환경-구성)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [핵심 개발 규칙](#5-핵심-개발-규칙)
6. [환경 분리 (Production/Staging)](#6-환경-분리-productionstaging)
7. [주요 문서 가이드](#7-주요-문서-가이드)
8. [개발 프로세스](#8-개발-프로세스)
9. [배포 프로세스](#9-배포-프로세스)
10. [주요 비즈니스 플로우](#10-주요-비즈니스-플로우)
11. [외부 서비스 연동](#11-외부-서비스-연동)
12. [자주 발생하는 이슈 및 해결법](#12-자주-발생하는-이슈-및-해결법)
13. [체크리스트](#13-체크리스트)

---

## 1. 프로젝트 개요

### 1.1 서비스 설명
- **타로/사주 운세 모바일 웹 서비스**
- 무료/유료 콘텐츠 이원화 시스템
- iOS Safari 최적화 완료
- AI 기반 운세 생성 (OpenAI GPT, Anthropic Claude, Google Gemini)

### 1.2 주요 통계
| 항목 | 수량 |
|------|------|
| 컴포넌트 | 51개 |
| Edge Functions | 20개 |
| 페이지 | 38개 |
| UI 컴포넌트 (shadcn/ui) | 48개 |
| 스켈레톤 | 5개 |

### 1.3 주요 기능
- **무료 콘텐츠**: 사주/타로 맛보기 (로그인 불필요)
- **유료 콘텐츠**: 심화 해석판 (결제 필요)
- **타로 서비스**: 카드 섞기, 선택, AI 해석
- **사주 관리**: 본인/관계 사주 저장 및 관리
- **쿠폰 시스템**: 웰컴 쿠폰, 재방문 쿠폰
- **카카오 알림톡**: 결제 완료 시 자동 발송

---

## 2. 개발 환경 구성

### 2.1 필수 설치 도구

```bash
# Node.js (v18 이상 권장)
node --version  # v18.x 이상

# Package Manager (pnpm 권장)
npm install -g pnpm

# Supabase CLI
npm install -g supabase

# Git
git --version
```

### 2.2 프로젝트 클론 및 설정

```bash
# 1. 저장소 클론
git clone https://github.com/stargiosoft/nadaunse.git
cd nadaunse

# 2. 의존성 설치
pnpm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에서 아래 값 설정
```

### 2.3 환경변수 목록

```env
# Supabase 설정 (Staging 기본값)
VITE_SUPABASE_PROJECT_ID=hyltbeewxaqashyivilu
VITE_SUPABASE_ANON_KEY=<staging-anon-key>

# AI API 키
OPENAI_API_KEY=<openai-api-key>
ANTHROPIC_API_KEY=<anthropic-api-key>
GOOGLE_GEMINI_API_KEY=<gemini-api-key>

# 결제 (PortOne)
VITE_PORTONE_STORE_ID=<store-id>
VITE_PORTONE_CHANNEL_KEY=<channel-key>

# 알림톡 (TalkDream)
TALKDREAM_API_KEY=<api-key>

# 사주 API
VITE_SAJU_API_URL=https://service.stargio.co.kr:8400/StargioSaju

# Sentry (에러 모니터링)
VITE_SENTRY_DSN=<sentry-dsn>

# Kakao OAuth
VITE_KAKAO_AUTH_SECRET=<kakao-secret>
```

### 2.4 로컬 개발 서버 실행

```bash
# 개발 서버 실행 (기본 포트: 5173)
pnpm dev

# 타입 체크
pnpm typecheck

# 빌드
pnpm build

# 빌드 미리보기
pnpm preview
```

### 2.5 Supabase 로컬 개발

```bash
# Supabase 로컬 시작
supabase start

# Supabase 상태 확인
supabase status

# Edge Functions 로컬 테스트
supabase functions serve <function-name>

# Edge Functions 배포 (Staging)
supabase functions deploy <function-name> --project-ref hyltbeewxaqashyivilu
```

---

## 3. 기술 스택

### 3.1 프론트엔드
| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.0 |
| Build Tool | Vite | 5.x |
| Routing | React Router | 6.x |
| Animation | Framer Motion | 11.x |
| UI Library | shadcn/ui | - |
| State | React Hooks | - |

### 3.2 백엔드
| 분류 | 기술 | 설명 |
|------|------|------|
| Database | PostgreSQL | Supabase 관리형 |
| Auth | Supabase Auth | OAuth (Google, Kakao) |
| Edge Functions | Deno Runtime | 서버리스 함수 20개 |
| Storage | Supabase Storage | 이미지 저장 |
| RLS | Row Level Security | 데이터 접근 제어 |

### 3.3 AI 서비스
| 서비스 | 용도 |
|--------|------|
| OpenAI GPT-4o | 운세 생성, 이미지 프롬프트 |
| Anthropic Claude-3.5-Sonnet | 운세 생성 |
| Google Gemini | 썸네일 이미지 생성 |

### 3.4 외부 서비스
| 서비스 | 용도 |
|--------|------|
| PortOne v2 | 결제 처리 |
| TalkDream API | 카카오 알림톡 |
| Sentry | 에러 모니터링 |
| Vercel | 프론트엔드 호스팅 |

### 3.5 핵심 의존성 (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.3",
    "@supabase/supabase-js": "^2.49.4",
    "@radix-ui/react-*": "다수의 UI 컴포넌트",
    "framer-motion": "^11.15.0",
    "tailwindcss": "^4.0.0",
    "@sentry/react": "^8.45.1",
    "xlsx": "^0.18.5"
  }
}
```

---

## 4. 프로젝트 구조

### 4.1 디렉토리 구조

```
nadaunse/
├── src/
│   ├── components/          # React 컴포넌트 (51개)
│   │   ├── ui/              # shadcn/ui 컴포넌트 (48개)
│   │   ├── skeletons/       # 로딩 스켈레톤 (5개)
│   │   └── figma/           # Figma 임포트 (보호 파일)
│   ├── pages/               # 페이지 컴포넌트 (38개)
│   ├── lib/                 # 비즈니스 로직, 유틸리티
│   │   ├── supabase.ts      # Supabase 클라이언트
│   │   ├── auth.ts          # 인증 헬퍼
│   │   ├── freeContentService.ts  # 무료 콘텐츠 로직
│   │   ├── sajuApi.ts       # 사주 API 호출
│   │   ├── coupon.ts        # 쿠폰 관리
│   │   ├── env.ts           # 환경 감지 유틸
│   │   ├── logger.ts        # 구조화된 로거
│   │   ├── sentry.ts        # Sentry 초기화
│   │   └── fetchWithRetry.ts # 재시도 로직
│   ├── utils/               # 순수 유틸리티 함수
│   ├── hooks/               # Custom React Hooks
│   ├── styles/              # Tailwind 설정, globals.css
│   └── imports/             # SVG, 이미지 임포트
│
├── supabase/
│   └── functions/           # Edge Functions (20개)
│       ├── generate-free-preview/     # 무료 맛보기 생성
│       ├── generate-master-content/   # 유료 콘텐츠 생성
│       ├── generate-saju-answer/      # 사주 운세 생성
│       ├── generate-tarot-answer/     # 타로 운세 생성
│       ├── generate-thumbnail/        # 썸네일 생성
│       ├── get-available-coupons/     # 쿠폰 조회
│       ├── apply-coupon-to-order/     # 쿠폰 적용
│       ├── issue-welcome-coupon/      # 웰컴 쿠폰 발급
│       ├── issue-revisit-coupon/      # 재방문 쿠폰 발급
│       ├── payment-webhook/           # 결제 웹훅
│       ├── process-payment/           # 결제 처리
│       ├── process-refund/            # 환불 처리
│       ├── send-alimtalk/             # 카카오 알림톡
│       └── ...                        # 기타
│
├── public/                  # 정적 파일
├── .env.local               # 환경변수 (gitignore)
├── .env.example             # 환경변수 템플릿
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### 4.2 핵심 파일 위치

| 기능 | 파일 경로 |
|------|----------|
| 라우터 (진입점) | `/src/App.tsx` |
| Supabase 클라이언트 | `/src/lib/supabase.ts` |
| 환경 설정 | `/src/utils/supabase/info.tsx` |
| 환경 감지 | `/src/lib/env.ts` |
| 인증 헬퍼 | `/src/lib/auth.ts` |
| 무료 콘텐츠 서비스 | `/src/lib/freeContentService.ts` |
| 사주 API | `/src/lib/sajuApi.ts` |
| 전역 스타일 | `/src/styles/globals.css` |

---

## 5. 핵심 개발 규칙

### 5.1 스타일링 규칙

```tsx
// ✅ 올바른 예시 - Tailwind CSS만 사용
<div className="flex items-center gap-2 p-4 bg-primary rounded-lg">
  <span>내용</span>
</div>

// ❌ 금지 - inline style
<div style={{ display: 'flex', padding: '16px' }}>

// ❌ 금지 - 폰트 관련 Tailwind 클래스
<div className="text-2xl font-bold leading-tight">
// globals.css에 태그별 폰트 정의되어 있음

// ✅ iOS Safari 렌더링 이슈 해결
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." />
</div>
```

### 5.2 TypeScript 규칙

```typescript
// ✅ 올바른 예시 - interface 정의 필수
interface User {
  id: string;
  email: string;
  nickname: string;
}

// ❌ 금지 - any 타입
const user: any = {...};  // 절대 금지

// ✅ Supabase 응답 타입 체크
const { data, error } = await supabase
  .from('users')
  .select('*')
  .single();

if (error) throw error;
const user: User = data;  // 타입 명시
```

### 5.3 개발/배포 환경 분리

```tsx
// ✅ 권장 - /lib/env.ts 사용
import { DEV, isProduction } from '../lib/env';

{DEV && <button>개발용 버튼</button>}

// ⚠️ 대안 - import.meta.env.DEV
// Figma Make 환경에서 부정확할 수 있음
{import.meta.env.DEV && <button>테스트</button>}
```

### 5.4 사주 API 호출 규칙 (중요!)

```tsx
// ✅ 올바른 패턴 - 프론트엔드에서 직접 호출
import { fetchSajuData } from '../lib/sajuApi';

const sajuData = await fetchSajuData(birthDate, birthTime, gender);
// 결과를 Edge Function에 전달
await generateContent({ sajuApiData: sajuData, ... });

// ❌ 잘못된 패턴 - Edge Function에서 호출
// API 서버가 서버 요청을 차단하여 빈 데이터 반환됨
```

### 5.5 컴포넌트 재사용

새 컴포넌트 만들기 전 반드시 확인:
1. `/src/components-inventory.md` - 51개 컴포넌트 목록
2. `/src/components/ui/` - 48개 shadcn/ui 컴포넌트

---

## 6. 환경 분리 (Production/Staging)

### 6.1 Supabase 환경

| 환경 | Project ID | URL | 용도 |
|------|------------|-----|------|
| Production | `kcthtpmxffppfbkjjkub` | https://kcthtpmxffppfbkjjkub.supabase.co | nadaunse.com |
| Staging | `hyltbeewxaqashyivilu` | https://hyltbeewxaqashyivilu.supabase.co | 테스트/Preview |

### 6.2 Vercel 환경변수

| 환경 | 설정 |
|------|------|
| Production | `VITE_SUPABASE_PROJECT_ID=kcthtpmxffppfbkjjkub` |
| Preview | `VITE_SUPABASE_PROJECT_ID=hyltbeewxaqashyivilu` |
| Development | `VITE_SUPABASE_PROJECT_ID=hyltbeewxaqashyivilu` |

### 6.3 도메인 기반 환경 감지

프로덕션 도메인 (DEV=false):
- `nadaunse.com`
- `www.nadaunse.com`
- `nadaunse.figma.site`

```typescript
// /lib/env.ts
export const DEV: boolean;           // 개발 환경 여부
export const isProduction(): boolean; // 프로덕션 도메인 체크
export const isDevelopment(): boolean;// 개발 환경 체크
```

---

## 7. 주요 문서 가이드

### 7.1 문서 우선순위 (읽는 순서)

| 순서 | 문서 | 설명 | 소요 시간 |
|------|------|------|----------|
| 1 | **CLAUDE.md** | 개발 규칙 (필독) | 3분 |
| 2 | **AI_ONBOARDING.md** | AI 작업 가이드 | 5분 |
| 3 | **PROJECT_CONTEXT.md** | 시스템 전체 이해 | 10분 |
| 4 | DECISIONS.md | 아키텍처 결정 기록 | 필요시 |
| 5 | DATABASE_SCHEMA.md | DB 스키마 | 필요시 |
| 6 | components-inventory.md | 컴포넌트 목록 (51개) | 필요시 |
| 7 | EDGE_FUNCTIONS_GUIDE.md | Edge Functions (20개) | 필요시 |

### 7.2 문서 위치

```
/
├── README.md                  # 프로젝트 개요
├── CLAUDE.md                  # 개발 규칙 (Claude 전용)
└── src/
    ├── AI_ONBOARDING.md       # AI 작업 가이드
    ├── PROJECT_CONTEXT.md     # 프로젝트 컨텍스트
    ├── DECISIONS.md           # 아키텍처 결정 기록
    ├── DATABASE_SCHEMA.md     # DB 스키마
    ├── components-inventory.md # 컴포넌트 목록
    └── supabase/
        ├── EDGE_FUNCTIONS_GUIDE.md        # Edge Functions
        ├── DATABASE_TRIGGERS_AND_FUNCTIONS.md # Triggers
        └── RLS_POLICIES.md                # RLS 정책
```

### 7.3 문서 업데이트 규칙

코드 변경 시 관련 문서 업데이트 필수:
1. 새 컴포넌트 추가 → `components-inventory.md`
2. DB 스키마 변경 → `DATABASE_SCHEMA.md`
3. Edge Function 추가 → `EDGE_FUNCTIONS_GUIDE.md`
4. 아키텍처 결정 → `DECISIONS.md`
5. 개발 규칙 변경 → `CLAUDE.md`

---

## 8. 개발 프로세스

### 8.1 Git 브랜치 전략

```bash
main (production)
  └── develop (staging)
        └── feature/xxx
        └── fix/xxx
        └── refactor/xxx
```

### 8.2 Git 커밋 규칙

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

# 예시
feat: 타로 카드 선택 애니메이션 추가
fix: iOS Safari 첫 클릭 이벤트 누락 해결
docs: 개발 인수인계서 작성
```

### 8.3 코드 리뷰 체크리스트

- [ ] TypeScript 타입 정의 완료
- [ ] Tailwind CSS만 사용 (inline style 없음)
- [ ] `text-*`, `font-*` 클래스 미사용
- [ ] 개발 전용 코드 `DEV` 조건으로 분리
- [ ] iOS Safari 테스트 완료 (`transform-gpu` 적용)
- [ ] 관련 문서 업데이트
- [ ] 에러 핸들링 구현

### 8.4 테스트 환경

```bash
# 로컬 개발
pnpm dev           # http://localhost:5173

# Staging 테스트
# Vercel Preview URL (PR 생성 시 자동 배포)

# Production
# https://nadaunse.com
```

---

## 9. 배포 프로세스

### 9.1 프론트엔드 배포 (Vercel)

```bash
# 자동 배포
1. main 브랜치에 push → Production 자동 배포
2. PR 생성 → Preview 환경 자동 배포

# 수동 배포 (필요시)
vercel --prod
```

### 9.2 Edge Functions 배포 (Supabase)

```bash
# Staging 배포
supabase functions deploy <function-name> --project-ref hyltbeewxaqashyivilu

# Production 배포
supabase functions deploy <function-name> --project-ref kcthtpmxffppfbkjjkub

# 전체 배포
supabase functions deploy --project-ref <project-id>

# JWT 검증 비활성화 (필요시)
supabase functions deploy <function-name> --no-verify-jwt --project-ref <project-id>
```

### 9.3 배포 체크리스트

**프론트엔드 배포 전:**
- [ ] 로컬에서 빌드 테스트 (`pnpm build`)
- [ ] 타입 에러 없음 (`pnpm typecheck`)
- [ ] Staging에서 테스트 완료
- [ ] Production 환경변수 확인

**Edge Functions 배포 전:**
- [ ] 로컬에서 테스트 (`supabase functions serve`)
- [ ] Staging에 배포 및 테스트
- [ ] Secrets 설정 확인 (`supabase secrets list`)

---

## 10. 주요 비즈니스 플로우

### 10.1 무료 콘텐츠 플로우

```
홈 → 무료 상세 → "무료로 보기" 클릭
    ↓
로그인 체크
    ↓
┌─────────────┬─────────────┐
│ 로그아웃     │ 로그인       │
│ localStorage │ DB 조회      │
│ 캐시 확인    │ saju_records │
└─────────────┴─────────────┘
    ↓
사주 입력 또는 선택
    ↓
Edge Function 호출 (generate-free-preview)
    ↓
로딩 페이지 (폴링 2초마다)
    ↓
결과 페이지
```

**핵심 파일:**
- `/components/FreeContentDetail.tsx` - 메인
- `/lib/freeContentService.ts` - 비즈니스 로직

### 10.2 유료 콘텐츠 플로우

```
홈 → 심화해석판 상세 → "구매하기" 클릭
    ↓
로그인 필수 → 결제 페이지 (PortOne)
    ↓
쿠폰 적용 (선택)
    ↓
결제 완료 → orders 생성
    ↓
카카오 알림톡 발송
    ↓
사주 정보 입력/선택
    ↓
Edge Function 호출 (generate-master-content)
    ↓
AI 생성 → order_results 저장
    ↓
결과 페이지 → 목차 바텀시트
    ↓
풀이 완료 페이지 (재방문 쿠폰 발급)
```

**핵심 파일:**
- `/components/MasterContentDetailPage.tsx` - 메인
- `/components/PaymentNew.tsx` - 결제
- `/components/SajuResultPage.tsx` - 결과

### 10.3 타로 플로우

```
타로 상세 → "타로 보기"
    ↓
카드 섞기 (애니메이션)
    ↓
카드 선택 (3장)
    ↓
AI 타로 해석 요청
    ↓
결과 표시
```

**핵심 파일:**
- `/components/TarotFlowPage.tsx` - 통합 플로우
- `/lib/tarotCards.ts` - 카드 데이터

---

## 11. 외부 서비스 연동

### 11.1 PortOne 결제

```typescript
// 결제 요청
import PortOne from '@portone/browser-sdk/v2';

await PortOne.requestPayment({
  storeId: import.meta.env.VITE_PORTONE_STORE_ID,
  channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY,
  paymentId: `order_${orderId}`,
  orderName: contentTitle,
  totalAmount: price,
  // ...
});

// 웹훅 처리: /supabase/functions/payment-webhook
```

### 11.2 카카오 알림톡 (TalkDream)

```typescript
// Edge Function: /send-alimtalk
// 결제 완료 시 자동 발송
// 템플릿: 운세 결과 완성 알림
```

### 11.3 사주 API (Stargio)

```typescript
// 반드시 프론트엔드에서 호출 (Edge Function에서 빈 응답)
import { fetchSajuData } from '../lib/sajuApi';

const sajuData = await fetchSajuData(birthDate, birthTime, gender);
```

### 11.4 AI API

| API | 용도 | Edge Function |
|-----|------|---------------|
| OpenAI GPT-4o | 운세 생성 | generate-saju-answer |
| Anthropic Claude | 운세 생성 | generate-master-content |
| Google Gemini | 썸네일 생성 | generate-thumbnail |

---

## 12. 자주 발생하는 이슈 및 해결법

### 12.1 iOS Safari 둥근 모서리 잘림

**문제:** `overflow: hidden` + `border-radius` 조합 시 모서리 잘림
**해결:** `transform-gpu` 클래스 추가

```tsx
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." />
</div>
```

### 12.2 iOS 첫 번째 클릭 무반응

**문제:** 하단 고정 버튼의 첫 클릭이 작동 안 함
**해결:** `pointer-events-auto` 명시적 설정 + 스크롤 영역 분리

```tsx
<div className="fixed bottom-0 z-50 pointer-events-auto">
  <button>버튼</button>
</div>
```

### 12.3 사주 API 빈 응답

**문제:** Edge Function에서 사주 API 호출 시 빈 데이터 반환
**해결:** 프론트엔드에서 직접 호출 후 Edge Function에 전달

### 12.4 이미지 캐시 문제

**문제:** 썸네일 재생성 시 이전 이미지 표시
**해결:** `imageCacheBuster` 상태로 URL 버전 관리

```tsx
const [cacheBuster, setCacheBuster] = useState(Date.now());
<img src={`${url}?v=${cacheBuster}`} />
```

### 12.5 iOS 스와이프 뒤로가기 히스토리 문제

**문제:** 회원가입 플로우에서 뒤로가기 시 완료된 페이지로 돌아감
**해결:** 각 페이지에서 마운트 시 상태 체크 후 리다이렉트

```tsx
useEffect(() => {
  const user = localStorage.getItem('user');
  if (user) {
    navigate('/', { replace: true });
  }
}, [navigate]);
```

---

## 13. 체크리스트

### 13.1 개발 시작 전 체크리스트

- [ ] Node.js v18+ 설치
- [ ] pnpm 설치
- [ ] Supabase CLI 설치
- [ ] `.env.local` 설정 완료
- [ ] `pnpm install` 완료
- [ ] `pnpm dev` 정상 실행

### 13.2 기능 개발 체크리스트

- [ ] CLAUDE.md 규칙 숙지
- [ ] components-inventory.md에서 재사용 가능 컴포넌트 확인
- [ ] TypeScript interface 정의
- [ ] Tailwind CSS만 사용
- [ ] 개발 전용 코드 `DEV` 조건 분리
- [ ] iOS Safari 테스트
- [ ] 관련 문서 업데이트

### 13.3 배포 전 체크리스트

- [ ] `pnpm build` 성공
- [ ] `pnpm typecheck` 에러 없음
- [ ] Staging 테스트 완료
- [ ] Edge Functions 배포 (필요시)
- [ ] Production 환경변수 확인

### 13.4 마스터 체크리스트 (프로젝트 이해도)

```markdown
[ ] 무료/유료 콘텐츠 플로우 설명 가능
[ ] 타로/사주 서비스 차이 이해
[ ] FreeContentService 클래스 역할 파악
[ ] Critical Rules 6가지 숙지
[ ] Edge Functions 20개 목록 파악
[ ] Tailwind 폰트 클래스 금지 이유 이해
[ ] RLS 정책 이해
[ ] localStorage vs DB 저장 분기 이해
[ ] 사주 API 프론트엔드 호출 이유 이해
[ ] iOS Safari 최적화 방법 숙지
```

---

## 연락처 및 추가 자료

- **GitHub**: https://github.com/stargiosoft/nadaunse
- **Supabase Dashboard (Production)**: https://supabase.com/dashboard/project/kcthtpmxffppfbkjjkub
- **Supabase Dashboard (Staging)**: https://supabase.com/dashboard/project/hyltbeewxaqashyivilu
- **Vercel Dashboard**: https://vercel.com/stargiosoft/nadaunse
- **Sentry Dashboard**: (프로젝트 설정에서 확인)

---

**문서 버전**: 1.0.0
**작성일**: 2026-01-13
**작성자**: AI Assistant
**문서 끝**
