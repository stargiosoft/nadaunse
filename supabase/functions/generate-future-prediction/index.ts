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
 * 사주 + 나다움 태그 + 태도 테스트 → AI 에이전트 시뮬레이션 → 온톨로지 + 스펙트럼 + 토론
 *
 * POST body: {
 *   category: '연애' | '재물' | '학업' | '직장',
 *   attitude_answers: { question_id: number, answer: string }[],
 *   saju_record_id?: string,
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
  sajuInfo: string
  detailedSajuInfo: string
  tags: { tag_name: string; tag_type: string }[]
  situationText: string
}): string {
  const { category, attitudeResult, sajuInfo, detailedSajuInfo, tags, situationText } = params

  const positiveTags = tags.filter(t => t.tag_type === 'positive').map(t => t.tag_name)
  const negativeTags = tags.filter(t => t.tag_type === 'negative').map(t => t.tag_name)

  // 빈도 기반 상위 태그
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

  // 태그 수에 따라 온톨로지 깊이 조절
  const tagCount = topPositive.length + topNegative.length
  const nodeMin = Math.max(12, 8 + Math.floor(tagCount * 0.5))
  const nodeMax = Math.min(30, 15 + tagCount)

  return `## 역할
당신은 명리학 + HEXACO 성격심리학에 정통한 미래 예측 AI 에이전트 코디네이터입니다.
3명의 에이전트(낙관이, 현실이, 비관이)의 관점을 종합하여 "${category}" 분야의 미래를 예측합니다.

## 분석 프레임워크
- **HEXACO 성격 모델** (IPIP 기반, 학술 검증): 6축 — Honesty-Humility(진실성), Emotionality(감성), Extraversion(실행력), Agreeableness(관계), Conscientiousness(의지력), Openness(사고력)
- 이번 카테고리(${category})는 **${hexacoAxes}** 축을 중심으로 분석
- 태도 테스트 문항은 IPIP-HEXACO 문항 풀에서 선별 (퍼블릭 도메인)

## 입력 정보

### 사주 정보
${sajuInfo}${detailedSajuInfo}

### 나다움 성향 태그 (긍정)
${topPositive.join(', ') || '없음'}

### 나다움 성향 태그 (보완점)
${topNegative.join(', ') || '없음'}

### 태도 테스트 결과
- 카테고리: ${category}
- 유형: ${attitudeResult.type}
- 점수: ${(attitudeResult.score * 100).toFixed(0)}점
- 설명: ${attitudeResult.description}

### 최근 상황
${situationText}

## 출력 형식 (반드시 아래 JSON으로만 출력)

\`\`\`json
{
  "ontology": {
    "center": "유저의 나다움 핵심 유형 (한 줄, 15자 이내)",
    "nodes": [
      { "id": "att_1", "label": "태도 특성명", "type": "attitude", "group": "core" },
      { "id": "hex_1", "label": "HEXACO 하위축", "type": "facet", "group": "hexaco" },
      { "id": "tag_1", "label": "나다움 태그", "type": "trait", "group": "trait" },
      { "id": "pred_1", "label": "미래 시나리오", "type": "scenario", "group": "prediction" },
      { "id": "saju_1", "label": "사주 특성", "type": "saju", "group": "saju" }
    ],
    "edges": [
      { "from": "center", "to": "att_1", "relation": "TENDS_TO" },
      { "from": "att_1", "to": "tag_1", "relation": "IDENTIFIED_AS" },
      { "from": "hex_1", "to": "tag_1", "relation": "CHARACTERIZES" },
      { "from": "tag_1", "to": "pred_1", "relation": "LEADS_TO" }
    ]
  },
  "spectrum": {
    "category": "${category}",
    "position": 0.5,
    "label": "현재 위치를 나타내는 2~4자 라벨",
    "summary": "30자 이내 한줄 해석"
  },
  "debate": {
    "optimist": "낙관이의 미래 예측 (2~3문장, 구체적으로)",
    "realist": "현실이의 미래 예측 (2~3문장, 구체적으로)",
    "pessimist": "비관이의 미래 예측 (2~3문장, 구체적으로)",
    "conclusion": "3명의 토론을 종합한 결론 (2~3문장)"
  }
}
\`\`\`

## 출력 규칙

### ontology
- nodes 배열: **${nodeMin}~${nodeMax}개** (입력된 태그/데이터에 비례하여 풍부하게 생성)
- **id**: 각 노드의 고유 ID (예: att_1, hex_1, tag_1, pred_1, saju_1 등)
- **type 허용값**:
  - "attitude" — 태도 테스트에서 도출된 핵심 특성 (3~5개)
  - "facet" — HEXACO 하위축 (Sociability, Diligence, Inquisitiveness 등) (3~6개)
  - "trait" — 입력된 나다움 태그 자체를 노드로 (태그 수만큼, 최대 15개)
  - "scenario" — 미래 시나리오/가능성 (3~5개, 구체적 예측 키워드)
  - "saju" — 사주 기반 특성 (사주 있으면 2~4개, 없으면 0개)
- **group**: 같은 group끼리 클러스터로 배치됨 ("core", "hexaco", "trait", "prediction", "saju")
- 각 node의 label은 구체적이고 짧게 (2~6자)

### ontology.edges
- 노드 간 **의미 있는 연결**만 생성 (모든 쌍이 아니라 분석적 관계가 있는 것만)
- center에서 core 그룹 노드로 연결
- core/hexaco 노드에서 trait 노드로 연결 (이 태그가 어떤 성격 축에서 비롯되는지)
- trait 노드에서 scenario 노드로 연결 (이 성향이 어떤 미래로 이어지는지)
- saju 노드는 scenario 노드와 연결 (운명적 영향)
- trait 노드끼리도 관련 있으면 연결 가능 (시너지/긴장 관계)
- "from"/"to"는 노드의 id (center는 "center"로 표기)
- relation 허용값: "TENDS_TO" | "HAS_TRAIT" | "CHARACTERIZES" | "IDENTIFIED_AS" | "LEADS_TO" | "INFLUENCES" | "SYNERGY" | "TENSION" | "PREDICTED"
- edges 수: nodes 수의 1.2~2배 정도 (촘촘한 네트워크)

### spectrum
- position: 0(파극/매우부정) ~ 1(대성/매우긍정), 소수점 2자리
- 사주의 대운/세운 흐름 + 태도 점수를 종합하여 결정
- label: "전환기", "상승기", "안정기" 등 직관적 라벨
- summary: 구체적 시기 언급 권장 ("하반기에 전환점이 올 수 있어요")

### debate
- 각 에이전트는 서로 다른 관점에서 구체적으로 예측
- 낙관이: 가장 좋은 시나리오, 긍정적 가능성
- 현실이: 객관적 현실, 필요한 노력
- 비관이: 리스크, 주의점, 최악의 시나리오
- conclusion: 3명 의견 종합 + 실질적 조언

### 공통
- 친근하고 따뜻한 말투 (반말 OK, "너는" 사용)
- 사용자 이름 언급 금지
- JSON 외 텍스트 출력 금지
- 구체적이고 실용적인 예측 제시`
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
    const { category, attitude_answers, saju_record_id, selected_tags, custom_question } = await req.json()

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
    let saju: Record<string, unknown> | null = null
    let summaries: { situation_summary: string }[] = []

    if (user) {
      const sajuQuery = saju_record_id
        ? supabase.from('saju_records').select('*').eq('id', saju_record_id).single()
        : supabase.from('saju_records').select('*').eq('user_id', user.id).eq('is_primary', true).single()

      const [tagsResult, sajuResult, summaryResult] = await Promise.all([
        supabase
          .from('user_trait_tags')
          .select('tag_name, tag_type')
          .eq('user_id', user.id)
          .eq('is_confirmed', true),
        sajuQuery,
        supabase
          .from('user_situation_summaries')
          .select('situation_summary')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      tags = tagsResult.data || []
      saju = sajuResult.data
      summaries = summaryResult.data || []
    }

    // selected_tags가 있으면 DB 태그에 추가
    if (selected_tags && Array.isArray(selected_tags) && selected_tags.length > 0) {
      const additionalTags = selected_tags.map((t: string) => ({ tag_name: t, tag_type: 'positive' }))
      tags = [...tags, ...additionalTags]
    }

    console.log('📊 태그:', tags.length, '개 | 사주:', saju ? '있음' : '없음', '| 요약:', summaries.length, '개')

    // ─── 사주 정보 텍스트 (optional) ─────────────────────────────
    let sajuInfo = '사주 정보 없음'
    let detailedSajuInfo = ''

    if (saju) {
      const d = new Date(saju.birth_date as string)
      const cal = saju.calendar_type === 'lunar' ? '음력' : '양력'
      const gen = saju.gender === 'male' ? '남성' : '여성'
      sajuInfo = `이름: ${saju.full_name}, 성별: ${gen}, 생년월일: ${cal} ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일, 태어난 시간: ${saju.birth_time || '모름'}, 띠: ${saju.zodiac || '모름'}`

      // ─── 사주 API 호출 (상세 데이터) ────────────────────────────
      try {
        const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()

        if (sajuApiKey && saju.birth_date) {
          const birthDateStr = saju.birth_date as string
          const birthTimeStr = (saju.birth_time as string) || '12:00'

          const datePart = birthDateStr.includes('T') ? birthDateStr.split('T')[0] : birthDateStr.split(' ')[0]
          const dateOnly = datePart.replace(/-/g, '')
          const timeOnly = birthTimeStr.replace(/:/g, '').substring(0, 4)
          const birthday = dateOnly + timeOnly

          const lunar = saju.calendar_type === 'lunar' ? 'true' : 'false'
          const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=${lunar}&gender=${saju.gender}&apiKey=${sajuApiKey}`
          console.log('📞 사주 API 호출:', sajuApiUrl.replace(sajuApiKey, '***'))

          let cachedSajuData: Record<string, unknown> | null = null

          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const sajuResponse = await fetch(sajuApiUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'Accept-Encoding': 'gzip, deflate, br',
                  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                  'Host': 'service.stargio.co.kr:8400',
                  'Origin': 'https://nadaunse.com',
                  'Referer': 'https://nadaunse.com/',
                  'Sec-Fetch-Dest': 'empty',
                  'Sec-Fetch-Mode': 'cors',
                  'Sec-Fetch-Site': 'cross-site',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                },
              })

              if (!sajuResponse.ok) throw new Error(`HTTP ${sajuResponse.status}`)

              const rawText = await sajuResponse.text()
              cachedSajuData = JSON.parse(rawText)

              if (cachedSajuData && Object.keys(cachedSajuData).length > 0) {
                console.log('✅ 사주 API 성공 (키:', Object.keys(cachedSajuData).length, ')')
                break
              }
              throw new Error('빈 데이터')
            } catch (e) {
              console.error(`❌ 사주 API 시도 ${attempt}/3 실패:`, e)
              if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
            }
          }

          if (cachedSajuData && Object.keys(cachedSajuData).length > 0) {
            detailedSajuInfo = `\n\n### 상세 사주 데이터 (명리학 분석용)\n${JSON.stringify(cachedSajuData, null, 2)}`
          }
        }
      } catch (e) {
        console.error('❌ 사주 API 처리 오류:', e)
      }
    }

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
      sajuInfo: sajuInfo + customQuestionText,
      detailedSajuInfo,
      tags,
      situationText,
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
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
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
      spectrum: { category: string; position: number; label: string; summary: string }
      debate: { optimist: string; realist: string; pessimist: string; conclusion: string }
    }

    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/) || rawContent.match(/(\{[\s\S]*\})/)
      if (!jsonMatch) throw new Error('JSON 블록 없음')
      result = JSON.parse(jsonMatch[1].trim())

      // 스펙트럼 위치 클램핑
      result.spectrum.position = Math.min(1, Math.max(0, result.spectrum.position))
      result.spectrum.category = category

      // edges가 없으면 빈 배열로
      if (!result.ontology.edges) result.ontology.edges = []

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
          saju_record_id: saju?.id || null,
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
