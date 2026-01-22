import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import svgPaths from '@/imports/svg-rr05b2c3l6';
import Frame427322492 from '@/imports/Frame427322492';
import ReceiveMyAnalysis from '@/components/ReceiveMyAnalysis';
import ArrowLeft from './ArrowLeft';
// NOTE: CompletionCoupon과 MypageProfile은 삭제된 컴포넌트입니다
// import CompletionCoupon from '@/components/CompletionCoupon';
// import MypageProfile from '@/components/MypageProfile';
import ReportWeeklyDetail from '@/components/ReportWeeklyDetail';
import ReportWeeklyTarot from '@/components/ReportWeeklyTarot';
import ReportWeeklyTarotResult from '@/components/ReportWeeklyTarotResult';
import ReportWeeklyMindCare from '@/components/ReportWeeklyMindCare';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

interface TagOption {
  id: string;
  label: string;
  selected: boolean;
}

export default function CheckRecordMe() {
  const [tags, setTags] = useState<TagOption[]>([
    { id: '1', label: '설득력 있는', selected: true },
    { id: '2', label: '리더십 있는', selected: true },
    { id: '3', label: '경쟁심 있는', selected: false },
  ]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [view, setView] = useState<'recording' | 'result' | 'mypage' | 'dev-report' | 'dev-tarot-picking' | 'dev-tarot-result' | 'dev-mind-prescription'>('recording');

  // 휴대폰 번호를 부모 컴포넌트에서 관리하여 바텀 시트가 닫혀도 유지되도록 함
  const [phoneNumber, setPhoneNumber] = useState("");

  const toggleTag = (id: string) => {
    setTags(tags.map(tag =>
      tag.id === id ? { ...tag, selected: !tag.selected } : tag
    ));
  };

  const handleSave = () => {
    setIsBottomSheetOpen(false);
    // 바텀 시트가 닫히는 애니메이션(0.3s)이 끝난 후 화면 전환
    setTimeout(() => {
      setView('result');
    }, 300);
  };

  const handleBack = () => {
    if (view === 'mypage') {
      setView('result');
      return;
    }
    if (view === 'dev-report') {
      setView('result');
      return;
    }
    if (view === 'dev-tarot-picking') {
      setView('dev-report');
      return;
    }
    if (view === 'dev-mind-prescription') {
      setView('dev-tarot-result');
      return;
    }
    if (view === 'dev-tarot-result') {
      setView('dev-tarot-picking');
      return;
    }
    setView('recording');
  };

  const handleHome = () => {
    // 홈으로 가면 초기화 (선택 사항)
    setView('recording');
    setPhoneNumber("");
    setTags(tags.map(t => ({...t, selected: false})));
  };

  // NOTE: MypageProfile 컴포넌트가 삭제되어 임시로 result 화면으로 리다이렉트
  if (view === 'mypage') {
    setView('result');
    return null;
  }

  if (view === 'dev-report') {
    return <ReportWeeklyDetail onBack={handleBack} onTarotStart={() => setView('dev-tarot-picking')} />;
  }

  if (view === 'dev-tarot-picking') {
    return <ReportWeeklyTarot onBack={handleBack} onNext={() => setView('dev-tarot-result')} />;
  }

  if (view === 'dev-tarot-result') {
    return <ReportWeeklyTarotResult onBack={handleBack} onNext={() => setView('dev-mind-prescription')} />;
  }

  if (view === 'dev-mind-prescription') {
    return <ReportWeeklyMindCare onBack={handleBack} onPrev={handleBack} />;
  }

  // NOTE: CompletionCoupon 컴포넌트가 삭제되어 임시 placeholder 표시
  if (view === 'result') {
    return (
      <div className="bg-white relative w-full h-screen flex flex-col items-center justify-center mx-auto" style={{ maxWidth: '440px' }}>
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', color: '#999' }}>
          완료 화면 (CompletionCoupon 컴포넌트 필요)
        </p>
        <button
          onClick={handleHome}
          className="mt-4 px-6 py-3 rounded-xl"
          style={{ backgroundColor: '#48b2af' }}
        >
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', color: '#fff' }}>홈으로</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white relative w-full h-screen flex flex-col mx-auto" style={{ maxWidth: '440px' }}>
      {/* Top Navigation */}
      <div className="bg-white relative shrink-0 w-full">
        <div className="flex flex-col justify-center" style={{ height: '52px' }}>
          <div className="flex items-center justify-between" style={{ padding: '4px 12px' }}>
            {/* Left Action - Back Button */}
            <ArrowLeft onClick={handleBack} />

            {/* Title */}
            <p className="flex-[1_0_0] text-center overflow-hidden text-ellipsis" style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '25.5px',
              color: '#000000',
              letterSpacing: '-0.36px'
            }}>
              나다움 기록하기
            </p>

            {/* Right Action - Home Button */}
            <button
              type="button"
              className="group flex items-center justify-center shrink-0 transition-colors duration-200 active:bg-gray-100"
              style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}
            >
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        <motion.div
          className="flex flex-col w-full mx-auto"
          style={{ gap: '64px', maxWidth: '350px' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05, delayChildren: 0.1 }
            }
          }}
        >
          {/* Header Section */}
          <motion.div
            className="w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
            }}
          >
            <div className="flex flex-col" style={{ gap: '8px', padding: '0 4px' }}>
              <div className="flex flex-col" style={{ gap: '6px' }}>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: '#000000',
                  letterSpacing: '-0.2px'
                }}>
                  현재의
                </p>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 700,
                  fontSize: '20px',
                  lineHeight: '28px',
                  color: '#000000',
                  letterSpacing: '-0.2px'
                }}>
                  내 모습과 가장 가까운 태그는?
                </p>
              </div>
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#999999',
                letterSpacing: '-0.42px'
              }}>
                태그가 모일수록 나에 대한 분석이 더 정확해요!
              </p>
            </div>
          </motion.div>

          {/* Illustration and Tag Options */}
          <motion.div
            className="flex flex-col w-full"
            style={{ gap: '8px' }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 }
              }
            }}
          >
            {/* Illustration */}
            <motion.div
              className="relative shrink-0"
              style={{ height: '96px', width: '150px', overflow: 'hidden' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                }
              }}
            >
              <Frame427322492 />
            </motion.div>

            {/* Tag Options */}
            <motion.div
              className="flex flex-col w-full"
              style={{ gap: '8px', marginTop: '-12px' }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
              {tags.map((tag) => (
                <motion.button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    transformOrigin: 'center center',
                    willChange: 'transform'
                  }}
                  className="group flex items-center w-full"
                  style={{ gap: '16px' }}
                >
                  <div
                    className="flex-1 relative transition-all duration-200 ease-in-out box-border"
                    style={{
                      borderRadius: '16px',
                      backgroundColor: tag.selected ? '#f0f8f8' : '#f8f8f8',
                      // border 대신 box-shadow(inset)을 사용해 레이아웃 흔들림 방지
                      boxShadow: tag.selected ? 'inset 0 0 0 1.5px #48b2af' : 'inset 0 0 0 1.5px transparent'
                    }}
                  >
                    <div className="flex items-center" style={{ padding: '16px 24px' }}>
                      <p className="transition-colors duration-200" style={{
                        fontFamily: 'Pretendard Variable',
                        fontWeight: 400,
                        fontSize: '15px',
                        lineHeight: '25.5px',
                        color: tag.selected ? '#368683' : '#151515',
                        letterSpacing: '-0.3px'
                      }}>
                        {tag.label}
                      </p>
                    </div>
                  </div>

                  <div className="relative shrink-0" style={{ width: '28px', height: '28px' }}>
                    <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
                      <g>
                        <path
                          className="transition-colors duration-200"
                          d={svgPaths.p2249c900}
                          stroke={tag.selected ? '#41A09E' : '#E7E7E7'}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                        />
                      </g>
                    </svg>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Divider and Message */}
          <motion.div
            className="flex items-start justify-center w-full"
            style={{ gap: '12px', marginTop: '-32px', paddingLeft: '3px' }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
            }}
          >
            <div className="relative self-stretch shrink-0" style={{ width: 0 }}>
              <div className="absolute" style={{ inset: '-1.7% -0.75px' }}>
                <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 1.5 45.5">
                  <path d="M0.75 0.75V44.75" stroke="#E7E7E7" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center" style={{ padding: '0 4px' }}>
                <p className="flex-1" style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 400,
                  fontSize: '13px',
                  lineHeight: '22px',
                  color: '#999999'
                }}>
                  내 약함도, 내 강함도 모두 소중한 나예요.
                  <br />
                  그 모습들이 모여 지금의 나를 만들어요.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Button Container */}
      <div className="bg-white relative shrink-0 w-full" style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
        <div className="flex flex-col items-center justify-center" style={{ padding: '12px 20px' }}>
          <div className="flex flex-col w-full" style={{ gap: '8px' }}>
            {/* Primary Button */}
            <button
              onClick={() => setIsBottomSheetOpen(true)}
              disabled={!tags.some(t => t.selected)}
              className={`w-full flex items-center justify-center transition-all ${
                tags.some(t => t.selected)
                  ? 'active:scale-[0.99]'
                  : 'cursor-not-allowed'
              }`}
              style={{
                borderRadius: '16px',
                height: '56px',
                backgroundColor: tags.some(t => t.selected) ? '#48b2af' : '#f8f8f8'
              }}
            >
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '25px',
                color: tags.some(t => t.selected) ? '#ffffff' : '#b7b7b7',
                letterSpacing: '-0.32px'
              }}>
                태그 저장하고 나의 분석 보고서 받기
              </p>
            </button>

            {/* Secondary Button */}
            <button
              className="group flex flex-col items-center justify-center relative self-center transition-colors duration-200 active:bg-gray-100"
              style={{ padding: '0 8px', borderRadius: '12px', height: '34px' }}
            >
              <div className="flex items-center relative shrink-0 w-full justify-center transition-transform duration-200 group-active:scale-95" style={{ gap: '4px' }}>
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '22px',
                  color: '#848484',
                  letterSpacing: '-0.42px'
                }}>
                  다음에 할래요
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <ReceiveMyAnalysis
            onClose={() => setIsBottomSheetOpen(false)}
            onSave={handleSave}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
