import svgPaths from "@/imports/svg-9sd270pgzn";
import imgThumbnail from "@/assets/7b851936315a0976f82b567082641209095748c5.png";
import { motion } from "motion/react";
import Frame427323235 from "@/imports/Frame427323235";
import ArrowLeft from './ArrowLeft';

interface NadaumTagsProps {
  onBack: () => void;
}

function EmptyContentSection() {
  return (
    <Frame427323235 />
  );
}

function DealCard() {
  return (
    <div className="flex flex-col items-start shrink-0" style={{ width: '200px' }}>
      <div className="flex flex-col items-start w-full" style={{ gap: '8px' }}>
        {/* Thumbnail */}
        <div className="relative shrink-0 w-full" style={{ height: '120px', borderRadius: '12px' }}>
          <img alt="운세 콘텐츠 썸네일" className="absolute inset-0 max-w-none object-cover" style={{ borderRadius: '12px', width: '100%', height: '100%' }} src={imgThumbnail} />
        </div>

        {/* Price Info */}
        <div className="flex flex-col items-end w-full" style={{ gap: '8px' }}>
          <div className="flex flex-col items-start w-full" style={{ gap: '2px' }}>
            {/* Label */}
            <div className="flex items-center justify-center" style={{ padding: '2px 4px 2.5px 4px', borderRadius: '4px', backgroundColor: '#f0f8f8' }}>
              <p style={{ fontSize: '10px', fontWeight: 500, lineHeight: 'normal', color: '#41a09e', fontFamily: 'Pretendard Variable' }}>
                심화 해석판
              </p>
            </div>

            {/* Product Info */}
            <div className="w-full">
              <div className="flex flex-col items-start px-px" style={{ paddingBottom: '2px' }}>
                {/* Title */}
                <div className="w-full" style={{ marginBottom: '-2px' }}>
                  <div className="flex flex-col items-start" style={{ padding: '0 2px' }}>
                    <div className="w-full">
                      <div className="flex flex-col items-start px-px">
                        <p style={{ fontSize: '15px', fontWeight: 500, lineHeight: '25.5px', color: '#000000', letterSpacing: '-0.3px', fontFamily: 'Pretendard Variable' }} className="w-full">
                          혹시 지금 바람 피우고 있을까?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="w-full" style={{ marginBottom: '-2px' }}>
                  <div className="flex flex-col items-start pb-px" style={{ padding: '0 2px' }}>
                    {/* Discount Price */}
                    <div className="flex items-center w-full" style={{ gap: '3px', marginBottom: '-1px' }}>
                      <div className="flex items-center">
                        <div className="flex items-center" style={{ gap: '2px' }}>
                          <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: '20px', color: '#ff6678', letterSpacing: '-0.45px', fontFamily: 'Pretendard Variable' }}>
                            50%
                          </p>
                          <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: '20px', color: '#000000', letterSpacing: '-0.45px', fontFamily: 'Pretendard Variable' }}>
                            12,900원
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center px-px">
                          <div className="flex items-center">
                            <p style={{ fontSize: '13px', fontWeight: 400, lineHeight: '22px', color: '#999999', textDecoration: 'line-through', fontFamily: 'Pretendard Variable' }}>
                              25,800원
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Price */}
                    <div className="flex items-center w-full" style={{ gap: '2px', marginBottom: '-1px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: '25px', color: '#48b2af', letterSpacing: '-0.32px', fontFamily: 'Pretendard Variable' }}>
                        9,900원
                      </p>
                      <p style={{ fontSize: '11px', fontWeight: 500, lineHeight: '16px', color: '#48b2af', fontFamily: 'Pretendard Variable', marginLeft: '2px' }}>
                        쿠폰 적용가
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealCard2() {
  return (
    <div className="flex flex-col items-start shrink-0" style={{ width: '200px' }}>
      <div className="flex flex-col items-start w-full" style={{ gap: '8px' }}>
        {/* Thumbnail */}
        <div className="relative shrink-0 w-full" style={{ height: '120px', borderRadius: '12px' }}>
          <img alt="운세 콘텐츠 썸네일" className="absolute inset-0 max-w-none object-cover" style={{ borderRadius: '12px', width: '100%', height: '100%' }} src={imgThumbnail} />
        </div>

        {/* Price Info */}
        <div className="flex flex-col items-end w-full" style={{ gap: '8px' }}>
          <div className="flex flex-col items-start w-full" style={{ gap: '2px' }}>
            {/* Label */}
            <div className="flex items-center justify-center" style={{ padding: '2px 4px 2.5px 4px', borderRadius: '4px', backgroundColor: '#f0f8f8' }}>
              <p style={{ fontSize: '10px', fontWeight: 500, lineHeight: 'normal', color: '#41a09e', fontFamily: 'Pretendard Variable' }}>
                심화 해석판
              </p>
            </div>

            {/* Product Info */}
            <div className="w-full">
              <div className="flex flex-col items-start px-px" style={{ paddingBottom: '2px' }}>
                {/* Title */}
                <div className="w-full" style={{ marginBottom: '-2px' }}>
                  <div className="flex flex-col items-start" style={{ padding: '0 2px' }}>
                    <div className="w-full">
                      <div className="flex flex-col items-start px-px">
                        <p style={{ fontSize: '15px', fontWeight: 500, lineHeight: '25.5px', color: '#000000', letterSpacing: '-0.3px', fontFamily: 'Pretendard Variable' }} className="w-full">
                          내 연인은 바람기 있을까?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="w-full" style={{ marginBottom: '-2px' }}>
                  <div className="flex flex-col items-start pb-px" style={{ padding: '0 2px' }}>
                    {/* Discount Price */}
                    <div className="flex items-center w-full" style={{ gap: '3px', marginBottom: '-1px' }}>
                      <div className="flex items-center">
                        <div className="flex items-center" style={{ gap: '2px' }}>
                          <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: '20px', color: '#ff6678', letterSpacing: '-0.45px', fontFamily: 'Pretendard Variable' }}>
                            50%
                          </p>
                          <p style={{ fontSize: '15px', fontWeight: 700, lineHeight: '20px', color: '#000000', letterSpacing: '-0.45px', fontFamily: 'Pretendard Variable' }}>
                            12,900원
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center px-px">
                          <div className="flex items-center">
                            <p style={{ fontSize: '13px', fontWeight: 400, lineHeight: '22px', color: '#999999', textDecoration: 'line-through', fontFamily: 'Pretendard Variable' }}>
                              25,800원
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Price */}
                    <div className="flex items-center w-full" style={{ gap: '2px', marginBottom: '-1px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: '25px', color: '#48b2af', letterSpacing: '-0.32px', fontFamily: 'Pretendard Variable' }}>
                        9,900원
                      </p>
                      <p style={{ fontSize: '11px', fontWeight: 500, lineHeight: '16px', color: '#48b2af', fontFamily: 'Pretendard Variable', marginLeft: '2px' }}>
                        쿠폰 적용가
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoreButton() {
  return (
    <div className="flex items-center self-stretch shrink-0">
      <div className="flex h-full items-center justify-center relative shrink-0 overflow-visible" style={{ marginRight: '-20px', padding: '12px', borderRadius: '12px', width: '200px' }}>
        <div aria-hidden="true" className="absolute border border-dashed inset-0 pointer-events-none" style={{ borderColor: '#d4d4d4', borderRadius: '12px' }} />
        <p style={{ fontSize: '15px', fontWeight: 500, lineHeight: '25.5px', color: '#999999', letterSpacing: '-0.3px', fontFamily: 'Pretendard Variable' }}>
          더 볼래요!
        </p>
      </div>
      <div className="flex items-center justify-center shrink-0" style={{ marginRight: '-20px' }}>
        <div className="flex-none" style={{ transform: 'rotate(180deg) scaleY(-1)' }}>
          <div className="relative" style={{ width: '44px', height: '44px' }}>
            <div className="absolute inset-0">
              <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
                <g>
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
                    d={svgPaths.p3bb19300}
                    fill="#D4D4D4"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationSection() {
  return (
    <div className="flex flex-col items-start w-full">
      <div className="w-full" style={{ height: '12px', backgroundColor: '#f9f9f9' }} />
      <div className="flex flex-col items-start w-full" style={{ height: '358px', padding: '36px 20px' }}>
        <div className="flex flex-col items-start w-full" style={{ gap: '8px' }}>
          {/* Section Title */}
          <div className="flex flex-col items-center w-full" style={{ gap: '12px' }}>
            <div className="flex items-center justify-between w-full">
              <p style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', color: '#000000', letterSpacing: '-0.34px', fontFamily: 'Pretendard Variable' }} className="flex-1 text-left">
                태그 쌓기 좋은 운세
              </p>
            </div>
          </div>

          {/* Card Content - Horizontal Scroll */}
          <div
            className="flex items-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x"
            style={{ gap: '12px', width: 'calc(100% + 40px)', margin: '0 -20px', padding: '0 20px', WebkitOverflowScrolling: 'touch' }}
          >
            <DealCard />
            {[...Array(5).keys()].map((i) => (
              <DealCard2 key={i} />
            ))}
            <MoreButton />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopNavigation({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full sticky top-0 z-20" style={{ height: '52px', backgroundColor: '#ffffff' }}>
      <div className="flex flex-col justify-center" style={{ width: '100%', height: '100%' }}>
        <div className="flex flex-col items-start justify-center" style={{ padding: '4px 12px', width: '100%', height: '100%' }}>
          <div className="flex items-center justify-between w-full">
            {/* Left Action - Back Button */}
            <ArrowLeft onClick={onBack} />

            {/* Title */}
            <p style={{ fontSize: '18px', fontWeight: 600, lineHeight: '25.5px', color: '#000000', letterSpacing: '-0.36px', fontFamily: 'Pretendard Variable' }} className="flex-1 text-center overflow-hidden text-ellipsis">
              나다움 태그
            </p>

            {/* Right Action - Home Button */}
            <button className="group flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 active:bg-[#F8F8F8]" style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}>
              <div className="relative shrink-0 transition-transform duration-200 group-active:scale-90" style={{ width: '24px', height: '24px' }}>
                <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <g>
                    <path d={svgPaths.p3d07f180} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    <path d="M12 17.99V14.99" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NadaumTags({ onBack }: NadaumTagsProps) {
  return (
    <div className="relative w-full h-full flex flex-col mx-auto bg-white" style={{ maxWidth: '440px' }}>
      <TopNavigation onBack={onBack} />
      <div className="flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col items-start w-full pt-0" style={{ gap: '40px' }}>
          <EmptyContentSection />
          <RecommendationSection />
        </div>
      </div>
    </div>
  );
}
