import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "motion/react";
import svgPaths from '../imports/svg-e15u41g853';
import img from "@/assets/5615ff21216f93eb47cac8ee15adee136174d7be.png";
import img2 from "@/assets/67f3616aab1dcdea805228bdd4e698e8f57dd487.png";
import { AdBanner } from './FreeContentDetailComponents';
import { supabase } from '../lib/supabase';
import { ContentTags, isContentNew } from './ContentTags';

interface FreeSajuDetailProps {
  recordId: string;  // localStorage key (resultKey)
  userName: string;
  productTitle: string;
  productImage: string;
  contentId?: string;  // 🔙 시스템 뒤로가기 시 콘텐츠 상세로 이동하기 위한 ID
  onClose: () => void;
  recommendedProducts?: Array<{
    id: number;
    title: string;
    type: 'free' | 'paid';
    image: string;
    created_at?: string;
  }>;
  onProductClick?: (productId: number) => void;
  onBannerClick?: (productId: string) => void;
  onUserIconClick?: () => void;
  // DB 조회 모드 (운세 기록 페이지에서 진입 시)
  fromDB?: boolean;
  dbRecordId?: string;  // free_content_records 테이블의 id
  dbData?: any;  // ⭐ App.tsx에서 이미 로드한 DB 데이터 (이중 조회 방지)
  onNext?: () => void;  // ⭐ 나다움 기록하기로 이동
  nextLabel?: string;  // ⭐ 버튼 레이블 ('다음' 또는 '완료')
  isNextLoading?: boolean;  // ⭐ 태그 추출 대기 중 로딩 상태
}

interface ResultItem {
  questionId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  previewText: string;
}

interface CachedData {
  contentId: string;
  sajuData: any;
  results: ResultItem[];
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function FreeSajuDetail({
  recordId,
  userName,
  productTitle,
  productImage,
  contentId,
  onClose,
  recommendedProducts = [],
  onProductClick,
  onBannerClick,
  onUserIconClick,
  fromDB = false,
  dbRecordId,
  dbData,
  onNext,
  nextLabel = '다음',
  isNextLoading = false
}: FreeSajuDetailProps) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(3); // ⭐️ 표시할 콘텐츠 개수
  const observerTarget = useRef<HTMLDivElement>(null);
  const [readContentIds, setReadContentIds] = useState<Set<string>>(() => {
    try {
      const cached = localStorage.getItem('read_content_ids_cache');
      if (cached) return new Set(JSON.parse(cached) as string[]);
    } catch { /* ignore */ }
    return new Set();
  });

  // ⭐ 읽기 기록 조회 (읽어봄 태그용)
  useEffect(() => {
    const fetchReadHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const ids = new Set<string>();
      const { data: orders } = await supabase.from('orders').select('content_id').eq('user_id', userId).eq('pstatus', 'completed');
      if (orders) orders.forEach((o: { content_id: string | null }) => { if (o.content_id) ids.add(o.content_id); });
      const { data: freeRecords } = await supabase.from('free_content_records').select('content_id').eq('user_id', userId);
      if (freeRecords) freeRecords.forEach((r: { content_id: string | null }) => { if (r.content_id) ids.add(r.content_id); });
      setReadContentIds(ids);
      localStorage.setItem('read_content_ids_cache', JSON.stringify([...ids]));
    };
    fetchReadHistory();
  }, []);

  // ⭐ 정렬: 인기순(미확인) 1순위, 인기순(읽어봄) 2순위
  const sortedRecommendedProducts = useMemo(() => {
    return [...recommendedProducts].sort((a, b) => {
      const aRead = readContentIds.has(String(a.id)) ? 1 : 0;
      const bRead = readContentIds.has(String(b.id)) ? 1 : 0;
      if (aRead !== bRead) return aRead - bRead;
      return 0; // DB에서 이미 인기순으로 정렬되어 옴
    });
  }, [recommendedProducts, readContentIds]);

  // ⭐️ localStorage에서 결과 데이터 즉시 로드 (동기 작업이므로 로딩 불필요)
  const loadCachedData = (): { data: CachedData | null; error: boolean } => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [FreeSajuDetail] localStorage에서 데이터 즉시 로드');
    console.log('📌 [FreeSajuDetail] recordId (resultKey):', recordId);

    try {
      const dataStr = localStorage.getItem(recordId);
      console.log('📌 [FreeSajuDetail] localStorage 데이터:', dataStr ? '있음' : '없음');

      if (!dataStr) {
        console.error('❌ [FreeSajuDetail] localStorage에 데이터 없음');
        return { data: null, error: true };
      }

      const data: CachedData = JSON.parse(dataStr);
      console.log('✅ [FreeSajuDetail] 데이터 파싱 완료, results 개수:', data.results?.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { data, error: false };
    } catch (error) {
      console.error('❌ [FreeSajuDetail] 데이터 로드 중 에러:', error);
      return { data: null, error: true };
    }
  };

  // ⭐ dbData를 CachedData 형식으로 변환하는 헬퍼 함수
  const convertDbDataToCachedData = (data: any): CachedData => ({
    contentId: data.content_id,
    sajuData: {
      full_name: data.full_name || data.saju_name,
      gender: data.gender,
      birth_date: data.birth_date,
      birth_time: data.birth_time
    },
    results: data.answers.map((a: { question_id: string; question_order: number; question_text: string; answer_text: string }) => ({
      questionId: a.question_id,
      questionOrder: a.question_order,
      questionText: a.question_text,
      questionType: 'ai',
      previewText: a.answer_text
    })),
    createdAt: data.created_at
  });

  // ⭐️ 초기화 시점에 즉시 로드
  // - dbData가 이미 있으면 (App.tsx에서 전달됨) 그대로 사용 → DB 조회 불필요!
  // - fromDB 모드이고 dbRecordId만 있으면 (dbData 없음) → DB 조회 필요
  // - 그 외 → localStorage에서 로드
  const getInitialData = (): { data: CachedData | null; error: boolean } => {
    if (dbData) {
      console.log('✅ [FreeSajuDetail] dbData 직접 사용 (이중 조회 방지)');
      return { data: convertDbDataToCachedData(dbData), error: false };
    }
    if (fromDB && dbRecordId) {
      return { data: null, error: false };  // DB 조회 필요
    }
    return loadCachedData();  // localStorage에서 로드
  };

  const initialLoad = getInitialData();
  const [cachedData, setCachedData] = useState<CachedData | null>(initialLoad.data);
  const [dataLoadError, setDataLoadError] = useState(initialLoad.error);
  // ⭐ dbData가 있으면 이미 로드된 상태이므로 로딩 불필요
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(fromDB && !!dbRecordId && !dbData);

  // ⭐️ DB에서 무료 콘텐츠 기록 조회 (운세 기록 페이지에서 진입 시)
  const loadFromDatabase = async (id: string) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [FreeSajuDetail] DB에서 데이터 로드');
    console.log('📌 [FreeSajuDetail] dbRecordId:', id);

    setIsLoadingFromDB(true);
    try {
      const { data, error } = await supabase
        .from('free_content_records')
        .select('*, master_contents(title, thumbnail_url)')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('❌ [FreeSajuDetail] DB 조회 실패:', error);
        setDataLoadError(true);
        return;
      }

      console.log('✅ [FreeSajuDetail] DB 조회 성공, answers 개수:', data.answers?.length);

      // DB 응답을 CachedData 형식으로 변환
      const convertedData: CachedData = {
        contentId: data.content_id,
        sajuData: {
          full_name: data.full_name,
          gender: data.gender,
          birth_date: data.birth_date,
          birth_time: data.birth_time
        },
        results: data.answers.map((a: { question_id: string; question_order: number; question_text: string; answer_text: string }) => ({
          questionId: a.question_id,
          questionOrder: a.question_order,
          questionText: a.question_text,
          questionType: 'ai',
          previewText: a.answer_text
        })),
        createdAt: data.created_at
      };

      setCachedData(convertedData);
      setDataLoadError(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (err) {
      console.error('❌ [FreeSajuDetail] DB 조회 에러:', err);
      setDataLoadError(true);
    } finally {
      setIsLoadingFromDB(false);
    }
  };

  // ⭐️ fromDB 모드일 때 DB에서 로드 (dbData가 없을 때만!)
  useEffect(() => {
    // dbData가 이미 있으면 (App.tsx에서 전달됨) 추가 조회 불필요
    if (dbData) {
      console.log('📋 [FreeSajuDetail] dbData 이미 있음 → DB 조회 생략');
      return;
    }
    if (fromDB && dbRecordId) {
      loadFromDatabase(dbRecordId);
    }
  }, [fromDB, dbRecordId, dbData]);

  // 🔝 컴포넌트 마운트 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 🔙 iOS 스와이프 뒤로가기 대응: bfcache 핸들러만 유지 (DECISIONS.md 패턴)
  // ⚠️ pushState/popstate 패턴은 iOS에서 히스토리 스택 문제를 일으킴
  // → 대신 사주선택→로딩→결과 이동 시 replace: true 사용으로 해결
  useEffect(() => {
    if (!contentId) return;

    // bfcache에서 복원될 때 콘텐츠 상세로 이동
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 [FreeSajuDetail] bfcache 복원 감지 → 콘텐츠 상세로 이동');
        navigate(`/product/${contentId}`, { replace: true });
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [contentId, navigate]);

  // ⭐️ recordId가 변경되면 데이터 다시 로드 (페이지 전환 시)
  // DB 모드(fromDB && dbRecordId)에서는 localStorage 체크 불필요
  useEffect(() => {
    if (fromDB && dbRecordId) {
      console.log('📋 [FreeSajuDetail] DB 모드 → localStorage 체크 생략');
      return;
    }

    const result = loadCachedData();
    setCachedData(result.data);
    setDataLoadError(result.error);
  }, [recordId, fromDB, dbRecordId]);

  /**
   * ⭐ 백그라운드 프리페칭: 사용자가 콘텐츠를 보는 동안 10개 미리 로드
   */
  useEffect(() => {
    if (recommendedProducts.length > 3 && visibleCount === 3) {
      const timer = setTimeout(() => {
        const prefetchCount = Math.min(10, recommendedProducts.length);
        console.log('🚀 [백그라운드 프리페칭] 추천 콘텐츠 10개 미리 로드:', prefetchCount);
        setVisibleCount(prefetchCount);
      }, 500); // 0.5초 후 실행 (초기 렌더링 완료 후)

      return () => clearTimeout(timer);
    }
  }, [recommendedProducts.length, visibleCount]);

  /**
   * ⭐ 무한 스크롤: Intersection Observer 설정 (10개씩 로드)
   */
  useEffect(() => {
    // visibleCount가 10 미만이면 observer 설정 안함 (프리페칭 대기 중)
    if (visibleCount < 10 || !observerTarget.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && visibleCount < recommendedProducts.length) {
          const nextCount = Math.min(visibleCount + 10, recommendedProducts.length);
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

    const currentRef = observerTarget.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [visibleCount, recommendedProducts.length]);

  // ⭐️ DB 로딩 중 화면 (운세 기록에서 진입 시)
  if (isLoadingFromDB) {
    return (
      <div className="bg-white relative min-h-screen w-full flex justify-center items-center">
        <div className="text-center px-[20px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#48b2af] mx-auto mb-4"></div>
          <p style={{ fontSize: '15px', color: '#999999' }}>운세 기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ⭐️ 데이터 로드 실패 또는 데이터 없음 시 에러 화면
  if (dataLoadError || !cachedData) {
    return (
      <div className="bg-white relative min-h-screen w-full flex justify-center items-center">
        <div className="text-center px-[20px]">
          <p className="text-[#999999] mb-4">결과를 찾을 수 없습니다</p>
          <button
            onClick={onClose}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white fixed inset-0 flex justify-center">
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white relative">
        {/* Top Bar */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex items-center justify-between px-[12px] h-full w-full">
            <div className="opacity-0 p-[4px] size-[44px]" />
            <p className="font-semibold text-[18px] text-black text-center tracking-[-0.36px]">상세 풀이</p>
            {/* X 버튼 - 미노출 처리 (필요 시 invisible/pointer-events-none 제거하여 복구) */}
            <button
              onClick={onClose}
              className="group flex items-center justify-center p-[4px] rounded-[12px] size-[44px] bg-transparent border-none cursor-pointer transition-colors duration-200 opacity-0 pointer-events-none"
            >
              <div className="size-[24px] transition-transform duration-200 group-active:scale-90 flex items-center justify-center">
                <svg className="block size-[20px]" fill="none" viewBox="0 0 24 24">
                  <path d="M4 20L20 4" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  <path d="M20 20L4 4" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* ⭐ Scrollable Content Area - overscroll-contain으로 iOS 바운스 방지 */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Content Area */}
          <div className="px-0 pb-[100px] pt-[12px]">
          <motion.div 
            className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Product Info Card */}
            <motion.div 
              className="bg-[#f7f8f9] relative shrink-0 w-full mb-[-16px] z-10"
              variants={itemVariants}
            >
              <div className="size-full">
                <div className="content-stretch flex flex-col items-start px-[20px] py-[12px] relative w-full">
                  <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
                    <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px]">
                      <div className="absolute inset-0 overflow-hidden rounded-[12px]">
                        <img alt="운세 콘텐츠 썸네일" className="absolute h-full left-0 max-w-none top-0 w-full object-cover" src={productImage} />
                      </div>
                      <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
                    </div>
                    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0">
                      <div className="bg-[#e7e7e7] content-stretch flex items-center justify-center px-[6px] relative rounded-[4px] shrink-0 pt-[3px] pb-[1px]">
                        <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[16px] relative shrink-0 text-[#6d6d6d] text-[12px] text-nowrap tracking-[-0.24px] whitespace-pre">무료 체험판</p>
                      </div>
                      <div className="relative shrink-0 w-full">
                        <div className="flex flex-row items-center justify-center size-full">
                          <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                            <p className="basis-0 font-medium grow leading-[23.5px] min-h-px min-w-px relative shrink-0 text-[15px] text-black tracking-[-0.3px]">
                              {productTitle}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Q&A Content */}
            <motion.div 
              className="content-stretch flex flex-col gap-[52px] items-start relative shrink-0 w-full"
              variants={containerVariants}
            >
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
                {/* ⭐️ 동적으로 질문/답변 렌더링 */}
                {cachedData.results.map((result, index) => (
                  <motion.div 
                    key={result.questionId} 
                    className="relative shrink-0 w-full"
                    variants={itemVariants}
                  >
                    {/* 첫 번째 아이템이 아니면 디바이더 표시 */}
                    {index > 0 && (
                      <div className="mb-[24px] w-full">
                        <div className="bg-[#f3f3f3] h-px shrink-0 w-full" />
                      </div>
                    )}
                    
                    {/* 질문/답변 내용 */}
                    <div className="size-full">
                      <div className="content-stretch flex flex-col items-start px-[20px] py-0 relative w-full">
                        <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                            <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[6px] py-px relative rounded-[8px] shrink-0">
                              <p className="font-medium leading-[22px] relative shrink-0 text-[#41a09e] text-[13px] text-nowrap whitespace-pre">
                                Q{result.questionOrder}
                              </p>
                            </div>
                            <div className="relative shrink-0 w-full">
                              <div className="flex flex-row items-center justify-center size-full">
                                <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                                  <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px relative shrink-0">
                                    <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                                      {result.questionText}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                            <div className="relative shrink-0 w-full">
                              <div className="flex flex-row items-center justify-center size-full">
                                <div className="content-stretch flex items-center justify-center px-[2px] py-0 relative w-full">
                                  <p className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] grow leading-[28.5px] min-h-px min-w-px relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                                    {result.previewText}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Promotion Banner */}
              <motion.div
                className="relative shrink-0 w-full"
                variants={itemVariants}
              >
                <AdBanner onBannerClick={onBannerClick} />
              </motion.div>

              {/* Recommended Products - 추천 콘텐츠가 있을 때만 표시 */}
              {sortedRecommendedProducts.length > 0 && (
                <motion.div
                  className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full px-[20px]"
                  variants={containerVariants}
                >
                  <motion.div
                    className="content-stretch flex items-center justify-between relative shrink-0 w-full"
                    variants={itemVariants}
                  >
                    <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                      <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">이런 운세는 어때요?</p>
                    </div>
                  </motion.div>

                  {/* ⭐ 수직 스크롤 영역 */}
                  <motion.div
                    className="relative w-full flex flex-col"
                    variants={containerVariants}
                  >
                    {sortedRecommendedProducts.slice(0, visibleCount).map((product, index) => (
                      <motion.div
                        key={product.id}
                        variants={itemVariants}
                      >
                        {/* 구분선 (첫 번째 아이템 제외) */}
                        {index > 0 && (
                          <div className="relative shrink-0 w-full py-[4px]">
                            <svg className="block w-full h-[1px]" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                              <path d="M0 0.5H350" stroke="#F9F9F9" />
                            </svg>
                          </div>
                        )}

                        <div className="w-full relative shrink-0">
                          <div
                            onClick={() => onProductClick?.(product.id)}
                            className="box-border content-stretch flex gap-[10px] items-start justify-start px-0 py-[10px] relative rounded-[16px] shrink-0 w-full cursor-pointer transition-all duration-150 ease-out origin-center active:scale-[0.96] active:bg-gray-50"
                          >
                            {/* ⭐ 썸네일 이미지 - 직사각형 80x54 */}
                            <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px]">
                              {product.image ? (
                                <img
                                  alt={product.title}
                                  loading="lazy"
                                  className="absolute inset-0 max-w-none object-center object-cover rounded-[12px] size-full"
                                  src={product.image}
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gray-200 rounded-[12px] flex items-center justify-center">
                                  <p className="text-gray-400 text-[12px]">이미지 없음</p>
                                </div>
                              )}
                              <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
                            </div>

                            {/* ⭐ 콘텐츠 정보 (ContentTags + 제목) */}
                            <div className="flex flex-col gap-[3px] grow min-w-0">
                              <ContentTags
                                isPaid={product.type === 'paid'}
                                isNew={isContentNew(product.created_at)}
                                isRead={readContentIds.has(String(product.id))}
                              />
                              <p style={{ fontSize: '15px', fontWeight: 500, lineHeight: '23.5px', letterSpacing: '-0.3px', color: '#000', fontFamily: 'Pretendard Variable' }} className="line-clamp-1 overflow-hidden">
                                {product.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* ⭐ 무한 스크롤 트리거 */}
                    {visibleCount < sortedRecommendedProducts.length && (
                      <div
                        ref={observerTarget}
                        className="h-[1px] w-full"
                        aria-hidden="true"
                      />
                    )}
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
        </div>{/* ⭐ Scrollable Container 닫기 */}

        {/* ⭐ 하단 고정 '다음' 버튼 - 나다움 기록하기로 이동 */}
        {onNext && (
          <div
            className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-start"
            style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}
          >
            <div className="flex flex-col items-start relative shrink-0 w-full">
              <div className="bg-white flex flex-col items-center justify-center relative shrink-0 w-full" style={{ padding: '12px 20px' }}>
                <button
                  onClick={onNext}
                  disabled={isNextLoading}
                  className="w-full flex items-center justify-center transition-all active:scale-[0.99] disabled:opacity-80"
                  style={{
                    height: '56px',
                    borderRadius: '16px',
                    backgroundColor: '#48b2af',
                    padding: '0 12px'
                  }}
                >
                  {isNextLoading ? (
                    // ⭐ 태그 추출 대기 중 로딩 스피너
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span style={{
                        fontFamily: 'Pretendard Variable',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '25px',
                        color: '#ffffff',
                        letterSpacing: '-0.32px'
                      }}>
                        잠시만요...
                      </span>
                    </div>
                  ) : (
                    <span style={{
                      fontFamily: 'Pretendard Variable',
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '25px',
                      color: '#ffffff',
                      letterSpacing: '-0.32px'
                    }}>
                      {nextLabel}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}