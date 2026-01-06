# PROJECT_CONTEXT.md

> **AI 디버깅 전용 컨텍스트 파일**  
> 버그 발생 시 AI에게 가장 먼저 제공해야 하는 프로젝트 뇌(Brain)  
> **최종 업데이트**: 2026-01-06

---

## 📚 Tech Stack

- **Frontend**: React 18 + TypeScript + React Router v6
- **Styling**: Tailwind CSS v4.0 (토큰 기반)
- **Build Tool**: Vite
- **Backend**: Supabase
  - Auth: OAuth (Google, Kakao)
  - Database: PostgreSQL + RLS
  - Edge Functions: Deno runtime (17개)
- **AI**: OpenAI GPT-4o, Anthropic Claude-3.5-Sonnet, Google Gemini
- **Payment**: PortOne (구 아임포트) v2
- **Notification**: TalkDream API (카카오 알림톡)
- **Hosting**: Figma Make (Dev), Supabase (Production)
- **State Management**: React Hooks (useState, useEffect)
- **Animation**: Framer Motion
- **Image Optimization**: Supabase Storage (thumbnail variants)

---

## 🎯 프로젝트 정체성

### 서비스 개요
- **타로/사주 운세 모바일 웹 서비스**
- iOS Safari 최적화 완료
- 무료/유료 콘텐츠 이원화 시스템

### 주요 통계
- **컴포넌트**: 52개 (활성화)
- **Edge Functions**: 17개
- **페이지 컴포넌트**: 38개
- **UI 컴포넌트**: 14개

---

## 🗺️ System Map

```
[User Browser (Mobile)]
    ↓
[React SPA (Figma Make / Vite)]
    ↓
┌─────────────────────────────────┐
│  Supabase Auth (OAuth)          │
│  - Google, Kakao 로그인          │
│  - Session 관리                  │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  PostgreSQL (Supabase)          │
│  - users, saju_records          │
│  - master_contents, orders      │
│  - coupons, user_coupons        │
│  - order_results (AI 생성 결과) │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Edge Functions (Deno) - 17개   │
│  - AI 콘텐츠 생성 (8개)          │
│  - 쿠폰 관리 (4개)               │
│  - 사용자 관리 (2개)             │
│  - 알림톡 발송 (1개)             │
│  - 기타 (2개)                    │
└─────────────────────────────────┘
    ↓
[OpenAI API / Anthropic API / Google Gemini]

[PortOne Payment Gateway]
    ↓
[Webhook → Edge Function]
    ↓
[AI Generation → DB Update]
    ↓
[TalkDream API → 카카오 알림톡]
```

---

## 🚨 Critical Rules (절대 규칙)

### 1. 스타일링
- ✅ **Tailwind CSS만 사용** (v4.0 CSS 변수 기반)
- ❌ `styled-components`, `inline style`, `emotion` 절대 금지
- ❌ `text-*`, `font-*`, `leading-*` 클래스 **사용 금지** (globals.css에 토큰 정의됨)
- ✅ 사용자가 명시적으로 요청한 경우에만 폰트 클래스 사용

### 2. 타입 정의
- ✅ **TypeScript `interface` 필수 정의**
- ❌ `any` 타입 **절대 금지**
- ✅ Supabase API 응답은 반드시 타입 체크

### 3. 파일 구조
- ✅ **React Router v6** 사용 (`/App.tsx`가 라우터)
- ✅ 페이지 컴포넌트: `/pages/*.tsx`, `/components/*Page.tsx`
- ✅ 재사용 컴포넌트: `/components/*.tsx` (52개)
- ✅ 비즈니스 로직: `/lib/*.ts` (서비스 클래스)
- ✅ 유틸리티: `/utils/*.ts`

### 4. 이미지 처리
- ✅ **Figma 임포트 이미지**: `figma:asset/` 스킴 사용 (경로 접두사 금지)
- ✅ **새 이미지**: `ImageWithFallback` 컴포넌트 필수 사용
- ✅ **SVG**: `/imports/svg-*.ts` 파일에서 임포트

### 5. 비즈니스 로직 패턴
- ✅ **싱글톤 서비스 클래스** 패턴 사용 (`FreeContentService`)
- ✅ **JSDoc 주석** 모든 public 메서드에 필수
- ✅ **에러 핸들링**: try-catch + 구조화된 로깅

### 6. 개발/배포 환경 분리 (NEW!)
- ✅ **개발 전용 코드**: `import.meta.env.DEV` 조건으로 감싸기
- ✅ **적용 대상**: 테스트 버튼, 디버깅 도구, UI 테스팅용 버튼
- ❌ **금지**: 개발 전용 코드가 프로덕션에 노출

```tsx
// ✅ 올바른 예시
{import.meta.env.DEV && (
  <button onClick={handleDebug}>디버그 버튼</button>
)}

// ❌ 잘못된 예시 - 프로덕션에 노출됨
<button onClick={handleDebug}>디버그 버튼</button>
```

### 7. 모바일 최적화 (iOS Safari) (NEW!)
- ✅ **border-radius 렌더링 이슈 해결**: `transform-gpu` 클래스 추가
- ✅ **적용 조건**: `overflow: hidden` + `border-radius` 조합 사용 시
- ✅ **하단 고정 CTA**: 리팩토링된 컴포넌트 사용

```tsx
// ✅ 올바른 예시 - iOS Safari에서 정상 렌더링
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." alt="..." />
</div>

// ❌ 잘못된 예시 - iOS에서 둥근 모서리 잘림
<div className="overflow-hidden rounded-2xl">
  <img src="..." alt="..." />
</div>
```

---

## 📂 File Structure (Key Files)

### 🔐 인증 관련
```
/lib/auth.ts                    → Supabase Auth 헬퍼 함수
/lib/supabase.ts                → Supabase 클라이언트 설정
/pages/AuthCallback.tsx         → OAuth 콜백 처리
/components/LoginPageNew.tsx    → 로그인 페이지
/components/ExistingAccountPageNew.tsx  → 기존 계정 연동
/components/SessionExpiredDialog.tsx    → 세션 만료 다이얼로그
```

### 🎨 UI 컴포넌트
```
/components/ui/                 → shadcn/ui 기반 재사용 컴포넌트 (26개)
/components/skeletons/          → 로딩 스켈레톤 UI (5개)
/components/figma/              → Figma 전용 컴포넌트 (보호 파일)
/imports/                       → Figma 디자인 임포트 파일
```

### 📄 페이지 (라우트)
```
/App.tsx                        → React Router 설정 (메인 라우터)
/pages/HomePage.tsx             → 홈 (콘텐츠 목록)
/pages/TarotDemo.tsx            → 타로 데모

# 무료 콘텐츠
/components/FreeProductDetail.tsx       → 무료 콘텐츠 상세
/components/FreeBirthInfoInput.tsx      → 무료 사주 입력
/components/FreeSajuSelectPage.tsx      → 무료 사주 선택
/components/FreeContentDetail.tsx       → 무료 상세 (메인 로직)
/components/FreeContentLoading.tsx      → 무료 로딩
/components/FreeSajuDetail.tsx          → 무료 결과

# 유료 콘텐츠
/components/ProductDetail.tsx           → 유료 콘텐츠 상세
/components/PaymentNew.tsx              → 결제 페이지
/components/BirthInfoInput.tsx          → 유료 사주 입력
/components/SajuSelectPage.tsx          → 유료 사주 선택
/components/LoadingPage.tsx             → 유료 로딩
/components/SajuResultPage.tsx          → 사주 결과

# 타로 콘텐츠
/components/TarotFlowPage.tsx           → 타로 플로우 통합
/components/TarotCardSelection.tsx      → 타로 카드 선택
/components/TarotShufflePage.tsx        → 타로 카드 섞기
/components/TarotResultPage.tsx         → 타로 결과

# 프로필 & 사주 관리
/components/ProfilePage.tsx             → 프로필 (사주 관리)
/components/SajuManagementPage.tsx      → 사주 정보 관리
/components/SajuInputPage.tsx           → 내 사주 입력
/components/SajuAddPage.tsx             → 관계 사주 추가
/components/PurchaseHistoryPage.tsx     → 구매 내역

# 마스터 콘텐츠 관리
/components/MasterContentList.tsx       → 콘텐츠 목록
/components/MasterContentCreate.tsx     → 콘텐츠 생성
/components/MasterContentQuestions.tsx  → 질문지 작성
/components/MasterContentDetailPage.tsx → 사용자용 상세
```

### 🧠 비즈니스 로직
```
/lib/freeContentService.ts      → 무료 콘텐츠 비즈니스 로직 (싱글톤)
/lib/masterContentAI.ts         → 유료 콘텐츠 AI 생성 로직
/lib/coupon.ts                  → 쿠폰 관리 로직
/lib/auth.ts                    → 인증 헬퍼
/lib/zodiacUtils.ts             → 띠 계산 유틸
/lib/tarotCards.ts              → 타로 카드 데이터
/lib/image.ts                   → 이미지 최적화 헬퍼
```

### 🛠️ 유틸리티
```
/utils/analytics.ts             → Google Analytics 연동
/utils/scrollRestoreLogger.ts   → 스크롤 복원 디버깅 로거
```

### 🗄️ Supabase Edge Functions (17개)
```
# AI 생성 Functions (8개)
/supabase/functions/generate-free-preview/        → 무료 맛보기 생성
/supabase/functions/generate-master-content/      → 유료 콘텐츠 생성
/supabase/functions/generate-saju-answer/         → 사주 운세 생성
/supabase/functions/generate-saju-preview/        → 사주 미리보기
/supabase/functions/generate-tarot-answer/        → 타로 운세 생성
/supabase/functions/generate-tarot-preview/       → 타로 미리보기
/supabase/functions/generate-image-prompt/        → 이미지 프롬프트 생성
/supabase/functions/generate-thumbnail/           → 썸네일 생성

# 쿠폰 관리 Functions (4개)
/supabase/functions/get-available-coupons/        → 사용 가능 쿠폰 조회
/supabase/functions/apply-coupon-to-order/        → 주문에 쿠폰 적용
/supabase/functions/issue-welcome-coupon/         → 가입 쿠폰 발급
/supabase/functions/issue-revisit-coupon/         → 재방문 쿠폰 발급

# 사용자 관리 Functions (2개)
/supabase/functions/users/                        → 사용자 관리
/supabase/functions/master-content/               → 마스터 콘텐츠 관리

# 알림 Functions (1개)
/supabase/functions/send-alimtalk/                → 카카오 알림톡 발송

# 기타 Functions (2개)
/supabase/functions/server/                       → 서버 상태 확인
/supabase/functions/generate-content-answers/     → 콘텐츠 답변 생성
```

**상세 문서**: `/supabase/EDGE_FUNCTIONS_GUIDE.md`

---

## 🗄️ Database Schema

### 핵심 테이블

#### `users`
```sql
-- 사용자 계정 (Supabase Auth + 추가 정보)
id (uuid, PK)
provider (text)               -- 'kakao', 'google'
provider_id (text)
email, nickname, profile_image
terms_agreed, privacy_agreed, marketing_agreed
role (text)                   -- 'master', 'admin', 'user'
created_at, updated_at
```

#### `saju_records`
```sql
-- 사용자 사주 정보 (로그인 사용자만 저장)
id (uuid, PK)
user_id (uuid, FK → users)
full_name, gender, birth_date, birth_time
calendar_type (solar/lunar)   -- 양력/음력
zodiac (text)                 -- 띠 (자동 계산)
notes (text)                  -- '본인', '배우자', '지인' 등
is_primary (boolean)          -- 대표 사주 여부
created_at, updated_at
```

#### `master_contents`
```sql
-- 마스터가 생성한 운세 콘텐츠
id (uuid, PK)
content_type (text)           -- 'free' | 'paid'
category_main (text)          -- '연애', '재물', '건강', '타로' 등
title, description
price_original, price_discount, discount_rate
thumbnail_url
view_count, weekly_clicks
status (text)                 -- 'loading' | 'deployed' | 'archived'
created_at, updated_at
```

#### `orders`
```sql
-- 결제 주문 (유료 콘텐츠만)
id (uuid, PK)
user_id (uuid, FK → users)
content_id (uuid, FK → master_contents)
saju_record_id (uuid, FK → saju_records)
merchant_uid, imp_uid         -- PortOne 결제 ID
paid_amount, pay_method
pstatus (text)                -- 'pending' | 'paid' | 'failed'
ai_generation_completed (boolean)
created_at, updated_at
```

#### `order_results`
```sql
-- AI 생성 결과 저장 (유료 콘텐츠)
id (uuid, PK)
order_id (uuid, FK → orders)
question_number (int)
question_text, answer_text
created_at
```

#### `user_coupons`
```sql
-- 사용자별 쿠폰 (발급 → 사용 추적)
id (uuid, PK)
user_id (uuid, FK → users)
coupon_id (uuid, FK → coupons)
is_used (boolean)
used_order_id (uuid, FK → orders)     -- 사용된 주문
source_order_id (uuid, FK → orders)   -- 발급 원인 주문
created_at, used_at
```

#### `coupons`
```sql
-- 쿠폰 마스터 정보
id (uuid, PK)
name (text)                   -- '신규 가입 3000원 쿠폰'
discount_amount (int)
coupon_type (text)            -- 'welcome', 'revisit'
is_active (boolean)
created_at
```

**상세 문서**: `/DATABASE_SCHEMA.md`

---

## 🔀 주요 플로우

### 1. 무료 콘텐츠 플로우 (사주/타로)

```
홈 → 무료 상세 (FreeProductDetail) → "무료로 풀이받기" 클릭
    ↓
로그인 체크 (Supabase Auth)
    ↓
┌─────────────┬─────────────┐
│ 로그아웃     │ 로그인       │
│ localStorage │ DB 조회      │
│ 캐시 확인    │ saju_records │
└─────────────┴─────────────┘
    ↓             ↓
┌───┴───┐     ┌───┴───┐
│       │     │       │
있음   없음   있음   없음
│       │     │       │
↓       ↓     ↓       ↓
사주    사주   사주    사주
입력    입력   선택    입력
(캐시)  (입력) (DB)   (입력)
│       │     │       │
└───┬───┴─────┴───┬───┘
    │             │
    ↓             ↓
AI 생성 요청 (Edge Function)
    ↓
로딩 페이지 (FreeContentLoading)
    │ (폴링: 2초마다)
    ↓
결과 페이지 (FreeSajuDetail / TarotResultPage)
```

**핵심 클래스**: `FreeContentService` (`/lib/freeContentService.ts`)

**주요 파일**:
- `/components/FreeProductDetail.tsx` - 무료 상세 페이지
- `/components/FreeBirthInfoInput.tsx` - 사주 입력 (로그인/로그아웃 분기)
- `/components/FreeSajuSelectPage.tsx` - 사주 선택 (로그인 사용자만)
- `/components/FreeContentLoading.tsx` - 로딩 (폴링)
- `/components/FreeSajuDetail.tsx` - 사주 결과 페이지
- `/components/TarotResultPage.tsx` - 타로 결과 페이지

**Edge Functions**: 
- `/generate-free-preview` - 무료 맛보기 생성
- `/generate-saju-preview` - 사주 미리보기
- `/generate-tarot-preview` - 타로 미리보기

**특징**:
- ✅ 로그아웃 사용자도 이용 가능
- ✅ localStorage 캐시 (휘발성)
- ✅ 로그인 시 DB 저장 가능
- ✅ 사주/타로 모두 지원

---

### 2. 유료 콘텐츠 플로우 (심화 해석판)

```
홈 → 심화해석판 상세 (ProductDetail) → "구매하기" 클릭
    ↓
로그인 필수 체크
    ↓
┌─────────┬─────────┐
│ 로그아웃 │ 로그인   │
│ 로그인   │ 결제     │
│ 페이지   │ 페이지   │
└─────────┴─────────┘
    │         │
    └────┬────┘
         ↓
    포트원 결제 (PaymentNew)
         ↓
    쿠폰 적용 (선택)
    - 웰컴 쿠폰 (3000원)
    - 재방문 쿠폰 (2000원)
         ↓
    결제 완료 → orders 생성
         ↓
    카카오 알림톡 발송 (send-alimtalk)
         ↓
    사주 정보 확인
         ↓
┌────────────┬────────────┐
│ DB에 있음   │ DB에 없음   │
│ SajuSelect │ BirthInfo  │
│ Page       │ Input      │
└────────────┴────────────┘
    │            │
    └─────┬──────┘
          ↓
    Edge Function 호출
    (generate-master-content)
          ↓
    AI 응답 → order_results 저장
    (여러 질문-답변 쌍)
          ↓
    폴링으로 완료 확인
    (orders.ai_generation_completed)
          ↓
    결과 페이지 (SajuResultPage)
          ↓
    목차 바텀시트 (TableOfContentsBottomSheet)
```

**주요 파일**:
- `/components/ProductDetail.tsx` - 유료 상세 페이지
- `/components/PaymentNew.tsx` - 결제 페이지
- `/components/CouponBottomSheetNew.tsx` - 쿠폰 선택
- `/components/BirthInfoInput.tsx` - 사주 입력 (결제 후)
- `/components/SajuSelectPage.tsx` - 사주 선택
- `/components/LoadingPage.tsx` - 로딩 (프로그레스 바)
- `/components/SajuResultPage.tsx` - 사주 결과
- `/components/TableOfContentsBottomSheet.tsx` - 목차 (질문 리스트)

**Edge Functions**: 
- `/generate-master-content` - 유료 콘텐츠 생성
- `/get-available-coupons` - 사용 가능 쿠폰 조회
- `/apply-coupon-to-order` - 쿠폰 적용
- `/send-alimtalk` - 알림톡 발송

**특징**:
- ✅ 로그인 필수
- ✅ 심화 해석판만 결제
- ✅ DB에 영구 저장
- ✅ 쿠폰 적용 가능
- ✅ 카카오 알림톡 자동 발송
- ✅ 목차 기능 (질문별 스크롤 이동)

---

### 3. 타로 서비스 플로우 (NEW!)

```
홈 → 타로 상세 → "타로 보기" 클릭
    ↓
타로 카드 섞기 (TarotShufflePage)
    │ (애니메이션)
    ↓
카드 선택 (TarotCardSelection)
    │ (3장 선택)
    ↓
질문 입력 (선택)
    ↓
AI 타로 해석 요청
    ↓
Edge Function 호출
(generate-tarot-answer)
    ↓
타로 결과 표시 (TarotResultPage)
    │ (카드별 해석)
    ↓
저장 또는 공유
```

**주요 파일**:
- `/components/TarotFlowPage.tsx` - 타로 플로우 통합
- `/components/TarotShufflePage.tsx` - 카드 섞기
- `/components/TarotCardSelection.tsx` - 카드 선택
- `/components/TarotResultPage.tsx` - 타로 결과
- `/lib/tarotCards.ts` - 타로 카드 데이터
- `/pages/TarotDemo.tsx` - 타로 데모

**Edge Functions**:
- `/generate-tarot-answer` - 타로 해석 생성
- `/generate-tarot-preview` - 타로 미리보기

**특징**:
- ✅ 카드 섞기 애니메이션
- ✅ 3장 선택 인터랙션
- ✅ AI 타로 해석 생성
- ✅ 무료/유료 모두 지원

---

### 4. 스크롤 위치 복원 플로우 (HomePage.tsx)

```
홈 화면 → 콘텐츠 클릭
    ↓
sessionStorage에 저장:
- homepage_scroll_state: { scrollY, contentCount }
- homepage_should_restore_scroll: 'true'
    ↓
상세 페이지로 이동
    ↓
뒤로가기 (브라우저)
    ↓
홈 화면 마운트
    ↓
useLayoutEffect 즉시 실행
    ↓
저장된 scrollY로 복원 시도
    ↓
콘텐츠 로드 완료 대기
    ↓
contentCount >= 저장된 수?
    ↓
YES → requestAnimationFrame으로 스크롤
NO  → 추가 로드 후 재시도
```

**디버깅 도구**: `scrollRestoreLogger` (`/utils/scrollRestoreLogger.ts`)

**로그 출력 예시**:
```
🔵 [SCROLL SAVE] { scrollY: 1250, contentCount: 12 }
🟣 [RESTORE ATTEMPT] Target: 1250, Current: 0
🟢 [RESTORE SUCCESS] Final: 1250
```

---

## 🐛 주요 버그 유형 & 체크리스트

### 1. 스크롤 복원 실패
**증상**: 뒤로가기 시 최상단으로만 이동  
**체크**:
- [ ] `scrollRestoreLogger` 로그 확인 (SAVE → RESTORE_ATTEMPT → SUCCESS/FAIL)
- [ ] `contentCount`와 실제 렌더링된 콘텐츠 수 비교
- [ ] 페이지 높이 (`scrollHeight`) vs 목표 스크롤 위치 (`scrollY`)
- [ ] sessionStorage 값 확인 (`homepage_scroll_state`)

---

### 2. 무료 콘텐츠 생성 실패
**증상**: 로딩 무한 대기, AI 응답 없음  
**체크**:
- [ ] `FreeContentService.requestGeneration()` 호출 성공 여부
- [ ] Edge Function `/generate-free-preview` 로그 확인
- [ ] Supabase AI Logs 테이블 확인 (에러 메시지)
- [ ] localStorage 캐시 키 충돌 여부
- [ ] API 키 (OPENAI_API_KEY, ANTHROPIC_API_KEY) 설정 확인

---

### 3. 결제 후 사주 정보 연동 실패
**증상**: 결제 완료 후 사주 입력 화면으로 이동하지 않음  
**체크**:
- [ ] `orders.saju_record_id`가 null인지 확인
- [ ] `PaymentComplete.tsx`의 `useEffect` 조건 확인
- [ ] RLS 정책으로 인한 쿼리 실패 여부
- [ ] `orders` 테이블에 주문이 정상 생성되었는지 확인

---

### 4. 쿠폰 적용 오류
**증상**: 쿠폰 선택했는데 할인 미적용  
**체크**:
- [ ] `user_coupons.is_used = false`인지 확인
- [ ] Edge Function `/apply-coupon-to-order` 응답 확인
- [ ] `orders.paid_amount`와 쿠폰 할인액 계산 검증
- [ ] 쿠폰 발급 여부 확인 (`user_coupons` 테이블)

---

### 5. 목차 표시 개수 불일치
**증상**: AI가 10개 질문만 생성했는데 목차에 20개 표시됨  
**체크**:
- [ ] `TableOfContentsBottomSheet.tsx`에 하드코딩된 더미 데이터 있는지 확인
- [ ] `order_results` 테이블의 실제 행 수 조회 (`SELECT COUNT(*)`)
- [ ] 로그에서 "질문 리스트 조회 완료: X 개" 메시지 확인
- [ ] `questions` 배열에 spread 연산자로 추가 데이터 혼입 여부

---

### 6. 이미지 로딩 느림 (썸네일)
**증상**: 리스트/카드 섹션에서 이미지 로드 3초 이상 소요  
**체크**:
- [ ] `preloadImages()` 호출 여부 확인
- [ ] localStorage 캐시 활용 여부 (`*_cache_v*` 키)
- [ ] 네트워크 탭에서 이미지 크기 확인 (원본 vs 썸네일)
- [ ] Priority 설정 (`high` vs `low`) 적절한지 검토
- [ ] `/lib/imagePreloader.ts` 정상 작동 확인

---

### 7. iOS Safari 둥근 모서리 렌더링 이슈 (NEW!)
**증상**: iOS Safari에서 `border-radius`가 적용된 이미지/컨테이너의 모서리가 잘림  
**체크**:
- [ ] `overflow: hidden` + `border-radius` 조합 사용 중인지 확인
- [ ] `transform-gpu` 클래스가 추가되어 있는지 확인
- [ ] 실제 iOS Safari 기기에서 테스트
- [ ] 다른 브라우저(Chrome, Firefox)에서도 정상 작동 확인

**해결 방법**:
```tsx
// Before (iOS에서 잘림)
<div className="overflow-hidden rounded-2xl">
  <img src="..." />
</div>

// After (정상 렌더링)
<div className="overflow-hidden rounded-2xl transform-gpu">
  <img src="..." />
</div>
```

---

### 8. 개발용 버튼이 프로덕션에 노출됨 (NEW!)
**증상**: 배포 환경에서 테스트/디버그 버튼이 사용자에게 보임  
**체크**:
- [ ] `import.meta.env.DEV` 조건으로 감싸져 있는지 확인
- [ ] 빌드 후 실제 프로덕션 환경에서 테스트
- [ ] 개발 전용 로그가 프로덕션에 출력되는지 확인

**해결 방법**:
```tsx
// ✅ 올바른 예시
{import.meta.env.DEV && (
  <button onClick={handleDebug}>디버그 버튼</button>
)}

// ❌ 잘못된 예시
<button onClick={handleDebug}>디버그 버튼</button>
```

**적용 파일들**:
- `/components/LoginPageNew.tsx` - 테스트 버튼
- `/components/ProfilePage.tsx` - UI 테스팅용 버튼, 에러 페이지 확인 버튼
- `/components/MasterContentDetailPage.tsx` - 개발 플래그

---

## 📝 디버깅 시 AI에게 제공할 정보

버그 발생 시 아래 형식으로 AI에게 요청하세요:

```markdown
## 긴급 디버깅 요청

### 1. 프로젝트 문맥
(이 PROJECT_CONTEXT.md 전체 내용 붙여넣기)

### 2. 버그 증상
- **발생 페이지**: (예: HomePage.tsx)
- **발생 환경**: (예: 개발/프로덕션, iOS Safari/Chrome)
- **재현 단계**: 
  1. 홈 화면 스크롤 다운
  2. 콘텐츠 클릭
  3. 뒤로가기
  4. → 최상단으로만 이동됨
- **예상 동작**: 원래 스크롤 위치로 복원
- **실제 동작**: 최상단(0px)으로 이동

### 3. 관련 로그
(콘솔 로그, scrollRestoreLogger 출력 등 붙여넣기)

### 4. 관련 파일 (추정)
- /pages/HomePage.tsx (스크롤 복원 로직)
- /utils/scrollRestoreLogger.ts (로거)

### 5. 이미 시도한 해결 방법
- sessionStorage 값 확인 → 정상
- contentCount 확인 → 정상
- ...

### 요청사항
- 근본 원인 분석
- 수정 코드 제공
- 재발 방지 테스트 케이스 추가
```

---

## 🔄 업데이트 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0.0 | 2025-12-20 | 초기 문서 작성 | AI Assistant |
| 1.1.0 | 2025-12-20 | DEV_FLOW.md 통합 (무료/유료 플로우 추가) | AI Assistant |
| 1.2.0 | 2026-01-06 | 타로 서비스 추가, 개발/배포 환경 분리, iOS Safari 최적화, 컴포넌트 52개/Edge Functions 17개 반영 | AI Assistant |

---

## 🎯 최근 주요 개선사항 (2026-01-06)

### ✅ 개발/배포 환경 자동 분리
- `import.meta.env.DEV` 조건으로 개발 전용 UI 자동 제외
- 테스트 버튼, 디버깅 도구가 프로덕션에 노출되지 않음
- LoginPageNew, ProfilePage, MasterContentDetailPage 등에 적용 완료

### ✅ iOS Safari 렌더링 최적화
- `transform-gpu` 클래스로 `border-radius` 이슈 해결
- 맛보기 카드, 이미지 컨테이너 등 적용 완료
- iOS Safari 실제 기기 테스트 완료

### ✅ 타로 서비스 통합
- 타로 카드 섞기, 선택, 결과 페이지 추가
- 사주/타로 통합 운세 서비스로 확장
- AI 타로 해석 생성 기능 완료

### ✅ 하단 고정 CTA 리팩토링
- 모바일 최적화된 하단 CTA 컴포넌트 개선
- 일관된 사용자 경험 제공

### ✅ Edge Functions 확장
- 총 17개 Edge Functions 운영 중
- AI 생성 8개, 쿠폰 관리 4개, 사용자 관리 2개, 알림 1개, 기타 2개

---

## 📚 추가 참고 문서

- **[README.md](./README.md)** - 프로젝트 개요 및 빠른 시작
- **[AI_ONBOARDING.md](./AI_ONBOARDING.md)** - AI 작업 가이드 (필독!)
- **[DECISIONS.md](./DECISIONS.md)** - 아키텍처 결정 기록
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - DB 스키마 상세
- **[components-inventory.md](./components-inventory.md)** - 컴포넌트 목록 (52개)
- **[supabase/EDGE_FUNCTIONS_GUIDE.md](./supabase/EDGE_FUNCTIONS_GUIDE.md)** - Edge Functions 가이드 (17개)
- **[supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md](./supabase/DATABASE_TRIGGERS_AND_FUNCTIONS.md)** - Database Triggers & Functions

---

**문서 버전**: 1.2.0  
**최종 업데이트**: 2026-01-06  
**문서 끝**
