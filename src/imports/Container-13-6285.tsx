import svgPaths from "./svg-xt0gz31cjb";

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-right">
          <path d={svgPaths.p232a3c80} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
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

function Container() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] text-black tracking-[-0.32px]">나다움 태그</p>
      <Icons />
    </div>
  );
}

function TagLabel1() {
  return (
    <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[7px] py-[5px] relative rounded-[999px] shrink-0" data-name="Tag label 1">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#368683] text-[12px] text-justify tracking-[-0.24px]"># 리더십 있는</p>
    </div>
  );
}

function TagLabel2() {
  return (
    <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[7px] py-[5px] relative rounded-[999px] shrink-0" data-name="Tag label 1">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#368683] text-[12px] text-justify tracking-[-0.24px]"># 감정 변화가 큰</p>
    </div>
  );
}

function TagLabel3() {
  return (
    <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[7px] py-[5px] relative rounded-[999px] shrink-0" data-name="Tag label 1">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#368683] text-[12px] text-justify tracking-[-0.24px]"># 갈등을 피하는</p>
    </div>
  );
}

function TagLabel() {
  return (
    <div className="content-stretch flex items-center justify-center px-[4px] py-[5px] relative rounded-[999px] shrink-0" data-name="Tag label">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#368683] text-[12px] text-justify tracking-[-0.24px]">+8</p>
    </div>
  );
}

function TagGroup() {
  return (
    <div className="content-start flex flex-wrap gap-[4px] items-start pb-[3px] pt-0 px-0 relative shrink-0 w-full" data-name="Tag Group">
      <TagLabel1 />
      <TagLabel2 />
      <TagLabel3 />
      <TagLabel />
    </div>
  );
}

function TextGroup() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Text Group">
      <Container />
      <TagGroup />
    </div>
  );
}

export default function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start px-[36px] py-[16px] relative size-full" data-name="Container">
      <TextGroup />
    </div>
  );
}