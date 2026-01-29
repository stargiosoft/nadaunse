# 나다움 찾기 기능 개발 계획

> **상태**: Phase 2-3 완료 - 태그 추출/저장 + 프로필 태그 표시 구현됨
> **최종 업데이트**: 2026-01-29

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
