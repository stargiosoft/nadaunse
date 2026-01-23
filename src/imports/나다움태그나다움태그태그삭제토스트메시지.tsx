import svgPaths from "./svg-dquh7nk1eg";
import imgImage from "figma:asset/13545c727434815b8ecda334fd9e453f4a0ea3ac.png";

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <p className="css-g0mm18 font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] overflow-hidden relative shrink-0 text-[#6d6d6d] text-[12px] text-ellipsis tracking-[-0.24px] w-full">오늘의 한 줄 위로</p>
      <p className="css-4hzbpn font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full">조금 늦어도 괜찮아, 결국 너 답게 피어날 거야</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-gradient-to-b from-[#f8fee9] from-[34.211%] relative rounded-[12px] shrink-0 to-[#eaf2d5] w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start px-[20px] py-[16px] relative w-full">
        <Container />
      </div>
    </div>
  );
}

function Image() {
  return (
    <div className="content-stretch flex flex-col h-[270px] items-start justify-end px-[20px] py-[16px] relative shrink-0 w-[390px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
      <Container1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center pb-[4px] pt-0 px-[20px] relative w-full">
          <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-black tracking-[-0.36px]">
            <p className="css-ew64yg leading-[24px]">나의 모습 태그</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0">
      <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[20px] relative shrink-0 text-[#48b2af] text-[15px] tracking-[-0.45px]">강한 모습</p>
    </div>
  );
}

function TextTabItem() {
  return (
    <div className="content-stretch flex items-center justify-center px-[16px] py-[12px] relative shrink-0" data-name="Text Tab Item">
      <div aria-hidden="true" className="absolute border-[#48b2af] border-b-[1.5px] border-solid inset-0 pointer-events-none" />
      <Frame1 />
    </div>
  );
}

function TextTabItem1() {
  return (
    <div className="content-stretch flex items-center justify-center px-[16px] py-[12px] relative shrink-0" data-name="Text Tab Item">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#999] text-[15px] tracking-[-0.45px]">섬세한 모습</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <TextTabItem />
      <TextTabItem1 />
    </div>
  );
}

function Tab() {
  return (
    <div className="relative shrink-0 w-full" data-name="Tab">
      <div aria-hidden="true" className="absolute border-[#f8f8f8] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col items-start px-[20px] py-0 relative w-full">
        <Frame />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[390px]" data-name="Container">
      <Container2 />
      <Tab />
    </div>
  );
}

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

function Container4() {
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
      <Container4 />
    </div>
  );
}

function LinearClose1() {
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

function Icons1() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icons">
      <LinearClose1 />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">쉽게 흔들리지 않는</p>
      </div>
      <Icons1 />
    </div>
  );
}

function Tag1() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container5 />
    </div>
  );
}

function LinearClose2() {
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

function Icons2() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icons">
      <LinearClose2 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">책임감이 강한</p>
      </div>
      <Icons2 />
    </div>
  );
}

function Tag2() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container6 />
    </div>
  );
}

function LinearClose3() {
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

function Icons3() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icons">
      <LinearClose3 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">버티는 힘이 있는</p>
      </div>
      <Icons3 />
    </div>
  );
}

function Tag3() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container7 />
    </div>
  );
}

function LinearClose4() {
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

function Icons4() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icons">
      <LinearClose4 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">스스로를 잘 지키는</p>
      </div>
      <Icons4 />
    </div>
  );
}

function Tag4() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container8 />
    </div>
  );
}

function LinearClose5() {
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

function Icons5() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icons">
      <LinearClose5 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">상황을 주도하는</p>
      </div>
      <Icons5 />
    </div>
  );
}

function Tag5() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container9 />
    </div>
  );
}

function LinearClose6() {
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

function Icons6() {
  return (
    <div className="relative shrink-0 size-[10px]" data-name="Icons">
      <LinearClose6 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">위기에도 침착한</p>
      </div>
      <Icons6 />
    </div>
  );
}

function Tag6() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container10 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">+5</p>
      </div>
    </div>
  );
}

function Tag7() {
  return (
    <div className="content-stretch flex items-center px-[4px] py-[12px] relative rounded-[99px] shrink-0" data-name="Tag">
      <Container11 />
    </div>
  );
}

function TagContainer() {
  return (
    <div className="content-start flex flex-wrap gap-[10px_8px] items-start relative shrink-0 w-[350px]" data-name="Tag Container">
      <Tag />
      <Tag1 />
      <Tag2 />
      <Tag3 />
      <Tag4 />
      <Tag5 />
      <Tag6 />
      <Tag7 />
    </div>
  );
}

function Container12() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start px-[20px] py-[14px] relative w-full">
        <TagContainer />
      </div>
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="arrow-down">
          <path d={svgPaths.p2fa24d00} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons7() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icons">
      <Box />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">더보기</p>
      <Icons7 />
    </div>
  );
}

function ButtonTextButton() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container13 />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <div className="h-0 relative shrink-0 w-full">
        <div className="absolute inset-[-0.5px_0]" style={{ "--stroke-0": "rgba(248, 248, 248, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 390 1">
            <path d="M0 0.5H390" id="Vector 120" stroke="var(--stroke-0, #F8F8F8)" />
          </svg>
        </div>
      </div>
      <ButtonTextButton />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Container12 />
      <Container14 />
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-name="Container">
      <Container15 />
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Container16 />
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start left-0 top-[52px] w-[390px]" data-name="Content Container">
      <Image />
      <Container17 />
    </div>
  );
}

function HomeIndicatorLight() {
  return (
    <div className="h-[28px] relative shrink-0 w-full" data-name="Home Indicator/Light">
      <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" data-name="Home Indicator" />
    </div>
  );
}

function HomeIndicatorContainer() {
  return (
    <div className="absolute bottom-[-576px] content-stretch flex flex-col items-start left-1/2 overflow-clip translate-x-[-50%] w-[390px]" data-name="Home Indicator Container">
      <HomeIndicatorLight />
    </div>
  );
}

function Box1() {
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

function Icons8() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box1 />
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Left Action">
      <Icons8 />
    </div>
  );
}

function Box2() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="home-2">
          <path d={svgPaths.p3d07f180} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M12 17.99V14.99" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons9() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box2 />
    </div>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <Icons9 />
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction />
      <p className="css-g0mm18 flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] min-h-px min-w-px overflow-hidden relative text-[18px] text-black text-center text-ellipsis tracking-[-0.36px]">나다움 태그</p>
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

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="나다움 태그 (나다움 태그,태그 삭제 토스트메시지)">
      <HomeIndicatorContainer />
      <NavigationTopNavigationWidget />
      <ContentContainer />
    </div>
  );
}