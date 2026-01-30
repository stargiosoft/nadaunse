import React, { useEffect } from 'react';
import svgPaths from "@/imports/svg-nx753fhzfr";
import { useWeeklyReport, TarotSelection, markTarotAsViewed } from '@/hooks/useWeeklyReport';

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

interface TarotCardImageProps {
  imageUrl: string;
  cardName: string;
}

function TarotCardImage({ imageUrl, cardName }: TarotCardImageProps) {
  return (
    <div className="relative shadow-sm shrink-0" style={{ height: '260px', width: '150px', borderRadius: '16px', boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: '16px' }}>
        <img
          alt={cardName}
          className="absolute left-0 max-w-none size-full top-0 object-cover"
          src={imageUrl}
          onError={(e) => {
            // 이미지 로드 실패 시 기본 이미지 표시
            (e.target as HTMLImageElement).src = '/tarot-back.png';
          }}
        />
      </div>
    </div>
  );
}

interface CardTextContainerProps {
  title: string;
  description: string;
  imageUrl: string;
}

function CardTextContainer({ title, description, imageUrl }: CardTextContainerProps) {
  return (
    <div className="flex flex-col items-center relative shrink-0 w-full" style={{ padding: '0 20px' }} data-name="Container">
        <div className="flex flex-col items-center w-full" style={{ gap: '18px', marginBottom: '10px' }}>
            <TarotCardImage imageUrl={imageUrl} cardName={title} />
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

interface CardInterpretationCardProps {
  tarot: TarotSelection;
  cardLabel: string;
}

function CardInterpretationCard({ tarot, cardLabel }: CardInterpretationCardProps) {
  // 카드 순서에 따른 라벨
  const labels = ['나를 채워줄 감정', '내가 다독일 감정', '다음 주 마음 날씨'];
  const label = labels[tarot.card_order - 1] || cardLabel;

  return (
    <div className="relative shrink-0 w-full" style={{ borderRadius: '16px', backgroundColor: '#f9f9f9' }} data-name="Card / Interpretation Card">
      <div className="flex flex-row justify-center size-full">
        <div className="flex items-start justify-center relative w-full" style={{ padding: '32px 0 28px 0' }}>
          <div className="flex flex-col items-center w-full">
            {/* 카드 라벨 */}
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#48b2af',
              letterSpacing: '-0.28px',
              marginBottom: '16px'
            }}>{label}</p>
            <CardTextContainer
              title={tarot.card_name}
              description={tarot.interpretation || '해석 정보가 없습니다.'}
              imageUrl={tarot.card_image_url}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardContainerProps {
  tarotSelections: TarotSelection[];
}

function CardContainer({ tarotSelections }: CardContainerProps) {
  return (
    <div
      className="flex flex-col gap-4 items-start w-full px-5 pt-3"
      style={{ paddingBottom: '230px' }}
      data-name="Card Container"
    >
      {tarotSelections.map((tarot, index) => (
        <CardInterpretationCard
          key={tarot.id}
          tarot={tarot}
          cardLabel={`카드 ${index + 1}`}
        />
      ))}
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

// 로딩 스켈레톤
function LoadingSkeleton() {
  return (
    <div className="animate-pulse p-5 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-200 rounded-2xl p-7">
          <div className="flex flex-col items-center">
            <div className="h-[260px] w-[150px] bg-gray-300 rounded-2xl mb-4" />
            <div className="h-6 bg-gray-300 rounded w-32 mb-4" />
            <div className="h-4 bg-gray-300 rounded w-full mb-2" />
            <div className="h-4 bg-gray-300 rounded w-full mb-2" />
            <div className="h-4 bg-gray-300 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ReportWeeklyTarotResultProps {
  onBack?: () => void;
  onNext?: () => void;
  reportId?: string;
  // 외부에서 데이터 직접 주입 가능
  tarotData?: TarotSelection[];
}

export default function ReportWeeklyTarotResult({
  onBack,
  onNext,
  reportId,
  tarotData: externalTarotData
}: ReportWeeklyTarotResultProps) {
  const { tarotSelections: fetchedTarot, loading, error } = useWeeklyReport(
    externalTarotData ? undefined : reportId
  );

  const tarotSelections = externalTarotData || fetchedTarot;

  // 타로 카드 열람 상태 업데이트
  useEffect(() => {
    if (tarotSelections.length > 0) {
      tarotSelections.forEach(tarot => {
        if (!tarot.user_viewed) {
          markTarotAsViewed(tarot.id);
        }
      });
    }
  }, [tarotSelections]);

  if (loading && !externalTarotData) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }}>
        <NavigationTopBar onBack={onBack} />
        <div className="flex-1 overflow-y-auto w-full relative">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error && !externalTarotData) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }}>
        <NavigationTopBar onBack={onBack} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>타로 결과를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (tarotSelections.length === 0 && !externalTarotData) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }}>
        <NavigationTopBar onBack={onBack} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>타로 결과가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }} data-name="나의 보고서 (타로 풀이)">
      <NavigationTopBar onBack={onBack} />
      <div className="flex-1 overflow-y-auto w-full relative">
        <CardContainer tarotSelections={tarotSelections} />
      </div>
      <BottomButton onNext={onNext} />
    </div>
  );
}
