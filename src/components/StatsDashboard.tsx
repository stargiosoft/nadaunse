/**
 * 통계 대시보드 컴포넌트
 * Master 계정 전용 - 고객/태그/매출 통계 표시
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, UserCheck, Eye, Gift, CreditCard, DollarSign, RefreshCw, Calendar, X, ChevronLeft, ChevronRight, Activity, Clock } from 'lucide-react';
import svgPathsBack from "../imports/svg-ct14exwyb3";
import svgPathsHome from "../imports/svg-sg7rn8f2dm";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, CartesianGrid } from 'recharts';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { fetchDashboardStats, fetchGAStats, getDateRangeFromPreset, DashboardStats, GAStats, TagStat, DateRangePreset, DateRangeFilter, TrendRangePreset, DailyTrendData, fetchDailyTrendStats, getTrendDateRange } from '../lib/statsService';
import SEO from './SEO';

interface StatsDashboardProps {
  onBack: () => void;
  onHome: () => void;
}

// 기간 프리셋 옵션
const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: '7days', label: '7일' },
  { value: '30days', label: '30일' },
  { value: '90days', label: '90일' },
  { value: '1year', label: '1년' }
];

// 추세 탭 기간 프리셋 옵션
const TREND_PRESETS: { value: TrendRangePreset; label: string }[] = [
  { value: '7days', label: '7일' },
  { value: '30days', label: '30일' },
  { value: '90days', label: '90일' },
  { value: '1year', label: '1년' }
];

// 비교 탭 기간 프리셋 타입
type ComparePreset = '7days' | '30days' | 'custom';

// 차트 라인 색상
const TREND_COLORS = {
  primary: '#3FB5B3',
  secondary: '#6366F1',
  tertiary: '#EC4899',
  quaternary: '#F59E0B',
};

// 스켈레톤 카드 컴포넌트
function SkeletonCard() {
  return (
    <div className="animate-pulse" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
      <div style={{ height: '16px', backgroundColor: '#e5e5e5', borderRadius: '4px', width: '80px', marginBottom: '8px' }} />
      <div style={{ height: '32px', backgroundColor: '#e5e5e5', borderRadius: '4px', width: '96px' }} />
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  icon: Icon,
  label,
  value,
  unit = '',
  color = '#3FB5B3',
  subValue
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
  subValue?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
        <Icon size={16} color={color} />
        <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', fontWeight: 400, color: '#666666' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '24px', fontWeight: 600, color: '#1a1a1a' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}{unit}
      </div>
      {subValue && (
        <div style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 400, color: color, marginTop: '4px' }}>
          {subValue}
        </div>
      )}
    </motion.div>
  );
}

// 섹션 헤더 컴포넌트
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <h2 style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// 차트 색상 배열
const CHART_COLORS = ['#3FB5B3', '#48B2AF', '#5BC5C3', '#6ED8D6', '#81EBEA', '#94FEFD'];

// 날짜 포맷 함수
function formatDateRange(startDate?: Date, endDate?: Date): string {
  if (!startDate) return '';
  const start = format(startDate, 'yy.MM.dd');
  if (!endDate) return start;
  const end = format(endDate, 'yy.MM.dd');
  return `${start} ~ ${end}`;
}

// 대시보드 탭 타입
type DashboardTab = '개요' | '추세' | '비교';
const DASHBOARD_TABS: DashboardTab[] = ['개요', '추세', '비교'];

export default function StatsDashboard({ onBack, onHome }: StatsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gaStats, setGaStats] = useState<GAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('today');
  const [selectedTab, setSelectedTab] = useState<DashboardTab>('개요');

  // 커스텀 날짜 선택 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [customDateRange, setCustomDateRange] = useState<{ start?: Date; end?: Date }>({});

  // 추세 탭 상태
  const [trendPreset, setTrendPreset] = useState<TrendRangePreset>('7days');
  const [trendData, setTrendData] = useState<DailyTrendData[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [showTrendDatePicker, setShowTrendDatePicker] = useState(false);
  const [trendDateRange, setTrendDateRange] = useState<DateRange | undefined>(undefined);
  const [trendCustomDateRange, setTrendCustomDateRange] = useState<{ start?: Date; end?: Date }>({});

  // 비교 탭 상태
  const [comparePreset, setComparePreset] = useState<ComparePreset>('7days');
  const [currentPeriodStats, setCurrentPeriodStats] = useState<DashboardStats | null>(null);
  const [previousPeriodStats, setPreviousPeriodStats] = useState<DashboardStats | null>(null);
  const [currentGaStats, setCurrentGaStats] = useState<GAStats | null>(null);
  const [previousGaStats, setPreviousGaStats] = useState<GAStats | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [showCompareDatePicker, setShowCompareDatePicker] = useState(false);
  const [compareDateRange, setCompareDateRange] = useState<DateRange | undefined>(undefined);
  const [compareCustomDateRange, setCompareCustomDateRange] = useState<{ start?: Date; end?: Date }>({});
  // A군/B군 커스텀 날짜 선택 (직접 선택용)
  const [compareGroupA, setCompareGroupA] = useState<DateRange | undefined>(undefined);
  const [compareGroupB, setCompareGroupB] = useState<DateRange | undefined>(undefined);
  const [activeCompareGroup, setActiveCompareGroup] = useState<'A' | 'B'>('A');

  // 공통 타이포그래피 스타일
  const typography = {
    title: {
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '17px',
      fontWeight: 600,
      lineHeight: '25.5px',
      letterSpacing: '-0.34px',
      color: '#1a1a1a',
    },
    sectionTitle: {
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: '24px',
      letterSpacing: '-0.32px',
      color: '#1a1a1a',
    },
    label: {
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: '19px',
      letterSpacing: '-0.26px',
      color: '#666666',
    },
    value: {
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: '32px',
      letterSpacing: '-0.48px',
      color: '#1a1a1a',
    },
    button: {
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
      letterSpacing: '-0.28px',
    },
    preset: {
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '-0.28px',
    },
    small: {
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '16px',
      letterSpacing: '-0.24px',
    },
  };

  const loadStats = async (preset: DateRangePreset = selectedPreset, customRange?: DateRangeFilter) => {
    setLoading(true);
    setError(null);
    try {
      let dateRangeFilter: DateRangeFilter;
      if (preset === 'custom' && customRange) {
        dateRangeFilter = customRange;
      } else {
        dateRangeFilter = getDateRangeFromPreset(preset);
      }

      // 대시보드 통계와 GA 통계 병렬 로드
      const [dashboardData, gaRealtimeData, gaPeriodData] = await Promise.all([
        fetchDashboardStats(dateRangeFilter),
        fetchGAStats('realtime'), // 실시간 활성 사용자
        fetchGAStats('period', dateRangeFilter), // 기간별 방문자수
      ]);

      setStats(dashboardData);
      // GA 데이터 병합: 실시간 + 기간별
      setGaStats({
        ...gaRealtimeData,
        activeUsers: gaPeriodData?.activeUsers,
        newUsers: gaPeriodData?.newUsers,
        averageEngagementTime: gaPeriodData?.averageEngagementTime,
      } as GAStats);
    } catch (err) {
      console.error('통계 로드 오류:', err);
      setError('통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // 추세 데이터 로드 함수
  const loadTrendStats = async (preset: TrendRangePreset = trendPreset, customRange?: DateRangeFilter) => {
    setTrendLoading(true);
    setTrendError(null);
    try {
      let dateRangeFilter: DateRangeFilter;
      if (preset === 'custom' && customRange) {
        dateRangeFilter = customRange;
      } else {
        dateRangeFilter = getTrendDateRange(preset);
      }

      const data = await fetchDailyTrendStats(dateRangeFilter);
      setTrendData(data);
    } catch (err) {
      console.error('추세 데이터 로드 오류:', err);
      setTrendError('추세 데이터를 불러오는데 실패했습니다.');
    } finally {
      setTrendLoading(false);
    }
  };

  // 추세 탭 선택 시 데이터 로드
  useEffect(() => {
    if (selectedTab === '추세' && trendData.length === 0 && !trendLoading) {
      loadTrendStats();
    }
  }, [selectedTab]);

  // 추세 기간 변경 핸들러
  const handleTrendPresetChange = (preset: TrendRangePreset) => {
    setTrendPreset(preset);
    setTrendCustomDateRange({});
    loadTrendStats(preset);
  };

  // 추세 달력 클릭 핸들러
  const handleTrendCalendarClick = () => {
    setShowTrendDatePicker(true);
  };

  // 추세 커스텀 날짜 적용 핸들러
  const handleApplyTrendCustomDate = () => {
    if (trendDateRange?.from) {
      const startDate = trendDateRange.from;
      const endDate = trendDateRange.to || trendDateRange.from;

      const endDateNext = new Date(endDate);
      endDateNext.setDate(endDateNext.getDate() + 1);

      const customFilter: DateRangeFilter = {
        startDate: startDate.toISOString(),
        endDate: endDateNext.toISOString()
      };

      setTrendPreset('custom' as TrendRangePreset);
      setTrendCustomDateRange({ start: startDate, end: endDate });
      setShowTrendDatePicker(false);
      loadTrendStats('custom' as TrendRangePreset, customFilter);
    }
  };

  // 추세 기간 표시 라벨
  const getTrendDateLabel = () => {
    if (trendCustomDateRange.start) {
      return formatDateRange(trendCustomDateRange.start, trendCustomDateRange.end);
    }
    return null;
  };

  // 비교 기간 계산 함수
  const getCompareDateRanges = (preset: ComparePreset, customRange?: { start?: Date; end?: Date }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    let days = 7;
    if (preset === '30days') days = 30;
    if (preset === 'custom' && customRange?.start && customRange?.end) {
      const diffTime = Math.abs(customRange.end.getTime() - customRange.start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // 현재 기간: 어제 기준 지난 N일 (오늘 제외)
    const currentEnd = today;
    const currentStart = new Date(yesterday.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    // 이전 기간: 현재 기간 직전 N일
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

    // 커스텀인 경우 직접 계산
    if (preset === 'custom' && customRange?.start && customRange?.end) {
      const customStart = new Date(customRange.start);
      const customEnd = new Date(customRange.end);
      customEnd.setDate(customEnd.getDate() + 1); // lt 연산자용

      const customDays = Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24));
      const prevEnd = customStart;
      const prevStart = new Date(customStart.getTime() - customDays * 24 * 60 * 60 * 1000);

      return {
        current: { startDate: customStart.toISOString(), endDate: customEnd.toISOString() },
        previous: { startDate: prevStart.toISOString(), endDate: prevEnd.toISOString() },
        currentLabel: `${customRange.start.getMonth() + 1}/${customRange.start.getDate()} ~ ${customRange.end.getMonth() + 1}/${customRange.end.getDate()}`,
        previousLabel: `${prevStart.getMonth() + 1}/${prevStart.getDate()} ~ ${new Date(prevEnd.getTime() - 24 * 60 * 60 * 1000).getMonth() + 1}/${new Date(prevEnd.getTime() - 24 * 60 * 60 * 1000).getDate()}`,
      };
    }

    return {
      current: { startDate: currentStart.toISOString(), endDate: currentEnd.toISOString() },
      previous: { startDate: previousStart.toISOString(), endDate: previousEnd.toISOString() },
      currentLabel: `최근 ${days}일`,
      previousLabel: `이전 ${days}일`,
    };
  };

  // 비교 데이터 로드 함수
  const loadCompareStats = async (preset: ComparePreset = comparePreset, customRange?: { start?: Date; end?: Date }) => {
    setCompareLoading(true);
    setCompareError(null);
    try {
      const ranges = getCompareDateRanges(preset, customRange);

      // 현재 기간과 이전 기간 데이터를 병렬로 조회
      const [currentStats, prevStats, currentGa, prevGa] = await Promise.all([
        fetchDashboardStats(ranges.current),
        fetchDashboardStats(ranges.previous),
        fetchGAStats('period', ranges.current),
        fetchGAStats('period', ranges.previous),
      ]);

      setCurrentPeriodStats(currentStats);
      setPreviousPeriodStats(prevStats);
      setCurrentGaStats(currentGa);
      setPreviousGaStats(prevGa);
    } catch (err) {
      console.error('비교 데이터 로드 오류:', err);
      setCompareError('비교 데이터를 불러오는데 실패했습니다.');
    } finally {
      setCompareLoading(false);
    }
  };

  // 비교 탭 선택 시 데이터 로드
  useEffect(() => {
    if (selectedTab === '비교' && !currentPeriodStats && !compareLoading) {
      loadCompareStats();
    }
  }, [selectedTab]);

  // 비교 기간 변경 핸들러
  const handleComparePresetChange = (preset: ComparePreset) => {
    setComparePreset(preset);
    setCompareCustomDateRange({});
    loadCompareStats(preset);
  };

  // 비교 달력 클릭 핸들러
  const handleCompareCalendarClick = () => {
    setActiveCompareGroup('A');
    setShowCompareDatePicker(true);
  };

  // 비교 커스텀 날짜 적용 핸들러 (A/B군 모두 선택 후)
  const handleApplyCompareCustomDate = () => {
    if (compareGroupA?.from && compareGroupB?.from) {
      const groupAStart = compareGroupA.from;
      const groupAEnd = compareGroupA.to || compareGroupA.from;
      const groupBStart = compareGroupB.from;
      const groupBEnd = compareGroupB.to || compareGroupB.from;

      setComparePreset('custom');
      setCompareCustomDateRange({ start: groupAStart, end: groupAEnd });
      setShowCompareDatePicker(false);

      // A군과 B군 날짜를 직접 전달
      loadCompareStatsWithGroups(
        { start: groupAStart, end: groupAEnd },
        { start: groupBStart, end: groupBEnd }
      );
    }
  };

  // A/B군 커스텀 비교 데이터 로드
  const loadCompareStatsWithGroups = async (
    groupA: { start: Date; end: Date },
    groupB: { start: Date; end: Date }
  ) => {
    setCompareLoading(true);
    setCompareError(null);
    try {
      const groupAEndNext = new Date(groupA.end);
      groupAEndNext.setDate(groupAEndNext.getDate() + 1);
      const groupBEndNext = new Date(groupB.end);
      groupBEndNext.setDate(groupBEndNext.getDate() + 1);

      const rangeA = { startDate: groupA.start.toISOString(), endDate: groupAEndNext.toISOString() };
      const rangeB = { startDate: groupB.start.toISOString(), endDate: groupBEndNext.toISOString() };

      const [currentStats, prevStats, currentGa, prevGa] = await Promise.all([
        fetchDashboardStats(rangeA),
        fetchDashboardStats(rangeB),
        fetchGAStats('period', rangeA),
        fetchGAStats('period', rangeB),
      ]);

      setCurrentPeriodStats(currentStats);
      setPreviousPeriodStats(prevStats);
      setCurrentGaStats(currentGa);
      setPreviousGaStats(prevGa);
    } catch (err) {
      console.error('비교 데이터 로드 오류:', err);
      setCompareError('비교 데이터를 불러오는데 실패했습니다.');
    } finally {
      setCompareLoading(false);
    }
  };

  // 비교 기간 표시 라벨
  const getCompareDateLabel = () => {
    if (compareGroupA?.from && compareGroupB?.from) {
      const aLabel = formatDateRange(compareGroupA.from, compareGroupA.to);
      const bLabel = formatDateRange(compareGroupB.from, compareGroupB.to);
      return `A: ${aLabel}`;
    }
    return null;
  };

  // A/B군 라벨 가져오기
  const getCompareGroupLabels = () => {
    if (comparePreset === 'custom' && compareGroupA?.from && compareGroupB?.from) {
      return {
        currentLabel: formatDateRange(compareGroupA.from, compareGroupA.to),
        previousLabel: formatDateRange(compareGroupB.from, compareGroupB.to),
      };
    }
    return getCompareDateRanges(comparePreset, compareCustomDateRange);
  };

  // 증감율 계산 함수
  const calcChangePercent = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    }
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change * 10) / 10), isPositive: change >= 0 };
  };

  // 기간 변경 핸들러
  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    setCustomDateRange({});
    loadStats(preset);
  };

  // 달력 아이콘 클릭 핸들러
  const handleCalendarClick = () => {
    setShowDatePicker(true);
  };

  // 커스텀 날짜 적용 핸들러
  const handleApplyCustomDate = () => {
    if (dateRange?.from) {
      const startDate = dateRange.from;
      const endDate = dateRange.to || dateRange.from;

      // 종료일의 다음날 00:00:00으로 설정 (해당 날짜 포함)
      const endDateNext = new Date(endDate);
      endDateNext.setDate(endDateNext.getDate() + 1);

      const customFilter: DateRangeFilter = {
        startDate: startDate.toISOString(),
        endDate: endDateNext.toISOString()
      };

      setSelectedPreset('custom');
      setCustomDateRange({ start: startDate, end: endDate });
      setShowDatePicker(false);
      loadStats('custom', customFilter);
    }
  };

  // 차트용 데이터 변환
  const chartData = stats?.tagStats.map((tag: TagStat) => ({
    name: tag.sourceType,
    확인율: tag.confirmRate,
    total: tag.total,
    confirmed: tag.confirmed
  })) || [];

  // 기간 표시 라벨
  const getDateLabel = () => {
    if (selectedPreset === 'custom' && customDateRange.start) {
      return formatDateRange(customDateRange.start, customDateRange.end);
    }
    return null;
  };

  return (
    <>
      <SEO
        title="통계 대시보드 - 나다운세"
        description="나다운세 서비스 통계 대시보드"
      />
      {/* 외부 컨테이너: 전체 화면 + 중앙 정렬 */}
      <div className="bg-white fixed inset-0 flex justify-center">
        {/* 내부 컨테이너: 440px 제한 */}
        <div className="w-full max-w-[440px] h-full flex flex-col" style={{ backgroundColor: '#f5f5f5' }}>

          {/* 헤더 - 고정 */}
          <div className="shrink-0 z-20 bg-white relative">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <div className="bg-white h-[52px] relative shrink-0 w-full">
                <div className="flex flex-col justify-center size-full">
                  <div className="box-border content-stretch flex flex-col gap-[10px] h-[52px] items-start justify-center px-[12px] py-[4px] relative w-full">
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div
                        onClick={onBack}
                        className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer group hover:bg-[#F3F3F3] active:bg-[#F3F3F3]"
                      >
                        <svg className="block w-6 h-6 group-active:scale-95 transition-transform" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                          <g id="arrow-left">
                            <path d={svgPathsBack.p2a5cd480} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                            <path d={svgPathsBack.p1a4bb100} opacity="0" stroke="var(--stroke-0, #848484)" />
                          </g>
                        </svg>
                      </div>
                      <p className="basis-0 font-semibold grow leading-[25.5px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]" style={{ fontFamily: 'Pretendard Variable, sans-serif' }}>
                        통계 대시보드
                      </p>
                      <div
                        onClick={onHome}
                        className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer group hover:bg-[#F3F3F3] active:bg-[#F3F3F3]"
                      >
                        <svg className="block w-6 h-6 group-active:scale-95 transition-transform" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                          <g id="home-2">
                            <path d={svgPathsHome.p3d07f180} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            <path d="M12 17.99V14.99" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 필터 - 개요/추세/비교 */}
          <div className="shrink-0 bg-white px-4 py-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-center gap-1">
              {DASHBOARD_TABS.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className="relative px-4 py-2 rounded-xl transition-colors"
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '15px',
                    fontWeight: selectedTab === tab ? 500 : 400,
                    color: selectedTab === tab ? '#151515' : '#999999',
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                >
                  {selectedTab === tab && (
                    <motion.div
                      layoutId="dashboardTabIndicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: '#f8f8f8' }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 메인 콘텐츠 - 스크롤 영역 (HomePage 패턴) */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        {/* ========== 개요 탭 ========== */}
        {selectedTab === '개요' && (
          <>
            {/* 기간 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} color="#666" />
                  <span style={{ ...typography.label }}>조회 기간</span>
                </div>
                <button
                  onClick={handleCalendarClick}
                  className="flex items-center gap-1 rounded-lg transition-colors active:opacity-80"
                  style={{
                    ...typography.small,
                    color: '#3FB5B3',
                    fontWeight: 500,
                    padding: '6px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e7e7e7',
                  }}
                >
                  <Calendar size={14} />
                  직접 선택
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: '8px' }}>
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetChange(preset.value)}
                    className="rounded-full whitespace-nowrap transition-colors"
                    style={{
                      ...typography.preset,
                      padding: '8px 16px',
                      fontWeight: selectedPreset === preset.value ? 500 : 400,
                      backgroundColor: selectedPreset === preset.value ? '#3FB5B3' : '#ffffff',
                      color: selectedPreset === preset.value ? '#ffffff' : '#666666',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                {selectedPreset === 'custom' && (
                  <button
                    className="rounded-full whitespace-nowrap"
                    style={{
                      ...typography.preset,
                      padding: '8px 16px',
                      fontWeight: 500,
                      backgroundColor: '#3FB5B3',
                      color: '#ffffff',
                    }}
                  >
                    {getDateLabel()}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========== 추세 탭 ========== */}
        {selectedTab === '추세' && (
          <>
            {/* 기간 선택 */}
            <div style={{ marginBottom: '20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} color="#666" />
                  <span style={{ ...typography.label }}>조회 기간</span>
                </div>
                <button
                  onClick={handleTrendCalendarClick}
                  className="flex items-center gap-1 rounded-lg transition-colors active:opacity-80"
                  style={{
                    ...typography.small,
                    color: '#3FB5B3',
                    fontWeight: 500,
                    padding: '6px 12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e7e7e7',
                  }}
                >
                  <Calendar size={14} />
                  직접 선택
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: '8px' }}>
                {TREND_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleTrendPresetChange(preset.value)}
                    className="rounded-full whitespace-nowrap transition-colors"
                    style={{
                      ...typography.preset,
                      padding: '8px 16px',
                      fontWeight: trendPreset === preset.value ? 500 : 400,
                      backgroundColor: trendPreset === preset.value ? '#3FB5B3' : '#ffffff',
                      color: trendPreset === preset.value ? '#ffffff' : '#666666',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                {trendCustomDateRange.start && (
                  <button
                    className="rounded-full whitespace-nowrap"
                    style={{
                      ...typography.preset,
                      padding: '8px 16px',
                      fontWeight: 500,
                      backgroundColor: '#3FB5B3',
                      color: '#ffffff',
                    }}
                  >
                    {getTrendDateLabel()}
                  </button>
                )}
              </div>
            </div>

            {/* 에러 상태 */}
            {trendError && (
              <div className="flex flex-col items-center justify-center" style={{ padding: '48px 0' }}>
                <p style={{ ...typography.label, marginBottom: '16px' }}>{trendError}</p>
                <button
                  onClick={() => loadTrendStats()}
                  className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
                  style={{ ...typography.button, padding: '10px 16px', backgroundColor: '#3FB5B3', color: '#ffffff' }}
                >
                  <RefreshCw size={16} />
                  다시 시도
                </button>
              </div>
            )}

            {/* 로딩 상태 */}
            {trendLoading && !trendError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', height: '200px' }} />
                ))}
              </div>
            )}

            {/* 차트 표시 */}
            {!trendLoading && !trendError && trendData.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* GA 전체 고객 통계 섹션 */}
                <SectionHeader icon="📈" title="GA 전체 고객 통계" />

                {/* 1. 총 방문자 (GA) */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>총 방문자</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="gaActiveUsers" name="총 방문자" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 2. GA 신규 방문자 vs 재방문자 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>신규 방문자 vs 재방문자</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData.map(d => ({
                          ...d,
                          gaReturningUsers: d.gaActiveUsers - d.gaNewUsers
                        }))}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                        <Line type="monotone" dataKey="gaNewUsers" name="신규" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="gaReturningUsers" name="재방문" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 3. 평균 참여시간 (GA) */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '8px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>평균 참여시간</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.floor(v / 60)}분`} />
                        <Tooltip
                          formatter={(value: number) => {
                            const minutes = Math.floor(value / 60);
                            const seconds = value % 60;
                            return [`${minutes}분 ${seconds}초`, '참여시간'];
                          }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }}
                        />
                        <Line type="monotone" dataKey="gaAverageEngagementTime" name="참여시간" stroke={TREND_COLORS.quaternary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.quaternary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 회원가입 고객 통계 섹션 */}
                <SectionHeader icon="📊" title="회원가입 고객 통계" />

                {/* 4. 신규 고객 vs 재방문 고객 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>신규 고객 vs 재방문 고객</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                        <Line type="monotone" dataKey="newCustomers" name="신규" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="returningCustomers" name="재방문" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 5. 회원가입율 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>회원가입율</h3>
                    <span style={{ ...typography.small, color: '#999' }}>GA 신규 방문자 대비</span>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '회원가입율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="signupRate" name="회원가입율" stroke={TREND_COLORS.tertiary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.tertiary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 6. 콘텐츠 이용 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>콘텐츠 이용 추이</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                        <Line type="monotone" dataKey="freeContentUsage" name="무료" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="paidContentUsage" name="유료" stroke={TREND_COLORS.tertiary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.tertiary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 7. 콘텐츠 이용율 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>콘텐츠 이용율</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '이용율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="contentUsageRate" name="이용율" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 7. 태그 저장 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>태그 저장 추이</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
                        <Line type="monotone" dataKey="tagSaved" name="저장" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="tagConfirmed" name="확인" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 8. 회원 태그 저장율 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>회원 태그 저장율</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '저장율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="tagUserRate" name="저장율" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 9. 매출 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>매출 추이</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '매출']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="revenue" name="매출" stroke={TREND_COLORS.quaternary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.quaternary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 새로고침 버튼 */}
                <div className="flex justify-center" style={{ paddingTop: '16px', paddingBottom: '40px' }}>
                  <button
                    onClick={() => loadTrendStats()}
                    className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      padding: '10px 16px',
                      backgroundColor: '#ffffff',
                      color: '#3FB5B3',
                      border: '1px solid #3FB5B3',
                    }}
                  >
                    <RefreshCw size={16} />
                    새로고침
                  </button>
                </div>
              </motion.div>
            )}

            {/* 데이터 없음 */}
            {!trendLoading && !trendError && trendData.length === 0 && (
              <div className="flex flex-col items-center justify-center" style={{ padding: '80px 20px' }}>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: '64px', height: '64px', backgroundColor: '#E4F7F7', marginBottom: '16px' }}
                >
                  <Activity size={32} color="#3FB5B3" />
                </div>
                <p style={{ ...typography.label, textAlign: 'center' }}>
                  해당 기간의 데이터가 없습니다
                </p>
              </div>
            )}
          </>
        )}

        {/* ========== 비교 탭 ========== */}
        {selectedTab === '비교' && (
          <div style={{ paddingTop: '16px' }}>
            {/* 비교 기간 필터 */}
            <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                <Calendar size={16} color="#666" />
                <span style={{ ...typography.label }}>비교 기간</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { value: '7days' as ComparePreset, label: '7일' },
                  { value: '30days' as ComparePreset, label: '30일' },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleComparePresetChange(preset.value)}
                    className="rounded-full transition-colors"
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontWeight: comparePreset === preset.value && !compareCustomDateRange.start ? 500 : 400,
                      backgroundColor: comparePreset === preset.value && !compareCustomDateRange.start ? '#3FB5B3' : '#f5f5f5',
                      color: comparePreset === preset.value && !compareCustomDateRange.start ? '#ffffff' : '#666666',
                      border: 'none',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={handleCompareCalendarClick}
                  className="flex items-center gap-1 rounded-full transition-colors"
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: compareCustomDateRange.start ? 500 : 400,
                    backgroundColor: compareCustomDateRange.start ? '#3FB5B3' : '#f5f5f5',
                    color: compareCustomDateRange.start ? '#ffffff' : '#666666',
                    border: 'none',
                  }}
                >
                  <Calendar size={14} />
                  {getCompareDateLabel() || '직접 선택'}
                </button>
              </div>
            </section>

            {/* 커스텀 날짜 선택 팝업 (A군/B군) */}
            {showCompareDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => setShowCompareDatePicker(false)}
              >
                <div
                  className="rounded-2xl"
                  style={{ backgroundColor: '#ffffff', padding: '20px', maxWidth: '340px', width: '90%' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 style={{ ...typography.sectionTitle, marginBottom: '16px' }}>비교 기간 직접 선택</h4>

                  {/* A/B 그룹 탭 */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveCompareGroup('A')}
                      className="flex-1 rounded-xl transition-colors"
                      style={{
                        padding: '10px',
                        fontSize: '14px',
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: activeCompareGroup === 'A' ? 600 : 400,
                        backgroundColor: activeCompareGroup === 'A' ? '#3FB5B3' : '#f5f5f5',
                        color: activeCompareGroup === 'A' ? '#ffffff' : '#666666',
                        border: 'none',
                      }}
                    >
                      A군 {compareGroupA?.from ? '✓' : ''}
                    </button>
                    <button
                      onClick={() => setActiveCompareGroup('B')}
                      className="flex-1 rounded-xl transition-colors"
                      style={{
                        padding: '10px',
                        fontSize: '14px',
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: activeCompareGroup === 'B' ? 600 : 400,
                        backgroundColor: activeCompareGroup === 'B' ? '#6366F1' : '#f5f5f5',
                        color: activeCompareGroup === 'B' ? '#ffffff' : '#666666',
                        border: 'none',
                      }}
                    >
                      B군 {compareGroupB?.from ? '✓' : ''}
                    </button>
                  </div>

                  {/* 선택된 기간 표시 */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg" style={{ padding: '8px 12px', backgroundColor: '#F0FDFA', border: activeCompareGroup === 'A' ? '2px solid #3FB5B3' : '1px solid #e5e5e5' }}>
                      <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>A군</p>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                        {compareGroupA?.from ? formatDateRange(compareGroupA.from, compareGroupA.to) : '선택 안됨'}
                      </p>
                    </div>
                    <div className="rounded-lg" style={{ padding: '8px 12px', backgroundColor: '#EEF2FF', border: activeCompareGroup === 'B' ? '2px solid #6366F1' : '1px solid #e5e5e5' }}>
                      <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>B군</p>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                        {compareGroupB?.from ? formatDateRange(compareGroupB.from, compareGroupB.to) : '선택 안됨'}
                      </p>
                    </div>
                  </div>

                  {/* 달력 */}
                  <DayPicker
                    mode="range"
                    selected={activeCompareGroup === 'A' ? compareGroupA : compareGroupB}
                    onSelect={activeCompareGroup === 'A' ? setCompareGroupA : setCompareGroupB}
                    locale={ko}
                    disabled={{ after: new Date(new Date().setDate(new Date().getDate() - 1)) }}
                    modifiersStyles={{
                      selected: { backgroundColor: activeCompareGroup === 'A' ? '#3FB5B3' : '#6366F1', color: '#ffffff' },
                      range_middle: { backgroundColor: activeCompareGroup === 'A' ? '#E4F7F7' : '#EEF2FF', color: '#1a1a1a' },
                    }}
                  />

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setShowCompareDatePicker(false);
                        setCompareGroupA(undefined);
                        setCompareGroupB(undefined);
                      }}
                      className="flex-1 rounded-xl"
                      style={{
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        color: '#666666',
                        border: 'none',
                        fontSize: '14px',
                        fontFamily: 'Pretendard Variable, sans-serif',
                      }}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleApplyCompareCustomDate}
                      disabled={!compareGroupA?.from || !compareGroupB?.from}
                      className="flex-1 rounded-xl"
                      style={{
                        padding: '10px',
                        backgroundColor: compareGroupA?.from && compareGroupB?.from ? '#3FB5B3' : '#ccc',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '14px',
                        fontFamily: 'Pretendard Variable, sans-serif',
                        cursor: compareGroupA?.from && compareGroupB?.from ? 'pointer' : 'not-allowed',
                      }}
                    >
                      비교하기
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 로딩 상태 */}
            {compareLoading && (
              <div className="flex flex-col items-center justify-center" style={{ padding: '80px 20px' }}>
                <div className="animate-spin rounded-full" style={{ width: '32px', height: '32px', border: '3px solid #E4F7F7', borderTopColor: '#3FB5B3' }} />
                <p style={{ ...typography.label, marginTop: '16px' }}>비교 데이터 로딩 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {compareError && !compareLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center"
                style={{ padding: '48px 0' }}
              >
                <p style={{ ...typography.label, marginBottom: '16px' }}>{compareError}</p>
                <button
                  onClick={() => loadCompareStats()}
                  className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
                  style={{ ...typography.button, padding: '10px 16px', backgroundColor: '#3FB5B3', color: '#ffffff' }}
                >
                  <RefreshCw size={16} />
                  다시 시도
                </button>
              </motion.div>
            )}

            {/* 비교 데이터 표시 */}
            {!compareLoading && !compareError && currentPeriodStats && previousPeriodStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* 기간 라벨 헤더 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl" style={{ backgroundColor: '#3FB5B3', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', fontFamily: 'Pretendard Variable', fontWeight: 400, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>A군</p>
                    <p style={{ fontSize: '13px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: '#ffffff' }}>
                      {getCompareGroupLabels().currentLabel}
                    </p>
                  </div>
                  <div className="rounded-xl" style={{ backgroundColor: '#6366F1', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', fontFamily: 'Pretendard Variable', fontWeight: 400, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>B군</p>
                    <p style={{ fontSize: '13px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: '#ffffff' }}>
                      {getCompareGroupLabels().previousLabel}
                    </p>
                  </div>
                </div>

                {/* GA 방문자 통계 비교 */}
                {currentGaStats && previousGaStats && (
                  <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, marginBottom: '16px' }}>📈 GA 방문자 통계</h3>
                    {[
                      { label: '총 방문자수', current: currentGaStats.activeUsers || 0, previous: previousGaStats.activeUsers || 0, unit: '명' },
                      { label: '신규 방문자', current: currentGaStats.newUsers || 0, previous: previousGaStats.newUsers || 0, unit: '명' },
                      { label: '재방문자', current: (currentGaStats.activeUsers || 0) - (currentGaStats.newUsers || 0), previous: (previousGaStats.activeUsers || 0) - (previousGaStats.newUsers || 0), unit: '명' },
                      { label: '재방문율', current: currentGaStats.activeUsers ? Math.round(((currentGaStats.activeUsers - currentGaStats.newUsers) / currentGaStats.activeUsers) * 1000) / 10 : 0, previous: previousGaStats.activeUsers ? Math.round(((previousGaStats.activeUsers - previousGaStats.newUsers) / previousGaStats.activeUsers) * 1000) / 10 : 0, unit: '%' },
                      { label: '평균 참여시간', current: currentGaStats.averageEngagementTime || 0, previous: previousGaStats.averageEngagementTime || 0, unit: '초', formatFn: (v: number) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` },
                    ].map((item, idx, arr) => {
                      const change = calcChangePercent(item.current, item.previous);
                      const displayValue = item.formatFn || ((v: number) => v.toLocaleString() + item.unit);
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-3" style={{ marginBottom: idx < arr.length - 1 ? '12px' : 0 }}>
                          <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                              {item.formatFn ? item.formatFn(item.current) : `${item.current.toLocaleString()}${item.unit}`}
                            </p>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                              {change.isPositive ? '▲' : '▼'} {change.value}%
                            </p>
                          </div>
                          <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                              {item.formatFn ? item.formatFn(item.previous) : `${item.previous.toLocaleString()}${item.unit}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}

                {/* 회원가입 고객 통계 비교 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <h3 style={{ ...typography.sectionTitle, marginBottom: '16px' }}>📊 회원가입 고객 통계</h3>
                  {[
                    { label: '총 가입 고객', current: currentPeriodStats.totalCustomers, previous: previousPeriodStats.totalCustomers, unit: '명' },
                    { label: '신규 고객', current: currentPeriodStats.newCustomers, previous: previousPeriodStats.newCustomers, unit: '명' },
                    { label: '재방문 고객', current: currentPeriodStats.returningCustomers, previous: previousPeriodStats.returningCustomers, unit: '명' },
                    { label: '재방문율', current: currentPeriodStats.returnRate, previous: previousPeriodStats.returnRate, unit: '%' },
                    { label: '회원가입율', current: currentGaStats?.newUsers ? Math.round(currentPeriodStats.newCustomers / currentGaStats.newUsers * 1000) / 10 : 0, previous: previousGaStats?.newUsers ? Math.round(previousPeriodStats.newCustomers / previousGaStats.newUsers * 1000) / 10 : 0, unit: '%' },
                    { label: '총 방문횟수', current: currentPeriodStats.totalVisits, previous: previousPeriodStats.totalVisits, unit: '회' },
                    { label: '콘텐츠 이용율', current: currentPeriodStats.contentUsageRate, previous: previousPeriodStats.contentUsageRate, unit: '%' },
                    { label: '무료 이용', current: currentPeriodStats.freeContentUsage, previous: previousPeriodStats.freeContentUsage, unit: '건' },
                    { label: '유료 이용', current: currentPeriodStats.paidContentUsage, previous: previousPeriodStats.paidContentUsage, unit: '건' },
                  ].map((item, idx, arr) => {
                    const change = calcChangePercent(item.current, item.previous);
                    return (
                      <div key={idx} className="grid grid-cols-2 gap-3" style={{ marginBottom: idx < arr.length - 1 ? '12px' : 0 }}>
                        <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                            {item.current.toLocaleString()}{item.unit}
                          </p>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                            {change.isPositive ? '▲' : '▼'} {change.value}%
                          </p>
                        </div>
                        <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                            {item.previous.toLocaleString()}{item.unit}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </section>

                {/* 태그 통계 비교 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <h3 style={{ ...typography.sectionTitle, marginBottom: '16px' }}>🏷️ 태그 통계</h3>
                  {[
                    { label: '태그 저장율', current: currentPeriodStats.tagUserRate, previous: previousPeriodStats.tagUserRate, unit: '%' },
                    { label: '전체 확인율', current: currentPeriodStats.overallTagConfirmRate, previous: previousPeriodStats.overallTagConfirmRate, unit: '%' },
                  ].map((item, idx) => {
                    const change = calcChangePercent(item.current, item.previous);
                    return (
                      <div key={idx} className="grid grid-cols-2 gap-3" style={{ marginBottom: idx < 1 ? '12px' : 0 }}>
                        <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                            {item.current.toLocaleString()}{item.unit}
                          </p>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                            {change.isPositive ? '▲' : '▼'} {change.value}%
                          </p>
                        </div>
                        <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                            {item.previous.toLocaleString()}{item.unit}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </section>

                {/* 매출 통계 비교 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <h3 style={{ ...typography.sectionTitle, marginBottom: '16px' }}>💰 매출 통계</h3>
                  {(() => {
                    const change = calcChangePercent(currentPeriodStats.totalRevenue, previousPeriodStats.totalRevenue);
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>기간 매출</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                            ₩{currentPeriodStats.totalRevenue.toLocaleString()}
                          </p>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                            {change.isPositive ? '▲' : '▼'} {change.value}%
                          </p>
                        </div>
                        <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>기간 매출</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                            ₩{previousPeriodStats.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </section>
              </motion.div>
            )}
          </div>
        )}

        {/* ========== 개요 탭 콘텐츠 계속 ========== */}
        {selectedTab === '개요' && (
          <>
        {/* 에러 상태 */}
        {error && (
          <div className="flex flex-col items-center justify-center" style={{ padding: '48px 0' }}>
            <p style={{ ...typography.label, marginBottom: '16px' }}>
              {error}
            </p>
            <button
              onClick={() => loadStats()}
              className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
              style={{
                ...typography.button,
                padding: '10px 16px',
                backgroundColor: '#3FB5B3',
                color: '#ffffff',
              }}
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div className="animate-pulse" style={{ height: '24px', backgroundColor: '#e5e5e5', borderRadius: '8px', width: '100px', marginBottom: '12px' }} />
              <div className="grid grid-cols-2 gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
            <div>
              <div className="animate-pulse" style={{ height: '24px', backgroundColor: '#e5e5e5', borderRadius: '8px', width: '100px', marginBottom: '12px' }} />
              <div className="animate-pulse" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', height: '256px' }} />
            </div>
            <div>
              <div className="animate-pulse" style={{ height: '24px', backgroundColor: '#e5e5e5', borderRadius: '8px', width: '100px', marginBottom: '12px' }} />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* 데이터 표시 */}
        {!loading && !error && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* GA 전체 고객 통계 섹션 */}
            {gaStats?.activeUsers !== undefined && (
              <section>
                <SectionHeader icon="📈" title="GA 전체 고객 통계" />
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={Users}
                    label="총 방문자수"
                    value={gaStats.activeUsers}
                    unit="명"
                    color="#6366F1"
                    subValue="GA 활성 사용자"
                  />
                  {gaStats.newUsers !== undefined && (
                    <>
                      <StatCard
                        icon={UserPlus}
                        label="신규 방문자"
                        value={gaStats.newUsers}
                        unit="명"
                        color="#8B5CF6"
                        subValue="GA 신규 사용자"
                      />
                      <StatCard
                        icon={UserCheck}
                        label="재방문자"
                        value={gaStats.activeUsers - gaStats.newUsers}
                        unit="명"
                        color="#368683"
                        subValue={`재방문율 ${gaStats.activeUsers > 0 ? Math.round((gaStats.activeUsers - gaStats.newUsers) / gaStats.activeUsers * 1000) / 10 : 0}%`}
                      />
                      {gaStats.averageEngagementTime !== undefined && (
                        <StatCard
                          icon={Clock}
                          label="평균 참여 시간"
                          value={`${Math.floor(gaStats.averageEngagementTime / 60)}:${String(gaStats.averageEngagementTime % 60).padStart(2, '0')}`}
                          color="#EC4899"
                          subValue="사용자당 평균"
                        />
                      )}
                    </>
                  )}
                </div>
              </section>
            )}

            {/* 회원가입 고객 통계 섹션 */}
            <section>
              <SectionHeader icon="📊" title="회원가입 고객 통계" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Users}
                  label="총 가입 고객"
                  value={stats.totalCustomers}
                  unit="명"
                />
                <StatCard
                  icon={UserPlus}
                  label="신규 고객"
                  value={stats.newCustomers}
                  unit="명"
                  color="#48B2AF"
                />
                <StatCard
                  icon={UserCheck}
                  label="재방문 고객"
                  value={stats.returningCustomers}
                  unit="명"
                  color="#368683"
                  subValue={`재방문율 ${stats.returnRate}%`}
                />
                {gaStats?.newUsers && gaStats.newUsers > 0 && (
                  <StatCard
                    icon={UserPlus}
                    label="회원가입율"
                    value={Math.round(stats.newCustomers / gaStats.newUsers * 1000) / 10}
                    unit="%"
                    color="#6366F1"
                    subValue={`GA 신규 방문자 대비 가입`}
                  />
                )}
                <StatCard
                  icon={Eye}
                  label="총 방문횟수"
                  value={stats.totalVisits}
                  unit="회"
                />
                <StatCard
                  icon={Activity}
                  label="콘텐츠 이용율"
                  value={stats.contentUsageRate}
                  unit="%"
                  color="#6366F1"
                  subValue="무료/유료 1개 이상 이용"
                />
                <StatCard
                  icon={Gift}
                  label="무료 이용"
                  value={stats.freeContentUsage}
                  unit="건"
                  color="#48B2AF"
                  subValue={`이용율 ${stats.freeContentUserRate}%`}
                />
                <StatCard
                  icon={CreditCard}
                  label="유료 이용"
                  value={stats.paidContentUsage}
                  unit="건"
                  color="#368683"
                  subValue={`이용율 ${stats.paidContentUserRate}%`}
                />
              </div>
            </section>

            {/* 태그 통계 섹션 */}
            <section>
              <SectionHeader icon="🏷️" title="태그 통계" />
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 400, color: '#666666' }}>
                    회원 태그 저장율
                  </span>
                  <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '20px', fontWeight: 600, color: '#6366F1' }}>
                    {stats.tagUserRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 400, color: '#666666' }}>
                    전체 확인율
                  </span>
                  <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '20px', fontWeight: 600, color: '#3FB5B3' }}>
                    {stats.overallTagConfirmRate}%
                  </span>
                </div>

                {/* 바 차트 */}
                {chartData.length > 0 ? (
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number, _name: string, props: { payload: { total: number; confirmed: number } }) => [
                            `${value}% (${props.payload.confirmed}/${props.payload.total})`,
                            '확인율'
                          ]}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e5e5e5',
                            fontFamily: 'Pretendard Variable'
                          }}
                        />
                        <Bar dataKey="확인율" radius={[0, 4, 4, 0]}>
                          {chartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center" style={{ height: '128px' }}>
                    <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', color: '#999999' }}>
                      태그 데이터가 없습니다
                    </p>
                  </div>
                )}

                {/* 태그 상세 목록 */}
                {chartData.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stats.tagStats.map((tag, index) => (
                        <div key={tag.sourceType} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="rounded-full"
                              style={{ width: '12px', height: '12px', backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', color: '#333333' }}>
                              {tag.sourceType}
                            </span>
                          </div>
                          <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', color: '#666666' }}>
                            {tag.confirmed}/{tag.total} ({tag.confirmRate}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 매출 통계 섹션 */}
            <section>
              <SectionHeader icon="💰" title="매출 통계" />
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{ width: '48px', height: '48px', backgroundColor: '#E4F7F7' }}
                  >
                    <DollarSign size={24} color="#3FB5B3" />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', color: '#666666' }}>
                      {selectedPreset === '1year' ? '연간 매출' : '기간 매출'}
                    </p>
                    <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '24px', fontWeight: 600, color: '#1a1a1a' }}>
                      ₩{stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 새로고침 버튼 */}
            <div className="flex justify-center" style={{ paddingTop: '16px', paddingBottom: '40px' }}>
              <button
                onClick={() => loadStats()}
                className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px 16px',
                  backgroundColor: '#ffffff',
                  color: '#3FB5B3',
                  border: '1px solid #3FB5B3',
                }}
              >
                <RefreshCw size={16} />
                새로고침
              </button>
            </div>
          </motion.div>
        )}
          </>
        )}{/* 개요 탭 닫기 */}
          </div>{/* 스크롤 영역 닫기 */}

        </div>{/* 내부 컨테이너 닫기 */}
      </div>{/* 외부 컨테이너 닫기 */}

      {/* 날짜 선택 모달 */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={() => setShowDatePicker(false)}
            />

            {/* 바텀시트 - 440px 중앙 정렬 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white z-50 overflow-hidden"
              style={{ borderRadius: '24px 24px 0 0', maxHeight: '85vh' }}
            >
              {/* 핸들 */}
              <div className="flex justify-center" style={{ paddingTop: '12px', paddingBottom: '8px' }}>
                <div style={{ width: '40px', height: '4px', backgroundColor: '#d4d4d4', borderRadius: '2px' }} />
              </div>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-4" style={{ paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <h3 style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '17px', fontWeight: 600, color: '#1a1a1a' }}>
                  기간 선택
                </h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="p-2 rounded-full transition-colors active:bg-gray-100"
                >
                  <X size={20} color="#666" />
                </button>
              </div>

              {/* 선택된 날짜 표시 */}
              <div className="px-4 py-3" style={{ backgroundColor: '#f9f9f9' }}>
                <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', color: '#666666', marginBottom: '4px' }}>
                  선택된 기간
                </p>
                <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 500, color: '#1a1a1a' }}>
                  {dateRange?.from
                    ? formatDateRange(dateRange.from, dateRange.to)
                    : '날짜를 선택하세요'
                  }
                </p>
              </div>

              {/* 달력 */}
              <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 220px)' }}>
                <style>{`
                  .stats-datepicker .rdp {
                    --rdp-cell-size: 40px;
                    --rdp-accent-color: #3FB5B3;
                    --rdp-background-color: #E4F7F7;
                    font-family: 'Pretendard Variable', sans-serif;
                    margin: 0;
                  }
                  .stats-datepicker .rdp-month {
                    width: 100%;
                  }
                  .stats-datepicker .rdp-table {
                    width: 100%;
                    max-width: none;
                  }
                  .stats-datepicker .rdp-head_cell {
                    font-size: 14px;
                    font-weight: 400;
                    color: #999999;
                  }
                  .stats-datepicker .rdp-cell {
                    font-size: 14px;
                  }
                  .stats-datepicker .rdp-day_today:not(.rdp-day_selected) {
                    color: #3FB5B3;
                    font-weight: 600;
                  }
                  .stats-datepicker .rdp-day_outside {
                    color: #d4d4d4;
                  }
                  .stats-datepicker .rdp-day_disabled {
                    color: #d4d4d4;
                  }
                  .stats-datepicker .rdp-nav_button {
                    width: 32px;
                    height: 32px;
                  }
                  .stats-datepicker .rdp-caption_label {
                    font-size: 16px;
                    font-weight: 500;
                  }
                `}</style>
                <div className="stats-datepicker">
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={ko}
                    disabled={{ after: new Date() }}
                    showOutsideDays
                    fixedWeeks
                    components={{
                      IconLeft: () => <ChevronLeft size={20} />,
                      IconRight: () => <ChevronRight size={20} />
                    }}
                  />
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="px-4 bg-white" style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDateRange(undefined);
                      setShowDatePicker(false);
                    }}
                    className="flex-1 rounded-xl transition-colors active:opacity-80"
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#666666',
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      border: 'none',
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleApplyCustomDate}
                    disabled={!dateRange?.from}
                    className="flex-1 rounded-xl transition-colors active:opacity-80"
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      padding: '12px',
                      backgroundColor: dateRange?.from ? '#3FB5B3' : '#e5e5e5',
                      color: dateRange?.from ? '#ffffff' : '#b7b7b7',
                      border: 'none',
                      cursor: dateRange?.from ? 'pointer' : 'not-allowed',
                    }}
                  >
                    적용하기
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* 추세 탭 날짜 선택 모달 */}
        {showTrendDatePicker && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
              onClick={() => setShowTrendDatePicker(false)}
            />

            {/* 바텀시트 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white z-50 overflow-hidden"
              style={{ borderRadius: '24px 24px 0 0', maxHeight: '85vh' }}
            >
              {/* 핸들 */}
              <div className="flex justify-center" style={{ paddingTop: '12px', paddingBottom: '8px' }}>
                <div style={{ width: '40px', height: '4px', backgroundColor: '#d4d4d4', borderRadius: '2px' }} />
              </div>

              {/* 헤더 */}
              <div className="flex items-center justify-between px-4" style={{ paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <h3 style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '17px', fontWeight: 600, color: '#1a1a1a' }}>
                  기간 선택
                </h3>
                <button
                  onClick={() => setShowTrendDatePicker(false)}
                  className="p-2 rounded-full transition-colors active:bg-gray-100"
                >
                  <X size={20} color="#666" />
                </button>
              </div>

              {/* 선택된 날짜 표시 */}
              <div className="px-4 py-3" style={{ backgroundColor: '#f9f9f9' }}>
                <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', color: '#666666', marginBottom: '4px' }}>
                  선택된 기간
                </p>
                <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 500, color: '#1a1a1a' }}>
                  {trendDateRange?.from
                    ? formatDateRange(trendDateRange.from, trendDateRange.to)
                    : '날짜를 선택하세요'
                  }
                </p>
              </div>

              {/* 달력 */}
              <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 220px)' }}>
                <div className="stats-datepicker">
                  <DayPicker
                    mode="range"
                    selected={trendDateRange}
                    onSelect={setTrendDateRange}
                    locale={ko}
                    disabled={{ after: new Date() }}
                    showOutsideDays
                    fixedWeeks
                    components={{
                      IconLeft: () => <ChevronLeft size={20} />,
                      IconRight: () => <ChevronRight size={20} />
                    }}
                  />
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="px-4 bg-white" style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setTrendDateRange(undefined);
                      setShowTrendDatePicker(false);
                    }}
                    className="flex-1 rounded-xl transition-colors active:opacity-80"
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#666666',
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      border: 'none',
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleApplyTrendCustomDate}
                    disabled={!trendDateRange?.from}
                    className="flex-1 rounded-xl transition-colors active:opacity-80"
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '15px',
                      fontWeight: 500,
                      padding: '12px',
                      backgroundColor: trendDateRange?.from ? '#3FB5B3' : '#e5e5e5',
                      color: trendDateRange?.from ? '#ffffff' : '#b7b7b7',
                      border: 'none',
                      cursor: trendDateRange?.from ? 'pointer' : 'not-allowed',
                    }}
                  >
                    적용하기
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
