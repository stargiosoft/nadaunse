// 사주 지식 맵: 질문 유형별 선별 전달 + 관계 맥락 주입
// 참고: src/docs/develop/통합 사주 api/SAJU_API_PAID_OPTIMIZATION.md (v2)

// ─── 타입 정의 ───

export type CategoryMain =
  | '개인운세' | '연애' | '이별' | '궁합' | '재물' | '직업'
  | '시험/학업' | '건강' | '인간관계' | '자녀' | '이사/매매' | '기타'

// ─── 1. 질문 유형 자동 분류 ───

const QUESTION_TYPE_KEYWORDS: Record<CategoryMain, string[]> = {
  개인운세: ['올해', '운세', '총운', '신년', '하반기', '내년', '전반적', '평생', '타고난', '성격', '장점', '단점', '잠재력', '개운', '행운'],
  연애: ['연애', '결혼', '짝', '인연', '소개팅', '썸', '배우자', '사랑', '이성', '남친', '여친', '짝사랑', '매력', '불륜'],
  이별: ['이별', '헤어', '재회', '돌아올', '미련', '극복', '잊는', '다시 만날'],
  궁합: ['궁합', '잘 맞', '상성', '케미', '어울리', '바람기', '신뢰', '관계 발전'],
  재물: ['돈', '재물', '투자', '재테크', '수입', '월급', '부업', '주식', '매출', '복권', '횡재', '빚', '지출'],
  직업: ['직장', '이직', '취업', '승진', '퇴사', '회사', '커리어', '면접', '진로', '업무', '상사', '동료', '사업', '창업', '적성'],
  '시험/학업': ['시험', '공부', '합격', '자격증', '대학', '학업', '수능', '편입', '고시'],
  건강: ['건강', '몸', '병', '수술', '체력', '스트레스', '멘탈', '다이어트', '운동', '사고', '질병', '미용'],
  인간관계: ['친구', '교우', '인간관계', '사회', '평판', '귀인', '악연', '왕따', '갈등', '화해'],
  자녀: ['자녀', '자식', '아들', '딸', '아이', '양육', '교육', '태교', '출산', '임신'],
  '이사/매매': ['이사', '매매', '부동산', '집', '이동', '해외', '유학', '이민'],
  기타: ['고민', '궁금', '질문']
}

export function classifyQuestionType(categoryMain: string | null, questionText: string): CategoryMain {
  // 1차: categoryMain이 유효한 카테고리면 바로 사용
  const validCategories: CategoryMain[] = [
    '개인운세', '연애', '이별', '궁합', '재물', '직업',
    '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'
  ]
  if (categoryMain && validCategories.includes(categoryMain as CategoryMain) && categoryMain !== '기타') {
    return categoryMain as CategoryMain
  }

  // 2차: 질문 텍스트 키워드 매칭
  let bestMatch: CategoryMain = '개인운세'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(QUESTION_TYPE_KEYWORDS)) {
    if (category === '기타') continue
    const score = keywords.filter(kw => questionText.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = category as CategoryMain
    }
  }

  return bestMatch
}

// ─── 2. 필드 선별 매핑 ───

type FieldRelevance = '●' | '○' | '-'

// 카테고리별 선택 필드 매핑 (● = 필수, ○ = 선택, - = 제외)
const CATEGORY_FIELD_MAP: Record<string, Record<CategoryMain, FieldRelevance>> = {
  '일주론.총평':          { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'○', 재물:'○', 직업:'○', '시험/학업':'○', 건강:'○', 인간관계:'○', 자녀:'○', '이사/매매':'-', 기타:'●' },
  '일주론.연애성향':      { 개인운세:'○', 연애:'●', 이별:'●', 궁합:'●', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'○', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '일주론.추천직업':      { 개인운세:'○', 연애:'-', 이별:'-', 궁합:'-', 재물:'●', 직업:'●', '시험/학업':'○', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '관계분석':             { 개인운세:'-', 연애:'●', 이별:'●', 궁합:'●', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'●', 자녀:'●', '이사/매매':'-', 기타:'-' },
  '대운':                 { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'-', 재물:'●', 직업:'●', '시험/학업':'○', 건강:'○', 인간관계:'-', 자녀:'-', '이사/매매':'●', 기타:'○' },
  '세운.올해':            { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'-', 재물:'●', 직업:'●', '시험/학업':'●', 건강:'○', 인간관계:'-', 자녀:'-', '이사/매매':'●', 기타:'○' },
  '세운.내년':            { 개인운세:'○', 연애:'-', 이별:'-', 궁합:'-', 재물:'○', 직업:'○', '시험/학업':'○', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'○', 기타:'-' },
  '격용신':               { 개인운세:'○', 연애:'○', 이별:'-', 궁합:'-', 재물:'○', 직업:'●', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '사주귀천':             { 개인운세:'○', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '12신살':               { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'●', 인간관계:'-', 자녀:'-', '이사/매매':'○', 기타:'-' },
  '기타신살':             { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'○', 인간관계:'-', 자녀:'-', '이사/매매':'○', 기타:'-' },
  '오늘의연애운':         { 개인운세:'-', 연애:'●', 이별:'○', 궁합:'●', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '오늘의재물운':         { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'●', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'●', 기타:'-' },
  '오늘의직장운':         { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'●', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '오주':                 { 개인운세:'●', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'●', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '본사주핵심':           { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'○', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'○', 인간관계:'○', 자녀:'-', '이사/매매':'-', 기타:'○' },
}

function shouldIncludeField(fieldKey: string, category: CategoryMain): boolean {
  const map = CATEGORY_FIELD_MAP[fieldKey]
  if (!map) return false
  return map[category] === '●' || map[category] === '○'
}

// ─── 3. 오행 관계 맥락 ───

const OHAENG_SANGSAENG: Record<string, string> = {
  '木→火': '목생화: 나무가 불을 키운다. 성장→표현/열정',
  '火→土': '화생토: 불이 흙을 만든다. 열정→안정/축적',
  '土→金': '토생금: 흙에서 금이 나온다. 안정→결실/성과',
  '金→水': '금생수: 금속에서 물이 맺힌다. 성과→지혜/유연함',
  '水→木': '수생목: 물이 나무를 키운다. 지혜→성장/발전',
}

const OHAENG_SANGGEUK: Record<string, string> = {
  '木→土': '목극토: 나무가 흙의 양분을 빼앗는다. 성장이 안정을 흔듦',
  '土→水': '토극수: 흙이 물을 막는다. 고집이 유연함을 막음',
  '水→火': '수극화: 물이 불을 끈다. 냉정함이 열정을 식힘',
  '火→金': '화극금: 불이 금속을 녹인다. 감정이 이성을 압도',
  '金→木': '금극목: 금속이 나무를 벤다. 규율이 자유를 제한',
}

const OHAENG_ORDER = ['木', '火', '土', '金', '水'] as const

function buildOhaengContext(baldalohaeng: Record<string, number>): string {
  const lines: string[] = []

  // 오행 균형 수치
  const ohaengLine = OHAENG_ORDER
    .map(oh => `${oh}: ${baldalohaeng[oh] ?? 0}%${(baldalohaeng[oh] ?? 0) >= 35 ? '(강)' : (baldalohaeng[oh] ?? 0) <= 5 ? '(약)' : ''}`)
    .join(' | ')
  lines.push(`- 오행 균형: ${ohaengLine}`)

  // 가장 강한/약한 오행
  const sorted = OHAENG_ORDER.slice().sort((a, b) => (baldalohaeng[b] ?? 0) - (baldalohaeng[a] ?? 0))
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]

  if ((baldalohaeng[weakest] ?? 0) <= 5) {
    lines.push(`- 핵심: ${weakest}가 매우 부족 → 보강 필요`)
  }

  // 주요 상생/상극 관계 (강한 오행 → 약한 오행 중심으로 2-3개)
  const significantRelations: string[] = []
  for (const oh of sorted.slice(0, 2)) {
    for (const target of sorted.slice(-2)) {
      const key = `${oh}→${target}`
      if (OHAENG_SANGSAENG[key]) significantRelations.push(OHAENG_SANGSAENG[key])
      if (OHAENG_SANGGEUK[key]) significantRelations.push(OHAENG_SANGGEUK[key])
    }
  }
  if (significantRelations.length > 0) {
    lines.push('- 주요 오행 관계:')
    for (const rel of significantRelations.slice(0, 3)) {
      lines.push(`  - ${rel}`)
    }
  }

  return lines.join('\n')
}

// ─── 4. 십성 해석 맥락 ───

const SIPSUNG_CONTEXT: Record<CategoryMain, { 핵심: string[]; 해석: string }> = {
  개인운세: { 핵심: ['비견', '식신', '정관', '정인'], 해석: '전체 십성 균형을 본다. 가장 강한 십성이 타고난 성향, 가장 약한 십성이 보완 포인트' },
  연애: { 핵심: ['정관', '편관', '정재', '편재'], 해석: '여성: 관성=남자, 남성: 재성=여자. 관성/재성의 강약이 이성운의 핵심' },
  이별: { 핵심: ['상관', '편관', '겁재'], 해석: '상관=관성을 극함(관계 파괴), 겁재=경쟁자 출현. 상관 강하면 이별 가능성↑' },
  궁합: { 핵심: ['정관', '편관', '정재', '편재', '비견'], 해석: '두 사람의 일간 오행 관계가 핵심. 상생이면 자연스러운 궁합, 상극이면 갈등' },
  재물: { 핵심: ['정재', '편재', '식신', '상관'], 해석: '재성=재물 에너지, 식상=재물 생산 능력. 식상→재성 흐름이 돈 버는 구조' },
  직업: { 핵심: ['정관', '편관', '정인', '편인', '식신'], 해석: '관성=직장/조직, 인성=자격/학력, 식상=자유업. 관성 강→조직형, 식상 강→독립형' },
  '시험/학업': { 핵심: ['정인', '편인', '식신'], 해석: '인성=학습능력/집중력, 식신=이해력. 정인 강→정규 학업, 편인 강→특수 분야' },
  건강: { 핵심: ['비견', '겁재'], 해석: '비겁=체력. 부족 오행이 건강 취약점. 木=간/눈, 火=심장, 土=위장, 金=폐/피부, 水=신장' },
  인간관계: { 핵심: ['비견', '겁재', '정관', '식신'], 해석: '비겁=동료/경쟁, 관성=상하 관계, 식상=소통. 비겁 과다→갈등, 식신 강→인기' },
  자녀: { 핵심: ['식신', '상관', '정관', '편관'], 해석: '식상=자녀(여성), 관성=자녀(남성). 식상/관성 상태가 자녀운의 핵심' },
  '이사/매매': { 핵심: ['편재', '정재', '편인'], 해석: '편재=유동 자산, 정재=고정 자산, 편인=이동수. 편인 강→이동 욕구' },
  기타: { 핵심: ['비견', '식신', '정관', '정인'], 해석: '전체 균형 분석' },
}

// 십성 그룹 → 개별 매핑
const SIPSUNG_GROUP_TO_INDIVIDUAL: Record<string, string[]> = {
  '비겁': ['비견', '겁재'],
  '식상': ['식신', '상관'],
  '재성': ['정재', '편재'],
  '관성': ['정관', '편관'],
  '인성': ['정인', '편인'],
}

// 십성 상호작용 (상위 2개 조합)
const SIPSUNG_INTERACTIONS: Record<string, { 의미: string; 조언: string }> = {
  '비견+편관': { 의미: '자기 주장과 외부 압력 충돌', 조언: '타협 능력을 키우면 관성 에너지 활용 가능' },
  '식신+정재': { 의미: '재능이 안정적 수입으로 연결', 조언: '식신의 표현력을 살려 부가 수입 가능' },
  '상관+편관': { 의미: '반항심과 조직 압력이 부딪힘', 조언: '상관 에너지를 창의적 방향으로 전환' },
  '정관+정인': { 의미: '학력/자격과 직장이 연결', 조언: '인성의 학습이 관성(직장)을 지지하는 최적 구조' },
  '편재+겁재': { 의미: '투자 욕구와 과감한 실행력', 조언: '겁재의 과감함을 정재(안정 자산)로 분산' },
  '정재+비견': { 의미: '안정적 재물에 경쟁자 존재', 조언: '공동 투자보다 단독 관리가 유리' },
  '식신+상관': { 의미: '표현력과 창의력이 모두 강함', 조언: '식상 에너지가 과하면 산만 → 방향 집중 필요' },
  '편인+편관': { 의미: '비정통적 방식으로 조직과 관계', 조언: '편인의 직관력으로 편관의 압력 돌파' },
  '정관+정재': { 의미: '안정적 직장과 꾸준한 재물 축적', 조언: '안정 지향이 강해 새 도전에 소극적일 수 있음' },
  '겁재+상관': { 의미: '과감함과 반항심이 결합', 조언: '에너지를 경쟁/스포츠/창업 등 건설적 방향으로' },
}

function buildSipsungContext(
  baldalsipsung: Record<string, number>,
  sipsungArray: string[][],
  category: CategoryMain
): string {
  const lines: string[] = []
  const ctx = SIPSUNG_CONTEXT[category]

  // 카테고리별 핵심 십성 분석
  lines.push(`- 이 질문의 핵심 십성: ${ctx.핵심.join(', ')}`)
  lines.push(`- 해석 기준: ${ctx.해석}`)

  // 발달십성 수치 (5그룹)
  const groupEntries = Object.entries(baldalsipsung).sort(([, a], [, b]) => b - a)
  const groupLine = groupEntries.map(([g, v]) => `${g}: ${v}%`).join(', ')
  lines.push(`- 발달십성(5그룹): ${groupLine}`)

  // 카테고리 관련 그룹 수치 강조
  for (const [group, individuals] of Object.entries(SIPSUNG_GROUP_TO_INDIVIDUAL)) {
    const relevant = individuals.filter(ind => ctx.핵심.includes(ind))
    if (relevant.length > 0) {
      const groupVal = baldalsipsung[group] ?? 0
      const label = groupVal >= 35 ? '강' : groupVal <= 5 ? '약' : '보통'
      lines.push(`  → ${group}(${relevant.join('/')}): ${groupVal}% (${label})`)
    }
  }

  // 상위 2개 그룹으로 상호작용 매핑
  if (groupEntries.length >= 2) {
    const top2Groups = groupEntries.slice(0, 2).map(([g]) => g)

    // 그룹 → 개별 십성 중 가장 빈도 높은 것 추출
    const sipsungFlat = sipsungArray.flat()
    const top2Individuals = top2Groups.map(group => {
      const individuals = SIPSUNG_GROUP_TO_INDIVIDUAL[group] || []
      let best = individuals[0] || group
      let bestCount = 0
      for (const ind of individuals) {
        const count = sipsungFlat.filter(s => s === ind).length
        if (count > bestCount) {
          bestCount = count
          best = ind
        }
      }
      return best
    })

    // 순서 무관 매칭
    const key1 = `${top2Individuals[0]}+${top2Individuals[1]}`
    const key2 = `${top2Individuals[1]}+${top2Individuals[0]}`
    const interaction = SIPSUNG_INTERACTIONS[key1] || SIPSUNG_INTERACTIONS[key2]

    if (interaction) {
      lines.push(`- 십성 상호작용 (${key1}): ${interaction.의미}`)
      lines.push(`  → 조언: ${interaction.조언}`)
    }
  }

  return lines.join('\n')
}

// ─── 5. 월별 질문 감지 ───

function detectMonthQuery(questionText: string): number | null {
  // "이번 달", "3월", "다음 달" 등 감지
  const monthMatch = questionText.match(/(\d{1,2})월/)
  if (monthMatch) return parseInt(monthMatch[1])

  if (questionText.includes('이번 달') || questionText.includes('이번달')) {
    return new Date().getMonth() + 1
  }
  if (questionText.includes('다음 달') || questionText.includes('다음달')) {
    return (new Date().getMonth() + 2) > 12 ? 1 : new Date().getMonth() + 2
  }
  return null
}

// ─── 6. 메인: 최적화 프롬프트 빌더 ───

export function buildOptimizedSajuPrompt(
  sajuData: Record<string, unknown>,
  categoryMain: string | null,
  questionText: string
): string {
  const category = classifyQuestionType(categoryMain, questionText)
  const sections: string[] = []

  // --- 사주 기본 구성 (항상 포함) ---
  const saju = sajuData['사주'] as string[] | undefined
  const ohaeng = sajuData['오행'] as string[] | undefined
  const gyeokgubun = sajuData['격구분'] as string | undefined
  const sajugangak = sajuData['사주강약'] as string | undefined
  const yongsin = sajuData['용신'] as Record<string, unknown> | undefined
  const yongsinOhaeng = sajuData['용신오행'] as Record<string, unknown> | undefined
  const gender = sajuData['성별'] as string | undefined

  sections.push('### 사주 기본 구성')
  if (saju) sections.push(`- 사주: ${saju.join(', ')}`)
  if (ohaeng) sections.push(`- 오행: ${ohaeng.join(', ')}`)
  if (gyeokgubun) sections.push(`- 격국: ${gyeokgubun}`)
  if (sajugangak) sections.push(`- 사주강약: ${sajugangak}`)
  if (gender) sections.push(`- 성별: ${gender}`)
  if (yongsin) {
    const ys = yongsin as Record<string, string[]>
    sections.push(`- 용신: 용신=${(ys['용신'] || []).join(',')}, 희신=${(ys['희신'] || []).join(',')}, 기신=${(ys['기신'] || []).join(',')}`)
  }
  if (yongsinOhaeng) {
    const yso = yongsinOhaeng as Record<string, string[]>
    sections.push(`- 용신오행: 용신=${(yso['용신'] || []).join(',')}, 희신=${(yso['희신'] || []).join(',')}, 기신=${(yso['기신'] || []).join(',')}`)
  }

  // --- 오행 균형 ---
  const baldalohaeng = sajuData['발달오행'] as Record<string, number> | undefined
  if (baldalohaeng) {
    sections.push('')
    sections.push('### 오행 균형')
    sections.push(buildOhaengContext(baldalohaeng))
  }

  // --- 십성 분석 ---
  const baldalsipsung = sajuData['발달십성'] as Record<string, number> | undefined
  const sipsungArray = sajuData['십성'] as string[][] | undefined
  if (baldalsipsung && sipsungArray) {
    sections.push('')
    sections.push(`### 이 질문의 핵심 십성 분석 (카테고리: ${category})`)
    sections.push(buildSipsungContext(baldalsipsung, sipsungArray, category))
  }

  // --- 물상론 (항상 포함) ---
  const mulsangron = sajuData['물상론'] as Record<string, string> | undefined
  if (mulsangron) {
    sections.push('')
    sections.push('### 물상론')
    if (mulsangron['닉네임']) sections.push(`- 닉네임: "${mulsangron['닉네임']}"`)
    if (mulsangron['성격']) sections.push(`- 성격: ${mulsangron['성격']}`)
    if (mulsangron['인간관계']) sections.push(`- 인간관계: ${mulsangron['인간관계']}`)
  }

  // --- 본사주 핵심 이벤트 (카테고리별 선별) ---
  if (shouldIncludeField('본사주핵심', category)) {
    const bonsaju = sajuData['본사주'] as Record<string, string> | undefined
    if (bonsaju) {
      const events: string[] = []
      if (bonsaju['충']) events.push(`충: ${bonsaju['충']}`)
      if (bonsaju['원진']) events.push(`원진: ${bonsaju['원진']}`)
      if (bonsaju['형']) events.push(`형: ${bonsaju['형']}`)
      if (bonsaju['천을귀인']) events.push(`천을귀인: ${bonsaju['천을귀인']}`)
      if (events.length > 0) {
        sections.push('')
        sections.push('### 본사주 핵심 이벤트')
        for (const e of events) sections.push(`- ${e}`)
      }
    }
  }

  // --- 일주론 (카테고리별 선별) ---
  const iljuron = sajuData['일주론'] as Record<string, string> | undefined
  if (iljuron) {
    const iljuParts: string[] = []
    if (shouldIncludeField('일주론.총평', category) && iljuron['총평']) {
      iljuParts.push(`- 총평: ${iljuron['총평']}`)
    }
    if (shouldIncludeField('일주론.연애성향', category) && iljuron['연애성향']) {
      iljuParts.push(`- 연애성향: ${iljuron['연애성향']}`)
    }
    if (shouldIncludeField('일주론.추천직업', category) && iljuron['추천직업']) {
      iljuParts.push(`- 추천직업: ${iljuron['추천직업']}`)
    }
    if (iljuParts.length > 0) {
      sections.push('')
      sections.push('### 일주론')
      sections.push(...iljuParts)
    }
  }

  // --- 관계분석 (카테고리별 선별) ---
  if (shouldIncludeField('관계분석', category)) {
    const gwangye = sajuData['관계분석'] as Record<string, unknown> | undefined
    if (gwangye) {
      sections.push('')
      sections.push('### 관계분석')
      if (gwangye['이상형']) sections.push(`- 이상형: ${gwangye['이상형']}`)
      if (gwangye['연인시기']) sections.push(`- 연인시기: ${JSON.stringify(gwangye['연인시기'])}`)
      if (gwangye['조심시기']) sections.push(`- 조심시기: ${JSON.stringify(gwangye['조심시기'])}`)
    }
  }

  // --- 대운 (카테고리별 선별) ---
  if (shouldIncludeField('대운', category)) {
    const daeun = sajuData['대운'] as Record<string, unknown> | undefined
    if (daeun) {
      const current = daeun['현재'] as Record<string, unknown> | undefined
      if (current) {
        sections.push('')
        sections.push('### 현재 대운')
        if (current['간지']) sections.push(`- 간지: ${current['간지']}`)
        if (current['총평']) sections.push(`- 총평: ${current['총평']}`)
        // 핵심 이벤트만 포함 (빈 문자열 제외)
        for (const key of ['충', '원진', '형', '천을귀인', '천간합']) {
          const val = current[key] as string
          if (val) sections.push(`- ${key}: ${val}`)
        }
      }
    }
  }

  // --- 세운 (카테고리별 선별, 동적 연도 키) ---
  const seun = sajuData['세운'] as Record<string, unknown> | undefined
  if (seun) {
    const currentYear = String(new Date().getFullYear())
    const nextYear = String(Number(currentYear) + 1)

    if (shouldIncludeField('세운.올해', category)) {
      const thisYearData = seun[currentYear] as Record<string, unknown> | undefined
      if (thisYearData) {
        sections.push('')
        sections.push(`### ${currentYear}년 세운 (올해)`)
        if (thisYearData['간지']) sections.push(`- 간지: ${thisYearData['간지']}`)
        if (thisYearData['총평']) sections.push(`- 총평: ${thisYearData['총평']}`)
        // 핵심 이벤트 (빈 문자열 제외)
        for (const key of ['충', '원진', '천을귀인', '12신살']) {
          const val = thisYearData[key] as string
          if (val) sections.push(`- ${key}: ${val}`)
        }
        // 운세점수
        const scores = thisYearData['운세점수'] as Record<string, number> | undefined
        if (scores) {
          sections.push(`- 운세점수: 직장운 ${scores['직장운']}, 재물운 ${scores['재물운']}, 대인관계운 ${scores['대인관계운']}, 연애운 ${scores['연애운']}`)
        }

        // 월별 데이터 (월별 질문 감지 시)
        const targetMonth = detectMonthQuery(questionText)
        if (targetMonth) {
          const monthStr = String(targetMonth)
          const monthGanji = (thisYearData['월별간지'] as Record<string, string>)?.[monthStr]
          const monthSipsung = (thisYearData['월별십성'] as Record<string, string[]>)?.[monthStr]
          if (monthGanji || monthSipsung) {
            sections.push(`- ${targetMonth}월 간지: ${monthGanji || '정보 없음'}`)
            sections.push(`- ${targetMonth}월 십성: ${monthSipsung ? monthSipsung.join(', ') : '정보 없음'}`)
          }
        }
      }
    }

    if (shouldIncludeField('세운.내년', category)) {
      const nextYearData = seun[nextYear] as Record<string, unknown> | undefined
      if (nextYearData) {
        sections.push('')
        sections.push(`### ${nextYear}년 세운 (내년)`)
        if (nextYearData['간지']) sections.push(`- 간지: ${nextYearData['간지']}`)
        if (nextYearData['총평']) sections.push(`- 총평: ${nextYearData['총평']}`)
        const scores = nextYearData['운세점수'] as Record<string, number> | undefined
        if (scores) {
          sections.push(`- 운세점수: 직장운 ${scores['직장운']}, 재물운 ${scores['재물운']}, 대인관계운 ${scores['대인관계운']}, 연애운 ${scores['연애운']}`)
        }
      }
    }
  }

  // --- 격용신 (카테고리별 선별) ---
  if (shouldIncludeField('격용신', category)) {
    const gyeogyongsin = sajuData['격용신'] as string[][] | undefined
    if (gyeogyongsin) {
      sections.push('')
      sections.push('### 격용신')
      sections.push(`- 용신: ${(gyeogyongsin[0] || []).join(', ')}`)
      sections.push(`- 희신: ${(gyeogyongsin[1] || []).join(', ')}`)
      sections.push(`- 기신: ${(gyeogyongsin[2] || []).join(', ')}`)
    }
  }

  // --- 사주귀천 (카테고리별 선별) ---
  if (shouldIncludeField('사주귀천', category)) {
    const gwicheon = sajuData['사주귀천'] as Record<string, string> | undefined
    if (gwicheon) {
      sections.push('')
      sections.push('### 사주귀천')
      if (gwicheon['용어']) sections.push(`- 용어: ${gwicheon['용어']}`)
      if (gwicheon['해설']) sections.push(`- 해설: ${gwicheon['해설']}`)
    }
  }

  // --- 오주 (카테고리별 선별) ---
  if (shouldIncludeField('오주', category)) {
    const oju = sajuData['오주'] as string[] | undefined
    const ojuOhaeng = sajuData['오주오행'] as string[] | undefined
    const ojuSipsung = sajuData['오주십성'] as string[][] | undefined
    if (oju || ojuOhaeng || ojuSipsung) {
      sections.push('')
      sections.push('### 오주 (확장)')
      if (oju) sections.push(`- 오주: ${oju.join(', ')}`)
      if (ojuOhaeng) sections.push(`- 오주오행: ${ojuOhaeng.join(', ')}`)
      if (ojuSipsung) sections.push(`- 오주십성: ${ojuSipsung.map(s => s.join('/')).join(', ')}`)
    }
  }

  // --- 12신살/기타신살 (카테고리별 선별) ---
  if (shouldIncludeField('12신살', category)) {
    const sinsal12 = sajuData['12신살']
    if (sinsal12) {
      sections.push('')
      sections.push('### 12신살')
      sections.push(`- ${JSON.stringify(sinsal12)}`)
    }
  }
  if (shouldIncludeField('기타신살', category)) {
    const gitaSinsal = sajuData['기타신살']
    if (gitaSinsal) {
      sections.push('')
      sections.push('### 기타신살')
      sections.push(`- ${JSON.stringify(gitaSinsal)}`)
    }
  }

  // --- 오늘의 운세 (카테고리별 선별) ---
  const todayFields = [
    { key: '오늘의연애운', field: '오늘의연애운' },
    { key: '오늘의재물운', field: '오늘의재물운' },
    { key: '오늘의직장운', field: '오늘의직장운' },
  ]
  const todayParts: string[] = []
  for (const { key, field } of todayFields) {
    if (shouldIncludeField(key, category) && sajuData[field]) {
      todayParts.push(`- ${field}: ${sajuData[field]}`)
    }
  }
  if (todayParts.length > 0) {
    sections.push('')
    sections.push('### 오늘의 운세')
    sections.push(...todayParts)
  }

  // 조립
  const header = `## 이 질문에 핵심적인 사주 분석 (카테고리: ${category})\n`
  return header + sections.join('\n')
}
