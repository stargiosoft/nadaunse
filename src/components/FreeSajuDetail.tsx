import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from "motion/react";
import svgPaths from '../imports/svg-e15u41g853';
import img from "figma:asset/5615ff21216f93eb47cac8ee15adee136174d7be.png";
import img1 from "figma:asset/b236509a5f2172bc63b883ba8abf132659ed54d9.png";
import img2 from "figma:asset/67f3616aab1dcdea805228bdd4e698e8f57dd487.png";

interface FreeSajuDetailProps {
  recordId: string;
  userName: string;
  productTitle: string;
  productImage: string;
  onClose: () => void;
  recommendedProducts?: Array<{
    id: number;
    title: string;
    type: 'free' | 'paid';
    image: string;
  }>;
  onProductClick?: (productId: number) => void;
  onBannerClick?: () => void;
  onUserIconClick?: () => void;
}

interface ResultItem {
  questionId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  previewText: string;
}

interface CachedData {
  contentId: string;
  sajuData: any;
  results: ResultItem[];
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function FreeSajuDetail({ 
  recordId, 
  userName, 
  productTitle,
  productImage,
  onClose, 
  recommendedProducts = [],
  onProductClick,
  onBannerClick,
  onUserIconClick
}: FreeSajuDetailProps) {
  const [visibleCount, setVisibleCount] = useState(3); // ⭐️ 표시할 콘텐츠 개수
  const [isBannerPressed, setIsBannerPressed] = useState(false); // ⭐️ 배너 프레스 상태
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // ⭐️ localStorage에서 결과 데이터 즉시 로드 (동기 작업이므로 로딩 불필요)
  const loadCachedData = (): { data: CachedData | null; error: boolean } => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [FreeSajuDetail] localStorage에서 데이터 즉시 로드');
    console.log('📌 [FreeSajuDetail] recordId (resultKey):', recordId);

    try {
      const dataStr = localStorage.getItem(recordId);
      console.log('📌 [FreeSajuDetail] localStorage 데이터:', dataStr ? '있음' : '없음');

      if (!dataStr) {
        console.error('❌ [FreeSajuDetail] localStorage에 데이터 없음');
        return { data: null, error: true };
      }

      const data: CachedData = JSON.parse(dataStr);
      console.log('✅ [FreeSajuDetail] 데이터 파싱 완료, results 개수:', data.results?.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { data, error: false };
    } catch (error) {
      console.error('❌ [FreeSajuDetail] 데이터 로드 중 에러:', error);
      return { data: null, error: true };
    }
  };

  // ⭐️ 초기화 시점에 즉시 로드 (useState 초기값으로 함수 실행)
  const initialLoad = loadCachedData();
  const [cachedData, setCachedData] = useState<CachedData | null>(initialLoad.data);
  const [dataLoadError, setDataLoadError] = useState(initialLoad.error);

  // 🔝 컴포넌트 마운트 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ⭐️ recordId가 변경되면 데이터 다시 로드 (페이지 전환 시)
  useEffect(() => {
    const result = loadCachedData();
    setCachedData(result.data);
    setDataLoadError(result.error);
  }, [recordId]);

  /**
   * ⭐ 백그라운드 프리페칭: 사용자가 콘텐츠를 보는 동안 10개 미리 로드
   */
  useEffect(() => {
    if (recommendedProducts.length > 3 && visibleCount === 3) {
      const timer = setTimeout(() => {
        const prefetchCount = Math.min(10, recommendedProducts.length);
        console.log('🚀 [백그라운드 프리페칭] 추천 콘텐츠 10개 미리 로드:', prefetchCount);
        setVisibleCount(prefetchCount);
      }, 500); // 0.5초 후 실행 (초기 렌더링 완료 후)

      return () => clearTimeout(timer);
    }
  }, [recommendedProducts.length, visibleCount]);

  /**
   * ⭐ 무한 스크롤: Intersection Observer 설정 (10개씩 로드)
   */
  useEffect(() => {
    // visibleCount가 10 미만이면 observer 설정 안함 (프리페칭 대기 중)
    if (visibleCount < 10 || !observerTarget.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && visibleCount < recommendedProducts.length) {
          const nextCount = Math.min(visibleCount + 10, recommendedProducts.length);
          console.log('📜 [무한 스크롤] 다음 10개 콘텐츠 로드:', nextCount);
          setVisibleCount(nextCount);
        }
      },
      {
        root: null,
        rootMargin: '200px', // 200px 전에 미리 로드
        threshold: 0.1
      }
    );

    const currentRef = observerTarget.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [visibleCount, recommendedProducts.length]);

  // ⭐️ 데이터 로드 실패 또는 데이터 없음 시 에러 화면
  // (localStorage 읽기는 동기 작업이므로 로딩 스피너 불필요)
  if (dataLoadError || !cachedData) {
    return (
      <div className="bg-white relative min-h-screen w-full flex justify-center items-center">
        <div className="text-center px-[20px]">
          <p className="text-[#999999] mb-4">결과를 찾을 수 없습니다</p>
          <button
            onClick={onClose}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white fixed inset-0 flex justify-center">
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
        {/* Top Bar */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex items-center justify-between px-[12px] h-full w-full">
            <div className="opacity-0 p-[4px] size-[44px]" />
            <p className="font-semibold text-[18px] text-black text-center tracking-[-0.36px]">상세 풀이</p>
            <button
              onClick={onClose}
              className="group flex items-center justify-center p-[4px] rounded-[12px] size-[44px] bg-transparent border-none cursor-pointer transition-colors duration-200 active:bg-gray-100"
            >
              <div className="size-[24px] transition-transform duration-200 group-active:scale-90 flex items-center justify-center">
                <svg className="block size-[20px]" fill="none" viewBox="0 0 24 24">
                  <path d="M4 20L20 4" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  <path d="M20 20L4 4" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* ⭐ Scrollable Content Area - overscroll-contain으로 iOS 바운스 방지 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Content Area */}
          <div className="px-0 pb-[100px] pt-[12px]">
          <motion.div 
            className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Product Info Card */}
            <motion.div 
              className="bg-[#f7f8f9] relative shrink-0 w-full mb-[-16px] z-10"
              variants={itemVariants}
            >
              <div className="size-full">
                <div className="content-stretch flex flex-col items-start px-[20px] py-[12px] relative w-full">
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
                    <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px]">
                      <div className="absolute inset-0 overflow-hidden rounded-[12px]">
                        <img alt="" className="absolute h-full left-0 max-w-none top-0 w-full object-cover" src={productImage} />
                      </div>
                      <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
                    </div>
                    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0">
                      <div className="bg-[#e7e7e7] content-stretch flex items-center justify-center px-[6px] relative rounded-[4px] shrink-0 pt-[3px] pb-[1px]">
                        <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[16px] relative shrink-0 text-[#6d6d6d] text-[12px] text-nowrap tracking-[-0.24px] whitespace-pre">무료 체험판</p>
                      </div>
                      <div className="relative shrink-0 w-full">
                        <div className="flex flex-row items-center justify-center size-full">
                          <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                            <p className="basis-0 font-medium grow leading-[23.5px] min-h-px min-w-px relative shrink-0 text-[15px] text-black tracking-[-0.3px]">
                              {productTitle}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Q&A Content */}
            <motion.div 
              className="content-stretch flex flex-col gap-[52px] items-start relative shrink-0 w-full"
              variants={containerVariants}
            >
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
                {/* ⭐️ 동적으로 질문/답변 렌더링 */}
                {cachedData.results.map((result, index) => (
                  <motion.div 
                    key={result.questionId} 
                    className="relative shrink-0 w-full"
                    variants={itemVariants}
                  >
                    {/* 첫 번째 아이템이 아니면 디바이더 표시 */}
                    {index > 0 && (
                      <div className="mb-[24px] w-full">
                        <div className="bg-[#f3f3f3] h-px shrink-0 w-full" />
                      </div>
                    )}
                    
                    {/* 질문/답변 내용 */}
                    <div className="size-full">
                      <div className="content-stretch flex flex-col items-start px-[20px] py-0 relative w-full">
                        <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                            <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[6px] py-px relative rounded-[8px] shrink-0">
                              <p className="font-medium leading-[22px] relative shrink-0 text-[#41a09e] text-[13px] text-nowrap whitespace-pre">
                                Q{result.questionOrder}
                              </p>
                            </div>
                            <div className="relative shrink-0 w-full">
                              <div className="flex flex-row items-center justify-center size-full">
                                <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                                  <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
                                    <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                                      {result.questionText}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                            <div className="relative shrink-0 w-full">
                              <div className="flex flex-row items-center justify-center size-full">
                                <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                                  <p className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] grow leading-[28.5px] min-h-px min-w-px relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                                    {result.previewText}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Promotion Banner */}
              <motion.div 
                className="bg-[#f8f8f9] relative shrink-0 w-full"
                variants={itemVariants}
              >
                <div className="size-full">
                  <div className="content-stretch flex flex-col items-start p-[20px] relative w-full">
                    <button
                      onClick={onBannerClick}
                      onTouchStart={() => setIsBannerPressed(true)}
                      onTouchEnd={() => setIsBannerPressed(false)}
                      onTouchCancel={() => setIsBannerPressed(false)}
                      className={`relative rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] shrink-0 w-full border-none cursor-pointer p-0 transition-all duration-200 ease-in-out active:scale-[0.96] active:bg-gray-50 overflow-visible ${isBannerPressed ? 'scale-[0.96] bg-gray-50' : 'bg-white'}`}
                    >
                      <div className="flex flex-row items-center size-full">
                        <div className="content-stretch flex items-center px-[20px] py-[12px] relative w-full gap-[12px] transition-all duration-150 ease-in-out active:scale-[0.96] active:bg-gray-50 cursor-pointer bg-white rounded-[16px]">
                          <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                            <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
                              <p className="font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px] w-full text-left">
                                월급쟁이에서 벗어, 대박의 길로
                              </p>
                              <p className="font-normal leading-[19px] relative shrink-0 text-[#848484] text-[13px] tracking-[-0.26px] w-full text-left">
                                퇴사 후 대박 터질 이밍 알려드립니다.
                              </p>
                            </div>
                            <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
                              <div className="h-[60px] relative shrink-0 w-[78px]">
                                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[8px]">
                                  <img 
                                    alt="광고 이미지" 
                                    className="absolute inset-0 size-full object-cover object-center" 
                                    src={img1} 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="relative shrink-0 size-[16px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                              <g id="arrow-right">
                                <path d="M5.94 13.28L10.2867 8.93333C10.8 8.42 10.8 7.58 10.2867 7.06667L5.94 2.72" id="Vector" stroke="var(--stroke-0, #999999)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                                <path d="M0.5 15.5L0.5 0.5L15.5 0.5L15.5 15.5L0.5 15.5Z" id="Vector_2" opacity="0" stroke="var(--stroke-0, #999999)" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Recommended Products */}
              <motion.div 
                className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full px-[20px]"
                variants={containerVariants}
              >
                <motion.div 
                  className="content-stretch flex items-center justify-between relative shrink-0 w-full"
                  variants={itemVariants}
                >
                  <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                    <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">이런 운세는 어때요?</p>
                  </div>
                </motion.div>
                
                {/* ⭐ 수직 스크롤 영역 */}
                <motion.div 
                  className="relative w-full flex flex-col"
                  variants={containerVariants}
                >
                  {recommendedProducts.slice(0, visibleCount).map((product, index) => (
                    <motion.div 
                      key={product.id}
                      variants={itemVariants}
                    >
                      {/* 구분선 (첫 번째 아이템 제외) */}
                      {index > 0 && (
                        <div className="relative shrink-0 w-full py-[4px]">
                          <svg className="block w-full h-[1px]" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                            <path d="M0 0.5H350" stroke="#F9F9F9" />
                          </svg>
                        </div>
                      )}
                      
                      <div className="w-full relative shrink-0">
                        <div 
                          onClick={() => onProductClick?.(product.id)}
                          className="box-border content-stretch flex gap-[10px] items-start justify-start px-0 py-[10px] relative rounded-[16px] shrink-0 w-full cursor-pointer transition-all duration-150 ease-out origin-center active:scale-[0.96] active:bg-gray-50"
                        >
                          {/* ⭐ 썸네일 이미지 - 직사각형 80x54 */}
                          <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px]">
                            {product.image ? (
                              <img 
                                alt={product.title} 
                                loading="lazy"
                                className="absolute inset-0 max-w-none object-center object-cover rounded-[12px] size-full" 
                                src={product.image} 
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
                            <div className="relative shrink-0 w-full">
                              <div className="flex flex-row items-center justify-center size-full">
                                <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                                  <p className="basis-0 font-['Pretendard_Variable:Medium',sans-serif] font-medium grow leading-[23.5px] min-h-px min-w-px relative shrink-0 text-[15px] text-black tracking-[-0.3px] overflow-ellipsis overflow-hidden line-clamp-2">
                                    {product.title}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* 뱃지 - 심화 해석판(청록) vs 무료 체험판(회색) */}
                            <div className={`${product.type === 'paid' ? 'bg-[#f0f8f8]' : 'bg-[#f9f9f9]'} content-stretch flex items-center justify-center px-[6px] pt-[3px] pb-[1px] relative rounded-[4px] shrink-0`}>
                              <p className={`font-medium leading-[16px] relative shrink-0 ${product.type === 'paid' ? 'text-[#41a09e]' : 'text-[#848484]'} text-[12px] text-nowrap tracking-[-0.24px]`}>
                                {product.type === 'paid' ? '심화 해석판' : '무료 체험판'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* ⭐ 무한 스크롤 트리거 */}
                  {visibleCount < recommendedProducts.length && (
                    <div 
                      ref={observerTarget}
                      className="h-[1px] w-full"
                      aria-hidden="true"
                    />
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        </div>{/* ⭐ Scrollable Container 닫기 */}
      </div>
    </div>
  );
}