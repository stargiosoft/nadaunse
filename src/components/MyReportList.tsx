import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { DEV } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import svgPaths from "@/imports/svg-o5jcc01aog";
import svgFlowerPaths from "@/imports/svg-cgnjs4xrxp";
import svgEmptyPaths from "@/imports/svg-mzaxb1u3cp";
import editSvgPaths from "@/imports/svg-4xnmni03a0";
import svgArrowPaths from "@/imports/svg-nh8ftbb7rx";
import ArrowLeft from './ArrowLeft';
import NavigationTabBar from './NavigationTabBar';
import MyReportEmpty from './MyReportEmpty';
import CardContent from './CardContent';
import { DotLoading } from './ui/PageLoader';

// ============================================
// Types (from MyReportWeekly)
// ============================================

export interface ReportTag {
  label: string;
}

export interface WeeklyReport {
  id: string;
  title: string;
  period: string;
  tags: ReportTag[];
  extraTagsCount?: number;
  message?: {
    label: string;
    content: string;
  };
}

export interface MonthlyReport {
  id: string;
  title: string;
  reports: WeeklyReport[];
}

// ============================================
// UI Components (from MyReportWeekly)
// ============================================

function WeeklyTagSummary({ count }: { count: number }) {
  const navigate = useNavigate();

  const handleGoToTags = () => {
    localStorage.setItem('homeFilter', JSON.stringify({ category: '전체', contentType: 'free' }));
    navigate('/');
  };

  return (
    <div className="flex flex-col w-full bg-white" style={{ paddingBottom: '22px' }}>
      <div className="flex flex-col items-center pb-0 w-full" style={{ paddingTop: '48px', padding: '48px 20px 0 20px', gap: '36px' }}>
        <div className="flex flex-col items-center w-full" style={{ gap: '20px' }}>
          <div className="relative" style={{ width: '48px', height: '48px' }}>
            <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" viewBox="0 0 48.0038 46.4307">
              <path clipRule="evenodd" d={svgFlowerPaths.p8ff0d80} fill="#FF6678" fillRule="evenodd" />
              <path d={svgFlowerPaths.p3195a000} fill="white" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center w-full" style={{ gap: '2px' }}>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515' }} className="w-full">
              이번 주에 태그 {count}개가 쌓였어요!
            </p>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7' }} className="w-full">
              모인 태그로 일요일에 보고서를 드려요
            </p>
          </div>
        </div>
        <button
          className="w-full flex items-center justify-center transition-all"
          style={{ height: '48px', borderRadius: '12px', backgroundColor: '#48b2af' }}
          onClick={handleGoToTags}
          onTouchStart={(e) => {
            e.currentTarget.style.backgroundColor = '#41a09e';
            e.currentTarget.style.transform = 'scale(0.99)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = '#41a09e';
            e.currentTarget.style.transform = 'scale(0.99)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff' }}>
            태그 쌓으러 가기
          </span>
        </button>
      </div>
      <div className="w-full" style={{ height: '12px', marginTop: '40px', backgroundColor: '#f9f9f9' }} />
    </div>
  );
}

function WeeklyEmptySummary() {
  const navigate = useNavigate();

  const handleGoToTags = () => {
    localStorage.setItem('homeFilter', JSON.stringify({ category: '전체', contentType: 'free' }));
    navigate('/');
  };

  return (
    <div className="flex flex-col w-full bg-white" style={{ paddingBottom: '22px' }}>
      <div className="flex flex-col items-center pb-0 w-full" style={{ paddingTop: '48px', padding: '48px 20px 0 20px', gap: '36px' }}>
        <div className="flex flex-col items-center w-full" style={{ gap: '20px' }}>
          <div className="relative" style={{ width: '48px', height: '48px' }}>
            <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" viewBox="0 0 48.0038 46.4307">
              <path clipRule="evenodd" d={svgEmptyPaths.p8ff0d80} fill="#F3F3F3" fillRule="evenodd" />
              <path d={svgEmptyPaths.p3195a000} fill="#D4D4D4" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center w-full" style={{ gap: '2px' }}>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#b7b7b7' }} className="w-full">
              이번 주 저장한 태그가 없어요
            </p>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7' }} className="w-full">
              태그 하나만 있어도 보고서가 만들어져요
            </p>
          </div>
        </div>
        <button
          className="w-full flex items-center justify-center transition-all"
          style={{ height: '48px', borderRadius: '12px', backgroundColor: '#48b2af' }}
          onClick={handleGoToTags}
          onTouchStart={(e) => {
            e.currentTarget.style.backgroundColor = '#41a09e';
            e.currentTarget.style.transform = 'scale(0.99)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = '#41a09e';
            e.currentTarget.style.transform = 'scale(0.99)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#48b2af';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff' }}>
            태그 쌓으러 가기
          </span>
        </button>
      </div>
      <div className="w-full" style={{ height: '12px', marginTop: '40px', backgroundColor: '#f9f9f9' }} />
    </div>
  );
}

function EditIcon() {
  return (
    <div className="relative shrink-0" style={{ width: '16px', height: '16px' }} data-name="Icons">
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icons">
          <g id="Vector">
            <mask fill="white" id="path-1-inside-1_27_3508">
              <path clipRule="evenodd" d={editSvgPaths.p1c4f0780} fillRule="evenodd" />
            </mask>
            <path clipRule="evenodd" d={editSvgPaths.p1c4f0780} fill="#B7B7B7" fillRule="evenodd" />
            <path d={editSvgPaths.p289ae600} fill="#B7B7B7" mask="url(#path-1-inside-1_27_3508)" />
          </g>
          <g id="Vector_2">
            <mask fill="white" id="path-3-inside-2_27_3508">
              <path d={editSvgPaths.p677f400} />
            </mask>
            <path d={editSvgPaths.p677f400} fill="#B7B7B7" />
            <path d={editSvgPaths.p367c240} fill="#B7B7B7" mask="url(#path-3-inside-2_27_3508)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ViewReportArrowIcon() {
  return (
    <div className="relative" style={{ width: '12px', height: '12px' }}>
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g>
          <path d={svgArrowPaths.p23113100} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d="M1.75 6H10.165" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ReportCard({ report, onReportClick, onEditClick }: { report: WeeklyReport; onReportClick?: (id: string) => void; onEditClick?: (reportId: string, currentMessage: string) => void }) {
  return (
    <div className="flex flex-col w-full" style={{ gap: '8px', padding: '0 2px' }}>
      <div className="flex items-center w-full" style={{ gap: '6px', padding: '0 2px' }}>
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '25.5px', color: '#151515', letterSpacing: '-0.3px' }}>
          {report.title}
        </p>
        <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '13px', lineHeight: '19px', color: '#B7B7B7', letterSpacing: '-0.26px' }}>
          {report.period.replace(/^\d{4}\./, '')}
        </span>
      </div>
      {report.message && (
        <div className="w-full" style={{ borderRadius: '12px', padding: '18px 16px', backgroundColor: '#f9f9f9' }}>
          <div className="flex items-start w-full" style={{ gap: '4px' }}>
            <div className="flex flex-col flex-1 min-w-0" style={{ gap: '4px' }}>
              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#151515', letterSpacing: '-0.42px' }}>
                {report.message.label}
              </p>
              <div style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#151515', letterSpacing: '-0.42px', whiteSpace: 'pre-wrap' }}>
                {report.message.content}
              </div>
            </div>
            <div
              className="flex items-center justify-center relative shrink-0 cursor-pointer transition-colors active:bg-[#F3F3F3]"
              style={{ padding: '11px 4px 10px 4px', borderRadius: '8px', width: '36px', marginTop: '-8px' }}
              onClick={() => onEditClick?.(report.id, report.message?.content || '')}
            >
               <EditIcon />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center flex-nowrap overflow-hidden" style={{ gap: '6px', padding: '0 2px' }}>
        <div className="flex items-center flex-nowrap" style={{ gap: '4px' }}>
          {report.tags.slice(0, 3).map((tag, idx) => (
            <div key={idx} className={`flex items-center justify-center border bg-white ${idx === 2 ? 'hidden min-[390px]:flex' : ''}`} style={{ padding: '4px 8px 3px 8px', borderRadius: '99px', borderColor: '#e7e7e7' }}>
              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#151515', letterSpacing: '-0.24px' }}>
                {tag.label}
              </p>
            </div>
          ))}
        </div>
        {(report.tags.length + (report.extraTagsCount || 0)) > 2 && (
          <p className="min-[390px]:hidden" style={{ paddingTop: '2px', fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#999999', letterSpacing: '-0.24px' }}>
            +{(report.tags.length + (report.extraTagsCount || 0)) - 2}
          </p>
        )}
        {(report.tags.length + (report.extraTagsCount || 0)) > 3 && (
          <p className="hidden min-[390px]:block" style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#999999', letterSpacing: '-0.24px' }}>
            +{(report.tags.length + (report.extraTagsCount || 0)) - 3}
          </p>
        )}
      </div>
      <div className="flex w-full justify-end" style={{ marginTop: '-4px' }}>
        <div
          className="flex items-center transition-colors hover:bg-[#F8F8F8] cursor-pointer"
          style={{ gap: '4px', padding: '2px 4px 2px 6px', borderRadius: '8px' }}
          onClick={() => onReportClick?.(report.id)}
        >
          <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#848484', letterSpacing: '-0.42px' }}>
            보고서 보기
          </p>
          <ViewReportArrowIcon />
        </div>
      </div>
    </div>
  );
}

function MonthlySection({ month, defaultExpanded = false, onReportClick, onEditClick }: { month: MonthlyReport; defaultExpanded?: boolean; onReportClick?: (id: string) => void; onEditClick?: (reportId: string, currentMessage: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && month.reports.length > 0);

  return (
    <div className="flex flex-col w-full border-b last:border-0" style={{ borderColor: '#f3f3f3' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full bg-white transition-colors active:bg-[#f9f9f9]"
        style={{ padding: '14px 20px' }}
      >
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: isExpanded ? 500 : 400, fontSize: '17px', lineHeight: '24px', color: '#000000', letterSpacing: '-0.34px' }}>
          {month.title}
        </p>
        <motion.div
          animate={{ rotate: isExpanded ? -180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown size={20} color="#b7b7b7" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && month.reports.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col" style={{ padding: '0 20px 12px 20px' }}>
              {month.reports.map((report, index) => (
                <div key={report.id} className="flex flex-col">
                  {index > 0 && <div className="w-full" style={{ height: '1px', backgroundColor: '#F8F8F8', margin: '12px 0' }} />}
                  <ReportCard report={report} onReportClick={onReportClick} onEditClick={onEditClick} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecommendationCardList() {
  return (
    <div className="flex flex-col w-full" style={{ padding: '20px 0 40px 0', gap: '12px' }}>
      <div className="flex items-center w-full" style={{ padding: '0 20px' }}>
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 600, fontSize: '17px', lineHeight: '24px', letterSpacing: '-0.34px', color: '#000000' }}>
          태그 쌓기 좋은 운세
        </p>
      </div>

      <div className="w-full">
        <CardContent />
      </div>
    </div>
  );
}

function MyReportWeeklyContent({
  currentWeekTagsCount,
  filteredReports,
  onReportClick,
  onEditClick
}: {
  currentWeekTagsCount: number;
  filteredReports: MonthlyReport[];
  onReportClick?: (id: string) => void;
  onEditClick?: (reportId: string, currentMessage: string) => void;
}) {
  const hasNoReports = filteredReports.length === 0;

  return (
    <>
      {currentWeekTagsCount > 0 ? (
        <WeeklyTagSummary count={currentWeekTagsCount} />
      ) : (
        <WeeklyEmptySummary />
      )}
      {hasNoReports ? (
        // 보고서가 없을 때: 태그 쌓기 좋은 운세 섹션 표시
        <RecommendationCardList />
      ) : (
        // 보고서가 있을 때: 월별 보고서 목록 표시
        <div className="flex flex-col w-full" style={{ paddingBottom: '130px' }}>
          {filteredReports.map((month) => (
            <MonthlySection key={month.id} month={month} defaultExpanded={false} onReportClick={onReportClick} onEditClick={onEditClick} />
          ))}
        </div>
      )}
    </>
  );
}

// ============================================
// Main Component
// ============================================

function CommonLogo() {
  return (
    <div className="relative shrink-0" style={{ height: '20px', width: '67px', paddingLeft: '8px' }}>
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 59 20">
        <g>
          <path d={svgPaths.p1fb34640} fill="#151515" />
          <path d={svgPaths.p1bbbb200} fill="#151515" />
          <path d={svgPaths.p11620600} fill="#151515" />
          <path d={svgPaths.p9a70500} fill="#151515" />
          <path d={svgPaths.p115ca080} fill="#151515" />
          <path d={svgPaths.pb2cf980} fill="#151515" />
          <path d={svgPaths.p211e0700} fill="#151515" />
          <path d={svgPaths.p3088fdc0} fill="#151515" />
          <path d={svgPaths.p2e718980} fill="#151515" />
          <path d={svgPaths.p15169200} fill="#151515" />
        </g>
      </svg>
    </div>
  );
}

// DB에서 주간 보고서 데이터 타입
interface DBWeeklyReport {
  id: string;
  year: number;
  month: number;
  week: number;
  week_start_date: string;
  week_end_date: string;
  tag_count: number;
  situation_summary: string | null;
  published_at: string;
  self_encouragement: string | null;
}

interface DBReportSection {
  id: string;
  report_id: string;
  section_type: string;
  content: {
    content_paragraphs?: string[];
  };
}

interface DBUserTag {
  tag_name: string;
  tag_type: 'positive' | 'negative';
}

/**
 * 날짜 포맷: MM.DD
 */
function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * DB 데이터를 UI용 MonthlyReport 형식으로 변환
 */
function transformToMonthlyReports(
  dbReports: DBWeeklyReport[],
  sections: Map<string, DBReportSection>,
  tags: Map<string, DBUserTag[]>
): MonthlyReport[] {
  // 연-월별로 그룹핑
  const grouped = new Map<string, WeeklyReport[]>();

  for (const report of dbReports) {
    const monthKey = `${report.year}-${String(report.month).padStart(2, '0')}`;

    // 해당 주의 태그 가져오기
    const weekTags = tags.get(report.id) || [];
    const displayTags = weekTags.slice(0, 3).map(t => ({ label: `# ${t.tag_name}` }));
    const extraCount = Math.max(0, weekTags.length - 3);

    // self_encouragement (사용자 작성 응원글) 사용
    let message: { label: string; content: string } | undefined;
    if (report.self_encouragement) {
      message = {
        label: '이번 주 나에게 :',
        content: report.self_encouragement
      };
    }

    // 기간 포맷
    const startDate = formatDateShort(report.week_start_date);
    const endDate = formatDateShort(report.week_end_date);
    const period = `${report.year}.${startDate} ~ ${endDate}`;

    const weeklyReport: WeeklyReport = {
      id: report.id,
      title: `${report.week}주차 보고서`,
      period,
      tags: displayTags,
      extraTagsCount: extraCount,
      message
    };

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(weeklyReport);
  }

  // MonthlyReport 배열로 변환 (최신순 정렬)
  const result: MonthlyReport[] = [];
  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  for (const key of sortedKeys) {
    const [year, month] = key.split('-');
    const yearShort = year.slice(-2);
    result.push({
      id: key,
      title: `${yearShort}년 ${parseInt(month)}월 보고서`,
      reports: grouped.get(key)!.sort((a, b) => {
        // 주차 내림차순 (최신순)
        const weekA = parseInt(a.title.match(/(\d+)주차/)?.[1] || '0');
        const weekB = parseInt(b.title.match(/(\d+)주차/)?.[1] || '0');
        return weekB - weekA;
      })
    });
  }

  return result;
}

function Footer() {
  return (
    <div className="flex flex-col items-start w-full shrink-0 mt-auto" style={{ backgroundColor: '#f9f9f9', padding: '40px 20px' }}>
      <div className="flex flex-col w-full" style={{ gap: '8px' }}>
        <CommonLogo />
        <div className="flex flex-col w-full" style={{ gap: '4px', paddingLeft: '8px', fontSize: '13px', color: '#6d6d6d', lineHeight: '19px', letterSpacing: '-0.26px' }}>
          <p>Copyright 2024@Stargiosoft All Rights Reserved.</p>
          <p>대표자 서지현 | 사업자등록번호 827-88-01815</p>
          <p>통신판매업번호 2024-서울영등포-2084</p>
          <p>서울시 영등포구 양평로 149, 1507호</p>
          <p>문의 stargiosoft@gmail.com</p>
        </div>
        <div className="flex items-center" style={{ gap: '0px', marginTop: '-4px' }}>
          <button className="flex items-center justify-center transition-all duration-200 active:scale-97" style={{ height: '34px', padding: '0 8px', borderRadius: '6px' }}>
            <span style={{ fontSize: '14px', color: '#848484', fontWeight: 500 }}>이용약관</span>
          </button>
          <div style={{ height: '10px', width: '1px', backgroundColor: '#d4d4d4' }} />
          <button className="flex items-center justify-center transition-all duration-200 active:scale-97" style={{ height: '34px', padding: '0 8px', borderRadius: '6px' }}>
            <span style={{ fontSize: '14px', color: '#848484', fontWeight: 500 }}>개인정보 처리방침</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface MyReportListProps {
  onBack?: () => void;
  onTabChange?: (index: number) => void;
  onReportClick?: (id: string) => void;
  forceEmptyState?: boolean; // 테스트용: 빈 상태 강제
}

// ⭐ 캐시 키 & 만료 시간 (CLAUDE.md 캐싱 전략 준수)
const MY_REPORT_CACHE_KEY = 'my_report_cache_v3'; // v3: self_encouragement 컬럼 복원
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5분

/**
 * 이번 주 범위 계산 (일요일 00:00 ~ 토요일 23:59)
 * - 주간 보고서 발행 기준: 전주 일~토 태그 7건 이상 → 차주 일요일 발행
 */
function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=일요일, 6=토요일

  // 이번 주 일요일 (시작)
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  // 이번 주 토요일 (끝)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 🚀 동기적 캐시 초기화 (스켈레톤/로딩 플래시 방지)
 * - localStorage에서 캐시 데이터 즉시 로드
 * - 유효한 캐시가 있으면 isLoading: false로 시작
 */
function getInitialCacheState(): {
  currentWeekTagsCount: number;
  hasAnyTags: boolean;
  isLoading: boolean;
  hasValidCache: boolean;
  reports: MonthlyReport[];
} {
  try {
    const cachedJson = localStorage.getItem(MY_REPORT_CACHE_KEY);
    if (cachedJson) {
      const cache = JSON.parse(cachedJson);
      const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY_MS;

      if (!isExpired) {
        console.log('🚀 [MyReportList] 캐시 히트! 즉시 렌더링');
        return {
          currentWeekTagsCount: cache.currentWeekTagsCount || 0,
          hasAnyTags: cache.hasAnyTags || false,
          isLoading: false, // 캐시 있으면 로딩 스킵
          hasValidCache: true,
          reports: cache.reports || []
        };
      }
      console.log('⏰ [MyReportList] 캐시 만료 (5분 초과)');
    }
  } catch (e) {
    console.error('❌ [MyReportList] 캐시 파싱 실패:', e);
  }

  return {
    currentWeekTagsCount: 0,
    hasAnyTags: false,
    isLoading: true, // 캐시 없으면 로딩 표시
    hasValidCache: false,
    reports: []
  };
}

// ⭐ 최근 N주 목록 생성 (주차 선택용)
interface WeekOption {
  label: string;
  weekStartDate: string;
  weekEndDate: string;
}

function getRecentWeeks(count: number): WeekOption[] {
  const weeks: WeekOption[] = [];
  const now = new Date();
  const dayOfWeek = now.getDay();

  for (let i = 1; i <= count; i++) {
    // i주 전 일요일
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek - 7 * i);
    weekStart.setHours(0, 0, 0, 0);

    // i주 전 토요일
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    const label = `${i}주 전 (${formatDate(weekStart)} ~ ${formatDate(weekEnd)})`;

    weeks.push({
      label,
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: weekEnd.toISOString().split('T')[0]
    });
  }

  return weeks;
}

export default function MyReportList({ onBack, onTabChange, onReportClick, forceEmptyState = false }: MyReportListProps) {
  const navigate = useNavigate();

  // 🚀 동기적 캐시 초기화 (useState 초기화 시점에 캐시 로드)
  const initialState = getInitialCacheState();

  const [reports, setReports] = useState<MonthlyReport[]>(initialState.reports);
  const [activeTab, setActiveTab] = useState(1); // "나의 분석 보고서" 탭이 기본 활성화
  const [currentWeekTagsCount, setCurrentWeekTagsCount] = useState(initialState.currentWeekTagsCount);
  const [isLoading, setIsLoading] = useState(forceEmptyState ? false : !initialState.hasValidCache);
  const [hasAnyTags, setHasAnyTags] = useState(initialState.hasAnyTags);

  // ⭐ 관리자 패널용 상태
  const [isMaster, setIsMaster] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [failedReportInfo, setFailedReportInfo] = useState<{
    totalUsersWithTags: number;
    usersWithReports: number;
    failedCount: number;
    failedUserIds: string[];
  } | null>(null);
  const [isLoadingFailedReports, setIsLoadingFailedReports] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendProgress, setResendProgress] = useState({ current: 0, total: 0 });
  const weekOptions = getRecentWeeks(8);

  // ⭐ 주간 보고서 목록 조회 함수
  const fetchWeeklyReports = useCallback(async (userId: string) => {
    try {
      console.log('📊 [MyReportList] 주간 보고서 조회 시작...');

      // 1. 완료된 주간 보고서 목록 조회
      const { data: dbReports, error: reportsError } = await supabase
        .from('weekly_reports')
        .select('id, year, month, week, week_start_date, week_end_date, tag_count, situation_summary, published_at, self_encouragement')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('published_at', { ascending: false });

      if (reportsError) {
        console.error('❌ [MyReportList] 보고서 조회 실패:', reportsError);
        return [];
      }

      if (!dbReports || dbReports.length === 0) {
        console.log('📭 [MyReportList] 보고서 없음');
        return [];
      }

      console.log(`✅ [MyReportList] 보고서 ${dbReports.length}개 조회됨`);

      // 2. 각 보고서의 soul_prescription 섹션 조회 (메시지용)
      const reportIds = dbReports.map(r => r.id);
      const { data: sectionsData } = await supabase
        .from('weekly_report_sections')
        .select('id, report_id, section_type, content')
        .in('report_id', reportIds)
        .eq('section_type', 'soul_prescription');

      const sectionsMap = new Map<string, DBReportSection>();
      if (sectionsData) {
        for (const section of sectionsData) {
          sectionsMap.set(section.report_id, section as DBReportSection);
        }
      }

      // 3. 각 보고서 기간의 태그 조회
      const tagsMap = new Map<string, DBUserTag[]>();
      for (const report of dbReports) {
        const { data: tagsData } = await supabase
          .from('user_trait_tags')
          .select('tag_name, tag_type')
          .eq('user_id', userId)
          .eq('is_confirmed', true)
          .neq('tag_name', '__SKIPPED__')
          .gte('created_at', report.week_start_date)
          .lte('created_at', report.week_end_date + 'T23:59:59.999Z')
          .limit(10);

        if (tagsData && tagsData.length > 0) {
          tagsMap.set(report.id, tagsData as DBUserTag[]);
        }
      }

      // 4. UI 형식으로 변환
      const monthlyReports = transformToMonthlyReports(dbReports as DBWeeklyReport[], sectionsMap, tagsMap);
      return monthlyReports;

    } catch (error) {
      console.error('❌ [MyReportList] 보고서 조회 오류:', error);
      return [];
    }
  }, []);

  // ⭐ 실제 데이터 로드 (캐시 미스 또는 백그라운드 갱신)
  useEffect(() => {
    const loadData = async () => {
      try {
        // ⭐ 마스터 계정 여부 확인 (캐시 유무와 상관없이 항상 실행)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('📭 [MyReportList] 로그인 안됨');
          setIsLoading(false);
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role === 'master') {
          setIsMaster(true);
          console.log('👑 [MyReportList] 마스터 계정 확인됨');
        }

        // 🚀 캐시가 유효하면 API 호출 스킵 (백그라운드 갱신만)
        const needsRefresh = localStorage.getItem('my_report_needs_refresh') === 'true';
        if (initialState.hasValidCache && !needsRefresh) {
          console.log('✅ [MyReportList] 유효한 캐시 존재 → API 호출 스킵');
          setIsLoading(false);
          return;
        }

        if (needsRefresh) {
          localStorage.removeItem('my_report_needs_refresh');
          console.log('🔄 [MyReportList] refresh 플래그 감지 → API 호출');
        }

        // 이번 주 범위 계산
        const { start, end } = getCurrentWeekRange();
        console.log('📅 [MyReportList] 이번 주 범위:', start.toISOString(), '~', end.toISOString());

        // 🚀 API 병렬화: 이번 주 태그 + 전체 태그 동시 조회
        const [weeklyResult, totalResult] = await Promise.all([
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_confirmed', true)
            .neq('tag_name', '__SKIPPED__')  // ⭐ 스킵 마커 제외
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString()),
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_confirmed', true)
            .neq('tag_name', '__SKIPPED__')  // ⭐ 스킵 마커 제외
        ]);

        const weeklyTagCount = weeklyResult.count || 0;
        const totalTagCount = totalResult.count || 0;
        const hasAnyTagsNow = totalTagCount > 0;

        console.log('✅ [MyReportList] 이번 주 태그:', weeklyTagCount, '/ 전체:', totalTagCount);

        // 상태 업데이트
        setCurrentWeekTagsCount(weeklyTagCount);
        setHasAnyTags(hasAnyTagsNow);

        let monthlyReports: MonthlyReport[] = [];
        if (!hasAnyTagsNow) {
          setReports([]);
        } else {
          // ⭐ 주간 보고서 목록 조회
          monthlyReports = await fetchWeeklyReports(user.id);
          setReports(monthlyReports);
          console.log(`📋 [MyReportList] 월별 보고서 ${monthlyReports.length}개 로드됨`);
        }

        // 🚀 캐시에 저장 (만료 시간 포함) - reports 데이터 포함!
        localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
          currentWeekTagsCount: weeklyTagCount,
          hasAnyTags: hasAnyTagsNow,
          reports: monthlyReports,
          timestamp: Date.now()
        }));
        console.log('💾 [MyReportList] 캐시 저장 완료 (보고서 포함)');

      } catch (error) {
        console.error('❌ [MyReportList] 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!forceEmptyState) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [forceEmptyState, fetchWeeklyReports]);

  // 🚀 visibility/focus 변경 시 refresh 플래그 체크
  useEffect(() => {
    const checkAndRefresh = async () => {
      const needsRefresh = localStorage.getItem('my_report_needs_refresh') === 'true';
      if (!needsRefresh) return;

      console.log('🔄 [MyReportList] visibility 변경 → refresh 플래그 감지');
      localStorage.removeItem('my_report_needs_refresh');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { start, end } = getCurrentWeekRange();
        const [weeklyResult, totalResult] = await Promise.all([
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_confirmed', true)
            .neq('tag_name', '__SKIPPED__')  // ⭐ 스킵 마커 제외
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString()),
          supabase
            .from('user_trait_tags')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_confirmed', true)
            .neq('tag_name', '__SKIPPED__')  // ⭐ 스킵 마커 제외
        ]);

        const weeklyTagCount = weeklyResult.count || 0;
        const totalTagCount = totalResult.count || 0;
        const hasAnyTagsNow = totalTagCount > 0;

        setCurrentWeekTagsCount(weeklyTagCount);
        setHasAnyTags(hasAnyTagsNow);
        console.log('✅ [MyReportList] 태그 개수 갱신:', weeklyTagCount, '/', totalTagCount);

        // 주간 보고서 목록도 갱신
        let monthlyReports: MonthlyReport[] = [];
        if (hasAnyTagsNow) {
          monthlyReports = await fetchWeeklyReports(user.id);
          setReports(monthlyReports);
          console.log(`📋 [MyReportList] visibility 변경 → 보고서 ${monthlyReports.length}개 갱신`);
        }

        // 캐시 업데이트 (reports 포함)
        localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
          currentWeekTagsCount: weeklyTagCount,
          hasAnyTags: hasAnyTagsNow,
          reports: monthlyReports,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('❌ [MyReportList] refresh 실패:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkAndRefresh);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkAndRefresh);
    };
  }, [fetchWeeklyReports]);

  const handleTabChange = (index: number) => {
    if (index === 0) {
      // 프로필 탭 클릭 시 마이페이지로 이동 - ⭐ replace: true로 히스토리 교체 (iOS 스와이프 뒤로가기 → 홈)
      navigate('/profile', { replace: true });
      return;
    }
    setActiveTab(index);
    onTabChange?.(index);
  };

  // ⭐ 보고서 클릭 시 상세 페이지로 이동
  const handleReportClick = (reportId: string) => {
    if (onReportClick) {
      onReportClick(reportId);
    } else {
      // 기본 동작: 주간 보고서 상세 페이지로 이동
      navigate(`/report-weekly-detail/${reportId}`);
    }
  };

  // ⭐ 나 응원하기 수정 클릭 시 수정 페이지로 이동
  const handleEditClick = (reportId: string, currentMessage: string) => {
    navigate(`/report-weekly/${reportId}/cheer-edit`, {
      state: { initialText: currentMessage }
    });
  };

  // ⭐ 관리자: 실패 보고서 조회
  const handleFetchFailedReports = async () => {
    if (isLoadingFailedReports) return;

    try {
      setIsLoadingFailedReports(true);
      setFailedReportInfo(null);

      const selectedWeek = weekOptions[selectedWeekIndex];
      console.log('📊 [Admin] 실패 보고서 조회:', selectedWeek);

      const { data, error } = await supabase.functions.invoke('get-failed-reports', {
        body: {
          weekStartDate: selectedWeek.weekStartDate,
          weekEndDate: selectedWeek.weekEndDate
        }
      });

      if (error) {
        console.error('❌ [Admin] 조회 실패:', error);
        alert(`조회 실패: ${error.message}`);
        return;
      }

      if (data?.success) {
        setFailedReportInfo({
          totalUsersWithTags: data.totalUsersWithTags,
          usersWithReports: data.usersWithReports,
          failedCount: data.failedCount,
          failedUserIds: data.failedUserIds
        });
        console.log('✅ [Admin] 실패 보고서 조회 완료:', data);
      } else {
        alert(`조회 실패: ${data?.error || '알 수 없는 오류'}`);
      }

    } catch (error) {
      console.error('❌ [Admin] 조회 오류:', error);
      alert(`조회 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoadingFailedReports(false);
    }
  };

  // ⭐ 관리자: 실패 보고서 재발송
  const handleResendFailedReports = async () => {
    if (!failedReportInfo || failedReportInfo.failedCount === 0) {
      alert('재발송할 대상이 없습니다.');
      return;
    }

    if (isResending) return;

    const confirmed = window.confirm(
      `${failedReportInfo.failedCount}명의 사용자에게 보고서를 재발송하시겠습니까?\n\n` +
      `⚠️ 주의: 이미 보고서가 있는 사용자는 제외됩니다.\n` +
      `📦 5명씩 병렬 처리됩니다.`
    );

    if (!confirmed) return;

    try {
      setIsResending(true);
      const selectedWeek = weekOptions[selectedWeekIndex];
      const failedUserIds = failedReportInfo.failedUserIds;
      const total = failedUserIds.length;
      setResendProgress({ current: 0, total });

      console.log('🚀 [Admin] 보고서 재발송 시작:', total, '명 (5명씩 병렬 처리)');

      let successCount = 0;
      let failCount = 0;
      let processedCount = 0;

      // ⭐ 5명씩 병렬 처리 (batch 함수와 동일한 방식)
      const BATCH_SIZE = 5;
      const DELAY_BETWEEN_BATCHES = 2000; // 배치 간 2초 대기

      for (let i = 0; i < failedUserIds.length; i += BATCH_SIZE) {
        const batch = failedUserIds.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(failedUserIds.length / BATCH_SIZE);

        console.log(`📦 [Admin] 배치 ${batchNum}/${totalBatches} 처리 중... (${batch.length}명)`);

        // 배치 내 병렬 처리
        const batchPromises = batch.map(async (userId) => {
          try {
            // 타임아웃 5분 설정 (OpenAI API 호출 시간 고려)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5분

            const { data, error } = await supabase.functions.invoke('generate-weekly-report', {
              body: {
                userId,
                sendAlimtalk: true,
                weekStartDate: selectedWeek.weekStartDate,
                weekEndDate: selectedWeek.weekEndDate
              },
              // @ts-expect-error - supabase-js의 FunctionInvokeOptions에 signal 지원
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (error || !data?.success) {
              console.error(`❌ [Admin] ${userId} 실패:`, error || data?.error);
              return { success: false };
            } else {
              console.log(`✅ [Admin] ${userId} 성공:`, data.reportId);
              return { success: true };
            }
          } catch (e) {
            console.error(`❌ [Admin] ${userId} 오류:`, e);
            return { success: false };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        // 결과 집계
        batchResults.forEach(result => {
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
          processedCount++;
        });

        setResendProgress({ current: processedCount, total });

        // 다음 배치 전 딜레이 (마지막 배치 제외)
        if (i + BATCH_SIZE < failedUserIds.length) {
          console.log(`⏳ [Admin] ${DELAY_BETWEEN_BATCHES / 1000}초 대기...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }

      alert(
        `📊 재발송 완료!\n\n` +
        `• 성공: ${successCount}명\n` +
        `• 실패: ${failCount}명`
      );

      // 결과 새로고침
      if (successCount > 0) {
        handleFetchFailedReports();
      }

    } catch (error) {
      console.error('❌ [Admin] 재발송 오류:', error);
      alert(`재발송 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsResending(false);
      setResendProgress({ current: 0, total: 0 });
    }
  };

  const handleDevNoTags = () => {
    setCurrentWeekTagsCount(0);
    setHasAnyTags(true); // 전체 태그는 있지만 이번 주 태그만 없음
    // 캐시도 업데이트 (현재 reports 유지)
    localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
      currentWeekTagsCount: 0,
      hasAnyTags: true,
      reports,
      timestamp: Date.now()
    }));
  };

  const handleDevManyTags = () => {
    setCurrentWeekTagsCount(6);
    setHasAnyTags(true);
    // 캐시도 업데이트 (현재 reports 유지)
    localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
      currentWeekTagsCount: 6,
      hasAnyTags: true,
      reports,
      timestamp: Date.now()
    }));
  };

  const handleDevInitialState = () => {
    // 태그 전혀 없는 초기 상태
    setCurrentWeekTagsCount(0);
    setHasAnyTags(false);
    setReports([]);
    // 캐시 삭제
    localStorage.removeItem(MY_REPORT_CACHE_KEY);
  };

  // ⭐ DEV: 주간 보고서 배치 실행 (보고서 생성 + 알림톡 발송)
  const [isSendingAlimtalk, setIsSendingAlimtalk] = useState(false);
  const handleDevSendAlimtalk = async () => {
    if (isSendingAlimtalk) return;

    try {
      setIsSendingAlimtalk(true);
      console.log('🚀 [DEV] 주간 보고서 배치 시작...');

      // 1. 현재 로그인한 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      console.log('👤 [DEV] 사용자 ID:', user.id);

      // 2. generate-weekly-reports-batch Edge Function 호출 (테스트 모드)
      // 현재 로그인한 사용자만 대상으로 실행
      const { data, error } = await supabase.functions.invoke('generate-weekly-reports-batch', {
        body: {
          testMode: true,
          testUserIds: [user.id]
        }
      });

      if (error) {
        console.error('❌ [DEV] 배치 실행 실패:', error);
        alert(`배치 실행 실패: ${error.message}`);
        return;
      }

      console.log('✅ [DEV] 배치 실행 결과:', data);

      if (data?.success) {
        const summary = data.summary;
        const results = data.results || [];
        const successResults = results.filter((r: { success: boolean }) => r.success);
        const failResults = results.filter((r: { success: boolean }) => !r.success);

        let message = `✅ 주간 보고서 배치 완료!\n\n`;
        message += `📊 결과:\n`;
        message += `• 대상: ${summary?.targetCount || 0}명\n`;
        message += `• 성공: ${summary?.successCount || 0}명\n`;
        message += `• 실패: ${summary?.failCount || 0}명\n`;
        message += `• 소요 시간: ${summary?.elapsedSeconds || 0}초\n`;

        if (successResults.length > 0) {
          message += `\n🎉 생성된 보고서 ID:\n`;
          successResults.forEach((r: { reportId?: string }) => {
            message += `• ${r.reportId}\n`;
          });
        }

        if (failResults.length > 0) {
          message += `\n❌ 실패 사유:\n`;
          failResults.forEach((r: { error?: string }) => {
            message += `• ${r.error}\n`;
          });
        }

        alert(message);

        // ⭐ 보고서 생성 성공 시 캐시 삭제 & 목록 새로고침
        if (successResults.length > 0) {
          console.log('🔄 [DEV] 캐시 삭제 & 보고서 목록 새로고침...');
          localStorage.removeItem(MY_REPORT_CACHE_KEY);

          // 보고서 목록 다시 조회
          const monthlyReports = await fetchWeeklyReports(user.id);
          setReports(monthlyReports);
          setHasAnyTags(true);

          // 새 캐시 저장
          localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
            currentWeekTagsCount,
            hasAnyTags: true,
            reports: monthlyReports,
            timestamp: Date.now()
          }));
          console.log('✅ [DEV] 보고서 목록 새로고침 완료:', monthlyReports.length, '개');
        }
      } else {
        alert(`배치 실행 실패: ${data?.error || '알 수 없는 오류'}`);
      }

    } catch (error) {
      console.error('❌ [DEV] 배치 실행 오류:', error);
      alert(`배치 실행 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSendingAlimtalk(false);
    }
  };

  // ⭐ DEV: 미확인 태그 즉시 정리
  const [isCleaningTags, setIsCleaningTags] = useState(false);
  const handleDevCleanupTags = async () => {
    if (isCleaningTags) return;

    try {
      setIsCleaningTags(true);
      console.log('🧹 [DEV] 미확인 태그 정리 시작...');

      // cleanup-unconfirmed-tags Edge Function 호출
      const { data, error } = await supabase.functions.invoke('cleanup-unconfirmed-tags');

      if (error) {
        console.error('❌ [DEV] 태그 정리 실패:', error);
        alert(`태그 정리 실패: ${error.message}`);
        return;
      }

      console.log('✅ [DEV] 태그 정리 결과:', data);

      if (data?.success) {
        let message = `✅ 미확인 태그 정리 완료!\n\n`;
        message += `📊 결과:\n`;
        message += `• 처리 그룹: ${data.processedGroups || 0}개\n`;
        message += `• 삭제 태그: ${data.deletedTags || 0}개\n`;
        message += `• SKIPPED 마커: ${data.insertedSkipMarkers || 0}개\n`;

        if (data.errors && data.errors.length > 0) {
          message += `\n⚠️ 오류:\n`;
          data.errors.forEach((err: string) => {
            message += `• ${err}\n`;
          });
        }

        alert(message);
      } else {
        alert(`태그 정리 실패: ${data?.error || '알 수 없는 오류'}`);
      }

    } catch (error) {
      console.error('❌ [DEV] 태그 정리 오류:', error);
      alert(`태그 정리 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsCleaningTags(false);
    }
  };

  // 실제 DB에서 조회한 보고서 목록 (더 이상 필터링 불필요)
  const filteredReports = reports;

  // 초기 빈 상태: 태그가 전혀 없는 경우
  const isInitialEmptyState = !hasAnyTags && reports.length === 0;

  return (
    // iOS Safari 스크롤 바운스 방지 패턴 (fixed inset-0)
    <div className="bg-white fixed inset-0 flex justify-center">
      {/* 내부 컨테이너: 최대 440px 제한 */}
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">

        {/* Top Navigation */}
        <div className="bg-white shrink-0 w-full z-20" style={{ height: '52px' }}>
          <div className="flex flex-col justify-center" style={{ width: '100%', height: '100%' }}>
            <div className="flex items-center justify-between" style={{ padding: '4px 12px', width: '100%' }}>
              <ArrowLeft onClick={onBack || (() => navigate('/'))} />
              <p style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                lineHeight: '25.5px',
                letterSpacing: '-0.36px',
                color: '#000000',
                textAlign: 'center',
                flex: 1,
              }}>
                마이페이지
              </p>
              {/* 우측 공간 확보 (뒤로가기 버튼과 대칭) */}
              <div style={{ width: '44px', height: '44px' }} />
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="shrink-0 w-full">
          <NavigationTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Main Content - 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="w-full bg-white flex flex-col min-h-full">
            {isLoading ? (
              // 로딩 상태 - DotLoading 사용 (FreeContentLoading과 동일)
              <div className="flex items-center justify-center w-full" style={{ padding: '80px 20px' }}>
                <DotLoading />
              </div>
            ) : isInitialEmptyState ? (
              <MyReportEmpty />
            ) : (
              <MyReportWeeklyContent
                currentWeekTagsCount={currentWeekTagsCount}
                filteredReports={filteredReports}
                onReportClick={handleReportClick}
                onEditClick={handleEditClick}
              />
            )}

            {/* ⭐ 관리자 패널 - master 계정만 표시 */}
            {isMaster && !isLoading && (
              <div
                className="flex flex-col w-full"
                style={{
                  margin: '20px',
                  marginTop: '40px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '16px',
                  border: '1.5px solid #41a09e',
                  width: 'calc(100% - 40px)'
                }}
              >
                {/* 헤더 */}
                <div className="flex items-center" style={{ gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px' }}>👑</span>
                  <span style={{
                    fontFamily: 'Pretendard Variable',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#41a09e',
                    letterSpacing: '-0.32px'
                  }}>
                    관리자 패널
                  </span>
                </div>

                {/* 주차 선택 */}
                <div className="flex flex-col" style={{ gap: '8px', marginBottom: '16px' }}>
                  <span style={{
                    fontFamily: 'Pretendard Variable',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#151515',
                    letterSpacing: '-0.28px'
                  }}>
                    주차 선택
                  </span>
                  <select
                    value={selectedWeekIndex}
                    onChange={(e) => {
                      setSelectedWeekIndex(Number(e.target.value));
                      setFailedReportInfo(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e7e7e7',
                      backgroundColor: '#ffffff',
                      fontFamily: 'Pretendard Variable',
                      fontSize: '14px',
                      color: '#151515',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {weekOptions.map((option, index) => (
                      <option key={index} value={index}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 조회 버튼 */}
                <button
                  onClick={handleFetchFailedReports}
                  disabled={isLoadingFailedReports}
                  className="w-full flex items-center justify-center transition-all active:scale-[0.98]"
                  style={{
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: isLoadingFailedReports ? '#b7b7b7' : '#368683',
                    marginBottom: failedReportInfo ? '16px' : '0'
                  }}
                >
                  <span style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#ffffff',
                    letterSpacing: '-0.28px'
                  }}>
                    {isLoadingFailedReports ? '조회 중...' : '실패 보고서 조회'}
                  </span>
                </button>

                {/* 조회 결과 */}
                {failedReportInfo && (
                  <div className="flex flex-col" style={{ gap: '12px' }}>
                    {/* 통계 */}
                    <div
                      className="flex flex-col"
                      style={{
                        padding: '16px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e7e7e7',
                        gap: '8px'
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '13px',
                          color: '#848484',
                          letterSpacing: '-0.26px'
                        }}>
                          태그 있는 사용자
                        </span>
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#151515',
                          letterSpacing: '-0.28px'
                        }}>
                          {failedReportInfo.totalUsersWithTags}명
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '13px',
                          color: '#848484',
                          letterSpacing: '-0.26px'
                        }}>
                          보고서 발송 완료
                        </span>
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#41a09e',
                          letterSpacing: '-0.28px'
                        }}>
                          {failedReportInfo.usersWithReports}명
                        </span>
                      </div>
                      <div
                        className="flex justify-between items-center"
                        style={{ paddingTop: '8px', borderTop: '1px solid #f3f3f3' }}
                      >
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#151515',
                          letterSpacing: '-0.28px'
                        }}>
                          발송 실패
                        </span>
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: failedReportInfo.failedCount > 0 ? '#FF6678' : '#41a09e',
                          letterSpacing: '-0.32px'
                        }}>
                          {failedReportInfo.failedCount}명
                        </span>
                      </div>
                    </div>

                    {/* 재발송 버튼 */}
                    {failedReportInfo.failedCount > 0 && (
                      <button
                        onClick={handleResendFailedReports}
                        disabled={isResending}
                        className="w-full flex items-center justify-center transition-all active:scale-[0.98]"
                        style={{
                          height: '48px',
                          borderRadius: '12px',
                          backgroundColor: isResending ? '#d4d4d4' : '#41a09e'
                        }}
                      >
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontWeight: 600,
                          fontSize: '15px',
                          color: '#ffffff',
                          letterSpacing: '-0.3px'
                        }}>
                          {isResending
                            ? `재발송 중... (${resendProgress.current}/${resendProgress.total})`
                            : `보고서 다시 보내기 (${failedReportInfo.failedCount}명)`
                          }
                        </span>
                      </button>
                    )}

                    {/* 실패 없음 메시지 */}
                    {failedReportInfo.failedCount === 0 && (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          padding: '16px',
                          backgroundColor: '#e8f5f5',
                          borderRadius: '12px'
                        }}
                      >
                        <span style={{
                          fontFamily: 'Pretendard Variable',
                          fontSize: '14px',
                          color: '#41a09e',
                          letterSpacing: '-0.28px'
                        }}>
                          ✅ 모든 보고서가 정상 발송되었습니다
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 구분선 */}
                <div
                  style={{
                    width: '100%',
                    height: '1px',
                    backgroundColor: '#e7e7e7',
                    margin: '20px 0 16px 0'
                  }}
                />

                {/* 태그 즉시 정리 버튼 */}
                <div className="flex flex-col" style={{ gap: '8px' }}>
                  <span style={{
                    fontFamily: 'Pretendard Variable',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#151515',
                    letterSpacing: '-0.28px'
                  }}>
                    태그 관리
                  </span>
                  <button
                    onClick={handleDevCleanupTags}
                    disabled={isCleaningTags}
                    className="w-full flex items-center justify-center transition-all active:scale-[0.98]"
                    style={{
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: isCleaningTags ? '#d4d4d4' : '#ff9800',
                      cursor: isCleaningTags ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span style={{
                      fontFamily: 'Pretendard Variable',
                      fontWeight: 500,
                      fontSize: '14px',
                      color: '#ffffff',
                      letterSpacing: '-0.28px'
                    }}>
                      {isCleaningTags ? '정리 중...' : '미확인 태그 즉시 정리'}
                    </span>
                  </button>
                  <span style={{
                    fontFamily: 'Pretendard Variable',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#848484',
                    letterSpacing: '-0.24px',
                    lineHeight: '18px'
                  }}>
                    72시간(3일) 이상 지난 미확인 태그를 정리합니다
                  </span>
                </div>
              </div>
            )}

            {/* Dev Controls - only visible in dev/staging environments */}
            {DEV && !isLoading && (
              <div className="flex flex-col items-center w-full" style={{ gap: '16px', padding: '0 20px', marginTop: '40px', paddingBottom: '20px' }}>
                <div className="flex items-center justify-center flex-wrap" style={{ gap: '12px' }}>
                  <button
                    onClick={handleDevNoTags}
                    style={{ backgroundColor: '#f5f5f5', fontSize: '12px', color: '#999', fontWeight: 500, padding: '8px 12px', borderRadius: '6px' }}
                  >
                    dev 이번주 태그 0개
                  </button>
                  <button
                    onClick={handleDevManyTags}
                    style={{ backgroundColor: '#f5f5f5', fontSize: '12px', color: '#999', fontWeight: 500, padding: '8px 12px', borderRadius: '6px' }}
                  >
                    dev 이번주 태그 6개
                  </button>
                  <button
                    onClick={handleDevInitialState}
                    style={{ backgroundColor: '#f5f5f5', fontSize: '12px', color: '#999', fontWeight: 500, padding: '8px 12px', borderRadius: '6px' }}
                  >
                    dev 태그 없음 (초기)
                  </button>
                </div>
                {/* ⭐ DEV 버튼들 (보고서 생성 + 태그 정리) */}
                <div className="flex items-center justify-center flex-wrap" style={{ gap: '12px' }}>
                  <button
                    onClick={handleDevSendAlimtalk}
                    disabled={isSendingAlimtalk}
                    style={{
                      backgroundColor: isSendingAlimtalk ? '#d4d4d4' : '#48b2af',
                      fontSize: '13px',
                      color: '#ffffff',
                      fontWeight: 600,
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: isSendingAlimtalk ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isSendingAlimtalk ? 0.7 : 1
                    }}
                  >
                    {isSendingAlimtalk ? '생성 중...' : '📊 보고서 생성 (DEV)'}
                  </button>
                  <button
                    onClick={handleDevCleanupTags}
                    disabled={isCleaningTags}
                    style={{
                      backgroundColor: isCleaningTags ? '#d4d4d4' : '#ff9800',
                      fontSize: '13px',
                      color: '#ffffff',
                      fontWeight: 600,
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: isCleaningTags ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isCleaningTags ? 0.7 : 1
                    }}
                  >
                    {isCleaningTags ? '정리 중...' : '🧹 태그 즉시 정리 (DEV)'}
                  </button>
                </div>
              </div>
            )}

            {/* Footer - 로딩 중에는 숨김 */}
            {!isLoading && (
              <>
                {!isInitialEmptyState && <div style={{ height: '20px' }} />}
                <Footer />
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
