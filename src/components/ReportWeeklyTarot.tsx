import svgPaths from "@/imports/svg-yw2inj78b4";
import { TarotGame } from "@/components/TarotGame";
import ArrowLeft from './ArrowLeft';


function LinearClose() {
  return (
    <div className="absolute contents inset-0" data-name="linear/close">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Box">
          <path d="M5 19L19 5" id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M19 19L5 5" id="Vector_2" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function Icons1() {
  return (
    <div className="relative shrink-0" style={{ width: '24px', height: '24px' }} data-name="Icons">
      <LinearClose />
    </div>
  );
}

function RightAction() {
  return (
    <div className="flex items-center justify-center opacity-0 relative shrink-0" style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }} data-name="Right Action">
      <Icons1 />
    </div>
  );
}

function Icon({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <ArrowLeft onClick={onBack || (() => {})} />
      <p className="flex-[1_0_0] overflow-hidden text-center text-ellipsis" style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 600,
        fontSize: '18px',
        lineHeight: '25.5px',
        color: '#000000',
        letterSpacing: '-0.36px'
      }}>이번 주 보고서</p>
      <RightAction />
    </div>
  );
}

function NavigationTopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full" style={{ height: '52px' }} data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="flex flex-col items-start justify-center relative size-full" style={{ padding: '4px 12px' }}>
          <Icon onBack={onBack} />
        </div>
      </div>
    </div>
  );
}

function NavigationTopNavigationWidget({ onBack }: { onBack?: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-white w-full" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar onBack={onBack} />
    </div>
  );
}

interface ReportWeeklyTarotProps {
  onBack?: () => void;
  onNext?: () => void;
}

export default function ReportWeeklyTarot({ onBack, onNext }: ReportWeeklyTarotProps) {
  return (
    <div className="bg-white fixed inset-0 flex justify-center" data-name="나의 보고서 (타로 뽑기)">
      <div className="w-full flex flex-col bg-white" style={{ maxWidth: '440px' }}>
        <NavigationTopNavigationWidget onBack={onBack} />
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
