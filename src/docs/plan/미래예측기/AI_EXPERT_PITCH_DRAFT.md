# AI 전문가 미팅 발표자료 초안

> **작성일**: 2026-03-18
> **목적**: 정부 AI 지원사업 심사를 위한 기술/사업 소개 발표 초안
> **핵심 포지셔닝**: AI 기반 행동 예측 심리 서비스 플랫폼
> **슬라이드**: 12장 (표지/Q&A 포함)

---

### 슬라이드 1. 표지

```
나다운세 — AI 행동 예측 심리 플랫폼

"나를 이해하고, 나의 행동을 예측하고, 더 나은 미래로 이끄는 AI"

스타지오소프트
대표 OOO
2026.03
```

---

### 슬라이드 2. 문제 정의 — 심리 서비스의 접근성 격차

```
■ 한국인의 심리 서비스 현실

  정신건강서비스 이용률    7.2%  (OECD 평균 18.3%) [1]
  MBTI 검사 경험률       90%   (18~29세) [2]
  상담 비이용 사유 1위    "스스로 해결할 수 있다고 생각" [3]

■ 격차의 본질

  전문 상담 ────────── [접근성 사각지대] ────────── MBTI 테스트
  고비용·고부담                                    저비용·저심도
  회당 10~15만원                                   일회성, 행동 변화 없음
  예약 대기 2~4주                                   유형 분류 후 끝

  → 사람들은 "나를 이해하고 싶다"
  → 그러나 전문 상담은 부담, 가벼운 테스트는 깊이 부족
  → AI가 이 사각지대를 메울 수 있다
```

---

### 슬라이드 3. 실사용자 데이터가 증명하는 니즈

```
■ 자체 플랫폼 축적 데이터 (2024~2026)

  총 사용자       77,898명
  총 대화 세션   1,126,611회
  총 메시지      5,038,323건
  유저당 평균     64.7건 (높은 몰입도)

■ 핵심 발견: 사람들은 "이해"와 "행동 가이드"를 동시에 원한다

  "앞으로 어떻게 될까?" (미래 궁금)    52.6%
  "어떻게 해야 하지?" (행동 가이드)    61.6%
  둘 다 동시에 보이는 유저             44.0%

  → 유저 절반이 "자기 미래에 대한 불안"과
    "구체적 행동 변화 욕구"를 동시에 표현
  → 전형적인 "불안 → 통제감 회복" 심리 패턴
  → AI가 이 전환을 체계적으로 도울 수 있다

■ 관심 영역: 연애 26.5% | 커리어 9.5% | 재물 7.2% | 건강 3.0%
```

---

### 슬라이드 4. 솔루션 — AI 행동 예측 심리 플랫폼

```
■ 3단계 가치 체인

  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
  │  자기이해     │ →  │  행동 예측     │ →  │  긍정적 행동 변화  │
  │  (WHO am I)  │    │  (HOW I act)  │    │  (WHAT to do)    │
  │              │    │              │    │                  │
  │  성격·기질    │    │  의사결정 패턴 │    │  맞춤 행동 처방전  │
  │  동기 체계    │    │  리스크 감지   │    │  100일 액션 플랜   │
  └─────────────┘    └──────────────┘    └──────────────────┘

  기존 서비스:  "당신은 이런 유형입니다" → 끝
  나다운세:     "이런 유형이라 이런 상황에서 이렇게 행동할 가능성이 높고,
               이렇게 바꾸면 더 나은 결과를 얻을 수 있습니다" → 추적

■ 핵심 차별점: 진단 → 예측 → 행동 가이드 → 누적 추적

  │  경쟁사       │  접근법         │  한계                  │
  │  MBTI 테스트   │  유형 분류       │  행동 변화 없음, 일회성  │
  │  아이작        │  척도 검사 나열   │  문항 200+, 예측 없음   │
  │  트로스트      │  AI 상담        │  예측/추적 없음         │
  │  나다운세      │  척도+AI 예측    │  예측+가이드+누적 추적   │
```

---

### 슬라이드 5. 학술 심리 프레임워크 — 과학적 근거

```
■ 검증된 심리 척도 7개 채택 (전부 학술 논문 기반, 한국어 타당화 완료)

  ┌─ 성격·기질 분석 (Stage 1) ────────────────────────────────┐
  │                                                          │
  │  HEXACO-PI-R (Ashton & Lee, 2004) — 6축 성격 모델         │
  │  → BigFive 진화형, 정직-겸손 축 추가                       │
  │  → 7개 카테고리로 재구성 + 태그 사전 243개 구축             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ┌─ 행동 예측 척도 (Stage 2) ────────────────────────────────┐
  │                                                          │
  │  ① ZTPI (Zimbardo)    시간관점 — 의사결정 패턴 예측        │
  │  ② BIS/BAS (Carver)   동기체계 — 위험회피 vs 보상추구      │
  │  ③ RFQ (Higgins)      조절초점 — 성장추구 vs 안전추구      │
  │  ④ CFC (Strathman)    미래결과 고려 — 즉흥 vs 계획         │
  │  ⑤ Grit-S (Duckworth) 끈기 — 장기 성과 예측               │
  │  ⑥ LOC IE-4 (Rotter)  통제소재 — 자기결정 vs 환경귀인      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

■ 왜 이 조합인가?

  성격(HEXACO)만으로 행동 예측 상관계수 r = 0.2~0.3 (약함) [14][15]
  + 동기(BIS/BAS, RFQ) + 시간(ZTPI, CFC) + 조절(Grit, LOC)
  = 예측력 대폭 향상

  "누구인가" + "어떻게 행동하는가" = 행동 예측 모델
```

---

### 슬라이드 6. AI 핵심 기술 — 온톨로지 + 멀티에이전트

```
■ 기술 1: AI 심리 온톨로지 (지식그래프)

  사용자의 심리 데이터를 노드-엣지 지식그래프로 변환
  → 성격 특성 간 상호작용을 시각화하고 행동 패턴을 추론

  노드 5종: 태도 / HEXACO 하위축 / 성향 태그 / 미래 시나리오 / 맥락
  규모: 12~45 노드, 사용할수록 축적 → 예측 정밀도 향상

  [데모 스크린샷: 네뷸러 온톨로지 그래프 삽입]

■ 기술 2: 멀티에이전트 심리 시뮬레이션

  3개 AI 에이전트가 서로 다른 관점에서 토론:
  낙관 에이전트 — 강점 기반 최선 시나리오
  현실 에이전트 — 데이터 기반 객관적 분석
  비판 에이전트 — 리스크 경고 및 약점 분석
  → 종합하여 균형 잡힌 예측 생성

■ 기술 3: 간극 분석 (Gap Analysis)

  "심리적 자기인식" vs "실제 행동 경향성" 사이 괴리를 수치화
  예: 자기인식 "나는 계획적" + CFC 즉각지향 高 → 간극 28%
  → 이 간극 인식 자체가 행동 변화의 첫 단계 (인지행동치료 원리)

■ 기술 스택

  React 18 + TypeScript + Canvas 2D | Supabase (PostgreSQL + Edge Functions 46개)
  GPT-4o (심층 분석) + GPT-4.1-nano (경량) | Vercel + Sentry
```

---

### 슬라이드 7. 제품 플로우 & 데모

```
■ 사용자 경험 (8단계)

  ① 랜딩 → ② 영역 선택 (연애/재물/학업/직장)
  → ③ 태도 테스트 5문항 → ④ 심리 태그 선택
  ────── [여기까지 무료] ──────
  → ⑤ AI 분석 (온톨로지 + 스펙트럼 + 에이전트 토론)
  → ⑥ 상세 설문 18문항 → ⑦ 심층 보고서 7챕터
  → ⑧ 100일 액션 플랜 + 추적

■ [데모 스크린샷 삽입 위치]

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ 온톨로지   │  │ 간극 분석  │  │ AI 토론   │  │ 행동 처방  │
  │ 그래프     │  │ 게이지    │  │          │  │          │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘

■ 현재 개발 현황

  • 8단계 플로우 구현 완료 (QA 진행 중)
  • Edge Functions 2개 운영 중
  • Canvas 온톨로지 시각화 엔진 완료
  • 유료 상세 설문 6개 척도 설계 완료
  • 누적 사용자 77,898명 / 대화 5,038,323건
```

---

### 슬라이드 8. 누적형 모델 — 일회성을 넘어서

```
■ 기존 심리 테스트의 한계

  테스트 1회 → 결과 확인 → 끝 (데이터 소멸, 재방문 없음)

■ 나다운세의 누적형 심리 프로파일

  1월: 직장 분석 → 온톨로지 v1 (12노드)
  2월: 연애 분석 → 기존에 추가 → v2 (20노드)
  3월: 재물 분석 → v3 (28노드)
  6월: → v6 (45노드, 80+ edges)
       ↓
  "나만의 심리 지도"가 시간과 함께 정교해짐

■ 예측 피드백 루프 (자기강화 학습)

  예측 생성 → 행동 가이드 제공 → 사용자 실제 행동
       ↑                              ↓
  AI 모델 개인화  ←  피드백 ("예측이 맞았나요?")

  → 반복할수록 개인 맞춤 예측 정밀도 향상
  → 종단적(longitudinal) 심리 데이터 축적 = 학술적 가치
```

---

### 슬라이드 9. AI R&D 과제 — 정부 지원 활용 영역

```
■ 과제 1: 행동 예측 AI 모델 고도화

  현재: LLM(GPT) 프롬프트 기반 예측
  목표: 자체 Fine-tuned 행동 예측 모델

  • 77,898명 × 5M+ 메시지 학습 데이터 보유
  • 심리 척도 응답 + 실제 행동 피드백 = 학습 쌍
  • 한국어 심리 도메인 특화 LLM
  • 예측 정확도 정량 측정 체계 구축

■ 과제 2: 심리 온톨로지 자동 구축 엔진

  • HEXACO + 6개 척도 교차 분석 자동화
  • 시계열 온톨로지 비교 (성장/변화 감지)
  • GNN(Graph Neural Network) 기반 노드 관계 추론

■ 과제 3: 멀티에이전트 시뮬레이션 고도화

  • 심리학 이론 기반 추론 규칙 내장
  • 에이전트 간 반론/재반론 (dialectical reasoning)
  • 시나리오 분기 시뮬레이션 (what-if 분석)

■ 12개월 로드맵

  Q1: 데이터 파이프라인 + 척도 고도화
  Q2: 예측 모델 v1 학습 + 온톨로지 엔진
  Q3: 멀티에이전트 고도화 + 적중률 검증
  Q4: 모델 최적화 + 논문 투고 + 서비스 고도화
```

---

### 슬라이드 10. 비즈니스 모델 & 시장

```
■ 수익 구조

  무료 (0원)           전체 플로우 체험 + 기본 결과
  심층 리포트 (19,800원) 7챕터 보고서 + 행동 처방전
  궁합 분석 (2,900원)    두 사람 온톨로지 비교
  월간 추적 (4,900원/월)  누적 분석 + 월간 리포트

■ 시장 규모

  TAM: 글로벌 정신건강 앱 시장 85억 달러 (2025), CAGR 18.5% [4]
  SAM: 국내 디지털 헬스케어 시장 6.5조원 (2023) 중 멘탈헬스 비중 [5]
  SOM: 월 MAU 5만명 × ARPU 1,200원 = 연 7.2억원

■ 지원금 사용 계획

  AI 모델 개발 (40%)  Fine-tuning, GPU 클라우드
  연구 개발 (30%)     심리학 자문, 척도 타당화, 정확도 평가
  인프라 (20%)        서버/API 비용
  사용자 확보 (10%)   베타 모집, 종단 연구 참여자

■ 기대 산출물

  1. 자체 행동 예측 모델 v1  2. 온톨로지 자동 구축 엔진
  3. 정확도 검증 보고서      4. 학술 논문 1편 (한국심리학회지)
```

---

### 슬라이드 11. 비전

```
■ 2026   AI 행동 예측 심리 서비스 런칭
         자기 행동 패턴을 객관적으로 이해하는 첫 경험

■ 2027   누적형 심리 프로파일 플랫폼
         사용할수록 정밀해지는 "나만의 심리 지도"

■ 2028~  AI 심리 파트너
         의사결정 순간마다 "나를 가장 잘 아는 AI"가 조언
         전문 심리 상담사와의 협업 도구로 확장


"사람은 자기 자신을 이해할수록 더 나은 선택을 한다.
 AI는 그 자기이해를 과학적으로, 대중적으로, 지속적으로 도울 수 있다."
```

---

### 슬라이드 12. Q&A

```
감사합니다.

나다운세 — AI 행동 예측 심리 플랫폼
nadaunse.com

OOO
연락처: OOO
이메일: OOO
```

---

## 발표 시 주의사항 (내부 메모)

### 반드시 강조할 포인트

1. **"심리 서비스"** — 사주/타로 단어 절대 사용 금지
2. **학술 근거** — HEXACO, ZTPI, BIS/BAS 등 검증된 척도 반복 언급
3. **77,898명 실데이터** — "이론이 아니라 데이터로 검증"
4. **행동 변화** — "진단에서 끝나지 않고 행동 가이드 + 추적까지"
5. **사회적 가치** — 심리 서비스 접근성, 예방적 정신건강

### 사용 금지 표현

| ❌ 금지 | ✅ 대체 |
|--------|--------|
| 사주 | 시간 맥락 분석, 동양 철학적 시간관 |
| 운세 | 행동 예측, 미래 시나리오 시뮬레이션 |
| 타로 | (언급하지 않음) |
| 점 | 예측 분석, 패턴 분석 |
| 운명 | 행동 경향성, 무의식적 패턴 |
| 팔자 | 기질적 성향, 선천적 기질 |

### 예상 질문 대비

| 예상 질문 | 답변 방향 |
|----------|----------|
| "운세 서비스 아닌가요?" | "핵심은 학술 심리 척도 기반 행동 예측. HEXACO, ZTPI 등 검증된 프레임워크 사용" |
| "기존 심리 앱과 차이?" | "진단→예측→가이드→누적추적. 77,898명 실데이터 보유" |
| "AI 예측 정확도?" | "현재 LLM 기반, 지원금으로 자체 모델 개발 + 적중률 정량 검증 구축 예정" |
| "심리학 전문가 자문?" | "한국어 타당화 완료 척도만 채택. 향후 자문위원 연계 계획" |
| "개인정보/윤리?" | "익명화, RLS 적용, 동의 기반 수집. 민감 정보 서버사이드 처리" |

---

## 출처 (References)

### 통계 자료

| # | 출처 | 내용 |
|---|------|------|
| [1] | 보건복지부·국립정신건강센터, 「2021년 정신건강실태조사」 | 지난 1년간 정신건강서비스 이용률 7.2%. OECD 국가 비교 포함 |
| [2] | 한국리서치 「별난리서치: MBTI, 얼마나 알고 있을까?」 (2021.12, 전국 1,000명) | 18~29세 MBTI 검사 경험률 90%, 인지율 80% |
| [3] | 보건복지부·국립정신건강센터, 「2024년 국민 정신건강 지식 및 태도 조사」 (전국 15~69세 3,000명) | 정신건강서비스 비이용 사유 |
| [4] | Mordor Intelligence, 「Mental Health Apps Market」 (2025) | 글로벌 정신건강 앱 시장 85억 달러 (2025), 309.5억 달러 (2030), CAGR 18.49% |
| [5] | 디지털헬스산업협회, 「2024 디지털헬스산업 실태조사」 | 국내 디지털 헬스케어 시장 6조 4,930억원 (2023), 전년 대비 13.5% 성장 |

### 심리 척도 원전 논문

| # | 척도 | 논문 |
|---|------|------|
| [6] | HEXACO | Lee, K., & Ashton, M. C. (2004). Psychometric properties of the HEXACO Personality Inventory. *Multivariate Behavioral Research*, 39, 329-358. |
| [7] | HEXACO-60 | Ashton, M. C., & Lee, K. (2009). The HEXACO-60: A short measure of the major dimensions of personality. *Journal of Personality Assessment*, 91, 340-345. |
| [8] | ZTPI | Zimbardo, P. G., & Boyd, J. N. (1999). Putting time in perspective: A valid, reliable individual differences metric. *Journal of Personality and Social Psychology*, 77, 1271-1288. |
| [9] | BIS/BAS | Carver, C. S., & White, T. L. (1994). Behavioral inhibition, behavioral activation, and affective responses to impending reward and punishment: The BIS/BAS Scales. *Journal of Personality and Social Psychology*, 67(2), 319-333. |
| [10] | RFQ | Higgins, E. T., et al. (2001). Achievement orientations from subjective histories of success: Promotion pride versus prevention pride. *European Journal of Social Psychology*, 31(1), 3-23. |
| [11] | CFC | Strathman, A., et al. (1994). The consideration of future consequences: Weighing immediate and distant outcomes of behavior. *Journal of Personality and Social Psychology*, 66(4), 742-752. |
| [12] | Grit | Duckworth, A. L., et al. (2007). Grit: Perseverance and passion for long-term goals. *Journal of Personality and Social Psychology*, 92(6), 1087-1101. |
| [13] | LOC / IE-4 | Rotter, J. B. (1966). Generalized expectancies for internal versus external control of reinforcement. *Psychological Monographs*, 80(1). / Kovaleva, A. (2012). The IE-4: Construction and validation of a short scale for the assessment of locus of control. *GESIS-Schriftenreihe*, 9. |

### 행동 예측력 근거 논문

| # | 논문 | 핵심 내용 |
|---|------|----------|
| [14] | Roberts, B. W., et al. (2007). The power of personality: The comparative validity of personality traits, SES, and cognitive ability for predicting important life outcomes. *Perspectives on Psychological Science*, 2(4), 313-345. | 성격 특성의 예측력이 SES·인지능력과 동등 수준 |
| [15] | Ozer, D. J., & Benet-Martinez, V. (2006). Personality and the prediction of consequential outcomes. *Annual Review of Psychology*, 57, 401-421. | Big Five의 건강·행복·직업 성과 예측력 메타분석 |
| [16] | Funder, D. C., & Ozer, D. J. (2019). Evaluating effect size in psychological research. *Advances in Methods and Practices in Psychological Science*, 2(2), 156-168. | r = 0.30 ("personality coefficient")이 의학적 효과 크기 대비 유의미 |

---

## 참고 문서

- [FUTURE_PREDICTION_PLAN.md](./FUTURE_PREDICTION_PLAN.md) — 미래 예측기 기능 계획서
- [PAID_SURVEY_DESIGN.md](./PAID_SURVEY_DESIGN.md) — 유료 상세 설문 설계서
- [PAID_REPORT_DESIGN.md](./PAID_REPORT_DESIGN.md) — 유료 보고서 7챕터 설계
- [CHATBOT_DATA_ANALYSIS.md](./CHATBOT_DATA_ANALYSIS.md) — 대화 데이터 분석
- [FUTURE_PREDICTION_BUSINESS_STRATEGY.md](./FUTURE_PREDICTION_BUSINESS_STRATEGY.md) — 비즈니스 전략서

---

**최종 업데이트**: 2026-03-18
