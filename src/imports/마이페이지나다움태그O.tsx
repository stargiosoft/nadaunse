import svgPaths from "./svg-o5jcc01aog";
import imgImage from "figma:asset/23b9117ba4bdef1f5ecec145e7fd9de948dfdc19.png";

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
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
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

function TextGroup() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative text-ellipsis" data-name="Text Group">
      <p className="css-g0mm18 font-['Pretendard_Variable:Regular',sans-serif] font-normal h-[16px] leading-[16px] overflow-hidden relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px] w-[264px]">원숭이띠</p>
      <p className="css-g0mm18 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25px] min-w-full overflow-hidden relative shrink-0 text-[16px] text-black tracking-[-0.32px] w-[min-content]">별빛 속에 피어난 작은 꿈 (본인)</p>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Container">
      <div className="pointer-events-none relative rounded-[12px] shrink-0 size-[72px]" data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full" src={imgImage} />
        <div aria-hidden="true" className="absolute border border-[#f8f8f8] border-solid inset-0 rounded-[12px]" />
      </div>
      <TextGroup />
    </div>
  );
}

function TextGroup1() {
  return (
    <div className="content-stretch flex gap-[6px] items-center justify-center relative rounded-[12px] shrink-0 w-full" data-name="Text Group">
      <p className="css-ew64yg font-['Pretendard_Variable:Regular','Noto_Sans_JP:Regular',sans-serif] font-normal leading-[19px] overflow-hidden relative shrink-0 text-[#525252] text-[13px] text-ellipsis tracking-[-0.26px]">양력 1994.07.23 午(오)시</p>
      <div className="h-[6px] relative shrink-0 w-0">
        <div className="absolute inset-[-8.33%_-0.5px]" style={{ "--stroke-0": "rgba(212, 212, 212, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7">
            <path d="M0.5 0.5V6.5" id="Vector 15" stroke="var(--stroke-0, #D4D4D4)" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[19px] overflow-hidden relative shrink-0 text-[#525252] text-[13px] text-ellipsis tracking-[-0.26px]">원숭이띠</p>
      <div className="h-[6px] relative shrink-0 w-0">
        <div className="absolute inset-[-8.33%_-0.5px]" style={{ "--stroke-0": "rgba(212, 212, 212, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7">
            <path d="M0.5 0.5V6.5" id="Vector 15" stroke="var(--stroke-0, #D4D4D4)" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[19px] overflow-hidden relative shrink-0 text-[#525252] text-[13px] text-ellipsis tracking-[-0.26px]">물고가자리</p>
      <div className="h-[6px] relative shrink-0 w-0">
        <div className="absolute inset-[-8.33%_-0.5px]" style={{ "--stroke-0": "rgba(212, 212, 212, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7">
            <path d="M0.5 0.5V6.5" id="Vector 15" stroke="var(--stroke-0, #D4D4D4)" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[19px] overflow-hidden relative shrink-0 text-[#525252] text-[13px] text-ellipsis tracking-[-0.26px]">여성</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#f9f9f9] relative rounded-[12px] shrink-0 w-full" data-name="Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center p-[12px] relative w-full">
          <TextGroup1 />
        </div>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[12px] items-start px-[20px] py-0 relative w-full">
        <Container2 />
        <Container3 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[28px] pt-[16px] px-0 relative shrink-0 w-full" data-name="Container">
      <Container4 />
    </div>
  );
}

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

function Container6() {
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

function TextGroup2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px min-w-px relative" data-name="Text Group">
      <Container6 />
      <TagGroup />
    </div>
  );
}

function ButtonListItemButton() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full" data-name="Button / List Item Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[12px] relative w-full">
          <TextGroup2 />
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start px-[20px] py-[8px] relative w-full">
        <ButtonListItemButton />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="bg-[#f9f9f9] h-[8px] shrink-0 w-full" data-name="Divider" />
      <Container7 />
      <div className="bg-[#f9f9f9] h-[8px] shrink-0 w-full" data-name="Divider" />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Container5 />
      <Container8 />
    </div>
  );
}

function Box1() {
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

function Icons1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box1 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] text-black tracking-[-0.32px]">구매 내역</p>
      <Icons1 />
    </div>
  );
}

function ButtonListItemButton1() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full" data-name="Button / List Item Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[12px] relative w-full">
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function Box2() {
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

function Icons2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box2 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] text-black tracking-[-0.32px]">사주 정보 관리</p>
      <Icons2 />
    </div>
  );
}

function ButtonListItemButton2() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full" data-name="Button / List Item Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[12px] relative w-full">
          <Container11 />
        </div>
      </div>
    </div>
  );
}

function Box3() {
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

function Icons3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box3 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] text-black tracking-[-0.32px]">로그아웃</p>
      <Icons3 />
    </div>
  );
}

function ButtonListItemButton3() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full" data-name="Button / List Item Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[12px] relative w-full">
          <Container12 />
        </div>
      </div>
    </div>
  );
}

function Box4() {
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

function Icons4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icons">
      <Box4 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] text-black tracking-[-0.32px]">의견 전달하기</p>
      <Icons4 />
    </div>
  );
}

function ButtonListItemButton4() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full" data-name="Button / List Item Button">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[12px] relative w-full">
          <Container13 />
        </div>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[8px] relative w-full">
          <ButtonListItemButton1 />
          <ButtonListItemButton2 />
          <ButtonListItemButton3 />
          <ButtonListItemButton4 />
        </div>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-[104px] w-[390px]" data-name="Container">
      <Container9 />
      <Container14 />
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
    <div className="absolute bottom-[-147px] content-stretch flex flex-col items-start left-1/2 overflow-clip translate-x-[-50%] w-[390px]" data-name="Home Indicator Container">
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

function Icons5() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box5 />
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Left Action">
      <Icons5 />
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

function Icons6() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box6 />
    </div>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <Icons6 />
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
    <div className="bg-[#f8f8f8] flex-[1_0_0] min-h-px min-w-px relative rounded-[12px]" data-name="Navigation / Tab Item">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[20px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.45px]">프로필</p>
        </div>
      </div>
    </div>
  );
}

function NavigationTabItem1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px]" data-name="Navigation / Tab Item">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[16px] py-[8px] relative w-full">
          <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#999] text-[15px] tracking-[-0.45px]">나의 리포트</p>
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
      <div aria-hidden="true" className="absolute border-[#f3f3f3] border-b border-solid inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col items-start px-[16px] py-[8px] relative w-full">
        <TabItem />
      </div>
    </div>
  );
}

function NavigationTopNavigationWidget() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[390px]" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar />
      <NavigationTabBar />
    </div>
  );
}

function TopNavigationContainer() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-0 w-[390px]" data-name="Top Navigation Container">
      <NavigationTopNavigationWidget />
    </div>
  );
}

export default function O() {
  return (
    <div className="bg-white relative size-full" data-name="마이페이지 (나다움 태그 o)">
      <HomeIndicatorContainer />
      <TopNavigationContainer />
      <Footer />
      <Container15 />
    </div>
  );
}