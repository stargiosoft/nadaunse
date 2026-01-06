import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { issueWelcomeCoupon } from '../lib/coupon';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from '../imports/svg-4laayaclj0';
import svgPathsNew from '../imports/svg-90sehl95g8';

// --- SVG Components ---

function TermsIcon({ className }: { className?: string }) {
  return (
    <div className={`relative size-[16px] shrink-0 ${className}`} data-name="Icons">
      <div className="absolute contents inset-0" data-name="Box">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <g id="arrow-down">
            <path d={svgPathsNew.p3993d9c0} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <div className={`relative rounded-[8px] shrink-0 size-[28px] ${checked ? 'bg-[#48b2af] border-none' : 'bg-white border-1 border-[#e7e7e7] border-solid'}`}>
      {checked && (
        <svg className="absolute inset-0 m-auto w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

function ArrowLeftIcon() {
    return (
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
            <g id="arrow-left">
                <path d={svgPaths.p2a5cd480} id="Vector" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
            </g>
        </svg>
    );
}

// --- Main Components ---

interface TermsPageProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function TermsPage({ onBack, onComplete }: TermsPageProps) {
  const [agreements, setAgreements] = useState({
    age14: false,
    terms: false,
    privacy: false,
    marketing: false,
    ads: false,
  });

  const [expanded, setExpanded] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    ads: false,
  });

  const toggleAgreement = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExpanded = (key: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allAgreed = Object.values(agreements).every(Boolean);
  
  const handleAllAgree = () => {
    const newValue = !allAgreed;
    setAgreements({
      age14: newValue,
      terms: newValue,
      privacy: newValue,
      marketing: newValue,
      ads: newValue,
    });
  };

  const requiredAgreed = agreements.age14 && agreements.terms && agreements.privacy;

  const handleSubmit = async () => {
    if (!requiredAgreed) return;

    try {
      // ⭐️ localStorage의 tempUser 사용 (AuthCallback에서 저장한 데이터)
      const tempUserJson = localStorage.getItem('tempUser');
      if (!tempUserJson) {
        alert('잘못된 접근입니다. 다시 로그인해주세요.');
        onBack();
        return;
      }

      const tempUser = JSON.parse(tempUserJson);
      console.log('📦 tempUser:', tempUser);

      // ⭐️ 먼저 이미 회원인지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', tempUser.id)
        .maybeSingle();

      if (existingUser) {
        console.log('ℹ️ 이미 가입된 사용자 → 로그인 처리');
        
        // localStorage에 사용자 정보 저장
        localStorage.setItem('user', JSON.stringify(existingUser));
        localStorage.removeItem('tempUser');
        
        // 쿠키에 로그인 정보 저장
        document.cookie = `last_login_provider=${existingUser.provider}; max-age=${60 * 60 * 24 * 365}; path=/`;
        if (existingUser.email) {
          document.cookie = `last_login_email=${encodeURIComponent(existingUser.email)}; max-age=${60 * 60 * 24 * 365}; path=/`;
        }
        
        // 홈으로 이동 (회원가입 완료 페이지 건너뛰기)
        window.location.href = '/';
        return;
      }

      // ⭐️ public.users 테이블에 사용자 정보 저장
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          id: tempUser.id,  // ⭐️ auth.users의 id와 동일하게 설정
          provider: tempUser.provider,
          provider_id: tempUser.provider_id || tempUser.id,  // provider_id는 auth.users의 id
          email: tempUser.email,
          nickname: tempUser.name,  // ⭐️ name이 아니라 nickname 컬럼
          profile_image: tempUser.avatar_url || '',  // ⭐️ avatar_url이 아니라 profile_image 컬럼
          role: 'user', // 신규 사용자는 기본적으로 'user' 역할
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: agreements.marketing,
          terms_agreed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 회원가입 실패:', error);
        
        // 중복 키 에러 체크
        if (error.code === '23505') {
          console.log('ℹ️ 중복 키 에러 → 이미 가입된 사용자로 간주');
          
          // 다시 조회해서 로그인 처리
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', tempUser.id)
            .single();
          
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.removeItem('tempUser');
            
            document.cookie = `last_login_provider=${user.provider}; max-age=${60 * 60 * 24 * 365}; path=/`;
            if (user.email) {
              document.cookie = `last_login_email=${encodeURIComponent(user.email)}; max-age=${60 * 60 * 24 * 365}; path=/`;
            }
            
            window.location.href = '/';
            return;
          }
        }
        
        alert('회원가입에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      console.log('✅ 회원가입 성공:', newUser);

      // ⭐️ localStorage에 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.removeItem('tempUser');  // 임시 데이터 제거
      
      // 쿠키에 로그인 정보 저장
      document.cookie = `last_login_provider=${newUser.provider}; max-age=${60 * 60 * 24 * 365}; path=/`;
      if (newUser.email) {
        document.cookie = `last_login_email=${encodeURIComponent(newUser.email)}; max-age=${60 * 60 * 24 * 365}; path=/`;
      }

      // ⭐ 가입 축하 쿠폰 발급 (백그라운드에서 실행)
      console.log('🎟️ [회원가입] 가입 축하 쿠폰 발급 시작...');
      issueWelcomeCoupon(newUser.id)
        .then((result) => {
          if (result.success) {
            console.log('✅ [회원가입] 가입 축하 쿠폰 발급 성공!');
            // 쿠폰 발급 성공 플래그 저장 (WelcomeCouponPage에서 사용)
            localStorage.setItem('welcomeCouponIssued', 'true');
          } else {
            console.error('❌ [회원가입] 가입 축하 쿠폰 발급 실패:', result.error);
          }
        })
        .catch((error) => {
          console.error('❌ [회원가입] 가입 축하 쿠폰 발급 예외:', error);
        });
      
      onComplete();
    } catch (err) {
      console.error('❌ 회원가입 오류:', err);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white relative w-full min-h-screen flex justify-center" data-name="약관 동의 _ 390" style={{ scrollbarGutter: 'stable' } as React.CSSProperties}>
      <div className="relative w-full max-w-[440px] min-h-screen flex flex-col bg-white">
        {/* 1. 상단 네비게이션 */}
        <div className="shrink-0 w-full bg-white z-10">
          <div className="h-[52px] w-full shrink-0" aria-hidden="true" />
          <div className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-[440px] h-[52px] w-full flex items-center px-[12px] bg-white">
            <div 
              onClick={onBack} 
              className="flex items-center justify-center p-[4px] rounded-[12px] size-[44px] cursor-pointer text-[#848484] active:bg-gray-100 active:scale-95 transition-all duration-200"
            >
              <div className="size-[24px]">
                <ArrowLeftIcon />
              </div>
            </div>
          </div>
        </div>

        {/* 2. 헤더 텍스트 */}
        <div className="shrink-0 px-[20px] pt-[20px] pb-[40px] text-center">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="font-['Pretendard_Variable'] font-medium leading-[35.5px] text-[24px] tracking-[-0.48px] text-black"
          >
            바로 만나기 전
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="font-['Pretendard_Variable'] text-[27px] leading-[39.5px] font-bold tracking-[-0.27px] text-black mt-[4px]"
          >
            잠깐, 약관에 동의해 주세요!
          </motion.p>
        </div>

        {/* 3. 중앙 약관 리스트 (Scrollable, Scrollbar Hidden) */}
        <div className="flex-1 pl-[20px] pr-[36px] flex flex-col gap-[4px] pt-[0px] pb-[220px]">
          
          {/* Age 14 (Mandatory) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full flex flex-row items-center justify-between min-h-[44px]"
          >
              <div className="flex gap-[12px] items-center text-[16px] tracking-[-0.32px] whitespace-pre">
                  <p className="font-['Pretendard_Variable'] font-medium text-[#48b2af] pl-[8px]">필수</p>
                  <p className="font-['Pretendard_Variable'] text-black">만 14세 이상입니다</p>
              </div>
              <div onClick={() => toggleAgreement('age14')} className="cursor-pointer">
                  <CheckboxIcon checked={agreements.age14} />
              </div>
          </motion.div>

          {/* Terms (Mandatory) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full flex flex-col"
          >
              <div className="flex flex-row items-center justify-between min-h-[44px]">
                  <div onClick={() => toggleExpanded('terms')} className="flex gap-[8px] grow items-center cursor-pointer">
                      <div className="flex gap-[12px] items-center text-[16px] tracking-[-0.32px] whitespace-pre">
                          <p className="font-['Pretendard_Variable'] font-medium text-[#48b2af] pl-[8px]">필수</p>
                          <p className="font-['Pretendard_Variable'] text-black">이용약관 동의</p>
                      </div>
                      <TermsIcon className={`transition-transform duration-300 ${expanded.terms ? 'rotate-180' : ''}`} />
                  </div>
                  <div onClick={() => toggleAgreement('terms')} className="cursor-pointer">
                      <CheckboxIcon checked={agreements.terms} />
                  </div>
              </div>
              <AnimatePresence initial={false}>
              {expanded.terms && (
                  <motion.div
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                          open: { opacity: 1, height: "auto" },
                          collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full overflow-hidden"
                  >
                      <div className="bg-[#f7f8f9] px-[20px] py-[16px] mt-1 mb-3 rounded-[12px] max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-[#d1d5db] [&::-webkit-scrollbar-thumb]:rounded-[4px] [&::-webkit-scrollbar-track]:bg-transparent">
                      <div className="font-['Pretendard_Variable'] text-[13px] leading-[20px] text-[#525252] tracking-[-0.39px] space-y-3">
                          <p className="font-medium">본 약관은 주식회사 스타지오소프트(이하 "회사")가 제공하는 운세 서비스 '나다운'(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항 등을 규정합니다. 서비스를 이용하기 전 반드시 본 약관을 숙지하여 주시기 바랍니다.</p>
                          
                          <div>
                            <p className="font-bold mb-1">제1조 [목적]</p>
                            <p>이 약관은 회사가 제공하는 '나다운' 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다. 본 약관은 서비스 이용과 관련된 모든 사항에 대해 적용됩니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제2조 [정의]</p>
                            <p>1. "서비스"란 회사가 제공하는 생년월일 및 태어난 시간 입력을 통해 사주, 타로 등의 운세 콘텐츠를 제공하는 웹 기반 서비스를 의미합니다.</p>
                            <p>2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.</p>
                            <p>3. "회원"이란 카카오 로그인을 통해 유료 서비스를 이용하는 자를 의미합니다.</p>
                            <p>4. "비회원"이란 회원 가입 없이 무료 서비스를 이용하는 자를 의미합니다.</p>
                            <p>5. "유료 서비스"란 로그인 후 결제하여 이용 가능한 프리미엄 콘텐츠를 포함한 모든 서비스입니다.</p>
                            <p>6. "컨텐츠"란 사주, 타로, 운세 관련 정보, 글, 이미지, 동영상 등 회사가 제공하는 모든 자료를 의미합니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제3조 [약관의 효력 및 변경]</p>
                            <p>1. 이 약관은 회사가 웹사이트에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
                            <p>2. 회사는 관련 법령의 개정, 서비스 운영상의 필요 또는 정책 변화에 따라 약관을 변경할 수 있습니다. 변경된 약관은 제1항과 같은 방법으로 공지됩니다.</p>
                            <p>3. 이용자가 약관 변경을 수락하지 않을 경우, 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 약관 변경에 동의한 것으로 간주됩니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제8조 [청약 철회 및 환불]</p>
                            <p>1. 유료 콘텐츠의 경우, 콘텐츠 특성상 "이용 즉시 제공"되는 디지털 상품으로 콘텐츠 조회 이력이 있는 경우 환불이 불가능합니다.</p>
                            <p>2. 기술적 오류로 콘텐츠를 제공받지 못한 경우, 정보 오류로 정상적인 결제가 나오지 않은 경우, 기타 오류로 정상적인 서비스를 받지 못한 경우에는 환불이 가능합니다.</p>
                            <p>3. 환불을 원하는 경우, 고객센터(이메일: stargiosoft@gmail.com)를 통해 요청할 수 있습니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제12조 [운세 서비스의 한계 및 신뢰성]</p>
                            <p>1. 회사가 제공하는 운세 콘텐츠는 엔터테인먼트적 목적으로 제공됩니다.</p>
                            <p>2. 사주팔자, 명리학, 타로, 점술 등은 과학적으로 효과가 입증되지 않았으므로, 이용자는 이를 통해 인생의 중대사를 결정해서는 안됩니다.</p>
                            <p>3. 회사는 운세 결과로 인해 발생하는 행위나 판단에 대해 일절 책임을 지지 않습니다.</p>
                          </div>

                          <p className="text-[12px] text-[#999999] mt-4">고객센터: stargiosoft@gmail.com<br/>시행일: 2026년 1월 12일</p>
                      </div>
                  </div>
                  </motion.div>
              )}
              </AnimatePresence>
          </motion.div>

          {/* Privacy (Mandatory) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full flex flex-col"
          >
              <div className="flex flex-row items-center justify-between min-h-[44px]">
                  <div onClick={() => toggleExpanded('privacy')} className="flex gap-[8px] grow items-center cursor-pointer">
                      <div className="flex gap-[12px] items-center text-[16px] tracking-[-0.32px] whitespace-pre">
                          <p className="font-['Pretendard_Variable'] font-medium text-[#48b2af] pl-[8px]">필수</p>
                          <p className="font-['Pretendard_Variable'] text-black">개인정보 처리방침 동의</p>
                      </div>
                      <TermsIcon className={`transition-transform duration-300 ${expanded.privacy ? 'rotate-180' : ''}`} />
                  </div>
                  <div onClick={() => toggleAgreement('privacy')} className="cursor-pointer">
                      <CheckboxIcon checked={agreements.privacy} />
                  </div>
              </div>
              <AnimatePresence initial={false}>
              {expanded.privacy && (
                  <motion.div
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                          open: { opacity: 1, height: "auto" },
                          collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full overflow-hidden"
                  >
                      <div className="bg-[#f7f8f9] px-[20px] py-[16px] mt-1 mb-3 rounded-[12px] max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-[#d1d5db] [&::-webkit-scrollbar-thumb]:rounded-[4px] [&::-webkit-scrollbar-track]:bg-transparent">
                      <div className="font-['Pretendard_Variable'] text-[13px] leading-[20px] text-[#525252] tracking-[-0.39px] space-y-3">
                          <p className="font-medium">스타지오소프트(이하 "회사"라 함)의 스타지오(이하 "서비스"라 함)는 개인정보보호법 등 정보통신 서비스 제공자가 준수하여야 할 관련 법규상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다.</p>

                          <div>
                            <p className="font-bold mb-1">제1조 (수집하는 개인정보 항목)</p>
                            <p>① 회사는 고객의 개인정보를 수집하는 경우 서비스의 제을 위하여 필요한 최소한의 범위로 한정하고 있으며, 고객의 동의를 얻거나 법률에 의해 허용된 경우 이외에는 개인 권리, 이익이나 사생활을 침해할 우려가 있는 개인정보를 수집하지 않습니다.</p>
                            <p>② 주요 수집 항목:</p>
                            <p>- (필수) 회원가입: 이름, 이메일, 전화번호</p>
                            <p>- (필수) SNS 계정: 구글(이름, 이메일), 카카오(닉네임, 이메일)</p>
                            <p>- (필수) 서비스 이용: IP주소, 쿠키, 서비스 이용 기록</p>
                            <p>- (필수) 유료 서비스: 주문자 정보, 사주 정보(이름, 성별, 생년월일, 태어난 시각)</p>
                            <p>- (필수) 결제: 카드사명/승인번호 또는 입금은행</p>
                            <p>- (선택) 마케팅: 이름, 이메일, 휴대폰번호</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제2조 (개인정보의 수집 및 이용목적)</p>
                            <p>회사는 다음 목적으로 개인정보를 수집합니다:</p>
                            <p>1. 회원 관리: 회원가입 및 관리, 본인 식별, 서비스 부정이용 방지</p>
                            <p>2. 서��스 제공: 대금 결제, 콘텐츠 제공, 맞춤 서비스 제공</p>
                            <p>3. 고객 응대: 문의 처리, 신원확인, 처리결과 통보</p>
                            <p>4. 마케팅: 신규 서비스 개발, 이벤트 정보 제공</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제3조 (개인정보의 보유 및 이용기간)</p>
                            <p>고객의 개인정보는 원칙적으로 수집 및 이용목적이 달성되면 5일 이내 지체 없이 파기합니다.</p>
                            <p>단, 다음의 경우 명시한 기간 동안 보존합니다:</p>
                            <p>- 회원 정보: 회원 탈퇴 시까지</p>
                            <p>- 중복가입확인정보(DI): 탈퇴일로부터 6개월</p>
                            <p>- 거래 기록: 법령에 따라 5년 보관</p>
                            <p>- 소비자 불만/분쟁 기록: 3년 보관</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제4조 (개인정보의 제3자 제공)</p>
                            <p>회사는 원칙적으로 고객의 동의 없이 개인정보를 외부에 공개하지 않습니다. 단, 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우는 예외로 합니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제5조 (개인정보의 처리 위탁)</p>
                            <p>회사는 서비스 향상을 위해 다음과 같이 개인정보를 위탁하고 있습니다:</p>
                            <p>- 결제처리: ㈜포트원</p>
                            <p>- 서버 및 데이터 보관: Naver Cloud Platform</p>
                            <p>- 문자/이메일 발송: ㈜카카오</p>
                            <p>- 본인인증: ㈜KG이니시스</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제7조 (정보주체의 권리)</p>
                            <p>고객은 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. '마이페이지' 메뉴 또는 문의하기 페이지를 통해 요청할 수 있습니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제8조 (쿠키 사용)</p>
                            <p>회사는 개별적인 맞춤서비스 제공을 위해 쿠키를 사용합니다. 고객은 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 맞춤형 서비스 이용에 어려움이 있을 수 있습니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제10조 (개인정보보호책임자)</p>
                            <p>성명: 김호동 / 직위: 팀장</p>
                            <p>연락처: 010-3702-0428</p>
                            <p>이메일: fship1124@stargio.co.kr</p>
                          </div>

                          <p className="text-[12px] text-[#999999] mt-4">변경사항은 시행 7일 전 고지됩니다.</p>
                      </div>
                  </div>
                  </motion.div>
              )}
              </AnimatePresence>
          </motion.div>

          {/* Marketing (Optional) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="w-full flex flex-col"
          >
              <div className="flex flex-row items-center justify-between min-h-[44px]">
                  <div onClick={() => toggleExpanded('marketing')} className="flex gap-[8px] grow items-center cursor-pointer">
                      <div className="flex gap-[12px] items-center text-[16px] tracking-[-0.32px] whitespace-pre">
                          <p className="font-['Pretendard_Variable'] font-medium text-[#999999] pl-[8px]">선택</p>
                          <p className="font-['Pretendard_Variable'] text-black">마케팅 정보 수신 동의</p>
                      </div>
                      <TermsIcon className={`transition-transform duration-300 ${expanded.marketing ? 'rotate-180' : ''}`} />
                  </div>
                  <div onClick={() => toggleAgreement('marketing')} className="cursor-pointer">
                      <CheckboxIcon checked={agreements.marketing} />
                  </div>
              </div>
              <AnimatePresence initial={false}>
              {expanded.marketing && (
                  <motion.div
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                          open: { opacity: 1, height: "auto" },
                          collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full overflow-hidden"
                  >
                      <div className="bg-[#f7f8f9] px-[20px] py-[16px] mt-1 mb-3 rounded-[12px] max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-[#d1d5db] [&::-webkit-scrollbar-thumb]:rounded-[4px] [&::-webkit-scrollbar-track]:bg-transparent">
                      <div className="font-['Pretendard_Variable'] text-[13px] leading-[20px] text-[#525252] tracking-[-0.39px] space-y-3">
                          <p className="font-medium">「개인정보보호법」 및 「정보통신망법」 규정에 따라, '스타지오소프트'가 제공하는 이벤트, 혜택 등 다양한 광고성 정보를 아래의 방법으로 수신하는 것에 동의합니다.</p>
                          
                          <div>
                            <p className="font-bold mb-1">전송 방법</p>
                            <p>이메일, 문자 메시지(SMS/LMS/MMS), 카카오톡 광고 메시지, 앱 푸시(App Push) 알림</p>
                          </div>

                          <p className="text-[12px] text-[#999999]">※ 귀하는 위와 같은 광고성 정보 수신에 동의하지 않으실 수 있습니다. 동의를 거부하시더라도 '스타지오'의 기본 서비스 이용에는 제한이 없으나, 할인, 이벤트 등 유용한 정보를 제공받지 못할 수 있습니다.</p>
                          
                          <p className="text-[12px] text-[#999999]">※ 본 동의는 언제든지 '마이페이지' 또는 고객센터를 통해 철회할 수 있습니다.</p>
                      </div>
                  </div>
                  </motion.div>
              )}
              </AnimatePresence>
          </motion.div>

          {/* Ads (Optional) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="w-full flex flex-col"
          >
              <div className="flex flex-row items-center justify-between min-h-[44px]">
                  <div onClick={() => toggleExpanded('ads')} className="flex gap-[8px] grow items-center cursor-pointer">
                      <div className="flex gap-[12px] items-center text-[16px] tracking-[-0.32px] whitespace-pre">
                          <p className="font-['Pretendard_Variable'] font-medium text-[#999999] pl-[8px]">선택</p>
                          <p className="font-['Pretendard_Variable'] text-black">광고성 정보 수신 동의</p>
                      </div>
                      <TermsIcon className={`transition-transform duration-300 ${expanded.ads ? 'rotate-180' : ''}`} />
                  </div>
                  <div onClick={() => toggleAgreement('ads')} className="cursor-pointer">
                      <CheckboxIcon checked={agreements.ads} />
                  </div>
              </div>
              <AnimatePresence initial={false}>
              {expanded.ads && (
                  <motion.div
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                          open: { opacity: 1, height: "auto" },
                          collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full overflow-hidden"
                  >
                      <div className="bg-[#f7f8f9] px-[20px] py-[16px] mt-1 mb-3 rounded-[12px] max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-[#d1d5db] [&::-webkit-scrollbar-thumb]:rounded-[4px] [&::-webkit-scrollbar-track]:bg-transparent">
                      <div className="font-['Pretendard_Variable'] text-[13px] leading-[20px] text-[#525252] tracking-[-0.39px] space-y-3">
                          <p className="font-medium">회사는 정보주체의 동의 하에 다음과 같이 마케팅 및 광고를 위한 개인정보를 수집·이용합니다.</p>

                          <div>
                            <p className="font-bold mb-1">1. 수집·이용 목적</p>
                            <p>- 신규 서비스, 기능, 이벤트, 프로모션 정보 안내</p>
                            <p>- 맞춤형 서비스 추천, 광고성 정보 제공</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">2. 수집하는 개인정보 항목</p>
                            <p>이름, 이메일, 휴대폰번호</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">3. 보유 및 이용 기간</p>
                            <p>회원 탈퇴 시 또는 동의 철회 시까지</p>
                          </div>

                          <p className="text-[12px] text-[#999999]">※ 귀하는 위와 같은 개인정보의 선택적 수집·이용에 동의하지 않으실 수 있습니다. 동의를 거부하시더라도 기본 서비스 이용에는 제한이 없으나, 다양한 혜택 및 이벤트 정보를 제공받지 못할 수 있습니다.</p>
                          
                          <p className="text-[12px] text-[#999999]">※ 본 동의는 언제든지 '마이페이지' 또는 고객센터를 통해 철회할 수 있습니다.</p>
                      </div>
                  </div>
                  </motion.div>
              )}
              </AnimatePresence>
          </motion.div>
        </div>

        {/* 4. 하단 고정 영역 */}
        <div className="fixed bottom-[env(safe-area-inset-bottom)] left-0 right-0 mx-auto w-full max-w-[440px] px-[20px] pb-[34px] pt-[16px] bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] flex flex-col gap-[12px] z-20">
          
          {/* 약관 전체 동의 박스 */}
          <div onClick={handleAllAgree} className="w-full bg-[#f7f8f9] rounded-[12px] p-[16px] flex items-center justify-between cursor-pointer">
            <span className="font-['Pretendard_Variable'] font-semibold text-[16px] tracking-[-0.32px] text-black">
              약관 전체 동의
            </span>
            <CheckboxIcon checked={allAgreed} />
          </div>

          {/* 다음 단계 버튼 */}
          <motion.button
            onClick={handleSubmit}
            disabled={!requiredAgreed}
            className={`w-full h-auto py-[16px] rounded-[16px] flex items-center justify-center overflow-hidden transition-all ${
              requiredAgreed ? 'bg-[#48b2af] text-white cursor-pointer' : 'bg-[#f8f8f8] text-[#b7b7b7] cursor-not-allowed'
            }`}
            whileTap={requiredAgreed ? { scale: 0.96, backgroundColor: "#36908f" } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="font-['Pretendard_Variable'] font-medium text-[16px] tracking-[-0.32px]">
              다음 단계로 이동하기
            </span>
          </motion.button>

          {/* 개발용: 완료 페이지 확인 버튼 */}
          <button onClick={onComplete} className="w-full py-2 text-xs text-gray-400 underline">
            [개발용] 약관동의 완료 페이지 보기
          </button>
        </div>

      </div>
    </div>
  );
}