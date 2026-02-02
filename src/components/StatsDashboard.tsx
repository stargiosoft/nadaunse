/**
 * 통계 대시보드 컴포넌트
 * Master 계정 전용 - 고객/태그/매출 통계 표시
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Home, Users, UserPlus, UserCheck, Eye, Gift, CreditCard, DollarSign, RefreshCw, Calendar, X, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { fetchDashboardStats, fetchGAStats, getDateRangeFromPreset, DashboardStats, GAStats, TagStat, DateRangePreset, DateRangeFilter } from '../lib/statsService';
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
  { value: 'all', label: '전체' }
];

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

export default function StatsDashboard({ onBack, onHome }: StatsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gaStats, setGaStats] = useState<GAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('all');

  // 커스텀 날짜 선택 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [customDateRange, setCustomDateRange] = useState<{ start?: Date; end?: Date }>({});

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
          <header className="shrink-0 z-10 bg-white" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-center justify-between px-3 h-[52px]">
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-full transition-colors active:bg-gray-100"
              >
                <ArrowLeft size={24} color="#333" />
              </button>
              <h1 style={typography.title}>
                통계 대시보드
              </h1>
              <button
                onClick={onHome}
                className="p-2 -mr-2 rounded-full transition-colors active:bg-gray-100"
              >
                <Home size={24} color="#333" />
              </button>
            </div>
          </header>

          {/* 메인 콘텐츠 - 스크롤 영역 (HomePage 패턴) */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
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
                {gaStats?.activeUsers && gaStats.activeUsers > 0 && (
                  <StatCard
                    icon={UserPlus}
                    label="회원가입율"
                    value={Math.round(stats.newCustomers / gaStats.activeUsers * 1000) / 10}
                    unit="%"
                    color="#6366F1"
                    subValue={`GA 방문자 대비 가입`}
                  />
                )}
                <StatCard
                  icon={Eye}
                  label="총 방문횟수"
                  value={stats.totalVisits}
                  unit="회"
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
                    태그 저장율
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
                      {selectedPreset === 'all' ? '총 매출' : '기간 매출'}
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
      </AnimatePresence>
    </>
  );
}
