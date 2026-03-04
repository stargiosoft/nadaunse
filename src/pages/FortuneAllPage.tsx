import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import svgPaths from '../imports/svg-hzfdemyje6';
import { useScrollDirection } from '../hooks/useScrollDirection';

// ─── Asset paths ─────────────────────────────────────────────────────────────
const img1  = '/home-v2/card-1.png';
const img2  = '/home-v2/card-4.png';
const img3  = '/home-v2/card-5.png';
const img4  = '/home-v2/card-6.png';
const img5  = '/home-v2/card-7.png';
const img6  = '/home-v2/card-8.png';
const img7  = '/home-v2/card-9.png';
const img8  = '/home-v2/card-10.png';
const img9  = '/home-v2/card-11.png';
const img10 = '/home-v2/card-12.png';
const img11 = '/home-v2/card-13.png';
const img12 = '/home-v2/card-14.png';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:  '#48b2af',
  black:    '#000000',
  charcoal: '#151515',
  gray600:  '#848484',
  gray400:  '#999999',
  gray200:  '#E7E7E7',
  inputBg:  '#f8f8f8',
  white:    '#ffffff',
  newBg:    '#fff6f7', newText:  '#ef6878',
  freeBg:   '#f0f8ff', freeText: '#4590d6',
  advBg:    '#f0f8f8', advText:  '#41a09e',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── Data ─────────────────────────────────────────────────────────────────────
export type LabelType = 'New' | '무료' | '심화' | '유료';

export interface FortuneItem {
  rank:     number;
  title:    string;
  labels:   LabelType[];
  views:    number;
  showRead?: boolean;
  img:      string;
  featured?: boolean;
  keywords?: string[];
}

const TABS = ['연애', '이별', '재물', '직업', '인간관계', '시험/ 학업'];

export const ALL_ITEMS: FortuneItem[] = [
  { rank: 1,  title: '저 사람, 나한테 왜 그럴까 알려줘',    labels: ['New', '무료'], views: 27,  showRead: true, img: img1,  featured: true,
    keywords: ['사람', '인간관계', '대인관계', '상대방', '심리', '행동', '관계'] },
  { rank: 2,  title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['심화'],        views: 100, img: img2,
    keywords: ['사람', '인연', '운명', '상대', '인간관계', '연애', '이성'] },
  { rank: 3,  title: '내돈은 다 어디갔을까?',               labels: ['무료'],        views: 100, img: img2,
    keywords: ['재물', '돈', '금전', '지출', '경제', '소비'] },
  { rank: 4,  title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['New', '무료'], views: 100, img: img2,
    keywords: ['사람', '인연', '운명', '상대', '인간관계', '연애', '이성'] },
  { rank: 5,  title: '내 인생 리즈 시절은 언제?',            labels: ['심화'],        views: 100, img: img3,
    keywords: ['인생', '전성기', '미래', '운', '전망'] },
  { rank: 6,  title: '내돈은 다 어디갔을까?',               labels: ['심화'],        views: 100, img: img4,
    keywords: ['재물', '돈', '금전', '지출', '경제', '소비'] },
  { rank: 7,  title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['New', '무료'], views: 100, img: img5,
    keywords: ['사람', '인연', '운명', '상대', '인간관계', '연애', '이성'] },
  { rank: 8,  title: '내돈은 다 어디갔을까?',               labels: ['심화'],        views: 100, img: img6,
    keywords: ['재물', '돈', '금전', '지출', '경제', '소비'] },
  { rank: 9,  title: '내 인생 리즈 시절은 언제?',            labels: ['심화'],        views: 100, img: img7,
    keywords: ['인생', '전성기', '미래', '운', '전망'] },
  { rank: 10, title: '내돈은 다 어디갔을까?',               labels: ['무료'],        views: 100, img: img8,
    keywords: ['재물', '돈', '금전', '지출', '경제', '소비'] },
  { rank: 11, title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['New', '무료'], views: 100, img: img9,
    keywords: ['사람', '인연', '운명', '상대', '인간관계', '연애', '이성'] },
  { rank: 12, title: '내 몸에 숨겨진 질병, 시한폭탄 같은',  labels: ['심화'],        views: 100, img: img10,
    keywords: ['건강', '몸', '질병', '건강운', '신체'] },
];

// ─── Atom: Label Badge ────────────────────────────────────────────────────────
const LABEL_MAP: Record<LabelType, [string, string]> = {
  'New':  [C.newBg,  C.newText],
  '무료': [C.freeBg, C.freeText],
  '심화': [C.advBg,  C.advText],
  '유료': ['#f5f5f5', '#999999'],
};

export function LabelBadge({ type }: { type: LabelType }) {
  const [bg, color] = LABEL_MAP[type];
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{ backgroundColor: bg, color, fontFamily: font, fontSize: 11, fontWeight: 500, lineHeight: '15px', borderRadius: 4, padding: '0 4px' }}
    >
      {type}
    </span>
  );
}

// ─── Atom: Eye Icon (from Figma SVG paths) ────────────────────────────────────
export function EyeIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[12px]">
      <div className="absolute inset-[29.17%_12.5%_28.56%_12.5%]">
        <div className="absolute inset-[-11.83%_-6.67%_-14.79%_-6.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.2003 6.42143">
            <path d={svgPaths.p1e926900} stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
            <path d={svgPaths.p13e62800} fill="#B7B7B7" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Atom: Crown Icon (from Figma SVG paths) ──────────────────────────────────
function CrownIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[14px]">
      <div className="absolute inset-[13.54%_3.13%_13.55%_3.13%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.125 10.2083">
          <path d={svgPaths.pf798600} fill="#F9CD16" />
          <path d={svgPaths.p30692c80} fill="#FAA701" />
          <path d={svgPaths.p18c22300} fill="#FAA701" />
          <path d={svgPaths.p3a173380} fill="#FAA701" />
        </svg>
      </div>
    </div>
  );
}

// ─── Atom: Back Arrow ─────────────────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <div className="relative shrink-0" style={{ width: 24, height: 24 }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

// ─── Atom: Arrow Down Fill ────────────────────────────────────────────────────
function ArrowDownFillIcon() {
  return (
    <div className="relative shrink-0" style={{ width: 14, height: 14 }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14" style={{ transform: 'translateY(-1.5px)' }}>
        <path d={svgPaths.p12ea3700} fill="#999999" transform="rotate(180 7 7)" />
      </svg>
    </div>
  );
}

// ─── Card: Featured (Rank 1) ──────────────────────────────────────────────────
function FeaturedCard({ item }: { item: FortuneItem }) {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div
          className="content-stretch flex flex-col items-start justify-center pb-[16px] px-[16px] relative w-full cursor-pointer"
          style={{ transition: 'background-color 0.15s ease' }}
          onTouchStart={() => {}}
          onPointerDown={(e) => {
            e.currentTarget.style.backgroundColor = '#FBFBFB';
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
          onPointerCancel={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          {/* Content Image Container */}
          <div
            className="content-stretch flex flex-col isolate items-start pb-[48px] relative shrink-0 w-full"
          >
            {/* Rank badge — renders first, then image overlaps with z-[1] */}
            <div className="content-stretch flex flex-col items-start mb-[-48px] p-[12px] relative shrink-0 w-[64px] z-[2]">
              <div className="bg-white content-stretch flex flex-col items-center justify-center px-[8px] py-[2px] relative rounded-[8px] shrink-0">
                <div aria-hidden="true" className="absolute border border-[#ffc000] border-solid inset-[-1px] pointer-events-none rounded-[9px]" />
                <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0 w-full">
                  <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, lineHeight: '19.5px', color: C.black }}>1</span>
                  <CrownIcon />
                </div>
              </div>
            </div>
            {/* Image */}
            <div className="aspect-[80/54] mb-[-48px] pointer-events-none relative rounded-[16px] shrink-0 w-full z-[1]">
              <img alt={item.title} className="absolute inset-0 max-w-none object-cover rounded-[16px] size-full" src={item.img} />
              <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[17px]" />
            </div>
          </div>
          {/* Text details */}
          <div
            className="content-stretch flex flex-col gap-[4px] items-start px-[8px] relative shrink-0 w-full"
            style={{ marginTop: 8 }}
          >
            <p
              className="w-full overflow-hidden"
              style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.black, letterSpacing: '-0.42px', lineHeight: '22px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
            >
              {item.title}
            </p>
            <div className="flex items-center" style={{ gap: 3 }}>
              {item.labels.map((l) => <LabelBadge key={l} type={l} />)}
            </div>
            {/* Views + 읽어봄 */}
            <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0">
              <div className="content-stretch flex items-start relative shrink-0">
                <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
                  <EyeIcon />
                  <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>{item.views}</span>
                </div>
              </div>
              {item.showRead && (
                <>
                  <div className="h-[6px] relative shrink-0 w-0">
                    <div className="absolute inset-[-8.33%_-0.5px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 7">
                        <path d="M0.5 0.5V6.5" stroke="#E7E7E7" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>읽어봄</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card: Row (Ranks 2+) ─────────────────────────────────────────────────────
function RowCard({ item }: { item: FortuneItem }) {
  const rankW = item.rank >= 100 ? 27 : item.rank >= 10 ? 23 : 19;
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div
          className="content-stretch flex flex-col items-start justify-center px-[20px] py-[10px] relative w-full cursor-pointer"
          style={{ transition: 'background-color 0.15s ease' }}
          onTouchStart={() => {}}
          onPointerDown={(e) => {
            e.currentTarget.style.backgroundColor = '#FBFBFB';
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
          onPointerCancel={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          <div className="content-stretch flex gap-[12px] h-[61px] items-start relative shrink-0 w-full">
            {/* Thumbnail with rank badge */}
            <div
              className="content-stretch flex isolate items-start relative shrink-0"
              style={{ paddingRight: rankW }}
            >
              {/* Rank badge */}
              <div
                className="content-stretch flex flex-col items-start p-[3px] relative shrink-0 z-[2]"
                style={{ marginRight: -rankW }}
              >
                <div className="bg-white content-stretch flex flex-col items-center justify-center pb-[2px] pt-px px-[3px] relative rounded-[4px] shrink-0">
                  <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.black, lineHeight: 'normal' }}>{item.rank}</span>
                </div>
              </div>
              {/* Thumbnail image */}
              <div
                className="pointer-events-none relative rounded-[8px] shrink-0 z-[1]"
                style={{ width: 69, height: 47, marginRight: -rankW }}
              >
                <img alt={item.title} className="absolute inset-0 max-w-none object-cover rounded-[8px] size-full" src={item.img} />
                <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[9px]" />
              </div>
            </div>
            {/* Text details */}
            <div
              className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative"
            >
              <p
                className="w-full overflow-hidden"
                style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.black, letterSpacing: '-0.42px', lineHeight: '22px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
              >
                {item.title}
              </p>
              <div className="flex items-center" style={{ gap: 3 }}>
                {item.labels.map((l) => <LabelBadge key={l} type={l} />)}
              </div>
              <div className="content-stretch flex items-center justify-center relative shrink-0">
                <div className="content-stretch flex items-start relative shrink-0">
                  <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
                    <EyeIcon />
                    <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>{item.views}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card List (reusable, no tabs/sort) ──────────────────────────────────────
export function FortuneCardList({ items }: { items: FortuneItem[] }) {
  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: '#ffffff', flex: 1 }}>
      {items.map((item, index) => (
        <div key={item.rank}>
          {index > 0 && (
            <div style={{ height: 1, backgroundColor: '#F9F9F9', margin: '0 0' }} />
          )}
          {item.featured
            ? <FeaturedCard item={item} />
            : <RowCard item={item} />
          }
        </div>
      ))}
      <div style={{ height: 130 }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 53;

export function FortuneAllPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'인기순' | '최신순'>('인기순');
  const sortRef = useRef<HTMLDivElement>(null);

  const tabVisible = useScrollDirection(16);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [sortOpen]);

  return (
    <div className="flex justify-center min-h-screen" style={{ backgroundColor: C.white }}>
      <div
        className="flex flex-col relative"
        style={{ backgroundColor: C.white, width: '100%', minWidth: 320, maxWidth: 440, minHeight: '100vh' }}
      >
        {/* ── Sticky header ── */}
        <div className="sticky top-0" style={{ zIndex: 50 }}>
          {/* Navigation bar */}
          <div className="flex items-center justify-between w-full" style={{ height: 52, padding: '4px 12px', backgroundColor: C.white }}>
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 44, height: 44, borderRadius: 12, border: 'none', backgroundColor: 'transparent', WebkitTapHighlightColor: 'transparent', transition: 'background-color 0.12s ease-out' }}
              onTouchStart={() => {}}
              onPointerDown={(e) => {
                e.currentTarget.style.backgroundColor = '#F8F8F8';
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
            >
              <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.12s ease-out', transformOrigin: 'center' }}>
                <ArrowLeftIcon />
              </span>
            </motion.button>
            <p
              className="flex-1 text-center overflow-hidden"
              style={{ fontFamily: font, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
            >
              운세 모아보기
            </p>
            <div style={{ width: 44, height: 44, opacity: 0 }} />
          </div>

          {/* ── Tab bar ── */}
          <div
            style={{
              height: TAB_BAR_HEIGHT,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: tabVisible ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform',
                backgroundColor: C.white,
                borderBottom: `1px solid ${C.inputBg}`,
              }}
            >
              <div
                className="w-full overflow-x-auto"
                style={{ scrollbarWidth: 'none' } as React.CSSProperties}
              >
                <div className="flex items-center" style={{ padding: '8px 16px', gap: 2, minWidth: 'max-content' }}>
                  {TABS.map((t, i) => {
                    const isActive = activeTab === i;
                    return (
                      <button
                        key={t}
                        onClick={() => setActiveTab(i)}
                        className="relative flex items-center justify-center shrink-0 cursor-pointer"
                        style={{ padding: '8px 16px', borderRadius: 12, backgroundColor: 'transparent', border: 'none', WebkitTapHighlightColor: 'transparent' }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="all-tab-indicator"
                            className="absolute inset-0 rounded-[12px]"
                            style={{ backgroundColor: C.inputBg }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          />
                        )}
                        <span
                          className="relative transition-colors duration-[250ms]"
                          style={{ fontFamily: font, fontSize: 15, lineHeight: '20px', letterSpacing: '-0.45px', fontWeight: isActive ? 600 : 500, color: isActive ? C.charcoal : C.gray400 }}
                        >
                          {t}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content header: count + sort ── */}
        <div className="flex items-center justify-between w-full" style={{ padding: '12px 22px', backgroundColor: C.white }}>
          <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: C.gray600, lineHeight: '22px' }}>총 102개</span>
          <div className="relative" ref={sortRef}>
            <button
              className="flex items-center cursor-pointer"
              style={{ backgroundColor: 'transparent', border: 'none', gap: 1, padding: 0, WebkitTapHighlightColor: 'transparent' }}
              onClick={() => setSortOpen(v => !v)}
            >
              <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: C.gray600, lineHeight: '22px' }}>{sortBy}</span>
              <ArrowDownFillIcon />
            </button>

            {/* ── Sort dropdown ── */}
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: -6,
                  width: 140,
                  backgroundColor: C.white,
                  borderRadius: 16,
                  border: '1px solid #f3f3f3',
                  boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)',
                  zIndex: 200,
                  paddingTop: 14,
                  paddingBottom: 12,
                }}
              >
                {/* Header */}
                <div style={{ padding: '0 22px', marginBottom: 4 }}>
                  <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: '#151515', letterSpacing: '-0.3px', lineHeight: '25.5px' }}>정렬</span>
                </div>
                {/* 인기순 */}
                <button
                  onClick={() => { setSortBy('인기순'); setSortOpen(false); }}
                  className="flex items-center w-full cursor-pointer"
                  style={{ padding: '2px 12px', backgroundColor: 'transparent', border: 'none', gap: 7, WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
                    {sortBy === '인기순' ? (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '6px solid #48b2af' }} />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #e7e7e7', backgroundColor: C.white }} />
                    )}
                  </div>
                  <span style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: '#6d6d6d', letterSpacing: '-0.3px', lineHeight: '25.5px' }}>인기순</span>
                </button>
                {/* 최신순 */}
                <button
                  onClick={() => { setSortBy('최신순'); setSortOpen(false); }}
                  className="flex items-center w-full cursor-pointer"
                  style={{ padding: '2px 12px', backgroundColor: 'transparent', border: 'none', gap: 7, WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
                    {sortBy === '최신순' ? (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '6px solid #48b2af' }} />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #e7e7e7', backgroundColor: C.white }} />
                    )}
                  </div>
                  <span style={{ fontFamily: font, fontSize: 15, fontWeight: 400, color: '#6d6d6d', letterSpacing: '-0.3px', lineHeight: '25.5px' }}>최신순</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Content list ── */}
        <div className="flex flex-col w-full" style={{ backgroundColor: C.white, flex: 1 }}>
          {ALL_ITEMS.map((item, index) => (
            <div key={item.rank}>
              {index > 0 && (
                <div style={{ height: 1, backgroundColor: '#F9F9F9', margin: '0 0' }} />
              )}
              {item.featured
                ? <FeaturedCard item={item} />
                : <RowCard item={item} />
              }
            </div>
          ))}
          <div style={{ height: 130 }} />
        </div>
      </div>
    </div>
  );
}
