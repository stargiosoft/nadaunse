import svgPaths from "./svg-x1fbsrt88x";

function TwemojiWrappedGift() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="twemoji:wrapped-gift">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g id="twemoji:wrapped-gift" opacity="0.8">
          <path d={svgPaths.p3c46be00} fill="var(--fill-0, #FFD16F)" id="Vector" />
          <path d={svgPaths.p35ee7080} fill="var(--fill-0, #FFD16F)" id="Vector_2" />
          <path d={svgPaths.p3323b300} fill="var(--fill-0, #FCAB40)" id="Vector_3" />
          <path d={svgPaths.p21bad880} fill="var(--fill-0, #FF5569)" id="Vector_4" />
          <path d={svgPaths.p3856f080} fill="var(--fill-0, #FF5569)" id="Vector_5" />
        </g>
      </svg>
    </div>
  );
}

function TextContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start justify-center relative shrink-0 text-[#848484]" data-name="Text Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[19px] relative shrink-0 text-[13px] tracking-[-0.26px]">운세 구매 고객 전용 쿠폰</p>
      <p className="css-ew64yg font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[18px] tracking-[-0.36px]">3,000원</p>
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="content-stretch flex gap-[20px] items-center relative shrink-0" data-name="Content Container">
      <TwemojiWrappedGift />
      <TextContainer />
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#f9f9f9] flex-[1_0_0] min-h-px min-w-px relative" data-name="Container">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[24px] py-[20px] relative w-full">
          <ContentContainer />
        </div>
      </div>
    </div>
  );
}

function StatusContainer() {
  return (
    <div className="bg-[#f3f3f3] content-stretch flex flex-col items-center justify-center px-[12px] py-[16px] relative self-stretch shrink-0 w-[88px]" data-name="Status Container">
      <div aria-hidden="true" className="absolute border-[#e7e7e7] border-dashed border-l inset-0 pointer-events-none" />
      <p className="css-4hzbpn font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#999] text-[13px] text-center w-full">발급 완료</p>
    </div>
  );
}

export default function ButtonCouponCardButton() {
  return (
    <div className="content-stretch flex items-start overflow-clip relative rounded-[16px] size-full" data-name="Button / Coupon Card Button">
      <Container />
      <StatusContainer />
    </div>
  );
}