import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from "../imports/svg-ir0ch2bhrx";
import { supabase, supabaseUrl } from '../lib/supabase';
import { getTarotCardImageUrl } from '../lib/tarotCards';
import { getCachedTarotImage, cacheTarotImage } from '../lib/tarotImageCache';
import TableOfContentsBottomSheet from './TableOfContentsBottomSheet';
import { BottomNavigation } from './BottomNavigation';

interface TarotResult {
  question_order: number;
  question_text: string;
  gpt_response: string;
  tarot_card_id: string | null;
  tarot_card_name: string | null;
  tarot_card_image_url: string | null;
}

export default function TarotResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const questionOrder = parseInt(searchParams.get('questionOrder') || '1');
  const contentId = searchParams.get('contentId');
  const from = searchParams.get('from');

  const [result, setResult] = useState<TarotResult | null>(null);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [imageError, setImageError] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [contentIdState, setContentIdState] = useState<string | null>(contentId);
  const [cardImageUrl, setCardImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  // ⭐ 애니메이션 방향 상태 관리
  const prevOrderRef = useRef<number>(questionOrder);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (questionOrder > prevOrderRef.current) {
      setDirection(1); // 다음 페이지 (오른쪽에서 왼쪽으로)
    } else if (questionOrder < prevOrderRef.current) {
      setDirection(-1); // 이전 페이지 (왼쪽에서 오른쪽으로)
    } else {
        setDirection(0);
    }
    prevOrderRef.current = questionOrder;
  }, [questionOrder]);

  // 🔝 페이지 진입 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [orderId, questionOrder]);

  // 타로 결과 로드
  useEffect(() => {
    const loadResult = async () => {
      if (!orderId) return;

      try {
        console.log('📥 [타로결과] 데이터 로드 시작:', { orderId, questionOrder });

        if (from === 'dev') {
          console.log('🔧 [개발 모드] 타로 결과 페이지 - mock 데이터 사용');
          
          const mockResult: TarotResult = {
            question_order: questionOrder,
            question_text: "그와 나의 인연은 어떻게 발전할까요?",
            gpt_response: `[개발용 Mock 데이터]

뽑으신 카드는 "연인" 카드입니다.

연인 카드는 사랑과 선택, 그리고 운명적인 만남을 상징하는 카드입니다. 이 카드가 나왔다는 것은 당신과 그 사람의 인연이 단순한 우연이 아닌, 깊은 의미를 가진 만남임을 시사합니다.

**현재 상황**
두 사람은 서로에게 강하게 끌리고 있으며, 이는 단순한 호감을 넘어선 영혼의 교감입니다. 하지만 동시에 중요한 선택의 기로에 서 있습니다. 관계를 더욱 깊게 발전시킬 것인지, 아니면 현재의 상태를 유지할 것인지에 대한 결정이 필요한 시점입니다.

**미래 전망**
연인 카드는 긍정적인 발전을 예고합니다. 다만 이 관계가 진정으로 의미 있는 것이 되기 위해서는 서로에 대한 솔직함과 진실된 마음이 필요합니다. 겉치레나 가식 없이, 진심으로 상대방을 이해하려는 노력이 중요합니다.

**조언**
지금은 마음을 열고 용기를 내어 진심을 표현할 때입니다. 두려워하지 말고, 당신의 진정한 감정을 상대방과 나누세요. 그 과정에서 두 사람의 인연은 더욱 깊어질 것입니다.`,
            tarot_card_id: "6",
            tarot_card_name: "연인 (The Lovers)",
            tarot_card_image_url: "https://via.placeholder.com/150x260?text=The+Lovers"
          };
          
          const mockAllResults = [
            mockResult,
            {
              question_order: 2,
              question_text: "상대방은 나를 어떻게 생각하고 있을까요?",
              question_type: 'saju',
              gpt_response: "..."
            },
            {
              question_order: 3,
              question_text: "관계 발전을 위해 내가 주의해야 할 점은?",
              question_type: 'saju',
              gpt_response: "..."
            }
          ];
          
          setResult(mockResult);
          setAllResults(mockAllResults);
          setTotalQuestions(mockAllResults.length);
          setContentIdState('mock_content_id');
          setCardImageUrl(mockResult.tarot_card_image_url || '');
          setImageLoading(false);
          setLoading(false);
          return;
        }

        const { data: allData, error: allError } = await supabase
          .from('order_results')
          .select('question_order, question_text, gpt_response, question_type, tarot_card_id, tarot_card_name, tarot_card_image_url')
          .eq('order_id', orderId)
          .order('question_order', { ascending: true });

        if (allError) throw allError;
        if (allData) {
          setAllResults(allData);
          setTotalQuestions(allData.length);
          preloadNextTarotImages(allData, questionOrder);
        }

        const { data, error } = await supabase
          .from('order_results')
          .select('question_order, question_text, gpt_response, tarot_card_id, tarot_card_name, tarot_card_image_url')
          .eq('order_id', orderId)
          .eq('question_order', questionOrder)
          .single();

        if (error) throw error;
        if (data) {
          console.log('✅ [타로결과] 데이터 로드 성공:', data);
          setResult(data as TarotResult);
        }

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('content_id')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;
        if (orderData) {
          console.log('✅ [타로결과] contentId 조회 성공:', orderData.content_id);
          setContentIdState(orderData.content_id);
        }
      } catch (error) {
        console.error('❌ [타로결과] 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [orderId, questionOrder]);

  const preloadNextTarotImages = (allData: any[], currentOrder: number) => {
    const tarotQuestions = allData
      .filter(q => q.question_order >= currentOrder && q.question_type === 'tarot')
      .slice(0, 4);
    
    if (tarotQuestions.length === 0) return;

    console.log(`🎴 [타로프리로드] ${tarotQuestions.length}장 프리로드 시작`);
    
    tarotQuestions.forEach((q: any) => {
      if (q.tarot_card_name && q.tarot_card_image_url) {
        cacheTarotImage(q.tarot_card_name, q.tarot_card_image_url).catch(err => {
          console.warn(`⚠️ [타로프리로드] 실패 (무시): ${q.tarot_card_name}`, err);
        });
      }
    });
  };

  useEffect(() => {
    const loadCardImage = async () => {
      if (!result || !result.tarot_card_name) {
        setCardImageUrl('https://via.placeholder.com/150x260/48b2af/ffffff?text=No+Card');
        setImageLoading(false);
        return;
      }

      const cachedImage = await getCachedTarotImage(result.tarot_card_name);
      
      if (cachedImage) {
        console.log('⚡ [타로결과] 캐시 히트:', result.tarot_card_name);
        setCardImageUrl(cachedImage);
        setImageLoading(false);
      } else {
        console.log('🌐 [타로결과] 네트워크 로드:', result.tarot_card_name);
        setImageLoading(true);
        const storageUrl = getTarotCardImageUrl(result.tarot_card_name, supabaseUrl);
        setCardImageUrl(storageUrl);
        
        if (result.tarot_card_image_url) {
          cacheTarotImage(result.tarot_card_name, result.tarot_card_image_url).catch(err => {
            console.warn('⚠️ [타로결과] 백그라운드 캐싱 실패:', err);
          });
        }
      }
    };

    loadCardImage();
  }, [result]);

  const handlePrevious = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const prevResult = allResults.find(r => r.question_order === questionOrder - 1);
    
    if (!prevResult) return;
    
    if (prevResult.question_type === 'tarot') {
      navigate(`/result/tarot?orderId=${orderId}&questionOrder=${prevResult.question_order}`);
      return;
    }
    
    navigate(`/result/saju?orderId=${orderId}&startPage=${prevResult.question_order}`);
  };

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const nextResult = allResults.find(r => r.question_order === questionOrder + 1);
    
    if (!nextResult) {
      if (from === 'dev') {
        const contentIdParam = contentIdState || contentId || 'mock_content_id';
        navigate(`/loading?orderId=${orderId}&contentId=${contentIdParam}&from=dev`);
        return;
      }
      navigate('/result/complete', { state: { orderId } });
      return;
    }
    
    if (nextResult.question_type === 'tarot') {
      const fromParam = from ? `&from=${from}` : '';
      const contentIdParam = contentIdState || contentId ? `&contentId=${contentIdState || contentId}` : '';
      navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${nextResult.question_order}${contentIdParam}${fromParam}`);
      return;
    }
    
    const fromParam = from ? `&from=${from}` : '';
    navigate(`/result/saju?orderId=${orderId}&startPage=${nextResult.question_order}${fromParam}`);
  };

  const handleClose = () => {
    if (from === 'purchase') {
      navigate('/purchase-history', { replace: true });
    } else {
      navigate('/');
    }
  };

  const handleToggleList = () => {
    setShowTableOfContents(!showTableOfContents);
  };

  if (loading) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full max-w-[440px] mx-auto">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white flex items-center justify-center min-h-screen w-full max-w-[440px] mx-auto">
        <p className="text-[#999999]">풀이 결과를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const cardName = result.tarot_card_name || '카드 정보 없음';

  // ⭐ 슬라이드 애니메이션 Variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : direction < 0 ? -50 : 0,
      opacity: 0,
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

  return (
    <div className="bg-white relative min-h-screen w-full max-w-[440px] mx-auto">
      {/* Top Navigation */}
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

      <div className="h-[8px] shrink-0 w-full" />

      {/* Content Card - Slide Animation Area */}
      <div className="px-[20px] pb-[200px] w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={questionOrder}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ 
                duration: 0.3,
                ease: "easeInOut" 
            }}
            className="bg-[#f9f9f9] rounded-[16px] p-[20px] w-full"
          >
            {/* Header with Number and Divider */}
            <div className="flex gap-[12px] items-center mb-[40px] w-full">
              <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[20px] leading-[28px] tracking-[-0.2px] text-[#48b2af] shrink-0">
                {String(result.question_order).padStart(2, '0')}
              </p>
              <div className="flex-1 h-0 border-t border-[#e7e7e7]" />
            </div>

            {/* Content Container */}
            <div className="flex flex-col gap-[24px] items-center w-full">
              {/* Tarot Card Image */}
              <div className="relative h-[260px] w-[150px] rounded-[16px] shadow-[6px_7px_12px_0px_rgba(0,0,0,0.04),-3px_-3px_12px_0px_rgba(0,0,0,0.04)] overflow-hidden bg-[#f0f0f0] shrink-0">
                <img
                  src={cardImageUrl}
                  alt={cardName}
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ [타로결과] 이미지 로드 실패:', cardImageUrl);
                    setImageError(true);
                  }}
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

              {/* Card Name and Response */}
              <div className="flex flex-col gap-[24px] w-full">
                {/* Card Name */}
                <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[18px] leading-[24px] tracking-[-0.36px] text-[#151515] text-center w-full break-keep">
                  {cardName}
                </p>

                {/* Response Text */}
                <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[16px] leading-[28.5px] tracking-[-0.32px] text-[#151515] whitespace-pre-wrap break-words w-full">
                  {result.gpt_response.split(/(\*\*.*?\*\*)/g).map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <span key={index} className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[17px]">
                          {part.slice(2, -2)}
                        </span>
                      );
                    }
                    return part;
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation - Fixed */}
      <BottomNavigation
        currentStep={questionOrder}
        totalSteps={totalQuestions}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToggleList={handleToggleList}
        disablePrevious={questionOrder === 1}
      />

      {/* Table of Contents Bottom Sheet */}
      {showTableOfContents && orderId && (contentIdState || contentId) && (
        <TableOfContentsBottomSheet
          isOpen={showTableOfContents}
          onClose={() => setShowTableOfContents(false)}
          orderId={orderId}
          contentId={contentIdState || contentId || ''}
          currentQuestionOrder={questionOrder}
        />
      )}
    </div>
  );
}