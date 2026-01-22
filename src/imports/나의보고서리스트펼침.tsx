import svgPaths from "./svg-vryx3pgb83";

function CommonLogo() {
  return (
    <div className="h-[20px] relative shrink-0 w-[59px]" data-name="Common / Logo">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 59 20">
        <g id="Common / Logo">
          <path d={svgPaths.p1fb34640} fill="var(--fill-0, #151515)" id="Vector" />
          <path d={svgPaths.p1bbbb200} fill="var(--fill-0, #151515)" id="Vector_2" />
          <path d={svgPaths.p11620600} fill="var(--fill-0, #151515)" id="Vector_3" />
          <path d={svgPaths.p9a70500} fill="var(--fill-0, #151515)" id="Vector_4" />
          <path d={svgPaths.p115ca080} fill="var(--fill-0, #151515)" id="Vector_5" />
          <path d={svgPaths.pb2cf980} fill="var(--fill-0, #151515)" id="Vector_6" />
          <path d={svgPaths.p211e0700} fill="var(--fill-0, #151515)" id="Vector_7" />
          <path d={svgPaths.p3088fdc0} fill="var(--fill-0, #151515)" id="Vector_8" />
          <path d={svgPaths.p2e718980} fill="var(--fill-0, #151515)" id="Vector_9" />
          <path d={svgPaths.p15169200} fill="var(--fill-0, #151515)" id="Vector_10" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal gap-[4px] items-start leading-[19px] relative shrink-0 text-[#6d6d6d] text-[13px] tracking-[-0.26px] w-full">
      <p className="css-4hzbpn relative shrink-0 w-full">Copyright 2024@Stargiosoft All Rights Reserved.</p>
      <p className="css-4hzbpn relative shrink-0 w-full">대표자 서지현 | 사업자등록번호 827-88-01815</p>
      <p className="css-4hzbpn relative shrink-0 w-full">통신판매업번호 2024-서울영등포-2084</p>
      <p className="css-4hzbpn relative shrink-0 w-full">서울시 영등포구 양평로 149, 1507호</p>
      <p className="css-4hzbpn relative shrink-0 w-full">문의 stargiosoft@gmail.com</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[12px] items-start px-[8px] py-0 relative w-full">
        <CommonLogo />
        <Frame />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">이용약관</p>
    </div>
  );
}

function ButtonTextButton() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">개인정보 처리방침</p>
    </div>
  );
}

function ButtonTextButton1() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container1 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <ButtonTextButton />
      <div className="h-[8px] relative shrink-0 w-0">
        <div className="absolute inset-[-6.25%_-0.5px]" style={{ "--stroke-0": "rgba(212, 212, 212, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 9">
            <path d="M0.5 0.5V8.5" id="Vector 65" stroke="var(--stroke-0, #D4D4D4)" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <ButtonTextButton1 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame1 />
      <Frame2 />
    </div>
  );
}

function Footer() {
  return (
    <div className="absolute bg-[#f9f9f9] bottom-0 content-stretch flex flex-col items-start left-0 pb-[40px] pt-[32px] px-[20px] w-[390px]" data-name="Footer">
      <Frame3 />
    </div>
  );
}

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-up">
          <path d={svgPaths.peb9d380} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
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

function Frame4() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[11px] items-center justify-center px-[20px] py-[14px] relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[24px] min-h-px min-w-px relative text-[17px] text-black tracking-[-0.34px]">26년 5월 보고서</p>
          <Icons />
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[2px] py-0 relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px]">4주차 보고서</p>
        </div>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start leading-[20px] relative shrink-0 text-[#151515] text-[14px] tracking-[-0.42px] w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium relative shrink-0">이번 주 나에게 :</p>
      <div className="font-['Pretendard_Variable:Regular',sans-serif] font-normal min-w-full relative shrink-0 w-[min-content]">
        <p className="css-4hzbpn mb-0">이번 주도 고생했어. 혼자 애쓴 부분들, 내가 다 알고 있어</p>
        <p className="css-4hzbpn">괜찮다고 더 버텨보자고 애썼다고 칭찬해주고 싶어</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#f9f9f9] relative rounded-[12px] shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start px-[16px] py-[18px] relative w-full">
        <Container2 />
      </div>
    </div>
  );
}

function TagLabel() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 3">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 결단력 있는</p>
    </div>
  );
}

function TagLabel4() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 7">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 책임감이 강한</p>
    </div>
  );
}

function TagLabel5() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 8">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 상황을 주도하는</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <TagLabel />
      <TagLabel4 />
      <TagLabel5 />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex gap-[6px] items-center px-[2px] py-0 relative shrink-0" data-name="Container">
      <Container4 />
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#999] text-[12px] tracking-[-0.24px]">+3</p>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container3 />
      <Container5 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Header />
      <Container6 />
    </div>
  );
}

function VuesaxLinearArrowRight() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/arrow-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="arrow-right">
          <path d={svgPaths.p23113100} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d="M1.75 6H10.165" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icons">
      <VuesaxLinearArrowRight />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">보고서 보기</p>
      <Icons1 />
    </div>
  );
}

function ButtonTextButton2() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container8 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[334px]" data-name="Container">
      <Container7 />
      <ButtonTextButton2 />
    </div>
  );
}

function ViewReport() {
  return (
    <div className="relative shrink-0 w-full" data-name="View Report">
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex items-start px-[28px] py-[8px] relative w-full">
        <Container9 />
      </div>
    </div>
  );
}

function ReportAccordion() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Report Accordion">
      <Frame4 />
      <ViewReport />
    </div>
  );
}

function Header1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[2px] py-0 relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px]">3주차 보고서</p>
        </div>
      </div>
    </div>
  );
}

function TagLabel1() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 3">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 결단력 있는</p>
    </div>
  );
}

function TagLabel6() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 7">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 책임감이 강한</p>
    </div>
  );
}

function TagLabel7() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 8">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 상황을 주도하는</p>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <TagLabel1 />
      <TagLabel6 />
      <TagLabel7 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex gap-[6px] items-center px-[2px] py-0 relative shrink-0" data-name="Container">
      <Container10 />
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#999] text-[12px] tracking-[-0.24px]">+12</p>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container11 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Header1 />
      <Container12 />
    </div>
  );
}

function VuesaxLinearArrowRight1() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/arrow-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="arrow-right">
          <path d={svgPaths.p23113100} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d="M1.75 6H10.165" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons2() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icons">
      <VuesaxLinearArrowRight1 />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">보고서 보기</p>
      <Icons2 />
    </div>
  );
}

function ButtonTextButton3() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container14 />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[334px]" data-name="Container">
      <Container13 />
      <ButtonTextButton3 />
    </div>
  );
}

function ViewReport1() {
  return (
    <div className="relative shrink-0 w-full" data-name="View Report">
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex items-start px-[28px] py-[20px] relative w-full">
        <Container15 />
      </div>
    </div>
  );
}

function Box1() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-up">
          <path d={svgPaths.peb9d380} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box1 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[11px] items-center justify-center px-[20px] py-[14px] relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[24px] min-h-px min-w-px relative text-[17px] text-black tracking-[-0.34px]">26년 4월 보고서</p>
          <Icons3 />
        </div>
      </div>
    </div>
  );
}

function Header2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[2px] py-0 relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px]">3주차 보고서</p>
        </div>
      </div>
    </div>
  );
}

function TagLabel2() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 3">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 결단력 있는</p>
    </div>
  );
}

function TagLabel8() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 7">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 책임감이 강한</p>
    </div>
  );
}

function TagLabel9() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 8">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 상황을 주도하는</p>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <TagLabel2 />
      <TagLabel8 />
      <TagLabel9 />
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex gap-[6px] items-center px-[2px] py-0 relative shrink-0" data-name="Container">
      <Container16 />
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#999] text-[12px] tracking-[-0.24px]">+8</p>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container17 />
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Header2 />
      <Container18 />
    </div>
  );
}

function VuesaxLinearArrowRight2() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/arrow-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="arrow-right">
          <path d={svgPaths.p23113100} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d="M1.75 6H10.165" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons4() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icons">
      <VuesaxLinearArrowRight2 />
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">보고서 보기</p>
      <Icons4 />
    </div>
  );
}

function ButtonTextButton4() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container20 />
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[334px]" data-name="Container">
      <Container19 />
      <ButtonTextButton4 />
    </div>
  );
}

function ViewReport2() {
  return (
    <div className="relative shrink-0 w-full" data-name="View Report">
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex items-start px-[28px] py-[8px] relative w-full">
        <Container21 />
      </div>
    </div>
  );
}

function ReportAccordion1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Report Accordion">
      <Frame5 />
      <ViewReport2 />
    </div>
  );
}

function Header3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[2px] py-0 relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px]">2주차 보고서</p>
        </div>
      </div>
    </div>
  );
}

function TagLabel3() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 3">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 결단력 있는</p>
    </div>
  );
}

function TagLabel10() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 7">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 책임감이 강한</p>
    </div>
  );
}

function TagLabel11() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 8">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 상황을 주도하는</p>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <TagLabel3 />
      <TagLabel10 />
      <TagLabel11 />
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex gap-[6px] items-center px-[2px] py-0 relative shrink-0" data-name="Container">
      <Container22 />
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#999] text-[12px] tracking-[-0.24px]">+1</p>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container23 />
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Header3 />
      <Container24 />
    </div>
  );
}

function VuesaxLinearArrowRight3() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/arrow-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="arrow-right">
          <path d={svgPaths.p23113100} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d="M1.75 6H10.165" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons5() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icons">
      <VuesaxLinearArrowRight3 />
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">보고서 보기</p>
      <Icons5 />
    </div>
  );
}

function ButtonTextButton5() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container26 />
    </div>
  );
}

function Container27() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[334px]" data-name="Container">
      <Container25 />
      <ButtonTextButton5 />
    </div>
  );
}

function ViewReport3() {
  return (
    <div className="relative shrink-0 w-full" data-name="View Report">
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex items-start px-[28px] py-[20px] relative w-full">
        <Container27 />
      </div>
    </div>
  );
}

function Header4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[2px] py-0 relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px]">1주차 보고서</p>
        </div>
      </div>
    </div>
  );
}

function TagLabel12() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 3">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 결단력 있는</p>
    </div>
  );
}

function TagLabel13() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 7">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 책임감이 강한</p>
    </div>
  );
}

function TagLabel14() {
  return (
    <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[99px] shrink-0" data-name="Tag label 8">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] relative shrink-0 text-[#151515] text-[12px] tracking-[-0.24px]"># 상황을 주도하는</p>
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <TagLabel12 />
      <TagLabel13 />
      <TagLabel14 />
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex gap-[6px] items-center px-[2px] py-0 relative shrink-0" data-name="Container">
      <Container28 />
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#999] text-[12px] tracking-[-0.24px]">+3</p>
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container29 />
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Header4 />
      <Container30 />
    </div>
  );
}

function VuesaxLinearArrowRight4() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/arrow-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="arrow-right">
          <path d={svgPaths.p23113100} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d="M1.75 6H10.165" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons6() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icons">
      <VuesaxLinearArrowRight4 />
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] tracking-[-0.42px]">보고서 보기</p>
      <Icons6 />
    </div>
  );
}

function ButtonTextButton6() {
  return (
    <div className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 relative rounded-[12px] shrink-0" data-name="Button / Text Button">
      <Container32 />
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[334px]" data-name="Container">
      <Container31 />
      <ButtonTextButton6 />
    </div>
  );
}

function ViewReport4() {
  return (
    <div className="relative shrink-0 w-full" data-name="View Report">
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex items-start px-[28px] py-[20px] relative w-full">
        <Container33 />
      </div>
    </div>
  );
}

function Box2() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p3993d9c0} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box2 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[11px] items-center justify-center px-[20px] py-[14px] relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] min-h-px min-w-px relative text-[16px] text-black tracking-[-0.32px]">26년 3월 보고서</p>
          <Icons7 />
        </div>
      </div>
    </div>
  );
}

function ReportAccordion2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Report Accordion">
      <div aria-hidden="true" className="absolute border-[#f8f8f8] border-b border-solid inset-0 pointer-events-none" />
      <Frame6 />
    </div>
  );
}

function Box3() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p3993d9c0} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons8() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box3 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[11px] items-center justify-center px-[20px] py-[14px] relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] min-h-px min-w-px relative text-[16px] text-black tracking-[-0.32px]">26년 2월 보고서</p>
          <Icons8 />
        </div>
      </div>
    </div>
  );
}

function ReportAccordion3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Report Accordion">
      <div aria-hidden="true" className="absolute border-[#f8f8f8] border-b border-solid inset-0 pointer-events-none" />
      <Frame7 />
    </div>
  );
}

function Box4() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p3993d9c0} id="Vector" stroke="var(--stroke-0, #B7B7B7)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons9() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box4 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[11px] items-center justify-center px-[20px] py-[14px] relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] min-h-px min-w-px relative text-[16px] text-black tracking-[-0.32px]">26년 1월 보고서</p>
          <Icons9 />
        </div>
      </div>
    </div>
  );
}

function ReportAccordion4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Report Accordion">
      <div aria-hidden="true" className="absolute border-[#f8f8f8] border-b border-solid inset-0 pointer-events-none" />
      <Frame8 />
    </div>
  );
}

function ReportList() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-[104px] w-[390px]" data-name="Report List">
      <ReportAccordion />
      <ViewReport1 />
      <ReportAccordion1 />
      <ViewReport3 />
      <ViewReport4 />
      <ReportAccordion2 />
      <ReportAccordion3 />
      <ReportAccordion4 />
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
    <div className="absolute bottom-[-878px] content-stretch flex flex-col items-start left-1/2 overflow-clip translate-x-[-50%] w-[390px]" data-name="Home Indicator Container">
      <HomeIndicatorLight />
    </div>
  );
}

function Box5() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="arrow-left">
          <path d={svgPaths.p2a5cd480} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <path d={svgPaths.p1a4bb100} id="Vector_2" opacity="0" stroke="var(--stroke-0, #848484)" />
        </g>
      </svg>
    </div>
  );
}

function Icons10() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box5 />
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Left Action">
      <Icons10 />
    </div>
  );
}

function Box6() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="setting">
          <path d={svgPaths.p3cccb600} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d={svgPaths.p185ecc80} id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons11() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box6 />
    </div>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <Icons11 />
    </div>
  );
}

function Icon() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction />
      <p className="css-g0mm18 flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] min-h-px min-w-px overflow-hidden relative text-[18px] text-black text-center text-ellipsis tracking-[-0.36px]">마이페이지</p>
      <RightAction />
    </div>
  );
}

function NavigationTopBar() {
  return (
    <div className="bg-white h-[52px] relative shrink-0 w-full" data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
          <Icon />
        </div>
      </div>
    </div>
  );
}

function NavigationTabItem() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px]" data-name="Navigation / Tab Item">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#999] text-[15px] tracking-[-0.45px]">프로필</p>
        </div>
      </div>
    </div>
  );
}

function NavigationTabItem1() {
  return (
    <div className="bg-[#f8f8f8] flex-[1_0_0] min-h-px min-w-px relative rounded-[12px]" data-name="Navigation / Tab Item">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[20px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.45px]">나의 분석 보고서</p>
        </div>
      </div>
    </div>
  );
}

function TabItem() {
  return (
    <div className="content-stretch flex items-center overflow-clip relative shrink-0 w-full" data-name="Tab Item">
      <NavigationTabItem />
      <NavigationTabItem1 />
    </div>
  );
}

function NavigationTabBar() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Navigation / Tab Bar">
      <div aria-hidden="true" className="absolute border-[#f8f8f8] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col items-start px-[16px] py-[8px] relative w-full">
        <TabItem />
      </div>
    </div>
  );
}

function NavigationTopNavigationWidget() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-0 w-[390px]" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar />
      <NavigationTabBar />
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="나의 보고서 (리스트 펼침)">
      <HomeIndicatorContainer />
      <NavigationTopNavigationWidget />
      <Footer />
      <ReportList />
    </div>
  );
}