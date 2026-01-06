import svgPaths from "../imports/svg-ir0ch2bhrx";

interface BottomNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onToggleList: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  nextLabel?: string;
  showHomeIndicator?: boolean;
  disableShadow?: boolean;
}

function HomeIndicatorLight() {
  return (
    <div className="bg-white h-[28px] relative shrink-0 w-full">
      <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" />
    </div>
  );
}

export function BottomNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onToggleList,
  disablePrevious = false,
  disableNext = false,
  nextLabel = "다음",
  showHomeIndicator = false,
  disableShadow = false
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-10">
      <div className={`bg-white border-t border-[#f3f3f3] ${disableShadow ? '' : 'shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)]'}`}>
        <div className="h-[68px] px-[20px] py-[12px] pt-[12px] pr-[20px] pb-[20px] pl-[20px]">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between w-full">
            {/* Left: Page Indicator */}
            <div className="flex gap-[1.5px] items-center">
              <button
                onClick={onToggleList}
                className="group flex items-center justify-center p-[4px] rounded-[8px] size-[36px] cursor-pointer transition-colors duration-200 active:bg-gray-100"
              >
                <div className="flex items-center justify-center w-full h-full transition-transform duration-200 group-active:scale-90">
                  <svg width="20" height="20" viewBox="0 0 18 13" fill="none">
                    <path d={svgPaths.p14150900} fill="#848484" />
                    <path clipRule="evenodd" d={svgPaths.p5097a80} fill="#848484" fillRule="evenodd" />
                  </svg>
                </div>
              </button>
              <p className="font-['Pretendard_Variable:Medium',sans-serif] pt-[1px] font-medium text-[15px] leading-[23.5px] tracking-[-0.3px]">
                <span className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[#151515]">
                  {String(currentStep).padStart(2, '0')}/
                </span>
                <span className="text-[#b7b7b7]"> {String(totalSteps).padStart(2, '0')}</span>
              </p>
            </div>

            {/* Right: Navigation Buttons */}
            <div className="flex gap-[10px] items-center">
              {/* Previous Button */}
              <button
                onClick={onPrevious}
                disabled={disablePrevious}
                className="flex gap-[4px] items-center h-[34px] px-[8px] rounded-[12px] disabled:opacity-30 hover:bg-gray-100 active:bg-gray-100 active:scale-95 transition-all duration-200"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d={svgPaths.p2679d700}
                    stroke="black"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    strokeWidth="1.7"
                  />
                </svg>
                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[14px] leading-[22px] tracking-[-0.42px] text-black">
                  이전
                </p>
              </button>

              {/* Divider */}
              <div className="h-[12px] w-0 border-l border-[#e7e7e7]" />

              {/* Next Button */}
              <button
                onClick={onNext}
                disabled={disableNext}
                className="flex gap-[4px] items-center h-[34px] px-[8px] rounded-[12px] hover:bg-gray-100 active:bg-gray-100 active:scale-95 transition-all duration-200 disabled:opacity-30"
              >
                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[14px] leading-[22px] tracking-[-0.42px] text-black">
                  {nextLabel}
                </p>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d={svgPaths.p3117bd00}
                    stroke="black"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeMiterlimit="10"
                    strokeWidth="1.7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {showHomeIndicator && <HomeIndicatorLight />}
      </div>
    </div>
  );
}
