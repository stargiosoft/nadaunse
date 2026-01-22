function Container() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">다음에 할래요</p>
    </div>
  );
}

export default function ButtonTextButton() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[8px] py-0 relative rounded-[12px] size-full" data-name="Button / Text Button">
      <Container />
    </div>
  );
}