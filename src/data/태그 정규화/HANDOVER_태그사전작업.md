# 나다움 태그 사전 작업 인계서

> **최종 업데이트**: 2026-03-17 (프로덕션 정규화 + 배포 완료)
> **목적**: 나다움 태그를 룰베이스로 DB화 → 동의어 중복 제거 + HEXACO 기반 분류 → 미래 예측기 온톨로지 기반

---

## 1. 배경 및 문제

### 해결된 문제
- ~~`extract-trait-tags` Edge Function이 GPT-4.1-mini에게 **자유 형식**으로 태그 생성~~ → **룰베이스로 전환 완료**
- ~~"완벽주의적" vs "완벽주의적인" vs "완벽주의한" 같은 **동의어 중복 폭발**~~ → **사전 기반 정규화 완료 (615개 → 133개)**
- ~~프로덕션 DB: 615개 고유 태그~~ → **133개 canonical 태그로 정규화 완료**

### 최종 목표 (큰 그림)
- **미래 예측기**: 심리테스트 + 나다움태그 → 유저 온톨로지 → AI 에이전트 토론 → 미래 시나리오
- **나다움 성격 뿌리**: 레이더 차트 정확도 향상 (AI 추정 → 룰 기반 카테고리 점수)
- **태그 일관성**: ~~AI가 사전에서 매칭하는 방식으로 전환~~ → **룰베이스 어간 매칭 + AI 폴백 완료 (프로덕션 배포 완료)**

---

## 2. 완료된 작업

### [완료] 태그 사전 파일 생성
- **파일**: `src/data/태그 정규화/traitTagDictionary.ts`
- **canonical 태그**: 240개 (검토 후 과민한/민감한 → 예민한 통합)
- **동의어 포함 총 커버리지**: ~665개
- **TypeScript 컴파일**: 통과 (에러 없음)

### [완료] HEXACO 7개 카테고리 분류

| 카테고리 | HEXACO 대응 | 하위척도 | 태그 수 |
|---------|------------|---------|--------|
| **실행력** | 성실성(C) | 조직성, 근면성, 완벽주의, 신중함 | 32 |
| **사고력** | 개방성(O) | 심미감, 호기심, 창의성, 비관습성 | 29 |
| **감성** | 정서성(E) | 공포민감성, 불안, 의존성, 감상성 | 35 |
| **관계** | 외향성(X)+원만성(A) | 사교성, 활력, 관용성, 온화성, 융통성 | 63 |
| **의지력** | 끈기(Grit) | 대담성, 사회적자존감, 인내, 극복 | 30 |
| **안정감** | 정서안정성 | 침착, 자기조절, 일관성, 평정심 | 27 |
| **진실성** | 정직-겸손(H) | 진실성, 공정성, 탐욕회피, 겸손성 | 24 |

### [완료] 사전 검토 & 수정 (2026-03-17)
- **동의어 충돌 3건 해결**:
  - `과도한` → `과로하는` 동의어에서 제거 (독립 canonical 유지)
  - `냉소적인` → `냉정한` 동의어에서 제거 (독립 canonical 유지)
  - `사려있는` → `신중한` 동의어에서 제거 (`사려깊은`에만 유지)
- **카테고리 재배치 2건**:
  - `감성적인`: 사고력 → **감성**
  - `인내하는`: 관계 → **의지력**
- **태그 통합 1건**:
  - `과민한`/`민감한` → `예민한`으로 통합 (frequency 65, 동의어 8개)

### [완료] extract-trait-tags Edge Function 룰베이스 전환
- **파일**: `supabase/functions/extract-trait-tags/index.ts`
- **공유 모듈**: `supabase/functions/server/traitTagData.ts`
- **동작 방식**:
  1. **1차 룰베이스**: 사주 답변 텍스트에서 태그 어간(stem) 검색 → 점수화 → top 2 positive + 1 negative
  2. **2차 AI 폴백**: 룰베이스 부족 시 GPT-4.1-mini에 사전 목록 제공하여 선택
  3. **AI 응답 검증**: 사전 미등록 태그 거부 → 룰베이스 결과로 보충
  4. **negative 0개 시**: positive top 3개로 대체
- **temperature**: 0.5 (사전 선택이므로 낮춤)
- **응답에 `method` 필드 추가**: `"rule-based"` / `"ai-fallback"`
- **staging 배포 완료** (`hyltbeewxaqashyivilu`)
- **프로덕션 배포 완료** (`kcthtpmxffppfbkjjkub`) — 2026-03-17
  - 커밋: `4b1a74b5` (룰베이스 전환)

### [완료] 스테이징 user_trait_tags 정규화
- **대상**: staging DB (`hyltbeewxaqashyivilu`) `user_trait_tags` 테이블
- **총 레코드**: 460개 (+ `__SKIPPED__` 92개)
- **정규화 결과**:
  - 사전 동의어 자동 매핑: 51개 UPDATE
  - 수동 매핑 (의미 기반): 161개 UPDATE
  - 추가 매핑 (지혜로운→통찰력있는 등): 3개 UPDATE
  - **총 215개 UPDATE 실행**
- **정규화 후**: 고유 태그 ~300개 → **~184개** (사전 canonical 매칭 ~77%)
- **미등록 잔여**: ~45개 (각 1건, 성격 태그가 아닌 상태/감정/외부평가 등)

### [완료] 프로덕션 태그 분석 & 정규화 (2026-03-17)
- Supabase MCP `execute_sql`로 전체 태그 조회
- 동의어 그룹 26개, 변형 102개 식별
- 주요 그룹: 책임감있는(7변형/194건), 배려하는(8변형/167건), 고집있는(8변형/163건)
- **프로덕션 정규화 완료**:
  - 정규화 전: **615개 고유 태그** / 3,579건
  - 정규화 후: **133개 canonical 태그** / 3,558건 (21건 → `__SKIPPED__`)
  - 미매핑 태그: **0개**
  - 1단계 사전 동의어 자동 매핑: ~137개 변형 → canonical (약 850건)
  - 2단계 수동 의미 매핑: ~200개 변형 → canonical (약 350건)
  - 3단계 잔여 태그 매핑: 45개 → 가장 가까운 canonical (약 55건)
- **프로덕션 상위 10 태그**:
  - 책임감있는(200), 신중한(182), 배려하는(176), 고집있는(165), 신뢰있는(141)
  - 끈기있는(100), 차분한(94), 내성적인(79), 강인한(75), 예민한(69)

### [완료] 국립국어원 표준국어대사전 API 추출
- **파일**: `src/data/태그 정규화/extracted-adjectives.json` (753개 원본)
- **필터링**: 성격 관련 273개 → 현대어 72개 선별
- **병합**: 51개를 traitTagDictionary.ts에 추가 (중복 제거 후)
- **스크립트**: `src/data/태그 정규화/extract-personality-adjectives.ts`
- **API 키**: `.env.local` → `STDICT_API_KEY` (계정: gksruf813)

### [완료] 사전 유틸리티 함수
```typescript
lookupTag(raw: string): TraitTagEntry | undefined  // synonym → canonical 조회
getTagsByCategory(category): TraitTagEntry[]        // 카테고리별 목록
getTagsByPolarity(polarity): TraitTagEntry[]        // 긍정/부정별 목록
TAG_LOOKUP: Map<string, string>                     // raw → canonical O(1) 매핑
TAG_ENTRY_MAP: Map<string, TraitTagEntry>           // canonical → entry O(1) 매핑
EXCLUDED_TAGS: string[]                             // 제외 태그 (사주운세/비형용사 32개)
```

---

## 3. 남은 작업

### ~~3-1. extract-trait-tags Edge Function 수정~~ ✅ 완료 + 프로덕션 배포 완료

### ~~3-2. DB 마이그레이션~~ (보류 — 코드 레벨 사전으로 충분)

### ~~3-3. 프로덕션 user_trait_tags 정규화~~ ✅ 완료 (2026-03-17)
- 615개 → 133개 canonical 태그 정규화 완료
- extract-trait-tags 프로덕션 배포 완료

### 3-4. analyze-nadaum-dna 수정
- **현재**: AI가 태그를 읽고 6축 점수를 추정 (AI 의존)
- **변경**: 카테고리별 태그 수를 세어서 룰 기반으로 레이더 점수 계산
- **파일**: `supabase/functions/analyze-nadaum-dna/index.ts`
- **방법**: `lookupTag()` → `category` 확인 → 카테고리별 가중 합산

### 3-5. 국어원 API 추가 추출 (선택)
- 현재 `num=100` 제한으로 일부 키워드에서 전체 미수집 (마음 797건 중 100건만)
- 페이지네이션 수정하면 추가 확보 가능
- 급하지 않음 — 현재 240개 canonical로 충분히 시작 가능

---

## 4. 파일 구조

```
src/data/태그 정규화/
├── HANDOVER_태그사전작업.md              # 이 인계서
├── HANDOVER_국어원API추출.md             # 국어원 API 상세 정보
├── traitTagDictionary.ts                # ★ 태그 사전 본체 (240개 canonical)
├── extract-personality-adjectives.ts    # 국어원 API 추출 스크립트
└── extracted-adjectives.json            # 국어원 추출 원본 (753개)

supabase/functions/
├── extract-trait-tags/index.ts          # ★ 룰베이스 + AI 폴백 (수정 완료)
└── server/
    ├── traitTagData.ts                  # ★ Edge Function용 태그 데이터 + 매칭 엔진
    └── cors.ts
```

---

## 5. 관련 코드 위치

| 파일 | 역할 | 상태 |
|------|------|------|
| `supabase/functions/extract-trait-tags/index.ts` | 태그 추출 (룰베이스 + AI 폴백) | ✅ 프로덕션 배포 완료 |
| `supabase/functions/server/traitTagData.ts` | Edge Function용 태그 사전 + 매칭 | ✅ 프로덕션 배포 완료 |
| `supabase/functions/analyze-nadaum-dna/index.ts` | 성격 뿌리 레이더 + 꽃 분석 | **수정 대상** |
| `src/components/CheckRecordMe.tsx` | 태그 선택/확정 UI | 확인 필요 |
| `src/components/NadaumAnalysisPage.tsx` | 나다움 분석 페이지 | 확인 필요 |
| `src/components/NadaumTagsList.tsx` | 태그 목록 표시 | 확인 필요 |

---

## 6. DB 접근 방법

| 방법 | 용도 |
|------|------|
| **Supabase MCP** `execute_sql` | SQL 직접 실행 (가장 편리) |
| `npx supabase inspect db` | 테이블 통계 조회 |
| Production ref | `kcthtpmxffppfbkjjkub` |
| Staging ref | `hyltbeewxaqashyivilu` |

> anon key로는 RLS 때문에 `user_trait_tags` 조회 불가 → MCP `execute_sql` 사용

---

## 7. 스테이징 정규화 매핑 (프로덕션 작업 시 참고)

### 사전 동의어 자동 매핑 (51개) — traitTagDictionary.ts synonyms 기반
```
고집하는→고집있는, 민감한→예민한, 완벽주의한→완벽주의적인, 완고한→고집있는,
자신감 있는→자신감있는, 책임감 있는→책임감있는, 결정못하는→우유부단한,
끈질긴→끈기있는, 표현적인→표현력있는, 경쟁심강한→경쟁심있는, 원칙있는→원칙적인,
폐쇄적인→닫힌, 수동적인→소극적인, 나태한→게으른, 배려심있는→배려하는,
무리하는→과로하는, 공감능력있는→공감하는, 급한→조급한, 깔끔한→정돈된,
배려적인→배려하는, 근면한→성실한, 견고한→단단한, 성급한→조급한,
리더십있는→리더적인, 고집스러운→고집있는, 융통성있는→유연한, 묵묵한→묵직한,
조심성있는→조심스러운, 의심많은→의심하는, 혁신적인→진취적인, 고집센→고집있는,
굳건한→확고한, 매력적인→매력있는, 온유한→온화한, 인내심있는→인내하는,
감추는→감정숨기는, 활기찬→활발한, 집중적인→집중하는, 까다로운→엄격한,
집중력있는→집중하는, 포용력있는→포용적인, 신뢰하는→신뢰있는,
인내심 있는→인내하는, 배려심 있는→배려하는, 태만한→게으른, 진심어린→진심있는,
감정기복심한→감정기복있는, 고집부리는→고집있는, 책임있는→책임감있는,
세련된→섬세한, 경쟁심 있는→경쟁심있는
```

### 수동 매핑 주요 패턴 (161개)
- **나약함 계열**: 무기력한/허약한/연약한/쉽게지치는 → `나약한`
- **보수성 계열**: 변화두려운/변화싫어하는/틀에박힌/경직된/적응못하는/새로운것거부하는 → `보수적인`
- **조급함 계열**: 조바심내는/서두르는/인내심없는/참을성없는 → `조급한`
- **고집 계열**: 양보못하는/막무가내인/타협못하는 → `고집있는`
- **허영 계열**: 과시하는/잘난척하는/허세부리는/자랑하는 → `허영심있는`
- **우유부단 계열**: 확신없는/갈팡질팡하는/주저하는/망설이는 → `우유부단한`
- **자존심 계열**: 건방진/오만한/거만한 → `자존심강한`
- **게으름 계열**: 의욕없는/안주하는 → `게으른`
- **소심 계열**: 위축되는/겁많은/소심해지는/자신없는/두려워하는 → `소심한`

---

## 8. 참고 학술 자료

| 자료 | 내용 | 상태 |
|------|------|------|
| Hahn, Lee, Ashton (1999) | 한국어 성격특성 형용사 406개, HEXACO 기초 | 유료(Wiley) |
| 박재남 (2015) | 한국어 성격형용사 128개, 태도/성질 5분류 | KISS/RISS |
| 박인조, 민경환 (2005) | 한국어 감정단어 434개 | PDF 추출 완료 (`tmp-pdf/`) |
| HEXACO 한국판 | 6요인 × 4하위 = 24 하위척도 | 웹 조사 완료 |
| 국립국어원 표준국어대사전 | 성격 형용사 753개 추출 → 72개 선별 | 완료 |

---

## 9. 다음 세션 시작 시

1. 이 인계서 읽기
2. `src/data/태그 정규화/traitTagDictionary.ts` 확인 (240개 태그 사전, 133개 실사용)
3. 남은 작업:
   - **3-4 (analyze-nadaum-dna)** — 레이더 차트 룰 기반 전환
   - **3-5 (국어원 API 추가 추출)** — 선택사항
4. 정기 모니터링:
   - `SELECT tag_name, COUNT(*) FROM user_trait_tags WHERE tag_name != '__SKIPPED__' GROUP BY tag_name ORDER BY cnt DESC`
   - 새 태그가 canonical 외 값으로 들어오는지 확인 (룰베이스 전환 후 발생 안 해야 함)
