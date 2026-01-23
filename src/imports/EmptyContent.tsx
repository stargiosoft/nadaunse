import svgPaths from "./svg-pn85us30m9";
import { motion } from "motion/react";

function Group() {
  return (
    <div className="absolute inset-0" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 45.624 42.7581">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.pe134700} fill="var(--fill-0, #F3F3F3)" fillRule="evenodd" id="Vector" />
          <path d={svgPaths.p17b8ff00} fill="var(--fill-0, #D4D4D4)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: '48px', height: '48px' }} data-name="Icons">
      <Group />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 text-[#b7b7b7] text-center w-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] tracking-[-0.32px] w-full">저장한 태그가 없어요</p>
      <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[14px] tracking-[-0.42px] w-full">운세를 볼수록 태그가 쌓여요</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-center justify-center relative shrink-0 w-full" data-name="Container">
      <Icons />
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[15px] text-white tracking-[-0.45px]">태그 쌓으러 가기</p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <motion.button 
      className="bg-[#48b2af] h-[48px] relative rounded-[12px] shrink-0 w-full active:bg-[#41A09E] cursor-pointer transition-colors block" 
      data-name="Button / Square Button"
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        transformOrigin: 'center center',
        willChange: 'transform'
      }}
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
          <Container2 />
        </div>
      </div>
    </motion.button>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" style={{ gap: '36px', paddingTop: '48px' }}>
      <Container1 />
      <ButtonSquareButton />
    </div>
  );
}

export default function EmptyContent() {
  return (
    <div className="content-stretch flex flex-col items-start pb-0 pt-0 px-[20px] relative size-full" data-name="EmptyContent">
      <Frame />
    </div>
  );
}