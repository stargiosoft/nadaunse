import React from 'react';
import { motion } from "motion/react";

interface ButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  isActive?: boolean;
}

export function ButtonSquareButton({ onClick, label, disabled, isActive }: ButtonProps) {
  const baseClasses = "relative rounded-[16px] size-full transition-all duration-300";
  
  let stateClasses = "";
  if (disabled) {
    // 섞는 중 (비활성): 흐리게 처리
    stateClasses = "opacity-50 cursor-not-allowed bg-[rgba(255,255,255,0.2)]";
  } else if (isActive) {
    // 선택 완료 (활성): 청록색 그라데이션 + 그림자
    stateClasses = "cursor-pointer active:scale-95 bg-gradient-to-r from-[#48b2af] to-[#2ac1bc] shadow-[0_4px_12px_rgba(72,178,175,0.3)]";
  } else {
    // 기본 상태: 반투명 흰색
    stateClasses = "cursor-pointer active:scale-95 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)]";
  }

  const borderClass = isActive ? 'border-[#ffffff] border-opacity-20' : 'border-white';

  return (
    // 1. Outer wrapper: viewport fixed, full-width (레이아웃/배경 역할)
    // pointer-events-none을 적용하여 버튼 외 영역 클릭 시 배경이 터치를 가로채지 않도록 함
    <div 
      className="fixed left-0 w-full z-50 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      data-name="Button Wrapper"
    >
      {/* 2. Inner container: max-width 440px, margin: 0 auto */}
      {/* 실제 컨텐츠가 들어가는 영역은 pointer-events-auto로 터치 가능하게 함 */}
      <div className="w-full max-w-[440px] mx-auto px-[20px] pointer-events-auto">
        
        {/* 3. Actual button: 클릭 영역 (기존 스타일 유지) */}
        <div 
          onClick={!disabled ? onClick : undefined}
          className={`${baseClasses} ${stateClasses} h-[56px]`} 
          data-name="Button / Square Button"
        >
          {/* 테두리 */}
          <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[16px] transition-colors duration-300 ${borderClass}`} />
          
          {/* 레이저 효과 (활성 상태일 때만) */}
          {isActive && !disabled && (
            <svg className="absolute inset-0 size-full pointer-events-none z-10 overflow-visible drop-shadow-[0_0_3px_#48b2af]">
               <motion.rect
                 x="1"
                 y="1"
                 width="calc(100% - 2px)"
                 height="calc(100% - 2px)"
                 rx="15"
                 fill="none"
                 stroke="#ffffff"
                 strokeWidth="1.2"
                 strokeLinecap="round"
                 pathLength="1"
                 strokeDasharray="0.15 0.85"
                 initial={{ strokeDashoffset: 0 }}
                 animate={{ strokeDashoffset: -1 }}
                 transition={{ duration: 1.4, ease: "linear", repeat: Infinity }}
               />
            </svg>
          )}

          {/* 텍스트 라벨 */}
          <div className="flex flex-row items-center justify-center size-full relative z-20">
            <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">
                {label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
