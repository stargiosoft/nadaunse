import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import svgPaths from "../imports/svg-iltjkti27j";
import { imgGroup, imgGroup1, imgGroup2, imgGroup3 } from "../imports/svg-cp95o";
import { supabase } from '../lib/supabase';
import { signInWithKakao, signInWithGoogle } from '../lib/auth';
import { isDevelopment } from '../lib/env';

declare global {
  interface Window {
    Kakao: any;
    google: any;
  }
}

interface ExistingAccountPageProps {
  provider: 'kakao' | 'google';
  onBack: () => void;
  onLoginWithCorrectProvider: () => void;
  onNavigateToHome?: () => void;
}

// 이메일 마스킹 함수
const maskEmail = (email: string | null): string => {
  if (!email || !email.includes('@')) return email || '';
  
  const [localPart, domain] = email.split('@');
  const length = localPart.length;
  
  let maskedLocal;
  
  if (length >= 4) {
    // 4글자 이상: 앞 4글자 유지 + ****
    maskedLocal = localPart.slice(0, 4) + '****';
  } else {
    // 3글자 이하: 글자수만큼 * 표기
    maskedLocal = '*'.repeat(length);
  }
  
  return `${maskedLocal}@${domain}`;
};

// 가입일 포맷 함수
const formatJoinedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}. ${month}. ${day}`;
};

// 쿠키 관련 유틸 함수
const getLastLoginEmail = (): string | null => {
  const match = document.cookie.match(/last_login_email=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const setLastLoginEmail = (email: string) => {
  document.cookie = `last_login_email=${encodeURIComponent(email)}; max-age=${60 * 60 * 24 * 365}; path=/`;
};

function TextLoginText() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Text / Login Text">
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[4px] items-start px-[20px] pt-[12px] pb-[32px] relative text-black text-center w-full">
          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[35.5px] relative shrink-0 text-[24px] tracking-[-0.48px] w-full">이미 가입하신 계정이 있어요</p>
          <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[39.5px] relative shrink-0 text-[27px] tracking-[-0.27px] w-full">아래 계정으로 로그인해 보세요</p>
        </div>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <div className="relative shrink-0 size-[32px]">
      <div className="absolute inset-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Frame 427320540">
            <path d={svgPaths.p2e8b0700} fill="#FEE500" />
            <path clipRule="evenodd" d={svgPaths.peaac300} fill="#1F1F1F" fillRule="evenodd" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function GoogleIconContainer() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center p-[6px] relative rounded-[999px] shrink-0 size-[32px]">
      <div aria-hidden="true" className="absolute border border-[#f3f3f3] border-solid inset-[-1px] pointer-events-none rounded-[1000px]" />
      <svg viewBox="0 0 20 20" className="w-full h-full">
        <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
        <path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.15-2.44c-.86.58-1.97.92-3.47.92-2.65 0-4.92-1.79-5.73-4.19H1.07v2.52C2.72 17.75 6.09 20 10 20z"/>
        <path fill="#FBBC05" d="M4.27 11.87c-.2-.58-.32-1.19-.32-1.87 0-.68.12-1.29.32-1.87V5.61H1.07C.39 6.97 0 8.45 0 10s.39 3.03 1.07 4.39l3.2-2.52z"/>
        <path fill="#EA4335" d="M10 3.88c1.52 0 2.72.65 3.32 1.2l2.45-2.45C14.46.99 12.2 0 10 0 6.09 0 2.72 2.25 1.07 5.61l3.2 2.52C5.08 5.67 7.35 3.88 10 3.88z"/>
      </svg>
    </div>
  );
}

function AccountCard({ provider, email, createdAt }: { provider: 'kakao' | 'google'; email: string; createdAt: string }) {
  return (
    <div className="content-stretch flex flex-col items-start px-[28px] py-[24px] relative rounded-[12px] shrink-0 w-[calc(100%-40px)] max-w-[440px]">
      <div aria-hidden="true" className="absolute border border-[#f3f3f3] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
        {provider === 'kakao' ? <KakaoIcon /> : <GoogleIconContainer />}
        <div className="basis-0 content-stretch flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
          <p className="leading-[24px] relative shrink-0 text-[17px] text-black tracking-[-0.34px] w-full">{maskEmail(email)}</p>
          <p className="leading-[22px] relative shrink-0 text-[#999] text-[14px] tracking-[-0.42px] w-full">가입일 : {formatJoinedDate(createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function Frame5({ provider, email, createdAt }: { provider: 'kakao' | 'google'; email: string; createdAt: string }) {
  return (
    <motion.div 
      className="content-stretch flex flex-col items-center relative shrink-0 w-full"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1
          }
        }
      }}
    >
      <motion.div 
        className="w-full"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
          }
        }}
      >
        <TextLoginText />
      </motion.div>

      <motion.div 
        className="w-full flex justify-center"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
          }
        }}
      >
        <AccountCard provider={provider} email={email} createdAt={createdAt} />
      </motion.div>
    </motion.div>
  );
}

function KakaoLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div 
      onClick={onClick} 
      className="bg-[#fee500] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer overflow-hidden select-none [-webkit-touch-callout:none]" 
      data-name="Button"
      whileTap={{ scale: 0.97, backgroundColor: "#fada0a" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div aria-hidden="true" className="absolute border border-[#fee500] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center p-px relative size-full">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <div className="h-[18.537px] relative shrink-0 w-[20.179px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 19">
                <path clipRule="evenodd" d={svgPaths.p2d30f4f0} fill="#1F1F1F" fillRule="evenodd" />
              </svg>
            </div>
            <div className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-black text-center text-nowrap tracking-[-0.32px]">
              <p className="leading-[25px] select-none [-webkit-touch-callout:none]">kakao 계정으로 로그인</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GoogleLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.div 
      onClick={onClick} 
      className="bg-white h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer overflow-hidden select-none [-webkit-touch-callout:none]" 
      data-name="Button"
      whileTap={{ scale: 0.97, backgroundColor: "#f2f2f2" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center p-px relative size-full">
          <div className="content-stretch flex gap-[8px] items-center leading-[0] relative shrink-0">
            <svg viewBox="0 0 20 20" className="w-5 h-5">
              <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
              <path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.15-2.44c-.86.58-1.97.92-3.47.92-2.65 0-4.92-1.79-5.73-4.19H1.07v2.52C2.72 17.75 6.09 20 10 20z"/>
              <path fill="#FBBC05" d="M4.27 11.87c-.2-.58-.32-1.19-.32-1.87 0-.68.12-1.29.32-1.87V5.61H1.07C.39 6.97 0 8.45 0 10s.39 3.03 1.07 4.39l3.2-2.52z"/>
              <path fill="#EA4335" d="M10 3.88c1.52 0 2.72.65 3.32 1.2l2.45-2.45C14.46.99 12.2 0 10 0 6.09 0 2.72 2.25 1.07 5.61l3.2 2.52C5.08 5.67 7.35 3.88 10 3.88z"/>
            </svg>
            <div className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[16px] text-black text-center text-nowrap tracking-[-0.32px]">
              <p className="leading-[25px] select-none [-webkit-touch-callout:none]">Google 계정으로 로그인</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ButtonContainer({ provider, onClick }: { provider: 'kakao' | 'google'; onClick: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
          {provider === 'kakao' ? <KakaoLoginButton onClick={onClick} /> : <GoogleLoginButton onClick={onClick} />}
        </div>
      </div>
    </div>
  );
}

function Container1({ provider, onClick }: { provider: 'kakao' | 'google'; onClick: () => void }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <ButtonContainer provider={provider} onClick={onClick} />
    </div>
  );
}

function CommonBottomButton({ provider, onClick }: { provider: 'kakao' | 'google'; onClick: () => void }) {
  return (
    <div className="fixed bottom-[env(safe-area-inset-bottom)] left-0 right-0 mx-auto max-w-[440px] content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] shrink-0 w-full pb-[28px]" data-name="Common / Bottom Button">
      <Container1 provider={provider} onClick={onClick} />
    </div>
  );
}

function Frame6({ provider, email, createdAt, onClick }: { provider: 'kakao' | 'google'; email: string; createdAt: string; onClick: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-between pt-[52px] pb-0 w-full">
      <div className="flex-1 flex items-start justify-center w-full overflow-hidden">
        <Frame5 provider={provider} email={email} createdAt={createdAt} />
      </div>
      <CommonBottomButton provider={provider} onClick={onClick} />
    </div>
  );
}

function Box1() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="arrow-left">
          <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
        </g>
      </svg>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box1 />
    </div>
  );
}

function LeftAction({ onBack }: { onBack: () => void }) {
  return (
    <motion.button 
      onClick={onBack} 
      className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer bg-transparent active:bg-gray-100 transition-colors duration-200"
      data-name="Left Action"
      whileTap="pressed"
      initial="default"
      animate="default"
    >
      <motion.div
        variants={{
          default: { scale: 1 },
          pressed: { scale: 0.9 }
        }}
        transition={{ duration: 0.1 }}
      >
        <Icons1 />
      </motion.div>
    </motion.button>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <div className="relative shrink-0 size-[24px]" />
    </div>
  );
}

function Icon({ onBack }: { onBack: () => void }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction onBack={onBack} />
      <RightAction />
    </div>
  );
}

function NavigationTopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-white h-[52px] relative shrink-0 w-full" data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
          <Icon onBack={onBack} />
        </div>
      </div>
    </div>
  );
}

function TopNavigation1Depth({ onBack }: { onBack: () => void }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full max-w-[440px]" data-name="Top Navigation/1depth">
      <NavigationTopBar onBack={onBack} />
    </div>
  );
}

function Frame({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed z-50 content-stretch flex flex-col items-start left-0 right-0 mx-auto top-0 w-full max-w-[440px]">
      <TopNavigation1Depth onBack={onBack} />
    </div>
  );
}

export default function ExistingAccountPageNew({ provider, onBack, onLoginWithCorrectProvider, onNavigateToHome }: ExistingAccountPageProps) {
  const [accountInfo, setAccountInfo] = useState<{ email: string; created_at: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 페이지 마운트 시 스크롤 최상단으로 리셋 (iOS Safari 호환)
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        // ⭐ 1. 먼저 로그아웃 (이미 로그인된 잘못된 세션 제거)
        console.log('🔓 [기가입자] 기존 세션 로그아웃...');
        await supabase.auth.signOut();
        
        // 쿠키에서 저장된 이메일로 조회
        const lastEmail = getLastLoginEmail();
        
        if (lastEmail) {
          const { data, error } = await supabase
            .from('users')
            .select('email, created_at')
            .eq('email', lastEmail)
            .eq('provider', provider)
            .single();
          
          if (error) {
            console.error('❌ 사용자 정보 조회 실패:', error);
          } else if (data) {
            setAccountInfo(data);
          }
        }
      } catch (error) {
        console.error('❌ 계정 정보 가져오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountInfo();
  }, [provider]);

  const handleLogin = async () => {
    console.log(`🔐 ${provider} 계정으로 로그인 시도`);
    
    try {
      setIsLoading(true);
      
      // ⭐ OAuth 로그인 시작 (팝업/리다이렉트 발생, 콜백에서 처리됨)
      if (provider === 'kakao') {
        await signInWithKakao();
      } else if (provider === 'google') {
        await signInWithGoogle();
      }
      
      // ⭐ signInWithOAuth는 팝업을 열거나 리다이렉트하는 함수
      // 실제 로그인은 /auth/callback에서 처리되므로
      // 여기서는 홈으로 이동하지 않고 대기만 함
      console.log('🔄 OAuth 프로세스 시작됨 - 콜백 대기 중...');
      
      // ⭐ 카카오의 경우 동기적으로 로그인이 완료되므로 홈으로 이동
      // (구글은 팝업/리다이렉트이므로 자동으로 콜백에서 처리됨)
      if (provider === 'kakao') {
        console.log('✅ [기가입자] 카카오 로그인 완료 → 홈으로 이동');
        setIsLoading(false);
        if (onNavigateToHome) {
          onNavigateToHome();
        } else {
          onLoginWithCorrectProvider();
        }
      }
      
    } catch (error: any) {
      console.error('❌ 로그인 실패:', error);
      
      // 사용자가 취소한 경우는 조용히 처리
      if (error?.error === 'access_denied') {
        console.log('ℹ️ 사용자가 로그인을 취소했습니다.');
        setIsLoading(false);
        return;
      }
      
      // 그 외 에러는 알림 표시
      alert('로그인에 실패했습니다.\n' + (error.message || error));
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white relative min-h-screen w-full flex justify-center items-center overflow-hidden">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
  }

  // accountInfo가 없으면 기본값 표시
  const email = accountInfo?.email || 'user****@example.com';
  const createdAt = accountInfo?.created_at || new Date().toISOString();

  return (
    <div className="bg-white relative w-full h-[100vh] flex justify-center overflow-hidden" data-name="기가입자 안내">
      {/* 개발용 임시 버튼: 마이페이지로 이동 */}
      {isDevelopment() && (
        <button
          onClick={() => {
             // 로그인 처리 (localStorage 설정)
             const mockUser = {
               id: '00000000-0000-0000-0000-000000000000',
               email: email || 'dev@test.com',
               nickname: '개발자',
               provider: provider,
               profile_image: ''
             };
             localStorage.setItem('user', JSON.stringify(mockUser));
             document.cookie = `last_login_provider=${provider}; max-age=${60 * 60 * 24 * 365}; path=/`;

             // 마이페이지로 강제 이동
             window.location.href = '/profile';
          }}
          className="fixed top-24 right-4 z-[9999] bg-blue-500 text-white px-3 py-1 rounded-full text-xs shadow-lg opacity-70 hover:opacity-100 transition-opacity"
        >
          마이페이지 이동 (개발용)
        </button>
      )}

      <div className="relative w-full max-w-[440px] h-full flex flex-col bg-white overflow-hidden">
        <Frame onBack={onBack} />
        <Frame6 provider={provider} email={email} createdAt={createdAt} onClick={handleLogin} />
      </div>
    </div>
  );
}