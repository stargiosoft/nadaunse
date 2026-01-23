import svgPaths from "./svg-5e94f4h32t";

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
      <div aria-hidden="true" className="absolute border border-[#fa5b4a] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] py-0 relative size-full">
          <InputFieldContainer />
        </div>
      </div>
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="info-circle">
          <path d={svgPaths.p27fcf00} fill="var(--fill-0, #FA5B4A)" id="Vector" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box />
    </div>
  );
}

function ErrorMessageContainer() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-center min-h-px min-w-px relative" data-name="Error Message Container">
      <Icons />
      <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] min-h-px min-w-px relative text-[#fa5b4a] text-[13px]">Error message</p>
    </div>
  );
}

function ErrorContainer() {
  return (
    <div className="relative shrink-0 w-full" data-name="Error Container">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
          <ErrorMessageContainer />
        </div>
      </div>
    </div>
  );
}

export default function FormInput() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative size-full" data-name="Form / Input">
      <LabelContainer />
      <InputContainer />
      <ErrorContainer />
    </div>
  );
}