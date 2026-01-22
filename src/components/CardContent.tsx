import svgPaths from "@/imports/svg-g7inqw5l9h";
import svgPaths1 from "@/imports/svg-ysqoq72gck";
import imgThumbnail from "figma:asset/7b851936315a0976f82b567082641209095748c5.png";
import { motion } from "motion/react";

function LabelBox() {
  return (
    <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center pb-[2.5px] pt-[2px] px-[4px] relative rounded-[4px] shrink-0" data-name="Label Box">
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 500, fontSize: '10px', lineHeight: 'normal', color: '#41a09e' }} className="relative shrink-0">심화 해석판</p>
    </div>
  );
}

function TitleContainer1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Title Container">
      <div className="content-stretch flex flex-col items-start px-px py-0 relative w-full">
        <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 500, fontSize: '15px', lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#000' }} className="relative shrink-0 w-full">혹시 지금 바람 피우고 있을까?</p>
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
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 700, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px' }} data-name="Discount Price Container">
      <p className="relative shrink-0" style={{ color: '#ff6678' }}>50%</p>
      <p className="relative shrink-0" style={{ color: '#000' }}>12,900원</p>
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
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 400, fontSize: '13px', lineHeight: '22px', color: '#999', textDecoration: 'line-through' }} className="relative shrink-0">25,800원</p>
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
    <div className="content-stretch flex gap-[3px] items-center mb-[-2px] relative shrink-0 w-full">
      <DiscountPriceContainer1 />
      <OriginalPriceContainer2 />
    </div>
  );
}

function CouponPriceContainer() {
  return (
    <div className="content-stretch flex gap-[2px] items-center mb-[-1px] relative shrink-0 w-full" style={{ color: '#48b2af' }} data-name="Coupon Price Container">
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 700, fontSize: '16px', lineHeight: '25px', letterSpacing: '-0.32px' }} className="relative shrink-0">9,900원</p>
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 500, fontSize: '11px', lineHeight: '16px' }} className="relative shrink-0 pl-[2px] pb-[2px]">쿠폰 적용가</p>
    </div>
  );
}

function PriceInfo() {
  return (
    <div className="mb-[-2px] relative shrink-0 w-full" data-name="Price Info">
      <div className="content-stretch flex flex-col items-start pb-[2px] pt-0 px-[2px] relative w-full">
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

function Container4() {
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
      <Container4 />
    </div>
  );
}

function Container5() {
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
      <Container5 />
    </div>
  );
}

function LabelBox1() {
  return (
    <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center pb-[2.5px] pt-[2px] px-[4px] relative rounded-[4px] shrink-0" data-name="Label Box">
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 500, fontSize: '10px', lineHeight: 'normal', color: '#41a09e' }} className="relative shrink-0">심화 해석판</p>
    </div>
  );
}

function TitleContainer3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Title Container">
      <div className="content-stretch flex flex-col items-start px-px py-0 relative w-full">
        <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 500, fontSize: '15px', lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#000' }} className="relative shrink-0 w-full">내 연인은 바람기 있을까?</p>
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
    <div className="content-stretch flex gap-[2px] items-center relative shrink-0" style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 700, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px' }} data-name="Discount Price Container">
      <p className="relative shrink-0" style={{ color: '#ff6678' }}>50%</p>
      <p className="relative shrink-0" style={{ color: '#000' }}>12,900원</p>
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
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 400, fontSize: '13px', lineHeight: '22px', color: '#999', textDecoration: 'line-through' }} className="relative shrink-0">25,800원</p>
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
    <div className="content-stretch flex gap-[3px] items-center mb-[-2px] relative shrink-0 w-full">
      <DiscountPriceContainer3 />
      <OriginalPriceContainer5 />
    </div>
  );
}

function CouponPriceContainer1() {
  return (
    <div className="content-stretch flex gap-[2px] items-center mb-[-1px] relative shrink-0 w-full" style={{ color: '#48b2af' }} data-name="Coupon Price Container">
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 700, fontSize: '16px', lineHeight: '25px', letterSpacing: '-0.32px' }} className="relative shrink-0">9,900원</p>
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 500, fontSize: '11px', lineHeight: '16px' }} className="relative shrink-0 pl-[2px] pb-[2px]">쿠폰 적용가</p>
    </div>
  );
}

function PriceInfo1() {
  return (
    <div className="mb-[-2px] relative shrink-0 w-full" data-name="Price Info">
      <div className="content-stretch flex flex-col items-start pb-[2px] pt-0 px-[2px] relative w-full">
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

function Container6() {
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
      <Container6 />
    </div>
  );
}

function Container7() {
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
      <Container7 />
    </div>
  );
}

function ButtonContainer1() {
  return (
    <div className="content-stretch flex h-full items-center justify-center mr-[-20px] p-[12px] relative rounded-[12px] shrink-0 w-[200px] border border-[#e7e7e7] border-dashed" data-name="Button Container">
      <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontWeight: 500, fontSize: '15px', lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#999999' }} className="relative shrink-0">더 볼래요!</p>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative size-[44px]" data-name="Icons">
      <div className="absolute inset-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
          <g id="Icons">
            <rect fill="white" height="44" width="44" />
            <motion.path
              initial={{ x: 0 }}
              animate={{ x: 2 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 0.5,
                ease: "easeInOut"
              }}
              d={svgPaths1.p3bb19300}
              fill="var(--fill-0, #D4D4D4)"
              id="Vector"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function ButtonMoreViewButton() {
  return (
    <div className="content-stretch flex items-center pl-0 py-0 relative self-stretch shrink-0" data-name="Button / More view Button">
      <ButtonContainer1 />
      <div className="flex items-center justify-center mr-[-20px] relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <Icons1 />
        </div>
      </div>
    </div>
  );
}

export default function CardContent() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full overflow-x-auto scrollbar-hide pb-4" data-name="Card Content">
      <div className="flex gap-[12px] items-start px-[20px]">
        <CardDealCard />
        <CardDealCard1 />
        <CardDealCard />
        <CardDealCard1 />
        <CardDealCard />
        <CardDealCard1 />
        <ButtonMoreViewButton />
      </div>
    </div>
  );
}
