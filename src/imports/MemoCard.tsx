import svgPaths from "./svg-4xnmni03a0";

function Frame() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start leading-[20px] min-h-px min-w-px relative text-[#151515] text-[14px] tracking-[-0.42px]">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium relative shrink-0">이번 주 나에게 :</p>
      <div className="font-['Pretendard_Variable:Regular',sans-serif] font-normal min-w-full relative shrink-0 w-[min-content]">
        <p className="css-4hzbpn mb-0">이번 주도 고생했어. 혼자 애쓴 부분들, 내가 다 알고 있어</p>
        <p className="css-4hzbpn">괜찮다고 더 버텨보자고 애썼다고 칭찬해주고 싶어</p>
      </div>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icons">
          <g id="Vector">
            <mask fill="white" id="path-1-inside-1_27_3508">
              <path clipRule="evenodd" d={svgPaths.p1c4f0780} fillRule="evenodd" />
            </mask>
            <path clipRule="evenodd" d={svgPaths.p1c4f0780} fill="var(--fill-0, #B7B7B7)" fillRule="evenodd" />
            <path d={svgPaths.p289ae600} fill="var(--stroke-0, #B7B7B7)" mask="url(#path-1-inside-1_27_3508)" />
          </g>
          <g id="Vector_2">
            <mask fill="white" id="path-3-inside-2_27_3508">
              <path d={svgPaths.p677f400} />
            </mask>
            <path d={svgPaths.p677f400} fill="var(--fill-0, #B7B7B7)" />
            <path d={svgPaths.p367c240} fill="var(--stroke-0, #B7B7B7)" mask="url(#path-3-inside-2_27_3508)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-[8px] relative rounded-[8px] shrink-0 w-[36px]" data-name="Left Action">
      <Icons />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[4px] items-start justify-end relative shrink-0 w-full">
      <Frame />
      <LeftAction />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Frame1 />
    </div>
  );
}

export default function MemoCard() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex flex-col items-start px-[16px] py-[18px] relative rounded-[12px] size-full" data-name="MemoCard">
      <Container />
    </div>
  );
}