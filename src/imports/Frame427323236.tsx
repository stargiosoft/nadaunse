import svgPaths from "./svg-stihufhx0o";
import imgThumbnail from "figma:asset/7b851936315a0976f82b567082641209095748c5.png";

function Group() {
  return (
    <div className="absolute inset-[1.5%_0.02%_1.77%_-0.03%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48.0038 46.4307">
        <g id="Group">
          <path clipRule="evenodd" d={svgPaths.p8ff0d80} fill="var(--fill-0, #F3F3F3)" fillRule="evenodd" id="Vector" />
          <path d={svgPaths.p3195a000} fill="var(--fill-0, #D4D4D4)" id="Vector_2" />
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
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 text-[#b7b7b7] text-center w-full" data-name="Container">
      <p className="css-4hzbpn font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[28.5px] relative shrink-0 text-[16px] tracking-[-0.32px] w-full">{`아직  저장한 태그가 없어요`}</p>
      <p className="css-4hzbpn font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[14px] tracking-[-0.42px] w-full">운세를 볼수록 태그가 쌓여요</p>
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

function Frame2() {
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
      <Frame2 />
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-[390px]" data-name="Container">
      <EmptyContent />
      <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" data-name="Divider" />
    </div>
  );
}

function TitleContainer() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative" data-name="Title Container">
      <p className="css-4hzbpn flex-[1_0_0] font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[24px] min-h-px min-w-px relative text-[17px] text-black tracking-[-0.34px]">태그 쌓기 좋은 운세</p>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <TitleContainer />
    </div>
  );
}

function TextSectionTitle() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-[350px]" data-name="Text / Section Title">
      <Container4 />
    </div>
  );
}

function LabelBox() {
  return (
    <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center pb-[2.5px] pt-[2px] px-[4px] relative rounded-[4px] shrink-0" data-name="Label Box">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#41a09e] text-[10px]">심화 해석판</p>
    </div>
  );
}

function TitleContainer1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Title Container">
      <div className="content-stretch flex flex-col items-start px-px py-0 relative w-full">
        <p className="css-4hzbpn font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full">혹시 지금 바람 피우고 있을까?</p>
      </div>
    </div>
  );
}

function TitleContainer2() {
  return (
    <div className="mb-[-2px] relative shrink-0 w-full" data-name="Title Container">
      <div className="content-stretch flex flex-col items-start px-[2px] py-0 relative w-full">
        <TitleContainer1 />
      </div>
    </div>
  );
}

function DiscountPriceContainer() {
  return (
    <div className="content-stretch flex font-['Pretendard_Variable:Bold',sans-serif] font-bold gap-[2px] items-center leading-[20px] relative shrink-0 text-[15px] tracking-[-0.45px]" data-name="Discount Price Container">
      <p className="css-ew64yg relative shrink-0 text-[#ff6678]">50%</p>
      <p className="css-ew64yg relative shrink-0 text-black">12,900원</p>
    </div>
  );
}

function DiscountPriceContainer1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Discount Price Container">
      <DiscountPriceContainer />
    </div>
  );
}

function OriginalPriceContainer() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Original Price Container">
      <p className="[text-decoration-skip-ink:none] css-ew64yg decoration-solid font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] line-through relative shrink-0 text-[#999] text-[13px]">25,800원</p>
    </div>
  );
}

function OriginalPriceContainer1() {
  return (
    <div className="content-stretch flex items-center px-px py-0 relative shrink-0" data-name="Original Price Container">
      <OriginalPriceContainer />
    </div>
  );
}

function OriginalPriceContainer2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Original Price Container">
      <OriginalPriceContainer1 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[3px] items-center mb-[-1px] relative shrink-0 w-full">
      <DiscountPriceContainer1 />
      <OriginalPriceContainer2 />
    </div>
  );
}

function CouponPriceContainer() {
  return (
    <div className="content-stretch flex gap-[2px] items-center mb-[-1px] relative shrink-0 text-[#48b2af] w-full" data-name="Coupon Price Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[25px] relative shrink-0 text-[16px] tracking-[-0.32px]">9,900원</p>
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[11px]">쿠폰 적용가</p>
    </div>
  );
}

function PriceInfo() {
  return (
    <div className="mb-[-2px] relative shrink-0 w-full" data-name="Price Info">
      <div className="content-stretch flex flex-col items-start pb-px pt-0 px-[2px] relative w-full">
        <Frame />
        <CouponPriceContainer />
      </div>
    </div>
  );
}

function ProductInfo() {
  return (
    <div className="relative shrink-0 w-full" data-name="Product Info">
      <div className="content-stretch flex flex-col items-start pb-[2px] pt-0 px-px relative w-full">
        <TitleContainer2 />
        <PriceInfo />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="Container">
      <LabelBox />
      <ProductInfo />
    </div>
  );
}

function CardPriceBlock() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[200px]" data-name="Card / PriceBlock">
      <Container5 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="h-[120px] pointer-events-none relative rounded-[12px] shrink-0 w-[200px]" data-name="Thumbnail">
        <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full" src={imgThumbnail} />
        <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
      </div>
      <CardPriceBlock />
    </div>
  );
}

function CardDealCard() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Card / Deal Card">
      <Container6 />
    </div>
  );
}

function LabelBox1() {
  return (
    <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center pb-[2.5px] pt-[2px] px-[4px] relative rounded-[4px] shrink-0" data-name="Label Box">
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[normal] relative shrink-0 text-[#41a09e] text-[10px]">심화 해석판</p>
    </div>
  );
}

function TitleContainer3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Title Container">
      <div className="content-stretch flex flex-col items-start px-px py-0 relative w-full">
        <p className="css-4hzbpn font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full">내 연인은 바람기 있을까?</p>
      </div>
    </div>
  );
}

function TitleContainer4() {
  return (
    <div className="mb-[-2px] relative shrink-0 w-full" data-name="Title Container">
      <div className="content-stretch flex flex-col items-start px-[2px] py-0 relative w-full">
        <TitleContainer3 />
      </div>
    </div>
  );
}

function DiscountPriceContainer2() {
  return (
    <div className="content-stretch flex font-['Pretendard_Variable:Bold',sans-serif] font-bold gap-[2px] items-center leading-[20px] relative shrink-0 text-[15px] tracking-[-0.45px]" data-name="Discount Price Container">
      <p className="css-ew64yg relative shrink-0 text-[#ff6678]">50%</p>
      <p className="css-ew64yg relative shrink-0 text-black">12,900원</p>
    </div>
  );
}

function DiscountPriceContainer3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Discount Price Container">
      <DiscountPriceContainer2 />
    </div>
  );
}

function OriginalPriceContainer3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Original Price Container">
      <p className="[text-decoration-skip-ink:none] css-ew64yg decoration-solid font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] line-through relative shrink-0 text-[#999] text-[13px]">25,800원</p>
    </div>
  );
}

function OriginalPriceContainer4() {
  return (
    <div className="content-stretch flex items-center px-px py-0 relative shrink-0" data-name="Original Price Container">
      <OriginalPriceContainer3 />
    </div>
  );
}

function OriginalPriceContainer5() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Original Price Container">
      <OriginalPriceContainer4 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[3px] items-center mb-[-1px] relative shrink-0 w-full">
      <DiscountPriceContainer3 />
      <OriginalPriceContainer5 />
    </div>
  );
}

function CouponPriceContainer1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center mb-[-1px] relative shrink-0 text-[#48b2af] w-full" data-name="Coupon Price Container">
      <p className="css-ew64yg font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[25px] relative shrink-0 text-[16px] tracking-[-0.32px]">9,900원</p>
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[11px]">쿠폰 적용가</p>
    </div>
  );
}

function PriceInfo1() {
  return (
    <div className="mb-[-2px] relative shrink-0 w-full" data-name="Price Info">
      <div className="content-stretch flex flex-col items-start pb-px pt-0 px-[2px] relative w-full">
        <Frame1 />
        <CouponPriceContainer1 />
      </div>
    </div>
  );
}

function ProductInfo1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Product Info">
      <div className="content-stretch flex flex-col items-start pb-[2px] pt-0 px-px relative w-full">
        <TitleContainer4 />
        <PriceInfo1 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full" data-name="Container">
      <LabelBox1 />
      <ProductInfo1 />
    </div>
  );
}

function CardPriceBlock1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[200px]" data-name="Card / PriceBlock">
      <Container7 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="h-[120px] pointer-events-none relative rounded-[12px] shrink-0 w-[200px]" data-name="Thumbnail">
        <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full" src={imgThumbnail} />
        <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
      </div>
      <CardPriceBlock1 />
    </div>
  );
}

function CardDealCard1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Card / Deal Card">
      <Container8 />
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="content-stretch flex h-full items-center justify-center mr-[-20px] p-[12px] relative rounded-[12px] shrink-0 w-[200px]" data-name="Button Container">
      <div aria-hidden="true" className="absolute border border-[#d4d4d4] border-dashed inset-[-0.5px] pointer-events-none rounded-[12.5px]" />
      <p className="css-ew64yg font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[#999] text-[15px] tracking-[-0.3px]">더 볼래요!</p>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative size-[44px]" data-name="Icons">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
          <g id="Icons">
            <rect fill="white" height="44" width="44" />
            <path d={svgPaths.p3bb19300} fill="var(--fill-0, #D4D4D4)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function ButtonMoreViewButton() {
  return (
    <div className="content-stretch flex items-center pl-0 pr-[20px] py-0 relative self-stretch shrink-0" data-name="Button / More view Button">
      <ButtonContainer />
      <div className="flex items-center justify-center mr-[-20px] relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <Icons />
        </div>
      </div>
    </div>
  );
}

function CardContent() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Card Content">
      {[...Array(4).keys()].map((_, i) => (
        <CardDealCard key={i} />
      ))}
      {[...Array(5).keys()].map((_, i) => (
        <CardDealCard1 key={i} />
      ))}
      <ButtonMoreViewButton />
    </div>
  );
}

function CardContainer() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[350px]" data-name="Card Container">
      <TextSectionTitle />
      <CardContent />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-center pb-0 pt-[36px] px-0 relative shrink-0 w-full" data-name="Container">
      <CardContainer />
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full">
      <Container3 />
      <Container9 />
    </div>
  );
}