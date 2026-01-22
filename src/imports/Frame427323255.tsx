function Header() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative w-full">
          <div className="flex flex-[1_0_0] flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px relative text-[#6d6d6d] text-[14px] tracking-[-0.42px]">
            <p className="css-4hzbpn leading-[22px]">Label</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Text">
      <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[15px] tracking-[-0.3px] w-full">
        <p className="css-4hzbpn leading-[25.5px]">Placeholder text</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Container">
      <Text />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Container">
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start px-[4px] py-0 relative w-full">
        <Container1 />
      </div>
    </div>
  );
}

function CharacterCount() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative shrink-0" data-name="Character count">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[13px] tracking-[-0.26px]">
        <p className="css-ew64yg leading-[19px]">0/200자</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-full" data-name="Container">
      <Container2 />
      <CharacterCount />
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
    <div className="bg-[#f9f9f9] content-stretch flex flex-col items-start px-[16px] py-[20px] relative rounded-[20px] shrink-0 w-[350px]" data-name="Container">
      <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <Container4 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <Header />
      <Container5 />
    </div>
  );
}

function FormTextAreaInput() {
  return (
    <div className="absolute content-stretch flex flex-col items-end left-[223px] top-[169px] w-[350px]" data-name="Form / Text Area Input">
      <Container6 />
    </div>
  );
}

function Header1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative w-full">
          <div className="flex flex-[1_0_0] flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px relative text-[#6d6d6d] text-[14px] tracking-[-0.42px]">
            <p className="css-4hzbpn leading-[22px]">Label</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderText() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Placeholder Text">
      <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[15px] tracking-[-0.3px] w-full">
        <p className="css-4hzbpn leading-[25.5px]">Placeholder text</p>
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

function CharacterCount1() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative shrink-0" data-name="Character Count">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[13px] tracking-[-0.26px]">
        <p className="css-ew64yg leading-[19px]">0/200자</p>
      </div>
    </div>
  );
}

function TextContainer1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-full" data-name="Text Container">
      <TextContainer />
      <CharacterCount1 />
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
      <div aria-hidden="true" className="absolute border border-[#48b2af] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <TextContainer2 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <Header1 />
      <Content />
    </div>
  );
}

function FormTextAreaInput1() {
  return (
    <div className="absolute content-stretch flex flex-col items-end left-[223px] top-[342px] w-[350px]" data-name="Form / Text Area Input">
      <Container7 />
    </div>
  );
}

function Header2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative w-full">
          <div className="flex flex-[1_0_0] flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px relative text-[#6d6d6d] text-[14px] tracking-[-0.42px]">
            <p className="css-4hzbpn leading-[22px]">Label</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderText1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Placeholder Text">
      <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full">
        <p className="css-4hzbpn leading-[25.5px]">응</p>
      </div>
    </div>
  );
}

function TextRow2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text Row">
      <PlaceholderText1 />
    </div>
  );
}

function TextRow3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Text Row">
      <TextRow2 />
    </div>
  );
}

function TextContainer3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text Container">
      <div className="content-stretch flex flex-col items-start px-[4px] py-0 relative w-full">
        <TextRow3 />
      </div>
    </div>
  );
}

function CharacterCount2() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative shrink-0" data-name="Character Count">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[0px] tracking-[-0.26px]">
        <p className="css-ew64yg text-[13px]">
          <span className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[19px] text-[#48b2af] tracking-[-0.26px]">3</span>
          <span className="leading-[19px]">/200자</span>
        </p>
      </div>
    </div>
  );
}

function TextContainer4() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-full" data-name="Text Container">
      <TextContainer3 />
      <CharacterCount2 />
    </div>
  );
}

function TextContainer5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Text Container">
      <TextContainer4 />
    </div>
  );
}

function Content1() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex flex-col items-start px-[16px] py-[20px] relative rounded-[20px] shrink-0 w-[350px]" data-name="Content">
      <div aria-hidden="true" className="absolute border border-[#48b2af] border-solid inset-0 pointer-events-none rounded-[20px]" />
      <TextContainer5 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <Header2 />
      <Content1 />
    </div>
  );
}

function FormTextAreaInput2() {
  return (
    <div className="absolute content-stretch flex flex-col items-end left-[223px] top-[515px] w-[350px]" data-name="Form / Text Area Input">
      <Container8 />
    </div>
  );
}

function Header3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative w-full">
          <div className="flex flex-[1_0_0] flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px relative text-[#6d6d6d] text-[14px] tracking-[-0.42px]">
            <p className="css-4hzbpn leading-[22px]">Label</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderText2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Placeholder Text">
      <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full">
        <p className="css-4hzbpn leading-[25.5px]">응</p>
      </div>
    </div>
  );
}

function TextRow4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text Row">
      <PlaceholderText2 />
    </div>
  );
}

function TextRow5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Text Row">
      <TextRow4 />
    </div>
  );
}

function TextContainer6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text Container">
      <div className="content-stretch flex flex-col items-start px-[4px] py-0 relative w-full">
        <TextRow5 />
      </div>
    </div>
  );
}

function CharacterCount3() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative shrink-0" data-name="Character Count">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#999] text-[0px] tracking-[-0.26px]">
        <p className="css-ew64yg text-[13px]">
          <span className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[19px] text-[#48b2af] tracking-[-0.26px]">3</span>
          <span className="leading-[19px]">/200자</span>
        </p>
      </div>
    </div>
  );
}

function TextContainer7() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-full" data-name="Text Container">
      <TextContainer6 />
      <CharacterCount3 />
    </div>
  );
}

function TextContainer8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Text Container">
      <TextContainer7 />
    </div>
  );
}

function Content2() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex flex-col items-start px-[16px] py-[20px] relative rounded-[20px] shrink-0 w-[350px]" data-name="Content">
      <TextContainer8 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <Header3 />
      <Content2 />
    </div>
  );
}

function FormTextAreaInput3() {
  return (
    <div className="absolute content-stretch flex flex-col items-end left-[223px] top-[688px] w-[350px]" data-name="Form / Text Area Input">
      <Container9 />
    </div>
  );
}

function Header4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative w-full">
          <div className="flex flex-[1_0_0] flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px relative text-[#b7b7b7] text-[14px] tracking-[-0.42px]">
            <p className="css-4hzbpn leading-[22px]">Label</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderText3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Placeholder Text">
      <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#d4d4d4] text-[15px] tracking-[-0.3px] w-full">
        <p className="css-4hzbpn leading-[25.5px]">Placeholder text</p>
      </div>
    </div>
  );
}

function TextRow6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text Row">
      <PlaceholderText3 />
    </div>
  );
}

function TextRow7() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Text Row">
      <TextRow6 />
    </div>
  );
}

function TextContainer9() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text Container">
      <div className="content-stretch flex flex-col items-start px-[4px] py-0 relative w-full">
        <TextRow7 />
      </div>
    </div>
  );
}

function CharacterCount4() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-0 relative shrink-0" data-name="Character Count">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#d4d4d4] text-[13px] tracking-[-0.26px]">
        <p className="css-ew64yg leading-[19px]">0/200자</p>
      </div>
    </div>
  );
}

function TextContainer10() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-full" data-name="Text Container">
      <TextContainer9 />
      <CharacterCount4 />
    </div>
  );
}

function TextContainer11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Text Container">
      <TextContainer10 />
    </div>
  );
}

function Content3() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex flex-col items-start px-[16px] py-[20px] relative rounded-[20px] shrink-0 w-[350px]" data-name="Content">
      <TextContainer11 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Container">
      <Header4 />
      <Content3 />
    </div>
  );
}

function FormTextAreaInput4() {
  return (
    <div className="absolute content-stretch flex flex-col items-end left-[223px] top-[861px] w-[350px]" data-name="Form / Text Area Input">
      <Container10 />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <FormTextAreaInput />
      <FormTextAreaInput1 />
      <FormTextAreaInput2 />
      <FormTextAreaInput3 />
      <FormTextAreaInput4 />
    </div>
  );
}