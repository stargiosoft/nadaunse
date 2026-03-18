// 드라이런 테스트: sajuKnowledgeMap의 buildOptimizedSajuPrompt를 DUMMY_SAJU_DATA로 실행
// Node.js ESM으로 실행: node test-saju-knowledge-map.mjs

// ─── DUMMY DATA (generate-saju-preview에서 복사) ───
const DUMMY_SAJU_DATA = {
  "성별": "여자",
  "나이": 23,
  "만나이": 22,
  "양력": [2003, 2, 18, 15, 38],
  "음력": [2003, 1, 18, 15, 38, "평달"],
  "사주": ["戊申", "壬戌", "甲寅", "癸未"],
  "오행": ["土金", "水土", "木木", "水土"],
  "십성": [["편관", "편인"], ["비견", "편관"], ["식신", "식신"], ["겁재", "정관"]],
  "발달오행": { "木": 41, "火": 0, "土": 40, "金": 15, "水": 4 },
  "발달십성": { "식상": 41, "재성": 0, "관성": 40, "비겁": 4, "인성": 15 },
  "12신살": [["겁살"], ["천살"], ["망신살"], ["화개살"]],
  "기타신살": [
    ["태극귀인", "관귀학관", "문곡귀인", "학당귀인", "효신살", "칠살", "현침살"],
    ["재고귀인", "괴강살", "백호대살", "낙정관살", "양착살"],
    ["천주귀인", "천복귀인", "문창귀인", "암록", "현침살", "귀문관살"],
    ["현침살", "귀문관살"]
  ],
  "격구분": "제살태과격",
  "격용신": [["인성"], ["비겁"], ["관성", "식상", "재성"]],
  "용신": { "용신": ["인성"], "희신": ["비겁"], "기신": ["관성", "식상", "재성"] },
  "용신오행": { "용신": ["금"], "희신": ["수"], "기신": ["토", "목", "화"] },
  "물상론": {
    "닉네임": "초봄의 숲을 흐르는 강",
    "성격": "고요하지만 안에서 끊임없이 생명을 키우는 이른 봄의 대지. 부드럽고 곰살맞으나 자기 원칙을 놓치지 않는 푸른 새싹.",
    "인간관계": "따뜻한 관심으로 조용히 곁을 지키는 봄바람 같은 존재."
  },
  "사주귀천": {
    "용어": "천진지양(天津之洋)",
    "해설": "잔잔히 흐르는 강물에 이슬비가 내리며 세상에 생기를 주는 모습이다."
  },
  "사주강약": "신약",
  "격용신오행": [["금"], ["수"], ["토", "목", "화"]],
  "일주론": {
    "총평": "임술 일주는 책임감이 강하고 강인한 성정으로 남에게 굴복당하지 않고 끈질기고 인내심이 강하다.",
    "연애성향": "'식상'이 발달해 재능이 많고, 유연하며 언변이 좋다.",
    "추천직업": "군인, 판검사, 경찰, 심리상담, 연구 개발, 금융, 무역, 의료 행정, 의술"
  },
  "대운순서": ["乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥", "甲子", "乙丑", "丙寅"],
  "용신설명": "운의 굴곡이 많이 나타나는 구조의 사주이다. (매우 긴 텍스트 생략...)",
  "본사주": {
    "천간합": "", "타간합": "", "진술축미": "", "삼합": "", "방합": "",
    "인사신축술미": "", "육합": "", "반합": "", "형": "", "충": "", "원진": "",
    "백호살": "辰, 未, 丑년에 건강이상과 재물의 손실이 있고...",
    "괴강살": "사주 내에 임술괴강이 있거나...",
    "양인살": "",
    "귀문관살": "인미귀문관살(寅未鬼門關煞)이 있으니...",
    "현침살": "", "천을귀인": "", "정록": ""
  },
  "대운": {
    "현재": {
      "간지": "丙辰",
      "총평": "타인들에게 비추어지는 브랜드, 명성, 이미지 관리에 유의해야 하는 흐름의 시기입니다.",
      "천간합": "", "타간합": "", "진술축미": "", "삼합": "", "방합": "",
      "인사신축술미": "", "육합": "", "형": "", "충": "", "원진": "",
      "귀문살": "", "천을귀인": "",
      "대운기간나이": [14, 23]
    },
    "다음": {
      "간지": "丁巳",
      "총평": "금전적인 운이 찾아오고 있습니다만, 거저 주어지지는 않습니다.",
      "천간합": "재물을 늘릴 수 있는 기회가 왔으니...",
      "대운기간나이": [24, 33]
    }
  },
  "세운": {
    "2025": {
      "간지": "乙巳",
      "총평": "평소와 달리 아래사람들로부터 반항을 느끼고 있어 대인관계에서 스트레스를 받을 수 있습니다.",
      "충": "", "원진": "사술귀문, 원진의 작용으로 불안과 초조함이 증가하고...",
      "천을귀인": "재물 귀인이 들어오면서 금전운이 상승합니다.",
      "12신살": "역마살",
      "월별간지": { "1": "丁丑", "2": "戊寅", "3": "己卯", "4": "庚辰", "5": "辛巳", "6": "壬午", "7": "癸未", "8": "甲申", "9": "乙酉", "10": "丙戌", "11": "丁亥", "12": "戊子" },
      "월별십성": { "1": ["정재", "정관"], "2": ["편관", "식신"], "3": ["정관", "상관"], "4": ["편인", "편관"], "5": ["정인", "편재"], "6": ["비견", "정재"], "7": ["겁재", "정관"], "8": ["식신", "편인"], "9": ["상관", "정인"], "10": ["편재", "편관"], "11": ["정재", "비견"], "12": ["편관", "겁재"] },
      "운세점수": { "직장운": 92, "재물운": 100, "대인관계운": 92, "연애운": 88 }
    },
    "2026": {
      "간지": "丙午",
      "총평": "금융 거래는 안전한 금융 기관을 통해서만 하시는 것이 좋겠습니다.",
      "충": "", "원진": "",
      "천을귀인": "",
      "12신살": "육해살",
      "월별간지": { "1": "己丑", "2": "庚寅", "3": "辛卯", "4": "壬辰", "5": "癸巳", "6": "甲午", "7": "乙未", "8": "丙申", "9": "丁酉", "10": "戊戌", "11": "己亥", "12": "庚子" },
      "월별십성": { "1": ["정관", "정관"], "2": ["편인", "식신"], "3": ["정인", "상관"], "4": ["비견", "편관"], "5": ["겁재", "편재"], "6": ["식신", "정재"], "7": ["상관", "정관"], "8": ["편재", "편인"], "9": ["정재", "정인"], "10": ["편관", "편관"], "11": ["정관", "비견"], "12": ["편인", "겁재"] },
      "운세점수": { "직장운": 80, "재물운": 100, "대인관계운": 88, "연애운": 96 }
    },
    "2027": {
      "간지": "丁未",
      "총평": "돈이 여기저기 빠져나가고 회수는 어렵기 때문에...",
      "충": "", "원진": "인미귀문의 영향으로 인해 반항적인 감정이 커질 수 있습니다.",
      "천을귀인": "",
      "12신살": "화개살",
      "월별간지": { "1": "辛丑", "2": "壬寅", "3": "癸卯" },
      "월별십성": { "1": ["정인", "정관"], "2": ["비견", "식신"], "3": ["겁재", "상관"] },
      "운세점수": { "직장운": 68, "재물운": 96, "대인관계운": 60, "연애운": 93 }
    }
  },
  "관계분석": {
    "이상형": "요즘 시대 최고의 리더가 있다면 바로 당신입니다.",
    "연인시기": [[2025, 12], [2026, 3], [2026, 9], [2026, 10]],
    "조심시기": [[2026, 4], [2027, 2], [2027, 3]],
    "조심시기연도": []
  },
  "오늘의운세": "오늘은 새로운 시작이 좋은 날입니다.",
  "오늘의직장운": "업무에서 인정받을 수 있는 기회가 옵니다.",
  "오늘의재물운": "예상치 못한 수입이 발생할 수 있습니다.",
  "오늘의대인관계운": "주변 사람들과의 관계가 돈독해집니다.",
  "오늘의연애운": "새로운 인연을 만날 가능성이 높습니다.",
  "오주": ["壬申", "戊申", "壬戌", "甲寅", "癸未"],
  "오주오행": ["水金", "土金", "水土", "木木", "水土"],
  "오주십성": [["비견", "편인"], ["편관", "편인"], ["비견", "편관"], ["식신", "식신"], ["겁재", "정관"]]
}

// ─── sajuKnowledgeMap.ts 핵심 로직 복사 (Node.js ESM용) ───

const QUESTION_TYPE_KEYWORDS = {
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

function classifyQuestionType(categoryMain, questionText) {
  const validCategories = [
    '개인운세', '연애', '이별', '궁합', '재물', '직업',
    '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'
  ]
  if (categoryMain && validCategories.includes(categoryMain) && categoryMain !== '기타') {
    return categoryMain
  }
  let bestMatch = '개인운세'
  let bestScore = 0
  for (const [category, keywords] of Object.entries(QUESTION_TYPE_KEYWORDS)) {
    if (category === '기타') continue
    const score = keywords.filter(kw => questionText.includes(kw)).length
    if (score > bestScore) { bestScore = score; bestMatch = category }
  }
  return bestMatch
}

const CATEGORY_FIELD_MAP = {
  '일주론.총평':     { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'○', 재물:'○', 직업:'○', '시험/학업':'○', 건강:'○', 인간관계:'○', 자녀:'○', '이사/매매':'-', 기타:'●' },
  '일주론.연애성향': { 개인운세:'○', 연애:'●', 이별:'●', 궁합:'●', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'○', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '일주론.추천직업': { 개인운세:'○', 연애:'-', 이별:'-', 궁합:'-', 재물:'●', 직업:'●', '시험/학업':'○', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '관계분석':        { 개인운세:'-', 연애:'●', 이별:'●', 궁합:'●', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'●', 자녀:'●', '이사/매매':'-', 기타:'-' },
  '대운':            { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'-', 재물:'●', 직업:'●', '시험/학업':'○', 건강:'○', 인간관계:'-', 자녀:'-', '이사/매매':'●', 기타:'○' },
  '세운.올해':       { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'-', 재물:'●', 직업:'●', '시험/학업':'●', 건강:'○', 인간관계:'-', 자녀:'-', '이사/매매':'●', 기타:'○' },
  '세운.내년':       { 개인운세:'○', 연애:'-', 이별:'-', 궁합:'-', 재물:'○', 직업:'○', '시험/학업':'○', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'○', 기타:'-' },
  '격용신':          { 개인운세:'○', 연애:'○', 이별:'-', 궁합:'-', 재물:'○', 직업:'●', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '사주귀천':        { 개인운세:'○', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '12신살':          { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'●', 인간관계:'-', 자녀:'-', '이사/매매':'○', 기타:'-' },
  '기타신살':        { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'○', 인간관계:'-', 자녀:'-', '이사/매매':'○', 기타:'-' },
  '오늘의연애운':    { 개인운세:'-', 연애:'●', 이별:'○', 궁합:'●', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '오늘의재물운':    { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'●', 직업:'-', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'●', 기타:'-' },
  '오늘의직장운':    { 개인운세:'-', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'●', '시험/학업':'-', 건강:'-', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '오주':            { 개인운세:'●', 연애:'-', 이별:'-', 궁합:'-', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'●', 인간관계:'-', 자녀:'-', '이사/매매':'-', 기타:'-' },
  '본사주핵심':      { 개인운세:'●', 연애:'○', 이별:'○', 궁합:'○', 재물:'-', 직업:'-', '시험/학업':'-', 건강:'○', 인간관계:'○', 자녀:'-', '이사/매매':'-', 기타:'○' },
}

function shouldIncludeField(fieldKey, category) {
  const map = CATEGORY_FIELD_MAP[fieldKey]
  if (!map) return false
  return map[category] === '●' || map[category] === '○'
}

const OHAENG_SANGSAENG = {
  '木→火': '목생화: 나무가 불을 키운다. 성장→표현/열정',
  '火→土': '화생토: 불이 흙을 만든다. 열정→안정/축적',
  '土→金': '토생금: 흙에서 금이 나온다. 안정→결실/성과',
  '金→水': '금생수: 금속에서 물이 맺힌다. 성과→지혜/유연함',
  '水→木': '수생목: 물이 나무를 키운다. 지혜→성장/발전',
}
const OHAENG_SANGGEUK = {
  '木→土': '목극토: 나무가 흙의 양분을 빼앗는다. 성장이 안정을 흔듦',
  '土→水': '토극수: 흙이 물을 막는다. 고집이 유연함을 막음',
  '水→火': '수극화: 물이 불을 끈다. 냉정함이 열정을 식힘',
  '火→金': '화극금: 불이 금속을 녹인다. 감정이 이성을 압도',
  '金→木': '금극목: 금속이 나무를 벤다. 규율이 자유를 제한',
}
const OHAENG_ORDER = ['木', '火', '土', '金', '水']

function buildOhaengContext(baldalohaeng) {
  const lines = []
  const ohaengLine = OHAENG_ORDER
    .map(oh => `${oh}: ${baldalohaeng[oh] ?? 0}%${(baldalohaeng[oh] ?? 0) >= 35 ? '(강)' : (baldalohaeng[oh] ?? 0) <= 5 ? '(약)' : ''}`)
    .join(' | ')
  lines.push(`- 오행 균형: ${ohaengLine}`)
  const sorted = [...OHAENG_ORDER].sort((a, b) => (baldalohaeng[b] ?? 0) - (baldalohaeng[a] ?? 0))
  const weakest = sorted[sorted.length - 1]
  if ((baldalohaeng[weakest] ?? 0) <= 5) lines.push(`- 핵심: ${weakest}가 매우 부족 → 보강 필요`)
  const significantRelations = []
  for (const oh of sorted.slice(0, 2)) {
    for (const target of sorted.slice(-2)) {
      const key = `${oh}→${target}`
      if (OHAENG_SANGSAENG[key]) significantRelations.push(OHAENG_SANGSAENG[key])
      if (OHAENG_SANGGEUK[key]) significantRelations.push(OHAENG_SANGGEUK[key])
    }
  }
  if (significantRelations.length > 0) {
    lines.push('- 주요 오행 관계:')
    for (const rel of significantRelations.slice(0, 3)) lines.push(`  - ${rel}`)
  }
  return lines.join('\n')
}

const SIPSUNG_CONTEXT = {
  개인운세: { 핵심: ['비견', '식신', '정관', '정인'], 해석: '전체 십성 균형을 본다. 가장 강한 십성이 타고난 성향, 가장 약한 십성이 보완 포인트' },
  연애: { 핵심: ['정관', '편관', '정재', '편재'], 해석: '여성: 관성=남자, 남성: 재성=여자. 관성/재성의 강약이 이성운의 핵심' },
  이별: { 핵심: ['상관', '편관', '겁재'], 해석: '상관=관성을 극함, 겁재=경쟁자. 상관 강하면 이별 가능성↑' },
  궁합: { 핵심: ['정관', '편관', '정재', '편재', '비견'], 해석: '두 사람의 일간 오행 관계가 핵심' },
  재물: { 핵심: ['정재', '편재', '식신', '상관'], 해석: '재성=재물, 식상=생산력. 식상→재성 흐름이 돈 버는 구조' },
  직업: { 핵심: ['정관', '편관', '정인', '편인', '식신'], 해석: '관성=직장, 인성=자격, 식상=자유업' },
  '시험/학업': { 핵심: ['정인', '편인', '식신'], 해석: '인성=학습능력, 식신=이해력' },
  건강: { 핵심: ['비견', '겁재'], 해석: '비겁=체력. 부족 오행이 건강 취약점' },
  인간관계: { 핵심: ['비견', '겁재', '정관', '식신'], 해석: '비겁=동료/경쟁, 관성=상하, 식상=소통' },
  자녀: { 핵심: ['식신', '상관', '정관', '편관'], 해석: '식상=자녀(여성), 관성=자녀(남성)' },
  '이사/매매': { 핵심: ['편재', '정재', '편인'], 해석: '편재=유동 자산, 정재=고정 자산, 편인=이동수' },
  기타: { 핵심: ['비견', '식신', '정관', '정인'], 해석: '전체 균형 분석' },
}

const SIPSUNG_GROUP_TO_INDIVIDUAL = {
  '비겁': ['비견', '겁재'], '식상': ['식신', '상관'], '재성': ['정재', '편재'],
  '관성': ['정관', '편관'], '인성': ['정인', '편인'],
}

const SIPSUNG_INTERACTIONS = {
  '비견+편관': { 의미: '자기 주장과 외부 압력 충돌', 조언: '타협 능력을 키우면 관성 에너지 활용 가능' },
  '식신+정재': { 의미: '재능이 안정적 수입으로 연결', 조언: '식신의 표현력을 살려 부가 수입 가능' },
  '상관+편관': { 의미: '반항심과 조직 압력이 부딪힘', 조언: '상관 에너지를 창의적 방향으로 전환' },
  '정관+정인': { 의미: '학력/자격과 직장이 연결', 조언: '인성의 학습이 관성을 지지하는 최적 구조' },
  '편재+겁재': { 의미: '투자 욕구와 과감한 실행력', 조언: '겁재의 과감함을 정재로 분산' },
  '정재+비견': { 의미: '안정적 재물에 경쟁자 존재', 조언: '공동 투자보다 단독 관리가 유리' },
  '식신+상관': { 의미: '표현력과 창의력이 모두 강함', 조언: '식상 에너지가 과하면 산만 → 방향 집중' },
  '편인+편관': { 의미: '비정통적 방식으로 조직과 관계', 조언: '편인의 직관력으로 편관의 압력 돌파' },
  '정관+정재': { 의미: '안정적 직장과 꾸준한 재물', 조언: '안정 지향이 강해 새 도전에 소극적일 수 있음' },
  '겁재+상관': { 의미: '과감함과 반항심이 결합', 조언: '에너지를 건설적 방향으로' },
}

function buildSipsungContext(baldalsipsung, sipsungArray, category) {
  const lines = []
  const ctx = SIPSUNG_CONTEXT[category]
  lines.push(`- 이 질문의 핵심 십성: ${ctx.핵심.join(', ')}`)
  lines.push(`- 해석 기준: ${ctx.해석}`)
  const groupEntries = Object.entries(baldalsipsung).sort(([, a], [, b]) => b - a)
  lines.push(`- 발달십성(5그룹): ${groupEntries.map(([g, v]) => `${g}: ${v}%`).join(', ')}`)
  for (const [group, individuals] of Object.entries(SIPSUNG_GROUP_TO_INDIVIDUAL)) {
    const relevant = individuals.filter(ind => ctx.핵심.includes(ind))
    if (relevant.length > 0) {
      const groupVal = baldalsipsung[group] ?? 0
      const label = groupVal >= 35 ? '강' : groupVal <= 5 ? '약' : '보통'
      lines.push(`  → ${group}(${relevant.join('/')}): ${groupVal}% (${label})`)
    }
  }
  if (groupEntries.length >= 2) {
    const top2Groups = groupEntries.slice(0, 2).map(([g]) => g)
    const sipsungFlat = sipsungArray.flat()
    const top2Individuals = top2Groups.map(group => {
      const individuals = SIPSUNG_GROUP_TO_INDIVIDUAL[group] || []
      let best = individuals[0] || group; let bestCount = 0
      for (const ind of individuals) {
        const count = sipsungFlat.filter(s => s === ind).length
        if (count > bestCount) { bestCount = count; best = ind }
      }
      return best
    })
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

function detectMonthQuery(questionText) {
  const monthMatch = questionText.match(/(\d{1,2})월/)
  if (monthMatch) return parseInt(monthMatch[1])
  if (questionText.includes('이번 달') || questionText.includes('이번달')) return new Date().getMonth() + 1
  if (questionText.includes('다음 달') || questionText.includes('다음달')) return (new Date().getMonth() + 2) > 12 ? 1 : new Date().getMonth() + 2
  return null
}

function buildOptimizedSajuPrompt(sajuData, categoryMain, questionText) {
  const category = classifyQuestionType(categoryMain, questionText)
  const sections = []
  const saju = sajuData['사주']; const ohaeng = sajuData['오행']
  const gyeokgubun = sajuData['격구분']; const sajugangak = sajuData['사주강약']
  const yongsin = sajuData['용신']; const yongsinOhaeng = sajuData['용신오행']
  const gender = sajuData['성별']
  sections.push('### 사주 기본 구성')
  if (saju) sections.push(`- 사주: ${saju.join(', ')}`)
  if (ohaeng) sections.push(`- 오행: ${ohaeng.join(', ')}`)
  if (gyeokgubun) sections.push(`- 격국: ${gyeokgubun}`)
  if (sajugangak) sections.push(`- 사주강약: ${sajugangak}`)
  if (gender) sections.push(`- 성별: ${gender}`)
  if (yongsin) {
    const ys = yongsin
    sections.push(`- 용신: 용신=${(ys['용신']||[]).join(',')}, 희신=${(ys['희신']||[]).join(',')}, 기신=${(ys['기신']||[]).join(',')}`)
  }
  if (yongsinOhaeng) {
    const yso = yongsinOhaeng
    sections.push(`- 용신오행: 용신=${(yso['용신']||[]).join(',')}, 희신=${(yso['희신']||[]).join(',')}, 기신=${(yso['기신']||[]).join(',')}`)
  }
  const baldalohaeng = sajuData['발달오행']
  if (baldalohaeng) { sections.push(''); sections.push('### 오행 균형'); sections.push(buildOhaengContext(baldalohaeng)) }
  const baldalsipsung = sajuData['발달십성']; const sipsungArray = sajuData['십성']
  if (baldalsipsung && sipsungArray) {
    sections.push(''); sections.push(`### 이 질문의 핵심 십성 분석 (카테고리: ${category})`)
    sections.push(buildSipsungContext(baldalsipsung, sipsungArray, category))
  }
  const mulsangron = sajuData['물상론']
  if (mulsangron) {
    sections.push(''); sections.push('### 물상론')
    if (mulsangron['닉네임']) sections.push(`- 닉네임: "${mulsangron['닉네임']}"`)
    if (mulsangron['성격']) sections.push(`- 성격: ${mulsangron['성격']}`)
    if (mulsangron['인간관계']) sections.push(`- 인간관계: ${mulsangron['인간관계']}`)
  }
  if (shouldIncludeField('본사주핵심', category)) {
    const bonsaju = sajuData['본사주']
    if (bonsaju) {
      const events = []
      if (bonsaju['충']) events.push(`충: ${bonsaju['충']}`)
      if (bonsaju['원진']) events.push(`원진: ${bonsaju['원진']}`)
      if (bonsaju['형']) events.push(`형: ${bonsaju['형']}`)
      if (bonsaju['천을귀인']) events.push(`천을귀인: ${bonsaju['천을귀인']}`)
      if (events.length > 0) { sections.push(''); sections.push('### 본사주 핵심 이벤트'); for (const e of events) sections.push(`- ${e}`) }
    }
  }
  const iljuron = sajuData['일주론']
  if (iljuron) {
    const iljuParts = []
    if (shouldIncludeField('일주론.총평', category) && iljuron['총평']) iljuParts.push(`- 총평: ${iljuron['총평']}`)
    if (shouldIncludeField('일주론.연애성향', category) && iljuron['연애성향']) iljuParts.push(`- 연애성향: ${iljuron['연애성향']}`)
    if (shouldIncludeField('일주론.추천직업', category) && iljuron['추천직업']) iljuParts.push(`- 추천직업: ${iljuron['추천직업']}`)
    if (iljuParts.length > 0) { sections.push(''); sections.push('### 일주론'); sections.push(...iljuParts) }
  }
  if (shouldIncludeField('관계분석', category)) {
    const gwangye = sajuData['관계분석']
    if (gwangye) {
      sections.push(''); sections.push('### 관계분석')
      if (gwangye['이상형']) sections.push(`- 이상형: ${gwangye['이상형']}`)
      if (gwangye['연인시기']) sections.push(`- 연인시기: ${JSON.stringify(gwangye['연인시기'])}`)
      if (gwangye['조심시기']) sections.push(`- 조심시기: ${JSON.stringify(gwangye['조심시기'])}`)
    }
  }
  if (shouldIncludeField('대운', category)) {
    const daeun = sajuData['대운']
    if (daeun?.['현재']) {
      const current = daeun['현재']
      sections.push(''); sections.push('### 현재 대운')
      if (current['간지']) sections.push(`- 간지: ${current['간지']}`)
      if (current['총평']) sections.push(`- 총평: ${current['총평']}`)
      for (const key of ['충', '원진', '형', '천을귀인', '천간합']) {
        const val = current[key]; if (val) sections.push(`- ${key}: ${val}`)
      }
    }
  }
  const seun = sajuData['세운']
  if (seun) {
    const currentYear = String(new Date().getFullYear())
    const nextYear = String(Number(currentYear) + 1)
    if (shouldIncludeField('세운.올해', category)) {
      const thisYearData = seun[currentYear]
      if (thisYearData) {
        sections.push(''); sections.push(`### ${currentYear}년 세운 (올해)`)
        if (thisYearData['간지']) sections.push(`- 간지: ${thisYearData['간지']}`)
        if (thisYearData['총평']) sections.push(`- 총평: ${thisYearData['총평']}`)
        for (const key of ['충', '원진', '천을귀인', '12신살']) {
          const val = thisYearData[key]; if (val) sections.push(`- ${key}: ${val}`)
        }
        const scores = thisYearData['운세점수']
        if (scores) sections.push(`- 운세점수: 직장운 ${scores['직장운']}, 재물운 ${scores['재물운']}, 대인관계운 ${scores['대인관계운']}, 연애운 ${scores['연애운']}`)
        const targetMonth = detectMonthQuery(questionText)
        if (targetMonth) {
          const ms = String(targetMonth)
          const mg = thisYearData['월별간지']?.[ms]; const msip = thisYearData['월별십성']?.[ms]
          if (mg || msip) {
            sections.push(`- ${targetMonth}월 간지: ${mg || '정보 없음'}`)
            sections.push(`- ${targetMonth}월 십성: ${msip ? msip.join(', ') : '정보 없음'}`)
          }
        }
      }
    }
    if (shouldIncludeField('세운.내년', category)) {
      const nextYearData = seun[nextYear]
      if (nextYearData) {
        sections.push(''); sections.push(`### ${nextYear}년 세운 (내년)`)
        if (nextYearData['간지']) sections.push(`- 간지: ${nextYearData['간지']}`)
        if (nextYearData['총평']) sections.push(`- 총평: ${nextYearData['총평']}`)
        const scores = nextYearData['운세점수']
        if (scores) sections.push(`- 운세점수: 직장운 ${scores['직장운']}, 재물운 ${scores['재물운']}, 대인관계운 ${scores['대인관계운']}, 연애운 ${scores['연애운']}`)
      }
    }
  }
  if (shouldIncludeField('격용신', category)) {
    const gy = sajuData['격용신']
    if (gy) { sections.push(''); sections.push('### 격용신'); sections.push(`- 용신: ${(gy[0]||[]).join(', ')}`); sections.push(`- 희신: ${(gy[1]||[]).join(', ')}`); sections.push(`- 기신: ${(gy[2]||[]).join(', ')}`) }
  }
  if (shouldIncludeField('사주귀천', category)) {
    const gc = sajuData['사주귀천']
    if (gc) { sections.push(''); sections.push('### 사주귀천'); if (gc['용어']) sections.push(`- 용어: ${gc['용어']}`); if (gc['해설']) sections.push(`- 해설: ${gc['해설']}`) }
  }
  if (shouldIncludeField('오주', category)) {
    const oju = sajuData['오주']; const ojuOh = sajuData['오주오행']; const ojuSip = sajuData['오주십성']
    if (oju || ojuOh || ojuSip) {
      sections.push(''); sections.push('### 오주 (확장)')
      if (oju) sections.push(`- 오주: ${oju.join(', ')}`)
      if (ojuOh) sections.push(`- 오주오행: ${ojuOh.join(', ')}`)
      if (ojuSip) sections.push(`- 오주십성: ${ojuSip.map(s => s.join('/')).join(', ')}`)
    }
  }
  if (shouldIncludeField('12신살', category)) { const s = sajuData['12신살']; if (s) { sections.push(''); sections.push('### 12신살'); sections.push(`- ${JSON.stringify(s)}`) } }
  if (shouldIncludeField('기타신살', category)) { const s = sajuData['기타신살']; if (s) { sections.push(''); sections.push('### 기타신살'); sections.push(`- ${JSON.stringify(s)}`) } }
  const todayFields = [
    { key: '오늘의연애운', field: '오늘의연애운' },
    { key: '오늘의재물운', field: '오늘의재물운' },
    { key: '오늘의직장운', field: '오늘의직장운' },
  ]
  const todayParts = []
  for (const { key, field } of todayFields) {
    if (shouldIncludeField(key, category) && sajuData[field]) todayParts.push(`- ${field}: ${sajuData[field]}`)
  }
  if (todayParts.length > 0) { sections.push(''); sections.push('### 오늘의 운세'); sections.push(...todayParts) }
  return `## 이 질문에 핵심적인 사주 분석 (카테고리: ${category})\n` + sections.join('\n')
}

// ─── 테스트 실행 ───

const TEST_CASES = [
  { category: '재물',   question: '올해 재물운은 어떤가요? 투자해도 될까요?' },
  { category: '연애',   question: '올해 연애운이 궁금해요. 좋은 인연 만날 수 있을까요?' },
  { category: '직업',   question: '이직을 고민 중인데 올해 직장운이 어떤가요?' },
  { category: '건강',   question: '요즘 건강이 안 좋은데 올해 건강운을 봐주세요' },
  { category: null,     question: '3월에 이사를 하려고 하는데 괜찮을까요?' },  // 키워드 자동분류
  { category: '시험/학업', question: '올해 시험 합격할 수 있을까요?' },
]

console.log('=' .repeat(80))
console.log('🧪 사주 지식 맵 드라이런 테스트')
console.log('=' .repeat(80))

// 기존 JSON 덤프 토큰 추정
const fullDumpLength = JSON.stringify(DUMMY_SAJU_DATA, null, 2).length
const fullDumpTokenEstimate = Math.round(fullDumpLength / 3)  // 한국어 대략 3바이트/토큰

console.log(`\n📦 기존 전체 JSON 덤프: ${fullDumpLength}자 (추정 ~${fullDumpTokenEstimate} 토큰)\n`)

for (const tc of TEST_CASES) {
  console.log('-'.repeat(80))
  const detectedCategory = classifyQuestionType(tc.category, tc.question)
  console.log(`📋 카테고리: ${tc.category || '(미지정)'} → 분류: ${detectedCategory}`)
  console.log(`❓ 질문: ${tc.question}`)
  console.log()

  const result = buildOptimizedSajuPrompt(DUMMY_SAJU_DATA, tc.category, tc.question)
  const resultTokenEstimate = Math.round(result.length / 3)
  const savings = Math.round((1 - result.length / fullDumpLength) * 100)

  console.log(result)
  console.log()
  console.log(`📊 결과: ${result.length}자 (추정 ~${resultTokenEstimate} 토큰) | 절감: ${savings}%`)
  console.log()
}

// 요약
console.log('=' .repeat(80))
console.log('📊 요약')
console.log('=' .repeat(80))
console.log(`기존 전체 덤프: ${fullDumpLength}자 (~${fullDumpTokenEstimate} 토큰)`)
for (const tc of TEST_CASES) {
  const result = buildOptimizedSajuPrompt(DUMMY_SAJU_DATA, tc.category, tc.question)
  const detectedCategory = classifyQuestionType(tc.category, tc.question)
  const savings = Math.round((1 - result.length / fullDumpLength) * 100)
  console.log(`  ${detectedCategory.padEnd(10)}: ${result.length}자 (~${Math.round(result.length/3)} 토큰) | 절감 ${savings}%`)
}
