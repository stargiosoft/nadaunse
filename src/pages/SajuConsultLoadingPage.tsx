import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import svgPaths from '../imports/svg-97glg550pf';
import lottieData from '../imports/animated-shape-effect.json';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  black:   '#000000',
  gray600: '#848484',
  white:   '#ffffff',
  text:    '#3d3d3d',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── Back button ─────────────────────────────────────────────────────────────
function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      onTouchStart={() => {}}
      onPointerDown={(e) => {
        e.currentTarget.style.backgroundColor = '#F4F4F4';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(0.88)';
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      }}
      onPointerCancel={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      }}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        border: 'none',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
        padding: 4,
        transition: 'background-color 0.15s ease-out',
      }}
    >
      <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            d={svgPaths.p2a5cd480}
            stroke={C.gray600}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            strokeWidth="1.7"
          />
        </svg>
      </span>
    </button>
  );
}

// ─── SajuConsultLoadingPage ──────────────────────────────────────────────────
export function SajuConsultLoadingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.removeItem('saju_consult_draft');
      navigate('/saju-consult/result');
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: C.white,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.white,
        }}
      >
        {/* ── 상단 네비게이션 ── */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 4,
            paddingBottom: 4,
            backgroundColor: C.white,
            flexShrink: 0,
          }}
        >
          <BackButton onPress={() => navigate(-1)} />
          <p
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: font,
              fontSize: 18,
              fontWeight: 600,
              color: C.black,
              letterSpacing: '-0.36px',
              lineHeight: '25.5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            사주 상담
          </p>
          <div style={{ width: 44, flexShrink: 0 }} />
        </div>

        {/* ── 로딩 콘텐츠 ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 48,
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 48,
          }}
        >
          <div style={{ width: 160, height: 160, flexShrink: 0 }}>
            <Lottie
              animationData={lottieData}
              loop
              autoplay
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <p
              style={{
                fontFamily: font,
                fontSize: 15,
                fontWeight: 400,
                color: C.text,
                letterSpacing: '-0.3px',
                lineHeight: '25.5px',
                textAlign: 'center',
                width: 302,
              }}
            >
              지금의 마음을 읽고 있어요
            </p>
            <p
              style={{
                fontFamily: font,
                fontSize: 15,
                fontWeight: 400,
                color: C.text,
                letterSpacing: '-0.3px',
                lineHeight: '25.5px',
                textAlign: 'center',
                width: 302,
              }}
            >
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
