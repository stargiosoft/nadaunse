import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { DEV } from '../lib/env';
import {
  CONSULT_STORAGE_KEY,
  LAST_RESULT_KEY,
  type ConsultKey,
  type ConsultStatus,
  readConsultStatus,
} from '../lib/consultStatus';
import svgPaths from '../imports/svg-t3oztaafjr';
import svgLogo from '../imports/svg-udgbxqyegd';

const imgThumbnail = '/home-v2/thumbnail.png';
const imgCard1 = '/home-v2/card-1.png';
const imgCard2 = '/home-v2/card-2.png';
const imgCard3 = '/home-v2/card-3.png';

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
  id: number;
  rank: number;
  title: string;
  labels: LabelType[];
  views: number;
  showRead?: boolean;
  img: string;
}

const TABS = ['연애', '이별', '재물', '직업', '인간관계', '시험/ 학업'];

const FORTUNE_ITEMS: FortuneItem[] = [
  { id: 1, rank: 1, title: '저 사람, 나한테 왜 그럴까 알려줘',    labels: ['New', '무료'], views: 27,  showRead: true, img: imgCard1 },
  { id: 2, rank: 2, title: '내돈은 다 어디갔을까?',               labels: ['New', '무료'], views: 100, img: imgCard2 },
  { id: 3, rank: 3, title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['심화'],        views: 100, img: imgCard3 },
  { id: 4, rank: 4, title: '저 사람, 나한테 왜 그럴까 알려줘',    labels: ['New', '무료'], views: 27,  showRead: true, img: imgCard1 },
  { id: 5, rank: 5, title: '내돈은 다 어디갔을까?',               labels: ['New', '무료'], views: 100, img: imgCard2 },
  { id: 6, rank: 6, title: '운명의 상대는 바로 곁에 있을 수 있어', labels: ['심화'],        views: 100, img: imgCard3 },
  { id: 7, rank: 7, title: '나의 올해 직업운은 어떨까?',           labels: ['무료'],        views: 84,  img: imgCard1 },
  { id: 8, rank: 8, title: '인간관계가 힘든 이유',                 labels: ['New', '무료'], views: 61,  img: imgCard2 },
  { id: 9, rank: 9, title: '시험 합격, 나는 될까?',               labels: ['심화'],        views: 45,  img: imgCard3 },
];

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

function LogoSmall() {
  return (
    <div className="relative shrink-0" style={{ width: 59, height: 20 }}>
      <div className="absolute" style={{ inset: '6.7% 79.05% 28.44% 0' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 12.3601 12.9707">
          <path d={svgPaths.p23a1d000} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '7.75% 51.93% 28.16% 27.15%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 12.3461 12.8174">
          <path d={svgPaths.p21f4640} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.2% 47.26% 21.76% 43.61%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 5.38448 15.2068">
          <path d={svgPaths.p3dd0ce80} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.2% 74.17% 21.76% 16.7%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 5.38448 15.2068">
          <path d={svgPaths.p252ddf00} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '39.15% 22.23% 31.85% 52.48%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 14.925 5.79971">
          <path d={svgPaths.pfa46300} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '0 24.53% 63.35% 54.55%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 12.3388 7.33049">
          <path d={svgPaths.p1aeb9d80} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.24% 0 21.76% 94.83%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 3.04836 15.201">
          <path d={svgPaths.p26269db0} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '2.63% 5.75% 22.23% 85.73%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 5.02813 15.0289">
          <path d={svgPaths.p316aad00} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '4.28% 11.29% 24.97% 75.49%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 7.80354 14.1496">
          <path d={svgPaths.p1cc508c0} fill={C.charcoal} />
        </svg>
      </div>
      <div className="absolute" style={{ inset: '56.28% 14.07% 0 54.48%' }}>
        <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 18.5528 8.74359">
          <path d={svgPaths.p36007680} fill={C.charcoal} />
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
function FreeConsultationSection() {
  const navigate = useNavigate();

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
              홍길동님, 오늘 마음은 어떠세요?
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
                    onClick={() => {
                      if (isCompleted && statusKey === 'taro') {
                        sessionStorage.setItem('taro_result_phase', 'result');
                      }
                      navigate(isCompleted ? resultPath : path);
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
    </section>
  );
}

/** NEW 무료 운세 섹션 — 롤링 스와이프 (순수 px translateX) */
function NewFortuneSection({
  dot,
  onDotChange,
}: {
  dot: number;
  onDotChange: (i: number) => void;
}) {
  const navigate = useNavigate();
  const slides = [
    {
      img: imgThumbnail,
      title: '연애를 망치는 주범',
      desc: '이상하게 연애만 시작하면 비슷한 문제로 힘들어지나요? 무심코 반복하는 당신의 행동 패턴 속에 모든 답이 숨어있을지 모릅니다. 당신의 사주를 통해 연애를 방해하는 치명적인 습관과 매력을 함께 분석해 드립니다.',
    },
    {
      img: imgCard1,
      title: '나의 재물운은 어떨까?',
      desc: '올해 재물운이 궁금하신가요? 사주로 보는 나의 금전운과 투자 운세를 분석해드립니다. 재물이 들어오는 시기와 나가는 시기를 미리 알아보고 현명한 선택을 해보세요.',
    },
    {
      img: imgCard2,
      title: '운명의 상대는 바로 곁에',
      desc: '소울메이트는 생각보다 가까운 곳에 있을지도 모릅니다. 사주로 보는 나의 인연운과 결혼운을 통해 운명의 상대를 만날 시기와 장소를 미리 알아보세요.',
    },
  ];
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
                  key={i}
                  className="flex flex-col"
                  style={{ flex: '0 0 100%', gap: 12 }}
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
function BestFortuneCard({ item }: { item: FortuneItem }) {
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
                alt=""
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
}: {
  tab: number;
  onTabChange: (i: number) => void;
}) {
  const navigate = useNavigate();
  const TOTAL_PAGES = 3;
  const PAGES = [
    FORTUNE_ITEMS.slice(0, 3),
    FORTUNE_ITEMS.slice(3, 6),
    FORTUNE_ITEMS.slice(6, 9),
  ];

  const [bestPage, setBestPage] = useState(0);

  const PEEK    = 20;
  const GAP     = 10;
  const PAD_LEFT = 10;

  const clipperRef = useRef<HTMLDivElement>(null);
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
  const isHorizDrag  = useRef<boolean>(false);

  const mouseStartX  = useRef<number>(0);
  const isMouseDown  = useRef<boolean>(false);

  const wheelCooldown = useRef(false);

  const goTo = (next: number) => {
    setBestPage(Math.max(0, Math.min(TOTAL_PAGES - 1, next)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizDrag.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (!isHorizDrag.current && dx > dy && dx > 5) isHorizDrag.current = true;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isHorizDrag.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    isHorizDrag.current = false;
    if (Math.abs(diff) < 40) return;
    goTo(diff > 0 ? bestPage + 1 : bestPage - 1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isMouseDown.current = true;
  };
  const handleMouseLeave = () => { isMouseDown.current = false; };

  useEffect(() => {
    const onWindowMouseUp = (e: MouseEvent) => {
      if (!isMouseDown.current) return;
      const diff = mouseStartX.current - e.clientX;
      isMouseDown.current = false;
      if (Math.abs(diff) < 40) return;
      setBestPage(prev => Math.max(0, Math.min(TOTAL_PAGES - 1, diff > 0 ? prev + 1 : prev - 1)));
    };
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => window.removeEventListener('mouseup', onWindowMouseUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          onClick={() => navigate('/best-fortune')}
        >
          <span className="group-active:scale-90 transition-transform duration-150 flex items-center justify-center">
            <ChevronRightIcon />
          </span>
        </button>
      </div>

      {/* 탭 바 */}
      <div
        className="w-full overflow-x-auto"
        style={{ backgroundColor: C.white, scrollbarWidth: 'none' }}
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
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            display: 'flex',
            gap: `${GAP}px`,
            paddingLeft: `${PAD_LEFT}px`,
            transform: `translateX(-${trackOffset}px)`,
            transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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
                <BestFortuneCard key={item.id} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 푸터 */
function AppFooter() {
  const footerLinks: string[] = ['이용약관', '개인정보 처리방침'];
  const companyLines: string[] = [
    'Copyright 2024@Stargiosoft All Rights Reserved.',
    '대표자 서지현 | 사업자등록번호 827-88-01815',
    '통신판매업번호 2024-서울영등포-2084',
    '서울시 영등포구 양평로 149, 1507호',
    '문의 stargiosoft@gmail.com',
  ];

  return (
    <footer
      className="w-full mt-auto"
      style={{ backgroundColor: C.cardBorder, padding: '32px 20px 40px' }}
    >
      {/* 로고 + 회사 정보 */}
      <div
        className="flex flex-col items-start"
        style={{ gap: 12, padding: '0 8px' }}
      >
        <LogoSmall />
        <div className="flex flex-col" style={{ gap: 4 }}>
          {companyLines.map((line) => (
            <p
              key={line}
              style={{
                fontFamily: font, fontSize: 13, fontWeight: 400,
                color: C.gray700, letterSpacing: '-0.26px', lineHeight: '19px',
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* 법적 링크 */}
      <div className="flex items-center" style={{ marginTop: 2 }}>
        {footerLinks.map((label, i) => (
          <span key={label} className="flex items-center">
            {i > 0 && (
              <div style={{ width: 1, height: 8, backgroundColor: C.gray100 }} />
            )}
            <button
              className="flex items-center justify-center cursor-pointer"
              style={{
                height: 34, padding: '0 8px', borderRadius: 12,
                backgroundColor: 'transparent', border: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: font, fontSize: 14, fontWeight: 500,
                  color: C.gray600, lineHeight: '22px', letterSpacing: '-0.42px',
                }}
              >
                {label}
              </span>
            </button>
          </span>
        ))}
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export function HomeScreenNew() {
  const [activeTab, setActiveTab] = useState(0);
  const [dot, setDot]             = useState(0);

  return (
    <div
      className="flex justify-center min-h-screen"
      style={{ backgroundColor: C.pageBg }}
    >
      {/* 반응형 컨테이너: 320px ~ 440px, PC에서 440px 고정 */}
      <div
        className="flex flex-col relative"
        style={{
          backgroundColor: C.white,
          width: '100%',
          minWidth: 320,
          maxWidth: 440,
          minHeight: '100vh',
        }}
      >
        <AppHeader />
        <AppSearchBar />
        <FreeConsultationSection />
        <NewFortuneSection dot={dot} onDotChange={setDot} />

        {/* 섹션 구분선 */}
        <div style={{ height: 8, backgroundColor: C.cardBorder }} />

        <BestFortuneSection tab={activeTab} onTabChange={setActiveTab} />
        <div style={{ marginTop: 130 }}>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
