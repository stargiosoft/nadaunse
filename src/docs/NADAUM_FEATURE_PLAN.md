# 나다움 찾기 기능 개발 계획

> **상태**: Phase 1-5 완료 ✅ + 관리자 패널 추가
> **최종 업데이트**: 2026-02-03

---

## 1. 개요

### 목적
- 나의 다양한 모습을 발견하고 자기 수용 지원
- '자존감 지킴이' 포지셔닝

### Phase 1 범위
1. **나다움 태그 저장**: 운세 결과에서 성향 태그 선택/저장
2. **나 보고서 발행**: 주간 분석 보고서 (일요일 발행)

---

## 2. 신규 테이블 (4개)

### 2.1 `user_trait_tags` - 나의 성향 태그
사용자가 저장한 성향 태그 기록

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| tag_name | text | 태그명 (예: "예민한") |
| tag_type | text | positive/negative/neutral |
| source_type | text | free_content/paid_content |
| source_content_id | uuid | FK → master_contents.id |
| source_order_id | uuid | FK → orders.id (유료만) |
| created_at | timestamptz | 저장 일시 |

### 2.2 `weekly_reports` - 주간 나 보고서
주간 분석 보고서 메타 정보

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| year | integer | 연도 |
| month | integer | 월 (1-12) |
| week | integer | 주차 (1-5) |
| week_start_date | date | 주 시작일 (월요일) |
| week_end_date | date | 주 종료일 (일요일) |
| status | text | pending/generating/completed/failed |
| tag_count | integer | 해당 주 태그 수 |
| **self_encouragement** | **text** | **나에게 응원하기 글 (2026-02-02 추가)** |
| created_at | timestamptz | 생성 일시 |
| published_at | timestamptz | 발행 일시 |

### 2.3 `weekly_report_sections` - 보고서 섹션
보고서 내 각 섹션의 AI 생성 콘텐츠

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK |
| report_id | uuid | FK → weekly_reports.id |
| section_type | text | my_story/emotion_diagnosis/tarot_reading/soul_prescription |
| section_order | integer | 섹션 순서 (1-4) |
| title | text | 섹션 제목 |
| content | jsonb | 섹션 콘텐츠 |
| created_at | timestamptz | 생성 일시 |

### 2.4 `report_tarot_selections` - 보고서 타로 카드
보고서 내 3카드 타로 선택 기록

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | uuid | PK |
| report_id | uuid | FK → weekly_reports.id |
| card_order | integer | 카드 순서 (1-3) |
| card_name | text | 카드명 |
| card_image_url | text | 카드 이미지 URL |
| interpretation | text | AI 해석 |
| user_viewed | boolean | 사용자 확인 여부 |
| created_at | timestamptz | 선택 일시 |

---

## 3. 구현 진행 상황

### Phase 1: DB & 기본 인프라 ✅
- [x] 마이그레이션 SQL 작성
- [x] 스테이징 DB에 적용 (2026-01-28 완료)
- [x] RLS 정책 설정 (SELECT, INSERT, DELETE, UPDATE)
- [x] 인덱스 생성

### Phase 2: 태그 추출 & 저장 기능 ✅
- [x] extract-trait-tags Edge Function (GPT-5-nano)
- [x] 무료 콘텐츠 태그 추출 (App.tsx - FreeResultPage)
- [x] 유료 콘텐츠 태그 추출 (UnifiedResultPage.tsx)
- [x] 태그 추출 로딩 페이지 (TagExtractionLoading)
- [x] user_trait_tags DB 저장
- [x] 캐시 무효화 연동

### Phase 3: 프로필 태그 표시 ✅
- [x] NadaumTags.tsx - 빈 상태 + 추천 운세 섹션
- [x] NadaumTagsList.tsx - 태그 목록 페이지
- [x] 태그 삭제/복원 기능 (Optimistic UI + Toast)
- [x] 캐싱 시스템 (localStorage, 5분 만료)
- [x] "오늘의 한 줄 위로" 랜덤 문구 기능 (2026-01-29 완료)
- [x] 라우팅 설정

### Phase 4: 주간 보고서 ✅
- [x] generate-weekly-report Edge Function (GPT-5.1 기반 보고서 생성)
- [x] generate-weekly-reports-batch Edge Function (배치 처리, concurrency: 5)
- [x] 보고서 메모 페이지 (ReportWeeklyMemo.tsx) - 다중 모드 지원
  - [x] write 모드: 최초 작성 (이전/완료 버튼)
  - [x] view 모드: 다시보기 (X 닫기 버튼, 이전/닫기 버튼, 수정 연필 아이콘)
  - [x] edit 모드: 수정하기 (ReportWeeklyMemoEdit 사용)
- [x] self_encouragement 필드 추가 (weekly_reports 테이블)
- [x] UPDATE RLS 정책 추가 (스테이징)
- [x] 보고서 완료 → 쿠폰 페이지 연결 (CompletionCoupon.tsx)
- [x] 재구매 쿠폰 발급 로직 (issueRevisitCoupon)
- [x] MyReportList에 응원글 표시
- [x] 기존 보고서 중복 방지 로직 (forceRegenerate 옵션)

### Phase 5: 알림톡 & 자동 발송 ✅
- [x] send-report-alimtalk Edge Function (TalkDream API, 5회 재시도)
- [x] pg_cron + pg_net 스케줄 설정
  - 스케줄: 매주 화요일 15:30 KST (테스트용)
  - Vault에서 service_role_key 사용
  - timeout_milliseconds: 300000 (5분)
- [x] 배치 실행 로직 (5명씩 병렬 처리, 2초 간격)

### Phase 6: 관리자 패널 ✅
- [x] get-failed-reports Edge Function (실패 보고서 조회)
- [x] MyReportList.tsx 관리자 패널 UI
  - [x] 마스터 계정 여부 확인 (users.role === 'master')
  - [x] 주차 선택 드롭다운 (최근 8주)
  - [x] 실패 보고서 통계 표시
  - [x] 재발송 버튼 (3분 타임아웃, 2초 간격)

---

## 4. 구현된 컴포넌트 상세

### 4.1 NadaumTags.tsx (빈 상태 페이지)

**경로**: `src/components/NadaumTags.tsx`

**용도**: 태그가 없을 때 표시되는 페이지

**주요 기능**:
- 빈 상태 안내 (EmptyContentSection)
- "태그 쌓기 좋은 운세" 추천 섹션 (가로 스크롤)
- 상단 네비게이션 (뒤로가기, 홈)

**컴포넌트 구조**:
```
NadaumTags
├── TopNavigation (뒤로가기, 제목, 홈)
├── EmptyContentSection (빈 상태 안내)
└── RecommendationSection (추천 운세 카드)
    ├── DealCard (상품 카드)
    └── MoreButton (더보기 버튼)
```

---

### 4.2 NadaumTagsList.tsx (태그 목록 페이지)

**경로**: `src/components/NadaumTagsList.tsx`

**용도**: 저장된 태그가 있을 때 표시되는 메인 페이지

**주요 기능**:
1. **"오늘의 한 줄 위로" 랜덤 문구**
   - 92개 위로 문구 중 랜덤 1개 표시
   - 페이지 유입/새로고침 시마다 변경
   - 로딩 오버헤드 0ms (상수 배열 사용)

2. **태그 탭 전환**
   - "강한 모습" (positive 태그)
   - "섬세한 모습" (negative 태그)
   - 애니메이션 인디케이터

3. **태그 표시/관리**
   - 태그 선택 시 X 버튼 표시
   - 삭제 시 Toast + 실행 취소 (2.2초)
   - Optimistic UI (즉시 반영 → DB 동기화)

4. **캐싱 시스템**
   - localStorage 캐시 (5분 만료)
   - 동기적 초기화 (로딩 플래시 방지)
   - refresh 플래그 기반 갱신

**컴포넌트 구조**:
```
NadaumTagsList
├── Top Navigation (뒤로가기, 제목, 홈)
├── ImageSection (배경 이미지)
│   └── Container1 (그라데이션 박스)
│       └── Container (오늘의 한 줄 위로)
├── Container2 (섹션 제목: 나의 성향 태그)
├── Tab (강한 모습 / 섬세한 모습)
└── NadaumTagsListInternal
    ├── TagContainer (태그 목록)
    │   ├── TagItem (개별 태그 + X 버튼)
    │   └── MoreTagItem (+N 더보기)
    └── MoreSection (더보기/접기 버튼)
```

**상태 관리**:
```typescript
// 랜덤 위로 문구 (마운트 시 1회)
const [randomQuote] = useState(() =>
  COMFORT_QUOTES[Math.floor(Math.random() * COMFORT_QUOTES.length)]
);

// 태그 탭
const [activeTab, setActiveTab] = useState('strong');

// 전체 태그 (캐시에서 초기화)
const [allTags, setAllTags] = useState<TraitTag[]>(initialState.tags);

// 로딩 상태
const [isLoading, setIsLoading] = useState(initialState.isLoading);
```

**캐시 키**:
- `nadaum_all_tags_cache`: 전체 태그 캐시 (5분)
- `trait_tags_needs_refresh`: 갱신 필요 플래그

---

### 4.3 comfortQuotes.ts (위로 문구 데이터)

**경로**: `src/data/comfortQuotes.ts`

**용도**: "오늘의 한 줄 위로" 92개 문구 상수 배열

**구현**:
```typescript
export const COMFORT_QUOTES = [
  "다 때가 있을 뿐 네 잘못이 아니야",
  "괜찮아 쉬어가도 되는 날이야",
  // ... 92개 문구
] as const;
```

**장점**:
- 로딩 0ms: 번들에 포함
- 타입 안전성: `as const`
- 유지보수 용이: 파일 수정만으로 문구 변경

---

### 4.4 extract-trait-tags (Edge Function)

**경로**: `supabase/functions/extract-trait-tags/index.ts`

**용도**: 운세 콘텐츠 답변에서 성향 태그 추출 (GPT-5-nano)

**입력**:
```typescript
interface ExtractTraitTagsRequest {
  contentAnswers: Array<{
    questionText: string
    answerText: string
  }>
  existingTags?: string[]  // 중복 방지용
}
```

**출력**:
```typescript
interface ExtractTraitTagsResponse {
  success: boolean
  tags?: Array<{
    name: string
    type: 'positive' | 'negative' | 'neutral'
  }>
  rawResponse?: TraitTag[]
  error?: string
}
```

**추출 규칙**:
- 장점 2개, 단점 1개 (총 3개)
- 형용사 형태 ("문제 해결력이 있는", "질투심이 많은")
- 12자 이내
- 기존 태그와 중복되지 않는 키워드 우선

**사용 위치**:
| 콘텐츠 | 호출 위치 | 트리거 |
|--------|----------|--------|
| 무료 | `App.tsx` (FreeResultPage) | 결과 진입 시 |
| 유료 | `UnifiedResultPage.tsx` | 결과 진입 시 |
| 로딩 | `App.tsx` (TagExtractionLoading) | 태그 추출 대기 시 |

---

## 5. 데이터 플로우

### 5.1 태그 추출 플로우 (무료/유료 공통)

```
운세 결과 페이지 진입
    ↓
from === 'purchase'? ─Yes→ 스킵 (다시보기)
    │
    No
    ↓
백그라운드에서 태그 추출 시작
    ↓
┌─────────────────────────────────────────────┐
│ 1. 기존 태그 조회 (user_trait_tags)          │
│    → 중복 방지용                             │
│                                              │
│ 2. extract-trait-tags Edge Function 호출    │
│    → contentAnswers + existingTags 전달      │
│    → GPT-5-nano로 장점 2개 + 단점 1개 추출   │
│                                              │
│ 3. 추출 결과 처리                            │
│    → localStorage 임시 저장 (폴링용)          │
│    → user_trait_tags DB 저장                 │
│    → 캐시 무효화 플래그 설정                   │
└─────────────────────────────────────────────┘
    ↓
결과 페이지 마지막 질문 완료
    ↓
태그 추출 완료? ─Yes→ 나다움 기록하기 페이지
    │
    No
    ↓
태그 추출 로딩 페이지 (폴링 대기)
    ↓
추출 완료 → 나다움 기록하기 페이지
```

### 5.2 무료 콘텐츠 태그 추출 상세

```
FreeResultPage 진입 (App.tsx)
    ↓
generate-free-preview 결과 수신
    ↓
답변 생성 완료 후 extract-trait-tags 호출
    ↓
태그 추출 → extractedTags 상태 저장
    ↓
결과 완료 → /free/nadaum-record 이동
    └── state: { contentId, tags: extractedTags }
```

### 5.3 유료 콘텐츠 태그 추출 상세

```
UnifiedResultPage 진입
    ↓
order_results 데이터 로드
    ↓
allResults 로드 완료 즉시 백그라운드 추출 시작
    ↓
extract-trait-tags 호출
    ↓
성공 시:
├── extractedTags 상태 저장
├── localStorage 저장 (extracted_tags_{orderId})
└── user_trait_tags DB 저장
    ↓
마지막 질문 완료 버튼 클릭
    ↓
isTagExtracted? ─Yes→ /paid/nadaum-record 이동
    │               └── state: { orderId, contentId, tags }
    No
    ↓
/paid/tag-loading 이동 (추출 대기)
```

### 5.4 태그 조회 플로우

```
나다움 태그 페이지 진입
    ↓
동기적 캐시 확인 (localStorage)
    ↓
캐시 유효? ─Yes→ 캐시 데이터 사용 (로딩 스킵)
    │
    No
    ↓
Supabase API 호출 (user_trait_tags)
    ↓
상태 업데이트 + 캐시 저장
```

### 5.5 태그 삭제/복원 플로우

```
태그 X 버튼 클릭
    ↓
Optimistic UI: 즉시 목록에서 제거
    ↓
Toast 표시 (2.2초, "실행 취소" 버튼)
    ↓
DB 삭제 요청 (백그라운드)
    ↓
┌─────────────────────────────────────┐
│ "실행 취소" 클릭?                    │
│   Yes → DB 재삽입 + UI 복원         │
│   No  → 삭제 완료                   │
└─────────────────────────────────────┘
```

### 5.6 랜덤 위로 문구 플로우

```
페이지 마운트
    ↓
useState 초기화 함수 실행 (1회만)
    ↓
Math.random() * 92 → 인덱스 선택
    ↓
COMFORT_QUOTES[index] → randomQuote
    ↓
ImageSection에 전달 → 화면 렌더링
```

---

## 6. 파일 구조

```
src/
├── components/
│   ├── NadaumTags.tsx           # 빈 상태 페이지
│   ├── NadaumTagsList.tsx       # 태그 목록 페이지
│   └── UnifiedResultPage.tsx    # 유료 결과 페이지 (태그 추출 포함)
├── data/
│   └── comfortQuotes.ts         # 92개 위로 문구
├── App.tsx                      # 무료 결과 페이지 (FreeResultPage, TagExtractionLoading)
└── docs/
    └── NADAUM_FEATURE_PLAN.md   # 이 문서

supabase/
├── functions/
│   ├── extract-trait-tags/
│   │   └── index.ts             # 태그 추출 Edge Function (GPT-5-nano)
│   ├── generate-weekly-report/
│   │   └── index.ts             # 개별 보고서 생성 (GPT-5.1)
│   ├── generate-weekly-reports-batch/
│   │   └── index.ts             # 배치 보고서 생성 (concurrency: 5)
│   ├── send-report-alimtalk/
│   │   └── index.ts             # 알림톡 발송 (TalkDream API)
│   └── get-failed-reports/
│       └── index.ts             # 실패 보고서 조회 (관리자용)
└── migrations/
    ├── 20260128_nadaum_feature.sql       # DB 스키마 (4개 테이블)
    └── 20260203_weekly_report_cron.sql   # pg_cron 스케줄 설정
```

---

## 7. 마이그레이션 파일

**파일 위치**: `supabase/migrations/20260128_nadaum_feature.sql`

**적용 방법**:
```bash
# 스테이징에만 적용
npx supabase db push --project-ref hyltbeewxaqashyivilu

# 프로덕션 적용 (스테이징 검증 후)
npx supabase db push --project-ref kcthtpmxffppfbkjjkub
```

**포함 내용**:
- 4개 테이블 생성 (user_trait_tags, weekly_reports, weekly_report_sections, report_tarot_selections)
- 인덱스 생성 (조회 성능 최적화)
- RLS 정책 (보안)
- 코멘트 (문서화)

---

## 8. RLS 정책 요약

### user_trait_tags
| 정책 | 대상 | 조건 |
|------|------|------|
| SELECT | authenticated | auth.uid() = user_id |
| INSERT | authenticated | auth.uid() = user_id |
| DELETE | authenticated | auth.uid() = user_id |

### weekly_reports
| 정책 | 대상 | 조건 |
|------|------|------|
| SELECT | authenticated | auth.uid() = user_id |
| INSERT/UPDATE | service_role | Edge Function에서만 |

### weekly_report_sections, report_tarot_selections
| 정책 | 대상 | 조건 |
|------|------|------|
| SELECT | authenticated | 보고서 소유자 확인 (JOIN) |

---

## 9. 검증 체크리스트

### Phase 3 완료 검증 ✅
- [x] `/profile/nadaum-tags` 페이지 접근 가능
- [x] 태그 목록 정상 표시 (강한 모습 / 섬세한 모습 탭)
- [x] 태그 삭제 → Toast → 실행 취소 동작
- [x] 새로고침 시 다른 위로 문구 표시
- [x] 콘솔에 불필요한 로그 없음
- [x] 캐시 동작 (5분 내 재방문 시 API 호출 스킵)

### Phase 4-6 완료 검증 ✅
- [x] 주간 보고서 생성 테스트 (DEV 버튼)
- [x] 알림톡 발송 테스트
- [x] Cron Job 동작 확인 (pg_cron + pg_net)
- [x] 관리자 패널 실패 보고서 조회
- [x] 관리자 패널 재발송 기능
- [ ] **프로덕션 배포 대기** (화요일 15:30 자동 발송 테스트 후)

---

## 10. 참고 문서

- 원본 기획서: 사용자 제공 계획서
- DB 스키마: `DATABASE_SCHEMA.md`
- RLS 정책: `supabase/RLS_POLICIES.md`
- 컴포넌트 인벤토리: `components-inventory.md`

---

## 11. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-28 | Phase 1 완료: DB 스키마 생성, 스테이징 적용 |
| 2026-01-29 | Phase 2 완료: extract-trait-tags Edge Function, 무료/유료 태그 추출 연동 |
| 2026-01-29 | Phase 3 완료: NadaumTagsList 구현, 캐싱, 태그 삭제/복원, "오늘의 한 줄 위로" 랜덤 노출 |
| 2026-01-30 | 버그 수정: 각 운세 결과별 태그 구분 로직 추가 (source_order_id 활용) |
| 2026-01-30 | 버그 수정: 유료 콘텐츠 "다음에 할래요" 스킵 후 재진입 시 버튼 상태 처리 |
| 2026-01-30 | 기능 추가: 로그아웃 사용자 태그 저장 플로우 개선 (로그인 리다이렉트 + 자동 저장) |
| 2026-01-30 | 기능 추가: CardContent 6개 기본 노출 + 페이지네이션, 태그 색상 변경 |
| 2026-01-30 | 버그 수정: WelcomeCoupon welcomePageViewed 플래그 초기화 |
| 2026-01-30 | 버그 수정: 이용기록 캐시 갱신 (free_content_needs_refresh 플래그) |
| 2026-01-30 | 버그 수정: clearUserCaches()에서 pending_trait_tags 있으면 cached_saju_info 보존 |
| 2026-01-30 | 버그 수정: PendingTagsCheck answers에 question_id, question_order 포함 (이용기록 표시) |
| 2026-01-30 | 개선: PendingTagsCheckPage 공통 로딩 UI 적용 (DotLoading) |
| 2026-02-02 | **Phase 4 진행: 주간 보고서 메모/쿠폰 기능** |
| 2026-02-02 | DB: weekly_reports 테이블에 self_encouragement 컬럼 추가 (스테이징) |
| 2026-02-02 | DB: weekly_reports UPDATE RLS 정책 추가 (스테이징) |
| 2026-02-02 | 기능: ReportWeeklyMemo.tsx 다중 모드 지원 (write/view/edit) |
| 2026-02-02 | 기능: CompletionCoupon.tsx 재구매 쿠폰 발급 연동 |
| 2026-02-02 | 기능: MyReportList.tsx 응원글(self_encouragement) 표시 |
| 2026-02-02 | 버그 수정: coupon.ts source_order_id 파라미터명 수정 |
| 2026-02-02 | 라우팅: /report-weekly-memo/:id, /report-completion/:id 추가 |
| 2026-02-03 | **Phase 4-5 완료: 주간 보고서 자동 발송 시스템** |
| 2026-02-03 | Edge Function: generate-weekly-report (GPT-5.1 보고서 생성) |
| 2026-02-03 | Edge Function: generate-weekly-reports-batch (배치 처리, concurrency: 5) |
| 2026-02-03 | Edge Function: send-report-alimtalk (TalkDream API, 5회 재시도) |
| 2026-02-03 | Edge Function: get-failed-reports (실패 보고서 조회) |
| 2026-02-03 | pg_cron 스케줄 설정: 매주 화요일 15:30 KST (테스트용) |
| 2026-02-03 | Vault에 service_role_key 저장 (pg_net 인증용) |
| 2026-02-03 | **Phase 6: 관리자 패널 추가** |
| 2026-02-03 | MyReportList.tsx: 마스터 계정용 관리자 패널 UI |
| 2026-02-03 | 기능: 주차별 실패 보고서 조회 및 재발송 |
| 2026-02-03 | 기능: 기존 보고서 중복 방지 (forceRegenerate 옵션) |
| 2026-02-03 | 버그 수정: 재발송 타임아웃 3분으로 증가 |

---

## 12. 로그아웃 사용자 태그 저장 플로우 (2026-01-30 추가)

### 12.1 플로우 개요

로그아웃 상태에서 무료 콘텐츠 → 나다움 기록하기 → 태그 저장 시:
- **기존**: phone_number 바텀시트 표시 → 저장 불가
- **개선**: 로그인 페이지로 리다이렉트 → 로그인/회원가입 후 자동 저장

### 12.2 상세 플로우

```
로그아웃 상태에서 무료 콘텐츠 결과 확인
    ↓
"나다움 기록하기" 버튼 클릭
    ↓
CheckRecordMe 페이지 진입
    ↓
태그 선택 후 "저장" 버튼 클릭
    ↓
로그인 상태 체크 (supabase.auth.getSession)
    ↓
❌ 로그인 안 됨
    ↓
┌─────────────────────────────────────────────────┐
│ 1. pending_trait_tags localStorage 저장          │
│    - tags: 선택한 태그 배열                       │
│    - contentId: 콘텐츠 ID                        │
│    - orderId: null (아직 DB 저장 전)              │
│    - sourceType: 'free_content'                  │
│                                                  │
│ 2. redirectAfterLogin = '/pending-tags-check'   │
│                                                  │
│ 3. 로그인 페이지로 이동                            │
└─────────────────────────────────────────────────┘
    ↓
로그인 또는 회원가입 진행
    ↓
회원가입 시: 약관 동의 → WelcomeCoupon 페이지
    ↓
WelcomeCoupon 닫기 → AuthCallback
    ↓
┌─────────────────────────────────────────────────┐
│ AuthCallback에서 clearUserCaches() 호출:          │
│                                                  │
│ ⭐ pending_trait_tags가 있으면:                    │
│    - cached_saju_info 보존 (삭제하지 않음)         │
│    - PendingTagsCheck에서 DB 저장에 필요          │
│                                                  │
│ (이 로직이 없으면 사주 정보 손실됨!)               │
└─────────────────────────────────────────────────┘
    ↓
redirectAfterLogin 확인 → /pending-tags-check 페이지로 이동
    ↓
┌─────────────────────────────────────────────────┐
│ PendingTagsCheckPage 실행:                       │
│                                                  │
│ 1️⃣ 사주 정보 저장 (cached_saju_info → DB)        │
│    - saju_records 테이블에 INSERT                │
│    - notes: '본인'                               │
│    - is_primary: true (첫 사주인 경우)           │
│                                                  │
│ 2️⃣ 무료 콘텐츠 결과 저장 (localStorage → DB)     │
│    - localStorage에서 free_content_xxx 키 검색   │
│    - free_content_records 테이블에 INSERT        │
│    - ⭐ answers에 question_id, question_order 포함│
│      (PurchaseHistoryPage 정렬/표시용)           │
│    - free_content_needs_refresh 플래그 설정      │
│                                                  │
│ 3️⃣ phone_number 확인                             │
│    - DB에서 본인 사주의 phone_number 조회         │
└─────────────────────────────────────────────────┘
    ↓
phone_number 있음? ─Yes→ 태그 바로 저장 → 홈으로 이동
    │
    No
    ↓
/nadaum-record/:id 페이지로 이동
    ↓
┌─────────────────────────────────────────────────┐
│ CheckRecordMe 바텀시트 자동 오픈:                 │
│ - open_phone_bottomsheet 플래그 감지             │
│ - pending_trait_tags에서 태그 선택 상태 복원      │
│ - 로그인 상태 체크 (비로그인이면 오픈 안 함)       │
└─────────────────────────────────────────────────┘
    ↓
전화번호 입력 → 저장 버튼 클릭
    ↓
┌─────────────────────────────────────────────────┐
│ handleSave 실행:                                 │
│ 1. phone_number를 saju_records에 UPDATE         │
│ 2. 기존 태그 존재 여부 확인                       │
│    - 없으면: INSERT (새로 저장)                  │
│    - 있으면: UPDATE (is_confirmed = true)       │
│ 3. 캐시 무효화 플래그 설정                        │
└─────────────────────────────────────────────────┘
    ↓
토스트 표시 → 홈으로 이동
```

### 12.3 관련 파일

| 파일 | 역할 |
|------|------|
| `src/App.tsx` | PendingTagsCheckPage 컴포넌트 (사주/무료콘텐츠 저장, 공통 로딩 UI) |
| `src/lib/auth.ts` | clearUserCaches() - pending_trait_tags 있으면 cached_saju_info 보존 |
| `src/components/CheckRecordMe.tsx` | 로그인 체크, 바텀시트 자동 오픈, saveTags/handleSave INSERT 로직 |
| `src/components/PurchaseHistoryPage.tsx` | answers fallback 처리 (question_id, question_order 없는 기존 레코드 호환) |

### 12.4 주요 localStorage 키

| 키 | 용도 | 설정 시점 | 제거 시점 |
|----|------|----------|----------|
| `pending_trait_tags` | 임시 태그 정보 | 로그아웃 상태 저장 클릭 | 태그 저장 완료 |
| `redirectAfterLogin` | 로그인 후 리다이렉트 URL | 로그인 필요 시 | 리다이렉트 후 |
| `open_phone_bottomsheet` | 바텀시트 자동 오픈 | phone_number 없을 때 | 바텀시트 오픈 후 |
| `cached_saju_info` | 임시 사주 정보 | 무료 콘텐츠 사주 입력 | DB 저장 후 |
| `free_content_needs_refresh` | 이용기록 캐시 갱신 | 무료 콘텐츠 저장 후 | 이용기록 로드 시 |
| `welcomePageViewed` | 환영 페이지 중복 방지 | 환영 페이지 닫기 | 회원가입 완료 시 |

### 12.5 saveTags/handleSave INSERT 로직

기존에는 태그가 이미 DB에 있다고 가정하고 UPDATE만 수행했으나, 로그인 후 첫 저장인 경우 태그가 없으므로 INSERT가 필요:

```typescript
// 기존 태그 존재 여부 확인
const { data: existingTags } = await existingTagsQuery;
const hasExistingTags = existingTags && existingTags.length > 0;

if (selectedTagNames.length > 0) {
  if (!hasExistingTags) {
    // ⭐ DB에 태그 없으면 INSERT
    const tagsToInsert = tags.filter(tag => tag.selected).map(tag => ({
      user_id: session.user.id,
      tag_name: tag.label,
      tag_type: tag.type,
      source_type: sourceType,
      source_content_id: contentId || null,
      source_order_id: orderId || null,
      is_confirmed: true
    }));
    await supabase.from('user_trait_tags').insert(tagsToInsert);
  } else {
    // ⭐ DB에 태그 있으면 UPDATE
    await supabase.from('user_trait_tags')
      .update({ is_confirmed: true })
      .eq('user_id', session.user.id)
      .in('tag_name', selectedTagNames)
      ...
  }
}
```

---

## 13. CardContent 개선 (2026-01-30 추가)

### 13.1 변경 내용

| 항목 | 기존 | 변경 |
|------|------|------|
| 기본 노출 개수 | 4개 | 6개 |
| 더보기 동작 | 홈으로 이동 | 6개씩 추가 로드 (페이지네이션) |
| 태그 배경색 | 민트 (#f0f8f8) | 회색 (#f3f3f3) |
| 태그 글자색 | 민트 (#41a09e) | 회색 (#999999) |
| 정렬 기준 | order_count | weekly_clicks |

### 13.2 구현 상세

```typescript
const PAGE_SIZE = 6;
const [isLoadingMore, setIsLoadingMore] = useState(false);
const [hasMore, setHasMore] = useState(true);

const handleMoreClick = async () => {
  if (isLoadingMore || !hasMore) return;
  setIsLoadingMore(true);

  // 이미 로드된 ID 제외하고 추가 로드
  const loadedIds = contents.map(c => c.id);
  const { data } = await supabase
    .from('master_contents')
    .select('id, title, thumbnail_url')
    .eq('content_type', 'free')
    .eq('status', 'deployed')
    .not('id', 'in', `(${loadedIds.join(',')})`)
    .order('weekly_clicks', { ascending: false })
    .limit(PAGE_SIZE);

  if (data && data.length > 0) {
    setContents(prev => [...prev, ...data]);
    setHasMore(data.length >= PAGE_SIZE);
  } else {
    setHasMore(false);
  }
  setIsLoadingMore(false);
};
```

---

## 14. 프로덕션 배포 TODO 🚀

> **스테이징에서 모두 테스트 완료 후 프로덕션에 순서대로 적용**

### 14.1 DB 마이그레이션 (프로덕션)

**1. source_order_id 외래키 제약 제거**
```sql
-- 무료 콘텐츠의 free_content_records.id를 source_order_id에 저장할 수 있도록
-- 외래키 제약 제거 (기존: orders.id만 참조 가능)
ALTER TABLE user_trait_tags
DROP CONSTRAINT IF EXISTS user_trait_tags_source_order_id_fkey;
```

**적용 방법**:
```bash
# Supabase MCP 또는 대시보드에서 실행
# Project ID: kcthtpmxffppfbkjjkub (프로덕션)
```

**배경**:
- 기존: `source_order_id`가 `orders.id`만 참조 → 무료 콘텐츠의 `free_content_records.id` 저장 불가
- 변경 후: 외래키 제약 없음 → 무료/유료 모두 `source_order_id`로 각 운세 결과 구분 가능

---

### 14.2 코드 변경 내역 (2026-01-30)

#### 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/FreeContentLoading.tsx` | resultKey에 timestamp 추가 (동일 콘텐츠/사주 구분) |
| `src/components/CheckRecordMe.tsx` | UPDATE 쿼리에 `.select()` 추가, **로그인 체크 + INSERT 로직 추가** |
| `src/components/PurchaseHistoryPage.tsx` | 태그 확정 여부 조회 시 `source_order_id` 사용 |
| `src/components/UnifiedResultPage.tsx` | `__SKIPPED__` 태그 감지 및 버튼 상태 처리 추가 |
| `src/components/CardContent.tsx` | **6개 기본 노출 + 페이지네이션, 태그 색상 변경** |
| `src/App.tsx` | FreeResultPage, TagExtractionLoadingWrapper, NadaumRecordWrapper, **PendingTagsCheckPage, WelcomeCoupon 플래그 초기화** |

#### 상세 변경 내용

**1. FreeContentLoading.tsx (Lines 181, 434, 485)**
```javascript
// Before
const resultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}`;

// After - timestamp 추가로 동일 콘텐츠/사주도 별개 결과로 구분
const resultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}_${Date.now()}`;
```

**2. CheckRecordMe.tsx (Lines 225-253)**
```javascript
// Before - UPDATE 결과 확인 안 함
const updateQuery = supabase.from('user_trait_tags').update({ is_confirmed: true })...
await updateQuery.eq(...);

// After - .select()로 결과 확인
let updateResult;
if (orderId) {
  updateResult = await supabase
    .from('user_trait_tags')
    .update({ is_confirmed: true })
    .eq('user_id', session.user.id)
    .in('tag_name', selectedTagNames)
    .eq('source_order_id', orderId)
    .select();
} else if (contentId) {
  updateResult = await supabase
    .from('user_trait_tags')
    .update({ is_confirmed: true })
    .eq('user_id', session.user.id)
    .in('tag_name', selectedTagNames)
    .eq('source_content_id', contentId)
    .eq('source_type', sourceType)
    .select();
}
console.log('✅ [CheckRecordMe] 선택 태그 확정 완료:', updateResult?.data?.length || 0, '개');
```

**3. App.tsx - FreeResultPage**
- `freeRecordId` 변수 추가 (location.state?.recordId)
- 태그 조회: `source_content_id` → `source_order_id` + `freeRecordId`로 변경
- 태그 저장: `source_order_id: freeRecordId` 추가
- navigate 시 `freeRecordId` state 전달

**4. App.tsx - TagExtractionLoadingWrapper (DB 폴링 방식으로 변경)**
- ❌ API 직접 호출 제거 (중복 호출 방지)
- ✅ DB 폴링으로 FreeResultPage 태그 추출 완료 대기
- 500ms 간격으로 최대 15초(30회) 폴링
- 태그 발견 시 nadaum-record로 이동

**5. App.tsx - NadaumRecordWrapper**
- `freeRecordId` 변수 추가 (location.state?.freeRecordId)
- CheckRecordMe에 `orderId={freeRecordId}` 전달

**6. PurchaseHistoryPage.tsx (Lines 554-561)**
```javascript
// Before - source_content_id로 조회 → 같은 콘텐츠의 다른 결과까지 "확정됨"으로 표시
.eq('source_content_id', record.content_id)

// After - source_order_id로 각 운세 결과별 확정 여부 확인
.eq('source_order_id', record.id)  // ⭐ 각 운세 결과별 구분
```

**7. UnifiedResultPage.tsx - 유료 콘텐츠 스킵 상태 처리**

**문제**: 유료 콘텐츠에서 "다음에 할래요" 클릭 후 재진입 시:
- 마지막 질문에서 "완료" 대신 "다음" 버튼 표시됨
- "다음" 클릭 시 `__SKIPPED__` 태그가 나다움 기록하기에 노출됨

**원인**: `hasConfirmedTags`는 `PurchaseHistoryPage`에서만 전달되어, 다른 경로로 진입 시 감지 불가

**수정 내용**:
```javascript
// 1. hasConfirmedTagsFromDB 상태 추가 (Line 120)
const [hasConfirmedTagsFromDB, setHasConfirmedTagsFromDB] = useState(false);

// 2. 기존 태그 로드 시 __SKIPPED__ 또는 is_confirmed 체크 (Lines 429-466)
const { data: existingTagsForContent } = await checkQuery;

if (existingTagsForContent && existingTagsForContent.length > 0) {
  // __SKIPPED__ 마커 또는 is_confirmed=true 태그가 있으면 이미 완료/스킵
  const hasSkippedOrConfirmed = existingTagsForContent.some(
    t => t.tag_name === '__SKIPPED__' || t.is_confirmed === true
  );

  if (hasSkippedOrConfirmed) {
    setHasConfirmedTagsFromDB(true);
  }

  // __SKIPPED__ 필터링 후 태그 설정
  const filteredTags = existingTagsForContent.filter(t => t.tag_name !== '__SKIPPED__');
  setExtractedTags(filteredTags.map(t => ({ name: t.tag_name, type: t.tag_type })));
}

// 3. 버튼 레이블 변경 (Line 1159)
nextLabel={currentQuestionOrder === totalQuestions && (hasConfirmedTags || hasConfirmedTagsFromDB) ? '완료' : '다음'}

// 4. handleNext에서도 체크 (Lines 777-790)
if (hasConfirmedTags || hasConfirmedTagsFromDB) {
  navigate('/'); // 나다움 기록하기 스킵
}
```

**결과**:
- "다음에 할래요" 후 재진입 시 마지막 질문에서 "완료" 버튼 표시
- "완료" 클릭 시 홈으로 이동 (나다움 기록하기 스킵)
- `__SKIPPED__` 태그 UI 노출 방지

---

### 14.3 배포 순서

1. **DB 마이그레이션 먼저 적용** (프로덕션)
   - `source_order_id` 외래키 제약 제거
   - 코드 배포 전에 반드시 실행 (그렇지 않으면 INSERT 실패)

2. **코드 배포** (Vercel)
   - 마이그레이션 적용 후 코드 배포
   - 자동 배포 또는 수동 트리거

3. **검증**
   - 무료 콘텐츠 새로 보기 → 태그 추출 확인
   - 동일 콘텐츠 2번 보기 → 각각 태그 추출되는지 확인
   - 이용 기록에서 재진입 → 기존 태그 표시되는지 확인

---

### 14.4 배포 체크리스트

- [ ] DB 마이그레이션 실행 (source_order_id 외래키 제거)
- [ ] 코드 배포 (Vercel)
- [ ] 무료 콘텐츠 태그 추출 테스트
- [ ] 동일 콘텐츠 2번 보기 → 각각 태그 추출 확인
- [ ] 이용 기록 재진입 → 기존 태그 표시 확인
- [ ] 동일 콘텐츠 A만 태그 확정 → B는 "나다움 기록하기" 버튼 표시 확인
- [ ] 나다움 기록하기 → 태그 확정 확인
- [ ] 프로필 페이지 → 태그 표시 확인
- [ ] 유료 콘텐츠 "다음에 할래요" 클릭 후 재진입 → "완료" 버튼 표시 확인
- [ ] 스킵 후 재진입 시 `__SKIPPED__` 태그 UI 미노출 확인
- [ ] **[신규] 로그아웃 상태 태그 저장 → 로그인 리다이렉트 확인**
- [x] **[신규] 회원가입 후 WelcomeCoupon → PendingTagsCheck 자동 이동 확인**
- [x] **[신규] 사주 정보 + 무료 콘텐츠 결과 자동 DB 저장 확인**
- [x] **[신규] 이용 기록에 무료 콘텐츠 표시 확인**
- [x] **[신규] clearUserCaches()에서 cached_saju_info 보존 확인 (pending_trait_tags 있을 때)**
- [x] **[신규] 이용 기록 상세에서 question_id/question_order 없는 기존 레코드도 정상 표시 확인**
- [ ] **[신규] CardContent 6개 노출 + 페이지네이션 동작 확인**

---

### 14.5 롤백 계획

문제 발생 시:

**코드 롤백**: Vercel에서 이전 배포로 롤백

**DB 롤백** (필요한 경우):
```sql
-- 외래키 제약 다시 추가 (롤백)
ALTER TABLE user_trait_tags
ADD CONSTRAINT user_trait_tags_source_order_id_fkey
FOREIGN KEY (source_order_id) REFERENCES orders(id) ON DELETE SET NULL;
```

**주의**: DB 롤백 시 이미 저장된 `free_content_records.id` 값들이 `orders` 테이블에 없으므로 제약 추가 실패할 수 있음. 해당 데이터 정리 필요.

---

## 15. 주간 보고서 메모/쿠폰 기능 (2026-02-02 추가)

### 15.1 기능 개요

주간 보고서 마지막 단계에서 "나에게 응원하기" 글을 작성하고, 완료 시 재구매 쿠폰(3,000원)을 발급하는 기능.

**네비게이션 플로우**:
```
보고서 상세(Detail) → 타로(Tarot) → 타로결과(TarotResult) → 마음처방(MindCare) → 메모(Memo) → 쿠폰완료(Completion) → 홈
```

### 15.2 ReportWeeklyMemo.tsx 다중 모드

| 모드 | 조건 | 상단바 | 하단 버튼 | 설명 |
|------|------|-------|----------|------|
| **loading** | 초기 로딩 중 | - | - | 스켈레톤 UI |
| **write** | self_encouragement 없음 (최초) | 뒤로가기 화살표 | 이전/완료 | 응원글 작성 |
| **view** | self_encouragement 있음 (재방문) | X 닫기 버튼 | 이전/닫기 | 읽기 전용 + 수정 아이콘 |
| **edit** | view에서 연필 아이콘 클릭 | ReportWeeklyMemoEdit | 취소/저장 | 응원글 수정 |

**모드 결정 로직**:
```typescript
useEffect(() => {
  async function fetchSelfEncouragement() {
    if (!reportId) { setMode('write'); return; }

    const { data } = await supabase
      .from('weekly_reports')
      .select('self_encouragement')
      .eq('id', reportId)
      .single();

    if (data?.self_encouragement) {
      setSavedText(data.self_encouragement);
      setText(data.self_encouragement);
      setMode('view'); // 다시보기 모드
    } else {
      setMode('write'); // 작성 모드
    }
  }
  fetchSelfEncouragement();
}, [reportId]);
```

### 15.3 컴포넌트 구조

```
ReportWeeklyMemo
├── TopBar (write 모드: 뒤로가기 화살표)
├── TopBarWithClose (view 모드: X 닫기 버튼)
├── TextAreaSection (write 모드: 입력 필드)
├── 읽기 전용 박스 (view 모드: savedText 표시 + 연필 아이콘)
├── BottomButtons (write 모드: 이전/완료)
├── BottomButtonsView (view 모드: 이전/닫기)
└── ReportWeeklyMemoEdit (edit 모드: 취소/저장)
```

### 15.4 CompletionCoupon.tsx 쿠폰 발급

**발급 시점**: 보고서 완료 페이지 진입 시 자동 발급

```typescript
useEffect(() => {
  async function issueCouponOnFirstVisit() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setIsLoading(false); return; }

    // 재구매 쿠폰 발급 (중복 발급 방지는 API에서 처리)
    const result = await issueRevisitCoupon(session.user.id, reportId);

    if (result.success) {
      console.log('✅ [쿠폰] 재구매 쿠폰 발급 성공:', result.coupon);
    } else {
      console.log('ℹ️ [쿠폰] 쿠폰 발급 스킵:', result.error);
    }
    setIsLoading(false);
  }
  issueCouponOnFirstVisit();
}, [reportId]);
```

**UI**: 단일 "홈으로 가기" 버튼

### 15.5 MyReportList.tsx 응원글 표시

**변경 사항**:
- `DBWeeklyReport` 인터페이스에 `self_encouragement: string | null` 추가
- 쿼리에 `self_encouragement` 컬럼 포함
- 표시 로직: `report.self_encouragement` 사용

```typescript
interface DBWeeklyReport {
  // ... 기존 필드
  self_encouragement: string | null;
}

// 쿼리
const { data } = await supabase
  .from('weekly_reports')
  .select('..., self_encouragement')
  .eq('user_id', userId);

// 표시
<p>{report.self_encouragement || '응원글 없음'}</p>
```

### 15.6 coupon.ts 수정

**문제**: Edge Function이 `source_order_id` 파라미터를 기대하는데 `order_id`로 전송

**수정**:
```typescript
// Before
body: JSON.stringify({ user_id: userId, order_id: orderId })

// After
body: JSON.stringify({ user_id: userId, source_order_id: sourceOrderId })
```

### 15.7 라우팅 (App.tsx)

```typescript
// ReportWeeklyMemoWrapper
function ReportWeeklyMemoWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <ReportWeeklyMemo
      reportId={id}
      onBack={() => navigate(-1)}
      onPrev={() => navigate(-1)}
      onNext={() => navigate(`/report-completion/${id}`)}
    />
  );
}

// ReportCompletionWrapper
function ReportCompletionWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <CompletionCoupon
      reportId={id}
      onClose={() => navigate('/')}
      onHome={() => navigate('/')}
    />
  );
}

// 라우트 정의
<Route path="/report-weekly-memo/:id" element={<ReportWeeklyMemoWrapper />} />
<Route path="/report-completion/:id" element={<ReportCompletionWrapper />} />
```

### 15.8 DB 마이그레이션 (스테이징 적용 완료)

**1. self_encouragement 컬럼 추가**:
```sql
ALTER TABLE weekly_reports
ADD COLUMN self_encouragement text;

COMMENT ON COLUMN weekly_reports.self_encouragement IS '나에게 응원하기 글';
```

**2. UPDATE RLS 정책 추가**:
```sql
CREATE POLICY "Users can update own reports"
ON weekly_reports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 15.9 관련 파일 목록

| 파일 | 역할 |
|------|------|
| `src/components/ReportWeeklyMemo.tsx` | 메모 페이지 (다중 모드) |
| `src/components/ReportWeeklyMemoEdit.tsx` | 수정 모드 컴포넌트 |
| `src/components/CompletionCoupon.tsx` | 쿠폰 발급 페이지 |
| `src/components/MyReportList.tsx` | 보고서 목록 (응원글 표시) |
| `src/lib/coupon.ts` | 쿠폰 API 헬퍼 |
| `src/App.tsx` | 라우팅 + Wrapper 컴포넌트 |

### 15.10 테스트 체크리스트

**스테이징 테스트**:
- [x] write 모드: 응원글 작성 → DB 저장 확인
- [x] view 모드: 재방문 시 저장된 응원글 표시 확인
- [x] edit 모드: 연필 아이콘 → 수정 → 저장 확인
- [x] 쿠폰 발급: 완료 페이지 진입 → 3,000원 쿠폰 발급 확인
- [x] MyReportList: 응원글 표시 확인
- [ ] 홈으로 가기 버튼 동작 확인

**프로덕션 배포 TODO**:
- [ ] weekly_reports 테이블에 self_encouragement 컬럼 추가
- [ ] UPDATE RLS 정책 추가
- [ ] 코드 배포 (Vercel)

---

## 16. pg_cron 자동 발송 시스템 (2026-02-03 추가)

### 16.1 아키텍처 개요

```
pg_cron (Supabase)
    ↓ 매주 화요일 15:30 KST
pg_net.http_post()
    ↓ Authorization: Bearer {service_role_key from Vault}
generate-weekly-reports-batch Edge Function
    ↓ concurrency: 5, 2초 간격
generate-weekly-report Edge Function (각 사용자별)
    ↓ GPT-5.1 보고서 생성
send-report-alimtalk Edge Function
    ↓ TalkDream API
알림톡 발송 완료
```

### 16.2 pg_cron 스케줄 설정

**마이그레이션 파일**: `supabase/migrations/20260203_weekly_report_cron.sql`

**현재 설정** (테스트용):
```sql
SELECT cron.schedule(
  'weekly-report-batch',
  '30 6 * * 2',  -- 매주 화요일 06:30 UTC (15:30 KST)
  $$
  SELECT net.http_post(
    url := 'https://hyltbeewxaqashyivilu.supabase.co/functions/v1/generate-weekly-reports-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
  $$
);
```

**프로덕션 설정** (정식 운영):
- 스케줄: `0 12 * * 0` (매주 일요일 21:00 KST)
- URL: `https://kcthtpmxffppfbkjjkub.supabase.co/functions/v1/generate-weekly-reports-batch`

### 16.3 Vault 설정

**필수**: `service_role_key`를 Vault에 저장해야 함

```sql
-- Vault에 시크릿 추가
SELECT vault.create_secret(
  'your-service-role-key-here',
  'service_role_key',
  'Service Role Key for Edge Functions'
);

-- 확인
SELECT name FROM vault.decrypted_secrets WHERE name = 'service_role_key';
```

**주의**: Edge Function Secrets와 Vault는 별개 저장소
- Edge Function Secrets: `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` (Edge Function 내부)
- Vault: `vault.decrypted_secrets` (PostgreSQL 내부, pg_cron용)

### 16.4 배치 처리 설정

**generate-weekly-reports-batch 설정**:
```typescript
const BATCH_CONFIG = {
  concurrency: 5,           // 동시 처리 수
  delayBetweenBatches: 2000 // 배치 간 2초 딜레이
}
```

**300명 처리 예상 시간**:
- 60개 배치 (300 ÷ 5)
- 약 120초(2분) + API 호출 시간

### 16.5 실패 시 재발송

**관리자 패널 (MyReportList.tsx)**:
1. 마스터 계정으로 로그인
2. 마이페이지 → "나의 분석 보고서" 탭
3. 👑 관리자 패널 표시
4. 주차 선택 → "실패 보고서 조회"
5. 실패 건수 확인 → "보고서 다시 보내기"

**재발송 로직**:
- 3분 타임아웃 (AbortController)
- 2초 간격 순차 처리
- 이미 보고서 있으면 자동 스킵 (중복 방지)

### 16.6 모니터링

**실행 로그 확인**:
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-report-batch')
ORDER BY start_time DESC
LIMIT 10;
```

**수동 실행 (테스트)**:
```sql
SELECT trigger_weekly_report_batch();
```

**스케줄 확인**:
```sql
SELECT * FROM cron.job WHERE jobname = 'weekly-report-batch';
```

### 16.7 프로덕션 배포 체크리스트

- [ ] Vault에 service_role_key 추가 (프로덕션)
- [ ] pg_cron 스케줄 등록 (일요일 21:00 KST)
- [ ] Edge Functions 배포 (4개)
  - [ ] generate-weekly-report
  - [ ] generate-weekly-reports-batch
  - [ ] send-report-alimtalk
  - [ ] get-failed-reports
- [ ] Slack Webhook URL 설정 (선택)
- [ ] 관리자 패널 테스트
