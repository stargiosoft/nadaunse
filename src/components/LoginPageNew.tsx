import { supabase } from '../lib/supabase';
import { signInWithKakao, signInWithGoogle, clearUserCaches } from '../lib/auth';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { isDevelopment } from '../lib/env';
import { motion } from 'motion/react';
import svgPaths from "../imports/svg-h2fyyvfh8o";
import { imgGroup, imgGroup1, imgGroup2, imgGroup3 } from "../imports/svg-cp95o";
import { projectId } from '../utils/supabase/info';
import { trackLoginClick } from '../utils/analytics';

declare global {
  interface Window {
    Kakao: any;
    google: any;
  }
}

// 쿠키 관련 유틸 함수
const setLastLoginProvider = (provider: 'kakao' | 'google') => {
  document.cookie = `last_login_provider=${provider}; max-age=${60 * 60 * 24 * 365}; path=/`;
};

const setLastLoginEmail = (email: string) => {
  document.cookie = `last_login_email=${encodeURIComponent(email)}; max-age=${60 * 60 * 24 * 365}; path=/`;
};

const getLastLoginProvider = (): 'kakao' | 'google' | null => {
  const match = document.cookie.match(/last_login_provider=([^;]+)/);
  return match ? match[1] as 'kakao' | 'google' : null;
};

const getLastLoginEmail = (): string | null => {
  const match = document.cookie.match(/last_login_email=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

function TextLoginText() {
  return (
    <div className="bg-transparent relative shrink-0 w-full" data-name="Text / Login Text">
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[4px] items-start not-italic px-[20px] py-[44px] relative text-black text-center w-full pt-[24px] pr-[20px] pb-[44px] pl-[20px]">
          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[35.5px] relative shrink-0 text-[24px] tracking-[-0.48px] w-full">나다운이 처음이라면</p>
          <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[39.5px] relative shrink-0 text-[27px] tracking-[-0.27px] w-full">무료로 체험해 보세요!</p>
        </div>
      </div>
    </div>
  );
}

function Img() {
  return (
    <div 
      className="h-[218px] relative shrink-0 w-[160px] origin-center" 
      data-name="img"
    >
      <div className="absolute bottom-0 left-0 right-0 top-[-0.69%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 160 220">
          <g id="img">
            <path d={svgPaths.p2285b300} fill="var(--fill-0, #F4F4F4)" id="Vector" />
            <g id="Group">
              <path d={svgPaths.p2885c700} fill="var(--fill-0, #FDD751)" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
              <path d={svgPaths.p1a844100} fill="var(--fill-0, #EFC748)" id="Vector_3" />
              <path d={svgPaths.p13ab4b00} fill="var(--fill-0, #FDD751)" id="Vector_4" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
              <path d={svgPaths.pd878300} fill="var(--fill-0, #EFC748)" id="Vector_5" />
            </g>
            <path d={svgPaths.p28479a80} fill="var(--fill-0, white)" id="Vector_6" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
            <g id="Group_2">
              <path d={svgPaths.p330db180} fill="var(--fill-0, black)" id="Vector_7" />
              <path d={svgPaths.p3b7fce00} fill="var(--fill-0, black)" id="Vector_8" />
            </g>
            <path d={svgPaths.pf08ecf0} fill="var(--fill-0, #BCD961)" id="Vector_9" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
            <path d={svgPaths.p3a1ba900} fill="var(--fill-0, #BCD961)" id="Vector_10" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
            <path d="M79.6406 41.3195V24.6095" id="Vector_11" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
            <path d={svgPaths.pe7f0800} fill="var(--fill-0, #FDD751)" id="Vector_12" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame1({ scrollTop = 0 }: { scrollTop?: number }) {
  // 스크롤에 관계없이 상단에 고정 (Top Bar 높이 52px 고려)
  return (
    <div className="fixed top-0 left-0 right-0 mx-auto w-full max-w-[440px] h-full pointer-events-none z-0">
      <div className="absolute top-[52px] w-full flex flex-col items-center">
        <motion.div 
          className="w-full flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <TextLoginText />
          <div className="flex justify-center w-full mt-[-20px]">
            <Img />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// "지금 시작하면 0원!" 배지 (로그인 이력 없을 때만 표시)
function GuidanceTooltip() {
  const [animationState, setAnimationState] = useState("entrance");

  return (
    <motion.div 
      className="bg-[#48b2af] content-stretch flex flex-col gap-[4px] items-start px-[16px] py-[8px] relative rounded-[999px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)] shrink-0 mb-[-12px]" 
      style={{ willChange: 'transform', backfaceVisibility: 'hidden', WebkitFontSmoothing: 'antialiased' }}
      data-name="Guidance / Tooltip"
      initial="initial"
      animate={animationState}
      variants={{
        initial: { opacity: 0, y: 10 },
        entrance: { opacity: 1, y: -10, transition: { duration: 0.8, ease: "easeOut", delay: 0.5 } },
        floating: { opacity: 1, y: [-10, -14, -10], transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } }
      }}
      onAnimationComplete={(definition) => {
        if (definition === "entrance") {
          setAnimationState("floating");
        }
      }}
    >
      <div className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-nowrap text-white tracking-[-0.42px]">
        <p className="leading-[22px] whitespace-pre antialiased" style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>지금 시작하면 0원!</p>
      </div>
      <div className="absolute bottom-[-5px] flex h-[6px] items-center justify-center left-1/2 translate-x-[-50%] w-[20px]">
        <div className="flex-none rotate-[180deg]">
          <div className="h-[6px] relative w-[20px]" data-name="arrow">
            <div className="absolute bottom-0 left-0 right-0 top-0" style={{ "--fill-0": "rgba(72, 178, 175, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 6">
                <path d="M0.5 5.66602L10 0.333008L19.5 5.66602" fill="#48B2AF" id="arrow" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// "최근 로그인" 배지 컴포넌트 (Figma 디자인 100% 정확히 반영)
function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="flash">
          <path d={svgPaths.p12d62f00} fill="white" id="Vector" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Icons">
      <Box />
    </div>
  );
}

function IconAndLabel() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Icon and Label">
      <Icons />
      <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[16px] relative shrink-0 text-[12px] text-center text-nowrap text-white tracking-[-0.24px]">최근 로그인</p>
    </div>
  );
}

function Container() {
  return (
    <motion.div 
      className="backdrop-blur-[15px] backdrop-filter bg-[rgba(0,0,0,0.5)] content-stretch flex items-center justify-center mb-[-13px] px-[16px] py-[6px] relative rounded-bl-[8px] rounded-br-[999px] rounded-tl-[999px] rounded-tr-[999px] shrink-0 z-[2]" 
      data-name="Container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.8 }}
    >
      <IconAndLabel />
    </motion.div>
  );
}

function IconAndLabel1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Icon and Label">
      <div className="h-[18.537px] relative shrink-0 w-[20.179px]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 19">
          <path clipRule="evenodd" d={svgPaths.p2d30f4f0} fill="var(--fill-0, #1F1F1F)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-black text-center text-nowrap tracking-[-0.32px]">
        <p className="leading-[25px]">카카오로 무료 체험 시작하기</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <motion.div 
      className="bg-[#fee500] h-[56px] mb-[-13px] relative rounded-[16px] shrink-0 w-full z-[1] overflow-hidden" 
      data-name="Button"
      whileTap={{ scale: 0.97, backgroundColor: "#fada0a" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div aria-hidden="true" className="absolute border border-[#fee500] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center p-px relative size-full">
          <IconAndLabel1 />
        </div>
      </div>
    </motion.div>
  );
}

function ButtonSnsButton({ onClick, showRecentBadge }: { onClick?: () => void; showRecentBadge?: boolean }) {
  return (
    <div onClick={onClick} className="content-stretch flex flex-col isolate items-start pb-[13px] pt-0 px-0 relative shrink-0 w-full cursor-pointer" data-name="Button / SNS Button">
      {showRecentBadge && <Container />}
      <Button />
    </div>
  );
}

function Group() {
  return (
    <div className="[grid-area:1_/_1] h-[20.924px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.668px_5.669px] mask-size-[9.795px_9.586px] ml-[-57.86%] mt-[-59.14%] relative w-[21.133px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 21">
        <g id="Group">
          <path d={svgPaths.p3b2a4100} fill="var(--fill-0, #3E82F1)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[51.02%] mt-[40.91%] place-items-start relative" data-name="Clip path group">
      <Group />
    </div>
  );
}

function Group1() {
  return (
    <div className="[grid-area:1_/_1] h-[19.602px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.67px_5.669px] mask-size-[15.871px_8.265px] ml-[-35.72%] mt-[-68.59%] relative w-[27.209px]" data-name="Group" style={{ maskImage: `url('${imgGroup1}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 20">
        <g id="Group">
          <path d={svgPaths.p11a42100} fill="var(--fill-0, #32A753)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ClipPathGroup1() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[5.44%] mt-[59.5%] place-items-start relative" data-name="Clip path group">
      <Group1 />
    </div>
  );
}

function Group2() {
  return (
    <div className="[grid-area:1_/_1] h-[20.502px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.668px] mask-size-[4.495px_9.164px] ml-[-126.09%] mt-[-61.85%] relative w-[15.831px]" data-name="Group" style={{ maskImage: `url('${imgGroup2}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 21">
        <g id="Group">
          <path d={svgPaths.p2d06fd80} fill="var(--fill-0, #F9BB00)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ClipPathGroup2() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-[27.55%] place-items-start relative" data-name="Clip path group">
      <Group2 />
    </div>
  );
}

function Group3() {
  return (
    <div className="[grid-area:1_/_1] h-[19.602px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.67px_5.669px] mask-size-[15.945px_8.265px] ml-[-35.56%] mt-[-68.59%] relative w-[27.282px]" data-name="Group" style={{ maskImage: `url('${imgGroup3}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 20">
        <g id="Group">
          <path d={svgPaths.p2948c480} fill="var(--fill-0, #E74133)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ClipPathGroup3() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[5.44%] mt-0 place-items-start relative" data-name="Clip path group">
      <Group3 />
    </div>
  );
}

function GoogleIconContainer() {
  return (
    <div className="relative shrink-0 w-[24px] h-[24px]" data-name="Google Icon Container">
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[8px] items-center leading-[0] relative shrink-0" data-name="Button Container">
      <GoogleIconContainer />
      <div className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[16px] text-black text-center text-nowrap tracking-[-0.32px]">
        <p className="leading-[25px]">Google로 무료 체험 시작하기</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <motion.div 
      className="bg-white h-[56px] mb-[-13px] relative rounded-[16px] shrink-0 w-full z-[1] overflow-hidden" 
      data-name="Button"
      whileTap={{ scale: 0.97, backgroundColor: "#f2f2f2" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center p-px relative size-full">
          <ButtonContainer />
        </div>
      </div>
    </motion.div>
  );
}

function ButtonSnsButton1({ onClick, showRecentBadge }: { onClick?: () => void; showRecentBadge?: boolean }) {
  const handleClick = () => {
    console.log('🖱️ 구글 버튼 클릭됨!');
    if (onClick) {
      console.log('✅ onClick 핸들 실행');
      onClick();
    } else {
      console.log('❌ onClick 핸들러 없음!');
    }
  };

  return (
    <div onClick={handleClick} className="content-stretch flex flex-col isolate items-start pb-[13px] pt-0 px-0 relative shrink-0 w-full cursor-pointer" data-name="Button / SNS Button">
      {showRecentBadge && <Container />}
      <Button1 />
    </div>
  );
}

function Frame2({ onKakaoLogin, onGoogleLogin, lastLoginProvider }: { 
  onKakaoLogin?: () => void; 
  onGoogleLogin?: () => void;
  lastLoginProvider: 'kakao' | 'google' | null;
}) {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
      <ButtonSnsButton onClick={onKakaoLogin} showRecentBadge={lastLoginProvider === 'kakao'} />
      <ButtonSnsButton1 onClick={onGoogleLogin} showRecentBadge={lastLoginProvider === 'google'} />
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#999] text-[14px] text-center tracking-[-0.42px] w-full">무료 체험 후 자동 결제되지 않아요!</p>
    </div>
  );
}

function Frame3({ 
  onKakaoLogin, 
  onGoogleLogin, 
  lastLoginProvider,
  onNavigateToExistingAccount
}: { 
  onKakaoLogin?: () => void; 
  onGoogleLogin?: () => void;
  lastLoginProvider: 'kakao' | 'google' | null;
  onNavigateToExistingAccount?: (provider: 'kakao' | 'google') => void;
}) {
  return (
    <div className="fixed bottom-[env(safe-area-inset-bottom)] left-0 right-0 mx-auto w-full max-w-[440px] px-[20px] pb-[16px] flex flex-col gap-[16px] items-center z-10">
      {/* 로그인 이력이 없을 때만 "지금 시작하면 0원!" 배지 표시 */}
      {!lastLoginProvider && <GuidanceTooltip />}
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
      >
        <Frame2 onKakaoLogin={onKakaoLogin} onGoogleLogin={onGoogleLogin} lastLoginProvider={lastLoginProvider} />
      </motion.div>

      {/* 개발용 테스트 버튼 */}
      {isDevelopment() && (
        <div className="flex gap-4">
          <button onClick={() => onNavigateToExistingAccount?.('kakao')} className="text-xs text-gray-400 underline">
            [개발용] 기가입자(카카오)
          </button>
          <button onClick={() => onNavigateToExistingAccount?.('google')} className="text-xs text-gray-400 underline">
            [개발용] 기가입자(구글)
          </button>
        </div>
      )}
    </div>
  );
}

function LeftAction({ onBack }: { onBack?: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-[44px] h-[44px] cursor-pointer transition-all duration-150 ease-out active:scale-96 active:bg-gray-100 rounded-[11px]" onClick={onBack}>
      <div className="relative shrink-0 w-[24px] h-[24px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
        </svg>
      </div>
    </div>
  );
}

function RightAction() {
  return <div className="w-[44px] h-[44px]" />;
}

function Icon({ onBack }: { onBack?: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction onBack={onBack} />
      <RightAction />
    </div>
  );
}

function NavigationTopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-transparent h-[52px] relative shrink-0 w-full" data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col h-[52px] items-start justify-center px-[12px] py-[4px] relative w-full">
          <Icon onBack={onBack} />
        </div>
      </div>
    </div>
  );
}

function TopNavigation1Depth({ onBack }: { onBack?: () => void }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Top Navigation/1depth">
      <NavigationTopBar onBack={onBack} />
    </div>
  );
}

function Frame({ onBack, isScrolled = false }: { onBack?: () => void; isScrolled?: boolean }) {
  return (
    <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-50 flex flex-col items-start content-stretch transition-all duration-200 ${isScrolled ? "bg-white shadow-[0_4px_10px_rgba(0,0,0,0.05)]" : "bg-transparent shadow-none"}`}>
      <TopNavigation1Depth onBack={onBack} />
    </div>
  );
}

interface LoginPageNewProps {
  onBack: () => void;
  onLoginSuccess: (user: any) => void;
  onNavigateToTerms: () => void;
  onNavigateToExistingAccount: (provider: 'kakao' | 'google') => void;
}

export default function LoginPageNew({ 
  onBack, 
  onLoginSuccess, 
  onNavigateToTerms,
  onNavigateToExistingAccount 
}: LoginPageNewProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [lastLoginProvider, setLastLoginProviderState] = useState<'kakao' | 'google' | null>(null);

  useEffect(() => {
    const provider = getLastLoginProvider();
    setLastLoginProviderState(provider);
    console.log('💾 최근 로그인 제공자:', provider);
  }, []);

  // 카카오 SDK v1 초기화
  useEffect(() => {
    const scriptId = 'kakao-sdk';
    
    // 기존 스크립트 제거
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Kakao SDK v1 script loaded');
      
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkKakao = () => {
        attempts++;
        
        if (window.Kakao) {
          console.log('✅ Kakao object found');
          
          try {
            if (!window.Kakao.isInitialized()) {
              window.Kakao.init('da0e07cca0c104a3b59f79a24911587c');
              console.log('✅ Kakao SDK initialized');
            }
            
            setIsSdkLoaded(true);
            setSdkError(null);
          } catch (error) {
            console.error('❌ Kakao SDK initialization error:', error);
            setSdkError('SDK 초기화 실패: ' + error);
          }
        } else {
          if (attempts < maxAttempts) {
            setTimeout(checkKakao, 100);
          } else {
            console.error('❌ Kakao SDK load timeout after 5 seconds');
            setSdkError('SDK 로드 시간 초과');
          }
        }
      };
      
      checkKakao();
    };
    
    script.onerror = (error) => {
      console.error('❌ Kakao SDK load error:', error);
      setSdkError('SDK 로드 실패 - 네트워크를 확인해주세요');
    };
    
    console.log('🔄 Loading Kakao SDK v1 from:', script.src);
    document.head.appendChild(script);
  }, []);

  const handleKakaoLogin = async () => {
    console.log('🔐 카카오 로그인 시도');
    trackLoginClick('kakao'); // 📊 GA 이벤트
    
    // 🔒 다른 제공자로 이미 가입한 경우 체크
    const existingProvider = getLastLoginProvider();
    const existingEmail = getLastLoginEmail();
    
    if (existingProvider && existingProvider !== 'kakao' && existingEmail) {
      console.log(`⚠️ 이미 ${existingProvider}로 가입됨 → 기가입자 페이지로 이동`);
      onNavigateToExistingAccount(existingProvider);
      return;
    }
    
    // SDK 체크
    if (!window.Kakao?.isInitialized()) {
      alert('카카오 SDK 아직 초기화되지 않았습니다.\\n페이지를 새로고침 후 다시 시도해주세요.');
      return;
    }

    try {
      // /lib/auth.ts의 signInWithKakao 사용
      const authData = await signInWithKakao();
      console.log('✅ 카카오 로그인 성공:', authData);

      // ⭐️ Edge Function으로 사용자 조회 (RLS 없이 안전하게 처리)
      console.log('🔍 Edge Function 호출 시작...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get',  // 먼저 조회만 시도
          user_data: {
            email: authData.user.email,
            name: authData.user.user_metadata?.name || authData.user.user_metadata?.nickname,
            avatar_url: authData.user.user_metadata?.avatar_url || authData.user.user_metadata?.profile_image,
            provider: 'kakao',
          },
        }),
      });

      console.log('📡 Edge Function 응답 상태:', response.status);
      
      const result = await response.json();
      console.log('📦 Edge Function 응답:', result);

      // ⭐️ 기존 사용자 (is_new: false)
      if (response.ok && result.success && !result.user.is_new) {
        console.log('✅ 기존 사용자 → 로그인 처리');
        
        const userData = {
          id: result.user.id,
          email: result.user.email,
          nickname: result.user.nickname || '사용자',
          provider: result.user.provider || 'kakao',
          provider_id: result.user.provider_id || authData.user.id,
          profile_image: result.user.profile_image || '',
        };

        console.log('✅ 사용자 데이터:', userData);

        // ⭐ 로그인 성공 → 이전 계정의 캐시 클리어 (계정 전환 대응)
        console.log('🧹 [로그인] 이전 계정 캐시 클리어');
        clearUserCaches();

        // 쿠키에 로그인 정보 저장
        setLastLoginProvider('kakao');
        if (userData.email) {
          setLastLoginEmail(userData.email);
        }

        // localStorage에 저장 (기존 코드 호환용)
        localStorage.setItem('user', JSON.stringify(userData));

        // 로그인 성공 콜백
        if (onLoginSuccess) {
          onLoginSuccess(userData);
        }
        return;
      }

      // ⭐️ 신규 사용자 (404 또는 is_new: true)
      if (response.status === 404 || (result.user && result.user.is_new)) {
        console.log('⚠️ 신규 사용자 → 약관 페이지로 이동');
        
        // 세션 정보를 localStorage에 임시 저장 (회원가입 페이지에서 사용)
        const tempUserData = {
          id: authData.user.id,
          email: authData.user.email || authData.user.user_metadata?.email || `kakao_${authData.user.user_metadata?.provider_id}@temp.fortune.app`,
          name: authData.user.user_metadata?.name || authData.user.user_metadata?.nickname || '사용자',
          avatar_url: authData.user.user_metadata?.avatar_url || authData.user.user_metadata?.profile_image || '',
          provider: 'kakao',
          provider_id: authData.user.user_metadata?.provider_id || authData.user.id,
        };
        
        localStorage.setItem('tempUser', JSON.stringify(tempUserData));
        console.log('💾 임시 사용자 데이터 저장:', tempUserData);
        
        // 약관 동의 페이지로 이동
        onNavigateToTerms();
        return;
      }

      // ⭐️ 기타 에러
      console.error('🚨 예상치 못한 Edge Function 응답:', result);
      throw new Error(result.error || 'Edge Function 호출 실패');
    } catch (error: any) {
      console.error('❌ 카카오 로그인 실패:', error);
      
      // 사용자가 취소한 경우
      if (error?.error === 'access_denied') {
        console.log('ℹ️ 사용자가 로그인을 취소했습니다.');
        return;
      }
      
      console.error('로그인 에러:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleGoogleLogin = async () => {
    console.log('🔐 구글 로그인 시도');
    trackLoginClick('google'); // 📊 GA 이벤트

    // 🔒 다른 제공자로 이미 가입한 경우 체크
    const existingProvider = getLastLoginProvider();
    const existingEmail = getLastLoginEmail();
    
    if (existingProvider && existingProvider !== 'google' && existingEmail) {
      console.log(`⚠️ 이미 ${existingProvider}로 가입됨 → 기가입자 페이지로 이동`);
      onNavigateToExistingAccount(existingProvider);
      return;
    }

    // ⭐ 이미 저장된 리다이렉트 URL이 없는 경우에만 홈으로 설정
    if (!localStorage.getItem('redirectAfterLogin')) {
      localStorage.setItem('redirectAfterLogin', '/');
    }

    try {
      // /lib/auth.ts의 signInWithGoogle 사용 (Supabase OAuth)
      await signInWithGoogle();
      
      // 리다이렉트되므로 여기는 실행되지 않음
      console.log('🔄 구글 로그인 리다이렉트 중...');
    } catch (error: any) {
      console.error('❌ 구글 로그인 실패:', error);
      alert('구글 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div 
      className="bg-white relative w-full h-[100vh] overflow-y-auto overflow-x-hidden flex justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
      data-name="첫 로그인 (카카오)"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* 개발용 임시 버튼 그룹 */}
      {isDevelopment() && (
        <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-2 items-end">
          <button
            onClick={() => {
              const tempUserData = {
                id: 'temp_debug_user',
                email: 'debug@temp.fortune.app',
                name: '디버그유저',
                avatar_url: '',
                provider: 'debug',
                provider_id: 'debug_123',
              };
              localStorage.setItem('tempUser', JSON.stringify(tempUserData));
              onNavigateToTerms();
            }}
            className="bg-red-500 text-white px-3 py-1 rounded-full text-xs shadow-lg opacity-70 hover:opacity-100 transition-opacity"
          >
            약관 화면 이동
          </button>
          <button
            onClick={() => {
               const mockUser = {
                 id: '00000000-0000-0000-0000-000000000000',
                 email: 'dev@test.com',
                 nickname: '개발자',
                 provider: 'dev',
                 profile_image: ''
               };
               localStorage.setItem('user', JSON.stringify(mockUser));
               document.cookie = `last_login_provider=dev; max-age=${60 * 60 * 24 * 365}; path=/`;
               
               // 마이페이지로 이동하도록 설정
               localStorage.setItem('redirectAfterLogin', '/profile');
               onLoginSuccess(mockUser);
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs shadow-lg opacity-70 hover:opacity-100 transition-opacity"
          >
            마이페이지 이동
          </button>
        </div>
      )}

      <div className="relative w-full max-w-[440px] min-h-[690px] flex flex-col bg-white">
        <Frame onBack={onBack} isScrolled={scrollTop > 10} />
        <div className="flex-1 flex flex-col items-center w-full px-[20px] pt-[52px]">
          <Frame1 scrollTop={scrollTop} />
        </div>
        <div className="w-full px-[20px] pb-[28px] shrink-0">
          <Frame3 
            onKakaoLogin={handleKakaoLogin} 
            onGoogleLogin={handleGoogleLogin}
            lastLoginProvider={lastLoginProvider}
            onNavigateToExistingAccount={onNavigateToExistingAccount}
          />
        </div>
      </div>
    </div>
  );
}