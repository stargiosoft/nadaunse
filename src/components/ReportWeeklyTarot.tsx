import svgPaths from "@/imports/svg-yw2inj78b4";
import { TarotGame } from "@/components/TarotGame";
import { X } from 'lucide-react';

function NavigationTopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="bg-white shrink-0 w-full z-20" style={{ height: '52px' }}>
      <div className="flex items-center justify-between h-full" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
        <div className="opacity-0" style={{ width: '44px', height: '44px' }} />
        <h1
          className="text-center flex-1"
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
  );
}

interface ReportWeeklyTarotProps {
  onClose?: () => void;
  onNext?: () => void;
}

export default function ReportWeeklyTarot({ onClose, onNext }: ReportWeeklyTarotProps) {
  return (
    <div className="bg-white fixed inset-0 flex justify-center" data-name="나의 보고서 (타로 뽑기)">
      <div className="w-full flex flex-col bg-white" style={{ maxWidth: '440px' }}>
        <NavigationTopBar onClose={onClose} />
        <div className="flex-1 w-full overflow-hidden">
          <TarotGame
            onConfirm={onNext}
            title="다음주, 내 마음 날씨는 어떨까요?"
            question="복잡한 생각은 잠시 내려두고, 편하게 뽑아보세요."
            slotCount={3}
          />
        </div>
      </div>
    </div>
  );
}
