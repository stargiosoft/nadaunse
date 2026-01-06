import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import svgPaths404 from '../imports/svg-wp3v25qh3h';
import svgPaths500 from '../imports/svg-47kifjlpzo';
import svgPaths503 from '../imports/svg-zgc97psg68';
import svgPathsNetwork from '../imports/svg-zdyolmycte';
import { WifiOff, ServerCrash, AlertCircle } from 'lucide-react';

interface ErrorPageProps {
  type: '404' | '500' | '503' | 'network';
}

export default function ErrorPage({ type }: ErrorPageProps) {
  const navigate = useNavigate();

  // 에러 타입별 설정
  const errorConfig = {
    '404': {
      title: '페이지를 찾을 수 없어요',
      description: '주소가 잘못되었거나\n페이지가 변경되었을 수 있어요.',
      buttonText: '홈으로 가기',
      useCustomIcon: true, // Figma SVG 사용
      iconType: '404' as const,
      descriptionColor: '#848484',
    },
    '500': {
      title: '서버에 문제가 발생했어요',
      description: '일시적인 오류가 발생했어요.\n잠시 후 다시 시도해 주세요.',
      leftButtonText: '홈으로 가기',
      rightButtonText: '다시 시도하기',
      useCustomIcon: true, // Figma SVG 사용
      iconType: '500' as const,
      twoButtons: true,
      descriptionColor: '#848484',
    },
    '503': {
      title: '서버가 과부하 상태예요',
      description: '많은 사용자가 접속 중이에요\n잠시 후 다시 시도해 주세요',
      leftButtonText: '홈으로 가기',
      rightButtonText: '다시 시도하기',
      useCustomIcon: true, // Figma SVG 사용
      iconType: '503' as const,
      twoButtons: true,
      descriptionColor: '#848484',
    },
    'network': {
      title: '인터넷 연결이 불안정해요',
      description: '네트워크 연결을 확인한 후\n다시 시도해 주세요',
      leftButtonText: '홈으로 가기',
      rightButtonText: '다시 시도하기',
      useCustomIcon: true, // Figma SVG 사용
      iconType: 'network' as const,
      twoButtons: true,
      descriptionColor: '#848484',
    },
  };

  const config = errorConfig[type];

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleRetryClick = () => {
    window.location.reload();
  };

  const handleButtonClick = () => {
    if (type === '404') {
      navigate('/');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex items-center justify-center">
      <div className="relative w-full max-w-[440px] min-h-screen flex flex-col bg-white">
        
        {/* Main Content - 중앙 정렬 */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center px-[20px]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 1 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.1 },
            },
          }}
        >
          {/* Icon + Text Container */}
          <div className="content-stretch flex flex-col gap-[28px] items-center justify-center w-full max-w-[350px]">
            
            {/* Icon */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
            >
              {config.useCustomIcon ? (
                // Figma SVG 아이콘
                <div className="relative shrink-0 size-[76px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 76 76">
                    <g id="Group">
                      <path 
                        d={config.iconType === '404' ? svgPaths404.p17261880 : config.iconType === '500' ? svgPaths500.p17261880 : config.iconType === '503' ? svgPaths503.p17261880 : svgPathsNetwork.p17261880} 
                        fill="#E4F7F7" 
                        id="Vector" 
                      />
                    </g>
                  </svg>
                  {config.iconType === '404' ? (
                    // 404: 문서 아이콘
                    <div className="absolute aspect-[16/16] left-[21.05%] overflow-clip right-[21.05%] top-[16px]">
                      <div className="absolute inset-[6.25%_12.5%_6.26%_6.25%]">
                        <div className="absolute inset-0">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.75 38.4945">
                            <path d={svgPaths404.p3693cb00} fill="#48B2AF" id="Vector" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : config.iconType === '500' ? (
                    // 500: 구름 + 느낌표 아이콘
                    <div className="absolute aspect-[24/24] left-[15.79%] overflow-clip right-[15.79%] top-1/2 translate-y-[-50%]">
                      <div className="absolute inset-[18.75%_6.29%_18.75%_6.24%]">
                        <div className="absolute inset-0">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45.4828 32.4997">
                            <path clipRule="evenodd" d={svgPaths500.p213c1700} fill="#48B2AF" fillRule="evenodd" id="Vector" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : config.iconType === '503' ? (
                    // 503: 콘(traffic) 아이콘
                    <div className="absolute aspect-[14/14] left-[23.68%] overflow-clip right-[23.68%] top-[calc(50%-1px)] translate-y-[-50%]">
                      <div className="absolute contents inset-[3.79%_0.45%_2.46%_0.44%]">
                        {/* 상단 콘 */}
                        <div className="absolute inset-[3.79%_16%_7.81%_16%]">
                          <div className="absolute inset-0">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27.2 35.3571">
                              <path clipRule="evenodd" d={svgPaths503.p149a6300} fill="#7ED4D2" fillRule="evenodd" id="Vector" />
                            </svg>
                          </div>
                        </div>
                        {/* 하단 콘 */}
                        <div className="absolute inset-[32.14%_0.45%_2.46%_0.44%]">
                          <div className="absolute inset-0">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 39.6457 26.16">
                              <path clipRule="evenodd" d={svgPaths503.p24fdc880} fill="#48B2AF" fillRule="evenodd" id="Vector" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // network: 와이파이 + X 아이콘
                    <div className="absolute aspect-[24/24] left-[18.42%] overflow-clip right-[18.42%] top-1/2 translate-y-[-50%]">
                      <div className="absolute inset-[15.1%_8.33%_10.98%_8.33%]">
                        <div className="absolute inset-[-7.05%_-6.25%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45.0003 40.478">
                            <path 
                              d={svgPathsNetwork.p34b2b380} 
                              id="Vector" 
                              stroke="#48B2AF" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="5" 
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 다른 에러용 Lucide 아이콘
                <div className="relative size-[76px] rounded-full bg-[#E4F7F7] flex items-center justify-center">
                  {config.IconComponent && (
                    <config.IconComponent className="w-[40px] h-[40px] text-[#48B2AF]" strokeWidth={1.5} />
                  )}
                </div>
              )}
            </motion.div>

            {/* Text Container */}
            <div className="content-stretch flex flex-col gap-[12px] items-start w-full">
              
              {/* Title */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
                className="flex flex-col font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[24px] text-black text-center tracking-[-0.48px] w-full"
              >
                <p className="leading-[35.5px]">{config.title}</p>
              </motion.div>

              {/* Description */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
                className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full"
              >
                <div 
                  className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[28.5px] relative shrink-0 text-[16px] text-center text-nowrap tracking-[-0.32px]"
                  style={{ color: config.descriptionColor }}
                >
                  {config.description.split('\n').map((line, index) => (
                    <p key={index} className={index === 0 ? 'mb-0' : ''}>{line}</p>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* DEV 표시 (개발 모드일 때만) */}
          {import.meta.env.DEV && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
              className="mt-[24px] px-[12px] py-[6px] rounded-[8px] bg-red-50 border border-red-200"
            >
              <p className="text-[12px] text-red-600 font-medium">
                [DEV] {type.toUpperCase()} 에러 페이지 미리보기
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Button - 하단 고정 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
          }}
          initial="hidden"
          animate="visible"
          className="content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full"
        >
          <div className="bg-white relative shrink-0 w-full">
            <div className="flex flex-col items-center justify-center size-full">
              <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                {config.twoButtons ? (
                  // 500, 503 에러: 2버튼 레이아웃
                  <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                    {/* 좌측 버튼: 홈으로 가기 */}
                    <button
                      onClick={handleHomeClick}
                      className="basis-0 bg-[#f0f8f8] grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 cursor-pointer border-none transition-all duration-150 active:bg-[#E4F7F7] active:scale-[0.96]"
                    >
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                            <p 
                              className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[#48b2af] text-[16px] text-nowrap tracking-[-0.32px] select-none"
                              style={{ WebkitTouchCallout: 'none' }}
                            >
                              {config.leftButtonText}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* 우측 버튼: 다시 시도하기 */}
                    <button
                      onClick={handleRetryClick}
                      className="basis-0 bg-[#48b2af] grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 cursor-pointer border-none transition-all duration-150 active:bg-[#389998] active:scale-[0.96]"
                    >
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                            <p 
                              className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px] select-none"
                              style={{ WebkitTouchCallout: 'none' }}
                            >
                              {config.rightButtonText}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : (
                  // 나머지 에러: 단일 버튼
                  <button
                    onClick={handleButtonClick}
                    className="bg-[#48b2af] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer border-none transition-all duration-150 active:bg-[#389998] active:scale-[0.96]"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p 
                            className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px] select-none"
                            style={{ WebkitTouchCallout: 'none' }}
                          >
                            {config.buttonText}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}