function Container() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[15px] text-white tracking-[-0.45px]">태그 쌓으러 가기</p>
    </div>
  );
}

export default function ButtonSquareButton() {
  return (
    <button 
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className="bg-[#48b2af] content-stretch flex items-center justify-center px-[12px] py-0 relative rounded-[12px] size-full transition-all active:scale-[0.99] active:bg-[#41A09E]" 
      data-name="Button / Square Button"
    >
      <Container />
    </button>
  );
}