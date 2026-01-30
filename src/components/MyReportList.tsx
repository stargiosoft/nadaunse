import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEV } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import svgPaths from "@/imports/svg-o5jcc01aog";
import ArrowLeft from './ArrowLeft';
import NavigationTabBar from './NavigationTabBar';
import MyReportEmpty from './MyReportEmpty';
import MyReportWeekly, { MonthlyReport } from './MyReportWeekly';

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

const reportData: MonthlyReport[] = [
  {
    id: '2026-05',
    title: '26년 5월 보고서',
    reports: [
      {
        id: '2026-05-04',
        title: '4주차 보고서',
        period: '2026.05.25 ~ 05.31',
        tags: [
          { label: '# 결단력 있는' },
          { label: '# 책임감이 강한' },
          { label: '# 상황을 주도하는' }
        ],
        extraTagsCount: 3,
        message: {
          label: '이번 주 나에게 :',
          content: '이번 주도 고생했어. 혼자 애쓴 부분들, 내가 다 알고 있어\n괜찮다고 더 버텨보자고 애썼다고 칭찬해주고 싶어'
        }
      }
    ]
  },
  {
    id: '2026-04',
    title: '26년 4월 보고서',
    reports: [
      {
        id: '2026-04-03',
        title: '3주차 보고서',
        period: '2026.04.14 ~ 04.20',
        tags: [
          { label: '# 결단력 있는' },
          { label: '# 책임감이 강한' },
          { label: '# 상황을 주도하는' }
        ],
        extraTagsCount: 8,
        message: {
          label: '이번 주 나에게 :',
          content: '봄바람처럼 설레는 일이 생길지도 몰라.\n작은 변화를 즐기면서 너만의 속도로 나아가면 돼.'
        }
      }
    ]
  },
  {
    id: '2026-03',
    title: '26년 3월 보고서',
    reports: [
      {
        id: '2026-03-04',
        title: '4주차 보고서',
        period: '2026.03.25 ~ 03.31',
        tags: [
          { label: '# 섬세한' },
          { label: '# 감각적인' },
          { label: '# 창의적인' }
        ],
        extraTagsCount: 5,
        message: {
          label: '이번 주 나에게 :',
          content: '따뜻한 햇살처럼 기분 좋은 소식이 기다리고 있어.\n긍정적인 마음으로 주변을 둘러봐.'
        }
      },
      {
        id: '2026-03-03',
        title: '3주차 보고서',
        period: '2026.03.18 ~ 03.24',
        tags: [
          { label: '# 침착한' },
          { label: '# 꾸준한' },
          { label: '# 노력하는' }
        ],
        extraTagsCount: 2
      },
      {
        id: '2026-03-02',
        title: '2주차 보고서',
        period: '2026.03.11 ~ 03.17',
        tags: [
          { label: '# 열정적인' },
          { label: '# 긍정적인' },
          { label: '# 활기찬' }
        ],
        extraTagsCount: 4,
        message: {
          label: '이번 주 나에게 :',
          content: '작은 성취들이 모여 큰 꿈을 이룰 거야.\n지금처럼 꾸준히 나아가면 돼.'
        }
      },
      {
        id: '2026-03-01',
        title: '1주차 보고서',
        period: '2026.03.04 ~ 03.10',
        tags: [
          { label: '# 새로운' },
          { label: '# 도전적인' },
          { label: '# 용기있는' }
        ],
        extraTagsCount: 1
      }
    ]
  },
  {
    id: '2026-02',
    title: '26년 2월 보고서',
    reports: [
      {
        id: '2026-02-04',
        title: '4주차 보고서',
        period: '2026.02.22 ~ 02.28',
        tags: [
          { label: '# 성실한' },
          { label: '# 끈기있는' },
          { label: '# 노력하는' }
        ],
        extraTagsCount: 2,
        message: {
          label: '이번 주 나에게 :',
          content: '겨울의 끝자락에서 너의 노력이 결실을 맺고 있어.\n조금만 더 힘내면 원하던 목표에 닿을 수 있을 거야.'
        }
      },
      {
        id: '2026-02-03',
        title: '3주차 보고서',
        period: '2026.02.15 ~ 02.21',
        tags: [
          { label: '# 차분한' },
          { label: '# 사려깊은' },
          { label: '# 이해심 많은' }
        ],
        extraTagsCount: 3
      },
      {
        id: '2026-02-02',
        title: '2주차 보고서',
        period: '2026.02.08 ~ 02.14',
        tags: [
          { label: '# 명랑한' },
          { label: '# 쾌활한' },
          { label: '# 즐거운' }
        ],
        extraTagsCount: 0,
        message: {
          label: '이번 주 나에게 :',
          content: '너의 밝은 에너지가 주변 사람들에게 힘이 되고 있어.\n너 스스로도 그 에너지를 즐겨봐.'
        }
      },
      {
        id: '2026-02-01',
        title: '1주차 보고서',
        period: '2026.02.01 ~ 02.07',
        tags: [
          { label: '# 단호한' },
          { label: '# 확실한' },
          { label: '# 믿음직한' }
        ],
        extraTagsCount: 5
      }
    ]
  },
  {
    id: '2026-01',
    title: '26년 1월 보고서',
    reports: [
      {
        id: '2026-01-04',
        title: '4주차 보고서',
        period: '2026.01.25 ~ 01.31',
        tags: [
          { label: '# 새로운' },
          { label: '# 희망찬' },
          { label: '# 열정적인' }
        ],
        extraTagsCount: 4,
        message: {
          label: '이번 주 나에게 :',
          content: '새해의 다짐들이 작심삼일이 되지 않도록,\n오늘 하루도 알차게 보낸 너를 칭찬해.'
        }
      },
      {
        id: '2026-01-03',
        title: '3주차 보고서',
        period: '2026.01.18 ~ 01.24',
        tags: [
          { label: '# 계획적인' },
          { label: '# 치밀한' },
          { label: '# 꼼꼼한' }
        ],
        extraTagsCount: 2
      },
      {
        id: '2026-01-02',
        title: '2주차 보고서',
        period: '2026.01.11 ~ 01.17',
        tags: [
          { label: '# 창의적인' },
          { label: '# 독창적인' },
          { label: '# 기발한' }
        ],
        extraTagsCount: 6,
        message: {
          label: '이번 주 나에게 :',
          content: '너의 새로운 아이디어들이 빛을 발할 거야.\n자신감을 가지고 도전해봐.'
        }
      },
      {
        id: '2026-01-01',
        title: '1주차 보고서',
        period: '2026.01.04 ~ 01.10',
        tags: [
          { label: '# 시작하는' },
          { label: '# 설레는' },
          { label: '# 기대되는' }
        ],
        extraTagsCount: 1
      }
    ]
  }
];

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
          hasValidCache: true
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
    hasValidCache: false
  };
}

export default function MyReportList({ onBack, onTabChange, onReportClick, forceEmptyState = false }: MyReportListProps) {
  const navigate = useNavigate();

  // 🚀 동기적 캐시 초기화 (useState 초기화 시점에 캐시 로드)
  const initialState = getInitialCacheState();

  const [reports, setReports] = useState<MonthlyReport[]>(
    forceEmptyState ? [] : (initialState.hasAnyTags ? reportData : [])
  );
  const [activeTab, setActiveTab] = useState(1); // "나의 분석 보고서" 탭이 기본 활성화
  const [currentWeekTagsCount, setCurrentWeekTagsCount] = useState(initialState.currentWeekTagsCount);
  const [isLoading, setIsLoading] = useState(forceEmptyState ? false : initialState.isLoading);
  const [hasAnyTags, setHasAnyTags] = useState(initialState.hasAnyTags);

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

        if (!hasAnyTagsNow) {
          setReports([]);
        }

        // 🚀 캐시에 저장 (만료 시간 포함)
        localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
          currentWeekTagsCount: weeklyTagCount,
          hasAnyTags: hasAnyTagsNow,
          timestamp: Date.now()
        }));
        console.log('💾 [MyReportList] 캐시 저장 완료');

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
  }, [forceEmptyState]);

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

        // 캐시 업데이트
        localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
          currentWeekTagsCount: weeklyTagCount,
          hasAnyTags: hasAnyTagsNow,
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
  }, []);

  const handleTabChange = (index: number) => {
    if (index === 0) {
      // 프로필 탭 클릭 시 마이페이지로 이동
      navigate('/profile');
      return;
    }
    setActiveTab(index);
    onTabChange?.(index);
  };

  const handleDevNoTags = () => {
    setCurrentWeekTagsCount(0);
    setHasAnyTags(true); // 전체 태그는 있지만 이번 주 태그만 없음
    setReports(reportData);
    // 캐시도 업데이트
    localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
      currentWeekTagsCount: 0,
      hasAnyTags: true,
      timestamp: Date.now()
    }));
  };

  const handleDevManyTags = () => {
    setCurrentWeekTagsCount(6);
    setHasAnyTags(true);
    setReports(reportData);
    // 캐시도 업데이트
    localStorage.setItem(MY_REPORT_CACHE_KEY, JSON.stringify({
      currentWeekTagsCount: 6,
      hasAnyTags: true,
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

  // ⭐ DEV: 알림톡 발송 테스트 (보고서 알림톡)
  const [isSendingAlimtalk, setIsSendingAlimtalk] = useState(false);
  const handleDevSendAlimtalk = async () => {
    if (isSendingAlimtalk) return;

    try {
      setIsSendingAlimtalk(true);
      console.log('📱 [DEV] 알림톡 발송 시작...');

      // 1. 현재 로그인한 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 2. 사주 정보에서 '본인' 레코드의 전화번호 조회
      const { data: sajuRecords, error: sajuError } = await supabase
        .from('saju_records')
        .select('id, full_name, phone_number, notes')
        .eq('user_id', user.id)
        .eq('notes', '본인')
        .single();

      if (sajuError || !sajuRecords) {
        console.error('❌ [DEV] 사주 정보 조회 실패:', sajuError);
        alert('본인 사주 정보를 찾을 수 없습니다.\n사주 정보를 먼저 등록해주세요.');
        return;
      }

      const phoneNumber = sajuRecords.phone_number;
      if (!phoneNumber) {
        alert('전화번호가 등록되지 않았습니다.\n사주 정보에서 전화번호를 등록해주세요.');
        return;
      }

      console.log('📱 [DEV] 전화번호:', phoneNumber);
      console.log('📱 [DEV] 사용자 이름:', sajuRecords.full_name);

      // 3. send-alimtalk Edge Function 호출 (테스트용)
      // ⚠️ 실제 보고서 알림톡은 별도 템플릿 필요 (현재는 구매 완료 템플릿 사용)
      const { data, error } = await supabase.functions.invoke('send-alimtalk', {
        body: {
          orderId: `dev_report_${Date.now()}`, // 테스트용 더미 orderId
          userId: user.id,
          mobile: phoneNumber,
          customerName: sajuRecords.full_name,
          contentId: 'weekly_report_test' // 테스트용 더미 contentId
        }
      });

      if (error) {
        console.error('❌ [DEV] 알림톡 발송 실패:', error);
        alert(`알림톡 발송 실패: ${error.message}`);
        return;
      }

      console.log('✅ [DEV] 알림톡 발송 결과:', data);

      if (data?.success) {
        alert(`✅ 알림톡 발송 성공!\n\n수신번호: ${phoneNumber}\n이름: ${sajuRecords.full_name}`);
      } else {
        alert(`알림톡 발송 실패: ${data?.error || '알 수 없는 오류'}`);
      }

    } catch (error) {
      console.error('❌ [DEV] 알림톡 발송 오류:', error);
      alert(`알림톡 발송 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSendingAlimtalk(false);
    }
  };

  // Filter for Jan-March reports for the list (더미 데이터용)
  const filteredReports = reports.filter(month =>
    ['2026-01', '2026-02', '2026-03'].includes(month.id)
  );

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
              <ArrowLeft onClick={onBack || (() => window.history.back())} />
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
                onReportClick={onReportClick}
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
                  {isSendingAlimtalk ? '발송 중...' : '📱 알림톡 발송 (DEV)'}
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
