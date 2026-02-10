import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { invalidateWeeklyReportCache } from '@/hooks/useWeeklyReport';
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

// --- Components ---

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

function TopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div className="w-full" style={{ maxWidth: '440px', height: '52px' }}>
      <div className="flex items-center h-full" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
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
          수정하기
        </h1>
      </div>
      </div>
    </div>
  );
}

function TextAreaSection({ text, onChange }: { text: string, onChange: (val: string) => void }) {
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
      <div className="flex flex-col w-full">
        {/* Text Area Box */}
        <div
          className="w-full relative border transition-colors duration-200"
          style={{
            borderRadius: '20px',
            padding: '12px 16px',
            borderColor: isFocused ? '#48b2af' : (text.length > 0 ? '#F3F3F3' : '#f9f9f9'),
            backgroundColor: (text.length > 0 && !isFocused) ? '#ffffff' : '#f9f9f9',
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
              className="memo-textarea w-full bg-transparent outline-none resize-none placeholder:font-light placeholder:text-[15px]"
              style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '25.5px',
                color: '#151515',
                letterSpacing: '-0.3px',
                minHeight: '150px',
                overflowY: 'auto'
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
                  fontWeight: 600,
                  color: '#48b2af',
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

function InlineButtons({ onCancel, onSave }: { onCancel?: () => void, onSave?: () => void }) {
  const [isCancelPressed, setIsCancelPressed] = useState(false);
  const [isSavePressed, setIsSavePressed] = useState(false);

  const handleCancelPress = () => setIsCancelPressed(true);
  const handleCancelRelease = () => setIsCancelPressed(false);
  const handleSavePress = () => setIsSavePressed(true);
  const handleSaveRelease = () => setIsSavePressed(false);

  return (
    <div className="flex items-center justify-end w-full" style={{ gap: '8px', marginTop: '12px' }}>
      {/* Cancel Button */}
      <button
        onClick={onCancel}
        onMouseDown={handleCancelPress}
        onMouseUp={handleCancelRelease}
        onMouseLeave={handleCancelRelease}
        onTouchStart={handleCancelPress}
        onTouchEnd={handleCancelRelease}
        className="flex items-center justify-center relative cursor-pointer"
        style={{
          borderRadius: '12px',
          backgroundColor: isCancelPressed ? '#E4F7F7' : '#f0f8f8',
          width: '108px',
          height: '38px',
          transform: isCancelPressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'all 0.1s ease'
        }}
      >
        <p style={{
          fontFamily: 'Pretendard Variable',
          fontWeight: 500,
          fontSize: '15px',
          lineHeight: '22px',
          color: '#48b2af',
          letterSpacing: '-0.3px'
        }}>취소</p>
      </button>

      {/* Save Button */}
      <button
        onClick={onSave}
        onMouseDown={handleSavePress}
        onMouseUp={handleSaveRelease}
        onMouseLeave={handleSaveRelease}
        onTouchStart={handleSavePress}
        onTouchEnd={handleSaveRelease}
        className="flex items-center justify-center relative cursor-pointer"
        style={{
          borderRadius: '12px',
          backgroundColor: isSavePressed ? '#41A09E' : '#48b2af',
          width: '108px',
          height: '38px',
          transform: isSavePressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'all 0.1s ease'
        }}
      >
        <p style={{
          fontFamily: 'Pretendard Variable',
          fontWeight: 500,
          fontSize: '15px',
          lineHeight: '22px',
          color: '#ffffff',
          letterSpacing: '-0.3px'
        }}>저장</p>
      </button>
    </div>
  );
}

interface ReportWeeklyMemoQuickEditProps {
  reportId?: string;
  initialText?: string;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ReportWeeklyMemoQuickEdit({
  reportId,
  initialText = '',
  onClose,
  onPrev,
  onNext
}: ReportWeeklyMemoQuickEditProps) {
  const [text, setText] = useState(initialText);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = async () => {
    console.log('🎯 [QuickEdit] 다음 버튼 클릭');

    if (isSaving) return;

    // 텍스트가 있으면 저장
    if (text.trim() && reportId) {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('weekly_reports')
          .update({ self_encouragement: text.trim() })
          .eq('id', reportId);

        if (error) {
          console.error('❌ [QuickEdit] 저장 실패:', error);
        } else {
          console.log('✅ [QuickEdit] 저장 완료');
          // 캐시 무효화
          localStorage.removeItem('my_report_cache_v3');
          localStorage.setItem('my_report_needs_refresh', 'true');
          invalidateWeeklyReportCache(reportId);
          console.log('🗑️ [QuickEdit] 보고서 캐시 삭제 + refresh 플래그 설정');
        }
      } catch (err) {
        console.error('❌ [QuickEdit] 저장 중 예외:', err);
      } finally {
        setIsSaving(false);
      }
    }

    onNext?.();
  };

  const handleCancel = () => {
    onPrev?.();
  };

  const handleSave = () => {
    handleNext();
  };

  return (
    <>
      <style>{`
        .memo-textarea::placeholder {
          color: #B7B7B7;
        }
      `}</style>
      <TopBar onClose={onClose} />
      <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-y-auto" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '40px' }} data-name="나의 보고서 (이번 주 나에게-Quick Edit)">
        {/* Content */}
        <div className="flex-1 w-full relative">
          <div className="w-full" style={{ padding: '4px 20px 40px' }}>
            {/* Title */}
            <h2 style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '24px',
              letterSpacing: '-0.36px',
              color: 'rgb(0, 0, 0)',
              paddingLeft: '4px',
              marginBottom: '10px'
            }}>
              나에게 쓰는 한마디
            </h2>
            <TextAreaSection text={text} onChange={setText} />
            <InlineButtons onCancel={handleCancel} onSave={handleSave} />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showToast && <Toast onComplete={() => setShowToast(false)} />}
      </AnimatePresence>
    </>
  );
}
