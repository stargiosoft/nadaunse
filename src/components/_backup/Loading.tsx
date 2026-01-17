import svgPaths from "../imports/svg-55cvaxi2df";
import { X } from 'lucide-react';

interface LoadingProps {
  name: string;
}

type ButtonIconButtonProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  state?: "Default" | "Pressed (Scale Down)" | "Disabled";
};

function ButtonIconButton({ className, size = "xs", state = "Default" }: ButtonIconButtonProps) {
  // Simplified version since we're not using all variants
  return (
    <div className={className} data-name={`Size=${size}, State=${state}`}>
      <div className="relative shrink-0 size-[24px]" data-name="Icons">
        <div className="absolute contents inset-0" data-name="Box">
        </div>
      </div>
    </div>
  );
}

// Simplified Status Bar that just renders the SVG
function IndependentIPhoneStatusBar() {
  return (
    <div className="bg-white h-[47px] overflow-clip relative shrink-0 w-[390px]">
       <div className="absolute h-[30px] left-[103px] top-[-2px] w-[183px]" data-name="Notch">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 183 30">
            <g id="Notch">
              <path d={svgPaths.pf91bfc0} fill="var(--fill-0, black)" id="Notch_2" />
            </g>
          </svg>
        </div>
        <div className="absolute h-[11.336px] right-[14.67px] top-[17.33px] w-[66.662px]" data-name="Right Side">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 67 12">
            <g id="Right Side">
              <g id="Battery">
                <path d={svgPaths.p21180080} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, black)" />
                <path d={svgPaths.p39d1ca00} fill="var(--fill-0, black)" id="Combined Shape" opacity="0.4" />
                <path d={svgPaths.p3a294980} fill="var(--fill-0, black)" id="Rectangle_2" />
              </g>
              <path d={svgPaths.p3ce0f00} fill="var(--fill-0, black)" id="Wifi" />
              <path d={svgPaths.p349d7c60} fill="var(--fill-0, black)" id="Mobile Signal" />
            </g>
          </svg>
        </div>
        <div className="absolute contents left-[21px] top-[12px]" data-name="Left Side">
          <div className="absolute h-[21px] left-[21px] top-[12px] w-[54px]" data-name="Time">
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
        </div>
    </div>
  );
}

export default function Loading({ name }: LoadingProps) {
  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center items-center">
       <div className="w-full max-w-[390px] h-screen relative bg-white flex flex-col">
        {/* Top Navigation */}
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full z-10 bg-white">
            <IndependentIPhoneStatusBar />
            <div className="bg-white h-[52px] relative shrink-0 w-full" data-name="Navigation / Top Bar">
            <div className="flex flex-col justify-center size-full">
                <div className="content-stretch flex flex-col h-[52px] items-start justify-center px-[12px] py-[4px] relative w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
                    <div className="size-[44px]" />
                    <p className="[white-space-collapse:collapse] basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">상세 풀이</p>
                    <div className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px]" data-name="Right Action">
                    <div className="relative shrink-0 size-[24px]" data-name="Icons">
                        <X className="text-[#868686] w-[24px] h-[24px]" strokeWidth={1.8} />
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        
        {/* Loading Content */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-[100px]">
            <div className="content-stretch flex flex-col gap-[44px] items-center w-[350px]">
            <div className="h-[10px] relative shrink-0 w-[40px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 10">
                <g id="Frame 427321712">
                    <circle cx="5" cy="5" fill="#E4F7F7" id="Ellipse 1" r="5" className="animate-pulse" style={{ animationDelay: '0s' }} />
                    <circle cx="20" cy="5" fill="#7ED4D2" id="Ellipse 3" r="5" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <circle cx="35" cy="5" fill="#48B2AF" id="Ellipse 2" r="5" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
                </g>
                </svg>
            </div>
            <div className="content-stretch flex flex-col font-['Pretendard_Variable:Bold',sans-serif] font-bold gap-[4px] items-start leading-[0] relative shrink-0 text-[22px] text-black text-center tracking-[-0.22px] w-full">
                <div className="flex flex-col justify-center relative shrink-0 w-full">
                <p className="leading-[32.5px]">{name}님의</p>
                </div>
                <div className="flex flex-col justify-center relative shrink-0 w-full">
                <p className="leading-[32.5px]">운세를 분석중이에요!</p>
                </div>
            </div>
            </div>
        </div>

        {/* Home Indicator */}
        <div className="fixed bottom-0 content-stretch flex flex-col items-start left-1/2 overflow-clip translate-x-[-50%] w-[390px] z-10">
            <div className="h-[28px] relative shrink-0 w-full bg-white" data-name="Home Indicator/Light">
            <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" data-name="Home Indicator" />
            </div>
        </div>
      </div>
    </div>
  );
}