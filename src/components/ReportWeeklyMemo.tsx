import React, { useState, useEffect } from 'react';
import svgPaths from "@/imports/svg-194c2rv4ka";
import ReportWeeklyMemoEdit from '@/components/ReportWeeklyMemoEdit';
// CompletionCoupon, MypageProfile 컴포넌트 삭제됨 - 플레이스홀더로 대체
import ReportWeeklyDetail from '@/components/ReportWeeklyDetail';
import ReportWeeklyTarot from '@/components/ReportWeeklyTarot';
import ReportWeeklyTarotResult from '@/components/ReportWeeklyTarotResult';
import ReportWeeklyMindCare from '@/components/ReportWeeklyMindCare';
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, X } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { invalidateWeeklyReportCache } from '@/hooks/useWeeklyReport';
import { DotLoading } from './ui/PageLoader';
import WeeklyReportLoading from './WeeklyReportLoading';

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

function Toast({ onComplete, message = "변경사항이 저장되었어요" }: { onComplete: () => void; message?: string }) {
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
        duration: 2.2,
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
        <p className="relative shrink-0 text-white" style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, lineHeight: '22px', fontSize: '13px' }}>{message}</p>
      </div>
    </motion.div>
  );
}

// 공통 TopBar - X 버튼 (write/view 모드 공통)
function TopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div className="w-full" style={{ maxWidth: '440px', height: '52px' }}>
      <div className="flex items-center justify-between h-full" style={{ paddingLeft: '24px', paddingRight: '12px' }}>
        <h1
          style={{
            fontFamily: 'Pretendard Variable, sans-serif',
            fontWeight: 600,
            fontSize: '18px',
            lineHeight: '25.5px',
            letterSpacing: '-0.36px',
            color: '#000000'
          }}
        >
          이번 주 보고서
        </h1>
        <button
          onClick={onClose}
          className="group flex items-center justify-center cursor-pointer transition-colors duration-200 active:bg-gray-100"
          style={{ width: '44px', height: '44px', borderRadius: '12px' }}
        >
          <X
            className="transition-transform duration-200 group-active:scale-90"
            style={{ width: '24px', height: '24px', color: '#848484' }}
            strokeWidth={1.8}
          />
        </button>
      </div>
      </div>
    </div>
  );
}

// 다시보기(view) 모드용 TopBar - X 버튼 (TopBar와 동일, 별칭)
function TopBarWithClose({ onClose }: { onClose?: () => void }) {
  return <TopBar onClose={onClose} />;
}

interface TextAreaSectionProps {
  text: string;
  onChange: (val: string) => void;
}

function TextAreaSection({ text, onChange }: TextAreaSectionProps) {
  const maxLength = 120;
  const [isFocused, setIsFocused] = useState(false);

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
            fontWeight: 500,
            fontSize: '17px',
            lineHeight: '24px',
            color: '#000000',
            letterSpacing: '-0.36px'
          }}>나에게 쓰는 한마디</p>
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '22px',
            color: '#6d6d6d',
            letterSpacing: '-0.42px'
          }}>한 주 동안 애쓴 당신에게 칭찬 한마디 어때요? (선택)</p>
        </div>

        {/* Text Area Box */}
        <div
          className="w-full relative border transition-colors duration-200"
          style={{
            borderRadius: '20px',
            padding: '12px 16px',
            borderColor: isFocused ? '#48b2af' : '#f9f9f9',
            backgroundColor: '#f9f9f9',
            outline: isFocused ? '0.5px solid #48B2AF' : 'none'
          }}
        >
          <div className="flex flex-col w-full" style={{ gap: '12px' }}>
            <textarea
              value={text}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="마음이 가는대로 적어보세요 :)"
              className="w-full bg-transparent outline-none resize-none placeholder:text-[#B7B7B7] placeholder:font-light placeholder:text-[15px]"
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

interface BottomButtonsProps {
  onPrev?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

function BottomButtons({ onPrev, onComplete, isLoading }: BottomButtonsProps) {
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isCompletePressed, setIsCompletePressed] = useState(false);

  const handlePrevPress = () => !isLoading && setIsPrevPressed(true);
  const handlePrevRelease = () => setIsPrevPressed(false);
  const handleCompletePress = () => !isLoading && setIsCompletePressed(true);
  const handleCompleteRelease = () => setIsCompletePressed(false);

  const handleCompleteClick = () => {
    console.log('🔘 [버튼] 완료 버튼 클릭됨');
    console.log('🔘 [버튼] onComplete 함수 존재:', !!onComplete);
    console.log('🔘 [버튼] isLoading:', isLoading);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            disabled={isLoading}
            onMouseDown={handlePrevPress}
            onMouseUp={handlePrevRelease}
            onMouseLeave={handlePrevRelease}
            onTouchStart={handlePrevPress}
            onTouchEnd={handlePrevRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer disabled:opacity-50"
            style={{
              borderRadius: '16px',
              backgroundColor: isPrevPressed && !isLoading ? '#E4F7F7' : '#f0f8f8',
              height: '56px',
              transform: isPrevPressed && !isLoading ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#48b2af',
              letterSpacing: '-0.32px'
            }}>이전</p>
          </button>

          {/* 완료 버튼 - 항상 활성화 */}
          <button
            onClick={handleCompleteClick}
            disabled={isLoading}
            onMouseDown={handleCompletePress}
            onMouseUp={handleCompleteRelease}
            onMouseLeave={handleCompleteRelease}
            onTouchStart={handleCompletePress}
            onTouchEnd={handleCompleteRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer disabled:opacity-70"
            style={{
              borderRadius: '16px',
              backgroundColor: isCompletePressed && !isLoading ? '#41A09E' : '#48b2af',
              height: '56px',
              transform: isCompletePressed && !isLoading ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#ffffff',
              letterSpacing: '-0.32px'
            }}>{isLoading ? '저장 중...' : '완료'}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// 다시보기(view) 모드용 BottomButtons - 이전/닫기
interface BottomButtonsViewProps {
  onPrev?: () => void;
  onClose?: () => void;
}

function BottomButtonsView({ onPrev, onClose }: BottomButtonsViewProps) {
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isClosePressed, setIsClosePressed] = useState(false);

  const handlePrevPress = () => setIsPrevPressed(true);
  const handlePrevRelease = () => setIsPrevPressed(false);
  const handleClosePress = () => setIsClosePressed(true);
  const handleCloseRelease = () => setIsClosePressed(false);

  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            onMouseDown={handlePrevPress}
            onMouseUp={handlePrevRelease}
            onMouseLeave={handlePrevRelease}
            onTouchStart={handlePrevPress}
            onTouchEnd={handlePrevRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isPrevPressed ? '#E4F7F7' : '#f0f8f8',
              height: '56px',
              transform: isPrevPressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#48b2af',
              letterSpacing: '-0.32px'
            }}>이전</p>
          </button>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            onMouseDown={handleClosePress}
            onMouseUp={handleCloseRelease}
            onMouseLeave={handleCloseRelease}
            onTouchStart={handleClosePress}
            onTouchEnd={handleCloseRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isClosePressed ? '#41A09E' : '#48b2af',
              height: '56px',
              transform: isClosePressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#ffffff',
              letterSpacing: '-0.32px'
            }}>닫기</p>
          </button>
        </div>
      </div>
    </div>
  );
}

// CompletionCoupon, MypageProfile 삭제 대체 플레이스홀더
function PlaceholderView({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }}>
      <TopBar onClose={onClose} />
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
  reportId?: string;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

// 모드: write(최초작성), view(다시보기), edit(수정하기)
type MemoMode = 'loading' | 'write' | 'view' | 'edit';
type ViewState = 'input' | 'edit' | 'result' | 'mypage' | 'report' | 'tarotPicking' | 'tarotResult' | 'prescription';

export default function ReportWeeklyMemo({ reportId, onClose, onPrev, onNext }: ReportWeeklyMemoProps) {
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState<string | null>(null);
  const [mode, setMode] = useState<MemoMode>('loading');
  const [view, setView] = useState<ViewState>('input');
  const [mypageTab, setMypageTab] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("변경사항이 저장되었어요");
  const [isSaving, setIsSaving] = useState(false);

  // 기존 응원글 조회
  useEffect(() => {
    async function fetchSelfEncouragement() {
      if (!reportId) {
        setMode('write');
        return;
      }

      try {
        console.log('📖 [응원글] 기존 응원글 조회 중...');
        const { data, error } = await supabase
          .from('weekly_reports')
          .select('self_encouragement')
          .eq('id', reportId)
          .single();

        if (error) {
          console.error('❌ [응원글] 조회 실패:', error);
          setMode('write');
          return;
        }

        if (data?.self_encouragement) {
          console.log('✅ [응원글] 기존 응원글 있음:', data.self_encouragement);
          setSavedText(data.self_encouragement);
          setText(data.self_encouragement);
          setMode('view'); // 다시보기 모드
        } else {
          console.log('📝 [응원글] 기존 응원글 없음 - 작성 모드');
          setMode('write'); // 작성 모드
        }
      } catch (err) {
        console.error('❌ [응원글] 조회 중 예외:', err);
        setMode('write');
      }
    }

    fetchSelfEncouragement();
  }, [reportId]);

  // 응원글 저장 (최초 작성 시)
  const handleComplete = async () => {
    console.log('🎯 [응원글] handleComplete 호출됨');

    if (isSaving) return;

    if (text.trim() && reportId) {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('weekly_reports')
          .update({ self_encouragement: text.trim() })
          .eq('id', reportId);

        if (error) {
          console.error('❌ [응원글] 저장 실패:', error);
        } else {
          console.log('✅ [응원글] 저장 완료');
          // ⭐ 캐시 무효화 (보고서 목록 + 상세 캐시)
          localStorage.removeItem('my_report_cache_v3');
          localStorage.setItem('my_report_needs_refresh', 'true');
          invalidateWeeklyReportCache(reportId);
          console.log('🗑️ [응원글] 보고서 캐시 삭제 + refresh 플래그 설정');
        }
      } catch (err) {
        console.error('❌ [응원글] 저장 중 예외:', err);
      } finally {
        setIsSaving(false);
      }
    }

    onNext?.();
  };

  // 응원글 수정 저장 (수정 모드에서)
  const handleSaveEdit = async (newText: string) => {
    console.log('📝 [응원글] 수정 저장 시작...');

    if (!reportId) return;

    try {
      const { error } = await supabase
        .from('weekly_reports')
        .update({ self_encouragement: newText.trim() })
        .eq('id', reportId);

      if (error) {
        console.error('❌ [응원글] 수정 저장 실패:', error);
      } else {
        console.log('✅ [응원글] 수정 저장 완료');
        setSavedText(newText.trim());
        // ⭐ 캐시 무효화 (보고서 목록 + 상세 캐시)
        localStorage.removeItem('my_report_cache_v3');
        localStorage.setItem('my_report_needs_refresh', 'true');
        invalidateWeeklyReportCache(reportId);
        console.log('🗑️ [응원글] 보고서 캐시 삭제 + refresh 플래그 설정');
        setText(newText.trim());
        setToastMessage("수정이 반영됐어요.");
        setShowToast(true);
      }
    } catch (err) {
      console.error('❌ [응원글] 수정 저장 중 예외:', err);
    }

    setMode('view'); // 다시보기로 복귀
  };

  // 로딩 중 - WeeklyReportLoading 사용 (FreeContentLoading과 동일)
  if (mode === 'loading') {
    return <WeeklyReportLoading />;
  }

  // 수정 모드 - ReportWeeklyMemoEdit 사용
  if (mode === 'edit') {
    return (
      <>
        <ReportWeeklyMemoEdit
          initialText={savedText || ''}
          onCancel={() => setMode('view')}
          onSave={handleSaveEdit}
        />
        <AnimatePresence>
          {showToast && <Toast onComplete={() => setShowToast(false)} message={toastMessage} />}
        </AnimatePresence>
      </>
    );
  }

  // MypageProfile 삭제됨 - 플레이스홀더로 대체
  if (view === 'mypage') {
    return (
      <>
        <PlaceholderView title="마이페이지" onClose={() => setView('result')} />
        <AnimatePresence>
          {showToast && <Toast onComplete={() => setShowToast(false)} />}
        </AnimatePresence>
      </>
    );
  }

  if (view === 'report') {
    return <ReportWeeklyDetail onClose={() => setView('result')} onPrev={() => setView('result')} onNext={() => setView('tarotPicking')} />;
  }

  if (view === 'tarotPicking') {
    return <ReportWeeklyTarot onClose={() => setView('report')} onNext={() => setView('tarotResult')} />;
  }

  if (view === 'tarotResult') {
    return <ReportWeeklyTarotResult onClose={() => setView('tarotPicking')} onNext={() => setView('prescription')} />;
  }

  if (view === 'prescription') {
    return <ReportWeeklyMindCare onClose={() => setView('tarotResult')} onPrev={() => setView('tarotResult')} />;
  }

  // CompletionCoupon 삭제됨 - 플레이스홀더로 대체
  if (view === 'result') {
    return (
      <PlaceholderView title="완료/쿠폰" onClose={() => setView('input')} />
    );
  }

  // 다시보기 모드 (view) - 저장된 응원글 읽기 전용
  if (mode === 'view') {
    return (
      <>
        <TopBarWithClose onClose={onNext} />
        <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-y-auto" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '100px' }}>
          {/* Content */}
          <div className="flex-1 w-full relative">
            <div className="w-full" style={{ padding: '4px 20px 40px' }}>
              {/* Header with Edit Icon */}
              <div className="flex items-start justify-between w-full" style={{ marginBottom: '12px', padding: '0 4px' }}>
                <div className="flex flex-col" style={{ gap: '4px' }}>
                  <p style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 500,
                    fontSize: '17px',
                    lineHeight: '24px',
                    color: '#000000',
                    letterSpacing: '-0.36px'
                  }}>나에게 쓰는 한마디</p>
                  <p style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '22px',
                    color: '#6d6d6d',
                    letterSpacing: '-0.42px'
                  }}>한 주 동안 애쓴 당신에게 칭찬 한마디 어때요? (선택)</p>
                </div>
                {/* 수정 아이콘 - 임시로 숨김 */}
                {/* <button
                  onClick={() => setMode('edit')}
                  className="flex items-center justify-center shrink-0 active:bg-gray-100 transition-colors rounded-full"
                  style={{ width: '36px', height: '36px' }}
                >
                  <Pencil size={18} color="#999999" />
                </button> */}
              </div>

              {/* 읽기 전용 텍스트 박스 */}
              <div
                className="w-full relative"
                style={{ borderRadius: '20px', padding: '16px', backgroundColor: '#f9f9f9' }}
              >
                <p style={{
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '25.5px',
                  color: '#151515',
                  letterSpacing: '-0.3px',
                  minHeight: '150px',
                  whiteSpace: 'pre-wrap'
                }}>{savedText}</p>
              </div>
            </div>
          </div>

          <BottomButtonsView onPrev={onPrev} onClose={onNext} />
        </div>
        <AnimatePresence>
          {showToast && <Toast onComplete={() => setShowToast(false)} message={toastMessage} />}
        </AnimatePresence>
      </>
    );
  }

  // 작성 모드 (write) - 최초 작성
  return (
    <>
      <TopBar onClose={onClose} />
      <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-y-auto" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '100px' }}>
        {/* Content */}
        <div className="flex-1 w-full relative">
        <div className="w-full" style={{ padding: '4px 20px 40px' }}>
          <TextAreaSection text={text} onChange={setText} />

        </div>
      </div>

      <BottomButtons onPrev={onPrev} onComplete={handleComplete} isLoading={isSaving} />
      </div>
    </>
  );
}
