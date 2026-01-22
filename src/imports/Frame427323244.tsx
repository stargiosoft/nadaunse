import svgPaths from "./svg-iej5a37obu";

function LinearClose() {
  return (
    <div className="absolute contents inset-0" data-name="linear/close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="Box">
          <path d={svgPaths.p1ce9ba00} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d={svgPaths.pd0fdc80} id="Vector_2" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icons">
      <LinearClose />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">결단력이 있는</p>
      </div>
      <Icons />
    </div>
  );
}

function Tag() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">결단력이 있는</p>
      </div>
    </div>
  );
}

function Tag1() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container1 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex gap-[8px] items-center left-[33px] top-[49px]">
      <Tag />
      <Tag1 />
    </div>
  );
}

export default function Frame1() {
  return (
    <div className="bg-white relative size-full">
      <Frame />
    </div>
  );
}