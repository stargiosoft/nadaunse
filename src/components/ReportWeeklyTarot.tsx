import { useEffect } from 'react';
import { TarotGame } from "@/components/TarotGame";
import { X } from 'lucide-react';

interface ReportWeeklyTarotProps {
  onClose?: () => void;
  onNext?: () => void;
}

export default function ReportWeeklyTarot({ onClose, onNext }: ReportWeeklyTarotProps) {
  // iOS Safari viewport height 처리 (TarotShufflePage와 동일)
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  return (
    // TarotShufflePage와 동일한 레이아웃 패턴 사용
    <div
      className="w-full max-w-[440px] mx-auto relative overflow-hidden"
      style={{
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        height: 'calc(var(--vh, 1vh) * 100)',
        backgroundColor: '#41a09e'
      }}
      data-name="나의 보고서 (타로 뽑기)"
    >
      {/* TarotGame - 전체 화면 배경 (absolute) */}
      <div className="absolute inset-0 w-full" style={{ minHeight: '100vh', height: '100%' }}>
        <TarotGame
          onConfirm={onNext}
          title="다음주, 내 마음 날씨는 어떨까요?"
          question="복잡한 생각은 잠시 내려두고, 편하게 뽑아보세요."
          slotCount={3}
        />
      </div>

      {/* Top Navigation - 고정 위치 (fixed) */}
      <div className="fixed top-0 left-0 right-0 bg-white h-[52px] z-50 max-w-[440px] mx-auto">
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
