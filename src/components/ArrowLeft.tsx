import React from 'react';
import svgPaths from "../imports/svg-aca2xgmp7i";

interface ArrowLeftProps {
  onClick: () => void;
}

export default function ArrowLeft({ onClick }: ArrowLeftProps) {
  return (
    <div 
      onClick={onClick} 
      className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer bg-transparent transition-colors active:bg-[#f3f4f6] group"
    >
      <div className="relative shrink-0 size-[24px] transition-transform duration-200 group-active:scale-90">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="arrow-left">
            <path d={svgPaths.p2a5cd480} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
            <path d={svgPaths.p1a4bb100} id="Vector_2" opacity="0" stroke="var(--stroke-0, #848484)" />
          </g>
        </svg>
      </div>
    </div>
  );
}
