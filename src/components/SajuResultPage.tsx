import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import svgPaths from "../imports/svg-ir0ch2bhrx"; // ⭐ 타로와 동일한 SVG 사용
import { BottomNavigation } from './BottomNavigation';
import { supabase, supabaseUrl } from '../lib/supabase';
import { getCachedTarotImage } from '../lib/tarotImageCache';
import { getTarotCardImageUrl } from '../lib/tarotCards';
import TableOfContentsBottomSheet from './TableOfContentsBottomSheet';

interface Answer {
  question_order: number;
  question_text: string;
  gpt_response: string;
  question_type?: 'saju' | 'tarot';  // ⭐ 타로/사주 구분
  tarot_card_id?: string | null;
  tarot_card_name?: string | null;
  tarot_card_image_url?: string | null;
}

export default function SajuResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const contentIdParam = searchParams.get('contentId'); // URL에서 받은 contentId
  const startPage = parseInt(searchParams.get('startPage') || '1'); // ⭐ startPage 파라미터 추가
  const from = searchParams.get('from'); // ⭐ 출처 파라미터 추가 (purchase, 등)

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentPage, setCurrentPage] = useState(startPage); // ⭐ startPage로 초기화
  const [loading, setLoading] = useState(true);
  const [contentTitle, setContentTitle] = useState('상세 풀이');
  const [isTableOfContentsOpen, setIsTableOfContentsOpen] = useState(false); // ⭐ 목차 바텀시트 상태
  const [contentId, setContentId] = useState<string | null>(contentIdParam); // ⭐ contentId state 추가
  const [tarotImageUrl, setTarotImageUrl] = useState<string | null>(null); // ⭐ 타로 이미지 URL state
  const [imageLoading, setImageLoading] = useState(false); // ⭐ 이미지 로딩 state

  console.log('🔍 [SajuResultPage] 초기화:', { orderId, contentId, startPage, currentPage });

  // 🔝 페이지 진입 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [orderId]); // orderId가 바뀔 때마다 최상단으로

  // ⭐ URL의 startPage가 변경되면 currentPage 업데이트
  useEffect(() => {
    setCurrentPage(startPage);
    console.log('📄 [SajuResultPage] 페이지 변경:', startPage);
  }, [startPage]);
  
  // 🔝 currentPage 변경 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // 답변 데이터 로드
  useEffect(() => {
    const loadAnswers = async () => {
      if (!orderId) return;

      try {
        console.log('📊 데이터 로드 시작:', { orderId });

        // ⚠️ [개발 모드] from=dev 파라미터가 있으면 mock 데이터 사용
        if (from === 'dev') {
          console.log('🔧 [개발 모드] 사주 결과 페이지 - mock 데이터 사용');
          
          // Mock 데이터 생성
          const mockAnswers: Answer[] = [
            {
              question_order: 1,
              question_text: "그와 나의 인연은 어떻게 발전할까요?",
              question_type: 'saju',
              gpt_response: `[개발용 Mock 데이터]

당신과 그 사람의 인연은 서로를 성장시키는 특별한 관계로 발전할 가능성이 높습니다.

사주를 살펴보니, 두 사람의 오행 배치가 서로를 보완하는 구조를 이루고 있습니다. 특히 당신의 목(木) 기운과 상대방의 수(수) 기운이 조화를 이루며, 서로에게 긍정적인 영향을 주고받을 수 있는 배치입니다.

현재는 서로를 탐색하는 단계이지만, 시간이 지남에 따라 더욱 깊은 신뢰와 이해의 관계로 발전할 것으로 보입니다. 다만 성급하게 결과를 얻으려 하기보다는, 자연스러운 흐름 속에서 관계를 발전시켜 나가는 것이 중요합니다.

올해 하반기부터는 두 사�� 사이에 중요한 전환점이 찾아올 것으로 예상됩니다. 이 시기에 솔직한 대화를 나누고 서로의 진심을 확인한다면, 관계는 더욱 견고해질 것입니다.`,
              tarot_card_id: null,
              tarot_card_name: null,
              tarot_card_image_url: null
            },
            {
              question_order: 2,
              question_text: "상대방은 나를 어떻게 생각하고 있을까요?",
              question_type: 'saju',
              gpt_response: `[개발용 Mock 데이터]

상대방은 당신을 매우 특별한 존재로 인식하고 있습니다.

당신의 사주를 통해 상대방의 시선을 읽어보니, 당신의 진솔함과 따뜻한 마음씨에 깊은 인상을 받았을 것으로 보입니다. 특히 당신이 가진 화(화) 기운의 열정과 진심 어린 태도가 상대방의 마음에 강하게 각인되어 있습니다.

다만 상대방도 조심스러워하고 있는 모습이 보입니다. 이는 당신을 소중하게 생각하기 때문에 신중하게 접근하고 싶어하는 마음의 표현일 수 있습니다.

현재 상대방은 당신과의 관계를 진지하게 고민하고 있으며, 앞으로 어떻게 발전시켜 나갈지 내면적으로 준비하는 시간을 가지고 있습니다. 조금 더 시간을 주면서 기다려주는 것이 좋겠습니다.`,
              tarot_card_id: null,
              tarot_card_name: null,
              tarot_card_image_url: null
            },
            {
              question_order: 3,
              question_text: "관계 발전을 위해 내가 주의해야 할 점은?",
              question_type: 'saju',
              gpt_response: `[개발용 Mock 데이터]

관계 발전을 위해서는 몇 가지 주의해야 할 점들이 있습니다.

먼저, 당신의 강한 토(토) 기운으로 인해 때때로 고집이 세거나 자신의 방식을 고수하려는 경향이 있을 수 있습니다. 상대방과의 관계에서는 이러한 면을 조금 유연하게 조절할 필요가 있습니다.

또한 감정 표현에 있어서도 균형을 찾는 것이 중요합니다. 너무 급하게 마음을 드러내려 하기보다는, 자연스럽게 진심이 전달될 수 있도록 여유를 가지는 것이 좋습니다.

무엇보다 중요한 것은 상대방의 속도를 존중하는 것입니다. 당신이 원하는 속도와 상대방이 편안하게 느끼는 속도가 다를 수 있으니, 서로의 리듬을 맞춰가는 과정이 필요합니다.

이러한 점들을 염두에 두고 관계를 발전시켜 나간다면, 두 사람은 서로를 더욱 깊이 이해하고 사랑하는 관계로 성장할 수 있을 것입니다.`
            }
          ];
          
          setAnswers(mockAnswers);
          setContentTitle('[개발용] 사주 풀이 샘플');
          setLoading(false);
          return;
        }

        // ⭐️ order_results 테이블에서 직접 조회
        const { data: resultsData, error: resultsError } = await supabase
          .from('order_results')
          .select('question_order, question_text, gpt_response, question_type, tarot_card_id, tarot_card_name, tarot_card_image_url')
          .eq('order_id', orderId)
          .order('question_order', { ascending: true });

        if (resultsError) {
          console.error('❌ order_results 조회 실패:', resultsError);
          throw resultsError;
        }

        console.log('🔍 order_results 데이터:', resultsData);
        console.log('📊 [중요] order_results 개수:', resultsData?.length);
        console.log('📊 [중요] 각 결과의 question_order:', resultsData?.map(r => r.question_order));

        if (resultsData && resultsData.length > 0) {
          setAnswers(resultsData as Answer[]);
        } else {
          console.warn('⚠️ order_results가 비어있습니다. 로딩 페이지로 리다이렉트');
          
          // ⭐ 콘텐츠 ID 가져오기 (로딩 페이지 이동용)
          let redirectContentId = contentIdParam;
          
          if (!redirectContentId) {
            // URL에 contentId가 없으면 orders 테이블에서 조회
            const { data: orderData } = await supabase
              .from('orders')
              .select('content_id')
              .eq('id', orderId)
              .single();
            
            redirectContentId = orderData?.content_id || '';
          }
          
          // 로딩 페이지로 리다이렉트 (API call 아직 진행 중)
          console.log('🔄 [사주결과] 로딩 페이지로 리다이렉트:', { orderId, contentId: redirectContentId });
          navigate(`/loading?orderId=${orderId}&contentId=${redirectContentId}`);
          return;
        }

        // 콘텐츠 타이틀 가져오기 (별도 쿼리)
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('master_contents(title), content_id')
          .eq('id', orderId)
          .single();

        if (orderData?.master_contents) {
          setContentTitle((orderData.master_contents as any).title || '사주 풀이');
        }

        // ⭐ contentId 설정 (URL에서 받지 못한 경우 orders 테이블에서 가져오기)
        if (!contentIdParam && orderData?.content_id) {
          console.log('✅ [사주결과] contentId 조회 성공:', orderData.content_id);
          setContentId(orderData.content_id);
        }
      } catch (error) {
        console.error('❌ 답변 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnswers();
  }, [orderId, contentIdParam]); // ⭐ contentIdParam dependency 추가

  const currentAnswer = answers[currentPage - 1];
  const totalPages = answers.length;

  // ⭐ 타로 카드 이미지 URL (캐시 우선) - Cache API 사용
  const getTarotImageUrl = async (answer: Answer): Promise<string | null> => {
    if (!answer.tarot_card_name) return null;
    
    // 1. Cache API 확인
    const cachedImage = await getCachedTarotImage(answer.tarot_card_name);
    if (cachedImage) {
      console.log('⚡ [사주결과-타로] 캐시 히트:', answer.tarot_card_name);
      return cachedImage; // Blob URL
    }
    
    // 2. 캐시 없으면 원본 URL 사용 (DB에 저장된 URL)
    if (answer.tarot_card_image_url) {
      console.log('🌐 [사주결과-타로] DB URL 사용:', answer.tarot_card_name);
      return answer.tarot_card_image_url;
    }
    
    // 3. 둘 다 없으면 Supabase Storage URL 생성
    console.log('🔗 [사주결과-타로] Storage URL 생성:', answer.tarot_card_name);
    return getTarotCardImageUrl(answer.tarot_card_name, supabaseUrl);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    console.log('🔵 [SajuResultPage] 다음 버튼 클릭');
    console.log('📌 [SajuResultPage] currentPage:', currentPage);
    console.log('📌 [SajuResultPage] totalPages:', totalPages);
    
    // ⭐ 현재 질문과 다음 질문 확인
    const currentAnswer = answers[currentPage - 1];
    const nextAnswer = answers[currentPage]; // currentPage는 1-based, 배열은 0-based
    
    console.log('📌 [SajuResultPage] 현재 질문:', currentAnswer?.question_order, currentAnswer?.question_type);
    console.log('📌 [SajuResultPage] 다음 질문:', nextAnswer?.question_order, nextAnswer?.question_type);
    
    // ⭐ 다음 질문이 없으면 → 풀이 완료 페이지
    if (!nextAnswer) {
      console.log('✅ [SajuResultPage] 마지막 질문 도달 → /result/complete로 이동');
      navigate('/result/complete', { 
        state: { 
          orderId,
          contentId,
          contentTitle 
        } 
      });
      return;
    }
    
    // ⭐ 다음 질문이 타로면 → 타로 셔플 페이지
    if (nextAnswer.question_type === 'tarot') {
      console.log('🎴 [SajuResultPage] 다음 질문이 타로 → 타로 셔플 페이지로 이동');
      console.log('🎴 [SajuResultPage] 이동 URL:', `/tarot/shuffle?orderId=${orderId}&questionOrder=${nextAnswer.question_order}`);
      navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${nextAnswer.question_order}`);
      return;
    }
    
    // ⭐ 다음 질문이 사주면 → 다음 페이지로 이동
    console.log('➡️ [SajuResultPage] 다음 질문이 사주 → 다음 페이지로 이동:', currentPage + 1);
    setCurrentPage(currentPage + 1);
  };

  const handleClose = () => {
    // ⭐ 출처에 따라 분기 처리
    if (from === 'purchase') {
      // 구매내역에서 접근한 경우 → 뒤로가기 (replace로 이미 처리됨)
      console.log('✅ [SajuResultPage] 구매내역에서 접근 → 뒤로가기');
      navigate(-1); // ⭐ 뒤로가기로 변경 (replace로 왔으므로 프로필로 이동)
    } else {
      // 결제 후 바로 접근한 경우 → 홈으로 이동
      console.log('✅ [SajuResultPage] 결제 후 접근 → 홈으로 이동');
      navigate('/');
    }
  };

  const handleToggleList = () => {
    // TODO: 목록 토글 구현
    console.log('목록 토글');
    setIsTableOfContentsOpen(!isTableOfContentsOpen);
  };

  if (loading) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full max-w-[440px] mx-auto">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white relative min-h-screen w-full max-w-[440px] mx-auto">
      {/* Top Navigation */}
      <div className="bg-white h-[52px] relative shrink-0 w-full sticky top-0 z-20">
        <div className="flex items-center justify-between px-[12px] h-full w-full">
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

      {/* Spacer */}
      <div className="h-[8px] shrink-0 w-full" />

      {/* Content Area - Scrollable */}
      <div className="px-[20px] pb-[200px] w-full">
        {currentAnswer ? (
          <div className="bg-[#f9f9f9] rounded-[16px] p-[20px] w-full">
            {/* Header */}
            <div className="flex gap-[12px] items-center mb-[24px] w-full">
              <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[20px] leading-[28px] tracking-[-0.2px] text-[#48b2af] shrink-0">
                {String(currentAnswer.question_order).padStart(2, '0')}
              </p>
              <div className="flex-1 h-0 border-t border-[#e7e7e7]" />
            </div>

            {/* ⭐ 타로 카드 이미지 + 카드명 (타로 질문인 경우만) */}
            {currentAnswer.question_type === 'tarot' && (
              <div className="flex flex-col items-center gap-[24px] mb-[24px] w-full">
                {currentAnswer.tarot_card_image_url && (
                  <div className="relative h-[260px] w-[150px] rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] overflow-hidden bg-[#f0f0f0] shrink-0">
                    <img
                      src={tarotImageUrl || currentAnswer.tarot_card_image_url}
                      alt={currentAnswer.tarot_card_name || 'Tarot Card'}
                      className="w-full h-full object-cover"
                      onLoad={() => setImageLoading(false)}
                    />
                    {imageLoading && (
                      <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
                      </div>
                    )}
                  </div>
                )}
                
                {currentAnswer.tarot_card_name && (
                  <div className="w-full">
                    <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[18px] leading-[24px] tracking-[-0.36px] text-[#151515] text-center w-full break-keep">
                      {currentAnswer.tarot_card_name}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div className="mb-[24px] w-full">
              <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[18px] leading-[24px] tracking-[-0.36px] text-[#151515] break-keep">
                {currentAnswer.question_text}
              </p>
            </div>

            {/* Answer Text */}
            <div className="font-['Pretendard_Variable:Regular',sans-serif] text-[16px] leading-[28.5px] tracking-[-0.32px] text-[#151515] whitespace-pre-wrap break-words w-full">
              {currentAnswer.gpt_response.split(/(\*\*.*?\*\*)/g).map((part, index) => {
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
          </div>
        ) : (
          <div className="text-center py-[60px] w-full">
            <p className="text-[#999999]">풀이 결과를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Fixed */}
      <BottomNavigation
        currentStep={currentPage}
        totalSteps={totalPages}
        onPrevious={() => {
          const currentQ = answers[currentPage - 1];
          // [DEV] 타로 질문인 경우, '이전' 클릭 시 타로 결과 화면으로 이동 (중간 단계 생략 방지)
          if (currentQ?.question_type === 'tarot') {
            const fromParam = from ? `&from=${from}` : '';
            const contentIdParam = contentId ? `&contentId=${contentId}` : '';
            // step=1: 타로 결과 화면으로 이동
            navigate(`/result/tarot?orderId=${orderId}&questionOrder=${currentQ.question_order}${contentIdParam}${fromParam}&step=1`);
            return;
          }
          // 사주 질문인 경우 기존 로직 (내부 페이지 이동)
          handlePrevious();
        }}
        onNext={handleNext}
        onToggleList={() => {
          if (!contentId) setContentId('mock_content_id');
          handleToggleList();
        }}
        disablePrevious={answers[currentPage - 1]?.question_type !== 'tarot' && currentPage === 1}
      />

      {/* Table of Contents Bottom Sheet */}
      {orderId && contentId && (
        <TableOfContentsBottomSheet
          isOpen={isTableOfContentsOpen}
          onClose={() => setIsTableOfContentsOpen(false)}
          orderId={orderId}
          contentId={contentId}
          currentQuestionOrder={currentPage}
        />
      )}
    </div>
  );
}