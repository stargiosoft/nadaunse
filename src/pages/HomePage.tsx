import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MasterContent } from '../types/masterContent';
import { supabase } from '../lib/supabase';
import { getThumbnailUrl } from '../lib/image';
import { preloadImages } from '../lib/imagePreloader';
import HomeSkeleton from '../components/skeletons/HomeSkeleton';
import svgPaths from "../imports/svg-94402brxf8";
import svgPathsLogo from "../imports/svg-7fu3k5931y";

type TabCategory = '전체' | '개인운세' | '연애' | '이별' | '궁합' | '재물' | '직업' | '시험/학업' | '건강' | '인간관계' | '자녀' | '이사/매매' | '기타';

/**
 * ⭐ 홈 필터 초기값 캐시
 * - useState 초기화 시 여러 번 호출되어도 같은 값을 반환하도록 캐시
 * - 현재 마운트 사이클이 끝나면 자동으로 초기화 (setTimeout 0ms)
 */
let homeFilterCache: { category: TabCategory; contentType: 'all' | 'paid' | 'free' } | null = null;

/** 세션 스토리지 키 - 사용자가 선택한 필터 상태 유지 */
const SESSION_FILTER_KEY = 'homepage_filter_state';

/**
 * ⭐ 홈 필터 초기값 헬퍼 함수
 * - 우선순위: localStorage(일회성) > sessionStorage(세션 유지) > 기본값
 * - '다른 운세 보기' 버튼으로 이동 시 카테고리 필터 자동 선택 (localStorage)
 * - 사용자가 직접 선택한 필터는 sessionStorage에 유지
 */
function getInitialHomeFilter(): { category: TabCategory; contentType: 'all' | 'paid' | 'free' } {
  // 이미 캐시가 있으면 반환 (같은 마운트 사이클에서 두 번 호출 방지)
  if (homeFilterCache !== null) {
    return homeFilterCache;
  }

  const defaultFilter = { category: '전체' as TabCategory, contentType: 'all' as const };
  const validCategories: TabCategory[] = ['전체', '개인운세', '연애', '이별', '궁합', '재물', '직업', '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'];
  const validTypes = ['all', 'paid', 'free'] as const;

  try {
    // 1️⃣ 우선순위 1: localStorage의 homeFilter (일회성 - 다른 운세 보기 버튼 등)
    const homeFilter = localStorage.getItem('homeFilter');
    if (homeFilter) {
      const parsed = JSON.parse(homeFilter);
      localStorage.removeItem('homeFilter'); // 일회성이므로 바로 제거
      console.log('🎯 [HomePage] homeFilter 적용 (일회성):', parsed);

      const category = validCategories.includes(parsed.category) ? parsed.category : '전체';
      const contentType = validTypes.includes(parsed.contentType) ? parsed.contentType : 'all';

      homeFilterCache = { category, contentType };

      // 일회성 필터도 세션에 저장 (이후 복원을 위해)
      sessionStorage.setItem(SESSION_FILTER_KEY, JSON.stringify(homeFilterCache));

      setTimeout(() => { homeFilterCache = null; }, 0);
      return homeFilterCache;
    }

    // 2️⃣ 우선순위 2: sessionStorage의 필터 상태 (사용자가 직접 선택한 값)
    const sessionFilter = sessionStorage.getItem(SESSION_FILTER_KEY);
    if (sessionFilter) {
      const parsed = JSON.parse(sessionFilter);
      console.log('🔄 [HomePage] 세션 필터 복원:', parsed);

      const category = validCategories.includes(parsed.category) ? parsed.category : '전체';
      const contentType = validTypes.includes(parsed.contentType) ? parsed.contentType : 'all';

      homeFilterCache = { category, contentType };
      setTimeout(() => { homeFilterCache = null; }, 0);
      return homeFilterCache;
    }

    // 3️⃣ 기본값
    homeFilterCache = defaultFilter;
  } catch (e) {
    console.error('❌ [HomePage] 필터 파싱 실패:', e);
    homeFilterCache = defaultFilter;
  }

  // ⭐ 현재 동기 실행이 끝난 후 캐시 초기화 (다음 마운트를 위해)
  setTimeout(() => { homeFilterCache = null; }, 0);

  return homeFilterCache;
}

function Notch() {
  return (
    <div className="absolute h-[30px] left-[103px] top-[-2px] w-[183px]" data-name="Notch">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 183 30">
        <g id="Notch">
          <path d={svgPaths.pf91bfc0} fill="var(--fill-0, black)" id="Notch_2" />
        </g>
      </svg>
    </div>
  );
}

function RightSide() {
  return (
    <div className="absolute h-[11.336px] right-[14.67px] top-[17.33px] w-[66.662px]" data-name="Right Side">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 67 12">
        <g id="Right Side">
          <g id="Battery">
            <path d={svgPaths.p3c576cf0} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, black)" />
            <path d={svgPaths.p1667d738} fill="var(--fill-0, black)" id="Combined Shape" opacity="0.4" />
            <path d={svgPaths.p18fdac00} fill="var(--fill-0, black)" id="Rectangle_2" />
          </g>
          <path d={svgPaths.p344d52f0} fill="var(--fill-0, black)" id="Wifi" />
          <path d={svgPaths.p3694c600} fill="var(--fill-0, black)" id="Mobile Signal" />
        </g>
      </svg>
    </div>
  );
}

function Time() {
  return (
    <div className="absolute h-[21px] left-[21px] top-[12px] w-[54px]" data-name="Time">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 54 21">
        <g id="Time">
          <g id="9:41">
            <path d={svgPaths.p24372f50} fill="var(--fill-0, black)" />
            <path d={svgPaths.p3aa84e00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p2e6b3780} fill="var(--fill-0, black)" />
            <path d={svgPaths.p12b0b900} fill="var(--fill-0, black)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function LeftSide() {
  return (
    <div className="absolute contents left-[21px] top-[12px]" data-name="Left Side">
      <Time />
    </div>
  );
}

function User() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
      <g id="user">
        <g id="Vector" opacity="0"></g>
      </g>
    </svg>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <User />
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute h-[19px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[18px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 19">
        <g id="Icon">
          <path d={svgPaths.p1ceabf00} fill="var(--fill-0, #848484)" id="Vector" />
          <path d={svgPaths.p6324f00} fill="var(--fill-0, #848484)" id="Rectangle 569" />
        </g>
      </svg>
    </div>
  );
}

function Icon1({ onUserIconClick }: { onUserIconClick?: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <div className="h-[27px] relative shrink-0 w-[80px]" data-name="Common / Logo">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 80 27">
          <g id="Common / Logo">
            <path d={svgPathsLogo.p9985f00} fill="var(--fill-0, #151515)" id="Vector" />
            <path d={svgPathsLogo.p1239500} fill="var(--fill-0, #151515)" id="Vector_2" />
            <path d={svgPathsLogo.p1f430500} fill="var(--fill-0, #151515)" id="Vector_3" />
            <path d={svgPathsLogo.p29af36b0} fill="var(--fill-0, #151515)" id="Vector_4" />
            <path d={svgPathsLogo.p3159cc00} fill="var(--fill-0, #151515)" id="Vector_5" />
            <path d={svgPathsLogo.p1f706200} fill="var(--fill-0, #151515)" id="Vector_6" />
            <path d={svgPathsLogo.p2c154700} fill="var(--fill-0, #151515)" id="Vector_7" />
            <path d={svgPathsLogo.p28fd9100} fill="var(--fill-0, #151515)" id="Vector_8" />
            <path d={svgPathsLogo.p9b88f00} fill="var(--fill-0, #151515)" id="Vector_9" />
            <path d={svgPathsLogo.pbebe280} fill="var(--fill-0, #151515)" id="Vector_10" />
          </g>
        </svg>
      </div>
      <div 
        onClick={onUserIconClick}
        className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer transition-all duration-150 ease-out active:scale-95 active:bg-gray-100" 
        data-name="Right Action"
      >
        <div className="relative shrink-0 size-[24px]" data-name="Icons">
          <Box />
          <Icon />
        </div>
      </div>
    </div>
  );
}

interface TabContainerProps {
  selectedCategory: TabCategory;
  onCategoryChange: (category: TabCategory) => void;
  availableCategories: TabCategory[];
}

function TabContainer({ selectedCategory, onCategoryChange, availableCategories }: TabContainerProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isDraggingRef = useRef(false);
  const moveDistanceRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDown(true);
    isDraggingRef.current = false;
    moveDistanceRef.current = 0;
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
    // 마우스가 벗어나면 드래그 상태 즉시 리셋
    setTimeout(() => {
      isDraggingRef.current = false;
      moveDistanceRef.current = 0;
    }, 50);
  };

  const handleMouseUp = () => {
    setIsDown(false);
    // 드래그 상태를 조금 더 긴 딜레이 후에 리셋 (클릭 이벤트 처리 후)
    setTimeout(() => {
      isDraggingRef.current = false;
      moveDistanceRef.current = 0;
    }, 100);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    const distance = Math.abs(x - startX);
    moveDistanceRef.current = distance;
    if (distance > 5) {
        isDraggingRef.current = true;
    }
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCategoryClick = (category: TabCategory) => {
    // 5픽셀 이상 움직였으면 드래그로 간주하고 클릭 무시
    if (moveDistanceRef.current > 5) {
      console.log('🚫 드래그 감지됨, 클릭 무시:', moveDistanceRef.current);
      return;
    }
    console.log('✅ 카테고리 변경:', category);
    onCategoryChange(category);
  };
  
  return (
    <div 
      ref={sliderRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className="content-stretch flex items-center overflow-x-auto relative shrink-0 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] cursor-grab active:cursor-grabbing" 
      data-name="Tab Container"
    >
      {availableCategories.map((category) => (
        <div
          key={category}
          onClick={() => handleCategoryClick(category)}
          className="box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0 cursor-pointer"
          data-name="Navigation / Tab Item"
        >
          {selectedCategory === category && (
            <motion.div
              layoutId="tabCategoryIndicator"
              className="absolute inset-0 bg-[#f8f8f8] rounded-[12px]"
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          )}
          <p
            className={`${
              selectedCategory === category
                ? "font-['Pretendard_Variable:Medium',sans-serif] font-[500] text-[#151515]"
                : "font-['Pretendard_Variable:Medium',sans-serif] text-[#999999]"
            } leading-[20px] not-italic relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px] whitespace-pre transition-colors duration-200 z-10`}
          >
            {category}
          </p>
        </div>
      ))}
    </div>
  );
}

interface SegmentedControlProps {
  selectedType: 'all' | 'paid' | 'free';
  onTypeChange: (type: 'all' | 'paid' | 'free') => void;
}

function SegmentedControl({ selectedType, onTypeChange }: SegmentedControlProps) {
  return (
    <div className="bg-[#f9f9f9] relative rounded-[16px] shrink-0 w-full" data-name="Segmented Control">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start p-[6px] relative w-full">
          <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
            <div
              onClick={() => onTypeChange('all')}
              className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 cursor-pointer"
            >
              {selectedType === 'all' && (
                <motion.div
                  layoutId="segmentedControlIndicator"
                  className="absolute inset-0 bg-white rounded-[12px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)]"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              )}
              <div className="flex flex-row items-center justify-center size-full relative z-10">
                <div className="box-border content-stretch flex gap-[10px] items-center justify-center p-[8px] relative w-full">
                  <div
                    className={`flex flex-col ${
                      selectedType === 'all'
                        ? "font-['Pretendard_Variable:Medium',sans-serif] font-[500] text-[#151515]"
                        : "font-['Pretendard_Variable:Medium',sans-serif] text-[#999999]"
                    } justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-nowrap tracking-[-0.42px] transition-colors duration-200`}
                  >
                    <p className="leading-[22px] whitespace-pre">종합</p>
                  </div>
                </div>
              </div>
            </div>
            <div
              onClick={() => onTypeChange('paid')}
              className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 cursor-pointer"
            >
              {selectedType === 'paid' && (
                <motion.div
                  layoutId="segmentedControlIndicator"
                  className="absolute inset-0 bg-white rounded-[12px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)]"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              )}
              <div className="flex flex-row items-center justify-center size-full relative z-10">
                <div className="box-border content-stretch flex gap-[10px] items-center justify-center p-[8px] relative w-full">
                  <div
                    className={`flex flex-col ${
                      selectedType === 'paid'
                        ? "font-['Pretendard_Variable:Medium',sans-serif] font-[500] text-[#151515]"
                        : "font-['Pretendard_Variable:Medium',sans-serif] text-[#999999]"
                    } justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-nowrap tracking-[-0.42px] transition-colors duration-200`}
                  >
                    <p className="leading-[22px] whitespace-pre">심화 해석판</p>
                  </div>
                </div>
              </div>
            </div>
            <div
              onClick={() => onTypeChange('free')}
              className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 cursor-pointer"
            >
              {selectedType === 'free' && (
                <motion.div
                  layoutId="segmentedControlIndicator"
                  className="absolute inset-0 bg-white rounded-[12px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)]"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              )}
              <div className="flex flex-row items-center justify-center size-full relative z-10">
                <div className="box-border content-stretch flex gap-[10px] items-center justify-center p-[8px] relative w-full">
                  <div
                    className={`flex flex-col ${
                      selectedType === 'free'
                        ? "font-['Pretendard_Variable:Medium',sans-serif] font-[500] text-[#151515]"
                        : "font-['Pretendard_Variable:Medium',sans-serif] text-[#999999]"
                    } justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-nowrap tracking-[-0.42px] transition-colors duration-200`}
                  >
                    <p className="leading-[22px] whitespace-pre">무료 체험판</p>
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

function TopNavigationContainer({
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  onUserIconClick,
  availableCategories,
  isVisible = true
}: {
  selectedCategory: TabCategory;
  onCategoryChange: (category: TabCategory) => void;
  selectedType: 'all' | 'paid' | 'free';
  onTypeChange: (type: 'all' | 'paid' | 'free') => void;
  onUserIconClick?: () => void;
  availableCategories: TabCategory[];
  isVisible?: boolean;
}) {
  return (
    <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full z-10" data-name="Top Navigation Container">
      
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full max-w-[440px] mx-auto" data-name="Navigation / Top Navigation (Widget)">
        <div className="z-20 bg-white box-border content-stretch flex flex-col gap-[10px] h-[52px] items-start justify-center relative shrink-0 w-full" data-name="Navigation / Navigation">
          <div className="max-w-[440px] mx-auto w-full pl-[20px] pr-[12px] py-[4px]">
            <Icon1 onUserIconClick={onUserIconClick} />
          </div>
        </div>
        <div className="z-20 bg-white relative shrink-0 w-full" data-name="Navigation / Tab Bar">
          <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
          <div className="size-full">
            <div className="max-w-[440px] mx-auto w-full box-border content-stretch flex flex-col items-start px-[16px] py-[8px] relative">
              <TabContainer selectedCategory={selectedCategory} onCategoryChange={onCategoryChange} availableCategories={availableCategories} />
            </div>
          </div>
        </div>
        <div className={`z-10 bg-white box-border content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full py-[8px] mb-[-8px] transition-all duration-200 ease-in-out ${isVisible ? '' : '-translate-y-full opacity-0'}`} data-name="Selected=Left">
          <div className="max-w-[440px] mx-auto w-full px-[20px]">
            <SegmentedControl selectedType={selectedType} onTypeChange={onTypeChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContentCardProps {
  content: MasterContent;
  onClick: () => void;
  isFeatured?: boolean;
  index?: number;
}

function ContentCard({ content, onClick, isFeatured = false, index = 0 }: ContentCardProps) {
  const isPaid = content.content_type === 'paid';
  
  if (isFeatured) {
    return (
      <div onClick={onClick} className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full cursor-pointer transition-all duration-150 ease-out active:bg-gray-50 active:p-[12px] rounded-[16px]" data-name="Featured Card">
        <div className="group box-border relative shrink-0 w-full pt-0 pb-0 pointer-events-auto touch-manipulation [-webkit-tap-highlight-color:transparent] !transform-none !transition-none p-[0px]" data-name="Card / Browse Card">
          <div className="box-border content-stretch w-full">
            <div className="w-full">
 
  <div className="box-border content-stretch w-full">
    <div className="flex flex-col gap-[12px] items-center justify-center w-full">
      <div className="aspect-[350/220] pointer-events-none relative rounded-[16px] shrink-0 w-full bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:200%_100%] animate-shimmer">
        {content.thumbnail_url ? (
          <img
            alt={content.title}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 object-cover rounded-[16px] size-full"
            src={content.thumbnail_url}
            onLoad={(e) => {
              // 이미지 로드 완료 시 부모의 shimmer 제거
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                parent.classList.remove('animate-shimmer', 'bg-gradient-to-r', 'from-[#f0f0f0]', 'via-[#e8e8e8]', 'to-[#f0f0f0]', 'bg-[length:200%_100%]');
                parent.classList.add('bg-[#f0f0f0]');
              }
            }}
            onError={(e) => {
              // 이미지 로드 실패 시 조용히 처리
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[14px] text-[#999999]">이미지 없음</p>
          </div>
        )}
        <div className="absolute inset-[-1px] rounded-[17px] border border-[#f9f9f9]" />
      </div>

      <div className="relative shrink-0 w-full overflow-hidden">
        <div className="box-border flex flex-col gap-[5px] items-start px-[4px]">
          <p className="text-[15px] font-medium line-clamp-2 pl-[2px]">
            {content.title}
          </p>

          <div className={`${isPaid ? 'bg-[#f0f8f8]' : 'bg-[#f9f9f9]'} px-[6px] py-[2px] rounded-[6px]`}>
            <p className={`${isPaid ? 'text-[#41a09e]' : 'text-[#848484]'} text-[11px]`}>
              {isPaid ? '심화 해석판' : '무료 체험판'}
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
    );
  }
  
  return (
    <div onClick={onClick} className="box-border content-stretch flex flex-col gap-[10px] h-auto items-start justify-start px-0 py-[10px] relative rounded-[16px] shrink-0 w-full cursor-pointer transition-all duration-150 ease-out active:scale-[0.96] active:bg-gray-50 active:px-[12px]" data-name="Card / Browse Card">
      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full overflow-hidden" data-name="Container">
        <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px] bg-gradient-to-r from-[#f0f0f0] via-[#e8e8e8] to-[#f0f0f0] bg-[length:200%_100%] animate-shimmer" data-name="Thumbnail">
          {content.thumbnail_url ? (
            <img
              alt={content.title}
              loading={index < 5 ? "eager" : "lazy"}
              fetchPriority={index < 5 ? "high" : "auto"}
              className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[12px] size-full"
              src={content.thumbnail_url}
              onLoad={(e) => {
                // 이미지 로드 완료 시 부모의 shimmer 제거
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.classList.remove('animate-shimmer', 'bg-gradient-to-r', 'from-[#f0f0f0]', 'via-[#e8e8e8]', 'to-[#f0f0f0]', 'bg-[length:200%_100%]');
                  parent.classList.add('bg-[#f0f0f0]');
                }
              }}
              onError={(e) => {
                // 이미지 로드 실패 시 조용히 처리
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[10px] text-[#999999]">이미지<br/>없음</p>
            </div>
          )}
          <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[3px] grow items-start min-h-px min-w-px relative shrink-0 overflow-hidden" data-name="Card / PriceBlock">
          <div className="relative shrink-0 w-full" data-name="Container">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full overflow-hidden">
                <p className="basis-0 font-['Pretendard_Variable:Medium',sans-serif] grow leading-[23.5px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-black tracking-[-0.3px] line-clamp-2 overflow-hidden">
                  {content.title}
                </p>
              </div>
            </div>
          </div>
          <div className={`${isPaid ? 'bg-[#f0f8f8]' : 'bg-[#f9f9f9]'} box-border content-stretch flex gap-[10px] items-center justify-center px-[6px] pb-[1px] pt-[3px] relative rounded-[4px] shrink-0`} data-name="Label Box">
            <p className={`font-['Pretendard_Variable:Medium',sans-serif] leading-[16px] not-italic relative shrink-0 ${isPaid ? 'text-[#41a09e]' : 'text-[#848484]'} text-[11px] text-nowrap tracking-[-0.24px] whitespace-pre`}>
              {isPaid ? '심화 해석판' : '무료 체험판'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="h-0 relative shrink-0 w-full" data-name="Divider">
      <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]" style={{ "--stroke-0": "rgba(249, 249, 249, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
          <path d="M0 0.5H350" id="Vector 10" stroke="var(--stroke-0, #F9F9F9)" />
        </svg>
      </div>
    </div>
  );
}

function HomeIndicatorLight() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Home Indicator/Light">
      <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" data-name="Home Indicator" />
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // ⭐ 초기값: localStorage의 homeFilter가 있으면 해당 값 사용 (다른 운세 보기 버튼으로 이동 시)
  // - 함수로 호출하여 컴포넌트 마운트 시마다 새로 읽음
  const [selectedCategory, setSelectedCategory] = useState<TabCategory>(() => getInitialHomeFilter().category);
  const [selectedType, setSelectedType] = useState<'all' | 'paid' | 'free'>(() => getInitialHomeFilter().contentType);
  const [allContents, setAllContents] = useState<MasterContent[]>([]);
  const [featuredContent, setFeaturedContent] = useState<MasterContent | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<TabCategory[]>(['전체']);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [showNavigation, setShowNavigation] = useState(true);
  const lastScrollY = useRef(0);

  // 🛡️ iOS Safari 히스토리 버그 해결: 홈 진입 시 가짜 히스토리 추가
  useEffect(() => {
    const initHistory = () => {
      const currentLength = window.history.length;
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      console.log('🔧 [히스토리 초기화] 현재 길이:', currentLength, 'iOS:', isIOS);

      // 🔑 SessionStorage에서 히스토리 상태 확인
      const hasNavigatedFromHome = sessionStorage.getItem('navigatedFromHome');
      console.log('🔍 [히스토리] SessionStorage 상태:', hasNavigatedFromHome);

      // 🔄 홈으로 돌아왔으면 플래그 제거
      if (hasNavigatedFromHome) {
        sessionStorage.removeItem('navigatedFromHome');
        console.log('🧹 [히스토리] SessionStorage 플래그 제거');
      }

      // 🛡️ iOS에서는 무조건 버퍼 추가 (history.length 체크 제거)
      // iOS Safari/Chrome에서 history.length가 실제 스택 상태를 반영하지 않는 버그 대응
      const bufferCount = isIOS ? 5 : 2;
      const shouldAddBuffer = isIOS || currentLength <= 2;

      if (shouldAddBuffer) {
        for (let i = 0; i < bufferCount; i++) {
          window.history.pushState({
            type: 'home_buffer',
            index: i,
            timestamp: Date.now()
          }, '', window.location.href);
        }
        console.log(`✅ [히스토리] iOS 버퍼 ${bufferCount}개 추가 완료 → 새 길이:`, window.history.length);
      }
    };

    initHistory();
  }, []);

  // 🛡️ iOS popstate 이벤트 핸들러 - 스와이프 뒤로가기 시 앱 종료 방지
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const currentPath = window.location.pathname;

      console.log('📍 [popstate] 이벤트 발생', {
        state: e.state,
        currentPath,
        isIOS,
        historyLength: window.history.length
      });

      // 더미 버퍼 엔트리에 도달한 경우 - 다시 버퍼 추가
      if (e.state?.type === 'home_buffer') {
        console.log('🔄 [popstate] 버퍼 엔트리 감지 → 버퍼 재추가');
        window.history.pushState({
          type: 'home_buffer',
          index: 0,
          timestamp: Date.now()
        }, '', window.location.href);
        return;
      }

      // iOS에서 예상치 못한 상태로 뒤로가기 된 경우 - 홈으로 강제 이동
      if (isIOS && currentPath === '/' && !e.state && window.history.length <= 2) {
        console.warn('⚠️ [popstate] iOS 히스토리 버그 감지 → 버퍼 재추가');
        // 앱이 닫히지 않도록 버퍼 다시 추가
        for (let i = 0; i < 3; i++) {
          window.history.pushState({
            type: 'home_buffer',
            index: i,
            timestamp: Date.now()
          }, '', window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) { 
          setShowNavigation(false);
        } else {
          setShowNavigation(true);
        }

        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, []);
  
  const CACHE_KEY = 'homepage_contents_cache';
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

  // 🔧 캐시 버전 관리 (정렬 로직 변경 시 캐시 무효화)
  const CACHE_VERSION = 'v6'; // 필터별 캐시 분리 적용
  const CATEGORIES_CACHE_KEY = 'homepage_categories_cache_v2'; // v2: 카테고리 순서 고정

  // 🚀 Phase 1: 필터별 캐시 키 생성 함수
  const getCacheKey = useCallback((category: TabCategory, type: 'all' | 'paid' | 'free') => {
    return `${CACHE_KEY}_${category}_${type}_${CACHE_VERSION}`;
  }, []);

  // 🖼️ Phase 3: 이미지 프리로드 중복 방지용 Set
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  // 🔄 Phase 2: Observer 함수 참조 유지용 Ref
  const loadMoreContentsRef = useRef<(() => Promise<void>) | null>(null);
  
  // 캐시에서 데이터 로드 (필터별 캐시 키 사용)
  const loadFromCache = useCallback((category: TabCategory, type: 'all' | 'paid' | 'free') => {
    try {
      const cacheKey = getCacheKey(category, type);

      // 🗑️ 이전 버전 캐시 삭제 (v5 이하)
      const oldKeys = Object.keys(localStorage).filter(key =>
        key.startsWith(CACHE_KEY) && !key.includes('_v6')
      );
      oldKeys.forEach(key => localStorage.removeItem(key));

      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // 캐시가 유효한 경우 (5분 이내)
        if (now - timestamp < CACHE_EXPIRY) {
          console.log(`✅ 캐시에서 데이터 로드 (${category}/${type})`);
          const contents = data as MasterContent[];

          // weekly_clicks가 0보다 큰 콘텐츠가 있는지 확인
          const hasClicks = contents.some((c: MasterContent) => c.weekly_clicks > 0);

          if (hasClicks) {
            const maxClicks = Math.max(...contents.map((c: MasterContent) => c.weekly_clicks));
            const featuredIndex = contents.findIndex((c: MasterContent) => c.weekly_clicks === maxClicks);
            setFeaturedContent(contents[featuredIndex]);
          } else {
            setFeaturedContent(contents[0]);
          }

          setAllContents(contents);
          return true;
        } else {
          console.log(`⏰ 캐시 만료됨 (${category}/${type})`);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패');
    }
    return false;
  }, [getCacheKey]);
  
  // 캐시에 데이터 저장 (필터별 캐시 키 사용)
  const saveToCache = useCallback((data: MasterContent[], category: TabCategory, type: 'all' | 'paid' | 'free') => {
    try {
      const cacheKey = getCacheKey(category, type);
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log(`💾 캐시에 데이터 저장 (${category}/${type})`);
    } catch (error) {
      console.error('캐시 저장 실패');
    }
  }, [getCacheKey]);
  
  // 🚀 백그라운드에서 나머지 콘텐츠 프리페칭 (현재 필터 기준)
  const prefetchRemainingContents = useCallback(async (totalCount: number, category: TabCategory, type: 'all' | 'paid' | 'free') => {
    try {
      const remainingCount = totalCount - 10;
      const batchSize = 20; // 한 번에 20개씩 로드
      let loadedCount = 0;
      const cacheKey = getCacheKey(category, type);

      console.log(`🔮 [Prefetch] 총 ${remainingCount}개 콘텐츠를 백그라운드에서 로드합니다... (${category}/${type})`);

      // 여러 배치로 나누어 로드
      while (loadedCount < remainingCount) {
        const startIndex = 10 + loadedCount;
        const endIndex = Math.min(startIndex + batchSize - 1, totalCount - 1);

        console.log(`🔮 [Prefetch] 배치 로드 중... (${startIndex} ~ ${endIndex})`);

        let query = supabase
          .from('master_contents')
          .select('id, content_type, title, status, created_at, thumbnail_url, weekly_clicks, view_count, category_main, category_sub, price_original, price_discount, discount_rate')
          .eq('status', 'deployed');

        // 필터 적용
        if (category !== '전체') {
          query = query.eq('category_main', category);
        }
        if (type === 'paid') {
          query = query.eq('content_type', 'paid');
        } else if (type === 'free') {
          query = query.eq('content_type', 'free');
        }

        const { data, error } = await query
          .order('weekly_clicks', { ascending: false })
          .order('created_at', { ascending: false })
          .range(startIndex, endIndex);

        if (error) {
          console.error(`❌ [Prefetch] 배치 로드 실패 (${startIndex} ~ ${endIndex}):`, error);
          break;
        }

        if (data && data.length > 0) {
          const newContents = data.map((item: any) => ({
            ...item,
            thumbnail_url: getThumbnailUrl(item.thumbnail_url, 'list'),
          })) as MasterContent[];

          // 기존 캐시 데이터에 추가
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data: cachedData } = JSON.parse(cached);
            const updatedData = [...cachedData, ...newContents];

            // 중복 제거
            const uniqueData = Array.from(
              new Map(updatedData.map(item => [item.id, item])).values()
            );

            saveToCache(uniqueData, category, type);
            console.log(`✅ [Prefetch] ${newContents.length}개 추가됨 (누적: ${uniqueData.length}개)`);

            // 🖼️ 이미지 프리로드 (백그라운드) - 중복 체크
            const imageUrls = newContents
              .map(c => c.thumbnail_url)
              .filter(url => url && !preloadedUrlsRef.current.has(url)) as string[];

            if (imageUrls.length > 0) {
              console.log(`🖼️ [Prefetch] ${imageUrls.length}개 이미지 프리로드 시작...`);
              await preloadImages(imageUrls, 'low');
              imageUrls.forEach(url => preloadedUrlsRef.current.add(url));
              console.log(`✅ [Prefetch] ${imageUrls.length}개 이미지 프리로드 완료`);
            }
          }

          loadedCount += data.length;

          // 다음 배치 전 짧은 딜레이 (서버 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log(`📭 [Prefetch] 더 이상 로드할 데이터 없음`);
          break;
        }
      }

      console.log(`🎉 [Prefetch] 백그라운드 프리페칭 완료! (총 ${loadedCount}개 로드됨)`);
    } catch (error) {
      console.error('❌ [Prefetch] 프리페칭 중 오류:', error);
    }
  }, [saveToCache, getCacheKey]);

  // 🚀 다른 카테고리들 백그라운드 프리페치 (카테고리 변경 속도 개선)
  const prefetchOtherCategories = useCallback(async (
    currentCategory: TabCategory,
    currentType: 'all' | 'paid' | 'free',
    categories: TabCategory[]
  ) => {
    // 현재 카테고리 제외한 나머지 카테고리들
    const otherCategories = categories.filter(cat => cat !== currentCategory);

    console.log(`🔮 [Category Prefetch] ${otherCategories.length}개 카테고리 프리페칭 시작...`);

    for (const category of otherCategories) {
      const cacheKey = getCacheKey(category, currentType);

      // 이미 캐시가 있으면 스킵
      const existingCache = localStorage.getItem(cacheKey);
      if (existingCache) {
        try {
          const { timestamp } = JSON.parse(existingCache);
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log(`⏭️ [Category Prefetch] ${category}/${currentType} 캐시 있음, 스킵`);
            continue;
          }
        } catch {
          // 파싱 실패 시 계속 진행
        }
      }

      try {
        console.log(`📥 [Category Prefetch] ${category}/${currentType} 로드 중...`);

        let query = supabase
          .from('master_contents')
          .select('id, content_type, title, status, created_at, thumbnail_url, weekly_clicks, view_count, category_main, category_sub, price_original, price_discount, discount_rate', { count: 'exact' })
          .eq('status', 'deployed');

        // 카테고리 필터
        if (category !== '전체') {
          query = query.eq('category_main', category);
        }

        // 타입 필터
        if (currentType === 'paid') {
          query = query.eq('content_type', 'paid');
        } else if (currentType === 'free') {
          query = query.eq('content_type', 'free');
        }

        const { data, error } = await query
          .order('weekly_clicks', { ascending: false })
          .order('created_at', { ascending: false })
          .range(0, 9); // 첫 10개만 로드 (캐시용)

        if (error) {
          console.error(`❌ [Category Prefetch] ${category} 로드 실패:`, error);
          continue;
        }

        if (data && data.length > 0) {
          saveToCache(data, category, currentType);
          console.log(`✅ [Category Prefetch] ${category}/${currentType} 캐시 저장 (${data.length}개)`);
        }

        // 서버 부하 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`❌ [Category Prefetch] ${category} 에러:`, error);
      }
    }

    console.log(`🎉 [Category Prefetch] 카테고리 프리페칭 완료!`);
  }, [getCacheKey, saveToCache]);

  // Load published contents from Supabase (모든 필터에서 캐시 활용)
  useEffect(() => {
    const fetchPublishedContents = async () => {
      // 🚀 Phase 1: 모든 필터에서 캐시 활용
      const hasCache = loadFromCache(selectedCategory, selectedType);

      // 캐시가 있으면 즉시 표시 (이미지 로딩 시간 확보를 위해 약간의 딜레이)
      if (hasCache) {
        console.log(`⚡ [Cache Hit] 캐시에서 즉시 로드 (${selectedCategory}/${selectedType})`);
        setTimeout(() => {
          setIsInitialLoading(false);
        }, 100);
        return;
      }

      try {
        console.log(`🔍 [HomePage] deployed 콘텐츠 조회 시작... (${selectedCategory}/${selectedType})`);

        // 🐛 디버깅: 전체 콘텐츠의 status 확인 (타임아웃 없이)
        try {
          const { data: allData } = await supabase
            .from('master_contents')
            .select('id, title, status')
            .limit(5);
          console.log('🐛 [DEBUG] 최근 5개 콘텐츠 status:', allData);

          // deployed 콘텐츠 개수 확인
          const { count: deployedCount } = await supabase
            .from('master_contents')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'deployed');
          console.log('🐛 [DEBUG] deployed 콘텐츠 개수:', deployedCount);
        } catch (debugError) {
          console.warn('디버그 쿼리 실패 (무시):', debugError);
        }

        // 🎯 쿼리 빌더 시작
        let query = supabase
          .from('master_contents')
          .select('id, content_type, title, status, created_at, thumbnail_url, weekly_clicks, view_count, category_main, category_sub, price_original, price_discount, discount_rate', { count: 'exact' })
          .eq('status', 'deployed');

        // 🔍 카테고리 필터 적용
        if (selectedCategory !== '전체') {
          query = query.eq('category_main', selectedCategory);
        }

        // 🔍 타입 필터 적용
        if (selectedType === 'paid') {
          query = query.eq('content_type', 'paid');
        } else if (selectedType === 'free') {
          query = query.eq('content_type', 'free');
        }

        // 정렬 및 범위 설정 (타임아웃 없이 실행)
        const { data, error, count } = await query
          .order('weekly_clicks', { ascending: false })
          .order('created_at', { ascending: false })
          .range(0, 9); // 🎯 처음 10개만 로드

        console.log('🔍 [HomePage] 쿼리 결과:', { data, error, count });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const contents = data.map((item: any) => ({
            ...item,
            // 🎨 썸네일 최적화 (리스트용)
            thumbnail_url: getThumbnailUrl(item.thumbnail_url, 'list'),
          })) as MasterContent[];

          // 💾 캐시에 저장 (모든 필터에서 캐시)
          saveToCache(contents, selectedCategory, selectedType);

          // weekly_clicks가 0보다 큰 콘텐츠가 있는지 확인
          const hasClicks = contents.some(c => c.weekly_clicks > 0);

          if (hasClicks) {
            // 클릭수가 가장 높은 콘텐츠를 featured로
            const maxClicks = Math.max(...contents.map(c => c.weekly_clicks));
            const featuredIndex = contents.findIndex(c => c.weekly_clicks === maxClicks);
            setFeaturedContent(contents[featuredIndex]);
          } else {
            // 클릭수가 모두 0이면 첫 번째 콘텐츠를 featured로
            setFeaturedContent(contents[0]);
          }

          setAllContents(contents);
          setHasMore(count ? count > 10 : false); // 10개 이상이면 더 있음
          console.log(`✅ 홈 화면 콘텐츠 로드 성공 (${contents.length}개, 전체: ${count}개, 필터: ${selectedCategory}/${selectedType})`);

          // 🚀 백그라운드에서 나머지 콘텐츠 프리페칭 (모든 필터에서)
          if (count && count > 10) {
            console.log('🔮 [Prefetch] 백그라운드 프리페칭 시작...', `남은 콘텐츠: ${count - 10}개`);
            prefetchRemainingContents(count, selectedCategory, selectedType);
          }
        } else {
          // 데이터가 없으면 빈 배열
          console.log('📭 [HomePage] deployed 콘텐츠가 없습니다');
          setAllContents([]);
          setFeaturedContent(null);
          setHasMore(false);
        }
      } catch (error: any) {
        // AbortError는 조용히 무시 (타임아웃)
        if (error.name === 'AbortError') {
          console.warn('⏱️ 요청 타임아웃 - 캐시 데이터 사용 중');
        } else {
          // 에러 상세 내용 출력
          console.error('❌ 홈 화면 콘텐츠 로드 실패');
          console.error('에러 상세:', error);
          console.error('에러 메시지:', error.message);
          console.error('에러 스택:', error.stack);
        }

        // 에러 시 빈 배열로 초기화
        setAllContents([]);
        setFeaturedContent(null);
        setHasMore(false);
      } finally {
        setIsInitialLoading(false); // ✅ 초기 로딩 완료 표시
      }
    };

    fetchPublishedContents();
  }, [loadFromCache, saveToCache, selectedCategory, selectedType, prefetchRemainingContents]);

  // 🚀 최초 로드 완료 후 다른 카테고리들 백그라운드 프리페치
  const hasPrefetchedCategoriesRef = useRef(false);
  useEffect(() => {
    // 초기 로딩 완료 + 카테고리 2개 이상 + 아직 프리페치 안 함
    if (!isInitialLoading && availableCategories.length > 1 && !hasPrefetchedCategoriesRef.current) {
      hasPrefetchedCategoriesRef.current = true;

      // 1초 후 백그라운드에서 프리페치 시작 (메인 로딩 방해 안 함)
      setTimeout(() => {
        prefetchOtherCategories(selectedCategory, selectedType, availableCategories);
      }, 1000);
    }
  }, [isInitialLoading, availableCategories, selectedCategory, selectedType, prefetchOtherCategories]);

  // 🆕 실제로 데이터가 있는 카테고리만 조회하여 탭에 표시
  useEffect(() => {
    const fetchAvailableCategories = async () => {
      try {
        // 캐시 확인
        const cachedCategories = localStorage.getItem(CATEGORIES_CACHE_KEY);
        if (cachedCategories) {
          const { data, timestamp } = JSON.parse(cachedCategories);
          const now = Date.now();
          
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('✅ 캐시에서 카테고리 로드');
            setAvailableCategories(data);
            return;
          } else {
            localStorage.removeItem(CATEGORIES_CACHE_KEY);
          }
        }
        
        // DB에서 배포된 콘텐츠의 카테고리만 조회 (distinct)
        const { data, error } = await supabase
          .from('master_contents')
          .select('category_main')
          .eq('status', 'deployed');
        
        if (error) throw error;
        
        if (data) {
          // 🎯 카테고리 표시 순서 정의 (이 순서대로 탭에 표시됨)
          const CATEGORY_ORDER: TabCategory[] = [
            '전체', '연애', '이별', '궁합', '개인운세', '재물', '직업',
            '인간관계', '시험/학업', '건강', '자녀', '이사/매매', '기타'
          ];

          // 중복 제거
          const uniqueCategories = new Set(data.map(item => item.category_main).filter(Boolean));

          // 🔧 정의된 순서대로 정렬 (데이터가 있는 카테고리만 포함)
          const validCategories = CATEGORY_ORDER.filter(cat =>
            cat === '전체' || uniqueCategories.has(cat)
          );
          
          setAvailableCategories(validCategories);
          
          // 캐시에 저장
          localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({
            data: validCategories,
            timestamp: Date.now()
          }));
          
          console.log('✅ 사용 가능한 카테고리:', validCategories);
        }
      } catch (error) {
        console.error('카테고리 조회 실패:', error);
        // ⭐ 타임아웃 에러 체크
        if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('시간'))) {
          console.warn('⚠️ 네트워크 타임아웃 - 캐시 사용 또는 기본값 설정');
          // 캐시가 있으면 캐시 사용 (만료되어도)
          const cached = localStorage.getItem(CATEGORIES_CACHE_KEY);
          if (cached) {
            try {
              const { data: cachedCategories } = JSON.parse(cached);
              setAvailableCategories(cachedCategories);
              console.log('✅ 캐시된 카테고리 사용:', cachedCategories);
              return;
            } catch (e) {
              console.error('❌ 캐시 파싱 실패:', e);
            }
          }
        }
        // 실패 시 기본값 유지
        setAvailableCategories(['전체']);
      }
    };
    
    fetchAvailableCategories();
  }, [CATEGORIES_CACHE_KEY, CACHE_EXPIRY]);
  
  // Check if user is logged in (Supabase Auth 사용)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 [Auth] 세션 체크:', session ? '로그인됨' : '로그아웃');
      if (session?.user) {
        setIsLoggedIn(true);

        // public.users에서 사용자 정보 가져오기
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          // localStorage에 저장 (기존 코드 호환용)
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // 🔑 Auth 상태 변경 구독 - 로그인/로그아웃 시 즉시 반영
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 [Auth] 상태 변경:', event, session ? '세션있음' : '세션없음');
      if (session?.user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // 🚀 Phase 3: Featured 이미지 우선 프리로드 (중복 방지)
  useEffect(() => {
    if (featuredContent?.thumbnail_url) {
      const featuredUrl = featuredContent.thumbnail_url;

      // 🚀 중복 프리로드 방지
      if (!preloadedUrlsRef.current.has(featuredUrl)) {
        console.log('🎯 [Featured Preload] Featured 이미지 우선 프리로드:', featuredUrl);
        preloadImages([featuredUrl], 'high');
        preloadedUrlsRef.current.add(featuredUrl);
      }

      // 추가로 다음 5개 콘텐츠의 썸네일도 미리 로드 (중복 제외)
      const nextImages = allContents
        .filter(c => c.id !== featuredContent.id)
        .slice(0, 5)
        .map(c => c.thumbnail_url)
        .filter((url): url is string => Boolean(url) && !preloadedUrlsRef.current.has(url));

      if (nextImages.length > 0) {
        console.log(`🖼️ [Next Images Preload] 다음 ${nextImages.length}개 이미지 프리로드`);
        preloadImages(nextImages, 'low');
        nextImages.forEach(url => preloadedUrlsRef.current.add(url));
      }
    }
  }, [featuredContent, allContents]);
  
  // 🚫 클라이언트 사이드 필터링 제거 (서버에서 이미 필터링됨)
  // allContents가 이미 필터링된 데이터이므로 그대로 사용
  
  // Featured content from all results
  const featuredContentFiltered = useMemo(() => {
    if (allContents.length === 0) return null;
    
    // weekly_clicks가 0보다 큰 콘텐츠가 있는지 확인
    const hasClicks = allContents.some(c => c.weekly_clicks > 0);
    
    if (hasClicks) {
      // 클릭수가 가장 높은 콘텐츠를 featured로
      const maxClicks = Math.max(...allContents.map(c => c.weekly_clicks));
      return allContents.find(c => c.weekly_clicks === maxClicks) || null;
    } else {
      // 모두 0이면 최신 콘텐츠를 featured로
      return allContents[0];
    }
  }, [allContents]);

  // Contents list (excluding featured)
  const contentsList = useMemo(() => {
    if (!featuredContentFiltered) return allContents;
    
    // featured 제외 후 weekly_clicks 내림차순 정렬
    return allContents
      .filter(c => c.id !== featuredContentFiltered.id)
      .sort((a, b) => {
        // 1차: weekly_clicks 내림차순
        if (b.weekly_clicks !== a.weekly_clicks) {
          return b.weekly_clicks - a.weekly_clicks;
        }
        // 2차: created_at 내림차순 (최신순)
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [allContents, featuredContentFiltered]);
  
  // Load more contents (모든 필터에서 캐시 활용)
  const loadMoreContents = useCallback(async () => {
    if (isLoading || !hasMore) {
      console.log('⏭️ 추가 로드 스킵 (로딩 중이거나 더 이상 없음)');
      return;
    }

    console.log(`🔄 추가 콘텐츠 로드 시작 (페이지: ${currentPage + 1}, ${selectedCategory}/${selectedType})`);

    setIsLoading(true);

    try {
      const startIndex = (currentPage + 1) * 10;
      const endIndex = startIndex + 9;
      const cacheKey = getCacheKey(selectedCategory, selectedType);

      // 🚀 모든 필터에서 캐시 확인
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData } = JSON.parse(cached);

        // 캐시에 요청한 범위의 데이터가 있는지 확인
        if (cachedData.length > endIndex) {
          const newContents = cachedData.slice(startIndex, endIndex + 1) as MasterContent[];

          if (newContents.length > 0) {
            console.log(`✅ [Cache Hit] 캐시에서 ${newContents.length}개 로드 (${startIndex} ~ ${endIndex})`);

            // 전체 콘텐츠에 추가
            setAllContents(prev => {
              const existingIds = new Set(prev.map(c => c.id));
              const uniqueNewContents = newContents.filter(c => !existingIds.has(c.id));
              return [...prev, ...uniqueNewContents];
            });

            setCurrentPage(prev => prev + 1);
            setHasMore(endIndex < cachedData.length - 1);
            setIsLoading(false);

            console.log(`✅ [Cache] ${newContents.length}개 콘텐츠 캐시에서 로드 완료`);
            return; // 캐시에서 로드했으므로 DB 쿼리 스킵
          }
        }

        console.log(`📭 [Cache Miss] 캐시에 데이터 부족 (요청: ${endIndex}, 캐시: ${cachedData.length})`);
      }
      
      // 🎯 캐시에 없으면 DB에서 쿼리
      let query = supabase
        .from('master_contents')
        .select('id, content_type, title, status, created_at, thumbnail_url, weekly_clicks, view_count, category_main, category_sub, price_original, price_discount, discount_rate', { count: 'exact' })
        .eq('status', 'deployed');
      
      // 🔍 카테고리 필터 적용
      if (selectedCategory !== '전체') {
        query = query.eq('category_main', selectedCategory);
      }
      
      // 🔍 타입 필터 적용
      if (selectedType === 'paid') {
        query = query.eq('content_type', 'paid');
      } else if (selectedType === 'free') {
        query = query.eq('content_type', 'free');
      }
      
      // 정렬 및 범위 설정
      const { data, error, count } = await query
        .order('weekly_clicks', { ascending: false })
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newContents = data.map((item: any) => ({
          ...item,
          // 🎨 썸네일 최적화 (리스트용)
          thumbnail_url: getThumbnailUrl(item.thumbnail_url, 'list'),
        })) as MasterContent[];
        
        // 전체 콘텐츠에 추가
        setAllContents(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNewContents = newContents.filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNewContents];
        });
        
        setCurrentPage(prev => prev + 1);
        setHasMore(count ? endIndex < count - 1 : false);
        
        console.log(`✅ ${newContents.length}개 콘텐츠 추가 로드 완료 (전체: ${count}개, 필터: ${selectedCategory}/${selectedType})`);
      } else {
        setHasMore(false);
        console.log('ℹ️ 더 이상 로드할 콘텐츠 없음');
      }
    } catch (error: any) {
      // 416 범위 초과 에러 감지
      let errorString = '';
      try {
        errorString = JSON.stringify(error);
      } catch (e) {
        errorString = String(error);
      }
      
      const messageStr = typeof error?.message === 'string' ? error.message : String(error?.message || '');
      const detailsStr = typeof error?.details === 'string' ? error.details : String(error?.details || '');
      
      // 🔍 특별 케이스: Supabase가 416 응답을 파싱하지 못한 경우
      const isMalformedError = messageStr === '{"' || messageStr.startsWith('{') || messageStr.startsWith('[');
      
      const is416Error = 
        error?.code === 'PGRST103' || 
        error?.code === 'PGRST116' || 
        error?.status === 416 || 
        error?.statusCode === 416 ||
        messageStr.includes('416') ||
        messageStr.includes('Range Not Satisfiable') ||
        detailsStr.includes('416') ||
        detailsStr.includes('Range Not Satisfiable') ||
        errorString.includes('416') ||
        errorString.includes('Range Not Satisfiable') ||
        isMalformedError; // 파싱 실패한 에러도 416으로 간주
      
      if (error.name === 'AbortError') {
        console.warn('⏱️ 추가 콘텐츠 로드 타임아웃');
      } else if (is416Error) {
        // 범위 초과 에러는 조용히 처리 (더 이상 데이터가 없음)
        console.log('📭 더 이상 로드할 콘텐츠가 없습니다.');
      } else {
        // 그 외 에러는 상세 정보 출력
        console.error('❌ 추가 콘텐츠 로드 에러 (예상치 못한 에러):');
        console.error('전체 에러:', error);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, hasMore, isLoading, selectedCategory, selectedType]);
  
  // Reset when filters change
  useEffect(() => {
    // 필터 변경 시 상태 리셋
    setCurrentPage(0);
    setHasMore(true);

    // ⭐ 스크롤 이동 완전 제거 - 브라우저 기본 동작 사용
    // isFirstMount 체크도 제거 (더 이상 필요 없음)
  }, [selectedCategory, selectedType]);

  // 🚀 Phase 2: loadMoreContents ref 동기화 (Observer 재생성 방지)
  useEffect(() => {
    loadMoreContentsRef.current = loadMoreContents;
  }, [loadMoreContents]);
  
  // Infinite scroll observer
  useEffect(() => {
    // 초기 로딩 중이면 observer 설정하지 않음
    if (isInitialLoading) {
      console.log('⏳ [IntersectionObserver] 초기 로 중... observer 스킵');
      return;
    }
    
    console.log('🔍 [IntersectionObserver] 설정 중...', { hasMore, isLoading });
    
    const observer = new IntersectionObserver(
      entries => {
        const isIntersecting = entries[0].isIntersecting;
        console.log('👁️ [IntersectionObserver] 트리거됨', { 
          isIntersecting, 
          hasMore, 
          isLoading,
          shouldLoad: isIntersecting && hasMore && !isLoading
        });
        
        if (isIntersecting && hasMore && !isLoading) {
          console.log('🚀 [IntersectionObserver] loadMoreContents() 호출!');
          loadMoreContentsRef.current?.();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px 0px'  // 🚀 뷰포트 200px 전에 이미지 로드 시작
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      console.log('✅ [IntersectionObserver] Observer 등록 완료');
      observer.observe(currentTarget);
    } else {
      console.warn('⚠️ [IntersectionObserver] observerTarget이 없습니다');
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isInitialLoading]); // 🚀 loadMoreContents 의존성 제거

  const handleUserIconClick = () => {
    // localStorage 기준으로 즉시 체크 (비동기 세션 체크 지연 문제 해결)
    const user = localStorage.getItem('user');
    console.log('🔐 [프로필 클릭] user:', user ? '있음' : '없음', 'isLoggedIn:', isLoggedIn);
    if (user || isLoggedIn) {
      // 🛡️ iOS 스와이프 뒤로가기 대응: canGoBack 상태 전달
      navigate('/profile', { state: { canGoBack: true } });
    } else {
      navigate('/login', { state: { canGoBack: true } });
    }
  };

  const handleContentClick = async (contentId: string) => {
    // 조회수 증가
    const { data: currentData } = await supabase
      .from('master_contents')
      .select('view_count, weekly_clicks, content_type')
      .eq('id', contentId)
      .single();

    if (currentData) {
      await supabase
        .from('master_contents')
        .update({ 
          view_count: currentData.view_count + 1,
          weekly_clicks: currentData.weekly_clicks + 1
        })
        .eq('id', contentId);
    }

    // 🔑 SessionStorage에 플래그 설정 (홈에서 콘텐츠로 이동했음을 표시)
    sessionStorage.setItem('navigatedFromHome', 'true');
    console.log('🔑 [콘텐츠 클릭] SessionStorage 플래그 설정');

    // 🎯 무료/유료 구분하여 적절한 경로로 이동
    if (currentData?.content_type === 'free') {
      console.log('🆓 [홈] 무료 콘텐츠 → /free/content/:id로 이동');
      navigate(`/free/content/${contentId}`);
    } else {
      console.log('💰 [홈] 유료 콘텐츠 → /master/content/detail/:id로 이동');
      navigate(`/master/content/detail/${contentId}`);
    }
  };

  const handleCategoryChange = (category: TabCategory) => {
    setSelectedCategory(category);
    // ⭐ 세션 스토리지에 필터 상태 저장 (페이지 이동 후에도 유지)
    const filterState = { category, contentType: selectedType };
    sessionStorage.setItem(SESSION_FILTER_KEY, JSON.stringify(filterState));
    console.log('💾 [HomePage] 카테고리 필터 저장:', filterState);
  };

  const handleTypeChange = (type: 'all' | 'paid' | 'free') => {
    setSelectedType(type);
    // ⭐ 세션 스토리지에 필터 상태 저장 (페이지 이동 후에도 유지)
    const filterState = { category: selectedCategory, contentType: type };
    sessionStorage.setItem(SESSION_FILTER_KEY, JSON.stringify(filterState));
    console.log('💾 [HomePage] 타입 필터 저장:', filterState);
  };

  return (
    <div className="bg-white fixed inset-0 flex justify-center">
      <div className="bg-white w-full max-w-[440px] h-full flex flex-col">
        {/* Top Navigation */}
        <TopNavigationContainer
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          onUserIconClick={handleUserIconClick}
          availableCategories={availableCategories}
          isVisible={showNavigation}
        />

        {/* ⭐ Scrollable Content Area - overscroll-contain으로 iOS 바운스 방지 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Content Area */}
          <div className="content-stretch flex flex-col gap-[8px] items-start px-[20px] pt-[182px] pb-[60px] relative shrink-0 w-full">
          
          {/* ⭐️ 초기 로딩 중: 스켈레톤 UI 표시 */}
          {isInitialLoading ? (
            <HomeSkeleton />
          ) : (
            <>
              {/* Featured Content (메인 배너) */}
              {featuredContentFiltered && (
                <>
                  <ContentCard 
                    content={featuredContentFiltered} 
                    onClick={() => handleContentClick(featuredContentFiltered.id)}
                    isFeatured={true}
                  />
                  <Divider />
                </>
              )}

              {/* Content List */}
              {contentsList.length > 0 ? (
                contentsList.map((content, index) => (
                  <div key={content.id} className="flex flex-col gap-[8px] w-full">
                    <ContentCard
                      content={content}
                      onClick={() => handleContentClick(content.id)}
                      index={index}
                    />
                    {index < contentsList.length - 1 && <Divider />}
                  </div>
                ))
              ) : (
                !isLoading && !featuredContentFiltered && (
                  <div className="flex items-center justify-center w-full py-[60px]">
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[16px] text-[#999999]">
                      아직 등록된 콘텐츠가 없어요
                    </p>
                  </div>
                )
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center justify-center w-full py-[20px]">
                  <div className="animate-spin rounded-full h-[32px] w-[32px] border-b-2 border-[#48b2af]"></div>
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="h-[20px] w-full" />
            </>
          )}
        </div>
        </div>{/* ⭐ Scrollable Container 닫기 */}
      </div>
    </div>
  );
}