import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import svgPaths from '../imports/svg-hzfdemyje6';
import { useScrollDirection } from '../hooks/useScrollDirection';

// ─── Asset paths ─────────────────────────────────────────────────────────────
const img1 = '/home-v2/card-1.png';
const img2 = '/home-v2/card-4.png';
const img3 = '/home-v2/card-5.png';
const img4 = '/home-v2/card-6.png';
const img5 = '/home-v2/card-7.png';
const img6 = '/home-v2/card-8.png';
const img7 = '/home-v2/card-9.png';
const img8 = '/home-v2/card-10.png';
const img9 = '/home-v2/card-11.png';

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
type LabelType = 'New' | '무료' | '심화' | '유료';

export type NoRankFortuneItem = {
  id:       number;
  title:    string;
  labels:   LabelType[];
  views:    number;
  showRead?: boolean;
  img:      string;
};

const TABS = ['연애', '이별', '재물', '직업', '인간관계', '시험/ 학업'];

export const NEW_FREE_ITEMS: NoRankFortuneItem[] = [
  { id: 1,  title: '저 사람, 나한테 왜 그럴까 알려줘',    labels: ['New', '무료'], views: 27,  showRead: true, img: img1 },
  { id: 2,  title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['New', '무료'], views: 100, img: img2 },
  { id: 3,  title: '내돈은 다 어디갔을까?',               labels: ['무료'],        views: 100, img: img3 },
  { id: 4,  title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['New', '무료'], views: 100, img: img4 },
  { id: 5,  title: '내 인생 리즈 시절은 언제?',            labels: ['무료'],        views: 100, img: img5 },
  { id: 6,  title: '내돈은 다 어디갔을까?',               labels: ['New', '무료'], views: 100, img: img6 },
  { id: 7,  title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['New', '무료'], views: 100, img: img7 },
  { id: 8,  title: '내돈은 다 어디갔을까?',               labels: ['무료'],        views: 100, img: img8 },
  { id: 9,  title: '내 인생 리즈 시절은 언제?',            labels: ['New', '무료'], views: 100, img: img9 },
];

// ─── Atom: Label Badge ────────────────────────────────────────────────────────
const LABEL_MAP: Record<LabelType, [string, string]> = {
  'New':  [C.newBg,  C.newText],
  '무료': [C.freeBg, C.freeText],
  '심화': [C.advBg,  C.advText],
  '유료': ['#f5f5f5', '#999999'],
};

function LabelBadge({ type }: { type: LabelType }) {
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

// ─── Atom: Eye Icon ───────────────────────────────────────────────────────────
function EyeIcon() {
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

// ── Pointer press helpers ────────────────────────────────────────────────────
const pressHandlers = {
  onTouchStart: () => {},
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#FBFBFB';
  },
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '';
  },
  onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '';
  },
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '';
  },
};

// ─── Card: Top Card (첫 번째 — 이미지 상단 배치, 순위 배지 없음) ───────────────
function TopCard({ item }: { item: NoRankFortuneItem }) {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div
          className="content-stretch flex flex-col items-start justify-center pb-[16px] px-[16px] relative w-full cursor-pointer"
          style={{ transition: 'background-color 0.15s ease' }}
          {...pressHandlers}
        >
          {/* Image — no rank badge */}
          <div
            className="aspect-[80/54] pointer-events-none relative rounded-[16px] shrink-0 w-full"
          >
            <img alt={item.title} className="absolute inset-0 max-w-none object-cover rounded-[16px] size-full" src={item.img} />
            <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[17px]" />
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
            <div className="content-stretch flex gap-[4px] items-center justify-center relative shrink-0">
              <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
                <EyeIcon />
                <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>{item.views}</span>
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

// ─── Card: Row Card (2번째 이후 — 썸네일 좌측, 순위 배지 없음) ────────────────
function RowCard({ item }: { item: NoRankFortuneItem }) {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div
          className="content-stretch flex flex-col items-start justify-center px-[20px] py-[10px] relative w-full cursor-pointer"
          style={{ transition: 'background-color 0.15s ease' }}
          {...pressHandlers}
        >
          <div className="content-stretch flex gap-[12px] h-[61px] items-start relative shrink-0 w-full">
            {/* Thumbnail — no rank badge overlay */}
            <div
              className="pointer-events-none relative rounded-[8px] shrink-0"
              style={{ width: 69, height: 47 }}
            >
              <img alt={item.title} className="absolute inset-0 max-w-none object-cover rounded-[8px] size-full" src={item.img} />
              <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[9px]" />
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
              <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
                <EyeIcon />
                <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>{item.views}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card List (no-rank, reusable) ───────────────────────────────────────────
export function NewFreeCardList({ items }: { items: NoRankFortuneItem[] }) {
  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: '#ffffff', flex: 1 }}>
      {items.map((item, index) => (
        <div key={item.id}>
          {index > 0 && <div style={{ height: 1, backgroundColor: '#F9F9F9' }} />}
          {index === 0 ? <TopCard item={item} /> : <RowCard item={item} />}
        </div>
      ))}
      <div style={{ height: 130 }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 53;

export function NewFreeFortuneAllPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const tabVisible = useScrollDirection(16);

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
              style={{ width: 44, height: 44, borderRadius: 12, border: 'none', backgroundColor: 'rgba(0,0,0,0)', WebkitTapHighlightColor: 'transparent' }}
              whileTap={{ scale: 0.88, backgroundColor: '#F8F8F8' }}
              transition={{ duration: 0.12 }}
            >
              <ArrowLeftIcon />
            </motion.button>
            <p
              className="flex-1 text-center overflow-hidden"
              style={{ fontFamily: font, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
            >
              NEW 무료 운세
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
                            layoutId="new-free-tab-indicator"
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

        {/* ── Content header: count only ── */}
        <div className="flex items-center w-full" style={{ padding: '12px 22px', backgroundColor: C.white }}>
          <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: C.gray600, lineHeight: '22px' }}>총 {NEW_FREE_ITEMS.length}개</span>
        </div>

        {/* ── Content list ── */}
        <NewFreeCardList items={NEW_FREE_ITEMS} />
      </div>
    </div>
  );
}
