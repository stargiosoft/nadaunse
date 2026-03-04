import { useRef, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markConsultCompleted } from '../lib/consultStatus';
import { motion } from 'motion/react';
import svgPaths from '../imports/svg-64m32mfmx4';
import svgMorePaths from '../imports/svg-1svu7din8s';

// ─── Asset paths ─────────────────────────────────────────────────────────────
const imgThumbnail = '/home-v2/result-thumbnail.png';
const imgCard1 = '/home-v2/card-1.png';
const imgCard2 = '/home-v2/card-4.png';
const imgCard3 = '/home-v2/card-5.png';
const imgCard4 = '/home-v2/card-6.png';
const imgCard5 = '/home-v2/card-7.png';
const imgCard6 = '/home-v2/card-8.png';

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

  useEffect(() => {
    markConsultCompleted('saju');
  }, []);

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

  // ── 캐러셀 드래그 상태 ──────────────────────────────────────────────────────
  const carouselRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0 });
  const isDragging = useRef(false);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (e.shiftKey || isHorizontal) {
        e.preventDefault();
        el.scrollLeft += isHorizontal ? e.deltaX : e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if ((e.target as HTMLElement).closest('[data-more-btn]')) return;
    const el = carouselRef.current;
    if (!el) return;
    drag.current = { isDown: true, startX: e.pageX, scrollLeft: el.scrollLeft };
    isDragging.current = false;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (!drag.current.isDown) return;
    const walk = e.pageX - drag.current.startX;
    if (Math.abs(walk) > 8) isDragging.current = true;
    const el = carouselRef.current;
    if (el) el.scrollLeft = drag.current.scrollLeft - walk;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    drag.current.isDown = false;
    const el = carouselRef.current;
    if (el) { el.style.cursor = 'grab'; el.style.userSelect = ''; }
    setTimeout(() => { isDragging.current = false; }, 80);
  }, []);

  const onCarouselClick = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

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

  const cardImages = [imgCard1, imgCard2, imgCard3, imgCard4, imgCard5, imgCard6];

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
                      <span style={{ ...bodyText, fontWeight: 400 }}>형</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: C.cardBg, borderRadius: 16, padding: 20 }}>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <span style={labelText}>포인트</span>
                      <span style={{ ...bodyText, fontWeight: 400 }}>감정보단 판단</span>
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
                    오늘은 속도를 줄이고 내 마음의 리듬을 먼저 살펴보세요. 서두르기보다 한 번 더 생각하는 선택이 좋습니다. 작은 결정이라도 나에게 편한 방향을 택하면 흐름이 부드러워질 거예요.
                  </p>
                </Card>
              </div>
            </div>

            {/* ─── 3. 이렇게 흘러가요 ─── */}
            <div className="flex flex-col w-full" style={{ padding: '10px 20px', ...sectionAnim(160) }}>
              <div className="flex flex-col w-full" style={{ gap: 10 }}>
                <SectionHeader icon={<PinIcon />} title="이렇게 흘러가요" />
                <div className="flex flex-col w-full" style={{ gap: 8 }}>
                  <Card>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <span style={labelText}>일/학업</span>
                      <span style={bodyText}>현재 계획을 유지하는 것이 좋습니.</span>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <span style={labelText}>인간관계</span>
                      <span style={bodyText}>급한 답은 잠시 미뤄도 괜찮습니다.</span>
                    </div>
                  </Card>
                  <Card>
                    <div className="flex flex-col" style={{ gap: 6 }}>
                      <span style={labelText}>재물</span>
                      <span style={bodyText}>충동 지출은 한 번 더 생각해보는 것이 좋습니다.</span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* ─── 4. 이것은 조심하세요 ─── */}
            <div className="flex flex-col w-full" style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, ...sectionAnim(240) }}>
              <div className="flex flex-col w-full" style={{ gap: 10 }}>
                <SectionHeader icon={<AlertIcon />} title="이것은 조심하세요" />
                <Card>
                  <p style={bodyText}>
                    감정이 예민하게 작용할 수 있습니다. 바로 반응하기보다 한 박자 멈추는 태도가 필요합니다. 차분함이 불필요한 오해를 줄여줄 거예요.
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
                    겉으로는 변화가 적어 보여도 내면에서는 방향이 정리되고 있습니다. 주변의 속도에 휩쓸리지 않는 것이 중요합니다. 관찰하는 태도가 하루의 중심을 잡아줄 거예요.
                    <br />
                    차분함을 유지하면 안정적인 하루로 마무리될 수 있습니다.
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

              {/* Horizontal scroll carousel */}
              <div
                ref={carouselRef}
                style={{
                  display: 'flex',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingLeft: 20,
                  paddingRight: 20,
                  gap: 8,
                  WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
                  cursor: 'grab',
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClick={onCarouselClick}
              >
                {[
                  { title: '혹시 지금 바람 피우고 있을까?' },
                  { title: '내 연인은 바람기 있을까?' },
                  { title: '우리 관계, 앞으로 어떻게 될까?' },
                  { title: '이 사람, 나를 진심으로 좋아할까?' },
                  { title: '올해 직장운, 버텨야 할까 떠나야 할까?' },
                  { title: '재물운 언제 풀릴까?' },
                ].map(({ title }, i) => (
                  <div key={i} className="flex flex-col items-start" style={{ width: 200, flexShrink: 0, gap: 8 }}>
                    <div style={{ width: 200, height: 120, borderRadius: 12, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                      <img alt="" src={cardImages[i]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                      <div aria-hidden="true" style={{ position: 'absolute', inset: -1, borderRadius: 13, border: '1px solid #f9f9f9' }} />
                    </div>

                    <div className="flex flex-col w-full" style={{ gap: 3, paddingLeft: 2, paddingRight: 2 }}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center" style={{ gap: 6 }}>
                          <div className="flex items-center" style={{ gap: 3 }}>
                            {i < 4 && (
                              <div style={{ backgroundColor: '#fff6f7', borderRadius: 4, padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }}>
                                <span style={{ fontFamily: font, fontSize: 10, fontWeight: 500, color: '#ef6878', lineHeight: 'normal', whiteSpace: 'nowrap' }}>New</span>
                              </div>
                            )}
                            <div style={{ backgroundColor: '#f0f8f8', borderRadius: 4, padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }}>
                              <span style={{ fontFamily: font, fontSize: 10, fontWeight: 500, color: '#41a09e', lineHeight: 'normal', whiteSpace: 'nowrap' }}>심화</span>
                            </div>
                          </div>
                          {i < 2 && (
                            <>
                              <svg width="1" height="7" fill="none" viewBox="0 0 1 7">
                                <path d="M0.5 0.5V6.5" stroke="#E7E7E7" strokeLinecap="round" />
                              </svg>
                              <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: '#999', lineHeight: '16px', whiteSpace: 'nowrap' }}>읽어봄</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center" style={{ gap: 2 }}>
                          <div style={{ width: 13, height: 13, position: 'relative', overflow: 'hidden' }}>
                            <svg style={{ position: 'absolute', left: 0.975, top: 3.14, width: 11.05, height: 6.955 }} fill="none" preserveAspectRatio="none" viewBox="0 0 10.2003 6.42045">
                              <path d="M0.600148 3.6C2.40015 -0.4 7.80015 -0.4 9.60015 3.6" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                              <path d="M5.10461 5.67045C4.93577 5.67045 4.76858 5.6372 4.61259 5.57258C4.4566 5.50797 4.31486 5.41326 4.19548 5.29388C4.07609 5.17449 3.98138 5.03275 3.91677 4.87676C3.85215 4.72077 3.8189 4.55358 3.8189 4.38474C3.8189 4.2159 3.85215 4.04871 3.91677 3.89272C3.98138 3.73673 4.07609 3.59499 4.19548 3.4756C4.31486 3.35621 4.4566 3.26151 4.61259 3.19689C4.76858 3.13228 4.93577 3.09902 5.10461 3.09902C5.44561 3.09902 5.77263 3.23448 6.01375 3.4756C6.25487 3.71672 6.39033 4.04375 6.39033 4.38474C6.39033 4.72573 6.25487 5.05276 6.01375 5.29388C5.77263 5.53499 5.44561 5.67045 5.10461 5.67045Z" fill="#B7B7B7" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" />
                            </svg>
                          </div>
                          <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: '#999', lineHeight: '16px', whiteSpace: 'nowrap' }}>{[324, 187, 512, 93, 248, 61][i]}</span>
                        </div>
                      </div>

                      <p style={{ fontFamily: font, fontSize: 15, fontWeight: 500, color: C.black, letterSpacing: '-0.3px', lineHeight: '25.5px', width: '100%', marginBottom: -3 }}>
                        {title}
                      </p>

                      <div className="flex flex-col">
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', width: 14, height: 14 }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 14 14" style={{ transform: 'rotate(90deg) scaleY(-1)', display: 'block', marginBottom: 1 }}>
                              <defs><clipPath id={`arrow-clip-${i}`}><rect fill="white" height="14" width="14" /></clipPath></defs>
                              <g clipPath={`url(#arrow-clip-${i})`}>
                                <path d="M2.60754 10.0074C2.52141 9.97776 2.44669 9.92195 2.3938 9.84779C2.34091 9.77363 2.31249 9.6848 2.3125 9.59371C2.3125 7.59488 2.71391 5.99637 3.50605 4.84219C4.46309 3.44766 5.97273 2.6968 8 2.60356V0.406212C8.00001 0.320544 8.02517 0.236764 8.07235 0.165264C8.11954 0.0937642 8.18668 0.0376912 8.26545 0.00400138C8.34421 -0.0296885 8.43113 -0.0395127 8.51543 -0.0242526C8.59973 -0.00899244 8.67769 0.0306805 8.73965 0.0898447L13.5521 4.68359C13.5949 4.72444 13.629 4.77354 13.6522 4.82792C13.6755 4.88229 13.6875 4.94082 13.6875 4.99996C13.6875 5.0591 13.6755 5.11763 13.6522 5.17201C13.629 5.22638 13.5949 5.27548 13.5521 5.31633L8.73965 9.91008C8.67769 9.96924 8.59973 10.0089 8.51543 10.0242C8.43113 10.0394 8.34421 10.0296 8.26545 9.99592C8.18668 9.96223 8.11954 9.90616 8.07235 9.83466C8.02517 9.76316 8.00001 9.67938 8 9.59371V7.4125C6.76953 7.44969 5.83984 7.64902 5.09965 8.03156C4.29984 8.445 3.71988 9.0627 3.0948 9.86359C3.03873 9.9354 2.96164 9.9879 2.87428 10.0138C2.78693 10.0397 2.69368 10.0376 2.60754 10.008V10.0074Z" fill="#FF6678" />
                              </g>
                            </svg>
                          </div>
                          <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: '#ff6678', letterSpacing: '-0.26px', lineHeight: '19px', whiteSpace: 'nowrap', marginLeft: -3 }}>50%할인</span>
                          <span style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: '#999', lineHeight: '19.5px', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>60새싹</span>
                        </div>
                        <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.42px', lineHeight: '20px', whiteSpace: 'nowrap', marginTop: 1 }}>30새싹</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 더 볼래요! */}
                <div
                  data-more-btn
                  style={{ alignSelf: 'stretch', flexShrink: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                  onClick={() => navigate('/saju-consult/result/recommended')}
                  onTouchStart={() => {}}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div
                    style={{ width: 200, height: '100%', borderRadius: 12, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 0.15s ease' }}
                    onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#F4F4F4'; }}
                    onPointerUp={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px dashed #d4d4d4', pointerEvents: 'none' }} />
                    <span style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: '#999', letterSpacing: '-0.3px', lineHeight: '25.5px', whiteSpace: 'nowrap' }}>
                      더 볼래요!
                    </span>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, marginLeft: -22, backgroundColor: '#ffffff', borderRadius: '50%', position: 'relative', zIndex: 1 }}>
                    <motion.div
                      style={{ transform: 'rotate(180deg) scaleY(-1)', display: 'flex' }}
                      animate={{ x: [-5, 5] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                    >
                      <svg width="30" height="24" fill="none" preserveAspectRatio="none" viewBox="0 0 30 24" style={{ transform: 'scaleX(-1)' }}>
                        <path d={svgMorePaths.p25f6fa00} fill="#D4D4D4" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>
              <div style={{ height: 130 }} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
