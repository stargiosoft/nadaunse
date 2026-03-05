/**
 * 사주 정보 카드 공통 컴포넌트
 * - FreeSajuSelectPage, SajuSelectPage, SajuManagementPage에서 공통 사용
 * - 프로필 이미지, 이름, 생년월일, 띠|별자리|성별 표시
 */

import React from 'react';
import { getZodiacImageUrl } from '../lib/zodiacUtils';
import { getChineseZodiacByLichun } from '../lib/zodiacCalculator';

// 케밥 메뉴 아이콘 SVG path (가로 점 3개 - SajuManagementPage 동일)
const KEBAB_ICON_PATH = "M3.00033 6.83333C3.30955 6.83342 3.60584 6.95652 3.82454 7.17513C4.04334 7.39392 4.16634 7.69091 4.16634 8.00033C4.16626 8.30963 4.04326 8.60583 3.82454 8.82454C3.60583 9.04326 3.30963 9.16626 3.00033 9.16634C2.69091 9.16634 2.39392 9.04334 2.17513 8.82454C1.95652 8.60584 1.83342 8.30955 1.83333 8.00033C1.83333 7.69091 1.95634 7.39392 2.17513 7.17513C2.39392 6.95634 2.69091 6.83333 3.00033 6.83333ZM8.00033 6.83333C8.30955 6.83342 8.60584 6.95652 8.82454 7.17513C9.04334 7.39392 9.16634 7.69091 9.16634 8.00033C9.16626 8.30963 9.04326 8.60583 8.82454 8.82454C8.60583 9.04326 8.30963 9.16626 8.00033 9.16634C7.69091 9.16634 7.39392 9.04334 7.17513 8.82454C6.95652 8.60584 6.83342 8.30955 6.83333 8.00033C6.83333 7.69091 6.95634 7.39392 7.17513 7.17513C7.39392 6.95634 7.69091 6.83333 8.00033 6.83333ZM13.0003 6.83333C13.3096 6.83342 13.6058 6.95652 13.8245 7.17513C14.0433 7.39392 14.1663 7.69091 14.1663 8.00033C14.1663 8.30963 14.0433 8.60583 13.8245 8.82454C13.6058 9.04326 13.3096 9.16626 13.0003 9.16634C12.6909 9.16634 12.3939 9.04334 12.1751 8.82454C11.9565 8.60584 11.8334 8.30955 11.8333 8.00033C11.8333 7.69091 11.9563 7.39392 12.1751 7.17513C12.3939 6.95634 12.6909 6.83333 13.0003 6.83333Z";

export interface SajuCardData {
  id: string;
  full_name: string;
  gender: 'female' | 'male' | string;
  birth_date: string;
  birth_time?: string;
  notes?: string;
  is_primary?: boolean;
  calendar_type?: string;
  zodiac?: string;
}

interface SajuCardProps {
  saju: SajuCardData;
  isSelected?: boolean;
  onSelect?: () => void;
  onKebabClick?: (event: React.MouseEvent) => void;
  showRadio?: boolean;
  className?: string;
}

/**
 * 띠 계산 (입춘 기준)
 */
const getChineseZodiac = (birthDate: string, birthTime?: string): string => {
  return getChineseZodiacByLichun(birthDate, birthTime);
};

/**
 * 생년월일 포맷팅 (예: "양력 1991.12.25")
 */
const formatBirthDate = (birthDate: string, calendarType?: string): string => {
  const dateOnly = birthDate.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  const calendarPrefix = calendarType === 'lunar' ? '음력' : '양력';
  return `${calendarPrefix} ${year}.${month}.${day}`;
};


export default function SajuCard({
  saju,
  isSelected = false,
  onSelect,
  onKebabClick,
  showRadio = true,
  className = '',
}: SajuCardProps) {
  const zodiac = saju.zodiac || getChineseZodiac(saju.birth_date, saju.birth_time);

  return (
    <div
      className={`flex items-start justify-between relative shrink-0 w-full ${className}`}
      style={{ paddingBottom: '10px', paddingTop: '4px' }}
      onClick={onSelect}
    >
      <div className="flex flex-1 gap-[10px] items-center min-w-0" style={{ paddingTop: '6px' }}>
        {/* Radio + Image grouped */}
        <div className="flex gap-[4px] items-center shrink-0">
          {showRadio && (
            <div className="flex items-center justify-center shrink-0 size-[36px]">
              <div
                className={`flex items-center justify-center rounded-full shrink-0 size-[24px] border-2 ${
                  isSelected ? 'border-[#48b2af]' : 'border-[#e7e7e7]'
                } cursor-pointer`}
              >
                {isSelected && (
                  <div className="bg-[#48b2af] rounded-full size-[12px]" />
                )}
              </div>
            </div>
          )}
          <div className="relative shrink-0 size-[44px] overflow-hidden transform-gpu" style={{ borderRadius: '14px' }}>
            <img
              alt={zodiac}
              className="absolute inset-0 max-w-none object-cover size-full"
              src={getZodiacImageUrl(zodiac)}
              loading="lazy"
            />
          </div>
        </div>

        {/* Text info */}
        <div className="flex flex-col min-w-0" style={{ gap: '3px' }}>
          <p className="min-w-0" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '-0.42px', color: '#000000' }}>
            {saju.full_name}{saju.notes && ` (${saju.notes})`}
          </p>
          <p style={{ fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484' }}>
            {formatBirthDate(saju.birth_date, saju.calendar_type)}
          </p>
        </div>
      </div>

      {/* Kebab button */}
      {onKebabClick && (
        <div
          onClick={(event) => {
            event.stopPropagation();
            onKebabClick(event);
          }}
          className="group flex items-center justify-center p-[4px] rounded-[8px] shrink-0 size-[36px] cursor-pointer transition-colors duration-200 active:bg-gray-100 pointer-events-auto z-10"
        >
          <div className="relative shrink-0 size-[16px] transition-transform duration-200 group-active:scale-90">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
              <path d={KEBAB_ICON_PATH} fill="#B7B7B7" stroke="#B7B7B7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
