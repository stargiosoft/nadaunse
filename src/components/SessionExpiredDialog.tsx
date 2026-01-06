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
  return null; // 작업 편의를 위해 강제 비활성화

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 dim 처리 */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* ⭐️ [DEV] 개발 모드: Dev User일 경우 세션 만료 모달을 강제로 숨김 */}
      {/* 이를 통해 로그인 없이 UI 테스트가 가능하도록 함 */}
      {localStorage.getItem('user')?.includes('"provider":"dev"') && (
        <span 
          ref={(node) => {
            // 부모 요소(모달 전체 컨테이너)를 숨김 처리
            if (node && node.parentElement) {
              node.parentElement.style.display = 'none';
              // 배경 스크롤 잠금 해제 (혹시 걸려있다면)
              document.body.style.overflow = '';
              console.log('⚡ [DEV] 세션 만료 모달 강제 숨김 처리 (Dev User)');
            }
          }}
          style={{ display: 'none' }}
        />
      )}

      {/* 다이얼로그 */}
      <div className="relative w-[320px] bg-white rounded-[20px] overflow-hidden border border-[#f3f3f3]">
        {/* 텍스트 영역 */}
        <div className="px-[28px] py-[20px]">
          <div className="flex flex-col gap-[8px] items-center text-center">
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[17px] leading-[25.5px] tracking-[-0.34px] text-black">
              로그인이 필요해요
            </p>
            <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[15px] leading-[20px] tracking-[-0.3px] text-[#868686]">
              계속 보시려면 다시 로그인해 주세요.
            </p>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="px-[24px] pb-[20px]">
          <button
            onClick={handleLogin}
            className="w-full h-[48px] bg-[#48b2af] rounded-[12px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <span className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[16px] leading-[25px] tracking-[-0.32px] text-white">
              로그인 하기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}