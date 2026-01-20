import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * 공통 확인 다이얼로그 컴포넌트
 * 
 * @param isOpen - 다이얼로그 표시 여부
 * @param title - 다이얼로그 제목
 * @param message - 다이얼로그 메시지 (선택사항)
 * @param onConfirm - 확인 버튼 클릭 시 실행될 함수
 * @param onCancel - 취소 버튼 클릭 시 실행될 함수
 * @param confirmText - 확인 버튼 텍스트 (기본값: '네')
 * @param cancelText - 취소 버튼 텍스트 (기본값: '아니요')
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '네',
  cancelText = '아니요'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[16px] w-[320px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 제목 */}
        <div className="px-[24px] pt-[32px] pb-[24px]">
          <p
            className="text-center"
            style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '25.5px',
              letterSpacing: '-0.36px',
              color: '#151515'
            }}
          >
            {title}
          </p>
          {message && (
            <p
              className="text-center mt-[8px]"
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '20px',
                letterSpacing: '-0.3px',
                color: '#848484'
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-[8px] px-[16px] pb-[16px]">
          {/* 취소 버튼 */}
          <button
            onClick={onCancel}
            className="flex-1 h-[48px] rounded-[12px] transition-colors active:opacity-80"
            style={{ backgroundColor: '#f5f5f5' }}
          >
            <p
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontWeight: 600,
                fontSize: '15px',
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#848484'
              }}
            >
              {cancelText}
            </p>
          </button>

          {/* 확인 버튼 */}
          <button
            onClick={onConfirm}
            className="flex-1 h-[48px] rounded-[12px] transition-colors active:opacity-80"
            style={{ backgroundColor: '#48b2af' }}
          >
            <p
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontWeight: 600,
                fontSize: '15px',
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#ffffff'
              }}
            >
              {confirmText}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}