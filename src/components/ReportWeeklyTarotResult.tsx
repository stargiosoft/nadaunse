import React from 'react';
import svgPaths from "@/imports/svg-nx753fhzfr";
import imgSwords11Png from "@/assets/2ced5a86877d398cd3930c1ef08e032cadaa48d4.png";

function Box() {
  return (
    <div className="absolute contents inset-0" data-name="Box">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="arrow-left">
          <path d={svgPaths.p2a5cd480} id="Vector" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
          <path d={svgPaths.p1a4bb100} id="Vector_2" opacity="0" stroke="var(--stroke-0, #848484)" />
        </g>
      </svg>
    </div>
  );
}

function Icons() {
  return (
    <div className="relative shrink-0" style={{ width: '24px', height: '24px' }} data-name="Icons">
      <Box />
    </div>
  );
}

function LeftAction({ onBack }: { onBack?: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center justify-center relative shrink-0 transition-colors active:bg-gray-100 group"
      style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}
      data-name="Left Action"
    >
      <div className="transition-transform group-active:scale-90">
        <Icons />
      </div>
    </button>
  );
}

function Icon({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <LeftAction onBack={onBack} />
      <p className="flex-[1_0_0] overflow-hidden text-center text-ellipsis" style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 600,
        fontSize: '18px',
        lineHeight: '25.5px',
        color: '#000000',
        letterSpacing: '-0.36px'
      }}>이번 주 보고서</p>
      <div style={{ width: '44px' }} /> {/* Right Action Spacer */}
    </div>
  );
}

function NavigationTopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full z-10" style={{ height: '52px' }} data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="flex flex-col items-start justify-center relative size-full" style={{ padding: '4px 12px' }}>
          <Icon onBack={onBack} />
        </div>
      </div>
    </div>
  );
}

function Swords11Png() {
  return (
    <div className="relative shadow-sm shrink-0" style={{ height: '260px', width: '150px', borderRadius: '16px', boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: '16px' }}>
        <img alt="Tarot Card" className="absolute left-0 max-w-none size-full top-0 object-cover" src={imgSwords11Png} />
      </div>
    </div>
  );
}

function CardTextContainer({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex flex-col items-center relative shrink-0 w-full" style={{ padding: '0 20px' }} data-name="Container">
        <div className="flex flex-col items-center w-full" style={{ gap: '18px', marginBottom: '10px' }}>
            <Swords11Png />
            <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '25.5px',
                color: '#151515',
                letterSpacing: '-0.36px',
                textAlign: 'center',
                width: '100%'
            }}>{title}</p>
        </div>
      <p style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: '28.5px',
        color: '#151515',
        letterSpacing: '-0.32px',
        width: '100%'
      }}>{description}</p>
    </div>
  );
}

function CardInterpretationCard() {
  const title = "Page of swords";
  const description = "이 카드는 호기심과 탐구심, 그리고 진실을 알고자 하는 열망을 상징합니다. 상대방을 향한 당신의 관심이 깊어지고 있으며, 마음속에 질문이 많아지는 시기일 수 있습니다. 다만, 모든 것을 성급히 판단하기보다 관찰하고 배워가야 할 때입니다. 말과 행동에서 솔직함이 중요하며, 작은 오해를 바로잡는 데 힘쓰면 관계가 훨씬 안정될 수 있습니다.";

  return (
    <div className="relative shrink-0 w-full" style={{ borderRadius: '16px', backgroundColor: '#f9f9f9' }} data-name="Card / Interpretation Card">
      <div className="flex flex-row justify-center size-full">
        <div className="flex items-start justify-center relative w-full" style={{ padding: '32px 0 28px 0' }}>
          <CardTextContainer title={title} description={description} />
        </div>
      </div>
    </div>
  );
}

function CardContainer() {
  return (
    <div
      className="flex flex-col gap-4 items-start w-full px-5 pt-3"
      style={{ paddingBottom: '230px' }}
      data-name="Card Container"
    >
      <CardInterpretationCard />
      <CardInterpretationCard />
      <CardInterpretationCard />
    </div>
  );
}

function ButtonSquareButton({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center relative w-full shrink-0 cursor-pointer transition duration-200 ease-in-out active:scale-[0.99] active:bg-[#41A09E] select-none"
      style={{ height: '56px', padding: '0 12px', borderRadius: '16px', backgroundColor: '#48b2af' }}
      data-name="Button / Square Button"
    >
      <p style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 500,
        fontSize: '16px',
        lineHeight: '25px',
        color: '#ffffff',
        letterSpacing: '-0.32px'
      }}>이번 주 마음 처방 보기</p>
    </div>
  );
}

function BottomButton({ onNext }: { onNext?: () => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 w-full flex flex-col items-start z-20" style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }} data-name="Common / Bottom Button">
      <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Container">
        <div className="bg-white relative shrink-0 w-full" data-name="Button Container">
          <div className="flex flex-col items-center justify-center size-full">
            <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
              <ButtonSquareButton onClick={onNext} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReportWeeklyTarotResultProps {
  onBack?: () => void;
  onNext?: () => void;
}

export default function ReportWeeklyTarotResult({ onBack, onNext }: ReportWeeklyTarotResultProps) {
  return (
    <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }} data-name="나의 보고서 (타로 풀이)">
      <NavigationTopBar onBack={onBack} />
      <div className="flex-1 overflow-y-auto w-full relative">
        <CardContainer />
      </div>
      <BottomButton onNext={onNext} />
    </div>
  );
}
