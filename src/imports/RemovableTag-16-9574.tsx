function Container() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Container">
      <div className="css-g0mm18 flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px]">
        <p className="css-ew64yg leading-[22px]">Tag</p>
      </div>
    </div>
  );
}

export default function RemovableTag() {
  return (
    <div className="bg-[#f9f9f9] content-stretch flex items-center px-[16px] py-[12px] relative rounded-[99px] size-full" data-name="RemovableTag">
      <Container />
    </div>
  );
}