# 미래 예측기 (Future Prediction Engine) 계획서

> **작성일**: 2026-03-16
> **상태**: 4단계 궁합 시뮬레이션 배포 완료
> **영감**: MiroFish-Ko (멀티에이전트 시뮬레이션 엔진), Langent Nebula (지식그래프 시각화)
> **최종 업데이트**: 2026-03-18 (궁합 시뮬레이션 구현 + staging/production 배포)

---

## 컨셉 요약

심리테스트 + 나다움 태그로 유저 온톨로지를 구축하고,
AI 에이전트가 **시간축을 가진** 미래 시나리오를 토론 형태로 예측해주는 서비스.
사주 정보는 Phase 2에서 별도로 입력받아 간극 분석에 활용.

**핵심 차별점**: 운세를 "읽는" 것이 아니라 "시뮬레이션하는" 경험

**수익 구조**:
- 무료: 전체 플로우 체험 (비회원 가능) — 성격 기반 예측 + 사주 간극 분석
- 유료: 맞춤 대응 리포트 (추후 구현)
- **전환 전략**: 위기/리스크를 구체적으로 보여줘서 대책 보고서 구매 유도 (파극→대책 구매)

---

## 선행 작업: 태그 정규화 (별도 세션에서 진행)

> 미래 예측기의 온톨로지 품질은 태그 데이터 품질에 직결됨.

### 완료된 작업
- **태그 사전**: `src/data/태그 정규화/traitTagDictionary.ts` — canonical 243개, 동의어 포함 ~650개+
- **HEXACO 7개 카테고리 분류**: 실행력/사고력/감성/관계/의지력/안정감/진실성
- **유틸리티 함수**: `lookupTag()`, `getTagsByCategory()`, `TAG_LOOKUP` Map 등

### 미래 예측기에서 태그를 쓰는 방식
1. **태그 선택 페이지**: `traitTagDictionary`에서 카테고리 순환으로 태그 제공
2. 사용자가 직접 선택 (최소 3개, 권장 7개+, 이상적 15개+) — **긍정:부정 1:1 비율로 노출**
3. 회원: 기존 `user_trait_tags` 프리로드 + 추가 선택
4. **회원 태그 DB 저장**: 새로 선택한 태그는 `user_trait_tags`에 `source_type: 'self_selected'`, `is_confirmed: true`로 저장 → 프로필에도 반영
5. 선택된 태그 → AI 온톨로지에서 trait 노드로 반영 + insight 노드로 재해석
6. **태그 10~20개 모으면**: 25~35개 노드의 풍부한 5계층 지식그래프 생성

---

## 전체 플로우

```
[랜딩] /future-prediction
  다크 그라데이션, 후킹 질문 ticker, CTA
  ↓
[카테고리 선택] /future-prediction/category
  연애💕 / 재물💰 / 학업📚 / 직장💼 + 커스텀 질문 입력
  ↓
[태도 테스트] /future-prediction/test
  5문항 3지선다 (IPIP-HEXACO 기반)
  ↓
[태그 선택] /future-prediction/tags ⭐
  정확도 스텝퍼 + traitTagDictionary 기반 선택
  ↓
[AI 로딩 Phase1] /future-prediction/loading
  → generate-future-prediction Edge Function (GPT-4.1-mini)
  ↓
[결과] /future-prediction/result ⭐
  3D 온톨로지 그래프 + 스펙트럼 + 채팅형 토론
  ↓
[사주 입력] /future-prediction/saju-input
  ↓
[AI 로딩 Phase2] /future-prediction/loading?phase=gap
  → generate-future-gap Edge Function
  ↓
[간극 시각화] /future-prediction/gap
  브랜드 컬러 게이지 + 유형 카드 + 2열 비교 + 고정 CTA

--- 바이럴 루프 (궁합 시뮬레이션) ---

[결과 페이지] "친구와 궁합 분석하기" 버튼 클릭
  → EF: create_invite → match_code 생성
  → 카카오톡으로 초대 링크 공유: nadaunse.com/future-prediction?match=ABC123
  ↓
[B: 초대 받음] 링크 클릭 → 랜딩 페이지 (match 감지 → sessionStorage)
  → 일반 예측 플로우 (카테고리→테스트→태그→로딩)
  → 로딩 완료 후 match_code 감지 → EF: analyze
  → /future-prediction/compatibility
  ↓
[궁합 결과] /future-prediction/compatibility
  원형 게이지 + 공명점/마찰점 + 미래 시나리오 + 조언 + 카카오 공유
  (A도 같은 match_code로 결과 확인 가능)

--- 추후 구현 ---

[대책 보고서] (추후 구현)
  ↓
[결제] (추후 구현)
  ↓
[전체 보고서 발행] (추후 구현)
  ↓
[로그인 유도] (추후 구현)
```

### 데이터 플로우

```
ss:fp_category, fp_custom_question
  → ss:future_prediction_answers
  → ss:fp_selected_tags
  → ls:future_prediction_result (ss 클리어)
  → ss:fp_saju_info
  → ls:future_gap_result (ss 클리어)

궁합 플로우 (바이럴):
  ss:fp_match_code (랜딩에서 ?match= 감지 시 저장)
  → 예측 완료 후 match_code 감지 → EF analyze 호출
  → ss:fp_compatibility_result, ss:fp_compatibility_category
  → /future-prediction/compatibility 이동 (ss 클리어)
```

---

## 구현 완료된 파일

### 프론트엔드

| 파일 | 설명 | 상태 |
|------|------|------|
| `src/pages/FuturePredictionLandingPage.tsx` | 후킹 랜딩 (다크 그라데이션, ticker) | ✅ |
| `src/pages/FuturePredictionCategoryPage.tsx` | 카테고리 4개 + 질문 입력 | ✅ |
| `src/pages/FutureAttitudeTestPage.tsx` | 5문항 테스트 (학업 추가, 커리어→직장) | ✅ |
| `src/pages/FuturePredictionTagsPage.tsx` | 태그 선택 + 정확도 스텝퍼 | ✅ |
| `src/pages/FuturePredictionLoadingPage.tsx` | AI 로딩 (phase 분기) | ✅ |
| `src/pages/FuturePredictionResultPage.tsx` | 결과 (3D 그래프, 채팅 토론, 궁합 버튼) | ✅ |
| `src/pages/FuturePredictionSajuInputPage.tsx` | 사주 입력/확인 | ✅ |
| `src/pages/FuturePredictionGapPage.tsx` | 간극 시각화 | ✅ |
| `src/pages/FuturePredictionCompatibilityPage.tsx` | 궁합 결과 (원형 게이지, 공명/마찰, 시나리오) | ✅ |
| `src/components/NebulaOntologyGraph.tsx` | Three.js 3D force-directed 그래프 (360도 회전) | ✅ 리빌드 |
| `src/components/CompatibilityMeter.tsx` | 궁합 점수 원형 게이지 애니메이션 | ✅ |

### 라우팅 (App.tsx — 9개)

| 경로 | 페이지 |
|------|--------|
| `/future-prediction` | LandingPage |
| `/future-prediction/category` | CategoryPage |
| `/future-prediction/test` | AttitudeTestPage |
| `/future-prediction/tags` | TagsPage |
| `/future-prediction/loading` | LoadingPage |
| `/future-prediction/result` | ResultPage |
| `/future-prediction/saju-input` | SajuInputPage |
| `/future-prediction/gap` | GapPage |
| `/future-prediction/compatibility` | CompatibilityPage |

### Edge Functions

| 함수명 | 역할 | 모델 | Phase |
|-------|------|------|-------|
| `generate-future-prediction` | 태그+테스트→5계층 온톨로지+스펙트럼+토론 | GPT-4.1-mini | Phase 1 (사주 없음) |
| `generate-future-gap` | prediction+사주→간극분석 | GPT-4.1-nano | Phase 2 (사주 포함) |
| `generate-future-compatibility` | 초대 생성 + 궁합 분석 (3모드) | GPT-4.1-nano | 바이럴 (궁합) |

---

## 간극 분석 (Phase 2)

### 간극 지수 규칙
- **35~65% 중간 구간 금지** — 코드 레벨 강제 보정 (50% 이상 → 66~85%, 50% 미만 → 21~34%)
- **기본적으로 높은 간극(66~90%) 권장** — 대부분의 사람은 성격과 사주 사이 큰 차이 있음

### 간극 유형 (gap_type)

| 유형 | 구간 | 게이지 색상 | 설명 |
|------|------|------------|------|
| 조화형 | 0~20% | 🟢 초록 `#22c55e` | 성격과 운명이 같은 방향 (매우 드묾) |
| 보완형 | 21~34% | 🔵 파랑 `#3b82f6` | 약간의 차이, 조율 가능 |
| 전환형 | 35~80% | 🟡 노랑 `#f59e0b` | 의미 있는 갭, 놓치고 있는 잠재력 |
| 반전형 | 81~100% | 🔴 빨강 `#ef4444` | 큰 갭, 방향 전환 필요 |

### 시각화
- **원형 게이지 (CircularGauge)**: stroke + 퍼센트 텍스트 모두 유형별 색상 적용
- gap_type도 percentage에 따라 코드 레벨 자동 보정

---

## 궁합 시뮬레이션 (바이럴 루프)

### 컨셉
- 초대 링크를 통해 상대방이 예측을 완료해야 결과를 볼 수 있는 구조
- 자연스러운 바이럴 루프: A 예측 → 공유 → B 예측 → 궁합 결과 → B도 공유
- 비회원도 사용 가능, 무료

### DB: `compatibility_invites`
- `match_code`: 6자리 고유 코드 (혼동 문자 제외)
- `inviter_prediction`: A의 prediction_result (attitude, spectrum, debate)
- `invitee_prediction`: B의 prediction_result (B 완료 시 저장)
- `compatibility_result`: AI 궁합 분석 결과
- 7일 후 자동 만료 (`expires_at`)

### Edge Function: `generate-future-compatibility` (3가지 모드)

| 모드 | 역할 | 입력 | 출력 |
|------|------|------|------|
| `create_invite` | A의 결과 저장 + match_code 생성 | category, prediction_result | match_code |
| `analyze` | B 결과 + 궁합 분석 (GPT-4.1-nano) | match_code, prediction_result | compatibility 결과 |
| `get_result` | 결과 조회 (A가 나중에 확인) | match_code | compatibility 결과 or waiting |

### AI 궁합 분석 출력 구조
```json
{
  "compatibility_score": 78,
  "compatibility_type": "보완형 파트너",
  "resonance_points": ["공명점 1", "공명점 2", "공명점 3"],
  "friction_points": ["마찰점 1", "마찰점 2"],
  "future_scenario": "두 사람의 관계 시나리오 (3-4문장)",
  "advice": "관계를 위한 조언 (2-3문장)"
}
```

---

## 카테고리

| 카테고리 | 유형 축 | HEXACO |
|---------|--------|--------|
| 연애💕 | 안정/불안/회피 | Emotionality + Agreeableness |
| 재물💰 | 절약/균형/소비 | Honesty-Humility + Conscientiousness |
| 학업📚 | 몰입/계획/효율 | Conscientiousness + Openness |
| 직장💼 | 안정/인정/도전 | Extraversion + Openness |

---

## 온톨로지 그래프 (3단계 고도화)

### 5계층 노드 구조

```
center(중심) → attitude/facet(성격축) → trait(나다움 태그) → insight(AI 인사이트) → scenario(미래)
                                                                                    ├ now(현재)
                                                                                    ├ near(3~6개월)
                                                                                    └ far(6개월~1년)
```

### 노드 타입 (6종)

| type | 설명 | 개수 | 색상 | group |
|------|------|------|------|-------|
| `attitude` | 태도 테스트 핵심 특성 | 3~4 | Orange `#f97316` | core |
| `facet` | HEXACO 하위축 (한국어) | 3~5 | Indigo `#6366f1` | hexaco |
| `trait` | 선택한 나다움 태그 (입력 반영) | 최대 12 | Teal-300 `#2dd4bf` | trait |
| `insight` | AI가 태그를 분석·그루핑한 인사이트 | 3~6 | Teal-600 `#0d9488` | insight |
| `scenario` | 현재 상태 | 2~3 | Violet `#8b5cf6` | now |
| `scenario` | 3~6개월 전망 | 2~3 | Fuchsia `#d946ef` | near |
| `scenario` | 6개월~1년 전망 | 2~3 | Pink `#ec4899` | far |

### 엣지 규칙 (고아 노드 금지)

| from | to | relation | 의미 |
|------|----|----------|------|
| center | attitude, facet | HAS_TRAIT, CHARACTERIZED_BY | 핵심 성격 |
| attitude, facet | trait | IDENTIFIED_AS, CHARACTERIZES | 이 축에서 비롯된 태그 |
| trait | insight | REVEALS | 여러 태그 → 상위 패턴 |
| insight | scenario(now) | CAUSES | 인사이트 → 현재 상태 |
| scenario(now) | scenario(near) | EVOLVES_TO | 현재 → 가까운 미래 |
| scenario(near) | scenario(far) | LEADS_TO | 가까운 미래 → 먼 미래 |
| insight ↔ insight | SYNERGY, TENSION | 인사이트 간 상호작용 |

### 후처리 (코드 레벨 보장)
- `ensureNoOrphanNodes()` — 타입별 자동 연결
- 유효하지 않은 엣지 자동 제거 (존재하지 않는 노드 참조)
- 엣지 수: 노드 수의 1.5~2.5배

### 스펙트럼↔온톨로지 연결
- `driver_node`: 스펙트럼 방향에 가장 큰 영향을 준 insight 노드 id
- `driver_reason`: 해당 인사이트가 핵심인 이유
- **0.35~0.65 안정기 구간 금지** — 극적인 결과 유도
- **기본값은 부정적(0~0.34)** — 위기 발견이 핵심 가치, 긍정은 예외적 데이터일 때만
- **코드 레벨 강제 보정** — AI 낙관 편향 방지, 태도 유형별 position 자동 클램핑
- **태도 유형별 position 가이드**:
  - 부정 유형 (불안형/회피형/소비형/효율형/안정추구형) → 0.05~0.25 강제
  - 중립 유형 (균형형/계획형/인정추구형) → 0.15~0.34 강제
  - 긍정 유형 (안정형/절약형/몰입형/도전추구형) → 0.66~1.0 허용
- **label 자동 매핑**: 0~0.10 파극 / 0.10~0.20 위기 / 0.20~0.34 하락세 / 0.35~0.65 전환기 / 0.66~0.80 상승기 / 0.80~1 대성

### 시각화 (NebulaOntologyGraph)
- **Three.js + react-force-graph-3d** (WebGL)
- 360도 orbit 회전 (마우스 드래그)
- 스크롤 줌, 자동 zoomToFit
- MeshPhongMaterial 구체 (shininess + specular + emissive)
- SpriteText 노드 라벨
- 흰색 배경 `#f8fafc`
- 커스텀 조명 (ambient + 2 directional + point light)
- 엣지 flow particles
- lazy import + Suspense (Three.js 코드 스플릿 ~1.3MB → 별도 청크)
- 의존성: `react-force-graph-3d`, `three`, `three-spritetext`

---

## 인증 모델

| 범위 | 인증 | DB 저장 |
|------|------|--------|
| 전체 플로우 | 비회원 가능 | ❌ |
| 회원 태그 프리로드 | 회원 | — |
| 태그 선택 → 프로필 저장 | 회원 | ✅ (`self_selected`) |
| 예측 결과 DB 저장 | 회원 | ✅ |

---

## TODO

### 완료
- [x] 8단계 플로우 전체 구현
- [x] 비회원 가능 인증 구조
- [x] 네뷸러 온톨로지 그래프 (Canvas, force-directed, zoom/pan)
- [x] 확장 온톨로지 (12~45 노드, edges)
- [x] 채팅형 에이전트 토론
- [x] 태그 선택 + 정확도 스텝퍼
- [x] 사주 입력 + 간극 분석
- [x] Edge Functions 2개 (prediction, gap)
- [x] 회원 태그 선택 시 프로필 DB 저장 (`self_selected` source_type 추가)
- [x] 간극 페이지 디자인 시스템 리디자인
- [x] 후킹 멘트 고정 카피 (행동경제학 기반)
- [x] 모바일 스크롤 버그 수정
- [x] 간극 분석 사주 데이터 최적화 (sajuKnowledgeMap ~83% 토큰 절감)
- [x] **3D 온톨로지 그래프** (Canvas 2D → Three.js 3D, 360도 회전)
- [x] **온톨로지 5계층 구조** (trait→insight→시간축 scenario)
- [x] **모델 업그레이드** (GPT-4.1-nano → GPT-4.1-mini)
- [x] **Phase 1에서 사주 제거** (사주는 Phase 2 전용)
- [x] **스펙트럼 극적 결과 유도** (0.35~0.65 안정기 금지)
- [x] **고아 노드 자동 연결** (ensureNoOrphanNodes 후처리)
- [x] **center 노드 ID 매핑 버그 수정** ("center" ↔ "__center__")
- [x] **스펙트럼 낙관 편향 제거** — 부정 유형은 position 강제 보정, 프롬프트 위기 중심 개편
- [x] **태그 노출 비율 변경** — 긍정:부정 2:1 → 1:1 인터리브
- [x] **간극 지수 중간 편향 제거** — 35~65% 금지, 코드 레벨 극단 보정, 프롬프트 고간극 유도
- [x] **간극 게이지 유형별 색상** — 조화형(초록)/보완형(파랑)/전환형(노랑)/반전형(빨강)

### 4단계: 궁합 시뮬레이션 (바이럴 루프) — 2026-03-18 완료
- [x] DB 테이블: `compatibility_invites` (match_code, 7일 만료)
- [x] Edge Function: `generate-future-compatibility` (create_invite / analyze / get_result)
- [x] 궁합 결과 페이지: `FuturePredictionCompatibilityPage.tsx` (원형 게이지 + 공명/마찰 + 시나리오 + 조언)
- [x] Result 페이지에 "친구와 궁합 분석하기" 버튼 + 카카오 공유
- [x] Landing 페이지 `?match=` 파라미터 감지 → 초대 메시지 + sessionStorage 저장
- [x] Loading 페이지 prediction 완료 후 match_code 감지 → 궁합 분석 → compatibility 이동
- [x] Staging + Production 배포 완료 (DB + EF + 프론트)

### 남은 작업

#### 즉시 (이번 주)
- [ ] 궁합 E2E 테스트: A 플로우 (예측→궁합 버튼→카카오 공유 링크 생성)
- [ ] 궁합 E2E 테스트: B 플로우 (초대 링크→랜딩 초대 메시지→예측→궁합 결과)
- [ ] 궁합 결과: A가 나중에 같은 링크로 결과 확인 가능한지 테스트
- [ ] 비회원 궁합 플로우 전체 테스트
- [ ] iOS Safari 테스트 (WebGL 3D 그래프 + 터치 회전 + 궁합 플로우)
- [ ] 궁합 결과 공유 카드 이미지 생성 (Canvas 1080x1080)
- [ ] 만료된 초대 정리 (pg_cron 또는 수동)

#### 단기 (2주 내)
- [ ] 궁합 결과 페이지에 "나도 예측해보기" CTA 추가 (B→새 A 전환)
- [ ] 궁합 OG 이미지 / 카카오 공유 썸네일 제작
- [ ] 결과 공유 카드 이미지 생성 (일반 예측 결과용)
- [ ] 프로필 페이지 진입 배너 (미래 예측기 홍보)

#### 중기 (1개월 내)
- [ ] 대책 보고서 페이지 구현
- [ ] 맞춤 대응 리포트 결제 연동
- [ ] 전체 보고서 발행 → 로그인 유도 플로우
- [ ] 궁합 분석 유료화 (심층 궁합 리포트)

---

## 참고 문서

- [CHATBOT_DATA_ANALYSIS.md](./CHATBOT_DATA_ANALYSIS.md) — 챗봇 대화 데이터 분석
- [ONTOLOGY_GUIDE.md](../../develop/ONTOLOGY_GUIDE.md) — 온톨로지 구축 가이드
- [HANDOVER_태그사전작업.md](../../data/태그 정규화/HANDOVER_태그사전작업.md) — 태그 정규화 인계서
- [traitTagDictionary.ts](../../data/태그 정규화/traitTagDictionary.ts) — 태그 사전
- [CLAUDE.md](../../../../CLAUDE.md) — 개발 규칙
