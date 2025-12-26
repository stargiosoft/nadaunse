import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MasterContent } from '../types/masterContent';
import { supabase } from '../lib/supabase';
import { getThumbnailUrl } from '../lib/image';
import HomeSkeleton from '../components/skeletons/HomeSkeleton';
import svgPaths from "../imports/svg-94402brxf8";
import svgPathsLogo from "../imports/svg-7fu3k5931y";

type TabCategory = '전체' | '개인운세' | '연애' | '이별' | '궁합' | '재물' | '직업' | '시험/학업' | '건강' | '인간관계' | '자녀' | '이사/매매' | '기타';

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
          <div className="max-w-[440px] mx-auto w-full pl-[20px] pr-[16px] py-[4px]">
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
}

function ContentCard({ content, onClick, isFeatured = false }: ContentCardProps) {
  const isPaid = content.content_type === 'paid';
  
  if (isFeatured) {
    return (
      <div onClick={onClick} className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full cursor-pointer transition-all duration-150 ease-out active:bg-gray-50 active:p-[12px] rounded-[16px]" data-name="Featured Card">
        <div className="group box-border relative shrink-0 w-full pt-0 pb-0 pointer-events-auto touch-manipulation [-webkit-tap-highlight-color:transparent] !transform-none !transition-none p-[0px]" data-name="Card / Browse Card">
          <div className="box-border content-stretch w-full">
            <div className="w-full">
 
  <div className="box-border content-stretch w-full">
    <div className="flex flex-col gap-[12px] items-center justify-center w-full">
      <div className="aspect-[350/220] pointer-events-none relative rounded-[16px] shrink-0 w-full bg-[#f0f0f0]">
        {content.thumbnail_url ? (
          <img
            alt={content.title}
            loading="lazy"
            className="absolute inset-0 object-cover rounded-[16px] size-full"
            src={content.thumbnail_url}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[14px] text-[#999999]">이미지 없음</p>
          </div>
        )}
        <div className="absolute inset-[-1px] rounded-[17px] border border-[#f9f9f9]" />
      </div>

      <div className="relative shrink-0 w-full overflow-hidden">
        <div className="box-border flex flex-col gap-[4px] items-start px-[4px]">
          <p className="text-[15px] font-medium line-clamp-2">
            {content.title}
          </p>

          <div className={`${isPaid ? 'bg-[#f0f8f8]' : 'bg-[#f9f9f9]'} px-[8px] py-[4px] rounded-[8px]`}>
            <p className={`${isPaid ? 'text-[#41a09e]' : 'text-[#848484]'} text-[12px]`}>
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
        <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px] bg-[#f0f0f0]" data-name="Thumbnail">
          {content.thumbnail_url ? (
            <img 
              alt={content.title} 
              loading="lazy"
              className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[12px] size-full" 
              src={content.thumbnail_url} 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[10px] text-[#999999]">이미지<br/>없음</p>
            </div>
          )}
          <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
        </div>
        <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0 overflow-hidden" data-name="Card / PriceBlock">
          <div className="relative shrink-0 w-full" data-name="Container">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full overflow-hidden">
                <p className="basis-0 font-['Pretendard_Variable:Medium',sans-serif] grow leading-[23.5px] min-h-px min-w-px not-italic relative shrink-0 text-[15px] text-black tracking-[-0.3px] line-clamp-2 overflow-hidden">
                  {content.title}
                </p>
              </div>
            </div>
          </div>
          <div className={`${isPaid ? 'bg-[#f0f8f8]' : 'bg-[#f9f9f9]'} box-border content-stretch flex gap-[10px] items-center justify-center px-[6px] pb-[2px] pt-[3px] relative rounded-[4px] shrink-0`} data-name="Label Box">
            <p className={`font-['Pretendard_Variable:Medium',sans-serif] leading-[16px] not-italic relative shrink-0 ${isPaid ? 'text-[#41a09e]' : 'text-[#848484]'} text-[12px] text-nowrap tracking-[-0.24px] whitespace-pre`}>
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
  const [selectedCategory, setSelectedCategory] = useState<TabCategory>('전체');
  const [selectedType, setSelectedType] = useState<'all' | 'paid' | 'free'>('all');
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

  // 🛡️ iOS Safari 히스토리 버그 해결: 개선된 버전
  useEffect(() => {
    const initHistory = () => {
      const currentLength = window.history.length;
      console.log('🔧 [히스토리 초기화] 현재 길이:', currentLength);

      // SessionStorage에서 히스토리 상태 확인
      const hasNavigatedFromHome = sessionStorage.getItem('navigatedFromHome');
      console.log('🔍 [히스토리] SessionStorage 상태:', hasNavigatedFromHome);

      // 🆕 홈 진입 시 항상 히스토리 상태 정리
      if (hasNavigatedFromHome === 'true') {
        // 뒤로가기로 홈에 왔으므로 플래그 제거
        sessionStorage.removeItem('navigatedFromHome');
        console.log('🧹 [히스토리] SessionStorage 플래그 제거');

        // 🆕 현재 히스토리 상태를 홈으로 교체 (스택 정리)
        window.history.replaceState({ page: 'home' }, '', '/');
        console.log('✅ [히스토리] 홈 상태로 replaceState 완료');
      }
    };

    initHistory();
  }, []);

  // 🛡️ popstate 이벤트 처리 개선
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('⬅️ [popstate] 뒤로가기 감지:', event.state);
      console.log('📍 [popstate] 현재 경로:', window.location.pathname);

      // 홈이 아닌 곳에서 popstate 발생 시
      if (window.location.pathname !== '/') {
        const hasNavigatedFromHome = sessionStorage.getItem('navigatedFromHome');

        if (hasNavigatedFromHome === 'true') {
          console.log('🛡️ [popstate] 홈으로 강제 이동');
          sessionStorage.removeItem('navigatedFromHome');

          // 🆕 navigate 대신 replaceState + reload 사용 (더 안정적)
          window.history.replaceState({ page: 'home' }, '', '/');
          window.location.replace('/');
          return;
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
  const CACHE_VERSION = 'v2'; // 정렬 로직 변경 시 버전 업
  const VERSIONED_CACHE_KEY = `${CACHE_KEY}_${CACHE_VERSION}`;
  const CATEGORIES_CACHE_KEY = 'homepage_categories_cache';
  
  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(() => {
    try {
      // 🗑️ 이전 버전 캐시 삭제
      const oldKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(CACHE_KEY) && key !== VERSIONED_CACHE_KEY
      );
      oldKeys.forEach(key => localStorage.removeItem(key));
      
      const cached = localStorage.getItem(VERSIONED_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // 캐시가 유효한 경우 (5분 이내)
        if (now - timestamp < CACHE_EXPIRY) {
          console.log('✅ 캐시에서 데이터 로드');
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
          console.log('⏰ 캐시 만료됨');
          localStorage.removeItem(VERSIONED_CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패');
      localStorage.removeItem(VERSIONED_CACHE_KEY);
    }
    return false;
  }, []);
  
  // 캐시에 데이터 저장
  const saveToCache = useCallback((data: MasterContent[]) => {
    try {
      localStorage.setItem(VERSIONED_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('💾 캐시에 데이터 저장 (버전:', CACHE_VERSION, ')');
    } catch (error) {
      console.error('캐시 저장 실패');
    }
  }, [VERSIONED_CACHE_KEY]);
  
  // 🚀 백그라운드에서 나머지 콘텐츠 프리페칭
  const prefetchRemainingContents = useCallback(async (totalCount: number) => {
    try {
      const remainingCount = totalCount - 10;
      const batchSize = 20; // 한 번에 20개씩 로드
      let loadedCount = 0;
      
      console.log(`🔮 [Prefetch] 총 ${remainingCount}개 콘텐츠를 백그라운드에서 로드합니다...`);
      
      // 여러 배치로 나누어 로드
      while (loadedCount < remainingCount) {
        const startIndex = 10 + loadedCount;
        const endIndex = Math.min(startIndex + batchSize - 1, totalCount - 1);
        
        console.log(`🔮 [Prefetch] 배치 로드 중... (${startIndex} ~ ${endIndex})`);
        
        const { data, error } = await supabase
          .from('master_contents')
          .select('id, content_type, title, status, created_at, thumbnail_url, weekly_clicks, view_count, category_main, category_sub, price_original, price_discount, discount_rate')
          .eq('status', 'deployed')
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
          const cached = localStorage.getItem(VERSIONED_CACHE_KEY);
          if (cached) {
            const { data: cachedData } = JSON.parse(cached);
            const updatedData = [...cachedData, ...newContents];
            
            // 중복 제거
            const uniqueData = Array.from(
              new Map(updatedData.map(item => [item.id, item])).values()
            );
            
            saveToCache(uniqueData);
            console.log(`✅ [Prefetch] ${newContents.length}개 추가됨 (누적: ${uniqueData.length}개)`);
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
  }, [saveToCache, VERSIONED_CACHE_KEY]);
  
  // Load published contents from Supabase
  useEffect(() => {
    const fetchPublishedContents = async () => {
      // 🚀 필터가 '전체/all'일 때만 캐시에서 로드
      const shouldUseCache = selectedCategory === '전체' && selectedType === 'all';
      const hasCache = shouldUseCache ? loadFromCache() : false;
      
      try {
        console.log('🔍 [HomePage] deployed 콘텐츠 조회 시작...');
        
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
        
        // 🔍 타입 필터 적��
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
          
          // 💾 캐시에 저장 (필터별로 저장하지 않고 전체만 캐시)
          if (selectedCategory === '전체' && selectedType === 'all') {
            saveToCache(contents);
          }
          
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
          
          // 🚀 백그라운드에서 나머지 콘텐츠 프리페칭 (전체/all 필터일 때만)
          if (shouldUseCache && count && count > 10) {
            console.log('🔮 [Prefetch] 백그라운드 프리페칭 시작...', `남은 콘텐츠: ${count - 10}개`);
            prefetchRemainingContents(count);
          }
        } else {
          // 데이터가 없으면 캐시도 없으면 빈 배열
          console.log('📭 [HomePage] deployed 콘텐츠가 없습니다');
          if (!hasCache) {
            setAllContents([]);
            setFeaturedContent(null);
          }
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
        
        // 캐시가 없으면 빈 배열로 초기화
        if (!hasCache) {
          setAllContents([]);
          setFeaturedContent(null);
        }
        setHasMore(false);
      } finally {
        setIsInitialLoading(false); // ✅ 초기 로딩 완료 표시
      }
    };

    fetchPublishedContents();
  }, [loadFromCache, saveToCache, selectedCategory, selectedType]);
  
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
          // 중복 제거 및 "전체" 추가
          const uniqueCategories = ['전체', ...new Set(data.map(item => item.category_main).filter(Boolean))];
          
          // TabCategory 타입으로 필터링 (타입 안전성)
          const validCategories = uniqueCategories.filter(cat => 
            ['전체', '개인운세', '연애', '이별', '궁합', '재물', '직업', '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'].includes(cat)
          ) as TabCategory[];
          
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
  }, []);
  
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
  
  // Load more contents
  const loadMoreContents = useCallback(async () => {
    if (isLoading || !hasMore) {
      console.log('⏭️ 추가 로드 스킵 (로딩 중이거나 더 이상 없음)');
      return;
    }
    
    console.log(`🔄 추가 콘텐츠 로드 시작 (페이지: ${currentPage + 1})`);
    
    setIsLoading(true);
    
    try {
      const startIndex = (currentPage + 1) * 10;
      const endIndex = startIndex + 9;
      
      // 🎯 쿼리 빌더 시작 (필터 적용)
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
  
  // Infinite scroll observer
  useEffect(() => {
    // 초기 로딩 중이면 observer 설정하지 않음
    if (isInitialLoading) {
      console.log('⏳ [IntersectionObserver] 초기 로딩 중... observer 스킵');
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
          loadMoreContents();
        }
      },
      { threshold: 0.1 }
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
  }, [hasMore, isLoading, loadMoreContents, isInitialLoading]);

  const handleUserIconClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleContentClick = async (contentId: string) => {
    // 조회수 증가 (기존 코드 유지)
    const { data: currentData } = await supabase
      .from('master_contents')
      .select('view_count, weekly_clicks')
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

    // 🆕 개선된 히스토리 관리
    sessionStorage.setItem('navigatedFromHome', 'true');
    sessionStorage.setItem('lastContentId', contentId); // 🆕 마지막 콘텐츠 ID 저장
    console.log('🔑 [콘텐츠 클릭] SessionStorage 플래그 설정, contentId:', contentId);

    // 🆕 명확한 히스토리 상태와 함께 이동
    window.history.pushState(
      { page: 'content-detail', contentId, from: 'home' },
      '',
      `/master/content/detail/${contentId}`
    );

    // React Router로 페이지 렌더링
    navigate(`/master/content/detail/${contentId}`, { replace: true });
  };

  const handleCategoryChange = (category: TabCategory) => {
    setSelectedCategory(category);
  };

  const handleTypeChange = (type: 'all' | 'paid' | 'free') => {
    setSelectedType(type);
  };

  return (
    <div className="bg-white relative w-full min-h-screen flex justify-center">
      <div className="bg-white relative w-full max-w-[440px] min-h-screen flex flex-col items-center">
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
      </div>
    </div>
  );
}