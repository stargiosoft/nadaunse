/**
 * 공통 네비게이션 헤더 컴포넌트
 * - 뒤로가기 버튼 + 중앙 타이틀
 * - 모든 사주 정보 입력/수정 페이지에서 사용
 */

import svgPaths from "../imports/svg-qudhl03d75";

interface NavigationHeaderProps {
  title: string;
  onBack: () => void;
}

export function NavigationHeader({ title, onBack }: NavigationHeaderProps) {
  return (
    <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full max-w-[440px] z-10 bg-white">
      {/* Navigation Bar */}
      <div className="bg-white h-[52px] relative shrink-0 w-full">
        <div className="flex flex-col justify-center size-full">
          <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div 
                onClick={onBack}
                className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer group transition-colors duration-150 ease-out active:bg-gray-100"
              >
                <div className="relative shrink-0 size-[24px] transition-transform duration-150 ease-out group-active:scale-90">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                  </svg>
                </div>
              </div>
              <p className="basis-0 grow leading-[25.5px] font-semibold min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                {title}
              </p>
              <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="h-[8px] shrink-0 w-full" />
    </div>
  );
}