import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { getTarotCardImageUrl } from '../lib/tarotCards';
import { getCachedTarotImage, cacheTarotImage } from '../lib/tarotImageCache';
import TableOfContentsBottomSheet from './TableOfContentsBottomSheet';
import { BottomNavigation } from './BottomNavigation';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import { PageLoader } from './ui/PageLoader';

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

  // ⭐ 현재 질문 순서 (내부 상태로 관리하여 모든 전환에 애니메이션 적용)
  const [currentQuestionOrder, setCurrentQuestionOrder] = useState(parseInt(questionOrderParam));
  const [allResults, setAllResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentId, setContentId] = useState<string | null>(contentIdParam);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // ⭐ 세션 체크 상태
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isWrongAccount, setIsWrongAccount] = useState(false);

  // ⭐ 타로 이미지 관련 상태
  const [cardImageUrl, setCardImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false); // 폴백 시도 여부

  // ⭐ 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ⭐ 타로 이미지 ref (이미 로드된 이미지 감지용)
  const tarotImageRef = useRef<HTMLImageElement>(null);

  // ⭐ URL 쿼리 파라미터 변경 감지 + 타로 셔플 리다이렉트 체크
  useEffect(() => {
    const newQuestionOrder = parseInt(questionOrderParam);
    if (!isNaN(newQuestionOrder) && newQuestionOrder !== currentQuestionOrder) {
      console.log('📍 [UnifiedResultPage] URL 파라미터 변경 감지:', currentQuestionOrder, '→', newQuestionOrder);
      setCurrentQuestionOrder(newQuestionOrder);

      // ⭐ allResults가 있을 때만 타로 셔플 체크
      if (allResults.length > 0) {
        const targetResult = allResults.find(r => r.question_order === newQuestionOrder);
        if (targetResult?.question_type === 'tarot' && !targetResult?.tarot_user_viewed) {
          console.log('🎴 [UnifiedResultPage] URL 파라미터 변경 → 타로 미선택 → 셔플 페이지');
          const fromParam = from ? `&from=${from}` : '';
          const contentIdStr = contentId ? `&contentId=${contentId}` : '';
          navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${newQuestionOrder}${contentIdStr}${fromParam}`, { replace: true });
        }
      }
    }
  }, [questionOrderParam, allResults, contentId, from, orderId, navigate]);

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

  // ⭐ 데이터 로드
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

        console.log('📊 [UnifiedResultPage] 결과 데이터 로드 완료:', {
          count: resultsData.length,
          questionOrders: resultsData.map(r => r.question_order),
          questionOrderTypes: resultsData.map(r => typeof r.question_order),
          firstQuestion: resultsData[0]?.question_type,
          targetQuestionOrder: currentQuestionOrder
        });

        // ⭐ Type 안전성: question_order를 명시적으로 number로 변환
        const normalizedResults = resultsData.map(r => ({
          ...r,
          question_order: Number(r.question_order)
        })) as ResultItem[];

        setAllResults(normalizedResults);

        // ⭐ contentId 설정
        if (!contentIdParam && orderData?.content_id) {
          setContentId(orderData.content_id);
        }

        // ⭐ 현재 질문이 타로이고 아직 선택 안 했으면 셔플 페이지로
        const currentResult = resultsData.find(r => r.question_order === currentQuestionOrder);
        if (currentResult?.question_type === 'tarot' && !currentResult?.tarot_user_viewed) {
          console.log('🎴 [UnifiedResultPage] 타로 미선택 → 셔플 페이지');
          const fromParam = from ? `&from=${from}` : '';
          const contentIdStr = contentIdParam || orderData?.content_id || '';
          navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${currentQuestionOrder}&contentId=${contentIdStr}${fromParam}`, { replace: true });
          return;
        }

        // ⭐ 타로 이미지 프리로드
        preloadTarotImages(resultsData, currentQuestionOrder);

      } catch (error) {
        console.error('❌ [UnifiedResultPage] 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, isCheckingSession, hasValidSession, navigate, contentIdParam, allResults.length]);

  // ⭐ (중복 제거됨 - 69-92번째 줄 useEffect에서 처리)

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

  // ⭐ 현재 결과의 타로 이미지 로드
  const currentResult = allResults.find(r => r.question_order === currentQuestionOrder);

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
    const loadCardImage = async () => {
      if (!currentResult || currentResult.question_type !== 'tarot' || !currentResult.tarot_card_name) {
        setCardImageUrl('');
        setImageLoading(false);
        return;
      }

      setImageLoading(true);
      setImageError(false);
      setUsedFallback(false); // 새 이미지 로드 시 폴백 상태 초기화

      const cachedImage = await getCachedTarotImage(currentResult.tarot_card_name);

      if (cachedImage) {
        console.log('⚡ [UnifiedResultPage] 이미지 캐시 히트:', currentResult.tarot_card_name);
        setCardImageUrl(cachedImage);

        // ⭐ 이미지가 이미 로드되어 있는지 체크 (브라우저 캐시)
        // → setTimeout으로 다음 틱에 체크 (DOM 업데이트 후)
        setTimeout(() => {
          if (tarotImageRef.current?.complete && tarotImageRef.current?.naturalWidth > 0) {
            console.log('✅ [UnifiedResultPage] 이미지 이미 로드됨 (브라우저 캐시):', currentResult.tarot_card_name);
            setImageLoading(false);
          }
        }, 0);
      } else {
        console.log('🌐 [UnifiedResultPage] 네트워크 로드:', currentResult.tarot_card_name);
        const storageUrl = getTarotCardImageUrl(currentResult.tarot_card_name, supabaseUrl);
        setCardImageUrl(storageUrl);
        cacheTarotImage(currentResult.tarot_card_name, storageUrl).catch(() => {});
      }
    };

    loadCardImage();
  }, [currentResult?.question_order, currentResult?.tarot_card_name]);

  // ⭐ 이미지 로드 실패 시 폴백 처리
  const handleImageError = () => {
    if (!usedFallback && currentResult?.tarot_card_name) {
      // 캐시 URL 실패 시 직접 Storage URL로 폴백
      console.log('⚠️ [UnifiedResultPage] 캐시 이미지 실패 → 네트워크 폴백:', currentResult.tarot_card_name);
      const storageUrl = getTarotCardImageUrl(currentResult.tarot_card_name, supabaseUrl);
      setCardImageUrl(storageUrl);
      setUsedFallback(true);
    } else {
      // 폴백도 실패하면 에러 표시
      console.error('❌ [UnifiedResultPage] 이미지 로드 완전 실패:', currentResult?.tarot_card_name);
      setImageError(true);
    }
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

    // ⭐ 다음 질문이 없으면 완료 페이지
    if (!nextResult) {
      navigate('/result/complete', { state: { orderId, contentId } });
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

  // ⭐ 로딩 중
  if (isCheckingSession || loading) {
    return <PageLoader />;
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

      {/* 다른 계정 주문 모달 */}
      {isWrongAccount && (
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
      )}
    </div>
  );
}
