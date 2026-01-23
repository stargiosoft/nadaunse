import svgPaths from "./svg-zehgb31ztc";

function Container() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">결단력 있는</p>
      </div>
    </div>
  );
}

function RemovableTag() {
  return (
    <div className="bg-[#f3f3f3] content-stretch flex items-center mr-[-12px] px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="RemovableTag">
      <Container />
    </div>
  );
}

function LinearClose() {
  return (
    <div className="absolute contents inset-0" data-name="linear/close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
        <g id="Box">
          <path d={svgPaths.p50e9c0} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d={svgPaths.p14a64400} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[8px]" data-name="Icons">
      <LinearClose />
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-[#ff6678] content-stretch flex items-center mr-[-12px] p-[6px] relative rounded-[999px] shrink-0">
      <Icons />
    </div>
  );
}

export default function RemovableTag1() {
  return (
    <div className="content-stretch flex items-center pl-0 pr-[12px] py-0 relative size-full" data-name="RemovableTag">
      <RemovableTag />
      <Frame />
    </div>
  );
}