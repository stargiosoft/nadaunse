import { useNavigate } from 'react-router-dom';

interface SessionExpiredDialogProps {
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * 세션 만료 다이얼로그 컴포넌트
 * 로그인이 필요한 페이지에 비로그인 상태로 접속 시 노출
 */
export function SessionExpiredDialog({ isOpen, onClose }: SessionExpiredDialogProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 dim 처리 */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />

      {/* ⭐️ [DEV] 개발 모드: Dev User일 경우 세션 만료 모달을 강제로 숨김 */}
      {localStorage.getItem('user')?.includes('"provider":"dev"') && (
        <span
          ref={(node) => {
            if (node && node.parentElement) {
              node.parentElement.style.display = 'none';
              document.body.style.overflow = '';
              console.log('⚡ [DEV] 세션 만료 모달 강제 숨김 처리 (Dev User)');
            }
          }}
          style={{ display: 'none' }}
        />
      )}

      {/* 다이얼로그 */}
      <div
        className="relative bg-white overflow-hidden transform-gpu"
        style={{ width: 320, borderRadius: 24, border: '1px solid #f3f3f3' }}
      >
        {/* 텍스트 영역 */}
        <div className="flex flex-col" style={{ gap: '4px', padding: '36px 32px' }}>
          <p style={{
            fontFamily: 'Pretendard Variable, sans-serif',
            fontWeight: 600,
            fontSize: '17.5px',
            lineHeight: '24px',
            letterSpacing: '-0.34px',
            color: '#151515'
          }}>
            로그인이 필요해요
          </p>
          <p style={{
            fontFamily: 'Pretendard Variable, sans-serif',
            fontWeight: 400,
            fontSize: '15px',
            lineHeight: '26px',
            letterSpacing: '-0.3px',
            color: '#848484'
          }}>
            계속 보시려면 다시 로그인해 주세요.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div style={{ padding: '0 28px 20px' }}>
          <button
            onClick={handleLogin}
            className="w-full"
            style={{ height: 48, backgroundColor: '#48b2af', borderRadius: 16, transition: 'transform 0.1s ease' }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontWeight: 500,
              fontSize: '15px',
              lineHeight: '20px',
              letterSpacing: '-0.45px',
              color: '#ffffff'
            }}>
              로그인 하기
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
