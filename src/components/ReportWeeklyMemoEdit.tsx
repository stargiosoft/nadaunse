import React, { useState } from 'react';
import { X } from 'lucide-react';

// --- Components ---

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
      <div className="flex flex-col w-full" style={{ gap: '12px' }}>
        {/* Header Text */}
        <div className="flex flex-col w-full" style={{ gap: '4px', padding: '0 4px' }}>
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 600,
            fontSize: '16px',
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
              className="w-full bg-transparent outline-none resize-none placeholder:font-light placeholder:text-[15px] placeholder:text-[#B7B7B7]"
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

function BottomButtons({ onCancel, onSave }: { onCancel: () => void, onSave: () => void }) {
  const [isCancelPressed, setIsCancelPressed] = useState(false);
  const [isSavePressed, setIsSavePressed] = useState(false);

  const handleCancelPress = () => setIsCancelPressed(true);
  const handleCancelRelease = () => setIsCancelPressed(false);
  const handleSavePress = () => setIsSavePressed(true);
  const handleSaveRelease = () => setIsSavePressed(false);

  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              onMouseDown={handleCancelPress}
              onMouseUp={handleCancelRelease}
              onMouseLeave={handleCancelRelease}
              onTouchStart={handleCancelPress}
              onTouchEnd={handleCancelRelease}
              className="flex-1 flex items-center justify-center relative cursor-pointer"
              style={{
                borderRadius: '16px',
                backgroundColor: isCancelPressed ? '#E4F7F7' : '#F0F8F8',
                height: '56px',
                transform: isCancelPressed ? 'scale(0.99)' : 'scale(1)',
                transition: 'all 0.1s ease'
              }}
            >
               <p style={{
                 fontFamily: 'Pretendard Variable',
                 fontWeight: 500,
                 fontSize: '16px',
                 lineHeight: '25px',
                 color: '#48B2AF',
                 letterSpacing: '-0.32px'
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
              className="flex-1 flex items-center justify-center relative cursor-pointer"
              style={{
                borderRadius: '16px',
                backgroundColor: isSavePressed ? '#41A09E' : '#48b2af',
                height: '56px',
                transform: isSavePressed ? 'scale(0.99)' : 'scale(1)',
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
               }}>저장</p>
            </button>
        </div>
      </div>
    </div>
  );
}

interface ReportWeeklyMemoEditProps {
  initialText: string;
  onCancel: () => void;
  onSave: (text: string) => void;
}

export default function ReportWeeklyMemoEdit({ initialText, onCancel, onSave }: ReportWeeklyMemoEditProps) {
  const [text, setText] = useState(initialText || "이번 한주도 고생했어. 힘든일도 많고 포기하고 싶을 때마다 괜찮다고 더 버텨보자고 애썼다고 칭찬해주고 싶어.");

  return (
    <>
      <TopBar onClose={onCancel} />
      <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-y-auto" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '100px' }} data-name="나의 보고서 (이번 주 나에게-수정하기)">
        {/* Content */}
        <div className="flex-1 w-full relative">
          <div className="w-full" style={{ padding: '4px 20px 40px' }}>
            <TextAreaSection text={text} onChange={setText} />
          </div>
        </div>

        <BottomButtons onCancel={onCancel} onSave={() => onSave(text)} />
      </div>
    </>
  );
}
