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
import { useNavigate, useLocation } from 'react-router-dom';
import { freeContentService, MasterContent, Question } from '../lib/freeContentService';
import { getThumbnailUrl } from '../lib/image';
import { motion } from "motion/react";
import FreeContentLoading from './FreeContentLoading';
import FreeContentDetailSkeleton from './skeletons/FreeContentDetailSkeleton';
import SEO from './SEO';
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
import { trackPageView, trackViewItem } from '../utils/analytics';
import FreeContentResult from './FreeContentResult';
import LoginBottomSheet from './LoginBottomSheet';

/**
 * Props 인터페이스
 */
interface FreeContentDetailProps {
  contentId: string;
  onBack: () => void;
  onHome: () => void;
  onContentClick?: (contentId: string) => void;
  onBannerClick?: (productId: string) => void;
  onPurchase?: () => void;
  onNext?: () => void; // 나다움 기록하기로 이동
}

/**
 * Custom Hook: 무료 콘텐츠 상세 로직
 * @param contentId 콘텐츠 ID
 * @param onBack 뒤로가기 핸들러
 */
function useFreeContentDetail(contentId: string, onBack: () => void) {
  const navigate = useNavigate();
  const location = useLocation();

  // 🛡️ contentId 변경 감지 가드: 스와이프 뒤로가기로 다른 콘텐츠에 도달 시 홈으로 리다이렉트
  const prevContentIdRef = useRef(contentId);

  useEffect(() => {
    if (prevContentIdRef.current !== contentId) {
      console.log('🔄 [FreeContentDetail] contentId 변경 감지 → 홈으로 리다이렉트');
      navigate('/', { replace: true });
      return;
    }
  }, [contentId, navigate]);

  // 🛡️ bfcache 핸들러: iOS Safari bfcache 복원 시 홈으로 이동 (FreeSajuDetail 패턴)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 [FreeContentDetail] bfcache 복원 감지 → 홈으로 이동');
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [navigate]);

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
  const scrollContainerRef = useRef<HTMLDivElement>(null); // ⭐ 스크롤 컨테이너 ref (바운스 방지)
  const [isLoginSheetOpen, setIsLoginSheetOpen] = useState(false); // ⭐ 비회원 제한 바텀시트

  // ⭐ 서버 일일 제한(DAILY_LIMIT_REACHED)으로 돌아온 경우 LoginBottomSheet 자동 표시
  useEffect(() => {
    const state = location.state as { dailyLimitReached?: boolean } | null;
    if (state?.dailyLimitReached) {
      setIsLoginSheetOpen(true);
      // state 초기화 (새로고침 시 재표시 방지)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

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
   * 🔝 페이지 진입 시 스크롤을 최상단으로 이동
   * ⭐ SajuResultPage와 동일한 패턴으로 바운스 방지
   */
  useEffect(() => {
    // ⭐ 스크롤 컨테이너와 window 모두 최상단으로 이동
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo(0, 0);
    console.log('🔝 [FreeContentDetail] 스크롤 최상단으로 이동');
  }, [contentId]); // contentId가 바뀔 때마다 최상단으로

  /**
   * 📊 GA4: 페이지뷰 + 제품 보기 이벤트 (콘텐츠별 타이틀)
   */
  useEffect(() => {
    if (content && !loading) {
      // 콘텐츠별 타이틀로 페이지뷰 트래킹
      const pageTitle = `[무료] ${content.title} | 나다운세`;
      document.title = pageTitle;
      trackPageView(window.location.pathname + window.location.search, pageTitle);
      console.log('📊 [GA4] page_view 이벤트 전송:', pageTitle);

      // view_item 이벤트
      trackViewItem({
        id: content.id,
        title: content.title,
        category: content.category_main,
        type: 'free',
        discountPrice: 0,
      });
      console.log('📊 [GA4] view_item 이벤트 전송:', content.title);
    }
  }, [content?.id, loading]);

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
   * ⭐ 비회원 일일 제한 체크 (localStorage 기반, KST)
   */
  const hasReachedLocalLimit = (): boolean => {
    const FREE_DAILY_LIMIT = 3;
    const STORAGE_KEY = 'free_content_daily_usage';
    try {
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const todayKST = kstDate.toISOString().split('T')[0];
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      const { date, count } = JSON.parse(stored);
      if (date !== todayKST) return false;
      console.log(`📊 [FreeContentDetail] 비회원 일일 사용량: ${count}/${FREE_DAILY_LIMIT}`);
      return count >= FREE_DAILY_LIMIT;
    } catch {
      return false;
    }
  };

  /**
   * 구매 버튼 클릭 (무료 체험) - Fallback only
   */
  const handlePurchase = () => {
    console.log('🔵 [FreeContentDetail] handlePurchase 함수 시작', {
      timestamp: new Date().toISOString(),
      contentId,
      hasContent: !!content,
      questionsLength: questions.length
    });

    if (!content || questions.length === 0) {
      console.log('🔴 [FreeContentDetail] handlePurchase 실패 - 데이터 없음');
      alert('질문지가 없습니다.');
      return;
    }

    // ⭐ 비회원 일일 제한 체크 (1차 검증: localStorage)
    const userJson = localStorage.getItem('user');
    const isLoggedIn = !!userJson;
    if (!isLoggedIn && hasReachedLocalLimit()) {
      console.log('🚫 [FreeContentDetail] 비회원 일일 제한 도달 → LoginBottomSheet 표시');
      setIsLoginSheetOpen(true);
      return;
    }

    // 🚀 캐시 확인: 사주 정보가 있으면 바로 사주 선택 페이지로 이동 (birthinfo 스킵)
    try {
      const cachedJson = localStorage.getItem('saju_records_cache');
      if (cachedJson) {
        const cached = JSON.parse(cachedJson);
        if (Array.isArray(cached) && cached.length > 0) {
          console.log('🚀 [FreeContentDetail] 사주 캐시 발견 → birthinfo 스킵');
          console.log('🟢 [FreeContentDetail] navigate 호출:', `/product/${contentId}/free-saju-select`);
          navigate(`/product/${contentId}/free-saju-select`);
          return;
        }
      }
    } catch (e) {
      console.error('❌ [FreeContentDetail] 캐시 파싱 실패:', e);
    }

    // Fallback: 캐시가 없으면 birthinfo로 이동
    console.log('🟢 [FreeContentDetail] navigate 호출:', `/product/${contentId}/birthinfo`);
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
    scrollContainerRef, // ⭐ 바운스 방지용 스크롤 컨테이너
    isLoginSheetOpen, // ⭐ 비회원 제한 바텀시트
    // Actions
    handlePurchase,
    setShowResult,
    setIsLoginSheetOpen, // ⭐ 비회원 제한 바텀시트
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
  onPurchase,
  onNext
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
    scrollContainerRef, // ⭐ 바운스 방지용 스크롤 컨테이너
    isLoginSheetOpen, // ⭐ 비회원 제한 바텀시트
    handlePurchase,
    setShowResult,
    setIsLoginSheetOpen, // ⭐ 비회원 제한 바텀시트
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
        onNext={onNext}
      />
    );
  }

  // Main Content
  const visibleRecommendedContents = recommendedContents.slice(0, visibleCount);
  const hasMoreCards = recommendedContents.length > visibleCount;

  return (
    <>
      <SEO
        title={`[무료] ${content.title}`}
        description={content.description || `${content.title} - 무료로 보는 AI 운세`}
        canonical={`/free/content/${contentId}`}
        ogImage={content.thumbnail_url}
      />
      <div className="bg-white fixed inset-0 flex flex-col w-full">
        <div className="w-full max-w-[440px] mx-auto flex flex-col h-full relative">
          {/* Top Navigation */}
          <TopNavigation
            onBack={onBack}
            onHome={onHome}
            title={content.title}
          />

        {/* ⭐ Scrollable Content Area - overscroll-contain으로 바운스 방지 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
          <motion.div
            className="overflow-x-hidden"
            style={{ paddingBottom: '250px' }}
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
            <AdBanner onBannerClick={onBannerClick} />
          </motion.div>
          </motion.div>
        </div>
        {/* ⭐ 스크롤 컨테이너 끝 */}

          {/* Bottom Button */}
          <BottomButton
            onClick={onPurchase || handlePurchase}
            text="무료로 보기"
          />
        </div>
      </div>

      {/* ⭐ 비회원 일일 제한 바텀시트 */}
      <LoginBottomSheet
        isOpen={isLoginSheetOpen}
        onClose={() => setIsLoginSheetOpen(false)}
        contentId={contentId}
      />
    </>
  );
}