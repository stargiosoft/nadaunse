import svgPaths from "./svg-z33txjknpb";

function Frame() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="content-stretch flex flex-col gap-[4px] items-start leading-[0] px-[4px] py-0 relative w-full">
        <div className="flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[18px] text-black tracking-[-0.36px] w-full">
          <p className="css-4hzbpn leading-[24px]">이번 주 나에게</p>
        </div>
        <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[#6d6d6d] text-[14px] tracking-[-0.42px] w-full">
          <p className="css-4hzbpn leading-[22px]">한 주 동안 애쓴 당신에게 칭찬 한마디 어때요?</p>
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full">
      <Frame />
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start px-[20px] py-[16px] relative w-full">
        <Frame2 />
      </div>
    </div>
  );
}

function PlaceholderText() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Placeholder Text">
      <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full">
        <p className="css-4hzbpn leading-[25.5px]">이번 한주도 고생했어. 힘든일도 많고 포기하고 싶을 때마다 괜찮다고 더 버텨보자고 애썼다고 칭찬해주고 싶어.</p>
      </div>
    </div>
  );
}

function TextRow() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text Row">
      <PlaceholderText />
    </div>
  );
}

function TextRow1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Text Row">
      <TextRow />
    </div>
  );
}

function TextContainer() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text Container">
      <div className="content-stretch flex flex-col items-start px-[4px] py-0 relative w-full">
        <TextRow1 />
      </div>
    </div>
  );
}

function CharacterCount() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative shrink-0" data-name="Character Count">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[0px] tracking-[-0.26px]">
        <p className="css-ew64yg text-[13px]">
          <span className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[19px] text-[#48b2af] tracking-[-0.26px]">60</span>
          <span className="leading-[19px]">/120자</span>
        </p>
      </div>
    </div>
  );
}

function TextContainer1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-full" data-name="Text Container">
      <TextContainer />
      <CharacterCount />
    </div>
  );
}

function TextContainer2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Text Container">
      <TextContainer1 />
    </div>
  );
}

function Content() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex flex-col items-start px-[16px] py-[20px] relative rounded-[20px] shrink-0 w-[350px]" data-name="Content">
      <TextContainer2 />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <Content />
    </div>
  );
}

function FormTextAreaInput() {
  return (
    <div className="content-stretch flex flex-col items-end relative shrink-0 w-full" data-name="Form / Text Area Input">
      <Container />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col items-start pb-0 pt-[4px] px-[20px] relative shrink-0 w-[390px]">
      <FormTextAreaInput />
    </div>
  );
}

function Frame3() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-0 top-[52px] w-[390px]">
      <Frame1 />
      <Frame4 />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[#b7b7b7] text-[16px] tracking-[-0.32px]">취소</p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <div className="bg-[#f8f8f8] flex-[1_0_0] h-[56px] min-h-px min-w-px relative rounded-[16px]" data-name="Button / Square Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-white tracking-[-0.32px]">저장</p>
    </div>
  );
}

function ButtonSquareButton1() {
  return (
    <div className="bg-[#48b2af] flex-[1_0_0] h-[56px] min-h-px min-w-px relative rounded-[16px]" data-name="Button / Square Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
          <ButtonContainer />
        </div>
      </div>
    </div>
  );
}

function ButtonGroup() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Button Group">
      <ButtonSquareButton />
      <ButtonSquareButton1 />
    </div>
  );
}

function ButtonContainer1() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
          <ButtonGroup />
        </div>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <ButtonContainer1 />
    </div>
  );
}

function CommonBottomButton() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col items-start left-1/2 shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] translate-x-[-50%] w-[390px]" data-name="Common / Bottom Button">
      <Container2 />
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
    <div className="absolute bottom-[-129px] content-stretch flex flex-col items-start left-1/2 overflow-clip translate-x-[-50%] w-[390px]" data-name="Home Indicator Container">
      <HomeIndicatorLight />
    </div>
  );
}

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

function Box1() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="setting">
          <path d={svgPaths.p3cccb600} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d={svgPaths.p185ecc80} id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box1 />
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

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="나의 보고서 (이번 주 나에게-수정하기)">
      <HomeIndicatorContainer />
      <NavigationTopNavigationWidget />
      <Frame3 />
      <CommonBottomButton />
    </div>
  );
}