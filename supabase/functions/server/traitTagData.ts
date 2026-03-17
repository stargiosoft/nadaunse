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
