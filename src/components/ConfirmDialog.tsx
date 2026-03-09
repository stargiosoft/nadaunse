import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
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
  cancelText = '아니요',
  confirmLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white overflow-hidden transform-gpu"
        style={{ width: 320, borderRadius: 24, border: '1px solid #f3f3f3' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 제목 */}
        <div className="flex flex-col" style={{ gap: '4px', padding: '36px 32px' }}>
          <p
            style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontWeight: 600,
              fontSize: '17px',
              lineHeight: '24px',
              letterSpacing: '-0.34px',
              color: '#151515'
            }}
          >
            {title}
          </p>
          {message && (
            <p
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '26px',
                letterSpacing: '-0.3px',
                color: '#848484'
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex" style={{ gap: 10, padding: '0 28px 20px' }}>
          {/* 취소 버튼 */}
          <button
            onClick={onCancel}
            className="flex-1"
            style={{ backgroundColor: '#f3f3f3', borderRadius: 16, height: 48, transition: 'transform 0.1s ease' }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <p
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontWeight: 500,
                fontSize: '15px',
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#525252'
              }}
            >
              {cancelText}
            </p>
          </button>

          {/* 확인 버튼 */}
          <button
            onClick={confirmLoading ? undefined : onConfirm}
            disabled={confirmLoading}
            className="flex-1"
            style={{ backgroundColor: '#48b2af', borderRadius: 16, height: 48, transition: 'transform 0.1s ease', opacity: confirmLoading ? 0.6 : 1 }}
            onPointerDown={e => { if (!confirmLoading) e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <p
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontWeight: 500,
                fontSize: '15px',
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#ffffff'
              }}
            >
              {confirmLoading ? '처리 중...' : confirmText}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}