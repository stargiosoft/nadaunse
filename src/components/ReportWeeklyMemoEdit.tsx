import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DEV } from '@/lib/env';

// --- Components ---

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
      <div className="flex flex-col w-full" style={{ gap: '10px' }}>
        {/* Header Text */}
        <h2 style={{
          fontFamily: 'Pretendard Variable',
          fontWeight: 500,
          fontSize: '16px',
          lineHeight: '24px',
          letterSpacing: '-0.36px',
          color: 'rgb(0, 0, 0)',
          paddingLeft: '4px'
        }}>
          나에게 쓰는 한마디
        </h2>

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

function InlineButtons({ onCancel, onSave }: { onCancel: () => void, onSave: () => void }) {
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

interface ReportWeeklyMemoEditProps {
  initialText: string;
  onCancel: () => void;
  onSave: (text: string) => void;
}

export default function ReportWeeklyMemoEdit({ initialText, onCancel, onSave }: ReportWeeklyMemoEditProps) {
  const navigate = useNavigate();
  const [text, setText] = useState(initialText || "이번 한주도 고생했어. 힘든일도 많고 포기하고 싶을 때마다 괜찮다고 더 버텨보자고 애썼다고 칭찬해주고 싶어.");

  return (
    <>
      <style>{`
        .memo-textarea::placeholder {
          color: #B7B7B7;
        }
      `}</style>
      <TopBar onClose={onCancel} />
      <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-y-auto" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '40px' }} data-name="나의 보고서 (이번 주 나에게-수정하기)">
        {/* Content */}
        <div className="flex-1 w-full relative">
          <div className="w-full" style={{ padding: '4px 20px 40px' }}>
            <TextAreaSection text={text} onChange={setText} />
            <InlineButtons onCancel={onCancel} onSave={() => onSave(text)} />

            {/* 개발 환경 전용 테스트 버튼 */}
            {DEV && (
              <button
                onClick={() => navigate('/test/completion-coupon')}
                className="w-full text-center rounded-lg"
                style={{
                  fontFamily: 'Pretendard Variable',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#48b2af',
                  backgroundColor: '#f0f8f8',
                  padding: '12px 16px',
                  border: '1px solid #e0f2f1',
                  marginTop: '20px'
                }}
              >
                🎫 쿠폰 완료 화면 보기 (테스트용)
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
