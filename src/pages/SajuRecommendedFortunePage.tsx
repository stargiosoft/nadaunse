import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import svgArrow from '../imports/svg-jctkfb0fnf';
import svgHome from '../imports/svg-jv8l9s7k24';
import {
  NewFreeCardList,
  type NoRankFortuneItem,
} from './NewFreeFortuneAllPage';
import { fetchConsultRecommendations } from '../lib/consultRecommendationService';
import SEO from '../components/SEO';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  black:   '#000000',
  gray600: '#848484',
  white:   '#ffffff',
} as const;

const font = "'Pretendard Variable', sans-serif";

type LabelType = 'New' | '무료' | '심화' | '유료';

function useRecommendedItems(): NoRankFortuneItem[] {
  const [items, setItems] = useState<NoRankFortuneItem[]>([]);
  useEffect(() => {
    // localStorage에서 추천 카테고리 읽기 (사주/타로 결과에서 저장됨)
    let category: { main: string; sub: string } | undefined;
    try {
      const sajuRaw = localStorage.getItem('saju_consult_result');
      if (sajuRaw) {
        const parsed = JSON.parse(sajuRaw);
        category = parsed.recommendedCategory;
      }
      if (!category) {
        const taroRaw = localStorage.getItem('taro_consult_result');
        if (taroRaw) {
          const parsed = JSON.parse(taroRaw);
          category = parsed.recommendedCategory;
        }
      }
    } catch { /* ignore */ }

    fetchConsultRecommendations(category, 15).then((contents) => {
      setItems(contents.map((c) => {
        const labels: LabelType[] = [];
        labels.push('심화');
        return {
          id: c.id,
          title: c.title,
          labels,
          views: c.view_count,
          img: c.thumbnail_url || '/home-v2/card-1.png',
        };
      }));
    });
  }, []);
  return items;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <div className="relative shrink-0" style={{ width: 24, height: 24 }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgArrow.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
        <path d={svgArrow.p1a4bb100} opacity="0" stroke="#848484" />
      </svg>
    </div>
  );
}

function HomeIcon() {
  return (
    <div className="relative shrink-0" style={{ width: 24, height: 24 }}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path d={svgHome.p3d07f180} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="M12 17.99V14.99" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export function SajuRecommendedFortunePage() {
  const navigate = useNavigate();
  const RECOMMENDED_ITEMS = useRecommendedItems();

  return (
    <div className="flex justify-center min-h-screen" style={{ backgroundColor: C.white }}>
      <SEO title="추천 운세" noIndex={true} />
      <div
        className="flex flex-col relative"
        style={{ backgroundColor: C.white, width: '100%', minWidth: 320, maxWidth: 440, minHeight: '100vh' }}
      >
        {/* ── Sticky 헤더 ── */}
        <div className="sticky top-0" style={{ zIndex: 50, backgroundColor: C.white }}>
          <div className="flex items-center justify-between w-full" style={{ height: 52, padding: '4px 12px', backgroundColor: C.white }}>
            {/* 뒤로가기 */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none',
                backgroundColor: 'transparent',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.15s ease-out',
              }}
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
              <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.12s ease', transformOrigin: 'center' }}>
                <ArrowLeftIcon />
              </span>
            </button>

            {/* 타이틀 */}
            <p
              className="flex-1 text-center overflow-hidden"
              style={{ fontFamily: font, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
            >
              이어서 보기 좋은 운세
            </p>

            {/* 홈 */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none',
                backgroundColor: 'transparent',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.12s ease',
              }}
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
              <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.12s ease', transformOrigin: 'center' }}>
                <HomeIcon />
              </span>
            </button>
          </div>
        </div>

        {/* ── 총 개수 ── */}
        <div className="flex items-center w-full" style={{ padding: '12px 22px', backgroundColor: C.white }}>
          <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: C.gray600, lineHeight: '22px' }}>
            총 {RECOMMENDED_ITEMS.length}개
          </span>
        </div>

        {/* ── 카드 리스트 (유료 콘텐츠 → 클릭 시 상세 이동) ── */}
        <NewFreeCardList
          items={RECOMMENDED_ITEMS}
          onItemClick={(item) => navigate(`/master/content/detail/${item.id}`)}
        />
      </div>
    </div>
  );
}
