import { useState, useRef, useEffect, useCallback } from 'react';
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
export type LabelType = 'New' | '무료' | '심화' | '유료';

export interface FortuneItem {
  id:        string;
  rank:      number;
  title:     string;
  labels:    LabelType[];
  views:     number;
  showRead?: boolean;
  img:       string;
  featured?: boolean;
  contentType: 'free' | 'paid';
  keywords?: string[];
}

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

export function LabelBadge({ type }: { type: LabelType }) {
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

// ─── Atom: Eye Icon ──────────────────────────────────────────────────────────
export function EyeIcon() {
  return (
    <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0, overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', left: 0.9, top: 2.9, width: 10.2, height: 6.42 }} fill="none" viewBox="0 0 10.2003 6.42143">
        <path d={svgPaths.p1e926900} stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
        <path d={svgPaths.p13e62800} fill="#B7B7B7" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// ─── Atom: Crown Icon ────────────────────────────────────────────────────────
function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M12.5017 5.47345C12.4324 5.42477 12.3505 5.39723 12.2659 5.39414C12.1813 5.39106 12.0976 5.41257 12.0249 5.45607L9.61924 6.8996C9.60258 6.90953 9.58412 6.91606 9.56491 6.91879C9.5457 6.92152 9.52614 6.9204 9.50738 6.91549C9.48861 6.91059 9.471 6.902 9.45559 6.89022C9.44017 6.87845 9.42725 6.86372 9.41759 6.8469L7.37989 3.28082C7.33844 3.21793 7.28203 3.16631 7.21571 3.13059C7.1494 3.09487 7.07525 3.07617 6.99993 3.07617C6.9246 3.07617 6.85046 3.09487 6.78414 3.13059C6.71782 3.16631 6.66141 3.21793 6.61996 3.28082L4.58228 6.84662C4.57266 6.86348 4.55977 6.87826 4.54437 6.89008C4.52897 6.9019 4.51136 6.91053 4.49258 6.91547C4.4738 6.9204 4.45423 6.92154 4.435 6.91881C4.41578 6.91609 4.39729 6.90955 4.38062 6.8996L1.97496 5.45607C1.9023 5.41248 1.81853 5.39092 1.73385 5.39403C1.64917 5.39715 1.56722 5.42479 1.49795 5.4736C1.42869 5.52241 1.37509 5.59029 1.34367 5.66898C1.31226 5.74768 1.30438 5.83381 1.32099 5.91691L2.39366 11.2814C2.44046 11.5125 2.56562 11.7207 2.74799 11.8701C2.93035 12.0196 3.15874 12.1015 3.39454 12.102H10.6053C10.8411 12.1015 11.0696 12.0196 11.252 11.87C11.4343 11.7205 11.5595 11.5126 11.6062 11.2814L12.6789 5.91695C12.6956 5.83381 12.6877 5.7476 12.6562 5.66886C12.6248 5.59011 12.5711 5.52221 12.5017 5.47345Z" fill="#F9CD16" />
      <path d="M7 4.51953C7.72487 4.51953 8.3125 3.93191 8.3125 3.20703C8.3125 2.48216 7.72487 1.89453 7 1.89453C6.27513 1.89453 5.6875 2.48216 5.6875 3.20703C5.6875 3.93191 6.27513 4.51953 7 4.51953Z" fill="#FAA701" />
      <path d="M1.75 6.85156C2.47487 6.85156 3.0625 6.26394 3.0625 5.53906C3.0625 4.81419 2.47487 4.22656 1.75 4.22656C1.02513 4.22656 0.4375 4.81419 0.4375 5.53906C0.4375 6.26394 1.02513 6.85156 1.75 6.85156Z" fill="#FAA701" />
      <path d="M12.25 6.85156C12.9749 6.85156 13.5625 6.26394 13.5625 5.53906C13.5625 4.81419 12.9749 4.22656 12.25 4.22656C11.5251 4.22656 10.9375 4.81419 10.9375 5.53906C10.9375 6.26394 11.5251 6.85156 12.25 6.85156Z" fill="#FAA701" />
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
    <div style={{ backgroundColor: C.white, position: 'relative', flexShrink: 0, width: '100%' }}>
      <div className="flex flex-col justify-center" style={{ width: '100%', height: '100%' }}>
        <div
          className="flex flex-col items-start justify-center cursor-pointer"
          style={{ padding: '0 16px 6px', position: 'relative', width: '100%', transition: 'background-color 0.15s ease' }}
          onTouchStart={() => {}}
          onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#FBFBFB'; }}
          onPointerUp={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = ''; }}
        >
          {/* Content Image Container */}
          <div
            className="flex flex-col items-start"
            style={{ isolation: 'isolate', paddingBottom: 48, position: 'relative', flexShrink: 0, width: '100%' }}
          >
            {/* Rank badge — renders first, then image overlaps with z-index 1 */}
            <div
              className="flex flex-col items-start"
              style={{ marginBottom: -48, padding: 12, position: 'relative', flexShrink: 0, width: 64, zIndex: 2 }}
            >
              <div
                className="flex flex-col items-center justify-center"
                style={{ backgroundColor: C.white, padding: '2px 8px', position: 'relative', borderRadius: 8, flexShrink: 0 }}
              >
                <div aria-hidden="true" style={{ position: 'absolute', inset: -1, border: '1px solid #ffc000', pointerEvents: 'none', borderRadius: 9 }} />
                <div className="flex items-center justify-center" style={{ gap: 4, position: 'relative', flexShrink: 0, width: '100%' }}>
                  <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, lineHeight: '19.5px', color: C.black }}>1</span>
                  <CrownIcon />
                </div>
              </div>
            </div>
            {/* Image */}
            <div
              style={{ aspectRatio: '80/54', marginBottom: -48, pointerEvents: 'none', position: 'relative', borderRadius: 16, flexShrink: 0, width: '100%', zIndex: 1 }}
            >
              <img alt={item.title} style={{ position: 'absolute', inset: 0, maxWidth: 'none', objectFit: 'cover', borderRadius: 16, width: '100%', height: '100%' }} src={item.img} />
              <div aria-hidden="true" style={{ position: 'absolute', inset: -1, border: '1px solid #f9f9f9', borderRadius: 17 }} />
            </div>
          </div>
          {/* Text details */}
          <div
            className="flex flex-col items-start"
            style={{ gap: 3, padding: '0 8px', position: 'relative', flexShrink: 0, width: '100%', marginTop: 8 }}
          >
            <p
              style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.black, letterSpacing: '-0.42px', lineHeight: '22px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}
            >
              {item.title}
            </p>
            <div className="flex items-center" style={{ gap: 3 }}>
              {item.labels.map((l) => <LabelBadge key={l} type={l} />)}
            </div>
            {/* Views + 읽어봄 */}
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
  );
}

// ─── Card: Row (Ranks 2+) ─────────────────────────────────────────────────────
function RowCard({ item }: { item: FortuneItem }) {
  const rankW = item.rank >= 100 ? 27 : item.rank >= 10 ? 23 : 19;
  return (
    <div style={{ backgroundColor: C.white, position: 'relative', flexShrink: 0, width: '100%' }}>
      <div className="flex flex-col justify-center" style={{ width: '100%', height: '100%' }}>
        <div
          className="flex flex-col items-start justify-center cursor-pointer"
          style={{ padding: '8px 20px 4px', position: 'relative', width: '100%', transition: 'background-color 0.15s ease' }}
          onTouchStart={() => {}}
          onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#FBFBFB'; }}
          onPointerUp={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = ''; }}
        >
          <div className="flex items-start" style={{ gap: 12, height: 61, position: 'relative', flexShrink: 0, width: '100%' }}>
            {/* Thumbnail with rank badge */}
            <div
              className="flex items-start"
              style={{ isolation: 'isolate', paddingRight: rankW, position: 'relative', flexShrink: 0 }}
            >
              {/* Rank badge */}
              <div
                className="flex flex-col items-start"
                style={{ padding: 3, position: 'relative', flexShrink: 0, zIndex: 2, marginRight: -rankW }}
              >
                <div
                  className="flex flex-col items-center justify-center"
                  style={{ backgroundColor: C.white, padding: '1px 3px 2px', position: 'relative', borderRadius: 6, flexShrink: 0 }}
                >
                  <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: C.black, lineHeight: 'normal' }}>{item.rank}</span>
                </div>
              </div>
              {/* Thumbnail image */}
              <div
                style={{ pointerEvents: 'none', position: 'relative', borderRadius: 10, flexShrink: 0, width: 69, height: 47, marginRight: -rankW, zIndex: 1 }}
              >
                <img alt={item.title} style={{ position: 'absolute', inset: 0, maxWidth: 'none', objectFit: 'cover', borderRadius: 10, width: '100%', height: '100%' }} src={item.img} />
                <div aria-hidden="true" style={{ position: 'absolute', inset: -1, border: '1px solid #f9f9f9', borderRadius: 11 }} />
              </div>
            </div>
            {/* Text details */}
            <div
              className="flex flex-col items-start"
              style={{ flex: '1 0 0', gap: 3, minHeight: 1, minWidth: 1, position: 'relative' }}
            >
              <p
                style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.black, letterSpacing: '-0.42px', lineHeight: '22px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}
              >
                {item.title}
              </p>
              <div className="flex items-center" style={{ gap: 3 }}>
                {item.labels.map((l) => <LabelBadge key={l} type={l} />)}
              </div>
              <div className="flex items-center" style={{ gap: 2, flexShrink: 0 }}>
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
  const location = useLocation();
  // 초기 탭: state > sessionStorage > 0
  const [activeTab, setActiveTab] = useState(() => {
    const st = (location.state as { tab?: number } | null);
    if (typeof st?.tab === 'number' && st.tab >= 0 && st.tab < TAB_CATEGORIES.length) return st.tab;
    try {
      const saved = sessionStorage.getItem('best-fortune-tab');
      if (saved) { const idx = Number(saved); if (idx >= 0 && idx < TAB_CATEGORIES.length) return idx; }
    } catch (_) { /* silent */ }
    return 0;
  });
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'인기순' | '최신순'>(() => {
    const st = (location.state as { sort?: string } | null);
    return st?.sort === 'popular' ? '인기순' : '인기순';
  });
  const sortRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<FortuneItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const tabVisible = useScrollDirection(16);

  // PC 마우스 드래그 스크롤
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const hasDragged = useRef(false);

  // 탭 변경 시 sessionStorage에 저장 + 활성 탭 스크롤
  const isFirstRender = useRef(true);
  useEffect(() => {
    sessionStorage.setItem('best-fortune-tab', String(activeTab));
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

  // 카테고리 + 정렬 변경 시 데이터 로드
  const fetchData = useCallback(async () => {
    try {
      const category = TAB_CATEGORIES[activeTab] || '전체';
      const { data, error } = await supabase.rpc('get_home_contents', {
        p_category: category,
        p_content_type: 'all',
        p_offset: 0,
        p_limit: 100,
      });
      if (error) { logger.error('FortuneAllPage 로드 실패:', error.message); return; }
      if (!data || data.length === 0) { setItems([]); setTotalCount(0); return; }

      // 정렬 적용
      let sorted = [...data];
      if (sortBy === '최신순') {
        sorted.sort((a: { created_at: string; weekly_clicks: number }, b: { created_at: string; weekly_clicks: number }) => {
          const d = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          return d !== 0 ? d : b.weekly_clicks - a.weekly_clicks;
        });
      }
      // 인기순은 RPC 기본 정렬 (weekly_clicks DESC, created_at DESC)

      setTotalCount(sorted[0]?.total_count ?? sorted.length);
      setItems(sorted.map((row: {
        id: string; title: string; content_type: string;
        thumbnail_url: string | null; weekly_clicks: number;
        view_count: number; created_at: string; is_read: boolean;
      }, i: number) => {
        const labels: LabelType[] = [];
        if (isContentNew(row.created_at)) labels.push('New');
        labels.push(row.content_type === 'free' ? '무료' : '심화');
        return {
          id: row.id,
          rank: i + 1,
          title: row.title,
          labels,
          views: row.weekly_clicks,
          showRead: row.is_read === true,
          img: row.thumbnail_url || '/home-v2/card-1.png',
          featured: i === 0,
          contentType: row.content_type as 'free' | 'paid',
        };
      }));
    } catch (e) {
      logger.error('FortuneAllPage fetchData 실패:', e);
    }
  }, [activeTab, sortBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleItemClick = (item: FortuneItem) => {
    trackContentClick(item.id);
    navigate(
      item.contentType === 'free'
        ? `/free/content/${item.id}`
        : `/master/content/detail/${item.id}`,
      { state: { canGoBack: true } }
    );
  };

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
      <SEO
        title="인기 운세 모아보기 - 사주 타로 궁합 베스트"
        description="나다운세에서 가장 인기 있는 사주, 타로, 궁합 콘텐츠를 모아보세요. 사주연애운, 사주결혼시기, 사주재물운 등 다양한 AI 운세를 확인하세요."
        keywords="사주연애운, 사주결혼시기, 사주재물운, 이직운세, 인기운세, AI사주, 사주잘보는곳, 온라인사주추천"
        canonical="/best-fortune"
      />
      <div
        className="flex flex-col relative"
        style={{ backgroundColor: C.white, width: '100%', minWidth: 320, maxWidth: 440, minHeight: '100vh' }}
      >
        {/* ── Sticky header ── */}
        <div className="sticky top-0" style={{ zIndex: 50 }}>
          {/* Navigation bar */}
          <div className="flex items-center justify-between w-full" style={{ height: 52, padding: '4px 12px', backgroundColor: C.white }}>
            <motion.button
              onClick={() => navigate('/')}
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
              BEST 운세
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
                  isDragging.current = true;
                  hasDragged.current = false;
                  dragStartX.current = e.clientX;
                  scrollStartX.current = tabScrollRef.current?.scrollLeft ?? 0;
                  e.currentTarget.style.cursor = 'grabbing';
                  e.currentTarget.style.userSelect = 'none';
                }}
                onMouseMove={(e) => {
                  if (!isDragging.current) return;
                  const dx = e.clientX - dragStartX.current;
                  if (Math.abs(dx) > 3) hasDragged.current = true;
                  if (tabScrollRef.current) {
                    tabScrollRef.current.scrollLeft = scrollStartX.current - dx;
                  }
                }}
                onMouseUp={(e) => {
                  isDragging.current = false;
                  e.currentTarget.style.cursor = 'grab';
                  e.currentTarget.style.userSelect = '';
                }}
                onMouseLeave={(e) => {
                  isDragging.current = false;
                  e.currentTarget.style.cursor = 'grab';
                  e.currentTarget.style.userSelect = '';
                }}
              >
                <div className="flex items-center" style={{ padding: '4px 16px 8px', gap: 2, minWidth: 'max-content' }}>
                  {TABS.map((t, i) => {
                    const isActive = activeTab === i;
                    return (
                      <button
                        key={t}
                        onClick={() => { if (!hasDragged.current) setActiveTab(i); }}
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
        <div className="flex items-center justify-between w-full" style={{ padding: '10px 22px', backgroundColor: C.white }}>
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
        <div className="flex flex-col w-full" style={{ backgroundColor: C.white, flex: 1 }}>
          {items.map((item, index) => (
            <div key={item.id} onClick={() => handleItemClick(item)}>
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
