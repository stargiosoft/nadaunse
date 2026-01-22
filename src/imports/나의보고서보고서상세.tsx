import svgPaths from "./svg-d6wqnyhzay";

function Icon() {
  return (
    <div className="absolute inset-[10%_0.65%_3.02%_-0.02%]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 39.7459 34.7902">
        <g id="Icon">
          <path d={svgPaths.p130ba700} fill="var(--fill-0, #6ABC13)" id="Vector" />
          <path d={svgPaths.p13fdf100} fill="var(--fill-0, #6ABC13)" id="Vector_2" />
          <path d={svgPaths.pb501000} fill="var(--fill-0, #6ABC13)" id="Vector_3" />
          <path d={svgPaths.p20ac8d40} fill="var(--fill-0, #83C6FF)" id="Vector_4" />
          <path d={svgPaths.p29743380} fill="var(--fill-0, #BFE1FF)" id="Vector_5" />
          <path d={svgPaths.p1992f660} fill="var(--fill-0, #83C6FF)" id="Vector_6" />
          <path d={svgPaths.p39404b80} fill="var(--fill-0, #555555)" id="Vector_7" />
          <path d={svgPaths.p1939f500} fill="var(--fill-0, #FFC300)" id="Vector_8" />
        </g>
      </svg>
    </div>
  );
}

function NotoDove() {
  return (
    <div className="overflow-clip relative size-[40px]" data-name="noto:dove">
      <Icon />
    </div>
  );
}

function TitleContainer() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Title Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[24px] relative shrink-0 text-[#151515] text-[18px] tracking-[-0.36px] w-full">26년 5월 4주차 보고서</p>
    </div>
  );
}

function TextContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Text Container">
      <TitleContainer />
      <div className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[28.5px] relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px] w-full">
        <p className="css-4hzbpn mb-0">이번 주 당신은 겉으론 또렷하고 논리적인데 속마음은 관계 걱정으로 몽글몽글 불안이 떠 있는 사람에 가까워요.</p>
        <p className="css-4hzbpn mb-0">&nbsp;</p>
        <p className="css-4hzbpn mb-0">당신 사주는 머리가 빠르게 회전하고 말과 표현이 뛰어난 형이에요. 재물과 현실 감각도 좋아서 일과 돈 문제는 어느 정도 스스로 길을 찾아가요. 대신 에너지가 바깥으로 치우쳐 관계와 평가에 민감해지기 쉬워요. 그래서 요즘처럼 연애와 인간관계에 시선이 집중되면 ‘왜 나만 이렇게 비껴가나’라는 마음이 더 커질 수 있어요.</p>
        <p className="css-4hzbpn mb-0">&nbsp;</p>
        <p className="css-4hzbpn">또 당신은 애초에 책임감과 자존심이 강한 사람이라 무리 없이 섞이기보다 ‘내가 괜찮은 사람으로 보이는가’를 기준으로 사람을 바라봐요. 이 기질과 지금의 관계 갈증이 부딪히니 사소한 말 한마디에도 상처받고 조급해진 거예요. 덜 사랑받아서가 아니라 사랑과 인정에 예민한 구조라서 더 크게 느껴지는 것뿐이에요.</p>
      </div>
    </div>
  );
}

function ContentContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative self-stretch shrink-0 w-[310px]" data-name="Content Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <NotoDove />
        </div>
      </div>
      <TextContainer />
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#f9f9f9] relative rounded-[16px] shrink-0 w-full" data-name="Container">
      <div className="flex flex-row justify-center size-full">
        <div className="content-stretch flex items-start justify-center px-[20px] py-[28px] relative w-full">
          <ContentContainer />
        </div>
      </div>
    </div>
  );
}

function CardInterpretationCard() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[350px]" data-name="Card / Interpretation Card">
      <Container />
    </div>
  );
}

function ContentContainer1() {
  return (
    <div className="content-stretch flex items-center pb-[40px] pt-[16px] px-[20px] relative shrink-0" data-name="Content Container">
      <CardInterpretationCard />
    </div>
  );
}

function ContentContainer2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Content Container">
      <ContentContainer1 />
      <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" data-name="Divider" />
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

function Frame() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[11px] items-center justify-center px-[20px] py-[14px] relative w-full">
          <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[24px] min-h-px min-w-px relative text-[17px] text-black tracking-[-0.34px]">{`이주의 나의 성향 태그 `}</p>
          <Icons />
        </div>
      </div>
    </div>
  );
}

function ReportAccordion() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Report Accordion">
      <Frame />
    </div>
  );
}

function TagLabel() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 3">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 배려심 많은</p>
    </div>
  );
}

function TagLabel1() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 4">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 성실한</p>
    </div>
  );
}

function TagLabel2() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 5">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 책임감 있는</p>
    </div>
  );
}

function TagLabel3() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 6">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 리더십 있는</p>
    </div>
  );
}

function TagLabel4() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 7">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 감정 변화가 큰</p>
    </div>
  );
}

function TagLabel5() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 8">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 관찰력 있는</p>
    </div>
  );
}

function TagLabel6() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 9">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 섬세한</p>
    </div>
  );
}

function TagLabel7() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 10">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 배려심 많은</p>
    </div>
  );
}

function TagLabel8() {
  return (
    <div className="content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative rounded-[99px] shrink-0" data-name="Tag label 11">
      <div aria-hidden="true" className="absolute border border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[99px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#151515] text-[13px]"># 책임감 있는</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-center flex flex-wrap gap-[6px] items-center relative shrink-0 w-full">
      <TagLabel />
      <TagLabel1 />
      <TagLabel2 />
      <TagLabel3 />
      <TagLabel4 />
      <TagLabel5 />
      <TagLabel6 />
      <TagLabel7 />
      <TagLabel8 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start px-[20px] py-[12px] relative w-full">
        <Frame1 />
      </div>
    </div>
  );
}

function TagListAccordion() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Tag List Accordion">
      <ReportAccordion />
      <Frame2 />
    </div>
  );
}

function ContentContainer3() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Content Container">
      <ContentContainer2 />
      <TagListAccordion />
    </div>
  );
}

function ContentContainer4() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-[52px] w-[390px]" data-name="Content Container">
      <ContentContainer3 />
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
    <div className="absolute bottom-[-129px] content-stretch flex flex-col items-start left-1/2 overflow-clip translate-x-[-50%] w-[390px]" data-name="Home Indicator Container">
      <HomeIndicatorLight />
    </div>
  );
}

function Box1() {
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

function Icons1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box1 />
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Left Action">
      <Icons1 />
    </div>
  );
}

function Box2() {
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

function Icons2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box2 />
    </div>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <Icons2 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction />
      <p className="css-g0mm18 flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] min-h-px min-w-px overflow-hidden relative text-[18px] text-black text-center text-ellipsis tracking-[-0.36px]">이번 주 보고서</p>
      <RightAction />
    </div>
  );
}

function NavigationTopBar() {
  return (
    <div className="bg-white h-[52px] relative shrink-0 w-full" data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
          <Icon1 />
        </div>
      </div>
    </div>
  );
}

function NavigationTopNavigationWidget() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-0 w-[390px]" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar />
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-white tracking-[-0.32px]">이번 주 타로 뽑기</p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <div className="bg-[#48b2af] content-stretch flex h-[56px] items-center justify-center px-[12px] py-0 relative rounded-[16px] shrink-0 w-[358px]" data-name="Button / Square Button">
      <ButtonContainer />
    </div>
  );
}

function ButtonContainer1() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
          <ButtonSquareButton />
        </div>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <ButtonContainer1 />
    </div>
  );
}

function CommonBottomButton() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col items-start left-1/2 shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] translate-x-[-50%] w-[390px]" data-name="Common / Bottom Button">
      <Container1 />
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="나의 보고서 (보고서 상세)">
      <HomeIndicatorContainer />
      <NavigationTopNavigationWidget />
      <CommonBottomButton />
      <ContentContainer4 />
    </div>
  );
}