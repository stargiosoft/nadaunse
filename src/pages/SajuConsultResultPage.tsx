import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { markConsultCompleted } from '../lib/consultStatus';
import svgPaths from '../imports/svg-64m32mfmx4';
import SEO from '../components/SEO';
import { RecommendedCarousel, type RecommendedItem } from '../components/RecommendedCarousel';
import { fetchConsultRecommendations } from '../lib/consultRecommendationService';
import { trackConsultRecommendationClick } from '../utils/analytics';

// ─── 사주 상담 결과 타입 ──────────────────────────────────────────────────────
interface SajuConsultResult {
  todayCore: { keyword: string; point: string };
  advice: string;
  flow: Array<{ title: string; content: string }>;
  caution: string;
  overallFlow: string;
  recommendedCategory?: { main: string; sub: string };
}

// ─── Asset paths ─────────────────────────────────────────────────────────────
const imgThumbnail = '/home-v2/result-thumbnail.png';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  black:       '#000000',
  charcoal:    '#151515',
  gray600:     '#848484',
  gray400:     '#999999',
  white:       '#ffffff',
  cardBg:      '#f9f9f9',
  primary:     '#48b2af',
  labelBg:     '#f0f8f8',
  labelText:   '#41a09e',
  discountRed: '#ff6678',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── Shared press-effect button style ─────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
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
};

function useNavPress(onPress: () => void) {
  return {
    onClick: onPress,
    onTouchStart: () => {},
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = '#F4F4F4';
      const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
      if (inner) inner.style.transform = 'scale(0.88)';
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
      if (inner) inner.style.transform = 'scale(1)';
    },
    onPointerLeave: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
      if (inner) inner.style.transform = 'scale(1)';
    },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
      if (inner) inner.style.transform = 'scale(1)';
    },
  };
}

// ─── Section icon components ───────────────────────────────────────────────────

function BullseyeIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: '5% 3.12% 1.25% 3.13%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 18.7513 18.75">
          <path d={svgPaths.p33432f80} fill="#FF6666" />
          <path d={svgPaths.pe0ec280}  fill="white" />
          <path d={svgPaths.p192fa00}  fill="#FF6666" />
          <path d={svgPaths.p37810980} fill="white" />
          <path d={svgPaths.p3b05ed00} fill="#4B596A" />
          <path d={svgPaths.p2c77ca00} fill="#4B596A" />
        </svg>
      </div>
    </div>
  );
}

function BulbIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: '0 12.5% 3.13% 12.5%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 15 19.375">
          <path d={svgPaths.p145c4a00} fill="#FFD111" />
          <path d={svgPaths.p1acddd80} fill="#FFAE00" />
          <path d={svgPaths.p2ce88100} fill="#7E8A97" />
          <path d={svgPaths.p392a5c80} fill="#4B596A" />
        </svg>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: '5.21% 17.68% 5.21% 17.73%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 12.9167 17.916">
          <path d={svgPaths.p2860f500} fill="#CBD7EF" />
          <path d={svgPaths.p10a0c680} fill="#FF6666" />
          <path d={svgPaths.p28b14300} fill="#FF6666" />
          <path d={svgPaths.p20c90680} fill="#FF6666" />
        </svg>
      </div>
    </div>
  );
}

function AlertIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: '4.17% 5% 2.5% 5%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%', top: '-1px' }} fill="none" preserveAspectRatio="none" viewBox="0 0 18 18.6667">
          <path d={svgPaths.p20c8b080} fill="#FF6666" />
        </svg>
      </div>
      <div style={{ position: 'absolute', inset: '27.5% 45% 22.5% 45%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%', top: '-1px' }} fill="none" preserveAspectRatio="none" viewBox="0 0 2 10">
          <path d={svgPaths.p3d76f100} fill="white" />
        </svg>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: '7.5% 5%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%', top: '-1px' }} fill="none" preserveAspectRatio="none" viewBox="0 0 18 17">
          <path d={svgPaths.p1f0bdc00} fill="#FFD111" />
        </svg>
      </div>
    </div>
  );
}

// ─── Section header helper ────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center" style={{ gap: 6, flexShrink: 0 }}>
      {icon}
      <span
        style={{
          fontFamily: font,
          fontSize: 17,
          fontWeight: 600,
          color: C.black,
          letterSpacing: '-0.34px',
          lineHeight: '24px',
        }}
      >
        {title}
      </span>
    </div>
  );
}

// ─── Card container ────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: C.cardBg,
        borderRadius: 16,
        width: '100%',
        flexShrink: 0,
        padding: 20,
      }}
    >
      {children}
    </div>
  );
}

// ─── SajuConsultResultPage ────────────────────────────────────────────────────
export function SajuConsultResultPage() {
  const navigate = useNavigate();

  const homePress  = useNavPress(() => navigate('/'));
  const closePress = useNavPress(() => navigate('/'));

  // localStorage에서 결과 데이터 읽기
  const result = useMemo<SajuConsultResult | null>(() => {
    try {
      const raw = localStorage.getItem('saju_consult_result');
      if (!raw) return null;
      return JSON.parse(raw) as SajuConsultResult;
    } catch {
      return null;
    }
  }, []);

  // 결과 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!result) {
      navigate('/', { replace: true });
    }
  }, [result, navigate]);

  useEffect(() => {
    if (result) {
      markConsultCompleted('saju');
    }
  }, [result]);

  const [sectionsVisible, setSectionsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSectionsVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const sectionAnim = (delay: number): React.CSSProperties => ({
    opacity:    sectionsVisible ? 1 : 0,
    transform:  sectionsVisible ? 'none' : 'translateY(12px)',
    transition: `opacity 0.32s ease-out ${delay}ms, transform 0.32s ease-out ${delay}ms`,
  });

  // ── 동적 추천 콘텐츠 ────────────────────────────────────────────────────
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);

  useEffect(() => {
    fetchConsultRecommendations(result?.recommendedCategory).then((contents) => {
      setRecommendedItems(contents.map((c) => ({
        id: c.id,
        title: c.title,
        image: c.thumbnail_url || '/home-v2/card-1.png',
        views: c.view_count,
        discountLabel: c.discount_rate > 0 ? `${c.discount_rate}%할인` : undefined,
        originalPrice: c.discount_rate > 0 ? `${c.price_original}새싹` : undefined,
        finalPrice: `${c.price_discount}새싹`,
      })));
    });
  }, [result?.recommendedCategory]);

  const bodyText: React.CSSProperties = {
    fontFamily: font,
    fontSize: 15,
    fontWeight: 400,
    color: C.charcoal,
    letterSpacing: '-0.3px',
    lineHeight: '25.5px',
  };

  const labelText: React.CSSProperties = {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 400,
    color: C.gray600,
    letterSpacing: '-0.26px',
    lineHeight: '19px',
  };

  if (!result) return null;

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
        <SEO title="사주 상담 결과" noIndex={true} />
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
          <div style={{ width: 44, flexShrink: 0 }} />
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
          <button {...closePress} style={navBtnStyle}>
            <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M5 19L19 5" stroke={C.gray600} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                <path d="M19 19L5 5" stroke={C.gray600} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </span>
          </button>
        </div>

        {/* ── 본문 스크롤 영역 ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          }}
        >
          <div className="flex flex-col" style={{ gap: 24, paddingBottom: 40 }}>

            {/* ─── 1. 오늘의 핵심 ─── */}
            <div className="flex flex-col w-full" style={{ padding: '10px 20px', ...sectionAnim(0) }}>
              <div className="flex flex-col w-full" style={{ gap: 10 }}>
                <SectionHeader icon={<BullseyeIcon />} title="오늘의 핵심" />
                <div className="flex w-full" style={{ gap: 8 }}>
                  <div style={{ flex: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 20 }}>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <span style={labelText}>키워드</span>
                      <span style={{ ...bodyText, fontWeight: 400 }}>{result.todayCore.keyword}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 20 }}>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <span style={labelText}>포인트</span>
                      <span style={{ ...bodyText, fontWeight: 400 }}>{result.todayCore.point}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 2. 이렇게 해보세요 ─── */}
            <div className="flex flex-col w-full" style={{ padding: '10px 20px', ...sectionAnim(80) }}>
              <div className="flex flex-col w-full" style={{ gap: 10 }}>
                <SectionHeader icon={<BulbIcon />} title="이렇게 해보세요" />
                <Card>
                  <p style={bodyText}>
                    {result.advice}
                  </p>
                </Card>
              </div>
            </div>

            {/* ─── 3. 이렇게 흘러가요 ─── */}
            <div className="flex flex-col w-full" style={{ padding: '10px 20px', ...sectionAnim(160) }}>
              <div className="flex flex-col w-full" style={{ gap: 10 }}>
                <SectionHeader icon={<PinIcon />} title="이렇게 흘러가요" />
                <div className="flex flex-col w-full" style={{ gap: 8 }}>
                  {result.flow.map((item, idx) => (
                    <Card key={idx}>
                      <div className="flex flex-col" style={{ gap: 6 }}>
                        <span style={labelText}>{item.title}</span>
                        <span style={bodyText}>{item.content}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── 4. 이것은 조심하세요 ─── */}
            <div className="flex flex-col w-full" style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, ...sectionAnim(240) }}>
              <div className="flex flex-col w-full" style={{ gap: 10 }}>
                <SectionHeader icon={<AlertIcon />} title="이것은 조심하세요" />
                <Card>
                  <p style={bodyText}>
                    {result.caution}
                  </p>
                </Card>
              </div>
            </div>

            {/* ─── 5. 전체 운의 흐름 ─── */}
            <div className="flex flex-col w-full" style={{ paddingLeft: 20, paddingRight: 20, ...sectionAnim(320) }}>
              <div className="flex flex-col w-full" style={{ gap: 10 }}>
                <SectionHeader icon={<StarIcon />} title="전체 운의 흐름" />
                <Card>
                  <p style={bodyText}>
                    {result.overallFlow}
                  </p>
                </Card>
              </div>
            </div>

            {/* ─── 6. 이 흐름, 더 깊이 보고 싶다면 ─── */}
            <div className="flex flex-col w-full" style={{ paddingTop: 8, ...sectionAnim(400) }}>
              <div style={{ width: '100%', height: 8, backgroundColor: '#f9f9f9', marginBottom: 24 }} />

              <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 16 }}>
                <p
                  style={{
                    fontFamily: font,
                    fontSize: 17,
                    fontWeight: 600,
                    color: C.black,
                    letterSpacing: '-0.34px',
                    lineHeight: '24px',
                    marginBottom: -9,
                  }}
                >
                  이 흐름, 더 깊이 보고 싶다면
                </p>
              </div>

              <RecommendedCarousel
                items={recommendedItems}
                onMoreClick={() => navigate('/saju-consult/result/recommended')}
                onCardClick={(id) => { trackConsultRecommendationClick('saju', id); navigate(`/master/content/detail/${id}`); }}
                hidePrice
              />
              <div style={{ height: 130 }} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
