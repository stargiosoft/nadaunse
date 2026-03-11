import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import BottomTabBar from '../components/BottomTabBar';
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
    views: row.view_count,
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
        fontSize: 10,
        fontWeight: 500,
        lineHeight: '15px',
        borderRadius: 4,
        padding: '0 3px',
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
    <div className="relative shrink-0" style={{ width: 28, height: 28 }}>
      <svg className="absolute block" style={{ width: '100%', height: '100%' }} fill="none" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.9925 23.1999C20.0765 23.1999 25.0085 18.2679 25.0085 12.1839C25.0085 6.09998 20.0765 1.16797 13.9925 1.16797C7.90858 1.16797 2.97656 6.09998 2.97656 12.1839C2.97656 18.2679 7.90858 23.1999 13.9925 23.1999Z" fill="#4DB2FF"/>
        <path opacity="0.2" d="M24.7675 9.87993C26.0411 15.8262 22.2496 21.6844 16.3032 22.958C13.8719 23.4787 11.4564 23.1537 9.36719 22.1842C18.9217 22.0423 23.4891 8.411 17.229 1.66211C20.9176 2.78503 23.9001 5.83043 24.7675 9.87993Z" fill="black"/>
        <path d="M24.3307 23.9505C24.8499 25.2632 23.8825 26.686 22.4709 26.686H5.51977C4.10818 26.686 3.14081 25.2632 3.65992 23.9505L4.53649 21.734C4.80397 21.0576 5.45749 20.6133 6.18483 20.6133H21.8058C22.5332 20.6133 23.1867 21.0576 23.4542 21.734L24.3307 23.9505Z" fill="#576268"/>
        <path opacity="0.2" d="M24.3322 23.9504C24.8512 25.263 23.8838 26.6858 22.4723 26.6858H15.8047C16.8692 25.9856 17.6408 25.0497 18.0051 23.9853C18.4338 22.7351 18.2338 21.5063 17.948 20.6133H21.8059C22.5346 20.6133 23.1919 21.0562 23.4562 21.7349L24.3322 23.9504Z" fill="black"/>
        <path d="M11.8516 4.29773L12.0997 5.10228C12.3048 5.7674 12.8255 6.28809 13.4906 6.49321L14.2952 6.74132C14.4239 6.78103 14.4239 6.96327 14.2952 7.00297L13.4906 7.25109C12.8255 7.4562 12.3048 7.97689 12.0997 8.64202L11.8516 9.44657C11.8119 9.57531 11.6296 9.57531 11.5899 9.44657L11.3418 8.64202C11.1367 7.97689 10.616 7.4562 9.95089 7.25109L9.14634 7.00297C9.0176 6.96327 9.0176 6.78103 9.14634 6.74132L9.95089 6.49321C10.616 6.28809 11.1367 5.7674 11.3418 5.10228L11.5899 4.29773C11.6296 4.16899 11.8119 4.16899 11.8516 4.29773ZM8.16106 9.61087L8.33514 10.1753C8.47905 10.642 8.84437 11.0073 9.31103 11.1512L9.8755 11.3253C9.96583 11.3532 9.96583 11.481 9.8755 11.5089L9.31103 11.683C8.84437 11.8269 8.47906 12.1922 8.33514 12.6588L8.16106 13.2233C8.13321 13.3136 8.00535 13.3136 7.97749 13.2233L7.80342 12.6588C7.65951 12.1922 7.29418 11.8269 6.82753 11.683L6.26306 11.5089C6.17273 11.481 6.17273 11.3532 6.26306 11.3253L6.82753 11.1512C7.29418 11.0073 7.6595 10.642 7.80342 10.1753L7.97749 9.61087C8.00535 9.52054 8.13321 9.52054 8.16106 9.61087Z" fill="white"/>
      </svg>
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
      <svg width="80" height="27" viewBox="0 0 80 27" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <path d="M3.97329 14.8055C3.99937 15.0923 4.1385 15.2611 4.45155 15.3286C5.95591 15.6829 7.52983 15.666 9.06897 15.5985C10.6603 15.531 12.2429 15.3117 13.8168 15.067C14.4951 14.9658 15.0864 14.8308 15.7299 15.1345C16.2255 15.3623 16.5821 15.7926 16.7125 16.3072C16.9473 17.2605 16.2603 18.1464 15.5647 18.4585C14.3473 19.0069 8.12114 19.3191 6.52113 19.3191C4.82547 19.3191 2.94719 18.9816 2.01675 18.5514C1.41675 18.2392 0.442829 17.6149 0.225436 16.5181C-0.148479 14.4933 -0.000652312 5.5252 0.260219 3.35699C0.355872 2.52176 1.32979 1.66123 2.5211 1.82996C4.36459 2.09993 4.1559 3.75351 4.07763 5.12024C3.90372 8.32616 3.72111 11.608 3.97329 14.8139V14.8055Z" fill="#151515"/>
        <path d="M38.4101 16.3075C38.6449 17.3874 38.0014 18.1045 37.2623 18.5095C36.097 19.1507 29.5753 19.3953 27.9579 19.3953C26.3405 19.3953 24.6448 18.9904 23.7404 18.6107C23.123 18.2986 22.1404 17.6827 21.9317 16.5775C21.5491 14.5443 21.7665 5.70267 21.9317 3.74538C22.0013 2.83422 23.0535 2.0918 23.723 2.0918H32.1144C32.9492 2.0918 33.6362 2.95233 33.6362 3.93098C33.6362 4.7409 33.0622 5.8461 32.1144 5.8461H26.2709C25.7491 5.8461 25.7231 6.13294 25.7231 6.32698C25.6013 8.36021 25.5057 12.587 25.6796 14.7636C25.7057 15.1011 25.8709 15.2867 26.2013 15.3879C26.6796 15.506 27.2709 15.582 28.1057 15.582C29.5405 15.582 35.2449 15.2023 35.7405 15.0336C36.8362 14.6792 38.1231 14.983 38.4101 16.3244V16.3075Z" fill="#151515"/>
        <path d="M39.1394 9.95389C39.1133 13.3454 39.0003 18.1965 38.8786 19.462C38.7394 20.4153 37.7307 21.2084 36.7133 21.1155C35.5481 20.9974 34.8524 20.061 34.9046 19.1076C35.2177 15.4714 35.2611 6.34302 34.9046 2.66465C34.7655 1.66069 35.6872 0.707349 36.6438 0.60611C37.7394 0.487997 38.7394 1.23042 38.8873 2.23438C39.0264 3.38176 39.122 3.81203 39.1481 6.18272H40.6699C41.5047 6.18272 42.1916 7.13606 42.1916 8.07252C42.1916 8.88244 41.6438 9.96233 40.6699 9.96233H39.1481L39.1394 9.95389Z" fill="#151515"/>
        <path d="M17.6082 9.95389C17.5821 13.3454 17.469 18.1965 17.3473 19.462C17.2082 20.4153 16.1995 21.2084 15.1821 21.1155C14.0168 20.9974 13.3212 20.061 13.3734 19.1076C13.6864 15.4714 13.7299 6.34302 13.3734 2.66465C13.2342 1.66069 14.156 0.707349 15.1125 0.60611C16.2082 0.487997 17.2082 1.23042 17.356 2.23438C17.4951 3.38176 17.5908 3.81203 17.6169 6.18272H19.1386C19.9734 6.18272 20.6604 7.13606 20.6604 8.07252C20.6604 8.88244 20.1125 9.96233 19.1386 9.96233H17.6169L17.6082 9.95389Z" fill="#151515"/>
        <path d="M41.9988 12.0809C42.0944 10.9082 43.3118 10.5032 44.1466 10.5792C47.8684 10.9335 56.425 11.0094 60.0685 10.5792C60.9467 10.5117 62.1641 10.8154 62.2163 12.1568C62.2598 13.397 61.3554 13.9707 60.5206 14.1141C59.425 14.2575 57.138 14.3503 54.5815 14.401V16.991C54.5815 17.995 53.4597 18.3999 52.5554 18.3999C51.651 18.3999 50.5727 17.9443 50.5727 16.991V14.4263C47.7118 14.401 45.0423 14.3082 43.6857 14.1141C42.7814 13.9707 41.877 13.4223 41.9901 12.0809H41.9988Z" fill="#151515"/>
        <path d="M52.0098 0C56.349 0 60.3751 1.40892 60.3751 4.9523C60.3751 8.49568 56.4446 9.89616 52.0098 9.89616C47.575 9.89616 43.6445 8.48725 43.6445 4.9523C43.6445 1.41735 47.5315 0 52.0098 0ZM52.0098 6.38653C54.8185 6.38653 56.4185 5.93095 56.4185 4.9523C56.4185 3.97365 54.7229 3.51807 52.0098 3.51807C49.2967 3.51807 47.6011 3.89772 47.6011 4.9523C47.6011 6.00688 49.3141 6.38653 52.0098 6.38653Z" fill="#151515"/>
        <path d="M79.7393 19.4639C79.6002 20.4173 78.6437 21.2103 77.6437 21.1175C76.6176 21.0247 75.8523 20.0629 75.8784 19.1096C76.1915 15.4734 76.261 6.34496 75.8784 2.66659C75.7567 1.66263 76.6436 0.683985 77.5741 0.608055C78.6263 0.540562 79.6002 1.23237 79.7393 2.23632C80.1654 5.50973 80.0002 16.8148 79.7393 19.4724V19.4639Z" fill="#151515"/>
        <path d="M69.9646 9.82018C69.1299 9.82018 68.582 8.74873 68.582 7.93038C68.582 7.11202 69.1994 6.04057 69.9646 6.04057H71.5125C71.4864 3.77112 71.4168 4.1592 71.2777 2.7756C71.156 1.77164 71.9734 0.8183 72.9734 0.717061C74.0255 0.624258 74.9995 1.34137 75.1386 2.34533C75.5647 5.61874 75.3995 16.6876 75.1386 19.3367C74.9995 20.29 73.9908 21.1253 73.069 20.9818C71.9994 20.8131 71.2603 19.9273 71.2777 18.9739C71.3994 17.4469 71.4951 12.4608 71.5125 9.81174H69.9646V9.82018Z" fill="#151515"/>
        <path d="M70.3214 16.8821C68.5301 15.3045 67.5823 13.6762 67.5562 9.37352V2.59048C67.5562 2.44705 67.5214 2.31207 67.4779 2.16865C67.4779 2.15177 67.4692 2.1349 67.4605 2.11803C67.2431 1.59495 66.6779 1.15625 65.7736 1.15625C64.9301 1.15625 64.2431 1.50215 63.9475 2.02522C63.9475 2.02522 63.904 2.09272 63.8953 2.12646C63.8779 2.16865 63.8692 2.20239 63.8605 2.24457C63.8257 2.35425 63.7996 2.47236 63.7996 2.59891V9.31447C63.7996 9.31447 63.7996 9.35665 63.7996 9.38196C63.7736 13.6931 62.8257 15.3129 61.0344 16.8906C60.3648 17.4642 60.2083 18.2826 60.6083 19.2613C61.0083 20.2315 62.4431 20.5689 63.3562 19.9277C64.2518 19.2697 65.0518 18.4176 65.6866 17.3461C66.3388 18.4092 67.1214 19.2697 68.0171 19.9277C68.9214 20.5689 70.3562 20.2399 70.7562 19.2613C71.1562 18.2826 70.991 17.4642 70.3301 16.8906L70.3214 16.8821Z" fill="#151515"/>
        <path d="M43.6878 17.548C45.0269 21.9266 48.6009 24.8795 52.8791 26.204C57.714 27.6973 62.6618 26.9211 67.3401 25.2507C68.314 24.9048 68.9662 23.943 68.6705 22.8969C68.4097 21.952 67.2966 21.2095 66.3227 21.5554C62.4357 22.9475 58.4618 23.7743 54.4009 22.6606C51.227 21.7917 48.3661 19.8006 47.3661 16.5356C46.6443 14.1818 42.9573 15.1858 43.6791 17.5565L43.6878 17.548Z" fill="#151515"/>
      </svg>
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
            color: '#B7B7B7', lineHeight: '25.5px', letterSpacing: '-0.3px',
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
      localStorage.removeItem('anonymous_consult_used_v1');
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
    <section className="w-full" style={{ backgroundColor: C.white, padding: '0px 20px 28px' }}>
      {/* 인사말 */}
      <div className="flex flex-col" style={{ gap: 3, marginBottom: 12, paddingTop: 16 }}>
        <p
          style={{
            fontFamily: font, fontSize: 18, fontWeight: 600,
            color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px',
          }}
        >
          {nickname ? `${nickname}님, 오늘 마음은 어떠세요?` : '오늘 마음은 어떠세요?'}
        </p>
        <p
          style={{
            fontFamily: font, fontSize: 13, fontWeight: 400,
            color: '#848484', letterSpacing: '-0.26px', lineHeight: '19px',
          }}
        >
          하루 한 번, 무료로 상담해보세요
        </p>
      </div>

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
          style={{ padding: "22px 24px 22px 24px", gap: 16 }}
        >
          {/* 상담 항목 목록 */}
          <div className="flex flex-col w-full" style={{ gap: 16 }}>
            {consultItems.map(({ label, icon, path, resultPath, statusKey }) => {
              const isCompleted = statuses[statusKey] === 'completed';
              return (
                <div key={label} className="flex items-center justify-between w-full">

                  {/* 왼쪽: 아이콘 + [타이틀 행 + 서브텍스트] */}
                  <div className="flex items-center" style={{ gap: 12, flex: '1 0 0', minWidth: 0 }}>
                    <div style={{ marginTop: 1 }}>{icon}</div>
                    <div className="flex flex-col items-start justify-center" style={{ marginTop: 4 }}>
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
                      transition: 'transform 0.1s ease',
                    }}
                    onTouchStart={() => {}}
                    onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#41A09E'; e.currentTarget.style.transform = 'scale(0.995)'; }}
                    onPointerUp={(e)   => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}
                    onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}
                    onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}
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
                        fontFamily: font, fontSize: 14, fontWeight: 500,
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

  const gestureOn  = useRef(false);
  const mouseOn    = useRef(false);
  const hasDragged = useRef(false);
  const startCX    = useRef(0);
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
    hasDragged.current = false;
    startTx.current = txRef.current;
    lastCX.current  = cx;
    lastT.current   = Date.now();
    velPx.current   = 0;
    setIsSnapping(false);
  };

  const gestureMove = (cx: number) => {
    const delta   = cx - startCX.current;
    if (Math.abs(delta) > 5) hasDragged.current = true;
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

  // ── Wheel: non-passive (트랙패드 가로 스와이프 → 슬라이드, 브라우저 뒤로가기 차단) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let wheelAccum = 0;
    let wheelActive = false;
    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (!wheelActive) {
        wheelActive = true;
        wheelAccum = 0;
        gestureStart(0);
      }
      wheelAccum -= e.deltaX;
      gestureMove(wheelAccum);
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        gestureEnd();
        wheelActive = false;
        wheelAccum = 0;
      }, 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mouse: window 글로벌 리스너 ─────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseOn.current) return;
      e.preventDefault();
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
    <section className="w-full" style={{ backgroundColor: C.white, padding: '10px 20px 0px' }}>
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
            e.preventDefault();
            mouseOn.current = true;
            gestureStart(e.clientX);
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
                  style={{ flex: '0 0 100%', gap: 10 }}
                  onClick={() => {
                    if (hasDragged.current) return;
                    if (slide.id) {
                      trackContentClick(slide.id);
                      sessionStorage.setItem('content_entry_source', '/new-free');
                      window.history.pushState(null, '', '/new-free');
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
                  <div className="flex flex-col w-full" style={{ gap: 1, padding: '0 4px' }}>
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
        <div className="flex items-center justify-center w-full" style={{ marginTop: -4 }}>
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
          className="flex items-center justify-center w-full cursor-pointer"
          style={{ backgroundColor: C.primary, height: 48, borderRadius: 16, border: 'none', transition: 'transform 0.1s ease' }}
          onClick={() => navigate('/new-free')}
          onTouchStart={() => {}}
          onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#41A09E'; e.currentTarget.style.transform = 'scale(0.995)'; }}
          onPointerUp={(e) => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.primary; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span
            style={{
              fontFamily: font, fontSize: 15, fontWeight: 500,
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
        borderRadius: 20,
        border: '1px solid #F6F6F6',
      }}
    >
      <div
        className="flex flex-col cursor-pointer"
        style={{
          padding: '16px 16px 12px',
          borderRadius: 20,
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
        <div className="flex items-start" style={{ gap: 11 }}>
          <div style={{ marginTop: -6 }}><RankNumber n={item.rank} /></div>
          <div className="flex flex-1 items-start min-w-0" style={{ gap: 10 }}>
            {/* 썸네일 */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{ width: 69, height: 47, borderRadius: 10 }}
            >
              <img
                alt={item.title}
                className="absolute inset-0 object-cover"
                style={{ width: '100%', height: '100%', borderRadius: 10 }}
                src={item.img}
              />
            </div>
            {/* 텍스트 */}
            <div className="flex flex-1 flex-col items-start min-w-0" style={{ gap: 2, marginTop: -2 }}>
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

  // 탭 변경 또는 items 변경 시 페이지 즉시 초기화
  useEffect(() => {
    setBestPage(0);
  }, [tab, items]);

  const PEEK    = 20;
  const GAP     = 10;
  const PAD_LEFT = 10;

  const clipperRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [slideW, setSlideW] = useState(0);
  const slideWRef = useRef(0);

  useEffect(() => {
    const measure = () => {
      const w = clipperRef.current?.offsetWidth ?? window.innerWidth;
      const cardW = w >= 390 ? w - 94 : Math.round(276 + (w - 320) * (296 - 276) / (390 - 320));
      setSlideW(Math.max(276, Math.min(346, cardW)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  slideWRef.current = slideW;
  const safePage = TOTAL_PAGES > 0 ? Math.min(bestPage, TOTAL_PAGES - 1) : 0;
  const trackOffset = safePage * (slideW + GAP);

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

  // ── Wheel: non-passive (트랙패드 가로 스와이프 → 슬라이드, 브라우저 뒤로가기 차단) ──
  useEffect(() => {
    const el = clipperRef.current;
    if (!el) return;
    let wheelAccum = 0;
    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
      wheelAccum += e.deltaX;
      // dragOffset = -wheelAccum: deltaX>0(스와이프 좌) → 음수 → 콘텐츠 좌로 이동(다음)
      const pageW = slideWRef.current + GAP;
      const minDrag = -(totalPagesRef.current - 1 - bestPageRef.current) * pageW;
      const maxDrag = bestPageRef.current * pageW;
      const clampedDrag = Math.max(minDrag, Math.min(maxDrag, -wheelAccum));
      setDragOffset(clampedDrag);
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const totalOffset = bestPageRef.current * pageW - clampedDrag;
        const targetPage = Math.max(0, Math.min(totalPagesRef.current - 1, Math.round(totalOffset / pageW)));
        setBestPage(targetPage);
        setDragOffset(0);
        wheelAccum = 0;
      }, 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (snapTimer) clearTimeout(snapTimer);
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
      style={{ backgroundColor: C.white, paddingTop: 14, paddingBottom: 12 }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between w-full"
        style={{ padding: '0 12px 0 20px', marginBottom: 0 }}
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
                  padding: '8px 10px',
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
                    fontFamily: font, fontSize: 14, lineHeight: '20px', letterSpacing: '-0.42px',
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
                alignSelf: 'flex-start',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}

            >
              {pageItems.map((item) => (
                <BestFortuneCard
                  key={item.id}
                  item={item}
                  onClick={() => {
                    trackContentClick(item.id);
                    sessionStorage.setItem('content_entry_source', '/best-fortune');
                    window.history.pushState(null, '', '/best-fortune');
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
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('home_nickname_cache') || '';
  });
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        // 캐시가 있으면 DB 조회 스킵 (세션 내 1회만 조회)
        const cached = localStorage.getItem('home_nickname_cache');
        if (cached) return;
        const { data } = await supabase
          .from('users')
          .select('nickname')
          .eq('id', session.user.id)
          .single();
        if (data?.nickname) {
          setNickname(data.nickname);
          localStorage.setItem('home_nickname_cache', data.nickname);
        }
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

/** BEST 운세 — 카테고리별 추천순 상위 9개 (get_recommended_contents RPC) */
function useBestContents(category: string): FortuneItem[] {
  const [items, setItems] = useState<FortuneItem[]>([]);
  const prevCategory = useRef(category);

  const fetchBest = useCallback(async (cat: string) => {
    try {
      const { data, error } = await supabase.rpc('get_recommended_contents', {
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
        <div style={{ height: 8, backgroundColor: '#F9F9F9', flexShrink: 0 }} />
        <BestFortuneSection tab={activeTab} onTabChange={handleTabChange} items={bestItems} />

        {newFreeSlides.length > 0 && (
          <NewFortuneSection dot={dot} onDotChange={setDot} slides={newFreeSlides} />
        )}
        <div style={{ marginTop: 130, marginBottom: 56 }}>
          <Footer
            onNavigateToTerms={() => navigate('/terms-of-service')}
            onNavigateToPrivacy={() => navigate('/privacy-policy')}
          />
        </div>

        <BottomTabBar />
      </div>
    </div>
  );
}
