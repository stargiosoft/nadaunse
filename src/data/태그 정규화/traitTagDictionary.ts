// 나다움 태그 사전 (HEXACO 기반 분류)
// 자동 생성 - 프로덕션 615개 태그 정규화 + HEXACO 매핑
// 생성일: 2026-03-16

export type TagCategory =
  | '실행력'
  | '사고력'
  | '감성'
  | '관계'
  | '의지력'
  | '안정감'
  | '진실성';

export type TagPolarity = 'positive' | 'negative';

export interface TraitTagEntry {
  /** 대표 태그명 (정규화된 형태) */
  canonical: string;
  /** 긍정/부정 */
  polarity: TagPolarity;
  /** HEXACO 카테고리 */
  category: TagCategory;
  /** 동의어 목록 (대표명 제외) */
  synonyms: string[];
  /** 프로덕션에서의 총 사용 빈도 */
  frequency: number;
}

// ============================================================
// 태그 사전 본체
// ============================================================
export const TRAIT_TAG_DICTIONARY: TraitTagEntry[] = [
  // ──────────────────────────────────────────────
  // 1. 실행력 (성실성/Conscientiousness)
  //    하위: 조직성, 근면성, 완벽주의, 신중함
  // ──────────────────────────────────────────────

  // --- 조직성 ---
  {
    canonical: '체계적인',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['체계있는', '체계 있는', '조직적인', '조직력있는'],
    frequency: 7,
  },
  {
    canonical: '계획적인',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['계획하는', '계획있는', '계획 있는', '계획적'],
    frequency: 6,
  },
  {
    canonical: '정돈된',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['정리정돈하는', '정돈하는', '깔끔한'],
    frequency: 3,
  },
  {
    canonical: '산만한',
    polarity: 'negative',
    category: '실행력',
    synonyms: ['흩어지는', '집중못하는', '집중력없는', '집중력 부족한'],
    frequency: 10,
  },

  // --- 근면성 ---
  {
    canonical: '성실한',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['성실적인', '근면한', '부지런한'],
    frequency: 37,
  },
  {
    canonical: '꾸준한',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['꾸준히하는', '꾸준하는', '한결같은'],
    frequency: 29,
  },
  {
    canonical: '열의있는',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['열의 있는', '의욕있는', '의욕적인'],
    frequency: 8,
  },
  {
    canonical: '게으른',
    polarity: 'negative',
    category: '실행력',
    synonyms: ['나태한', '태만한'],
    frequency: 2,
  },
  {
    canonical: '과로하는',
    polarity: 'negative',
    category: '실행력',
    synonyms: ['과로적인', '무리하는'],
    frequency: 15,
  },

  // --- 완벽주의 ---
  {
    canonical: '완벽주의적인',
    polarity: 'negative',
    category: '실행력',
    synonyms: [
      '완벽주의한',
      '완벽주의적',
      '완벽적인',
      '완벽주의인',
      '완벽주의',
      '완벽 추구',
      '완벽한',
    ],
    frequency: 36,
  },
  {
    canonical: '꼼꼼한',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['꼼꼼하는', '세밀한'],
    frequency: 5,
  },
  {
    canonical: '세심한',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['세심있는', '세심 있는'],
    frequency: 7,
  },

  // --- 신중함 ---
  {
    canonical: '신중한',
    polarity: 'positive',
    category: '실행력',
    synonyms: ['심중한'],
    frequency: 168,
  },
  {
    canonical: '조심스러운',
    polarity: 'negative',
    category: '실행력',
    synonyms: ['조심성있는', '조심하는', '조심성 있는', '조심적인'],
    frequency: 39,
  },
  {
    canonical: '우유부단한',
    polarity: 'negative',
    category: '실행력',
    synonyms: ['결단못하는', '결정못하는', '우유부단적인', '결정장애'],
    frequency: 10,
  },
  {
    canonical: '과도한',
    polarity: 'negative',
    category: '실행력',
    synonyms: ['지나친', '과한', '과도적인'],
    frequency: 8,
  },
  {
    canonical: '보수적인',
    polarity: 'negative',
    category: '실행력',
    synonyms: ['보수적'],
    frequency: 8,
  },

  // ──────────────────────────────────────────────
  // 2. 사고력 (개방성/Openness)
  //    하위: 심미감, 호기심, 창의성, 비관습성
  // ──────────────────────────────────────────────

  // --- 심미감 ---
  {
    canonical: '감성적인',
    polarity: 'positive',
    category: '감성',
    synonyms: ['감성있는', '감성 있는', '감성풍부한', '감성 풍부한'],
    frequency: 13,
  },
  {
    canonical: '섬세한',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['섬세적인', '세련된'],
    frequency: 43,
  },

  // --- 호기심 ---
  {
    canonical: '호기심많은',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['호기심있는', '호기심 있는', '호기심이 많은', '호기심 많은'],
    frequency: 7,
  },
  {
    canonical: '탐구적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['탐구하는', '탐구심있는', '탐구적'],
    frequency: 4,
  },
  {
    canonical: '지적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['지적', '지식있는', '지성적인'],
    frequency: 7,
  },

  // --- 창의성 ---
  {
    canonical: '독창적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['독창적', '독특한', '개성적인', '개성있는', '개성 있는'],
    frequency: 9,
  },
  {
    canonical: '창의적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['창의있는', '창의적', '창조적인', '창조적'],
    frequency: 5,
  },
  {
    canonical: '직관적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['직관있는', '직관 있는', '직관력있는', '직관적'],
    frequency: 19,
  },

  // --- 비관습성 ---
  {
    canonical: '자유로운',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['자유적인', '자유분방한', '자유스러운'],
    frequency: 5,
  },
  {
    canonical: '진취적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['진취적', '혁신적인', '혁신적'],
    frequency: 7,
  },

  // --- 분석/논리 ---
  {
    canonical: '분석적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['분석하는', '분석력있는', '분석적'],
    frequency: 27,
  },
  {
    canonical: '논리적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['논리적', '논리있는', '논리 있는', '이성적인'],
    frequency: 8,
  },
  {
    canonical: '냉철한',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['냉철적인', '냉철한사고'],
    frequency: 25,
  },
  {
    canonical: '통찰력있는',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['통찰력 있는', '통찰적인', '통찰있는', '통찰력적인'],
    frequency: 16,
  },
  {
    canonical: '현실적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: ['현실적', '현실감있는', '현실 감각있는'],
    frequency: 21,
  },

  // ──────────────────────────────────────────────
  // 3. 감성 (정서성/Emotionality)
  //    하위: 공포민감성, 불안, 의존성, 감상성
  // ──────────────────────────────────────────────

  // --- 공포민감성 ---
  {
    canonical: '예민한',
    polarity: 'negative',
    category: '감성',
    synonyms: ['예민적인', '예민감있는', '과민한', '과민적인', '과민감한', '민감한', '민감적인', '민감성있는'],
    frequency: 65,
  },
  // 과민한, 민감한 → 예민한으로 통합 (동의어화)
  // 합산 빈도: 예민한(34) + 과민한(17) + 민감한(14) = 65

  // --- 불안 ---
  {
    canonical: '불안한',
    polarity: 'negative',
    category: '감성',
    synonyms: ['불안적인', '불안감있는', '불안해하는'],
    frequency: 8,
  },
  {
    canonical: '감정적인',
    polarity: 'negative',
    category: '감성',
    synonyms: ['감정적', '감정과다한'],
    frequency: 42,
  },
  {
    canonical: '감정기복있는',
    polarity: 'negative',
    category: '감성',
    synonyms: ['감정기복 있는', '감정기복', '감정기복심한', '감정기복적인'],
    frequency: 9,
  },
  {
    canonical: '충동적인',
    polarity: 'negative',
    category: '감성',
    synonyms: ['충동적', '즉흥적인'],
    frequency: 12,
  },
  {
    canonical: '변덕스러운',
    polarity: 'negative',
    category: '감성',
    synonyms: ['변덕적인', '변덕있는'],
    frequency: 7,
  },
  {
    canonical: '조급한',
    polarity: 'negative',
    category: '감성',
    synonyms: ['조급적인', '급한', '성급한', '급하는'],
    frequency: 40,
  },

  // --- 의존성 ---
  {
    canonical: '의존적인',
    polarity: 'negative',
    category: '감성',
    synonyms: ['의존하는', '의존적', '의존성있는'],
    frequency: 4,
  },
  {
    canonical: '집착하는',
    polarity: 'negative',
    category: '감성',
    synonyms: ['집착적인', '집착많은', '집착 많은', '집착강한'],
    frequency: 15,
  },

  // --- 감상성 ---
  {
    canonical: '감수성풍부한',
    polarity: 'positive',
    category: '감성',
    synonyms: ['감수성있는', '감수성 풍부한', '감수성 있는', '감수성적인'],
    frequency: 5,
  },
  {
    canonical: '공감하는',
    polarity: 'positive',
    category: '감성',
    synonyms: ['공감적인', '공감능력있는', '공감력있는', '공감 있는', '공감력 있는'],
    frequency: 6,
  },

  // ──────────────────────────────────────────────
  // 4. 관계 (외향성+원만성/Extraversion+Agreeableness)
  //    하위: 사교성, 활력, 관용성, 온화성, 융통성, 인내심
  // ──────────────────────────────────────────────

  // --- 사교성 ---
  {
    canonical: '사교적인',
    polarity: 'positive',
    category: '관계',
    synonyms: ['사교적', '사교성있는', '사교성 있는'],
    frequency: 4,
  },
  {
    canonical: '활발한',
    polarity: 'positive',
    category: '관계',
    synonyms: ['활발적인', '활동적인', '활기찬', '활력있는', '활력 있는'],
    frequency: 11,
  },
  {
    canonical: '내성적인',
    polarity: 'negative',
    category: '관계',
    synonyms: ['내향적인', '내향적', '내성적'],
    frequency: 79,
  },
  {
    canonical: '소극적인',
    polarity: 'negative',
    category: '관계',
    synonyms: ['소극적', '수동적인', '수동적'],
    frequency: 33,
  },
  {
    canonical: '과묵한',
    polarity: 'negative',
    category: '관계',
    synonyms: ['과묵적인', '말없는', '말이적은', '말 적은', '과묵적'],
    frequency: 32,
  },
  {
    canonical: '표현력있는',
    polarity: 'positive',
    category: '관계',
    synonyms: ['표현력 있는', '표현적인', '표현있는'],
    frequency: 18,
  },
  {
    canonical: '설득력있는',
    polarity: 'positive',
    category: '관계',
    synonyms: ['설득력 있는', '설득적인', '설득하는'],
    frequency: 11,
  },
  {
    canonical: '리더적인',
    polarity: 'positive',
    category: '관계',
    synonyms: ['리더십 있는', '리더있는', '리더십있는', '리더십적인'],
    frequency: 14,
  },
  {
    canonical: '주도적인',
    polarity: 'positive',
    category: '관계',
    synonyms: ['주도하는', '주도적', '주도성있는'],
    frequency: 11,
  },
  {
    canonical: '카리스마있는',
    polarity: 'positive',
    category: '관계',
    synonyms: ['카리스마 있는', '카리스마적인'],
    frequency: 5,
  },
  {
    canonical: '매력있는',
    polarity: 'positive',
    category: '관계',
    synonyms: ['매력적인', '매력 있는'],
    frequency: 9,
  },
  {
    canonical: '감정표현서툰',
    polarity: 'negative',
    category: '관계',
    synonyms: [
      '감정서툰',
      '표현이 서툰',
      '감정표현부족',
      '감정표현적은',
      '감정표현이약한',
      '감정표현이적은',
      '감정표현 부족한',
      '감정표현 어려운',
    ],
    frequency: 10,
  },

  // --- 관용성/온화성 ---
  {
    canonical: '배려하는',
    polarity: 'positive',
    category: '관계',
    synonyms: [
      '배려있는',
      '배려심있는',
      '배려심 있는',
      '배려심깊은',
      '배려심 깊은',
      '배려적인',
      '배려깊은',
    ],
    frequency: 167,
  },
  {
    canonical: '온화한',
    polarity: 'positive',
    category: '관계',
    synonyms: ['온화적인', '온유한', '부드러운', '다정한'],
    frequency: 50,
  },
  {
    canonical: '따뜻한',
    polarity: 'positive',
    category: '관계',
    synonyms: ['따뜻적인', '따스한', '포근한', '따뜻한마음'],
    frequency: 50,
  },
  {
    canonical: '포용적인',
    polarity: 'positive',
    category: '관계',
    synonyms: ['포용력있는', '포용력 있는', '포용심있는', '포용적', '포용하는'],
    frequency: 25,
  },
  {
    canonical: '조화로운',
    polarity: 'positive',
    category: '관계',
    synonyms: ['조화적인', '조화있는'],
    frequency: 7,
  },
  {
    canonical: '사려깊은',
    polarity: 'positive',
    category: '관계',
    synonyms: ['사려있는', '사려 깊은', '사려깊은마음'],
    frequency: 7,
  },
  {
    canonical: '진심있는',
    polarity: 'positive',
    category: '관계',
    synonyms: ['진심적인', '진심어린', '진심인'],
    frequency: 10,
  },

  // --- 융통성 ---
  {
    canonical: '유연한',
    polarity: 'positive',
    category: '관계',
    synonyms: ['유연적인', '유연성있는', '유연성 있는', '융통성있는'],
    frequency: 48,
  },
  {
    canonical: '융통성없는',
    polarity: 'negative',
    category: '관계',
    synonyms: ['융통성 없는', '융통성 적은', '유연성없는', '융통성부족한'],
    frequency: 35,
  },

  // --- 인내심 ---
  {
    canonical: '인내하는',
    polarity: 'positive',
    category: '의지력',
    synonyms: [
      '인내심있는',
      '인내심 있는',
      '인내있는',
      '인내력있는',
      '인내심 깊은',
      '인내적인',
    ],
    frequency: 40,
  },

  // --- 비판/거리감 ---
  {
    canonical: '직설적인',
    polarity: 'negative',
    category: '관계',
    synonyms: ['직설적', '직접적인', '직선적인'],
    frequency: 20,
  },
  {
    canonical: '닫힌',
    polarity: 'negative',
    category: '관계',
    synonyms: ['닫힌마음인', '폐쇄적인', '마음 닫는', '감정적 닫힌', '닫는'],
    frequency: 27,
  },
  {
    canonical: '거리감있는',
    polarity: 'negative',
    category: '관계',
    synonyms: ['거리감 있는', '거리두는', '거리를두는', '거리적인'],
    frequency: 21,
  },
  {
    canonical: '감정숨기는',
    polarity: 'negative',
    category: '관계',
    synonyms: [
      '감정억제하는',
      '감정절제하는',
      '감정조절하는',
      '감정 숨기는',
      '감정닫는',
      '감추는',
      '감정 억제하는',
      '감정억누르는',
      '감정억제',
      '감정억제한',
      '숨기는',
    ],
    frequency: 49,
  },
  {
    canonical: '냉정한',
    polarity: 'negative',
    category: '관계',
    synonyms: ['냉정적인', '냉담한', '차가운'],
    frequency: 11,
  },
  {
    canonical: '의심하는',
    polarity: 'negative',
    category: '관계',
    synonyms: ['의심많은', '의심 많은', '의심적인'],
    frequency: 20,
  },
  {
    canonical: '방어적인',
    polarity: 'negative',
    category: '관계',
    synonyms: ['방어하는', '방어적', '경계하는', '경계심있는'],
    frequency: 10,
  },
  {
    canonical: '엄격한',
    polarity: 'negative',
    category: '관계',
    synonyms: ['엄격적인', '까다로운', '엄한'],
    frequency: 9,
  },
  {
    canonical: '경쟁심있는',
    polarity: 'negative',
    category: '관계',
    synonyms: ['경쟁심 있는', '경쟁적인', '경쟁심강한', '경쟁심 강한'],
    frequency: 18,
  },

  // ──────────────────────────────────────────────
  // 5. 의지력 (끈기/Grit)
  //    하위: 대담성, 사회적자존감, 인내, 극복
  // ──────────────────────────────────────────────

  // --- 대담성 ---
  {
    canonical: '강인한',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['강한', '강인적인', '강인한마음'],
    frequency: 69,
  },
  {
    canonical: '도전적인',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['도전하는', '도전적', '도전감있는'],
    frequency: 16,
  },
  {
    canonical: '당당한',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['당당적인', '당당하는'],
    frequency: 8,
  },
  {
    canonical: '추진력있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['추진력 있는', '추진하는', '추진적인', '추진력적인'],
    frequency: 24,
  },
  {
    canonical: '결단력있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['결단력 있는', '결단적인', '결단있는', '결단하는'],
    frequency: 19,
  },

  // --- 사회적 자존감 ---
  {
    canonical: '자신감있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['자신감 있는', '자신감적인', '자신있는', '자신 있는'],
    frequency: 53,
  },
  {
    canonical: '자존심강한',
    polarity: 'negative',
    category: '의지력',
    synonyms: [
      '자존심 강한',
      '자존심있는',
      '자존심센',
      '자존심 센',
      '자존심 있는',
      '자존심적인',
    ],
    frequency: 36,
  },

  // --- 인내/극복 ---
  {
    canonical: '끈기있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['끈질긴', '끈기 있는', '끈덕진', '끈기적인'],
    frequency: 90,
  },
  {
    canonical: '의지있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['의지적인', '의지 있는', '의지강한', '의지 강한'],
    frequency: 18,
  },
  {
    canonical: '열정적인',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['열정있는', '열정적', '열정 있는'],
    frequency: 41,
  },
  {
    canonical: '확고한',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['확고적인', '확고하는', '굳건한'],
    frequency: 20,
  },
  {
    canonical: '신념있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['신념깊은', '신념적인', '신념 있는', '신념강한', '신념 강한'],
    frequency: 30,
  },
  {
    canonical: '고집있는',
    polarity: 'negative',
    category: '의지력',
    synonyms: [
      '완고한',
      '고집하는',
      '고집적인',
      '고집 센',
      '고집센',
      '고집 있는',
      '고집스러운',
      '고집부리는',
    ],
    frequency: 163,
  },
  {
    canonical: '집중하는',
    polarity: 'positive',
    category: '의지력',
    synonyms: ['집중적인', '집중력있는', '집중력 있는', '몰입하는'],
    frequency: 12,
  },

  // ──────────────────────────────────────────────
  // 6. 안정감 (정서안정성/Emotional Stability)
  //    하위: 침착, 자기조절, 일관성, 평정심
  // ──────────────────────────────────────────────

  // --- 침착 ---
  {
    canonical: '차분한',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['차분적인', '차분하는'],
    frequency: 92,
  },
  {
    canonical: '침착한',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['침착적인', '침착하는', '냉정침착한'],
    frequency: 14,
  },
  {
    canonical: '안정적인',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['안정적', '안정감있는', '안정감 있는'],
    frequency: 12,
  },

  // --- 자기조절 ---
  {
    canonical: '절제하는',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['절제적인', '절제있는', '자기조절하는', '자제하는', '자제력있는'],
    frequency: 5,
  },
  {
    canonical: '원칙적인',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['원칙있는', '원칙적', '원칙 있는', '규칙적인'],
    frequency: 9,
  },

  // --- 일관성 ---
  {
    canonical: '진중한',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['진중적인', '진중하는', '무게있는'],
    frequency: 17,
  },
  {
    canonical: '묵직한',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['묵직적인', '묵묵한', '묵묵하는'],
    frequency: 34,
  },
  {
    canonical: '단단한',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['단단적인', '단단하는', '견고한'],
    frequency: 11,
  },

  // --- 평정심 ---
  {
    canonical: '내공있는',
    polarity: 'positive',
    category: '안정감',
    synonyms: ['내공 있는', '내공적인', '내공깊은'],
    frequency: 8,
  },

  // ──────────────────────────────────────────────
  // 7. 진실성 (정직-겸손/Honesty-Humility)
  //    하위: 진실성, 공정성, 탐욕회피, 겸손성
  // ──────────────────────────────────────────────

  // --- 진실성 ---
  {
    canonical: '솔직한',
    polarity: 'positive',
    category: '진실성',
    synonyms: ['솔직적인', '솔직하는', '직설적인(솔직)', '솔직담백한'],
    frequency: 24,
  },
  {
    canonical: '진솔한',
    polarity: 'positive',
    category: '진실성',
    synonyms: ['진솔적인', '진솔하는'],
    frequency: 16,
  },
  {
    canonical: '신뢰있는',
    polarity: 'positive',
    category: '진실성',
    synonyms: [
      '신뢰하는',
      '신뢰감있는',
      '신뢰감 있는',
      '신뢰적인',
      '신뢰 있는',
      '신뢰주는',
      '신뢰할수있는',
    ],
    frequency: 121,
  },

  // --- 공정성 ---
  {
    canonical: '책임감있는',
    polarity: 'positive',
    category: '진실성',
    synonyms: [
      '책임감 있는',
      '책임있는',
      '책임적인',
      '책임진',
      '책임하는',
      '책임지는',
      '책임감적인',
    ],
    frequency: 194,
  },

  // --- 겸손성 ---
  {
    canonical: '겸손한',
    polarity: 'positive',
    category: '진실성',
    synonyms: ['겸손적인', '겸손하는', '겸허한'],
    frequency: 14,
  },

  // --- 독립성/자립 ---
  {
    canonical: '독립적인',
    polarity: 'positive',
    category: '진실성',
    synonyms: ['독립적', '자립적인', '자립하는', '자립적', '독립심있는'],
    frequency: 54,
  },

  // ──────────────────────────────────────────────
  // 보충 태그: HEXACO 하위척도 기반 (frequency: 0)
  // 현재 프로덕션에 없지만 성격 분석에 유용한 태그
  // ──────────────────────────────────────────────

  // --- 실행력 보충 ---
  {
    canonical: '효율적인',
    polarity: 'positive',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '전략적인',
    polarity: 'positive',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '실용적인',
    polarity: 'positive',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '목표지향적인',
    polarity: 'positive',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '자기관리하는',
    polarity: 'positive',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '무계획적인',
    polarity: 'negative',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '비효율적인',
    polarity: 'negative',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '무책임한',
    polarity: 'negative',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '대충하는',
    polarity: 'negative',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '미루는',
    polarity: 'negative',
    category: '실행력',
    synonyms: [],
    frequency: 0,
  },

  // --- 사고력 보충 ---
  {
    canonical: '상상력풍부한',
    polarity: 'positive',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '철학적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '심미적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '예술적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '개방적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '비판적인',
    polarity: 'negative',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '독단적인',
    polarity: 'negative',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '폐쇄적사고',
    polarity: 'negative',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '관습적인',
    polarity: 'negative',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '무관심한',
    polarity: 'negative',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '통합적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '객관적인',
    polarity: 'positive',
    category: '사고력',
    synonyms: [],
    frequency: 0,
  },

  // --- 감성 보충 ---
  {
    canonical: '다감한',
    polarity: 'positive',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '감동받기쉬운',
    polarity: 'positive',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '감정이입하는',
    polarity: 'positive',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '눈물많은',
    polarity: 'positive',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '걱정많은',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '두려움많은',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '소심한',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '무감각한',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '냉소적인',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '정서불안정한',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '상처받기쉬운',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '외로움타는',
    polarity: 'negative',
    category: '감성',
    synonyms: [],
    frequency: 0,
  },

  // --- 관계 보충 ---
  {
    canonical: '친절한',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '협력적인',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '경청하는',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '이해심깊은',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '유머있는',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '너그러운',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '관대한',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '봉사하는',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '외향적인',
    polarity: 'positive',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '타인중심적인',
    polarity: 'negative',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '이기적인',
    polarity: 'negative',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '무례한',
    polarity: 'negative',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '독선적인',
    polarity: 'negative',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '무뚝뚝한',
    polarity: 'negative',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '눈치보는',
    polarity: 'negative',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '갈등피하는',
    polarity: 'negative',
    category: '관계',
    synonyms: [],
    frequency: 0,
  },

  // --- 의지력 보충 ---
  {
    canonical: '불굴의',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '용감한',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '대담한',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '모험적인',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '극복하는',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '투지있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '야망있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '자기확신있는',
    polarity: 'positive',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '포기하는',
    polarity: 'negative',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '나약한',
    polarity: 'negative',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '소심한태도',
    polarity: 'negative',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '자기의심하는',
    polarity: 'negative',
    category: '의지력',
    synonyms: [],
    frequency: 0,
  },

  // --- 안정감 보충 ---
  {
    canonical: '평온한',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '느긋한',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '여유있는',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '담담한',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '의연한',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '태연한',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '균형잡힌',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '일관된',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '변함없는',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '동요하지않는',
    polarity: 'positive',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '불안정한',
    polarity: 'negative',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '흔들리는',
    polarity: 'negative',
    category: '안정감',
    synonyms: [],
    frequency: 0,
  },

  // --- 진실성 보충 ---
  {
    canonical: '정직한',
    polarity: 'positive',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '공정한',
    polarity: 'positive',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '소박한',
    polarity: 'positive',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '검소한',
    polarity: 'positive',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '양심적인',
    polarity: 'positive',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '투명한',
    polarity: 'positive',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '욕심없는',
    polarity: 'positive',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '위선적인',
    polarity: 'negative',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '교활한',
    polarity: 'negative',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '허영심있는',
    polarity: 'negative',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '탐욕적인',
    polarity: 'negative',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },
  {
    canonical: '자기중심적인',
    polarity: 'negative',
    category: '진실성',
    synonyms: [],
    frequency: 0,
  },

  // ──────────────────────────────────────────────
  // 국립국어원 표준국어대사전 보충 (사전 정의 기반, frequency: 0)
  // ──────────────────────────────────────────────

  // --- 실행력 (국어원) ---
  { canonical: '고지식한', polarity: 'negative', category: '실행력', synonyms: [], frequency: 0 },
  { canonical: '경솔한', polarity: 'negative', category: '실행력', synonyms: ['경탈한', '경망한', '경망스러운'], frequency: 0 },
  { canonical: '깐진', polarity: 'positive', category: '실행력', synonyms: [], frequency: 0 },
  { canonical: '주직한', polarity: 'positive', category: '실행력', synonyms: [], frequency: 0 },
  { canonical: '충근한', polarity: 'positive', category: '실행력', synonyms: [], frequency: 0 },

  // --- 사고력 (국어원) ---
  { canonical: '고매한', polarity: 'positive', category: '사고력', synonyms: [], frequency: 0 },
  { canonical: '고결한', polarity: 'positive', category: '사고력', synonyms: ['개결한'], frequency: 0 },
  { canonical: '표일한', polarity: 'positive', category: '사고력', synonyms: [], frequency: 0 },

  // --- 감성 (국어원) ---
  { canonical: '선량한', polarity: 'positive', category: '감성', synonyms: ['순량한', '정순한', '순된'], frequency: 0 },
  { canonical: '착한', polarity: 'positive', category: '감성', synonyms: [], frequency: 0 },
  { canonical: '모질다', polarity: 'negative', category: '감성', synonyms: [], frequency: 0 },
  { canonical: '온순한', polarity: 'positive', category: '감성', synonyms: ['온량한', '온인한', '온자한', '유화한'], frequency: 0 },
  { canonical: '온후한', polarity: 'positive', category: '감성', synonyms: ['온유돈후한', '온아한', '온근한', '온연한'], frequency: 0 },
  { canonical: '수련한', polarity: 'positive', category: '감성', synonyms: ['숙청한'], frequency: 0 },
  { canonical: '인약한', polarity: 'negative', category: '감성', synonyms: [], frequency: 0 },
  { canonical: '정숙한', polarity: 'positive', category: '감성', synonyms: [], frequency: 0 },
  { canonical: '독살스러운', polarity: 'negative', category: '감성', synonyms: [], frequency: 0 },
  { canonical: '시시콜콜한', polarity: 'negative', category: '감성', synonyms: [], frequency: 0 },

  // --- 관계 (국어원) ---
  { canonical: '쾌활한', polarity: 'positive', category: '관계', synonyms: ['쾌연한', '쾌쾌한'], frequency: 0 },
  { canonical: '대범한', polarity: 'positive', category: '관계', synonyms: ['소달한'], frequency: 0 },
  { canonical: '원만한', polarity: 'positive', category: '관계', synonyms: ['원만스러운'], frequency: 0 },
  { canonical: '털털한', polarity: 'positive', category: '관계', synonyms: ['털털스러운'], frequency: 0 },
  { canonical: '곰살갑다', polarity: 'positive', category: '관계', synonyms: ['곰살궂다', '곰상곰상한', '곰상스러운'], frequency: 0 },
  { canonical: '사근사근한', polarity: 'positive', category: '관계', synonyms: ['서근서근한', '서글서글한', '사글사글한'], frequency: 0 },
  { canonical: '명랑스러운', polarity: 'positive', category: '관계', synonyms: ['낭창한'], frequency: 0 },
  { canonical: '덕성스러운', polarity: 'positive', category: '관계', synonyms: [], frequency: 0 },
  { canonical: '얌전한', polarity: 'positive', category: '관계', synonyms: ['얌전스러운'], frequency: 0 },
  { canonical: '쌀쌀맞은', polarity: 'negative', category: '관계', synonyms: ['쌀쌀스러운', '몰풍스러운'], frequency: 0 },
  { canonical: '비열한', polarity: 'negative', category: '관계', synonyms: [], frequency: 0 },
  { canonical: '불량한', polarity: 'negative', category: '관계', synonyms: ['불량스러운'], frequency: 0 },
  { canonical: '옹졸한', polarity: 'negative', category: '관계', synonyms: ['옹한', '고체한'], frequency: 0 },
  { canonical: '극성맞은', polarity: 'negative', category: '관계', synonyms: ['극성스러운'], frequency: 0 },
  { canonical: '꼬부라진', polarity: 'negative', category: '관계', synonyms: [], frequency: 0 },
  { canonical: '매섭다', polarity: 'negative', category: '관계', synonyms: [], frequency: 0 },
  { canonical: '호승한', polarity: 'negative', category: '관계', synonyms: [], frequency: 0 },
  { canonical: '준려한', polarity: 'negative', category: '관계', synonyms: [], frequency: 0 },

  // --- 의지력 (국어원) ---
  { canonical: '강경한', polarity: 'positive', category: '의지력', synonyms: [], frequency: 0 },
  { canonical: '완강한', polarity: 'positive', category: '의지력', synonyms: [], frequency: 0 },
  { canonical: '강퍅한', polarity: 'negative', category: '의지력', synonyms: [], frequency: 0 },

  // --- 안정감 (국어원) ---
  { canonical: '종용한', polarity: 'positive', category: '안정감', synonyms: [], frequency: 0 },
  { canonical: '침중한', polarity: 'positive', category: '안정감', synonyms: [], frequency: 0 },
  { canonical: '차근한', polarity: 'positive', category: '안정감', synonyms: ['차근차근한'], frequency: 0 },
  { canonical: '눅지근한', polarity: 'positive', category: '안정감', synonyms: [], frequency: 0 },
  { canonical: '안달스러운', polarity: 'negative', category: '안정감', synonyms: [], frequency: 0 },
  { canonical: '괄괄한', polarity: 'negative', category: '안정감', synonyms: ['괄한'], frequency: 0 },

  // --- 진실성 (국어원) ---
  { canonical: '청렴한', polarity: 'positive', category: '진실성', synonyms: ['청빈한', '청직한'], frequency: 0 },
  { canonical: '청량한', polarity: 'positive', category: '진실성', synonyms: [], frequency: 0 },
  { canonical: '탄솔한', polarity: 'positive', category: '진실성', synonyms: [], frequency: 0 },
  { canonical: '호매한', polarity: 'positive', category: '진실성', synonyms: [], frequency: 0 },
  { canonical: '졸직한', polarity: 'negative', category: '진실성', synonyms: [], frequency: 0 },
  { canonical: '못된', polarity: 'negative', category: '진실성', synonyms: [], frequency: 0 },
];

// ============================================================
// 카테고리 메타데이터
// ============================================================
export const TAG_CATEGORIES = {
  실행력: {
    hexaco: 'Conscientiousness',
    axes: ['조직성', '근면성', '완벽주의', '신중함'] as const,
    description: '계획, 실천, 추진',
  },
  사고력: {
    hexaco: 'Openness',
    axes: ['심미감', '호기심', '창의성', '비관습성'] as const,
    description: '분석, 창의, 호기심',
  },
  감성: {
    hexaco: 'Emotionality',
    axes: ['공포민감성', '불안', '의존성', '감상성'] as const,
    description: '감정 표현, 공감, 감수성',
  },
  관계: {
    hexaco: 'Extraversion+Agreeableness',
    axes: ['사교성', '활력', '관용성', '온화성', '융통성', '인내심'] as const,
    description: '소통, 협력, 사교',
  },
  의지력: {
    hexaco: 'Grit',
    axes: ['대담성', '사회적자존감', '인내', '극복'] as const,
    description: '끈기, 인내, 극복',
  },
  안정감: {
    hexaco: 'Emotional Stability',
    axes: ['침착', '자기조절', '일관성', '평정심'] as const,
    description: '평정심, 자기조절, 일관',
  },
  진실성: {
    hexaco: 'Honesty-Humility',
    axes: ['진실성', '공정성', '탐욕회피', '겸손성'] as const,
    description: '정직, 겸손, 공정',
  },
} as const;

// ============================================================
// 유틸리티: 빠른 태그 조회 맵
// ============================================================

/** raw 태그 → canonical 태그 매핑 (동의어 포함) */
export const TAG_LOOKUP: Map<string, string> = new Map();

/** canonical 태그 → TraitTagEntry 매핑 */
export const TAG_ENTRY_MAP: Map<string, TraitTagEntry> = new Map();

// 초기화
for (const entry of TRAIT_TAG_DICTIONARY) {
  TAG_LOOKUP.set(entry.canonical, entry.canonical);
  TAG_ENTRY_MAP.set(entry.canonical, entry);
  for (const syn of entry.synonyms) {
    TAG_LOOKUP.set(syn, entry.canonical);
  }
}

/**
 * raw 태그명으로 정규화된 엔트리를 찾습니다.
 * @returns TraitTagEntry | undefined
 */
export function lookupTag(raw: string): TraitTagEntry | undefined {
  const canonical = TAG_LOOKUP.get(raw);
  if (!canonical) return undefined;
  return TAG_ENTRY_MAP.get(canonical);
}

/**
 * 카테고리별 태그 목록을 반환합니다.
 */
export function getTagsByCategory(category: TagCategory): TraitTagEntry[] {
  return TRAIT_TAG_DICTIONARY.filter((t) => t.category === category);
}

/**
 * positive/negative 별 태그 목록을 반환합니다.
 */
export function getTagsByPolarity(polarity: TagPolarity): TraitTagEntry[] {
  return TRAIT_TAG_DICTIONARY.filter((t) => t.polarity === polarity);
}

// ============================================================
// 제외된 태그 목록 (사주/운세/비형용사)
// ============================================================
export const EXCLUDED_TAGS: string[] = [
  // 사주/운세 관련
  '재물운있는',
  '재물운강한',
  '운이좋은',
  '재물운 있는',
  '운 좋은',
  '운이강한',
  '재물복있는',

  // 비형용사/명사구/문장형 (성격 태그로 부적합)
  '깊은마음',
  '묵직한힘',
  '내면열정',
  '빠른적응',
  '깊은생각',
  '넓은시야',
  '깊은신뢰',
  '강한의지',
  '높은기준',
  '강한책임',
  '깊은내면',
  '강한끈기',
  '깊은배려',
  '넓은포용',
  '깊은사고',
  '강한집중',
  '높은자존',
  '깊은통찰',
  '강한신념',
  '깊은감성',
  '강한추진',
  '높은원칙',
  '깊은인내',
  '강한열정',
  '깊은공감',
];
