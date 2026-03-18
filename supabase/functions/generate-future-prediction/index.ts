import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  jsonResponse,
  errorResponse,
} from '../server/cors.ts'

/**
 * 미래 예측기 Edge Function
 *
 * 나다움 태그 + 태도 테스트 → AI 에이전트 시뮬레이션 → 온톨로지 + 스펙트럼 + 토론 (사주는 Phase 2에서)
 *
 * POST body: {
 *   category: '연애' | '재물' | '학업' | '직장',
 *   attitude_answers: { question_id: number, answer: string }[],
 *   // saju_record_id는 Phase 2(generate-future-gap)에서 사용
 *   selected_tags?: string[],
 *   custom_question?: string
 * }
 */

// ─── 카테고리별 태도 테스트 설정 (IPIP-HEXACO 기반) ──────────────────
// 출처: IPIP (International Personality Item Pool) — 퍼블릭 도메인
// 각 카테고리는 관련 HEXACO 축의 핵심 문항을 5개로 선별

interface AttitudeQuestion {
  id: number
  text: string
  hexaco: string // HEXACO 축 참조
  options: { label: string; value: string; weight: number }[]
}

interface CategoryConfig {
  title: string
  attitudeType: string
  hexacoAxes: string // 매핑된 HEXACO 축
  questions: AttitudeQuestion[]
}

const CATEGORIES: Record<string, CategoryConfig> = {
  // ── 연애: 감성(Emotionality) + 관계(Agreeableness) ──
  '연애': {
    title: '연애 미래 예측',
    attitudeType: '애착유형',
    hexacoAxes: 'Emotionality + Agreeableness',
    questions: [
      {
        id: 1,
        text: '가까운 사람과 떨어져 있으면 어떤 감정이 드나요?',
        hexaco: 'Emotionality:Sentimentality',
        options: [
          { label: '자주 보고 싶고 불안하다', value: 'anxious', weight: 1 },
          { label: '그립지만 각자 시간을 즐긴다', value: 'secure', weight: 0.5 },
          { label: '크게 신경 쓰이지 않는다', value: 'avoidant', weight: 0 },
        ],
      },
      {
        id: 2,
        text: '감정적으로 힘들 때 어떻게 하나요?',
        hexaco: 'Emotionality:Dependence',
        options: [
          { label: '누군가에게 바로 이야기한다', value: 'anxious', weight: 1 },
          { label: '정리한 뒤 가까운 사람에게 말한다', value: 'secure', weight: 0.5 },
          { label: '혼자 해결하는 편이다', value: 'avoidant', weight: 0 },
        ],
      },
      {
        id: 3,
        text: '상대가 실수했을 때 나의 반응은?',
        hexaco: 'Agreeableness:Forgiveness',
        options: [
          { label: '계속 신경 쓰이고 불안하다', value: 'anxious', weight: 1 },
          { label: '이해하고 자연스럽게 넘어간다', value: 'secure', weight: 0.5 },
          { label: '마음속으로 거리를 둔다', value: 'avoidant', weight: 0 },
        ],
      },
      {
        id: 4,
        text: '관계에서 거절당할까 걱정하는 편인가요?',
        hexaco: 'Emotionality:Anxiety',
        options: [
          { label: '자주 걱정하는 편이다', value: 'anxious', weight: 1 },
          { label: '가끔 신경 쓰이지만 괜찮다', value: 'secure', weight: 0.5 },
          { label: '별로 신경 쓰지 않는다', value: 'avoidant', weight: 0 },
        ],
      },
      {
        id: 5,
        text: '의견이 다를 때 어떻게 대처하나요?',
        hexaco: 'Agreeableness:Patience',
        options: [
          { label: '상대 의견에 맞추려 한다', value: 'anxious', weight: 1 },
          { label: '서로 조율하며 대화한다', value: 'secure', weight: 0.5 },
          { label: '내 입장을 유지하고 거리를 둔다', value: 'avoidant', weight: 0 },
        ],
      },
    ],
  },
  // ── 재물: 진실성(Honesty-Humility) + 의지력(Conscientiousness) ──
  '재물': {
    title: '재물 미래 예측',
    attitudeType: '소비성향',
    hexacoAxes: 'Honesty-Humility + Conscientiousness',
    questions: [
      {
        id: 1,
        text: '물질적으로 풍요로운 삶이 얼마나 중요한가요?',
        hexaco: 'Honesty-Humility:Greed Avoidance',
        options: [
          { label: '소박해도 충분히 행복하다', value: 'saving', weight: 0 },
          { label: '적정선이면 만족한다', value: 'balanced', weight: 0.5 },
          { label: '풍요로운 삶이 중요하다', value: 'spending', weight: 1 },
        ],
      },
      {
        id: 2,
        text: '충동적으로 소비한 적이 있나요?',
        hexaco: 'Conscientiousness:Prudence',
        options: [
          { label: '거의 없다, 항상 신중하다', value: 'saving', weight: 0 },
          { label: '가끔 있지만 후회는 적다', value: 'balanced', weight: 0.5 },
          { label: '종종 있다, 그때 기분이 좋으니까', value: 'spending', weight: 1 },
        ],
      },
      {
        id: 3,
        text: '재정 목표를 세우면 꾸준히 실행하나요?',
        hexaco: 'Conscientiousness:Diligence',
        options: [
          { label: '계획대로 끝까지 실행한다', value: 'saving', weight: 0 },
          { label: '대체로 하지만 유연하게 조절한다', value: 'balanced', weight: 0.5 },
          { label: '세우긴 하지만 잘 안 지켜진다', value: 'spending', weight: 1 },
        ],
      },
      {
        id: 4,
        text: '남들에게 보여지는 생활 수준에 대해?',
        hexaco: 'Honesty-Humility:Modesty',
        options: [
          { label: '신경 쓰지 않는다', value: 'saving', weight: 0 },
          { label: '적당히 맞추는 편이다', value: 'balanced', weight: 0.5 },
          { label: '좋은 인상을 주고 싶다', value: 'spending', weight: 1 },
        ],
      },
      {
        id: 5,
        text: '가계부나 지출 기록을 관리하나요?',
        hexaco: 'Conscientiousness:Organization',
        options: [
          { label: '꼼꼼하게 기록한다', value: 'saving', weight: 0 },
          { label: '대략적으로 파악한다', value: 'balanced', weight: 0.5 },
          { label: '따로 관리하지 않는다', value: 'spending', weight: 1 },
        ],
      },
    ],
  },
  // ── 학업: 실행력(Conscientiousness) + 사고력(Openness) ──
  '학업': {
    title: '학업 미래 예측',
    attitudeType: '학습스타일',
    hexacoAxes: 'Conscientiousness(Organization, Diligence) + Openness(Inquisitiveness)',
    questions: [
      {
        id: 1,
        text: '공부할 때 몰입하는 편인가요?',
        hexaco: 'Conscientiousness:Diligence',
        options: [
          { label: '한번 시작하면 몇 시간이고 빠져든다', value: 'immersive', weight: 1 },
          { label: '계획한 시간만큼 집중한다', value: 'planned', weight: 0.5 },
          { label: '핵심만 빠르게 파악하고 넘어간다', value: 'efficient', weight: 0 },
        ],
      },
      {
        id: 2,
        text: '학습 계획을 어떻게 세우나요?',
        hexaco: 'Conscientiousness:Organization',
        options: [
          { label: '관심 가는 주제에 깊이 파고든다', value: 'immersive', weight: 1 },
          { label: '주간/일간 계획표를 만든다', value: 'planned', weight: 0.5 },
          { label: '시험 범위 중심으로 전략적으로', value: 'efficient', weight: 0 },
        ],
      },
      {
        id: 3,
        text: '시험 대비 방식은 어떤가요?',
        hexaco: 'Openness:Inquisitiveness',
        options: [
          { label: '이해될 때까지 깊이 파고든다', value: 'immersive', weight: 1 },
          { label: '복습 스케줄을 정해서 반복한다', value: 'planned', weight: 0.5 },
          { label: '기출 분석 + 빈출 위주로 정리한다', value: 'efficient', weight: 0 },
        ],
      },
      {
        id: 4,
        text: '공부 중 집중이 흐트러지면?',
        hexaco: 'Conscientiousness:Diligence',
        options: [
          { label: '흥미로운 부분을 찾아서 다시 몰입한다', value: 'immersive', weight: 1 },
          { label: '정해진 루틴으로 돌아간다', value: 'planned', weight: 0.5 },
          { label: '장소나 방법을 바꿔서 효율을 높인다', value: 'efficient', weight: 0 },
        ],
      },
      {
        id: 5,
        text: '학습의 궁극적인 목표는?',
        hexaco: 'Openness:Inquisitiveness',
        options: [
          { label: '알아가는 과정 자체가 즐겁다', value: 'immersive', weight: 1 },
          { label: '목표 달성을 위한 단계적 성장', value: 'planned', weight: 0.5 },
          { label: '최소 노력으로 최대 결과를 내는 것', value: 'efficient', weight: 0 },
        ],
      },
    ],
  },
  // ── 직장: 실행력(Extraversion) + 사고력(Openness) ──
  '직장': {
    title: '직장 미래 예측',
    attitudeType: '동기유형',
    hexacoAxes: 'Extraversion + Openness',
    questions: [
      {
        id: 1,
        text: '새로운 환경이나 도전 앞에서 나는?',
        hexaco: 'Extraversion:Social Boldness',
        options: [
          { label: '익숙한 환경이 편하다', value: 'stability', weight: 0 },
          { label: '흥미롭지만 준비가 필요하다', value: 'recognition', weight: 0.5 },
          { label: '두려움보다 설렘이 크다', value: 'challenge', weight: 1 },
        ],
      },
      {
        id: 2,
        text: '문제를 해결할 때 나의 방식은?',
        hexaco: 'Openness:Creativity',
        options: [
          { label: '검증된 방법을 따른다', value: 'stability', weight: 0 },
          { label: '효율적인 방법을 찾는다', value: 'recognition', weight: 0.5 },
          { label: '새로운 접근을 시도해본다', value: 'challenge', weight: 1 },
        ],
      },
      {
        id: 3,
        text: '나의 능력에 대한 자신감은?',
        hexaco: 'Extraversion:Social Self-Esteem',
        options: [
          { label: '주어진 일은 잘 해내는 편이다', value: 'stability', weight: 0 },
          { label: '인정받을 때 자신감이 올라간다', value: 'recognition', weight: 0.5 },
          { label: '도전할수록 성장한다고 믿는다', value: 'challenge', weight: 1 },
        ],
      },
      {
        id: 4,
        text: '전혀 모르는 분야의 지식을 접하면?',
        hexaco: 'Openness:Inquisitiveness',
        options: [
          { label: '내 분야에 집중하는 게 낫다', value: 'stability', weight: 0 },
          { label: '업무에 도움되면 배워본다', value: 'recognition', weight: 0.5 },
          { label: '호기심이 생겨 파고든다', value: 'challenge', weight: 1 },
        ],
      },
      {
        id: 5,
        text: '일할 때 나의 에너지 수준은?',
        hexaco: 'Extraversion:Liveliness',
        options: [
          { label: '꾸준하고 안정적으로 일한다', value: 'stability', weight: 0 },
          { label: '성과가 보이면 에너지가 올라간다', value: 'recognition', weight: 0.5 },
          { label: '열정적으로 몰입하는 편이다', value: 'challenge', weight: 1 },
        ],
      },
    ],
  },
}

// ─── 태도 점수 계산 ─────────────────────────────────────────────────

function calculateAttitudeScore(
  category: string,
  answers: { question_id: number; answer: string }[]
): { score: number; type: string; description: string } {
  const config = CATEGORIES[category]
  let totalWeight = 0

  for (const ans of answers) {
    const question = config.questions.find(q => q.id === ans.question_id)
    if (!question) continue
    const option = question.options.find(o => o.value === ans.answer)
    if (option) totalWeight += option.weight
  }

  const avgWeight = totalWeight / answers.length // 0~1

  // 카테고리별 타입 결정
  const typeMap: Record<string, { types: string[]; descriptions: string[] }> = {
    '연애': {
      types: ['안정형', '불안형', '회피형'],
      descriptions: [
        '안정적인 관계를 추구하며 건강한 소통을 중시해요',
        '깊은 애착을 원하며 관계에서 확인을 필요로 해요',
        '독립적인 성향으로 개인 공간을 중시해요',
      ],
    },
    '재물': {
      types: ['절약형', '균형형', '소비형'],
      descriptions: [
        '안전한 저축과 절약을 중시하는 성향이에요',
        '저축과 소비의 균형을 잡는 실용적 성향이에요',
        '현재의 경험과 만족을 중시하는 성향이에요',
      ],
    },
    '학업': {
      types: ['몰입형', '계획형', '효율형'],
      descriptions: [
        '깊이 파고들며 학습 자체에서 즐거움을 찾아요',
        '체계적인 계획을 세워 꾸준히 실행하는 스타일이에요',
        '핵심을 빠르게 파악하고 전략적으로 접근해요',
      ],
    },
    '직장': {
      types: ['안정추구형', '인정추구형', '도전추구형'],
      descriptions: [
        '안정적인 환경에서 꾸준히 성장하는 것을 선호해요',
        '성과와 인정을 통해 동기를 얻는 성향이에요',
        '새로운 도전과 성장 기회를 적극적으로 찾아요',
      ],
    },
  }

  const mapping = typeMap[category]
  let typeIdx: number
  if (avgWeight <= 0.33) typeIdx = 0
  else if (avgWeight <= 0.66) typeIdx = 1
  else typeIdx = 2

  return {
    score: avgWeight,
    type: mapping.types[typeIdx],
    description: mapping.descriptions[typeIdx],
  }
}

// ─── AI 프롬프트 생성 ───────────────────────────────────────────────

function buildPrompt(params: {
  category: string
  attitudeResult: { score: number; type: string; description: string }
  tags: { tag_name: string; tag_type: string }[]
  situationText: string
}): string {
  const { category, attitudeResult, tags, situationText } = params

  const positiveTags = tags.filter(t => t.tag_type === 'positive').map(t => t.tag_name)
  const negativeTags = tags.filter(t => t.tag_type === 'negative').map(t => t.tag_name)

  const getTopTags = (tagList: string[], limit: number) => {
    const freq = new Map<string, number>()
    for (const t of tagList) freq.set(t, (freq.get(t) || 0) + 1)
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => count > 1 ? `${name}(${count}회)` : name)
  }

  const topPositive = getTopTags(positiveTags, 20)
  const topNegative = getTopTags(negativeTags, 10)

  const hexacoAxes = CATEGORIES[category]?.hexacoAxes || ''

  return `## 역할
너는 HEXACO 성격심리학에 정통한 미래 예측 AI다.
"${category}" 분야에서 이 사람의 성격 데이터를 **분석·재해석**하고, 시간축을 가진 미래 시나리오를 생성한다.

## 핵심 원칙
1. **태그를 복사하지 마라** — 입력된 태그를 그대로 노드로 만들지 않고, 여러 태그를 묶어서 "이 사람은 ~한 성향 패턴이 있다"는 **인사이트**로 재해석한다
2. **시간축이 있는 예측** — "지금 이런 성향이니까 → 3개월 후 이런 변화가 → 6개월 후 이런 결과가" 흐름을 만든다
3. **모든 노드가 연결되어야 한다** — 고립된 노드 절대 금지. 모든 노드는 최소 1개 이상의 엣지를 가진다
4. **위기 발견이 핵심 가치** — 이 서비스의 목적은 "지금 이대로면 위험합니다"를 보여주는 것이다. 좋은 말만 하면 아무 가치가 없다. 위기와 리스크를 구체적으로 짚어줘야 사용자가 대비할 수 있다
5. **낙관 편향 금지** — 불안형인데 대성, 회피형인데 급상승은 사기다. 성향 데이터에 솔직하게 예측하라. 대부분의 사람은 보완해야 할 점이 많다. position 0.66 이상(대성/급상승)은 긍정 태그가 10개 이상이면서 부정 태그가 거의 없을 때만 허용된다

## 분석 프레임워크
- HEXACO: ${hexacoAxes}
- 카테고리: ${category}

## 입력 데이터

**성향 태그 (긍정)**: ${topPositive.join(', ') || '없음'}
**성향 태그 (보완점)**: ${topNegative.join(', ') || '없음'}
**태도 테스트**: ${attitudeResult.type} (${(attitudeResult.score * 100).toFixed(0)}점) — ${attitudeResult.description}
**최근 상황**: ${situationText}

## 출력 JSON (이것만 출력, 다른 텍스트 금지)

\`\`\`json
{
  "ontology": {
    "center": "이 사람의 핵심 성격 키워드 (15자 이내)",
    "nodes": [
      { "id": "att_1", "label": "태도 특성", "type": "attitude", "group": "core" },
      { "id": "hex_1", "label": "HEXACO축", "type": "facet", "group": "hexaco" },
      { "id": "tag_1", "label": "나다움 태그명", "type": "trait", "group": "trait" },
      { "id": "tag_2", "label": "나다움 태그명", "type": "trait", "group": "trait" },
      { "id": "ins_1", "label": "도출 인사이트", "type": "insight", "group": "insight" },
      { "id": "now_1", "label": "현재 상태", "type": "scenario", "group": "now" },
      { "id": "mid_1", "label": "3~6개월 변화", "type": "scenario", "group": "near" },
      { "id": "far_1", "label": "6개월~1년 결과", "type": "scenario", "group": "far" }
    ],
    "edges": [
      { "from": "center", "to": "att_1", "relation": "HAS_TRAIT" },
      { "from": "center", "to": "hex_1", "relation": "CHARACTERIZED_BY" },
      { "from": "att_1", "to": "tag_1", "relation": "IDENTIFIED_AS" },
      { "from": "hex_1", "to": "tag_2", "relation": "CHARACTERIZES" },
      { "from": "tag_1", "to": "ins_1", "relation": "REVEALS" },
      { "from": "tag_2", "to": "ins_1", "relation": "REVEALS" },
      { "from": "ins_1", "to": "now_1", "relation": "CAUSES" },
      { "from": "now_1", "to": "mid_1", "relation": "EVOLVES_TO" },
      { "from": "mid_1", "to": "far_1", "relation": "LEADS_TO" },
      { "from": "ins_1", "to": "ins_2", "relation": "SYNERGY" }
    ]
  },
  "spectrum": {
    "category": "${category}",
    "position": 0.15,
    "label": "위기 징후",
    "summary": "스펙트럼 요약 (1~2문장)",
    "driver_node": "ins_1",
    "driver_reason": "이 인사이트가 스펙트럼 방향을 결정하는 핵심 요인"
  },
  "debate": {
    "optimist": "낙관이 예측 (2~3문장, 온톨로지 노드 참조하며)",
    "realist": "현실이 예측 (2~3문장)",
    "pessimist": "비관이 예측 (2~3문장)",
    "conclusion": "종합 결론 (2~3문장, 실질적 조언)"
  }
}
\`\`\`

## 노드 타입 상세 규칙

### attitude (3~4개)
태도 테스트에서 도출된 핵심 성격 특성. label: 2~5자

### facet (3~5개)
HEXACO 하위축. 한국어로 직관적으로. label: 2~5자
예: "사교성", "꼼꼼함", "호기심", "절제력", "공감력"

### trait (입력 태그 수만큼, 최대 12개) ⭐ 사용자 입력 반영
- 입력된 나다움 태그를 **그대로** 노드로 만들어 "내 태그가 분석에 반영됐다" 느낌을 준다
- label: 태그 이름 그대로 (예: "신중한", "책임감 강한", "감성적인")
- group: "trait"

### insight (3~6개) ⭐ AI 분석 결과
trait 태그들을 분석하여 도출한 **상위 인사이트**. 여러 태그를 묶어 패턴을 발견한다.
- 강점 패턴, 약점 패턴, 숨은 잠재력, 내적 갈등 등
- label: 2~6자 (예: "완벽주의", "감정표현력", "숨은 야망", "결정장애")
- group: "insight"

### scenario — 시간축 3단계
- **group "now"** (2~3개): 현재 상태/경향 (예: "소비 과다", "저축 습관화")
- **group "near"** (2~3개): 3~6개월 내 예상 변화 (예: "재정 전환점", "습관 변화")
- **group "far"** (2~3개): 6개월~1년 전망 (예: "자산 증가", "투자 실패 위험")

## 엣지 규칙 (★ 절대 고아 노드 금지)
- **center → attitude, facet**: 반드시 연결
- **attitude, facet → trait**: 어떤 성격 축에서 이 태그가 비롯되는지
- **trait → insight**: 여러 태그가 모여서 어떤 인사이트를 형성하는지 (핵심!)
- **insight → scenario(now)**: 이 인사이트가 현재 어떤 상태를 만드는지
- **scenario(now) → scenario(near)**: 현재→가까운 미래 인과
- **scenario(near) → scenario(far)**: 가까운 미래→먼 미래 인과
- **insight ↔ insight**: 시너지/긴장 관계 (최소 2개)
- **총 엣지 수**: 노드 수의 1.5~2.5배 (촘촘하게!)
- relation 허용값: "HAS_TRAIT" | "CHARACTERIZED_BY" | "REVEALS" | "INFLUENCES" | "CAUSES" | "EVOLVES_TO" | "LEADS_TO" | "SYNERGY" | "TENSION" | "AMPLIFIES" | "BLOCKS"

## 스펙트럼 규칙
- position: 0(파극) ~ 1(대성)
- **0.35~0.65 구간 금지!** 극적이고 뚜렷하게
- **기본값은 부정적(0~0.34)이다.** 대부분의 사람은 위기 요소를 가지고 있다. 긍정(0.66~1)은 예외적으로 좋은 데이터가 있을 때만!
- **태도 유형별 position 가이드**:
  - 연애: 불안형 → 0.05~0.20 / 회피형 → 0.05~0.25 / 안정형 → 0.70~0.85
  - 재물: 소비형 → 0.05~0.20 / 균형형 → 0.15~0.30 / 절약형 → 0.70~0.85
  - 학업: 효율형 → 0.10~0.25 / 계획형 → 0.20~0.34 / 몰입형 → 0.70~0.85
  - 직장: 안정추구형 → 0.10~0.25 / 인정추구형 → 0.15~0.30 / 도전추구형 → 0.70~0.85
- label 예시: 0~0.10 "파극", 0.10~0.20 "위기", 0.20~0.34 "하락세", 0.66~0.80 "상승기", 0.80~1 "대성"
- driver_node: 스펙트럼 방향에 가장 큰 영향을 준 insight 노드의 id
- driver_reason: 왜 이 인사이트가 핵심인지 한 줄 설명

## 토론 규칙
- 온톨로지의 insight/scenario 노드를 참조하며 예측
- 친근한 말투 (반말 OK, "너는" 사용)
- 사용자 이름 언급 금지`
}

// ─── 후처리: 고아 노드 자동 연결 ──────────────────────────────────────
function ensureNoOrphanNodes(
  ontology: {
    nodes: { id: string; type: string; group: string }[]
    edges: { from: string; to: string; relation: string }[]
  }
) {
  const connectedIds = new Set<string>()
  for (const e of ontology.edges) {
    connectedIds.add(e.from)
    connectedIds.add(e.to)
  }
  // center는 항상 연결된 것으로 취급
  connectedIds.add('center')

  for (const node of ontology.nodes) {
    if (connectedIds.has(node.id)) continue

    // 고아 노드 발견 → 타입에 따라 자동 연결
    if (node.type === 'attitude' || node.type === 'facet') {
      ontology.edges.push({ from: 'center', to: node.id, relation: 'HAS_TRAIT' })
    } else if (node.type === 'trait') {
      // attitude 또는 facet에 연결
      const parent = ontology.nodes.find(n => n.type === 'attitude' || n.type === 'facet')
      if (parent) {
        ontology.edges.push({ from: parent.id, to: node.id, relation: 'IDENTIFIED_AS' })
      } else {
        ontology.edges.push({ from: 'center', to: node.id, relation: 'HAS_TRAIT' })
      }
    } else if (node.type === 'insight') {
      // trait 또는 attitude/facet에 연결
      const parent = ontology.nodes.find(n => n.type === 'trait') || ontology.nodes.find(n => n.type === 'attitude' || n.type === 'facet')
      if (parent) {
        ontology.edges.push({ from: parent.id, to: node.id, relation: 'REVEALS' })
      } else {
        ontology.edges.push({ from: 'center', to: node.id, relation: 'REVEALS' })
      }
    } else if (node.type === 'scenario') {
      // insight 노드에 연결
      const insight = ontology.nodes.find(n => n.type === 'insight')
      if (insight) {
        ontology.edges.push({ from: insight.id, to: node.id, relation: 'CAUSES' })
      } else {
        ontology.edges.push({ from: 'center', to: node.id, relation: 'LEADS_TO' })
      }
    } else {
      ontology.edges.push({ from: 'center', to: node.id, relation: 'HAS_TRAIT' })
    }
    connectedIds.add(node.id)
  }
}

// ─── 메인 핸들러 ────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  try {
    // ─── 인증 확인 (optional — 비회원 지원) ──────────────────────
    const authHeader = req.headers.get('Authorization')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let user: { id: string } | null = null
    if (authHeader) {
      const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user: authUser } } = await supabaseAnon.auth.getUser()
      user = authUser
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔮 [generate-future-prediction] 시작')
    console.log('📥 user_id:', user?.id || '비회원')

    // ─── 요청 파싱 ──────────────────────────────────────────────
    const { category, attitude_answers, selected_tags, custom_question } = await req.json()

    if (!category || !CATEGORIES[category]) {
      return errorResponse(req, '유효하지 않은 카테고리입니다.', 400)
    }

    if (!attitude_answers || !Array.isArray(attitude_answers) || attitude_answers.length !== 5) {
      return errorResponse(req, '태도 테스트 응답이 올바르지 않습니다.', 400)
    }

    const config = CATEGORIES[category]
    console.log('📋 카테고리:', category, '(' + config.title + ')')

    // ─── 태도 점수 계산 ─────────────────────────────────────────
    const attitudeResult = calculateAttitudeScore(category, attitude_answers)
    console.log('🧠 태도 유형:', attitudeResult.type, '(점수:', attitudeResult.score.toFixed(2), ')')

    // ─── 사용자 데이터 조회 (회원만) ─────────────────────────────
    let tags: { tag_name: string; tag_type: string }[] = []
    let summaries: { situation_summary: string }[] = []

    if (user) {
      const [tagsResult, summaryResult] = await Promise.all([
        supabase
          .from('user_trait_tags')
          .select('tag_name, tag_type')
          .eq('user_id', user.id)
          .eq('is_confirmed', true),
        supabase
          .from('user_situation_summaries')
          .select('situation_summary')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      tags = tagsResult.data || []
      summaries = summaryResult.data || []
    }

    // selected_tags가 있으면 DB 태그에 추가
    if (selected_tags && Array.isArray(selected_tags) && selected_tags.length > 0) {
      const additionalTags = selected_tags.map((t: string) => ({ tag_name: t, tag_type: 'positive' }))
      tags = [...tags, ...additionalTags]
    }

    console.log('📊 태그:', tags.length, '개 | 요약:', summaries.length, '개')

    // ─── 상황 요약 ──────────────────────────────────────────────
    const situationText = summaries.length > 0
      ? summaries.map(s => s.situation_summary).join('\n')
      : '최근 상황 정보 없음'

    // ─── custom_question 텍스트 ─────────────────────────────────
    const customQuestionText = custom_question ? `\n\n### 사용자 질문\n${custom_question}` : ''

    // ─── AI 프롬프트 구성 & 호출 ────────────────────────────────
    const prompt = buildPrompt({
      category,
      attitudeResult,
      tags,
      situationText: situationText + customQuestionText,
    })

    console.log('🤖 AI 호출 시작...')

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return errorResponse(req, 'AI 서비스 설정 오류', 500)
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'JSON만 출력하라. 마크다운 코드블록(```)을 쓰지 마라. 순수 JSON 객체만 반환하라.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 5000,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('❌ OpenAI API 오류:', aiResponse.status, errorText)
      return errorResponse(req, 'AI 예측 생성에 실패했습니다.', 500)
    }

    const aiData = await aiResponse.json()
    const rawContent = aiData.choices?.[0]?.message?.content?.trim()

    if (!rawContent) {
      console.error('❌ AI 응답 비어있음')
      return errorResponse(req, 'AI 예측 결과가 비어있습니다.', 500)
    }

    console.log('✅ AI 생성 완료 (길이:', rawContent.length, '자)')

    // ─── JSON 파싱 ──────────────────────────────────────────────
    let result: {
      ontology: {
        center: string
        nodes: { id: string; label: string; type: string; group: string }[]
        edges: { from: string; to: string; relation: string }[]
      }
      spectrum: { category: string; position: number; label: string; summary: string; driver_node?: string; driver_reason?: string }
      debate: { optimist: string; realist: string; pessimist: string; conclusion: string }
    }

    try {
      // JSON 추출: 코드블록 → 순수 JSON 객체 → 전체 텍스트
      let jsonStr = ''
      const codeBlockMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      } else {
        // 첫 번째 { 부터 마지막 } 까지 추출
        const firstBrace = rawContent.indexOf('{')
        const lastBrace = rawContent.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = rawContent.substring(firstBrace, lastBrace + 1)
        } else {
          throw new Error('JSON 블록 없음')
        }
      }
      console.log('📝 JSON 추출 (길이:', jsonStr.length, ')')
      result = JSON.parse(jsonStr)

      // 스펙트럼 위치 클램핑
      result.spectrum.position = Math.min(1, Math.max(0, result.spectrum.position))
      result.spectrum.category = category

      // ── 태도 유형별 스펙트럼 강제 보정 ──
      // AI가 낙관 편향으로 긍정적 position을 줄 때 태도 유형에 맞게 보정
      const negativeTypes = ['불안형', '회피형', '소비형', '효율형', '안정추구형']
      const neutralTypes = ['균형형', '계획형', '인정추구형']
      if (negativeTypes.includes(attitudeResult.type)) {
        // 부정 유형인데 0.35 이상이면 강제로 0.05~0.25로 보정
        if (result.spectrum.position >= 0.35) {
          result.spectrum.position = 0.05 + Math.random() * 0.20
          console.log('⚠️ 스펙트럼 보정: 부정 유형인데 긍정적 → ', result.spectrum.position.toFixed(2))
        }
      } else if (neutralTypes.includes(attitudeResult.type)) {
        // 중립 유형인데 0.50 이상이면 0.15~0.34로 보정
        if (result.spectrum.position >= 0.50) {
          result.spectrum.position = 0.15 + Math.random() * 0.19
          console.log('⚠️ 스펙트럼 보정: 중립 유형인데 과도 긍정 → ', result.spectrum.position.toFixed(2))
        }
      }
      // 안정형/절약형/몰입형/도전추구형만 긍정 position 허용

      // 스펙트럼 label 자동 보정
      const pos = result.spectrum.position
      if (pos <= 0.10) result.spectrum.label = '파극'
      else if (pos <= 0.20) result.spectrum.label = '위기'
      else if (pos <= 0.34) result.spectrum.label = '하락세'
      else if (pos <= 0.65) result.spectrum.label = '전환기'
      else if (pos <= 0.80) result.spectrum.label = '상승기'
      else result.spectrum.label = '대성'

      // edges가 없으면 빈 배열로
      if (!result.ontology.edges) result.ontology.edges = []

      // 고아 노드 자동 연결
      ensureNoOrphanNodes(result.ontology)

      // 유효하지 않은 엣지 제거 (존재하지 않는 노드 참조)
      const validNodeIds = new Set(['center', ...result.ontology.nodes.map((n: { id: string }) => n.id)])
      result.ontology.edges = result.ontology.edges.filter(
        (e: { from: string; to: string }) => validNodeIds.has(e.from) && validNodeIds.has(e.to)
      )

      console.log('✅ JSON 파싱 성공 (노드:', result.ontology.nodes?.length, '엣지:', result.ontology.edges?.length, 'spectrum:', result.spectrum.position, ')')
    } catch (parseErr) {
      console.error('❌ JSON 파싱 실패:', parseErr)
      return errorResponse(req, 'AI 응답 파싱에 실패했습니다. 다시 시도해주세요.', 500)
    }

    // ─── DB 저장 (회원만) ─────────────────────────────────────────
    let predictionId: string | null = null

    if (user) {
      const { data: prediction, error: insertError } = await supabase
        .from('future_predictions')
        .insert({
          user_id: user.id,
          saju_record_id: null,
          category,
          attitude_answers,
          ontology: result.ontology,
          spectrum_position: result.spectrum.position,
          spectrum_label: result.spectrum.label,
          spectrum_summary: result.spectrum.summary,
          debate_result: result.debate,
          is_paid: false,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ DB 저장 실패:', insertError)
      } else {
        predictionId = prediction?.id || null
        console.log('✅ DB 저장 성공 (id:', predictionId, ')')
      }
    } else {
      console.log('ℹ️ 비회원 — DB 저장 건너뜀')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return jsonResponse(req, {
      success: true,
      prediction: {
        id: predictionId,
        category,
        attitude: attitudeResult,
        ontology: result.ontology,
        spectrum: result.spectrum,
        debate: result.debate,
        is_paid: false,
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [generate-future-prediction] 오류:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return errorResponse(
      req,
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      500
    )
  }
})
