/**
 * @file FreeContentDetail.tsx
 * @description 무료 콘텐츠 상세 페이지 컴포넌트
 * 
 * @features
 * - 무료 콘텐츠 상세 정보 표시
 * - AI 기반 운세 생성 (로그인/로그아웃 분기)
 * - 추천 콘텐츠 표시
 * - 로딩 및 결과 화면 처리
 * 
 * @flow
 * 1. 콘텐츠 상세 → 무료로 보기 클릭
 * 2. 사주 입력/선택 (로그인 여부에 따라 분기)
 * 3. AI 생성 로딩
 * 4. 결과 표시
 * 
 * @architecture
 * - Service Layer: FreeContentService (비즈니스 로직)
 * - UI Layer: FreeContentDetailComponents (재사용 가능한 UI)
 * - Hook Layer: useFreeContentDetail (상태 관리)
 * 
 * @author Figma Make
 * @since 2024-12-16
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { freeContentService, MasterContent, Question } from '../lib/freeContentService';
import { getThumbnailUrl } from '../lib/image';
import { motion } from "motion/react";
import FreeContentLoading from './FreeContentLoading';
import FreeContentResult from './FreeContentResult';
import FreeContentDetailSkeleton from './skeletons/FreeContentDetailSkeleton';
import {
  TopNavigation,
  ProductInfo,
  DescriptionSection,
  FortuneComposition,
  AdBanner,
  RecommendedCard,
  ShowMoreButton,
  BottomButton,
  PaidContentCard
} from './FreeContentDetailComponents';

/**
 * Props 인터페이스
 */
interface FreeContentDetailProps {
  contentId: string;
  onBack: () => void;
  onHome: () => void;
  onContentClick?: (contentId: string) => void;
  onBannerClick?: () => void;
  onPurchase?: () => void;
}

/**
 * Custom Hook: 무료 콘텐츠 상세 로직
 * @param contentId 콘텐츠 ID
 * @param onBack 뒤로가기 핸들러
 */
function useFreeContentDetail(contentId: string, onBack: () => void) {
  const navigate = useNavigate();
  const [content, setContent] = useState<MasterContent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [generatedResults, setGeneratedResults] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [recommendedContents, setRecommendedContents] = useState<MasterContent[]>([]);
  const [visibleCount, setVisibleCount] = useState(3); // ⭐ 처음에는 3개 표시
  const [visiblePaidCount, setVisiblePaidCount] = useState(6); // ⭐ 유료 콘텐츠는 6개씩
  const scrollObserverRef = useRef<HTMLDivElement>(null);

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        // ⭐ 캐시 확인 먼저 (동기)
        const cachedData = freeContentService.loadFromCache(contentId);
        
        if (cachedData) {
          // ⭐ 캐시가 있으면 즉시 UI 업데이트 (로딩 없이)
          setContent(cachedData.content);
          setQuestions(cachedData.questions);
          setRecommendedContents(cachedData.recommended);
          setLoading(false); // ⭐ 캐시 로드 시 즉시 로딩 해제
          
          // 백그라운드에서 최신 데이터 업데이트 (비동기, 사용자는 기다리지 않음)
          freeContentService.updateDataInBackground(contentId).then(freshData => {
            if (freshData) {
              setContent(freshData.content);
              setQuestions(freshData.questions);
              setRecommendedContents(freshData.recommended);
            }
          });
          
          // AI 생성 플래그 확인
          const flagData = freeContentService.checkGenerationFlag(contentId);
          if (flagData && flagData.sajuRecordId) {
            console.log('🆓 무료 콘텐츠 AI 생성 플래그 감지 - 생성 시작');
            startGeneration(flagData.sajuRecordId, cachedData.content, cachedData.questions);
          }
          
          return; // ⭐ 조기 종료
        }
        
        // ⭐ 캐시가 없을 때만 로딩 표시
        setLoading(true);
        const data = await freeContentService.loadContentData(contentId);
        
        setContent(data.content);
        setQuestions(data.questions);
        setRecommendedContents(data.recommended);

        // AI 생성 플래그 확인
        const flagData = freeContentService.checkGenerationFlag(contentId);
        if (flagData && flagData.sajuRecordId) {
          console.log('🆓 무료 콘텐츠 AI 생성 플래그 감지 - 생성 시작');
          startGeneration(flagData.sajuRecordId, data.content, data.questions);
        }
      } catch (error) {
        console.error('콘텐츠 로드 실패:', error);
        alert('콘텐츠를 불러올 수 없습니다.');
        onBack();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contentId, onBack]);

  /**
   * ⭐ 백그라운드 프리페칭: 사용자가 콘텐츠를 보는 동안 10개 미리 로드
   */
  useEffect(() => {
    if (recommendedContents.length > 3 && visibleCount === 3) {
      const timer = setTimeout(() => {
        const prefetchCount = Math.min(10, recommendedContents.length);
        console.log('🚀 [백그라운드 프리페칭] 추천 콘텐츠 10개 미리 로드:', prefetchCount);
        setVisibleCount(prefetchCount);
      }, 500); // 0.5초 후 실행 (초기 렌더링 완료 후)

      return () => clearTimeout(timer);
    }
  }, [recommendedContents.length, visibleCount]);

  /**
   * ⭐ 무한 스크롤: Intersection Observer 설정 (10개씩 로드)
   */
  useEffect(() => {
    // visibleCount가 10 미만이면 observer 설정 안함 (프리페칭 대기 중)
    if (visibleCount < 10 || !scrollObserverRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && visibleCount < recommendedContents.length) {
          const nextCount = Math.min(visibleCount + 10, recommendedContents.length);
          console.log('📜 [무한 스크롤] 다음 10개 콘텐츠 로드:', nextCount);
          setVisibleCount(nextCount);
        }
      },
      {
        root: null,
        rootMargin: '200px', // 200px 전에 미리 로드
        threshold: 0.1
      }
    );

    const currentRef = scrollObserverRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [visibleCount, recommendedContents.length]);

  /**
   * AI 생성 시작
   * 
   * @param sajuRecordId 사주 레코드 ID
   * @param contentData 콘텐츠 데이터
   * @param questionsData 질문 데이터
   */
  const startGeneration = async (
    sajuRecordId: string,
    contentData: MasterContent,
    questionsData: Question[]
  ) => {
    console.log('🎯 AI 생성 시작');
    console.log('🎯 전달받은 질문지:', questionsData);
    console.log('🎯 질문지 개수:', questionsData.length);

    if (!contentData || questionsData.length === 0) {
      console.error('❌ 검증 실패 - content:', !!contentData, 'questions.length:', questionsData.length);
      alert('질문지가 없습니다.');
      return;
    }

    setIsGenerating(true);

    try {
      const results = await freeContentService.generateAllAnswers(
        contentData,
        sajuRecordId,
        questionsData
      );

      setGeneratedResults(results);
      setShowResult(true);
    } catch (error) {
      console.error('❌ AI 생성 중 오류:', error);
      alert('운세 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 구매 버튼 클릭 (무료 체험) - Fallback only
   */
  const handlePurchase = () => {
    if (!content || questions.length === 0) {
      alert('질문지가 없습니다.');
      return;
    }

    // Fallback: onPurchase가 없을 때만 사용
    navigate(`/product/${contentId}/birthinfo`);
  };

  /**
   * 더 보기 버튼 클릭
   */
  const toggleShowMoreCards = () => {
    setShowMoreCards(prev => !prev);
  };

  /**
   * ⭐ 유료 콘텐츠 더 보기 버튼 클릭 (6개씩 추가 로드)
   */
  const loadMorePaidContents = () => {
    setVisiblePaidCount(prev => prev + 6);
    console.log('📦 [유료 콘텐츠 더 보기] 6개 추가 로드');
  };

  return {
    // State
    content,
    questions,
    recommendedContents,
    loading,
    isGenerating,
    generatedResults,
    showResult,
    visibleCount,
    visiblePaidCount,
    scrollObserverRef,
    // Actions
    handlePurchase,
    setShowResult,
    loadMorePaidContents
  };
}

/**
 * 커스텀 Hook: 슬라이더 드래그 관리
 * 
 * @description
 * 추천 콘텐츠 슬라이더의 마우스 드래그 기능을 관리합니다.
 */
function useSliderDrag() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setScrollLeft(sliderRef.current.scrollLeft);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    
    // ⭐ 가로 이동이 세로 이동보다 크면 가로 스크롤로 간주 (세로 스크롤 방지)
    if (deltaX > deltaY && deltaX > 5) {
      e.preventDefault(); // ⭐ 가로 스크롤 중일 때만 세로 스크롤 방지
      setIsDragging(true);
      const x = touch.clientX;
      const walk = startX - x;
      sliderRef.current.scrollLeft = scrollLeft + walk;
    }
    // ⭐ 세로 이동이 더 크면 아무것도 하지 않음 (기본 세로 스크롤 허용)
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // 스크롤 속도 조절
    
    if (Math.abs(walk) > 5) {
      isDraggingRef.current = true;
    }

    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    sliderRef,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClickCapture
  };
}

/**
 * 메인 컴포넌트: 무료 콘텐츠 상세
 * 
 * @param props 컴포넌트 Props
 * @returns JSX.Element
 */
export default function FreeContentDetail({
  contentId,
  onBack,
  onHome,
  onContentClick,
  onBannerClick,
  onPurchase
}: FreeContentDetailProps) {
  // Custom Hooks
  const {
    content,
    questions,
    recommendedContents,
    loading,
    isGenerating,
    generatedResults,
    showResult,
    visibleCount,
    visiblePaidCount,
    scrollObserverRef,
    handlePurchase,
    setShowResult,
    loadMorePaidContents
  } = useFreeContentDetail(contentId, onBack);

  const {
    sliderRef,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClickCapture
  } = useSliderDrag();

  // ⭐ 유료 콘텐츠만 필터링 (인기도 순 정렬은 이미 DB에서 됨)
  const paidContents = recommendedContents.filter(c => c.content_type === 'paid');
  const displayedPaidContents = paidContents.slice(0, visiblePaidCount); // 최대 6개
  const hasMorePaidContents = paidContents.length > visiblePaidCount;

  // Loading State - 실제 로딩 중이면 스켈레톤 표시
  const isActuallyLoading = loading || !content;
  
  if (isActuallyLoading) {
    console.log('🔍 [FreeContentDetail] 스켈레톤 렌더링 - loading:', loading, 'content:', !!content);
    return <FreeContentDetailSkeleton />;
  }

  // AI Generating State
  if (isGenerating) {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    return <FreeContentLoading userName={user?.name || '홍길동'} />;
  }

  // Result State
  if (showResult && generatedResults.length > 0) {
    return (
      <FreeContentResult
        contentTitle={content.title}
        contentThumbnail={content.thumbnail_url}
        questions={generatedResults}
        onBack={() => setShowResult(false)}
        onHome={onHome}
      />
    );
  }

  // Main Content
  const visibleRecommendedContents = recommendedContents.slice(0, visibleCount);
  const hasMoreCards = recommendedContents.length > visibleCount;

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center pb-[4px]">
      <div className="w-full max-w-[440px] relative">
        {/* Top Navigation */}
        <TopNavigation 
          onBack={onBack} 
          onHome={onHome} 
          title={content.title} 
        />

        {/* Content */}
        <motion.div 
          className="pb-[120px]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* Product Image & Info */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
            <ProductInfo content={content} />
          </motion.div>

          {/* Divider */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
            <div className="bg-gray-100 h-[1px] w-full mt-[12px] mb-[12px]" />
          </motion.div>

          {/* Description Section */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
            <DescriptionSection description={content.description} />
          </motion.div>

          {/* Spacer */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
            <div className="bg-[#f9f9f9] h-[12px] w-full mb-[52px]" />
          </motion.div>

          {/* Fortune Composition List */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
            <div className="-my-[12px]">
              <FortuneComposition questions={questions} />
            </div>
          </motion.div>

          {/* Advertisement Banner */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
            <AdBanner onClick={onBannerClick} />
          </motion.div>

          {/* ⭐ 유료 콘텐츠 추천 섹션 - 가로 스크롤 */}
          {displayedPaidContents.length > 0 && (
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full mb-[120px] mt-[-12px]">
                {/* 섹션 제목 */}
                <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full px-[20px]">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                      <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                        이런 운세는 어때요?
                      </p>
                    </div>
                  </div>
                </div>

                {/* ⭐ 가로 스크롤 슬라이더 */}
                <div className="w-[calc(100%_+_40px)] max-w-[440px] mx-[-20px] relative overflow-hidden select-none">
                  <div 
                    ref={sliderRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onClickCapture={handleClickCapture}
                    className={`content-stretch flex gap-[12px] items-stretch relative shrink-0 w-full overflow-x-auto overflow-y-hidden scrollbar-hide px-[20px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
                  >
                    {displayedPaidContents.map((paidContent) => (
                      <PaidContentCard
                        key={paidContent.id}
                        content={paidContent}
                        onClick={() => {
                          console.log('🚀 onContentClick 호출:', paidContent.id, paidContent.title);
                          onContentClick?.(paidContent.id);
                        }}
                        couponDiscount={3000} // TODO: 실제 쿠폰 로직으로 교체
                      />
                    ))}
                    
                    {/* 더 볼래요 버튼 */}
                    {hasMorePaidContents && (
                      <ShowMoreButton onClick={loadMorePaidContents} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Button */}
        <BottomButton 
          onClick={onPurchase || handlePurchase} 
          text="무료로 보기" 
        />
      </div>
    </div>
  );
}