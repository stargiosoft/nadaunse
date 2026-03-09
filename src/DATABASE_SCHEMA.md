# 데이터베이스 스키마 문서

> **작성일**: 2024-12-17
> **최종 업데이트**: 2026-03-05
> **필수 문서**: [CLAUDE.md](../CLAUDE.md) - 개발 규칙
> **경고**: 이 문서는 참고용이며, 스키마 변경 시 수동으로 업데이트해야 합니다.

---

## 사용자 관련 테이블

### `users`

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
| `last_login_at` | timestamptz | - | `now()` | 마지막 방문 일시 (App.tsx → recordTodayVisit()에서 갱신) |
| `visit_count` | integer | - | `1` | 총 방문 일수 (일일 방문 기준) |
| `visit_dates` | date[] | - | `'{}'` | KST 기준 방문 날짜 목록 |
| `rejected_tags` | text[] | - | `'{}'` | AI 태그 추출 시 제외할 태그 목록 |
| `created_at` | timestamptz | - | `now()` | 계정 생성 일시 |
| `role` | text | CHECK | `'user'` | 사용자 권한 (master, admin, user) |
| `sprout_balance` | integer | NOT NULL, CHECK | `10` | 새싹 잔액 (CHECK >= 0). **Column DEFAULT가 초기 지급량의 단일 소스** (Edge Function/트리거에서 미지정) |
| `referral_code` | text | UNIQUE | - | 레퍼럴 코드 (NDS-XXXXXX 형식) |
| `is_suspicious_referral` | boolean | NOT NULL | `false` | 부정 레퍼럴 의심 유저 (동일 IP+UA fingerprint 3건 이상) |

**제약조건**: `role` CHECK: master/admin/user | `sprout_balance` CHECK: >= 0

---

## 사주 정보 테이블

### `saju_records`

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 사주 레코드 고유 ID |
| `user_id` | uuid | FOREIGN KEY | - | 사용자 ID (users.id) |
| `full_name` | text | NOT NULL | - | 이름 |
| `gender` | text | NOT NULL | - | 성별 (male, female) |
| `birth_date` | timestamptz | NOT NULL | - | 생년월일 |
| `birth_time` | text | NOT NULL | - | 출생 시간 (HH:mm 형식) |
| `calendar_type` | text | - | `'solar'` | 양력/음력 구분 (solar, lunar) |
| `zodiac` | text | - | - | 띠 정보 |
| `notes` | text | - | - | 관계 메모 (연인, 가족, 친구, 지인, 동료, 기타) |
| `phone_number` | text | - | - | 전화번호 |
| `is_primary` | boolean | - | `false` | 대표 사주 여부 (사용자당 1개만 true) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |
| `updated_at` | timestamptz | NOT NULL | `now()` | 수정 일시 |

**외래키**: `user_id` → `users(id)`

---

## 콘텐츠 관련 테이블

### `master_contents`

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
| `recommended_paid_content_id` | uuid | FOREIGN KEY | - | 추천 유료 콘텐츠 ID (무료→유료 업셀링 매핑) |
| `upsell_hook_text` | text | - | - | 유료 전환 유도 문구 (동적 후킹 멘트) |
| `published_at` | timestamptz | - | - | 배포 일시 |

**제약조건**: `content_type` CHECK: free/paid
**자기참조 FK**: `recommended_paid_content_id` → `master_contents(id)` (무료 콘텐츠가 추천할 유료 콘텐츠)

### `master_content_questions`

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

**외래키**: `content_id` → `master_contents(id)` | **제약조건**: `question_type` CHECK: saju/tarot

---

## 주문 및 결제 테이블

### `orders`

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
| `webhook_verified_at` | timestamptz | - | - | 결제 웹훅 검증 일시 |
| `refund_amount` | integer | - | - | 환불 금액 |
| `refund_reason` | text | - | - | 환불 사유 |
| `refunded_at` | timestamptz | - | - | 환불 처리 일시 |
| `created_at` | timestamptz | NOT NULL | `now()` | 주문 생성 일시 |
| `updated_at` | timestamptz | NOT NULL | `now()` | 주문 수정 일시 |

**외래키**: `user_id` → `users(id)` | `content_id` → `master_contents(id)` | `saju_record_id` → `saju_records(id)`

### `order_results`

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 결과 고유 ID |
| `order_id` | uuid | NOT NULL, FOREIGN KEY | - | 주문 ID (orders.id) |
| `question_id` | uuid | NOT NULL, FOREIGN KEY | - | 질문 ID (master_content_questions.id) |
| `question_order` | integer | NOT NULL | - | 질문 순서 |
| `question_type` | text | - | - | 질문 타입 (saju, tarot) |
| `question_text` | text | - | - | 질문 내용 (캐시) |
| `gpt_response` | text | - | - | GPT 응답 내용 |
| `tarot_card_name` | text | - | - | 타로 카드 이름 |
| `tarot_card_image_url` | text | - | - | 타로 카드 이미지 URL (Supabase Storage) |
| `tarot_user_viewed` | boolean | - | - | 사용자가 타로 카드를 확인했는지 여부 |
| `model_used` | text | - | - | 사용된 AI 모델명 |
| `status` | text | - | `'pending'` | 생성 상태 (pending, completed, failed) |
| `error_message` | text | - | - | 에러 메시지 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |
| `updated_at` | timestamptz | - | `now()` | 수정 일시 |

**외래키**: `order_id` → `orders(id)` | `question_id` → `master_content_questions(id)`

---

## 쿠폰 관련 테이블

### `coupons`

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

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 사용자 쿠폰 고유 ID |
| `user_id` | uuid | NOT NULL, FOREIGN KEY | - | 사용자 ID (users.id) |
| `coupon_id` | uuid | NOT NULL, FOREIGN KEY | - | 쿠폰 ID (coupons.id) |
| `is_used` | boolean | - | `false` | 사용 여부 |
| `used_at` | timestamptz | - | - | 사용 일시 |
| `used_order_id` | uuid | FOREIGN KEY | - | 쿠폰을 **사용해서 결제한** 주문 ID (orders.id) |
| `source_order_id` | uuid | - | - | 쿠폰이 **발급된 원인** ID (주문/보고서 ID, 외래키 없음) |
| `issued_at` | timestamptz | - | `now()` | 발급 일시 |
| `expired_at` | timestamptz | - | - | 만료 일시 |

**외래키**: `user_id` → `users(id)` | `coupon_id` → `coupons(id)` | `used_order_id` → `orders(id)`

---

## 무료 콘텐츠 기록 테이블

### `free_content_records`

로그인 사용자의 무료 콘텐츠 이용 기록 (운세 기록 페이지에서 조회용)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 레코드 고유 ID |
| `user_id` | uuid | FOREIGN KEY | - | 사용자 ID (users.id) |
| `content_id` | uuid | FOREIGN KEY, NOT NULL | - | 콘텐츠 ID (master_contents.id) |
| `content_title` | text | - | - | 이용 당시 콘텐츠 제목 (제목 변경 시에도 원래 제목 유지) |
| `saju_record_id` | uuid | FOREIGN KEY | - | 사주 정보 ID (saju_records.id) |
| `full_name` | text | NOT NULL | - | 이름 |
| `gender` | text | NOT NULL | - | 성별 (male, female) |
| `birth_date` | timestamptz | NOT NULL | - | 생년월일 |
| `birth_time` | text | - | - | 출생 시간 |
| `is_guest` | boolean | - | `false` | 게스트 여부 |
| `answers` | jsonb | NOT NULL | - | AI 생성 답변 배열 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

**외래키**: `user_id` → `users(id)` ON DELETE SET NULL | `content_id` → `master_contents(id)` ON DELETE CASCADE | `saju_record_id` → `saju_records(id)` ON DELETE SET NULL

**인덱스**: `idx_free_content_records_user_created` (user_id, created_at DESC) WHERE user_id IS NOT NULL | `idx_free_content_records_content` (content_id)

**answers JSONB 구조**: `[{ "question_id": "q1", "question_order": 1, "question_text": "...", "answer_text": "..." }]`
- `question_id`, `question_order`는 PurchaseHistoryPage 정렬용 필수 필드
- 2026-01-30 이전 레코드는 해당 필드 없을 수 있음 (fallback 처리 필요)

### `anonymous_free_views`

비회원 무료 콘텐츠 일일 이용 제한 추적 (IP+UA fingerprint 기반)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 레코드 고유 ID |
| `fingerprint` | text | NOT NULL | - | IP+UserAgent SHA-256 해시 |
| `content_id` | uuid | FOREIGN KEY, NOT NULL | - | 콘텐츠 ID (master_contents.id) |
| `viewed_date` | date | NOT NULL | - | KST 기준 조회 날짜 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**외래키**: `content_id` → `master_contents(id)` ON DELETE CASCADE

**인덱스**: `idx_anonymous_free_views_fingerprint_date` (fingerprint, viewed_date) | `idx_anon_views_unique` UNIQUE (fingerprint, content_id, viewed_date)

**용도**: 비회원 하루 3개 무료 콘텐츠 제한 (서버 2차 검증). `generate-free-preview`에서 Service Role Key로만 접근. RLS Enabled (정책 없음). pg_cron으로 매일 KST 09:00 전날 이전 데이터 자동 삭제.

### `anonymous_consult_views`

비회원 사주/타로 상담 체험 1회 제한 추적 (IP+UA fingerprint 기반, 영구 보관)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PK | `gen_random_uuid()` | 고유 ID |
| `fingerprint` | text | NOT NULL, UNIQUE | - | SHA-256(IP+UA) 해시 |
| `consult_type` | text | NOT NULL | - | 상담 유형 ('saju' \| 'taro') |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

**인덱스**: UNIQUE (fingerprint) — 사주+타로 통합 1회 제한

**용도**: 비회원 상담 체험 최초 1회 제한 (서버 권위적 검증). `generate-tarot-consult`, `generate-saju-consult`에서 Service Role Key로만 접근. RLS 불필요. cron 정리 없음 (영구 보관).

### `user_consult_daily`

로그인 유저 사주/타로 상담 일일 1회 제한 추적 (매일 자동 정리)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PK | `gen_random_uuid()` | 고유 ID |
| `user_id` | uuid | NOT NULL | - | 사용자 ID (auth.users) |
| `consult_type` | text | NOT NULL, CHECK | - | 상담 유형 ('saju' \| 'taro') |
| `consulted_date` | date | NOT NULL | `CURRENT_DATE` | 상담 날짜 (KST 기준) |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

**인덱스**: UNIQUE (user_id, consult_type, consulted_date) — 일일 1회 제한

**용도**: 로그인 유저 상담 하루 1회 제한 (서버 검증). `generate-saju-consult`, `generate-tarot-consult`에서 Service Role Key로만 접근. RLS Enabled (정책 없음). pg_cron `cleanup-user-consult-daily`로 매일 KST 09:00 전날 이전 데이터 자동 삭제.

---

## 나다움 태그 테이블

### `user_trait_tags`

사용자별 나다움 성향 태그 (GPT-5-nano로 추출)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 태그 고유 ID |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | - | 사용자 ID (users.id) |
| `tag_name` | text | NOT NULL | - | 태그 이름 (예: "창의적인") |
| `tag_type` | text | NOT NULL, CHECK | - | 태그 유형 (positive, negative, neutral) |
| `source_content_id` | uuid | FOREIGN KEY | - | 태그 출처 콘텐츠 ID (master_contents.id) |
| `source_order_id` | uuid | FOREIGN KEY | - | 태그 출처 주문 ID (orders.id) - 유료용 |
| `source_type` | text | NOT NULL, CHECK | - | 출처 유형 (free_content, paid_content) |
| `is_confirmed` | boolean | NOT NULL | `false` | 사용자 확인/승인 여부 |
| `created_at` | timestamptz | - | `now()` | 생성 일시 |

**외래키**: `user_id` → `users(id)` ON DELETE CASCADE | `source_content_id` → `master_contents(id)` ON DELETE SET NULL | `source_order_id` → `orders(id)` ON DELETE SET NULL

**제약조건**: `tag_type` CHECK: positive/negative/neutral | `source_type` CHECK: free_content/paid_content

**인덱스**: `idx_user_trait_tags_user` (user_id) | `idx_user_trait_tags_user_created` (user_id, created_at DESC)

**용도**: 운세 결과에서 장점 2개, 단점 1개 성향 키워드 추출. `extract-trait-tags` → `save-trait-tags` Edge Function으로 처리.

---

## 주간 보고서 테이블

### `weekly_reports`

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 보고서 고유 ID |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | - | 사용자 ID (users.id) |
| `year` | integer | NOT NULL | - | 연도 |
| `month` | integer | NOT NULL, CHECK | - | 월 (1~12) |
| `week` | integer | NOT NULL, CHECK | - | 주차 (1~5) |
| `week_start_date` | date | NOT NULL | - | 주간 시작일 |
| `week_end_date` | date | NOT NULL | - | 주간 종료일 |
| `status` | text | NOT NULL, CHECK | `'pending'` | 상태 (pending, generating, completed, failed) |
| `tag_count` | integer | NOT NULL | `0` | 해당 주간 태그 수 |
| `situation_summary` | text | - | - | 상황 요약 (AI 생성) |
| `to_do_list` | jsonb | - | - | 다음주 목표 리스트 `[{ "id": 1, "text": "목표" }]` |
| `self_encouragement` | text | - | - | 사용자가 작성한 응원글 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |
| `published_at` | timestamptz | - | - | 발행 일시 |

**외래키**: `user_id` → `users(id)`

**제약조건**: `month` CHECK: 1~12 | `week` CHECK: 1~5 | `status` CHECK: pending/generating/completed/failed

### `weekly_report_sections`

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 섹션 고유 ID |
| `report_id` | uuid | FOREIGN KEY, NOT NULL | - | 보고서 ID (weekly_reports.id) |
| `section_type` | text | NOT NULL, CHECK | - | 섹션 타입 (my_story, emotion_diagnosis, tarot_reading, soul_prescription) |
| `section_order` | integer | NOT NULL, CHECK | - | 섹션 순서 (1~4) |
| `title` | text | NOT NULL | - | 섹션 제목 |
| `content` | jsonb | - | - | 섹션 콘텐츠 (AI 생성) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**외래키**: `report_id` → `weekly_reports(id)`

**제약조건**: `section_type` CHECK: my_story/emotion_diagnosis/tarot_reading/soul_prescription | `section_order` CHECK: 1~4

**content JSONB 구조**: my_story/soul_prescription → `{ "section_id", "title", "content_paragraphs": [...] }` | tarot_reading → `{ "section_id", "title", "card_1_interpretation", "card_2_interpretation", "card_3_interpretation" }`

### `report_tarot_selections`

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

**외래키**: `report_id` → `weekly_reports(id)` | **제약조건**: `card_order` CHECK: 1~3

---

## 심리 상태 통합 테이블

### `user_situation_summaries`

주간 보고서와 유료 콘텐츠 풀이의 situation_summary 통합 관리. `generate-weekly-report`(GPT-5.1)과 `generate-content-answers`(gpt-4.1-nano)에서 INSERT.

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 고유 ID |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | - | 사용자 ID (users.id) |
| `situation_summary` | text | NOT NULL | - | AI가 추출한 심리 상태 요약 (150-200자) |
| `source_type` | text | NOT NULL, CHECK | - | 출처 (weekly_report, content_answer) |
| `source_id` | uuid | - | - | 출처 레코드 ID (weekly_reports.id 또는 orders.id) |
| `period_start` | date | NOT NULL | - | 분석 대상 기간 시작 |
| `period_end` | date | NOT NULL | - | 분석 대상 기간 종료 |
| `model_used` | text | - | - | 사용된 AI 모델 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**외래키**: `user_id` → `users(id)` ON DELETE CASCADE | **인덱스**: `idx_user_situation_summaries_user_created` (user_id, created_at DESC) | **RLS**: Service Role Key 전용

---

## 알림톡 로그 테이블

### `alimtalk_logs`

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

**외래키**: `user_id` → `users(id)` | `order_id` → `orders(id)`

---

## 새싹 관련 테이블

### `sprout_transactions`

새싹 충전/차감/환불 거래 내역

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 거래 고유 ID |
| `user_id` | uuid | FOREIGN KEY | - | 사용자 ID (users.id) |
| `transaction_type` | text | NOT NULL, CHECK | - | 거래 유형 (charge, deduct, refund, reward) |
| `amount` | integer | NOT NULL | - | 거래 수량 |
| `balance_before` | integer | NOT NULL | - | 거래 전 잔액 |
| `balance_after` | integer | NOT NULL | - | 거래 후 잔액 |
| `description` | text | - | - | 거래 설명 |
| `related_order_id` | uuid | - | - | 관련 주문 ID |
| `related_content_id` | text | - | - | 관련 콘텐츠 ID |
| `payment_amount` | integer | - | - | 실제 결제 금액 (KRW) |
| `ip_fingerprint` | text | - | - | IP+UA SHA-256 해시 (미션 리워드 기기 중복 방지) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**외래키**: `user_id` → `users(id)`

### `sprout_packages`

새싹 충전 패키지 정보

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 패키지 고유 ID |
| `name` | text | NOT NULL | - | 패키지 이름 |
| `base_amount` | integer | NOT NULL | - | 기본 새싹 수량 |
| `bonus_amount` | integer | NOT NULL | - | 보너스 새싹 수량 |
| `total_amount` | integer | NOT NULL | - | 총 새싹 수량 (base + bonus) |
| `price_krw` | integer | NOT NULL | - | 가격 (KRW) |
| `badge` | text | - | - | 배지 텍스트 (BEST 등) |
| `sort_order` | integer | - | - | 정렬 순서 |
| `is_active` | boolean | - | `true` | 활성화 여부 |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

---

## 공유 리워드 테이블

### `referral_signups`

레퍼럴 가입 기록 (추천인-피추천인 매핑)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 고유 ID |
| `referrer_id` | uuid | FOREIGN KEY, NOT NULL | - | 추천인 ID (auth.users.id) |
| `referred_id` | uuid | FOREIGN KEY, NOT NULL, UNIQUE | - | 피추천인 ID (auth.users.id) |
| `reward_round` | integer | NOT NULL | - | 리워드 회차 |
| `ip_fingerprint` | text | - | - | IP+UA SHA-256 해시 (부정 탐지용) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**인덱스**: `idx_referral_signups_referrer` (referrer_id) | `idx_referral_signups_round` (referrer_id, reward_round) | `idx_referral_signups_fingerprint` (ip_fingerprint)

### `share_rewards`

리워드 회차 진행 상황 (피보나치 기반)

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | 고유 ID |
| `user_id` | uuid | FOREIGN KEY, NOT NULL | - | 사용자 ID (auth.users.id) |
| `round` | integer | NOT NULL | - | 회차 번호 |
| `required_count` | integer | NOT NULL | - | 필요 추천 인원 (피보나치: 1,1,2,3,5,8...) |
| `current_count` | integer | NOT NULL | `0` | 현재 추천 인원 |
| `sprout_amount` | integer | NOT NULL | `30` | 리워드 새싹 수량 |
| `achieved_at` | timestamptz | - | - | 달성 일시 (NULL = 진행 중) |
| `created_at` | timestamptz | NOT NULL | `now()` | 생성 일시 |

**제약조건**: `unique_user_round` UNIQUE (user_id, round)

**인덱스**: `idx_share_rewards_user` (user_id) | `idx_share_rewards_active` (user_id) WHERE achieved_at IS NULL

---

## 백업 테이블

- `master_contents_backup`: `master_contents` 백업 (컬럼 구조 동일, 제약조건 없음)
- `master_content_questions_backup`: `master_content_questions` 백업 (컬럼 구조 동일, 제약조건 없음)

---

## 테이블 관계도

```
users ─→ saju_records (1:N), orders (1:N), user_coupons (1:N), alimtalk_logs (1:N),
         user_trait_tags (1:N), weekly_reports (1:N), sprout_transactions (1:N),
         referral_signups (1:N, referrer_id), share_rewards (1:N)
master_contents ─→ master_content_questions (1:N), orders (1:N), master_contents (self-ref, recommended_paid_content_id)
orders ─→ order_results (1:N), user_coupons (1:N), alimtalk_logs (1:N)
saju_records ─→ orders (1:N)
master_content_questions ─→ order_results (1:N)
coupons ─→ user_coupons (1:N)
weekly_reports ─→ weekly_report_sections (1:N), report_tarot_selections (1:N)
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
  - `notes = '본인'`: 본인 사주 | `is_primary = true`: 대표 사주 (notes와 무관)
- 로그아웃 사용자: `localStorage`에만 저장 (휘발성)

### 4. 질문 타입
- `question_type = 'saju'`: 사주 기반 질문
- `question_type = 'tarot'`: 타로 카드 질문 (카드 이미지 포함)

### 5. RPC 함수

| 함수명 | 파라미터 | 반환 | 용도 |
|--------|----------|------|------|
| `process_mission_reward` | `p_user_id UUID, p_reward_amount INTEGER DEFAULT 30` | `JSONB` | 태그 5개 달성 시 새싹 30개 즉시 지급. 중복 방지 (sprout_transactions에서 기존 reward 체크). `SECURITY DEFINER`, service_role 전용 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2.2.0 | 2026-02-25 | user_situation_summaries 테이블 추가 (주간 보고서 + 콘텐츠 풀이 심리 상태 통합 관리) | AI Assistant |
| 2.3.0 | 2026-02-26 | users 테이블에 sprout_balance 컬럼 추가, sprout_transactions/sprout_packages 테이블 추가 (새싹 충전소 기능) | AI Assistant |
| 2.4.0 | 2026-03-05 | user_consult_daily 테이블 추가, process_mission_reward RPC 추가, 테이블 수 25개 | AI Assistant |
| 2.5.0 | 2026-03-06 | master_contents에 recommended_paid_content_id(자기참조 FK), upsell_hook_text 컬럼 추가 (업셀링 시스템) | AI Assistant |

---

## 업데이트 가이드

스키마가 변경될 때마다 이 문서를 업데이트해주세요:

1. **테이블 추가**: 해당 섹션에 테이블 정보 추가
2. **컬럼 변경**: 테이블의 컬럼 정보 수정
3. **관계 변경**: 테이블 관계도 업데이트
4. **변경 이력**: 하단 변경 이력 테이블에 기록 (최근 3개만 유지)

---

**문서 끝**