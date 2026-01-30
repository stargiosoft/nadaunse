# 나다움 찾기 기능 개발 계획

> **상태**: Phase 2-3 완료 + 버그 수정 완료 (각 운세 결과별 태그 구분 + 유료 콘텐츠 스킵 상태 처리)
> **최종 업데이트**: 2026-01-30

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

### Phase 4: 주간 보고서
- [ ] generate-weekly-report Edge Function
- [ ] 보고서 페이지 연결

### Phase 5: 알림톡 & 마무리
- [ ] send-report-alimtalk Edge Function
- [ ] Cron Job 설정

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
│   └── extract-trait-tags/
│       └── index.ts             # 태그 추출 Edge Function (GPT-5-nano)
└── migrations/
    └── 20260128_nadaum_feature.sql  # DB 스키마
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

### 향후 검증 (Phase 4-5)
- [ ] 주간 보고서 생성 테스트
- [ ] 알림톡 발송 테스트
- [ ] Cron Job 동작 확인

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

---

## 12. 프로덕션 배포 TODO 🚀

> **스테이징에서 모두 테스트 완료 후 프로덕션에 순서대로 적용**

### 12.1 DB 마이그레이션 (프로덕션)

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

### 12.2 코드 변경 내역 (2026-01-30)

#### 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/FreeContentLoading.tsx` | resultKey에 timestamp 추가 (동일 콘텐츠/사주 구분) |
| `src/components/CheckRecordMe.tsx` | UPDATE 쿼리에 `.select()` 추가하여 결과 확인 |
| `src/components/PurchaseHistoryPage.tsx` | 태그 확정 여부 조회 시 `source_order_id` 사용 |
| `src/components/UnifiedResultPage.tsx` | `__SKIPPED__` 태그 감지 및 버튼 상태 처리 추가 |
| `src/App.tsx` | FreeResultPage, TagExtractionLoadingWrapper, NadaumRecordWrapper 수정 |

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

### 12.3 배포 순서

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

### 12.4 배포 체크리스트

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

---

### 12.5 롤백 계획

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
