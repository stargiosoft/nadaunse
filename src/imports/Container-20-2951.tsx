import svgPaths from "./svg-cgnjs4xrxp";

function Group() {
  return (
    <div className="absolute inset-[1.5%_0.02%_1.77%_-0.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48.0038 46.4307">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p8ff0d80} fill="var(--fill-0, #FF6678)" fillRule="evenodd" id="Vector" />
          <path d={svgPaths.p3195a000} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function IconsDesingFlowerFlat() {
  return (
    <div className="overflow-clip relative shrink-0 size-[48px]" data-name="Icons/desing/flower-flat">
      <Group />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 text-center w-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] text-black tracking-[-0.32px] w-full">이번 주에 태그 8개가 쌓였어요!</p>
      <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#b7b7b7] text-[14px] tracking-[-0.42px] w-full">모인 태그로 일요일에 보고서를 드려요</p>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-center justify-center relative shrink-0 w-full" data-name="Container">
      <IconsDesingFlowerFlat />
      <Container />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[15px] text-white tracking-[-0.45px]">태그 쌓으러 가기</p>
    </div>
  );
}

function ButtonSquareButton() {
  return (
    <div className="bg-[#48b2af] h-[48px] relative rounded-[12px] shrink-0 w-full" data-name="Button / Square Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
          <Container2 />
        </div>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[36px] items-start relative shrink-0 w-full">
      <Container1 />
      <ButtonSquareButton />
    </div>
  );
}

function EmptyContent() {
  return (
    <div className="content-stretch flex flex-col items-start pb-0 pt-[48px] px-[20px] relative shrink-0 w-[390px]" data-name="EmptyContent">
      <Frame />
    </div>
  );
}

export default function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start relative size-full" data-name="Container">
      <EmptyContent />
      <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" data-name="Divider" />
    </div>
  );
}