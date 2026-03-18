# 미래 예측기 (Future Prediction Engine) 계획서

> **작성일**: 2026-03-16
> **상태**: 2단계 고도화 구현 완료 (QA 진행 중)
> **영감**: MiroFish-Ko (멀티에이전트 시뮬레이션 엔진), Langent Nebula (지식그래프 시각화)
> **최종 업데이트**: 2026-03-17

---

## 컨셉 요약

사주 + 심리테스트 + 나다움 태그로 유저 온톨로지를 구축하고,
AI 에이전트가 미래 시나리오를 토론 형태로 예측해주는 서비스.

**핵심 차별점**: 운세를 "읽는" 것이 아니라 "시뮬레이션하는" 경험

**수익 구조** (변경됨):
- 무료: 전체 플로우 체험 (비회원 가능) — 성격 기반 예측 + 사주 간극 분석
- 유료: 맞춤 대응 리포트 (추후 구현)

---

## 선행 작업: 태그 정규화 (별도 세션에서 진행)

> 미래 예측기의 온톨로지 품질은 태그 데이터 품질에 직결됨.

### 완료된 작업
- **태그 사전**: `src/data/태그 정규화/traitTagDictionary.ts` — canonical 243개, 동의어 포함 ~650개+
- **HEXACO 7개 카테고리 분류**: 실행력/사고력/감성/관계/의지력/안정감/진실성
- **유틸리티 함수**: `lookupTag()`, `getTagsByCategory()`, `TAG_LOOKUP` Map 등

### 미래 예측기에서 태그를 쓰는 방식
1. **태그 선택 페이지**: `traitTagDictionary`에서 카테고리 순환으로 태그 제공
2. 사용자가 직접 선택 (최소 3개, 권장 7개+, 이상적 15개+)
3. 회원: 기존 `user_trait_tags` 프리로드 + 추가 선택
4. 선택된 태그 → AI 온톨로지 노드로 포함 (trait 타입)
5. **태그 20-30개 모으면**: AI가 12~45개 노드의 풍부한 지식그래프 생성

---

## 현재 플로우 (8단계)

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
  → generate-future-prediction Edge Function
  ↓
[결과] /future-prediction/result
  네뷸러 온톨로지 그래프 + 스펙트럼 + 채팅형 토론
  ↓
[사주 입력] /future-prediction/saju-input
  ↓
[AI 로딩 Phase2] /future-prediction/loading?phase=gap
  → generate-future-gap Edge Function
  ↓
[간극 시각화] /future-prediction/gap
  원형 게이지 + 유형 카드 + 2열 비교
```

### 데이터 플로우

```
ss:fp_category, fp_custom_question
  → ss:future_prediction_answers
  → ss:fp_selected_tags
  → ls:future_prediction_result (ss 클리어)
  → ss:fp_saju_info
  → ls:future_gap_result (ss 클리어)
```

---

## 구현 완료된 파일

### 프론트엔드

| 파일 | 설명 | 상태 |
|------|------|------|
| `src/pages/FuturePredictionLandingPage.tsx` | 후킹 랜딩 (다크 그라데이션, ticker) | ✅ 신규 |
| `src/pages/FuturePredictionCategoryPage.tsx` | 카테고리 4개 + 질문 입력 | ✅ 신규 |
| `src/pages/FutureAttitudeTestPage.tsx` | 5문항 테스트 (학업 추가, 커리어→직장) | ✅ 수정 |
| `src/pages/FuturePredictionTagsPage.tsx` | 태그 선택 + 정확도 스텝퍼 | ✅ 신규 |
| `src/pages/FuturePredictionLoadingPage.tsx` | AI 로딩 (phase 분기) | ✅ 수정 |
| `src/pages/FuturePredictionResultPage.tsx` | 결과 (네뷸러 그래프, 채팅 토론) | ✅ 대폭 수정 |
| `src/pages/FuturePredictionSajuInputPage.tsx` | 사주 입력/확인 | ✅ 신규 |
| `src/pages/FuturePredictionGapPage.tsx` | 간극 시각화 | ✅ 신규 |
| `src/components/NebulaOntologyGraph.tsx` | Canvas 네뷸러 그래프 (force layout, zoom/pan) | ✅ 신규 |

### 라우팅 (App.tsx — 8개)

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

### Edge Functions

| 함수명 | 역할 | 모델 | 상태 |
|-------|------|------|------|
| `generate-future-prediction` | 태그+테스트→온톨로지+스펙트럼+토론 | GPT-4.1-nano | ✅ 수정 |
| `generate-future-gap` | prediction+사주→간극분석 | GPT-4.1-nano | ✅ 신규 |

---

## 카테고리

| 카테고리 | 유형 축 | HEXACO |
|---------|--------|--------|
| 연애💕 | 안정/불안/회피 | Emotionality + Agreeableness |
| 재물💰 | 절약/균형/소비 | Honesty-Humility + Conscientiousness |
| 학업📚 | 몰입/계획/효율 | Conscientiousness + Openness |
| 직장💼 | 안정/인정/도전 | Extraversion + Openness |

(건강/인간관계 삭제, 학업 신규, 커리어→직장 리네이밍)

---

## 온톨로지 그래프 (고도화)

### 노드 타입 (5종)
| type | 설명 | 개수 | 색상 |
|------|------|------|------|
| `attitude` | 태도 테스트 핵심 특성 | 3~5 | Orange |
| `facet` | HEXACO 하위축 | 3~6 | Indigo |
| `trait` | 선택한 나다움 태그 | 태그 수 (최대 15) | Teal |
| `scenario` | 미래 시나리오 | 3~5 | Purple |
| `saju` | 사주 특성 | 0~4 | Pink |

### 노드 수 스케일링
- 태그 3개 → 12~18개 노드
- 태그 10개 → 13~25개 노드
- 태그 20개 → 18~35개 노드
- 태그 30개 → 23~45개 노드

### 시각화 (NebulaOntologyGraph)
- Canvas 2D + requestAnimationFrame
- Force-directed layout (200 iteration)
- 드래그(pan) + 핀치줌(2손가락) + 스크롤줌(마우스 휠) — 0.15x~8x
- 줌 레벨별 라벨 표시 (effectiveSize > 12px)
- 다크 우주 배경, 별 120개, 노드 glow, 엣지 flow particle
- offscreen culling, DPR 대응, iOS Safari 최적화

---

## 인증 모델

| 범위 | 인증 | DB 저장 |
|------|------|--------|
| 전체 8단계 플로우 | 비회원 가능 | ❌ |
| 회원 태그 프리로드 | 회원 | — |
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

### 남은 작업
- [ ] 스테이징 E2E 테스트 (비회원/회원 양쪽)
- [ ] iOS Safari 테스트 (Canvas, 핀치줌, touch)
- [ ] 결과 공유 카드 이미지 생성
- [ ] 맞춤 대응 리포트 결제 연동
- [ ] 프로덕션 배포 (DB + Edge Functions + 프론트)
- [ ] 프로필 페이지 진입 배너

---

## 참고 문서

- [CHATBOT_DATA_ANALYSIS.md](./CHATBOT_DATA_ANALYSIS.md) — 챗봇 대화 데이터 분석
- [ONTOLOGY_GUIDE.md](../../develop/ONTOLOGY_GUIDE.md) — 온톨로지 구축 가이드
- [HANDOVER_태그사전작업.md](../../data/태그 정규화/HANDOVER_태그사전작업.md) — 태그 정규화 인계서
- [traitTagDictionary.ts](../../data/태그 정규화/traitTagDictionary.ts) — 태그 사전
- [CLAUDE.md](../../../../CLAUDE.md) — 개발 규칙
