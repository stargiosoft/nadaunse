import { useNavigate } from 'react-router-dom';
import svgInitialEmptyPaths from "@/imports/svg-stihufhx0o";
import CardContent from "@/components/CardContent";

function InitialEmptySummary() {
  const navigate = useNavigate();

  const handleGoToTags = () => {
    // 홈으로 이동 시 무료 체험판 필터 자동 선택
    localStorage.setItem('homeFilter', JSON.stringify({ category: '전체', contentType: 'free' }));
    navigate('/');
  };

  return (
    <div className="flex flex-col w-full bg-white" style={{ paddingBottom: '22px' }}>
      <div className="flex flex-col items-center pb-0 w-full" style={{ padding: '48px 20px 0 20px', gap: '36px' }}>
        {/* Flower Icon & Text */}
        <div className="flex flex-col items-center w-full" style={{ gap: '20px' }}>
          <div className="relative" style={{ width: '48px', height: '48px' }}>
            <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" viewBox="0 0 48.0038 46.4307">
              <path clipRule="evenodd" d={svgInitialEmptyPaths.p8ff0d80} fill="#F3F3F3" fillRule="evenodd" />
              <path d={svgInitialEmptyPaths.p3195a000} fill="#D4D4D4" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center w-full" style={{ gap: '2px' }}>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#b7b7b7' }} className="w-full">
              아직  저장한 태그가 없어요
            </p>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7' }} className="w-full">
              운세를 볼수록 태그가 쌓여요
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="w-full flex items-center justify-center transition-all"
          style={{ height: '48px', borderRadius: '12px', backgroundColor: '#48b2af' }}
          onClick={handleGoToTags}
          onTouchStart={(e) => {
            e.currentTarget.style.backgroundColor = '#41a09e';
            e.currentTarget.style.transform = 'scale(0.99)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = '#41a09e';
            e.currentTarget.style.transform = 'scale(0.99)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff' }}>
            태그 쌓으러 가기
          </span>
        </button>
      </div>
    </div>
  );
}

function RecommendationCardList() {
  return (
    <div className="flex flex-col w-full" style={{ padding: '20px 0 40px 0', gap: '12px' }}>
      <div className="flex items-center w-full" style={{ padding: '0 20px' }}>
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 600, fontSize: '17px', lineHeight: '24px', letterSpacing: '-0.34px', color: '#000000' }}>
          태그 쌓기 좋은 운세
        </p>
      </div>

      <div className="w-full">
        <CardContent />
      </div>
    </div>
  );
}

export default function MyReportEmpty() {
  return (
    <>
      <InitialEmptySummary />
      <div className="w-full" style={{ height: '12px', backgroundColor: '#f9f9f9' }} />
      <RecommendationCardList />
      <div className="flex-1" />
    </>
  );
}
