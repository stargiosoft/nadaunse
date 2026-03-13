/**
 * 십성(十星) 계산 유틸리티
 * 두 사람의 일간(천간)을 비교하여 십성 관계를 판별
 *
 * 십성: 상대가 나에게 어떤 역할인지
 * - 오행 관계 (비화/식상/재성/관성/인성) + 음양 비교 (편/정) → 10가지
 */

import type { DayMaster } from './dayMaster';

export const SIPSUNG_TYPES = [
  '비견', '겁재', '식신', '상관', '편재',
  '정재', '편관', '정관', '편인', '정인',
] as const;

export type SipsungType = typeof SIPSUNG_TYPES[number];

/** 천간 → 오행 */
const ELEMENT: Record<DayMaster, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

/** 천간 → 양(true) / 음(false) */
const IS_YANG: Record<DayMaster, boolean> = {
  '갑': true, '을': false,
  '병': true, '정': false,
  '무': true, '기': false,
  '경': true, '신': false,
  '임': true, '계': false,
};

/** 상생: key가 value를 생함 (목→화→토→금→수→목) */
const GENERATES: Record<string, string> = {
  '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
};

/** 상극: key가 value를 극함 (목→토→수→화→금→목) */
const CONTROLS: Record<string, string> = {
  '목': '토', '토': '수', '수': '화', '화': '금', '금': '목',
};

/**
 * 십성 판별
 * @param my 내 일간
 * @param partner 상대 일간
 * @returns 상대가 나에게 어떤 십성인지
 *
 * 예) getSipsung('갑', '기') → '정재' (갑이 기를 극, 양≠음 → 정)
 */
export function getSipsung(my: DayMaster, partner: DayMaster): SipsungType {
  const myEl = ELEMENT[my];
  const partnerEl = ELEMENT[partner];
  const sameYinYang = IS_YANG[my] === IS_YANG[partner];

  // 1) 같은 오행 → 비겁
  if (myEl === partnerEl) {
    return sameYinYang ? '비견' : '겁재';
  }

  // 2) 내가 생하는 오행 → 식상
  if (GENERATES[myEl] === partnerEl) {
    return sameYinYang ? '식신' : '상관';
  }

  // 3) 내가 극하는 오행 → 재성
  if (CONTROLS[myEl] === partnerEl) {
    return sameYinYang ? '편재' : '정재';
  }

  // 4) 나를 극하는 오행 → 관성
  if (CONTROLS[partnerEl] === myEl) {
    return sameYinYang ? '편관' : '정관';
  }

  // 5) 나를 생하는 오행 → 인성
  // GENERATES[partnerEl] === myEl
  return sameYinYang ? '편인' : '정인';
}

/** 십성 로마자 매핑 (Storage 파일명용) */
export const SIPSUNG_ROMAN: Record<SipsungType, string> = {
  '비견': 'bigyeon',
  '겁재': 'geopjae',
  '식신': 'siksin',
  '상관': 'sanggwan',
  '편재': 'pyeonjae',
  '정재': 'jeongjae',
  '편관': 'pyeongwan',
  '정관': 'jeonggwan',
  '편인': 'pyeonin',
  '정인': 'jeongin',
};
