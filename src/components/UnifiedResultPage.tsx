import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { getTarotCardImageUrl } from '../lib/tarotCards';
import { getCachedTarotImage, cacheTarotImage } from '../lib/tarotImageCache';
import TableOfContentsBottomSheet from './TableOfContentsBottomSheet';
import { BottomNavigation } from './BottomNavigation';
import { SessionExpiredDialog } from './SessionExpiredDialog';

interface ResultItem {
  question_order: number;
  question_text: string;
  gpt_response: string;
  question_type: 'saju' | 'tarot';
  tarot_card_id: string | null;
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

  // ⭐ 애니메이션 방향 계산 (렌더링 시점에 계산)
  const prevOrderRef = useRef<number>(currentQuestionOrder);
  const direction = currentQuestionOrder > prevOrderRef.current ? 1 : currentQuestionOrder < prevOrderRef.current ? -1 : 0;

  // ⭐ ref 업데이트 (다음 비교를 위해)
  useEffect(() => {
    prevOrderRef.current = currentQuestionOrder;
  }, [currentQuestionOrder]);

  // ⭐ URL 쿼리 파라미터 변경 감지 (TableOfContentsBottomSheet에서 navigate 시)
  useEffect(() => {
    const newQuestionOrder = parseInt(questionOrderParam);
    if (!isNaN(newQuestionOrder) && newQuestionOrder !== currentQuestionOrder) {
      console.log('📍 [UnifiedResultPage] URL 파라미터 변경 감지:', currentQuestionOrder, '→', newQuestionOrder);
      setCurrentQuestionOrder(newQuestionOrder);
    }
  }, [questionOrderParam]);

  // ⭐ 슬라이드 애니메이션 Variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : direction < 0 ? -50 : 0,
      opacity: direction === 0 ? 1 : 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : direction < 0 ? 50 : 0,
      opacity: 0,
    }),
  };

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

      setLoading(true);

      try {
        console.log('📥 [UnifiedResultPage] 데이터 로드:', { orderId, currentQuestionOrder });

        // ⭐ 병렬 조회
        const [resultsResponse, ordersResponse] = await Promise.all([
          supabase
            .from('order_results')
            .select('question_order, question_text, gpt_response, question_type, tarot_card_id, tarot_card_name, tarot_card_image_url, tarot_user_viewed')
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
          firstQuestion: resultsData[0]?.question_type,
          targetQuestionOrder: currentQuestionOrder
        });
        setAllResults(resultsData as ResultItem[]);

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
  }, [orderId, isCheckingSession, hasValidSession, navigate, contentIdParam]);

  // ⭐ URL 파라미터 변경 시 currentQuestionOrder 동기화
  useEffect(() => {
    const newOrder = parseInt(questionOrderParam);
    if (newOrder !== currentQuestionOrder && allResults.length > 0) {
      setCurrentQuestionOrder(newOrder);
    }
  }, [questionOrderParam]);

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

  // 🔍 디버깅 로그
  console.log('🔍 [UnifiedResultPage] 렌더링 상태:', {
    currentQuestionOrder,
    allResultsLength: allResults.length,
    currentResultExists: !!currentResult,
    currentResultQuestionOrder: currentResult?.question_order,
    questionType: currentResult?.question_type,
    isTarot: currentResult?.question_type === 'tarot',
    questionText: currentResult?.question_text?.substring(0, 30),
    gptResponseLength: currentResult?.gpt_response?.length || 0,
    gptResponseStart: currentResult?.gpt_response?.substring(0, 50),
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
        setImageLoading(false);
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
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full max-w-[440px] mx-auto">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
  }

  // ⭐ 결과 없음
  if (!currentResult) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full max-w-[440px] mx-auto">
        <p className="text-[#999999]">풀이 결과를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const totalQuestions = allResults.length;
  const isTarot = currentResult.question_type === 'tarot';

  return (
    <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 bg-white flex flex-col w-full max-w-[440px]">
      {/* Top Navigation */}
      <div className="bg-white h-[52px] shrink-0 w-full z-20">
        <div className="flex items-center justify-between px-[12px] h-full">
          <div className="w-[44px] h-[44px] opacity-0" />
          <h1 className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[18px] leading-[25.5px] tracking-[-0.36px] text-black text-center flex-1">
            상세 풀이
          </h1>
          <button
            onClick={handleClose}
            className="group flex items-center justify-center w-[44px] h-[44px] rounded-[12px] cursor-pointer transition-colors duration-200 active:bg-gray-100"
          >
            <X className="w-[24px] h-[24px] text-[#848484] transition-transform duration-200 group-active:scale-90" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="h-[8px] shrink-0 w-full" />

        {/* Content - Slide Animation */}
        <div className="px-[20px] pb-[200px] w-full overflow-hidden">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentQuestionOrder}
              layout
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-[#f9f9f9] rounded-[16px] p-[20px] w-full"
            >
              {/* Header */}
              <div className="flex gap-[12px] items-center mb-[24px] w-full">
                <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[20px] leading-[28px] tracking-[-0.2px] text-[#48b2af] shrink-0">
                  {String(currentResult.question_order).padStart(2, '0')}
                </p>
                <div className="flex-1 h-0 border-t border-[#e7e7e7]" />
              </div>

              {/* 타로: 카드 이미지 + 카드명 */}
              {isTarot && (
                <div className="flex flex-col items-center gap-[24px] mb-[24px] w-full">
                  {/* 카드 이미지 */}
                  <div className="relative h-[260px] w-[150px] rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] overflow-hidden bg-[#f0f0f0] shrink-0">
                    <img
                      src={cardImageUrl}
                      alt={currentResult.tarot_card_name || 'Tarot Card'}
                      fetchpriority="high"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      onLoad={() => setImageLoading(false)}
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
                    <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[18px] leading-[24px] tracking-[-0.36px] text-[#151515] text-center w-full break-keep">
                      {currentResult.tarot_card_name}
                    </p>
                  )}
                </div>
              )}

              {/* 사주: 질문 제목 */}
              {!isTarot && (
                <div className="mb-[24px] w-full">
                  <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[18px] leading-[24px] tracking-[-0.36px] text-[#151515] break-keep">
                    {currentResult.question_text}
                  </p>
                </div>
              )}

              {/* AI 응답 */}
              <div className="font-['Pretendard_Variable:Regular',sans-serif] text-[16px] leading-[28.5px] tracking-[-0.32px] text-[#151515] whitespace-pre-wrap break-words w-full">
                {currentResult.gpt_response.split(/(\*\*.*?\*\*)/g).map((part, index) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <span key={index} className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[17px]">
                        {part.slice(2, -2)}
                      </span>
                    );
                  }
                  return part;
                })}
              </div>
            </motion.div>
          </AnimatePresence>
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
          <div className="relative w-[320px] bg-white rounded-[20px] overflow-hidden border border-[#f3f3f3]">
            <div className="px-[28px] py-[20px]">
              <div className="flex flex-col gap-[8px] items-center text-center">
                <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[17px] leading-[25.5px] tracking-[-0.34px] text-black">
                  다른 계정으로 구매한 운세예요
                </p>
                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[15px] leading-[20px] tracking-[-0.3px] text-[#868686]">
                  운세를 구매한 계정으로<br />다시 로그인해 주세요.
                </p>
              </div>
            </div>
            <div className="px-[24px] pb-[20px] flex flex-col gap-[8px]">
              <button
                onClick={handleLogoutAndRetry}
                className="w-full h-[48px] bg-[#48b2af] rounded-[12px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <span className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[16px] leading-[25px] tracking-[-0.32px] text-white">
                  다른 계정으로 로그인
                </span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full h-[48px] bg-[#f5f5f5] rounded-[12px] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <span className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[16px] leading-[25px] tracking-[-0.32px] text-[#666666]">
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
