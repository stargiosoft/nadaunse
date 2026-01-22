import svgPaths from "./svg-cdj7f26pgh";
import { motion } from "motion/react";

function IconsDesingFlowerFlat() {
  return (
    <div className="relative shrink-0" style={{ width: '48px', height: '48px' }}>
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" viewBox="0 0 48.0038 46.4307">
        <path clipRule="evenodd" d={svgPaths.p8ff0d80} fill="#F3F3F3" fillRule="evenodd" />
        <path d={svgPaths.p3195a000} fill="#D4D4D4" />
      </svg>
    </div>
  );
}

function Container() {
  return (
    <div className="flex flex-col items-center shrink-0 w-full" style={{ gap: '2px' }}>
      <p className="w-full text-center" style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#b7b7b7' }}>
        이번 주 저장한 태그가 없어요
      </p>
      <p className="w-full text-center" style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7' }}>
        운세를 볼수록 태그가 쌓여요
      </p>
    </div>
  );
}

function Container1() {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 w-full" style={{ gap: '20px' }}>
      <IconsDesingFlowerFlat />
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="flex items-center shrink-0" style={{ gap: '4px' }}>
      <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff' }}>
        태그 쌓으러 가기
      </p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <motion.button
      className="shrink-0 w-full cursor-pointer transition-colors block active:bg-[#41A09E]"
      style={{ backgroundColor: '#48b2af', height: '48px', borderRadius: '12px' }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="flex flex-row items-center justify-center size-full">
        <div className="flex items-center justify-center relative size-full" style={{ padding: '0 12px' }}>
          <Container2 />
        </div>
      </div>
    </motion.button>
  );
}

function Frame() {
  return (
    <div className="flex flex-col items-start shrink-0 w-full" style={{ gap: '36px' }}>
      <Container1 />
      <ButtonSquareButton />
    </div>
  );
}

export default function EmptyContent() {
  return (
    <div className="flex flex-col items-start relative w-full" style={{ padding: '48px 20px 0 20px' }}>
      <Frame />
    </div>
  );
}
