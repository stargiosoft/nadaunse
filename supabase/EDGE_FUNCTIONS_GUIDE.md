# Edge Functions 가이드

> **프로젝트**: 나다운세 (운세 서비스)
> **총 함수 수**: 41개
> **최종 업데이트**: 2026-03-05
> **환경 정보 / 배포 방법**: [CLAUDE.md](../CLAUDE.md) 참조

---

## 목차

1. [기능별 분류](#기능별-분류)
2. [함수 간 관계도](#함수-간-관계도)
3. [함수 상세](#함수-상세)
4. [호출 플로우](#호출-플로우)
5. [함수 요약 테이블](#함수-요약-테이블)
6. [디버깅 팁](#디버깅-팁)

---

## 기능별 분류

| 카테고리 | 함수 수 | 주요 기술 |
|---------|--------|----------|
| AI 콘텐츠 생성 | 10개 | OpenAI GPT, Gemini |
| 주간 보고서 | 4개 | GPT-5.1, pg_cron, TalkDream |
| 쿠폰 관리 | 4개 | Supabase DB |
| 미션 리워드 | 1개 | PostgreSQL Function |
| 마스터 콘텐츠 관리 | 2개 | OpenAI, Gemini 통합 |
| 알림 | 1개 | TalkDream API (카카오 알림톡) |
| 사용자 관리 | 1개 | JWT 인증, RLS |
| 결제/환불 | 3개 | PortOne API, PostgreSQL Function |
| 모니터링/통계 | 3개 | Sentry, Slack, Google Analytics |
| SEO | 2개 | 동적 Sitemap, IndexNow |
| 소유자 확인 | 2개 | Service Role Key, 계정 불일치 처리 |
| 유틸리티 | 2개 | Vercel 재빌드, 미확인 태그 정리 |
| 구매 가이드 | 1개 | OpenAI gpt-4.1-nano, 개인화 |
| 새싹 충전소 | 2개 | PortOne, PostgreSQL Function |
| 만세력 | 1개 | Saju API 프록시 |
| 공유 리워드 | 2개 | 레퍼럴 처리, 리워드 상태 조회 |
| 사주/타로 상담 | 2개 | GPT-4.1-mini, 1:1 상담 |

**총 41개**

---

## 함수 간 관계도

### 유료 콘텐츠 생성 플로우

```
결제 완료
    ↓
generate-content-answers (병렬 처리 + Self-Continue)
    ├─→ user_trait_tags 조회 (초개인화 데이터)
    ├─→ generate-saju-answer (사주 답변 + personalizationData)
    ├─→ generate-tarot-answer (타로 답변 + personalizationData)
    ├─→ [120초 경과 시] 자기 재호출 (미완료 질문만 이어서 처리)
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
결제 시
    ↓
get-available-coupons → apply-coupon-to-order

※ issue-welcome-coupon: 현재 비활성화 (A/B 가격 테스트 기간)
※ issue-revisit-coupon: 비활성화 (grant-mission-sprout으로 대체)
```

### 미션 리워드 플로우

```
태그 5개 이상 달성 (CheckRecordMe.tsx)
    ↓
grant-mission-sprout → process_mission_reward RPC
    → 새싹 30개 지급 (중복 방지: sprout_transactions에서 기존 reward 체크)
```

### 나다움 보고서 (주간 보고서) 플로우

```
프로필 → 나의분석보고서 탭
    ↓
MyReportList → MyReportWeekly → ReportWeeklyDetail → ReportWeeklyTarot
    │  ├─ user_viewed=false: 셔플 → 뽑기
    │  └─ user_viewed=true: 스킵 → 결과 페이지로
    ↓
ReportWeeklyTarotResult → ReportWeeklyMindCare → ReportWeeklyMemo
    │  └─ 저장 시 my_report_cache 삭제 (캐시 무효화)
    ↓
"완료" → /my-report-list로 이동 (미션 리워드는 CheckRecordMe에서 처리)
```

**캐시 무효화 지점**: `ReportWeeklyMemo.tsx` (응원글 저장 시), `ReportWeeklyMemoEdit` (응원글 수정 시)

### 결제/환불 플로우

```
PortOne 결제 완료
    ↓
payment-webhook (서버 간 검증)
    ├─→ 결제 금액 검증 → orders.webhook_verified_at 기록
    └─→ process-payment (orders.pstatus='paid', user_coupons.is_used=true)

환불 요청
    ↓
process-refund → PortOne 환불 API → orders.pstatus='refunded' + 쿠폰 복원
```

---

## 함수 상세

### AI 콘텐츠 생성 (10개)

#### `generate-free-preview`
**목적**: 무료 콘텐츠 AI 답변 생성 (GPT-4.1-nano)
**파라미터**: `contentId`, `sajuRecordId?`, `sajuData?`
**주의사항**:
- 사주 API 연동: `SAJU_API_KEY`로 Stargio API 호출, 3회 재시도, 실패 시 graceful degradation
- 비회원 일일 제한: IP+UA fingerprint → `anonymous_free_views` 테이블에서 오늘(KST) 3개 제한, 로그인 사용자는 무제한
- 저장: 로그인 → `free_content_records` (content_title 포함), 로그아웃 → localStorage 캐시

#### `generate-master-content`
**목적**: 마스터 콘텐츠 전체 생성 (백그라운드, 모든 AI 통합)
**파라미터**: `contentId`, `orderId`, `sajuRecordId`

#### `generate-content-answers`
**목적**: 유료 콘텐츠 답변 병렬 생성 (Self-Continue 패턴)
**파라미터**: `contentId`, `orderId`, `sajuRecordId`, `sajuApiData?`, `selfContinueCount?`
**주의사항**:
- **Self-Continue**: 120초(30초 안전 마진) 경과 시 자기 재호출, 최대 5회 (120초 x 5 = 최대 10분). 완료된 질문은 `order_results`에서 자동 스킵 (멱등성)
- **사주 API**: `SAJU_API_KEY` 환경변수로 서버 직접 호출 (IP 화이트리스트 + 키 인증)
- **초개인화**: 태그 1개+ OR 최근 1주 이용 기록 존재 시 발동. gpt-4.1-nano로 심리 추출 → `user_situation_summaries` 저장, 주차별 최신 1건씩 최대 4주 조회
- **알림톡 중복 방지**: `alimtalk_logs`에서 `status='success'` 확인 후 발송
- **타로 카드 일관성**: `order_results.tarot_card_name` 우선 사용 (사용자 선택 카드 유지)

#### `generate-saju-preview`
**목적**: 사주 미리보기 생성 (GPT-5.1, 마스터 콘텐츠용)
**파라미터**: `contentType`, `questionText`, `sajuInfo`

#### `generate-saju-answer`
**목적**: 사주 개별 질문 답변 생성 (초개인화 지원, GPT-5.1)
**파라미터**: `title`, `description?`, `questionerInfo?`, `questionText`, `questionId?`, `birthDate`, `birthTime`, `gender`, `sajuData?`, `personalizationData?`
**주의사항**:
- `generate-content-answers`에서 내부 호출 (`--no-verify-jwt` 필수)
- 초개인화: `personalizationData` 존재 시 적용. `currentSituationSummary` 우선, 없으면 `recentSituationSummaries` fallback

#### `generate-tarot-preview`
**목적**: 타로 미리보기 생성 (GPT-4.1, 마스터 콘텐츠용)
**파라미터**: `contentType`, `questionText`, `tarotCards`

#### `generate-tarot-answer`
**목적**: 타로 개별 질문 답변 생성 (초개인화 지원, GPT-4.1)
**파라미터**: `title?`, `description?`, `questionerInfo?`, `questionText`, `questionId?`, `tarotCards?`, `personalizationData?`
**주의사항**: `generate-content-answers`에서 내부 호출 (`--no-verify-jwt` 필수)

#### `generate-image-prompt`
**목적**: 썸네일 생성용 이미지 프롬프트 생성 (GPT-5-nano)
**파라미터**: `contentDescription`

#### `generate-thumbnail`
**목적**: 썸네일 이미지 생성 (Gemini 2.5 Flash Image, 391x270px)
**파라미터**: `prompt`, `referenceImageUrl`
**주의사항**: 레퍼런스 이미지 `assets/ref.png.png` (아기 백조 일러스트)

#### `extract-trait-tags`
**목적**: 운세 답변에서 나다움 성향 태그 추출 (GPT-5-nano)
**파라미터**: `contentAnswers[]` (`questionText`, `answerText`), `existingTags?`, `rejectedTags?`
**주의사항**:
- 장점 2개 + 단점 1개 추출, 형용사 형태
- `rejectedTags` (사용자 거부 태그) 절대 사용 금지
- 태그 저장은 클라이언트에서 직접 `user_trait_tags` 테이블에 INSERT
- 무료/유료 모두 결과 페이지에서 백그라운드 호출, 추출 미완료 시 tag-loading 페이지 경유

---

### 주간 보고서 (4개)

#### `generate-weekly-report`
**목적**: 개별 사용자 주간 보고서 생성 (GPT-5.1)
**파라미터**: 배치에서 내부 호출 (`--no-verify-jwt` 필수)
**주의사항**:
- 사주 정보 + 주간 태그 + 이용 콘텐츠 기반, 3카드 타로 + 마음 처방 + To-Do List 생성
- 복수 "본인" 사주 대응 (is_primary 우선, 최신순 fallback)
- `weekly_reports` 저장 + `user_situation_summaries`에도 심리 상태 INSERT

#### `generate-weekly-reports-batch`
**목적**: 주간 보고서 배치 생성 (pg_cron 호출, Self-Continue 패턴)
**파라미터**: pg_cron에서 호출 (`--no-verify-jwt` 필수)
**주의사항**:
- concurrency: 3, 2초 간격, 120초 시간 제한 → 자기 재호출 (fire-and-forget)
- `WEEK_START_DAY` 환경변수: 프로덕션 0=일요일, 스테이징 3=수요일
- pg_cron 스케줄: 프로덕션 `*/10 3-12 * * 0`, 스테이징 `*/10 3-12 * * 3`
- 관리자 재발송: 1회 호출로 서버 자동 처리 (브라우저 닫아도 됨)

#### `send-report-alimtalk`
**목적**: 보고서 알림톡 발송 (TalkDream API, 최대 5회 재시도)
**파라미터**: 내부 호출 (`--no-verify-jwt` 필수)
**주의사항**: `SITE_URL` 환경변수로 도메인 구분 (스테이징에서 프로덕션 URL 발송 방지)

#### `get-failed-reports`
**목적**: 실패 보고서 조회 (관리자용, 태그 있는데 보고서 없는 사용자)
**주의사항**: KST→UTC 타임존 변환 적용

---

### 쿠폰 관리 (4개)

#### `get-available-coupons`
**목적**: 사용 가능한 쿠폰 목록 조회 (GET)
**파라미터**: `?user_id=xxx`
**주의사항**: `is_used=false`만, `discount_amount` 내림차순 정렬

#### `issue-welcome-coupon`
**목적**: 웰컴 쿠폰 발급 (~~현재 비활성화~~ — A/B 가격 테스트 기간, TermsPage에서 호출 주석 처리됨)
**파라미터**: `user_id`
**주의사항**: 중복 발급 방지

#### `issue-revisit-coupon`
**목적**: ~~미션성공쿠폰 발급~~ → 비활성화 (`grant-mission-sprout`으로 대체)
**파라미터**: `user_id`, `source_order_id` (weekly_reports.id)
**주의사항**: 프론트엔드에서 더 이상 호출하지 않음. Edge Function은 유지

#### `apply-coupon-to-order`
**목적**: 주문에 쿠폰 적용 (사용 처리)
**파라미터**: `user_coupon_id`, `order_id`

---

### 마스터 콘텐츠 관리 (2개)

#### `master-content`
**목적**: 마스터 콘텐츠 CRUD API (JWT 필수, 관리자 전용, Service Role Key로 RLS 우회)
**파라미터**: `action`, `content_data`, `questions[]`

#### `generate-master-content`
**목적**: 마스터 콘텐츠 전체 생성 (백그라운드, 모든 AI 통합)
**파라미터**: `contentId`, `orderId`, `sajuRecordId`

---

### 알림 (1개)

#### `send-alimtalk`
**목적**: 카카오 알림톡 발송 (TalkDream API, `--no-verify-jwt` 필수)
**파라미터**: `orderId`, `userId`, `mobile`, `customerName`, `contentId`
**주의사항**:
- 템플릿 ID `10002`, Service No `2500109900`
- 재시도: 총 4번 (1회 + 3회), 간격 5초/15초/30초
- 재시도 제외: `KKO_3016` (템플릿 불일치), `KKO_3018` (발송 불가), `KKO_3020` (수신 차단), `ERR_AUTH`
- 로그: `alimtalk_logs` 테이블 (`pending` → `success`/`failed`)
- `SITE_URL` 환경변수: 버튼 URL 도메인

---

### 사용자 관리 (1개)

#### `users`
**목적**: 사용자 조회/생성 (JWT 필수, Service Role Key로 RLS 우회)
**파라미터**: `action` (`get_or_create`/`get`/`create`), `user_data?`

---

### 결제/환불 (3개)

#### `payment-webhook`
**목적**: 포트원 결제 웹훅 검증 (`--no-verify-jwt` 필수, 서버 간 통신)
**파라미터**: `imp_uid`, `merchant_uid`, `status`
**주의사항**: imp_uid로 포트원 API 조회 → DB 금액과 비교 → `orders.webhook_verified_at` 기록

#### `process-payment`
**목적**: 결제 트랜잭션 원자적 처리 (PostgreSQL Function `process_payment_complete` 호출)
**파라미터**: `order_id`, `coupon_id?`

#### `process-refund`
**목적**: 환불 처리 (포트원 환불 API + 쿠폰 자동 복원)
**파라미터**: `order_id`, `refund_amount`, `refund_reason`

---

### 모니터링/통계 (3개)

#### `get-ga-stats`
**목적**: Google Analytics 4 통계 조회 (마스터 계정 전용)
**파라미터**: `?type=realtime` 또는 `?type=period&startDate=...&endDate=...`
**주의사항**:
- `GA_SERVICE_ACCOUNT_JSON`, `GA_PROPERTY_ID` (기본값 520025356) 환경변수 필요
- GA API endDate가 inclusive이므로 프론트엔드 날짜에서 1일 빼서 호출

#### `sentry-slack-webhook`
**목적**: Sentry 에러 이벤트를 Slack으로 중계 (`--no-verify-jwt` 필수)
**파라미터**: Sentry webhook payload
**주의사항**: `SLACK_WEBHOOK_URL` 환경변수 필요

#### `get-failed-reports`
**목적**: (주간 보고서 섹션 참조)

---

### SEO (2개)

#### `generate-sitemap`
**목적**: 동적 sitemap.xml 생성 (`--no-verify-jwt` 필수)
**주의사항**:
- deployed 상태 콘텐츠 자동 포함, 인기순 정렬
- 유료 `/product/:id` (priority 0.9), 무료 `/free/content/:id` (priority 0.8)
- 캐싱: `max-age=3600` (1시간), 에러 시 5분
- 정적 `public/sitemap.xml` 파일 있으면 Vercel이 우선 서빙하므로 삭제 필요

#### `index-now`
**목적**: IndexNow 프로토콜로 검색엔진(네이버/Bing)에 URL 즉시 제출
**파라미터**: `urls[]` (상대/절대 경로)
**주의사항**:
- `INDEXNOW_API_KEY` 환경변수 필요
- 키 검증 파일: `public/e32ae15605104f698d20fde140bc8e83.txt`
- 구글은 IndexNow 미지원

---

### 소유자 확인 (2개)

#### `get-order-owner`
**목적**: 유료 콘텐츠 소유자 정보 조회 (계정 불일치 확인용, Service Role Key 사용)
**파라미터**: `orderId`
**주의사항**: 이메일 뒤 3글자 마스킹, 전화번호 중간 4자리 마스킹

#### `get-report-owner`
**목적**: 주간 보고서 소유자 정보 조회 (계정 불일치 확인용, Service Role Key 사용)
**파라미터**: `reportId`
**주의사항**: 마스킹 규칙은 `get-order-owner`와 동일

---

### 유틸리티 (2개)

#### `cleanup-unconfirmed-tags`
**목적**: 미확인 태그 자동 정리 (pg_cron, 72시간 이상 미확인 태그 삭제, `--no-verify-jwt` 필수)

#### `trigger-rebuild`
**목적**: Vercel 재빌드 트리거 (Deploy Hook 호출)

---

### 구매 가이드 (1개)

#### `generate-purchase-guide`
**목적**: AI 개인화 구매 가이드 생성 (JWT 필수, gpt-4.1-nano, 나다움 태그 기반 맞춤 후킹 멘트 2줄)

---

### 새싹 충전소 (2개)

#### `sprout-charge`
**목적**: 새싹 충전 처리 (JWT 필요)
**입력**: `package_id`, `imp_uid`, `merchant_uid`, `pay_method`, `pg_provider`
**보안**: PortOne API로 `imp_uid` 결제 상태(`paid`) 및 금액(`price_krw`) 검증 후 충전. 검증 실패 시 차단
**호출**: `process_sprout_charge` RPC (SECURITY DEFINER, EXECUTE 권한 service_role만 허용)

#### `sprout-deduct`
**목적**: 새싹 차감 처리 (JWT 필요)
**입력**: `content_id`, `amount`
**보안**: `amount <= 0` 거부, 잔액 부족 검증
**호출**: `process_sprout_deduct` RPC (SECURITY DEFINER, EXECUTE 권한 service_role만 허용)

---

### 만세력 (1개)

#### `get-manse-data`
**목적**: 만세력 데이터 조회 (`--no-verify-jwt` 필수, Saju API 프록시)

---

### 공유 리워드 (2개)

#### `process-referral`
**목적**: 레퍼럴 처리 (JWT 필요, 회원가입 완료 후 AuthCallback에서 호출)
- `referral_code` → `users.referral_code`로 추천인 조회 → `process_share_reward` RPC 호출
- 서버 측 IP+UA SHA-256 fingerprint 생성 (클라이언트 조작 방지)
- 동일 fingerprint 3건 이상 시 `users.is_suspicious_referral = true` 설정 → 새싹 미지급

#### `get-share-reward-status`
**목적**: 공유 리워드 현황 조회 (JWT 필요)
- 현재 회차, 필요 인원, 달성 인원, 총 리워드/추천 수 반환

---

### 미션 리워드 (1개)

#### `grant-mission-sprout`
**목적**: 태그 5개 달성 시 새싹 30개 리워드 지급 (JWT 필수)
**파라미터**: `user_id`
**호출**: `process_mission_reward` RPC (SECURITY DEFINER, 중복 방지)
**주의사항**: `sprout_transactions`에서 기존 `reward` 레코드 체크 → 이미 지급 시 `{ success: false, already_granted: true }` 반환

---

### 사주/타로 상담 (2개)

#### `generate-saju-consult`
**목적**: 사주 상담 답변 생성 (GPT-4.1-mini, JWT 필수)
**파라미터**: `question`, `sajuRecordId`, `userId`
**주의사항**: 사주 레코드 조회 + 사주 API 호출 + OpenAI JSON 응답 (todayCore, advice, flow, caution, overallFlow)

#### `generate-tarot-consult`
**목적**: 타로 상담 답변 생성 (GPT-4.1-mini, 인증 불필요)
**파라미터**: `question` (1~300자)
**주의사항**:
- DB 조회 없음, 인증 불필요 (브라우저에서 anon key로 호출)
- 78장 타로 덱에서 랜덤 카드 선택 → OpenAI JSON 응답 (cardMessage, currentFlow, actionAdvice, dailySentence)
- 카드 이미지 URL은 Supabase Storage `assets/tarot cards/` 경로

---

## 호출 플로우

### 무료 콘텐츠 플로우

```
1. 사주 입력 (FreeBirthInfoInput)
   ↓
2. generate-free-preview 호출 (GPT-4.1-nano)
   ↓
3. free_content_answers 저장
   ↓
4. FreeContentLoading (폴링 2초마다)
   ↓
5. FreeSajuDetail (결과 표시)
```

### 유료 콘텐츠 플로우

```
1. 회원가입 (OAuth) → users → 약관 동의 → WelcomeCouponPage (안내만, 쿠폰 미발급)
   ↓
2. 결제 페이지 → get-available-coupons
   ↓
3. 결제 완료 (PortOne) → apply-coupon-to-order
   ↓
4. 사주 입력/선택 → generate-content-answers (Self-Continue)
   ↓
5. send-alimtalk (알림톡 발송)
   ↓
6. LoadingPage (폴링) → 결과 페이지
```

### 마스터 콘텐츠 생성 플로우

```
1. 콘텐츠 정보 입력 (MasterContentCreate)
   ↓
2. generate-saju-preview / generate-tarot-preview (미리보기)
   ↓
3. master-content (저장)
   ↓
4. generate-image-prompt → generate-thumbnail (선택)
```

---

## 함수 요약 테이블

| 함수명 | 카테고리 | 메서드 | AI 모델 | 호출 시점 |
|--------|---------|--------|---------|----------|
| `generate-free-preview` | AI 생성 | POST | GPT-4.1-nano | 무료 사주 입력 후 |
| `generate-master-content` | AI 생성 | POST | Claude-3.5-Sonnet | 유료 사주 입력 후 |
| `generate-content-answers` | AI 생성 | POST | - | 결제 완료 후 (Self-Continue) |
| `generate-saju-preview` | AI 생성 | POST | GPT-5.1 | 마스터 콘텐츠 미리보기 |
| `generate-saju-answer` | AI 생성 | POST | GPT-5.1 | 사주 질문별 답변 |
| `generate-tarot-preview` | AI 생성 | POST | GPT-4.1 | 타로 미리보기 |
| `generate-tarot-answer` | AI 생성 | POST | GPT-4.1 | 타로 질문별 답변 |
| `generate-image-prompt` | AI 생성 | POST | GPT-5-nano | 썸네일 프롬프트 생성 |
| `generate-thumbnail` | AI 생성 | POST | Gemini 2.5 Flash Image | 썸네일 이미지 생성 |
| `extract-trait-tags` | AI 생성 | POST | GPT-5-nano | 운세 결과 페이지 진입 시 |
| `get-available-coupons` | 쿠폰 | GET | - | 결제 페이지 진입 |
| `issue-welcome-coupon` | 쿠폰 | POST | - | 회원가입 후 |
| `issue-revisit-coupon` | 쿠폰 | POST | - | ~~보고서 완료 시 미션 쿠폰~~ (비활성화) |
| `grant-mission-sprout` | 미션 리워드 | POST | - | 태그 5개 달성 시 새싹 30 지급 |
| `apply-coupon-to-order` | 쿠폰 | POST | - | 결제 완료 후 |
| `users` | 사용자 | POST | - | OAuth 콜백 |
| `master-content` | 관리 | POST | - | 콘텐츠 생성 |
| `send-alimtalk` | 알림 | POST | TalkDream API | AI 생성 완료 후 |
| `generate-weekly-report` | 주간 보고서 | POST | GPT-5.1 | 배치 내부 호출 |
| `generate-weekly-reports-batch` | 주간 보고서 | POST | - | pg_cron 스케줄 |
| `send-report-alimtalk` | 주간 보고서 | POST | TalkDream API | 보고서 생성 완료 후 |
| `get-failed-reports` | 주간 보고서 | GET | - | 관리자 패널 |
| `payment-webhook` | 결제 | POST | - | 포트원 서버 콜백 |
| `process-payment` | 결제 | POST | - | 결제 완료 후 |
| `process-refund` | 환불 | POST | - | 환불 요청 시 |
| `generate-sitemap` | SEO | GET | - | /sitemap.xml 요청 시 |
| `index-now` | SEO | POST | - | 콘텐츠 배포/업데이트 후 |
| `get-ga-stats` | 통계 | GET | GA Data API | 통계 대시보드 진입 시 |
| `sentry-slack-webhook` | 모니터링 | POST | - | Sentry 에러 발생 시 |
| `get-order-owner` | 소유자 확인 | POST | - | 유료 콘텐츠 계정 불일치 시 |
| `get-report-owner` | 소유자 확인 | POST | - | 주간 보고서 계정 불일치 시 |
| `cleanup-unconfirmed-tags` | 유틸리티 | - | - | pg_cron (72시간 미확인 태그) |
| `trigger-rebuild` | 유틸리티 | POST | - | Vercel 재빌드 필요 시 |
| `generate-purchase-guide` | 구매 가이드 | POST | gpt-4.1-nano | 구매 페이지 진입 시 |
| `sprout-charge` | 새싹 충전소 | POST | - | 새싹 충전 결제 완료 후 |
| `sprout-deduct` | 새싹 충전소 | POST | - | 콘텐츠 구매 시 새싹 차감 |
| `get-manse-data` | 만세력 | GET | - | 만세력 데이터 조회 시 |
| `process-referral` | 공유 리워드 | POST | - | 회원가입 완료 후 (AuthCallback) |
| `get-share-reward-status` | 공유 리워드 | POST | - | 공유 리워드 페이지 진입 시 |
| `generate-saju-consult` | 사주 상담 | POST | GPT-4.1-mini | 사주 상담 요청 시 |
| `generate-tarot-consult` | 타로 상담 | POST | GPT-4.1-mini | 타로 상담 요청 시 |

---

## 디버깅 팁

### Edge Function 로그 확인
```bash
# 특정 함수 로그 실시간 확인
supabase functions logs generate-master-content --tail

# 모든 함수 로그
supabase functions logs --tail
```

### 로컬 테스트
```bash
supabase functions serve generate-free-preview --env-file .env.local
```

### 배포

배포 스크립트 및 `--no-verify-jwt` 필수 함수 목록은 **CLAUDE.md** 참조.

```bash
npm run deploy:prod          # 프로덕션 전체 배포
npm run deploy:prod:core     # 핵심 함수만 배포
npm run deploy:staging       # 스테이징 전체 배포
```

### 문제 발생 시

| 증상 | 확인 사항 |
|------|----------|
| AI 생성 실패 | Supabase Secrets에 API 키 확인 |
| 쿠폰 조회 안 됨 | `user_coupons` 테이블 RLS 정책 확인 |
| 알림톡 미발송 | TalkDream API 키, 템플릿 ID 확인 |
| CORS 오류 | Edge Function 코드에 CORS 헤더 확인 |

---

**최종 업데이트**: 2026-03-05
