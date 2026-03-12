/**
 * 일간(日干) 계산 유틸리티
 * 생년월일+시간 → 10천간(갑을병정무기경신임계) 매핑
 *
 * 공식: JDN(줄리안일수) 기반 60갑자 순환
 * - 천간 index = (JDN + 9) % 10
 * - 자시(23:00~) → 다음날 일간 적용 (한국 사주 전통)
 */

const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;

export type DayMaster = typeof CHEONGAN[number];

const ELEMENT_MAP: Record<DayMaster, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
};

/** 줄리안일수(JDN) 계산 — 그레고리력 기준 */
function getJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * 일간 계산
 * @param birthDate "YYYY-MM-DD" 형식
 * @param birthTime "HH:MM" 형식 (optional, 기본 "12:00")
 * @returns { dayMaster: '갑'~'계', element: '목'~'수' }
 */
export function getDayMaster(
  birthDate: string,
  birthTime?: string
): { dayMaster: DayMaster; element: string } {
  const datePart = birthDate.includes('T') ? birthDate.split('T')[0] : birthDate;
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  let day = parseInt(dayStr, 10);

  // 자시(23:00~) → 다음날 일간
  if (birthTime) {
    const hour = parseInt(birthTime.split(':')[0], 10);
    if (hour >= 23) {
      const date = new Date(year, month - 1, day + 1);
      year = date.getFullYear();
      month = date.getMonth() + 1;
      day = date.getDate();
    }
  }

  const jdn = getJDN(year, month, day);
  const index = ((jdn + 9) % 10 + 10) % 10; // 음수 방지
  const dayMaster = CHEONGAN[index];

  return {
    dayMaster,
    element: ELEMENT_MAP[dayMaster],
  };
}
