# 운테 (바이럴 사주 테스트) 기능 개발 인계 문서

> **작성일**: 2026-03-12
> **최종 업데이트**: 2026-03-13
> **브랜치**: staging (커밋 ec25ac38 ~ 현재)
> **상태**: 스테이징 배포 완료, 프로덕션 미배포

---

## 1. 기능 개요

누구나 사주 기반 바이럴 테스트를 만들 수 있는 플랫폼.
아이디어만 입력하면 **3단계 AI 에이전트 파이프라인**(기획 → 이미지 가이드 → 이미지 생성)이
테스트 전체를 자동 생성하고, 사용자는 생년월일 입력 → 10개 일간(갑을병정무기경신임계) 기반 결과를 즉시 확인.

**일간 계산**: 외부 사주 API 없이 **JDN(율리우스 일수) 로컬 계산** → `(JDN + 9) % 10`으로 천간 매핑.

### 템플릿 유형 (3종)

| 유형 | key | 입력 | 설명 |
|------|-----|------|------|
| 슬롯머신 | `slot_machine` | 본인 사주 | 점수/이미지 + 풀이 |
| 궁합 | `compatibility` | 본인 + 상대 사주 | 궁합 점수 + 분석 |
| 19금 | `adult` | 본인 사주 | 슬롯머신 + 성인 인증 |

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
| `src/pages/UnteCreatePage.tsx` | `/unte/create` | 아이디어 입력 + 레퍼런스 이미지 첨부 → AI 3단계 생성 → 검토/승인 → 게시 |
| `src/pages/UnteLandingPage.tsx` | `/unte/:slug` | 테스트 랜딩 (썸네일 + 제목 + CTA) |
| `src/pages/UntePlayPage.tsx` | `/unte/:slug/play` | 사주 선택/입력 → 결과 로딩 → 애니메이션 → 결과 |
| `src/pages/UnteResultPage.tsx` | `/unte/:slug/result` | 결과 카드 + ResultLabelCard + 공유 (카카오/링크/이미지) |

라우트 등록: `src/App.tsx` 67~71행 (import), 3867~3871행 (Route)

### 프론트엔드 — 유틸리티 (2개 신규)

| 파일 | 역할 |
|------|------|
| `src/utils/dayMaster.ts` | JDN 기반 일간 계산 (`getDayMaster(birthDate, birthTime?)` → `{ dayMaster, element }`) |
| `src/utils/generateShareCard.ts` | Canvas API로 공유 카드 이미지 생성 (ResultLabelCard 디자인 → PNG Blob) |

### 프론트엔드 — 컴포넌트 (4개)

| 파일 | 역할 | 비고 |
|------|------|------|
| `src/components/UnteTestCard.tsx` | 홈 목록용 카드 | 썸네일 + 제목 + 참여수 + 유형 뱃지 |
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

### Edge Functions (4개 신규)

| 함수 | 경로 | JWT | 역할 |
|------|------|-----|------|
| `generate-viral-test` | `supabase/functions/generate-viral-test/index.ts` | `--no-verify-jwt` | 3단계 AI 파이프라인 (기획 → 이미지 가이드 → 비동기 이미지 생성) |
| `generate-viral-test-images` | `supabase/functions/generate-viral-test-images/index.ts` | `--no-verify-jwt` | DB 저장 프롬프트 기반 이미지 생성 (Gemini 2.5 Flash Image, 3장씩 배치 병렬) |
| `get-viral-test-result` | `supabase/functions/get-viral-test-result/index.ts` | `--no-verify-jwt` | JDN 로컬 일간 계산 → 결과 매칭 + play 기록 |
| `viral-test-admin` | `supabase/functions/viral-test-admin/index.ts` | JWT 필요 | publish/archive/discard (creator_id 확인) |

### DB 마이그레이션

파일: `supabase/migrations/20260312_viral_tests.sql`

**스테이징 적용 완료** (Supabase MCP로 직접 실행)

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
| **result_format** | text | `image_focus` / `percentage` / `score` / `ranking` |
| **thumbnail_prompt** | text | Image Guide Agent가 생성한 썸네일 프롬프트 (영문) |
| **image_style_guide** | text | Image Guide Agent가 생성한 스타일 가이드 (영문) |
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
| day_master | text | 갑/을/병/정/무/기/경/신/임/계 |
| element | text | 목/화/토/금/수 |
| result_title | text | 결과 제목 |
| result_description | text | 결과 설명 |
| result_image_url | text | 결과 이미지 |
| score | integer | 점수 (15~95) |
| share_image_url | text | 공유용 이미지 |
| **image_prompt** | text | Image Guide Agent가 생성한 결과 이미지 프롬프트 (영문) |
| **result_label** | text | 결과 라벨 ("87%", "S급", "95점" 등) |
| UNIQUE(test_id, day_master) | | 테스트당 일간 1개 |

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
- `idx_viral_test_plays_fingerprint`: (fingerprint, test_id)

---

## 4. UX 플로우

### 크리에이터 플로우 (테스트 생성 — 3단계 AI 파이프라인)
```
UnteHomePage [+ 만들기 버튼]
  → UnteCreatePage (NavigationHeader 공통 컴포넌트 사용)
    → Step 1: 아이디어 텍스트 입력 + 레퍼런스 이미지 첨부 (선택)
    → Step 2: AI 생성 로딩 (generate-viral-test Edge Function)
      ├─ Stage 1: Planning Agent (기획 — MZ 바이럴 톤, 결과 밈/유행어 기반)
      ├─ Stage 2: Image Guide Agent (이미지 가이드 — B급 병맛 or 레퍼런스 스타일)
      └─ Stage 3: 비동기 이미지 생성 (generate-viral-test-images, 3장씩 배치 병렬)
    → Step 3: 검토 (제목/설명 편집, 10개 결과+라벨 미리보기, 이미지 폴링)
    → Step 4: 게시 (viral-test-admin → status='live')
    → [이탈 시] discard (viral-test-admin → DB+Storage 정리)
  → UnteLandingPage (생성된 테스트)
```

### 유저 플로우 (테스트 플레이)
```
UnteHomePage [카드 클릭] or 공유 링크
  → UnteLandingPage (썸네일 + 제목 + 참여수 + 시작 CTA)
    → [19금이면 AgeVerificationGate]
  → UntePlayPage
    → Phase: checking (PageLoader — 사주 기록 확인)
    → Phase: selectSaju (FreeSajuSelectPage mode="consult")
       - 기존 사주 있으면 선택 화면
       - "직접 입력" 클릭 → myInput phase
    → Phase: myInput (FreeBirthInfoInput mode="consult" skipAutoComplete)
       - 비로그인/사주 없음 → 직접 입력
    → Phase: loading (PageLoader — get-viral-test-result 호출)
       - JDN 로컬 일간 계산 → viral_test_results 매칭
    → Phase: animation (SlotMachineAnimation / CompatibilityMeter)
    → Phase: done → navigate to result
  → UnteResultPage
    → 결과 비주얼:
       - AI 이미지 있음 → 이미지 + 작은 라벨 뱃지
       - AI 이미지 없음 → ResultLabelCard (오행 그라디언트 + 큰 라벨 + 게이지)
    → 결과 텍스트 (제목 + 설명)
    → 공유: 카카오톡 / 링크 복사 / 이미지 저장
       - 카카오 공유 시 이미지 없으면 Canvas로 공유 카드 자동 생성 → Storage 업로드
    → "다른 테스트 해보기" → UnteHomePage
```

---

## 5. Edge Function 상세

### generate-viral-test (3단계 AI 파이프라인)
- **모델**: Gemini 2.5 Flash (`gemini-2.5-flash`)
- **입력**: `{ idea: string, creatorId: string, referenceImage?: string }`
  - `referenceImage`: base64 data URI (프론트에서 변환, 선택사항)
- **Stage 1 — Planning Agent**:
  - **톤앤매너**: MZ/알파세대 타겟, 밈·커뮤니티 용어 필수 사용
  - 올드한 운세 말투 금지 ("듬직한 리더형" ❌ → "안심 ZONE 지박령" ✅)
  - result_title: 단톡방 캡쳐 각 나올 정도의 밈/유행어 기반
  - result_description: 1~2줄 짧고 임팩트, 친구 말투
  - result_format 자동 결정 (아이디어 특성에 맞게)
  - 출력: JSON (title, description, template_type, is_adult, result_format, results[10])
- **Stage 2 — Image Guide Agent**:
  - 레퍼런스 이미지 유무에 따라 스타일 분기:
    - **레퍼런스 있음**: 레퍼런스 스타일 따르는 프롬프트 생성
    - **레퍼런스 없음**: B급 병맛 한국 밈 캐릭터 스타일 (졸라맨/흰 동글이/만두 캐릭터)
  - 출력: style_guide, thumbnail_prompt, results[].image_prompt
  - DB 저장: `viral_tests.thumbnail_prompt`, `viral_tests.image_style_guide`, `viral_test_results.image_prompt`
- **Stage 3**: 비동기로 `generate-viral-test-images` 호출 (referenceImage 전달)
- **상태 변화**: `generating` (생성 중) → `review` (이미지 완료 후)

### generate-viral-test-images
- **모델**: Gemini 2.5 Flash Image (`gemini-2.5-flash-image`)
- **입력**: `{ testId: string, referenceImage?: string }`
- **레퍼런스 이미지 처리**:
  - base64 data URI 파싱 → Gemini API `inline_data`로 전달
  - **스타일만 참고, 원본 복제 금지** (저작권/초상권 보호 프롬프트)
  - 실제 인물 얼굴/외모 복제 금지, 완전히 새로운 가상 인물 생성
  - `stripStyleKeywords()`: 프롬프트에서 일러스트/애니 스타일 키워드 자동 제거 (레퍼런스 스타일 우선)
- **기본 스타일** (레퍼런스 없을 때): B급 병맛 한국 커뮤니티 밈 스타일
  - 흰색 blob/졸라맨 캐릭터, 두꺼운 검정 아웃라인, 과장된 표정, 파스텔 배경
- **처리**: 썸네일 1장 + 결과 이미지 10장 → **3장씩 배치 병렬** (`Promise.all`) → PNG 직접 Supabase Storage 업로드
- **스토리지**: `assets/viral-tests/{testId}/thumbnail.png`, `result-{romanKey}.png`
  - 로마자 매핑: 갑→gap, 을→eul, 병→byeong, 정→jeong, 무→mu, 기→gi, 경→gyeong, 신→sin, 임→im, 계→gye

### get-viral-test-result
- **입력**: `{ testId, birthDate, birthTime, gender, calendarType?, fingerprint?, userId? }`
- **일간 계산**: JDN 로컬 계산 (외부 사주 API 불필요)
  ```
  JDN = getJDN(year, month, day)
  index = ((JDN + 9) % 10 + 10) % 10
  dayMaster = CHEONGAN[index]  // 갑을병정무기경신임계
  ```
  - 자시(23:00~) → 다음날로 보정
- **매칭**: `viral_test_results WHERE test_id = ? AND day_master = ?`
- **궁합**: partnerBirthDate 등 추가 파라미터로 상대 일간도 계산
- **응답**: `myResult.resultLabel`, `partnerResult.resultLabel` 포함
- **기록**: `viral_test_plays` INSERT + `play_count` 증가

### viral-test-admin
- **입력**: `{ action: 'publish'|'archive'|'discard', testId }`
- **인증**: JWT 필수, creator_id 확인 또는 master role
- **액션**:
  - `publish`: `review` → `live` (published_at 기록)
  - `archive`: 아무 상태 → `archived`
  - `discard`: 미게시 테스트 완전 삭제 (live 상태 거부)
    - Storage `viral-tests/{testId}/` 폴더 전체 삭제
    - DB `viral_test_results` → `viral_tests` 순서 삭제 (FK 제약)

---

## 6. 핵심 기술 구현

### 일간(Day Master) 로컬 계산
외부 사주 API 의존성 제거. 프론트엔드(`src/utils/dayMaster.ts`)와 Edge Function 모두 동일한 JDN 공식 사용.

```typescript
// Julian Day Number 계산
function getJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// 천간 매핑: (JDN + 9) % 10
const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const index = ((jdn + 9) % 10 + 10) % 10;
const dayMaster = CHEONGAN[index];
```

검증: `saju-calculator.html`의 `(jd + 49) % 60`에서 천간 부분 `% 10`과 일치 확인됨.

### 레퍼런스 이미지 기반 생성
`UnteCreatePage`에서 이미지 첨부 → base64 변환 → Edge Function 전달 → Gemini `inline_data`로 스타일 참고.

- **프론트**: `<input type="file" accept="image/*">` → `FileReader` → base64 data URI
- **Edge Function**: data URI 파싱 → `{ inline_data: { mime_type, data } }`
- **저작권 보호**: 실제 인물 복제 금지 프롬프트 (얼굴/외모 원본 사용 불가)
- **스타일 키워드 제거**: `stripStyleKeywords()` — 레퍼런스 있을 때 프롬프트 내 `anime`, `illustration`, `digital art` 등 자동 제거

### 미게시 테스트 자동 정리 (Discard)
검토 단계에서 게시하지 않고 이탈 시 DB + Storage 자동 정리.

- **헤더 뒤로가기**: `discardTest()` 호출 후 `navigate(-1)`
- **컴포넌트 언마운트**: cleanup effect에서 `discardTest()` 호출 (published 아닌 경우만)
- **서버**: `viral-test-admin` → `discard` 액션 → Storage 파일 삭제 + DB 행 삭제

### ResultLabelCard (이미지 없을 때 비주얼)
`UnteResultPage.tsx` 내 인라인 컴포넌트. AI 이미지가 아직 없을 때 표시:
- 오행별 그라디언트 배경 (목/화/토/금/수)
- 이모지 + 큰 라벨 (80px for %, 64px for 점수)
- 게이지 바 + 결과 제목
- Framer Motion spring 애니메이션

### Canvas 공유 카드 생성
`src/utils/generateShareCard.ts` — 카카오 공유 시 AI 이미지가 없으면:
1. Canvas API로 ResultLabelCard와 동일한 비주얼을 600x600 PNG로 렌더링
2. Supabase Storage `assets/viral-tests/{testId}/share-card-{dayMaster}.png`에 업로드
3. 공개 URL을 카카오 공유 imageUrl로 사용

### UntePlayPage 단계(Phase) 관리
```
checking → selectSaju → myInput → partnerInput → loading → animation → done
```
- `checking`: PageLoader 표시, 사주 기록 확인
- `selectSaju`: FreeSajuSelectPage(mode="consult") — 기존 사주 선택
- `myInput`: FreeBirthInfoInput(skipAutoComplete=true) — 직접 입력
- `loading`: PageLoader, get-viral-test-result API 호출
- `animation`: SlotMachine / CompatibilityMeter
- `done`: navigate to result page

---

## 7. 프로덕션 배포 체크리스트

### DB 마이그레이션
```sql
-- 프로덕션 Supabase SQL Editor에서 실행
-- 파일: supabase/migrations/20260312_viral_tests.sql
-- 추가 컬럼 (staging에서 별도 실행됨):
ALTER TABLE viral_tests ADD COLUMN IF NOT EXISTS result_format text;
ALTER TABLE viral_tests ADD COLUMN IF NOT EXISTS thumbnail_prompt text;
ALTER TABLE viral_tests ADD COLUMN IF NOT EXISTS image_style_guide text;
ALTER TABLE viral_test_results ADD COLUMN IF NOT EXISTS image_prompt text;
ALTER TABLE viral_test_results ADD COLUMN IF NOT EXISTS result_label text;
```

### Edge Functions 배포
```bash
# 4개 함수 — 3개는 --no-verify-jwt (내부 호출 / 비로그인 허용)
npx supabase functions deploy generate-viral-test --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy generate-viral-test-images --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy get-viral-test-result --no-verify-jwt --project-ref kcthtpmxffppfbkjjkub
npx supabase functions deploy viral-test-admin --project-ref kcthtpmxffppfbkjjkub
```

### Edge Function 환경변수 (프로덕션 확인 필요)
- `GOOGLE_API_KEY` — Gemini 2.5 Flash / Gemini 2.5 Flash Image 사용
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — 자동 설정
- ~~`SAJU_API_KEY`~~ — **불필요** (JDN 로컬 계산으로 대체)

### Supabase Storage
- 버킷 `assets` 내 `viral-tests/` 경로 사용 (기존 assets 버킷)
- 이미지 경로: `viral-tests/{testId}/thumbnail.png`, `result-{romanKey}.png`
- 공유 카드: `viral-tests/{testId}/share-card-{dayMaster}.png`

### 프론트엔드
- staging → production cherry-pick (MEMORY.md 규칙 준수)
- 관련 커밋: `ec25ac38` (최초 구현) + 이후 모든 운테 관련 커밋

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
| 사주 선택 | `FreeSajuSelectPage` 재활용 | 코드 중복 방지, mode="consult" + onConsultComplete 패턴 |
| 사주 입력 | `FreeBirthInfoInput` 재활용 | DB 저장/캐시 로직 통일, skipAutoComplete로 자동완성 제어 |
| 로딩 UI | `PageLoader` 공통 사용 | 커스텀 로딩 아이콘 대신 서비스 공통 로딩으로 통일 |
| AI 생성 | 3단계 파이프라인 | 기획(맥락 이해) → 이미지 가이드(일관된 스타일) → 이미지 생성(품질) |
| 기획 톤앤매너 | MZ/알파세대 밈 말투 | 10대~20대 바이럴 타겟, 올드 운세 톤 금지 |
| 기본 이미지 스타일 | B급 병맛 밈 캐릭터 | 잘파세대가 선호하는 한국 커뮤니티 테스트 이미지 스타일 |
| 레퍼런스 이미지 | 스타일만 참고, 원본 복제 금지 | 저작권/초상권 보호 |
| 이미지 생성 병렬화 | 3장씩 배치 `Promise.all` | 순차 ~2분 → 배치 ~40초, API rate limit 안전 범위 |
| 미게시 정리 | discard 액션 (DB+Storage 삭제) | 이탈 시 고아 데이터 방지 |
| 결과 형식 | AI 자동 선택 (4종) | "바람기 테스트" → percentage, "미래 남편" → image_focus 등 맥락 적합 |
| 양/음력 | 양력 고정 (선택 UI 없음) | FreeBirthInfoInput이 양력 기준, Edge Function calendarType 기본값 `solar` |
| 결과 생성 | 사전 생성 (10개 고정) | 즉시 결과, 낮은 비용, 일관된 품질 |
| 비로그인 플레이 | 허용 (fingerprint 추적) | 바이럴엔 로그인 벽 = 이탈 |
| URL 형태 | slug 기반 (`/unte/{slug}`) | SEO + 공유 친화적 |
| 이미지 생성 | 비동기 (텍스트 먼저 → 이미지 후행) | 크리에이터가 텍스트 즉시 검토 가능 |
| 이미지 없을 때 | ResultLabelCard 비주얼 | 라벨 강조 카드로 빈 화면 방지, Canvas로 공유 이미지 자동 생성 |
| 이미지 포맷 | PNG 직접 업로드 | Edge Function 메모리 한도 내 안전 (ImageMagick WASM 제거) |

---

## 10. 알려진 이슈 / TODO

- [ ] **레퍼런스 실사→일러스트 문제**: 레퍼런스가 실사인데 일러스트로 나오는 경우 있음 (Step 2가 일러스트 프롬프트 생성 + stripStyleKeywords 한계)
- [ ] **Storage 버킷**: 프로덕션에 `assets` 버킷 내 `viral-tests/` 경로 접근 가능 확인
- [ ] **OG 메타 태그**: 소셜 미리보기용 메타 태그 미구현 (SPA이므로 SSR/prerender 필요)
- [ ] **조회수/참여수**: view_count 증가 로직이 부정확 (UnteLandingPage에서 play_count만 증가)
- [ ] **비로그인 테스트 생성**: 현재 `generate-viral-test`가 creatorId null 허용, 비로그인 생성 시 수정 불가
- [ ] **슬롯머신 애니메이션**: 실제 디바이스에서 성능 테스트 필요
- [ ] **카카오 공유**: Kakao SDK 키 하드코딩 (`da0e07cca0c104a3b59f79a24911587c`) — 환경변수화 검토
- [ ] **Canvas 공유 카드**: 모바일 브라우저에서 Canvas → Storage 업로드 테스트 필요
- [x] ~~이미지 생성 미검증~~ → PNG 직접 업로드 + 3장 배치 병렬로 동작 확인
- [x] ~~사주 API 의존성~~ → JDN 로컬 계산으로 해결
- [x] ~~사주 입력 페이지 플래시~~ → checking phase + skipAutoComplete로 해결
- [x] ~~커스텀 로딩 아이콘~~ → PageLoader 공통 사용으로 해결
- [x] ~~이미지 없을 때 빈 화면~~ → ResultLabelCard로 해결
- [x] ~~카카오 공유 썸네일 없음~~ → Canvas 공유 카드 자동 생성으로 해결
- [x] ~~순차 이미지 생성 느림~~ → 3장씩 배치 병렬 처리로 해결
- [x] ~~미게시 테스트 고아 데이터~~ → discard 액션으로 자동 정리
