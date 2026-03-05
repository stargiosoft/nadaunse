/**
 * RecommendedCarousel
 * ─────────────────────────────────────────────────────────────────────────────
 * 사주/타로 풀이 하단 '이 흐름, 더 깊이 보고 싶다면' 가로 스크롤 카드 리스트.
 * 모바일: 네이티브 터치 스와이프
 * 데스크탑: 마우스 드래그 + shift+wheel / 트랙패드 가로 스크롤
 * 드래그 중 클릭 오작동 방지 (8px 이상 이동 시 클릭 무시)
 */
import { useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import svgMorePaths from '../imports/svg-1svu7din8s';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RecommendedItem {
  id?: string;
  title: string;
  image: string;
  isNew?: boolean;
  isRead?: boolean;
  views?: number;
  discountLabel?: string;
  originalPrice?: string;
  finalPrice?: string;
}

interface Props {
  items: RecommendedItem[];
  onMoreClick?: () => void;
  onCardClick?: (id: string) => void;
  /** 추가 컨테이너 스타일 (필요 시 덮어쓰기) */
  style?: React.CSSProperties;
  /** 가격 정보 숨김 */
  hidePrice?: boolean;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const font = "'Pretendard Variable', sans-serif";
const C = { black: '#000000', white: '#ffffff' } as const;

// ─── RecommendedCarousel ─────────────────────────────────────────────────────
export function RecommendedCarousel({ items, onMoreClick, onCardClick, style, hidePrice }: Props) {
  // ── Drag / scroll 상태 ────────────────────────────────────────────────────
  const carouselRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ isDown: false, startX: 0, scrollLeft: 0 });
  const isDragging = useRef(false);

  // 데스크탑: shift+wheel / 트랙패드 가로 스크롤 → 가로 이동
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

  // 데스크탑: Pointer 이벤트로 마우스 드래그 (touch 는 네이티브 처리)
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
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
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onCarouselClick}
    >
      {items.map((item, i) => (
        <div
          key={item.id || i}
          className="flex flex-col items-start"
          style={{ width: 200, flexShrink: 0, gap: 8, cursor: item.id && onCardClick ? 'pointer' : undefined }}
          onClick={() => { if (!isDragging.current && item.id && onCardClick) onCardClick(item.id); }}>
          {/* Thumbnail */}
          <div style={{ width: 200, height: 120, borderRadius: 12, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <img
              alt=""
              src={item.image}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
            />
            <div aria-hidden="true" style={{ position: 'absolute', inset: -1, borderRadius: 13, border: '1px solid #f9f9f9' }} />
          </div>

          {/* Card body */}
          <div className="flex flex-col w-full" style={{ gap: 3, paddingLeft: 2, paddingRight: 2 }}>

            {/* Labels row + views */}
            <div className="flex items-center justify-between w-full">
              {/* Left: labels + divider + 읽어봄 */}
              <div className="flex items-center" style={{ gap: 6 }}>
                <div className="flex items-center" style={{ gap: 3 }}>
                  {item.isNew && (
                    <div style={{ backgroundColor: '#fff6f7', borderRadius: 4, padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }}>
                      <span style={{ fontFamily: font, fontSize: 10, fontWeight: 500, color: '#ef6878', lineHeight: 'normal', whiteSpace: 'nowrap' }}>New</span>
                    </div>
                  )}
                  <div style={{ backgroundColor: '#f0f8f8', borderRadius: 4, padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ fontFamily: font, fontSize: 10, fontWeight: 500, color: '#41a09e', lineHeight: 'normal', whiteSpace: 'nowrap' }}>심화</span>
                  </div>
                </div>
                {item.isRead && (
                  <>
                    <svg width="1" height="7" fill="none" viewBox="0 0 1 7">
                      <path d="M0.5 0.5V6.5" stroke="#E7E7E7" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: '#999', lineHeight: '16px', whiteSpace: 'nowrap' }}>읽어봄</span>
                  </>
                )}
              </div>
              {/* Right: eye + count */}
              {item.views != null && (
                <div className="flex items-center" style={{ gap: 2 }}>
                  <div style={{ width: 13, height: 13, position: 'relative', overflow: 'hidden' }}>
                    <svg style={{ position: 'absolute', left: 0.975, top: 3.14, width: 11.05, height: 6.955 }} fill="none" preserveAspectRatio="none" viewBox="0 0 10.2003 6.42045">
                      <path d="M0.600148 3.6C2.40015 -0.4 7.80015 -0.4 9.60015 3.6" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                      <path d="M5.10461 5.67045C4.93577 5.67045 4.76858 5.6372 4.61259 5.57258C4.4566 5.50797 4.31486 5.41326 4.19548 5.29388C4.07609 5.17449 3.98138 5.03275 3.91677 4.87676C3.85215 4.72077 3.8189 4.55358 3.8189 4.38474C3.8189 4.2159 3.85215 4.04871 3.91677 3.89272C3.98138 3.73673 4.07609 3.59499 4.19548 3.4756C4.31486 3.35621 4.4566 3.26151 4.61259 3.19689C4.76858 3.13228 4.93577 3.09902 5.10461 3.09902C5.44561 3.09902 5.77263 3.23448 6.01375 3.4756C6.25487 3.71672 6.39033 4.04375 6.39033 4.38474C6.39033 4.72573 6.25487 5.05276 6.01375 5.29388C5.77263 5.53499 5.44561 5.67045 5.10461 5.67045Z" fill="#B7B7B7" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: '#999', lineHeight: '16px', whiteSpace: 'nowrap' }}>{item.views}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 500, color: C.black, letterSpacing: '-0.3px', lineHeight: '25.5px', width: '100%', marginBottom: -3 }}>
              {item.title}
            </p>

            {/* Price block */}
            {!hidePrice && (
            <div className="flex flex-col">
              <div className="flex items-center" style={{ gap: 4 }}>
                {item.discountLabel && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', width: 14, height: 14 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 14 14" style={{ transform: 'rotate(90deg) scaleY(-1)', display: 'block', marginBottom: 1 }}>
                        <defs><clipPath id={`rc-arrow-clip-${i}`}><rect fill="white" height="14" width="14" /></clipPath></defs>
                        <g clipPath={`url(#rc-arrow-clip-${i})`}>
                          <path d="M2.60754 10.0074C2.52141 9.97776 2.44669 9.92195 2.3938 9.84779C2.34091 9.77363 2.31249 9.6848 2.3125 9.59371C2.3125 7.59488 2.71391 5.99637 3.50605 4.84219C4.46309 3.44766 5.97273 2.6968 8 2.60356V0.406212C8.00001 0.320544 8.02517 0.236764 8.07235 0.165264C8.11954 0.0937642 8.18668 0.0376912 8.26545 0.00400138C8.34421 -0.0296885 8.43113 -0.0395127 8.51543 -0.0242526C8.59973 -0.00899244 8.67769 0.0306805 8.73965 0.0898447L13.5521 4.68359C13.5949 4.72444 13.629 4.77354 13.6522 4.82792C13.6755 4.88229 13.6875 4.94082 13.6875 4.99996C13.6875 5.0591 13.6755 5.11763 13.6522 5.17201C13.629 5.22638 13.5949 5.27548 13.5521 5.31633L8.73965 9.91008C8.67769 9.96924 8.59973 10.0089 8.51543 10.0242C8.43113 10.0394 8.34421 10.0296 8.26545 9.99592C8.18668 9.96223 8.11954 9.90616 8.07235 9.83466C8.02517 9.76316 8.00001 9.67938 8 9.59371V7.4125C6.76953 7.44969 5.83984 7.64902 5.09965 8.03156C4.29984 8.445 3.71988 9.0627 3.0948 9.86359C3.03873 9.9354 2.96164 9.9879 2.87428 10.0138C2.78693 10.0397 2.69368 10.0376 2.60754 10.008V10.0074Z" fill="#FF6678" />
                        </g>
                      </svg>
                    </div>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: '#ff6678', letterSpacing: '-0.26px', lineHeight: '19px', whiteSpace: 'nowrap', marginLeft: -3 }}>
                      {item.discountLabel}
                    </span>
                  </>
                )}
                {item.originalPrice && (
                  <span style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: '#999', lineHeight: '19.5px', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                    {item.originalPrice}
                  </span>
                )}
              </div>
              {item.finalPrice && (
                <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.42px', lineHeight: '20px', whiteSpace: 'nowrap', marginTop: 1 }}>
                  {item.finalPrice}
                </span>
              )}
            </div>
            )}

          </div>
        </div>
      ))}

      {/* 더 볼래요! — 마지막 아이템 */}
      <div
        data-more-btn
        style={{ alignSelf: 'stretch', flexShrink: 0, display: 'flex', alignItems: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
        onClick={onMoreClick}
        onTouchStart={() => {}}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Dashed border box */}
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
        {/* Arrow icon */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, marginLeft: -22, backgroundColor: C.white, borderRadius: '50%', position: 'relative', zIndex: 1 }}>
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
  );
}
