import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DEV } from '../lib/env';
import { supabase, supabaseUrl } from '../lib/supabase';
import ArrowLeft from './ArrowLeft';
import { preloadTarotImages } from '../lib/tarotImageCache';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import { PageLoader } from './ui/PageLoader';
import emptyStateSvgPaths from "../imports/svg-297vu4q7h0"; // Empty State 아이콘 (둥지)

interface PurchaseItem {
  id: string;
  content_id: string;
  saju_record_id: string | null;
  paid_amount: number;
  pay_method: string | null;
  created_at: string;
  pstatus: string;
  gname: string | null;
  full_name: string | null;
  birth_date: string | null;
  ai_generation_completed: boolean | null;
  master_contents: {
    title: string;
    thumbnail_url: string | null;
    content_type: string;
  } | null;
  saju_records: {
    full_name: string;
    birth_date: string;
  } | null;
}

// ⭐ 무료 콘텐츠 기록 인터페이스
interface FreeContentRecord {
  id: string;
  content_id: string;
  content_title: string | null;
  full_name: string;
  birth_date: string;
  created_at: string;
  // ⭐ question_id, question_order는 optional (구버전 레코드 호환)
  answers: Array<{
    question_id?: string;
    question_order?: number;
    question_text: string;
    answer_text: string;
  }>;
  master_contents: {
    title: string;
    thumbnail_url: string | null;
  } | null;
}

type TabType = 'paid' | 'free';

/**
 * ⭐ 생년월일 포맷팅 함수
 * ISO 형식 또는 YYYY-MM-DD 형식을 YYYY.MM.DD 형식으로 변환
 */
function formatBirthDate(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
  } catch {
    return dateString;
  }
}

interface GroupedPurchases {
  [date: string]: PurchaseItem[];
}

interface GroupedFreeRecords {
  [date: string]: FreeContentRecord[];
}

// ⭐ 빈 둥지 아이콘 컴포넌트 (56x56px, SajuManagementPage 동일)
function EmptyNestIcon() {
  return (
    <svg className="block" style={{ width: '56px', height: '56px' }} fill="none" preserveAspectRatio="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <g id="Icons">
        <path d={emptyStateSvgPaths.p3a144140} fill="var(--fill-0, #E7E7E7)" id="Vector" />
        <path d={emptyStateSvgPaths.p15b23580} fill="var(--fill-0, #D4D4D4)" id="Vector_2" />
        <path d={emptyStateSvgPaths.p3b09d000} fill="var(--fill-0, #D4D4D4)" id="Vector_3" />
        <path d={emptyStateSvgPaths.p1c433500} fill="var(--fill-0, #E7E7E7)" id="Vector_4" />
        <path d={emptyStateSvgPaths.p136e2000} fill="var(--fill-0, #F3F3F3)" id="Vector_5" />
        <path d={emptyStateSvgPaths.p15328600} fill="var(--fill-0, #D4D4D4)" id="Vector_6" />
        <path d={emptyStateSvgPaths.p1d148980} fill="var(--fill-0, #E7E7E7)" id="Vector_7" />
        <path d={emptyStateSvgPaths.p2d904400} fill="var(--fill-0, #F3F3F3)" id="Vector_8" />
      </g>
    </svg>
  );
}

export default function PurchaseHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // ⭐ 탭 상태 및 무료 콘텐츠 기록 (운세 기록에서 돌아올 때 탭 상태 유지)
  const [activeTab, setActiveTab] = useState<TabType>(
    (location.state as { activeTab?: TabType })?.activeTab || 'paid'
  );
  const [freeRecords, setFreeRecords] = useState<FreeContentRecord[]>([]);
  const [freeLoading, setFreeLoading] = useState(false);
  const [devForcePaidEmpty, setDevForcePaidEmpty] = useState(false);
  const [devForceFreeEmpty, setDevForceFreeEmpty] = useState(false);

  // ⭐ 탭바 스크롤 숨김/노출
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // ⭐ 세션 체크
  useEffect(() => {
    const checkSession = async () => {
      if (import.meta.env.DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          const localUser = JSON.parse(localUserJson);
          if (localUser.provider === 'dev') return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSessionExpired(true);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    loadPurchaseHistory();
  }, []);

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);

      // UI TEST 모드 체크
      const isUITestMode = localStorage.getItem('ui_test_mode') === 'true';

      if (isUITestMode) {
        localStorage.removeItem('ui_test_mode');
        const devPurchases = localStorage.getItem('dev_purchase_records');
        if (devPurchases) {
          try {
            const parsedData = JSON.parse(devPurchases);
            setPurchases(parsedData);
            setLoading(false);
            return;
          } catch (e) {
            console.error('❌ [UI TEST] 더미 데이터 파싱 실패:', e);
          }
        }
      }

      // 캐시 체크
      const cacheKey = 'purchase_history_cache';
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - timestamp < fiveMinutes) {
          setPurchases(data);
          setLoading(false);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          content_id,
          saju_record_id,
          paid_amount,
          pay_method,
          created_at,
          pstatus,
          gname,
          full_name,
          birth_date,
          ai_generation_completed,
          master_contents (
            title,
            thumbnail_url,
            content_type
          ),
          saju_records (
            full_name,
            birth_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ 구매내역 조회 실패:', fetchError);
        setError('구매내역을 불러오는데 실패했습니다.');
        setLoading(false);
        return;
      }

      setPurchases(data || []);

      localStorage.setItem(cacheKey, JSON.stringify({
        data: data || [],
        timestamp: Date.now(),
      }));

      setLoading(false);

      // 백그라운드 타로 프리로드
      if (data && data.length > 0) {
        const completedOrders = data.filter((order: PurchaseItem) =>
          order.pstatus === 'completed'
        );
        const recentOrders = completedOrders.slice(0, 10);
        recentOrders.forEach(order => {
          preloadTarotImages(order.id, supabaseUrl).catch(() => {});
        });
      }
    } catch (err) {
      console.error('❌ 구매내역 로드 에러:', err);
      setError('구매내역을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  // ⭐ 무료 콘텐츠 기록 조회 (캐싱 적용)
  const loadFreeContentHistory = async () => {
    try {
      setFreeLoading(true);

      // ⭐ 캐시 갱신 플래그 확인 (새 콘텐츠 생성 시 설정됨)
      const needsRefresh = localStorage.getItem('free_content_needs_refresh') === 'true';

      // 캐시 체크 (5분)
      const cacheKey = 'free_content_history_cache';
      const cached = localStorage.getItem(cacheKey);

      // ⭐ 갱신 플래그가 없고 캐시가 유효하면 캐시 사용
      if (!needsRefresh && cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - timestamp < fiveMinutes) {
          setFreeRecords(data);
          setFreeLoading(false);
          return; // 캐시가 유효하면 DB 조회 생략
        }
      }

      // ⭐ 갱신 플래그 제거 (API 호출 전)
      if (needsRefresh) {
        localStorage.removeItem('free_content_needs_refresh');
        console.log('🔄 [운세기록] 캐시 갱신 플래그 감지 → 새로 로드');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFreeLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('free_content_records')
        .select(`
          id,
          content_id,
          content_title,
          full_name,
          birth_date,
          created_at,
          answers,
          master_contents (
            title,
            thumbnail_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ [무료기록] 조회 실패:', fetchError);
        setFreeLoading(false);
        return;
      }

      setFreeRecords((data as FreeContentRecord[]) || []);

      // 캐시 저장
      localStorage.setItem(cacheKey, JSON.stringify({
        data: data || [],
        timestamp: Date.now(),
      }));

      setFreeLoading(false);
    } catch (err) {
      console.error('❌ [무료기록] 로드 에러:', err);
      setFreeLoading(false);
    }
  };

  // ⭐ 탭 변경 시 무료 기록 로드
  useEffect(() => {
    if (activeTab === 'free') {
      // ⭐ 갱신 플래그가 있거나 데이터가 없으면 로드
      const needsRefresh = localStorage.getItem('free_content_needs_refresh') === 'true';
      if (needsRefresh || freeRecords.length === 0) {
        loadFreeContentHistory();
      }
    }
  }, [activeTab]);

  // ⭐ 스크롤 방향 감지 → 탭바 숨김/노출
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const delta = currentScrollTop - lastScrollTopRef.current;

      if (delta > 4 && currentScrollTop > 52) {
        setIsTabVisible(false);
      } else if (delta < -4) {
        setIsTabVisible(true);
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // ⭐ 탭 전환 시 탭바 노출 + 스크롤 초기화
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsTabVisible(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  // 날짜별 그룹핑
  const groupByDate = (items: PurchaseItem[]): GroupedPurchases => {
    return items.reduce((acc, item) => {
      const date = new Date(item.created_at);
      const formattedDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;

      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push(item);
      return acc;
    }, {} as GroupedPurchases);
  };

  const groupFreeByDate = (items: FreeContentRecord[]): GroupedFreeRecords => {
    return items.reduce((acc, item) => {
      const date = new Date(item.created_at);
      const formattedDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;

      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push(item);
      return acc;
    }, {} as GroupedFreeRecords);
  };

  const groupedPurchases = groupByDate(purchases);
  const groupedFreeRecords = groupFreeByDate(freeRecords);

  const handleBackClick = () => {
    navigate('/profile');
  };

  // ⭐ 유료 콘텐츠 클릭 핸들러
  const handleViewPurchase = async (item: PurchaseItem) => {
    if (item.master_contents?.content_type === 'free') {
      navigate(`/free-saju/${item.id}`);
    } else {
      // ⭐ 해당 콘텐츠에 대해 확정된 태그가 있는지 확인 (나다움 기록하기 여부 결정)
      let hasConfirmedTags = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: confirmedTags, error } = await supabase
            .from('user_trait_tags')
            .select('id')
            .eq('user_id', user.id)
            .eq('source_order_id', item.id)
            .eq('source_type', 'paid_content')
            .eq('is_confirmed', true)
            .limit(1);

          if (!error && confirmedTags && confirmedTags.length > 0) {
            hasConfirmedTags = true;
            console.log('✅ [PurchaseHistoryPage] 유료 콘텐츠 확정된 태그 있음 → 나다움 기록하기 스킵');
          } else {
            console.log('ℹ️ [PurchaseHistoryPage] 유료 콘텐츠 확정된 태그 없음 → 나다움 기록하기 필요');
          }
        }
      } catch (err) {
        console.error('❌ [PurchaseHistoryPage] 유료 콘텐츠 태그 확인 실패:', err);
      }

      // ⭐ 1단계: 캐시 확인 (AI 완료 + 캐시 있으면 즉시 이동)
      const aiCompleted = item.ai_generation_completed === true;
      if (aiCompleted) {
        try {
          const cacheKey = `paid_result_${item.id}`;
          const cachedJson = localStorage.getItem(cacheKey);
          if (cachedJson) {
            const cached = JSON.parse(cachedJson);
            const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;
            const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRY_MS;

            // 캐시 유효 + 타로 모두 완료 → 즉시 이동
            const allTarotViewed = cached.results.every(
              (r: { question_type: string; tarot_user_viewed: boolean | null }) =>
                r.question_type !== 'tarot' || r.tarot_user_viewed === true
            );

            if (!isExpired && cached.results.length > 0) {
              // ⭐ 첫 번째 질문이 미선택 타로인지 확인
              const firstResult = cached.results.find(
                (r: { question_order: number }) => r.question_order === 1
              );
              const isFirstTarotUnviewed = firstResult?.question_type === 'tarot' &&
                !firstResult?.tarot_user_viewed;

              if (isFirstTarotUnviewed) {
                // ⭐ 첫 번째 질문이 미선택 타로 → 바로 셔플 페이지로 이동 (로딩 1회만)
                console.log('🎴 [PurchaseHistoryPage] 첫 타로 미선택 → 바로 셔플 페이지:', item.id);
                navigate(`/tarot/shuffle?orderId=${item.id}&questionOrder=1&contentId=${item.content_id}&from=purchase`, {
                  replace: true
                });
                return;
              }

              if (allTarotViewed) {
                // ⭐ 모든 타로 선택됨 → 결과 페이지로 이동
                console.log('💾 [PurchaseHistoryPage] 캐시 히트 → 즉시 결과 페이지 이동:', item.id);
                preloadTarotImages(item.id, supabaseUrl).catch(() => {});
                navigate(`/result?orderId=${item.id}&questionOrder=1&contentId=${item.content_id}&from=purchase`, {
                  state: {
                    cachedResults: cached.results,
                    cachedContentId: cached.contentId,
                    hasConfirmedTags  // ⭐ 태그 확정 여부 전달
                  }
                });
                return;
              }
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ [PurchaseHistoryPage] 캐시 확인 실패:', cacheError);
        }
      }

      // ⭐ 2단계: 캐시 없으면 기존 로직 (DB 조회)
      try {
        const [questionsResult, resultsResult, firstQuestionResult] = await Promise.all([
          supabase
            .from('master_content_questions')
            .select('id', { count: 'exact', head: true })
            .eq('content_id', item.content_id),
          supabase
            .from('order_results')
            .select('id, orders!inner(user_id)', { count: 'exact', head: true })
            .eq('order_id', item.id),
          // ⭐ 첫 번째 질문의 타로 상태 확인
          supabase
            .from('order_results')
            .select('question_type, tarot_user_viewed, orders!inner(user_id)')
            .eq('order_id', item.id)
            .eq('question_order', 1)
            .single()
        ]);

        if (questionsResult.error) {
          navigate(`/result?orderId=${item.id}&questionOrder=1&contentId=${item.content_id}&from=purchase`, {
            state: { hasConfirmedTags }
          });
          return;
        }

        const totalQuestions = questionsResult.count || 0;
        const completedAnswers = resultsResult.count || 0;

        // ⭐ 첫 번째 질문이 미선택 타로면 바로 셔플 페이지로
        if (firstQuestionResult.data?.question_type === 'tarot' &&
            !firstQuestionResult.data?.tarot_user_viewed) {
          console.log('🎴 [PurchaseHistoryPage] 첫 타로 미선택 (DB) → 바로 셔플 페이지:', item.id);
          navigate(`/tarot/shuffle?orderId=${item.id}&questionOrder=1&contentId=${item.content_id}&from=purchase`, {
            replace: true
          });
          return;
        }

        if (completedAnswers > 0 && (aiCompleted || completedAnswers >= totalQuestions)) {
          preloadTarotImages(item.id, supabaseUrl).catch(() => {});
          navigate(`/result?orderId=${item.id}&questionOrder=1&contentId=${item.content_id}&from=purchase`, {
            state: { hasConfirmedTags }
          });
          return;
        }

        if (completedAnswers > 0 && !aiCompleted && completedAnswers < totalQuestions) {
          navigate(`/loading?orderId=${item.id}&contentId=${item.content_id}&from=purchase`);
          return;
        }

        if (!item.saju_record_id) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: sajuRecords } = await supabase
              .from('saju_records')
              .select('id')
              .eq('user_id', user.id);

            if (sajuRecords && sajuRecords.length > 0) {
              navigate(`/product/${item.content_id}/saju-select?orderId=${item.id}`, {
                state: { canGoBack: true, fromPath: '/purchase-history' }
              });
            } else {
              navigate(`/product/${item.content_id}/birthinfo?orderId=${item.id}`, {
                state: { canGoBack: true, fromPath: '/purchase-history' }
              });
            }
          }
          return;
        }

        navigate(`/loading?orderId=${item.id}&contentId=${item.content_id}&from=purchase`);
      } catch (error) {
        navigate(`/result?orderId=${item.id}&questionOrder=1&contentId=${item.content_id}&from=purchase`, {
          state: { hasConfirmedTags }
        });
      }
    }
  };

  // ⭐ 무료 콘텐츠 클릭 핸들러
  const handleViewFreeRecord = async (record: FreeContentRecord) => {
    // ⭐ 이미 조회한 데이터를 localStorage에 캐시로 저장 (DB 재조회 방지)
    const resultKey = `free_content_${record.content_id}_${record.id}`;
    const cachedData = {
      contentId: record.content_id,
      sajuData: {
        full_name: record.full_name,
        birth_date: record.birth_date
      },
      // ⭐ question_id, question_order가 없는 기존 레코드도 호환되도록 fallback 추가
      results: record.answers?.map((a: { question_id?: string; question_order?: number; question_text: string; answer_text: string }, index: number) => ({
        questionId: a.question_id || `q${index + 1}`,
        questionOrder: a.question_order ?? (index + 1),
        questionText: a.question_text,
        questionType: 'ai',
        previewText: a.answer_text
      })) || [],
      createdAt: record.created_at
    };

    localStorage.setItem(resultKey, JSON.stringify(cachedData));

    // ⭐ 해당 콘텐츠에 대해 확정된 태그가 있는지 확인
    let hasConfirmedTags = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // ⭐ source_order_id로 각 운세 결과별 태그 확정 여부 확인
        // (같은 콘텐츠를 여러 번 봐도 각각 별개의 태그)
        const { data: confirmedTags, error } = await supabase
          .from('user_trait_tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('source_order_id', record.id)  // ⭐ 각 운세 결과별 구분
          .eq('source_type', 'free_content')
          .eq('is_confirmed', true)
          .limit(1);

        if (!error && confirmedTags && confirmedTags.length > 0) {
          hasConfirmedTags = true;
          console.log('✅ [PurchaseHistoryPage] 확정된 태그 있음 → 나다움 기록하기 스킵 (recordId:', record.id, ')');
        } else {
          console.log('ℹ️ [PurchaseHistoryPage] 확정된 태그 없음 → 나다움 기록하기 필요 (recordId:', record.id, ')');
        }
      }
    } catch (err) {
      console.error('❌ [PurchaseHistoryPage] 태그 확인 실패:', err);
    }

    // ⭐ resultKey와 함께 navigate → DB 조회 없이 localStorage에서 바로 읽기
    console.log('📌 [PurchaseHistoryPage] 무료 콘텐츠 이동 시 전달 state:');
    console.log('  - resultKey:', resultKey);
    console.log('  - contentId:', record.content_id);
    console.log('  - hasConfirmedTags:', hasConfirmedTags);

    navigate(`/product/${record.content_id}/result/free`, {
      state: {
        resultKey: resultKey,
        userName: record.full_name,
        recordId: record.id,  // 나다움 태그 저장용
        contentId: record.content_id,  // ⭐ contentId 명시적 전달 (태그 조회용)
        product: {
          id: record.content_id,
          title: record.content_title || record.master_contents?.title || '',
          type: 'free',
          image: record.master_contents?.thumbnail_url || ''
        },
        fromPurchaseHistory: true,  // ⭐ X 버튼 클릭 시 운세 기록으로 복귀
        hasConfirmedTags  // ⭐ 태그 확정 여부 (true면 나다움 기록하기 스킵)
      }
    });
  };

  // 날짜/시간 포맷
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day} (${hours}:${minutes})`;
  };

  if (loading && purchases.length === 0) {
    return <PageLoader />;
  }

  const isPaidEmpty = purchases.length === 0 || devForcePaidEmpty;
  const isFreeEmpty = freeRecords.length === 0 || devForceFreeEmpty;

  return (
    <div className="h-[100dvh] bg-white flex flex-col w-full max-w-[440px] mx-auto overflow-hidden">
      {/* ⭐ Top Navigation */}
      <div className="bg-white h-[52px] relative shrink-0 w-full sticky top-0 z-10">
        <div className="flex flex-col justify-center size-full">
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] h-[52px] z-50 bg-white flex flex-col items-start justify-center px-[12px] py-[4px]">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <ArrowLeft onClick={handleBackClick} />
              <p style={{ fontSize: '18px', fontWeight: 600, lineHeight: '25.5px', letterSpacing: '-0.36px' }} className="basis-0 grow min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-black text-center text-nowrap">
                이용 내역
              </p>
              <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ Tab Bar (스크롤 다운 시 숨김, 스크롤 업 시 노출) */}
      <motion.div
        animate={{ height: isTabVisible ? 'auto' : 0, opacity: isTabVisible ? 1 : 0 }}
        initial={false}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white border-b border-[#f8f8f8] w-full z-40 overflow-hidden shrink-0"
      >
        <div className="flex items-center overflow-clip relative w-full" style={{ padding: '8px 16px' }}>
          {(['paid', 'free'] as TabType[]).map((tab) => (
            <div
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="flex-1 relative cursor-pointer"
              style={{ borderRadius: '12px', WebkitTapHighlightColor: 'transparent' }}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="purchase-tab-indicator"
                  className="absolute inset-0"
                  style={{ backgroundColor: '#f8f8f8', borderRadius: '12px' }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                />
              )}
              <div className="flex items-center justify-center relative z-10" style={{ padding: '8px 16px' }}>
                <span style={{
                  fontSize: '15px',
                  fontWeight: activeTab === tab ? 600 : 500,
                  lineHeight: '20px',
                  letterSpacing: '-0.45px',
                  color: activeTab === tab ? '#151515' : '#999',
                  transition: 'color 0.25s ease',
                }}>
                  {tab === 'paid' ? '심화 운세' : '무료 운세'}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* ===== DEV 전용 빈 화면 테스트 버튼 ===== */}
        {DEV && (
          <div className="flex gap-[8px] px-[20px] py-[6px] bg-white">
            {activeTab === 'paid' && (
              <button
                onClick={() => setDevForcePaidEmpty(v => !v)}
                style={{ fontSize: '11px', color: devForcePaidEmpty ? '#fff' : '#999', backgroundColor: devForcePaidEmpty ? '#ff6b6b' : '#f3f3f3', padding: '3px 8px', borderRadius: '6px' }}
              >
                심화 운세 기록없음
              </button>
            )}
            {activeTab === 'free' && (
              <button
                onClick={() => setDevForceFreeEmpty(v => !v)}
                style={{ fontSize: '11px', color: devForceFreeEmpty ? '#fff' : '#999', backgroundColor: devForceFreeEmpty ? '#ff6b6b' : '#f3f3f3', padding: '3px 8px', borderRadius: '6px' }}
              >
                무료 운세 기록없음
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ⭐ Content */}
      <div ref={scrollContainerRef} className={`flex-1 w-full safe-area-bottom ${
        (activeTab === 'paid' && isPaidEmpty) || (activeTab === 'free' && isFreeEmpty)
          ? 'overflow-hidden flex flex-col items-center'
          : 'overflow-y-auto'
      }`}>

        {/* ===== 심화 해석판 탭 ===== */}
        {activeTab === 'paid' && isPaidEmpty && (
          // Empty State - 심화 해석판
          <motion.div
            className="flex flex-col gap-[36px] items-center w-full px-[20px]"
            style={{ paddingTop: '48px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col gap-[20px] items-center justify-center w-full">
              <EmptyNestIcon />
              <p className="w-full text-center" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '26.5px', letterSpacing: '-0.3px', color: '#B7B7B7' }}>
                아직 운세 기록이 없어요<br />
                운세를 보면 여기에서 다시 확인할 수 있어요
              </p>
            </div>
            <button
              onClick={() => navigate('/best-fortune')}
              className="w-full h-[48px] flex items-center justify-center"
              style={{ backgroundColor: '#48b2af', borderRadius: '20px', border: 'none', transition: 'transform 0.15s ease' }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ fontSize: '15px', fontWeight: 500, lineHeight: '20px', letterSpacing: '-0.45px', color: 'white' }}>
                운세 보러 가기
              </span>
            </button>
          </motion.div>
        )}

        {activeTab === 'paid' && !isPaidEmpty && (
          // Purchase List
          <motion.div
            className="flex flex-col pt-[8px] pb-[60px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Object.entries(groupedPurchases).map(([date, items], index, arr) => (
              <div key={date} className="flex flex-col" style={{ paddingTop: index > 0 ? '10px' : 0 }}>
                {/* Date Section */}
                <div className="flex flex-col items-start w-full">
                  {/* Date Header */}
                  <div className="flex flex-col items-center px-[20px] w-full">
                    <div className="flex items-center justify-between w-full">
                      <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: '28.5px', letterSpacing: '-0.32px', color: 'black' }}>
                        {date}
                      </p>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col items-start w-full">
                    {items.map((item, cardIndex) => (
                      <div key={item.id} className="flex flex-col items-start px-[20px] w-full">
                        <div
                          className={`flex items-start w-full ${cardIndex < items.length - 1 ? 'border-b border-[#f8f8f8]' : ''}`}
                          style={{ gap: '10px', paddingBottom: '11px' }}
                        >
                          {/* Thumbnail */}
                          <div className="shrink-0 w-[73px] pt-[3px]">
                            <div className="relative rounded-[12px] border border-[#f9f9f9] overflow-hidden" style={{ aspectRatio: '80/54' }}>
                              {item.master_contents?.thumbnail_url ? (
                                <img
                                  alt={item.gname || item.master_contents.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  src={item.master_contents.thumbnail_url}
                                />
                              ) : (
                                <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span style={{ fontSize: '24px' }}>🔮</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="flex flex-col gap-[3px] items-start flex-1 min-w-0">
                            {/* Title + Price */}
                            <div className="flex flex-col items-start w-full">
                              {item.content_id ? (
                                <motion.button
                                  onClick={() => handleViewPurchase(item)}
                                  whileTap="tap"
                                  className="flex items-center py-[2px] px-[2px] rounded-[8px] text-left"
                                  initial={{ backgroundColor: 'transparent' }}
                                  variants={{ tap: { backgroundColor: '#F0F8FF' } }}
                                >
                                  <motion.span
                                    variants={{ tap: { color: '#3a8ad4' } }}
                                    style={{
                                      fontSize: '14px',
                                      fontWeight: 400,
                                      lineHeight: '22px',
                                      letterSpacing: '-0.42px',
                                      color: '#4DA0EE',
                                      textDecoration: 'underline'
                                    }}
                                    className="line-clamp-2"
                                  >
                                    {item.gname || item.master_contents?.title || '운세 구성'}
                                  </motion.span>
                                </motion.button>
                              ) : (
                                <div className="flex items-center p-[2px]">
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    lineHeight: '22px',
                                    letterSpacing: '-0.42px',
                                    color: '#525252'
                                  }} className="line-clamp-2">
                                    {item.gname || '새싹 충전'}
                                  </span>
                                </div>
                              )}
                              {/* Price */}
                              <div className="flex items-center pl-[2px]" style={{ marginTop: '-1px' }}>
                                <p style={{
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  lineHeight: '22px',
                                  color: 'black'
                                }}>
                                  {item.pay_method === 'sprout'
                                    ? `${item.paid_amount}새싹`
                                    : `${item.paid_amount.toLocaleString()}원`}
                                </p>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex flex-col gap-[2px] items-start w-full" style={{ marginTop: '-2px' }}>
                              {(item.full_name || item.saju_records?.full_name) && (
                                <div className="flex items-center px-[2px] w-full">
                                  <p style={{
                                    fontSize: '12px',
                                    fontWeight: 400,
                                    lineHeight: '16px',
                                    letterSpacing: '-0.24px',
                                    color: '#999'
                                  }} className="truncate">
                                    풀이 대상 : {item.full_name || item.saju_records?.full_name} ({formatBirthDate(item.birth_date || item.saju_records?.birth_date)})
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center px-[2px] w-full">
                                <p style={{
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  lineHeight: '16px',
                                  letterSpacing: '-0.24px',
                                  color: '#999'
                                }} className="truncate">
                                  구매 일시 : {formatDateTime(item.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider between date groups */}
                {index < arr.length - 1 && (
                  <div className="w-full h-[4px] bg-[#f9f9f9] mt-[4px]" />
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* ===== 무료 체험판 탭 ===== */}
        {activeTab === 'free' && freeLoading && (
          <div className="flex items-center justify-center h-full">
            <PageLoader />
          </div>
        )}

        {activeTab === 'free' && !freeLoading && isFreeEmpty && (
          // Empty State - 무료 체험판
          <motion.div
            className="flex flex-col gap-[36px] items-center w-full px-[20px]"
            style={{ paddingTop: '48px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col gap-[20px] items-center justify-center w-full">
              <EmptyNestIcon />
              <p className="w-full text-center" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '26.5px', letterSpacing: '-0.3px', color: '#B7B7B7' }}>
                아직 운세 기록이 없어요<br />
                운세를 보면 여기에서 다시 확인할 수 있어요
              </p>
            </div>
            <button
              onClick={() => navigate('/best-fortune')}
              className="w-full h-[48px] flex items-center justify-center"
              style={{ backgroundColor: '#48b2af', borderRadius: '20px', border: 'none', transition: 'transform 0.15s ease' }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ fontSize: '15px', fontWeight: 500, lineHeight: '20px', letterSpacing: '-0.45px', color: 'white' }}>
                운세 보러 가기
              </span>
            </button>
          </motion.div>
        )}

        {activeTab === 'free' && !freeLoading && !isFreeEmpty && (
          // Free Content List
          <motion.div
            className="flex flex-col pt-[8px] pb-[60px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Object.entries(groupedFreeRecords).map(([date, items], index, arr) => (
              <div key={date} className="flex flex-col" style={{ paddingTop: index > 0 ? '10px' : 0 }}>
                {/* Date Section */}
                <div className="flex flex-col items-start w-full">
                  {/* Date Header */}
                  <div className="flex flex-col items-center px-[20px] w-full">
                    <div className="flex items-center justify-between w-full">
                      <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: '28.5px', letterSpacing: '-0.32px', color: 'black' }}>
                        {date}
                      </p>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col items-start w-full">
                    {items.map((record, cardIndex) => (
                      <div key={record.id} className="flex flex-col items-start px-[20px] w-full">
                        <div
                          className={`flex items-start w-full ${cardIndex < items.length - 1 ? 'border-b border-[#f8f8f8]' : ''}`}
                          style={{ gap: '10px', paddingBottom: '11px' }}
                        >
                          {/* Thumbnail */}
                          <div className="shrink-0 w-[73px] pt-[3px]">
                            <div className="relative rounded-[12px] border border-[#f9f9f9] overflow-hidden" style={{ aspectRatio: '80/54' }}>
                              {record.master_contents?.thumbnail_url ? (
                                <img
                                  alt={record.content_title || record.master_contents.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  src={record.master_contents.thumbnail_url}
                                />
                              ) : (
                                <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span style={{ fontSize: '24px' }}>🔮</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="flex flex-col gap-[3px] items-start flex-1 min-w-0">
                            {/* Title */}
                            <div className="flex flex-col items-start w-full">
                              <motion.button
                                onClick={() => handleViewFreeRecord(record)}
                                whileTap="tap"
                                className="flex items-center py-[2px] px-[2px] rounded-[8px] text-left"
                                variants={{ tap: { backgroundColor: '#F0F8FF' } }}
                              >
                                <motion.span
                                  variants={{ tap: { color: '#3a8ad4' } }}
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 400,
                                    lineHeight: '22px',
                                    letterSpacing: '-0.42px',
                                    color: '#4DA0EE',
                                    textDecoration: 'underline'
                                  }}
                                  className="line-clamp-2"
                                >
                                  {record.content_title || record.master_contents?.title || ''}
                                </motion.span>
                              </motion.button>
                            </div>

                            {/* Details */}
                            <div className="flex flex-col gap-[2px] items-start w-full">
                              <div className="flex items-center px-[2px] w-full">
                                <p style={{
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  lineHeight: '16px',
                                  letterSpacing: '-0.24px',
                                  color: '#999'
                                }} className="truncate">
                                  풀이 대상 : {record.full_name} ({formatBirthDate(record.birth_date)})
                                </p>
                              </div>
                              <div className="flex items-center px-[2px] w-full">
                                <p style={{
                                  fontSize: '12px',
                                  fontWeight: 400,
                                  lineHeight: '16px',
                                  letterSpacing: '-0.24px',
                                  color: '#999'
                                }} className="truncate">
                                  이용 일시 : {formatDateTime(record.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider between date groups */}
                {index < arr.length - 1 && (
                  <div className="w-full h-[4px] bg-[#f9f9f9] mt-[4px]" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <SessionExpiredDialog isOpen={isSessionExpired} />
    </div>
  );
}
