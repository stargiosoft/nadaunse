/**
 * 입춘 기준 띠(12지) 계산 모듈
 *
 * 핵심 규칙:
 * - 띠(년지)는 양력 1/1이 아닌 "입춘(立春)" 기준으로 바뀜
 * - 출생시각이 해당 연도 입춘 이전이면 간지연도 = 양력연도 - 1
 * - 출생시각이 해당 연도 입춘 이후이면 간지연도 = 양력연도
 */

// ============================================================
// 상수 정의
// ============================================================

/** 12지지 (子~亥) */
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 지지 → 띠 라벨 매핑 */
export const BRANCH_TO_ZODIAC: Record<string, string> = {
  '子': '쥐띠',
  '丑': '소띠',
  '寅': '호랑이띠',
  '卯': '토끼띠',
  '辰': '용띠',
  '巳': '뱀띠',
  '午': '말띠',
  '未': '양띠',
  '申': '원숭이띠',
  '酉': '닭띠',
  '戌': '개띠',
  '亥': '돼지띠',
};

/** 띠 라벨 배열 (인덱스 순서) */
export const ZODIAC_LABELS = ['쥐띠', '소띠', '호랑이띠', '토끼띠', '용띠', '뱀띠', '말띠', '양띠', '원숭이띠', '닭띠', '개띠', '돼지띠'] as const;

// ============================================================
// 입춘 시각 테이블 (KST 기준)
// 출처: 한국천문연구원 절기표
// 형식: [월, 일, 시, 분] - KST
// ============================================================

/**
 * 연도별 입춘 절입 시각 테이블
 * 키: 양력 연도
 * 값: [월, 일, 시, 분] (KST)
 *
 * 주의: 입춘은 해당 연도의 2월에 발생하지만,
 * 그 입춘 이전에 태어난 사람은 전년도 간지를 사용
 */
export const LICHUN_TABLE: Record<number, [number, number, number, number]> = {
  // 1950년대
  1950: [2, 4, 17, 21],
  1951: [2, 4, 23, 14],
  1952: [2, 5, 5, 3],
  1953: [2, 4, 10, 46],
  1954: [2, 4, 16, 31],
  1955: [2, 4, 22, 18],
  1956: [2, 5, 4, 12],
  1957: [2, 4, 10, 4],
  1958: [2, 4, 15, 50],
  1959: [2, 4, 21, 43],

  // 1960년대
  1960: [2, 5, 3, 23],
  1961: [2, 4, 9, 23],
  1962: [2, 4, 15, 18],
  1963: [2, 4, 21, 8],
  1964: [2, 5, 3, 5],
  1965: [2, 4, 8, 46],
  1966: [2, 4, 14, 38],
  1967: [2, 4, 20, 31],
  1968: [2, 5, 2, 8],
  1969: [2, 4, 8, 0],

  // 1970년대
  1970: [2, 4, 13, 46],
  1971: [2, 4, 19, 26],
  1972: [2, 5, 1, 20],
  1973: [2, 4, 7, 4],
  1974: [2, 4, 12, 59],
  1975: [2, 4, 18, 59],
  1976: [2, 5, 0, 40],
  1977: [2, 4, 6, 34],
  1978: [2, 4, 12, 27],
  1979: [2, 4, 18, 13],

  // 1980년대
  1980: [2, 5, 0, 10],
  1981: [2, 4, 5, 56],
  1982: [2, 4, 11, 46],
  1983: [2, 4, 17, 40],
  1984: [2, 4, 23, 19],
  1985: [2, 4, 5, 12],
  1986: [2, 4, 11, 8],
  1987: [2, 4, 16, 52],
  1988: [2, 4, 22, 43],
  1989: [2, 4, 4, 27],

  // 1990년대
  1990: [2, 4, 10, 15],
  1991: [2, 4, 16, 8],
  1992: [2, 4, 21, 48],
  1993: [2, 4, 3, 38],
  1994: [2, 4, 9, 31],
  1995: [2, 4, 15, 14],
  1996: [2, 4, 21, 8],
  1997: [2, 4, 2, 52],
  1998: [2, 4, 8, 58],
  1999: [2, 4, 14, 57],

  // 2000년대
  2000: [2, 4, 20, 40],
  2001: [2, 4, 2, 29],
  2002: [2, 4, 8, 24],
  2003: [2, 4, 14, 5],
  2004: [2, 4, 19, 56],
  2005: [2, 4, 1, 43],
  2006: [2, 4, 7, 27],
  2007: [2, 4, 13, 18],
  2008: [2, 4, 19, 0],
  2009: [2, 4, 0, 50],

  // 2010년대
  2010: [2, 4, 6, 48],
  2011: [2, 4, 12, 33],
  2012: [2, 4, 18, 22],
  2013: [2, 4, 0, 13],
  2014: [2, 4, 6, 3],
  2015: [2, 4, 11, 58],
  2016: [2, 4, 17, 46],
  2017: [2, 3, 23, 34],
  2018: [2, 4, 5, 28],
  2019: [2, 4, 11, 14],

  // 2020년대
  2020: [2, 4, 17, 3],
  2021: [2, 3, 22, 59],
  2022: [2, 4, 4, 51],
  2023: [2, 4, 10, 43],
  2024: [2, 4, 16, 27],
  2025: [2, 3, 22, 10],
  2026: [2, 4, 4, 2],
  2027: [2, 4, 9, 46],
  2028: [2, 4, 15, 31],
  2029: [2, 3, 21, 20],

  // 2030년대
  2030: [2, 4, 3, 8],
  2031: [2, 4, 8, 58],
  2032: [2, 4, 14, 49],
  2033: [2, 3, 20, 41],
  2034: [2, 4, 2, 41],
  2035: [2, 4, 8, 31],
  2036: [2, 4, 14, 19],
  2037: [2, 3, 20, 11],
  2038: [2, 4, 2, 2],
  2039: [2, 4, 7, 51],
  2040: [2, 4, 13, 30],
};

// ============================================================
// 타입 정의
// ============================================================

export type EarthlyBranch = typeof EARTHLY_BRANCHES[number];
export type ZodiacLabel = typeof ZODIAC_LABELS[number];

export interface ZodiacResult {
  /** 년지 (子~亥) */
  yearBranch: EarthlyBranch;
  /** 띠 라벨 (쥐띠~돼지띠) */
  zodiacLabel: ZodiacLabel;
  /** 간지 연도 (입춘 보정 적용) */
  ganzhiYear: number;
  /** 입춘 보정 여부 (true = 전년도로 보정됨) */
  adjustedToPreviousYear: boolean;
  /** 폴백 사용 여부 */
  usedFallback: boolean;
}

export interface ParsedBirthDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 생년월일시 문자열 파싱
 * @param birthDateTime "YYYYMMDDHHmm" 형식
 */
export function parseBirthDateTime(birthDateTime: string): ParsedBirthDateTime {
  if (birthDateTime.length !== 12) {
    throw new Error(`Invalid birthDateTime format: ${birthDateTime}. Expected YYYYMMDDHHmm`);
  }

  const year = parseInt(birthDateTime.substring(0, 4), 10);
  const month = parseInt(birthDateTime.substring(4, 6), 10);
  const day = parseInt(birthDateTime.substring(6, 8), 10);
  const hour = parseInt(birthDateTime.substring(8, 10), 10);
  const minute = parseInt(birthDateTime.substring(10, 12), 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    throw new Error(`Invalid birthDateTime values: ${birthDateTime}`);
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Invalid birthDateTime range: ${birthDateTime}`);
  }

  return { year, month, day, hour, minute };
}

/**
 * ISO 형식 날짜 문자열을 YYYYMMDDHHmm 형식으로 변환
 * @param isoDate ISO 형식 또는 YYYY-MM-DD 형식
 * @param birthTime HH:mm 형식 (옵션)
 */
export function convertToYYYYMMDDHHmm(isoDate: string, birthTime?: string): string {
  // ISO 형식: "1991-12-25T09:00:00+09:00" 또는 "1991-12-25"
  const datePart = isoDate.split('T')[0];
  const [year, month, day] = datePart.split('-');

  let hour = '00';
  let minute = '00';

  if (birthTime) {
    // birthTime이 "오시", "자시" 등 한글인 경우 처리
    const timeMap: Record<string, string> = {
      '자시': '00:00', '축시': '02:00', '인시': '04:00', '묘시': '06:00',
      '진시': '08:00', '사시': '10:00', '오시': '12:00', '미시': '14:00',
      '신시': '16:00', '유시': '18:00', '술시': '20:00', '해시': '22:00',
    };

    const mappedTime = timeMap[birthTime];
    if (mappedTime) {
      [hour, minute] = mappedTime.split(':');
    } else if (birthTime.includes(':')) {
      [hour, minute] = birthTime.split(':');
    }
  } else if (isoDate.includes('T')) {
    // ISO 형식에서 시간 추출
    const timePart = isoDate.split('T')[1];
    if (timePart) {
      const timeOnly = timePart.split('+')[0].split('-')[0].split('Z')[0];
      const [h, m] = timeOnly.split(':');
      hour = h || '00';
      minute = m || '00';
    }
  }

  return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}${hour.padStart(2, '0')}${minute.padStart(2, '0')}`;
}

/**
 * 해당 연도의 입춘 시각을 Date 객체로 반환 (KST)
 * @param year 양력 연도
 * @returns { lichunDate: Date, usedFallback: boolean }
 */
export function getLichunDateTime(year: number): { lichunDate: Date; usedFallback: boolean } {
  const lichunData = LICHUN_TABLE[year];

  if (lichunData) {
    const [month, day, hour, minute] = lichunData;
    // KST로 Date 생성 (UTC+9)
    const lichunDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    return { lichunDate, usedFallback: false };
  }

  // 폴백: 테이블에 없는 연도는 2월 4일 00:00 KST로 근사
  console.warn(`⚠️ [zodiacCalculator] 입춘 데이터 없음 (year=${year}). 폴백 사용: 2월 4일 00:00 KST`);
  const fallbackDate = new Date(year, 1, 4, 0, 0, 0, 0);
  return { lichunDate: fallbackDate, usedFallback: true };
}

/**
 * 출생일시가 해당 연도 입춘 이전인지 확인
 * @param birth ParsedBirthDateTime
 * @returns { isBeforeLichun: boolean, usedFallback: boolean }
 */
export function isBeforeLichun(birth: ParsedBirthDateTime): { isBeforeLichun: boolean; usedFallback: boolean } {
  const birthDate = new Date(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute, 0, 0);
  const { lichunDate, usedFallback } = getLichunDateTime(birth.year);

  return {
    isBeforeLichun: birthDate.getTime() < lichunDate.getTime(),
    usedFallback,
  };
}

// ============================================================
// 핵심 계산 함수
// ============================================================

/**
 * 간지 연도에서 년지(지지) 인덱스 계산
 *
 * 계산 원리:
 * - 기준: 서기 4년 = 甲子년 (갑자년)
 * - 60갑자 중 지지는 12개 순환
 * - (간지연도 - 4) % 12 = 지지 인덱스 (0=子, 1=丑, ..., 11=亥)
 *
 * @param ganzhiYear 간지 연도 (입춘 보정 적용된 연도)
 * @returns 지지 인덱스 (0~11)
 */
export function getYearBranchIndex(ganzhiYear: number): number {
  // (연도 - 4) % 12 계산
  // 음수 처리: JavaScript의 % 연산자는 음수를 반환할 수 있음
  let index = (ganzhiYear - 4) % 12;
  if (index < 0) index += 12;
  return index;
}

/**
 * 입춘 기준 띠 계산 (메인 함수)
 *
 * @param birthDateTime "YYYYMMDDHHmm" 형식의 생년월일시 (양력, KST)
 * @returns ZodiacResult
 *
 * @example
 * // 2003-01-09 07:00 → 2003년 입춘(2/4 14:05) 이전 → 간지연도 2002 → 午(말띠)
 * calculateZodiac("200301090700")
 * // { yearBranch: "午", zodiacLabel: "말띠", ganzhiYear: 2002, adjustedToPreviousYear: true }
 */
export function calculateZodiac(birthDateTime: string): ZodiacResult {
  const birth = parseBirthDateTime(birthDateTime);
  const { isBeforeLichun: beforeLichun, usedFallback } = isBeforeLichun(birth);

  // 간지 연도 결정 (입춘 이전이면 전년도)
  const ganzhiYear = beforeLichun ? birth.year - 1 : birth.year;

  // 년지 인덱스 계산
  const branchIndex = getYearBranchIndex(ganzhiYear);

  // 결과 반환
  const yearBranch = EARTHLY_BRANCHES[branchIndex];
  const zodiacLabel = ZODIAC_LABELS[branchIndex];

  return {
    yearBranch,
    zodiacLabel,
    ganzhiYear,
    adjustedToPreviousYear: beforeLichun,
    usedFallback,
  };
}

/**
 * 기존 인터페이스 호환용 함수
 * ISO 형식 날짜와 시간을 받아 띠 라벨만 반환
 *
 * @param birthDate ISO 형식 날짜 ("1991-12-25" 또는 "1991-12-25T09:00:00+09:00")
 * @param birthTime 시간 문자열 (옵션, "HH:mm" 또는 "오시" 등)
 * @returns 띠 라벨 (예: "양띠")
 */
export function getChineseZodiacByLichun(birthDate: string, birthTime?: string): string {
  try {
    const birthDateTime = convertToYYYYMMDDHHmm(birthDate, birthTime);
    const result = calculateZodiac(birthDateTime);
    return result.zodiacLabel;
  } catch (error) {
    console.error('❌ [zodiacCalculator] 띠 계산 실패:', error);
    // 폴백: 단순 연도 계산
    const year = parseInt(birthDate.substring(0, 4), 10);
    const index = getYearBranchIndex(year);
    return ZODIAC_LABELS[index];
  }
}

/**
 * 간단한 띠 계산 (기존 로직 대체용)
 * birth_date만 있고 정확한 시간을 모를 때 사용
 *
 * 주의: 이 함수는 입춘 경계 케이스에서 부정확할 수 있음
 * 가능하면 getChineseZodiacByLichun을 사용할 것
 *
 * @param birthDate YYYY-MM-DD 또는 ISO 형식
 */
export function getChineseZodiacSimple(birthDate: string): string {
  // 시간을 12:00(정오)로 가정하여 계산
  return getChineseZodiacByLichun(birthDate, '12:00');
}

// ============================================================
// 디버그/모니터링 유틸리티
// ============================================================

/**
 * 입춘 경계 케이스 여부 확인 (모니터링용)
 * 입춘 전후 24시간 이내 출생자는 경계 케이스로 분류
 *
 * @param birthDateTime "YYYYMMDDHHmm" 형식
 * @returns 경계 케이스 여부 및 상세 정보
 */
export function checkLichunBoundaryCase(birthDateTime: string): {
  isBoundaryCase: boolean;
  hoursFromLichun: number;
  lichunDateTime: string;
} {
  const birth = parseBirthDateTime(birthDateTime);
  const birthDate = new Date(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
  const { lichunDate } = getLichunDateTime(birth.year);

  const diffMs = birthDate.getTime() - lichunDate.getTime();
  const hoursFromLichun = diffMs / (1000 * 60 * 60);

  return {
    isBoundaryCase: Math.abs(hoursFromLichun) <= 24,
    hoursFromLichun: Math.round(hoursFromLichun * 100) / 100,
    lichunDateTime: lichunDate.toISOString(),
  };
}

/**
 * 특정 연도의 입춘 정보 조회 (디버그용)
 */
export function getLichunInfo(year: number): {
  year: number;
  lichunDate: string;
  lichunTime: string;
  usedFallback: boolean;
} {
  const { lichunDate, usedFallback } = getLichunDateTime(year);

  return {
    year,
    lichunDate: `${lichunDate.getFullYear()}-${String(lichunDate.getMonth() + 1).padStart(2, '0')}-${String(lichunDate.getDate()).padStart(2, '0')}`,
    lichunTime: `${String(lichunDate.getHours()).padStart(2, '0')}:${String(lichunDate.getMinutes()).padStart(2, '0')}`,
    usedFallback,
  };
}
