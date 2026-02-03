import React, { useEffect, useState } from 'react';
import svgPaths from '@/imports/svg-5teuf2oi3d';
import Lottie from 'lottie-react';
import animationData from '@/data/report-animation.json';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { issueRevisitCoupon } from '@/lib/coupon';
import { DotLoading } from './ui/PageLoader';
import WeeklyReportLoading from './WeeklyReportLoading';

// --- SVGs ---

function CloseIcon() {
  return (
    <div className="absolute inset-0">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d="M5 19L19 5" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M19 19L5 5" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    </div>
  );
}

function CouponSvg() {
  return (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1
      }}
      style={{ 
        width: '194px', 
        height: '194px', 
        position: 'relative',
        // Force GPU layer and prevent browser from removing the layer after animation
        transform: 'translateZ(0)',
        willChange: 'transform, opacity'
      }}
    >
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 194 194">
        <g clipPath="url(#clip0_1_1654)">
          <path d={svgPaths.p3eaa1500} fill="#FFEEF1" />
          <path d={svgPaths.p423d800} fill="url(#paint0_radial_1_1654)" />
          <g>
            <path d={svgPaths.p2d0ca6c0} fill="url(#paint1_linear_1_1654)" />
            <path d={svgPaths.p32044000} fill="url(#paint2_linear_1_1654)" />
          </g>
        </g>
        <defs>
          <radialGradient cx="0" cy="0" gradientTransform="translate(97 159.595) scale(76.0958 34.2431)" gradientUnits="userSpaceOnUse" id="paint0_radial_1_1654" r="1">
            <stop stopColor="#FF798A" stopOpacity="0.6" />
            <stop offset="1" stopColor="#FF8E9D" stopOpacity="0" />
          </radialGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_1654" x1="131.867" x2="62.1331" y1="131.867" y2="62.1331">
            <stop stopColor="#FF7089" />
            <stop offset="0.54" stopColor="#FF5F7A" />
            <stop offset="1" stopColor="#FFB2BE" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_1654" x1="117.07" x2="77.5198" y1="118.163" y2="78.6132">
            <stop stopColor="#FFE0E4" />
            <stop offset="0.57" stopColor="#FFF6F7" />
            <stop offset="1" stopColor="#FFF6F7" />
          </linearGradient>
          <clipPath id="clip0_1_1654">
            <rect fill="white" height="194" width="194" />
          </clipPath>
        </defs>
      </svg>
    </motion.div>
  );
}

// --- Components ---

// Memoize Lottie to prevent re-renders or interruptions during parent updates
const MemoizedLottie = React.memo(function LottieWrapper({ data }: { data: any }) {
  return <Lottie animationData={data} loop={true} />;
});

function ContentArea() {
  // Check if animation data is valid
  // @ts-ignore
  const hasAnimationData = animationData && animationData.layers && animationData.layers.length > 0;

  return (
    <div className="flex flex-col items-center w-full" style={{ paddingTop: '76px', paddingBottom: '88px', paddingLeft: '32px', paddingRight: '32px' }}>
      {/* Text Group */}
      <div className="flex flex-col items-start relative shrink-0 w-full gap-3 z-10">
        {/* Title Group */}
        <motion.div 
          className="flex flex-col items-start w-full gap-0"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
          style={{ 
            transformOrigin: "left center",
            containerType: 'inline-size' 
          }}
        >
          <div className="w-full">
            <p style={{ 
              fontFamily: 'Pretendard Variable', 
              fontSize: 'clamp(24px, 9.5cqw, 26px)', 
              fontWeight: 700, 
              color: '#000000', 
              letterSpacing: '-0.78px',
              margin: 0,
              whiteSpace: 'nowrap'
            }}>
              이번주 보고서 완료!
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full">
            <div className="flex items-center gap-1">
              <p style={{ 
                fontFamily: 'Pretendard Variable', 
                fontSize: 'clamp(26px, 10.5cqw, 29px)', 
                fontWeight: 700, 
                color: '#ff6678', 
                letterSpacing: '-0.87px',
                margin: 0,
                whiteSpace: 'nowrap',
                paddingBottom: '1px'
              }}>
                3,000
              </p>
              <p style={{ 
                fontFamily: 'Pretendard Variable', 
                fontSize: 'clamp(24px, 9.5cqw, 26px)', 
                fontWeight: 700, 
                color: '#ff6678', 
                letterSpacing: '-0.78px',
                margin: 0,
                whiteSpace: 'nowrap'
              }}>
                원
              </p>
            </div>
            <p style={{ 
              fontFamily: 'Pretendard Variable', 
              fontSize: 'clamp(24px, 9.5cqw, 26px)', 
              fontWeight: 700, 
              color: '#000000', 
              letterSpacing: '-0.78px',
              margin: 0,
              whiteSpace: 'nowrap'
            }}>
              쿠폰을 받았어요
            </p>
          </div>
        </motion.div>
        
        {/* Subtext */}
        <div className="w-full">
          <motion.p 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            style={{ 
              fontFamily: 'Pretendard Variable', 
              fontSize: '14px', 
              fontWeight: 400, 
              color: '#999999', 
              lineHeight: '22px', 
              letterSpacing: '-0.42px',
              margin: '-4px 0 0 0',
              paddingLeft: '1px',
              transformOrigin: "left center" 
            }}
          >
            쿠폰 사용 기간 : 기한 제한 없음
          </motion.p>
        </div>
      </div>
      
      {/* Visual Area: Animation + Coupon SVG */}
      <div className="relative flex items-center justify-center w-full overflow-hidden" style={{ marginTop: '52px', height: '250px' }}>
        
        {/* Animation Layer (Background) */}
        {hasAnimationData && (
          <div 
            className="absolute top-1/2 left-1/2 flex items-center justify-center pointer-events-none" 
            style={{ 
              width: '450px', 
              height: '450px',
              // Use translate3d to force hardware acceleration and separate compositing layer
              transform: 'translate3d(-50%, -50%, 0)', 
              zIndex: 0
            }}
          >
             <MemoizedLottie data={animationData} />
          </div>
        )}

        {/* Coupon Icon Layer (Foreground) */}
        <div className="relative z-10">
          <CouponSvg />
        </div>
      </div>
    </div>
  );
}

function BottomButton({ onHome }: { onHome?: () => void }) {
  return (
    <div className="bg-white w-full">
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px 20px 20px' }}>
        {/* 홈으로 가기 버튼 (기획서 기준 단일 버튼) */}
        <button
          onClick={onHome}
          className="flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] w-full"
          style={{
            backgroundColor: '#48b2af',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            padding: 0
          }}
        >
          <span style={{
            fontFamily: 'Pretendard Variable',
            fontSize: '16px',
            fontWeight: 500,
            color: '#ffffff',
            letterSpacing: '-0.32px',
            lineHeight: '25px'
          }}>
            홈으로 가기
          </span>
        </button>
      </div>
    </div>
  );
}

interface CompletionCouponProps {
  reportId?: string;
  onClose?: () => void;
  onHome?: () => void;
}

export default function CompletionCoupon({ reportId, onClose, onHome }: CompletionCouponProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function issueCouponOnFirstVisit() {
      try {
        // 사용자 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log('🎟️ [쿠폰] 로그인 필요');
          setIsLoading(false);
          return;
        }

        // 재구매 쿠폰 발급 시도 (API에서 중복 발급 방지 처리)
        console.log('🎟️ [쿠폰] 재구매 쿠폰 발급 시도...');
        const result = await issueRevisitCoupon(session.user.id, reportId);

        if (result.success) {
          console.log('✅ [쿠폰] 재구매 쿠폰 발급 성공:', result.coupon);
          setIsLoading(false);
        } else if (result.alreadyIssued) {
          // ⭐ 이미 발급됨 → 바로 '나의 분석 보고서'로 이동
          console.log('ℹ️ [쿠폰] 이미 발급됨 → 나의 분석 보고서로 이동');
          onClose?.();
          return; // setIsLoading(false) 호출 안 함 (이미 이동했으므로)
        } else {
          // 다른 이유로 실패 - 에러가 아님, 쿠폰 페이지 표시
          console.log('ℹ️ [쿠폰] 쿠폰 발급 스킵:', result.error);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ [쿠폰] 쿠폰 처리 중 오류:', error);
        setIsLoading(false);
      }
    }

    issueCouponOnFirstVisit();
  }, [reportId, onClose]);

  // 로딩 중
  if (isLoading) {
    return <WeeklyReportLoading message="쿠폰을 발급하는 중이에요!" />;
  }

  return (
    <div className="flex justify-center w-full bg-gray-100 min-h-screen overflow-x-hidden">
      <div
        className="flex flex-col bg-white h-screen relative shadow-lg overflow-hidden"
        style={{
          maxWidth: '440px',
          minWidth: '320px',
          width: '100%'
        }}
      >
        {/* Top Navigation - X 버튼만 (기획서 기준) */}
        <div className="bg-white flex items-center justify-end relative shrink-0 w-full z-20" style={{ height: '52px', paddingRight: '12px' }}>
          <div
            onClick={onClose || onHome}
            className="flex items-center justify-center relative shrink-0 cursor-pointer transition-colors active:bg-[#f3f4f6]"
            style={{ width: '44px', height: '44px', padding: '4px', borderRadius: '12px' }}
          >
            <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
              <CloseIcon />
            </div>
          </div>
        </div>

        {/* Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto w-full no-scrollbar">
          <ContentArea />
        </div>

        {/* Fixed Bottom Area */}
        <div className="sticky bottom-0 w-full shrink-0 z-20 bg-white">
           <div className="absolute top-[-20px] left-0 right-0 h-[20px] bg-gradient-to-t from-white to-transparent pointer-events-none" />
           <BottomButton onHome={onHome} />
        </div>
      </div>
    </div>
  );
}
