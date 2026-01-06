import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import svgPaths from "../imports/svg-pln046rtst";
import iconSvgPaths from "../imports/svg-7qon7dutzl";
import { useEffect } from 'react';
import { motion } from 'motion/react';

function HomeIndicatorLight() {
  return (
    null
  );
}

export default function PrivacyPolicyPage() {
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
                  className="group content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer transition-colors duration-200 active:bg-gray-100"
                >
                  <svg className="w-6 h-6 transition-transform duration-200 group-active:scale-90" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <g id="arrow-left">
                      <path d={iconSvgPaths.p2a5cd480} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                      <path d={iconSvgPaths.p1a4bb100} id="Vector_2" opacity="0" stroke="var(--stroke-0, #848484)" />
                    </g>
                  </svg>
                </div>
                <p className="basis-0 font-['Pretendard_Variable',sans-serif] font-semibold grow leading-[25.5px] text-[18px] text-black text-center tracking-[-0.36px]">
                  개인정보 처리방침
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
                스타지오소프트(이하 "회사"라 함)의 스타지오(이하 "서비스"라 함)는 개인정보보호법 등 정보통신 서비스 제공자가 준수하여야 할 관련 법규상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다.
              </p>
            </motion.div>

            {/* 목차 */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                회사의 개인정보처리방침은 다음과 같은 내용으로 구성되어 있습니다.
              </p>
              <ol className="font-['Pretendard_Variable:Regular',sans-serif] list-decimal text-[#5f5f5f] text-[15px] tracking-[-0.3px] ml-[22.5px]">
                <li className="mb-0 leading-[23.5px]">수집하는 개인정보 항목</li>
                <li className="mb-0 leading-[23.5px]">개인정보의 수집 및 이용목적</li>
                <li className="mb-0 leading-[23.5px]">개인정보 보유 및 이용기간</li>
                <li className="mb-0 leading-[23.5px]">개인정보의 제3자 제공</li>
                <li className="mb-0 leading-[23.5px]">개인정보 처리 위탁</li>
                <li className="mb-0 leading-[23.5px]">개인정보 파기절차 및 방법</li>
                <li className="mb-0 leading-[23.5px]">정보주체 및 법정대리인의 권리와 의무 및 행사방법</li>
                <li className="mb-0 leading-[23.5px]">개인정보 자동수집 장치의 설치·운영 및 거부에 관한 사항</li>
                <li className="mb-0 leading-[23.5px]">개인정보의 안전성 확보 조치</li>
                <li className="mb-0 leading-[23.5px]">개인정보에 관한 민원 서비스</li>
                <li className="mb-0 leading-[23.5px]">권익침해에 대한 구제방법</li>
                <li className="leading-[23.5px]">개인정보처리방침의 변경 및 고지</li>
              </ol>
            </motion.div>

            {/* 제1조 (수집하는 개인정보 항목) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제1조 (수집하는 개인정보 항목)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">① 회사는 고객의 개인정보를 수집하는 경우 서비스의 제공을 위하여 필요한 최소한의 범위로 한정하고 있으며, 고객의 동의를 얻거나 법률에 의해 허용된 경우 이외에는 고객의 사상, 신념, 정치적 성향 등 개인 권리, 이익이나 사생활을 뚜렷하게 침해할 우려가 있는 개인정보를 수집하지 않습니다.</p>
                <p className="mb-[8px]">② 수집 또는 활용, 보관하는 개인정보의 항목, 목적 및 보유기간은 아래와 같습니다.</p>
                <ul className="list-disc ml-[22.5px] space-y-[4px]">
                  <li>(필수) 회원가입 / 이름, 이메일, 전화번호 / 회원 탈퇴 시까지</li>
                  <li>(필수) SNS 계정을 통한 회원가입 / 1) 구글: 이름, 이메일 2) 카카오: 닉네임, 카카오계정(이메일) / 회원 탈퇴 시까지</li>
                  <li>(필수) 본인인증(본인확인) / 암호화된 이용자 확인값(CI) / 본인 일치 여부 비교 확인 후 즉시 파기</li>
                  <li>(필수) 본인인증(중복가입확인) / 중복가입확인정보(DI) / 회원 탈퇴일로부터 6개월간 보관 후 파기</li>
                  <li>(필수) 서비스 내 자동 생성되는 정보 / IP주소, 쿠키, 서비스 이용 기록, 기기 정보(PC/모바일) / 회원 탈퇴 시까지</li>
                  <li>(필수) 유료 서비스 이용을 위한 작성자 정보 기입 / 1) 주문자 정보: 이름, 전화번호, 이메일 2) 사주 정보: 이름, 성별, 생년월일, 양력·음력, 태어난 시각 / 서비스 제공 완료 후 3년 보관 후 파기</li>
                  <li>(필수) 결제에 필요한 결제 수단 정보 / 1) 카드결제: 카드사명, 승인번호 2) 무통장입금: 이름, 입금은행 / 거래가 발생한 날로부터 5년 보관 후 파기</li>
                  <li>(선택) 환불 처리 / 계좌주, 계좌번호, 결제 정보 / 거래가 발생한 날로부터 5년 보관 후 파기</li>
                  <li>(선택) 고객지원 (홈페이지, 채널톡, 유선) / 이름, 이메일, 연락처 / 분쟁이 처리된 날로부터 3년 보관 후 파기</li>
                  <li>(선택) 마케팅 정보 활용 / 이름, 이메일, 휴대폰번호 / 회원 탈퇴 시 또는 동의 철회 시까지</li>
                </ul>
              </div>
            </motion.div>

            {/* 제2조 (개인정보의 수집 및 이용목적) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제2조 (개인정보의 수집 및 이용목적)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">① 고객이 회원가입 시에 개인정보보호정책 조항이 포함되어 있는 회원약관, 개인정보 수집 및 이용 등에 관한 "동의" 체크박스 버튼을 클릭하면 개인정보 수집/활용에 동의한 것으로 봅니다. 그 밖에 각종 서비스 이용 혹은 이벤트 응모, 대리인 인증 등 사용자 정보의 수집 및 활용이 필요한 경우 동의를 받고 있습니다. 고객은 개인정보를 회사에 제공할 것인지에 대해 선택할 수 있습니다. 다만, 서비스 제공에 필수적인 개인정보가 부족할 경우 서비스 이용에 제한이 있을 수 있습니다.</p>
                <p className="mb-[8px]">② 회사는 홈페이지, 제휴 서비스 또는 이벤트를 통한 수집, 생성정보 수집 툴을 통한 수집방법으로 개인정보를 수집합니다.</p>
                <p className="mb-[8px]">③ 회사는 다음 각 호의 목적으로 개인정보를 수집합니다.</p>
                <ol className="list-decimal ml-[22.5px]">
                  <li className="mb-0">회원 관리 : 회사 홈페이지 회원가입 및 관리, 회원제 서비스에 따른 이용자 본인 식별, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지, 고충처리 등</li>
                  <li className="mb-0">서비스 제공에 관한 계약 이행 및 요금정산 : 서비스 제공, 대금 결제, 콘텐츠 제공, 맞춤 서비스 제공, 서비스 제공을 위한 본인 식별 등</li>
                  <li className="mb-0">고객 응대 : 고객의 문의에 대한 처리 신원확인, 고객문의사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 등</li>
                  <li>신규 서비스 개발 및 마케팅에서의 활용 : 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트, 광고성 정보 제공 및 참여기회 제공, 서비스의 유효성 확인, 회원 서비스 이용 통계 파악 등</li>
                </ol>
              </div>
            </motion.div>

            {/* 제3조 (개인정보의 보유 및 이용기간) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제3조 (개인정보의 보유 및 이용기간)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">고객의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 5일 이내(백업 기간 고려) 지체 없이 파기합니다.</p>
                <p className="mb-[8px]">단, 다음 각 호의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</p>
                <p className="mb-[8px]">① 회사 내부 방침에 의해 정보보유 사유: 홈페이지 회원 가입 및 관리를 위해 홈페이지 탈퇴 시까지. 다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지입니다.</p>
                <ol className="list-decimal ml-[22.5px] mb-[8px]">
                  <li className="mb-0">관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사조사 종료 시까지</li>
                  <li>홈페이지 이용에 따른 채권·채무관계 잔존 시에는 해당 채권·채무관계 정산 시까지</li>
                </ol>
                <p className="mb-[8px]">② 관련 법령에 의한 정보보유 사유: 상법, 전자상거래 등에서의 소비자보호에 관한 법률 등 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관계법령에서 정한 일정한 기간 동안 회원정보를 보관하며, 보존기간은 아래와 같습니다.</p>
                <ol className="list-decimal ml-[22.5px] mb-[8px]">
                  <li className="mb-0">전자상거래 등에서의 소비자보호에 관한 법률에 따른 표시·광고, 계약내용 및 이행 등 거래에 관한 기록
                    <ul className="list-disc ml-[22.5px] mt-[4px]">
                      <li className="mb-0">계약 또는 청약철회, 대금결제, 재화 등의 공급에 관한 기록: 5년</li>
                      <li className="mb-0">소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                      <li>표시·광고에 관한 기록: 6개월</li>
                    </ul>
                  </li>
                  <li>통신비밀보호법에 따른 통신 사실 확인자료 보관
                    <ul className="list-disc ml-[22.5px] mt-[4px]">
                      <li>로그인 기록: 3개월</li>
                    </ul>
                  </li>
                </ol>
                <p className="mb-[8px]">③ 회원 탈퇴 시 개인정보 처리에 관한 세부 정책은 다음과 같습니다.</p>
                <ol className="list-decimal ml-[22.5px]">
                  <li className="mb-0">회원 탈퇴 요청 시, 회사는 제3조 제2항의 법령상 보관 의무가 있는 정보를 제외한 모든 개인정보를 지체 없이(5일 이내) 파기합니다.</li>
                  <li className="mb-0">단, 부정한 서비스 이용 방지 및 재가입 확인을 위하여 다음의 정보는 탈퇴일로부터 6개월간 별도 분리 보관 후 파기합니다.
                    <ul className="list-disc ml-[22.5px] mt-[4px]">
                      <li className="mb-0">중복가입확인정보(DI)</li>
                      <li>탈퇴 일시</li>
                    </ul>
                  </li>
                  <li className="mb-0">제2항의 정보는 부정 이용 방지 목적 외에는 절대 이용되지 않으며, 해당 기간이 경과하면 즉시 파기합니다.</li>
                  <li className="mb-0">'전자상거래 등에서의 소비자보호에 관한 법률' 등 관계 법령에 따라 보관해야 하는 거래 기록은 회원 탈퇴 여부와 관계없이 법정 기간(5년) 동안 별도 분리 보관 후 파기됩니다. 보관되는 주요 정보는 다음과 같습니다.
                    <ul className="list-disc ml-[22.5px] mt-[4px]">
                      <li>계약 또는 청약철회 등에 관한 기록, 대금결제 및 재화 등의 공급에 관한 기록 (예: 구매자명, 구매 상품명, 구매 금액, 구매 일시)</li>
                    </ul>
                  </li>
                  <li>회원 탈퇴 후 재가입은 가능하나, 재가입 시 신규 가입 혜택(쿠폰 등)은 지급되지 않을 수 있습니다.</li>
                </ol>
              </div>
            </motion.div>

            {/* 제4조 (개인정보의 제3자 제공) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제4조 (개인정보의 제3자 제공)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">회사는 고객의 개인정보를 본 방침 제2조(개인정보의 수집 및 이용목적)에서 고지한 범위 내에서 사용하며, 원칙적으로 고객의 동의 없이는 고객의 개인정보를 외부에 공개하지 않습니다. 단, 다음 각 호의 경우에 대해서는 제외됩니다.</p>
                <ol className="list-decimal ml-[22.5px]">
                  <li className="mb-0">정보주체로부터 별도의 동의를 받은 경우</li>
                  <li className="mb-0">법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
                  <li className="mb-0">정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
                </ol>
              </div>
            </motion.div>

            {/* 제5조 (개인정보의 처리 위탁) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제5조 (개인정보의 처리 위탁)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며, 관계 법령에 따라 위탁 계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다. 위탁된 개인정보는 회원 탈퇴, 위탁 계약의 종료 등 개인정보 처리 목적이 달성된 때에 지체 없이(5일 이내) 파기됩니다.</p>
                <p className="mb-[8px]">1. 위탁받는 자 및 위탁업무 내용은 다음과 같습니다.</p>
                <ul className="list-disc ml-[22.5px] mb-[8px]">
                  <li className="mb-0">① 결제처리 : ㈜포트원- 결제대행 및 결제처리 업무</li>
                  <li className="mb-0">② 서버 및 데이터 보관 : Naver Cloud Platform – 서비스 데이터 저장 및 관리</li>
                  <li className="mb-0">③ 문자 및 이메일 발송 : ㈜카카오 – 알림톡</li>
                  <li>④ 본인인증 : ㈜KG이니시스 – 본인인증 서비스 제공</li>
                </ul>
                <p>2. 회사는 위탁계약 체결 시 개인정보보호 관련 법규 준수를 위해 개인정보보호조치, 재위탁 제한, 사고 발생 시 책임부담, 계약 종료 후 개인정보의 반환 및 파기 등을 명시하여 관리·감독합니다.</p>
              </div>
            </motion.div>

            {/* 제6조 (개인정보 파기절차 및 방법) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제6조 (개인정보 파기절차 및 방법)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">회사는 고객의 개인정보를 개인정보의 수집 및 이용목적이 달성되면 5일 이내(백업 기간 고려) 지체 없이 파기합니다. 개인정보 파기절차 및 방법은 다음 각 호와 같습니다.</p>
                <ol className="list-decimal ml-[22.5px]">
                  <li className="mb-0">파기절차 : 고객이 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다. 이 때, DB로 옮겨진 개인정보는 법률에 의한 경우가 아니고서는 다른 목적으로 이용되지 않습니다.</li>
                  <li className="mb-0">파기방법
                    <ul className="list-disc ml-[22.5px] mt-[4px]">
                      <li className="mb-0">1) 전자적 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                      <li>2) 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                    </ul>
                  </li>
                  <li>파기기한 : 고객의 개인정보는 개인정보의 보유기간이 경과된 경우에는 보유기간의 유예기간 종료일로부터 5일 이내에, 개인정보의 처리 목적 달성, 해당 서비스의 폐지, 사업의 종료 등 그 개인정보가 불필요하게 되었을 때에는 개인정보의 처리가 불필요한 것으로 인정되는 날로부터 5일 이내에 그 개인정보를 파기합니다.</li>
                </ol>
              </div>
            </motion.div>

            {/* 제7조 (정보주체와 법정대리인의 권리와 의무 및 행사방법) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제7조 (정보주체와 법정대리인의 권리와 의무 및 행사방법)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">① 객(이하 "정보주체"라 함)은 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.</p>
                <p className="mb-[8px]">② 개인정보 열람 및 정정 요구는 사이트 내에 있는 '마이페이지' 메뉴에서 하거나, 회사 인터넷 사이트 문의하기 페이지를 통해 요청할 수 있습니다.</p>
                <p className="mb-[8px]">③ 제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 할 수도 있습니다. 이 경우 개인정보보호법시행규칙 별지 제11호 서식에 따른 위임장을 서면, 전자우편, 팩스 등을 통하여 제출하셔야 합니다.</p>
                <p className="mb-[8px]">④ 회사는 정보주체 권리에 따른 열람의 요구, 정정·삭제의 요구, 처리정지의 요구 시 열람 등 요구를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.</p>
                <p className="mb-[8px]">⑤ 개인정보 열람 및 처리정지 요구는 개인정보보호법 제35조 제4항, 제37조 제2항에 의하여 정보주체의 권리가 제한 될 수 있습니다.</p>
                <p className="mb-[8px]">⑥ 개인정보의 정정 및 삭제 요구는 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.</p>
                <p className="mb-[8px]">⑦ 회사는 정보주체의 개인정보 열람 요구가 있을 경우 10일 이내에 열람할 수 있도록 조치합니다. 만약 해당 기간 내에 열람할 수 없는 정당한 사유가 있을 때에는 정보주체에게 그 사유를 알리고 열람을 연기할 수 있으며, 그 사유가 소멸하면 지체 없이 열람하게 합니다.</p>
                <p>⑧ 회사는 정보주체의 개인정보 정정·삭제·처리정지 요구가 있을 경우 법령에 다른 규정이 있는 경우를 제외하고는 지체 없이 필요한 조치를 취합니다.</p>
              </div>
            </motion.div>

            {/* 제8조 (개인정보 자동수집 장치의 설치/운영 및 거부에 관한 사항) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제8조 (개인정보 자동수집 장치의 설치/운영 및 거부에 관한 사항)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 고객에 대한 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</p>
                <p className="mb-[8px]">② 쿠키는 웹사이트가 고객의 컴퓨터 브라우저(크롬, 인터넷 익스플로러 등)로 전송하는 소량의 정보입니다. 고객이 웹사이트에 접속을 하면 웹사이트를 운영하는데 이용되는 서버가 고객의 브라우저에 있는 쿠키의 내용을 읽고, 고객의 추가정보를 고객의 컴퓨터에서 찾아 접속에 따른 성명 등의 추가 입력 없이 서비스를 제공할 수 있습니다.</p>
                <p className="mb-[8px]">③ 쿠키에 의해 수집되는 정보 및 ���용 목적은 다음 각 호와 같습니다.</p>
                <ol className="list-decimal ml-[22.5px] mb-[8px]">
                  <li className="mb-0">수집 정보 : 접속IP, 브라우저 정보, 접속로그, 이용 콘텐츠 등 서비스 이용정보</li>
                  <li>이용 목적 : 고객의 접속 편의성 제공, 서비스 이용 형태 분석 및 통계 파악 등</li>
                </ol>
                <p className="mb-[8px]">④ 고객은 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹브라우저에서 옵션을 설정함으로써 쿠키에 의한 정보 수집 수준의 선택을 조정할 수 있습니다.</p>
                <ol className="list-decimal ml-[22.5px] mb-[8px]">
                  <li className="mb-0">쿠키의 설치·운영 및 거부 : 웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부 할 수 있습니다.</li>
                  <li>고객은 쿠키가 저장될 때마다 확인을 하거나, 모든 쿠키의 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
                </ol>
                <p className="mb-[8px]">⑤ 세션은 쇼핑몰을 운영하는데 이용되는 서버가 이용자의 로그인 시간 동안에 이용자의 정보를 서버에 저장합니다. 세션정보는 이용자가 로그아웃 시 자동으로 삭제됩니다.</p>
                <p>⑥ 세션의 설치/운영 및 거부 : 이용자는 세션 설치에 대한 선택권을 가지고 있지 않습니다. 로그인이 필요한 서비스의 경우 쇼핑몰 운영 서버에서 자동으로 세션이 생성됩니다. 또한 장바구니 처리 및 최근 본 상품 처리 시 브라우저 쿠키를 이용합니다.</p>
              </div>
            </motion.div>

            {/* 제9조 (개인정보의 안전성 확보 조치) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제9조 (개인정보의 안전성 확보 조치)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">회사는 고객의 개인정보를 처리함에 있어 개인정보가 분실, 도난, 누출, 변조, 훼손되지 않도록 안전성 확보를 위하여 다음과 같은 기술적, 관리적, 물리적 조치를 취하고 있습니다.</p>
                <p className="mb-[8px]">① 기술적 대책</p>
                <ol className="list-decimal ml-[22.5px] mb-[8px]">
                  <li className="mb-0">해킹 등에 대비한 기술적 대책 : 해킹, 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치·갱신·점검하고, 시스템을 기술적/물리적으로 감시·차단하고 있습니다.</li>
                  <li className="mb-0">개인정보의 암호화 : 고객의 비밀번호 등은 복호화 되지 않는 방식으로 암호화되어 저장·관리되고 있습니다.</li>
                  <li className="mb-0">접속기록의 보관 및 위변조 방지 : 개인정보 처리 시스템에 접속한 기록을 보관, 관리하고 있으며, 접속 기록이 위변조 및 도난, 분실되지 않도록 보안기능을 사용하고 있습니다.</li>
                  <li>개인정보에 대한 접근 제한 : 개인정보 처리 데이터베이스 시스템에 대한 접근 권한을 부여·변경·말소하여 개인정보에 대한 접근을 통제하고 있으며 외부로부터의 무단 접근을 통제하고 있습니다.</li>
                </ol>
                <p className="mb-[8px]">② 관리적 대책</p>
                <ol className="list-decimal ml-[22.5px] mb-[8px]">
                  <li className="mb-0">정기적인 자체 감사 실시 : 개인정보 취급 관련 안전성 확보를 위해 정기적으로 자체 감사를 실시하고 있습니다.</li>
                  <li className="mb-0">개인정보 취급 직원의 최소화 및 교육 : 개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</li>
                  <li>내부관리계획의 수립 및 시행 : 개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.</li>
                </ol>
                <p className="mb-[8px]">③ 물리적 대책</p>
                <ol className="list-decimal ml-[22.5px]">
                  <li className="mb-0">문서보안을 위한 잠금장치 사용 : 개인정보가 포함된 서류, 보조 저장 매체 등을 잠금 장치가 있는 안전한 장소에 보관하고 있습니다.</li>
                  <li>비인가자에 대한 출입 통제 : 개인정보를 보관하고 있는 물리적 보관 장소를 별도로 두고 이에 대해 출입 통제 절차를 수립, 운영하고 있습니다.</li>
                </ol>
              </div>
            </motion.div>

            {/* 제10조 (개인정보보호에 관한 민원서비스) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제10조 (개인정보보호에 관한 민원서비스)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">회사는 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제, 개인정보 열람, 청구 접수 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다.</p>
                <div className="bg-[#f9f9f9] p-[16px] rounded-[8px]">
                  <p className="mb-[4px]">개인정보보호책임자</p>
                  <p className="mb-[4px]">성명: 김호동</p>
                  <p className="mb-[4px]">소속 부서: 개발</p>
                  <p className="mb-[4px]">직위: 팀장</p>
                  <p className="mb-[4px]">연락처: 010-3702-0428</p>
                  <p>이메일: fship1124@stargio.co.kr</p>
                </div>
              </div>
            </motion.div>

            {/* 제11조 (권익침해에 대한 구제방법) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제11조 (권익침해에 대한 구제방법)
              </p>
              <div className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                <p className="mb-[8px]">고객은 개인정보침해로 인한 구제를 받기 위하여 신고, 상담 등을 아래의 기관에 문의할 수 있습니다.</p>
                <ol className="list-decimal ml-[22.5px]">
                  <li className="mb-0">개인정보 분쟁조정위원회 : (국번 없이) 1833-6972 (www.kopico.go.kr)</li>
                  <li className="mb-0">개인정보침해신고센터 (한국인터넷진흥원 운영) : (국번 없이) 118 (privacy.kisa.or.kr)</li>
                  <li className="mb-0">대검찰청 사이버수사과 : (국번 없이) 1301 (www.spo.go.kr)</li>
                  <li>경찰청 사이버안전국 : (국번 없이) 182 (www.cyber.go.kr)</li>
                </ol>
              </div>
            </motion.div>

            {/* 제12조 (개인정보처리방침의 변경 및 고지) */}
            <motion.div 
              className="flex flex-col gap-[8px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
            >
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold leading-[24px] text-[#151515] text-[17px] tracking-[-0.34px]">
                제12조 (개인정보처리방침의 변경 및 고지)
              </p>
              <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] text-[#5f5f5f] text-[15px] tracking-[-0.3px]">
                현 개인정보처리방침 내용 추가, 삭제 및 수정이 있을 시에는 시행일 7일 전부터 홈페이지 공지사항 또는 팝업 등을 통해 이용자에게 고지할 것입니다. 또한, 이용자 권리의 중요한 변경이 있을 경우에는 시행일 30일 전에 고지합니다.
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