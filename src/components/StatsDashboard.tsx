/**
 * 통계 대시보드 컴포넌트
 * Master 계정 전용 - 고객/태그/매출 통계 표시
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, UserCheck, Eye, Gift, CreditCard, DollarSign, RefreshCw, Calendar, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Activity, Clock, Copy, ExternalLink, BarChart3, Trophy, ShoppingCart, TrendingUp } from 'lucide-react';
import svgPathsBack from "../imports/svg-ct14exwyb3";
import svgPathsHome from "../imports/svg-sg7rn8f2dm";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, CartesianGrid, PieChart, Pie, ScatterChart, Scatter, ZAxis } from 'recharts';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { fetchDashboardStats, fetchGAStats, getDateRangeFromPreset, DashboardStats, GAStats, TagStat, DateRangePreset, DateRangeFilter, TrendRangePreset, DailyTrendData, fetchDailyTrendStats, getTrendDateRange, ContentTypeFilter, ContentPeriodFilter, CategoryViewStats, ContentViewStats, fetchCategoryViewRanking, fetchTopContentsByCategory, ReportFunnelData, ReportTrendData, fetchReportFunnelStats, fetchReportFunnelByCount, fetchReportTrendStats, CustomerStatsData, fetchCustomerStats, PurchaseStatsData, fetchPurchaseStats, PurchasePeriodFilter, PurchaseFunnelData, fetchPurchaseFunnelStats } from '../lib/statsService';
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

// 보고서 탭 기간 프리셋 옵션 (7일 제외 - 주별 집계)
const REPORT_TREND_PRESETS: { value: TrendRangePreset; label: string }[] = [
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
type DashboardTab = '개요' | '추세' | '비교' | '콘텐츠' | '보고서' | '구매' | '고객';
const DASHBOARD_TABS: DashboardTab[] = ['개요', '추세', '비교', '콘텐츠', '보고서', '구매', '고객'];

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

  // 콘텐츠 탭 상태
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [categoryRanking, setCategoryRanking] = useState<CategoryViewStats[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [topContents, setTopContents] = useState<Record<string, ContentViewStats[]>>({});
  const [topContentsLoading, setTopContentsLoading] = useState<string | null>(null);
  const [contentPeriod, setContentPeriod] = useState<ContentPeriodFilter>('all');

  // 보고서 탭 상태
  const [reportFunnel, setReportFunnel] = useState<ReportFunnelData | null>(null);
  const [reportTrendData, setReportTrendData] = useState<ReportTrendData[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportTrendPreset, setReportTrendPreset] = useState<TrendRangePreset>('30days');

  // 보고서 횟수별 퍼널 상태
  const [reportCountFilter, setReportCountFilter] = useState<number | 'custom'>(1);
  const [customReportCountInput, setCustomReportCountInput] = useState('');
  const [reportCountFunnel, setReportCountFunnel] = useState<ReportFunnelData | null>(null);
  const [reportCountFunnelLoading, setReportCountFunnelLoading] = useState(false);

  // 개요 탭 구매 통계 (기간 필터 적용)
  const [overviewPurchaseStats, setOverviewPurchaseStats] = useState<PurchaseStatsData | null>(null);
  const [overviewPurchaseLoading, setOverviewPurchaseLoading] = useState(false);

  // 구매 탭 상태 (전체 기간, 필터 없음)
  const [purchaseStats, setPurchaseStats] = useState<PurchaseStatsData | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // 구매 탭 퍼널 상태
  const [purchasePeriod, setPurchasePeriod] = useState<PurchasePeriodFilter>('all');
  const [purchaseFunnel, setPurchaseFunnel] = useState<PurchaseFunnelData | null>(null);
  const [purchaseFunnelLoading, setPurchaseFunnelLoading] = useState(false);

  // 추세 탭 구매 통계 (추세 기간 필터 적용)
  const [trendPurchaseStats, setTrendPurchaseStats] = useState<PurchaseStatsData | null>(null);
  const [trendPurchaseLoading, setTrendPurchaseLoading] = useState(false);

  // 고객 탭 상태
  const [customerStats, setCustomerStats] = useState<CustomerStatsData | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);

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
        freeResultPageViews: gaPeriodData?.freeResultPageViews,
        freeResultPageViewsPerUser: gaPeriodData?.freeResultPageViewsPerUser,
      } as GAStats);
      // 개요 탭 구매 통계: 기간 필터 적용
      loadOverviewPurchaseData(dateRangeFilter);
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
    setTrendPurchaseLoading(true);
    try {
      let dateRangeFilter: DateRangeFilter;
      if (preset === 'custom' && customRange) {
        dateRangeFilter = customRange;
      } else {
        dateRangeFilter = getTrendDateRange(preset);
      }

      const [data, purchaseData] = await Promise.all([
        fetchDailyTrendStats(dateRangeFilter, preset),
        fetchPurchaseStats(dateRangeFilter),
      ]);
      setTrendData(data);
      setTrendPurchaseStats(purchaseData);
    } catch (err) {
      console.error('추세 데이터 로드 오류:', err);
      setTrendError('추세 데이터를 불러오는데 실패했습니다.');
    } finally {
      setTrendLoading(false);
      setTrendPurchaseLoading(false);
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

  // 콘텐츠 탭 선택 시 데이터 로드
  useEffect(() => {
    if (selectedTab === '콘텐츠' && categoryRanking.length === 0 && !contentLoading) {
      loadContentRanking();
    }
  }, [selectedTab]);

  // 콘텐츠 타입 필터 변경 시 데이터 리로드
  useEffect(() => {
    if (selectedTab === '콘텐츠') {
      loadContentRanking();
    }
  }, [contentTypeFilter]);

  // 콘텐츠 랭킹 데이터 로드
  const loadContentRanking = async (period?: ContentPeriodFilter) => {
    setContentLoading(true);
    setContentError(null);
    setExpandedCategory(null);
    setTopContents({});
    try {
      const p = period ?? contentPeriod;
      const data = await fetchCategoryViewRanking(contentTypeFilter, p);
      setCategoryRanking(data);
    } catch (err) {
      setContentError('콘텐츠 랭킹을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  };

  // 콘텐츠 탭 기간 필터 변경
  const handleContentPeriodChange = (period: ContentPeriodFilter) => {
    setContentPeriod(period);
    loadContentRanking(period);
  };

  // 카테고리 확장/축소 + Top5 로드
  const handleCategoryToggle = async (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      return;
    }
    setExpandedCategory(category);
    // 이미 로드된 경우 스킵
    const cacheKey = `${category}_${contentTypeFilter}_${contentPeriod}`;
    if (topContents[cacheKey]) return;
    setTopContentsLoading(category);
    try {
      const data = await fetchTopContentsByCategory(category, contentTypeFilter, 5, contentPeriod);
      setTopContents(prev => ({ ...prev, [cacheKey]: data }));
    } catch (err) {
      console.error('Top 콘텐츠 로드 실패:', err);
    } finally {
      setTopContentsLoading(null);
    }
  };

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

  // 보고서 데이터 로드 함수
  const loadReportData = async (preset: TrendRangePreset = reportTrendPreset) => {
    setReportLoading(true);
    setReportError(null);
    try {
      const dateRangeFilter = getTrendDateRange(preset);
      const [funnel, trend] = await Promise.all([
        fetchReportFunnelStats(),
        fetchReportTrendStats(dateRangeFilter, preset),
      ]);
      setReportFunnel(funnel);
      setReportTrendData(trend);
    } catch (err) {
      console.error('보고서 데이터 로드 오류:', err);
      setReportError('보고서 데이터를 불러오는데 실패했습니다.');
    } finally {
      setReportLoading(false);
    }
  };

  const loadReportCountFunnel = async (count: number) => {
    setReportCountFunnelLoading(true);
    try {
      const data = await fetchReportFunnelByCount(count);
      setReportCountFunnel(data);
    } catch (err) {
      console.error('보고서 횟수별 퍼널 로드 오류:', err);
    } finally {
      setReportCountFunnelLoading(false);
    }
  };

  // 보고서 탭 선택 시 데이터 로드
  useEffect(() => {
    if (selectedTab === '보고서' && !reportFunnel && !reportLoading) {
      loadReportData();
    }
    if (selectedTab === '보고서' && !reportCountFunnel && !reportCountFunnelLoading) {
      loadReportCountFunnel(1);
    }
  }, [selectedTab]);

  // 횟수별 퍼널 필터 변경 핸들러
  const handleReportCountFilterChange = (count: number | 'custom') => {
    setReportCountFilter(count);
    if (count !== 'custom') {
      loadReportCountFunnel(count);
    }
  };

  // 보고서 기간 변경 핸들러
  const handleReportTrendPresetChange = (preset: TrendRangePreset) => {
    setReportTrendPreset(preset);
    loadReportData(preset);
  };

  // 개요 탭 구매 데이터 로드 함수 (기간 필터 적용)
  const loadOverviewPurchaseData = async (dateRange: DateRangeFilter) => {
    setOverviewPurchaseLoading(true);
    try {
      const data = await fetchPurchaseStats(dateRange);
      setOverviewPurchaseStats(data);
    } catch (err) {
      console.error('개요 구매 통계 로드 오류:', err);
    } finally {
      setOverviewPurchaseLoading(false);
    }
  };

  // 구매 탭 데이터 로드 함수 (전체 기간)
  const loadPurchaseData = async () => {
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      const data = await fetchPurchaseStats();
      setPurchaseStats(data);
    } catch (err) {
      console.error('구매 데이터 로드 오류:', err);
      setPurchaseError('구매 데이터를 불러오는데 실패했습니다.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // 구매 퍼널 데이터 로드 함수
  const loadPurchaseFunnel = async (period?: PurchasePeriodFilter) => {
    setPurchaseFunnelLoading(true);
    try {
      const data = await fetchPurchaseFunnelStats(period ?? purchasePeriod);
      setPurchaseFunnel(data);
    } catch (err) {
      console.error('구매 퍼널 로드 오류:', err);
    } finally {
      setPurchaseFunnelLoading(false);
    }
  };

  // 구매 퍼널 기간 변경 핸들러
  const handlePurchasePeriodChange = (period: PurchasePeriodFilter) => {
    setPurchasePeriod(period);
    loadPurchaseFunnel(period);
  };

  // 구매 탭 선택 시 데이터 로드 (전체 기간)
  useEffect(() => {
    if (selectedTab === '구매' && !purchaseStats && !purchaseLoading) {
      loadPurchaseData();
    }
    if (selectedTab === '구매' && !purchaseFunnel && !purchaseFunnelLoading) {
      loadPurchaseFunnel();
    }
  }, [selectedTab]);

  // 고객 데이터 로드 함수
  const loadCustomerData = async () => {
    setCustomerLoading(true);
    setCustomerError(null);
    try {
      const data = await fetchCustomerStats();
      setCustomerStats(data);
    } catch (err) {
      console.error('고객 데이터 로드 오류:', err);
      setCustomerError('고객 데이터를 불러오는데 실패했습니다.');
    } finally {
      setCustomerLoading(false);
    }
  };

  // 고객 탭 선택 시 데이터 로드
  useEffect(() => {
    if (selectedTab === '고객' && !customerStats && !customerLoading) {
      loadCustomerData();
    }
  }, [selectedTab]);

  // 클립보드 복사 함수 - 콘텐츠
  const copyContentData = async () => {
    if (!categoryRanking || categoryRanking.length === 0) return;

    const periodLabel = contentPeriod === 'this_week' ? '이번주' : contentPeriod === 'last_week' ? '저번주' : '전체';
    const typeLabel = contentTypeFilter === 'all' ? '종합' : contentTypeFilter === 'paid' ? '심화 해석판' : '무료 체험판';

    // 복사 시 카테고리별 전체 콘텐츠 조회 (UI는 Top 5, 복사는 전체)
    const results = await Promise.all(
      categoryRanking.map(cat =>
        fetchTopContentsByCategory(cat.category, contentTypeFilter, 999, contentPeriod)
          .then(data => ({ category: cat.category, data }))
      )
    );
    const allContentsByCategory: Record<string, typeof results[0]['data']> = {};
    for (const { category, data: contents } of results) {
      allContentsByCategory[category] = contents;
    }

    const data = {
      tab: '콘텐츠',
      period: periodLabel,
      contentType: typeLabel,
      timestamp: new Date().toISOString(),
      totalViews: categoryRanking.reduce((sum, c) => sum + c.totalViews, 0),
      categoryRanking: categoryRanking.map((cat, index) => {
        const contents = allContentsByCategory[cat.category];
        return {
          rank: index + 1,
          category: cat.category,
          totalViews: cat.totalViews,
          contentCount: cat.contentCount,
          contents: (contents ?? []).map((c, cIdx) => ({
            rank: cIdx + 1,
            title: c.title,
            type: c.contentType,
            viewCount: c.viewCount,
          })),
        };
      }),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 클립보드 복사 함수 - 고객
  const copyCustomerData = async () => {
    if (!customerStats) return;
    const data = {
      tab: '고객',
      timestamp: new Date().toISOString(),
      summary: {
        totalSajuUsers: customerStats.totalSajuUsers,
        totalSajuRecords: customerStats.totalSajuRecords,
        avgRecordsPerUser: customerStats.avgRecordsPerUser,
      },
      genderDistribution: customerStats.genderDistribution,
      ageGroupDistribution: customerStats.ageGroupDistribution,
      providerDistribution: customerStats.providerDistribution,
      zodiacDistribution: customerStats.zodiacDistribution,
      relationshipDistribution: customerStats.relationshipDistribution,
      paidConversionByGender: customerStats.paidConversionByGender,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 클립보드 복사 함수 - 구매
  const copyPurchaseData = async () => {
    if (!purchaseStats) return;
    const gaActiveUsers = gaStats?.activeUsers ?? 0;
    const periodLabel = purchasePeriod === 'this_week' ? '이번주' : purchasePeriod === 'last_week' ? '저번주' : '전체';
    const data: Record<string, unknown> = {
      tab: '구매',
      timestamp: new Date().toISOString(),
      summary: {
        totalOrders: purchaseStats.totalOrders,
        totalRevenue: purchaseStats.totalRevenue,
        uniqueBuyers: purchaseStats.uniqueBuyers,
        avgPurchasesPerBuyer: purchaseStats.avgPurchasesPerBuyer,
        conversionRate: gaActiveUsers > 0 ? Math.round(purchaseStats.totalOrders / gaActiveUsers * 1000) / 10 : 0,
        avgOrderValue: purchaseStats.totalOrders > 0 ? Math.round(purchaseStats.totalRevenue / purchaseStats.totalOrders) : 0,
        arpu: gaActiveUsers > 0 ? Math.round(purchaseStats.totalRevenue / gaActiveUsers) : 0,
      },
      purchaseFunnel: purchaseFunnel ? {
        period: periodLabel,
        paidDetailViews: purchaseFunnel.paidDetailViews,
        paymentViews: Math.max(0, purchaseFunnel.paymentViews - purchaseFunnel.freeSproutOrders),
        completedOrders: purchaseFunnel.completedOrders,
        freeSproutOrders: purchaseFunnel.freeSproutOrders,
        paymentRate: purchaseFunnel.paidDetailViews > 0 ? Math.round(Math.max(0, purchaseFunnel.paymentViews - purchaseFunnel.freeSproutOrders) / purchaseFunnel.paidDetailViews * 1000) / 10 : 0,
        completionRate: purchaseFunnel.paidDetailViews > 0 ? Math.round(purchaseFunnel.completedOrders / purchaseFunnel.paidDetailViews * 1000) / 10 : 0,
      } : null,
      recentOrders: purchaseStats.recentOrders.map(o => ({
        orderedAt: o.orderedAt,
        nickname: o.nickname,
        contentTitle: o.contentTitle,
        categoryMain: o.categoryMain,
        paidAmount: o.paidAmount,
        payMethod: o.payMethod,
        pstatus: o.pstatus,
      })),
      customerSummary: purchaseStats.customerSummary.map(c => ({
        nickname: c.nickname,
        totalPurchases: c.totalPurchases,
        totalSpent: c.totalSpent,
        totalTags: c.totalTags,
        weeklyTags: c.weeklyTags,
        visitCount: c.visitCount,
      })),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 클립보드 복사 함수 - 개요
  const copyOverviewData = async () => {
    if (!stats || !gaStats) return;

    // 개요 탭 구매 통계 (기간 필터 적용된 데이터 사용)
    let latestPurchaseStats = overviewPurchaseStats;
    if (!latestPurchaseStats) {
      try {
        const dateRangeFilter = selectedPreset === 'custom' && dateRange?.from
          ? { startDate: dateRange.from.toISOString(), endDate: (dateRange.to ?? dateRange.from).toISOString() }
          : getDateRangeFromPreset(selectedPreset);
        latestPurchaseStats = await fetchPurchaseStats(dateRangeFilter);
      } catch (err) {
        console.error('구매 통계 로드 실패:', err);
      }
    }

    const gaActiveUsers = gaStats.activeUsers ?? 0;

    const data = {
      tab: '개요',
      period: selectedPreset === 'custom' ? getDateLabel() : DATE_PRESETS.find(p => p.value === selectedPreset)?.label,
      timestamp: new Date().toISOString(),
      ga: {
        activeUsers: gaStats.activeUsers,
        newUsers: gaStats.newUsers,
        returningUsers: gaStats.activeUsers && gaStats.newUsers ? gaStats.activeUsers - gaStats.newUsers : 0,
        returnRate: gaStats.activeUsers && gaStats.newUsers && gaStats.activeUsers > 0
          ? Math.round((gaStats.activeUsers - gaStats.newUsers) / gaStats.activeUsers * 1000) / 10 : 0,
        avgEngagementTime: gaStats.averageEngagementTime,
        freeResultPageViews: gaStats.freeResultPageViews,
        freeResultPageViewsPerUser: gaStats.freeResultPageViewsPerUser,
        freeResultActiveUsers: gaStats.freeResultPageViews && gaStats.freeResultPageViewsPerUser && gaStats.freeResultPageViewsPerUser > 0
          ? Math.round(gaStats.freeResultPageViews / gaStats.freeResultPageViewsPerUser) : 0,
      },
      customers: {
        total: stats.totalCustomers,
        new: stats.newCustomers,
        returning: stats.returningCustomers,
        returnRate: stats.returnRate,
        signupRate: gaStats.newUsers && gaStats.newUsers > 0
          ? Math.round(stats.newCustomers / gaStats.newUsers * 1000) / 10 : 0,
        totalVisits: stats.totalVisits,
        contentUsageRate: stats.contentUsageRate,
        freeContentUsage: stats.freeContentUsage,
        freeContentUserRate: stats.freeContentUserRate,
        paidContentUsage: stats.paidContentUsage,
        paidContentUserRate: stats.paidContentUserRate,
      },
      tags: {
        tagUserCount: stats.tagUserCount,
        tagUserRate: stats.tagUserRate,
        confirmedTagCount: stats.confirmedTagCount,
        overallTagConfirmRate: stats.overallTagConfirmRate,
        avgTagsPerUser: stats.avgTagsPerUser,
      },
      purchase: latestPurchaseStats ? {
        totalOrders: latestPurchaseStats.totalOrders,
        totalRevenue: latestPurchaseStats.totalRevenue,
        uniqueBuyers: latestPurchaseStats.uniqueBuyers,
        avgPurchasesPerBuyer: latestPurchaseStats.avgPurchasesPerBuyer,
        conversionRate: gaActiveUsers > 0 ? Math.round(latestPurchaseStats.totalOrders / gaActiveUsers * 1000) / 10 : 0,
        avgOrderValue: latestPurchaseStats.totalOrders > 0 ? Math.round(latestPurchaseStats.totalRevenue / latestPurchaseStats.totalOrders) : 0,
        arpu: gaActiveUsers > 0 ? Math.round(latestPurchaseStats.totalRevenue / gaActiveUsers) : 0,
      } : null,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 클립보드 복사 함수 - 추세
  const copyTrendData = async () => {
    if (!trendData || trendData.length === 0) return;

    // 구매 통계가 아직 로드 안 됐으면 먼저 로드
    let latestTrendPurchaseStats = trendPurchaseStats;
    if (!latestTrendPurchaseStats) {
      try {
        const dateRangeFilter = trendCustomDateRange.start
          ? { startDate: trendCustomDateRange.start.toISOString(), endDate: (trendCustomDateRange.end ?? trendCustomDateRange.start).toISOString() }
          : getTrendDateRange(trendPreset);
        latestTrendPurchaseStats = await fetchPurchaseStats(dateRangeFilter);
      } catch (err) {
        console.error('추세 구매 통계 로드 실패:', err);
      }
    }

    const totalGa = trendData.reduce((sum, d) => sum + d.gaActiveUsers, 0);
    const totalRev = trendData.reduce((sum, d) => sum + d.revenue, 0);

    const data = {
      tab: '추세',
      period: trendCustomDateRange.start ? getTrendDateLabel() : TREND_PRESETS.find(p => p.value === trendPreset)?.label,
      timestamp: new Date().toISOString(),
      purchase: latestTrendPurchaseStats ? {
        totalOrders: latestTrendPurchaseStats.totalOrders,
        totalRevenue: latestTrendPurchaseStats.totalRevenue,
        uniqueBuyers: latestTrendPurchaseStats.uniqueBuyers,
        avgPurchasesPerBuyer: latestTrendPurchaseStats.avgPurchasesPerBuyer,
        conversionRate: totalGa > 0 ? Math.round(latestTrendPurchaseStats.totalOrders / totalGa * 1000) / 10 : 0,
        avgOrderValue: latestTrendPurchaseStats.totalOrders > 0 ? Math.round(latestTrendPurchaseStats.totalRevenue / latestTrendPurchaseStats.totalOrders) : 0,
        arpu: totalGa > 0 ? Math.round(totalRev / totalGa) : 0,
      } : null,
      dailyData: trendData.map(d => ({
        date: d.fullDate,
        ga: {
          activeUsers: d.gaActiveUsers,
          newUsers: d.gaNewUsers,
          avgEngagementTime: d.gaAverageEngagementTime,
        },
        customers: {
          total: d.totalCustomers,
          new: d.newCustomers,
          returning: d.returningCustomers,
          signupRate: d.signupRate,
        },
        content: {
          free: d.freeContentUsage,
          paid: d.paidContentUsage,
          total: d.totalContentUsage,
          usageRate: d.contentUsageRate,
        },
        tags: {
          saved: d.tagSaved,
          confirmed: d.tagConfirmed,
          uniqueUsers: d.uniqueTagUsers,
          saveRate: d.tagSaveRate,
          confirmRate: d.tagConfirmRate,
          avgPerUser: d.avgTagsPerUser,
        },
        purchase: {
          orders: d.totalOrders,
          revenue: d.revenue,
          conversionRate: d.gaActiveUsers > 0 ? Math.round(d.totalOrders / d.gaActiveUsers * 1000) / 10 : 0,
          avgOrderValue: d.totalOrders > 0 ? Math.round(d.revenue / d.totalOrders) : 0,
          arpu: d.gaActiveUsers > 0 ? Math.round(d.revenue / d.gaActiveUsers) : 0,
        },
      })),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 클립보드 복사 함수 - 비교
  const copyCompareData = async () => {
    if (!currentPeriodStats || !previousPeriodStats) return;

    const ranges = getCompareDateRanges(comparePreset, compareCustomDateRange);
    const currentGaUsers = currentGaStats?.activeUsers ?? 0;
    const prevGaUsers = previousGaStats?.activeUsers ?? 0;

    const data = {
      tab: '비교',
      timestamp: new Date().toISOString(),
      currentPeriod: {
        label: ranges.currentLabel,
        ga: currentGaStats ? {
          activeUsers: currentGaStats.activeUsers,
          newUsers: currentGaStats.newUsers,
          avgEngagementTime: currentGaStats.averageEngagementTime,
        } : null,
        customers: {
          total: currentPeriodStats.totalCustomers,
          new: currentPeriodStats.newCustomers,
          returning: currentPeriodStats.returningCustomers,
        },
        content: {
          free: currentPeriodStats.freeContentUsage,
          paid: currentPeriodStats.paidContentUsage,
        },
        purchase: {
          orders: currentPeriodStats.totalOrders,
          revenue: currentPeriodStats.totalRevenue,
          avgOrderValue: currentPeriodStats.totalOrders > 0 ? Math.round(currentPeriodStats.totalRevenue / currentPeriodStats.totalOrders) : 0,
          conversionRate: currentGaUsers > 0 ? Math.round(currentPeriodStats.totalOrders / currentGaUsers * 1000) / 10 : 0,
          arpu: currentGaUsers > 0 ? Math.round(currentPeriodStats.totalRevenue / currentGaUsers) : 0,
        },
        tags: {
          userCount: currentPeriodStats.tagUserCount,
          confirmedCount: currentPeriodStats.confirmedTagCount,
          tagUserRate: currentPeriodStats.tagUserRate,
          avgTagsPerUser: currentPeriodStats.avgTagsPerUser,
        },
      },
      previousPeriod: {
        label: ranges.previousLabel,
        ga: previousGaStats ? {
          activeUsers: previousGaStats.activeUsers,
          newUsers: previousGaStats.newUsers,
          avgEngagementTime: previousGaStats.averageEngagementTime,
        } : null,
        customers: {
          total: previousPeriodStats.totalCustomers,
          new: previousPeriodStats.newCustomers,
          returning: previousPeriodStats.returningCustomers,
        },
        content: {
          free: previousPeriodStats.freeContentUsage,
          paid: previousPeriodStats.paidContentUsage,
        },
        purchase: {
          orders: previousPeriodStats.totalOrders,
          revenue: previousPeriodStats.totalRevenue,
          avgOrderValue: previousPeriodStats.totalOrders > 0 ? Math.round(previousPeriodStats.totalRevenue / previousPeriodStats.totalOrders) : 0,
          conversionRate: prevGaUsers > 0 ? Math.round(previousPeriodStats.totalOrders / prevGaUsers * 1000) / 10 : 0,
          arpu: prevGaUsers > 0 ? Math.round(previousPeriodStats.totalRevenue / prevGaUsers) : 0,
        },
        tags: {
          userCount: previousPeriodStats.tagUserCount,
          confirmedCount: previousPeriodStats.confirmedTagCount,
          tagUserRate: previousPeriodStats.tagUserRate,
          avgTagsPerUser: previousPeriodStats.avgTagsPerUser,
        },
      },
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('복사 실패:', err);
    }
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

          {/* 탭 필터 - 개요/추세/비교/콘텐츠/보고서/고객 */}
          <div className="shrink-0 bg-white px-4 py-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-center gap-1 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {DASHBOARD_TABS.map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className="relative px-4 py-2 rounded-xl transition-colors shrink-0"
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
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={copyOverviewData}
                    className="flex items-center justify-center rounded-lg transition-colors active:opacity-80"
                    style={{
                      padding: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e7e7e7',
                    }}
                    title="데이터 복사"
                  >
                    <Copy size={14} color="#666" />
                  </button>
                </div>
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
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={copyTrendData}
                    className="flex items-center justify-center rounded-lg transition-colors active:opacity-80"
                    style={{
                      padding: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e7e7e7',
                    }}
                    title="데이터 복사"
                  >
                    <Copy size={14} color="#666" />
                  </button>
                </div>
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

                {/* GA 데이터 처리 지연 안내 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#92400e', lineHeight: '1.6' }}>
                    GA4 데이터는 수집 후 최대 72시간 동안 처리·확정됩니다. 최근 2~3일 수치(특히 신규/재방문 분류)는 이후 변동될 수 있으며, 과거 날짜일수록 확정된 값입니다.
                  </p>
                </div>

                {/* 1. 방문자 추이 (GA) */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>방문자 추이</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="gaActiveUsers" name="방문자 추이" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
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
                          gaReturningUsers: Math.max(0, d.gaActiveUsers - d.gaNewUsers)
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

                {/* 3. GA 재방문율 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>재방문율</h3>
                    {(() => {
                      const totalGa = trendData.reduce((sum, d) => sum + d.gaActiveUsers, 0);
                      const totalNew = trendData.reduce((sum, d) => sum + d.gaNewUsers, 0);
                      const avg = totalGa > 0 ? Math.max(0, Math.round((totalGa - totalNew) / totalGa * 1000) / 10) : 0;
                      return totalGa > 0 && (
                        <span style={{ ...typography.small, color: '#999' }}>평균 {avg}%</span>
                      );
                    })()}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData.map(d => ({
                          ...d,
                          gaReturnRate: d.gaActiveUsers > 0 ? Math.max(0, Math.round((d.gaActiveUsers - d.gaNewUsers) / d.gaActiveUsers * 1000) / 10) : 0
                        }))}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '재방문율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="gaReturnRate" name="재방문율" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 4. 평균 참여시간 (GA) */}
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

                {/* 5. 고객 총 방문 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>고객 총 방문 추이</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="totalCustomers" name="고객 총 방문 추이" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 6. 신규 고객 vs 재방문 고객 */}
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

                {/* 7. 재방문율 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>재방문율</h3>
                    {(() => {
                      const totalCust = trendData.reduce((sum, d) => sum + d.totalCustomers, 0);
                      const totalReturn = trendData.reduce((sum, d) => sum + d.returningCustomers, 0);
                      const avg = totalCust > 0 ? Math.round(totalReturn / totalCust * 1000) / 10 : 0;
                      return totalCust > 0 && (
                        <span style={{ ...typography.small, color: '#999' }}>평균 {avg}%</span>
                      );
                    })()}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData.map(d => ({
                          ...d,
                          customerReturnRate: d.totalCustomers > 0 ? Math.round(d.returningCustomers / d.totalCustomers * 1000) / 10 : 0
                        }))}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '재방문율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="customerReturnRate" name="재방문율" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 8. 회원가입율 */}
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

                {/* 구매 통계 섹션 */}
                <SectionHeader icon="🛒" title="구매 통계" />

                {/* 주문 수 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>주문 수 추이</h3>
                    {trendPurchaseStats && (
                      <span style={{ ...typography.small, color: '#999' }}>총 {trendPurchaseStats.totalOrders}건</span>
                    )}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip formatter={(value: number) => [`${value}건`, '주문 수']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="totalOrders" name="주문 수" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 매출 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>매출 추이</h3>
                    {trendPurchaseStats && (
                      <span style={{ ...typography.small, color: '#999' }}>총 {trendPurchaseStats.totalRevenue.toLocaleString()}원</span>
                    )}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${Math.round(v / 10000)}만` : String(v)} />
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '매출']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="revenue" name="매출" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 무료 새싹 주문 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>무료 새싹 주문 추이</h3>
                    <span style={{ ...typography.small, color: '#999' }}>총 {trendData.reduce((sum, d) => sum + d.freeSproutOrders, 0)}건</span>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip formatter={(value: number) => [`${value}건`, '무료 새싹 주문']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="freeSproutOrders" name="무료 새싹 주문" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p style={{ ...typography.small, color: '#bbb', margin: '8px 0 0', textAlign: 'right' }}>리워드 새싹 주문</p>
                </section>

                {/* 구매 전환율 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>구매 전환율 추이</h3>
                    {trendPurchaseStats && (() => {
                      const totalGa = trendData.reduce((sum, d) => sum + d.gaActiveUsers, 0);
                      return totalGa > 0 && (
                        <span style={{ ...typography.small, color: '#999' }}>
                          평균 {Math.round(trendPurchaseStats.totalOrders / totalGa * 1000) / 10}%
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '구매 전환율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey={(d) => d.gaActiveUsers > 0 ? Math.round(d.totalOrders / d.gaActiveUsers * 1000) / 10 : 0} name="구매 전환율" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p style={{ ...typography.small, color: '#bbb', margin: '8px 0 0', textAlign: 'right' }}>GA 총방문자 대비 구매</p>
                </section>

                {/* 객단가 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>객단가 추이</h3>
                    {trendPurchaseStats && trendPurchaseStats.uniqueBuyers > 0 && (
                      <span style={{ ...typography.small, color: '#999' }}>
                        평균 {Math.round(trendPurchaseStats.totalRevenue / trendPurchaseStats.uniqueBuyers).toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${Math.round(v / 10000)}만` : String(v)} />
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, '객단가']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey={(d) => d.uniqueBuyers > 0 ? Math.round(d.revenue / d.uniqueBuyers) : 0} name="객단가" stroke="#EC4899" strokeWidth={2} dot={{ r: 3, fill: '#EC4899' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p style={{ ...typography.small, color: '#bbb', margin: '8px 0 0', textAlign: 'right' }}>총매출 / 구매고객수</p>
                </section>

                {/* AOV 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>AOV 추이</h3>
                    {trendPurchaseStats && trendPurchaseStats.totalOrders > 0 && (
                      <span style={{ ...typography.small, color: '#999' }}>
                        평균 {Math.round(trendPurchaseStats.totalRevenue / trendPurchaseStats.totalOrders).toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${Math.round(v / 10000)}만` : String(v)} />
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, 'AOV']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey={(d) => d.totalOrders > 0 ? Math.round(d.revenue / d.totalOrders) : 0} name="AOV" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p style={{ ...typography.small, color: '#bbb', margin: '8px 0 0', textAlign: 'right' }}>총매출 / 총주문수</p>
                </section>

                {/* ARPU 추이 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>ARPU 추이</h3>
                    {(() => {
                      const totalGa = trendData.reduce((sum, d) => sum + d.gaActiveUsers, 0);
                      const totalRev = trendData.reduce((sum, d) => sum + d.revenue, 0);
                      return totalGa > 0 && (
                        <span style={{ ...typography.small, color: '#999' }}>
                          평균 {Math.round(totalRev / totalGa).toLocaleString()}원
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${Math.round(v / 10000)}만` : String(v)} />
                        <Tooltip formatter={(value: number) => [`${value.toLocaleString()}원`, 'ARPU']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey={(d) => d.gaActiveUsers > 0 ? Math.round(d.revenue / d.gaActiveUsers) : 0} name="ARPU" stroke="#F43F5E" strokeWidth={2} dot={{ r: 3, fill: '#F43F5E' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p style={{ ...typography.small, color: '#bbb', margin: '8px 0 0', textAlign: 'right' }}>총매출 / 총 방문자수 (GA)</p>
                </section>

                {/* 태그 통계 섹션 */}
                <SectionHeader icon="🏷️" title="태그 통계" />

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

                {/* 회원당 태그 수 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>회원당 태그 수</h3>
                    <span style={{ fontSize: '11px', fontFamily: 'Pretendard Variable', color: '#999' }}>확인 태그 / 태그 저장 고객</span>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: number) => [`${value}개`, '회원당 태그']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="avgTagsPerUser" name="회원당 태그" stroke={TREND_COLORS.quaternary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.quaternary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 태그 저장 추이 */}
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
                        <Line type="monotone" dataKey="tagConfirmed" name="확인" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 8. 태그 저장 고객 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>태그 저장 고객</h3>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: number) => [`${value}명`, '태그 저장 고객']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="uniqueTagUsers" name="태그 저장 고객" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 9. 회원당 태그 저장율 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>회원당 태그 저장율</h3>
                    <span style={{ fontSize: '11px', fontFamily: 'Pretendard Variable', color: '#999' }}>태그 저장 고객 / 총 가입 고객</span>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '저장율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="tagSaveRate" name="저장율" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* 10. 태그 확인율 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>태그 확인율</h3>
                    <span style={{ fontSize: '11px', fontFamily: 'Pretendard Variable', color: '#999' }}>확인 태그 / 전체 태그</span>
                  </div>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value: number) => [`${value}%`, '확인율']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} />
                        <Line type="monotone" dataKey="tagConfirmRate" name="확인율" stroke={TREND_COLORS.tertiary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.tertiary }} activeDot={{ r: 5 }} />
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
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} color="#666" />
                  <span style={{ ...typography.label }}>비교 기간</span>
                </div>
                <button
                  onClick={copyCompareData}
                  className="flex items-center justify-center rounded-lg transition-colors active:opacity-80"
                  style={{
                    padding: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e7e7e7',
                  }}
                  title="데이터 복사"
                >
                  <Copy size={14} color="#666" />
                </button>
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
                  <div className="rounded-xl" style={{ backgroundColor: '#6366F1', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', fontFamily: 'Pretendard Variable', fontWeight: 400, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>B군</p>
                    <p style={{ fontSize: '13px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: '#ffffff' }}>
                      {getCompareGroupLabels().previousLabel}
                    </p>
                  </div>
                  <div className="rounded-xl" style={{ backgroundColor: '#3FB5B3', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', fontFamily: 'Pretendard Variable', fontWeight: 400, color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>A군</p>
                    <p style={{ fontSize: '13px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: '#ffffff' }}>
                      {getCompareGroupLabels().currentLabel}
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
                      { label: '재방문자', current: Math.max(0, (currentGaStats.activeUsers || 0) - (currentGaStats.newUsers || 0)), previous: Math.max(0, (previousGaStats.activeUsers || 0) - (previousGaStats.newUsers || 0)), unit: '명' },
                      { label: '재방문율', current: currentGaStats.activeUsers ? Math.max(0, Math.round(((currentGaStats.activeUsers - currentGaStats.newUsers) / currentGaStats.activeUsers) * 1000) / 10) : 0, previous: previousGaStats.activeUsers ? Math.max(0, Math.round(((previousGaStats.activeUsers - previousGaStats.newUsers) / previousGaStats.activeUsers) * 1000) / 10) : 0, unit: '%' },
                      { label: '평균 참여시간', current: currentGaStats.averageEngagementTime || 0, previous: previousGaStats.averageEngagementTime || 0, unit: '초', formatFn: (v: number) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` },
                    ].map((item, idx, arr) => {
                      const change = calcChangePercent(item.current, item.previous);
                      const displayValue = item.formatFn || ((v: number) => v.toLocaleString() + item.unit);
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-3" style={{ marginBottom: idx < arr.length - 1 ? '12px' : 0 }}>
                          <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                              {item.formatFn ? item.formatFn(item.previous) : `${item.previous.toLocaleString()}${item.unit}`}
                            </p>
                          </div>
                          <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                              {item.formatFn ? item.formatFn(item.current) : `${item.current.toLocaleString()}${item.unit}`}
                            </p>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                              {change.isPositive ? '▲' : '▼'} {change.value}%
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
                        <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                            {item.previous.toLocaleString()}{item.unit}
                          </p>
                        </div>
                        <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                            {item.current.toLocaleString()}{item.unit}
                          </p>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                            {change.isPositive ? '▲' : '▼'} {change.value}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </section>

                {/* 매출 통계 비교 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <h3 style={{ ...typography.sectionTitle, marginBottom: '16px' }}>💰 매출 통계</h3>
                  {(() => {
                    const curGaUsers = currentGaStats?.activeUsers ?? 0;
                    const prevGaUsers = previousGaStats?.activeUsers ?? 0;
                    const items = [
                      { label: '기간 매출', current: currentPeriodStats.totalRevenue, previous: previousPeriodStats.totalRevenue, unit: '', prefix: '₩' },
                      { label: '주문수', current: currentPeriodStats.totalOrders, previous: previousPeriodStats.totalOrders, unit: '건', prefix: '' },
                      { label: '객단가', current: currentPeriodStats.uniqueBuyers > 0 ? Math.round(currentPeriodStats.totalRevenue / currentPeriodStats.uniqueBuyers) : 0, previous: previousPeriodStats.uniqueBuyers > 0 ? Math.round(previousPeriodStats.totalRevenue / previousPeriodStats.uniqueBuyers) : 0, unit: '', prefix: '₩' },
                      { label: 'AOV', current: currentPeriodStats.totalOrders > 0 ? Math.round(currentPeriodStats.totalRevenue / currentPeriodStats.totalOrders) : 0, previous: previousPeriodStats.totalOrders > 0 ? Math.round(previousPeriodStats.totalRevenue / previousPeriodStats.totalOrders) : 0, unit: '', prefix: '₩' },
                      { label: '구매 전환율', current: curGaUsers > 0 ? Math.round(currentPeriodStats.totalOrders / curGaUsers * 1000) / 10 : 0, previous: prevGaUsers > 0 ? Math.round(previousPeriodStats.totalOrders / prevGaUsers * 1000) / 10 : 0, unit: '%', prefix: '' },
                      { label: 'ARPU', current: curGaUsers > 0 ? Math.round(currentPeriodStats.totalRevenue / curGaUsers) : 0, previous: prevGaUsers > 0 ? Math.round(previousPeriodStats.totalRevenue / prevGaUsers) : 0, unit: '', prefix: '₩' },
                    ];
                    return items.map((item, idx) => {
                      const change = calcChangePercent(item.current, item.previous);
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-3" style={{ marginBottom: idx < items.length - 1 ? '12px' : 0 }}>
                          <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                              {item.prefix}{item.previous.toLocaleString()}{item.unit}
                            </p>
                          </div>
                          <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>{item.label}</p>
                            <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                              {item.prefix}{item.current.toLocaleString()}{item.unit}
                            </p>
                            <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                              {change.isPositive ? '▲' : '▼'} {change.value}%
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </section>

                {/* 태그 통계 비교 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <h3 style={{ ...typography.sectionTitle, marginBottom: '16px' }}>🏷️ 태그 통계</h3>
                  {[
                    { label: '태그 저장율', current: currentPeriodStats.tagUserRate, previous: previousPeriodStats.tagUserRate, unit: '%' },
                    { label: '회원당 태그 수', current: currentPeriodStats.avgTagsPerUser, previous: previousPeriodStats.avgTagsPerUser, unit: '개' },
                  ].map((item, idx, arr) => {
                    const change = calcChangePercent(item.current, item.previous);
                    return (
                      <div key={idx} className="grid grid-cols-2 gap-3" style={{ marginBottom: idx < arr.length - 1 ? '12px' : 0 }}>
                        <div className="rounded-xl" style={{ backgroundColor: '#EEF2FF', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#818CF8', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#4F46E5' }}>
                            {item.previous.toLocaleString()}{item.unit}
                          </p>
                        </div>
                        <div className="rounded-xl" style={{ backgroundColor: '#F0FDFA', padding: '12px' }}>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', color: '#666', marginBottom: '4px' }}>{item.label}</p>
                          <p style={{ fontSize: '20px', fontFamily: 'Pretendard Variable', fontWeight: 600, color: '#1a1a1a' }}>
                            {item.current.toLocaleString()}{item.unit}
                          </p>
                          <p style={{ fontSize: '12px', fontFamily: 'Pretendard Variable', fontWeight: 500, color: change.isPositive ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                            {change.isPositive ? '▲' : '▼'} {change.value}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
                        value={Math.max(0, gaStats.activeUsers - gaStats.newUsers)}
                        unit="명"
                        color="#368683"
                        subValue={`재방문율 ${gaStats.activeUsers > 0 ? Math.max(0, Math.round((gaStats.activeUsers - gaStats.newUsers) / gaStats.activeUsers * 1000) / 10) : 0}%`}
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
                      {gaStats.freeResultPageViews !== undefined && (
                        <StatCard
                          icon={Eye}
                          label="무료 운세 조회수"
                          value={gaStats.freeResultPageViews}
                          unit="회"
                          color="#F59E0B"
                          subValue="무료 운세 결과 페이지"
                        />
                      )}
                      {gaStats.freeResultPageViewsPerUser !== undefined && gaStats.freeResultPageViews !== undefined && (
                        <StatCard
                          icon={Activity}
                          label="1인당 무료 운세 조회수"
                          value={gaStats.freeResultPageViewsPerUser}
                          unit="회"
                          color="#10B981"
                          subValue={`활성사용자 ${gaStats.freeResultPageViewsPerUser > 0 ? Math.round(gaStats.freeResultPageViews / gaStats.freeResultPageViewsPerUser).toLocaleString() : 0}명`}
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
                {(gaStats?.newUsers ?? 0) > 0 && (
                  <StatCard
                    icon={UserPlus}
                    label="회원가입율"
                    value={Math.round(stats.newCustomers / gaStats!.newUsers * 1000) / 10}
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
                  subValue={`이용율 ${stats.freeContentUserRate}% / 1인당 ${stats.freeContentPerUser}회`}
                />
                <StatCard
                  icon={CreditCard}
                  label="유료 이용"
                  value={stats.paidContentUsage}
                  unit="건"
                  color="#368683"
                  subValue={`이용율 ${stats.paidContentUserRate}% / 1인당 ${stats.paidContentPerUser}회`}
                />
              </div>
            </section>

            {/* 구매 통계 섹션 (개요 탭: 기간 필터 적용) */}
            <section>
              <SectionHeader icon="🛒" title="구매 통계" />
              {overviewPurchaseLoading && !overviewPurchaseStats && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', fontSize: '13px' }}>로딩 중...</div>
              )}
              {!overviewPurchaseLoading && overviewPurchaseStats && (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={ShoppingCart}
                    label="총 주문"
                    value={overviewPurchaseStats.totalOrders}
                    unit="건"
                    color="#3FB5B3"
                  />
                  <StatCard
                    icon={DollarSign}
                    label="총 매출"
                    value={overviewPurchaseStats.totalRevenue.toLocaleString()}
                    unit="원"
                    color="#6366F1"
                  />
                  <StatCard
                    icon={Gift}
                    label="무료 새싹 주문"
                    value={overviewPurchaseStats.freeSproutOrders}
                    unit="건"
                    color="#F97316"
                    subValue="리워드 새싹 주문"
                  />
                  <StatCard
                    icon={Users}
                    label="구매 고객"
                    value={overviewPurchaseStats.uniqueBuyers}
                    unit="명"
                    color="#EC4899"
                  />
                  <StatCard
                    icon={BarChart3}
                    label="인당 평균"
                    value={overviewPurchaseStats.avgPurchasesPerBuyer}
                    unit="회"
                    color="#F59E0B"
                  />
                  <StatCard
                    icon={Activity}
                    label="구매 전환율"
                    value={(gaStats?.activeUsers ?? 0) > 0 ? Math.round(overviewPurchaseStats.totalOrders / gaStats!.activeUsers * 1000) / 10 : 0}
                    unit="%"
                    color="#10B981"
                    subValue="GA 총방문자 대비 구매"
                  />
                  <StatCard
                    icon={CreditCard}
                    label="객단가"
                    value={overviewPurchaseStats.uniqueBuyers > 0 ? Math.round(overviewPurchaseStats.totalRevenue / overviewPurchaseStats.uniqueBuyers).toLocaleString() : 0}
                    unit="원"
                    color="#8B5CF6"
                    subValue="총매출 / 구매고객수"
                  />
                  <StatCard
                    icon={ShoppingCart}
                    label="AOV"
                    value={overviewPurchaseStats.totalOrders > 0 ? Math.round(overviewPurchaseStats.totalRevenue / overviewPurchaseStats.totalOrders).toLocaleString() : 0}
                    unit="원"
                    color="#A855F7"
                    subValue="총매출 / 총주문수"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="ARPU"
                    value={(gaStats?.activeUsers ?? 0) > 0 ? Math.round(overviewPurchaseStats.totalRevenue / gaStats!.activeUsers).toLocaleString() : 0}
                    unit="원"
                    color="#F43F5E"
                    subValue="총매출 / 총 방문자수"
                  />
                </div>
              )}
            </section>

            {/* 태그 통계 섹션 */}
            <section>
              <SectionHeader icon="🏷️" title="태그 통계" />
              <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '12px' }}>
                <StatCard
                  icon={Users}
                  label="태그 저장 고객"
                  value={stats.tagUserCount}
                  unit="명"
                  color="#6366F1"
                  subValue={`저장율 ${stats.tagUserRate}%`}
                />
                <StatCard
                  icon={Eye}
                  label="확인 태그수"
                  value={stats.confirmedTagCount}
                  unit="건"
                  color="#3FB5B3"
                />
                <StatCard
                  icon={Activity}
                  label="태그 확인율"
                  value={stats.overallTagConfirmRate}
                  unit="%"
                  color="#48B2AF"
                />
                <StatCard
                  icon={UserCheck}
                  label="회원당 태그"
                  value={stats.avgTagsPerUser}
                  unit="개"
                  color="#EC4899"
                  subValue="평균 확인 개수"
                />
              </div>

              {/* 소스별 확인율 차트 */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                <h4 style={{ ...typography.label, marginBottom: '12px', fontWeight: 500 }}>소스별 확인율</h4>
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

        {/* ========== 콘텐츠 탭 ========== */}
        {selectedTab === '콘텐츠' && (
          <div>
            {/* 기간 필터 + 복사 버튼 */}
            <div style={{ marginBottom: '20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                <div className="flex items-center gap-2">
                  <Calendar size={16} color="#666" />
                  <span style={{ ...typography.label }}>조회 기간</span>
                </div>
                <button
                  onClick={copyContentData}
                  className="flex items-center justify-center rounded-lg transition-colors active:opacity-80"
                  style={{
                    width: '36px', height: '36px',
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                  }}
                >
                  <Copy size={16} color="#666" />
                </button>
              </div>
              <div className="flex gap-2">
                {([
                  { value: 'this_week' as ContentPeriodFilter, label: '이번주' },
                  { value: 'last_week' as ContentPeriodFilter, label: '저번주' },
                  { value: 'all' as ContentPeriodFilter, label: '전체' },
                ]).map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleContentPeriodChange(filter.value)}
                    className="rounded-full whitespace-nowrap transition-colors"
                    style={{
                      ...typography.preset,
                      padding: '8px 16px',
                      fontWeight: contentPeriod === filter.value ? 500 : 400,
                      backgroundColor: contentPeriod === filter.value ? '#3FB5B3' : '#ffffff',
                      color: contentPeriod === filter.value ? '#ffffff' : '#666666',
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 콘텐츠 타입 필터 (종합/심화 해석판/무료 체험판) */}
            <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                <BarChart3 size={16} color="#666" />
                <span style={{ ...typography.label }}>콘텐츠 유형</span>
              </div>
              <div className="flex items-center gap-2">
                {([
                  { value: 'all' as ContentTypeFilter, label: '종합' },
                  { value: 'paid' as ContentTypeFilter, label: '심화 해석판' },
                  { value: 'free' as ContentTypeFilter, label: '무료 체험판' },
                ]).map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setContentTypeFilter(filter.value)}
                    className="rounded-xl transition-colors active:opacity-80"
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '14px',
                      fontWeight: contentTypeFilter === filter.value ? 500 : 400,
                      padding: '8px 16px',
                      backgroundColor: contentTypeFilter === filter.value ? '#3FB5B3' : '#f5f5f5',
                      color: contentTypeFilter === filter.value ? '#ffffff' : '#666666',
                      border: 'none',
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 카테고리 뷰수 랭킹 */}
            <section style={{ marginBottom: '20px' }}>
              <SectionHeader icon="🏆" title="카테고리별 조회수 순위" />

              {contentLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : contentError ? (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <p style={{ ...typography.label, color: '#ef4444', marginBottom: '12px' }}>{contentError}</p>
                  <button
                    onClick={loadContentRanking}
                    className="rounded-xl transition-colors active:opacity-80"
                    style={{ ...typography.button, padding: '8px 16px', backgroundColor: '#3FB5B3', color: '#ffffff', border: 'none' }}
                  >
                    다시 시도
                  </button>
                </div>
              ) : categoryRanking.length === 0 ? (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <p style={{ ...typography.label, color: '#999999' }}>데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {categoryRanking.map((cat, index) => {
                    const isExpanded = expandedCategory === cat.category;
                    const cacheKey = `${cat.category}_${contentTypeFilter}_${contentPeriod}`;
                    const contents = topContents[cacheKey];
                    const isLoadingContents = topContentsLoading === cat.category;
                    // 1위 대비 비율 (프로그레스 바)
                    const maxViews = categoryRanking[0]?.totalViews || 1;
                    const ratio = Math.max((cat.totalViews / maxViews) * 100, 2);

                    return (
                      <motion.div
                        key={cat.category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' }}
                      >
                        {/* 카테고리 행 */}
                        <button
                          onClick={() => handleCategoryToggle(cat.category)}
                          className="w-full transition-colors active:opacity-80"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {/* 순위 뱃지 */}
                          <div
                            className="shrink-0 flex items-center justify-center"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#f0f0f0',
                              fontFamily: 'Pretendard Variable, sans-serif',
                              fontSize: '13px',
                              fontWeight: 700,
                              color: index < 3 ? '#ffffff' : '#999999',
                            }}
                          >
                            {index + 1}
                          </div>

                          {/* 카테고리 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                              <span style={{
                                fontFamily: 'Pretendard Variable, sans-serif',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#1a1a1a',
                              }}>
                                {cat.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <span style={{
                                  fontFamily: 'Pretendard Variable, sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: '#3FB5B3',
                                }}>
                                  {cat.totalViews.toLocaleString()}
                                </span>
                                <span style={{
                                  fontFamily: 'Pretendard Variable, sans-serif',
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  color: '#999999',
                                }}>
                                  ({cat.contentCount}개)
                                </span>
                              </div>
                            </div>

                            {/* 프로그레스 바 */}
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${ratio}%` }}
                                transition={{ duration: 0.6, delay: index * 0.05 }}
                                style={{
                                  height: '100%',
                                  borderRadius: '3px',
                                  backgroundColor: index === 0 ? '#3FB5B3' : index === 1 ? '#48B2AF' : index === 2 ? '#5BC5C3' : '#81EBEA',
                                }}
                              />
                            </div>
                          </div>

                          {/* 더보기 아이콘 */}
                          <div className="shrink-0">
                            {isExpanded ? (
                              <ChevronUp size={18} color="#999" />
                            ) : (
                              <ChevronDown size={18} color="#999" />
                            )}
                          </div>
                        </button>

                        {/* 확장: Top5 콘텐츠 */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0f0' }}>
                                <div style={{ paddingTop: '12px' }}>
                                  <div className="flex items-center gap-1" style={{ marginBottom: '10px' }}>
                                    <Trophy size={13} color="#999" />
                                    <span style={{
                                      fontFamily: 'Pretendard Variable, sans-serif',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#999999',
                                    }}>
                                      Top 5 콘텐츠
                                    </span>
                                  </div>

                                  {isLoadingContents ? (
                                    <div className="flex flex-col gap-2">
                                      {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse" style={{ height: '40px', backgroundColor: '#f5f5f5', borderRadius: '10px' }} />
                                      ))}
                                    </div>
                                  ) : contents && contents.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                      {contents.map((content, cIdx) => (
                                        <a
                                          key={content.id}
                                          href={content.contentType === 'free'
                                            ? `/free/content/${content.id}`
                                            : `/master/content/detail/${content.id}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3 rounded-xl transition-colors active:opacity-80"
                                          style={{
                                            padding: '10px 12px',
                                            backgroundColor: '#fafafa',
                                            textDecoration: 'none',
                                          }}
                                        >
                                          <span style={{
                                            fontFamily: 'Pretendard Variable, sans-serif',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: cIdx < 3 ? '#3FB5B3' : '#999999',
                                            width: '18px',
                                            textAlign: 'center',
                                          }}>
                                            {cIdx + 1}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <p style={{
                                              fontFamily: 'Pretendard Variable, sans-serif',
                                              fontSize: '13px',
                                              fontWeight: 500,
                                              color: '#1a1a1a',
                                              margin: 0,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}>
                                              {content.title}
                                            </p>
                                          </div>
                                          <div className="shrink-0 flex items-center gap-2">
                                            <span style={{
                                              fontFamily: 'Pretendard Variable, sans-serif',
                                              fontSize: '12px',
                                              fontWeight: 400,
                                              color: content.contentType === 'paid' ? '#6366F1' : '#3FB5B3',
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              backgroundColor: content.contentType === 'paid' ? '#EEF2FF' : '#F0FDFA',
                                            }}>
                                              {content.contentType === 'paid' ? '유료' : '무료'}
                                            </span>
                                            <span style={{
                                              fontFamily: 'Pretendard Variable, sans-serif',
                                              fontSize: '12px',
                                              fontWeight: 500,
                                              color: '#666666',
                                            }}>
                                              {content.viewCount.toLocaleString()}회
                                            </span>
                                            <ExternalLink size={12} color="#b7b7b7" />
                                          </div>
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <p style={{
                                      fontFamily: 'Pretendard Variable, sans-serif',
                                      fontSize: '12px',
                                      fontWeight: 400,
                                      color: '#999999',
                                      textAlign: 'center',
                                      padding: '12px 0',
                                      margin: 0,
                                    }}>
                                      콘텐츠가 없습니다.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 전체 조회수 합계 */}
              {!contentLoading && categoryRanking.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: '16px',
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Eye size={16} color="#3FB5B3" />
                    <span style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '13px',
                      fontWeight: 400,
                      color: '#666666',
                    }}>
                      전체 조회수
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}>
                    {categoryRanking.reduce((sum, c) => sum + c.totalViews, 0).toLocaleString()}
                  </span>
                </motion.div>
              )}
            </section>
          </div>
        )}{/* 콘텐츠 탭 닫기 */}

        {/* ========== 보고서 탭 ========== */}
        {selectedTab === '보고서' && (
          <div style={{ paddingTop: '16px' }}>
            {/* 에러 상태 */}
            {reportError && (
              <div className="flex flex-col items-center justify-center" style={{ padding: '48px 0' }}>
                <p style={{ ...typography.label, marginBottom: '16px' }}>{reportError}</p>
                <button
                  onClick={() => loadReportData()}
                  className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
                  style={{ ...typography.button, padding: '10px 16px', backgroundColor: '#3FB5B3', color: '#ffffff' }}
                >
                  <RefreshCw size={16} />
                  다시 시도
                </button>
              </div>
            )}

            {/* 로딩 상태 */}
            {reportLoading && !reportError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="animate-pulse" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', height: '280px' }} />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', height: '200px' }} />
                ))}
              </div>
            )}

            {/* 데이터 표시 */}
            {!reportLoading && !reportError && reportFunnel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* 퍼널 테이블 (전체 기간) */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <BarChart3 size={16} color="#3FB5B3" />
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>보고서 퍼널 (전체)</h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>단계</th>
                          <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>수</th>
                          <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>전환율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: '보고서 발행', value: reportFunnel.totalReports, rate: 100 },
                          { label: '알림톡 발송', value: reportFunnel.alimtalkSent, rate: reportFunnel.totalReports > 0 ? Math.round(reportFunnel.alimtalkSent / reportFunnel.totalReports * 1000) / 10 : 0 },
                          { label: '타로 3장 완료', value: reportFunnel.tarotCompleted, rate: reportFunnel.totalReports > 0 ? Math.round(reportFunnel.tarotCompleted / reportFunnel.totalReports * 1000) / 10 : 0 },
                          { label: '응원글 작성', value: reportFunnel.wroteEncouragement, rate: reportFunnel.totalReports > 0 ? Math.round(reportFunnel.wroteEncouragement / reportFunnel.totalReports * 1000) / 10 : 0 },
                        ].map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 500, color: '#1a1a1a', padding: '10px 12px', borderBottom: '1px solid #f8f8f8' }}>{row.label}</td>
                            <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 600, color: '#3FB5B3', padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #f8f8f8' }}>{row.value.toLocaleString()}</td>
                            <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', fontWeight: 400, color: '#666', padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #f8f8f8' }}>{row.rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 보고서 발행 횟수별 퍼널 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
                    <BarChart3 size={16} color="#3FB5B3" />
                    <h3 style={{ ...typography.sectionTitle, margin: 0 }}>보고서 발행 횟수별 퍼널</h3>
                  </div>

                  {/* 횟수 필터 */}
                  <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: '8px', marginBottom: '16px' }}>
                    {([1, 2, 3] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() => handleReportCountFilterChange(n)}
                        className="rounded-full whitespace-nowrap transition-colors"
                        style={{
                          ...typography.preset,
                          padding: '8px 16px',
                          fontWeight: reportCountFilter === n ? 500 : 400,
                          backgroundColor: reportCountFilter === n ? '#3FB5B3' : '#ffffff',
                          color: reportCountFilter === n ? '#ffffff' : '#666666',
                        }}
                      >
                        {n}회
                      </button>
                    ))}
                    <button
                      onClick={() => handleReportCountFilterChange('custom')}
                      className="rounded-full whitespace-nowrap transition-colors"
                      style={{
                        ...typography.preset,
                        padding: '8px 16px',
                        fontWeight: reportCountFilter === 'custom' ? 500 : 400,
                        backgroundColor: reportCountFilter === 'custom' ? '#3FB5B3' : '#ffffff',
                        color: reportCountFilter === 'custom' ? '#ffffff' : '#666666',
                      }}
                    >
                      직접 입력
                    </button>
                  </div>

                  {/* 직접 입력 필드 */}
                  {reportCountFilter === 'custom' && (
                    <div className="flex gap-2 items-center" style={{ marginBottom: '16px' }}>
                      <input
                        type="number"
                        min={1}
                        value={customReportCountInput}
                        onChange={(e) => setCustomReportCountInput(e.target.value)}
                        placeholder="횟수 입력"
                        style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '14px',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          width: '100px',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => {
                          const n = parseInt(customReportCountInput, 10);
                          if (n >= 1) loadReportCountFunnel(n);
                        }}
                        className="rounded-full transition-colors"
                        style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontSize: '13px',
                          padding: '8px 16px',
                          backgroundColor: '#3FB5B3',
                          color: '#ffffff',
                          fontWeight: 500,
                        }}
                      >
                        조회
                      </button>
                    </div>
                  )}

                  {/* 퍼널 테이블 */}
                  {reportCountFunnelLoading ? (
                    <div className="animate-pulse" style={{ height: '120px', backgroundColor: '#f5f5f5', borderRadius: '8px' }} />
                  ) : reportCountFunnel ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>단계</th>
                            <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>수</th>
                            <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>전환율</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: '보고서 발행', value: reportCountFunnel.totalReports, rate: 100 },
                            { label: '알림톡 발송', value: reportCountFunnel.alimtalkSent, rate: reportCountFunnel.totalReports > 0 ? Math.round(reportCountFunnel.alimtalkSent / reportCountFunnel.totalReports * 1000) / 10 : 0 },
                            { label: '타로 3장 완료', value: reportCountFunnel.tarotCompleted, rate: reportCountFunnel.totalReports > 0 ? Math.round(reportCountFunnel.tarotCompleted / reportCountFunnel.totalReports * 1000) / 10 : 0 },
                            { label: '응원글 작성', value: reportCountFunnel.wroteEncouragement, rate: reportCountFunnel.totalReports > 0 ? Math.round(reportCountFunnel.wroteEncouragement / reportCountFunnel.totalReports * 1000) / 10 : 0 },
                          ].map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 500, color: '#1a1a1a', padding: '10px 12px', borderBottom: '1px solid #f8f8f8' }}>{row.label}</td>
                              <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 600, color: '#3FB5B3', padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #f8f8f8' }}>{row.value.toLocaleString()}</td>
                              <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', fontWeight: 400, color: '#666', padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #f8f8f8' }}>{row.rate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>

                {/* 기간 필터 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                    <Calendar size={16} color="#666" />
                    <span style={{ ...typography.label }}>추세 기간</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto" style={{ paddingBottom: '8px' }}>
                    {REPORT_TREND_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handleReportTrendPresetChange(preset.value)}
                        className="rounded-full whitespace-nowrap transition-colors"
                        style={{
                          ...typography.preset,
                          padding: '8px 16px',
                          fontWeight: reportTrendPreset === preset.value ? 500 : 400,
                          backgroundColor: reportTrendPreset === preset.value ? '#3FB5B3' : '#ffffff',
                          color: reportTrendPreset === preset.value ? '#ffffff' : '#666666',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* 차트: 알림톡 발송율 */}
                {reportTrendData.length > 0 && (
                  <>
                    <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                      <h3 style={{ ...typography.sectionTitle, margin: 0, marginBottom: '16px' }}>알림톡 발송율</h3>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reportTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip content={({ active, payload, label }) => {
                              if (!active || !payload || payload.length === 0) return null;
                              const d = payload[0].payload as ReportTrendData;
                              return (
                                <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '10px 14px', fontFamily: 'Pretendard Variable', fontSize: '13px' }}>
                                  <p style={{ fontWeight: 600, color: '#333', margin: '0 0 6px' }}>{label}</p>
                                  <p style={{ color: '#F97316', margin: '2px 0' }}>알림톡 발송율 : {d.alimtalkRate}%</p>
                                  <p style={{ color: '#666', margin: '2px 0' }}>알림톡 발송 : {d.alimtalkSent}건</p>
                                  <p style={{ color: '#999', margin: '2px 0' }}>보고서 발행 : {d.totalReports}건</p>
                                </div>
                              );
                            }} />
                            <Line type="monotone" dataKey="alimtalkRate" name="알림톡 발송율" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: '#F97316' }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </>
                )}

                {/* 차트: 타로 3장 완료율 */}
                {reportTrendData.length > 0 && (
                  <>
                    <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                      <h3 style={{ ...typography.sectionTitle, margin: 0, marginBottom: '16px' }}>타로 3장 완료율</h3>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reportTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip content={({ active, payload, label }) => {
                              if (!active || !payload || payload.length === 0) return null;
                              const d = payload[0].payload as ReportTrendData;
                              return (
                                <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '10px 14px', fontFamily: 'Pretendard Variable', fontSize: '13px' }}>
                                  <p style={{ fontWeight: 600, color: '#333', margin: '0 0 6px' }}>{label}</p>
                                  <p style={{ color: TREND_COLORS.primary, margin: '2px 0' }}>타로 완료율 : {d.tarotCompletionRate}%</p>
                                  <p style={{ color: '#666', margin: '2px 0' }}>타로 3장 완료 : {d.tarotCompleted}건</p>
                                  <p style={{ color: '#999', margin: '2px 0' }}>보고서 발행 : {d.totalReports}건</p>
                                </div>
                              );
                            }} />
                            <Line type="monotone" dataKey="tarotCompletionRate" name="타로 완료율" stroke={TREND_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.primary }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>

                    {/* 차트 2: 응원글 작성율 */}
                    <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                      <h3 style={{ ...typography.sectionTitle, margin: 0, marginBottom: '16px' }}>응원글 작성율</h3>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={reportTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip content={({ active, payload, label }) => {
                              if (!active || !payload || payload.length === 0) return null;
                              const d = payload[0].payload as ReportTrendData;
                              return (
                                <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '10px 14px', fontFamily: 'Pretendard Variable', fontSize: '13px' }}>
                                  <p style={{ fontWeight: 600, color: '#333', margin: '0 0 6px' }}>{label}</p>
                                  <p style={{ color: TREND_COLORS.secondary, margin: '2px 0' }}>응원글 작성율 : {d.encouragementRate}%</p>
                                  <p style={{ color: '#666', margin: '2px 0' }}>응원글 작성 : {d.wroteEncouragement}건</p>
                                  <p style={{ color: '#999', margin: '2px 0' }}>보고서 발행 : {d.totalReports}건</p>
                                </div>
                              );
                            }} />
                            <Line type="monotone" dataKey="encouragementRate" name="응원글 작성율" stroke={TREND_COLORS.secondary} strokeWidth={2} dot={{ r: 3, fill: TREND_COLORS.secondary }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </section>

                  </>
                )}
              </motion.div>
            )}
          </div>
        )}{/* 보고서 탭 닫기 */}

        {/* ========== 구매 탭 ========== */}
        {selectedTab === '구매' && (
          <div style={{ paddingTop: '16px' }}>
            {/* 구매 퍼널 섹션 */}
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <h2 style={{ ...typography.sectionTitle, margin: 0 }}>결제 퍼널</h2>
              <button
                onClick={copyPurchaseData}
                className="flex items-center justify-center rounded-lg transition-colors active:opacity-80"
                style={{
                  width: '36px', height: '36px',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                }}
              >
                <Copy size={16} color="#666" />
              </button>
            </div>
            <div className="flex gap-2" style={{ marginBottom: '16px' }}>
              {([
                { value: 'this_week' as PurchasePeriodFilter, label: '이번주' },
                { value: 'last_week' as PurchasePeriodFilter, label: '저번주' },
                { value: 'all' as PurchasePeriodFilter, label: '전체' },
              ]).map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handlePurchasePeriodChange(filter.value)}
                  className="rounded-full whitespace-nowrap transition-colors"
                  style={{
                    ...typography.preset,
                    padding: '8px 16px',
                    fontWeight: purchasePeriod === filter.value ? 500 : 400,
                    backgroundColor: purchasePeriod === filter.value ? '#3FB5B3' : '#ffffff',
                    color: purchasePeriod === filter.value ? '#ffffff' : '#666666',
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* 퍼널 테이블 */}
            {purchaseFunnelLoading && (
              <div className="animate-pulse" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', height: '180px', marginBottom: '20px' }} />
            )}
            {!purchaseFunnelLoading && purchaseFunnel && (
              <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>단계</th>
                        <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>수</th>
                        <th style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 500, color: '#999', textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>전환율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const base = purchaseFunnel.paidDetailViews;
                        const adjustedPaymentViews = Math.max(0, purchaseFunnel.paymentViews - purchaseFunnel.freeSproutOrders);
                        return [
                          { label: '유료 상세', value: purchaseFunnel.paidDetailViews, rate: 100 },
                          { label: '결제', value: adjustedPaymentViews, rate: base > 0 ? Math.round(adjustedPaymentViews / base * 1000) / 10 : 0 },
                          { label: '결제 완료', value: purchaseFunnel.completedOrders, rate: base > 0 ? Math.round(purchaseFunnel.completedOrders / base * 1000) / 10 : 0 },
                        ].map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 500, color: '#1a1a1a', padding: '10px 12px', borderBottom: '1px solid #f8f8f8' }}>{row.label}</td>
                            <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 600, color: '#3FB5B3', padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #f8f8f8' }}>{row.value.toLocaleString()}</td>
                            <td style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', fontWeight: 400, color: '#666', padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #f8f8f8' }}>{row.rate}%</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 에러 상태 */}
            {purchaseError && (
              <div className="flex flex-col items-center justify-center" style={{ padding: '48px 0' }}>
                <p style={{ ...typography.label, marginBottom: '16px' }}>{purchaseError}</p>
                <button
                  onClick={() => loadPurchaseData()}
                  className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
                  style={{ ...typography.button, padding: '10px 16px', backgroundColor: '#3FB5B3', color: '#ffffff' }}
                >
                  <RefreshCw size={16} /> 다시 시도
                </button>
              </div>
            )}

            {/* 로딩 상태 */}
            {purchaseLoading && !purchaseError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {/* 데이터 표시 */}
            {!purchaseLoading && !purchaseError && purchaseStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* 섹션 1: 최근 구매 내역 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <div className="flex items-center justify-between">
                    <SectionHeader icon="🛒" title="최근 구매 내역" />
                  </div>

                  {/* 가로+세로 스크롤 테이블 (고정 높이) */}
                  <div style={{ overflow: 'auto', maxHeight: '360px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontFamily: 'Pretendard Variable, sans-serif' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#ffffff' }}>
                        <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>주문일시</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>닉네임</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>콘텐츠</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>카테고리</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>결제금액</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>결제수단</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseStats.recentOrders.map((order, idx) => {
                          const d = new Date(order.orderedAt);
                          const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                          return (
                            <tr key={order.orderId} style={{ borderBottom: idx < purchaseStats.recentOrders.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>{dateStr}</td>
                              <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#333', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.nickname || '-'}</td>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: '#333', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.contentTitle || '-'}</td>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>{order.categoryMain || '-'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 500, color: '#3FB5B3', whiteSpace: 'nowrap' }}>{order.paidAmount.toLocaleString()}원</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>{order.payMethod || '-'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500,
                                  backgroundColor: order.pstatus === 'completed' ? '#E8F5E9' : '#FFF3E0',
                                  color: order.pstatus === 'completed' ? '#2E7D32' : '#E65100',
                                }}>
                                  {order.pstatus === 'completed' ? '완료' : order.pstatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {purchaseStats.recentOrders.length === 0 && (
                    <p style={{ textAlign: 'center', fontSize: '14px', color: '#999', padding: '24px 0' }}>구매 내역이 없습니다.</p>
                  )}
                </section>

                {/* 섹션 2: 고객별 구매 종합 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <SectionHeader icon="📊" title="고객별 구매 종합" />

                  {/* 산점도 차트: X=방문횟수, Y=구매횟수, 점크기=태그수 */}
                  {purchaseStats.customerSummary.length > 0 && (
                    <div style={{ width: '100%', height: 280, marginBottom: '16px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            type="number"
                            dataKey="visitCount"
                            name="방문횟수"
                            tick={{ fontSize: 11, fill: '#999' }}
                            tickLine={false}
                            axisLine={{ stroke: '#f0f0f0' }}
                            label={{ value: '방문횟수', position: 'insideBottom', offset: -2, fontSize: 12, fill: '#999' }}
                          />
                          <YAxis
                            type="number"
                            dataKey="totalPurchases"
                            name="구매횟수"
                            tick={{ fontSize: 11, fill: '#999' }}
                            tickLine={false}
                            axisLine={{ stroke: '#f0f0f0' }}
                            label={{ value: '구매횟수', angle: -90, position: 'insideLeft', offset: 20, fontSize: 12, fill: '#999' }}
                          />
                          <ZAxis type="number" dataKey="totalTags" name="태그수" range={[40, 400]} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }}
                            formatter={(value: number, name: string) => {
                              const label = name === '방문횟수' ? '방문' : name === '구매횟수' ? '구매' : '태그';
                              return [`${value}${name === '태그수' ? '개' : '회'}`, label];
                            }}
                            labelFormatter={() => ''}
                          />
                          <Scatter
                            data={purchaseStats.customerSummary}
                            fill="#3FB5B3"
                            fillOpacity={0.6}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* 가로+세로 스크롤 테이블 (고정 높이) */}
                  <div style={{ overflow: 'auto', maxHeight: '400px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontFamily: 'Pretendard Variable, sans-serif' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#ffffff' }}>
                        <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>닉네임</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>구매횟수</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>총결제액</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>태그수</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>주간태그</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>방문수</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>가입일</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#666', whiteSpace: 'nowrap' }}>마지막접속</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseStats.customerSummary.map((customer, idx) => {
                          const signedUp = customer.signedUpAt ? new Date(customer.signedUpAt) : null;
                          const signedUpStr = signedUp ? `${String(signedUp.getMonth() + 1).padStart(2, '0')}/${String(signedUp.getDate()).padStart(2, '0')}` : '-';
                          const lastLogin = customer.lastLoginAt ? new Date(customer.lastLoginAt) : null;
                          const lastLoginStr = lastLogin ? `${String(lastLogin.getMonth() + 1).padStart(2, '0')}/${String(lastLogin.getDate()).padStart(2, '0')}` : '-';
                          return (
                            <tr key={customer.userId} style={{ borderBottom: idx < purchaseStats.customerSummary.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                              <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#333', whiteSpace: 'nowrap', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.nickname || '-'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#3FB5B3', whiteSpace: 'nowrap' }}>{customer.totalPurchases}회</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 500, color: '#333', whiteSpace: 'nowrap' }}>{customer.totalSpent.toLocaleString()}원</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>{customer.totalTags}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: customer.weeklyTags > 0 ? '#3FB5B3' : '#999', whiteSpace: 'nowrap' }}>{customer.weeklyTags}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>{customer.visitCount}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: '#999', whiteSpace: 'nowrap' }}>{signedUpStr}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px', color: '#999', whiteSpace: 'nowrap' }}>{lastLoginStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {purchaseStats.customerSummary.length === 0 && (
                    <p style={{ textAlign: 'center', fontSize: '14px', color: '#999', padding: '24px 0' }}>구매 고객이 없습니다.</p>
                  )}
                </section>
              </motion.div>
            )}
          </div>
        )}{/* 구매 탭 닫기 */}

        {/* ========== 고객 탭 ========== */}
        {selectedTab === '고객' && (
          <div style={{ paddingTop: '16px' }}>
            {/* 에러 상태 */}
            {customerError && (
              <div className="flex flex-col items-center justify-center" style={{ padding: '48px 0' }}>
                <p style={{ ...typography.label, marginBottom: '16px' }}>{customerError}</p>
                <button
                  onClick={() => loadCustomerData()}
                  className="flex items-center gap-2 rounded-xl transition-colors active:opacity-80"
                  style={{ ...typography.button, padding: '10px 16px', backgroundColor: '#3FB5B3', color: '#ffffff' }}
                >
                  <RefreshCw size={16} />
                  다시 시도
                </button>
              </div>
            )}

            {/* 로딩 상태 */}
            {customerLoading && !customerError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', height: '200px' }} />
                ))}
              </div>
            )}

            {/* 데이터 표시 */}
            {!customerLoading && !customerError && customerStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* 헤더 + 복사 버튼 */}
                <div className="flex items-center justify-between">
                  <h2 style={{ ...typography.sectionTitle, margin: 0 }}>고객 인사이트</h2>
                  <button
                    onClick={copyCustomerData}
                    className="flex items-center justify-center rounded-lg transition-colors active:opacity-80"
                    style={{
                      width: '36px', height: '36px',
                      backgroundColor: '#f5f5f5',
                      border: 'none',
                    }}
                  >
                    <Copy size={16} color="#666" />
                  </button>
                </div>

                {/* 성별 분포 - 도넛 차트 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                  <SectionHeader icon="👤" title="성별 분포" />
                  <div className="flex items-center justify-center" style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '남성', value: customerStats.genderDistribution.male },
                            { name: '여성', value: customerStats.genderDistribution.female },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          <Cell fill="#6366F1" />
                          <Cell fill="#EC4899" />
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} formatter={(value: number) => [`${value}명`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6" style={{ marginTop: '8px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#6366F1' }} />
                      <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', color: '#666' }}>남성 {customerStats.genderDistribution.male}명 ({customerStats.genderDistribution.maleRate}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#EC4899' }} />
                      <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '13px', color: '#666' }}>여성 {customerStats.genderDistribution.female}명 ({customerStats.genderDistribution.femaleRate}%)</span>
                    </div>
                  </div>
                </section>

                {/* 연령대 분포 - 가로 바 차트 */}
                {customerStats.ageGroupDistribution.length > 0 && (
                  <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                    <SectionHeader icon="📊" title="연령대 분포" />
                    <div style={{ width: '100%', height: Math.max(150, customerStats.ageGroupDistribution.length * 40) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customerStats.ageGroupDistribution} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="group" tick={{ fontSize: 13, fill: '#333' }} tickLine={false} axisLine={false} width={45} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} formatter={(value: number, _name: string, props: { payload: { rate: number } }) => [`${value}명 (${props.payload.rate}%)`, '인원']} />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                            {customerStats.ageGroupDistribution.map((_, index) => (
                              <Cell key={`age-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* 나다움 태그 지표 */}
                {customerStats.tagStats && (
                  <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                    <SectionHeader icon="🏷️" title="나다움 태그 지표" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>태그 보유 회원</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#333' }}>{customerStats.tagStats.totalUsersWithTags}<span style={{ fontSize: '12px', color: '#888', fontWeight: 400 }}>명</span></div>
                        <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 600 }}>{customerStats.tagStats.rateWith1Plus}%</div>
                      </div>
                      <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>1인당 평균 태그</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#333' }}>{customerStats.tagStats.avgTagsPerUser}<span style={{ fontSize: '12px', color: '#888', fontWeight: 400 }}>개</span></div>
                      </div>
                      <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>5개 이상 보유</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1' }}>{customerStats.tagStats.rateWith5Plus}%</div>
                      </div>
                      <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>10개 이상 보유</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>{customerStats.tagStats.rateWith10Plus}%</div>
                      </div>
                    </div>
                    {customerStats.tagStats.distribution.length > 0 && (
                      <div style={{ width: '100%', height: Math.max(120, customerStats.tagStats.distribution.length * 40) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={customerStats.tagStats.distribution} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="group" tick={{ fontSize: 12, fill: '#333' }} tickLine={false} axisLine={false} width={55} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} formatter={(value: number, _name: string, props: { payload: { rate: number } }) => [`${value}명 (${props.payload.rate}%)`, '인원']} />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                              {customerStats.tagStats.distribution.map((_, index) => (
                                <Cell key={`tag-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </section>
                )}

                {/* 가입 채널 - 세로 바 차트 */}
                {customerStats.providerDistribution.length > 0 && (
                  <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                    <SectionHeader icon="📱" title="가입 채널" />
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customerStats.providerDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <XAxis dataKey="provider" tick={{ fontSize: 13, fill: '#333' }} tickLine={false} axisLine={{ stroke: '#f0f0f0' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} formatter={(value: number, _name: string, props: { payload: { rate: number } }) => [`${value}명 (${props.payload.rate}%)`, '가입자']} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                            {customerStats.providerDistribution.map((_, index) => (
                              <Cell key={`provider-${index}`} fill={index === 0 ? '#FEE500' : '#4285F4'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* 띠 분포 - 가로 바 차트 */}
                {customerStats.zodiacDistribution.length > 0 && (
                  <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                    <SectionHeader icon="🐉" title="띠 분포" />
                    <div style={{ width: '100%', height: Math.max(200, customerStats.zodiacDistribution.length * 32) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customerStats.zodiacDistribution} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="zodiac" tick={{ fontSize: 12, fill: '#333' }} tickLine={false} axisLine={false} width={60} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} formatter={(value: number, _name: string, props: { payload: { rate: number } }) => [`${value}명 (${props.payload.rate}%)`, '인원']} />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                            {customerStats.zodiacDistribution.map((_, index) => (
                              <Cell key={`zodiac-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* 관계 사주 분포 - 가로 바 차트 */}
                {customerStats.relationshipDistribution.length > 0 && (
                  <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px' }}>
                    <SectionHeader icon="💑" title="관계 사주 분포" />
                    <div style={{ width: '100%', height: Math.max(150, customerStats.relationshipDistribution.length * 36) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={customerStats.relationshipDistribution} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="relationship" tick={{ fontSize: 12, fill: '#333' }} tickLine={false} axisLine={false} width={45} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontFamily: 'Pretendard Variable', fontSize: '13px' }} formatter={(value: number, _name: string, props: { payload: { rate: number } }) => [`${value}건 (${props.payload.rate}%)`, '기록']} />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                            {customerStats.relationshipDistribution.map((_, index) => (
                              <Cell key={`rel-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* 성별 유료 전환율 - 테이블 */}
                <section style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', marginBottom: '40px' }}>
                  <SectionHeader icon="💳" title="성별 유료 전환율" />
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Pretendard Variable, sans-serif' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 500, color: '#666' }}>성별</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666' }}>전체</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666' }}>유료 결제</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: '#666' }}>전환율</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#333' }}>남성</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', color: '#333' }}>{customerStats.paidConversionByGender.male.total}명</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', color: '#3FB5B3', fontWeight: 500 }}>{customerStats.paidConversionByGender.male.paid}명</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', color: '#6366F1', fontWeight: 600 }}>{customerStats.paidConversionByGender.male.rate}%</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500, color: '#333' }}>여성</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', color: '#333' }}>{customerStats.paidConversionByGender.female.total}명</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', color: '#3FB5B3', fontWeight: 500 }}>{customerStats.paidConversionByGender.female.paid}명</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', color: '#EC4899', fontWeight: 600 }}>{customerStats.paidConversionByGender.female.rate}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </motion.div>
            )}
          </div>
        )}{/* 고객 탭 닫기 */}

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
