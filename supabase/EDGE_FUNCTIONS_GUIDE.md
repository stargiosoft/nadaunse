# 📡 Edge Functions 가이드

> **프로젝트**: 나다운세 (운세 서비스)
> **총 함수 수**: 34개
> **최종 업데이트**: 2026-03-05
> **필수 문서**: [CLAUDE.md](../../CLAUDE.md) - 개발 규칙

---

## 📋 목차

1. [개요](#-개요)
2. [기능별 분류](#-기능별-분류)
3. [함수 간 관계도](#-함수-간-관계도)
4. [AI 생성 Functions](#-ai-생성-functions-8개)
5. [AI 상담 Functions](#-ai-상담-functions-2개)
6. [쿠폰 관리 Functions](#-쿠폰-관리-functions-4개)
6. [사용자 관리 Functions](#-사용자-관리-functions-2개)
7. [알림 Functions](#-알림-functions-1개)
8. [결제/환불 Functions](#-결제환불-functions-3개)
9. [모니터링 Functions](#-모니터링-functions-1개)
10. [SEO Functions](#-seo-functions-1개)
11. [호출 플로우](#-호출-플로우)
12. [디버깅 팁](#-디버깅-팁)

---

## 🎯 개요

### Edge Functions 통계

| 카테고리 | 함수 수 | 비율 | 주요 기술 |
|---------|--------|------|----------|
| 🤖 **AI 콘텐츠 생성** | 9개 | 26% | OpenAI GPT, Gemini |
| 💬 **AI 상담** | 2개 | 6% | OpenAI GPT-4.1-mini |
| 📊 **주간 보고서** | 4개 | 12% | GPT-5.1, pg_cron, TalkDream |
| 🎟️ **쿠폰 관리** | 4개 | 13% | Supabase DB |
| 🔧 **마스터 콘텐츠 관리** | 2개 | 6% | OpenAI, Gemini 통합 |
| 📨 **알림** | 1개 | 3% | TalkDream API (카카오 알림톡) |
| 👤 **사용자 관리** | 1개 | 3% | JWT 인증, RLS |
| 💳 **결제/환불** | 3개 | 10% | PortOne API, PostgreSQL Function |
| 📊 **모니터링/통계** | 2개 | 6% | Sentry, Slack, Google Analytics |
| 🔍 **SEO** | 1개 | 3% | 동적 Sitemap 생성 |
| 🔐 **소유자 확인** | 2개 | 6% | Service Role Key, 계정 불일치 처리 |
| 🧹 **유틸리티** | 2개 | 6% | 태그 정리, Vercel 재빌드 |

**총 35개** (로컬 함수 기준)

---

## 🗂️ 기능별 분류

### 1️⃣ **쿠폰** (4개)

1. `issue-welcome-coupon` - 웰컴 쿠폰 발급 (신규 가입자)
2. `issue-revisit-coupon` - 재방문 쿠폰 발급
3. `get-available-coupons` - 사용 가능한 쿠폰 조회
4. `apply-coupon-to-order` - 주문에 쿠폰 적용

---

### 2️⃣ **AI 콘텐츠 생성** (9개)

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

#### 나다움 태그 (1개)
13. `extract-trait-tags` - 운세 답변에서 성향 태그 추출 (GPT-5-nano)
    - 태그 저장은 클라이언트에서 직접 `user_trait_tags` 테이블에 INSERT

---

### 2️⃣-② **AI 상담** (2개)

14. `generate-saju-consult` - 사주 상담 AI 답변 생성 (GPT-4.1-mini)
15. `generate-tarot-consult` - 타로 상담 AI 답변 + 카드 선택 (GPT-4.1-mini)

---

### 3️⃣ **주간 보고서** (4개)

16. `generate-weekly-report` - 개별 사용자 주간 보고서 생성 (GPT-5.1)
    - 사주 정보 + 주간 태그 + 이용 콘텐츠 기반
    - 3카드 타로 + 마음 처방 + To-Do List 생성
    - 복수 "본인" 사주 대응 (is_primary 우선, 최신순 fallback)
    - `--no-verify-jwt` 필수 (배치에서 내부 호출)

17. `generate-weekly-reports-batch` - 주간 보고서 배치 생성
    - pg_cron에서 매주 호출 (10분 간격 반복, 이어하기 패턴)
    - concurrency: 3, 2초 간격, 60초 시간 제한 (shutdown 방지)
    - `selfContinue: true` → 시간 제한 시 자기 자신 재호출 (fire-and-forget)
    - 관리자 재발송: 1회 호출로 서버 자동 처리 (브라우저 닫아도 됨)
    - 전주 태그 있는 모든 사용자 대상, 기존 보고서 있으면 스킵

18. `send-report-alimtalk` - 보고서 알림톡 발송
    - TalkDream API 사용
    - 최대 5회 재시도
    - `--no-verify-jwt` 필수 (내부 호출)

19. `get-failed-reports` - 실패 보고서 조회 (관리자용)
    - 태그 있는데 보고서 없는 사용자 조회
    - 마스터 계정 관리자 패널에서 사용

---

### 4️⃣ **마스터 콘텐츠 관리** (2개)

20. `master-content` - 마스터 콘텐츠 CRUD API (권한 검증)
21. `generate-master-content` - 마스터 콘텐츠 전체 생성 (백그라운드, 모든 AI 통합)

---

### 5️⃣ **알림** (1개)

22. `send-alimtalk` - 알림톡 발송 (TalkDream API, 재시도 로직 포함)

---

### 6️⃣ **사용자 관리** (1개)

23. `users` - 사용자 조회/생성 API (RLS 대신 권한 검증)

---

### 7️⃣ **결제/환불** (3개)

24. `payment-webhook` - 포트원 결제 웹훅 검증
25. `process-payment` - 결제 트랜잭션 원자적 처리
26. `process-refund` - 환불 처리 (쿠폰 복원 포함)

---

### 8️⃣ **모니터링/통계** (2개)

27. `sentry-slack-webhook` - Sentry 이벤트를 Slack으로 중계
28. `get-ga-stats` - Google Analytics 통계 조회 (마스터 계정 전용)

---

### 9️⃣ **SEO** (2개)

29. `generate-sitemap` - 동적 sitemap.xml 생성 (deployed 콘텐츠 자동 포함)
30. `index-now` - IndexNow 프로토콜로 검색엔진에 URL 즉시 제출 (네이버/Bing)

---

### 🔟 **소유자 확인** (2개)

31. `get-order-owner` - 유료 콘텐츠 소유자 정보 조회 (계정 불일치 처리)
32. `get-report-owner` - 주간 보고서 소유자 정보 조회 (계정 불일치 처리)

---

### 1️⃣1️⃣ **미션 리워드** (1개)

33. `grant-mission-sprout` - 태그 5개 달성 시 새싹 30개 즉시 지급 (JWT 인증 필수)
    - IP+UA SHA-256 fingerprint 생성 → 같은 기기 다른 계정 중복 수령 차단
    - `check_only=true` 모드: 지급 없이 자격만 확인 (마운트 시 사전 체크용)
    - `process_mission_reward` RPC 호출, user_id + fingerprint 이중 중복 방지

---

### 1️⃣2️⃣ **유틸리티** (2개)

34. `cleanup-unconfirmed-tags` - 미확인 태그 자동 정리 (pg_cron, 72시간 이상 미확인 태그 삭제)
35. `trigger-rebuild` - Vercel 재빌드 트리거 (Deploy Hook 호출)

---

## 🔗 함수 간 관계도

### 유료 콘텐츠 생성 플로우

```
결제 완료
    ↓
generate-content-answers (병렬 처리)
    ├─→ user_trait_tags 조회 (초개인화 데이터)
    ├─→ generate-saju-answer (사주 답변 + personalizationData)
    ├─→ generate-tarot-answer (타로 답변 + personalizationData)
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

재방문 / 미션 완료
    ↓
issue-revisit-coupon (재방문 쿠폰 또는 미션성공 쿠폰 발급)
    ※ 주간 보고서 1회차 → 미션성공쿠폰 (mission)
    ※ 주간 보고서 2회차+ → 재방문쿠폰 (revisit)

결제 시
    ↓
get-available-coupons (쿠폰 조회)
    ↓
apply-coupon-to-order (쿠폰 적용)
```

### 나다움 보고서 (주간 보고서) 플로우 (NEW!)

```
프로필 → 나의분석보고서 탭
    ↓
MyReportList: weekly_reports 목록 조회 (localStorage 캐시 5분)
    ↓
MyReportWeekly: 보고서 상세 보기
    ↓
ReportWeeklyDetail: 핵심 인사이트
    ↓
ReportWeeklyTarot: 타로 카드 뽑기
    │  ├─ user_viewed=false: 셔플 → 뽑기
    │  └─ user_viewed=true: 스킵 → 결과 페이지로
    ↓
ReportWeeklyTarotResult: 타로 결과
    ↓
ReportWeeklyMindCare: 마음 챙김 메시지
    ↓
ReportWeeklyMemo: 나에게 응원 한마디
    │  └─ 저장 시 my_report_cache 삭제 (캐시 무효화)
    ↓
CompletionCoupon: 쿠폰 발급
    │  ├─ 1회차 보고서: 미션성공쿠폰 (coupon_type: 'mission')
    │  └─ 2회차+ 보고서: 재방문쿠폰 (coupon_type: 'revisit')
    ↓
user_coupons 테이블에 쿠폰 INSERT
```

**캐시 무효화 지점**:
- `ReportWeeklyMemo.tsx`: 응원글 저장 시
- `ReportWeeklyMemoEdit` (App.tsx): 응원글 수정 시

**user_viewed 플래그**:
- `report_tarot_selections.user_viewed = true`: 실제 사용자가 카드를 뽑음
- `report_tarot_selections.user_viewed = false`: 시스템이 미리 생성한 데이터

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

**비회원 일일 제한 검증** (2026-02-06 추가):
- 비회원(`userId` 없음) 요청 시 IP+UserAgent SHA-256 fingerprint 생성
- `anonymous_free_views` 테이블에서 오늘(KST) 조회 수 확인
- 3개 이상이면 `{ success: false, error: 'DAILY_LIMIT_REACHED' }` 반환 (status 200)
- 통과 시 조회 기록 INSERT 후 AI 생성 진행
- 로그인 사용자는 무제한 (검증 스킵)

**플로우**:
```
FreeBirthInfoInput → FreeContentService
  → generate-free-preview (Edge Function)
  → [비회원] IP+UA fingerprint → anonymous_free_views 일일 제한 체크
  → Stargio 사주 API (상세 데이터 조회)
  → OpenAI API (사주 데이터 포함 프롬프트)
  → [로그인] free_content_records 저장 / [비회원] anonymous_free_views 기록
  → FreeContentLoading → FreeSajuDetail (결과)
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

**⭐ 초개인화 데이터 조회 (2026-02-09)**:
- 로그인 사용자의 `user_trait_tags`에서 최근 4주/전체 태그 + 심리 흐름 조회
- 태그가 1개 이상 있으면 `personalizationData`로 `generate-saju-answer`, `generate-tarot-answer`에 전달
- 조회 실패 시 무시하고 기본 프롬프트로 진행 (graceful degradation)

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

**역할**: 사주 개별 질문 답변 생성 (초개인화 지원)

**차이점**: `generate-saju-preview`는 미리보기, 이건 실제 답변

**사용처**: `generate-content-answers`에서 내부 호출 (질문별 병렬 처리)

**입력**:
```typescript
{
  title: string,
  description?: string,
  questionerInfo?: string,        // 질문자 상황 텍스트
  questionText: string,
  questionId?: string,
  birthDate: string,              // "1992-07-15"
  birthTime: string,              // "21:30"
  gender: string,                 // "male" | "female"
  sajuData?: object,              // 미리 가져온 사주 데이터 (API 호출 스킵)
  // ⭐ 초개인화 데이터 (선택적)
  personalizationData?: {
    recentPositiveTags: string[],   // 최근 4주 강점 태그
    recentNegativeTags: string[],   // 최근 4주 단점 태그
    allPositiveTags: string[],      // 누적 강점 태그
    allNegativeTags: string[],      // 누적 단점 태그
    recentSituationSummaries: { week: number; summary: string }[]  // 최근 4주 심리 흐름
  }
}
```

**초개인화 분기 조건**: `recentPositiveTags.length > 0 || allPositiveTags.length > 0`
- 조건 충족 시: 태그 + 심리 흐름 포함 프롬프트
- 미충족 시: 기본 프롬프트 (`questionerInfo`만 사용)

**출력**:
```typescript
{ success: true, answerText: string }
```

**AI 모델**: OpenAI GPT-5.1 (reasoning: low, verbosity: low)

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

**역할**: 타로 개별 질문 답변 생성 (초개인화 지원)

**차이점**: `generate-tarot-preview`는 미리보기, 이건 실제 답변

**사용처**: `generate-content-answers`에서 내부 호출 (질문별 병렬 처리)

**입력**:
```typescript
{
  title?: string,
  description?: string,
  questionerInfo?: string,        // 질문자 상황 텍스트
  questionText: string,
  questionId?: string,
  tarotCards?: string,             // 미리 뽑은 카드 (없으면 78장에서 랜덤)
  // ⭐ 초개인화 데이터 (선택적, generate-saju-answer와 동일 구조)
  personalizationData?: {
    recentPositiveTags: string[],
    recentNegativeTags: string[],
    allPositiveTags: string[],
    allNegativeTags: string[],
    recentSituationSummaries: { week: number; summary: string }[]
  }
}
```

**초개인화 분기 조건**: `recentPositiveTags.length > 0 || allPositiveTags.length > 0`

**출력**:
```typescript
{
  success: true,
  answerText: string,
  tarotCard: string,     // 선택된 카드명 (영문)
  imageUrl: string       // 카드 이미지 URL (Supabase Storage)
}
```

**AI 모델**: OpenAI GPT-4.1

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

### 10. `extract-trait-tags`

**역할**: 운세 콘텐츠 답변에서 나다움 성향 태그 추출 (GPT-5-nano)

**호출 시점**:
- 무료 콘텐츠: FreeResultPage 마지막 페이지 진입 시 백그라운드 호출
- 유료 콘텐츠: UnifiedResultPage에서 데이터 로드 완료 시 백그라운드 호출

**입력**:
```typescript
{
  contentAnswers: Array<{
    questionText: string,     // 질문 내용
    answerText: string        // AI 생성 답변
  }>,
  existingTags?: string[],    // 기존 저장된 태그 (중복 방지용)
  rejectedTags?: string[]     // 사용자가 거부한 태그 목록 (users.rejected_tags에서 조회)
}
```

**출력**:
```typescript
{
  success: boolean,
  tags?: Array<{
    name: string,             // 태그 이름 (예: "창의적인", "문제 해결력이 있는")
    type: 'positive' | 'negative' | 'neutral'
  }>,
  rawResponse?: Array<{
    type: '장점' | '단점',
    keywords: string[]
  }>,
  error?: string
}
```

**AI 모델**: OpenAI GPT-5-nano (빠르고 저렴)

**프롬프트 핵심**:
- 장점 2개, 단점 1개 추출 (총 3개)
- 형용사 형태로 출력 (예: "창의적인", "질투심이 많은")
- 기존 태그와 의미 중복 방지
- `rejectedTags` 목록의 태그는 절대 사용 금지 (사용자가 이전에 거부한 태그)
- '나다움'을 느낄 수 있는 구체적이고 개인화된 키워드

**플로우** (무료 콘텐츠):
```
FreeResultPage (마지막 페이지)
    ↓ 백그라운드로 extract-trait-tags 호출
    ↓ '다음' 버튼 클릭
┌─────────────────────────────────────────────┐
│ 태그 추출 완료?                             │
│   ├─ YES → /nadaum-record/:id (state: tags) │
│   └─ NO  → /product/:id/tag-loading         │
│            (로딩 후 자동 이동)              │
└─────────────────────────────────────────────┘
```

**플로우** (유료 콘텐츠):
```
UnifiedResultPage (데이터 로드 완료 시)
    ↓ 백그라운드로 extract-trait-tags 호출
    ↓ 마지막 페이지에서 '다음' 버튼 클릭
┌─────────────────────────────────────────────────┐
│ 태그 추출 완료?                                 │
│   ├─ YES → /paid/nadaum-record (state: tags)   │
│   └─ NO  → /paid/tag-loading                   │
│            (로딩 후 자동 이동)                  │
└─────────────────────────────────────────────────┘
```

---

## 💬 AI 상담 Functions (2개)

### 1. `generate-saju-consult`

**역할**: 사주 상담 AI 답변 생성 (GPT-4.1-mini)

**인증**: 로그인 유저 (`sajuRecordId`) + 비회원 (`birthInfo` 직접 전달)

**제한**: 로그인 1일 1회 (DB), 비회원 최초 1회 (fingerprint)

**`--no-verify-jwt`**: 불필요 (클라이언트 호출)

**입력**:
```typescript
{
  question: string,              // 상담 질문
  sajuRecordId?: string,         // 사주 레코드 ID (로그인 시)
  birthInfo?: object,            // 생년월일 정보 (비회원 시 직접 전달)
  userId?: string                // 사용자 ID (로그인 시)
}
```

**출력**:
```typescript
{
  success: boolean,
  result: {
    todayCore: string,           // 오늘의 핵심 메시지
    advice: string,              // 조언
    flow: string,                // 흐름
    caution: string,             // 주의사항
    overallFlow: string,         // 전체 흐름
    recommendedCategory: string  // 추천 카테고리
  }
}
```

**AI 모델**: OpenAI GPT-4.1-mini

---

### 2. `generate-tarot-consult`

**역할**: 타로 상담 AI 답변 + 카드 선택 (GPT-4.1-mini)

**인증**: 로그인 유저 (`userId`) + 비회원 (질문만으로 상담)

**제한**: 로그인 1일 1회 (DB), 비회원 최초 1회 (fingerprint)

**`--no-verify-jwt`**: 불필요 (클라이언트 호출)

**입력**:
```typescript
{
  question: string,              // 상담 질문
  userId?: string                // 사용자 ID (로그인 시)
}
```

**출력**:
```typescript
{
  success: boolean,
  result: {
    cardMessage: string,         // 카드 메시지
    currentFlow: string,         // 현재 흐름
    actionAdvice: string,        // 행동 조언
    dailySentence: string,       // 오늘의 한마디
    recommendedCategory: string  // 추천 카테고리
  },
  tarotCard: string,             // 선택된 타로 카드명
  imageUrl: string               // 카드 이미지 URL
}
```

**AI 모델**: OpenAI GPT-4.1-mini

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

**역할**: 재방문 쿠폰 또는 미션성공 쿠폰 발급

**호출 시점**:
- 주간 보고서 완료 시 (CompletionCoupon)
  - 1회차 보고서: 미션성공쿠폰 (coupon_type: 'mission')
  - 2회차 이후: 재방문쿠폰 (coupon_type: 'revisit')
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
- 재방문 쿠폰: 이름 "재방문 쿠폰", 2,000원 할인
- 미션성공 쿠폰: 이름 "미션성공쿠폰" (coupons 테이블에서 mission 타입 조회)
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

## 📊 모니터링/통계 Functions (2개)

### 1. `get-ga-stats`

**역할**: Google Analytics 4 통계 조회 (실시간/기간별)

**호출 시점**:
- 통계 대시보드 (`StatsDashboard.tsx`) 진입 시
- Master 계정 전용 페이지

**메서드**: `GET`

**입력**:
```typescript
// Query Parameters
?type=realtime    // 실시간 활성 사용자
?type=period&startDate=2026-01-01&endDate=2026-01-31  // 기간별 통계
```

**출력**:
```typescript
// 실시간
{
  success: true,
  type: 'realtime',
  realtimeActiveUsers: 42
}

// 기간별
{
  success: true,
  type: 'period',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  activeUsers: 2000,
  newUsers: 500
}
```

**환경 변수**:
- `GA_SERVICE_ACCOUNT_JSON`: Google 서비스 계정 JSON 키 (Supabase Secrets)
- `GA_PROPERTY_ID`: GA4 속성 ID (기본값: 520025356)

**인증 방식**:
- JWT 기반 OAuth 2.0 토큰 발급
- RS256 서명으로 Google OAuth API 호출
- 토큰 유효시간: 1시간

**API 엔드포인트**:
- 실시간: `analyticsdata.googleapis.com/v1beta/properties/{id}:runRealtimeReport`
- 기간별: `analyticsdata.googleapis.com/v1beta/properties/{id}:runReport`

**특이사항**:
- GA API는 endDate가 inclusive이므로, 프론트엔드에서 전달받은 날짜에서 1일 빼서 호출
- 서비스 시작일(2026-01-11) 이전 데이터는 조회 불가

---

### 2. `sentry-slack-webhook`

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

## 🔐 소유자 확인 Functions (2개)

### 1. `get-order-owner`

**역할**: 주문 소유자 정보 조회 (계정 불일치 확인용)

**호출 시점**:
- 알림톡 링크로 유료 콘텐츠 결과 페이지 접속 시
- 현재 로그인 계정과 주문 소유자가 다를 때
- `UnifiedResultPage.tsx`에서 호출

**입력**:
```typescript
{
  orderId: string              // 주문 UUID
}
```

**출력**:
```typescript
{
  success: boolean,
  exists: boolean,             // 주문 존재 여부
  owner: {
    loginProvider: string,     // 'kakao' | 'google' | 'unknown'
    maskedEmail: string,       // 'gksruf***@gmail.com'
    maskedPhone: string        // '010-****-5678'
  } | null
}
```

**마스킹 규칙**:
- 이메일: 뒤 3글자 마스킹 (`gksruf813` → `gksruf***`)
- 전화번호: 중간 4자리 마스킹 (`010-1234-5678` → `010-****-5678`)

**RLS 우회**: Service Role Key 사용 (다른 사용자 주문 조회 필요)

---

### 2. `get-report-owner`

**역할**: 주간 보고서 소유자 정보 조회 (계정 불일치 확인용)

**호출 시점**:
- 알림톡 링크로 주간 보고서 페이지 접속 시
- 현재 로그인 계정과 보고서 소유자가 다를 때
- `ReportWeeklyDetail.tsx`에서 호출

**입력**:
```typescript
{
  reportId: string             // 보고서 UUID
}
```

**출력**:
```typescript
{
  success: boolean,
  exists: boolean,             // 보고서 존재 여부
  owner: {
    loginProvider: string,     // 'kakao' | 'google' | 'unknown'
    maskedEmail: string,       // 'gksruf***@gmail.com'
    maskedPhone: string        // '010-****-5678'
  } | null
}
```

**마스킹 규칙**: `get-order-owner`와 동일

**RLS 우회**: Service Role Key 사용

---

## 🔍 SEO Functions (2개)

### 1. `generate-sitemap`

**역할**: 동적 sitemap.xml 생성 (deployed 콘텐츠 자동 포함)

**호출 시점**:
- `/sitemap.xml` 요청 시 (Vercel rewrite로 연결)
- Google 크롤러 또는 사용자가 sitemap.xml 접속 시

**메서드**: `GET`

**입력**: 없음 (파라미터 불필요)

**출력**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nadaunse.com/</loc>
    <lastmod>2026-01-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://nadaunse.com/product/{id}</loc>
    <lastmod>2026-01-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- ... -->
</urlset>
```

**로직**:
```typescript
// DB에서 deployed 상태 콘텐츠 조회 (유료 + 무료, 인기순)
const { data: contents } = await supabase
  .from('master_contents')
  .select('id, content_type, updated_at')
  .eq('status', 'deployed')
  .order('weekly_clicks', { ascending: false })
  .order('updated_at', { ascending: false });

// URL 경로 생성
// - 유료 콘텐츠: /product/:id
// - 무료 콘텐츠: /free/content/:id
```

**우선순위 (priority)**:
| 페이지 유형 | priority | changefreq |
|------------|----------|------------|
| 홈페이지 (`/`) | 1.0 | daily |
| 유료 콘텐츠 (`/product/:id`) | 0.9 | weekly |
| 무료 콘텐츠 (`/free/content/:id`) | 0.8 | weekly |
| 약관/정책 페이지 | 0.3 | monthly |

**캐싱**:
- `Cache-Control: public, max-age=3600, s-maxage=3600` (1시간)
- 에러 시 5분만 캐싱 (`max-age=300`)
- Vercel Edge에서 캐싱되므로 매 요청마다 Edge Function 호출 안 함

**Vercel 설정** (`vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "https://kcthtpmxffppfbkjjkub.supabase.co/functions/v1/generate-sitemap"
    }
  ]
}
```

**배포 명령어**:
```bash
# 스테이징
npx supabase functions deploy generate-sitemap --project-ref hyltbeewxaqashyivilu --no-verify-jwt

# 프로덕션
npx supabase functions deploy generate-sitemap --project-ref kcthtpmxffppfbkjjkub --no-verify-jwt
```

**주의사항**:
- `--no-verify-jwt` 필수: sitemap.xml은 인증 없이 접근 가능해야 함
- 정적 `public/sitemap.xml` 파일이 있으면 Vercel이 우선 서빙하므로 삭제 필요

**테스트**:
- 프로덕션: `https://nadaunse.com/sitemap.xml`
- 스테이징 (직접 호출): `https://hyltbeewxaqashyivilu.supabase.co/functions/v1/generate-sitemap`

**장점**:
- ✅ 콘텐츠 배포 시 자동으로 sitemap에 반영
- ✅ 정적 파일 관리 불필요
- ✅ 인기순 정렬로 중요 페이지 우선 노출
- ✅ 1시간 캐싱으로 Supabase 비용 절감

### 2. `index-now`

**역할**: IndexNow 프로토콜로 검색엔진(네이버/Bing/Yandex)에 URL 변경 즉시 알림

**호출 시점**:
- 콘텐츠 배포/업데이트 후
- Vercel 빌드 완료 후
- 관리자가 수동 호출

**메서드**: `POST`

**입력**:
```json
{
  "urls": ["/product/123", "/free/content/456", "/"]
}
```
- `urls`: 제출할 URL 배열 (상대 경로 또는 절대 URL)

**출력**:
```json
{
  "success": true,
  "submitted": 3,
  "urls": ["https://nadaunse.com/product/123", ...],
  "status": 200
}
```

**로직**:
1. URL 목록을 절대 URL로 정규화
2. `api.indexnow.org`에 POST 요청 (host, key, keyLocation, urlList)
3. 응답 코드(200/202: 성공, 400/403/422/429: 실패) 처리

**환경변수**: `INDEXNOW_API_KEY` (Supabase Dashboard에서 설정)

**키 검증 파일**: `public/e32ae15605104f698d20fde140bc8e83.txt`
- 빌드 시 `https://nadaunse.com/e32ae15605104f698d20fde140bc8e83.txt`로 서빙됨

**배포 명령어**:
```bash
# 스테이징
npx supabase functions deploy index-now --project-ref hyltbeewxaqashyivilu

# 프로덕션
npx supabase functions deploy index-now --project-ref kcthtpmxffppfbkjjkub
```

**테스트**:
```bash
curl -X POST https://hyltbeewxaqashyivilu.supabase.co/functions/v1/index-now \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"urls": ["/"]}'
```

**한계**:
- 구글은 IndexNow 미지원 (Google Search Console에서 별도 URL 검사 필요)
- 제출해도 색인 보장은 아님 (검색엔진 판단에 따름)

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
| `generate-sitemap` | 🔍 SEO | GET | - | /sitemap.xml 요청 시 |
| `index-now` | 🔍 SEO | POST | - | 콘텐츠 배포/업데이트 후 |
| `extract-trait-tags` | 🤖 AI 생성 | POST | GPT-5-nano | 운세 결과 페이지 진입 시 |
| `generate-saju-consult` | 💬 AI 상담 | POST | GPT-4.1-mini | 사주 상담 질문 시 |
| `generate-tarot-consult` | 💬 AI 상담 | POST | GPT-4.1-mini | 타로 상담 질문 시 |
| `get-ga-stats` | 📊 통계 | GET | GA Data API | 통계 대시보드 진입 시 |
| `get-order-owner` | 🔐 소유자 확인 | POST | - | 유료 콘텐츠 계정 불일치 시 |
| `get-report-owner` | 🔐 소유자 확인 | POST | - | 주간 보고서 계정 불일치 시 |

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

**문서 버전**: 2.1.0
**작성자**: AI Assistant
**최종 업데이트**: 2026-03-05

### 변경 이력
| 버전 | 날짜 | 변경 내용 |
|-----|------|----------|
| 2.1.0 | 2026-03-05 | `generate-saju-consult`, `generate-tarot-consult` 함수 추가 (AI 상담 카테고리 신설), 총 34개 |
| 2.0.0 | 2026-02-12 | `index-now` 함수 추가 (IndexNow 프로토콜로 검색엔진 URL 즉시 제출), SEO 카테고리 2개로 확장 |
| 1.9.0 | 2026-02-09 | `extract-trait-tags`에 `rejectedTags` 파라미터 추가, `generate-free-preview` upsert→INSERT 변경 |
| 1.8.0 | 2026-02-03 | `get-order-owner`, `get-report-owner` 함수 추가 (계정 불일치 시 소유자 정보 마스킹 표시), 총 32개 |
| 1.7.0 | 2026-02-02 | `get-ga-stats` 함수 추가 (Google Analytics 통계 조회), 모니터링/통계 카테고리 통합 |
| 1.6.0 | 2026-02-02 | 나다움 보고서 (주간 보고서) 플로우 추가, 캐시 무효화 및 user_viewed 패턴 문서화 |
| 1.5.1 | 2026-01-29 | `save-trait-tags` 함수 삭제 (클라이언트 직접 INSERT로 변경), 총 23개 |
| 1.5.0 | 2026-01-29 | `extract-trait-tags`, `save-trait-tags` 함수 추가 (나다움 태그 추출/저장) |
| 1.4.0 | 2026-01-22 | `generate-sitemap` 함수 추가 (동적 sitemap.xml 생성, SEO 카테고리 신설) |
| 1.3.0 | 2026-01-13 | 사주 API 백엔드 서버 직접 호출 (SAJU_API_KEY 사용), IP 화이트리스트 + 키 인증 방식 |
| 1.2.0 | 2026-01-08 | 알림톡 템플릿 10002 검수 완료, 버튼 URL `/result/saju`로 변경, `server` 함수 제거 |
| 1.1.0 | 2026-01-07 | 결제/환불 Functions 추가 |
| 1.0.0 | 2026-01-06 | 초기 문서 작성 |