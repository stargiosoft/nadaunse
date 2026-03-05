import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { DEV } from '../lib/env';
import {
  CONSULT_STORAGE_KEY,
  LAST_RESULT_KEY,
  type ConsultKey,
  type ConsultStatus,
  readConsultStatus,
} from '../lib/consultStatus';
import { supabase, getAuthUser } from '../lib/supabase';
import { hasUsedConsult } from '../lib/consultLimitService';
import LoginBottomSheet from '../components/LoginBottomSheet';
import { trackConsultLoginClick, trackConsultStartClick } from '../utils/analytics';
import { isContentNew } from '../components/ContentTags';
import { logger } from '../lib/logger';
import svgPaths from '../imports/svg-t3oztaafjr';
import svgLogo from '../imports/svg-udgbxqyegd';
import SEO from '../components/SEO';

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  primary:     '#48b2af',
  black:       '#000000',
  charcoal:    '#151515',
  gray700:     '#6d6d6d',
  gray600:     '#848484',
  gray400:     '#999999',
  gray200:     '#E7E7E7',
  gray100:     '#D4D4D4',
  pageBg:      '#f7f8f9',
  inputBg:     '#f8f8f8',
  cardBorder:  '#f9f9f9',
  white:       '#ffffff',
  // Label colors
  newBg:     '#fff6f7', newText:  '#ef6878',
  freeBg:    '#f0f8ff', freeText: '#4590d6',
  advBg:     '#f0f8f8', advText:  '#41a09e',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────────────────────
type LabelType = 'New' | '무료' | '심화' | '유료';

interface FortuneItem {
  id: string;
  rank: number;
  title: string;
  labels: LabelType[];
  views: number;
  showRead?: boolean;
  img: string;
  contentType: 'free' | 'paid';
}

/** DB 콘텐츠 → FortuneItem 변환 */
function toFortuneItem(
  row: {
    id: string;
    title: string;
    content_type: string;
    thumbnail_url: string | null;
    weekly_clicks: number;
    view_count: number;
    created_at: string;
    is_read?: boolean;
  },
  rank: number,
): FortuneItem {
  const labels: LabelType[] = [];
  if (isContentNew(row.created_at)) labels.push('New');
  labels.push(row.content_type === 'free' ? '무료' : '심화');
  return {
    id: row.id,
    rank,
    title: row.title,
    labels,
    views: row.weekly_clicks,
    showRead: row.is_read === true,
    img: row.thumbnail_url || '/home-v2/card-1.png',
    contentType: row.content_type as 'free' | 'paid',
  };
}

/** 콘텐츠 클릭 시 view_count + weekly_clicks 증가 */
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
        .update({
          view_count: data.view_count + 1,
          weekly_clicks: data.weekly_clicks + 1,
        })
        .eq('id', contentId);
    }
  } catch (e) {
    logger.error('trackContentClick 실패:', e);
  }
}

const TABS = ['전체', '연애', '이별', '궁합', '개인운세', '재물', '직업', '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'];
const TAB_CATEGORIES = ['전체', '연애', '이별', '궁합', '개인운세', '재물', '직업', '시험/학업', '건강', '인간관계', '자녀', '이사/매매', '기타'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Atom Components
// ─────────────────────────────────────────────────────────────────────────────

/** 눈 아이콘 */
function EyeIcon() {
  return (
    <div className="relative shrink-0 overflow-hidden" style={{ width: 12, height: 12 }}>
      <div className="absolute" style={{ inset: '29.17% 12.5% 28.57% 12.5%' }}>
        <div className="absolute" style={{ inset: '-11.83% -6.67% -14.79% -6.67%' }}>
          <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 10.2003 6.42045">
            <path d={svgPaths.p1e926900} stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
            <path d={svgPaths.p2ac4fa00} fill="#B7B7B7" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** 조회수 뱃지 */
function ViewCount({ count, showRead }: { count: number; showRead?: boolean }) {
  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      <div className="flex items-center" style={{ gap: 2 }}>
        <EyeIcon />
        <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>{count}</span>
      </div>
      {showRead && (
        <>
          <div style={{ width: 1, height: 6, backgroundColor: C.gray200 }} />
          <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>읽어봄</span>
        </>
      )}
    </div>
  );
}

/** 라벨 뱃지 (New / 무료 / 심화 / 유료) */
const LABEL_MAP: Record<LabelType, [string, string]> = {
  'New': [C.newBg,  C.newText],
  '무료': [C.freeBg, C.freeText],
  '심화': [C.advBg,  C.advText],
  '유료': ['#f5f5f5', '#999999'],
};

function LabelBadge({ type }: { type: LabelType }) {
  const [bg, color] = LABEL_MAP[type];
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        backgroundColor: bg,
        color,
        fontFamily: font,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '15px',
        borderRadius: 4,
        padding: '0 4px',
      }}
    >
      {type}
    </span>
  );
}

/** 그라디언트 순위 숫자 */
function RankNumber({ n }: { n: number }) {
  return (
    <span
      className="shrink-0 text-center"
      style={{
        fontFamily: font,
        fontSize: 24,
        fontWeight: 600,
        lineHeight: '35.5px',
        width: 15,
        background: 'linear-gradient(to bottom, #5accc9, #2c8785)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {n}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon Components
// ─────────────────────────────────────────────────────────────────────────────

function CrystalBallIcon() {
  return (
    <div
      className="inline-grid place-items-start shrink-0"
      style={{ gridTemplateColumns: 'max-content', gridTemplateRows: 'max-content' }}
    >
      <div className="col-start-1 row-start-1 relative overflow-hidden" style={{ width: 28, height: 28 }}>
        <div className="absolute" style={{ inset: '4.17% 10.66% 17.13% 10.63%' }}>
          <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 22.0373 22.0367">
            <path d={svgPaths.p1b9ce4d0} fill="#4DB2FF" />
            <path d={svgPaths.p31f5d300} fill="black" opacity="0.2" />
          </svg>
        </div>
        <div className="absolute" style={{ inset: '73.62% 9.24% 4.69% 9.21%' }}>
          <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 22.8356 6.07345">
            <path d={svgPaths.p1509d000} fill="#576268" />
            <path d={svgPaths.p8434500} fill="black" opacity="0.2" />
          </svg>
        </div>
      </div>
      <div
        className="col-start-1 row-start-1 relative"
        style={{ width: '8.196px', height: '9.09px', marginLeft: '6.19px', marginTop: '4.2px' }}
      >
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 8.19641 9.08988">
          <path d={svgPaths.p21ca7d80} fill="white" />
        </svg>
      </div>
    </div>
  );
}

function TarotIcon() {
  return (
    <div className="relative shrink-0" style={{ width: 28, height: 28 }}>
      <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <path d={svgPaths.p33fbd900} fill="white" />
        <path d={svgPaths.p1ff89980} fill="#576268" />
        <path d={svgPaths.p317751f0} fill="#FA5F7F" />
        <path d={svgPaths.p3f07c4f0} fill="white" />
        <path d={svgPaths.p3ca10980} fill="#FFDE97" />
        <path d={svgPaths.p2b7c2500} fill="#FFC741" />
      </svg>
    </div>
  );
}

function UserIcon() {
  return (
    <div className="relative" style={{ width: 24, height: 24 }}>
      <div
        className="absolute"
        style={{ width: 18, height: 19, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 18 19">
          <path d={svgPaths.p1ceabf00} fill="#848484" />
          <path d={svgPaths.p6324f00}  fill="#848484" />
        </svg>
      </div>
    </div>
  );
}

function SearchIconSvg() {
  return (
    <div className="relative shrink-0" style={{ width: 18, height: 18 }}>
      <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <path d={svgPaths.p1cd7af0} stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="M16.5 16.5L15 15" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <div className="relative" style={{ width: 20, height: 20 }}>
      <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p3a9aee80} stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Logo Components
// ─────────────────────────────────────────────────────────────────────────────

function LogoLarge() {
  return (
    <div className="relative shrink-0" style={{ width: 80, height: 27 }}>
      <div className="absolute" style={{ inset: '6.7% 79.05% 28.44% 0' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 16.7594 17.5105">
          <path d={svgLogo.p1fd6b071} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '7.75% 51.93% 28.16% 27.15%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 16.7405 17.3035">
          <path d={svgLogo.p6d74400} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.2% 47.26% 21.76% 43.61%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 7.30099 20.5292">
          <path d={svgLogo.p3a63c900} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.2% 74.17% 21.76% 16.7%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 7.30099 20.5292">
          <path d={svgLogo.p38191700} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '39.15% 22.23% 31.85% 52.48%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 20.2373 7.82961">
          <path d={svgLogo.pe66ed00} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '0 24.53% 63.35% 54.55%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 16.7305 9.89616">
          <path d={svgLogo.p1fd9a700} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.24% 0 21.76% 94.83%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 4.13337 20.5214">
          <path d={svgLogo.p2df4d700} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.63% 5.75% 22.23% 85.73%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 6.8178 20.289">
          <path d={svgLogo.p1b6f5680} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '4.28% 11.29% 24.97% 75.49%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 10.5811 19.1019">
          <path d={svgLogo.p131a3380} fill="#151515" />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '56.28% 14.07% 0 54.48%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 25.1564 11.8038">
          <path d={svgLogo.p1cfcff80} fill="#151515" />
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Components
// ─────────────────────────────────────────────────────────────────────────────

/** 상단 네비게이션 헤더 */
function AppHeader() {
  const navigate = useNavigate();

  const handleUserIconClick = () => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/profile', { state: { canGoBack: true } });
    } else {
      navigate('/login', { state: { canGoBack: true } });
    }
  };

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between w-full shrink-0"
      style={{
        backgroundColor: C.white,
        height: 52,
        padding: '4px 16px 4px 20px',
      }}
    >
      <LogoLarge />
      <button
        className="group flex items-center justify-center cursor-pointer active:bg-gray-100 transition-colors duration-150"
        style={{
          width: 44, height: 44, borderRadius: 12,
          border: 'none', padding: 4,
          WebkitTapHighlightColor: 'transparent',
        }}
        onClick={handleUserIconClick}
      >
        <span className="group-active:scale-90 transition-transform duration-150 flex items-center justify-center">
          <UserIcon />
        </span>
      </button>
    </header>
  );
}

/** 검색 바 */
function AppSearchBar() {
  const navigate = useNavigate();
  return (
    <div className="w-full" style={{ backgroundColor: C.white, padding: '6px 16px 12px' }}>
      <div
        className="flex items-center w-full cursor-text"
        style={{
          backgroundColor: C.inputBg,
          borderRadius: 16,
          padding: '10px 16px',
          gap: 8,
        }}
        onClick={() => navigate('/search')}
      >
        <SearchIconSvg />
        <span
          style={{
            fontFamily: font, fontSize: 15, fontWeight: 400,
            color: C.gray400, lineHeight: '25.5px', letterSpacing: '-0.3px',
          }}
        >
          궁금한 운세를 검색해보세요
        </span>
      </div>
    </div>
  );
}

/** 무료 상담 카드 */
function FreeConsultationSection({ nickname }: { nickname: string }) {
  const navigate = useNavigate();
  const [showLoginSheet, setShowLoginSheet] = useState(false);

  // ── 상담 상태 (사주 / 타로) ────────────────────────────────────────────────
  const [statuses, setStatuses] = useState<Record<ConsultKey, ConsultStatus>>(() => ({
    saju: readConsultStatus(CONSULT_STORAGE_KEY.saju),
    taro: readConsultStatus(CONSULT_STORAGE_KEY.taro),
  }));

  // ── 자정 자동 초기화 ────────────────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      setStatuses({ saju: 'idle', taro: 'idle' });
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // ── 결과 페이지에서 홈으로 복귀 시 상태 재동기화 ────────────────────────────
  useEffect(() => {
    const onFocus = () => {
      setStatuses({
        saju: readConsultStatus(CONSULT_STORAGE_KEY.saju),
        taro: readConsultStatus(CONSULT_STORAGE_KEY.taro),
      });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // ── Dev 강제 토글 (idle ↔ completed, 날짜 무관) ──────────────────────────
  function devToggle(key: ConsultKey) {
    if (statuses[key] === 'idle') {
      if (!localStorage.getItem(LAST_RESULT_KEY[key])) {
        localStorage.setItem(LAST_RESULT_KEY[key], 'dev');
      }
      localStorage.setItem(
        CONSULT_STORAGE_KEY[key],
        JSON.stringify({ status: 'completed', date: todayDateStr() }),
      );
      setStatuses(prev => ({ ...prev, [key]: 'completed' }));
    } else {
      localStorage.removeItem(CONSULT_STORAGE_KEY[key]);
      setStatuses(prev => ({ ...prev, [key]: 'idle' }));
    }
  }

  const consultItems: Array<{
    label: string;
    icon: React.ReactNode;
    path: string;
    resultPath: string;
    statusKey: ConsultKey;
  }> = [
    { label: '사주 상담', icon: <CrystalBallIcon />, path: '/saju-consult', resultPath: '/saju-consult/result', statusKey: 'saju' },
    { label: '타로 상담', icon: <TarotIcon />,       path: '/taro-consult',  resultPath: '/taro-consult/result',  statusKey: 'taro' },
  ];

  return (
    <section className="w-full" style={{ backgroundColor: C.white, padding: '4px 20px 12px' }}>
      <div
        className="w-full"
        style={{
          backgroundColor: C.white,
          borderRadius: 20,
          border: `1px solid ${C.cardBorder}`,
          boxShadow: '4.855px 3.641px 12.137px 0px rgba(0,0,0,0.04)',
        }}
      >
        <div
          className="flex flex-col items-start"
          style={{ padding: '20px 20px 22px 24px', gap: 20 }}
        >
          {/* 인사말 */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <p
              style={{
                fontFamily: font, fontSize: 17, fontWeight: 600,
                color: C.black, letterSpacing: '-0.34px', lineHeight: '24px',
              }}
            >
              {nickname ? `${nickname}님, 오늘 마음은 어떠세요?` : '오늘 마음은 어떠세요?'}
            </p>
            <p
              style={{
                fontFamily: font, fontSize: 13, fontWeight: 400,
                color: C.gray400, letterSpacing: '-0.26px', lineHeight: '19px',
              }}
            >
              하루 한 번, 무료로 상담해보세요
            </p>
          </div>

          {/* 상담 항목 목록 */}
          <div className="flex flex-col w-full" style={{ gap: 20 }}>
            {consultItems.map(({ label, icon, path, resultPath, statusKey }) => {
              const isCompleted = statuses[statusKey] === 'completed';
              return (
                <div key={label} className="flex items-center justify-between w-full">

                  {/* 왼쪽: 아이콘 + [타이틀 행 + 서브텍스트] */}
                  <div className="flex items-center" style={{ gap: 12, flex: '1 0 0', minWidth: 0 }}>
                    {icon}
                    <div className="flex flex-col items-start justify-center">
                      {/* 타이틀 + Dev 토글 버튼 */}
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <span
                          style={{
                            fontFamily: font, fontSize: 15, fontWeight: 600,
                            color: C.black, letterSpacing: '-0.3px', lineHeight: '25.5px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {label}
                        </span>
                        {DEV && (
                          <button
                            onTouchStart={() => {}}
                            onClick={() => devToggle(statusKey)}
                            style={{
                              background: 'none', border: 'none', padding: '0 2px',
                              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                              fontFamily: font, fontSize: 11, fontWeight: 400,
                              color: C.gray600, lineHeight: '16px',
                              whiteSpace: 'nowrap', flexShrink: 0,
                            }}
                          >
                            Dev
                          </button>
                        )}
                      </div>
                      {/* 완료 서브텍스트 */}
                      {isCompleted && (
                        <span
                          style={{
                            fontFamily: font, fontSize: 11, fontWeight: 400,
                            color: C.gray400, lineHeight: '16px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          내일 00:00에 다시 열려요
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 버튼 */}
                  <button
                    className="flex items-center justify-center shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: C.primary,
                      width: 88, height: 38, borderRadius: 12, border: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onTouchStart={() => {}}
                    onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#41A09E'; }}
                    onPointerUp={(e)   => { e.currentTarget.style.backgroundColor = C.primary; }}
                    onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
                    onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
                    onClick={async () => {
                      if (isCompleted) {
                        if (statusKey === 'taro') {
                          sessionStorage.setItem('taro_result_phase', 'result');
                        }
                        navigate(resultPath);
                        return;
                      }
                      // 상담 시작: 비로그인 + 체험 사용 완료 → LoginBottomSheet
                      const { data: { user } } = await getAuthUser();
                      if (!user && hasUsedConsult()) {
                        setShowLoginSheet(true);
                        return;
                      }
                      trackConsultStartClick(statusKey as 'saju' | 'taro');
                      navigate(path);
                    }}
                  >
                    <span
                      style={{
                        fontFamily: font, fontSize: 14, fontWeight: 400,
                        color: C.white, letterSpacing: '-0.42px', lineHeight: '20px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isCompleted ? '결과 보기' : '상담 시작'}
                    </span>
                  </button>

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 로그인 유도 바텀시트 ── */}
      <LoginBottomSheet
        isOpen={showLoginSheet}
        onClose={() => setShowLoginSheet(false)}
        redirectPath="/"
        onLoginClick={() => trackConsultLoginClick('home')}
        icon="/key-icon.svg"
        title={
          <>
            <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#151515', fontFamily: "'Pretendard Variable', sans-serif", width: '100%' }}>로그인하면</p>
            <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#151515', fontFamily: "'Pretendard Variable', sans-serif", width: '100%' }}>매일 상담 받을 수 있어요</p>
          </>
        }
        description={
          <p style={{ fontSize: '15px', fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.45px', textAlign: 'center', color: '#848484', fontFamily: "'Pretendard Variable', sans-serif" }}>
            비회원은 1회만 이용 가능해요
          </p>
        }
      />
    </section>
  );
}

/** NEW 무료 운세 슬라이드 데이터 */
interface NewFortuneSlide {
  id: string;
  img: string;
  title: string;
  desc: string;
}

/** NEW 무료 운세 섹션 — 롤링 스와이프 (순수 px translateX) */
function NewFortuneSection({
  dot,
  onDotChange,
  slides,
}: {
  dot: number;
  onDotChange: (i: number) => void;
  slides: NewFortuneSlide[];
}) {
  const navigate = useNavigate();
  const N = slides.length;
  const GAP = 10;

  const containerRef = useRef<HTMLDivElement>(null);

  const [tx, setTx]                 = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);

  const gestureOn = useRef(false);
  const mouseOn   = useRef(false);
  const startCX   = useRef(0);
  const startTx   = useRef(0);
  const lastCX    = useRef(0);
  const lastT     = useRef(0);
  const velPx     = useRef(0);
  const txRef     = useRef(0);
  const dotRef    = useRef(dot);
  dotRef.current  = dot;
  txRef.current   = tx;

  const wheelCooldown = useRef(false);
  const getW = () => containerRef.current?.offsetWidth ?? 350;
  const getSnapW = () => getW() + GAP;

  const prevDot = useRef(dot);
  useEffect(() => {
    if (prevDot.current !== dot && !gestureOn.current && !mouseOn.current) {
      setIsSnapping(true);
      setTx(-dot * getSnapW());
    }
    prevDot.current = dot;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dot]);

  useEffect(() => {
    const onResize = () => {
      if (!gestureOn.current && !mouseOn.current) {
        setTx(-dotRef.current * getSnapW());
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const gestureStart = (cx: number) => {
    startCX.current = cx;
    startTx.current = txRef.current;
    lastCX.current  = cx;
    lastT.current   = Date.now();
    velPx.current   = 0;
    setIsSnapping(false);
  };

  const gestureMove = (cx: number) => {
    const delta   = cx - startCX.current;
    const sw      = getSnapW();
    const minTx   = -(N - 1) * sw;
    const raw     = startTx.current + delta;
    const clamped = Math.max(minTx, Math.min(0, raw));

    const now = Date.now();
    const dt  = now - lastT.current;
    if (dt > 0) velPx.current = (cx - lastCX.current) / dt;
    lastCX.current = cx;
    lastT.current  = now;

    setTx(clamped);
  };

  const gestureEnd = () => {
    const sw      = getSnapW();
    const v       = velPx.current;
    const rawPage = -txRef.current / sw;

    let page: number;
    if      (v < -0.3) page = Math.ceil(rawPage);
    else if (v >  0.3) page = Math.floor(rawPage);
    else               page = Math.round(rawPage);

    page = Math.max(0, Math.min(N - 1, page));

    setIsSnapping(true);
    setTx(-page * sw);
    onDotChange(page);
  };

  // ── Touch: DOM에 직접 non-passive 리스너 부착 ────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let horizLock: boolean | null = null;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      horizLock         = null;
      touchStartY       = e.touches[0].clientY;
      gestureOn.current = true;
      gestureStart(e.touches[0].clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!gestureOn.current) return;
      const cx = e.touches[0].clientX;
      const cy = e.touches[0].clientY;

      if (horizLock === null) {
        const adx = Math.abs(cx - startCX.current);
        const ady = Math.abs(cy - touchStartY);
        if      (adx > ady && adx > 6) horizLock = true;
        else if (ady > adx && ady > 6) { horizLock = false; gestureOn.current = false; }
        else return;
      }
      if (!horizLock) return;

      e.preventDefault();
      gestureMove(cx);
    };

    const onTouchEnd = () => {
      if (!gestureOn.current || horizLock !== true) {
        gestureOn.current = false;
        return;
      }
      gestureOn.current = false;
      horizLock = null;
      gestureEnd();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mouse: window 글로벌 리스너 ─────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseOn.current) return;
      gestureMove(e.clientX);
    };
    const onMouseUp = () => {
      if (!mouseOn.current) return;
      mouseOn.current = false;
      gestureEnd();
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="w-full" style={{ backgroundColor: C.white, padding: '26px 20px 32px' }}>
      <div className="flex flex-col items-start w-full" style={{ gap: 20 }}>
        {/* 섹션 타이틀 */}
        <span
          style={{
            fontFamily: font, fontSize: 18, fontWeight: 600,
            color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px',
            marginBottom: -10,
          }}
        >
          NEW 무료 운세
        </span>

        {/* ── 드래그 컨테이너 ─────────────────── */}
        <div
          ref={containerRef}
          className="w-full"
          style={{ userSelect: 'none', cursor: 'grab' }}
          onMouseDown={(e) => {
            mouseOn.current = true;
            gestureStart(e.clientX);
          }}
          onWheel={(e) => {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
            if (wheelCooldown.current) return;
            e.preventDefault();
            wheelCooldown.current = true;
            const cur = dotRef.current;
            if (e.deltaX > 0 && cur < N - 1) onDotChange(cur + 1);
            if (e.deltaX < 0 && cur > 0)     onDotChange(cur - 1);
            setTimeout(() => { wheelCooldown.current = false; }, 500);
          }}
        >
          <div className="w-full overflow-hidden">
            <div
              style={{
                display: 'flex',
                columnGap: GAP,
                transform: `translateX(${tx}px)`,
                transition: isSnapping
                  ? 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  : 'none',
                willChange: 'transform',
              }}
            >
              {slides.map((slide, i) => (
                <div
                  key={slide.id || i}
                  className="flex flex-col cursor-pointer"
                  style={{ flex: '0 0 100%', gap: 12 }}
                  onClick={() => {
                    if (slide.id) {
                      trackContentClick(slide.id);
                      navigate(`/free/content/${slide.id}`, { state: { canGoBack: true } });
                    }
                  }}
                >
                  {/* 이미지 영역 */}
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: '350 / 220', borderRadius: 16 }}
                  >
                    <img
                      alt={slide.title}
                      draggable={false}
                      className="absolute inset-0 object-cover"
                      style={{ width: '100%', height: '100%', borderRadius: 16 }}
                      src={slide.img}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute pointer-events-none"
                      style={{ inset: -1, borderRadius: 17, border: `1px solid ${C.cardBorder}` }}
                    />
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="flex flex-col w-full" style={{ gap: 2, padding: '0 4px' }}>
                    <p
                      style={{
                        fontFamily: font, fontSize: 16, fontWeight: 500,
                        color: C.black, letterSpacing: '-0.32px', lineHeight: '28.5px',
                      }}
                    >
                      {slide.title}
                    </p>
                    <p
                      className="line-clamp-2"
                      style={{
                        fontFamily: font, fontSize: 14, fontWeight: 400,
                        color: C.gray700, letterSpacing: '-0.42px', lineHeight: '22px',
                      }}
                    >
                      {slide.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 페이지네이션 닷 */}
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center" style={{ gap: 4 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => onDotChange(i)}
                className="cursor-pointer"
                style={{
                  width: 6, height: 6, borderRadius: '50%', border: 'none', padding: 0,
                  backgroundColor: dot === i ? C.primary : C.gray200,
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* 모두보기 버튼 */}
        <button
          className="flex items-center justify-center w-full cursor-pointer transition-all active:scale-[0.995]"
          style={{ backgroundColor: C.primary, height: 48, borderRadius: 12, border: 'none' }}
          onClick={() => navigate('/new-free')}
          onTouchStart={() => {}}
          onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#41A09E'; }}
          onPointerUp={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
          onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
          onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
        >
          <span
            style={{
              fontFamily: font, fontSize: 15, fontWeight: 400,
              color: C.white, letterSpacing: '-0.45px', lineHeight: '20px',
            }}
          >
            모두보기
          </span>
        </button>
      </div>
    </section>
  );
}

/** BEST 운세 개별 카드 */
function BestFortuneCard({ item, onClick }: { item: FortuneItem; onClick?: () => void }) {
  return (
    <div
      className="relative w-full"
      style={{
        backgroundColor: C.white,
        borderRadius: 16,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: '4.855px 3.641px 12.137px 0px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="flex flex-col cursor-pointer"
        style={{
          padding: '18px 16px',
          borderRadius: 16,
          transition: 'background-color 0.15s ease',
        }}
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
        onClick={onClick}
      >
        <div className="flex items-start" style={{ gap: 10 }}>
          <RankNumber n={item.rank} />
          <div className="flex flex-1 items-start min-w-0" style={{ gap: 12 }}>
            {/* 썸네일 */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{ width: 69, height: 47, borderRadius: 8 }}
            >
              <img
                alt={item.title}
                className="absolute inset-0 object-cover"
                style={{ width: '100%', height: '100%', borderRadius: 8 }}
                src={item.img}
              />
            </div>
            {/* 텍스트 */}
            <div className="flex flex-1 flex-col items-start min-w-0" style={{ gap: 4 }}>
              <p
                className="w-full overflow-hidden"
                style={{
                  fontFamily: font, fontSize: 14, fontWeight: 500,
                  color: C.black, letterSpacing: '-0.42px', lineHeight: '22px',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}
              >
                {item.title}
              </p>
              <div className="flex items-center" style={{ gap: 3 }}>
                {item.labels.map((l) => <LabelBadge key={l} type={l} />)}
              </div>
              <ViewCount count={item.views} showRead={item.showRead} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** BEST 운세 섹션 (탭 + 스와이프 카드 목록) */
function BestFortuneSection({
  tab,
  onTabChange,
  items,
}: {
  tab: number;
  onTabChange: (i: number) => void;
  items: FortuneItem[];
}) {
  const navigate = useNavigate();
  const PAGES = [
    items.slice(0, 3),
    items.slice(3, 6),
    items.slice(6, 9),
  ].filter(page => page.length > 0);
  const TOTAL_PAGES = PAGES.length;

  const [bestPage, setBestPage] = useState(0);

  // 탭(items) 변경 시 페이지 초기화
  useEffect(() => {
    setBestPage(0);
  }, [items]);

  const PEEK    = 20;
  const GAP     = 10;
  const PAD_LEFT = 10;

  const clipperRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [slideW, setSlideW] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (clipperRef.current) {
        setSlideW(clipperRef.current.offsetWidth - PAD_LEFT - GAP - PEEK);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const trackOffset = bestPage * (slideW + GAP);

  const touchStartX  = useRef<number>(0);
  const touchStartY  = useRef<number>(0);

  const mouseStartX  = useRef<number>(0);
  const isMouseDown  = useRef<boolean>(false);
  const mouseDragDx  = useRef<number>(0);
  const [dragOffset, setDragOffset] = useState(0);

  const wheelCooldown = useRef(false);

  const bestPageRef = useRef(bestPage);
  bestPageRef.current = bestPage;
  const totalPagesRef = useRef(TOTAL_PAGES);
  totalPagesRef.current = TOTAL_PAGES;

  const goTo = (next: number) => {
    setBestPage(Math.max(0, Math.min(TOTAL_PAGES - 1, next)));
  };

  // ── Touch: native DOM 리스너 (passive: false로 preventDefault 가능) ──
  useEffect(() => {
    const el = clipperRef.current;
    if (!el) return;

    let horizLock: boolean | null = null;

    const onTouchStart = (e: TouchEvent) => {
      horizLock = null;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const cx = e.touches[0].clientX;
      const cy = e.touches[0].clientY;
      if (horizLock === null) {
        const adx = Math.abs(cx - touchStartX.current);
        const ady = Math.abs(cy - touchStartY.current);
        if (adx > ady && adx > 6) horizLock = true;
        else if (ady > adx && ady > 6) horizLock = false;
        else return;
      }
      if (horizLock) e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (horizLock !== true) return;
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) < 40) return;
      const cur = bestPageRef.current;
      const total = totalPagesRef.current;
      setBestPage(Math.max(0, Math.min(total - 1, diff > 0 ? cur + 1 : cur - 1)));
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mouse: window 글로벌 리스너 (드래그 추적 + 페이지 전환) ──
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current) return;
      e.preventDefault();
      const dx = e.clientX - mouseStartX.current;
      mouseDragDx.current = dx;
      setDragOffset(dx);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!isMouseDown.current) return;
      isMouseDown.current = false;
      const diff = mouseStartX.current - e.clientX;
      setDragOffset(0);
      mouseDragDx.current = 0;
      if (Math.abs(diff) < 40) return;
      setBestPage(prev => Math.max(0, Math.min(totalPagesRef.current - 1, diff > 0 ? prev + 1 : prev - 1)));
      // 드래그 후 클릭 방지
      if (clipperRef.current) {
        const preventClick = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
        clipperRef.current.addEventListener('click', preventClick, { capture: true, once: true });
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 탭 바: 마우스 휠 → 가로 스크롤 ──
  useEffect(() => {
    const el = tabBarRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0 || e.shiftKey) {
        e.preventDefault();
        el.scrollLeft += e.deltaX || e.deltaY;
      } else if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <section
      className="flex flex-col items-start w-full"
      style={{ backgroundColor: C.white, paddingTop: 22, paddingBottom: 12 }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between w-full"
        style={{ padding: '0 12px 0 20px', marginBottom: 4 }}
      >
        <span
          style={{
            fontFamily: font, fontSize: 18, fontWeight: 600,
            color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px',
          }}
        >
          BEST 운세
        </span>
        <button
          className="group flex items-center justify-center cursor-pointer transition-colors duration-150"
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: 'none', padding: 4,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={e => (e.currentTarget.style.backgroundColor = '#F8F8F8')}
          onMouseUp={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onTouchStart={e => (e.currentTarget.style.backgroundColor = '#F8F8F8')}
          onTouchEnd={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={() => navigate('/best-fortune', { state: { sort: 'popular' } })}
        >
          <span className="group-active:scale-90 transition-transform duration-150 flex items-center justify-center">
            <ChevronRightIcon />
          </span>
        </button>
      </div>

      {/* 탭 바 — 마우스 드래그 + 휠 스크롤 지원 */}
      <div
        ref={tabBarRef}
        className="w-full overflow-x-auto"
        style={{ backgroundColor: C.white, scrollbarWidth: 'none', cursor: 'grab' }}
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
              // 드래그 후 클릭 방지
              const preventClick = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); };
              el.addEventListener('click', preventClick, { capture: true, once: true });
            }
          };
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        }}
      >
        <div
          className="flex items-center"
          style={{ padding: '8px 16px', gap: 2, minWidth: 'max-content' }}
        >
          {TABS.map((t, i) => {
            const isActive = tab === i;
            return (
              <button
                key={t}
                onClick={() => onTabChange(i)}
                className="relative flex items-center justify-center shrink-0 cursor-pointer"
                style={{
                  padding: '8px 16px',
                  borderRadius: 12,
                  backgroundColor: 'transparent',
                  border: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-[12px]"
                    style={{ backgroundColor: C.inputBg }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  />
                )}
                <span
                  className="relative transition-colors duration-[250ms]"
                  style={{
                    fontFamily: font, fontSize: 15, lineHeight: '20px', letterSpacing: '-0.45px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? C.charcoal : C.gray400,
                  }}
                >
                  {t}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 카드 스와이프 영역 ── */}
      <div
        ref={clipperRef}
        className="w-full"
        style={{
          backgroundColor: C.pageBg,
          overflow: 'hidden',
          paddingLeft: 10,
          paddingTop: 16,
          paddingBottom: 20,
          touchAction: 'pan-y',
        }}
        onMouseDown={(e) => { mouseStartX.current = e.clientX; isMouseDown.current = true; mouseDragDx.current = 0; setDragOffset(0); }}
      >
        <div
          style={{
            display: 'flex',
            gap: `${GAP}px`,
            paddingLeft: `${PAD_LEFT}px`,
            transform: `translateX(-${trackOffset - dragOffset}px)`,
            transition: dragOffset !== 0 ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            userSelect: 'none',
            cursor: 'grab',
            touchAction: 'pan-y',
          }}
        >
          {PAGES.map((pageItems, pi) => (
            <div
              key={pi}
              style={{
                width: slideW > 0 ? slideW : `calc(100% - ${PAD_LEFT + GAP + PEEK}px)`,
                minWidth: slideW > 0 ? slideW : `calc(100% - ${PAD_LEFT + GAP + PEEK}px)`,
                flexShrink: 0,
                display: 'grid',
                gridTemplateRows: 'repeat(3, auto)',
                rowGap: '8px',
              }}
              onWheel={(e) => {
                if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
                if (wheelCooldown.current) return;
                e.preventDefault();
                wheelCooldown.current = true;
                goTo(e.deltaX > 0 ? bestPage + 1 : bestPage - 1);
                setTimeout(() => { wheelCooldown.current = false; }, 500);
              }}
            >
              {pageItems.map((item) => (
                <BestFortuneCard
                  key={item.id}
                  item={item}
                  onClick={() => {
                    trackContentClick(item.id);
                    navigate(
                      item.contentType === 'free'
                        ? `/free/content/${item.id}`
                        : `/master/content/detail/${item.id}`,
                      { state: { canGoBack: true } }
                    );
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Fetching Hooks
// ─────────────────────────────────────────────────────────────────────────────

/** 로그인 유저 닉네임 가져오기 */
function useNickname(): string {
  const [nickname, setNickname] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data } = await supabase
          .from('users')
          .select('nickname')
          .eq('id', session.user.id)
          .single();
        if (data?.nickname) setNickname(data.nickname);
      } catch (e) {
        logger.error('useNickname 실패:', e);
      }
    })();
  }, []);
  return nickname;
}

/** NEW 무료 운세 — content_type='free' 최신 3개 (동일 날짜면 weekly_clicks DESC) */
function useNewFreeContents(): NewFortuneSlide[] {
  const [slides, setSlides] = useState<NewFortuneSlide[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('master_contents')
          .select('id, title, description, thumbnail_url, created_at, weekly_clicks')
          .eq('content_type', 'free')
          .eq('status', 'deployed')
          .order('created_at', { ascending: false })
          .order('weekly_clicks', { ascending: false })
          .limit(3);

        if (error) {
          logger.error('NEW 무료 운세 로드 실패:', error.message);
          return;
        }
        if (data && data.length > 0) {
          setSlides(
            data.map((row) => ({
              id: row.id,
              img: row.thumbnail_url || '/home-v2/thumbnail.png',
              title: row.title,
              desc: row.description || '',
            })),
          );
        }
      } catch (e) {
        logger.error('useNewFreeContents 실패:', e);
      }
    })();
  }, []);
  return slides;
}

/** BEST 운세 — 카테고리별 weekly_clicks 상위 9개 (get_home_contents RPC) */
function useBestContents(category: string): FortuneItem[] {
  const [items, setItems] = useState<FortuneItem[]>([]);
  const prevCategory = useRef(category);

  const fetchBest = useCallback(async (cat: string) => {
    try {
      const { data, error } = await supabase.rpc('get_home_contents', {
        p_category: cat,
        p_content_type: 'all',
        p_offset: 0,
        p_limit: 9,
      });

      if (error) {
        logger.error('BEST 운세 로드 실패:', error.message);
        return;
      }
      if (data && data.length > 0) {
        setItems(
          data.map((row: {
            id: string; title: string; content_type: string;
            thumbnail_url: string | null; weekly_clicks: number;
            view_count: number; created_at: string; is_read: boolean;
          }, i: number) => toFortuneItem(row, i + 1)),
        );
      } else {
        setItems([]);
      }
    } catch (e) {
      logger.error('useBestContents 실패:', e);
    }
  }, []);

  useEffect(() => {
    fetchBest(category);
    prevCategory.current = category;
  }, [category, fetchBest]);

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export function HomeScreenNew() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [dot, setDot]             = useState(0);

  // ── 데이터 로드 ──
  const nickname = useNickname();
  const newFreeSlides = useNewFreeContents();
  const bestCategory = TAB_CATEGORIES[activeTab] || '연애';
  const bestItems = useBestContents(bestCategory);

  // 탭 변경 시 BEST 스와이프 페이지 초기화 + sessionStorage 저장
  const handleTabChange = useCallback((i: number) => {
    setActiveTab(i);
    sessionStorage.setItem('best-fortune-tab', String(i));
  }, []);

  return (
    <div
      className="flex justify-center h-[100dvh] overflow-hidden"
      style={{ backgroundColor: C.pageBg }}
    >
      <SEO
        title="무료운세 사주 타로 궁합 | AI 사주풀이"
        description="AI사주 · 무료타로 · 궁합 · 생년월일운세를 정확하게 풀어드립니다. 무료사주풀이사이트 나다운세에서 타로카드뽑기, 사주연애운, 이직운세까지 무료로 만나보세요."
        keywords="AI사주, 무료사주풀이사이트, 생년월일운세, 무료타로사이트, 타로카드뽑기, 무료운세, 궁합, 사주풀이, 온라인사주추천, 비대면사주"
        canonical="/"
      />
      {/* 반응형 컨테이너: 320px ~ 440px, PC에서 440px 고정 */}
      <div
        className="flex flex-col relative overflow-y-auto overscroll-y-contain"
        style={{
          backgroundColor: C.white,
          width: '100%',
          minWidth: 320,
          maxWidth: 440,
        }}
      >
        <AppHeader />
        <AppSearchBar />
        <FreeConsultationSection nickname={nickname} />
        {newFreeSlides.length > 0 && (
          <NewFortuneSection dot={dot} onDotChange={setDot} slides={newFreeSlides} />
        )}

        {/* 섹션 구분선 */}
        <div style={{ height: 8, backgroundColor: C.cardBorder }} />

        <BestFortuneSection tab={activeTab} onTabChange={handleTabChange} items={bestItems} />
        <div style={{ marginTop: 130 }}>
          <Footer
            onNavigateToTerms={() => navigate('/terms-of-service')}
            onNavigateToPrivacy={() => navigate('/privacy-policy')}
          />
        </div>
      </div>
    </div>
  );
}
