import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useWeeklyReport, TarotSelection, markTarotAsViewed } from '@/hooks/useWeeklyReport';
import { DotLoading } from './ui/PageLoader';
import WeeklyReportLoading from './WeeklyReportLoading';

function NavigationTopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="bg-white shrink-0 w-full z-20" style={{ height: '52px' }}>
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
  );
}

interface TarotCardImageProps {
  imageUrl: string;
  cardName: string;
}

function TarotCardImage({ imageUrl, cardName }: TarotCardImageProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="relative shadow-sm shrink-0 overflow-hidden"
      style={{
        height: '260px',
        width: '150px',
        borderRadius: '16px',
        backgroundColor: '#f0f0f0',
        boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)'
      }}
    >
      <img
        alt={cardName}
        className="w-full h-full object-cover"
        src={imageUrl}
        onLoad={() => setImageLoading(false)}
        onError={(e) => {
          setImageLoading(false);
          setImageError(true);
          // 이미지 로드 실패 시 기본 이미지 표시
          (e.target as HTMLImageElement).src = '/tarot-back.png';
        }}
      />
      {/* Shimmer 로딩 애니메이션 */}
      {imageLoading && !imageError && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-100 overflow-hidden">
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%) skewX(-12deg); }
              100% { transform: translateX(200%) skewX(-12deg); }
            }
          `}</style>
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            style={{ animation: 'shimmer 1.5s infinite linear' }}
          />
        </div>
      )}
      {/* 이미지 로드 실패 */}
      {imageError && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500 text-center px-2" style={{ fontSize: '13px' }}>이미지<br/>로드 실패</p>
        </div>
      )}
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
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ padding: '0 20px' }} data-name="Container">
        <div className="flex flex-col items-center w-full" style={{ gap: '18px', marginBottom: '2px' }}>
            <TarotCardImage imageUrl={imageUrl} cardName={title} />
            <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '25.5px',
                color: '#151515',
                letterSpacing: '-0.36px',
                textAlign: 'left',
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
        textAlign: 'left',
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
        <div className="flex items-start justify-center relative w-full" style={{ padding: '16px 0 20px 0' }}>
          <div className="flex flex-col items-center w-full">
            {/* 카드 라벨 */}
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 600,
              fontSize: '17px',
              lineHeight: '20px',
              color: '#151515',
              letterSpacing: '-0.28px',
              paddingTop: '10px',
              marginBottom: '20px'
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
      className="flex flex-col gap-4 items-start w-full"
      style={{ padding: '12px 20px 230px 20px' }}
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

function BottomButtons({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isNextPressed, setIsNextPressed] = useState(false);

  const handlePrevPress = () => setIsPrevPressed(true);
  const handlePrevRelease = () => setIsPrevPressed(false);
  const handleNextPress = () => setIsNextPressed(true);
  const handleNextRelease = () => setIsNextPressed(false);

  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            onMouseDown={handlePrevPress}
            onMouseUp={handlePrevRelease}
            onMouseLeave={handlePrevRelease}
            onTouchStart={handlePrevPress}
            onTouchEnd={handlePrevRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isPrevPressed ? '#E4F7F7' : '#f0f8f8',
              height: '56px',
              transform: isPrevPressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#48b2af',
              letterSpacing: '-0.32px'
            }}>이전</p>
          </button>

          {/* 다음 버튼 */}
          <button
            onClick={onNext}
            onMouseDown={handleNextPress}
            onMouseUp={handleNextRelease}
            onMouseLeave={handleNextRelease}
            onTouchStart={handleNextPress}
            onTouchEnd={handleNextRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isNextPressed ? '#41A09E' : '#48b2af',
              height: '56px',
              transform: isNextPressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
          >
            <p style={{
              fontFamily: 'Pretendard Variable',
              fontWeight: 500,
              fontSize: '16px',
              lineHeight: '25px',
              color: '#ffffff',
              letterSpacing: '-0.32px'
            }}>다음</p>
          </button>
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
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  reportId?: string;
  // 외부에서 데이터 직접 주입 가능
  tarotData?: TarotSelection[];
}

export default function ReportWeeklyTarotResult({
  onClose,
  onPrev,
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
    return <WeeklyReportLoading />;
  }

  if (error && !externalTarotData) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }}>
        <NavigationTopBar onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>타로 결과를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (tarotSelections.length === 0 && !externalTarotData) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }}>
        <NavigationTopBar onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>타로 결과가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative size-full flex flex-col mx-auto h-screen overflow-hidden" style={{ maxWidth: '440px' }} data-name="나의 보고서 (타로 풀이)">
      <NavigationTopBar onClose={onClose} />
      <div className="flex-1 overflow-y-auto w-full relative">
        <CardContainer tarotSelections={tarotSelections} />
      </div>
      <BottomButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
