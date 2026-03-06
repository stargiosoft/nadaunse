import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEV } from '../lib/env';
import { markConsultCompleted } from '../lib/consultStatus';
import svgPaths from '../imports/svg-97glg550pf';
import svgR from '../imports/svg-w53mchi1wt';
import { RecommendedCarousel, type RecommendedItem } from '../components/RecommendedCarousel';
import SEO from '../components/SEO';
import { fetchConsultRecommendations } from '../lib/consultRecommendationService';
import { trackConsultRecommendationClick } from '../utils/analytics';

const imgCardBack  = '/home-v2/taro-card-back.png';
const imgCardFront = '/home-v2/taro-card-front.png';

// ─── Types / Tokens ───────────────────────────────────────────────────────────
type Phase = 'reveal' | 'transition' | 'result';

const C = {
  black:   '#000000',
  dark:    '#151515',
  gray600: '#848484',
  grayBg:  '#f9f9f9',
  white:   '#ffffff',
} as const;
const font = "'Pretendard Variable', sans-serif";



// ─── Icon Components ──────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', flexShrink: 0 }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'translateY(-1px)' }} fill="none" viewBox="0 0 20 20">
        <path d={svgR.p1161bb80} fill="#FDD835" />
      </svg>
    </div>
  );
}

function WaveIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', flexShrink: 0 }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} fill="none" viewBox="0 0 20 20">
        <path d={svgR.p1c507180} fill="#00AAD8" />
        <path d={svgR.p24195000} fill="#00BFFE" />
        <path d={svgR.pa236540}  fill="#24D1FF" />
        <path d={svgR.p2dffb480} fill="#00BFFE" />
      </svg>
    </div>
  );
}

function LeafIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '2.5% 9.3% 0.01% 11.8%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%' }} fill="none" viewBox="0 0 15.7813 19.4978">
          <path d={svgR.p39b4b100} fill="#A5D261" />
          <path d={svgR.p35d6af0}  fill="#78A635" />
        </svg>
      </div>
    </div>
  );
}

function QuoteCircleIcon() {
  return (
    <div style={{ width: 20, height: 20, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '5% 3.12% 1.25% 3.13%' }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%', transform: 'translateY(-1px)' }} fill="none" viewBox="0 0 18.7513 18.75">
          <path d={svgR.p33432f80} fill="#FF6666" />
          <path d={svgR.pe0ec280}  fill="white"   />
          <path d={svgR.p192fa00}  fill="#FF6666" />
          <path d={svgR.p37810980} fill="white"   />
          <path d={svgR.p3b05ed00} fill="#4B596A" />
          <path d={svgR.p2c77ca00} fill="#4B596A" />
        </svg>
      </div>
    </div>
  );
}

// ─── Result Section ───────────────────────────────────────────────────────────
function ResultSection({
  icon, title, text, animStyle,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  animStyle?: React.CSSProperties;
}) {
  return (
    <div className="w-full shrink-0" style={animStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon}
          <span style={{ fontFamily: font, fontSize: 17, fontWeight: 600, color: C.black, letterSpacing: '-0.34px', lineHeight: '24px' }}>
            {title}
          </span>
        </div>
        <div style={{ backgroundColor: C.grayBg, borderRadius: 16, padding: '14px 20px' }}>
          <p style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: C.dark, letterSpacing: '-0.3px', lineHeight: '25.5px' }}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Back Button ──────────────────────────────────────────────────────────────
function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      onTouchStart={() => {}}
      onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#F4F4F4'; }}
      onPointerUp={(e)   => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      style={{ width: 44, height: 44, borderRadius: 12, border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', flexShrink: 0, padding: 4 }}
    >
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path d={svgPaths.p2a5cd480} stroke={C.gray600} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </svg>
    </button>
  );
}

// ─── TaroConsultResultPage ─────────────────────────────────────────────────────
export function TaroConsultResultPage() {
  const navigate = useNavigate();

  // ── localStorage 데이터 파싱 ────────────────────────────────────────────
  const storedData = useMemo(() => {
    try {
      const raw = localStorage.getItem('taro_consult_result');
      if (!raw) return null;
      return JSON.parse(raw) as {
        result: { cardMessage: string; currentFlow: string; actionAdvice: string; dailySentence: string };
        tarotCard: string;
        imageUrl: string;
        recommendedCategory?: { main: string; sub: string };
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!storedData) {
      navigate('/', { replace: true });
    }
  }, [storedData, navigate]);

  // ── 동적 추천 콘텐츠 ────────────────────────────────────────────────────
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>([]);

  useEffect(() => {
    fetchConsultRecommendations(storedData?.recommendedCategory).then((contents) => {
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
  }, [storedData?.recommendedCategory]);

  // ── Reveal state ─────────────────────────────────────────────────────────
  const [isFlipped, setIsFlipped]         = useState(false);
  const [isAnimating, setIsAnimating]     = useState(false);
  const [isGlowActive, setIsGlowActive]   = useState(false);
  const [isGlowPulsing, setIsGlowPulsing] = useState(false);
  const shineRef        = useRef<HTMLDivElement>(null);
  const glowFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowTxTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Transition / result state ─────────────────────────────────────────────
  const _savedPhase = sessionStorage.getItem('taro_result_phase') as Phase | null;
  const _initPhase: Phase = _savedPhase === 'result' ? 'result' : 'reveal';
  const [phase, setPhase] = useState<Phase>(_initPhase);
  const [flyData, setFlyData] = useState<{
    fromLeft: number; fromTop: number; fromWidth: number; fromHeight: number;
    dx: number; dy: number; sx: number; sy: number;
  } | null>(null);
  const [flyAnimating, setFlyAnimating]     = useState(false);
  const [sectionsVisible, setSectionsVisible] = useState(_initPhase === 'result');

  // ── Refs ──────────────────────────────────────────────────────────────────
  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const resultCardRef  = useRef<HTMLDivElement>(null);

  // ── Keyframe injection ────────────────────────────────────────────────────
  useEffect(() => {
    const id = 'taro-shine-keyframes';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes taroShine {
        0%   { transform: translateX(-160%) skewX(-20deg); opacity: 1; }
        30%  { transform: translateX(320%)  skewX(-20deg); opacity: 1; }
        31%  { transform: translateX(320%)  skewX(-20deg); opacity: 0; }
        99%  { transform: translateX(-160%) skewX(-20deg); opacity: 0; }
        100% { transform: translateX(-160%) skewX(-20deg); opacity: 1; }
      }
      .taro-result-scroll::-webkit-scrollbar { display: none; }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => {
    const id = 'taro-glow-keyframes';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes taroGlowIntro {
        0%   { opacity: 0;    transform: translate(-50%,-50%) scale(0.85); }
        55%  { opacity: 0.80; transform: translate(-50%,-50%) scale(1.07); }
        100% { opacity: 0.50; transform: translate(-50%,-50%) scale(1.0);  }
      }
      @keyframes taroGlowPulse {
        0%   { opacity: 0.46; transform: translate(-50%,-50%) scale(1.0);  }
        45%  { opacity: 0.58; transform: translate(-50%,-50%) scale(1.02); }
        100% { opacity: 0.46; transform: translate(-50%,-50%) scale(1.0);  }
      }
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // ── Glow → transition trigger (800ms after pulse starts) ──────────────────
  useEffect(() => {
    if (!isGlowPulsing || phase !== 'reveal') return;
    glowTxTimerRef.current = setTimeout(startCardTransition, 800);
    return () => { if (glowTxTimerRef.current) clearTimeout(glowTxTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlowPulsing]);

  // ── Transition: after result screen mounts, measure & animate ─────────────
  useEffect(() => {
    if (phase !== 'transition') return;

    let raf1: number, raf2: number, raf3: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const to = resultCardRef.current?.getBoundingClientRect();
        if (!to) return;

        setFlyData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            dx: to.left - prev.fromLeft,
            dy: to.top  - prev.fromTop,
            sx: to.width  / prev.fromWidth,
            sy: to.height / prev.fromHeight,
          };
        });

        raf3 = requestAnimationFrame(() => {
          setFlyAnimating(true);
          setTimeout(() => {
            setFlyData(null);
            setFlyAnimating(false);
            setPhase('result');
            sessionStorage.setItem('taro_result_phase', 'result');
            markConsultCompleted('taro');
            setTimeout(() => setSectionsVisible(true), 60);
          }, 520);
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf3);
    };
  }, [phase]);

  // ── Flip handlers ─────────────────────────────────────────────────────────
  const onFlipComplete = () => {
    setIsAnimating(false);
    setIsGlowActive(true);
  };

  const handleFlipTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === 'transform' && isFlipped) {
      if (glowFallbackRef.current) clearTimeout(glowFallbackRef.current);
      onFlipComplete();
    }
  };

  const handleFlip = () => {
    if (isFlipped || isAnimating) return;
    if (shineRef.current) {
      shineRef.current.style.animation = 'none';
      shineRef.current.style.opacity   = '0';
    }
    setIsAnimating(true);
    setIsFlipped(true);
    glowFallbackRef.current = setTimeout(onFlipComplete, 700);
  };

  // ── Start card transition ─────────────────────────────────────────────────
  const startCardTransition = () => {
    const from = cardWrapperRef.current?.getBoundingClientRect();
    if (!from) return;
    setIsGlowActive(false);
    setIsGlowPulsing(false);
    setFlyData({ fromLeft: from.left, fromTop: from.top, fromWidth: from.width, fromHeight: from.height, dx: 0, dy: 0, sx: 1, sy: 1 });
    setPhase('transition');
  };

  // ── DEV ONLY ──────────────────────────────────────────────────────────────
  const handleDevReset = () => {
    [glowFallbackRef, glowTxTimerRef].forEach(r => { if (r.current) clearTimeout(r.current); });
    setIsFlipped(false);
    setIsAnimating(false);
    setIsGlowActive(false);
    setIsGlowPulsing(false);
    setPhase('reveal');
    setFlyData(null);
    setFlyAnimating(false);
    setSectionsVisible(false);
    if (shineRef.current) { shineRef.current.style.opacity = ''; shineRef.current.style.animation = ''; }
  };

  // ── Section animation helper ──────────────────────────────────────────────
  const sectionAnim = (delay: number): React.CSSProperties => ({
    opacity:    sectionsVisible ? 1 : 0,
    transform:  sectionsVisible ? 'none' : 'translateY(12px)',
    transition: `opacity 0.32s ease-out ${delay}ms, transform 0.32s ease-out ${delay}ms`,
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: C.white, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
      <SEO title="타로 상담 결과" noIndex={true} />
      <div style={{ width: '100%', maxWidth: 440, minWidth: 320, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.white, position: 'relative' }}>

        {/* ═════════════════════════════════════════
            REVEAL PHASE
            ══════════════════════════════════════════ */}
        {phase === 'reveal' && (
          <>
            {/* Nav */}
            <div style={{ height: 52, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, backgroundColor: C.white, flexShrink: 0 }}>
              <BackButton onPress={() => navigate(-1)} />
              <p style={{ flex: 1, textAlign: 'center', fontFamily: font, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>타로 상담</p>
              <div style={{ width: 44, flexShrink: 0 }} />
            </div>

            {/* Card reveal area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
              {/* Guide text */}
              <div style={{ width: '100%', flexShrink: 0 }}>
                <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16 }}>
                  <p style={{ fontFamily: font, fontSize: 17, fontWeight: 500, color: C.black, letterSpacing: '-0.34px', lineHeight: '24px', textAlign: 'center', opacity: isFlipped ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>
                    오늘의 고민 카드를 뽑아보세요
                  </p>
                </div>
              </div>

              {/* Card + button (190px column) */}
              <div style={{ width: 190, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                {/* Card wrapper — glow anchor + ref */}
                <div ref={cardWrapperRef} style={{ width: '100%', aspectRatio: '160 / 268', position: 'relative' }}>

                  {/* Glow layer */}
                  {isGlowActive && (
                    <div
                      style={{
                        position: 'absolute', left: '50%', top: '50%',
                        width: '190%', height: '140%',
                        background: 'radial-gradient(ellipse at center, rgba(210,215,255,0.95) 0%, rgba(180,200,255,0.70) 38%, rgba(200,220,255,0.25) 65%, transparent 100%)',
                        filter: 'blur(28px)', borderRadius: '50%',
                        pointerEvents: 'none', zIndex: 0,
                        animation: isGlowPulsing
                          ? 'taroGlowPulse 3.2s ease-in-out infinite'
                          : 'taroGlowIntro 1.1s ease-out forwards',
                      }}
                      onAnimationEnd={() => { if (!isGlowPulsing) setIsGlowPulsing(true); }}
                    />
                  )}

                  {/* 3D flip container */}
                  <div
                    style={{ position: 'absolute', inset: 0, perspective: 1000, cursor: isFlipped ? 'default' : 'pointer', zIndex: 1 }}
                    onClick={handleFlip}
                    onTouchStart={() => {}}
                  >
                    <div
                      style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.6s ease-in-out', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                      onTransitionEnd={handleFlipTransitionEnd}
                    >
                      {/* Back face */}
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden' }}>
                        <img alt="카드 뒷면" src={imgCardBack} style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', display: 'block', transform: 'translateZ(0)' }} />
                        {/* Shine overlay */}
                        <div ref={shineRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '45%', height: '100%', background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%)', willChange: 'transform', animation: 'taroShine 3.6s ease-in-out infinite' }} />
                        </div>
                      </div>
                      {/* Front face */}
                      <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)' }}>
                        <img alt="카드 앞면" src={storedData?.imageUrl || imgCardFront} style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', display: 'block', borderRadius: 16 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* "탭하여 공개" button */}
                <div style={{ opacity: isFlipped ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: isFlipped ? 'none' : 'auto' }}>
                  <button onClick={handleFlip} onTouchStart={() => {}} disabled={isFlipped || isAnimating}
                    style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 12, paddingTop: 6, paddingRight: 16, paddingBottom: 4, paddingLeft: 16, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.white, letterSpacing: '-0.42px', lineHeight: '22px', whiteSpace: 'nowrap' }}>탭하여 공개</span>
                  </button>
                </div>
              </div>

              {/* DEV ONLY — 카드 초기화 버튼 */}
              {DEV && (
                <div style={{ marginTop: 'auto', paddingBottom: 24, display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <button onClick={handleDevReset} onTouchStart={() => {}}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', color: '#9CA3AF', fontFamily: font, fontSize: 12, fontWeight: 400, letterSpacing: '-0.24px', WebkitTapHighlightColor: 'transparent' }}>
                    DEV 카드 초기화
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            TRANSITION + RESULT PHASE
            ══════════════════════════════════════════ */}
        {phase !== 'reveal' && (
          <>
            {/* Nav — close button */}
            <div style={{ height: 52, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, backgroundColor: C.white, flexShrink: 0, position: 'relative', zIndex: 10 }}>
              <div style={{ width: 44, flexShrink: 0 }} />
              <p style={{ flex: 1, textAlign: 'center', fontFamily: font, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>타로 상담</p>
              <button onClick={() => { sessionStorage.removeItem('taro_result_phase'); navigate('/'); }}
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
                style={{ width: 44, height: 44, borderRadius: 12, border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', flexShrink: 0, padding: 4, transition: 'background-color 0.15s ease-out' }}>
                <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path d="M5 19L19 5" stroke={C.gray600} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <path d="M19 19L5 5" stroke={C.gray600} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Scrollable result content */}
            <div
              className="taro-result-scroll"
              style={{
                flex: 1,
                overflowY: phase === 'transition' ? 'hidden' : 'auto',
                WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
              }}
            >
              <div className="flex flex-col" style={{ gap: 24, paddingBottom: 40 }}>

                {/* ── 카드가 전하는 메시지 ── */}
                <div className="w-full shrink-0">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MoonIcon />
                      <span style={{ fontFamily: font, fontSize: 17, fontWeight: 600, color: C.black, letterSpacing: '-0.34px', lineHeight: '24px' }}>카드가 전하는 메시지</span>
                    </div>
                    <div style={{ backgroundColor: C.grayBg, borderRadius: 16, padding: '17px 20px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        {/* Card image + name */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div
                            ref={resultCardRef}
                            style={{
                              width: 150, height: 260,
                              borderRadius: 16,
                              boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)',
                              overflow: 'hidden',
                              flexShrink: 0,
                              opacity: phase === 'result' ? 1 : 0,
                            }}
                          >
                            <img alt="카드 앞면" src={storedData?.imageUrl || imgCardFront} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
                          </div>
                          <p style={{ ...sectionAnim(80), fontFamily: font, fontSize: 15, fontWeight: 600, color: C.dark, letterSpacing: '-0.3px', lineHeight: '25.5px', textAlign: 'center' }}>{storedData?.tarotCard || ''}</p>
                        </div>
                        {/* Card description */}
                        <div style={{ ...sectionAnim(80), width: '100%' }}>
                          <p style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: C.dark, letterSpacing: '-0.3px', lineHeight: '25.5px' }}>{storedData?.result.cardMessage || ''}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 지금 흐름은 ── */}
                <ResultSection
                  icon={<WaveIcon />}
                  title="지금 흐름은"
                  text={storedData?.result.currentFlow || ''}
                  animStyle={sectionAnim(150)}
                />

                {/* ── 이렇게 움직여보세요 ── */}
                <ResultSection
                  icon={<LeafIcon />}
                  title="이렇게 움직여보세요"
                  text={storedData?.result.actionAdvice || ''}
                  animStyle={sectionAnim(230)}
                />

                {/* ── 오늘을 위한 한 문장 ── */}
                <ResultSection
                  icon={<span style={{ display: 'inline-flex', position: 'relative', top: 1 }}><QuoteCircleIcon /></span>}
                  title="오늘을 위한 한 문장"
                  text={storedData?.result.dailySentence || ''}
                  animStyle={sectionAnim(310)}
                />

                {/* ── 이 흐름, 더 깊이 보고 싶다면 ── */}
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
                    onCardClick={(id) => { trackConsultRecommendationClick('taro', id); navigate(`/master/content/detail/${id}`); }}
                    hidePrice
                  />
                  <div style={{ height: 130 }} />
                </div>

              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════
            FLYING CARD OVERLAY
            ══════════════════════════════════════════ */}
        {flyData && (
          <div
            style={{
              position: 'fixed',
              left: flyData.fromLeft,
              top: flyData.fromTop,
              width: flyData.fromWidth,
              height: flyData.fromHeight,
              borderRadius: 16,
              overflow: 'hidden',
              zIndex: 999,
              pointerEvents: 'none',
              transformOrigin: '0 0',
              transform: flyAnimating
                ? `translate(${flyData.dx}px, ${flyData.dy}px) scale(${flyData.sx}, ${flyData.sy})`
                : 'translate(0, 0) scale(1, 1)',
              transition: flyAnimating ? 'transform 0.5s ease-in-out' : 'none',
              willChange: 'transform',
              boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.06), -3px -3px 12px 0px rgba(0,0,0,0.04)',
            }}
          >
            <img
              src={storedData?.imageUrl || imgCardFront}
              alt="카드 전환"
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
