/**
 * 목차 바텀시트 컴포넌트
 * 
 * @description
 * 상세 풀이 페이지에서 목차 아이콘 클릭 시 노출되는 바텀시트입니다.
 * 사용자가 원하는 질문으로 빠르게 이동할 수 있도록 전체 질문 리스트를 제공합니다.
 * 
 * @features
 * - 드래그 핸들로 확장/축소/닫기
 * - 딤 배경 클릭 시 닫기
 * - '목차 닫기' 버튼으로 닫기
 * - 질문 리스트 표시 (스크롤 가능)
 * - 현재 보고 있는 질문에 '보는 중' 태그
 * - 질문 클릭 시 해당 페이지로 이동
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Question {
  id: string;
  question_id: string;
  question_order: number;
  question_text: string;
  question_type: 'saju' | 'tarot';
  tarot_user_viewed: boolean | null;
}

interface ContentInfo {
  title: string;
  thumbnail_url: string | null;
}

interface TableOfContentsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  contentId: string;
  currentQuestionOrder: number; // 현재 보고 있는 질문 번호
}

/**
 * 홈 인디케이터 컴포넌트
 */
function HomeIndicatorLight() {
  return (
    null
  );
}

/**
 * 목차 바텀시트 메인 컴포넌트
 */
export default function TableOfContentsBottomSheet({
  isOpen,
  onClose,
  orderId,
  contentId,
  currentQuestionOrder,
}: TableOfContentsBottomSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contentInfo, setContentInfo] = useState<ContentInfo | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // ⭐ from 파라미터 추출 (URL 쿼리 파라미터에서)
  const searchParams = new URLSearchParams(location.search);
  const from = searchParams.get('from');

  // ⭐ 바텀시트가 열렸을 때 body 스크롤 막기 및 상태바 색상 변경
  useEffect(() => {
    if (isOpen) {
      // ⚠️ [수정] position: fixed 제거하여 모바일 하단 뜸 현상 해결
      // 기존: position: fixed로 인해 iOS Safari 등에서 하단 툴바 변화 시 바텀시트가 뜨는 현상 발생
      // 변경: overflow: hidden만 적용하고, 터치 이벤트 제어로 스크롤 방지
      document.body.style.overflow = 'hidden';

      // ⭐ 상태바 색상 변경 (어두운 색)
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      const originalThemeColor = metaThemeColor.getAttribute('content');
      metaThemeColor.setAttribute('content', '#808080');

      return () => {
        // 복구
        document.body.style.overflow = '';
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', originalThemeColor || '#ffffff');
        }
      };
    }
  }, [isOpen]);

  // 질문 리스트 조회 (isOpen과 무관하게 미리 로드 → 애니메이션 끊김 방지)
  useEffect(() => {
    if (!orderId) return;

    const fetchQuestions = async () => {
      try {
        if (orderId.startsWith('dev_')) {
          const mockQuestions: Question[] = [
            { id: 'mock_1', question_id: 'q1', question_order: 1, question_text: '그와 나의 인연은 어떻게 발전할까요?', question_type: 'tarot', tarot_user_viewed: false },
            { id: 'mock_2', question_id: 'q2', question_order: 2, question_text: '상대방은 나를 어떻게 생각하고 있을까요?', question_type: 'saju', tarot_user_viewed: null },
            { id: 'mock_3', question_id: 'q3', question_order: 3, question_text: '관계 발전을 위해 내가 주의해야 할 점은?', question_type: 'saju', tarot_user_viewed: null },
            { id: 'mock_4', question_id: 'q4', question_order: 4, question_text: '앞으로 3개월 간 우리 관계의 흐름은?', question_type: 'saju', tarot_user_viewed: null },
            { id: 'mock_5', question_id: 'q5', question_order: 5, question_text: '이 사람과의 최종 결말은 어떻게 될까요?', question_type: 'tarot', tarot_user_viewed: false }
          ];
          setQuestions(mockQuestions);
          return;
        }

        const { data, error } = await supabase
          .from('order_results')
          .select('id, question_id, question_order, question_text, question_type, tarot_user_viewed')
          .eq('order_id', orderId)
          .order('question_order', { ascending: true });

        if (error) throw error;
        setQuestions(data || []);
      } catch (error) {
        console.error('❌ [목차] 질문 리스트 조회 실패:', error);
      }
    };

    fetchQuestions();
  }, [orderId]);

  // 콘텐츠 정보 조회 (isOpen과 무관하게 미리 로드 → 애니메이션 끊김 방지)
  useEffect(() => {
    if (!contentId) return;

    const fetchContentInfo = async () => {
      try {
        if (contentId.startsWith('mock')) {
          setContentInfo({
            title: '[개발용] 연애운 - 그와 나의 인연은 어떻게 될까?',
            thumbnail_url: 'https://via.placeholder.com/80x54/48b2af/ffffff?text=Mock'
          });
          return;
        }

        const { data, error } = await supabase
          .from('master_contents')
          .select('title, thumbnail_url')
          .eq('id', contentId)
          .single();

        if (error) throw error;
        setContentInfo(data);
      } catch (error) {
        console.error('❌ [목차] 콘텐츠 정보 조회 실패:', error);
      }
    };

    fetchContentInfo();
  }, [contentId]);

  // 질문 클릭 핸들러
  const handleQuestionClick = (question: Question) => {
    onClose();
    // ⭐ from 파라미터 유지
    const fromParam = from ? `&from=${from}` : '';
    const contentIdParam = contentId ? `&contentId=${contentId}` : '';

    if (question.question_type === 'tarot' && !question.tarot_user_viewed) {
      // ⭐ 타로 카드 미선택 시 셔플 페이지로 이동
      console.log('🎴 [목차] 타로 미선택 → 셔플 페이지로 이동', { questionOrder: question.question_order });
      navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=${question.question_order}${contentIdParam}${fromParam}`);
    } else {
      // ⭐ 통합 결과 페이지로 이동 (사주/타로 모두 동일)
      navigate(`/result?orderId=${orderId}&questionOrder=${question.question_order}${contentIdParam}${fromParam}`);
    }
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;

    if (dragDistance > 80 || dragVelocity > 400) {
      onClose();
      return;
    }
    if (dragDistance < -100 || dragVelocity < -500) {
      return;
    }
    if (dragDistance > 50) {
      return;
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 딤 배경 */}
          <motion.div
            key="toc-backdrop"
            className="fixed top-0 left-0 w-screen h-[100dvh] bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ touchAction: 'none' }}
          />

          {/* 바텀시트 - 단일 motion.div로 통합 */}
          <motion.div
            key="toc-sheet"
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[440px] z-50 bg-white rounded-t-[20px] shadow-[0px_-8px_16px_0px_rgba(0,0,0,0.1)] flex flex-col max-h-[85vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 380,
              mass: 0.8
            }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.03, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            style={{ willChange: 'transform' }}
          >
        {/* 드래그 핸들 */}
        <div
          className="relative shrink-0 w-full rounded-t-[20px] cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: 'none' }}
        >
          <div className="flex flex-col items-center justify-center size-full">
            <div className="content-stretch flex flex-col items-center justify-center px-[10px] py-[12px] relative w-full">
              <div className="bg-[#d4d4d4] h-[4px] rounded-[999px] shrink-0 w-[48px]" />
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center px-[24px] py-[16px] relative w-full">
              <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[28px] relative shrink-0 text-[20px] text-black text-nowrap tracking-[-0.2px]">
                목차
              </p>
            </div>
          </div>
        </div>

        {/* 질문 리스트 (스크롤 가능) */}
        <div
          className="flex-1 overflow-y-auto relative w-full min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-full">
            {contentInfo && (
              <div className="bg-[#f7f8f9] relative shrink-0 w-full">
                <div className="size-full">
                  <div className="content-stretch flex flex-col items-start px-[20px] py-[12px] relative w-full">
                    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                      {contentInfo.thumbnail_url && (
                        <div className="h-[54px] relative rounded-[12px] shrink-0 w-[80px] overflow-hidden">
                          <img
                            src={contentInfo.thumbnail_url}
                            alt={contentInfo.title}
                            className="absolute inset-0 w-full h-full object-cover rounded-[12px]"
                          />
                          <div className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px] pointer-events-none" />
                        </div>
                      )}
                      <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0">
                        <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center relative shrink-0 px-[6px] py-[2px] rounded-[4px]">
                          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#41a09e] text-[12px] text-nowrap tracking-[-0.24px]">
                            심화 해석판
                          </p>
                        </div>
                        <div className="relative shrink-0 w-full">
                          <div className="flex flex-row items-center justify-center size-full">
                            <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                              <p className="basis-0 font-['Pretendard_Variable:Medium',sans-serif] font-medium grow leading-[25.5px] min-h-px min-w-px relative shrink-0 text-[15px] pl-[2px] text-black tracking-[-0.3px] line-clamp-2">
                                {contentInfo.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col items-start px-[20px] py-[12px] relative w-full pt-[12px] pr-[20px] pb-[62px] pl-[20px]">
              <div className="flex flex-col relative shrink-0 w-full">
                {(questions || []).map((question, index, array) => (
                  <div key={question.id} className="w-full flex flex-col">
                    <div
                      role="button"
                      onClick={() => handleQuestionClick(question as any)}
                      className="min-h-[56px] h-auto relative rounded-[12px] shrink-0 w-full flex items-center cursor-pointer"
                    >
                      <div className="flex items-start w-full px-[12px] py-[12px] gap-[10px]">
                        <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium shrink-0 text-[#b7b7b7] w-[24px] text-[15px] tracking-[-0.3px] text-left leading-normal">
                          {String(question.question_order).padStart(2, '0')}
                        </p>
                        <p
                          className={`grow text-[15px] tracking-[-0.3px] text-left leading-normal ${
                            question.question_order === currentQuestionOrder
                              ? "font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-black"
                              : "font-['Pretendard_Variable:Regular',sans-serif] font-normal text-black"
                          }`}
                        >
                          {question.question_text}
                        </p>
                        {question.question_order === currentQuestionOrder && (
                          <div className="mt-[1px] bg-[#f0f8f8] flex items-center justify-center shrink-0 px-[8px] py-[4px] rounded-[8px]">
                            <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[#41a09e] text-[12px] pt-[2px] text-nowrap tracking-[-0.24px] leading-none">
                              보는 중
                            </p>
                          </div>
                        )}
                        <ChevronRight className="w-[16px] h-[16px] mt-[3px] text-[#b7b7b7] shrink-0" strokeWidth={1.7} />
                      </div>
                    </div>
                    {index < array.length - 1 && (
                      <div className="h-px w-[calc(100%_+_24px)] -mx-[12px] bg-[#F3F3F3]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 - 고정 */}
        <div className="content-stretch flex flex-col items-start relative shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] shrink-0 w-full bg-white rounded-b-none">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                  <button
                    onClick={onClose}
                    className="bg-[#f0f8f8] content-stretch flex h-[56px] items-center justify-center px-[12px] py-0 relative rounded-[16px] shrink-0 w-full transition-transform transform-gpu active:scale-96 active:bg-[#E4F7F7]"
                  >
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[#48b2af] text-[16px] text-nowrap tracking-[-0.32px]">
                        목차 닫기
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <HomeIndicatorLight />
        </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}