function Container() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[20px] min-h-px min-w-px relative text-[#999] text-[15px] tracking-[-0.45px]">고객 정보는 알림톡 발송에만 사용돼요</p>
        </div>
      </div>
    </div>
  );
}

export default function Container1() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start px-[2px] py-0 relative size-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[0] relative shrink-0 text-[#151515] text-[0px] text-[22px] tracking-[-0.22px] w-full">
        <span className="leading-[32.5px]">
          매주 일요일 자기 분석 보고서를
          <br aria-hidden="true" />
        </span>
        <span className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[32.5px] text-[#41a09e]">알림톡</span>
        <span className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[32.5px]">{`으로 `}</span>
        <span className="leading-[32.5px]">보내드릴게요</span>
      </p>
      <Container />
    </div>
  );
}