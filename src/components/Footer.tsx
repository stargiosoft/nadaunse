import svgPaths from "../imports/svg-s2gqe9one3";

interface FooterProps {
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

function CommonLogo() {
  return (
    <div className="h-[20px] relative shrink-0 w-[59px]" data-name="Common / Logo">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 59 20">
        <g id="Common / Logo">
          <path d={svgPaths.p1fb34640} fill="var(--fill-0, #151515)" id="Vector" />
          <path d={svgPaths.p1bbbb200} fill="var(--fill-0, #151515)" id="Vector_2" />
          <path d={svgPaths.p11620600} fill="var(--fill-0, #151515)" id="Vector_3" />
          <path d={svgPaths.p9a70500} fill="var(--fill-0, #151515)" id="Vector_4" />
          <path d={svgPaths.p115ca080} fill="var(--fill-0, #151515)" id="Vector_5" />
          <path d={svgPaths.pb2cf980} fill="var(--fill-0, #151515)" id="Vector_6" />
          <path d={svgPaths.p211e0700} fill="var(--fill-0, #151515)" id="Vector_7" />
          <path d={svgPaths.p3088fdc0} fill="var(--fill-0, #151515)" id="Vector_8" />
          <path d={svgPaths.p2e718980} fill="var(--fill-0, #151515)" id="Vector_9" />
          <path d={svgPaths.p15169200} fill="var(--fill-0, #151515)" id="Vector_10" />
        </g>
      </svg>
    </div>
  );
}

export default function Footer({ onNavigateToTerms, onNavigateToPrivacy }: FooterProps) {
  return (
    <div className="bg-[#f9f9f9] relative w-full" data-name="Footer">
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pt-[32px] px-[20px] pb-[32px] mb-0 relative w-full">
          <div className="content-stretch flex flex-col gap-[0px] items-start relative shrink-0 w-full">
            {/* Logo and company info */}
            <div className="relative shrink-0 w-full">
              <div className="size-full">
                <div className="content-stretch flex flex-col gap-[12px] items-start py-0 pl-[8px] relative w-full">
                  <CommonLogo />
                  <div className="content-stretch flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal gap-[4px] items-start leading-[19px] relative shrink-0 text-[#6d6d6d] text-[13px] tracking-[-0.26px] w-full">
                    <p className="relative shrink-0 w-full">Copyright 2025@Stargiosoft All Rights Reserved.</p>
                    <p className="relative shrink-0 w-full">대표자 서지현 | 사업자등록번호 827-88-01815</p>
                    <p className="relative shrink-0 w-full">통신판매업번호 2024-서울영등포-2084</p>
                    <p className="relative shrink-0 w-full">서울시 영등포구 양평로 149, 1507호</p>
                    <p className="relative shrink-0 w-full">문의 stargiosoft2@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Privacy links */}
            <div className="content-stretch flex gap-[0px] items-center relative shrink-0 -mt-[2px]">
              <button
                onClick={onNavigateToTerms}
                className="content-stretch flex flex-col h-[30px] items-center justify-center relative rounded-[12px] shrink-0 cursor-pointer active:bg-[#E7E7E7]"
                style={{ padding: '0 6px' }}
              >
                <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
                  <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] text-nowrap tracking-[-0.42px]">
                    이용약관
                  </p>
                </div>
              </button>
              
              <div className="h-[8px] relative shrink-0 w-0">
                <div className="absolute inset-[-6.25%_-0.5px]" style={{ "--stroke-0": "rgba(212, 212, 212, 1)" } as React.CSSProperties}>
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 9">
                    <path d="M0.5 0.5V8.5" id="Vector 65" stroke="var(--stroke-0, #D4D4D4)" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              
              <button
                onClick={onNavigateToPrivacy}
                className="content-stretch flex flex-col h-[30px] items-center justify-center relative rounded-[12px] shrink-0 cursor-pointer transition-colors active:bg-[#E7E7E7]"
                style={{ padding: '0 6px' }}
              >
                <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
                  <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[22px] relative shrink-0 text-[#848484] text-[14px] text-nowrap tracking-[-0.42px]">
                    개인정보 처리방침
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}