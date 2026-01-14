import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import svgPaths from "../imports/svg-ir0ch2bhrx";
import { BottomNavigation } from './BottomNavigation';
import { TarotGame } from './TarotGame';
import { supabase } from '../lib/supabase';
import img3 from "figma:asset/f494ca2b3b180a2d66b2960718e3e515db3248a2.png";
import imgAvocado from "figma:asset/e1537c8771a828aa09f2f853176e35c41217f557.png";
import TableOfContentsBottomSheet from './TableOfContentsBottomSheet';
import { SessionExpiredDialog } from './SessionExpiredDialog';

interface TarotResult {
  question_order: number;
  question_text: string;
  card_image_url?: string;
  card_name?: string;
  content_id?: string;
  question_type?: 'tarot' | 'saju';
}

export default function TarotShufflePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const from = searchParams.get('from');
  const contentIdParam = searchParams.get('contentId');
  
  // Parse questionOrder from URL, default to 1
  const questionOrderParam = searchParams.get('questionOrder');
  const questionOrder = questionOrderParam ? parseInt(questionOrderParam, 10) : 1;

  const [phase, setPhase] = useState<'scatter' | 'fan' | 'picked'>('scatter');
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [fanCardPositions, setFanCardPositions] = useState<Array<{ inset: string; rotate: number; skewX: number }>>([]);
  const [questionText, setQuestionText] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<number>(1);
  const [contentIdState, setContentIdState] = useState<string | null>(null);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [allResults, setAllResults] = useState<TarotResult[]>([]);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

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

          // 2. contents_flow 테이블에서 전체 질문 목록과 현재 질문 텍스트 가져오기
          const { data: flowData, error: flowError } = await supabase
            .from('master_content_questions')
            .select('*')
            .eq('content_id', contentId)
            .order('question_order', { ascending: true });

          if (flowError) throw flowError;

          if (flowData) {
             setAllResults(flowData.map(item => ({
              question_order: item.question_order,
              question_text: item.question_text,
              question_type: item.question_type
            })));

            const currentFlow = flowData.find(f => f.question_order === questionOrder);
            if (currentFlow) {
              setQuestionText(currentFlow.question_text);
            }
            setTotalQuestions(flowData.length);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [orderId, contentIdParam, questionOrder, isCheckingSession, hasValidSession]);


  // Initialize fan positions
  useEffect(() => {
    const count = 21;
    const baseAngle = 10;
    const positions = [];
    for (let i = 0; i < count; i++) {
      const offset = i - (count - 1) / 2;
      const rotate = offset * 5;
      const xOffset = offset * 12; // Spread horizontal
      const yOffset = Math.abs(offset) * 2; // Arch effect

      // Using inset for positioning relative to center bottom
      // left: 50% + xOffset
      // top: yOffset
      // But in the fan phase, we want them clustered.
      
      // Let's approximate the Figma layout logic for 'fan'
      // In Figma, they are absolutely positioned.
      // We'll use a simplified relative positioning here or standard absolute.
      
      // Re-reading Figma import might help, but let's stick to a clean logical arch.
      // The original code used style={{ inset: ... }} which is tricky.
      // Let's use standard left/transform.
      
      positions.push({
        inset: `${yOffset}px auto auto calc(50% + ${xOffset}px)`, // Approximate
        rotate: rotate,
        skewX: 0
      });
    }
    // Better Fan Logic matching the visual:
    // They are centered.
    const newPositions = Array(21).fill(0).map((_, i) => {
      const total = 21;
      const center = (total - 1) / 2;
      const dist = i - center;
      const rotate = dist * 4; 
      const x = dist * 8; // tighter overlap
      const y = Math.abs(dist) * 3;
      
      return {
        inset: `${y}px auto auto calc(50% + ${x}px)`, 
        rotate: rotate,
        skewX: 0
      };
    });
    setFanCardPositions(newPositions);
  }, []);

  // Scatter -> Fan animation
  useEffect(() => {
    if (phase === 'scatter') {
      const timer = setTimeout(() => {
        setPhase('fan');
      }, 1000); // 1 second scatter then fan
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleCardClick = (index: number) => {
    if (phase === 'fan') {
      setPhase('picked');
      setSelectedCardIndex(index);
    }
  };

  const handleShuffle = () => {
    setPhase('scatter');
    setSelectedCardIndex(null);
  };

  const handleConfirmCard = () => {
    // Navigate to next step or result loading
    // For now, let's assume we go to result loading or interpretation
    // Based on user flow, maybe 'Analysis' page.
    // Let's navigate to the same result page with a 'step=loading' or similar?
    // Or maybe the next question?
    
    // Logic: Save selection (mock) and go next
    // navigate(`/result/tarot?orderId=${orderId}&questionOrder=${questionOrder}&step=loading...`);
    // Check Next Logic from BottomNav:
    const fromParam = from ? `&from=${from}` : '';
    const contentIdParamStr = contentIdState ? `&contentId=${contentIdState}` : '';
    navigate(`/result/tarot?orderId=${orderId}&questionOrder=${questionOrder}${contentIdParamStr}${fromParam}&step=3`); // step=3 might be result
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
  
  const handleToggleList = () => {
    setShowTableOfContents(true);
  };

  // ⭐ 다른 계정 주문 → 로그아웃 후 다시 로그인 유도
  const handleLogoutAndRetry = async () => {
    const currentUrl = `${location.pathname}${location.search}`;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    await supabase.auth.signOut();
    navigate('/login/new', { replace: true });
  };

  // ⭐ 세션 체크 중이면 로딩 화면 표시
  if (isCheckingSession) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full max-w-[440px] mx-auto">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white w-full max-w-[440px] mx-auto relative flex flex-col h-screen">
      {/* ⭐ Top Navigation - z-index를 50에서 20으로 변경 (바텀시트 딤 z-40보다 낮게) */}
      <div className="bg-white h-[52px] relative shrink-0 w-full sticky top-0 z-20">
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

      <div className="flex flex-col flex-1 relative w-full overflow-hidden">
        {/* Main Content Area - Centered */}
        <div className="flex-1 w-full relative pb-[68px]">
          <TarotGame onConfirm={handleConfirmCard} title={questionText} />
        </div>
      </div>

      <BottomNavigation
        disableShadow
        currentStep={questionOrder}
        totalSteps={totalQuestions}
        onPrevious={() => {
          // ... logic ...
           navigate(-1); // Simple fallback
        }}
        onNext={() => {
          // 타로 결과 페이지로 이동
          const fromParam = from ? `&from=${from}` : '';
          const contentIdParamStr = contentIdState ? `&contentId=${contentIdState}` : '';
          navigate(`/result/tarot?orderId=${orderId}&questionOrder=${questionOrder}${contentIdParamStr}${fromParam}`);
        }}
        onToggleList={handleToggleList}
        disablePrevious={questionOrder === 1}
      />

      {/* TableOfContentsBottomSheet 내부에 AnimatePresence가 있으므로 외부 AnimatePresence 제거 */}
      {orderId && contentIdState && (
        <TableOfContentsBottomSheet
          isOpen={showTableOfContents}
          onClose={() => setShowTableOfContents(false)}
          orderId={orderId}
          contentId={contentIdState}
          currentQuestionOrder={questionOrder}
        />
      )}

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