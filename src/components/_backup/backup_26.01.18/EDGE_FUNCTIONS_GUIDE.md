# 📡 Edge Functions 가이드

> **프로젝트**: 나다운세 (운세 서비스)
> **총 함수 수**: 21개
> **최종 업데이트**: 2026-01-17
> **필수 문서**: [CLAUDE.md](../../CLAUDE.md) - 개발 규칙

---

## 📋 목차

1. [개요](#-개요)
2. [기능별 분류](#-기능별-분류)
3. [함수 간 관계도](#-함수-간-관계도)
4. [AI 생성 Functions](#-ai-생성-functions-8개)
5. [쿠폰 관리 Functions](#-쿠폰-관리-functions-4개)
6. [사용자 관리 Functions](#-사용자-관리-functions-2개)
7. [알림 Functions](#-알림-functions-1개)
8. [결제/환불 Functions](#-결제환불-functions-3개)
9. [모니터링 Functions](#-모니터링-functions-1개)
10. [호출 플로우](#-호출-플로우)
11. [디버깅 팁](#-디버깅-팁)

---

## 🎯 개요

### Edge Functions 통계

| 카테고리 | 함수 수 | 비율 | 주요 기술 |
|---------|--------|------|----------|
| 🤖 **AI 생성** | 8개 | 38% | OpenAI GPT, Gemini |
| 🎟️ **쿠폰 관리** | 4개 | 19% | Supabase DB |
| 👤 **사용자/콘텐츠 관리** | 2개 | 10% | JWT 인증, RLS |
| 📨 **알림** | 1개 | 5% | TalkDream API (카카오 알림톡) |
| 💳 **결제/환불** | 3개 | 14% | PortOne API, PostgreSQL Function |
| 📊 **모니터링** | 1개 | 5% | Sentry, Slack Webhook |
| 🔧 **콘텐츠 생성 관리** | 2개 | 9% | OpenAI, Gemini 통합 |

---

## 🗂️ 기능별 분류

### 1️⃣ **쿠폰** (4개)

1. `issue-welcome-coupon` - 웰컴 쿠폰 발급 (신규 가입자)
2. `issue-revisit-coupon` - 재방문 쿠폰 발급
3. `get-available-coupons` - 사용 가능한 쿠폰 조회
4. `apply-coupon-to-order` - 주문에 쿠폰 적용

---

### 2️⃣ **콘텐츠 생성 (AI)** (8개)

#### 무료 콘텐츠 (1개)
5. `generate-free-preview` - 무료 콘텐츠 미리보기 생성 (GPT-4.1-nano)

#### 유료 콘텐츠 - 사주 (2개)
6. `generate-saju-preview` - 사주 미리보기 생성 (GPT-5.1)
7. `generate-saju-answer` - 사주 답변 생성 (실제 사주 데이터 활용, GPT-5.1)

#### 유료 콘텐츠 - 타로 (2개)
8. `generate-tarot-preview` - 타로 미리보기 생성 (GPT-4.1)
9. `generate-tarot-answer` - 타로 답변 생성 (GPT-4.1)

#### 유료 콘텐츠 - 통합 (1개)
10. `generate-content-answers` - 콘텐츠 답변 병렬 생성 (주문 완료 후)

#### 썸네일/이미지 (2개)
11. `generate-image-prompt` - 이미지 프롬프트 생성 (GPT-5-nano)
12. `generate-thumbnail` - 썸네일 이미지 생성 (Gemini 2.5 Flash Image)

---

### 3️⃣ **마스터 콘텐츠 관리** (2개)

13. `master-content` - 마스터 콘텐츠 CRUD API (권한 검증)
14. `generate-master-content` - 마스터 콘텐츠 전체 생성 (백그라운드)

---

### 4️⃣ **알림** (1개)

15. `send-alimtalk` - 알림톡 발송 (TalkDream API, 재시도 로직 포함)

---

### 5️⃣ **사용자 관리** (1개)

16. `users` - 사용자 조회/생성 API (RLS 대신 권한 검증)

---

### 6️⃣ **결제/환불** (3개)

17. `payment-webhook` - 포트원 결제 웹훅 검증
18. `process-payment` - 결제 트랜잭션 원자적 처리
19. `process-refund` - 환불 처리 (쿠폰 복원 포함)

---

### 7️⃣ **모니터링** (1개)

20. `sentry-slack-webhook` - Sentry 이벤트를 Slack으로 중계

---

### 8️⃣ **콘텐츠 생성 관리** (2개)

21. `generate-master-content` - 마스터 콘텐츠 전체 생성 (백그라운드, 모든 AI 통합)
22. `server` - 서버 상태 확인

---

## 🔗 함수 간 관계도

### 유료 콘텐츠 생성 플로우

```
결제 완료
    ↓
generate-content-answers (병렬 처리)
    ├─→ generate-saju-answer (사주 답변)
    ├─→ generate-tarot-answer (타로 답변)
    └─→ send-alimtalk (완료 알림)
```

### 마스터 콘텐츠 생성 플로우

```
마스터 콘텐츠 작성
    ↓
master-content (DB 저장)
    ↓
generate-master-content (백그라운드)
    ├─→ generate-image-prompt (프롬프트 생성)
    ├─→ generate-thumbnail (썸네일 생성)
    ├─→ generate-saju-preview (사주 미리보기)
    └─→ generate-tarot-preview (타로 미리보기)
```

### 쿠폰 플로우

```
신규 가입
    ↓
issue-welcome-coupon (웰컴 쿠폰 발급)

재방문 (7일 후)
    ↓
issue-revisit-coupon (재방문 쿠폰 발급)

결제 시
    ↓
get-available-coupons (쿠폰 조회)
    ↓
apply-coupon-to-order (쿠폰 적용)
```

### 결제/환불 플로우 (NEW!)

```
PortOne 결제 완료
    ↓
payment-webhook (서버 간 검증)
    ├─→ 결제 금액 검증
    ├─→ orders.webhook_verified_at 기록
    └─→ process-payment (트랜잭션 처리)
            ├─→ orders.pstatus = 'paid'
            └─→ user_coupons.is_used = true

환불 요청
    ↓
process-refund (환불 처리)
    ├─→ PortOne 환불 API 호출
    ├─→ orders.pstatus = 'refunded'
    └─→ user_coupons.is_used = false (쿠폰 복원)
```

---

## 🤖 AI 생성 Functions (8개)

### 1. `generate-free-preview`

**역할**: 무료 콘텐츠 AI 답변 생성 (GPT-4.1-nano)

**호출 시점**: 
- 무료 콘텐츠 사주 입력 완료 후
- `FreeBirthInfoInput.tsx` → `FreeContentService.requestGeneration()`

**입력**:
```typescript
{
  contentId: number,           // 콘텐츠 ID
  sajuRecordId?: string,       // 사주 레코드 ID (로그인 시)
  sajuData?: SajuData          // 사주 데이터 (로그아웃 시)
}
```

**출력**:
- `free_content_answers` 테이블에 답변 저장
- 로그인: DB에 영구 저장
- 로그아웃: localStorage 캐시 (임시 ID)

**AI 모델**: OpenAI GPT-4.1-nano (빠르고 저렴)

**사주 API 연동** (2026-01-14 추가):
- `SAJU_API_KEY` 환경변수로 Stargio 사주 API 호출
- 상세 사주 데이터(격국, 일주, 대운 등)를 AI 프롬프트에 포함
- 3회 재시도 로직 (1초, 2초 간격)
- API 실패 시 기본 생년월일 정보로 graceful degradation

**플로우**:
```
FreeBirthInfoInput → FreeContentService
  → generate-free-preview (Edge Function)
  → Stargio 사주 API (상세 데이터 조회)
  → OpenAI API (사주 데이터 포함 프롬프트)
  → free_content_answers 저장
  → FreeContentLoading (폴링)
  → FreeSajuDetail (결과)
```

---

### 2. `generate-master-content`

**역할**: 유료 콘텐츠 AI 답변 생성 (Claude-3.5-Sonnet)

**호출 시점**: 
- 결제 완료 후 사주 입력/선택 완료 시
- `BirthInfoInput.tsx` 또는 `SajuSelectPage.tsx`

**입력**:
```typescript
{
  contentId: number,           // 콘텐츠 ID
  orderId: string,             // 주문 ID
  sajuRecordId: string         // 사주 레코드 ID
}
```

**출력**:
- `content_answers` 테이블에 답변 저장
- `orders.ai_generation_completed = true` 업데이트

**AI 모델**: Anthropic Claude-3.5-Sonnet (고품질)

**플로우**:
```
BirthInfoInput → generate-master-content (Edge Function)
  → Anthropic API
  → content_answers 저장
  → orders 업데이트
  → LoadingPage (폴링)
  → SajuResultPage (결과)
```

---

### 3. `generate-content-answers`

**역할**: 유료 콘텐츠 답변 병렬 생성 (주문 완료 후)

**호출 시점**:
- 결제 완료 후 사주 입력/선택 완료 시
- `BirthInfoInput.tsx` 또는 `SajuSelectPage.tsx`

**입력**:
```typescript
{
  contentId: number,           // 콘텐츠 ID
  orderId: string,             // 주문 ID
  sajuRecordId: string,        // 사주 레코드 ID
  sajuApiData?: SajuApiData    // ⭐ 프론트엔드에서 전달받은 사주 데이터 (NEW!)
}
```

**⭐ 사주 API 백엔드 서버 직접 호출 (최종 해결) (2026-01-13)**:
- **문제**: Edge Function에서 Stargio 사주 API 호출 시 HTTP 200이지만 빈 데이터 `{}` 반환
- **원인**: API 서버가 서버 사이드 요청을 실제 브라우저 요청과 구분하여 차단
- **최종 해결**: Edge Function에서 `SAJU_API_KEY` 환경변수 사용하여 서버 직접 호출 (IP 화이트리스트 + 키 인증)
- **핵심 파일**: `supabase/functions/generate-content-answers/index.ts` (96-174번 줄)

**로직** (96-174번 줄):
```typescript
// SAJU_API_KEY 가져오기 (줄바꿈 제거)
const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
if (!sajuApiKey) {
  throw new Error('사주 API 키가 설정되지 않았습니다.')
}

// 날짜 포맷 변환
const birthday = dateOnly + timeOnly  // YYYYMMDDHHmm

const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=false&gender=${gender}&apiKey=${sajuApiKey}`

// 최대 3번 재시도
for (let sajuAttempt = 1; sajuAttempt <= 3; sajuAttempt++) {
  const sajuResponse = await fetch(sajuApiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
      'Origin': 'https://nadaunse.com',
      'Referer': 'https://nadaunse.com/',
      // ... 브라우저 헤더
    }
  })

  if (sajuResponse.ok && cachedSajuData && Object.keys(cachedSajuData).length > 0) {
    console.log('✅ 사주 API 호출 성공')
    break
  }
}
```

**출력**:
- `order_results` 테이블에 답변 저장
- `orders.ai_generation_completed = true` 업데이트

**⭐ 알림톡 중복 발송 방지 (2026-01-14 추가)**:
- 병렬 호출 시 알림톡이 2번 발송되는 문제 해결
- `alimtalk_logs` 테이블에서 기존 발송 기록 확인 후 발송
- `status = 'success'` 레코드 존재 시 스킵

```typescript
// 알림톡 발송 전 중복 체크
const { data: existingAlimtalk } = await supabase
  .from('alimtalk_logs')
  .select('id, status')
  .eq('order_id', orderId)
  .eq('status', 'success')
  .limit(1)

if (existingAlimtalk?.length > 0) {
  console.log('⏭️ 이미 알림톡이 발송됨. 중복 발송 스킵')
} else {
  // 알림톡 발송 진행
}
```

**⭐ 타로 카드 이름 일관성 보장 (2026-01-16 추가)**:
- 타로 풀이 생성 시 사용자가 선택한 카드 이름을 우선 사용
- `order_results.tarot_card_name`에 저장된 값을 먼저 확인
- 카드명이 없을 경우에만 `master_content_questions.tarot_cards` 또는 AI 랜덤 선택

**문제**:
- 사용자가 선택한 카드(예: "The High Priestess")와 AI 생성 결과의 카드(예: "Three of Wands")가 불일치
- `master_content_questions.tarot_cards`가 null이라 AI가 랜덤으로 카드 선택

**해결** (291-324번 줄):
```typescript
// 타로 풀이 생성 전 사용자 선택 카드 확인
let selectedTarotCard = question.tarot_cards || null;

const { data: existingCard } = await supabase
  .from('order_results')
  .select('tarot_card_name')
  .eq('order_id', orderId)
  .eq('question_id', question.id)
  .single();

if (existingCard?.tarot_card_name) {
  selectedTarotCard = existingCard.tarot_card_name;
  console.log(`🎴 [타로] 사용자가 선택한 카드 사용: ${selectedTarotCard}`);
}

// AI에 선택된 카드 전달
response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/generate-tarot-answer`, {
  body: JSON.stringify({
    tarotCards: selectedTarotCard
  })
})
```

**영향**:
- 타로 결과 페이지: 타이틀과 내용의 카드명 일치 ✅
- 재생성: 기존 선택 카드 유지 ✅

---

### 4. `generate-saju-preview`

**역할**: 사주 미리보기 생성 (GPT-5.1)

**호출 시점**: 
- 마스터 콘텐츠 생성 페이지에서 미리보기 요청
- `MasterContentCreate.tsx`

**입력**:
```typescript
{
  contentType: 'saju',
  questionText: string,        // 질문 텍스트
  sajuInfo: string            // 사주 정보 (예시)
}
```

**출력**:
```typescript
{
  preview: string              // AI 생성 답변 미리보기
}
```

**AI 모델**: OpenAI GPT-5.1

---

### 5. `generate-saju-answer`

**역할**: 사주 개별 질문 답변 생성

**차이점**: `generate-saju-preview`는 미리보기, 이건 실제 답변

**사용처**: 마스터 콘텐츠 질문별 답변 생성 시

---

### 6. `generate-tarot-preview`

**역할**: 타로 미리보기 생성 (GPT-4.1)

**호출 시점**: 
- 마스터 콘텐츠 생성 페이지에서 타로 미리보기 요청
- `MasterContentCreate.tsx`

**입력**:
```typescript
{
  contentType: 'tarot',
  questionText: string,
  tarotCards: string[]         // 타로 카드 목록
}
```

**출력**:
```typescript
{
  preview: string              // AI 생성 타로 답변 미리보기
}
```

**AI 모델**: OpenAI GPT-4.1

---

### 7. `generate-tarot-answer`

**역할**: 타로 개별 질문 답변 생성

**차이점**: `generate-tarot-preview`는 미리보기, 이건 실제 답변

**사용처**: 마스터 콘텐츠 질문별 답변 생성 시

---

### 8. `generate-image-prompt`

**역할**: 썸네일 생성용 이미지 프롬프트 생성 (GPT-5-nano)

**호출 시점**: 
- 마스터 콘텐츠 썸네일 생성 시
- `MasterContentDetail.tsx` → "이미지 다시 만들기" 버튼

**입력**:
```typescript
{
  contentDescription: string   // 콘텐츠 설명 텍스트
}
```

**출력**:
```typescript
{
  prompt: string               // 이미지 생성용 프롬프트
}
```

**플로우**:
```
MasterContentDetail → generate-image-prompt
  → OpenAI API (프롬프트 생성)
  → generate-thumbnail (이미지 생성)
  → Supabase Storage에 저장
```

**AI 모델**: OpenAI GPT-5-nano

---

### 9. `generate-thumbnail`

**역할**: 썸네일 이미지 생성 (Google Gemini 2.5 Flash Image)

**호출 시점**: 
- `generate-image-prompt` 이후 자동 호출
- 마스터 콘텐츠 썸네일 생성 시

**입력**:
```typescript
{
  prompt: string,              // generate-image-prompt의 출력
  referenceImageUrl: string    // Supabase Storage의 레퍼런스 이미지
}
```

**출력**:
```typescript
{
  imageUrl: string             // Supabase Storage URL
}
```

**이미지 크기**: 391x270px (13:9 비율)

**AI 모델**: Google Gemini 2.5 Flash Image (이미지 생성)

**레퍼런스**: `assets/ref.png.png` (아기 백조 일러스트)

---

## 🎟️ 쿠폰 관리 Functions (4개)

### 1. `get-available-coupons`

**역할**: 사용 가능한 쿠폰 목록 조회

**호출 시점**: 
- 결제 페이지 진입 시
- `PaymentNew.tsx` → `useEffect` (초기 로드)

**메서드**: `GET`

**입력**:
```typescript
// Query Parameter
?user_id=xxx-xxx-xxx
```

**출력**:
```typescript
{
  success: boolean,
  coupons: UserCoupon[]
}

interface UserCoupon {
  id: string,
  user_id: string,
  coupon_name: string,
  discount_amount: number,
  is_used: boolean,
  issued_at: string,
  expires_at: string
}
```

**정렬**: `discount_amount` 내림차순 (최대 할인 먼저)

**필터**: `is_used = false`만 반환

**플로우**:
```
PaymentNew → get-available-coupons
  → user_coupons 테이블 조회
  → 사용 가능한 쿠폰 목록 반환
  → CouponBottomSheetNew에 표시
```

---

### 2. `issue-welcome-coupon`

**역할**: 웰컴 쿠폰 발급 (첫 회원가입 시)

**호출 시점**: 
- 회원가입 완료 직후
- `LoginPageNew.tsx` → OAuth 콜백 후

**입력**:
```typescript
{
  user_id: string              // 새 사용자 ID
}
```

**출력**:
```typescript
{
  success: boolean,
  coupon?: UserCoupon,
  error?: string
}
```

**쿠폰 정보**:
- 이름: "웰컴 쿠폰"
- 할인 금액: 3,000원
- 유효기간: 발급일로부터 30일

**중복 방지**: 이미 웰컴 쿠폰을 받은 사용자는 재발급 불가

**플로우**:
```
회원가입 → issue-welcome-coupon
  → user_coupons 테이블에 INSERT
  → 웰컴 쿠폰 발급 완료
```

---

### 3. `issue-revisit-coupon`

**역할**: 재방문 쿠폰 발급 (프로모션 시)

**호출 시점**: 
- 관리자가 특정 이벤트로 발급
- 또는 자동 발급 로직 (예: 30일 후 재방문 시)

**입력**:
```typescript
{
  user_id: string,
  coupon_name?: string,        // 기본값: "재방문 쿠폰"
  discount_amount?: number     // 기본값: 2,000원
}
```

**출력**:
```typescript
{
  success: boolean,
  coupon?: UserCoupon,
  error?: string
}
```

**쿠폰 정보**:
- 이름: "재방문 쿠폰" (커스터마이즈 가능)
- 할인 금액: 2,000원 (커스터마이즈 가능)
- 유효기간: 발급일로부터 30일

---

### 4. `apply-coupon-to-order`

**역할**: 주문에 쿠폰 적용 (사용 처리)

**호출 시점**: 
- 결제 완료 직후
- `PaymentNew.tsx` → 결제 성공 콜백

**입력**:
```typescript
{
  user_coupon_id: string,      // 사용할 쿠폰 ID
  order_id: string             // 주문 ID
}
```

**출력**:
```typescript
{
  success: boolean,
  error?: string
}
```

**로직**:
1. `user_coupons` 테이블 업데이트:
   - `is_used = true`
   - `used_at = now()`
   - `used_order_id = order_id`

**플로우**:
```
결제 완료 → apply-coupon-to-order
  → user_coupons 업데이트
  → 쿠폰 사용 처리 완료
```

---

## 👤 사용자 관리 Functions (2개)

### 1. `users`

**역할**: 사용자 조회/생성 (RLS 우회)

**호출 시점**: 
- OAuth 로그인 콜백 시
- `AuthCallback.tsx` → 사용자 정보 저장

**메서드**: `POST`

**입력**:
```typescript
{
  action: 'get_or_create' | 'get' | 'create',
  user_data?: {
    email?: string,
    name?: string,
    avatar_url?: string,
    provider?: string,           // 'kakao' | 'google'
    nickname?: string,
    profile_image?: string
  }
}
```

**출력**:
```typescript
{
  success: boolean,
  user?: User,
  error?: string
}
```

**인증**: JWT 토큰 필수 (Authorization 헤더)

**RLS 우회**: Service Role Key 사용하여 `users` 테이블 직접 접근

**플로우**:
```
OAuth 콜백 → users (Edge Function)
  → JWT 검증
  → users 테이블 조회/생성
  → 사용자 정보 반환
```

---

### 2. `master-content`

**역할**: 마스터 콘텐츠 생성 (RLS 우회)

**호출 시점**: 
- 마스터 콘텐츠 생성 페이지에서 저장 시
- `MasterContentCreate.tsx` → "저장하기" 버튼

**메서드**: `POST`

**입력**:
```typescript
{
  action: 'create',
  content_data: {
    content_type: 'paid' | 'free',
    category_main: string,       // '사주', '타로', '궁합' 등
    category_sub: string,        // '신년운세', '연애운' 등
    title: string,
    questioner_info?: string,
    description?: string,
    user_concern?: string,
    price_original: number,
    price_discount: number,
    discount_rate: number,
    status?: string,             // 'draft' | 'published'
    view_count?: number,
    weekly_clicks?: number
  },
  questions: [
    {
      question_order: number,
      question_text: string,
      question_type: 'saju' | 'tarot'
    }
  ]
}
```

**출력**:
```typescript
{
  success: boolean,
  content_id?: number,
  error?: string
}
```

**로직**:
1. `master_contents` 테이블에 콘텐츠 INSERT
2. `master_content_questions` 테이블에 질문들 INSERT
3. 트랜잭션으로 원자성 보장

**인증**: JWT 토큰 필수 (관리자만 접근)

**RLS 우회**: Service Role Key 사용

---

## 📨 알림 Functions (1개)

### 1. `send-alimtalk`

**역할**: 카카오 알림톡 발송 (TalkDream API)

**호출 시점**:
- AI 생성 완료 후 자동 발송
- `generate-content-answers` 완료 후

**입력**:
```typescript
{
  orderId: string,             // 주문 ID
  userId: string,              // 사용자 ID
  mobile: string,              // 수신 전화번호 (010-XXXX-XXXX)
  customerName: string,        // 고객 이름 (템플릿 변수)
  contentId: number            // 콘텐츠 ID
}
```

**출력**:
```typescript
{
  success: boolean,
  messageId?: string,          // TalkDream 메시지 ID
  logId?: string,              // alimtalk_logs 레코드 ID
  error?: string,
  errorCode?: string
}
```

**템플릿 정보**:
- **템플릿 ID**: `10002` (구매 결과 안내)
- **검수 승인일**: 2026-01-08
- **Service No**: `2500109900`

**메시지 내용**:
```
{고객명}님, 구매하신 운세가 준비됐어요 🎉

오늘도 자신에게, 수고했다 말해요
어떤 하루도 괜찮아요
천천히 가도 충분하니까요 🌙

이번엔 어떤 가능성이 기다릴까요?
지금 바로 확인해 보세요

*본 메시지는 알림톡 수신을 동의하신 분께 발송되는 정보성 메시지입니다.

나다지오소프트
010-7442-1815
```

**버튼 구성**:
| 순서 | 타입 | 버튼명 | URL |
|-----|------|--------|-----|
| 1 | AC (채널추가) | 채널 추가 | - |
| 2 | WL (웹링크) | 나만의 이야기 보기 | `/result/saju?orderId=...&contentId=...&from=purchase` |

**재시도 로직**:
- 총 4번 시도 (1회 + 3회 재시도)
- 재시도 간격: 5초, 15초, 30초
- 재시도 제외 에러:
  - `KKO_3016`: 템플릿 불일치
  - `KKO_3018`: 발송 불가
  - `KKO_3020`: 수신 차단
  - `ERR_AUTH`: 인증 오류

**로그 테이블**: `alimtalk_logs`
- 발송 전 `pending` 상태로 INSERT
- 성공 시 `success`, 실패 시 `failed` 상태 UPDATE
- `retry_count`, `error_code`, `error_message` 기록

**플로우**:
```
AI 생성 완료 → send-alimtalk
  → alimtalk_logs INSERT (pending)
  → TalkDream API 호출
  → 성공/실패에 따라 로그 UPDATE
  → 사용자 휴대폰에 알림톡 수신
  → 버튼 클릭 시 /result/saju 페이지로 이동
```

**API**: LG CNS TalkDream (알림톡 전송 서비스)

**TalkDream API 호출**:
```typescript
// Header
{
  'authToken': 'tOFI8RZQD2qibU/ggEWvqw==',
  'serverName': 'starsaju1',
  'paymentType': 'P'
}

// Body
{
  service: 2500109900,
  messageType: 'AT',
  template: '10002',
  mobile: '010XXXXXXXX',
  message: '...',
  buttons: [...]
}
```

---

## 💳 결제/환불 Functions (3개)

### 1. `payment-webhook`

**역할**: 포트원 결제 웹훅 검증 (서버 간 통신)

**호출 시점**:
- 포트원 서버에서 결제 상태 변경 시 자동 호출
- 클라이언트가 아닌 서버에서 직접 호출됨

**메서드**: `POST`

**입력**:
```typescript
{
  imp_uid: string,           // 포트원 결제 고유번호
  merchant_uid: string,      // 가맹점 주문번호
  status: string             // 결제 상태 (paid, failed, cancelled)
}
```

**출력**:
```typescript
{
  success: boolean,
  verified: boolean,         // 금액 검증 결과
  error?: string
}
```

**로직**:
1. imp_uid로 포트원 API에서 결제 정보 조회
2. DB의 orders.paid_amount와 실제 결제 금액 비교
3. 일치하면 `orders.webhook_verified_at` 기록
4. 불일치하면 에러 반환 (결제 조작 방지)

**보안**: 포트원 서버 IP 화이트리스트 또는 웹훅 서명 검증

---

### 2. `process-payment`

**역할**: 결제 트랜잭션 원자적 처리 (주문 + 쿠폰)

**호출 시점**:
- 결제 완료 후 `payment-webhook`에서 호출
- 또는 클라이언트 결제 완료 콜백에서 호출

**메서드**: `POST`

**입력**:
```typescript
{
  order_id: string,          // 주문 ID
  coupon_id?: string         // 사용한 쿠폰 ID (선택)
}
```

**출력**:
```typescript
{
  success: boolean,
  error?: string
}
```

**로직**:
PostgreSQL Function `process_payment_complete` 호출:
```sql
-- 트랜잭션 내에서 원자적 처리
BEGIN;
  UPDATE orders SET pstatus = 'paid' WHERE id = order_id;
  UPDATE user_coupons SET is_used = true, used_order_id = order_id WHERE id = coupon_id;
COMMIT;
```

**장점**:
- ✅ 주문 + 쿠폰을 단일 트랜잭션으로 처리
- ✅ 중간 상태 불가능 (원자성)
- ✅ 실패 시 자동 롤백

---

### 3. `process-refund`

**역할**: 환불 처리 (포트원 API + 쿠폰 복원)

**호출 시점**:
- 관리자 환불 요청 시
- 자동 환불 로직 (24시간 내 취소 등)

**메서드**: `POST`

**입력**:
```typescript
{
  order_id: string,          // 주문 ID
  refund_amount: number,     // 환불 금액
  refund_reason: string      // 환불 사유
}
```

**출력**:
```typescript
{
  success: boolean,
  refund_id?: string,        // 포트원 환불 ID
  error?: string
}
```

**로직**:
1. imp_uid로 포트원 환불 API 호출
2. PostgreSQL Function `process_refund` 호출:
   ```sql
   BEGIN;
     UPDATE orders SET
       pstatus = 'refunded',
       refund_amount = amount,
       refund_reason = reason,
       refunded_at = NOW()
     WHERE id = order_id;

     -- 쿠폰 복원
     UPDATE user_coupons SET
       is_used = false,
       used_order_id = NULL
     WHERE used_order_id = order_id;
   COMMIT;
   ```

**장점**:
- ✅ 환불 시 쿠폰 자동 복원
- ✅ 환불 이력 추적 (금액, 사유, 일시)
- ✅ 포트원 환불 API 연동

---

## 📊 모니터링 Functions (1개)

### 1. `sentry-slack-webhook`

**역할**: Sentry 에러 이벤트를 Slack으로 중계

**호출 시점**:
- Sentry에서 에러/이슈 발생 시 자동 호출
- Sentry Integration Webhook으로 설정

**메서드**: `POST`

**입력**:
```typescript
{
  // Sentry webhook payload
  action: string,           // "created", "resolved", "assigned" 등
  data: {
    issue: {
      id: string,
      title: string,
      culprit: string,      // 에러 발생 위치
      level: string,        // "error", "warning", "info"
      metadata: object
    }
  }
}
```

**출력**:
```typescript
{
  success: boolean,
  error?: string
}
```

**로직**:
1. Sentry 이벤트 페이로드 파싱
2. Slack 메시지 포맷 변환 (색상, 필드, 링크 등)
3. SLACK_WEBHOOK_URL로 메시지 전송
4. 전송 성공/실패 로깅

**Slack 메시지 형식**:
- 에러 레벨에 따른 색상 구분 (error: 빨강, warning: 노랑)
- 에러 제목, 발생 위치, Sentry 링크 포함
- 타임스탬프, 환경 정보 표시

**환경 변수**:
- `SLACK_WEBHOOK_URL`: Slack Incoming Webhook URL

**장점**:
- ✅ 실시간 에러 알림
- ✅ Sentry와 Slack 통합
- ✅ 에러 정보 시각화

---

## 📈 호출 플로우

### 무료 콘텐츠 플로우

```
1. 사주 입력 (FreeBirthInfoInput)
   ↓
2. generate-free-preview 호출
   ↓ (OpenAI GPT-4.1-nano)
   ↓
3. free_content_answers 저장
   ↓
4. FreeContentLoading (폴링 2초마다)
   ↓
5. FreeSajuDetail (결과 표시)
```

**호출 함수**: 1개
- `generate-free-preview`

---

### 유료 콘텐츠 플로우

```
1. 회원가입 (OAuth)
   ↓
2. users 호출 (사용자 정보 저장)
   ↓
3. issue-welcome-coupon 호출 (웰컴 쿠폰 발급)
   ↓
4. 결제 페이지 (PaymentNew)
   ↓
5. get-available-coupons 호출 (쿠폰 목록 조회)
   ↓
6. 결제 완료 (PortOne)
   ↓
7. apply-coupon-to-order 호출 (쿠폰 사용 처리)
   ↓
8. 사주 입력/선택
   ↓
9. generate-master-content 호출
   ↓ (Anthropic Claude-3.5-Sonnet)
   ↓
10. content_answers 저장
   ↓
11. send-alimtalk 호출 (알림톡 발송)
   ↓
12. LoadingPage (폴링 2초마다)
   ↓
13. SajuResultPage (결과 표시)
```

**호출 함수**: 5개
- `users`
- `issue-welcome-coupon`
- `get-available-coupons`
- `apply-coupon-to-order`
- `generate-master-content`
- `send-alimtalk`

---

### 마스터 콘텐츠 생성 플로우

```
1. 콘텐츠 정보 입력 (MasterContentCreate)
   ↓
2. 미리보기 요청
   ↓
3. generate-saju-preview 또는 generate-tarot-preview 호출
   ↓ (OpenAI GPT-5.1 또는 GPT-4.1)
   ↓
4. AI 답변 미리보기 표시
   ↓
5. "저장하기" 클릭
   ↓
6. master-content 호출 (콘텐츠 + 질문 저장)
   ↓
7. "이미지 다시 만들기" 클릭 (선택)
   ↓
8. generate-image-prompt 호출
   ↓ (OpenAI GPT-5-nano)
   ↓
9. generate-thumbnail 호출
   ↓ (Google Gemini 2.5 Flash Image)
   ↓
10. Supabase Storage에 썸네일 저장
```

**호출 함수**: 최대 4개
- `generate-saju-preview` 또는 `generate-tarot-preview`
- `master-content`
- `generate-image-prompt` (선택)
- `generate-thumbnail` (선택)

---

## 🔐 보안

### API 키 관리
- ✅ 모든 API 키는 Supabase Secrets에 저장
- ✅ 환경변수:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `TALKDREAM_AUTH_TOKEN`

### CORS 설정
- ✅ 모든 Edge Functions에 CORS 헤더 포함
- ✅ OPTIONS 메서드 처리 (Preflight)

### 인증
- ✅ JWT 토큰 검증 (Authorization 헤더)
- ✅ RLS 우회는 Service Role Key 사용

---

## 📝 함수 요약 테이블

| 함수명 | 카테고리 | 메서드 | AI 모델 | 호출 시점 |
|--------|---------|--------|---------|----------|
| `generate-free-preview` | 🤖 AI 생성 | POST | GPT-4.1-nano | 무료 사주 입력 후 |
| `generate-master-content` | 🤖 AI 생성 | POST | Claude-3.5-Sonnet | 유료 사주 입력 후 |
| `generate-content-answers` | 🤖 AI 생성 | POST | - | (deprecated?) |
| `generate-saju-preview` | 🤖 AI 생성 | POST | GPT-5.1 | 마스터 콘텐츠 미리보기 |
| `generate-saju-answer` | 🤖 AI 생성 | POST | GPT-5.1 | 사주 질문별 답변 |
| `generate-tarot-preview` | 🤖 AI 생성 | POST | GPT-4.1 | 타로 미리보기 |
| `generate-tarot-answer` | 🤖 AI 생성 | POST | GPT-4.1 | 타로 질문별 답변 |
| `generate-image-prompt` | 🤖 AI 생성 | POST | GPT-5-nano | 썸네일 프롬프트 생성 |
| `generate-thumbnail` | 🤖 AI 생성 | POST | Gemini 2.5 Flash Image | 썸네일 이미지 생성 |
| `get-available-coupons` | 🎟️ 쿠폰 | GET | - | 결제 페이지 진입 |
| `issue-welcome-coupon` | 🎟️ 쿠폰 | POST | - | 회원가입 후 |
| `issue-revisit-coupon` | 🎟️ 쿠폰 | POST | - | 재방문 프로모션 |
| `apply-coupon-to-order` | 🎟️ 쿠폰 | POST | - | 결제 완료 후 |
| `users` | 👤 사용자 | POST | - | OAuth 콜백 |
| `master-content` | 👤 관리 | POST | - | 콘텐츠 생성 |
| `send-alimtalk` | 📨 알림 | POST | TalkDream API | AI 생성 완료 후 |
| `payment-webhook` | 💳 결제 | POST | - | 포트원 서버 콜백 |
| `process-payment` | 💳 결제 | POST | - | 결제 완료 후 |
| `process-refund` | 💳 환불 | POST | - | 환불 요청 시 |

---

## 🐛 디버깅 팁

### Edge Function 로그 확인
```bash
# 특정 함수 로그 실시간 확인
supabase functions logs generate-master-content --tail

# 모든 함수 로그
supabase functions logs --tail
```

### 로컬 테스트
```bash
# 로컬에서 Edge Function 실행
supabase functions serve generate-free-preview --env-file .env.local

# 호출 테스트
curl -X POST http://localhost:54321/functions/v1/generate-free-preview \
  -H "Content-Type: application/json" \
  -d '{"contentId": 1, "sajuData": {...}}'
```

### 배포
```bash
# 모든 함수 배포
supabase functions deploy

# 특정 함수만 배포
supabase functions deploy generate-master-content
```

---

## 📞 문제 발생 시

| 증상 | 확인 사항 |
|------|----------|
| AI 생성 실패 | Supabase Secrets에 API 키 확인 |
| 쿠폰 조회 안 됨 | `user_coupons` 테이블 RLS 정책 확인 |
| 알림톡 미발송 | TalkDream API 키, 템플릿 ID 확인 |
| CORS 오류 | Edge Function 코드에 CORS 헤더 확인 |

---

**문서 버전**: 1.3.0
**작성자**: AI Assistant
**최종 업데이트**: 2026-01-13

### 변경 이력
| 버전 | 날짜 | 변경 내용 |
|-----|------|----------|
| 1.3.0 | 2026-01-13 | 사주 API 백엔드 서버 직접 호출 (SAJU_API_KEY 사용), IP 화이트리스트 + 키 인증 방식 |
| 1.2.0 | 2026-01-08 | 알림톡 템플릿 10002 검수 완료, 버튼 URL `/result/saju`로 변경, `server` 함수 제거 |
| 1.1.0 | 2026-01-07 | 결제/환불 Functions 추가 |
| 1.0.0 | 2026-01-06 | 초기 문서 작성 |