import svgPaths from "./svg-yzh80oj47m";

function Frame() {
  return (
    <div className="content-stretch flex h-full items-center justify-center mr-[-20px] p-[12px] relative rounded-[12px] shrink-0 w-[200px]">
      <div aria-hidden="true" className="absolute border border-[#d4d4d4] border-dashed inset-[-0.5px] pointer-events-none rounded-[12.5px]" />
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[#6d6d6d] text-[15px] text-nowrap tracking-[-0.3px]">더 볼래요!</p>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative size-[44px]" data-name="Icons">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
          <g id="Icons">
            <rect fill="white" height="44" width="44" />
            <path d={svgPaths.p3bb19300} fill="var(--fill-0, #D4D4D4)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function ButtonMoreViewButton() {
  return (
    <div className="content-stretch flex items-center pl-0 pr-[20px] py-0 relative size-full" data-name="Button / More view Button">
      <Frame />
      <div className="flex items-center justify-center mr-[-20px] relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <Icons />
        </div>
      </div>
    </div>
  );
}