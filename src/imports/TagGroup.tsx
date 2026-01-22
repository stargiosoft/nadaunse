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

export default function TagGroup() {
  return (
    <div className="content-start flex flex-wrap gap-[4px] items-start pb-[3px] pt-0 px-0 relative size-full" data-name="Tag Group">
      <TagLabel1 />
      <TagLabel2 />
      <TagLabel3 />
      <TagLabel />
    </div>
  );
}