/**
 * 무료 콘텐츠 상세 페이지 UI 컴포넌트 모음
 * 재사용 가능한 UI 컴포넌트들을 모아놓은 파일
 * 
 * @module FreeContentDetailComponents
 */

import { MasterContent, Question } from '../lib/freeContentService';
import { getThumbnailUrl } from '../lib/image';
import { motion } from "motion/react";
import { ChevronRight } from 'lucide-react';
import svgPathsBanner from "../imports/svg-1j0aq37vhy";
import svgPathsSlider from "../imports/svg-4heccierrk";
import svgPathsBack from "../imports/svg-geohasap3g";
import svgPathsHome from "../imports/svg-pz84vpwvud";
import svgPathsMore from "../imports/svg-yzh80oj47m";
import bannerImg from "figma:asset/b236509a5f2172bc63b883ba8abf132659ed54d9.png";

/**
 * 홈 인디케이터 (iOS 스타일)
 */
export function HomeIndicatorLight() {
  return (
    <div className="bg-white h-[28px] relative shrink-0 w-full" />
  );
}

/**
 * 상단 네비게이션 바
 * 
 * @param {Object} props
 * @param {() => void} props.onBack - 뒤로가기 핸들러
 * @param {() => void} props.onHome - 홈 버튼 핸들러
 * @param {string} props.title - 페이지 제목
 */
interface TopNavigationProps {
  onBack: () => void;
  onHome: () => void;
  title: string;
}

export function TopNavigation({ onBack, onHome, title }: TopNavigationProps) {
  return (
    <div className="sticky top-0 flex flex-col w-full z-10 bg-white">
      <div className="flex flex-col relative shrink-0 w-full">
        <div className="bg-white h-[52px] relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="box-border flex flex-col gap-[10px] h-[52px] justify-center px-[12px] py-[4px] relative w-full">
              <div className="flex items-center justify-between relative shrink-0 w-full">
                <div 
                  onClick={onBack}
                  className="box-border flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer group hover:bg-[#F3F3F3] active:bg-[#F3F3F3]"
                >
                  <svg className="block w-6 h-6 group-active:scale-95 transition-transform" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <g id="arrow-left">
                      <path d={svgPathsBack.p2a5cd480} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                      <path d={svgPathsBack.p1a4bb100} opacity="0" stroke="var(--stroke-0, #848484)" />
                    </g>
                  </svg>
                </div>
                <p className="basis-0 font-semibold grow leading-[25.5px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                  {title}
                </p>
                <div 
                  onClick={onHome}
                  className="box-border flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer group hover:bg-[#F3F3F3] active:bg-[#F3F3F3]"
                >
                  <svg className="block w-6 h-6 group-active:scale-95 transition-transform" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <g id="home-2">
                      <path d={svgPathsHome.p3d07f180} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M12 17.99V14.99" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 상품 이미지 및 정보 섹션
 * 
 * @param {Object} props
 * @param {MasterContent} props.content - 콘텐츠 정보
 */
interface ProductInfoProps {
  content: MasterContent;
}

export function ProductInfo({ content }: ProductInfoProps) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      {/* 상품 이미지 */}
      <div className="aspect-[391/270] relative shrink-0 w-full">
        {content.thumbnail_url ? (
          <img 
            alt={content.title} 
            className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" 
            src={content.thumbnail_url} 
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <p className="text-gray-400">이미지 없음</p>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="relative shrink-0 w-full">
        <div className="flex flex-col items-end size-full">
          <div className="box-border content-stretch flex flex-col gap-[16px] items-end px-[20px] py-0 relative w-full">
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full mt-[-8px] mb-[-6px] pb-[8px]">
                {/* 무료 체험판 뱃지 */}
                <div className="bg-[#f9f9f9] box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[8px] shrink-0">
                  <p className="font-medium leading-[16px] not-italic relative shrink-0 text-[#848484] text-[12px] text-nowrap tracking-[-0.24px] whitespace-pre">
                    무료 체험판
                  </p>
                </div>

                {/* 상품 제목 */}
                <div className="relative shrink-0 w-full">
                  <div className="size-full">
                    <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[2px] py-0 relative w-full">
                      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                        <p className="font-semibold leading-[24px] not-italic relative shrink-0 text-[18px] text-black tracking-[-0.36px] w-full">
                          {content.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 운세 설명 섹션
 * 
 * @param {Object} props
 * @param {string} props.description - 운세 설명 텍스트
 */
interface DescriptionSectionProps {
  description: string | null;
}

export function DescriptionSection({ description }: DescriptionSectionProps) {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[20px] py-0 relative shrink-0 w-full mb-[28px]">
      <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full pt-[10px] mb-[-4px]">
        {/* 타이틀 */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center justify-center size-full">
            <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
              <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                  운세 설명
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 설명 텍스트 */}
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                  {description || '운세 설명이 없습니다.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 운세 구성 섹션 (질문 목록)
 * 
 * @param {Object} props
 * @param {Question[]} props.questions - 질문 목록
 */
interface FortuneCompositionProps {
  questions: Question[];
}

export function FortuneComposition({ questions }: FortuneCompositionProps) {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[12px] items-start px-[20px] py-0 relative shrink-0 w-full mb-[52px] mt-[-4px]">
      <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full mt-[-4px]">
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
            <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px] pb-[2px]">
              운세 구성
            </p>
          </div>
        </div>

        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          {questions.length > 0 ? (
            questions.map((question, idx) => (
              <div 
                key={question.id}
                className={`w-full py-[4px] ${
                  idx === 0 
                    ? "mt-[-12px]" 
                    : idx === questions.length - 1 
                      ? "mb-[-12px]" 
                      : ""
                }`}
              >
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full pb-[4px]">
                      <div className="relative shrink-0">
                        <span className="font-medium leading-[28.5px] text-[#999999] text-[16px]">·</span>
                      </div>
                      <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                        <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0 w-full">
                          <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                            {question.question_text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {idx < questions.length - 1 && (
                  <div className="h-0 relative shrink-0 w-full my-0">
                    <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                        <path d="M0 0.5H350" stroke="#F3F3F3" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="font-normal leading-[28.5px] text-[#999999] text-[16px]">등록된 질문이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 광고 배너
 * 
 * @param {Object} props
 * @param {() => void} props.onClick - 클릭 핸들러
 */
interface AdBannerProps {
  onClick?: () => void;
}

export function AdBanner({ onClick }: AdBannerProps) {
  return (
    <div className="bg-[#f8f8f8] box-border content-stretch flex flex-col gap-[10px] items-start p-[20px] relative shrink-0 w-full mb-[52px]">
      <div 
        onClick={onClick}
        className="bg-white relative rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] shrink-0 w-full cursor-pointer transition-transform duration-200 ease-in-out active:scale-[0.96]"
      >
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex items-center px-[20px] py-[12px] relative w-full">
            <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
              <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
                <p className="font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px] w-full mt-[4px]">
                  월급쟁이에서 벗어나, 대박의 길로
                </p>
                <p className="font-normal leading-[19px] relative shrink-0 text-[#848484] text-[13px] tracking-[-0.26px] w-full">
                  퇴사 후 대박 터질 타이밍 알려드립니다.
                </p>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
                <div className="h-[60px] relative shrink-0 w-[78px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[8px]">
                    <img 
                      alt="광고 이미지" 
                      className="absolute inset-0 size-full object-cover object-center" 
                      src={bannerImg} 
                    />
                  </div>
                </div>
                <div className="relative shrink-0 size-[16px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                    <g id="arrow-right">
                      <path d={svgPathsBanner.p232a3c80} stroke="var(--stroke-0, #999999)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 추천 콘텐츠 카드
 * 
 * @param {Object} props
 * @param {MasterContent} props.content - 콘텐츠 정보
 * @param {() => void} props.onClick - 클��� 핸들러
 */
interface RecommendedCardProps {
  content: MasterContent;
  onClick: () => void;
}

export function RecommendedCard({ content, onClick }: RecommendedCardProps) {
  return (
    <div 
      onClick={onClick}
      className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full cursor-pointer"
    >
      {/* ⭐ 썸네일 이미지 */}
      <div className="h-[80px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px]">
        {content.thumbnail_url ? (
          <img 
            alt={content.title} 
            loading="lazy"
            className="absolute inset-0 max-w-none object-center object-cover rounded-[12px] size-full" 
            src={content.thumbnail_url} 
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 rounded-[12px] flex items-center justify-center">
            <p className="text-gray-400 text-[12px]">이미지 없음</p>
          </div>
        )}
        <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
      </div>

      {/* ⭐ 콘텐츠 정보 */}
      <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0">
        {/* 제목 */}
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[23.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full overflow-ellipsis overflow-hidden line-clamp-2">
            {content.title}
          </p>
        </div>

        {/* 뱃지 */}
        <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[6px] pt-[2px] pb-[1px] relative rounded-[4px] shrink-0">
          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#41a09e] text-[12px] text-nowrap tracking-[-0.24px]">
            {content.content_type === 'free' ? '무료 체험판' : '심화 해석판'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 유료 콘텐츠 카드 (가로 스크롤용)
 * 
 * @param {Object} props
 * @param {MasterContent} props.content - 콘텐츠 정보
 * @param {() => void} props.onClick - 클릭 핸들러
 * @param {number} props.couponDiscount - 쿠폰 할인 금액 (옵션)
 */
interface PaidContentCardProps {
  content: MasterContent;
  onClick: () => void;
  couponDiscount?: number;
}

export function PaidContentCard({ content, onClick, couponDiscount = 0 }: PaidContentCardProps) {
  const originalPrice = content.price_original;
  const discountedPrice = content.price_discount;
  const discountRate = content.discount_rate;
  const finalPrice = couponDiscount > 0 ? discountedPrice - couponDiscount : discountedPrice;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('🎯 카드 클릭 시도:', content.title);
    e.stopPropagation(); // 부모로 전파 방지
    onClick();
  };

  return (
    <div 
      data-card="true"
      onClick={handleCardClick}
      className="content-stretch flex flex-col items-start relative shrink-0 cursor-pointer select-none"
      style={{ 
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto'
      }}
    >
      <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
        {/* 썸네일 이미지 - 200x120 */}
        <div className="h-[120px] pointer-events-none relative rounded-[12px] shrink-0 w-[200px]">
          {content.thumbnail_url ? (
            <img 
              alt={content.title} 
              loading="lazy"
              className="absolute inset-0 max-w-none object-center object-cover rounded-[12px] size-full" 
              src={content.thumbnail_url} 
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 rounded-[12px] flex items-center justify-center">
              <p className="text-gray-400 text-[12px]">이미지 없음</p>
            </div>
          )}
          <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
        </div>

        {/* 상품 정보 */}
        <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-[200px]">
          <div className="content-stretch flex flex-col gap-[1px] items-start relative shrink-0 w-full">
            {/* 심화 해석판 뱃지 */}
            <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[6px] pt-[3px] pb-[1px] relative rounded-[4px] shrink-0 mb-[3px]">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#41a09e] text-[12px] text-nowrap tracking-[-0.24px]">
                심화 해석판
              </p>
            </div>

            {/* 제목 */}
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <div className="relative shrink-0 w-full">
                <div className="size-full">
                  <div className="content-stretch flex flex-col items-start px-px py-0 relative w-full">
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[23.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px] pb-[1px] w-full">
                      {content.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 가격 정보 */}
            <div className="relative shrink-0 w-full">
              <div className="size-full">
                <div className="content-stretch flex flex-col gap-[0px] items-start px-[2px] py-0 relative w-full">
                  {/* 할인율 + 할인가 + 원가(취소선) */}
                  <div className="content-stretch flex items-baseline gap-[5px] relative shrink-0 w-full">
                    <div className="content-stretch flex font-['Pretendard_Variable:Bold',sans-serif] font-bold gap-[3px] items-center leading-[20px] relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px]">
                      <p className="relative shrink-0 text-[#ff6678]">{discountRate}%</p>
                      <p className="relative shrink-0 text-black">{discountedPrice.toLocaleString()}원</p>
                    </div>
                    <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] line-through relative shrink-0 text-[#999] text-[13px]  pb-[1px] text-nowrap">
                      {originalPrice.toLocaleString()}원
                    </p>
                  </div>

                  {/* 쿠폰 적용가 (쿠폰이 있을 때만) */}
                  {couponDiscount > 0 && (
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 text-[#48b2af] text-nowrap w-full">
                      <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[25px] relative shrink-0 text-[16px] tracking-[-0.32px]">
                        {finalPrice.toLocaleString()}원
                      </p>
                      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[11px]">
                        쿠폰 적용가
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 더 보기 버튼
 * 
 * @param {Object} props
 * @param {() => void} props.onClick - 클릭 핸들러
 */
interface ShowMoreButtonProps {
  onClick: () => void;
}

export function ShowMoreButton({ onClick }: ShowMoreButtonProps) {
  return (
    <div 
      onClick={onClick}
      className="relative shrink-0 w-[200px] cursor-pointer select-none group py-[1px]"
    >
      <div className="content-stretch flex items-center pl-0 pr-[20px] py-0 relative size-full" data-name="Button / More view Button">
        <div className="content-stretch flex h-full items-center justify-center mr-[-20px] p-[12px] relative rounded-[12px] shrink-0 w-[200px]">
          <div aria-hidden="true" className="absolute border border-[#d4d4d4] border-dashed inset-[-0.5px] pointer-events-none rounded-[12.5px]" />
          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[#6d6d6d] text-[16px] text-nowrap tracking-[-0.3px]">더 볼래요!</p>
        </div>
        <div className="flex items-center justify-center mr-[-20px] relative shrink-0">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">
            <div className="relative size-[44px]" data-name="Icons">
              <div className="absolute inset-0" style={{ "--fill-0": "#D4D4D4" } as React.CSSProperties}>
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
                  <g id="Icons">
                    <rect fill="white" height="44" width="44" />
                    <motion.path 
                      d={svgPathsMore.p3bb19300} 
                      fill="var(--fill-0, #D4D4D4)" 
                      id="Vector"
                      animate={{ x: [0, 3.3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 하단 버튼
 * 
 * @param {Object} props
 * @param {() => void} props.onClick - 클릭 핸들러
 * @param {string} props.text - 버튼 텍스트
 */
interface BottomButtonProps {
  onClick: () => void;
  text: string;
}

export function BottomButton({ onClick, text }: BottomButtonProps) {
  return (
    <div className="fixed bottom-0 box-border content-stretch flex flex-col items-start left-1/2 shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] translate-x-[-50%] w-full max-w-[440px] z-10">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="bg-white relative shrink-0 w-full">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[20px] py-[12px] relative w-full">
              <motion.div 
                onClick={onClick}
                className="bg-[#48b2af] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer overflow-hidden select-none [-webkit-touch-callout:none]"
                whileTap={{ scale: 0.96, backgroundColor: "#36908f" }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="box-border content-stretch flex gap-[10px] h-[56px] items-center justify-center px-[12px] py-0 relative w-full">
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                      <p className="font-medium leading-[25px] not-italic relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px] whitespace-pre select-none [-webkit-touch-callout:none]">
                        {text}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}