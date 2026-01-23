import svgPaths from "./svg-nx753fhzfr";
import imgSwords11Png from "figma:asset/2ced5a86877d398cd3930c1ef08e032cadaa48d4.png";

function Swords11Png() {
  return (
    <div className="h-[260px] relative rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] shrink-0 w-[150px]" data-name="Swords11.png">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[16px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgSwords11Png} />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[18px] text-center tracking-[-0.36px] w-full">Page of swords</p>
    </div>
  );
}

function CardImageContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[18px] items-center relative shrink-0 w-full" data-name="Card Image Container">
      <Swords11Png />
      <Container />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0 w-[310px]" data-name="Container">
      <CardImageContainer />
      <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[28.5px] relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px] w-full">이 카드는 호기심과 탐구심, 그리고 진실을 알고자 하는 열망을 상징합니다. 상대방을 향한 당신의 관심이 깊어지고 있으며, 마음속에 질문이 많아지는 시기일 수 있습니다. 다만, 모든 것을 성급히 판단하기보다 관찰하고 배워가야 할 때입니다. 말과 행동에서 솔직함이 중요하며, 작은 오해를 바로잡는 데 힘쓰면 관계가 훨씬 안정될 수 있습니다.</p>
    </div>
  );
}

function CardInterpretationCard() {
  return (
    <div className="bg-[#f9f9f9] relative rounded-[16px] shrink-0 w-full" data-name="Card / Interpretation Card">
      <div className="flex flex-row justify-center size-full">
        <div className="content-stretch flex items-start justify-center pb-[28px] pt-[32px] px-[20px] relative w-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function CardContent() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[350px]" data-name="Card Content">
      <CardInterpretationCard />
    </div>
  );
}

function Swords11Png1() {
  return (
    <div className="h-[260px] relative rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] shrink-0 w-[150px]" data-name="Swords11.png">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[16px]">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgSwords11Png} />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25.5px] relative shrink-0 text-[#151515] text-[18px] text-center tracking-[-0.36px] w-full">Page of swords</p>
    </div>
  );
}

function CardImageContainer1() {
  return (
    <div className="content-stretch flex flex-col gap-[18px] items-center relative shrink-0 w-full" data-name="Card Image Container">
      <Swords11Png1 />
      <Container2 />
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0 w-[310px]" data-name="Container">
      <CardImageContainer1 />
      <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[28.5px] relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px] w-full">이 카드는 호기심과 탐구심, 그리고 진실을 알고자 하는 열망을 상징합니다. 상대방을 향한 당신의 관심이 깊어지고 있으며, 마음속에 질문이 많아지는 시기일 수 있습니다. 다만, 모든 것을 성급히 판단하기보다 관찰하고 배워가야 할 때입니다. 말과 행동에서 솔직함이 중요하며, 작은 오해를 바로잡는 데 힘쓰면 관계가 훨씬 안정될 수 있습니다.</p>
    </div>
  );
}

function CardInterpretationCard1() {
  return (
    <div className="bg-[#f9f9f9] relative rounded-[16px] shrink-0 w-full" data-name="Card / Interpretation Card">
      <div className="flex flex-row justify-center size-full">
        <div className="content-stretch flex items-start justify-center pb-[28px] pt-[32px] px-[20px] relative w-full">
          <Container3 />
        </div>
      </div>
    </div>
  );
}

function CardContainer() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-h-px min-w-px relative" data-name="Card Container">
      {[...Array(2).keys()].map((_, i) => (
        <CardContent key={i} />
      ))}
      <CardInterpretationCard1 />
    </div>
  );
}

function Card() {
  return (
    <div className="absolute content-stretch flex items-center left-1/2 pb-0 pt-[12px] px-[20px] top-[52px] translate-x-[-50%] w-[390px]" data-name="Card">
      <CardContainer />
    </div>
  );
}

function Box() {
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

function Icons() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box />
    </div>
  );
}

function LeftAction() {
  return (
    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Left Action">
      <Icons />
    </div>
  );
}

function Box1() {
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

function Icons1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icons">
      <Box1 />
    </div>
  );
}

function RightAction() {
  return (
    <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
      <Icons1 />
    </div>
  );
}

function Icon() {
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
          <Icon />
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
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-white tracking-[-0.32px]">이번 주 마음 처방 보기</p>
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

function Container4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <ButtonContainer1 />
    </div>
  );
}

function CommonBottomButton() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col items-start left-1/2 shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] translate-x-[-50%] w-[390px]" data-name="Common / Bottom Button">
      <Container4 />
    </div>
  );
}

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-name="나의 보고서 (타로 풀이)">
      <CommonBottomButton />
      <Card />
      <NavigationTopNavigationWidget />
    </div>
  );
}