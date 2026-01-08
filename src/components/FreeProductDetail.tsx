import { useState, useRef } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { ShowMoreButton } from './FreeContentDetailComponents';
import svgPaths from "../imports/svg-pln046rtst";
import svgPathsBanner from "../imports/svg-1j0aq37vhy";
import svgPathsSlider from "../imports/svg-4heccierrk";
import bannerImg from "figma:asset/b236509a5f2172bc63b883ba8abf132659ed54d9.png";
import img from "figma:asset/7b851936315a0976f82b567082641209095748c5.png";

interface Product {
  id: number | string;  // ⭐️ UUID 지원을 위해 string 추가
  title: string;
  type: 'free' | 'paid';
  category: string;
  image: string;
  description?: string;
  fullDescription: string;
  price: number;
  discountPrice: number;
  discountPercent: number;
}

interface FreeProductDetailProps {
  product: Product;
  onBack: () => void;
  onProductClick?: (productId: number) => void;
  onBannerClick?: () => void;
  recommendedProducts?: Product[];
  onPurchase?: () => void;  // ✅ 파라미터 없이 변경
}

function Notch() {
  return (
    <div className="absolute h-[30px] left-[103px] top-[-2px] w-[183px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 183 30">
        <g id="Notch">
          <path d={svgPaths.pf91bfc0} fill="var(--fill-0, black)" />
        </g>
      </svg>
    </div>
  );
}

function RightSide() {
  return (
    <div className="absolute h-[11.336px] right-[14.67px] top-[17.33px] w-[66.662px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 67 12">
        <g id="Right Side">
          <g id="Battery">
            <path d={svgPaths.p3c576cf0} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, black)" />
            <path d={svgPaths.p1667d738} fill="var(--fill-0, black)" id="Combined Shape" opacity="0.4" />
            <path d={svgPaths.p18fdac00} fill="var(--fill-0, black)" />
          </g>
          <path d={svgPaths.p344d52f0} fill="var(--fill-0, black)" id="Wifi" />
          <path d={svgPaths.p3694c600} fill="var(--fill-0, black)" id="Mobile Signal" />
        </g>
      </svg>
    </div>
  );
}

function Time() {
  return (
    <div className="absolute h-[21px] left-[21px] top-[12px] w-[54px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 54 21">
        <g id="Time">
          <g id="9:41">
            <path d={svgPaths.p24372f50} fill="var(--fill-0, black)" />
            <path d={svgPaths.p3aa84e00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p2e6b3780} fill="var(--fill-0, black)" />
            <path d={svgPaths.p12b0b900} fill="var(--fill-0, black)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function HomeIndicatorLight() {
  return (
    <div className="bg-white h-[28px] relative shrink-0 w-full">
      <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" />
    </div>
  );
}

export default function FreeProductDetail({ product, onBack, onProductClick, onBannerClick, recommendedProducts = [], onPurchase }: FreeProductDetailProps) {
  const [visibleCards, setVisibleCards] = useState(6);
  const [scrollPosition, setScrollPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 [FreeProductDetail] 컴포넌트 렌더링');
  console.log('📌 [FreeProductDetail] product:', product);
  console.log('📌 [FreeProductDetail] product.id:', product.id);
  console.log('📌 [FreeProductDetail] product.type:', product.type);
  console.log('📌 [FreeProductDetail] product.description:', product.description?.substring(0, 50));
  console.log('📌 [FreeProductDetail] onPurchase 존재:', !!onPurchase);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const handleScroll = (direction: 'left' | 'right') => {
    const cardWidth = 212; // 200px + 12px gap
    const container = document.getElementById('slider-container');
    if (!container) return;
    
    const newPosition = direction === 'right' 
      ? Math.min(scrollPosition + cardWidth, (recommendedProducts.length - 1) * cardWidth)
      : Math.max(scrollPosition - cardWidth, 0);
    
    setScrollPosition(newPosition);
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  const showMoreCards = () => {
    setVisibleCards(prev => prev + 6);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    sliderRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (sliderRef.current) {
        sliderRef.current.style.cursor = 'grab';
      }
    }
  };

  const visibleRecommendedProducts = recommendedProducts.slice(0, visibleCards);
  const hasMoreCards = visibleCards < recommendedProducts.length;

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[390px] relative">
        {/* Top Navigation */}
        <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full max-w-[390px] z-10 bg-white">
          
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white h-[52px] relative shrink-0 w-full">
              <div className="flex flex-col justify-center size-full">
                <div className="box-border content-stretch flex flex-col gap-[10px] h-[52px] items-start justify-center px-[12px] py-[4px] relative w-full">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <div 
                      onClick={onBack}
                      className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer"
                    >
                      <ArrowLeft className="w-6 h-6 text-[#848484]" />
                    </div>
                    <p className="basis-0 font-semibold grow leading-[25.5px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                      {product.title}
                    </p>
                    <div 
                      onClick={onBack}
                      className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer"
                    >
                      <Home className="w-6 h-6 text-[#848484]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-[99px] pb-[120px]">
          {/* Product Image & Info */}
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
            <div className="aspect-[391/270] relative shrink-0 w-full">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={product.image} />
            </div>
            <div className="relative shrink-0 w-full">
              <div className="flex flex-col items-end size-full">
                <div className="box-border content-stretch flex flex-col gap-[16px] items-end px-[20px] py-0 relative w-full">
                  <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                      <div className="bg-[#f9f9f9] box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[8px] shrink-0">
                        <p className="font-medium leading-[16px] not-italic relative shrink-0 text-[#848484] text-[12px] text-nowrap tracking-[-0.24px] whitespace-pre">
                          무료 체험판
                        </p>
                      </div>
                      <div className="relative shrink-0 w-full">
                        <div className="size-full">
                          <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[2px] py-0 relative w-full">
                            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                              <p className="font-semibold leading-[24px] not-italic relative shrink-0 text-[18px] text-black tracking-[-0.36px] w-full">{product.title}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f9f9f9] h-[12px] w-full my-[52px]" />

          {/* Description Section */}
          <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[20px] py-0 relative shrink-0 w-full mb-[28px]">
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
              <div className="relative shrink-0 w-full">
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                    <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                      <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">운세 설명</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="relative shrink-0 w-full">
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                      <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                        {product.fullDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f9f9f9] h-[12px] w-full mb-[52px]" />

          {/* Fortune Composition List - 운세 구성 */}
          <div className="bg-white box-border content-stretch flex flex-col gap-[12px] items-start px-[20px] py-0 relative shrink-0 w-full mb-[52px]">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                  <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">운세 구성</p>
                </div>
              </div>

              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                {[
                  '앞으로 이 관계는 안정적으로 이어질까, 흔들리게 될까?',
                  '의심과 불안을 줄이고 사랑을 지켜내려면 어떻게 해야 할까?',
                  '지금 그의 마음은 나에게 머물고 있을까, 다른 곳을 향하고 있을까?'
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                        <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
                          <ul className="[white-space-collapse:collapse] block font-medium leading-[0] not-italic relative shrink-0 text-[#999999] text-[16px] text-nowrap tracking-[-0.32px]">
                            <li className="ms-[24px]">
                              <span className="leading-[28.5px] text-[16px]">&nbsp;</span>
                            </li>
                          </ul>
                          <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
                            <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0 w-full">
                              <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">{item}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {idx < 2 && (
                      <div className="h-0 relative shrink-0 w-full my-[12px]">
                        <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                            <path d="M0 0.5H350" stroke="#F3F3F3" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advertisement Banner */}
          <div className="bg-[#f8f8f8] box-border content-stretch flex flex-col gap-[10px] items-start p-[20px] relative shrink-0 w-full mb-[52px]">
            <div 
              onClick={onBannerClick}
              className="bg-white relative rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] shrink-0 w-full cursor-pointer"
            >
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[28px] items-center px-[20px] py-[12px] relative w-full">
                  <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
                    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px not-italic relative shrink-0">
                      <p className="font-semibold leading-[23.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px] w-full">월급쟁이에서 벗어나, 대박의 길로</p>
                      <p className="font-normal leading-[19px] relative shrink-0 text-[#848484] text-[13px] tracking-[-0.26px] w-full">퇴사 후 대박 터질 타이밍 알려드립니다.</p>
                    </div>
                    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
                      <div className="h-[60px] relative shrink-0 w-[78px]">
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <img alt="" className="absolute h-[109.46%] left-[-135.91%] max-w-none top-[-5.41%] w-[235.36%]" src={bannerImg} />
                        </div>
                      </div>
                      <div className="relative shrink-0 size-[16px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                          <g id="arrow-right">
                            <path d={svgPathsBanner.p232a3c80} stroke="var(--stroke-0, #999999)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Products Section - 이런 운세는 어때요? */}
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full px-[20px] mb-[52px]">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">이런 운세는 어때요?</p>
              </div>
            </div>
            
            <div className="relative w-full">
              <div
                ref={sliderRef}
                id="slider-container"
                className="flex gap-[12px] overflow-x-auto pb-[4px] -mx-[20px] px-[20px] items-stretch"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {visibleRecommendedProducts.map((recProduct, index) => (
                  <button
                    key={recProduct.id}
                    onClick={() => onProductClick?.(recProduct.id)}
                    className="flex-none w-[200px] cursor-pointer text-left"
                  >
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                      <div className="h-[120px] pointer-events-none relative rounded-[12px] shrink-0 w-[200px]">
                        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[12px] size-full" src={recProduct.image} />
                        <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
                      </div>
                      <div className="content-stretch flex flex-col gap-[12px] items-end relative shrink-0 w-[200px]">
                        <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                          <div className="bg-[#f0f8f8] box-border content-stretch flex gap-[10px] items-center justify-center px-[6px] py-[2px] relative rounded-[4px] shrink-0">
                            <p className="font-medium leading-[16px] not-italic relative shrink-0 text-[#41a09e] text-[12px] text-nowrap tracking-[-0.24px] whitespace-pre">심화 해석판</p>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                            <div className="relative shrink-0 w-full">
                              <div className="size-full">
                                <div className="box-border content-stretch flex flex-col items-start px-px py-0 relative w-full">
                                  <p className="font-medium leading-[23.5px] not-italic relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full">{recProduct.title}</p>
                                </div>
                              </div>
                            </div>
                            <div className="relative shrink-0 w-full">
                              <div className="size-full">
                                <div className="box-border content-stretch flex flex-col gap-[2px] items-start px-[2px] py-0 relative w-full">
                                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                    <div className="box-border content-stretch flex gap-[8px] items-center px-px py-0 relative shrink-0">
                                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                        <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid font-normal leading-[22px] line-through not-italic relative shrink-0 text-[#999999] text-[13px] text-nowrap whitespace-pre">{recProduct.price.toLocaleString()}원</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0 w-full">
                                    <div className="content-stretch flex font-bold gap-[2px] items-center leading-[20px] not-italic relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px] whitespace-pre">
                                      <p className="relative shrink-0 text-[#ff6678]">{recProduct.discountPercent}%</p>
                                      <p className="relative shrink-0 text-black">{recProduct.discountPrice.toLocaleString()}원</p>
                                    </div>
                                  </div>
                                  <div className="content-stretch flex gap-[2px] items-center not-italic relative shrink-0 text-[#48b2af] text-nowrap w-full whitespace-pre">
                                    <p className="font-bold leading-[25px] relative shrink-0 text-[16px] tracking-[-0.32px]">9,900원</p>
                                    <p className="font-medium leading-[16px] relative shrink-0 text-[11px]">쿠폰 적용가</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                
                {hasMoreCards && (
                  <ShowMoreButton onClick={showMoreCards} />
                )}
              </div>
            </div>
          </div>


        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 box-border content-stretch flex flex-col items-start left-1/2 shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] translate-x-[-50%] w-full max-w-[390px] z-10">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[20px] py-[12px] relative w-full">
                  <div 
                    onClick={() => {
                      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                      console.log('🆓 [FreeProductDetail] "무료로 풀이받기" 버튼 클릭');
                      console.log('📌 [FreeProductDetail] product:', product);
                      console.log('📌 [FreeProductDetail] product.id:', product.id);
                      console.log('📌 [FreeProductDetail] product.type:', product.type);
                      console.log('📌 [FreeProductDetail] onPurchase:', onPurchase);
                      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                      if (onPurchase) {
                        onPurchase();  // ✅ 파라미터 없이 호출
                      }
                    }}
                    className="bg-[#48b2af] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="box-border content-stretch flex gap-[10px] h-[56px] items-center justify-center px-[12px] py-0 relative w-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-medium leading-[25px] not-italic relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px] whitespace-pre">무료로 보기</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <HomeIndicatorLight />
        </div>
      </div>
    </div>
  );
}