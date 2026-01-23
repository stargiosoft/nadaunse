import svgPaths from "./svg-rtee12494s";

function IndependentHandle() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Independent / Handle">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[10px] py-[12px] relative w-full">
          <div className="bg-[#d4d4d4] h-[4px] rounded-[999px] shrink-0 w-[48px]" data-name="Handle" />
        </div>
      </div>
    </div>
  );
}

function IconAndLabel() {
  return (
    <div className="h-[18.537px] relative shrink-0 w-[20.179px]" data-name="Icon and Label">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.1788 18.5368">
        <g id="Icon and Label">
          <path clipRule="evenodd" d={svgPaths.p2d30f4f0} fill="var(--fill-0, #1F1F1F)" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#fee500] content-stretch flex items-center justify-center p-[12px] relative rounded-[16px] shrink-0 size-[44px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#fee500] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <IconAndLabel />
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[20px] min-h-px min-w-px relative text-[#6d6d6d] text-[15px] tracking-[-0.45px]">고객 정보는 알림톡 발송에만 사용돼요</p>
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[6px] items-start px-[2px] py-0 relative w-full">
        <p className="css-4hzbpn font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[0] relative shrink-0 text-[#151515] text-[0px] text-[22px] tracking-[-0.22px] w-full">
          <span className="leading-[32.5px]">리포트 완성되면</span>
          <span className="leading-[32.5px]"> </span>
          <span className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[32.5px] text-[#41a09e]">알림톡</span>
          <span className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[32.5px]"> </span>
          <span className="leading-[32.5px]">보내드릴게요</span>
        </p>
        <Container />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Container">
      <Button />
      <Container1 />
    </div>
  );
}

function LabelContainer() {
  return (
    <div className="relative shrink-0 w-full" data-name="Label Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] min-h-px min-w-px relative text-[#848484] text-[12px] tracking-[-0.24px]">휴대폰 번호</p>
        </div>
      </div>
    </div>
  );
}

function InputFieldContainer() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[12px] items-center min-h-px min-w-px relative" data-name="Input Field Container">
      <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[20px] min-h-px min-w-px relative text-[#b7b7b7] text-[15px] tracking-[-0.45px]">{`'-'하이픈 없이 숫자만 입력해 주세요`}</p>
    </div>
  );
}

function InputContainer() {
  return (
    <div className="bg-white h-[56px] relative rounded-[16px] shrink-0 w-full" data-name="Input Container">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] py-0 relative size-full">
          <InputFieldContainer />
        </div>
      </div>
    </div>
  );
}

function FormInput() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Form / Input">
      <LabelContainer />
      <InputContainer />
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[36px] items-start relative shrink-0 w-full" data-name="Container">
      <Container2 />
      <FormInput />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Container3 />
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start pb-[44px] pt-[20px] px-[20px] relative shrink-0 w-[390px]" data-name="Container">
      <Container4 />
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-full" data-name="Content Container">
      <IndependentHandle />
      <Container5 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[#b7b7b7] text-[16px] tracking-[-0.32px]">저장</p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <div className="bg-[#f8f8f8] content-stretch flex h-[56px] items-center justify-center px-[12px] py-0 relative rounded-[16px] shrink-0 w-[358px]" data-name="Button / Square Button">
      <Container6 />
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
          <ButtonSquareButton />
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <ButtonContainer />
    </div>
  );
}

function CommonBottomButton() {
  return (
    <div className="content-stretch flex flex-col items-start relative shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] shrink-0 w-full" data-name="Common / Bottom Button">
      <Container7 />
    </div>
  );
}

function ContentsBottomSheet() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col items-start right-0 w-[390px]" data-name="Contents Bottom Sheet">
      <ContentContainer />
      <CommonBottomButton />
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

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="나다움 기록하기 (태그컨펌)">
      <HomeIndicatorContainer />
      <div className="absolute bg-[rgba(0,0,0,0.5)] h-[844px] left-0 top-0 w-[390px]" data-name="Background" />
      <ContentsBottomSheet />
    </div>
  );
}