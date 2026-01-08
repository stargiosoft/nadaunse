import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import svgPaths from "../imports/svg-7sko9n1pie";
import { motion } from "motion/react";
import ArrowLeft from './ArrowLeft';

interface ResultCompletePageProps {
  onBack?: () => void;
  onClose?: () => void;
}

interface RecommendedContent {
  id: string;
  title: string;
  thumbnail_url: string;
  category_main: string;
  price_original: number;
  price_discount: number;
  discount_rate: number;
  content_type: string;
}

function HomeIndicatorLight() {
  return (
    <div className="hidden" />
  );
}

function CharacterIllustration() {
  return (
    <div className="h-[179.999px] relative shrink-0 w-[146px]">
      <div className="absolute inset-[-0.8%_0_0_-0.98%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 148 182">
          <g id="Group 427318538">
            <path d={svgPaths.p347a84f0} fill="#F4F4F4" id="Vector" />
            <g id="Group">
              <path d={svgPaths.pca83900} fill="#FDD751" id="Vector_2" stroke="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.88158" />
              <path d={svgPaths.p10a04f00} fill="#EFC748" id="Vector_3" />
              <path d={svgPaths.p2f464980} fill="#FDD751" id="Vector_4" stroke="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.88158" />
              <path d={svgPaths.p2210d400} fill="#EFC748" id="Vector_5" />
            </g>
            <g id="Group 427318537">
              <path d={svgPaths.p12a56ff0} fill="white" id="Vector_6" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.88158" />
              <g id="Vector_7">
                <path d={svgPaths.p1f5d5680} fill="white" />
                <path d={svgPaths.pbf84f80} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.88158" />
              </g>
            </g>
            <g id="Group_2">
              <path d={svgPaths.p11ec2c00} fill="black" id="Vector_8" />
              <path d={svgPaths.p5b85200} fill="black" id="Vector_9" />
            </g>
            <path d={svgPaths.p2ea90b00} fill="#BCD961" id="Vector_10" stroke="black" strokeMiterlimit="10" strokeWidth="2.88158" />
            <path d={svgPaths.p37227580} fill="#BCD961" id="Vector_11" stroke="black" strokeMiterlimit="10" strokeWidth="2.88158" />
            <path d="M82.7921 33.2737V19.9155" id="Vector_12" stroke="black" strokeMiterlimit="10" strokeWidth="2.88158" />
            <path d={svgPaths.p23784a00} fill="#FDD751" id="Vector_13" stroke="black" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.88158" />
            <path d={svgPaths.p749900} id="Vector_14" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.88158" />
            <path d={svgPaths.p702f100} id="Vector_15" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.88158" />
          </g>
        </svg>
      </div>
    </div>
  );
}

interface CouponCardProps {
  isIssued: boolean;
  isLoading: boolean;
  onClick?: () => void;
}

function CouponCard({ isIssued, isLoading, onClick }: CouponCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isIssued || isLoading}
      className={`content-stretch flex items-start overflow-clip relative rounded-[16px] shrink-0 w-full border-none bg-transparent p-0 ${
        isIssued || isLoading ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <div className="basis-0 bg-[#f9f9f9] grow min-h-px min-w-px relative shrink-0">
        <div className="flex flex-col justify-center size-full">
          <div className="content-stretch flex flex-col items-start justify-center px-[24px] py-[20px] relative w-full">
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
              <div className="relative shrink-0 size-[40px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
                  <g id="twemoji:wrapped-gift" opacity={isIssued ? "0.8" : "1"}>
                    <path d={svgPaths.p3c46be00} fill="#FFD16F" id="Vector" />
                    <path d={svgPaths.p35ee7080} fill="#FFD16F" id="Vector_2" />
                    <path d={svgPaths.p3323b300} fill="#FCAB40" id="Vector_3" />
                    <path d={svgPaths.p21bad880} fill="#FF5569" id="Vector_4" />
                    <path d={svgPaths.p3856f080} fill="#FF5569" id="Vector_5" />
                  </g>
                </svg>
              </div>
              <div className={`content-stretch flex flex-col gap-[2px] items-start justify-center relative shrink min-w-0 ${
                isIssued ? 'text-[#848484]' : 'text-[#151515]'
              }`}>
                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[19px] relative text-[13px] tracking-[-0.26px] whitespace-normal text-left">
                  운세 구매 고객 전용 쿠폰
                </p>
                <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[18px] tracking-[-0.36px]">
                  3,000원
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`content-stretch flex flex-col items-center justify-center px-[12px] py-[16px] relative self-stretch shrink-0 w-[88px] ${
        isIssued ? 'bg-[#f3f3f3]' : 'bg-[#f9f9f9]'
      }`}>
        <div aria-hidden="true" className="absolute border-[#e7e7e7] border-[0px_0px_0px_1px] border-dashed inset-0 pointer-events-none" />
        {isLoading ? (
          <div className="animate-spin rounded-full h-[20px] w-[20px] border-b-2 border-[#48b2af]"></div>
        ) : isIssued ? (
          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#999] text-[13px] text-center w-full">
            발급<br />완료
          </p>
        ) : (
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Download className="w-5 h-5 text-[#848484]" />
          </motion.div>
        )}
      </div>
    </button>
  );
}

interface ContentCardProps {
  content: RecommendedContent;
  onClick: () => void;
}

function ContentCard({ content, onClick }: ContentCardProps) {
  const COUPON_DISCOUNT = 3000;
  const finalPrice = Math.max(0, content.price_discount - COUPON_DISCOUNT);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[200px] flex flex-col gap-[8px] items-start bg-transparent border-none cursor-pointer p-0"
    >
      {/* Thumbnail */}
      <div className="h-[120px] pointer-events-none relative rounded-[12px] shrink-0 w-[200px] overflow-hidden">
        {content.thumbnail_url ? (
          <img
            alt={content.title}
            className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full"
            src={content.thumbnail_url}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-[#f3f3f3] flex items-center justify-center rounded-[12px]">
            <p className="text-[#999] text-[12px]">이미지</p>
          </div>
        )}
        <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
      </div>

      {/* Content Info */}
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
                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[23.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px] pb-[1px] w-full text-left">
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
                  <p className="relative shrink-0 text-[#ff6678]">{content.discount_rate}%</p>
                  <p className="relative shrink-0 text-black">{content.price_discount.toLocaleString()}원</p>
                </div>
                <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] line-through relative shrink-0 text-[#999] text-[13px]  pb-[1px] text-nowrap">
                  {content.price_original.toLocaleString()}원
                </p>
              </div>

              {/* 쿠폰 적용가 (쿠폰이 있을 때만) */}
              {COUPON_DISCOUNT > 0 && (
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
    </button>
  );
}

interface ToastProps {
  message: string;
  show: boolean;
}

function Toast({ message, show }: ToastProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-[36px] left-1/2 -translate-x-1/2 z-50 backdrop-blur-[15px] backdrop-filter bg-[rgba(0,0,0,0.5)] content-stretch flex flex-col items-start pl-[12px] pr-[16px] py-[8px] rounded-[999px]">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <Check className="w-6 h-6 text-[#46BB6F]" />
        <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[13px] text-nowrap text-white">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function ResultCompletePage({ onBack, onClose }: ResultCompletePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCouponIssued, setIsCouponIssued] = useState(false);
  const [isIssuingCoupon, setIsIssuingCoupon] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [recommendedContents, setRecommendedContents] = useState<RecommendedContent[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [displayCount, setDisplayCount] = useState(6);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(true); // ⭐ 쿠폰 체크 중 상태
  const [contentCategory, setContentCategory] = useState<string | null>(null); // ⭐ 현재 콘텐츠의 카테고리

  // ⭐ 페이지 진입 시 오버스크롤(바운스) 방지
  useEffect(() => {
    document.body.style.overscrollBehaviorY = 'none';
    return () => {
      document.body.style.overscrollBehaviorY = 'auto';
    };
  }, []);

  // ⭐ 페이지 로드 시 쿠폰 발급 여부 체크 + 추천 콘텐츠 조회 + 현재 콘텐츠 카테고리 조회
  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        checkCouponIssued(),
        fetchRecommendedContents(),
        fetchContentCategory()
      ]);
    };

    initializePage();
  }, []);

  /**
   * ⭐ 해당 주문으로 이미 쿠폰이 발급되었는지 체크
   */
  const checkCouponIssued = async () => {
    setIsCheckingCoupon(true);
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      // 로그아웃 사용자는 체크 불필요
      if (!user?.id) {
        console.log('🔍 로그아웃 사용자 - 쿠폰 체크 스킵');
        setIsCheckingCoupon(false);
        return;
      }

      const orderId = location.state?.orderId;
      if (!orderId) {
        console.log('🔍 orderId 없음 - 쿠폰 체크 스킵');
        setIsCheckingCoupon(false);
        return;
      }

      console.log('🔍 쿠폰 발급 여부 체크 시작:', { userId: user.id, orderId });

      // 1. 재방문 쿠폰 ID 조회
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('id')
        .eq('coupon_type', 'revisit')
        .single();

      if (couponError || !couponData) {
        console.error('❌ 쿠폰 조회 실패:', couponError);
        setIsCheckingCoupon(false);
        return;
      }

      // 2. 이미 발급받았는지 확인
      const { data: existingCoupon, error: checkError } = await supabase
        .from('user_coupons')
        .select('id, issued_at')
        .eq('user_id', user.id)
        .eq('coupon_id', couponData.id)
        .eq('source_order_id', orderId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ 쿠폰 발급 여부 체크 실패:', checkError);
        setIsCheckingCoupon(false);
        return;
      }

      if (existingCoupon) {
        console.log('✅ 이미 발급된 쿠폰:', existingCoupon);
        setIsCouponIssued(true);
      } else {
        console.log('📋 발급 가능한 쿠폰');
        setIsCouponIssued(false);
      }
    } catch (error) {
      console.error('❌ 쿠폰 체크 중 오류:', error);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const fetchRecommendedContents = async () => {
    setIsLoadingContents(true);
    try {
      const { data, error } = await supabase
        .from('master_contents')
        .select('*')
        .eq('content_type', 'paid')
        .eq('status', 'deployed')
        .order('weekly_clicks', { ascending: false })
        .limit(20); // 최대 20개 로드

      if (error) {
        console.error('❌ 추천 콘텐츠 조회 실패:', error);
      } else if (data) {
        console.log('✅ 추천 콘텐츠 조회 성공:', data.length, '개');
        setRecommendedContents(data);
      }
    } catch (error) {
      console.error('❌ 추천 콘텐츠 조회 중 오류:', error);
    } finally {
      setIsLoadingContents(false);
    }
  };

  /**
   * ⭐ 현재 주문의 콘텐츠 카테고리 조회
   * - orderId로 orders 테이블에서 content_id 조회
   * - content_id로 master_contents 테이블에서 category_main 조회
   */
  const fetchContentCategory = async () => {
    try {
      const orderId = location.state?.orderId;
      if (!orderId) {
        console.log('🔍 orderId 없음 - 카테고리 조회 스킵');
        return;
      }

      console.log('🔍 콘텐츠 카테고리 조회 시작:', { orderId });

      // orders → master_contents 조인해서 category_main 조회
      const { data, error } = await supabase
        .from('orders')
        .select('content_id, master_contents(category_main)')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ 콘텐츠 카테고리 조회 실패:', error);
        return;
      }

      // master_contents가 객체로 반환됨
      const category = (data?.master_contents as { category_main: string } | null)?.category_main;
      if (category) {
        console.log('✅ 콘텐츠 카테고리 조회 성공:', category);
        setContentCategory(category);
      }
    } catch (error) {
      console.error('❌ 콘텐츠 카테고리 조회 중 오류:', error);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewOtherContents = () => {
    // ⭐ 홈으로 이동하면서 localStorage에 필터 정보 저장
    // - 현재 본 콘텐츠의 카테고리로 필터 자동 선택
    // - 카테고리 정보가 없으면 '전체'로 설정
    localStorage.setItem('homeFilter', JSON.stringify({
      category: contentCategory || '전체',
      contentType: 'all'  // ⭐ '종합' 필터로 설정
    }));
    console.log('🏠 다른 운세 보기 클릭 - 홈 필터 설정:', { category: contentCategory || '전체' });
    navigate('/');
  };

  const handleIssueCoupon = async () => {
    if (isCouponIssued || isIssuingCoupon) return;

    setIsIssuingCoupon(true);
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user?.id) {
        alert('로그인이 필요한 서비스입니다.');
        setIsIssuingCoupon(false);
        return;
      }

      // ⭐ orderId를 location.state에서 가져오기
      const orderId = location.state?.orderId;
      if (!orderId) {
        console.error('❌ orderId가 없습니다.');
        alert('주문 정보를 찾을 수 없습니다.');
        setIsIssuingCoupon(false);
        return;
      }

      console.log('🎟️ 재구매 쿠폰 발급 시작:', { userId: user.id, orderId });

      const { data, error } = await supabase.functions.invoke('issue-revisit-coupon', {
        body: { 
          user_id: user.id,
          source_order_id: orderId  // ⭐ source_order_id 추가
        }
      });

      if (error) {
        console.error('❌ 쿠폰 발급 실패:', error);
        alert('쿠폰 발급에 실패했습니다. 다시 시도해주세요.');
      } else {
        console.log('✅ 쿠폰 발급 성공:', data);
        setIsCouponIssued(true);
        setShowToast(true);

        // 2.2초 후 토스트 숨기기
        setTimeout(() => {
          setShowToast(false);
        }, 2200);
      }
    } catch (error) {
      console.error('❌ 쿠폰 발급 중 오류:', error);
      alert('쿠폰 발급에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsIssuingCoupon(false);
    }
  };

  const handleMoreView = () => {
    setDisplayCount(prev => Math.min(prev + 6, recommendedContents.length));
  };

  const handleContentClick = (content: RecommendedContent) => {
    if (content.content_type === 'free') {
      navigate(`/product/${content.id}/free`);
    } else {
      navigate(`/master/content/detail/${content.id}`);
    }
  };

  const displayedContents = recommendedContents.slice(0, displayCount);
  const hasMore = displayCount < recommendedContents.length;

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative">
        {/* Top Navigation */}
        <div className="bg-white h-[52px] sticky top-0 z-20 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <ArrowLeft onClick={handleBack} />
                <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                  풀이는 여기까지예요
                </p>
                <button
                  onClick={handleClose}
                  className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] bg-transparent border-none cursor-pointer transition-all duration-200 ease-in-out active:bg-gray-100 active:scale-95 transform-gpu"
                >
                  <X className="w-6 h-6 text-[#848484]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-[16px] shrink-0 w-full" />

        {/* Main Content */}
        <motion.div 
          className="flex flex-col gap-[32px] items-center w-full max-w-[440px] mx-auto pb-[140px]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {/* Character & Buttons Section */}
          <motion.div 
            className="flex flex-col gap-[12px] items-center relative shrink-0 w-full px-[20px]"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {/* Character Illustration */}
            <motion.div 
              className="flex items-center justify-center py-[40px] relative shrink-0 w-full"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
            >
              <CharacterIllustration />
            </motion.div>

            {/* Coupon Card */}
            <motion.div
              className="w-full flex justify-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
            >
              <CouponCard 
                isIssued={isCouponIssued}
                isLoading={isIssuingCoupon}
                onClick={handleIssueCoupon}
              />
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex gap-[12px] items-start relative shrink-0 w-full"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
            >
              {/* 홈으로 가기 */}
              <button
                onClick={handleGoHome}
                className="basis-0 grow h-[48px] min-h-px min-w-px relative rounded-[12px] shrink-0 bg-[#f0f8f8] border-none cursor-pointer transition-transform transform-gpu active:scale-96 active:bg-[#E4F7F7]"
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="flex items-center justify-center px-[12px] py-0 relative size-full">
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#48b2af] text-[15px] text-nowrap tracking-[-0.45px]">
                      홈으로 가기
                    </p>
                  </div>
                </div>
              </button>

              {/* 다른 운세 보기 */}
              <button
                onClick={handleViewOtherContents}
                className="basis-0 grow h-[48px] min-h-px min-w-px relative rounded-[12px] shrink-0 bg-[#48b2af] border-none cursor-pointer transition-transform transform-gpu active:scale-96 active:bg-[#389e9b]"
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="flex items-center justify-center px-[12px] py-0 relative size-full">
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[15px] text-nowrap text-white tracking-[-0.45px]">
                      다른 운세 보기
                    </p>
                  </div>
                </div>
              </button>
            </motion.div>
          </motion.div>

          {/* Divider */}
          <motion.div 
            className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          />

          {/* Recommended Contents Section */}
          <motion.div 
            className="flex flex-col gap-[12px] items-start relative shrink-0 w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            {/* Section Title */}
            <div className="flex items-center justify-between relative shrink-0 w-full px-[20px]">
              <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                이런 운세는 어때요?
              </p>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ touchAction: 'pan-x' }}>
              <div className="flex gap-[12px] items-stretch pb-[8px] px-[20px]">
                {isLoadingContents ? (
                  <div className="flex-shrink-0 w-[200px] h-[200px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-[32px] w-[32px] border-b-2 border-[#48b2af]"></div>
                  </div>
                ) : (
                  <>
                    {displayedContents.map((content) => (
                      <ContentCard
                        key={content.id}
                        content={content}
                        onClick={() => handleContentClick(content)}
                      />
                    ))}

                    {/* More View Button */}
                    {hasMore && (
                      <div
                        onClick={handleMoreView}
                        className="relative shrink-0 w-[200px] cursor-pointer select-none group py-[1px]"
                      >
                        <div className="content-stretch flex items-center pl-0 pr-[20px] py-0 relative size-full">
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
                                        d={svgPaths.p3bb19300} 
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
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Home Indicator */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px]">
          <HomeIndicatorLight />
        </div>
      </div>

      {/* Toast */}
      <Toast message="쿠폰이 발급되었습니다" show={showToast} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}