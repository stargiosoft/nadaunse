import React, { useState } from 'react';
import svgPaths from "@/imports/svg-z33txjknpb";

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

function SettingsIcon() {
  return (
     <div className="absolute inset-0">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path d={svgPaths.p3cccb600} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
        <path d={svgPaths.p185ecc80} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// --- Components ---

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
           <div className="flex items-center justify-center relative shrink-0 opacity-0" style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}>
             <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
               <SettingsIcon />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function TextAreaSection({ text, onChange }: { text: string, onChange: (val: string) => void }) {
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
              className="w-full bg-transparent outline-none resize-none placeholder:font-normal"
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
  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center relative cursor-pointer transition active:scale-[0.99] active:!bg-[#E4F7F7]"
              style={{ borderRadius: '16px', backgroundColor: '#F0F8F8', height: '56px' }}
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
              className="flex-1 flex items-center justify-center relative cursor-pointer transition active:scale-[0.99] active:!bg-[#41A09E]"
              style={{ borderRadius: '16px', backgroundColor: '#48b2af', height: '56px' }}
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
    <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }} data-name="나의 보고서 (이번 주 나에게-수정하기)">
      <TopBar onBack={onCancel} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full relative" style={{ paddingBottom: '100px' }}>
        <div className="w-full" style={{ padding: '16px 20px 40px 20px' }}>
          <TextAreaSection text={text} onChange={setText} />
        </div>
      </div>

      <BottomButtons onCancel={onCancel} onSave={() => onSave(text)} />
    </div>
  );
}
