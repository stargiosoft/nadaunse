# 데이터베이스 스키마 문서

> **작성일**: 2024-12-17
> **버전**: 2.0.0
> **최종 업데이트**: 2026-02-09
> **필수 문서**: [CLAUDE.md](../CLAUDE.md) - 개발 규칙
> **경고**: 이 문서는 참고용이며, 스키마 변경 시 수동으로 업데이트해야 합니다.

---

## 📋 목차

1. [사용자 관련 테이블](#사용자-관련-테이블)
2. [사주 정보 테이블](#사주-정보-테이블)
3. [콘텐츠 관련 테이블](#콘텐츠-관련-테이블)
4. [주문 및 결제 테이블](#주문-및-결제-테이블)
5. [쿠폰 관련 테이블](#쿠폰-관련-테이블)
6. [무료 콘텐츠 기록 테이블](#무료-콘텐츠-기록-테이블)
7. [나다움 태그 테이블](#나다움-태그-테이블)
8. [주간 보고서 테이블](#주간-보고서-테이블)
9. [알림톡 로그 테이블](#알림톡-로그-테이블)
10. [백업 테이블](#백업-테이블)
11. [테이블 관계도](#테이블-관계도)

---

## 사용자 관련 테이블

### `users`

사용자 계정 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 사용자 고유 ID |
| `provider` | text | NOT NULL | - | OAuth 제공자 (kakao, google) |
| `provider_id` | text | NOT NULL | - | OAuth 제공자의 사용자 ID |
| `email` | text | - | - | 이메일 주소 |
| `nickname` | text | - | - | 사용자 닉네임 |
| `profile_image` | text | - | - | 프로필 이미지 URL |
| `terms_agreed` | boolean | - | `false` | 서비스 이용약관 동의 여부 |
| `privacy_agreed` | boolean | - | `false` | 개인정보 처리방침 동의 여부 |
| `marketing_agreed` | boolean | - | `false` | 마케팅 정보 수신 동의 여부 |
| `ads_agreed` | boolean | - | `false` | 광고성 정보 수신 동의 여부 |
| `terms_agreed_at` | timestamptz | - | - | 약관 동의 일시 |
| `last_login_at` | timestamptz | - | `now()` | 마지막 방문 일시 (App.tsx → recordTodayVisit()에서 모든 페이지 방문 시 갱신) |
| `visit_count` | integer | - | `1` | 총 방문 일수 (일일 방문 기준) |
| `visit_dates` | date[] | - | `'{}'` | KST 기준 방문 날짜 목록 (예: ['2026-02-01', '2026-02-02']) |
| `rejected_tags` | text[] | - | `'{}'` | AI 태그 추출 시 제외할 태그 목록 (CheckRecordMe에서 미선택 태그 누적) |
| `created_at` | timestamptz | - | `now()` | 계정 생성 일시 |
| `role` | text | CHECK | `'user'` | 사용자 권한 (master, admin, user) |

**제약조건**:
- `role` CHECK: 'master', 'admin', 'user' 중 하나만 허용

---

## 사주 정보 테이블

### `saju_records`

사용자의 사주 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 사주 레코드 고유 ID |
| `user_id` | uuid | FOREIGN KEY | - | 사용자 ID (users.id) |
| `full_name` | text | NOT NULL | - | 이름 |
| `gender` | text | NOT NULL | - | 성별 (male, female) |
| `birth_date` | timestamptz | NOT NULL | - | 생년월일 |
| `birth_time` | text | NOT NULL | - | 출생 시간 (HH:mm 형식) |
| `calendar_type` | text | - | `'solar'` | 양력/음력 구분 (solar, lunar) |
| `zodiac` | text | - | - | 띠 정보 (쥐띠, 소띠, 호랑이띠 등) |
| `notes` | text | - | - | 관계 메모 (연인, 가족, 친구, 지인, 동료, 기타) |
| `phone_number` | text | - | - | 전화번호 |
| `is_primary` | boolean | - | `false` | 대표 사주 여부 (사용자당 1개만 true) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |
| `updated_at` | timestamptz | NOT NULL | `now()` | 수정 일시 |

**외래키**:
- `user_id` → `users(id)`

---

## 콘텐츠 관련 테이블

### `master_contents`

마스터가 생성한 운세 콘텐츠 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 콘텐츠 고유 ID |
| `content_type` | text | NOT NULL, CHECK | - | 콘텐츠 타입 (free, paid) |
| `category_main` | text | NOT NULL | - | 주 카테고리 (연애, 재물, 건강 등) |
| `category_sub` | text | - | - | 서브 카테고리 |
| `title` | text | NOT NULL | - | 콘텐츠 제목 |
| `description` | text | - | - | 콘텐츠 설명 |
| `user_concern` | text | - | - | 사용자 고민 내용 |
| `questioner_info` | text | - | - | 질문자 정보 |
| `price_original` | integer | - | - | 정가 |
| `price_discount` | integer | - | - | 할인가 |
| `discount_rate` | integer | - | - | 할인율 (%) |
| `thumbnail_url` | text | - | - | 썸네일 이미지 URL |
| `view_count` | integer | - | `0` | 조회수 |
| `weekly_clicks` | integer | - | `0` | 주간 클릭수 (매주 월요일 00:00 KST 리셋) |
| `last_weekly_clicks` | integer | - | `0` | 전주 클릭수 (리셋 시 weekly_clicks 값 보관) |
| `status` | text | - | `'loading'` | 상태 (loading, deployed, archived 등) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |
| `updated_at` | timestamptz | NOT NULL | `now()` | 수정 일시 |
| `published_at` | timestamptz | - | - | 배포 일시 |

**제약조건**:
- `content_type` CHECK: 'free' 또는 'paid'만 허용

### `master_content_questions`

콘텐츠별 질문 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 질문 고유 ID |
| `content_id` | uuid | FOREIGN KEY | - | 콘텐츠 ID (master_contents.id) |
| `question_order` | integer | NOT NULL | - | 질문 순서 |
| `question_type` | text | CHECK | `'saju'` | 질문 타입 (saju, tarot) |
| `question_text` | text | NOT NULL | - | 질문 내용 |
| `preview_text` | text | - | - | 미리보기 텍스트 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |
| `updated_at` | timestamptz | NOT NULL | `now()` | 수정 일시 |

**외래키**:
- `content_id` → `master_contents(id)`

**제약조건**:
- `question_type` CHECK: 'saju' 또는 'tarot'만 허용

---

## 주문 및 결제 테이블

### `orders`

주문 및 결제 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 주문 고유 ID |
| `user_id` | uuid | FOREIGN KEY | - | 사용자 ID (users.id) |
| `content_id` | uuid | FOREIGN KEY | - | 콘텐츠 ID (master_contents.id) |
| `saju_record_id` | uuid | FOREIGN KEY | - | 사주 레코드 ID (saju_records.id) |
| `gname` | text | - | - | 상품명 |
| `full_name` | text | - | - | 주문자 이름 |
| `gender` | text | - | - | 주문자 성별 |
| `birth_date` | timestamptz | - | - | 주문자 생년월일 |
| `birth_time` | text | - | - | 주문자 출생 시간 |
| `imp_uid` | text | UNIQUE | - | 포트원 결제 고유번호 |
| `merchant_uid` | text | NOT NULL, UNIQUE | - | 가맹점 주문번호 |
| `paid_amount` | integer | NOT NULL | - | 결제 금액 |
| `pay_method` | text | - | - | 결제 수단 (card, trans, vbank 등) |
| `pg_provider` | text | - | - | PG사 (tosspayments 등) |
| `pg_type` | text | - | - | PG 타입 |
| `pstatus` | text | - | `'pending'` | 결제 상태 (pending, paid, failed, refunded) |
| `success` | boolean | - | `false` | 결제 성공 여부 |
| `ai_generation_completed` | boolean | - | `false` | AI 생성 완료 여부 |
| `ai_generation_started_at` | timestamptz | - | - | AI 생성 시작 일시 |
| `webhook_verified_at` | timestamptz | - | - | 결제 웹훅 검증 일시 (NEW) |
| `refund_amount` | integer | - | - | 환불 금액 (NEW) |
| `refund_reason` | text | - | - | 환불 사유 (NEW) |
| `refunded_at` | timestamptz | - | - | 환불 처리 일시 (NEW) |
| `created_at` | timestamptz | NOT NULL | `now()` | 주문 생성 일시 |
| `updated_at` | timestamptz | NOT NULL | `now()` | 주문 수정 일시 |

**외래키**:
- `user_id` → `users(id)`
- `content_id` → `master_contents(id)`
- `saju_record_id` → `saju_records(id)`

### `order_results`

주문별 질문에 대한 AI 응답 결과

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 결과 고유 ID |
| `order_id` | uuid | NOT NULL, FOREIGN KEY | - | 주문 ID (orders.id) |
| `question_id` | uuid | NOT NULL, FOREIGN KEY | - | 질문 ID (master_content_questions.id) |
| `question_order` | integer | NOT NULL | - | 질문 순서 |
| `question_type` | text | - | - | 질문 타입 (saju, tarot) |
| `question_text` | text | - | - | 질문 내용 (캐시) |
| `gpt_response` | text | - | - | GPT 응답 내용 |
| `tarot_card_name` | text | - | - | 타로 카드 이름 (예: "The Fool", "Ace of Cups") |
| `tarot_card_image_url` | text | - | - | 타로 카드 이미지 URL (Supabase Storage) |
| `tarot_user_viewed` | boolean | - | - | 사용자가 타로 카드를 확인했는지 여부 |
| `model_used` | text | - | - | 사용된 AI 모델명 |
| `status` | text | - | `'pending'` | 생성 상태 (pending, completed, failed) |
| `error_message` | text | - | - | 에러 메시지 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |
| `updated_at` | timestamptz | - | `now()` | 수정 일시 |

**외래키**:
- `order_id` → `orders(id)`
- `question_id` → `master_content_questions(id)`

---

## 쿠폰 관련 테이블

### `coupons`

쿠폰 마스터 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 쿠폰 고유 ID |
| `name` | text | NOT NULL | - | 쿠폰 이름 |
| `coupon_type` | text | NOT NULL | - | 쿠폰 타입 (welcome: 가입축하, revisit: 재방문, mission: 미션성공) |
| `discount_amount` | integer | NOT NULL | - | 할인 금액 (원 또는 %) |
| `description` | text | - | - | 쿠폰 설명 |
| `is_active` | boolean | - | `true` | 활성화 여부 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

### `user_coupons`

사용자별 발급된 쿠폰 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 사용자 쿠폰 고유 ID |
| `user_id` | uuid | NOT NULL, FOREIGN KEY | - | 사용자 ID (users.id) |
| `coupon_id` | uuid | NOT NULL, FOREIGN KEY | - | 쿠폰 ID (coupons.id) |
| `is_used` | boolean | - | `false` | 사용 여부 |
| `used_at` | timestamptz | - | - | 사용 일시 |
| `used_order_id` | uuid | FOREIGN KEY | - | 사용된 주문 ID (orders.id) |
| `source_order_id` | uuid | - | - | 쿠폰 발급 원인 ID (주문 ID 또는 보고서 ID) |
| `issued_at` | timestamptz | - | `now()` | 발급 일시 |
| `expired_at` | timestamptz | - | - | 만료 일시 |

**외래키**:
- `user_id` → `users(id)`
- `coupon_id` → `coupons(id)`
- `used_order_id` → `orders(id)`

**주요 컬럼 설명**:
- `used_order_id`: 이 쿠폰을 **사용해서 결제한** 주문 ID
- `source_order_id`: 이 쿠폰이 **발급된 원인이 된** ID (주문 ID 또는 보고서 ID - 외래키 제약 없음)

---

## 무료 콘텐츠 기록 테이블

### `free_content_records`

로그인 사용자의 무료 콘텐츠 이용 기록 (운세 기록 페이지에서 조회용)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 레코드 고유 ID |
| `user_id` | uuid | FOREIGN KEY | - | 사용자 ID (users.id) |
| `content_id` | uuid | FOREIGN KEY, NOT NULL | - | 콘텐츠 ID (master_contents.id) |
| `saju_record_id` | uuid | FOREIGN KEY | - | 사주 정보 ID (saju_records.id) |
| `full_name` | text | NOT NULL | - | 이름 |
| `gender` | text | NOT NULL | - | 성별 (male, female) |
| `birth_date` | timestamptz | NOT NULL | - | 생년월일 |
| `birth_time` | text | - | - | 출생 시간 |
| `is_guest` | boolean | - | `false` | 게스트 여부 |
| `answers` | jsonb | NOT NULL | - | AI 생성 답변 배열 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

**외래키**:
- `user_id` → `users(id)` ON DELETE SET NULL
- `content_id` → `master_contents(id)` ON DELETE CASCADE
- `saju_record_id` → `saju_records(id)` ON DELETE SET NULL

**인덱스**:
- `idx_free_content_records_user_created`: (user_id, created_at DESC) WHERE user_id IS NOT NULL
- `idx_free_content_records_content`: (content_id)

**answers JSONB 구조**:
```json
[
  {
    "question_id": "q1",           // ⭐ PurchaseHistoryPage 정렬용 (필수)
    "question_order": 1,           // ⭐ PurchaseHistoryPage 정렬용 (필수)
    "question_text": "질문 내용",
    "answer_text": "AI 생성 답변"
  }
]
```

**참고**: 2026-01-30 이전 레코드는 `question_id`, `question_order`가 없을 수 있음.
`PurchaseHistoryPage`에서 fallback 처리 (`q${index + 1}`, `index + 1`).

---

### `anonymous_free_views`

비회원(로그아웃) 사용자의 무료 콘텐츠 일일 이용 제한 추적 (IP+UA fingerprint 기반)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 레코드 고유 ID |
| `fingerprint` | text | NOT NULL | - | IP+UserAgent SHA-256 해시 |
| `content_id` | uuid | FOREIGN KEY, NOT NULL | - | 콘텐츠 ID (master_contents.id) |
| `viewed_date` | date | NOT NULL | - | KST 기준 조회 날짜 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**외래키**:
- `content_id` → `master_contents(id)` ON DELETE CASCADE

**인덱스**:
- `idx_anonymous_free_views_fingerprint_date`: (fingerprint, viewed_date)

**용도**:
- 비회원 하루 3개 무료 콘텐츠 제한 (서버 2차 검증)
- `generate-free-preview` Edge Function에서 Service Role Key로만 접근 (INSERT 방식, 같은 콘텐츠 재조회도 매번 기록)
- RLS Enabled (정책 없음 — Service Role Key 전용)

**자동 정리**: pg_cron `cleanup-anonymous-free-views` — 매일 KST 09:00에 전날 이전 데이터 자동 삭제

---

## 나다움 태그 테이블

### `user_trait_tags`

사용자별 나다움 성향 태그를 저장하는 테이블 (GPT-5-nano로 추출)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 태그 고유 ID |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | - | 사용자 ID (users.id) |
| `tag_name` | text | NOT NULL | - | 태그 이름 (예: "창의적인", "문제 해결력이 있는") |
| `tag_type` | text | NOT NULL, CHECK | - | 태그 유형 (positive, negative, neutral) |
| `source_content_id` | uuid | FOREIGN KEY | - | 태그 출처 콘텐츠 ID (master_contents.id) |
| `source_order_id` | uuid | FOREIGN KEY | - | 태그 출처 주문 ID (orders.id) - 유료 콘텐츠용 |
| `source_type` | text | NOT NULL, CHECK | - | 출처 유형 (free_content, paid_content) |
| `is_confirmed` | boolean | NOT NULL | `false` | 사용자가 태그를 확인/승인했는지 여부 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

**외래키**:
- `user_id` → `users(id)` ON DELETE CASCADE
- `source_content_id` → `master_contents(id)` ON DELETE SET NULL
- `source_order_id` → `orders(id)` ON DELETE SET NULL

**제약조건**:
- `tag_type` CHECK: 'positive', 'negative', 'neutral' 중 하나만 허용
- `source_type` CHECK: 'free_content', 'paid_content' 중 하나만 허용

**인덱스**:
- `idx_user_trait_tags_user`: (user_id)
- `idx_user_trait_tags_user_created`: (user_id, created_at DESC)

**용도**:
- 무료/유료 운세 콘텐츠 결과에서 GPT-5-nano로 장점 2개, 단점 1개 성향 키워드 추출
- 사용자 프로필에서 나다움 태그 목록 표시
- `extract-trait-tags` Edge Function으로 추출 → `save-trait-tags` Edge Function으로 저장

---

## 주간 보고서 테이블

### `weekly_reports`

사용자별 주간 보고서 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 보고서 고유 ID |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | - | 사용자 ID (users.id) |
| `year` | integer | NOT NULL | - | 연도 (예: 2026) |
| `month` | integer | NOT NULL, CHECK | - | 월 (1~12) |
| `week` | integer | NOT NULL, CHECK | - | 주차 (1~5) |
| `week_start_date` | date | NOT NULL | - | 주간 시작일 |
| `week_end_date` | date | NOT NULL | - | 주간 종료일 |
| `status` | text | NOT NULL, CHECK | `'pending'` | 상태 (pending, generating, completed, failed) |
| `tag_count` | integer | NOT NULL | `0` | 해당 주간 태그 수 |
| `situation_summary` | text | - | - | 상황 요약 (AI 생성) |
| `to_do_list` | jsonb | - | - | 다음주 목표 리스트 |
| `self_encouragement` | text | - | - | 사용자가 작성한 응원글 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |
| `published_at` | timestamptz | - | - | 발행 일시 |

**외래키**:
- `user_id` → `users(id)`

**제약조건**:
- `month` CHECK: 1~12 사이
- `week` CHECK: 1~5 사이
- `status` CHECK: 'pending', 'generating', 'completed', 'failed' 중 하나

**to_do_list JSONB 구조**:
```json
[
  { "id": 1, "text": "목표 1" },
  { "id": 2, "text": "목표 2" },
  { "id": 3, "text": "목표 3" }
]
```

### `weekly_report_sections`

주간 보고서의 섹션별 콘텐츠

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 섹션 고유 ID |
| `report_id` | uuid | FOREIGN KEY, NOT NULL | - | 보고서 ID (weekly_reports.id) |
| `section_type` | text | NOT NULL, CHECK | - | 섹션 타입 (my_story, emotion_diagnosis, tarot_reading, soul_prescription) |
| `section_order` | integer | NOT NULL, CHECK | - | 섹션 순서 (1~4) |
| `title` | text | NOT NULL | - | 섹션 제목 |
| `content` | jsonb | - | - | 섹션 콘텐츠 (AI 생성) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**외래키**:
- `report_id` → `weekly_reports(id)`

**제약조건**:
- `section_type` CHECK: 'my_story', 'emotion_diagnosis', 'tarot_reading', 'soul_prescription' 중 하나
- `section_order` CHECK: 1~4 사이

**content JSONB 구조** (타입별로 다름):
```json
// my_story, soul_prescription
{
  "section_id": 1,
  "title": "섹션 제목",
  "content_paragraphs": ["문단1", "문단2", "문단3"]
}

// tarot_reading
{
  "section_id": 2,
  "title": "타로 리딩",
  "card_1_interpretation": "첫 번째 카드 해석",
  "card_2_interpretation": "두 번째 카드 해석",
  "card_3_interpretation": "세 번째 카드 해석"
}
```

### `report_tarot_selections`

주간 보고서의 타로 카드 선택 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 선택 고유 ID |
| `report_id` | uuid | FOREIGN KEY, NOT NULL | - | 보고서 ID (weekly_reports.id) |
| `card_order` | integer | NOT NULL, CHECK | - | 카드 순서 (1~3) |
| `card_name` | text | NOT NULL | - | 타로 카드 이름 |
| `card_image_url` | text | - | - | 타로 카드 이미지 URL |
| `interpretation` | text | - | - | 카드 해석 (AI 생성) |
| `user_viewed` | boolean | NOT NULL | `false` | 사용자가 카드를 확인했는지 여부 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**외래키**:
- `report_id` → `weekly_reports(id)`

**제약조건**:
- `card_order` CHECK: 1~3 사이

---

## 알림톡 로그 테이블

### `alimtalk_logs`

알림톡 발송 로그

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 로그 고유 ID |
| `user_id` | uuid | FOREIGN KEY | - | 사용자 ID (users.id) |
| `order_id` | uuid | FOREIGN KEY | - | 주문 ID (orders.id) |
| `phone_number` | text | NOT NULL | - | 수신 전화번호 |
| `template_code` | text | NOT NULL | - | 알림톡 템플릿 코드 |
| `message_content` | text | - | - | 메시지 내용 |
| `variables` | jsonb | - | - | 템플릿 변수 (JSON) |
| `status` | text | NOT NULL | - | 발송 상태 (pending, success, failed) |
| `error_code` | text | - | - | 에러 코드 |
| `error_message` | text | - | - | 에러 메시지 |
| `retry_count` | integer | - | `0` | 재시도 횟수 |
| `sent_at` | timestamptz | - | - | 발송 완료 일시 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

**외래키**:
- `user_id` → `users(id)`
- `order_id` → `orders(id)`

---

## 백업 테이블

### `master_contents_backup`

`master_contents` 테이블의 백업 테이블 (컬럼 구조 동일, 제약조건 없음)

### `master_content_questions_backup`

`master_content_questions` 테이블의 백업 테이블 (컬럼 구조 동일, 제약조건 없음)

---

## 테이블 관계도

```
users (사용자)
  ├─→ saju_records (1:N) - 사용자의 사주 정보
  ├─→ orders (1:N) - 사용자의 주문 내역
  ├─→ user_coupons (1:N) - 사용자의 쿠폰
  ├─→ alimtalk_logs (1:N) - 사용자의 알림톡 로그
  ├─→ user_trait_tags (1:N) - 나다움 성향 태그
  └─→ weekly_reports (1:N) - 사용자의 주간 보고서

master_contents (콘텐츠)
  ├─→ master_content_questions (1:N) - 콘텐츠의 질문들
  └─→ orders (1:N) - 콘텐츠별 주문

orders (주문)
  ├─→ order_results (1:N) - 주문별 AI 응답 결과
  ├─→ user_coupons (1:N) - 주문에 사용된 쿠폰
  └─→ alimtalk_logs (1:N) - 주문 관련 알림톡

saju_records (사주 정보)
  └─→ orders (1:N) - 사주 정보로 생성된 주문

master_content_questions (질문)
  └─→ order_results (1:N) - 질문별 AI 응답

coupons (쿠폰 마스터)
  └─→ user_coupons (1:N) - 발급된 쿠폰들

weekly_reports (주간 보고서)
  ├─→ weekly_report_sections (1:N) - 보고서 섹션들
  └─→ report_tarot_selections (1:N) - 보고서 타로 선택
```

---

## 주요 비즈니스 로직

### 1. 무료 콘텐츠 플로우
- `master_contents.content_type = 'free'`
- 결제 없이 바로 사주 정보 입력 → AI 생성 (localStorage 휘발성 저장)
- `orders` 테이블에 기록되지 않음

### 2. 유료 콘텐츠 플로우
- `master_contents.content_type = 'paid'`
- 결제 → `orders` 테이블 생성
- Edge Function으로 AI 생성 → `order_results` 테이블에 저장
- DB 폴링으로 결과 확인

### 3. 사주 정보 관리
- 로그인 사용자: `saju_records` 테이블에 저장
  - `notes = '본인'`: 본인 사주
  - `notes = '배우자'`, `notes = '지인'` 등: 관계 사주
  - `is_primary = true`: 대표 사주 (notes와 무관하게 사용자가 선택)
- 로그아웃 사용자: `localStorage`에만 저장 (휘발성)

### 4. 질문 타입
- `question_type = 'saju'`: 사주 기반 질문
- `question_type = 'tarot'`: 타로 카드 질문 (카드 이미지 포함)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0.0 | 2024-12-17 | 초기 문서 작성 | AI Assistant |
| 1.1.0 | 2024-12-18 | saju_records 테이블에 calendar_type, zodiac 컬럼 추가 | AI Assistant |
| 1.2.0 | 2024-12-18 | saju_records 테이블에 is_primary 컬럼 추가 (대표 사주 관리) | AI Assistant |
| 1.3.0 | 2026-01-07 | orders 테이블에 webhook_verified_at, refund 관련 컬럼 추가 (결제 안정성 강화) | AI Assistant |
| 1.3.1 | 2026-01-13 | 스키마 검토 완료 (변경 없음) - 사주 API/캐시 버스팅은 클라이언트 측 변경 | AI Assistant |
| 1.3.2 | 2026-01-13 | 스테이징 스키마를 프로덕션 기준으로 되돌림 (orders.content_id nullable, refund_amount DEFAULT 제거) | AI Assistant |
| 1.4.0 | 2026-01-21 | users 테이블에 visit_count 컬럼 추가 (일일 방문 횟수 추적) | AI Assistant |
| 1.5.0 | 2026-01-29 | user_trait_tags 테이블 추가 (나다움 성향 태그 저장) | AI Assistant |
| 1.6.0 | 2026-02-02 | weekly_reports, weekly_report_sections, report_tarot_selections 테이블 추가, user_trait_tags 컬럼명 수정 (name→tag_name, type→tag_type), is_confirmed 컬럼 추가, coupons.coupon_type 설명 수정 | AI Assistant |
| 1.7.0 | 2026-02-03 | pg_cron 스케줄 추가 (주간 보고서 자동 발송), Vault에 service_role_key 저장 | AI Assistant |
| 1.8.0 | 2026-02-04 | users 테이블에 visit_dates 컬럼 추가 (KST 기준 방문 날짜 배열) | AI Assistant |
| 1.9.0 | 2026-02-06 | anonymous_free_views 테이블 추가, pg_cron cleanup-anonymous-free-views 스케줄 등록 | AI Assistant |
| 2.0.0 | 2026-02-09 | users 테이블에 rejected_tags 컬럼 추가, anonymous_free_views UNIQUE 제약 제거 (INSERT 방식 변경), last_login_at 갱신 로직 변경 (HomePage → App.tsx recordTodayVisit) | AI Assistant |
| 2.1.0 | 2026-02-09 | coupons.coupon_type에 mission 타입 추가 (미션성공쿠폰) | AI Assistant |

---

## 업데이트 가이드

스키마가 변경될 때마다 이 문서를 업데이트해주세요:

1. **테이블 추가**: 해당 섹션에 테이블 정보 추가
2. **컬럼 변경**: 테이블의 컬럼 정보 수정
3. **관계 변경**: 테이블 관계도 업데이트
4. **변경 이력**: 하단 변경 이력 테이블에 기록

---

**문서 끝**