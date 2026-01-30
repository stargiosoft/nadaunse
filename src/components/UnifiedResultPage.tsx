import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { getTarotCardImageUrl } from '../lib/tarotCards';
import { getCachedTarotImage, cacheTarotImage, getMemoryCachedBlobUrl } from '../lib/tarotImageCache';
import TableOfContentsBottomSheet from './TableOfContentsBottomSheet';
import { BottomNavigation } from './BottomNavigation';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import { PageLoader } from './ui/PageLoader';
import { trackPaidResultView, trackPaidResultComplete, trackPageView } from '../utils/analytics';

interface ResultItem {
  question_order: number;
  question_text: string;
  gpt_response: string;
  question_type: 'saju' | 'tarot';
  tarot_card_name: string | null;
  tarot_card_image_url: string | null;
  tarot_user_viewed: boolean | null;
}

/**
 * 통합 결과 페이지
 * - 사주/타로 결과를 하나의 컴포넌트에서 처리
 * - 모든 질문 전환에 일관된 슬라이드 애니메이션 적용
 */
export default function UnifiedResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const questionOrderParam = searchParams.get('questionOrder') || searchParams.get('startPage') || '1';
  const contentIdParam = searchParams.get('contentId');
  const from = searchParams.get('from');

  // ⭐ PurchaseHistoryPage에서 전달받은 캐시 데이터 (즉시 렌더링용)
  const cachedResultsFromState = (location.state as { cachedResults?: ResultItem[] })?.cachedResults;
  const cachedContentIdFromState = (location.state as { cachedContentId?: string })?.cachedContentId;
  // ⭐ 이미 태그 확정됨 (나다움 기록하기 스킵 여부)
  const hasConfirmedTags = (location.state as { hasConfirmedTags?: boolean })?.hasConfirmedTags === true;
  // ⭐ TarotShufflePage에서 방금 선택 완료한 경우 (DB 업데이트 타이밍 이슈 해결)
  const tarotJustSelected = (location.state as { tarotJustSelected?: boolean })?.tarotJustSelected === true;
  const selectedQuestionOrder = (location.state as { selectedQuestionOrder?: number })?.selectedQuestionOrder;

  // ⭐ 초기화 시 캐시 확인 (state 없으면 localStorage 체크)
  const getInitialCacheData = (): { results: ResultItem[]; contentId: string | null } => {
    // 1. state에서 전달받은 캐시 우선 (question_order 타입 정규화)
    if (cachedResultsFromState && cachedResultsFromState.length > 0) {
      const normalizedResults = cachedResultsFromState.map(r => ({
        ...r,
        question_order: Number(r.question_order)
      }));
      console.log('💾 [UnifiedResultPage] 초기화 시 state 캐시 히트');
      return { results: normalizedResults, contentId: cachedContentIdFromState || null };
    }
    // 2. localStorage 캐시 확인
    if (orderId) {
      try {
        const cacheKey = `paid_result_${orderId}`;
        const cachedJson = localStorage.getItem(cacheKey);
        if (cachedJson) {
          const cached = JSON.parse(cachedJson);
          const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;
          const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRY_MS;
          const allTarotViewed = cached.results.every(
            (r: ResultItem) => r.question_type !== 'tarot' || r.tarot_user_viewed === true
          );
          if (!isExpired && allTarotViewed && cached.results.length > 0) {
            // ⭐ question_order 타입 정규화 (JSON.parse 후 number 보장)
            const normalizedResults = cached.results.map((r: ResultItem) => ({
              ...r,
              question_order: Number(r.question_order)
            }));
            console.log('💾 [UnifiedResultPage] 초기화 시 localStorage 캐시 히트');
            return { results: normalizedResults, contentId: cached.contentId };
          }
        }
      } catch (e) {
        // 무시
      }
    }
    return { results: [], contentId: null };
  };

  const initialCache = getInitialCacheData();

  // ⭐ 현재 질문 순서 (내부 상태로 관리하여 모든 전환에 애니메이션 적용)
  const [currentQuestionOrder, setCurrentQuestionOrder] = useState(parseInt(questionOrderParam));
  // ⭐ 캐시 데이터가 있으면 즉시 사용 (로딩 없이 렌더링)
  const [allResults, setAllResults] = useState<ResultItem[]>(initialCache.results);
  const [loading, setLoading] = useState(initialCache.results.length === 0);
  const [contentId, setContentId] = useState<string | null>(contentIdParam || initialCache.contentId);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // ⭐ 세션 체크 상태
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isWrongAccount, setIsWrongAccount] = useState(false);

  // ⭐ 타로 이미지 관련 상태 (캐시 데이터 있으면 shimmer 스킵)
  const [cardImageUrl, setCardImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(initialCache.results.length === 0);
  const [imageError, setImageError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false); // 폴백 시도 여부
  const [retryCount, setRetryCount] = useState(0); // 재시도 횟수

  // ⭐ 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ⭐ 타로 이미지 ref (이미 로드된 이미지 감지용)
  const tarotImageRef = useRef<HTMLImageElement>(null);

  // ⭐ 이전 Blob URL ref (메모리 누수 방지용)
  const previousBlobUrlRef = useRef<string | null>(null);

  // ⭐ 태그 추출 관련 상태 (나다움 기록하기용)
  const [extractedTags, setExtractedTags] = useState<{ name: string; type: 'positive' | 'negative' | 'neutral' }[]>([]);
  const [isTagExtracted, setIsTagExtracted] = useState(false);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const hasTagExtractionStarted = useRef(false);  // ⭐ 중복 실행 방지
  const [hasConfirmedTagsFromDB, setHasConfirmedTagsFromDB] = useState(false);  // ⭐ DB에서 확인된 태그 여부 (스킵 포함)

  // ⭐ URL 쿼리 파라미터 변경 감지 + 타로 셔플 리다이렉트 체크
  useEffect(() => {
    const newQuestionOrder = parseInt(questionOrderParam);
    if (!isNaN(newQuestionOrder) && newQuestionOrder !== currentQuestionOrder) {
      console.log('📍 [UnifiedResultPage] URL 파라미터 변경 감지:', currentQuestionOrder, '→', newQuestionOrder);
      setCurrentQuestionOrder(newQuestionOrder);

      // ⭐ allResults가 있을 때만 타로 셔플 체크
      // ⭐ tarotJustSelected: TarotShufflePage에서 방금 선택 완료한 경우 스킵
      if (allResults.length > 0) {
        const targetResult = allResults.find(r => r.question_order === newQuestionOrder);
        const justSelectedThisQuestion = tarotJustSelected && selectedQuestionOrder === newQuestionOrder;
        if (targetResult?.question_type === 'tarot' && !targetResult?.tarot_user_viewed && !justSelectedThisQuestion) {
          console.log('🎴 [UnifiedResultPage] URL 파라미터 변경 → 타로 미선택 → 셔플 페이지');
          const fromParam = from ? `&from=${from}` : '';
          const contentIdStr = contentId ? `&contentId=${contentId}` : '';
          navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${newQuestionOrder}${contentIdStr}${fromParam}`, { replace: true });
        }
      }
    }
  }, [questionOrderParam, allResults, contentId, from, orderId, navigate, tarotJustSelected, selectedQuestionOrder]);

  // ⭐ 세션 체크
  useEffect(() => {
    const checkSession = async () => {
      console.log('🔐 [UnifiedResultPage] 세션 체크 시작...');

      if (import.meta.env.DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          const localUser = JSON.parse(localUserJson);
          if (localUser.provider === 'dev') {
            console.log('🔧 [UnifiedResultPage] DEV 모드 - 세션 체크 스킵');
            setHasValidSession(true);
            setIsCheckingSession(false);
            return;
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const currentUrl = `${location.pathname}${location.search}`;
        console.log('🔐 [UnifiedResultPage] 세션 없음 → 로그인 페이지로 리다이렉트');
        localStorage.setItem('redirectAfterLogin', currentUrl);
        navigate('/login/new', { replace: true });
        return;
      }

      console.log('✅ [UnifiedResultPage] 세션 유효:', user.id);
      setHasValidSession(true);
      setIsCheckingSession(false);
    };

    checkSession();
  }, [navigate, location.pathname, location.search]);

  // ⭐ 첫 번째 질문에서 뒤로가기 감지
  useEffect(() => {
    if (currentQuestionOrder !== 1) return;
    if (!contentId) return;

    window.history.pushState({ unifiedResultPage: true }, '');

    const handlePopState = () => {
      if (from === 'purchase') {
        console.log('🔙 [UnifiedResultPage] 뒤로가기 → 구매내역');
        navigate('/purchase-history', { replace: true });
      } else {
        console.log('🔙 [UnifiedResultPage] 뒤로가기 → 콘텐츠 상세');
        navigate(`/master/content/detail/${contentId}`, { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentQuestionOrder, contentId, from, navigate]);

  // ⭐ 페이지 진입/질문 변경 시 스크롤 최상단
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo(0, 0);
      window.scrollTo(0, 0);
    });
  }, [currentQuestionOrder]);

  // ⭐ 데이터 로드 (localStorage 캐싱 적용)
  useEffect(() => {
    const loadData = async () => {
      if (!orderId || isCheckingSession || !hasValidSession) return;

      // ⭐ 이미 데이터가 있으면 스킵 (중복 로드 방지)
      if (allResults.length > 0) {
        console.log('✅ [UnifiedResultPage] 데이터 이미 로드됨, 스킵');
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        console.log('📥 [UnifiedResultPage] 데이터 로드:', { orderId, currentQuestionOrder });

        // ⭐ 캐시 키 및 만료 시간 (24시간 - 완료된 결과는 변경되지 않음)
        const cacheKey = `paid_result_${orderId}`;
        const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

        // ⭐ 1단계: localStorage 캐시 확인
        let normalizedResults: ResultItem[] | null = null;
        let cachedContentId: string | null = null;

        try {
          const cachedJson = localStorage.getItem(cacheKey);
          if (cachedJson) {
            const cached = JSON.parse(cachedJson);
            const isExpired = Date.now() - cached.timestamp > CACHE_EXPIRY_MS;

            // ⭐ 캐시 유효성 검사: 만료되지 않고, 타로 질문이 모두 완료된 경우만 사용
            const allTarotViewed = cached.results.every(
              (r: ResultItem) => r.question_type !== 'tarot' || r.tarot_user_viewed === true
            );

            if (!isExpired && allTarotViewed && cached.results.length > 0) {
              console.log('💾 [UnifiedResultPage] 캐시에서 로드:', orderId);
              normalizedResults = cached.results;
              cachedContentId = cached.contentId;
            } else {
              console.log('🔄 [UnifiedResultPage] 캐시 무효화 (만료/타로미완료):', { isExpired, allTarotViewed });
              localStorage.removeItem(cacheKey);
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ [UnifiedResultPage] 캐시 읽기 실패:', cacheError);
        }

        // ⭐ 2단계: 캐시 없으면 DB 조회
        let effectiveContentId = contentIdParam || cachedContentId || '';

        if (!normalizedResults) {
          // ⭐ 병렬 조회 (RLS 통과를 위해 orders 조인 추가)
          const [resultsResponse, ordersResponse] = await Promise.all([
            supabase
              .from('order_results')
              .select(`
                question_order,
                question_text,
                gpt_response,
                question_type,
                tarot_card_name,
                tarot_card_image_url,
                tarot_user_viewed,
                orders!inner(user_id)
              `)
              .eq('order_id', orderId)
              .order('question_order', { ascending: true }),
            supabase
              .from('orders')
              .select('content_id')
              .eq('id', orderId)
              .single()
          ]);

          const { data: resultsData, error: resultsError } = resultsResponse;
          const { data: orderData, error: orderError } = ordersResponse;

          if (resultsError) throw resultsError;

          // ⭐ 결과가 없으면 다른 계정 주문 또는 AI 생성 중
          if (!resultsData || resultsData.length === 0) {
            if (orderError || !orderData) {
              console.error('❌ [UnifiedResultPage] 다른 계정의 주문');
              setIsWrongAccount(true);
              setLoading(false);
              return;
            }

            const redirectContentId = contentIdParam || orderData.content_id || '';
            console.log('🔄 [UnifiedResultPage] AI 생성 중 → 로딩 페이지');
            navigate(`/loading?orderId=${orderId}&contentId=${redirectContentId}`);
            return;
          }

          console.log('📊 [UnifiedResultPage] DB에서 결과 데이터 로드 완료:', {
            count: resultsData.length,
            questionOrders: resultsData.map(r => r.question_order),
            questionOrderTypes: resultsData.map(r => typeof r.question_order),
            firstQuestion: resultsData[0]?.question_type,
            targetQuestionOrder: currentQuestionOrder
          });

          // ⭐ Type 안전성: question_order를 명시적으로 number로 변환
          normalizedResults = resultsData.map(r => ({
            ...r,
            question_order: Number(r.question_order)
          })) as ResultItem[];

          effectiveContentId = contentIdParam || orderData?.content_id || '';

          // ⭐ 3단계: 모든 타로 질문이 완료된 경우 캐시 저장
          const allTarotViewed = normalizedResults.every(
            r => r.question_type !== 'tarot' || r.tarot_user_viewed === true
          );

          if (allTarotViewed) {
            try {
              const cacheData = {
                results: normalizedResults,
                contentId: effectiveContentId,
                timestamp: Date.now()
              };
              localStorage.setItem(cacheKey, JSON.stringify(cacheData));
              console.log('💾 [UnifiedResultPage] 캐시 저장 완료:', orderId);
            } catch (saveError) {
              console.warn('⚠️ [UnifiedResultPage] 캐시 저장 실패:', saveError);
            }
          }
        }

        setAllResults(normalizedResults);

        // ⭐ contentId 설정
        if (!contentIdParam && effectiveContentId) {
          setContentId(effectiveContentId);
        }

        // 📊 GA 이벤트: 유료 결과 조회 (orderId당 최초 1회만 page_view 전송)
        if (orderId && effectiveContentId) {
          const viewedOrdersKey = 'viewed_paid_result_orders';
          const viewedOrders: string[] = JSON.parse(localStorage.getItem(viewedOrdersKey) || '[]');

          if (!viewedOrders.includes(orderId)) {
            // ⭐ 최초 조회 시에만 page_view 전송 (구매 내역 재조회 시 제외)
            trackPageView('/result', '운세 결과 | 나다운세');
            console.log('📊 [UnifiedResultPage] 최초 결과 조회 page_view 전송:', orderId);

            // 본 주문 목록에 추가
            viewedOrders.push(orderId);
            localStorage.setItem(viewedOrdersKey, JSON.stringify(viewedOrders));
          } else {
            console.log('📊 [UnifiedResultPage] 재조회 - page_view 스킵:', orderId);
          }

          // paid_result_view 커스텀 이벤트는 항상 전송 (재조회 포함)
          trackPaidResultView(orderId, effectiveContentId);
        }

        // ⭐ 현재 질문이 타로이고 아직 선택 안 했으면 셔플 페이지로
        // ⚠️ normalizedResults 사용 (question_order가 number로 변환됨)
        // ⭐ tarotJustSelected: TarotShufflePage에서 방금 선택 완료한 경우 스킵 (DB 업데이트 타이밍 이슈)
        const currentResult = normalizedResults.find(r => r.question_order === currentQuestionOrder);
        const justSelectedThisQuestion = tarotJustSelected && selectedQuestionOrder === currentQuestionOrder;
        if (currentResult?.question_type === 'tarot' && !currentResult?.tarot_user_viewed && !justSelectedThisQuestion) {
          console.log('🎴 [UnifiedResultPage] 타로 미선택 → 셔플 페이지');
          const fromParam = from ? `&from=${from}` : '';
          const contentIdStr = effectiveContentId || '';
          navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${currentQuestionOrder}&contentId=${contentIdStr}${fromParam}`, { replace: true });
          return;
        }
        if (justSelectedThisQuestion) {
          console.log('✅ [UnifiedResultPage] 타로 방금 선택 완료 → 셔플 스킵 (state 전달)');
        }

        // ⭐ 타로 이미지 프리로드
        preloadTarotImages(normalizedResults, currentQuestionOrder);

      } catch (error) {
        console.error('❌ [UnifiedResultPage] 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, isCheckingSession, hasValidSession, navigate, contentIdParam, allResults.length]);

  // ⭐ (중복 제거됨 - 69-92번째 줄 useEffect에서 처리)

  // ⭐ 데이터 로드 완료 즉시 백그라운드로 태그 추출 (나다움 기록하기용)
  // - 무료 콘텐츠와 동일하게 결과 진입 시 바로 시작
  // - 사용자가 빠르게 넘겨도 태그 추출이 미리 완료되도록
  useEffect(() => {
    // 🔍 디버깅: 태그 추출 조건 체크
    console.log('🔍 [UnifiedResultPage] 태그 추출 조건 체크:', {
      from,
      hasConfirmedTags,
      isTagExtracted,
      isTagLoading,
      allResultsLength: allResults.length,
      hasStarted: hasTagExtractionStarted.current
    });

    // ⭐ from=purchase + 이미 태그 확정됨 → 태그 추출 스킵 (다시보기이므로)
    // ⭐ from=purchase + 태그 미확정 → 태그 추출 진행 (나다움 기록하기 필요)
    // 데이터 없거나, 이미 태그 추출 완료/진행 중이면 스킵
    if ((from === 'purchase' && hasConfirmedTags) || isTagExtracted || isTagLoading || allResults.length === 0) {
      console.log('⏭️ [UnifiedResultPage] 태그 추출 스킵 - 조건 불충족');
      return;
    }

    // ⭐ 중복 실행 방지 (ref 사용)
    if (hasTagExtractionStarted.current) {
      console.log('⏭️ [UnifiedResultPage] 태그 추출 이미 시작됨 - 스킵');
      return;
    }
    hasTagExtractionStarted.current = true;

    const extractTags = async () => {
      setIsTagLoading(true);
      console.log('🏷️ [UnifiedResultPage] 데이터 로드 완료 → 백그라운드 태그 추출 시작...');

      try {
        const { data: userData } = await supabase.auth.getUser();

        // ⭐ [중요] 이 콘텐츠/주문에 대해 이미 태그가 추출되었는지 DB 확인
        // - 한 번 추출된 태그는 다시 추출하지 않음 (API 비용 절약)
        // - __SKIPPED__ 마커가 있으면 이미 나다움 기록하기를 스킵한 것
        if (userData?.user?.id && (orderId || contentId)) {
          let checkQuery = supabase
            .from('user_trait_tags')
            .select('tag_name, tag_type, is_confirmed')
            .eq('user_id', userData.user.id);

          if (orderId) {
            checkQuery = checkQuery.eq('source_order_id', orderId);
          } else if (contentId) {
            checkQuery = checkQuery.eq('source_content_id', contentId).eq('source_type', 'free_content');
          }

          const { data: existingTagsForContent } = await checkQuery;

          if (existingTagsForContent && existingTagsForContent.length > 0) {
            // ⭐ __SKIPPED__ 마커 또는 is_confirmed=true 태그가 있으면 이미 나다움 기록하기 완료/스킵
            const hasSkippedOrConfirmed = existingTagsForContent.some(
              t => t.tag_name === '__SKIPPED__' || t.is_confirmed === true
            );

            if (hasSkippedOrConfirmed) {
              console.log('✅ [UnifiedResultPage] 이미 나다움 기록하기 완료/스킵됨 → 버튼 "완료"로 변경');
              setHasConfirmedTagsFromDB(true);
            }

            // ⭐ __SKIPPED__ 필터링 후 태그 설정
            const filteredTags = existingTagsForContent.filter(t => t.tag_name !== '__SKIPPED__');

            console.log('✅ [UnifiedResultPage] 이미 추출된 태그 발견 → API 호출 스킵:', filteredTags.length, '개');
            setExtractedTags(filteredTags.map(t => ({
              name: t.tag_name,
              type: t.tag_type
            })));
            setIsTagExtracted(true);
            setIsTagLoading(false);
            return; // 여기서 종료 - API 호출 안 함
          }
        }

        // order_results에서 질문/답변 추출
        const contentAnswers = allResults.map(r => ({
          questionText: r.question_text,
          answerText: r.gpt_response
        }));

        // ⭐ 사용자의 기존 태그 조회 (중복 방지용 - 다른 콘텐츠에서 추출된 태그)
        let existingTags: string[] = [];
        if (userData?.user?.id) {
          const { data: existingTagsData } = await supabase
            .from('user_trait_tags')
            .select('tag_name')
            .eq('user_id', userData.user.id);

          if (existingTagsData && existingTagsData.length > 0) {
            existingTags = existingTagsData.map(t => t.tag_name);
            console.log('📌 [UnifiedResultPage] 기존 태그 조회:', existingTags.length, '개');
          }
        }

        console.log('🔄 [UnifiedResultPage] extract-trait-tags API 호출...');
        const { data, error } = await supabase.functions.invoke('extract-trait-tags', {
          body: { contentAnswers, existingTags }
        });

        if (!error && data?.success && data?.tags) {
          console.log('✅ [UnifiedResultPage] 태그 추출 완료:', data.tags);
          setExtractedTags(data.tags);

          // ⭐ 태그를 localStorage에 저장 (폴링용)
          const storageKey = orderId ? `extracted_tags_${orderId}` : `extracted_tags_${contentId}`;
          if (orderId || contentId) {
            localStorage.setItem(storageKey, JSON.stringify({
              tags: data.tags,
              timestamp: Date.now()
            }));
            console.log('💾 [UnifiedResultPage] 태그 localStorage 저장 완료');
          }

          // ⭐ DB에 즉시 저장 (is_confirmed: false) - 나중에 태그 선택 시 확정
          // 무료/유료 콘텐츠 모두 저장 (userData는 위에서 이미 조회함)
          console.log('🔍 [UnifiedResultPage] 태그 DB 저장 조건 체크:', {
            userId: userData?.user?.id ? '있음' : '없음',
            orderId: orderId || '없음',
            contentId: contentId || '없음'
          });
          if (userData?.user?.id && (orderId || contentId)) {
            try {
              // 해당 콘텐츠/주문의 기존 임시 태그 삭제 (중복 방지)
              let deleteQuery = supabase
                .from('user_trait_tags')
                .delete()
                .eq('user_id', userData.user.id)
                .eq('is_confirmed', false);

              if (orderId) {
                deleteQuery = deleteQuery.eq('source_order_id', orderId);
              } else if (contentId) {
                deleteQuery = deleteQuery.eq('source_content_id', contentId).eq('source_type', 'free_content');
              }
              await deleteQuery;

              // 새 태그 INSERT (is_confirmed: false)
              const sourceType = orderId ? 'paid_content' : 'free_content';
              const { error: insertError } = await supabase
                .from('user_trait_tags')
                .insert(
                  data.tags.map((tag: { name: string; type: string }) => ({
                    user_id: userData.user.id,
                    tag_name: tag.name,
                    tag_type: tag.type,
                    source_type: sourceType,
                    source_content_id: contentId || null,
                    source_order_id: orderId || null,
                    is_confirmed: false
                  }))
                );

              if (insertError) {
                console.warn('⚠️ [UnifiedResultPage] 태그 DB 저장 실패:', insertError);
              } else {
                console.log(`💾 [UnifiedResultPage] 태그 DB 저장 완료 (${sourceType}, is_confirmed: false)`);
              }
            } catch (dbError) {
              console.warn('⚠️ [UnifiedResultPage] 태그 DB 저장 예외:', dbError);
            }
          } else {
            console.warn('⚠️ [UnifiedResultPage] 태그 DB 저장 스킵 - 조건 미충족 (userId 또는 orderId/contentId 없음)');
          }
        } else {
          console.warn('⚠️ [UnifiedResultPage] 태그 추출 실패:', error || data?.error);
        }
      } catch (e) {
        console.warn('⚠️ [UnifiedResultPage] 태그 추출 예외:', e);
      } finally {
        setIsTagExtracted(true);
        setIsTagLoading(false);
      }
    };

    extractTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults.length, from, hasConfirmedTags, isTagExtracted, isTagLoading]);

  // ⭐ 타로 이미지 프리로드
  const preloadTarotImages = (data: ResultItem[], currentOrder: number) => {
    const tarotQuestions = data
      .filter(q => q.question_order >= currentOrder && q.question_type === 'tarot')
      .slice(0, 4);

    tarotQuestions.forEach((q) => {
      if (q.tarot_card_name) {
        const imageUrl = getTarotCardImageUrl(q.tarot_card_name);
        cacheTarotImage(q.tarot_card_name, imageUrl).catch(() => {});
      }
    });
  };

  // ⭐ 현재 결과 (useMemo로 캐싱하여 불필요한 재렌더링 방지)
  const currentResult = useMemo(() => {
    return allResults.find(r => r.question_order === currentQuestionOrder);
  }, [allResults, currentQuestionOrder]);

  // 🔍 디버깅 로그 (Type Mismatch 체크 추가)
  console.log('🔍 [UnifiedResultPage] 렌더링 상태:', {
    currentQuestionOrder,
    currentQuestionOrderType: typeof currentQuestionOrder,
    allResultsLength: allResults.length,
    allResultsQuestionOrders: allResults.map(r => ({ order: r.question_order, type: typeof r.question_order })),
    currentResultExists: !!currentResult,
    currentResultQuestionOrder: currentResult?.question_order,
    questionType: currentResult?.question_type,
    isTarot: currentResult?.question_type === 'tarot',
    questionText: currentResult?.question_text?.substring(0, 30),
    gptResponseLength: currentResult?.gpt_response?.length || 0,
    gptResponseStart: currentResult?.gpt_response?.substring(0, 50) || '(empty)',
    loading,
    isCheckingSession,
    hasValidSession
  });

  useEffect(() => {
    let isMounted = true;

    const loadCardImage = async () => {
      if (!currentResult || currentResult.question_type !== 'tarot' || !currentResult.tarot_card_name) {
        setCardImageUrl('');
        setImageLoading(false);
        // ⭐ Blob URL은 blobUrlCache에서 전역 관리 - 컴포넌트에서 revoke하지 않음
        // (revoke 시 React 비동기 업데이트로 ERR_FILE_NOT_FOUND 발생 가능)
        previousBlobUrlRef.current = null;
        return;
      }

      // ⚡ 1단계: 동기식 메모리 캐시 체크 (0.01ms - placeholder 없이 즉시 표시)
      const syncCachedBlobUrl = getMemoryCachedBlobUrl(currentResult.tarot_card_name);
      if (syncCachedBlobUrl) {
        console.log('⚡⚡ [UnifiedResultPage] 동기식 메모리 캐시 히트 (placeholder 스킵):', currentResult.tarot_card_name);
        // ⭐ Blob URL은 blobUrlCache가 관리하므로 revoke하지 않음
        previousBlobUrlRef.current = syncCachedBlobUrl;
        setCardImageUrl(syncCachedBlobUrl);
        setImageLoading(false); // ⭐ 즉시 로딩 완료 (placeholder 없음!)
        setImageError(false);
        setUsedFallback(false);
        setRetryCount(0);
        return;
      }

      // ⭐ 동기 캐시 미스 시에만 로딩 상태 + 비동기 체크 진행
      setImageLoading(true);
      setImageError(false);
      setUsedFallback(false); // 새 이미지 로드 시 폴백 상태 초기화
      setRetryCount(0); // 재시도 카운터 초기화

      // ⭐ 2단계: Cache API 비동기 체크 (10-50ms)
      const cachedImage = await getCachedTarotImage(currentResult.tarot_card_name);

      if (!isMounted) return; // cleanup 후 실행 방지

      if (cachedImage) {
        console.log('⚡ [UnifiedResultPage] 이미지 캐시 히트 (Blob URL):', currentResult.tarot_card_name);

        // ⭐ Blob URL은 blobUrlCache에서 전역 관리 - 컴포넌트에서 revoke하지 않음

        // ⭐ 새 Blob URL 저장
        previousBlobUrlRef.current = cachedImage;
        setCardImageUrl(cachedImage);

        // ⭐ 이미지가 이미 로드되어 있는지 체크
        setTimeout(() => {
          if (isMounted && tarotImageRef.current?.complete && tarotImageRef.current?.naturalWidth > 0) {
            console.log('✅ [UnifiedResultPage] 이미지 이미 로드됨:', currentResult.tarot_card_name);
            setImageLoading(false);
          }
        }, 0);
      } else {
        console.log('🌐 [UnifiedResultPage] 네트워크 로드:', currentResult.tarot_card_name);
        const storageUrl = getTarotCardImageUrl(currentResult.tarot_card_name, supabaseUrl);

        // ⭐ Blob URL은 blobUrlCache에서 전역 관리 - 컴포넌트에서 revoke하지 않음
        previousBlobUrlRef.current = null;

        setCardImageUrl(storageUrl);
        cacheTarotImage(currentResult.tarot_card_name, storageUrl).catch(() => {});
      }
    };

    loadCardImage();

    // ⭐ Cleanup: 컴포넌트 unmount 시에만 마지막 Blob URL revoke
    return () => {
      isMounted = false;
      // unmount 시에만 revoke (페이지 전환 시에는 revoke 하지 않음)
    };
  }, [currentResult?.question_order, currentResult?.tarot_card_name]);

  // ⭐ Blob URL은 blobUrlCache에서 전역 관리
  // 컴포넌트 unmount 시에도 revoke하지 않음 (ERR_FILE_NOT_FOUND 방지)
  // 페이지 새로고침/앱 종료 시 자동 해제됨

  // ⭐ 이미지 로드 실패 시 재시도 + 폴백 처리
  const handleImageError = async () => {
    if (!currentResult?.tarot_card_name) {
      console.error('❌ [UnifiedResultPage] currentResult 없음');
      setImageError(true);
      return;
    }

    const MAX_RETRIES = 3;

    // 1차: 캐시에서 재시도 (최대 3번 - for 루프로 한 번에 처리)
    // ⚠️ 이전 코드는 setRetryCount 후 return하면 이미지 URL이 변경되지 않아
    //    onError가 다시 트리거되지 않는 버그가 있었음
    for (let i = 0; i < MAX_RETRIES; i++) {
      console.log(`🔄 [UnifiedResultPage] 캐시 재시도 ${i + 1}/${MAX_RETRIES}:`, currentResult.tarot_card_name);

      // ⭐ Blob URL은 blobUrlCache에서 전역 관리 - revoke하지 않음
      previousBlobUrlRef.current = null;

      // 캐시에서 새로운 Blob URL 생성
      const cachedImage = await getCachedTarotImage(currentResult.tarot_card_name);
      if (cachedImage) {
        console.log('✅ [UnifiedResultPage] 캐시 재시도 성공:', currentResult.tarot_card_name);
        previousBlobUrlRef.current = cachedImage;
        setCardImageUrl(cachedImage);
        setRetryCount(i + 1);
        return;
      }

      console.log('⚠️ [UnifiedResultPage] 캐시 재시도 실패, 다음 시도로 이동');
    }

    // 2차: Storage URL로 폴백 (캐시 재시도 모두 실패)
    if (!usedFallback) {
      console.log('⚠️ [UnifiedResultPage] 캐시 재시도 모두 실패 → Storage URL 폴백:', currentResult.tarot_card_name);

      // ⭐ Blob URL은 blobUrlCache에서 전역 관리 - revoke하지 않음
      previousBlobUrlRef.current = null;

      const storageUrl = getTarotCardImageUrl(currentResult.tarot_card_name, supabaseUrl);
      setCardImageUrl(storageUrl);
      setUsedFallback(true);
      setRetryCount(MAX_RETRIES);
      return;
    }

    // 3차: 완전 실패 → 에러 표시
    console.error('❌ [UnifiedResultPage] 이미지 로드 완전 실패 (모든 재시도 실패):', currentResult?.tarot_card_name);
    setImageError(true);
  };

  // ⭐ 이전 버튼
  const handlePrevious = () => {
    if (currentQuestionOrder <= 1) return;

    const prevResult = allResults.find(r => r.question_order === currentQuestionOrder - 1);
    if (!prevResult) return;

    // ⭐ 이전 질문이 타로이고 아직 선택 안 했으면 셔플 페이지로
    if (prevResult.question_type === 'tarot' && !prevResult.tarot_user_viewed) {
      const fromParam = from ? `&from=${from}` : '';
      const contentIdStr = contentId ? `&contentId=${contentId}` : '';
      navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${prevResult.question_order}${contentIdStr}${fromParam}`);
      return;
    }

    // ⭐ 내부 상태 변경으로 애니메이션 적용
    setCurrentQuestionOrder(currentQuestionOrder - 1);

    // ⭐ URL도 동기화 (브라우저 히스토리용)
    const fromParam = from ? `&from=${from}` : '';
    const contentIdStr = contentId ? `&contentId=${contentId}` : '';
    window.history.replaceState({}, '', `/result?orderId=${orderId}&questionOrder=${currentQuestionOrder - 1}${contentIdStr}${fromParam}`);
  };

  // ⭐ 다음 버튼
  const handleNext = async () => {
    const nextResult = allResults.find(r => r.question_order === currentQuestionOrder + 1);

    // ⭐ 다음 질문이 없으면 마지막 페이지 처리
    if (!nextResult) {
      // 📊 GA 이벤트: 유료 결과 완독
      if (orderId && contentId) {
        trackPaidResultComplete(orderId, contentId);
      }

      // ⭐ 이미 태그 확정됨 (선택 완료 또는 SKIPPED) → 나다움 기록하기 스킵
      // hasConfirmedTags: PurchaseHistoryPage에서 전달받은 값
      // hasConfirmedTagsFromDB: DB에서 직접 확인한 값 (__SKIPPED__ 또는 is_confirmed=true)
      if (hasConfirmedTags || hasConfirmedTagsFromDB) {
        if (from === 'purchase') {
          console.log('🔀 [UnifiedResultPage] 다시보기 완료 (태그 이미 확정) → 구매내역으로 이동');
          navigate('/purchase-history', { replace: true });
        } else {
          console.log('🔀 [UnifiedResultPage] 완료 (태그 이미 확정) → 홈으로 이동');
          navigate('/', { replace: true });
        }
        return;
      }

      // ⭐ 새로 체험하는 경우 또는 태그 미확정 다시보기 → 나다움 기록하기로 이동
      if (isTagExtracted) {
        // 태그 추출 완료 → 바로 나다움 기록하기로 이동
        console.log('🔀 [UnifiedResultPage] 태그 추출 완료 → 나다움 기록하기로 이동');
        navigate('/paid/nadaum-record', {
          state: { orderId, contentId, tags: extractedTags }
        });
      } else {
        // 태그 추출 중 → 로딩 페이지로 이동
        console.log('⏳ [UnifiedResultPage] 태그 추출 중 → 로딩 페이지로 이동');
        navigate('/paid/tag-loading', {
          state: {
            orderId,
            contentId,
            contentAnswers: allResults.map(r => ({
              questionText: r.question_text,
              answerText: r.gpt_response
            }))
          }
        });
      }
      return;
    }

    // ⭐ 다음 질문이 타로이고 아직 선택 안 했으면 셔플 페이지로
    if (nextResult.question_type === 'tarot' && !nextResult.tarot_user_viewed) {
      const fromParam = from ? `&from=${from}` : '';
      const contentIdStr = contentId ? `&contentId=${contentId}` : '';
      navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${nextResult.question_order}${contentIdStr}${fromParam}`);
      return;
    }

    // ⭐ 내부 상태 변경으로 애니메이션 적용
    setCurrentQuestionOrder(currentQuestionOrder + 1);

    // ⭐ URL도 동기화
    const fromParam = from ? `&from=${from}` : '';
    const contentIdStr = contentId ? `&contentId=${contentId}` : '';
    window.history.replaceState({}, '', `/result?orderId=${orderId}&questionOrder=${currentQuestionOrder + 1}${contentIdStr}${fromParam}`);
  };

  // ⭐ 닫기 버튼
  const handleClose = () => {
    if (from === 'purchase') {
      navigate('/purchase-history', { replace: true });
    } else {
      navigate('/');
    }
  };

  // ⭐ 다른 계정 로그아웃
  const handleLogoutAndRetry = async () => {
    const currentUrl = `${location.pathname}${location.search}`;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    await supabase.auth.signOut();
    navigate('/login/new', { replace: true });
  };

  // ⭐ 로딩 중 (캐시 데이터가 있으면 로딩 스킵)
  if ((isCheckingSession || loading) && allResults.length === 0) {
    return <PageLoader />;
  }

  // ⭐ 다른 계정 주문 - 다이얼로그 표시
  if (isWrongAccount) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full mx-auto" style={{ maxWidth: '440px' }}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div 
            className="relative bg-white overflow-hidden border" 
            style={{ width: '320px', borderColor: '#f3f3f3', borderRadius: '20px' }}
          >
            <div style={{ paddingLeft: '28px', paddingRight: '28px', paddingTop: '20px', paddingBottom: '20px' }}>
              <div className="flex flex-col items-center text-center" style={{ gap: '8px' }}>
                <p 
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: 600,
                    fontSize: '17px',
                    lineHeight: '25.5px',
                    letterSpacing: '-0.34px',
                    color: '#000000'
                  }}
                >
                  다른 계정으로 구매한 운세예요
                </p>
                <p 
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: 500,
                    fontSize: '15px',
                    lineHeight: '20px',
                    letterSpacing: '-0.3px',
                    color: '#868686'
                  }}
                >
                  운세를 구매한 계정으로<br />다시 로그인해 주세요.
                </p>
              </div>
            </div>
            <div 
              className="flex flex-col"
              style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '20px', gap: '8px' }}
            >
              <button
                onClick={handleLogoutAndRetry}
                className="w-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ height: '48px', backgroundColor: '#48b2af', borderRadius: '12px' }}
              >
                <span 
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '25px',
                    letterSpacing: '-0.32px',
                    color: '#ffffff'
                  }}
                >
                  다른 계정으로 로그인
                </span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                style={{ height: '48px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}
              >
                <span 
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '25px',
                    letterSpacing: '-0.32px',
                    color: '#666666'
                  }}
                >
                  홈으로 이동
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ⭐ 결과 없음
  if (!currentResult) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full mx-auto" style={{ maxWidth: '440px' }}>
        <p style={{ color: '#999999' }}>풀이 결과를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const totalQuestions = allResults.length;
  const isTarot = currentResult.question_type === 'tarot';

  return (
    <div className="fixed inset-0 bg-white flex flex-col w-full mx-auto" style={{ maxWidth: '440px' }}>
      {/* Top Navigation */}
      <div className="bg-white shrink-0 w-full z-20" style={{ height: '52px' }}>
        <div className="flex items-center justify-between h-full" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
          <div className="opacity-0" style={{ width: '44px', height: '44px' }} />
          <h1 
            className="text-center flex-1"
            style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '25.5px',
              letterSpacing: '-0.36px',
              color: '#000000'
            }}
          >
            상세 풀이
          </h1>
          <button
            onClick={handleClose}
            className="group flex items-center justify-center cursor-pointer transition-colors duration-200 active:bg-gray-100"
            style={{ width: '44px', height: '44px', borderRadius: '12px' }}
          >
            <X 
              className="transition-transform duration-200 group-active:scale-90" 
              style={{ width: '24px', height: '24px', color: '#848484' }}
              strokeWidth={1.8} 
            />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area - iOS 터치 스크롤 지원 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          minHeight: 0,
          height: 'calc(100vh - 52px - 68px)', // viewport - top nav - bottom nav
          paddingBottom: '128px',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y' // ⭐ 세로 스크롤 명시적 허용
        }}
      >
        <div className="shrink-0 w-full" style={{ height: '8px' }} />

        {/* Content */}
        <div className="w-full" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          <div
            key={`result-${currentQuestionOrder}`}
            className="w-full"
            style={{
              minHeight: '500px',
              backgroundColor: '#f9f9f9',
              borderRadius: '16px',
              padding: '20px'
            }}
          >
              {/* Header */}
              <div 
                className="flex items-center w-full"
                style={{ gap: '12px', marginBottom: '24px' }}
              >
                <p 
                  className="shrink-0"
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontWeight: 600,
                    fontSize: '20px',
                    lineHeight: '28px',
                    letterSpacing: '-0.2px',
                    color: '#48b2af'
                  }}
                >
                  {String(currentResult.question_order).padStart(2, '0')}
                </p>
                <div className="flex-1 h-0 border-t" style={{ borderColor: '#e7e7e7' }} />
              </div>

              {/* 타로: 카드 이미지 + 카드명 */}
              {isTarot && (
                <div 
                  className="flex flex-col items-center w-full"
                  style={{ gap: '24px', marginBottom: '24px' }}
                >
                  {/* 카드 이미지 */}
                  <div 
                    className="relative overflow-hidden shrink-0"
                    style={{
                      height: '260px',
                      width: '150px',
                      backgroundColor: '#f0f0f0',
                      boxShadow: '6px 7px 12px 0px rgba(0,0,0,0.04), -3px -3px 12px 0px rgba(0,0,0,0.04)',
                      borderRadius: '16px'
                    }}
                  >
                    <img
                      ref={tarotImageRef}
                      src={cardImageUrl}
                      alt={currentResult.tarot_card_name || 'Tarot Card'}
                      fetchpriority="high"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      onLoad={() => {
                        console.log('🖼️ [UnifiedResultPage] onLoad 이벤트 발생:', currentResult.tarot_card_name);
                        setImageLoading(false);
                      }}
                    />
                    {imageError && (
                      <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-500 text-center px-2">이미지<br/>로드 실패</p>
                      </div>
                    )}
                    {imageLoading && (
                      <div className="absolute top-0 left-0 w-full h-full bg-gray-100 overflow-hidden">
                        <style>{`
                          @keyframes shimmer {
                            0% { transform: translateX(-100%) skewX(-12deg); }
                            100% { transform: translateX(200%) skewX(-12deg); }
                          }
                        `}</style>
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                          style={{ animation: 'shimmer 1.5s infinite linear' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 카드명 */}
                  {currentResult.tarot_card_name && (
                    <p 
                      className="text-center w-full break-keep"
                      style={{
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: 700,
                        fontSize: '18px',
                        lineHeight: '24px',
                        letterSpacing: '-0.36px',
                        color: '#151515'
                      }}
                    >
                      {currentResult.tarot_card_name}
                    </p>
                  )}
                </div>
              )}

              {/* 사주: 질문 제목 */}
              {!isTarot && (
                <div className="w-full" style={{ marginBottom: '24px' }}>
                  <p 
                    className="break-keep"
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontWeight: 700,
                      fontSize: '18px',
                      lineHeight: '24px',
                      letterSpacing: '-0.36px',
                      color: '#151515'
                    }}
                  >
                    {currentResult.question_text}
                  </p>
                </div>
              )}

              {/* AI 응답 */}
              <div 
                className="whitespace-pre-wrap break-words w-full"
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '28.5px',
                  letterSpacing: '-0.32px',
                  color: '#151515'
                }}
              >
                {(currentResult.gpt_response || '').split(/(\*\*.*?\*\*)/g).map((part, index) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <span 
                        key={index}
                        style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontWeight: 700,
                          fontSize: '17px'
                        }}
                      >
                        {part.slice(2, -2)}
                      </span>
                    );
                  }
                  return part;
                })}
              </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentStep={currentQuestionOrder}
        totalSteps={totalQuestions}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToggleList={() => setShowTableOfContents(true)}
        disablePrevious={currentQuestionOrder === 1}
        nextLabel={currentQuestionOrder === totalQuestions && (hasConfirmedTags || hasConfirmedTagsFromDB) ? '완료' : '다음'}
      />

      {/* Table of Contents Bottom Sheet */}
      {orderId && contentId && (
        <TableOfContentsBottomSheet
          isOpen={showTableOfContents}
          onClose={() => setShowTableOfContents(false)}
          orderId={orderId}
          contentId={contentId}
          currentQuestionOrder={currentQuestionOrder}
        />
      )}

      <SessionExpiredDialog isOpen={isSessionExpired} />


    </div>
  );
}
