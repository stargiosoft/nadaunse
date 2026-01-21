import { useEffect } from 'react';
import { TarotGame } from '../components/TarotGame';
import { X } from 'lucide-react';

export default function TestTarotPage() {
  // ⭐ iOS Safari viewport height 처리
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
    <div
      className="w-full max-w-[440px] mx-auto relative overflow-hidden"
      style={{
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: '#41a09e'
      }}
    >
      {/* TarotGame - 전체 화면 배경 */}
      <div className="absolute inset-0 w-full" style={{ minHeight: '100vh', height: '100%' }}>
        <TarotGame
          onConfirm={() => alert('카드 선택 완료!')}
          title="테스트 질문입니다"
          question="질문을 떠올리며 카드를 뽑아주세요"
        />
      </div>

      {/* ⭐ Top Navigation - 고정 위치로 배치 */}
      <div className="fixed top-0 left-0 right-0 bg-white h-[52px] z-50 max-w-[440px] mx-auto">
        <div className="flex items-center justify-between px-[12px] h-full">
          <div className="w-[44px] h-[44px] opacity-0" />
          <h1 className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[18px] leading-[25.5px] tracking-[-0.36px] text-black text-center flex-1">
            상세 풀이
          </h1>
          <button
            onClick={() => window.history.back()}
            className="group flex items-center justify-center w-[44px] h-[44px] rounded-[12px] cursor-pointer transition-colors duration-200 active:bg-gray-100"
          >
            <X className="w-[24px] h-[24px] text-[#848484] transition-transform duration-200 group-active:scale-90" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
