/**
 * 가입 축하 쿠폰 안내 페이지
 * 
 * @description
 * - 회원가입 완료 후 자동으로 표시되는 쿠폰 안내 화면
 * - 5,000원 가입 축하 쿠폰이 발급되었음을 알림
 * 
 * @props
 * - onClose: () => void - "운세 보러 가기" 버튼 클릭 시 호출
 */

import svgPaths from "../imports/svg-1h6s4tucob";
import { motion } from 'motion/react';

interface WelcomeCouponPageProps {
  onClose: () => void;
}

// ==================== SVG Components ====================

function Refresh() {
  return (
    <div className="absolute inset-[0_-100%_-100%_0]" data-name="refresh-2">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="refresh-2">
          <path d={svgPaths.p26d97b00} id="Vector" stroke="var(--stroke-0, #525252)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-[0_-100%_-100%_0]" data-name="Box">
      <Refresh />
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icons">
      <Box />
    </div>
  );
}

function Group() {
  return (
    <div className="h-[220px] relative shrink-0 w-[247px]">
      <div className="absolute inset-[-0.68%_-0.48%_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 249 222">
          <g id="Group 427318531">
            <path d={svgPaths.p837d700} fill="var(--fill-0, #EFEFEF)" id="Vector" />
            <g id="Group">
              <path d={svgPaths.p2faf74f0} fill="var(--fill-0, #FDD751)" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
              <path d={svgPaths.p1e9b8e80} fill="var(--fill-0, #EFC748)" id="Vector_3" />
              <path d={svgPaths.p550c800} fill="var(--fill-0, #FDD751)" id="Vector_4" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
              <path d={svgPaths.p25c10200} fill="var(--fill-0, #EFC748)" id="Vector_5" />
            </g>
            <path d={svgPaths.p35eb68a0} fill="var(--fill-0, white)" id="Vector_6" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
            <g id="Group_2">
              <path d={svgPaths.p2f679180} fill="var(--fill-0, black)" id="Vector_7" />
              <path d={svgPaths.p4306f40} fill="var(--fill-0, black)" id="Vector_8" />
            </g>
            <path d={svgPaths.pff51c00} fill="var(--fill-0, #FDD751)" id="Vector_9" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
            <g id="Group 427318532">
              <g id="Vector_10">
                <path d={svgPaths.p9afbc00} fill="var(--fill-0, white)" />
                <path d={svgPaths.p9afbc00} stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              </g>
              <path d={svgPaths.p3c7a3470} fill="var(--fill-0, #5778C2)" id="Vector_11" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p7c0f600} fill="var(--fill-0, #FDD751)" id="Vector_12" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
              <path d={svgPaths.p14ba9f00} fill="var(--fill-0, #89AAF4)" id="Vector_13" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p25b37180} fill="var(--fill-0, #89AAF4)" id="Vector_14" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p38d39380} fill="var(--fill-0, #FDD751)" id="Vector_15" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p15f68100} fill="var(--fill-0, #FF7E8D)" id="Vector_16" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p4184770} fill="var(--fill-0, #89AAF4)" id="Vector_17" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p1d83d300} fill="var(--fill-0, #FDD751)" id="Vector_18" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p1f1e4f00} fill="var(--fill-0, #B4CF5E)" id="Vector_19" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
              <path d={svgPaths.p8878340} fill="var(--fill-0, #FF7E8D)" id="Vector_20" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="3" />
              <path d={svgPaths.p10562100} fill="var(--fill-0, #B4CF5E)" id="Vector_21" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
              <g id="Vector_22">
                <path d={svgPaths.pc8499e0} fill="var(--fill-0, white)" />
                <path d={svgPaths.pc8499e0} stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              </g>
              <path d={svgPaths.p7c33100} fill="var(--fill-0, white)" id="Vector_23" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p22cff800} fill="var(--fill-0, white)" id="Vector_24" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <path d={svgPaths.p2df15e00} fill="var(--fill-0, white)" id="Vector_25" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            </g>
            <path d={svgPaths.p1e837d00} fill="var(--fill-0, #89AAF4)" id="Vector_26" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            <path d={svgPaths.p10bcd000} fill="var(--fill-0, #B4CF5E)" id="Vector_27" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
            <path d={svgPaths.p25b85800} fill="var(--fill-0, #B4CF5E)" id="Vector_28" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="3" />
            <path d={svgPaths.pc23e990} fill="var(--fill-0, white)" id="Vector_29" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            <path d={svgPaths.p3c5f4380} fill="var(--fill-0, white)" id="Vector_30" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[62px] pr-0 py-0 relative shrink-0">
      <Group />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-name="Container">
      <div className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[28.5px] relative shrink-0 text-[#6d6d6d] text-[16px] text-center text-nowrap tracking-[-0.32px]">
        <p className="mb-0">첫 결제 시 쿠폰이 자동 적용돼요.</p>
        <p>지금부터 당신만의 운세 풀이를 만나보세요!</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[24px] text-black text-center tracking-[-0.48px] w-full">
        <p className="leading-[35.5px]">가입 축하 쿠폰이 도착했어요!</p>
      </div>
      <Container2 />
    </div>
  );
}

function TextComponent() {
  return (
    <div className="content-stretch flex flex-col gap-[28px] items-center justify-center relative shrink-0 w-full" data-name="Text Component 3">
      <Container3 />
    </div>
  );
}

function ImageContainer() {
  return (
    <div className="flex-1 flex flex-col gap-[46px] items-center justify-center w-full px-[20px] pb-[160px]" data-name="Image Container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0 }}
      >
        <Frame />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <TextComponent />
      </motion.div>
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Container">
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">운세 보러 가기</p>
    </div>
  );
}

function ButtonSquareButton1({ onClick }: { onClick: () => void }) {
  return (
    <motion.div 
      onClick={onClick}
      className="bg-[#48b2af] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer overflow-hidden" 
      data-name="Button / Square Button"
      whileTap={{ scale: 0.96, backgroundColor: "#36908f" }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
          <ButtonContainer />
        </div>
      </div>
    </motion.div>
  );
}

function ButtonContainer1({ onClick }: { onClick: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
          <ButtonSquareButton1 onClick={onClick} />
        </div>
      </div>
    </div>
  );
}

function Container1({ onClick }: { onClick: () => void }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <ButtonContainer1 onClick={onClick} />
    </div>
  );
}

function CommonBottomButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="fixed bottom-[env(safe-area-inset-bottom)] z-50 left-0 right-0 mx-auto content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[440px]" data-name="Common / Bottom Button">
      <Container1 onClick={onClick} />
    </div>
  );
}

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
            <path d={svgPaths.p2d05aa80} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, black)" />
            <path d={svgPaths.p1fcfdd80} fill="var(--fill-0, black)" id="Combined Shape" opacity="0.4" />
            <path d={svgPaths.p12636800} fill="var(--fill-0, black)" id="Rectangle_2" />
          </g>
          <path d={svgPaths.p10be8f00} fill="var(--fill-0, black)" id="Wifi" />
          <path d={svgPaths.p3cc2d900} fill="var(--fill-0, black)" id="Mobile Signal" />
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

function IndependentIPhoneStatusBar() {
  return (
    <div className="absolute bg-white h-[47px] left-0 overflow-clip top-0 w-[390px]" data-name="Independent / iPhone Status Bar">
      <Notch />
      <RightSide />
      <LeftSide />
    </div>
  );
}

// ==================== Main Component ====================

export default function WelcomeCouponPage({ onClose }: WelcomeCouponPageProps) {
  return (
    <div className="bg-white relative w-full h-[100dvh] flex justify-center overflow-hidden" data-name="약관 동의 완료 _ 390">
      <div className="relative w-full max-w-[440px] h-full bg-white flex flex-col">
        {/* 메인 콘텐츠 영역 (중앙 정렬) */}
        <ImageContainer />
        
        {/* 하단 CTA 영역 (Fixed로 화면 하단 고정, 레이아웃 공간 차지하지 않음) */}
        <CommonBottomButton onClick={onClose} />
      </div>
    </div>
  );
}