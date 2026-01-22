import svgPaths from "./svg-yw2inj78b4";
import imgBackgroundImage from "figma:asset/73269bb5e33c2575ba38c6ad1a68d2a7002b031b.png";

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="arrow-left">
          <path d={svgPaths.p2a5cd480} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <path d={svgPaths.p1a4bb100} id="Vector_2" opacity="0" stroke="var(--stroke-0, #848484)" />
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box />
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Left Action">
      <Icons />
    </div>
  );
}

function LinearClose() {
  return (
    <div className="absolute contents inset-0" data-name="linear/close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Box">
          <path d="M5 19L19 5" id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M19 19L5 5" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <LinearClose />
    </div>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <Icons1 />
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction />
      <p className="css-g0mm18 flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] min-h-px min-w-px overflow-hidden relative text-[18px] text-black text-center text-ellipsis tracking-[-0.36px]">이번 주 보고서</p>
      <RightAction />
    </div>
  );
}

function NavigationTopBar() {
  return (
    <div className="bg-white h-[52px] relative shrink-0 w-full" data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
          <Icon />
        </div>
      </div>
    </div>
  );
}

function NavigationTopNavigationWidget() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-0 w-[390px]" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 text-center w-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[28px] relative shrink-0 text-[20px] text-white tracking-[-0.2px] w-full">다음주, 내 마음 날씨는 어떨까요?</p>
      <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#f3f3f3] text-[14px] tracking-[-0.42px] w-full">복잡한 생각은 잠시 내려두고, 편하게 뽑아보세요.</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start px-[20px] py-[10px] relative w-full">
        <Container />
      </div>
    </div>
  );
}

function CardSlots() {
  return (
    <div className="content-stretch flex gap-[20px] items-center relative shrink-0" data-name="Card Slots">
      <div className="bg-[#41a09e] h-[114px] relative rounded-[12px] shrink-0 w-[68px]" data-name="Card Slot">
        <div aria-hidden="true" className="absolute border border-[#6ac9c6] border-dashed inset-0 pointer-events-none rounded-[12px]" />
      </div>
      <div className="bg-[#41a09e] h-[114px] relative rounded-[12px] shrink-0 w-[68px]" data-name="Card Slot">
        <div aria-hidden="true" className="absolute border border-[#6ac9c6] border-dashed inset-0 pointer-events-none rounded-[12px]" />
      </div>
      <div className="bg-[#41a09e] h-[114px] relative rounded-[12px] shrink-0 w-[68px]" data-name="Card Slot">
        <div aria-hidden="true" className="absolute border border-[#6ac9c6] border-dashed inset-0 pointer-events-none rounded-[12px]" />
      </div>
    </div>
  );
}

function HeaderContainer() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[28px] items-center left-0 top-[36px] w-[390px]" data-name="Header Container">
      <Container1 />
      <CardSlots />
    </div>
  );
}

function BackgroundImage() {
  return (
    <div className="absolute h-[792px] left-0 overflow-clip top-[52px] w-[390px]" data-name="Background Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBackgroundImage} />
      <HeaderContainer />
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="나의 보고서 (타로 뽑기)">
      <BackgroundImage />
      <NavigationTopNavigationWidget />
    </div>
  );
}