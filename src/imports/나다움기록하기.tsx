import svgPaths from "./svg-rr05b2c3l6";

function Frame4() {
  return (
    <div className="content-stretch flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold gap-[6px] items-start leading-[28px] relative shrink-0 text-[20px] text-black tracking-[-0.2px] w-full">
      <p className="css-4hzbpn relative shrink-0 w-full">현재의</p>
      <p className="css-4hzbpn relative shrink-0 w-full">내 모습과 가장 가까운 태그는?</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[8px] items-start px-[4px] py-0 relative w-full">
        <Frame4 />
        <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px] w-full">태그가 모일수록 나에 대한 분석이 더 정확해요!</p>
      </div>
    </div>
  );
}

function Img() {
  return (
    <div className="absolute bottom-[-72.02%] left-[9px] top-[3.13%] w-[123.404px]" data-name="img">
      <div className="absolute inset-[-0.71%_0_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 123.404 163.295">
          <g id="img">
            <path d={svgPaths.p312a8200} fill="var(--fill-0, #BCD961)" id="Vector" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d={svgPaths.p1a854e00} fill="var(--fill-0, #BCD961)" id="Vector_2" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d="M61.4258 31.8692V18.9812" id="Vector_3" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <path d={svgPaths.p35ec8780} fill="var(--fill-0, #F4F4F4)" id="Vector_4" />
            <g id="Group">
              <path d={svgPaths.p20dcdf00} fill="var(--fill-0, #FDD751)" id="Vector_5" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
              <path d={svgPaths.p15a42000} fill="var(--fill-0, #EFC748)" id="Vector_6" />
              <path d={svgPaths.p25a47100} fill="var(--fill-0, #FDD751)" id="Vector_7" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
              <path d={svgPaths.pf988d00} fill="var(--fill-0, #EFC748)" id="Vector_8" />
            </g>
            <path d={svgPaths.p237d1300} fill="var(--fill-0, white)" id="Vector_9" stroke="var(--stroke-0, black)" strokeMiterlimit="10" strokeWidth="2.31383" />
            <g id="Group_2">
              <path d={svgPaths.p10808800} fill="var(--fill-0, black)" id="Vector_10" />
              <path d={svgPaths.p239f3100} fill="var(--fill-0, black)" id="Vector_11" />
            </g>
            <path d={svgPaths.p27c57300} fill="var(--fill-0, #FDD751)" id="Vector_12" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2.31383" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function TickCircle() {
  return (
    <div className="relative size-full" data-name="tick-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.2209 27.2209">
        <g id="tick-circle">
          <path d={svgPaths.pd0e5d00} id="Vector" stroke="var(--stroke-0, #0C0C0C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.40261" />
          <path d={svgPaths.p93f5880} id="Vector_2" opacity="0" stroke="var(--stroke-0, #0C0C0C)" strokeWidth="1.1342" />
        </g>
      </svg>
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-[55%_5.7%_10.98%_72.53%]" data-name="Box">
      <div className="absolute flex inset-[55%_5.7%_10.98%_72.53%] items-center justify-center">
        <div className="flex-none rotate-[13.017deg] size-[27.221px]">
          <TickCircle />
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-[101.99px] size-[46.258px] top-[46px]">
      <Box />
      <div className="absolute flex items-center justify-center left-[101.99px] size-[46.258px] top-[46px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[13.017deg]">
          <div className="bg-[#f6d05d] border-[#0c0c0c] border-[2.268px] border-solid rounded-[9.074px] size-[38.563px]" />
        </div>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents h-[63.508px] left-[98px] top-[46px] w-[50.246px]">
      <div className="absolute flex h-[25.924px] items-center justify-center left-[112.37px] top-[80.26px] w-[14.361px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[13.017deg]">
          <div className="bg-[#f6d05d] border-[#0c0c0c] border-[2.268px] border-solid h-[24.51px] rounded-[9.074px] w-[9.074px]" />
        </div>
      </div>
      <Group />
    </div>
  );
}

function Frame8() {
  return (
    <div className="h-[96px] overflow-clip relative shrink-0 w-[150px]">
      <Img />
      <Group1 />
    </div>
  );
}

function TextContainer() {
  return (
    <div className="bg-[#f0f8f8] flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]" data-name="Text Container">
      <div aria-hidden="true" className="absolute border-[#48b2af] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[24px] py-[16px] relative w-full">
          <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#368683] text-[15px] tracking-[-0.3px]">
            <p className="css-ew64yg leading-[25.5px]">설득력 있는</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Box1() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="tick-circle">
          <path d={svgPaths.p2249c900} id="Vector" stroke="var(--stroke-0, #41A09E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="Icons">
      <Box1 />
    </div>
  );
}

function ChoiceOption() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-[350px]" data-name="ChoiceOption">
      <TextContainer />
      <Icons />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame8 />
      <ChoiceOption />
    </div>
  );
}

function TextContainer1() {
  return (
    <div className="bg-[#f0f8f8] flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]" data-name="Text Container">
      <div aria-hidden="true" className="absolute border-[#48b2af] border-[1.5px] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[24px] py-[16px] relative w-full">
          <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#368683] text-[15px] tracking-[-0.3px]">
            <p className="css-ew64yg leading-[25.5px]">리더십 있는</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Box2() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="tick-circle">
          <path d={svgPaths.p2249c900} id="Vector" stroke="var(--stroke-0, #41A09E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="Icons">
      <Box2 />
    </div>
  );
}

function ChoiceOption1() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-[350px]" data-name="ChoiceOption">
      <TextContainer1 />
      <Icons1 />
    </div>
  );
}

function TextContainer2() {
  return (
    <div className="bg-[#f8f8f8] flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]" data-name="Text Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[24px] py-[16px] relative w-full">
          <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px]">
            <p className="css-ew64yg leading-[25.5px]">경쟁심 있는</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Box3() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="tick-circle">
          <path d={svgPaths.p2249c900} id="Vector" stroke="var(--stroke-0, #E7E7E7)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons2() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="Icons">
      <Box3 />
    </div>
  );
}

function ChoiceOption2() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-[350px]" data-name="ChoiceOption">
      <TextContainer2 />
      <Icons2 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <Frame1 />
      <ChoiceOption1 />
      <ChoiceOption2 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[64px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame2 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] min-h-px min-w-px relative text-[#848484] text-[13px]">
            내 약함도, 내 강함도 모두 소중한 나예요.
            <br aria-hidden="true" />그 모습들이 모여 지금의 나를 만들어요.
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex gap-[12px] items-start justify-center relative shrink-0 w-full">
      <div className="relative self-stretch shrink-0 w-0">
        <div className="absolute inset-[-1.7%_-0.75px]" style={{ "--stroke-0": "rgba(231, 231, 231, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.5 45.5">
            <path d="M0.75 0.75V44.75" id="Vector 67" stroke="var(--stroke-0, #E7E7E7)" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      <Frame6 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[32px] items-center relative shrink-0 w-[350px]">
      <Frame3 />
      <Frame7 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="absolute content-stretch flex items-center left-1/2 p-[20px] top-[48px] translate-x-[-50%]">
      <Frame5 />
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-white tracking-[-0.32px]">태그 저장하고 리포트 받기</p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <div className="bg-[#48b2af] h-[56px] relative rounded-[16px] shrink-0 w-full" data-name="Button / Square Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
          <ButtonContainer />
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">다음에 할래요</p>
    </div>
  );
}

function ButtonTextButton() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container />
    </div>
  );
}

function ButtonContainer1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full" data-name="Button Container">
      <ButtonSquareButton />
      <ButtonTextButton />
    </div>
  );
}

function ButtonContainer2() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
          <ButtonContainer1 />
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <ButtonContainer2 />
    </div>
  );
}

function CommonBottomButton() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col items-start left-1/2 shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] translate-x-[-50%] w-[390px]" data-name="Common / Bottom Button">
      <Container1 />
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

function Box4() {
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

function Icons3() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box4 />
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Left Action">
      <Icons3 />
    </div>
  );
}

function Box5() {
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

function Icons4() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box5 />
    </div>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <Icons4 />
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction />
      <p className="css-g0mm18 flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] min-h-px min-w-px overflow-hidden relative text-[18px] text-black text-center text-ellipsis tracking-[-0.36px]">나다움 기록하기</p>
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
    <div className="bg-white relative size-full" data-name="나다움 기록하기">
      <HomeIndicatorContainer />
      <NavigationTopNavigationWidget />
      <Frame9 />
      <CommonBottomButton />
    </div>
  );
}