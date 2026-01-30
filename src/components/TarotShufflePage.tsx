import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { TarotGame } from './TarotGame';
import { supabase } from '../lib/supabase';
import { getRandomTarotCard, getTarotCardImageUrl } from '../lib/tarotCards';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import { PageLoader } from './ui/PageLoader';

export default function TarotShufflePage() {
  // ⭐ iOS Safari viewport height 처리
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const from = searchParams.get('from');
  const contentIdParam = searchParams.get('contentId');

  // Parse questionOrder from URL, default to 1
  const questionOrderParam = searchParams.get('questionOrder');
  const questionOrder = questionOrderParam ? parseInt(questionOrderParam, 10) : 1;

  // ⭐ LoadingPage에서 전달받은 질문 텍스트 (즉시 렌더링용)
  const preloadedQuestionText = (location.state as any)?.preloadedQuestionText;

  const [questionText, setQuestionText] = useState<string>(preloadedQuestionText || '');
  const [contentIdState, setContentIdState] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // ⭐ 카드 저장 중 상태
  const [isSavingCard, setIsSavingCard] = useState(false);

  // ⭐ Preloading 디버그 로그
  useEffect(() => {
    if (preloadedQuestionText) {
      console.log('✅ [TarotShufflePage] 질문 텍스트 프리로드 성공:', preloadedQuestionText);
    }
  }, [preloadedQuestionText]);

  // ⭐ 세션 체크 상태 추가 (알림톡 링크 접속 시 세션 없으면 로그인 페이지로 리다이렉트)
  // ✅ 최적화: localStorage에 캐시된 유저 정보가 있으면 세션 체크 건너뛰기 (즉시 렌더링)
  const cachedUser = localStorage.getItem('user');
  const [isCheckingSession, setIsCheckingSession] = useState(!cachedUser);
  const [hasValidSession, setHasValidSession] = useState(!!cachedUser);

  // ⭐ 다른 계정 주문 에러 상태 (A 계정 구매 → B 계정 로그인 시)
  const [isWrongAccount, setIsWrongAccount] = useState(false);

  // ⭐ 세션 체크 - 알림톡 링크 접속 시 세션 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    const checkSession = async () => {
      console.log('🔐 [TarotShufflePage] 세션 체크 시작...');

      // DEV 모드 우회
      if (import.meta.env.DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          const localUser = JSON.parse(localUserJson);
          if (localUser.provider === 'dev') {
            console.log('🔧 [TarotShufflePage] DEV 모드 - 세션 체크 스킵');
            setHasValidSession(true);
            setIsCheckingSession(false);
            return;
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // ⭐ 세션 없음 → 현재 URL 저장 후 로그인 페이지로 리다이렉트
        const currentUrl = `${location.pathname}${location.search}`;
        console.log('🔐 [TarotShufflePage] 세션 없음 → 로그인 페이지로 리다이렉트');
        console.log('📍 [TarotShufflePage] 로그인 후 돌아올 URL:', currentUrl);

        localStorage.setItem('redirectAfterLogin', currentUrl);
        navigate('/login/new', { replace: true });
        return;
      }

      console.log('✅ [TarotShufflePage] 세션 유효:', user.id);
      setHasValidSession(true);
      setIsCheckingSession(false);
    };

    checkSession();
  }, [navigate, location.pathname, location.search]);

  // ⭐ 첫 번째 질문에서 뒤로가기 감지 - 구매내역 또는 콘텐츠 상세 페이지로 리다이렉트
  useEffect(() => {
    // 첫 번째 질문이 아니면 리다이렉트 로직 적용 안함
    if (questionOrder !== 1) return;

    const contentId = contentIdParam || contentIdState;
    if (!contentId) return;

    // 히스토리에 현재 페이지 상태 추가 (뒤로가기 감지용)
    window.history.pushState({ tarotShufflePage: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      // 구매내역에서 진입한 경우 구매내역으로, 아니면 콘텐츠 상세로
      if (from === 'purchase') {
        console.log('🔙 [TarotShufflePage] 뒤로가기 감지 → 구매내역 페이지로 이동');
        navigate('/purchase-history', { replace: true });
      } else {
        console.log('🔙 [TarotShufflePage] 뒤로가기 감지 → 콘텐츠 상세 페이지로 이동');
        navigate(`/master/content/detail/${contentId}`, { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [questionOrder, contentIdParam, contentIdState, from, navigate]);

  // DB에서 데이터 가져오기 - 세션 체크 완료 후에만 실행
  useEffect(() => {
    async function fetchData() {
      // ⭐ 세션 체크 완료 전이거나 세션이 없으면 데이터 로드 안 함
      if (!orderId || isCheckingSession || !hasValidSession) return;

      try {
        // 1. orders 테이블에서 content_id 가져오기 (없으면 URL 파라미터 사용)
        // ⭐ UUID이므로 parseInt 사용하지 않음
        let contentId: string | null = contentIdParam || null;

        if (!contentId) {
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('content_id')
            .eq('id', orderId)
            .single();

          // ⭐ 주문 조회 실패 → 다른 계정의 주문이거나 존재하지 않는 주문
          if (orderError || !orderData) {
            console.error('❌ [타로셔플] 다른 계정의 주문이거나 존재하지 않는 주문');
            setIsWrongAccount(true);
            return;
          }
          contentId = orderData.content_id;
        }

        if (contentId) {
          setContentIdState(contentId);

          // ⭐ 프리로드된 질문 텍스트가 있고 첫 번째 질문이면 DB 조회 건너뛰기
          if (preloadedQuestionText && questionOrder === 1) {
            console.log('⚡ [TarotShufflePage] 프리로드된 질문 사용 - DB 조회 생략');
            return;
          }

          // 2. ⭐ order_results에서 먼저 질문 텍스트 가져오기 (RLS 통과를 위해 orders 조인)
          const { data: orderResults, error: orderResultsError } = await supabase
            .from('order_results')
            .select(`
              question_order,
              question_text,
              question_type,
              orders!inner(user_id)
            `)
            .eq('order_id', orderId)
            .order('question_order', { ascending: true });

          if (!orderResultsError && orderResults && orderResults.length > 0) {
            // ⭐ order_results에 데이터가 있으면 여기서 가져온 question_text 사용
            const currentResult = orderResults.find(r => r.question_order === questionOrder);
            if (currentResult && currentResult.question_text) {
              console.log('🔍 [TarotShufflePage] questionOrder:', questionOrder);
              console.log('🔍 [TarotShufflePage] currentResult.question_text:', currentResult.question_text);
              setQuestionText(currentResult.question_text);
            }
          } else {
            // ⭐ order_results에 데이터가 없으면 master_content_questions에서 가져오기 (최초 카드 뽑기)
            const { data: flowData, error: flowError } = await supabase
              .from('master_content_questions')
              .select('*')
              .eq('content_id', contentId)
              .order('question_order', { ascending: true });

            if (flowError) throw flowError;

            if (flowData) {
              const currentFlow = flowData.find(f => f.question_order === questionOrder);
              if (currentFlow) {
                setQuestionText(currentFlow.question_text);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [orderId, contentIdParam, questionOrder, isCheckingSession, hasValidSession, preloadedQuestionText]);

  // ⭐ 카드 선택 완료 시 즉시 결과 페이지로 이동 (DB 업데이트는 백그라운드)
  const handleConfirmCard = async () => {
    if (!orderId || isSavingCard) return;

    setIsSavingCard(true);
    console.log('🎴 [TarotShufflePage] 선택 완료 클릭 → 즉시 결과 페이지로 이동');

    // ⭐ 캐시 무효화 (tarot_user_viewed가 false인 캐시 방지)
    try {
      localStorage.removeItem(`paid_result_${orderId}`);
      console.log('🗑️ [TarotShufflePage] 결과 캐시 무효화:', orderId);
    } catch (e) {
      // 무시
    }

    // ⭐ 즉시 결과 페이지로 이동 (사용자 경험 개선)
    // ⭐ state로 tarotJustSelected 전달 → UnifiedResultPage에서 타로 미선택 체크 스킵
    const fromParam = from ? `&from=${from}` : '';
    const contentIdParamStr = contentIdState ? `&contentId=${contentIdState}` : '';
    navigate(`/result?orderId=${orderId}&questionOrder=${questionOrder}${contentIdParamStr}${fromParam}`, {
      replace: true,
      state: { tarotJustSelected: true, selectedQuestionOrder: questionOrder }
    });

    // ⭐ 백그라운드에서 tarot_user_viewed 업데이트 (결과 페이지에서 카드 정보는 이미 DB에 있음)
    try {
      const { error: updateError } = await supabase
        .from('order_results')
        .update({ tarot_user_viewed: true })
        .eq('order_id', orderId)
        .eq('question_order', questionOrder);

      if (updateError) {
        console.error('❌ [TarotShufflePage] tarot_user_viewed 업데이트 실패 (무시):', updateError);
      } else {
        console.log('✅ [TarotShufflePage] tarot_user_viewed 업데이트 완료');
      }
    } catch (error) {
      console.error('❌ [TarotShufflePage] 백그라운드 업데이트 실패 (무시):', error);
    }
  };

  const handleClose = () => {
    // ⭐ 디버깅: from 파라미터 값 확인
    console.log('🔍 [TarotShufflePage] handleClose 호출');
    console.log('🔍 [TarotShufflePage] from 파라미터:', from);
    console.log('🔍 [TarotShufflePage] location.search:', location.search);
    console.log('🔍 [TarotShufflePage] 전체 URL:', window.location.href);

    // ⭐ from 파라미터에 따라 분기 처리
    if (from === 'purchase') {
      // 구매내역에서 접근한 경우 → 구매내역으로 이동
      console.log('✅ [TarotShufflePage] 구매내역에서 접근 → /purchase-history로 이동');
      navigate('/purchase-history', { replace: true });
    } else {
      // 결제 후 바로 접근한 경우 → 홈으로 이동
      console.log('✅ [TarotShufflePage] 결제 후 접근 (from=' + from + ') → 홈으로 이동');
      navigate('/');
    }
  };

  // ⭐ 다른 계정 주문 → 로그아웃 후 다시 로그인 유도
  const handleLogoutAndRetry = async () => {
    const currentUrl = `${location.pathname}${location.search}`;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    await supabase.auth.signOut();
    navigate('/login/new', { replace: true });
  };

  // ⭐ 세션 체크 중이거나 질문 텍스트 로드 전이면 로딩 화면 표시
  if (isCheckingSession || !questionText) {
    return <PageLoader />;
  }

  return (
    <div
      className="w-full max-w-[440px] mx-auto relative overflow-hidden"
      style={{
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: '#41a09e'
      }}
    >
      {/* TarotGame - 전체 화면 배경 */}
      <div className="absolute inset-0 w-full" style={{ minHeight: '100vh', height: '100%' }}>
        <TarotGame onConfirm={handleConfirmCard} title={questionText} />
      </div>

      {/* ⭐ Top Navigation - 고정 위치로 배치 */}
      <div className="fixed top-0 left-0 right-0 bg-white h-[52px] z-50 max-w-[440px] mx-auto">
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

      {/* ⭐ 타로 카드 뽑기 화면에서는 하단 네비게이션 & 목차 숨김 */}

      <SessionExpiredDialog isOpen={isSessionExpired} />

      {/* ⭐ 다른 계정 주문 모달 (A 계정 구매 → B 계정 로그인 시) */}
      {isWrongAccount && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* 배경 dim 처리 */}
          <div className="absolute inset-0 bg-black/50" />

          {/* 다이얼로그 */}
          <div className="relative w-[320px] bg-white rounded-[20px] overflow-hidden border border-[#f3f3f3]">
            {/* 텍스트 영역 */}
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

            {/* 버튼 영역 */}
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