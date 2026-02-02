import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEV } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import svgPaths from "@/imports/svg-o5jcc01aog";
import ArrowLeft from './ArrowLeft';
import NavigationTabBar from './NavigationTabBar';
import MyReportEmpty from './MyReportEmpty';
import MyReportWeekly, { MonthlyReport, WeeklyReport } from './MyReportWeekly';

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

    // soul_prescription 섹션에서 메시지 추출
    const soulSection = sections.get(report.id);
    let message: { label: string; content: string } | undefined;
    if (soulSection?.content?.content_paragraphs?.length) {
      message = {
        label: '이번 주 나에게 :',
        content: soulSection.content.content_paragraphs[0] || ''
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
const MY_REPORT_CACHE_KEY = 'my_report_cache';
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

export default function MyReportList({ onBack, onTabChange, onReportClick, forceEmptyState = false }: MyReportListProps) {
  const navigate = useNavigate();

  // 🚀 동기적 캐시 초기화 (useState 초기화 시점에 캐시 로드)
  const initialState = getInitialCacheState();

  const [reports, setReports] = useState<MonthlyReport[]>(initialState.reports);
  const [activeTab, setActiveTab] = useState(1); // "나의 분석 보고서" 탭이 기본 활성화
  const [currentWeekTagsCount, setCurrentWeekTagsCount] = useState(initialState.currentWeekTagsCount);
  const [isLoading, setIsLoading] = useState(forceEmptyState ? false : !initialState.hasValidCache);
  const [hasAnyTags, setHasAnyTags] = useState(initialState.hasAnyTags);

  // ⭐ 주간 보고서 목록 조회 함수
  const fetchWeeklyReports = useCallback(async (userId: string) => {
    try {
      console.log('📊 [MyReportList] 주간 보고서 조회 시작...');

      // 1. 완료된 주간 보고서 목록 조회
      const { data: dbReports, error: reportsError } = await supabase
        .from('weekly_reports')
        .select('id, year, month, week, week_start_date, week_end_date, tag_count, situation_summary, published_at')
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
        // 🚀 캐시가 유효하면 API 호출 스킵 (백그라운드 갱신만)
        const needsRefresh = localStorage.getItem('my_report_needs_refresh') === 'true';
        if (initialState.hasValidCache && !needsRefresh) {
          console.log('✅ [MyReportList] 유효한 캐시 존재 → API 호출 스킵');
          return;
        }

        if (needsRefresh) {
          localStorage.removeItem('my_report_needs_refresh');
          console.log('🔄 [MyReportList] refresh 플래그 감지 → API 호출');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('📭 [MyReportList] 로그인 안됨');
          setIsLoading(false);
          return;
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
      // 프로필 탭 클릭 시 마이페이지로 이동
      navigate('/profile');
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
              // 로딩 상태
              <div className="flex items-center justify-center w-full" style={{ padding: '80px 20px' }}>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-[#48b2af] border-t-transparent rounded-full animate-spin" />
                  <p style={{ fontFamily: 'Pretendard Variable', fontSize: '14px', color: '#999' }}>
                    불러오는 중...
                  </p>
                </div>
              </div>
            ) : isInitialEmptyState ? (
              <MyReportEmpty />
            ) : (
              <MyReportWeekly
                currentWeekTagsCount={currentWeekTagsCount}
                filteredReports={filteredReports}
                onReportClick={handleReportClick}
              />
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
                {/* ⭐ 알림톡 발송 DEV 버튼 */}
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
              </div>
            )}

            {!isInitialEmptyState && <div style={{ height: '20px' }} />}
            <Footer />
          </div>
        </div>

      </div>
    </div>
  );
}
