import React, { useState } from 'react';
import { DEV } from '@/lib/env';
import svgPaths from "@/imports/svg-194c2rv4ka";
import ReportWeeklyMemoEdit from '@/components/ReportWeeklyMemoEdit';
// CompletionCoupon, MypageProfile 컴포넌트 삭제됨 - 플레이스홀더로 대체
import ReportWeeklyDetail from '@/components/ReportWeeklyDetail';
import ReportWeeklyTarot from '@/components/ReportWeeklyTarot';
import ReportWeeklyTarotResult from '@/components/ReportWeeklyTarotResult';
import ReportWeeklyMindCare from '@/components/ReportWeeklyMindCare';
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

// --- Icons ---

function ArrowLeftIcon() {
  return (
    <div className="absolute inset-0">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

// --- Sub Components ---

function Toast({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, x: "-50%" }}
      animate={{
        opacity: [0, 1, 1, 1],
        y: [100, 0, 0, 160],
        x: "-50%"
      }}
      transition={{
        delay: 0,
        duration: 2.5,
        times: [0, 0.15, 0.8, 1],
        ease: ["easeOut", "linear", "easeIn"]
      }}
      onAnimationComplete={onComplete}
      className="fixed z-50 flex items-center justify-center left-1/2 whitespace-nowrap shadow-none"
      style={{ backdropFilter: 'blur(15px)', backgroundColor: 'rgba(0,0,0,0.5)', bottom: '30px', padding: '8px 16px 8px 12px', borderRadius: '999px', transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center relative shrink-0" style={{ gap: '8px' }}>
        <div className="relative shrink-0 rounded-full flex items-center justify-center" style={{ width: '24px', height: '24px', backgroundColor: '#46BB6F' }}>
           <Check size={16} color="white" strokeWidth={3} />
        </div>
        <p className="relative shrink-0 text-white" style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, lineHeight: '22px', fontSize: '13px' }}>변경사항이 저장되었어요</p>
      </div>
    </motion.div>
  );
}

function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full" style={{ height: '52px' }}>
      <div className="flex flex-col justify-center size-full">
        <div className="flex items-center justify-between relative size-full" style={{ padding: '4px 12px' }}>
           {/* Left Action */}
           <button
             onClick={onBack}
             className="flex items-center justify-center relative shrink-0 active:bg-gray-100 transition-colors"
             style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}
           >
             <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
               <ArrowLeftIcon />
             </div>
           </button>

           {/* Title */}
           <p className="flex-1 text-center truncate" style={{
             fontFamily: 'Pretendard Variable',
             fontWeight: 600,
             fontSize: '18px',
             lineHeight: '25.5px',
             color: '#000000',
             letterSpacing: '-0.36px'
           }}>
             이번 주 보고서
           </p>

           {/* Right Action (Placeholder) */}
           <div className="flex items-center justify-center relative shrink-0 opacity-0" style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }} />
        </div>
      </div>
    </div>
  );
}

interface TextAreaSectionProps {
  text: string;
  onChange: (val: string) => void;
}

function TextAreaSection({ text, onChange }: TextAreaSectionProps) {
  const maxLength = 120;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= maxLength) {
      onChange(val);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex flex-col w-full" style={{ gap: '12px' }}>
        {/* Header Text */}
        <div className="flex flex-col w-full" style={{ gap: '4px', padding: '0 4px' }}>
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: '24px',
            color: '#000000',
            letterSpacing: '-0.36px'
          }}>이번 주 나에게</p>
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '22px',
            color: '#6d6d6d',
            letterSpacing: '-0.42px'
          }}>한 주 동안 애쓴 당신에게 칭찬 한마디 어때요?</p>
        </div>

        {/* Text Area Box */}
        <div
          className="w-full relative border focus-within:border-[#48b2af] transition-colors duration-200"
          style={{ borderRadius: '20px', padding: '20px 16px', borderColor: '#f9f9f9', backgroundColor: '#f9f9f9' }}
        >
          <div className="flex flex-col w-full" style={{ gap: '12px' }}>
            <textarea
              value={text}
              onChange={handleChange}
              placeholder="마음이 가는대로 적어보세요 :)"
              className="w-full bg-transparent outline-none resize-none placeholder:text-[#999999] placeholder:font-normal"
              style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '25.5px',
                color: '#151515',
                letterSpacing: '-0.3px',
                minHeight: '150px'
              }}
            />

            {/* Character Count */}
            <div className="flex justify-end w-full">
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontSize: '13px',
                lineHeight: '19px',
                letterSpacing: '-0.26px'
              }}>
                <span style={{
                  fontWeight: text.length > 0 ? 600 : 400,
                  color: text.length > 0 ? '#48b2af' : '#999999',
                  transition: 'color 0.2s'
                }}>
                  {text.length}
                </span>
                <span style={{
                  fontWeight: 400,
                  color: '#999999'
                }}>
                  /{maxLength}자
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BottomButtonProps {
  onNext?: () => void;
  isActive: boolean;
}

function BottomButton({ onNext, isActive }: BottomButtonProps) {
  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
         <button
           onClick={isActive ? onNext : undefined}
           disabled={!isActive}
           className={`flex items-center justify-center relative cursor-pointer transition active:scale-[0.99] w-full ${isActive ? 'active:!bg-[#41A09E]' : ''}`}
           style={{
             borderRadius: '16px',
             backgroundColor: isActive ? '#48b2af' : '#f8f8f8',
             height: '56px'
           }}
         >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: isActive ? '#ffffff' : '#b7b7b7',
              letterSpacing: '-0.32px'
            }}>다음</p>
         </button>
      </div>
    </div>
  );
}

// CompletionCoupon, MypageProfile 삭제 대체 플레이스홀더
function PlaceholderView({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }}>
      <TopBar onBack={onBack} />
      <div className="flex-1 flex items-center justify-center">
        <p style={{ fontFamily: 'Pretendard Variable', fontSize: '16px', color: '#999999' }}>
          {title} (준비 중)
        </p>
      </div>
    </div>
  );
}

// Main Component
interface ReportWeeklyMemoProps {
  onBack?: () => void;
  onNext?: () => void;
}

type ViewState = 'input' | 'edit' | 'result' | 'mypage' | 'report' | 'tarotPicking' | 'tarotResult' | 'prescription';

export default function ReportWeeklyMemo({ onBack, onNext }: ReportWeeklyMemoProps) {
  const [text, setText] = useState("");
  const [view, setView] = useState<ViewState>('input');
  const [mypageTab, setMypageTab] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const isActive = text.length > 0;

  // MypageProfile 삭제됨 - 플레이스홀더로 대체
  if (view === 'mypage') {
    return (
      <>
        <PlaceholderView title="마이페이지" onBack={() => setView('result')} />
        <AnimatePresence>
          {showToast && <Toast onComplete={() => setShowToast(false)} />}
        </AnimatePresence>
      </>
    );
  }

  if (view === 'report') {
    return <ReportWeeklyDetail onBack={() => setView('result')} onTarotStart={() => setView('tarotPicking')} />;
  }

  if (view === 'tarotPicking') {
    return <ReportWeeklyTarot onBack={() => setView('report')} onNext={() => setView('tarotResult')} />;
  }

  if (view === 'tarotResult') {
    return <ReportWeeklyTarotResult onBack={() => setView('tarotPicking')} onNext={() => setView('prescription')} />;
  }

  if (view === 'prescription') {
    return <ReportWeeklyMindCare onBack={() => setView('tarotResult')} onPrev={() => setView('tarotResult')} />;
  }

  // CompletionCoupon 삭제됨 - 플레이스홀더로 대체
  if (view === 'result') {
    return (
      <PlaceholderView title="완료/쿠폰" onBack={() => setView('input')} />
    );
  }

  if (view === 'edit') {
    return (
      <ReportWeeklyMemoEdit
        initialText={text}
        onCancel={() => setView('input')}
        onSave={(newText) => {
          setText(newText);
          setMypageTab(1);
          setView('mypage');
          setShowToast(true);
        }}
      />
    );
  }

  return (
    <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }}>
      <TopBar onBack={onBack} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full relative" style={{ paddingBottom: '100px' }}>
        <div className="w-full" style={{ padding: '16px 20px 40px 20px' }}>
          <TextAreaSection text={text} onChange={setText} />

          {/* DEV 버튼 - 개발/스테이징 환경에서만 노출 */}
          {DEV && (
            <button
              onClick={() => setView('edit')}
              className="block ml-auto flex items-center justify-center active:bg-[#e0e0e0] transition-colors"
              style={{ marginTop: '12px', padding: '0 14px', height: '32px', borderRadius: '8px', backgroundColor: '#f5f5f5' }}
            >
               <p style={{
                 fontFamily: 'Pretendard Variable',
                 fontWeight: 400,
                 fontSize: '12px',
                 color: '#999999',
                 letterSpacing: '-0.3px'
               }}>dev 수정 나에게</p>
            </button>
          )}
        </div>
      </div>

      <BottomButton onNext={() => setView('result')} isActive={isActive} />
    </div>
  );
}
