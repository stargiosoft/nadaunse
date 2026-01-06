import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import svgPaths from "../imports/svg-pln046rtst";
import { useEffect } from 'react';
import { motion } from 'motion/react';

function HomeIndicatorLight() {
  return (
null
  );
}

export default function TermsOfServicePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 페이지 로드 시 스크롤을 최상단으로 이동
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white relative w-full min-h-screen flex justify-center">
      <div className="relative w-full max-w-[440px] min-h-screen flex flex-col bg-white mx-auto">
        {/* Top Navigation */}
        <div className="bg-white h-[52px] relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white content-stretch flex flex-col h-[52px] items-start justify-center px-[12px] py-[4px] w-full max-w-[440px]">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div
                  onClick={() => navigate(-1)}
                  className="group flex items-center justify-center rounded-[12px] shrink-0 size-[44px] cursor-pointer bg-transparent transition-colors duration-200 ease-in-out active:bg-gray-100"
                >
                  <svg
                    className="size-[24px] text-[#848484] transition-transform duration-200 ease-in-out group-active:scale-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeMiterlimit="10"
                    />
                  </svg>
                </div>
                <p className="basis-0 font-['Pretendard_Variable',sans-serif] font-semibold grow leading-[25.5px] text-[18px] text-black text-center tracking-[-0.36px]">
                  서비스 이용약관
                </p>
                <div className="opacity-0 w-[44px] h-[44px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-[20px] py-[20px] pb-[60px]">
          <div className="flex flex-col gap-[32px]">
            {/* 최종 업데이트일 */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                최종 업데이트일: 2025년 10월 22일
              </p>
              <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                본 약관은 주식회사 스타지오소프트(이하 "회사")가 제공하는 운세 서비스 '나다운'(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항 등을 규정합니다. 서비스를 이용하기 전 반드시 본 약관을 숙지하여 주시기 바랍니다.
              </p>
            </motion.div>

            {/* 제1조 (목적) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제1조 [목적]
              </p>
              <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                이 약관은 회사가 제공하는 '나다운' 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다. 본 약관은 서비 이용과 관련된 모든 사항에 대해 적용됩니다.
              </p>
            </motion.div>

            {/* 제2조 [정의] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제2조 [정의]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  "서비스"란 회사가 제공하는 생년월일 및 태어난 시간 입력을 통해 사주, 타로 등의 운세 콘텐츠를 제공하는 웹 기반 서비스를 의미합니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  "회원"이란 카카오 로그인을 통해 유료 서비스를 이용하는 자를 의미합니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  "비회원"이란 회원 가입 없이 무료 서비스를 이용하는 자를 의미합니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  "유료 서비스"란 로그인 후 결제하여 이용 가능한 프리미엄 콘텐츠를 포함한 모든 서비스입니다.
                </li>
                <li className="leading-[23.5px]">
                  "컨텐츠"란 사주, 타로, 운세 관련 정보, 글, 이미지, 동영상 등 회사가 제공하는 모든 자료를 의미합니다.
                </li>
              </ol>
            </motion.div>

            {/* 제3조 [약관의 효력 및 변경] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제3조 [약관의 효력 및 변경]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  이 약관은 회사가 웹사이트에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  회사는 관련 법령의 개정, 서비스 운영상의 필요 또는 정책 변화에 따라 약관을 변경할 수 있습니다. 변경된 약관은 제1항과 같은 방법으로 공지됩니다.
                </li>
                <li className="leading-[23.5px]">
                  이용자가 약관 변경을 수락하지 않을 경우, 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 약관 변경에 동의한 것으로 간주됩니다.
                </li>
              </ol>
            </motion.div>

            {/* 제4조 [이용계약의 성립] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제4조 [이용계약의 성립]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  서비스 이용계약은 이용자가 본 약관에 동의하고 서비스를 이용하는 시점에 성립됩니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  무료 서비스는 별도의 가입 절차 없이 이용할 수 있으며, 유료 서비스는 카카오 또는 구글 로그인을 통한 회원 인증 후 이용 가능합니다.
                </li>
                <li className="leading-[23.5px]">
                  이용자는 서비스 이용 시 본인의 정확한 정보를 입력해야 하며, 허위 정보 입력으로 인한 불이익은 이용자 본인이 부담합니다.
                </li>
              </ol>
            </motion.div>

            {/* 제5조 [서비스의 제공 및 변경] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제5조 [서비스의 제공 및 변경]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  회사는 이용자에게 다음과 같은 서비스를 제공합니다: 사주 기반 운세 콘텐츠 제공, 타로 콘텐츠 제공, 그 외 부가 운세 콘텐츠 제공
                </li>
                <li className="mb-0 leading-[23.5px]">
                  회사는 서비스 개선 또는 운영상 필요에 따라 사전 공지 후 서비스의 일부 또는 전부를 변경할 수 있습니다. 다만, 서비스의 주요 변경이 있는 경우 최소 30일 전에 공지해야 합니다.
                </li>
                <li className="leading-[23.5px]">
                  회사는 상시 서비스 제공을 원칙으로 합니다. 단, 정기점검이나 설비의 보수, 전기통신 사업법에 의한 기간통신사업자로 인한 서비스 중단 등의 이유로 사전공지 후 혹은 천재지변 등 불가항력적인 사유로 사전공지 없이 서비스가 일시 중단될 수 있습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제6조 [서비스 이용] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제6조 [서비스 이용]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  이용자는 무료로 제공되는 콘텐츠를 회원가입 없이 이용할 수 있습니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  유료 콘텐츠는 로그인을 통해 회원 인증을 거친 후 결제하여 이용할 수 있습니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  결제 수단은 카카오페이, 신용카드 등이며, 결제 시스템은 외부 결제 대행사인 '포트원'을 통해 운영됩니다.
                </li>
                <li className="leading-[23.5px]">
                  유료 서비스와 무료 서비스는 서로 다른 방식으로 제공될 수 있으며, 결과 내용이 다를 수 있습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제7조 [이용자의 의무] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제7조 [이용자의 의무]
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">1. 이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다:</p>
                <ul className="list-disc ml-[22.5px] mb-[8px]">
                  <li className="mb-0">타인의 개인정보를 도용하거나 허위 정보를 입력하는 행위</li>
                  <li className="mb-0">서비스를 상업적 목적으로 무단 이용하거나 재판매하는 행위</li>
                  <li className="mb-0">서비스의 정상적인 운영을 방해하는 행위</li>
                  <li className="mb-0">스크립트 등을 이용하여 회사의 서버 리소스 등을 무단으로 사용하는 행위</li>
                  <li className="mb-0">서비스 취약점을 악용하여 부정하게 이용하는 행위</li>
                </ul>
                <p className="mb-[8px]">2. 이용자는 본인의 정보가 변경된 경우 즉시 수정해야 하며, 이를 소홀히 하여 발생한 불이익에 대해 회사는 책임지지 않습니다.</p>
                <p>3. 이용자는 본 약관 및 관련 법령에서 규정한 사항을 준수해야 합니다.</p>
              </div>
            </motion.div>

            {/* 제8조 [청약 철회 및 환불] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제8조 [청약 철회 및 환불]
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">1. 유료 콘텐츠의 경우, 콘텐츠 특성상 "이용 즉시 제공"되는 디지털 상품으로 콘텐츠 조회 이력이 있는 경우 환불이 불가능합니다.</p>
                <p className="mb-[8px]">2. 다음의 경우에는 환불이 가능합니다:</p>
                <ul className="list-disc ml-[22.5px] mb-[8px]">
                  <li className="mb-0">기술적 오류로 콘텐츠를 제공받지 못한 경우</li>
                  <li className="mb-0">정보 오류로 정상적인 결과가 나오지 않은 경우</li>
                  <li className="mb-0">기타 오류로 정상적인 서비스를 받지 못한 경우</li>
                </ul>
                <p className="mb-[8px]">3. 환불을 원하는 경우, 고객센터(이메일: stargiosoft@gmail.com)를 통해 요청할 수 있습니다. 회사는 이에 대한 사실을 확인한 후 환불 여부를 결정합니다.</p>
                <p>4. 환불은 회사의 과실로 발생한 문제에 대해서만 가능하며, 결제일로부터 7일 이내에 요청해야 합니다.</p>
              </div>
            </motion.div>

            {/* 제9조 [지적 재산권] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제9조 [지적 재산권]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  서비스 내 제공되는 모든 콘텐츠, 이미지, 텍스트 등은 회사 또는 당한 권리를 가진 자에게 있으며, 이용자는 이를 무단으로 복제, 유통, 전송, 게시할 수 없습니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  이용자가 유료로 구매한 콘텐츠는 이용자 개인의 사적인 이용에 한하여 사용할 수 있으며, 상업적 목적으로 재사용할 수 없습니다.
                </li>
                <li className="leading-[23.5px]">
                  회사는 콘텐츠의 저작권을 보호하기 위해 필요한 조치를 취할 수 있습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제10조 [개인정보 보호] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제10조 [개인정보 보호]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  회사는 서비스 제공을 위해 최소한의 개인정보(예: 생년월일, 태어난 시간 등)를 수집하며, 수집된 정보는 '개인정보처리방침'에 따라 안전하게 처리됩니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  개인정보 처리방침은 본 약관의 일부로 간주되며, 별도로 게시됩니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  이용자는 언제든지 개인정보 열람, 수정 및 삭제를 요청할 수 있습니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  회사가 타 업체와 제휴, 인수, 분사, 합병 시 이용자의 정보는 공유될 수 있으며, 이 경우 회사는 이용자에게 해당 사실을 공지합니다.
                </li>
                <li className="leading-[23.5px]">
                  이용자는 회사에 제공한 개인정보의 수집과 이용에 대한 동의를 언제든지 철회할 수 있습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제11조 [서비스 중단] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제11조 [서비스 중단]
              </p>
              <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                회사는 다음과 같은 경우 서비스의 제공을 일시적으로 중단할 수 있습니다: 시스템 정기 점검 또는 유지보수가 필요한 경우, 천재지변, 통신 장애 등 불가항력적 사유가 발생한 경우, 기타 회사의 판단에 따라 서비스 제공이 어려운 경우
              </p>
            </motion.div>

            {/* 제12조 [운세 서비스의 한계 및 신뢰성] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제12조 [운세 서비스의 한계 및 신뢰성]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  회사가 제공하는 운세 콘텐츠는 엔터테인먼트적 목적으로 제공됩니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  회사는 사주팔자, 명리학, 타로, 점술, 해몽, 궁합 등 널리 알려진 운세 서비스를 제공합니다. 이러한 방법론은 역사가 오래되었으나, 과학적으로 그 효과가 입증되지 않았으므로, 이용자는 이를 통해 인생의 중대사를 결정해서는 안됩니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  회사는 이용자의 결정에 따라 해석된 운세 결과로 인해 발생하는 행위나 판단에 대해 일절 책임을 지지 않습니다.
                </li>
                <li className="leading-[23.5px]">
                  운세 콘텐츠는 엔터테인먼트적 목적이며, 특정한 결정이나 진단, 치료의 근거로 사용해서는  됩니다.
                </li>
              </ol>
            </motion.div>

            {/* 제13조 [서비스 이용제한] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제13조 [서비스 이용제한]
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">1. 회사는 다음에 해당하는 경우 사전통지 없이 이용자의 이용계약을 해지하거나 일정기간 서비스 이용을 제한할 수 있습니다.</p>
                <ul className="list-disc ml-[22.5px] mb-[8px]">
                  <li className="mb-0">타인의 개인정보를 도용하는 경우</li>
                  <li className="mb-0">범죄행위와 관련되는 경우</li>
                  <li className="mb-0">공공질서 및 미풍양속에 반하는 경우</li>
                  <li className="mb-0">타인의 명예를 훼손하거나 불이익을 주는 경우</li>
                  <li className="mb-0">서비스에 위해를 가하는 등 건전한 이용을 저해하는 경우</li>
                  <li className="mb-0">회사의 서버 리소스 등을 무단으 사용하는 경</li>
                  <li className="mb-0">기타 관계법령에 위배되는 경우</li>
                </ul>
                <p>2. 제한된 이용자는 서비스 이용 정지에 대해 회사에 이의를 제기할 수 있으며, 회사는 이를 검토하여 적절한 조치를 취합니다.</p>
              </div>
            </motion.div>

            {/* 제14조 [회사 리소스 무단 사용에 대한 조치] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제14조 [회사 리소스 무단 사용에 대한 조치]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  회사의 리소스를 무단으로 사용하는 경우, 회사는 발생한 손해에 대한 배상을 청구할 수 있습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제15조 [시스템 보안 및 해킹 방지] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제15조 [시스템 보안 및 해킹 방지]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  회사의 시스템, 데이터 등에 대한 해킹 시도는 정보통신망 이용 촉진 및 정보보호 등에 관한 법률 제48조 제1항에 따라 처벌될 수 있으며, 미수에 그친 경우에도 처벌 대상이 될 수 있습니다.
                </li>
                <li className="leading-[23.5px]">
                  회사는 해킹 시도에 대해 필요한 법적 조치를 취할 수 있으며, 이로 인해 발생한 손해에 대한 배상을 청구할 수 있습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제16조 [책임의 제한] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제16조 [책임의 제한]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  회사는 서비스의 중단, 지연, 오류 등으로 인한 이용자의 손해에 대해 책임을 지지 않으며, 이용자는 이를 감수하고 서비스 이용에 동의하는 것으로 간주됩니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  회사는 천재지변 및 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우, 서비스 제공에 관한 책임이 면제됩니다.
                </li>
                <li className="leading-[23.5px]">
                  회사는 이용자가 서비스에 입력한 정보 및 자료의 신뢰성, 정확성 등 내용에 관하여 책임을 지지 않습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제17조 [회사의 의무] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제17조 [회사의 의무]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  회사는 제11조 및 기타 특별한 사유가 없는 한 이용자가 신청한 서비스를 이용할 수 있도록 합니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  회사는 본 약관에서 정한 바에 따라 지속적, 안정적으로 서비스를 제공할 의무가 있습니다.
                </li>
                <li className="leading-[23.5px]">
                  회사는 이용자의 개인정보를 본인의 승낙 없이 타인에게 공개, 배포하지 않습니다. 단, 전기통신 관련 법령 등 관계법령에 의해 국가기관 등의 요구가 있는 경우, 개인의 안전을 보호해야 할 시급한 경우에는 그러하지 않습니다.
                </li>
              </ol>
            </motion.div>

            {/* 제18조 [준거법 및 관할] */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제18조 [준거법 및 관할]
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">
                  본 약관은 대한민국 법령에 따라 해석됩니다.
                </li>
                <li className="mb-0 leading-[23.5px]">
                  서비스와 관련된 분쟁은 회사의 본점 소재지를 관할하는 법원을 제1심 관할 법원으로 합니다.
                </li>
                <li className="leading-[23.5px]">
                  분쟁 발생 시, 우선적으로 회사와 이용자는 원만한 해결을 위해 상호 협력해야 하며, 협의가 되지 않을 경우 법적 절차를 진행할 수 있습니다.
                </li>
              </ol>
            </motion.div>

            {/* 고객센터 */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.95 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                고객센터
              </p>
              <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                이메일: stargiosoft@gmail.com
              </p>
            </motion.div>

            {/* 부 칙 */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                부 칙
              </p>
              <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                (시행일) 이 약관은 2025년 10월 22일부터 시행합니다.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Home Indicator */}
        <HomeIndicatorLight />
      </div>
    </div>
  );
}