// Edge Function용 나다움 태그 사전 데이터 + 룰베이스 매칭
// 원본: src/data/태그 정규화/traitTagDictionary.ts (243개 canonical)

// ── 장점(positive) 태그 목록 ──
export const POSITIVE_TAGS: string[] = [
  // 실행력
  '체계적인', '계획적인', '정돈된', '성실한', '꾸준한', '열의있는',
  '꼼꼼한', '세심한', '신중한', '효율적인', '전략적인', '실용적인',
  '목표지향적인', '자기관리하는',
  // 사고력
  '감성적인', '섬세한', '호기심많은', '탐구적인', '지적인', '독창적인',
  '창의적인', '직관적인', '자유로운', '진취적인', '분석적인', '논리적인',
  '냉철한', '통찰력있는', '현실적인', '상상력풍부한', '철학적인',
  '예술적인', '개방적인', '통합적인', '객관적인',
  // 감성
  '감수성풍부한', '공감하는', '다감한', '감정이입하는',
  '선량한', '착한', '온순한',
  // 관계
  '사교적인', '활발한', '표현력있는', '설득력있는', '리더적인',
  '주도적인', '카리스마있는', '매력있는', '배려하는', '온화한',
  '따뜻한', '포용적인', '조화로운', '사려깊은', '진심있는',
  '유연한', '인내하는', '친절한', '협력적인', '경청하는',
  '이해심깊은', '유머있는', '너그러운', '관대한', '외향적인',
  '쾌활한', '대범한', '원만한', '털털한',
  // 의지력
  '강인한', '도전적인', '당당한', '추진력있는', '결단력있는',
  '자신감있는', '끈기있는', '의지있는', '열정적인', '확고한',
  '신념있는', '집중하는', '용감한', '대담한', '모험적인',
  '극복하는', '투지있는',
  // 안정감
  '차분한', '침착한', '안정적인', '절제하는', '원칙적인',
  '진중한', '묵직한', '단단한', '내공있는', '평온한',
  '느긋한', '여유있는', '담담한', '의연한', '균형잡힌',
  '일관된', '변함없는',
  // 진실성
  '솔직한', '진솔한', '신뢰있는', '책임감있는', '겸손한',
  '독립적인', '정직한', '공정한', '소박한', '양심적인',
  '투명한',
];

// ── 단점(negative) 태그 목록 ──
export const NEGATIVE_TAGS: string[] = [
  // 실행력
  '산만한', '게으른', '과로하는', '완벽주의적인', '조심스러운',
  '우유부단한', '과도한', '보수적인', '무계획적인', '비효율적인',
  '무책임한', '대충하는', '미루는', '경솔한', '고지식한',
  // 사고력
  '비판적인', '독단적인', '관습적인', '무관심한',
  // 감성
  '예민한', '과민한', '민감한', '불안한', '감정적인',
  '감정기복있는', '충동적인', '변덕스러운', '조급한',
  '의존적인', '집착하는', '걱정많은', '소심한',
  '무감각한', '냉소적인', '상처받기쉬운', '외로움타는',
  // 관계
  '내성적인', '소극적인', '과묵한', '감정표현서툰',
  '융통성없는', '직설적인', '닫힌', '거리감있는',
  '감정숨기는', '냉정한', '의심하는', '방어적인',
  '엄격한', '경쟁심있는', '이기적인', '독선적인',
  '무뚝뚝한', '눈치보는',
  // 의지력
  '고집있는', '자존심강한', '포기하는', '나약한', '자기의심하는',
  // 안정감
  '불안정한', '흔들리는',
  // 진실성
  '위선적인', '허영심있는', '자기중심적인',
];

// ── 전체 canonical 태그 Set (AI 폴백 검증용) ──
export const CANONICAL_TAG_SET: Set<string> = new Set([
  ...POSITIVE_TAGS,
  ...NEGATIVE_TAGS,
]);

// ============================================================
// 룰베이스 매칭 엔진
// ============================================================

/** 형용사 어미 (긴 것부터 매칭) */
const ADJECTIVE_ENDINGS = [
  '스러운', '풍부한',
  '적인', '있는', '없는', '하는', '깊은', '많은', '강한',
  '잡힌', '맞은', '쉬운', '서툰', '타는',
  '한', '된', '진', '는', '의', '다', '운',
];

/** canonical 태그에서 어간(stem) 추출 */
function extractStem(tag: string): string {
  const normalized = tag.replace(/\s+/g, '');
  for (const ending of ADJECTIVE_ENDINGS) {
    if (normalized.endsWith(ending) && normalized.length > ending.length) {
      const stem = normalized.slice(0, -ending.length);
      if (stem.length >= 2) return stem;
    }
  }
  return normalized;
}

/** 매칭 결과 */
export interface TagMatch {
  canonical: string;
  polarity: 'positive' | 'negative';
  score: number;
}

// ── 어간 → 태그 인덱스 (모듈 로드 시 1회 빌드) ──
interface TagEntry {
  canonical: string;
  polarity: 'positive' | 'negative';
}

const STEM_INDEX = new Map<string, TagEntry[]>();

function addToIndex(tag: string, polarity: 'positive' | 'negative') {
  const stem = extractStem(tag);
  const arr = STEM_INDEX.get(stem) || [];
  arr.push({ canonical: tag, polarity });
  STEM_INDEX.set(stem, arr);
}

for (const tag of POSITIVE_TAGS) addToIndex(tag, 'positive');
for (const tag of NEGATIVE_TAGS) addToIndex(tag, 'negative');

/**
 * 텍스트에서 룰베이스로 태그를 매칭합니다.
 * 어간(stem)이 텍스트에 등장하는 횟수 × 어간 길이로 점수를 매깁니다.
 *
 * @returns positive/negative 각각 점수 내림차순 정렬된 매칭 결과
 */
export function matchTagsFromText(
  text: string,
  existingTags: string[] = [],
  rejectedTags: string[] = [],
): { positive: TagMatch[]; negative: TagMatch[] } {
  // 공백 제거한 텍스트로 어간 검색
  const normalizedText = text.replace(/\s+/g, '');
  const exclude = new Set([...existingTags, ...rejectedTags]);
  const scores = new Map<string, TagMatch>();

  for (const [stem, entries] of STEM_INDEX) {
    // 어간 등장 횟수 카운트
    let count = 0;
    let pos = 0;
    while ((pos = normalizedText.indexOf(stem, pos)) !== -1) {
      count++;
      pos += 1;
    }

    if (count === 0) continue;

    for (const entry of entries) {
      if (exclude.has(entry.canonical)) continue;

      const newScore = count * stem.length;
      const existing = scores.get(entry.canonical);
      if (!existing || newScore > existing.score) {
        scores.set(entry.canonical, {
          canonical: entry.canonical,
          polarity: entry.polarity,
          score: newScore,
        });
      }
    }
  }

  const positive: TagMatch[] = [];
  const negative: TagMatch[] = [];

  for (const result of scores.values()) {
    if (result.polarity === 'positive') positive.push(result);
    else negative.push(result);
  }

  positive.sort((a, b) => b.score - a.score);
  negative.sort((a, b) => b.score - a.score);

  return { positive, negative };
}

// ── AI 폴백용 유틸리티 ──
const _polarityMap = new Map<string, 'positive' | 'negative'>();
for (const tag of POSITIVE_TAGS) _polarityMap.set(tag, 'positive');
for (const tag of NEGATIVE_TAGS) _polarityMap.set(tag, 'negative');

export function getTagPolarity(canonical: string): 'positive' | 'negative' | undefined {
  return _polarityMap.get(canonical);
}

// ============================================================
// 태그 → HEXACO 카테고리 매핑 (analyze-nadaum-dna 룰베이스용)
// ============================================================

export type RadarAxis = '실행력' | '사고력' | '감성' | '관계' | '의지력' | '안정감';
type TagCategory7 = RadarAxis | '진실성';

const TAG_CATEGORY_MAP: Record<string, TagCategory7> = {
  // ── 실행력 ──
  '체계적인': '실행력', '계획적인': '실행력', '정돈된': '실행력', '성실한': '실행력',
  '꾸준한': '실행력', '열의있는': '실행력', '꼼꼼한': '실행력', '세심한': '실행력',
  '신중한': '실행력', '효율적인': '실행력', '전략적인': '실행력', '실용적인': '실행력',
  '목표지향적인': '실행력', '자기관리하는': '실행력',
  '산만한': '실행력', '게으른': '실행력', '과로하는': '실행력', '완벽주의적인': '실행력',
  '조심스러운': '실행력', '우유부단한': '실행력', '과도한': '실행력', '보수적인': '실행력',
  '무계획적인': '실행력', '비효율적인': '실행력', '무책임한': '실행력', '대충하는': '실행력',
  '미루는': '실행력', '경솔한': '실행력', '고지식한': '실행력',
  // ── 사고력 ──
  '섬세한': '사고력', '호기심많은': '사고력', '탐구적인': '사고력', '지적인': '사고력',
  '독창적인': '사고력', '창의적인': '사고력', '직관적인': '사고력', '자유로운': '사고력',
  '진취적인': '사고력', '분석적인': '사고력', '논리적인': '사고력', '냉철한': '사고력',
  '통찰력있는': '사고력', '현실적인': '사고력', '개방적인': '사고력',
  '상상력풍부한': '사고력', '철학적인': '사고력', '예술적인': '사고력',
  '심미적인': '사고력', '통합적인': '사고력', '객관적인': '사고력',
  '비판적인': '사고력', '독단적인': '사고력', '관습적인': '사고력', '무관심한': '사고력',
  // ── 감성 ──
  '감성적인': '감성', '예민한': '감성', '불안한': '감성', '감정적인': '감성',
  '감정기복있는': '감성', '충동적인': '감성', '변덕스러운': '감성', '조급한': '감성',
  '의존적인': '감성', '집착하는': '감성', '감수성풍부한': '감성', '공감하는': '감성',
  '걱정많은': '감성', '소심한': '감성', '온순한': '감성',
  '다감한': '감성', '감정이입하는': '감성', '눈물많은': '감성',
  '두려움많은': '감성', '무감각한': '감성', '냉소적인': '감성',
  '정서불안정한': '감성', '상처받기쉬운': '감성', '외로움타는': '감성',
  '선량한': '감성', '착한': '감성',
  // ── 관계 ──
  '사교적인': '관계', '활발한': '관계', '내성적인': '관계', '소극적인': '관계',
  '과묵한': '관계', '표현력있는': '관계', '설득력있는': '관계', '리더적인': '관계',
  '주도적인': '관계', '카리스마있는': '관계', '매력있는': '관계', '감정표현서툰': '관계',
  '배려하는': '관계', '온화한': '관계', '따뜻한': '관계', '포용적인': '관계',
  '조화로운': '관계', '사려깊은': '관계', '진심있는': '관계', '유연한': '관계',
  '융통성없는': '관계', '직설적인': '관계', '닫힌': '관계', '거리감있는': '관계',
  '감정숨기는': '관계', '냉정한': '관계', '의심하는': '관계', '방어적인': '관계',
  '엄격한': '관계', '경쟁심있는': '관계', '친절한': '관계', '협력적인': '관계',
  '유머있는': '관계', '독선적인': '관계', '무뚝뚝한': '관계', '대범한': '관계',
  '이기적인': '관계', '경청하는': '관계', '이해심깊은': '관계', '너그러운': '관계',
  '관대한': '관계', '봉사하는': '관계', '외향적인': '관계',
  '타인중심적인': '관계', '무례한': '관계', '눈치보는': '관계', '갈등피하는': '관계',
  // ── 의지력 ──
  '강인한': '의지력', '도전적인': '의지력', '당당한': '의지력', '추진력있는': '의지력',
  '결단력있는': '의지력', '자신감있는': '의지력', '끈기있는': '의지력', '의지있는': '의지력',
  '열정적인': '의지력', '확고한': '의지력', '신념있는': '의지력', '고집있는': '의지력',
  '집중하는': '의지력', '자존심강한': '의지력', '인내하는': '의지력',
  '용감한': '의지력', '대담한': '의지력', '모험적인': '의지력', '극복하는': '의지력',
  '투지있는': '의지력', '야망있는': '의지력', '자기확신있는': '의지력',
  '포기하는': '의지력', '나약한': '의지력', '자기의심하는': '의지력', '강경한': '의지력',
  // ── 안정감 ──
  '차분한': '안정감', '침착한': '안정감', '안정적인': '안정감', '절제하는': '안정감',
  '원칙적인': '안정감', '진중한': '안정감', '묵직한': '안정감', '단단한': '안정감',
  '내공있는': '안정감', '평온한': '안정감', '느긋한': '안정감', '여유있는': '안정감',
  '담담한': '안정감', '의연한': '안정감', '균형잡힌': '안정감', '일관된': '안정감',
  '변함없는': '안정감', '동요하지않는': '안정감',
  '불안정한': '안정감', '흔들리는': '안정감',
  // ── 진실성 (레이더 6축에 없음 → 관계/안정감에 분배) ──
  '솔직한': '진실성', '진솔한': '진실성', '신뢰있는': '진실성', '책임감있는': '진실성',
  '겸손한': '진실성', '독립적인': '진실성', '정직한': '진실성', '공정한': '진실성',
  '소박한': '진실성', '검소한': '진실성', '양심적인': '진실성', '투명한': '진실성',
  '욕심없는': '진실성', '위선적인': '진실성', '교활한': '진실성',
  '허영심있는': '진실성', '탐욕적인': '진실성', '자기중심적인': '진실성',
};

/**
 * 태그의 HEXACO 카테고리를 반환합니다.
 */
export function getTagCategory(canonical: string): TagCategory7 | undefined {
  return TAG_CATEGORY_MAP[canonical];
}

/** 레이더 6축 목록 */
export const RADAR_AXES: RadarAxis[] = ['실행력', '사고력', '감성', '관계', '의지력', '안정감'];

/** 꽃 매핑 (최고 축 → 꽃) */
export const AXIS_FLOWER_MAP: Record<RadarAxis, string> = {
  '실행력': '해바라기',
  '사고력': '라벤더',
  '감성': '장미',
  '관계': '벚꽃',
  '의지력': '매화',
  '안정감': '연꽃',
};

/**
 * 확정된 태그 목록에서 레이더 6축 점수를 계산합니다.
 * 진실성 태그는 관계(60%) + 안정감(40%)에 분배됩니다.
 * @returns 각 축 0~100 점수
 */
export function computeRadarScores(
  tags: Array<{ tag_name: string; tag_type: string }>
): Record<RadarAxis, number> {
  // 축별 가중치 합산
  const axisSum: Record<string, number> = {};
  for (const axis of RADAR_AXES) axisSum[axis] = 0;

  for (const t of tags) {
    const cat = TAG_CATEGORY_MAP[t.tag_name];
    if (!cat) continue;

    // 각 태그 1점 (positive든 negative든 해당 축의 특성을 나타냄)
    if (cat === '진실성') {
      // 진실성 → 관계 60% + 안정감 40%
      axisSum['관계'] += 0.6;
      axisSum['안정감'] += 0.4;
    } else {
      axisSum[cat] += 1;
    }
  }

  // 정규화: 최대값 기준 15~85 범위
  const values = RADAR_AXES.map(a => axisSum[a]);
  const maxVal = Math.max(...values, 1); // 0 방지

  const radar: Record<string, number> = {};
  for (const axis of RADAR_AXES) {
    const normalized = (axisSum[axis] / maxVal) * 70 + 15;
    radar[axis] = Math.round(Math.min(100, Math.max(0, normalized)));
  }

  return radar as Record<RadarAxis, number>;
}
