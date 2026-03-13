# 운테 (바이럴 사주 테스트) 기능 개발 인계 문서

> **작성일**: 2026-03-12
> **최종 업데이트**: 2026-03-13 (v5 — 궁합 십성 시스템 추가)
> **브랜치**: staging (커밋 ec25ac38 ~ 현재)
> **상태**: 스테이징 배포 완료, 프로덕션 미배포

---

## 1. 기능 개요

누구나 사주 기반 바이럴 테스트를 만들 수 있는 플랫폼.
아이디어만 입력하면 **3단계 AI 에이전트 파이프라인**(기획 → 이미지 가이드 → 이미지 생성)이
테스트 전체를 자동 생성하고, 사용자는 생년월일 입력 → 결과를 즉시 확인.

**일간 계산**: 외부 사주 API 없이 **JDN(율리우스 일수) 로컬 계산** → `(JDN + 9) % 10`으로 천간 매핑.

### 템플릿 유형 (3종)

| 유형 | key | 입력 | 결과 매칭 방식 |
|------|-----|------|---------------|
| 슬롯머신 | `slot_machine` | 본인 사주 | **일간(day_master)** 10개 |
| 궁합 | `compatibility` | 본인 + 상대 사주 | **십성(relation_type)** 10개 |
| 19금 | `adult` | 본인 사주 | **일간(day_master)** 10개 |

### 결과 표시 형식 (4종, AI가 아이디어에 맞게 자동 선택)

| result_format | 용도 | result_label 예시 |
|---------------|------|-------------------|
| `image_focus` | 이미지가 핵심 (미래 남편 얼굴 등) | "S급", "최상" |
| `percentage` | 확률/비율 강조 (바람기 테스트 등) | "87%", "15%" |
| `score` | 점수 기반 | "95점", "42점" |
| `ranking` | 등급/순위 | "1등급", "A+", "SSS급" |

---

## 2. 파일 구조

### 프론트엔드 — 페이지 (5개)

| 파일 | 라우트 | 역할 |
|------|--------|------|
| `src/pages/UnteHomePage.tsx` | `/unte` | 테스트 목록 (인기순/최신순, 카테고리 필터) |
| `src/pages/UnteCreatePage.tsx` | `/unte/create` | 아이디어 입력 + 결과/썸네일 레퍼런스 이미지 첨부(Storage URL 방식) → AI 3단계 생성 → 검토/승인 → 게시 |
| `src/pages/UnteLandingPage.tsx` | `/unte/:slug` | 테스트 랜딩 (썸네일 + 제목 + CTA) |
| `src/pages/UntePlayPage.tsx` | `/unte/:slug/play` | 사주 선택/입력 → 결과 로딩 → 애니메이션 → 결과 |
| `src/pages/UnteResultPage.tsx` | `/unte/:slug/result` | 결과 카드 + ResultLabelCard + 공유 (카카오/링크/이미지) |

라우트 등록: `src/App.tsx` 67~71행 (import), 3867~3871행 (Route)

### 프론트엔드 — 유틸리티 (3개)

| 파일 | 역할 |
|------|------|
| `src/utils/dayMaster.ts` | JDN 기반 일간 계산 (`getDayMaster(birthDate, birthTime?)` → `{ dayMaster, element }`) |
| `src/utils/sipsung.ts` | **십성 계산** (`getSipsung(myDayMaster, partnerDayMaster)` → 십성 문자열). 궁합 결과 매칭 핵심 |
| `src/utils/generateShareCard.ts` | Canvas API로 공유 카드 이미지 생성 (ResultLabelCard 디자인 → PNG Blob) |

### 프론트엔드 — 컴포넌트 (4개)

| 파일 | 역할 | 비고 |
|------|------|------|
| `src/components/UnteTestCard.tsx` | 홈 목록용 카드 | 썸네일 + 제목 + 참여수 + 유형 뱃지 + 마스터 삭제 버튼 |
| `src/components/SlotMachineAnimation.tsx` | 3릴 슬롯머신 애니메이션 | Framer Motion, 오행 아이콘 |
| `src/components/CompatibilityMeter.tsx` | 궁합 원형 게이지 | SVG + 점수 카운트업 |
| `src/components/AgeVerificationGate.tsx` | 19금 성인 인증 | sessionStorage, 출생연도 확인 |

**삭제된 파일**: `src/components/UnteSajuInput.tsx` — `FreeBirthInfoInput`으로 대체

### 기존 컴포넌트 재활용

| 컴포넌트 | 용도 |
|---------|------|
| `src/components/NavigationHeader.tsx` | 공통 헤더 (UnteCreatePage에서 사용) |
| `src/components/FreeSajuSelectPage.tsx` | 기존 사주 선택 (`mode="consult"` + `onConsultComplete` 콜백) |
| `src/components/FreeBirthInfoInput.tsx` | 사주 정보 입력 (`mode="consult"` + `onConsultComplete` + `skipAutoComplete`) |
| `src/components/ui/PageLoader.tsx` | 공통 로딩 UI (checking/loading 단계) |
| `src/components/BottomTabBar.tsx` | '운테' 탭 (`/unte` 경로, UnteIcon) |
| `src/components/ImageWithFallback.tsx` | 이미지 로딩 (썸네일, 결과 이미지) |
| `src/components/ui/skeleton.tsx` | 로딩 스켈레톤 |

### Edge Functions (5개 신규)

| 함수 | 경로 | JWT | 역할 |
|------|------|-----|------|
| `generate-viral-test` | `supabase/functions/generate-viral-test/index.ts` | `--no-verify-jwt` | 2단계 AI 파이프라인 (기획 → 이미지 가이드). 궁합 감지 시 십성 전용 프롬프트로 재기획 |
| `generate-viral-test-images` | `supabase/functions/generate-viral-test-images/index.ts` | `--no-verify-jwt` | DB 저장 프롬프트 기반 이미지 생성 (Gemini 2.5 Flash Image, 4장씩 배치 병렬). `dayMasters`/`relationTypes` 파라미터로 개별 이미지 재생성 지원 |
| `get-viral-test-result` | `supabase/functions/get-viral-test-result/index.ts` | `--no-verify-jwt` | JDN 로컬 일간 계산 → 일반: day_master 매칭, 궁합: 두 일간 → 십성 → relation_type 매칭 |
| `viral-test-admin` | `supabase/functions/viral-test-admin/index.ts` | JWT 필요 | publish/archive/discard/delete (creator_id 확인) |
| `suggest-viral-ideas` | `supabase/functions/suggest-viral-ideas/index.ts` | `--no-verify-jwt` | 기존 viral_tests 제목 참고 → 중복 없는 Z세대 바이럴 아이디어 3개 AI 추천 |

### DB 마이그레이션

| 파일 | 내용 | 스테이징 |
|------|------|----------|
| `supabase/migrations/20260312_viral_tests.sql` | 기본 테이블 + RLS | 적용 완료 |
| `supabase/migrations/20260313_viral_test_sipsung.sql` | relation_type 컬럼 + 인덱스 | 적용 완료 |

---

## 3. DB 스키마

### `viral_tests`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| creator_id | uuid FK→auth.users | 생성자 |
| template_type | text | `slot_machine` / `compatibility` / `adult` |
| title | text | 테스트 제목 |
| description | text | 설명 |
| idea_input | text | AI 입력 원문 |
| thumbnail_url | text | 썸네일 이미지 URL |
| result_format | text | `image_focus` / `percentage` / `score` / `ranking` |
| thumbnail_prompt | text | Image Guide Agent가 생성한 썸네일 프롬프트 (영문) |
| image_style_guide | text | Image Guide Agent가 생성한 스타일 가이드 (영문) |
| status | text | `generating` → `review` → `live` → `archived` / `failed` |
| is_adult | boolean | 성인 콘텐츠 여부 |
| view_count | integer | 조회수 |
| play_count | integer | 참여수 |
| share_count | integer | 공유수 |
| slug | text UNIQUE | URL 슬러그 |
| published_at | timestamptz | 게시 일시 |

### `viral_test_results`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| test_id | uuid FK→viral_tests | |
| day_master | text (nullable) | 갑/을/병/정/무/기/경/신/임/계 (일반 테스트용) |
| **relation_type** | text (nullable) | 비견/겁재/식신/상관/편재/정재/편관/정관/편인/정인 **(궁합 테스트용)** |
| element | text | 목/화/토/금/수 (일반 테스트용, 궁합은 null) |
| result_title | text | 결과 제목 |
| result_description | text | 결과 설명 |
| result_image_url | text | 결과 이미지 |
| score | integer | 점수 (15~95) |
| share_image_url | text | 공유용 이미지 |
| image_prompt | text | Image Guide Agent가 생성한 결과 이미지 프롬프트 (영문) |
| result_label | text | 결과 라벨 ("87%", "S급", "95점" 등) |
| UNIQUE(test_id, day_master) | | 일반 테스트: 테스트당 일간 1개 |
| UNIQUE(test_id, relation_type) WHERE relation_type IS NOT NULL | | 궁합 테스트: 테스트당 십성 1개 |

### `viral_test_plays`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| test_id | uuid FK→viral_tests | |
| user_id | uuid FK→auth.users | nullable (비로그인) |
| result_id | uuid FK→viral_test_results | 매칭된 결과 |
| fingerprint | text | 브라우저 fingerprint |
| partner_day_master | text | 궁합 상대 일간 |

### RLS 정책

- `viral_tests`: live 공개 읽기, 본인 전체 읽기, 로그인 생성, 본인 수정
- `viral_test_results`: live 테스트 결과 공개 읽기, 본인 테스트 결과 읽기
- `viral_test_plays`: 누구나 삽입, 본인/익명 읽기
- 모든 테이블: `service_role` bypass 정책 (Edge Functions용)

### 인덱스

- `idx_viral_tests_status_published`: (status, published_at DESC)
- `idx_viral_test_results_test_day`: (test_id, day_master)
- `idx_viral_test_results_test_relation`: (test_id, relation_type) WHERE relation_type IS NOT NULL
- `idx_viral_test_plays_fingerprint`: (fingerprint, test_id)

---

## 4. UX 플로우

### 크리에이터 플로우 (테스트 생성 — 기획 → 수동 이미지 생성)
```
UnteHomePage [+ 만들기 버튼]
  → UnteCreatePage (NavigationHeader 공통 컴포넌트 사용)
    → Step 1: 아이디어 텍스트 입력 + 결과 레퍼런스 이미지 첨부 (선택, 드래그앤드롭/클릭)
               + 썸네일 레퍼런스 이미지 첨부 (마스터 전용, 선택)
               → 이미지 선택 시 Canvas 리사이즈(결과 768px, 썸네일 512px) + WebP 0.8 → Storage 업로드
               → Edge Function에 Storage URL만 전달 (base64 전송 제거, 546 에러 해결)
    → Step 2: AI 기획 생성 (generate-viral-test → Planning + Image Guide)
       - AI가 아이디어 분석 → template_type 자동 결정
       - 궁합 감지 시: 십성 전용 프롬프트로 재기획 (10개 십성별 결과)
       - 일반: 10개 일간별 결과
    → Step 3: 검토 (제목/설명 편집, 10개 결과+라벨 미리보기)
       - 궁합: 십성 이모지 표시 (🤝비견, ⚡겁재, 🍽️식신 등)
       - 일반: 오행 이모지 표시 (🌳갑, ☀️병 등)
    → Step 4: "이미지 만들기" 버튼 클릭 → generate-viral-test-images 호출
      ├─ 이미지 폴링으로 진행 상황 표시
      ├─ "이미지 다시 만들기" — 전체 이미지 재생성
      └─ 개별 결과 이미지 ↻ — 해당 결과만 재생성 (일반: dayMasters, 궁합: relationTypes)
    → Step 5: "기획 다시하기" — 동일 testId로 기획 재실행 (기존 결과+이미지 삭제)
    → Step 6: 게시 (viral-test-admin → status='live')
    → [이탈 시] discard (viral-test-admin → DB+Storage 정리)
  → UnteLandingPage (생성된 테스트)
```

### 유저 플로우 — 일반 테스트 (slot_machine / adult)
```
UnteHomePage [카드 클릭] or 공유 링크
  → UnteLandingPage (썸네일 + 제목 + 참여수 + 시작 CTA)
    → [19금이면 AgeVerificationGate]
  → UntePlayPage
    → Phase: checking (PageLoader — 사주 기록 확인)
    → Phase: selectSaju (FreeSajuSelectPage mode="consult")
    → Phase: myInput (FreeBirthInfoInput mode="consult" skipAutoComplete)
    → Phase: loading (get-viral-test-result → day_master 매칭)
    → Phase: animation (SlotMachineAnimation)
    → Phase: done → navigate to result
  → UnteResultPage (결과 카드 + 공유)
```

### 유저 플로우 — 궁합 테스트 (compatibility)
```
  → UntePlayPage
    → Phase: checking → selectSaju → myInput (내 사주)
    → Phase: partnerInput (상대 사주 — FreeBirthInfoInput)
    → Phase: loading (get-viral-test-result → 두 일간 → 십성 계산 → relation_type 매칭)
    → Phase: animation (CompatibilityMeter — 십성 결과의 score 표시)
    → Phase: done → navigate to result
  → UnteResultPage (관계 결과 카드 + 궁합 유형 뱃지 + 공유)
```

---

## 5. Edge Function 상세

### generate-viral-test (2단계 AI 파이프라인)
- **모델**: Gemini 2.5 Flash (`gemini-2.5-flash`)
- **입력**: `{ idea: string, creatorId: string, hasReferenceImage?: boolean, existingTestId?: string }`
- **궁합 감지 플로우**:
  1. 먼저 일반 프롬프트로 기획 → AI가 `template_type` 결정
  2. `compatibility` 감지 시 → **십성 전용 프롬프트로 재기획** (추가 1회 API 호출)
  3. 십성 프롬프트: 10가지 관계 유형별 결과 생성 (비견~정인)
  4. 점수 분포 지시: 좋은 관계 3~4개(80~95), 보통 3~4개(50~70), 안 좋은 관계 2~3개(15~45)
- **Stage 1 — Planning Agent**:
  - **톤앤매너**: MZ/알파세대 타겟, 밈·커뮤니티 용어 필수 사용
  - 올드한 운세 말투 금지 ("듬직한 리더형" ❌ → "안심 ZONE 지박령" ✅)
  - 사주 용어 노출 금지 (운세/사주/천간/일간/십성/비견 등)
  - 일반: results[10] keyed by `day_master` (갑~계)
  - 궁합: results[10] keyed by `relation_type` (비견~정인)
- **Stage 2 — Image Guide Agent**:
  - 레퍼런스 이미지 유무에 따라 완전 분리된 시스템 프롬프트
  - 궁합: "두 캐릭터의 관계/상호작용" 표현 지시 추가
  - result_prompts 키: 일반=일간(갑~계), 궁합=십성(비견~정인)
- **DB 저장 분기**:
  - 일반: `day_master` 컬럼, `element` 컬럼
  - 궁합: `relation_type` 컬럼, `day_master`=null, `element`=null
- **상태 변화**: `generating` (기획 중) → `review` (기획 완료)

### generate-viral-test-images
- **모델**: Gemini 2.5 Flash Image (`gemini-2.5-flash-image`)
- **입력**: `{ testId, dayMasters?, relationTypes?, thumbnailOnly?, referenceImageUrl?, thumbnailReferenceImageUrl? }`
  - `dayMasters`: 일반 테스트 — 해당 일간의 결과 이미지만 재생성
  - `relationTypes`: 궁합 테스트 — 해당 십성의 결과 이미지만 재생성
- **Storage 키 분기**:
  - 일반: `result-{DAY_MASTER_ROMAN[day_master]}.png` (gap, eul, byeong...)
  - 궁합: `result-{SIPSUNG_ROMAN[relation_type]}.png` (bigyeon, geopjae, siksin...)
- **궁합 이미지 특화**: 두 캐릭터의 관계/상호작용 표현
- **처리**: 썸네일 1장 + 결과 이미지 10장 → 배치 병렬 → PNG Supabase Storage 업로드

### get-viral-test-result
- **입력**: `{ testId, birthDate, birthTime, gender, calendarType?, partnerBirthDate?, partnerBirthTime?, partnerGender?, fingerprint?, userId? }`
- **일간 계산**: JDN 로컬 계산 (외부 사주 API 불필요)
- **매칭 분기**:
  - `viral_tests.template_type` 조회하여 궁합 여부 판별
  - **일반**: `day_master`로 매칭
  - **궁합**: 두 일간 → `calcSipsung(myDayMaster, partnerDayMaster)` → `relation_type`으로 매칭
- **십성 계산 로직** (인라인):
  ```
  오행: 갑을=목, 병정=화, 무기=토, 경신=금, 임계=수
  음양: 갑병무경임=양, 을정기신계=음
  관계: 같은오행→비겁, 내가생→식상, 내가극→재성, 나를극→관성, 나를생→인성
  편/정: 같은음양→편, 다른음양→정
  ```
- **응답**: `{ myResult: {..., relationType}, partnerDayMaster, relationType, isCompatibility }`
- **기록**: `viral_test_plays` INSERT + `play_count` 증가

### suggest-viral-ideas (AI 아이디어 추천)
- **모델**: Gemini 2.5 Flash (`gemini-2.5-flash`)
- **입력**: `{}` (파라미터 없음)
- **로직**: 기존 테스트 제목 참고 → 중복 없는 Z세대 바이럴 아이디어 3개 생성
- **응답**: `{ ideas: [{ title, type, resultFormat }] }` (3개)

### viral-test-admin
- **입력**: `{ action: 'publish'|'archive'|'discard'|'delete', testId }`
- **인증**: JWT 필수, creator_id 확인 또는 master role
- **액션**:
  - `publish`: `review` → `live` (published_at 기록)
  - `archive`: 아무 상태 → `archived`
  - `discard`: 미게시 테스트 완전 삭제 (live 상태 거부)
  - `delete`: 모든 상태 테스트 완전 삭제 (마스터/본인)

---

## 6. 핵심 기술 구현

### 일간(Day Master) 로컬 계산
외부 사주 API 의존성 제거. 프론트엔드(`src/utils/dayMaster.ts`)와 Edge Function 모두 동일한 JDN 공식 사용.

```typescript
function getJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const index = ((jdn + 9) % 10 + 10) % 10;
const dayMaster = CHEONGAN[index];
```

### 십성(十星) 궁합 계산
두 사람의 일간을 비교하여 명리학 기반 십성 관계를 판별. `src/utils/sipsung.ts` + Edge Function 인라인.

```typescript
// 오행 관계 + 음양 비교 → 10가지 십성
function getSipsung(my: DayMaster, partner: DayMaster): SipsungType {
  const myEl = ELEMENT[my], partnerEl = ELEMENT[partner];
  const sameYinYang = IS_YANG[my] === IS_YANG[partner];
  if (myEl === partnerEl) return sameYinYang ? '비견' : '겁재';        // 비화
  if (GENERATES[myEl] === partnerEl) return sameYinYang ? '식신' : '상관';  // 식상
  if (CONTROLS[myEl] === partnerEl) return sameYinYang ? '편재' : '정재';  // 재성
  if (CONTROLS[partnerEl] === myEl) return sameYinYang ? '편관' : '정관';  // 관성
  return sameYinYang ? '편인' : '정인';                                    // 인성
}
```

**특징**:
- 10×10 = 100개 조합 전부 검증 통과
- **비대칭**: A→B와 B→A 결과가 다름 → "나한텐 네가 ○○인데, 너한텐 내가 △△래ㅋㅋ" = 바이럴 포인트
- 천간합(갑기, 을경, 병신, 정임, 무계) → 항상 정재/정관 (최상 궁합)
- 천간충(갑경, 을신, 병임, 정계) → 항상 편관/편재 (긴장+자극)
- 명리 이론 참고: `src/docs/develop/COMPATIBILITY_THEORY.md`

### 레퍼런스 이미지 기반 생성 (Storage URL 방식)
`UnteCreatePage`에서 이미지 첨부 → Canvas 리사이즈 + WebP 압축 → Supabase Storage 업로드 → Edge Function에 URL만 전달.

- **2채널 레퍼런스 (독립)**: 결과 레퍼런스 + 썸네일 레퍼런스 (폴백 없음)
- **자동 정리**: 게시/폐기/언마운트 시 Storage에서 삭제

### UntePlayPage 단계(Phase) 관리
```
checking → selectSaju → myInput → [궁합: partnerInput] → loading → animation → done
```

### UnteCreatePage 범용 키 시스템
`resultKey(r)` 헬퍼로 일반(day_master)과 궁합(relation_type)을 통합 처리:
- 폴링, 재생성, 렌더링에서 `resultKey(r)` 사용
- 이모지 분기: 일반=오행 이모지, 궁합=십성 이모지

---

## 7. 프로덕션 배포 체크리스트

### DB 마이그레이션
```sql
-- 프로덕션 Supabase SQL Editor에서 실행

-- 1. 기본 마이그레이션 (20260312_viral_tests.sql)
-- (이미 정리된 SQL 파일 참조)

-- 2. 추가 컬럼
ALTER TABLE viral_tests ADD COLUMN IF NOT EXISTS result_format text;
ALTER TABLE viral_tests ADD COLUMN IF NOT EXISTS thumbnail_prompt text;
ALTER TABLE viral_tests ADD COLUMN IF NOT EXISTS image_style_guide text;
ALTER TABLE viral_test_results ADD COLUMN IF NOT EXISTS image_prompt text;
ALTER TABLE viral_test_results ADD COLUMN IF NOT EXISTS result_label text;

-- 3. 십성 궁합 지원 (20260313_viral_test_sipsung.sql)
ALTER TABLE viral_test_results ADD COLUMN IF NOT EXISTS relation_type text;
ALTER TABLE viral_test_results ALTER COLUMN day_master DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_viral_test_results_test_relation
  ON viral_test_results (test_id, relation_type)
  WHERE relation_type IS NOT NULL;
```

### Edge Functions 배포
```bash
# 5개 함수 — 4개는 --no-verify-jwt
npx supabase functions deploy generate-viral-test --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy generate-viral-test-images --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy get-viral-test-result --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy suggest-viral-ideas --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy viral-test-admin --project-ref kcthtpmxffppfbkjjkub
```

### Edge Function 환경변수 (프로덕션 확인 필요)
- `GOOGLE_API_KEY` — Gemini 2.5 Flash / Gemini 2.5 Flash Image 사용
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — 자동 설정

### Supabase Storage
- 버킷 `assets` 내 `viral-tests/` 경로 사용 (기존 assets 버킷)
- 이미지 경로: `viral-tests/{testId}/thumbnail.png`, `result-{romanKey}.png`
  - 일반 romanKey: gap, eul, byeong, jeong, mu, gi, gyeong, sin, im, gye
  - 궁합 romanKey: bigyeon, geopjae, siksin, sanggwan, pyeonjae, jeongjae, pyeongwan, jeonggwan, pyeonin, jeongin
- 공유 카드: `viral-tests/{testId}/share-card-{dayMaster}.png`
- 레퍼런스 이미지 (임시): `viral-tests/refs/{uuid}.webp` (게시/이탈 시 자동 삭제)

### Storage RLS 정책 (프로덕션 적용 필요)
```sql
-- viral-tests/refs/ 경로 INSERT/SELECT/UPDATE/DELETE 정책
CREATE POLICY "Allow authenticated upload viral-tests refs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'viral-tests' AND (storage.foldername(name))[2] = 'refs');

CREATE POLICY "Allow authenticated select viral-tests refs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'viral-tests' AND (storage.foldername(name))[2] = 'refs');

CREATE POLICY "Allow authenticated update viral-tests refs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'viral-tests' AND (storage.foldername(name))[2] = 'refs');

CREATE POLICY "Allow authenticated delete viral-tests refs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = 'viral-tests' AND (storage.foldername(name))[2] = 'refs');
```

### DB RLS DELETE 정책 (프로덕션 적용 필요)
```sql
CREATE POLICY "본인 또는 마스터 테스트 삭제" ON viral_tests
  FOR DELETE USING (
    auth.uid() = creator_id
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'master')
  );

CREATE POLICY "본인 또는 마스터 결과 삭제" ON viral_test_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM viral_tests
      WHERE viral_tests.id = viral_test_results.test_id
      AND (viral_tests.creator_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'master'))
    )
  );

CREATE POLICY "본인 또는 마스터 플레이 삭제" ON viral_test_plays
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM viral_tests
      WHERE viral_tests.id = viral_test_plays.test_id
      AND (viral_tests.creator_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'master'))
    )
  );
```

### 프론트엔드
- staging → production cherry-pick (MEMORY.md 규칙 준수)
- 관련 커밋: `ec25ac38` (최초 구현) ~ `fe306eea` (십성 궁합) + 이후 운테 커밋

---

## 8. 디자인 시스템 적용 현황

모든 운테 페이지/컴포넌트는 `★DESIGN_SYSTEM★.md` 기반으로 리디자인 완료.

| 항목 | 스펙 |
|------|------|
| 레이아웃 | `bg-white min-h-screen w-full flex justify-center` → `max-w-[440px]` |
| 헤더 | NavigationHeader 공통 컴포넌트 (fixed 52px, 뒤로가기 SVG + 중앙 타이틀) |
| CTA 버튼 | 56px 높이, 16px radius, `#48b2af`, pressed `scale(0.99)` |
| 입력 필드 | 56px 높이, 16px radius, `#e7e7e7` 보더 |
| 폰트 | `'Pretendard Variable', sans-serif` 인라인 스타일 |
| 색상 | Primary `#48b2af`, Text `#151515`, Caption `#848484`, Disabled `#b7b7b7`, Error `#d4183d` |
| 뱃지 | 10px/600, 4px radius, 테스트 `#f0f8f8`+`#41a09e`, 궁합 `#fff6f7`+`#ef6878` |
| 점수 뱃지 | 80+ 빨강(`#ef6878`), 60+ 민트(`#48b2af`), 40+ 노랑(`#f5a623`), 40미만 회색(`#b7b7b7`) |

---

## 9. 핵심 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 일간 계산 | JDN 로컬 계산 | 외부 API 비용/장애 제거, 운테는 일간(천간 10개)만 필요 |
| **궁합 매칭** | **십성(十星) 기반** | 명리학 이론 근거, 10×10 조합 → 10유형 자연 축소, 비대칭=바이럴 |
| **궁합 감지** | **AI 자동 판별 + 재기획** | 1차 기획에서 template_type 판별 → compatibility면 전용 프롬프트로 재호출 |
| **궁합 점수 분포** | **좋은/보통/나쁜 혼합** | 전부 좋으면 재미없음. 겁재/편관/편인은 낮은 점수로 긴장감 |
| **궁합 이미지** | **두 캐릭터 상호작용** | 한 명만 나오면 궁합 느낌 없음. 관계별 포즈/거리감 차별화 |
| 사주 선택 | `FreeSajuSelectPage` 재활용 | 코드 중복 방지, mode="consult" + onConsultComplete 패턴 |
| 사주 입력 | `FreeBirthInfoInput` 재활용 | DB 저장/캐시 로직 통일, skipAutoComplete로 자동완성 제어 |
| AI 생성 | 3단계 파이프라인 | 기획(맥락 이해) → 이미지 가이드(일관된 스타일) → 이미지 생성(품질) |
| 기획 톤앤매너 | MZ/알파세대 밈 말투 | 10대~20대 바이럴 타겟, 올드 운세 톤 금지 |
| 기본 이미지 스타일 | B급 병맛 밈 캐릭터 | 잘파세대가 선호하는 한국 커뮤니티 테스트 이미지 스타일 |
| 레퍼런스 전달 방식 | Storage URL (base64 제거) | JSON body 13MB→1KB, 546 에러 해결 |
| 이미지 생성 병렬화 | 4장씩 배치 `Promise.all` | 순차 ~2분 → 배치 ~40초 |
| 결과 생성 | 사전 생성 (10개 고정) | 즉시 결과, 낮은 비용, 일관된 품질 |
| 비로그인 플레이 | 허용 (fingerprint 추적) | 바이럴엔 로그인 벽 = 이탈 |
| URL 형태 | slug 기반 (`/unte/{slug}`) | SEO + 공유 친화적 |

---

## 10. 알려진 이슈 / TODO

### 완료
- [x] ~~레퍼런스 실사→일러스트 문제~~ → 레퍼런스 모드 프롬프트 완전 분리
- [x] ~~레퍼런스 base64 546 에러~~ → Storage URL 방식으로 전환
- [x] ~~Storage RLS refs 경로~~ → INSERT/SELECT/UPDATE/DELETE 정책 스테이징 적용
- [x] ~~썸네일/결과 레퍼런스 폴백 문제~~ → 독립 채널로 분리
- [x] ~~레퍼런스 이미지 Storage 누적~~ → 게시/폐기/언마운트 시 자동 삭제
- [x] ~~DB RLS DELETE 정책 누락~~ → 3개 테이블 DELETE 정책 스테이징 적용
- [x] ~~이미지 생성 미검증~~ → PNG 직접 업로드 + 배치 병렬 동작 확인
- [x] ~~사주 API 의존성~~ → JDN 로컬 계산
- [x] ~~궁합 결과 매칭~~ → 십성(十星) 기반 시스템 구현 (v5)

### 미완료
- [ ] **프로덕션 배포**: DB 마이그레이션 + Edge Functions + RLS 정책 + Storage RLS
- [ ] **OG 메타 태그**: 소셜 미리보기용 메타 태그 미구현 (SPA이므로 SSR/prerender 필요)
- [ ] **조회수/참여수**: view_count 증가 로직 부정확
- [ ] **비로그인 테스트 생성**: creatorId null 허용, 비로그인 생성 시 수정 불가
- [ ] **카카오 공유**: Kakao SDK 키 하드코딩 — 환경변수화 검토
- [ ] **Canvas 공유 카드**: 모바일 브라우저에서 테스트 필요
- [ ] **궁합 테스트 스테이징 검증**: 실제 궁합 테스트 생성 + 플레이 E2E 검증 필요
