/**
 * 입춘 기준 띠 계산 유닛 테스트
 *
 * 테스트 카테고리:
 * 1. 12띠 기본 테스트 (각 띠 1개씩)
 * 2. 입춘 경계 케이스 (직전/직후 1분 차이)
 * 3. 예시 흐름 검증 (200301090700 → 말띠)
 * 4. 엣지 케이스
 */

import { describe, it, expect } from 'vitest';
import {
  calculateZodiac,
  parseBirthDateTime,
  getYearBranchIndex,
  getLichunDateTime,
  isBeforeLichun,
  getChineseZodiacByLichun,
  getChineseZodiacSimple,
  checkLichunBoundaryCase,
  convertToYYYYMMDDHHmm,
  EARTHLY_BRANCHES,
  ZODIAC_LABELS,
} from './zodiacCalculator';

// ============================================================
// 1. 12띠 기본 테스트 (각 띠 1개씩)
// ============================================================
describe('12띠 기본 테스트', () => {
  const testCases: Array<{ birthDateTime: string; expectedBranch: string; expectedZodiac: string; description: string }> = [
    // 쥐띠 (子) - 2020년생 (입춘 후)
    { birthDateTime: '202003150900', expectedBranch: '子', expectedZodiac: '쥐띠', description: '2020년 3월 15일 (쥐띠)' },
    // 소띠 (丑) - 2021년생 (입춘 후)
    { birthDateTime: '202105201000', expectedBranch: '丑', expectedZodiac: '소띠', description: '2021년 5월 20일 (소띠)' },
    // 호랑이띠 (寅) - 2022년생 (입춘 후)
    { birthDateTime: '202207101200', expectedBranch: '寅', expectedZodiac: '호랑이띠', description: '2022년 7월 10일 (호랑이띠)' },
    // 토끼띠 (卯) - 2023년생 (입춘 후)
    { birthDateTime: '202309251400', expectedBranch: '卯', expectedZodiac: '토끼띠', description: '2023년 9월 25일 (토끼띠)' },
    // 용띠 (辰) - 2024년생 (입춘 후)
    { birthDateTime: '202411111600', expectedBranch: '辰', expectedZodiac: '용띠', description: '2024년 11월 11일 (용띠)' },
    // 뱀띠 (巳) - 2025년생 (입춘 후)
    { birthDateTime: '202503010800', expectedBranch: '巳', expectedZodiac: '뱀띠', description: '2025년 3월 1일 (뱀띠)' },
    // 말띠 (午) - 2002년생 (입춘 후)
    { birthDateTime: '200206150900', expectedBranch: '午', expectedZodiac: '말띠', description: '2002년 6월 15일 (말띠)' },
    // 양띠 (未) - 2003년생 (입춘 후)
    { birthDateTime: '200308201000', expectedBranch: '未', expectedZodiac: '양띠', description: '2003년 8월 20일 (양띠)' },
    // 원숭이띠 (申) - 2016년생 (입춘 후)
    { birthDateTime: '201604151200', expectedBranch: '申', expectedZodiac: '원숭이띠', description: '2016년 4월 15일 (원숭이띠)' },
    // 닭띠 (酉) - 2017년생 (입춘 후)
    { birthDateTime: '201706201400', expectedBranch: '酉', expectedZodiac: '닭띠', description: '2017년 6월 20일 (닭띠)' },
    // 개띠 (戌) - 2018년생 (입춘 후)
    { birthDateTime: '201809101600', expectedBranch: '戌', expectedZodiac: '개띠', description: '2018년 9월 10일 (개띠)' },
    // 돼지띠 (亥) - 2019년생 (입춘 후)
    { birthDateTime: '201912251800', expectedBranch: '亥', expectedZodiac: '돼지띠', description: '2019년 12월 25일 (돼지띠)' },
  ];

  testCases.forEach(({ birthDateTime, expectedBranch, expectedZodiac, description }) => {
    it(description, () => {
      const result = calculateZodiac(birthDateTime);
      expect(result.yearBranch).toBe(expectedBranch);
      expect(result.zodiacLabel).toBe(expectedZodiac);
    });
  });
});

// ============================================================
// 2. 입춘 경계 케이스 테스트
// ============================================================
describe('입춘 경계 케이스', () => {
  /**
   * 2003년 입춘: 2월 4일 14:05 KST
   * - 14:04 이전 → 2002년 (말띠)
   * - 14:05 이후 → 2003년 (양띠)
   */
  describe('2003년 입춘 (2/4 14:05)', () => {
    it('입춘 1분 전 (14:04) → 말띠', () => {
      const result = calculateZodiac('200302041404');
      expect(result.zodiacLabel).toBe('말띠');
      expect(result.yearBranch).toBe('午');
      expect(result.ganzhiYear).toBe(2002);
      expect(result.adjustedToPreviousYear).toBe(true);
    });

    it('입춘 정각 (14:05) → 양띠', () => {
      const result = calculateZodiac('200302041405');
      expect(result.zodiacLabel).toBe('양띠');
      expect(result.yearBranch).toBe('未');
      expect(result.ganzhiYear).toBe(2003);
      expect(result.adjustedToPreviousYear).toBe(false);
    });

    it('입춘 1분 후 (14:06) → 양띠', () => {
      const result = calculateZodiac('200302041406');
      expect(result.zodiacLabel).toBe('양띠');
      expect(result.yearBranch).toBe('未');
      expect(result.ganzhiYear).toBe(2003);
      expect(result.adjustedToPreviousYear).toBe(false);
    });
  });

  /**
   * 2024년 입춘: 2월 4일 16:27 KST
   */
  describe('2024년 입춘 (2/4 16:27)', () => {
    it('입춘 당일 아침 (08:00) → 토끼띠', () => {
      const result = calculateZodiac('202402040800');
      expect(result.zodiacLabel).toBe('토끼띠');
      expect(result.ganzhiYear).toBe(2023);
      expect(result.adjustedToPreviousYear).toBe(true);
    });

    it('입춘 1분 전 (16:26) → 토끼띠', () => {
      const result = calculateZodiac('202402041626');
      expect(result.zodiacLabel).toBe('토끼띠');
      expect(result.adjustedToPreviousYear).toBe(true);
    });

    it('입춘 정각 (16:27) → 용띠', () => {
      const result = calculateZodiac('202402041627');
      expect(result.zodiacLabel).toBe('용띠');
      expect(result.adjustedToPreviousYear).toBe(false);
    });

    it('입춘 1분 후 (16:28) → 용띠', () => {
      const result = calculateZodiac('202402041628');
      expect(result.zodiacLabel).toBe('용띠');
      expect(result.adjustedToPreviousYear).toBe(false);
    });
  });

  /**
   * 1991년 입춘: 2월 4일 16:08 KST
   * 스크린샷 예시: 1991.12.25 → 양띠
   */
  describe('1991년 케이스 (스크린샷 예시)', () => {
    it('1991년 12월 25일 → 양띠 (입춘 이후이므로 1991년)', () => {
      const result = calculateZodiac('199112250900');
      expect(result.zodiacLabel).toBe('양띠');
      expect(result.yearBranch).toBe('未');
      expect(result.ganzhiYear).toBe(1991);
      expect(result.adjustedToPreviousYear).toBe(false);
    });

    it('1991년 1월 15일 → 말띠 (입춘 이전이므로 1990년)', () => {
      const result = calculateZodiac('199101150900');
      expect(result.zodiacLabel).toBe('말띠');
      expect(result.yearBranch).toBe('午');
      expect(result.ganzhiYear).toBe(1990);
      expect(result.adjustedToPreviousYear).toBe(true);
    });
  });
});

// ============================================================
// 3. 예시 흐름 검증: 200301090700 → 말띠
// ============================================================
describe('예시 흐름 검증: 200301090700 → 말띠', () => {
  /**
   * 계산 흐름:
   * 1. 입력: 2003-01-09 07:00 KST
   * 2. 2003년 입춘: 2003-02-04 14:05 KST
   * 3. 2003-01-09 < 2003-02-04 → 입춘 이전
   * 4. 간지 연도 = 2003 - 1 = 2002
   * 5. 년지 인덱스 = (2002 - 4) % 12 = 1998 % 12 = 6
   * 6. EARTHLY_BRANCHES[6] = "午"
   * 7. ZODIAC_LABELS[6] = "말띠"
   */
  it('전체 계산 흐름 검증', () => {
    const birthDateTime = '200301090700';
    const result = calculateZodiac(birthDateTime);

    // Step 1: 파싱 검증
    const parsed = parseBirthDateTime(birthDateTime);
    expect(parsed).toEqual({ year: 2003, month: 1, day: 9, hour: 7, minute: 0 });

    // Step 2: 입춘 이전 여부
    const { isBeforeLichun: beforeLichun } = isBeforeLichun(parsed);
    expect(beforeLichun).toBe(true);

    // Step 3: 간지 연도
    expect(result.ganzhiYear).toBe(2002);

    // Step 4: 년지 인덱스
    const branchIndex = getYearBranchIndex(2002);
    expect(branchIndex).toBe(6);

    // Step 5: 지지
    expect(EARTHLY_BRANCHES[branchIndex]).toBe('午');

    // Step 6: 띠
    expect(result.yearBranch).toBe('午');
    expect(result.zodiacLabel).toBe('말띠');
    expect(result.adjustedToPreviousYear).toBe(true);
  });

  it('동일 연도 입춘 이후 출생자는 양띠', () => {
    // 2003-03-15 → 입춘 이후 → 2003년 → 양띠
    const result = calculateZodiac('200303150900');
    expect(result.zodiacLabel).toBe('양띠');
    expect(result.ganzhiYear).toBe(2003);
    expect(result.adjustedToPreviousYear).toBe(false);
  });
});

// ============================================================
// 4. 유틸리티 함수 테스트
// ============================================================
describe('유틸리티 함수', () => {
  describe('parseBirthDateTime', () => {
    it('정상 파싱', () => {
      expect(parseBirthDateTime('199112250930')).toEqual({
        year: 1991, month: 12, day: 25, hour: 9, minute: 30,
      });
    });

    it('잘못된 형식 에러', () => {
      expect(() => parseBirthDateTime('19911225')).toThrow();
      expect(() => parseBirthDateTime('199113250930')).toThrow(); // month 13
    });
  });

  describe('convertToYYYYMMDDHHmm', () => {
    it('ISO 형식 변환', () => {
      expect(convertToYYYYMMDDHHmm('1991-12-25T09:30:00+09:00')).toBe('199112250930');
    });

    it('날짜만 있을 때', () => {
      expect(convertToYYYYMMDDHHmm('1991-12-25')).toBe('199112250000');
    });

    it('한글 시간 변환', () => {
      expect(convertToYYYYMMDDHHmm('1991-12-25', '오시')).toBe('199112251200');
      expect(convertToYYYYMMDDHHmm('1991-12-25', '자시')).toBe('199112250000');
    });
  });

  describe('getLichunDateTime', () => {
    it('테이블에 있는 연도', () => {
      const { lichunDate, usedFallback } = getLichunDateTime(2024);
      expect(usedFallback).toBe(false);
      expect(lichunDate.getMonth()).toBe(1); // 2월
      expect(lichunDate.getDate()).toBe(4);
      expect(lichunDate.getHours()).toBe(16);
      expect(lichunDate.getMinutes()).toBe(27);
    });

    it('테이블에 없는 연도 (폴백)', () => {
      const { lichunDate, usedFallback } = getLichunDateTime(1900);
      expect(usedFallback).toBe(true);
      expect(lichunDate.getMonth()).toBe(1); // 2월
      expect(lichunDate.getDate()).toBe(4);
      expect(lichunDate.getHours()).toBe(0);
    });
  });

  describe('getYearBranchIndex', () => {
    // 기준: 서기 4년 = 甲子년 (子=쥐띠)
    it('기준년 검증', () => {
      expect(getYearBranchIndex(4)).toBe(0); // 子
      expect(getYearBranchIndex(5)).toBe(1); // 丑
      expect(getYearBranchIndex(15)).toBe(11); // 亥
      expect(getYearBranchIndex(16)).toBe(0); // 子 (12년 주기)
    });

    it('현대 연도', () => {
      expect(getYearBranchIndex(2020)).toBe(0); // 子 (쥐띠)
      expect(getYearBranchIndex(2024)).toBe(4); // 辰 (용띠)
    });
  });

  describe('checkLichunBoundaryCase', () => {
    it('경계 케이스 감지', () => {
      // 2024년 입춘: 2/4 16:27
      const boundary = checkLichunBoundaryCase('202402041627');
      expect(boundary.isBoundaryCase).toBe(true);
      expect(boundary.hoursFromLichun).toBe(0);
    });

    it('비경계 케이스', () => {
      const notBoundary = checkLichunBoundaryCase('202406150900');
      expect(notBoundary.isBoundaryCase).toBe(false);
    });
  });
});

// ============================================================
// 5. 호환성 함수 테스트
// ============================================================
describe('호환성 함수', () => {
  describe('getChineseZodiacByLichun', () => {
    it('ISO 형식 입력', () => {
      expect(getChineseZodiacByLichun('1991-12-25T09:00:00+09:00')).toBe('양띠');
    });

    it('날짜 + 한글 시간', () => {
      expect(getChineseZodiacByLichun('2003-01-09', '오시')).toBe('말띠');
    });
  });

  describe('getChineseZodiacSimple', () => {
    it('간단 계산 (정오 기준)', () => {
      expect(getChineseZodiacSimple('1991-12-25')).toBe('양띠');
      expect(getChineseZodiacSimple('2024-06-15')).toBe('용띠');
    });
  });
});

// ============================================================
// 6. 엣지 케이스
// ============================================================
describe('엣지 케이스', () => {
  it('연초 출생 (입춘 이전)', () => {
    // 2024년 1월 1일 → 2023년 (토끼띠)
    const result = calculateZodiac('202401010000');
    expect(result.zodiacLabel).toBe('토끼띠');
    expect(result.ganzhiYear).toBe(2023);
  });

  it('연말 출생 (입춘 이후)', () => {
    // 2024년 12월 31일 → 2024년 (용띠)
    const result = calculateZodiac('202412312359');
    expect(result.zodiacLabel).toBe('용띠');
    expect(result.ganzhiYear).toBe(2024);
  });

  it('자정 출생', () => {
    // 2003년 2월 4일 00:00 → 입춘(14:05) 이전 → 2002년 (말띠)
    const result = calculateZodiac('200302040000');
    expect(result.zodiacLabel).toBe('말띠');
    expect(result.ganzhiYear).toBe(2002);
  });

  it('과거 연도 (1960년대)', () => {
    // 1964년 3월 15일 → 1964년 (용띠)
    const result = calculateZodiac('196403150900');
    expect(result.zodiacLabel).toBe('용띠');
    expect(result.yearBranch).toBe('辰');
  });
});
