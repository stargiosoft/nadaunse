/**
 * 사주 정보 카드 공통 컴포넌트
 * - FreeSajuSelectPage, SajuSelectPage, SajuManagementPage에서 공통 사용
 * - 프로필 이미지, 이름, 생년월일, 띠|별자리|성별 표시
 */

import React from 'react';
import { getZodiacImageUrl, getConstellation } from '../lib/zodiacUtils';
import { getChineseZodiacByLichun } from '../lib/zodiacCalculator';

// 케밥 메뉴 아이콘 SVG path
const KEBAB_ICON_PATH = "M8 2.75C7.58579 2.75 7.25 3.08579 7.25 3.5C7.25 3.91421 7.58579 4.25 8 4.25C8.41421 4.25 8.75 3.91421 8.75 3.5C8.75 3.08579 8.41421 2.75 8 2.75ZM8 7.25C7.58579 7.25 7.25 7.58579 7.25 8C7.25 8.41421 7.58579 8.75 8 8.75C8.41421 8.75 8.75 8.41421 8.75 8C8.75 7.58579 8.41421 7.25 8 7.25ZM8 11.75C7.58579 11.75 7.25 12.0858 7.25 12.5C7.25 12.9142 7.58579 13.25 8 13.25C8.41421 13.25 8.75 12.9142 8.75 12.5C8.75 12.0858 8.41421 11.75 8 11.75Z";

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

/**
 * 구분자 (|) 컴포넌트
 */
const Separator = () => (
  <div className="h-[6px] relative shrink-0 w-[1px]">
    <div className="absolute inset-[-8.33%_-0.4px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7">
        <path d="M0.5 0.5V6.5" stroke="#D4D4D4" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

export default function SajuCard({
  saju,
  isSelected = false,
  onSelect,
  onKebabClick,
  showRadio = true,
  className = '',
}: SajuCardProps) {
  const zodiac = saju.zodiac || getChineseZodiac(saju.birth_date, saju.birth_time);

  // 별자리 계산
  const getConstellationFromDate = () => {
    const dateOnly = saju.birth_date.split('T')[0];
    const [_, month, day] = dateOnly.split('-');
    return getConstellation(parseInt(month), parseInt(day));
  };

  return (
    <div
      className={`content-stretch flex gap-[11px] items-center px-[8px] py-[12px] relative rounded-[12px] shrink-0 w-full ${className}`}
      onClick={onSelect}
    >
      {/* Radio Button */}
      {showRadio && (
        <div className="content-stretch flex items-center justify-center relative shrink-0 size-[44px]">
          <div
            className={`content-stretch flex items-center justify-center relative rounded-full shrink-0 size-[24px] border-2 ${
              isSelected ? 'border-[#48b2af]' : 'border-[#e7e7e7]'
            } cursor-pointer`}
          >
            {isSelected && (
              <div className="bg-[#48b2af] rounded-full size-[12px]" />
            )}
          </div>
        </div>
      )}

      {/* Profile Image */}
      <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
        <div className="[grid-area:1_/_1] ml-0 mt-0 pointer-events-none relative rounded-[8px] shrink-0 size-[60px]">
          <img
            alt={zodiac}
            className="absolute inset-0 max-w-none object-cover rounded-[8px] size-full"
            src={getZodiacImageUrl(zodiac)}
            loading="lazy"
          />
          <div aria-hidden="true" className="absolute border border-[#f8f8f8] border-solid inset-0 rounded-[8px]" />
        </div>
      </div>

      {/* Info Container */}
      <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          <p className="overflow-ellipsis overflow-hidden relative shrink-0 text-[15px] text-black text-nowrap tracking-[-0.45px]">
            {saju.full_name} {saju.notes && `(${saju.notes})`}
          </p>
          {onKebabClick && (
            <div
              onClick={(event) => {
                event.stopPropagation();
                onKebabClick(event);
              }}
              className="content-stretch flex items-center justify-center p-[4px] relative rounded-[8px] shrink-0 size-[36px] cursor-pointer hover:bg-gray-100"
            >
              <div className="relative shrink-0 size-[16px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                  <path d={KEBAB_ICON_PATH} fill="#848484" stroke="#848484" />
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="content-stretch flex flex-col gap-[3px] items-start relative shrink-0 w-full">
          {/* 생년월일 */}
          <div className="content-stretch flex items-center relative rounded-[12px] shrink-0 w-full">
            <p className="font-normal leading-[16px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#848484] text-[12px] text-nowrap tracking-[-0.24px]">
              {formatBirthDate(saju.birth_date, saju.calendar_type)}
            </p>
          </div>
          {/* 띠 | 별자리 | 성별 */}
          <div className="content-stretch flex gap-[6px] items-center relative rounded-[12px] shrink-0 w-full">
            <p className="font-normal leading-[16px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#848484] text-[12px] text-nowrap tracking-[-0.24px]">
              {zodiac}
            </p>
            <Separator />
            <p className="font-normal leading-[16px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#848484] text-[12px] text-nowrap tracking-[-0.24px]">
              {getConstellationFromDate()}
            </p>
            <Separator />
            <p className="font-normal leading-[16px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#848484] text-[12px] text-nowrap tracking-[-0.24px]">
              {saju.gender === 'female' ? '여성' : '남성'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
