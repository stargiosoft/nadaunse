import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import svgPaths from '../imports/svg-hzfdemyje6';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { supabase } from '../lib/supabase';
import { isContentNew } from '../components/ContentTags';
import { logger } from '../lib/logger';
import SEO from '../components/SEO';

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
  id:       string;
  title:    string;
  labels:   LabelType[];
  views:    number;
  showRead?: boolean;
  img:      string;
};

const TABS = ['전체', '연애', '이별', '궁합', '개인운세', '재물', '직업', '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'];
const TAB_CATEGORIES = ['전체', '연애', '이별', '궁합', '개인운세', '재물', '직업', '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'];

/** 클릭 추적 */
async function trackContentClick(contentId: string) {
  try {
    const { data } = await supabase
      .from('master_contents')
      .select('view_count, weekly_clicks')
      .eq('id', contentId)
      .single();
    if (data) {
      await supabase
        .from('master_contents')
        .update({ view_count: data.view_count + 1, weekly_clicks: data.weekly_clicks + 1 })
        .eq('id', contentId);
    }
  } catch (_) { /* silent */ }
}

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
      style={{ backgroundColor: bg, color, fontFamily: font, fontSize: 10, fontWeight: 500, lineHeight: '15px', borderRadius: 4, padding: '0 3px' }}
    >
      {type}
    </span>
  );
}

// ─── Atom: Eye Icon ───────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg className="shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1.5 6.50195C3.3 2.50195 8.7 2.50195 10.5 6.50195" stroke="#B7B7B7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.00446 8.57338C5.83562 8.57338 5.66843 8.54013 5.51244 8.47551C5.35645 8.4109 5.21472 8.31619 5.09533 8.19681C4.97594 8.07742 4.88123 7.93568 4.81662 7.77969C4.75201 7.6237 4.71875 7.45651 4.71875 7.28767C4.71875 7.11883 4.75201 6.95164 4.81662 6.79565C4.88123 6.63966 4.97594 6.49792 5.09533 6.37853C5.21472 6.25914 5.35645 6.16444 5.51244 6.09982C5.66843 6.03521 5.83562 6.00195 6.00446 6.00195C6.34546 6.00195 6.67248 6.13741 6.9136 6.37853C7.15472 6.61965 7.29018 6.94667 7.29018 7.28767C7.29018 7.62866 7.15472 7.95569 6.9136 8.19681C6.67248 8.43792 6.34546 8.57338 6.00446 8.57338Z" fill="#B7B7B7" stroke="#B7B7B7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

// ─── Atom: Arrow Down Fill Icon ──────────────────────────────────────────────
function ArrowDownFillIcon() {
  return (
    <div className="relative shrink-0" style={{ width: 14, height: 14 }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14" style={{ transform: 'translateY(-1.5px)' }}>
        <path d={svgPaths.p12ea3700} fill="#999999" transform="rotate(180 7 7)" />
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
          className="content-stretch flex flex-col items-start justify-center relative w-full cursor-pointer"
          style={{ padding: '0 16px 6px', transition: 'background-color 0.15s ease' }}
          {...pressHandlers}
        >
          {/* Image — no rank badge */}
          <div
            className="pointer-events-none relative rounded-[16px] shrink-0 w-full"
            style={{ aspectRatio: '80/54' }}
          >
            <img alt={item.title} className="absolute inset-0 max-w-none object-cover rounded-[16px] size-full" src={item.img} />
            <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[17px]" />
          </div>
          {/* Text details */}
          <div
            className="content-stretch flex flex-col items-start relative shrink-0 w-full"
            style={{ marginTop: 8, gap: 2, padding: '0 8px' }}
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
          className="content-stretch flex flex-col items-start justify-center relative w-full cursor-pointer"
          style={{ padding: '8px 20px 5px', transition: 'background-color 0.15s ease' }}
          {...pressHandlers}
        >
          <div className="content-stretch flex gap-[12px] h-[61px] items-start relative shrink-0 w-full">
            {/* Thumbnail — no rank badge overlay */}
            <div
              className="pointer-events-none relative shrink-0"
              style={{ width: 69, height: 47, borderRadius: 10 }}
            >
              <img alt={item.title} className="absolute inset-0 max-w-none object-cover size-full" style={{ borderRadius: 10 }} src={item.img} />
              <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px]" style={{ borderRadius: 11 }} />
            </div>
            {/* Text details */}
            <div
              className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative"
              style={{ gap: 2, marginTop: -2 }}
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
              <div className="flex items-center" style={{ gap: 4, flexShrink: 0 }}>
                <div className="flex items-center" style={{ gap: 2, flexShrink: 0 }}>
                  <EyeIcon />
                  <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>{item.views}</span>
                </div>
                {item.showRead && (
                  <>
                    <svg width="1" height="7" fill="none" viewBox="0 0 1 7" style={{ flexShrink: 0 }}>
                      <path d="M0.5 0.5V6.5" stroke="#E7E7E7" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>읽어봄</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card List (no-rank, reusable) ───────────────────────────────────────────
export function NewFreeCardList({ items, onItemClick }: { items: NoRankFortuneItem[]; onItemClick?: (item: NoRankFortuneItem) => void }) {
  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: '#ffffff', flex: 1 }}>
      {items.map((item, index) => (
        <div key={item.id} onClick={() => onItemClick?.(item)} style={onItemClick ? { cursor: 'pointer' } : undefined}>
          {index > 0 && <div style={{ height: 1, backgroundColor: '#F9F9F9' }} />}
          {index === 0 ? <TopCard item={item} /> : <RowCard item={item} />}
        </div>
      ))}
      <div style={{ height: 130 }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 45;

export function NewFreeFortuneAllPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // 초기 탭: state > sessionStorage > 0
  const [activeTab, setActiveTab] = useState(() => {
    const st = (location.state as { tab?: number } | null);
    if (typeof st?.tab === 'number' && st.tab >= 0 && st.tab < TAB_CATEGORIES.length) return st.tab;
    try {
      const saved = sessionStorage.getItem('new-free-tab');
      if (saved) { const idx = Number(saved); if (idx >= 0 && idx < TAB_CATEGORIES.length) return idx; }
    } catch (_) { /* silent */ }
    return 0;
  });
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'인기순' | '최신순'>('최신순');
  const sortRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<NoRankFortuneItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const tabVisible = useScrollDirection(16);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // 탭 변경 시 sessionStorage에 저장 + 활성 탭 스크롤
  const isFirstRender = useRef(true);
  useEffect(() => {
    sessionStorage.setItem('new-free-tab', String(activeTab));
    const container = tabScrollRef.current;
    if (container) {
      const btn = container.querySelectorAll('button')[activeTab];
      if (btn) {
        const left = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, left), behavior: isFirstRender.current ? 'instant' : 'smooth' });
      }
    }
    isFirstRender.current = false;
  }, [activeTab]);

  // 정렬 드롭다운 외부 클릭 닫기
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

  // 카테고리별 무료 콘텐츠 로드
  const fetchData = useCallback(async () => {
    try {
      const category = TAB_CATEGORIES[activeTab] || '연애';
      const { data, error } = await supabase.rpc('get_home_contents', {
        p_category: category,
        p_content_type: 'free',
        p_offset: 0,
        p_limit: 100,
      });
      if (error) { logger.error('NewFreeFortuneAllPage 로드 실패:', error.message); return; }
      if (!data || data.length === 0) { setItems([]); setTotalCount(0); return; }

      let sorted = [...data];
      if (sortBy === '최신순') {
        sorted.sort((a: { created_at: string; weekly_clicks: number; is_read: boolean }, b: { created_at: string; weekly_clicks: number; is_read: boolean }) => {
          // 1순위: 읽지 않은 콘텐츠 먼저
          const readDiff = (a.is_read ? 1 : 0) - (b.is_read ? 1 : 0);
          if (readDiff !== 0) return readDiff;
          // 2순위: 최신순 (날짜 기준)
          const dateA = new Date(a.created_at).toISOString().slice(0, 10);
          const dateB = new Date(b.created_at).toISOString().slice(0, 10);
          if (dateA !== dateB) return dateB < dateA ? -1 : 1;
          // 3순위: 동일 날짜면 인기순
          return b.weekly_clicks - a.weekly_clicks;
        });
      }
      // 인기순은 RPC 기본 정렬 (weekly_clicks DESC, created_at DESC)

      setTotalCount(sorted[0]?.total_count ?? sorted.length);
      setItems(sorted.map((row: {
        id: string; title: string; content_type: string;
        thumbnail_url: string | null; weekly_clicks: number;
        created_at: string; is_read: boolean;
      }) => {
        const labels: LabelType[] = [];
        if (isContentNew(row.created_at)) labels.push('New');
        labels.push('무료');
        return {
          id: row.id,
          title: row.title,
          labels,
          views: row.view_count,
          showRead: row.is_read === true,
          img: row.thumbnail_url || '/home-v2/card-1.png',
        };
      }));
    } catch (e) {
      logger.error('NewFreeFortuneAllPage fetchData 실패:', e);
    }
  }, [activeTab, sortBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleItemClick = (item: NoRankFortuneItem) => {
    trackContentClick(item.id);
    sessionStorage.setItem('content_entry_source', '/new-free');
    navigate(`/free/content/${item.id}`, { state: { canGoBack: true } });
  };

  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden" style={{ backgroundColor: C.white, touchAction: 'none' }}>
      <SEO
        title="무료 운세 모아보기 - 무료사주 무료타로"
        description="무료사주풀이사이트 나다운세의 무료 운세 콘텐츠를 모아보세요. 생년월일운세, 무료타로, 오늘의운세를 무료로 만나보세요."
        keywords="무료사주풀이사이트, 무료운세사이트, 무료타로사이트, 생년월일운세, 무료궁합, 오늘의운세, 무료운세"
        canonical="/new-free"
      />
      <div
        className="flex flex-col relative overflow-y-auto overscroll-y-none"
        style={{ backgroundColor: C.white, width: '100%', minWidth: 320, maxWidth: 440, touchAction: 'pan-y', WebkitOverflowScrolling: 'auto' }}
      >
        {/* ── Sticky header ── */}
        <div className="sticky top-0" style={{ zIndex: 50 }}>
          {/* Navigation bar */}
          <div className="flex items-center justify-between w-full" style={{ height: 52, padding: '4px 12px', backgroundColor: C.white }}>
            <motion.button
              onClick={() => navigate('/')}
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
                ref={tabScrollRef}
                className="w-full overflow-x-auto"
                style={{ scrollbarWidth: 'none', cursor: 'grab' } as React.CSSProperties}
                onMouseDown={(e) => {
                  const el = e.currentTarget;
                  const startX = e.clientX;
                  const scrollLeft = el.scrollLeft;
                  let dragged = false;
                  el.style.cursor = 'grabbing';
                  const onMouseMove = (ev: MouseEvent) => {
                    const dx = ev.clientX - startX;
                    if (Math.abs(dx) > 3) dragged = true;
                    el.scrollLeft = scrollLeft - dx;
                  };
                  const onMouseUp = () => {
                    el.style.cursor = 'grab';
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    if (dragged) {
                      const preventClick = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
                      el.addEventListener('click', preventClick, { capture: true, once: true });
                    }
                  };
                  window.addEventListener('mousemove', onMouseMove);
                  window.addEventListener('mouseup', onMouseUp);
                }}
              >
                <div className="flex items-center" style={{ padding: '4px 16px 4px', gap: 2, minWidth: 'max-content' }}>
                  {TABS.map((t, i) => {
                    const isActive = activeTab === i;
                    return (
                      <button
                        key={t}
                        onClick={() => setActiveTab(i)}
                        className="relative flex items-center justify-center shrink-0 cursor-pointer"
                        style={{ padding: '8px 10px', borderRadius: 12, backgroundColor: 'transparent', border: 'none', WebkitTapHighlightColor: 'transparent' }}
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
                          style={{ fontFamily: font, fontSize: 14, lineHeight: '20px', letterSpacing: '-0.42px', fontWeight: isActive ? 600 : 500, color: isActive ? C.charcoal : C.gray400 }}
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
        <div className="flex items-center justify-between w-full" style={{ paddingTop: 8, paddingBottom: 10, paddingLeft: 22, paddingRight: 22, backgroundColor: C.white }}>
          <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: C.gray600, lineHeight: '22px' }}>총 {totalCount}개</span>
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
        <div className="flex flex-col w-full" style={{ backgroundColor: '#ffffff', flex: 1 }}>
          {items.map((item, index) => (
            <div key={item.id} onClick={() => handleItemClick(item)}>
              {index > 0 && <div style={{ height: 1, backgroundColor: '#F9F9F9' }} />}
              {index === 0 ? <TopCard item={item} /> : <RowCard item={item} />}
            </div>
          ))}
          <div style={{ height: 130 }} />
        </div>
      </div>
    </div>
  );
}
