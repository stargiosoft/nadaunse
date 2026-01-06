import { motion } from 'motion/react';
import svgPaths from "../imports/svg-62zqfbjobu";

interface PurchaseFailureProps {
  onRetry?: () => void;
  onBack?: () => void;
}

export default function PurchaseFailure({ onRetry, onBack }: PurchaseFailureProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // 기본 동작: 뒤로 가기
      window.history.back();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] min-w-[320px] relative">
        {/* Top Navigation */}
        <div className="bg-white h-[52px] relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] w-full max-w-[440px] h-[52px]">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                {/* Left Action - Back Button */}
                <motion.button
                  onClick={handleBack}
                  className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] bg-transparent border-none cursor-pointer"
                  initial="rest"
                  whileTap="pressed"
                  variants={{
                    rest: { backgroundColor: "transparent" },
                    pressed: { backgroundColor: "#f3f4f6" }
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="relative shrink-0 size-[24px]"
                    variants={{
                      rest: { scale: 1 },
                      pressed: { scale: 0.9 }
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute contents inset-0">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                        <g id="arrow-left">
                          <path d={svgPaths.p2a5cd480} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                        </g>
                      </svg>
                    </div>
                  </motion.div>
                </motion.button>

                {/* Right Action - Invisible for spacing */}
                <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <motion.div 
          className="absolute content-stretch flex flex-col gap-[28px] items-center justify-center left-1/2 top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-40px)] max-w-[350px] px-[20px]"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
        >
          {/* Icon - Alert Circle */}
          <motion.div 
            className="relative shrink-0 size-[76px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 76 76">
              <g id="Icons">
                <path d={svgPaths.p17261880} fill="var(--fill-0, #E4F7F7)" id="Vector" />
                <path d={svgPaths.p2daf6d00} fill="var(--fill-0, #48B2AF)" id="Vector_2" />
              </g>
            </svg>
          </motion.div>

          {/* Text Content */}
          <motion.div 
            className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            {/* Main Title */}
            <div className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[24px] leading-[35.5px] text-center w-full">구매를 실패했어요</div>

            {/* Sub Text */}
            <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
              <div className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[28.5px] relative shrink-0 text-[#6d6d6d] text-[16px] text-center tracking-[-0.32px]">
                <p className="mb-0">네트워크나 결제 수단을 확인한 뒤</p>
                <p>다시 시도해 보실래요?</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] z-10">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                  <motion.button
                    onClick={handleRetry}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.1 }}
                    className="bg-[#48b2af] active:bg-[#3a9693] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer border-none transition-colors"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">
                            다시 구매하기
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}