import React, { useState } from 'react';
import SEO from './SEO';
import { supabase } from '../lib/supabase';
import { issueWelcomeCoupon } from '../lib/coupon';
import { motion, AnimatePresence } from 'motion/react';
import { DEV } from '../lib/env';
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

      // ⭐ 가입 축하 쿠폰 발급 비활성화 (A/B 가격 테스트 기간)
      // issueWelcomeCoupon(newUser.id) ...
      
      onComplete();
    } catch (err) {
      console.error('❌ 회원가입 오류:', err);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <>
      <SEO title="약관 동의" noIndex={true} />
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
                            <ol className="list-decimal ml-[22.5px]">
                              <li>"서비스"란 회사가 제공하는 생년월일 및 태어난 시간 입력을 통해 사주, 타로 등의 운세 콘텐츠를 제공하는 웹 기반 서비스를 의미합니다.</li>
                              <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
                              <li>"회원"이란 카카오 로그인을 통해 유료 서비스를 이용하는 자를 의미합니다.</li>
                              <li>"비회원"이란 회원 가입 없이 무료 서비스를 이용하는 자를 의미합니다.</li>
                              <li>"유료 서비스"란 로그인 후 결제하여 이용 가능한 프리미엄 콘텐츠를 포함한 모든 서비스입니다.</li>
                              <li>"컨텐츠"란 사주, 타로, 운세 관련 정보, 글, 이미지, 동영상 등 회사가 제공하는 모든 자료를 의미합니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제3조 [약관의 효력 및 변경]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>이 약관은 회사가 웹사이트에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                              <li>회사는 관련 법령의 개정, 서비스 운영상의 필요 또는 정책 변화에 따라 약관을 변경할 수 있습니다. 변경된 약관은 제1항과 같은 방법으로 공지됩니다.</li>
                              <li>이용자가 약관 변경을 수락하지 않을 경우, 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 약관 변경에 동의한 것으로 간주됩니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제4조 [이용계약의 성립]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>서비스 이용계약은 이용자가 본 약관에 동의하고 서비스를 이용하는 시점에 성립됩니다.</li>
                              <li>무료 서비스는 별도의 가입 절차 없이 이용할 수 있으며, 유료 서비스는 카카오 또는 구글 로그인을 통한 회원 인증 후 이용 가능합니다.</li>
                              <li>이용자는 서비스 이용 시 본인의 정확한 정보를 입력해야 하며, 허위 정보 입력으로 인한 불이익은 이용자 본인이 부담합니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제5조 [서비스의 제공 및 변경]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회사는 이용자에게 다음과 같은 서비스를 제공합니다: 사주 기반 운세 콘텐츠 제공, 타로 콘텐츠 제공, 그 외 부가 운세 콘텐츠 제공</li>
                              <li>회사는 서비스 개선 또는 운영상 필요에 따라 사전 공지 후 서비스의 일부 또는 전부를 변경할 수 있습니다. 다만, 서비스의 주요 변경이 있는 경우 최소 30일 전에 공지해야 합니다.</li>
                              <li>회사는 상시 서비스 제공을 원칙으로 합니다. 단, 정기점검이나 설비의 보수, 전기통신 사업법에 의한 기간통신사업자로 인한 서비스 중단 등의 이유로 사전공지 후 혹은 천재지변 등 불가항력적인 사유로 사전공지 없이 서비스가 일시 중단될 수 있습니다.</li>
                              <li>회사는 회원이 등록한 전화번호로 서비스 이용 관련 알림(결제 완료, 콘텐츠 생성 완료, 주간 성향 분석 보고서 등)을 카카오 알림톡으로 발송합니다.</li>
                              <li>주간 성향 분석 보고서는 회원이 서비스 이용 중 기록한 성향 태그를 분석하여 매주 자동으로 생성 및 발송됩니다.</li>
                              <li>알림톡 수신을 원하지 않는 경우, 프로필에서 전화번호를 삭제하거나 고객센터를 통해 수신 거부를 요청할 수 있습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제6조 [서비스 이용]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>이용자는 무료로 제공되는 콘텐츠를 회원가입 없이 이용할 수 있습니다.</li>
                              <li>유료 콘텐츠는 로그인을 통해 회원 인증을 거친 후 결제하여 이용할 수 있습니다.</li>
                              <li>결제 수단은 카카오페이, 신용카드 등이며, 결제 시스템은 외부 결제 대행사인 '포트원'을 통해 운영됩니다.</li>
                              <li>유료 서비스와 무료 서비스는 서로 다른 방식으로 제공될 수 있으며, 결과 내용이 다를 수 있습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제7조 [이용자의 의무]</p>
                            <p className="mb-1">1. 이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다:</p>
                            <ul className="list-disc ml-[22.5px] mb-1">
                              <li>타인의 개인정보를 도용하거나 허위 정보를 입력하는 행위</li>
                              <li>서비스를 상업적 목적으로 무단 이용하거나 재판매하는 행위</li>
                              <li>서비스의 정상적인 운영을 방해하는 행위</li>
                              <li>스크립트 등을 이용하여 회사의 서버 리소스 등을 무단으로 사용하는 행위</li>
                              <li>서비스 취약점을 악용하여 부정하게 이용하는 행위</li>
                            </ul>
                            <p className="mb-1">2. 이용자는 본인의 정보가 변경된 경우 즉시 수정해야 하며, 이를 소홀히 하여 발생한 불이익에 대해 회사는 책임지지 않습니다.</p>
                            <p>3. 이용자는 본 약관 및 관련 법령에서 규정한 사항을 준수해야 합니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제8조 [청약 철회 및 환불]</p>
                            <p className="mb-1">1. 유료 콘텐츠의 경우, 콘텐츠 특성상 "이용 즉시 제공"되는 디지털 상품으로 콘텐츠 조회 이력이 있는 경우 환불이 불가능합니다.</p>
                            <p className="mb-1">2. 다음의 경우에는 환불이 가능합니다:</p>
                            <ul className="list-disc ml-[22.5px] mb-1">
                              <li>기술적 오류로 콘텐츠를 제공받지 못한 경우</li>
                              <li>정보 오류로 정상적인 결과가 나오지 않은 경우</li>
                              <li>기타 오류로 정상적인 서비스를 받지 못한 경우</li>
                            </ul>
                            <p className="mb-1">3. 환불을 원하는 경우, 고객센터(이메일: stargiosoft2@gmail.com)를 통해 요청할 수 있습니다. 회사는 이에 대한 사실을 확인한 후 환불 여부를 결정합니다.</p>
                            <p>4. 환불은 회사의 과실로 발생한 문제에 대해서만 가능하며, 결제일로부터 7일 이내에 요청해야 합니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제9조 [지적 재산권]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>서비스 내 제공되는 모든 콘텐츠, 이미지, 텍스트 등은 회사 또는 정당한 권리를 가진 자에게 있으며, 이용자는 이를 무단으로 복제, 유통, 전송, 게시할 수 없습니다.</li>
                              <li>이용자가 유료로 구매한 콘텐츠는 이용자 개인의 사적인 이용에 한하여 사용할 수 있으며, 상업적 목적으로 재사용할 수 없습니다.</li>
                              <li>회사는 콘텐츠의 저작권을 보호하기 위해 필요한 조치를 취할 수 있습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제10조 [개인정보 보호]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회사는 서비스 제공을 위해 최소한의 개인정보(예: 생년월일, 태어난 시간 등)를 수집하며, 수집된 정보는 '개인정보처리방침'에 따라 안전하게 처리됩니다.</li>
                              <li>개인정보 처리방침은 본 약관의 일부로 간주되며, 별도로 게시됩니다.</li>
                              <li>이용자는 언제든지 개인정보 열람, 수정 및 삭제를 요청할 수 있습니다.</li>
                              <li>회사가 타 업체와 제휴, 인수, 분사, 합병 시 이용자의 정보는 공유될 수 있으며, 이 경우 회사는 이용자에게 해당 사실을 공지합니다.</li>
                              <li>이용자는 회사에 제공한 개인정보의 수집과 이용에 대한 동의를 언제든지 철회할 수 있습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제11조 [서비스 중단]</p>
                            <p>회사는 다음과 같은 경우 서비스의 제공을 일시적으로 중단할 수 있습니다: 시스템 정기 점검 또는 유지보수가 필요한 경우, 천재지변, 통신 장애 등 불가항력적 사유가 발생한 경우, 기타 회사의 판단에 따라 서비스 제공이 어려운 경우</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제12조 [운세 서비스의 한계 및 신뢰성]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회사가 제공하는 운세 콘텐츠는 엔터테인먼트적 목적으로 제공됩니다.</li>
                              <li>회사는 사주팔자, 명리학, 타로, 점술, 해몽, 궁합 등 널리 알려진 운세 서비스를 제공합니다. 이러한 방법론은 역사가 오래되었으나, 과학적으로 그 효과가 입증되지 않았으므로, 이용자는 이를 통해 인생의 중대사를 결정해서는 안됩니다.</li>
                              <li>회사는 이용자의 결정에 따라 해석된 운세 결과로 인해 발생하는 행위나 판단에 대해 일절 책임을 지지 않습니다.</li>
                              <li>운세 콘텐츠는 엔터테인먼트적 목적이며, 특정한 결정이나 진단, 치료의 근거로 사용해서는 안됩니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제13조 [서비스 이용제한]</p>
                            <p className="mb-1">1. 회사는 다음에 해당하는 경우 사전통지 없이 이용자의 이용계약을 해지하거나 일정기간 서비스 이용을 제한할 수 있습니다.</p>
                            <ul className="list-disc ml-[22.5px] mb-1">
                              <li>타인의 개인정보를 도용하는 경우</li>
                              <li>범죄행위와 관련되는 경우</li>
                              <li>공공질서 및 미풍양속에 반하는 경우</li>
                              <li>타인의 명예를 훼손하거나 불이익을 주는 경우</li>
                              <li>서비스에 위해를 가하는 등 건전한 이용을 저해하는 경우</li>
                              <li>회사의 서버 리소스 등을 무단으로 사용하는 경우</li>
                              <li>기타 관계법령에 위배되는 경우</li>
                            </ul>
                            <p>2. 제한된 이용자는 서비스 이용 정지에 대해 회사에 이의를 제기할 수 있으며, 회사는 이를 검토하여 적절한 조치를 취합니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제14조 [회사 리소스 무단 사용에 대한 조치]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회사의 리소스를 무단으로 사용하는 경우, 회사는 발생한 손해에 대한 배상을 청구할 수 있습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제15조 [시스템 보안 및 해킹 방지]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회사의 시스템, 데이터 등에 대한 해킹 시도는 정보통신망 이용 촉진 및 정보보호 등에 관한 법률 제48조 제1항에 따라 처벌될 수 있으며, 미수에 그친 경우에도 처벌 대상이 될 수 있습니다.</li>
                              <li>회사는 해킹 시도에 대해 필요한 법적 조치를 취할 수 있으며, 이로 인해 발생한 손해에 대한 배상을 청구할 수 있습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제16조 [책임의 제한]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회사는 서비스의 중단, 지연, 오류 등으로 인한 이용자의 손해에 대해 책임을 지지 않으며, 이용자는 이를 감수하고 서비스 이용에 동의하는 것으로 간주됩니다.</li>
                              <li>회사는 천재지변 및 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우, 서비스 제공에 관한 책임이 면제됩니다.</li>
                              <li>회사는 이용자가 서비스에 입력한 정보 및 자료의 신뢰성, 정확성 등 내용에 관하여 책임을 지지 않습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제17조 [회사의 의무]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회사는 제11조 및 기타 특별한 사유가 없는 한 이용자가 신청한 서비스를 이용할 수 있도록 합니다.</li>
                              <li>회사는 본 약관에서 정한 바에 따라 지속적, 안정적으로 서비스를 제공할 의무가 있습니다.</li>
                              <li>회사는 이용자의 개인정보를 본인의 승낙 없이 타인에게 공개, 배포하지 않습니다. 단, 전기통신 관련 법령 등 관계법령에 의해 국가기관 등의 요구가 있는 경우, 개인의 안전을 보호해야 할 시급한 경우에는 그러하지 않습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제18조 [준거법 및 관할]</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>본 약관은 대한민국 법령에 따라 해석됩니다.</li>
                              <li>서비스와 관련된 분쟁은 회사의 본점 소재지를 관할하는 법원을 제1심 관할 법원으로 합니다.</li>
                              <li>분쟁 발생 시, 우선적으로 회사와 이용자는 원만한 해결을 위해 상호 협력해야 하며, 협의가 되지 않을 경우 법적 절차를 진행할 수 있습니다.</li>
                            </ol>
                          </div>

                          <p className="text-[12px] text-[#999999] mt-4">고객센터: stargiosoft2@gmail.com<br/>시행일: 2026년 2월 4일</p>
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
                          <p className="font-medium">스타지오소프트(이하 "회사"라 함)의 나다운세(이하 "서비스"라 함)는 「개인정보보호법」 등 정보통신 서비스 제공자가 준수하여야 할 관련 법규상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다.</p>
                          <p className="font-medium">본 개인정보처리방침은 관련 법령 및 지침의 변경과 나다운세 내부 운영 방침의 변경에 의해 변경될 수 있으며, 변경사항은 시행 7일 전 공지합니다.</p>

                          <div>
                            <p className="font-bold mb-1">제1조 (수집하는 개인정보 항목)</p>
                            <p>① 회사는 고객의 개인정보를 수집하는 경우 서비스의 제공을 위하여 필요한 최소한의 범위로 한정하고 있으며, 고객의 동의를 얻거나 법률에 의해 허용된 경우 이외에는 개인 권리, 이익이나 사생활을 침해할 우려가 있는 개인정보를 수집하지 않습니다.</p>
                            <p>② 회사가 수집하는 개인정보 항목은 다음과 같습니다:</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>(필수) 회원가입: 이름, 이메일, 전화번호</li>
                              <li>(필수) SNS 계정 이용 시: 구글(이름, 이메일), 카카오(닉네임, 이메일)</li>
                              <li>(필수) 서비스 이용 시: IP주소, 쿠키, 방문기록, 이용기록, 서비스 이용 기록</li>
                              <li>(필수) 유료 서비스 이용 시: 주문자 정보 (이름, 이메일, 연락처), 사주 정보(이름, 성별, 생년월일, 태어난 시각)</li>
                              <li>(필수) 대금 결제 시: 카드사명/은행명, 카드번호 일부(마스킹 포함), 승인번호</li>
                              <li>(선택) 마케팅 활용 동의 시: 이름, 이메일, 휴대폰번호</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제2조 (개인정보의 수집 및 이용목적)</p>
                            <p>회사는 다음 목적을 위해 개인정보를 처리하며, 명시한 목적 이외로는 이용하지 않습니다. 이용 목적이 변경될 경우 사전 동의를 구합니다.</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>회원 관리: 회원가입 의사 확인, 회원 식별, 서비스 부정이용 방지, 민원 처리, 고지/안내사항 전달</li>
                              <li>재화 또는 서비스 제공: 대금 결제, 콘텐츠 제공, 구매 및 대금 결제 기록 보존, 맞춤 서비스 제공</li>
                              <li>고객 문의 응대: 고객 문의 처리, 신원 확인, 처리 결과 통보</li>
                              <li>마케팅 및 광고에 활용 (선택 동의 시): 신규 서비스 개발/특화, 인구통계학적 특성에 따른 광고 게재, 이벤트/프로모션 정보 제공</li>
                              <li>서비스 알림 발송: 알림톡을 통한 결제 완료 안내, 콘텐츠 생성 완료 안내, 주간 성향 분석 보고서 발송 등</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제3조 (개인정보의 보유 및 이용기간)</p>
                            <p>① 고객의 개인정보는 원칙적으로 수집 및 이용목적이 달성되면 5일 이내 지체 없이 파기합니다.</p>
                            <p>② 다만, 관련 법령에 의해 보존할 필요가 있는 경우 아래 기간 동안 보존합니다:</p>
                            <ul className="list-disc ml-[22.5px]">
                              <li>회원 정보: 회원 탈퇴 시까지</li>
                              <li>중복가입확인정보(DI): 탈퇴일로부터 6개월</li>
                              <li>신용정보의 수집·처리 및 이용 등에 관한 기록: 3년</li>
                              <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년 (「전자상거래 등에서의 소비자보호에 관한 법률」)</li>
                              <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (「전자상거래 등에서의 소비자보호에 관한 법률」)</li>
                              <li>로그인 기록: 3개월 (「통신비밀보호법」)</li>
                            </ul>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제4조 (개인정보의 제3자 제공)</p>
                            <p>회사는 원칙적으로 고객의 동의 없이 개인정보를 외부에 공개하지 않습니다.</p>
                            <p>다만, 아래 경우에는 예외로 합니다:</p>
                            <ul className="list-disc ml-[22.5px]">
                              <li>정보주체로부터 별도의 동의를 받은 경우</li>
                              <li>법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
                              <li>공공기관이 법령 등에서 정하는 소관 업무 수행을 위해 불가피한 경우</li>
                              <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
                            </ul>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제5조 (개인정보의 처리 위탁)</p>
                            <p>① 회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.</p>
                            <p>② 회사의 개인정보 위탁처리 기관 및 위탁업무 내용은 아래와 같습니다:</p>
                            <ul className="list-disc ml-[22.5px]">
                              <li>결제처리: ㈜포트원</li>
                              <li>서버 및 데이터 보관: Naver Cloud Platform</li>
                              <li>문자/알림 발송: ㈜카카오</li>
                              <li>본인인증: ㈜KG이니시스</li>
                            </ul>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제6조 (개인정보의 파기)</p>
                            <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                            <p>② 정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</p>
                            <p>③ 개인정보 파기의 절차 및 방법은 다음과 같습니다:</p>
                            <ul className="list-disc ml-[22.5px]">
                              <li>파기절차: 불필요한 개인정보 및 개인정보파일은 개인정보보호책임자의 책임 하에 내부 방침 절차에 따라 파기합니다.</li>
                              <li>파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.</li>
                            </ul>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제7조 (정보주체의 권리·의무 및 그 행사방법)</p>
                            <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 권리를 행사할 수 있습니다:</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>개인정보 열람 요구</li>
                              <li>오류 등이 있을 경우 정정 요구</li>
                              <li>삭제 요구</li>
                              <li>처리정지 요구</li>
                            </ol>
                            <p>② 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX), '마이페이지' 메뉴 또는 문의하기 페이지 등을 통하여 하실 수 있습니다.</p>
                            <p>③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
                            <p>④ 제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제8조 (쿠키의 설치·운영 및 거부에 관한 사항)</p>
                            <p>① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</p>
                            <p>② 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에 보내는 소량의 정보이며, 이용자 컴퓨터의 하드디스크에 저장되기도 합니다.</p>
                            <p>③ 쿠키에 의해 수집되는 정보 및 이용 목적은 다음과 같습니다:</p>
                            <ul className="list-disc ml-[22.5px]">
                              <li>수집정보: 접속IP, 브라우저 유형, 이용기록 등</li>
                              <li>이용목적: 이용자별 관심 분야 파악, 자취 추적, 방문횟수 파악, 타겟 마케팅 및 개인 맞춤 서비스 제공</li>
                            </ul>
                            <p>④ 이용자는 쿠키 설치에 대해 선택권을 가지고 있습니다. 웹 브라우저의 설정 옵션을 통해 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키 저장을 거부할 수 있습니다.</p>
                            <p>⑤ 다만, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 있을 수 있습니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제9조 (개인정보의 안전성 확보 조치)</p>
                            <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
                            <ol className="list-decimal ml-[22.5px]">
                              <li>개인정보 취급 직원의 최소화 및 교육: 개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</li>
                              <li>정기적인 자체 감사 실시: 개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.</li>
                              <li>내부관리계획의 수립 및 시행: 개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.</li>
                              <li>개인정보의 암호화: 이용자의 개인정보는 암호화 되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요한 데이터는 파일 및 전송 데이터를 암호화 하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 사용하고 있습니다.</li>
                              <li>해킹 등에 대비한 기술적 대책: 회사는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 합니다. 또한 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
                              <li>접속기록의 보관 및 위변조 방지: 개인정보처리시스템에 접속한 기록을 최소 1년 이상 보관, 관리하고 있으며, 접속기록이 위변조 및 도난, 분실되지 않도록 보안기능을 사용하고 있습니다.</li>
                              <li>비인가자에 대한 출입 통제: 개인정보를 보관하고 있는 물리적 보관 장소를 별도로 두고 이에 대해 출입통제 절차를 수립, 운영하고 있습니다.</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제10조 (개인정보보호책임자)</p>
                            <p>① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.</p>
                            <ul className="list-disc ml-[22.5px]">
                              <li>성명: 김호동</li>
                              <li>직위: 팀장</li>
                              <li>연락처: 010-3702-0428</li>
                              <li>이메일: fship1124@stargio.co.kr</li>
                            </ul>
                            <p>② 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보보호책임자에게 문의하실 수 있습니다.</p>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제11조 (권익침해 구제방법)</p>
                            <p>정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다.</p>
                            <ul className="list-disc ml-[22.5px]">
                              <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
                              <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                              <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
                              <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
                            </ul>
                          </div>

                          <div>
                            <p className="font-bold mb-1">제12조 (개인정보처리방침의 변경)</p>
                            <p>① 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
                            <p>② 본 방침은 2026년 2월 4일부터 시행됩니다.</p>
                          </div>

                          <p className="text-[12px] text-[#999999] mt-4">문의: stargiosoft2@gmail.com</p>
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
          {DEV && (
            <button onClick={onComplete} className="w-full py-2 text-xs text-gray-400 underline">
              [개발용] 약관동의 완료 페이지 보기
            </button>
          )}
        </div>

      </div>
    </div>
    </>
  );
}