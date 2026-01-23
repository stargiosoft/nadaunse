function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-white tracking-[-0.32px]">저장</p>
    </div>
  );
}

export default function ButtonSquareButton() {
  return (
    <div className="bg-[#48b2af] content-stretch flex items-center justify-center px-[12px] py-0 relative rounded-[16px] size-full" data-name="Button / Square Button">
      <ButtonContainer />
    </div>
  );
}