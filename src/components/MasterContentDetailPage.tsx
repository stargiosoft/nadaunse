import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from "../imports/svg-pln046rtst";
import svgPathsDetail from "../imports/svg-zywzkrbnkq";
import svgPathsPreview from "../imports/svg-ewb1xczw0i";
import svgPathsBack from "../imports/svg-ct14exwyb3";
import svgPathsHome from "../imports/svg-sg7rn8f2dm";
import characterImg from "@/assets/8fa8728d101fdaeafac6ed27251e023f3fa01e87.png";
import imgGeminiGeneratedImageEj66M7Ej66M7Ej661 from "@/assets/035bc3188c3deb79df2dfa8e61c9de80e6c7f992.png";
import tarotCardImg from "@/assets/2ced5a86877d398cd3930c1ef08e032cadaa48d4.png";
import { supabase } from '../lib/supabase';
import { projectId } from '../utils/supabase/info';
import { preloadLoadingPageImages } from '../lib/imagePreloader';
import { getThumbnailUrl } from '../lib/image';
import FreeContentDetail from './FreeContentDetail';
import PaidContentDetailSkeleton from './skeletons/PaidContentDetailSkeleton';
import { trackViewItem, trackPurchaseClick, trackPageView } from '../utils/analytics';
import SEO from './SEO';
import { ContentTags, isContentNew } from './ContentTags';
import { writeSproutBalanceCache } from '../hooks/useSproutBalance';
import ShareRewardModal from './ShareRewardModal';

// Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};


// 포트원 타입 선언
declare global {
  interface Window {
    IMP: any;
  }
}

interface MasterContent {
  id: string;
  title: string;
  content_type: 'paid' | 'free';
  category_main: string;
  thumbnail_url: string | null;
  description: string | null;
  questioner_info: string | null;
  weekly_clicks: number;
  view_count: number;
  price_original: number;
  price_discount: number;
  discount_rate: number;
  created_at?: string;
}

interface Question {
  id: string;
  question_order: number;
  question_type: 'saju' | 'tarot';
  question_text: string;
  preview_text: string | null;
}

type TabType = 'description' | 'principle' | 'preview';

function Notch() {
  return (
    <div className="absolute h-[30px] left-[103px] top-[-2px] w-[183px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 183 30">
        <g id="Notch">
          <path d={svgPaths.pf91bfc0} fill="var(--fill-0, black)" />
        </g>
      </svg>
    </div>
  );
}

function RightSide() {
  return (
    <div className="absolute h-[11.336px] right-[14.67px] top-[17.33px] w-[66.662px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 67 12">
        <g id="Right Side">
          <g id="Battery">
            <path d={svgPaths.p3c576cf0} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, black)" />
            <path d={svgPaths.p1667d738} fill="var(--fill-0, black)" id="Combined Shape" opacity="0.4" />
            <path d={svgPaths.p18fdac00} fill="var(--fill-0, black)" />
          </g>
          <path d={svgPaths.p344d52f0} fill="var(--fill-0, black)" id="Wifi" />
          <path d={svgPaths.p3694c600} fill="var(--fill-0, black)" id="Mobile Signal" />
        </g>
      </svg>
    </div>
  );
}

function Time() {
  return (
    <div className="absolute h-[21px] left-[21px] top-[12px] w-[54px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 54 21">
        <g id="Time">
          <g id="9:41">
            <path d={svgPaths.p24372f50} fill="var(--fill-0, black)" />
            <path d={svgPaths.p3aa84e00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p2e6b3780} fill="var(--fill-0, black)" />
            <path d={svgPaths.p12b0b900} fill="var(--fill-0, black)" />
          </g>
        </g>
      </svg>
    </div>
  );
}


interface MasterContentDetailPageProps {
  contentId: string;
}

// ⚠️ 개발 전용 플래그 - 배포 시 false로 변경하거나 이 섹션 전체 삭제
const IS_DEV_MODE = import.meta.env.DEV;

export default function MasterContentDetailPage({ contentId }: MasterContentDetailPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [content, setContent] = useState<MasterContent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isUsageGuideExpanded, setIsUsageGuideExpanded] = useState(false);
  const [isRefundPolicyExpanded, setIsRefundPolicyExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ⭐ 초기값 false (무료 콘텐츠는 스켈레톤 사용)
  // ⭐ 초기값을 localStorage에서 직접 읽어서 설정 (첫 렌더링부터 올바른 로그인 상태 반영 → 가격 영역 깜빡임 방지)
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('user'));
  const [isFreeContent, setIsFreeContent] = useState<boolean | null>(null); // ⭐ 무료 콘텐츠 여부 (초기 판별용)

  const [hasExistingAnswers, setHasExistingAnswers] = useState(false); // ⭐ 이미 생성된 답변 존재 여부
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false); // ⭐ 초기값 false
  const [isRead, setIsRead] = useState(false); // ⭐ 읽기 기록 여부

  // ⭐ AI 개인화 구매 가이드
  const [purchaseGuide, setPurchaseGuide] = useState<string | null>(null);
  const [isPurchaseGuideLoading, setIsPurchaseGuideLoading] = useState(false);
  const [primarySajuName, setPrimarySajuName] = useState<string | null>(null);
  // 태그 유무를 동기적으로 확인 (스켈레톤 표시 판단용)
  const [hasTraitTags] = useState(() => {
    try {
      const cache = localStorage.getItem('trait_tags_cache');
      if (cache) return (JSON.parse(cache).totalCount || 0) > 0;
    } catch { /* ignore */ }
    return false;
  });

  // ⭐ 읽기 기록 확인 (orders + free_content_records)
  useEffect(() => {
    const checkReadHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      // 유료: orders에서 success=true 확인
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .in('pstatus', ['completed', 'paid'])
        .limit(1);
      if (orders && orders.length > 0) { setIsRead(true); return; }
      // 무료: free_content_records 확인
      const { data: freeRecords } = await supabase
        .from('free_content_records')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .limit(1);
      if (freeRecords && freeRecords.length > 0) setIsRead(true);
    };
    checkReadHistory();
  }, [contentId]);

  // 🛡️ bfcache 핸들러: iOS Safari bfcache 복원 시 홈으로 이동
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 [MasterContentDetailPage] bfcache 복원 감지 → 홈으로 이동');
        navigate('/', { replace: true });
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [navigate]);

  // 🛡️ History Guard Entry: iOS 스와이프 뒤로가기 시 항상 홈으로 이동하도록
  // 현재 히스토리 엔트리 바로 앞에 홈(/) 엔트리를 삽입
  // ⭐ React Router state를 그대로 보존 (idx 변경 금지 - 내부 추적 깨짐 방지)
  const hasHistoryGuardRef = useRef(false);
  useEffect(() => {
    if (hasHistoryGuardRef.current) return;
    hasHistoryGuardRef.current = true;

    const currentState = window.history.state;
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;

    // 1) 현재 엔트리를 홈(/)으로 교체 (동일 state 유지)
    window.history.replaceState(currentState, '', '/');

    // 2) 실제 콘텐츠 상세 페이지를 다시 push (동일 state 유지)
    window.history.pushState(currentState, '', currentUrl);

    console.log('🛡️ [MasterContentDetailPage] History guard entry inserted');
  }, []);
  const usageGuideRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const tabBarInnerRef = useRef<HTMLDivElement>(null);
  const [tabBarHeight, setTabBarHeight] = useState<number>(0);

  // 탭 순서 및 인덱스 구하기
  const tabOrder: TabType[] = ['description', 'principle', 'preview'];
  const activeTabIndex = tabOrder.indexOf(activeTab);

  // ⭐️ 스와이프 애니메이션 로직
  const [direction, setDirection] = useState(0);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      position: 'absolute' as const, // 겹치지 않게 절대 위치
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      position: 'relative' as const,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      position: 'absolute' as const,
    })
  };

  const handleTabChange = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= tabOrder.length) return;
    
    // 방향 설정
    setDirection(newIndex > activeTabIndex ? 1 : -1);
    setActiveTab(tabOrder[newIndex]);
    
    // 스크롤 초기화
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) scrollContainer.scrollTop = 0;
    setIsTabBarVisible(true);
    lastScrollYRef.current = 0;
  };

  // 탭바 높이 측정 (content 로드 후 tabBarInnerRef가 DOM에 붙으면 측정)
  useEffect(() => {
    if (tabBarInnerRef.current) {
      setTabBarHeight(tabBarInnerRef.current.offsetHeight);
    }
  }, [content]);

  // 탭바 스크롤 hide/show
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const currentY = el.scrollTop;
    const diff = currentY - lastScrollYRef.current;
    if (Math.abs(diff) < 4) return; // 미세한 떨림 무시
    setIsTabBarVisible(diff < 0 || currentY < 10);
    lastScrollYRef.current = currentY;
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, content]); // content 로드 후 scrollContainerRef가 DOM에 붙으면 리스너 재등록









  const CACHE_KEY = `content_detail_${contentId}_cache`;
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5분



  // 캐시에서 데이터 로드
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        if (now - timestamp < CACHE_EXPIRY) {
          console.log('✅ 캐시에서 데이터 로드 (콘텐츠 상세)', {
            price_original: data.content?.price_original,
            price_discount: data.content?.price_discount,
            discount_rate: data.content?.discount_rate
          });
          
          // 🐛 디버깅: 캐시 데이터 검증 (무료 콘텐츠는 가격이 0일 수 있으므로 content_type 확인)
          if (data.content?.content_type === 'paid' && (!data.content?.price_discount || !data.content?.price_original)) {
            console.warn('⚠️ [캐시 로드 경고] 유료 콘텐츠인데 가격 정보가 0이거나 없음! 캐시 무효화');
            localStorage.removeItem(CACHE_KEY);
            return false;
          }
          
          setContent(data.content);
          setQuestions(data.questions);
          // 🔥 중요: 캐시에서 로드한 content_type으로 즉시 설정
          setIsFreeContent(data.content.content_type === 'free');
          return true;
        } else {
          console.log('⏰ 캐시 만료됨 (콘텐츠 상세)');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, [CACHE_KEY]);

  // 캐시에 데이터 저장
  const saveToCache = useCallback((contentData: MasterContent, questionsData: Question[]) => {
    try {
      // 🐛 디버깅: 가격 정보 검증 (유료 콘텐츠만)
      if (contentData.content_type === 'paid') {
        if (!contentData.price_discount || !contentData.price_original || !contentData.discount_rate) {
          console.error('⚠️ [캐시 저장 경고] 유료 콘텐츠인데 가격 정보가 0이거나 없음!', {
            price_original: contentData.price_original,
            price_discount: contentData.price_discount,
            discount_rate: contentData.discount_rate,
            title: contentData.title,
            content_type: contentData.content_type
          });
        }
      }
      
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { content: contentData, questions: questionsData },
        timestamp: Date.now()
      }));
      console.log('💾 캐시에 데이터 저장 (콘텐츠 상세)', {
        content_type: contentData.content_type,
        price_original: contentData.price_original,
        price_discount: contentData.price_discount,
        discount_rate: contentData.discount_rate
      });
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  }, [CACHE_KEY]);

  // Load content and questions
  useEffect(() => {
    // 로그인 상태 확인
    const userJson = localStorage.getItem('user');
    setIsLoggedIn(!!userJson);

    // ⭐ 백그라운드 업데이트 함수 (API 병렬화 적용)
    const updateInBackground = async (userJsonParam: string | null) => {
      try {
        // 🚀 콘텐츠 + 질문 동시 조회 (Promise.all)
        const [contentResult, questionsResult] = await Promise.all([
          supabase
            .from('master_contents')
            .select('id, title, content_type, category_main, thumbnail_url, description, questioner_info, weekly_clicks, view_count, price_original, price_discount, discount_rate, status, created_at')
            .eq('id', contentId)
            .eq('status', 'deployed')
            .single(),
          supabase
            .from('master_content_questions')
            .select('*')
            .eq('content_id', contentId)
            .order('question_order', { ascending: true })
        ]);

        const { data: contentData, error: contentError } = contentResult;
        const { data: questionsData, error: questionsError } = questionsResult;

        if (contentError || !contentData) {
          console.error('콘텐츠 조회 실패:', contentError);
          throw new Error('콘텐츠를 불러올 수 없습니다.');
        }

        if (questionsError) {
          console.error('질문 조회 실패:', questionsError);
        }

        const finalQuestionsData = questionsData || [];

        // 🎨 썸네일 URL 최적화 (detail용 - 리스트와 동일한 크기로 캐시 히트)
        const optimizedContent = {
          ...contentData,
          thumbnail_url: getThumbnailUrl(contentData.thumbnail_url, 'detail')
        } as MasterContent;

        // 💰 가격 정보 디버깅 로그
        console.log('💰 [상품 상세] 가격 정보:', {
          price_original: optimizedContent.price_original,
          price_discount: optimizedContent.price_discount,
          discount_rate: optimizedContent.discount_rate,
        });

        // 🎫 로그인 상태: 주문/답변 체크
        if (userJsonParam) {
          try {
            const user = JSON.parse(userJsonParam);

            // 유효한 UUID인지 확인
            const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
            if (!isValidUUID) {
              console.warn('⚠️ [Warning] Invalid user UUID (dev_user detected), skipping user data fetch.');
              setIsCheckingAnswers(false);
              throw new Error('INVALID_UUID');
            }

            // 주문 조회
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('id')
              .eq('user_id', user.id)
              .eq('content_id', contentId)
              .order('created_at', { ascending: false })
              .limit(1);

            // 답변 존재 여부 확인 (타로 콘텐츠용)
            if (!ordersError && ordersData && ordersData.length > 0) {
              const orderId = ordersData[0].id;
              console.log('✅ [타로] 주문 찾음, orderId:', orderId);

              // order_results에서 답변 존재 여부 확인 (RLS 통과를 위해 orders 조인)
              const { data: answersData, error: answersError } = await supabase
                .from('order_results')
                .select('id, orders!inner(user_id)')
                .eq('order_id', orderId)
                .limit(1);

              if (!answersError && answersData && answersData.length > 0) {
                console.log('✅ [타로] 답변 이미 존재함 → 카드 선택 화면 스킵');
                setHasExistingAnswers(true);
              } else {
                console.log('ℹ️ [타로] 답변 없음 → 카드 선택 화면 표시');
                setHasExistingAnswers(false);
              }
            } else {
              console.log('ℹ️ [타로] 주문 내역 없음');
              setHasExistingAnswers(false);
            }

            setIsCheckingAnswers(false);
          } catch (error: any) {
            if (error.message !== 'INVALID_UUID') {
              console.error('주문 조회 중 오류:', error);
            }
            setIsCheckingAnswers(false);
          }
        } else {
          // 로그아웃 상태면 답변 체크 불필요
          setIsCheckingAnswers(false);
        }

        // 💾 새 캐시 저장
        saveToCache(optimizedContent, finalQuestionsData as Question[]);

        // ✅ 최신 데이터로 UI 업데이트
        setContent(optimizedContent as MasterContent);
        setQuestions(finalQuestionsData as Question[]);
        // 🔥 중요: DB에서 불러온 최신 content_type으로 업데이트
        setIsFreeContent(optimizedContent.content_type === 'free');
        setIsLoading(false);

        console.log('✅ 최신 데이터로 업데이트 완료', { content_type: optimizedContent.content_type });
      } catch (error) {
        console.error('❌ 백그라운드 업데이트 실패:', error);
        // 에러 시에도 로딩 해제
        setIsLoading(false);
      }
    };

    // 🚀 캐시 확인을 상태 초기화 전에 먼저 수행!
    const hasCache = loadFromCache();

    if (hasCache) {
      console.log('✅ 캐시에서 즉시 표시 (백그라운드에서 최신 데이터 로드 중...)');
      // ⭐ 캐시가 있으면 상태 초기화 없이 즉시 표시
      setIsLoading(false);

      // ⭐ 백그라운드에서 최신 데이터 업데이트 (비동기, 사용자는 기다리지 않음)
      updateInBackground(userJson);
      return; // ⭐ 조기 종료
    }

    // ⭐ 캐시가 없을 때만 상태 초기화 (이전 콘텐츠 깜빡임 방지)
    setContent(null);
    setQuestions([]);
    setIsFreeContent(null);
    setIsLoading(true);

    const fetchContent = async () => {
      // ⭐ 캐시가 없을 때: content_type만 먼저 빠르게 조회
      try {
        const { data: typeData } = await supabase
          .from('master_contents')
          .select('content_type')
          .eq('id', contentId)
          .single();

        if (typeData) {
          setIsFreeContent(typeData.content_type === 'free');
          console.log('⚡ content_type 먼저 확인:', typeData.content_type);
        }
      } catch (error) {
        console.error('content_type 조회 실패:', error);
      }

      // DB에서 최신 데이터 로드
      await updateInBackground(userJson);
    };

    fetchContent();
  }, [contentId, loadFromCache, saveToCache]);

  // ⭐ 본인 사주 닉네임 조회
  useEffect(() => {
    const fetchPrimarySajuName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from('saju_records')
        .select('full_name')
        .eq('user_id', session.user.id)
        .eq('is_primary', true)
        .maybeSingle();
      if (data?.full_name) setPrimarySajuName(data.full_name);
    };
    fetchPrimarySajuName();
  }, []);

  // ⭐ AI 개인화 구매 가이드 로드 (콘텐츠 로드와 동시 시작)
  useEffect(() => {
    // 비로그인 또는 태그 없음 → 스킵
    if (!hasTraitTags) return;
    const userJson = localStorage.getItem('user');
    if (!userJson) return;

    let userId: string;
    try {
      userId = JSON.parse(userJson).id;
    } catch {
      return;
    }

    // localStorage 캐시 확인 (24시간 TTL)
    const cacheKey = `purchase_guide_v1_${userId}_${contentId}`;
    const needsRefresh = localStorage.getItem('trait_tags_needs_refresh') === 'true';
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached && !needsRefresh) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setPurchaseGuide(parsed.guide.replace(/\\n/g, '\n'));
          return;
        }
      }
    } catch {
      // 캐시 파싱 실패 → 무시하고 API 호출
    }

    setIsPurchaseGuideLoading(true);
    supabase.functions.invoke('generate-purchase-guide', {
      body: { contentId }
    }).then(({ data, error }) => {
      if (error) {
        console.error('❌ [purchase-guide] Edge Function 오류:', error);
        return;
      }
      if (data?.success && data.guide) {
        setPurchaseGuide(data.guide.replace(/\\n/g, '\n'));
        localStorage.setItem(cacheKey, JSON.stringify({
          guide: data.guide,
          timestamp: Date.now()
        }));
      }
    }).catch(err => {
      console.error('❌ [purchase-guide] 예외:', err);
    }).finally(() => {
      setIsPurchaseGuideLoading(false);
    });
  }, [contentId]);

  // 🔝 페이지 진입 시 스크롤을 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [contentId]); // contentId가 바뀔 때마다 최상단으로

  // 🔍 [DEBUG] 클릭 차단 요소 탐지 (배포 후 제거)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      console.log('🔍 [DEBUG] 클릭된 요소:', {
        tag: target.tagName,
        id: target.id,
        className: target.className?.toString?.()?.slice(0, 100),
        dataset: target.dataset,
        rect: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) },
        zIndex: getComputedStyle(target).zIndex,
        pointerEvents: getComputedStyle(target).pointerEvents,
        position: getComputedStyle(target).position,
      });
    };
    document.addEventListener('click', handler, true); // capture phase

    // 헤더 버튼 위치에 어떤 요소가 있는지 체크
    setTimeout(() => {
      const points = [
        { x: 30, y: 30, label: '뒤로가기 버튼 위치' },
        { x: window.innerWidth - 30, y: 30, label: '홈 버튼 위치' },
        { x: window.innerWidth / 2, y: 30, label: '헤더 중앙' },
      ];
      points.forEach(({ x, y, label }) => {
        const el = document.elementFromPoint(x, y);
        if (el) {
          const style = getComputedStyle(el);
          console.log(`🎯 [DEBUG] ${label} (${x},${y}):`, {
            tag: el.tagName,
            id: el.id,
            className: el.className?.toString?.()?.slice(0, 100),
            zIndex: style.zIndex,
            position: style.position,
            pointerEvents: style.pointerEvents,
            parentTag: el.parentElement?.tagName,
            parentId: el.parentElement?.id,
          });
        }
      });
    }, 2000);

    return () => document.removeEventListener('click', handler, true);
  }, []);

  // ⭐ 풀이원리 탭 오리 이미지 preload (탭 전환 시 즉시 표시)
  useEffect(() => {
    const img = new Image();
    img.src = imgGeminiGeneratedImageEj66M7Ej66M7Ej661;
  }, []);

  // Increment view count when page loads
  useEffect(() => {
    const incrementViewCount = async () => {
      const { data: currentData } = await supabase
        .from('master_contents')
        .select('view_count, weekly_clicks')
        .eq('id', contentId)
        .single();

      if (currentData) {
        await supabase
          .from('master_contents')
          .update({
            view_count: currentData.view_count + 1,
            weekly_clicks: currentData.weekly_clicks + 1
          })
          .eq('id', contentId);
      }
    };

    incrementViewCount();
  }, [contentId]);

  // 📊 GA4: 제품 보기 이벤트 (view_item) + 페이지뷰 (콘텐츠별 타이틀)
  useEffect(() => {
    if (content && !isLoading) {
      // 콘텐츠별 타이틀로 페이지뷰 트래킹
      const pageTitle = `[유료] ${content.title} | 나다운세`;
      document.title = pageTitle;
      trackPageView(window.location.pathname + window.location.search, pageTitle);
      console.log('📊 [GA4] page_view 이벤트 전송:', pageTitle);

      // view_item 이벤트
      trackViewItem({
        id: content.id,
        title: content.title,
        category: content.category_main,
        type: content.content_type,
        discountPrice: content.price_discount || 0,
      });
      console.log('📊 [GA4] view_item 이벤트 전송:', content.title);
    }
  }, [content?.id, isLoading]);

  // ⭐ 로딩 중이고 content_type을 아직 모를 �� (캐시 없음) → 스켈레톤 표시
  if (isLoading && !content) {
    // 🔥 무료 콘텐츠로 판별되었으면 FreeContentDetail에게 스켈레톤 처리 위임
    if (isFreeContent === true) {
      return (
        <FreeContentDetail
          contentId={contentId}
          onBack={() => navigate('/', { replace: true })}
          onHome={() => navigate('/', { replace: true })}
          onPurchase={async () => {}} // 로딩 중이므로 빈 함수
          onContentClick={(contentId) => {
            console.log('🔥 MasterContentDetailPage navigate 시도:', `/master/content/detail/${contentId}`);
            navigate(`/master/content/detail/${contentId}`);
          }}
          onBannerClick={() => {
            navigate('/', { replace: true });
          }}
        />
      );
    }

    // 무료/유료 판별 전 또는 유료 콘텐츠 → 유료 스켈레톤 사용
    console.log('🔍 [MasterContentDetail] 스켈레톤 렌더링 - loading:', isLoading, 'content:', !!content, 'isFreeContent:', isFreeContent);
    return <PaidContentDetailSkeleton />;
  }

  // ⭐ 무�� 콘텐츠는 바로 FreeContentDetail로 렌더링 (FreeContentDetail이 로딩/스켈레톤 처리)
  if (isFreeContent === true) {
    const handleFreePurchase = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🆓 [MasterContentDetailPage] 무료 콘텐츠 "무료로 보기" 클릭');
      console.log('📌 [MasterContentDetailPage] contentId:', contentId);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (user) {
        console.log('👤 [무료콘텐츠] 로그인 사용자 → 사주 정보 확인');
        
        const { data: sajuRecords, error: sajuError } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        console.log('📋 [무료콘텐츠] 사주 레코드:', sajuRecords);
        console.log('📋 [무료콘텐츠] 사주 개수:', sajuRecords?.length || 0);

        if (sajuRecords && sajuRecords.length > 0) {
          console.log('✅ [무료콘텐츠] 사주 정보 있음 → 사주 선택 페이지로 이동');
          navigate(`/product/${contentId}/free-saju-select`);
          return;
        } else {
          console.log('⚠️ [무료콘텐츠] 사주 정보 없음 → 사주 입력 페이지로 이동');
          navigate(`/product/${contentId}/birthinfo`);
          return;
        }
      } else {
        console.log('⚠️ [무료콘텐츠] 비로그인 사용자 → 사주 입력 페이지로 이동');
        navigate(`/product/${contentId}/birthinfo`);
        return;
      }
    };

    return (
      <FreeContentDetail
        contentId={contentId}
        onBack={() => navigate('/', { replace: true })}
        onHome={() => navigate('/', { replace: true })}
        onPurchase={handleFreePurchase}
        onContentClick={(contentId) => {
          console.log('🔥 MasterContentDetailPage navigate 시도:', `/master/content/detail/${contentId}`);
          navigate(`/master/content/detail/${contentId}`);
        }}
        onBannerClick={() => {
          navigate('/', { replace: true });
        }}
      />
    );
  }

  // ⭐ 여기 도달하면 명확히 유료 콘텐츠 (isFreeContent === false)
  // 데이터가 없거나 쿠폰/답변 체크 중이면 스켈레톤 표시
  if (!content || isCheckingAnswers) {
    console.log('🔍 [PaidContentDetail] 스켈레톤 렌더링 (유료) - content:', !!content, 'isCheckingAnswers:', isCheckingAnswers);
    return <PaidContentDetailSkeleton />;
  }

  if (!content) {
    return (
      <div className="bg-white relative min-h-screen w-full flex items-center justify-center">
        <div className="text-center px-[20px]">
          <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[16px] text-[#999999] mb-[20px]">
            콘텐츠를 찾을 수 없습니다
          </p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="bg-[#48b2af] text-white px-[24px] py-[12px] rounded-[12px] font-['Pretendard_Variable:SemiBold',sans-serif]"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ⭐ 무료 콘텐츠는 위에서 이미 처리됨 (391-427 라인), 이 블록은 실행되지 않음
  if (false && content.content_type === 'free') {
    const handleFreePurchase = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🆓 [MasterContentDetailPage] 무료 콘텐츠 "무료로 보기" 클릭');
      console.log('📌 [MasterContentDetailPage] contentId:', contentId);
      
      // ⭐️ Supabase에서 로그인 상태 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 [MasterContentDetailPage] Supabase 로그인 확인 완료');
      console.log('📌 [MasterContentDetailPage] user:', user);
      console.log('📌 [MasterContentDetailPage] user?.id:', user?.id);
      console.log('📌 [MasterContentDetailPage] userError:', userError);
      console.log('📌 [MasterContentDetailPage] 로그인 상태:', user ? '✅ 로그인됨' : '❌ 로그아웃됨');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (user) {
        // 로그인 상태: 사주 정보 DB에서 조회
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [MasterContentDetailPage] 로그인 상태 → DB에서 사주 정보 조회 시작...');
        console.log('📌 [MasterContentDetailPage] user.id:', user.id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���');
        
        // ⭐️ 무료 콘텐츠는 본인 사주만 조회
        const { data: sajuRecords, error: sajuError } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('notes', '본인')
          .order('created_at', { ascending: false });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 [MasterContentDetailPage] 사주 정보 조회 완료 (본인만)');
        console.log('📌 [MasterContentDetailPage] sajuRecords:', sajuRecords);
        console.log('📌 [MasterContentDetailPage] sajuError:', sajuError);
        console.log('📌 [MasterContentDetailPage] sajuRecords?.length:', sajuRecords?.length);
        console.log('📌 [MasterContentDetailPage] sajuRecords 상세:');
        sajuRecords?.forEach((record, idx) => {
          console.log(`   [${idx}] id: ${record.id}, name: ${record.full_name}, birth_date: ${record.birth_date}, note: ${record.note}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (sajuRecords && sajuRecords.length > 0) {
          // 사주 정보 없음 → 사주 선택 페이지
          console.log('━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ [MasterContentDetailPage] 사주 정보 있음 (' + sajuRecords.length + '개)');
          console.log('🔀 [MasterContentDetailPage] FreeSajuSelectPage로 이동');
          console.log('📍 [MasterContentDetailPage] navigate to:', `/product/${contentId}/free-saju-select`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          navigate(`/product/${contentId}/free-saju-select`);
          return;
        } else {
          // 사주 정보 없음 → 사주 입력 페이지
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ [MasterContentDetailPage] 사주 정보 없음 (0개)');
          console.log('🔀 [MasterContentDetailPage] FreeBirthInfoInput으로 이동');
          console.log('📍 [MasterContentDetailPage] navigate to:', `/product/${contentId}/birthinfo`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          navigate(`/product/${contentId}/birthinfo`);
          return;
        }
      } else {
        // ⭐️ 로그아웃 상태: 항상 사주 입력 페이지로 이동 (캐시 있으면 자동 입력)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [MasterContentDetailPage] 로그아웃 상태');
        console.log('🔍 [MasterContentDetailPage] localStorage 캐시 확인...');
        
        const cachedSaju = localStorage.getItem('cached_saju_info');
        console.log('📌 [MasterContentDetailPage] cached_saju_info:', cachedSaju ? '있음' : '없음');
        
        // 캐시 여부와 관계없이 사주 입력 페이지로 이동 (입력 페이지에서 자동 채움)
        console.log('🔀 [MasterContentDetailPage] FreeBirthInfoInput으로 이동 (캐시 있으면 자동 입력)');
        console.log('📍 [MasterContentDetailPage] navigate to:', `/product/${contentId}/birthinfo`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        navigate(`/product/${contentId}/birthinfo`);
        return;
      }
    };

    return (
      <FreeContentDetail
        contentId={contentId}
        onBack={() => navigate('/', { replace: true })}
        onHome={() => navigate('/', { replace: true })}
        onPurchase={handleFreePurchase}
      />
    );
  }

  const isPaid = content.content_type === 'paid';
  const onBack = () => {
    console.log('🔙 [MasterContentDetailPage] onBack 호출됨', { timestamp: new Date().toISOString() });
    navigate('/', { replace: true });
  };
  
  const onPurchase = async () => {
    console.log('🔵 [MasterContentDetailPage] onPurchase 함수 시작', {
      timestamp: new Date().toISOString(),
      contentId
    });
    console.log('🛒 [유료상품] 구매하기 클릭:', contentId);

    // 📊 GA 이벤트: 구매 버튼 클릭
    if (content) {
      trackPurchaseClick(contentId, content.title, content.price_discount || content.price_original || 0);
    }

    // ⭐ 로그인 체크 (getSession은 로컬 캐시, 네트워크 호출 없음)
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    console.log('🔐 [MasterContentDetailPage] 로그인 체크 완료:', { isLoggedIn: !!user });

    if (!user) {
      const redirectUrl = `/master/content/detail/${contentId}`;
      console.log('🔐 로그아웃 상태 → 리다이렉트 URL 저장:', redirectUrl);
      localStorage.setItem('redirectAfterLogin', redirectUrl);
      navigate('/login/new', { state: { canGoBack: true, fromPath: `/master/content/detail/${contentId}` } });
      return;
    }

    // ⭐ 새싹 잔액 확인 (캐시 우선, 없으면 DB 조회)
    const requiredAmount = 30;
    const cachedBalanceRaw = localStorage.getItem('sprout_balance_cache');
    let currentBalance: number;

    if (cachedBalanceRaw) {
      try {
        currentBalance = JSON.parse(cachedBalanceRaw).balance ?? 0;
      } catch {
        currentBalance = 0;
      }
      console.log('🌱 [MasterContentDetailPage] 캐시 잔액:', currentBalance, '필요:', requiredAmount);
    } else {
      console.log('🌱 [MasterContentDetailPage] 새싹 잔액 DB 조회 중...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('sprout_balance')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('❌ [MasterContentDetailPage] 잔액 조회 실패:', userError);
        alert('잔액 조회에 실패했습니다. 다시 시도해주세요.');
        return;
      }
      currentBalance = userData?.sprout_balance ?? 0;
      writeSproutBalanceCache(currentBalance);
      console.log('🌱 [MasterContentDetailPage] DB 잔액:', currentBalance, '필요:', requiredAmount);
    }

    if (currentBalance < requiredAmount) {
      console.log('🌱 잔액 부족 → 새싹 충전소로 이동');
      navigate(`/sprout-charging/${contentId}`, {
        state: { requiredAmount, currentBalance },
      });
      return;
    }

    // ⭐ 잔액 충분 → 차감 시작
    console.log('✅ 잔액 충분 → 새싹 차감 시작');

    // 사주 보유 여부를 차감 전에 미리 판단 (캐시 활용, 네트워크 호출 절약)
    const sajuCacheJson = localStorage.getItem('saju_records_cache');
    let hasSajuFromCache: boolean | null = null;
    if (sajuCacheJson) {
      try {
        hasSajuFromCache = JSON.parse(sajuCacheJson).length > 0;
      } catch { /* ignore */ }
    }

    try {
      // 네트워크 호출 #1: 새싹 차감 (Edge Function)
      const edgeFnUrl = `https://${projectId}.supabase.co/functions/v1/sprout-deduct`;
      const res = await fetch(edgeFnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content_id: contentId,
          amount: requiredAmount,
        }),
      });
      const result = await res.json();

      if (!result.success) {
        if (result.error === 'insufficient_balance') {
          navigate(`/sprout-charging/${contentId}`, {
            state: { requiredAmount, currentBalance: result.current_balance ?? 0 },
          });
          return;
        }
        console.error('❌ [MasterContentDetailPage] 차감 실패:', result);
        alert('새싹 차감에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      if (result.new_balance != null) {
        writeSproutBalanceCache(result.new_balance);
      }

      console.log('✅ 새싹 차감 성공 → 주문 생성 시작');

      // 네트워크 호출 #2: 주문 생성 + (캐시 미스 시) 사주 조회 병렬
      const merchantUid = `order_${Date.now()}`;
      const orderPromise = supabase
        .from('orders')
        .insert({
          user_id: user.id,
          content_id: contentId,
          merchant_uid: merchantUid,
          paid_amount: requiredAmount,
          pay_method: 'sprout',
          pg_provider: 'sprout',
          pstatus: 'completed',
          success: true,
          gname: content?.title || '운세 구성',
        })
        .select('id')
        .single();

      let hasSaju = hasSajuFromCache ?? false;

      if (hasSajuFromCache === null) {
        // 사주 캐시 없음 → 주문 생성과 병렬로 사주 조회
        const [orderResult, sajuResult] = await Promise.all([
          orderPromise,
          supabase.from('saju_records').select('*').eq('user_id', user.id),
        ]);

        if (orderResult.error || !orderResult.data) {
          console.error('❌ [MasterContentDetailPage] 주문 생성 실패:', orderResult.error);
          alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        localStorage.setItem('pendingOrderId', orderResult.data.id);
        console.log('✅ 주문 생성 완료:', orderResult.data.id);

        const mySajuList = sajuResult.data;
        hasSaju = mySajuList ? mySajuList.length > 0 : false;
        if (hasSaju && mySajuList) {
          const primary = mySajuList.find((s: Record<string, unknown>) => s.is_primary) || mySajuList[0];
          localStorage.setItem('primary_saju', JSON.stringify(primary));
          localStorage.setItem('saju_records_cache', JSON.stringify(mySajuList));
        }
      } else {
        // 사주 캐시 히트 → 주문 생성만
        const { data: newOrder, error: orderError } = await orderPromise;

        if (orderError || !newOrder) {
          console.error('❌ [MasterContentDetailPage] 주문 생성 실패:', orderError);
          alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        localStorage.setItem('pendingOrderId', newOrder.id);
        console.log('✅ 주문 생성 완료:', newOrder.id);
      }

      // 구매내역 캐시만 무효화 (사주 캐시는 구매와 무관하므로 유지)
      localStorage.removeItem('purchase_history_cache');

      // 로딩 페이지 이미지 미리 로드
      preloadLoadingPageImages();

      if (hasSaju) {
        navigate(`/product/${contentId}/saju-select`);
      } else {
        navigate(`/product/${contentId}/birthinfo`);
      }
    } catch (err) {
      console.error('❌ [MasterContentDetailPage] 차감 처리 예외:', err);
      alert('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      <SEO
        title={`[유료] ${content.title}`}
        description={content.description || `${content.title} - AI가 분석하는 나만의 운세`}
        canonical={`/product/${contentId}`}
        ogImage={content.thumbnail_url}
        keywords="사주, 타로, 궁합, AI 운세, 사주풀이, 신년운세, 나다운세"
        product={{
          name: content.title,
          description: content.description || `${content.title} - AI가 분석하는 나만의 운세`,
          image: content.thumbnail_url,
          price: content.price_discount || content.price_original || 0,
        }}
      />
      <div className="flex justify-center h-[100dvh] w-full overflow-hidden touch-pan-y overscroll-none">
        <div className="w-full max-w-[440px] h-full flex flex-col relative bg-white overflow-hidden">
          {/* Top Navigation */}
          <div className="shrink-0 z-20 bg-white relative">
          
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white h-[52px] relative shrink-0 w-full">
              <div className="flex flex-col justify-center size-full">
                <div className="box-border content-stretch flex flex-col gap-[10px] h-[52px] items-start justify-center px-[12px] py-[4px] relative w-full">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="뒤로가기"
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        onBack();
                      }}
                      onClick={onBack}
                      className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer group hover:bg-[#F3F3F3] active:bg-[#F3F3F3] touch-manipulation pointer-events-auto select-none z-30"
                    >
                      <svg className="block w-6 h-6 group-active:scale-95 transition-transform pointer-events-none" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                        <g id="arrow-left">
                          <path d={svgPathsBack.p2a5cd480} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                          <path d={svgPathsBack.p1a4bb100} opacity="0" stroke="var(--stroke-0, #848484)" />
                        </g>
                      </svg>
                    </div>
                    <p className="basis-0 font-semibold grow leading-[25.5px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                      {content.title}
                    </p>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="홈으로"
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        onBack();
                      }}
                      onClick={onBack}
                      className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer group hover:bg-[#F3F3F3] active:bg-[#F3F3F3] touch-manipulation pointer-events-auto select-none z-30"
                    >
                      <svg className="block w-6 h-6 group-active:scale-95 transition-transform pointer-events-none" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                        <g id="home-2">
                          <path d={svgPathsHome.p3d07f180} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                          <path d="M12 17.99V14.99" stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tab Bar */}
            <motion.div
              className="overflow-hidden shrink-0 w-full"
              animate={{
                height: tabBarHeight > 0 ? (isTabBarVisible ? tabBarHeight : 0) : 'auto',
                opacity: isTabBarVisible ? 1 : 0,
              }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
            <div ref={tabBarInnerRef} className="bg-white relative w-full">
              <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
              <div className="size-full">
                <div className="box-border content-stretch flex flex-col items-start px-[16px] pt-[4px] pb-[8px] relative w-full">
                  <div className="content-stretch flex items-center overflow-clip relative shrink-0 w-full">
                    {/* 상품 설명 탭 */}
                    <div 
                      onClick={() => handleTabChange(0)}
                      className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 cursor-pointer"
                    >
                      {activeTab === 'description' && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-[#f8f8f8] rounded-[12px]"
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                      )}
                      <div className="flex flex-row items-center justify-center size-full relative z-10">
                        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[8px] relative w-full">
                          <p className={`${activeTab === 'description' ? "font-semibold text-[#151515]" : "font-medium text-[#999999]"} leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap tracking-[-0.45px] whitespace-pre transition-colors duration-200`}>상품 설명</p>
                        </div>
                      </div>
                    </div>
                    {/* 풀이 원리 탭 */}
                    <div 
                      onClick={() => handleTabChange(1)}
                      className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 cursor-pointer"
                    >
                      {activeTab === 'principle' && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-[#f8f8f8] rounded-[12px]"
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                      )}
                      <div className="flex flex-row items-center justify-center size-full relative z-10">
                        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[8px] relative w-full">
                          <p className={`${activeTab === 'principle' ? "font-semibold text-[#151515]" : "font-medium text-[#999999]"} leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap tracking-[-0.45px] whitespace-pre transition-colors duration-200`}>풀이 원리</p>
                        </div>
                      </div>
                    </div>
                    {/* 맛보기 탭 */}
                    <div 
                      onClick={() => handleTabChange(2)}
                      className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 cursor-pointer"
                    >
                      {activeTab === 'preview' && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-0 bg-[#f8f8f8] rounded-[12px]"
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                      )}
                      <div className="flex flex-row items-center justify-center size-full relative z-10">
                        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[8px] relative w-full">
                          <p className={`${activeTab === 'preview' ? "font-semibold text-[#151515]" : "font-medium text-[#999999]"} leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap tracking-[-0.45px] whitespace-pre transition-colors duration-200`}>맛보기</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative w-full z-0 scrollbar-hide">
          <div ref={containerRef} className="pb-[120px] overflow-hidden relative w-full">
            <motion.div
              className={`flex ${isFreeContent ? "w-[300%]" : "w-full"}`}
              animate={{ x: isFreeContent ? `-${tabOrder.indexOf(activeTab) * (100 / tabOrder.length)}%` : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag={isFreeContent ? "x" : false}
              dragConstraints={containerRef}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                const currentIndex = tabOrder.indexOf(activeTab);

                if (swipe < -swipeConfidenceThreshold) {
                  if (currentIndex < tabOrder.length - 1) handleTabChange(currentIndex + 1);
                } else if (swipe > swipeConfidenceThreshold) {
                  if (currentIndex > 0) handleTabChange(currentIndex - 1);
                }
              }}
            >
            { (isFreeContent || activeTab === 'description') && (
            <div className={`${isFreeContent ? "w-1/3" : "w-full"} shrink-0 bg-white`}>
            <motion.div
              key={!isFreeContent ? "desc-paid" : undefined}
              initial={!isFreeContent ? "hidden" : undefined}
              animate={!isFreeContent ? "visible" : undefined}
              variants={staggerContainer}
            >
              {/* Product Image & Price */}
              <motion.div variants={fadeInUp}>
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full mt-0 pt-0">
                <div className="aspect-[391/270] relative shrink-0 w-full bg-[#f0f0f0]">
                  {content.thumbnail_url ? (
                    <img alt={`${content.title} 썸네일`} className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={content.thumbnail_url} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="font-['Pretendard_Variable:Regular',sans-serif] text-[16px] text-[#999999]">이미지 없음</p>
                    </div>
                  )}
                </div>
                <div className="relative shrink-0 w-full">
                  <div className="flex flex-col items-end size-full">
                    <div className="box-border content-stretch flex flex-col gap-[16px] items-end px-[20px] py-0 relative w-full">
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" style={{ gap: '10px' }}>
                        <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                          <div className="flex items-center justify-between w-full">
                            <ContentTags
                              isPaid={isPaid}
                              isNew={isContentNew(content.created_at)}
                              isRead={isRead}
                            />
                            {content.view_count > 0 && (
                              <div className="flex items-center gap-[3px] shrink-0">
                                <img src="/eye-solid.svg" width="14" height="14" alt="조회수" aria-hidden="true" />
                                <span style={{ fontSize: '12px', fontWeight: 300, color: '#999999', fontFamily: 'Pretendard Variable', letterSpacing: '-0.24px' }}>
                                  {content.view_count.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="relative shrink-0 w-full">
                            <div className="size-full">
                              <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[2px] py-0 relative w-full">
                                <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                                  <p className="relative shrink-0 w-full" style={{ fontSize: '18px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.36px', color: '#000000' }}>{content.title}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* 가격 영역 (새싹 포인트) */}
                        <div className="relative shrink-0 w-full mt-[-8px] mb-[-4px]">
                          <div className="size-full">
                            <div className="box-border content-stretch flex flex-col gap-0 items-start px-[2px] py-0 relative w-full">
                                {/* 할인율 + 정상가격(취소선) + 할인가격 (새싹 포인트) */}
                                <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-full">
                                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                    <div className="flex items-center relative shrink-0">
                                      <div className="flex items-center justify-center relative shrink-0" style={{ width: '14px', height: '14px' }}>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                          <path d="M10.0074 2.60754C9.97776 2.52141 9.92196 2.44669 9.84779 2.3938C9.77363 2.34091 9.6848 2.31249 9.59371 2.3125C7.59488 2.3125 5.99637 2.71391 4.84219 3.50605C3.44766 4.46309 2.6968 5.97273 2.60356 8L0.406212 8C0.320545 8.00001 0.236764 8.02517 0.165264 8.07235C0.0937644 8.11954 0.0376915 8.18668 0.00400163 8.26545C-0.0296882 8.34421 -0.0395124 8.43113 -0.0242523 8.51543C-0.00899221 8.59973 0.0306808 8.67769 0.0898449 8.73965L4.68359 13.5521C4.72444 13.5949 4.77354 13.629 4.82792 13.6522C4.88229 13.6755 4.94082 13.6875 4.99996 13.6875C5.0591 13.6875 5.11763 13.6755 5.17201 13.6522C5.22638 13.629 5.27548 13.5949 5.31633 13.5521L9.91008 8.73965C9.96924 8.67769 10.0089 8.59973 10.0242 8.51543C10.0394 8.43114 10.0296 8.34421 9.99592 8.26545C9.96223 8.18668 9.90616 8.11954 9.83466 8.07235C9.76316 8.02517 9.67938 8.00001 9.59371 8L7.4125 8C7.44969 6.76953 7.64902 5.83984 8.03156 5.09965C8.445 4.29984 9.0627 3.71988 9.86359 3.09481C9.9354 3.03873 9.9879 2.96164 10.0138 2.87428C10.0397 2.78693 10.0376 2.69368 10.008 2.60754L10.0074 2.60754Z" fill="#FF6678"/>
                                        </svg>
                                      </div>
                                      <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: '22px', color: '#ff6678', letterSpacing: '-0.42px' }}>
                                        {content.discount_rate || 0}%할인
                                      </p>
                                    </div>
                                    <p style={{ fontSize: '13px', fontWeight: 400, lineHeight: '19px', color: '#999', letterSpacing: '-0.26px', textDecoration: 'line-through', paddingTop: '1px', paddingLeft: '1px' }}>
                                      {content.price_original?.toLocaleString() || '0'}새싹
                                    </p>
                                  </div>
                                  <p style={{ fontSize: '20px', fontWeight: 700, lineHeight: '28px', color: '#151515', letterSpacing: '-0.2px', paddingTop: '1px' }}>
                                    {content.price_discount?.toLocaleString() || '0'}새싹
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 공유하고 30새싹 받기 버튼 */}
                        {!isFreeContent && (
                          <div
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center justify-center gap-[8px] w-full rounded-[16px] cursor-pointer select-none touch-manipulation"
                            style={{
                              backgroundColor: 'rgba(240, 248, 248, 0.7)',
                              border: '1px solid rgba(126, 212, 210, 0.7)',
                              height: '46px',
                              transition: 'transform 0.12s cubic-bezier(0.25, 0, 0.25, 1)',
                              willChange: 'transform',
                            }}
                            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                            onPointerUp={(e) => { e.currentTarget.style.transform = ''; }}
                            onPointerCancel={(e) => { e.currentTarget.style.transform = ''; }}
                            onPointerLeave={(e) => { e.currentTarget.style.transform = ''; }}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: '1px' }}>
                              <path d="M9.30734 4.96571C10.739 6.74071 11.0632 9.20988 10.1548 11.4099C10.0732 11.6065 9.89734 11.7482 9.68734 11.7865C9.28734 11.859 8.88567 11.894 8.489 11.894C6.56817 11.894 4.754 11.0657 3.56734 9.59404C2.1365 7.81904 1.81234 5.34988 2.71984 3.14904C2.8015 2.95238 2.97734 2.81071 3.18734 2.77238C5.5265 2.34654 7.87567 3.18988 9.30734 4.96571ZM17.6548 7.31571C17.5732 7.11904 17.3973 6.97738 17.1873 6.93904C15.4023 6.62154 13.614 7.25821 12.5198 8.61404C11.4273 9.96821 11.1798 11.8515 11.8723 13.5282C11.954 13.7249 12.1298 13.8665 12.3398 13.9049C12.6448 13.9599 12.9498 13.9874 13.2532 13.9874C14.7173 13.9874 16.1007 13.354 17.0065 12.2315C18.0998 10.8774 18.3473 8.99404 17.6548 7.31654V7.31571Z" fill="#8BD1CF"/>
                              <path d="M14.6279 10.4095C14.3954 10.1562 14.0004 10.1395 13.7445 10.3728C12.542 11.4778 11.5179 12.7287 10.6695 14.0837C10.5645 13.0145 10.2954 11.8195 9.73871 10.577C8.75455 8.38367 7.27704 6.96784 6.21038 6.16617C5.93371 5.957 5.54204 6.0145 5.33538 6.29034C5.12788 6.56617 5.18371 6.95784 5.45954 7.16534C6.40871 7.87784 7.72288 9.13784 8.59788 11.0878C9.57121 13.2578 9.56204 15.272 9.38204 16.5812C9.38121 16.5887 9.38871 16.5945 9.38871 16.6012C9.36121 16.8653 9.49621 17.1278 9.75288 17.2395C9.83454 17.2745 9.91871 17.2912 10.002 17.2912C10.2429 17.2912 10.4729 17.1503 10.5754 16.9153C10.8137 16.3653 11.0829 15.8245 11.3779 15.3095C12.2245 13.827 13.3045 12.4762 14.5912 11.2928C14.8454 11.0595 14.8612 10.6637 14.6279 10.4095Z" fill="#389E9B"/>
                            </svg>
                            <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.3px', color: '#2d2d2d', paddingRight: '4px' }}>
                              공유하고 <span style={{ fontWeight: 700, color: '#48B2AF' }}>30새싹</span> 받기
                            </span>
                          </div>
                        )}

                    </div>
                  </div>
                </div>
              </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div className="bg-[#f9f9f9] h-[4px] w-full mt-[12px] mb-[24px]" />
              </motion.div>

              {/* AI 개인화 구매 가이드 섹션 */}
              {(hasTraitTags && (isPurchaseGuideLoading || purchaseGuide) || import.meta.env.DEV) && (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
                <div className="px-[20px] mb-[28px]">
                  <p style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#1a1a1a', marginBottom: '10px' }}>
                    {primarySajuName ? `${primarySajuName}님을 위한 맞춤 안내` : '맞춤 안내'}
                  </p>
                  <div style={{ borderRadius: '20px', border: '1px solid transparent', background: 'linear-gradient(to right, #F2FEFF, #FAF4FF) padding-box, linear-gradient(to right, rgba(85,202,198,0.8), rgba(120,199,255,0.7), rgba(185,155,220,0.6), rgba(120,199,255,0.7), rgba(85,202,198,0.8)) border-box', padding: '16px 24px' }}>
                    {isPurchaseGuideLoading ? (
                      <div className="flex flex-col gap-[8px]">
                        <div className="h-[18px] rounded-[4px] animate-pulse" style={{ backgroundColor: '#ebebeb', width: '90%' }} />
                        <div className="h-[18px] rounded-[4px] animate-pulse" style={{ backgroundColor: '#ebebeb', width: '80%' }} />
                      </div>
                    ) : (purchaseGuide || import.meta.env.DEV) ? (
                      <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.28px', color: '#2d2d2d', margin: 0, whiteSpace: 'pre-line' }}>
                        {purchaseGuide || '[DEV] 사주 분석 결과, 현재 연인과의 관계에서 중요한 전환점이 예상됩니다. 재회 가능성과 새로운 인연의 시기를 상세히 풀어드립니다.'}
                      </p>
                    ) : null}
                  </div>
                </div>
                </motion.div>
              )}

              {(hasTraitTags && (isPurchaseGuideLoading || purchaseGuide) || import.meta.env.DEV) && (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
                <div className="bg-[#f9f9f9] h-[4px] w-full mt-[12px] mb-[24px]" />
                </motion.div>
              )}

              {/* 무료/유료 비교 안내 섹션 */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div className="px-[20px] mb-[4px]">
                <p style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#1a1a1a', marginBottom: '10px', paddingLeft: 2 }}>
                  왜 심화 운세일까요?
                </p>
                <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
                  {/* 무료 운세 카드 */}
                  <div className="flex-1 min-w-0 relative" style={{ borderRadius: 20, border: '1px solid #f3f3f3', overflow: 'hidden' }}>
                    <div className="flex flex-col items-start" style={{ padding: '22px 20px 25px' }}>
                      <span style={{ fontWeight: 600, fontSize: 17, color: '#525252', letterSpacing: '-0.34px', lineHeight: '24px' }}>무료 운세</span>
                      <div style={{ height: 26 }} />
                      <span style={{ fontWeight: 500, fontSize: 14, color: '#525252', letterSpacing: '-0.42px', lineHeight: '22px' }}>1문단 요약</span>
                    </div>
                    <div style={{ width: '100%', height: 0, borderTop: '1px dashed #f3f3f3' }} />
                    <div className="flex items-center justify-between" style={{ padding: '12px 20px' }}>
                      <span style={{ fontWeight: 400, fontSize: 14, color: '#525252', letterSpacing: '-0.42px', lineHeight: '22px' }}>성향 분석</span>
                      <img src="/icon-brain.svg" alt="brain" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    </div>
                    <div style={{ width: '100%', height: 0, borderTop: '1px dashed #f3f3f3' }} />
                    <div className="flex items-center justify-between" style={{ padding: '12px 20px' }}>
                      <span style={{ fontWeight: 400, fontSize: 14, color: '#525252', letterSpacing: '-0.42px', lineHeight: '22px' }}>에너지 흐름</span>
                      <img src="/icon-thunder.svg" alt="thunder" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    </div>
                  </div>
                  {/* 심화 운세 카드 */}
                  <div className="flex-1 min-w-0" style={{ borderRadius: 20, border: '2px solid transparent', background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #8EDEDD 0%, #9ACFFF 25%, #C8B8EE 55%, #9ACFFF 80%, #8EDEDD 100%) border-box', boxShadow: '0px 2px 7px 0px rgba(0,0,0,0.12)', position: 'relative' }}>
                    {/* 내용 클리핑용 내부 div */}
                    <div style={{ borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
                      {/* 추천 배지 */}
                      <div style={{ position: 'absolute', top: -1, right: 0, background: 'linear-gradient(105.09deg, #5ACBC8 0%, #57B9FF 58.98%, #F9AFE9 144.83%)', borderBottomLeftRadius: 14, padding: '0px 12px 2px', zIndex: 2 }}>
                        <span style={{ fontWeight: 500, fontSize: 12, color: '#fff', lineHeight: '19.5px', letterSpacing: '0.5px' }}>추천</span>
                      </div>
                      <div className="flex flex-col items-start w-full" style={{ padding: '22px 20px 24px' }}>
                        <span style={{ fontWeight: 700, fontSize: 17, color: '#000', letterSpacing: '-0.34px', lineHeight: '24px' }}>심화 운세</span>
                        <div style={{ height: 26 }} />
                        <span style={{ fontWeight: 400, fontSize: 14, color: '#000', letterSpacing: '-0.42px', lineHeight: '22px' }}>
                          <span style={{ fontWeight: 600 }}>4문단 요약 </span>
                          <span>+ </span>
                          <span style={{ fontWeight: 600 }}>심층 분석</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 0, borderTop: '1px dashed #f3f3f3' }} />
                      <div className="flex items-center justify-between" style={{ backgroundColor: '#fff', padding: '12px 20px' }}>
                        <span style={{ fontWeight: 400, fontSize: 14, color: '#000', letterSpacing: '-0.42px', lineHeight: '22px' }}>성향 분석</span>
                        <img src="/icon-brain.svg" alt="brain" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                      </div>
                      <div style={{ width: '100%', height: 0, borderTop: '1px dashed #f3f3f3' }} />
                      <div className="flex items-center justify-between" style={{ backgroundColor: '#fff', padding: '12px 20px' }}>
                        <span style={{ fontWeight: 400, fontSize: 14, color: '#000', letterSpacing: '-0.42px', lineHeight: '22px' }}>에너지 흐름</span>
                        <img src="/icon-thunder.svg" alt="thunder" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                      </div>
                      <div style={{ width: '100%', height: 0, borderTop: '1px dashed #f3f3f3' }} />
                      <div className="flex items-center justify-between" style={{ backgroundColor: '#fff', padding: '12px 20px' }}>
                        <span style={{ fontWeight: 400, fontSize: 14, color: '#000', letterSpacing: '-0.42px', lineHeight: '22px' }}>구체적 시기</span>
                        <img src="/icon-calendar.svg" alt="calendar" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      </div>
                      <div style={{ width: '100%', height: 0, borderTop: '1px dashed #f3f3f3' }} />
                      <div className="flex items-center justify-between" style={{ backgroundColor: '#fff', padding: '12px 20px' }}>
                        <span style={{ fontWeight: 400, fontSize: 14, color: '#000', letterSpacing: '-0.42px', lineHeight: '22px' }}>맞춤 조언</span>
                        <img src="/icon-compass.svg" alt="compass" style={{ width: 21, height: 21, objectFit: 'contain', marginRight: '-1.5px' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-[14px] items-start mt-[16px] rounded-[16px]" style={{ backgroundColor: '#fbfbfb', padding: '18px 18px' }}>
                  <img src="/icon-arrow-right-gradient.svg" alt="arrow" style={{ width: '23px', height: '23px', flexShrink: 0, marginTop: '0px' }} />
                  <p style={{ fontSize: '15px', fontWeight: 400, lineHeight: '26.5px', letterSpacing: '-0.3px', color: '#444', margin: 0 }}>
                    무료 운세보다 더 깊이 있는 분석을 제공합니다.<br />지금의 흐름과 앞으로의 시기까지 종합적으로 해석해 드려요.
                  </p>
                </div>
              </div>
              </motion.div>

              {/* Description Section */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[20px] py-0 relative shrink-0 w-full mb-[28px]">
                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                  <AnimatePresence>
                    {!isDescriptionExpanded && (
                      <motion.div
                        initial={{ height: 48, opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: -12 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden w-full"
                        style={{ marginTop: 16 }}
                      >
                        <div
                          onClick={() => setIsDescriptionExpanded(true)}
                          className="bg-white box-border content-stretch flex gap-[10px] h-[48px] items-center justify-center px-[12px] py-0 relative rounded-[16px] shrink-0 w-full border border-[#e7e7e7] cursor-pointer select-none touch-manipulation"
                          style={{
                            transition: 'transform 0.12s cubic-bezier(0.25, 0, 0.25, 1)',
                            willChange: 'transform',
                          }}
                          onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                          onPointerUp={(e) => { e.currentTarget.style.transform = ''; }}
                          onPointerCancel={(e) => { e.currentTarget.style.transform = ''; }}
                          onPointerLeave={(e) => { e.currentTarget.style.transform = ''; }}
                        >
                          <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '20px', color: '#525252', letterSpacing: '-0.45px', whiteSpace: 'nowrap' }}>
                            자세히 보기
                          </p>
                          <ChevronDown className="w-4 h-4 text-[#525252]" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              </motion.div>

              {/* Core Features Section (AnimatePresence) */}
              <AnimatePresence>
                {isDescriptionExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden w-full"
                  >
                    {/* 운세 설명 (자세히보기 내부) */}
                    <div className="bg-[#f9f9f9] w-full" style={{ height: 4 }} />
                    <div className="px-[20px] pb-[28px]" style={{ paddingTop: 24 }}>
                      <p style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#1a1a1a', marginBottom: '8px' }}>
                        운세 설명
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: 400, lineHeight: '26.5px', letterSpacing: '-0.3px', color: '#151515', margin: 0 }}>
                        {content.description || '운세 설명이 준비 중입니다.'}
                      </p>
                    </div>

                    <div className="bg-[#f7f8f9] box-border content-stretch flex flex-col gap-[10px] items-start pb-[28px] pt-[28px] px-[20px] relative shrink-0 w-full mb-[36px]">
                    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 grow min-h-px min-w-px relative shrink-0" style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#1a1a1a' }}>핵심만 콕 집어드려요</p>
                        </div>
                      </div>
                      
                      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                        <div className="basis-0 bg-white grow h-full min-h-px min-w-px relative rounded-[12px] shrink-0">
                          <div className="flex flex-col items-center size-full">
                            <div className="box-border content-stretch flex flex-col gap-[12px] items-center px-[12px] py-[16px] relative size-full">
                              <div className="relative shrink-0 size-[24px]">
                                <div className="absolute inset-[10.44%_7.14%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21 19">
                                    <path d={svgPathsDetail.p3d4a2500} fill="#8BE1DF" />
                                    <path d={svgPathsDetail.p32b65700} fill="#48B2AF" />
                                  </svg>
                                </div>
                              </div>
                              <p className="min-w-full relative shrink-0 text-center w-[min-content]" style={{ fontSize: '12px', fontWeight: 500, lineHeight: '19.5px', letterSpacing: 0, color: '#525252' }}>나의 본성</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="basis-0 bg-white grow h-full min-h-px min-w-px relative rounded-[12px] shrink-0">
                          <div className="flex flex-col items-center size-full">
                            <div className="box-border content-stretch flex flex-col gap-[12px] items-center px-[12px] py-[16px] relative size-full">
                              <div className="relative shrink-0 size-[24px]">
                                <div className="absolute inset-[15.23%_1.22%_25.82%_1.19%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 15">
                                    <path d={svgPathsDetail.p8bd0d80} fill="#48B2AF" />
                                  </svg>
                                </div>
                                <div className="absolute inset-[62.68%_1.17%_4.3%_1.11%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 8">
                                    <path d={svgPathsDetail.p27b97600} fill="#8BE1DF" />
                                  </svg>
                                </div>
                              </div>
                              <p className="min-w-full relative shrink-0 text-center w-[min-content]" style={{ fontSize: '12px', fontWeight: 500, lineHeight: '19.5px', letterSpacing: 0, color: '#525252' }}>주의할 점</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="basis-0 bg-white grow h-full min-h-px min-w-px relative rounded-[12px] shrink-0">
                          <div className="flex flex-col items-center size-full">
                            <div className="box-border content-stretch flex flex-col gap-[12px] items-center px-[12px] py-[16px] relative size-full">
                              <img src="/icon-person.svg" alt="미래 방향" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                              <p className="min-w-full relative shrink-0 text-center w-[min-content]" style={{ fontSize: '12px', fontWeight: 500, lineHeight: '19.5px', letterSpacing: 0, color: '#525252' }}>미래 방향</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Worry Card Section - 작은 고민도 바로 풀어드립니다 */}
                  <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full mb-[4px]" style={{ paddingBottom: 26, marginLeft: 20, marginRight: 20, width: 'calc(100% - 40px)' }}>
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                        <p className="basis-0 grow min-h-px min-w-px relative shrink-0" style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#1a1a1a' }}>작은 고민도 바로 풀어드립니다</p>
                      </div>
                    </div>

                    <div className="relative rounded-[16px] shrink-0 w-full" style={{ backgroundColor: '#f7f8f9' }}>
                      <div className="flex flex-col items-center justify-center size-full">
                        <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center p-[20px] relative w-full">
                          <div className="content-stretch flex gap-[16px] items-end relative shrink-0 w-full">
                            <div className="basis-0 box-border content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px pb-[8px] pt-0 px-0 relative shrink-0">
                              <div className="content-stretch flex flex-col gap-[10px] items-start relative rounded-[12px] shrink-0 w-full">
                                <div className="bg-white relative shrink-0 w-full" style={{ borderRadius: '14px 14px 14px 4px' }}>
                                  <div className="flex flex-row items-center justify-center size-full">
                                    <div className="box-border content-stretch flex gap-[10px] items-center justify-center py-[10px] relative w-full" style={{ paddingLeft: 16, paddingRight: 16 }}>
                                      <p className="basis-0 grow min-h-px min-w-px relative shrink-0" style={{ fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.42px', color: '#151515' }}>
                                        {questions.length > 0 ? questions[0].question_text : '운세에 대한 궁금한 점을 풀어드려요'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="relative shrink-0 w-full">
                                <div className="size-full">
                                  <div className="box-border content-stretch flex flex-col gap-[10px] items-end pl-[12px] pr-0 py-0 relative w-full">
                                    <div className="bg-white relative shrink-0 inline-flex" style={{ borderRadius: '14px 14px 4px 14px' }}>
                                      <div className="flex flex-row items-center justify-center">
                                        <div className="box-border flex gap-[10px] items-center justify-center py-[10px]" style={{ paddingLeft: 16, paddingRight: 16 }}>
                                          <p className="not-italic relative shrink-0 whitespace-nowrap" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '22px', letterSpacing: '-0.42px', color: '#41a09e' }}>타로와 사주로 명쾌하게 풀어 줄게요!</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="h-[65px] relative shrink-0 w-[50px]">
                              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <img alt="나다운세 캐릭터" className="absolute h-[123.53%] left-[-13.78%] max-w-none top-[-11.76%] w-[125.64%]" src={characterImg} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fortune Composition List - 운세 구성 */}
                  <div className="bg-[#f9f9f9] w-full" style={{ height: 4 }} />
                  <div className="bg-white box-border content-stretch flex flex-col gap-[12px] items-start px-[20px] relative shrink-0 w-full mb-[24px]" style={{ paddingTop: 23, paddingBottom: 0 }}>
                    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 grow min-h-px min-w-px relative shrink-0" style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#1a1a1a' }}>운세 구성</p>
                        </div>
                      </div>

                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
                        {questions.map((question, idx) => (
                          <div key={question.id} className="w-full">
                            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
                                  <span className="shrink-0" style={{ fontSize: '15px', fontWeight: 400, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#999999' }}>·</span>
                                  <p className="basis-0 grow min-h-px min-w-px not-italic relative shrink-0" style={{ fontSize: '15px', fontWeight: 400, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#151515' }}>{question.question_text}</p>
                                </div>
                              </div>
                            </div>
                            {idx < questions.length - 1 && (
                              <div className="h-0 relative shrink-0 w-full my-[8px]">
                                <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                                    <path d="M0 0.5H350" stroke="#F3F3F3" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f9f9f9] w-full mb-[24px]" style={{ height: 4 }} />
                  </motion.div>
                )}
              </AnimatePresence>

              {!isDescriptionExpanded && (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
                  <div className="bg-[#f9f9f9] h-[4px] w-full mb-[44px]" />
                </motion.div>
              )}

              {/* Usage Guide & Refund Policy */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div ref={usageGuideRef} className="content-stretch flex flex-col gap-[8px] items-start px-[20px] relative shrink-0 w-full mb-[50px]">
                <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                      <p className="basis-0 grow min-h-px min-w-px relative shrink-0" style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#1a1a1a' }}>이용안내 & 환불 규정</p>
                    </div>
                  </div>
                </div>

                <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                  {/* 이용 안내 */}
                  <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[12px] shrink-0 w-full">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsUsageGuideExpanded(!isUsageGuideExpanded);
                      }}
                      className="box-border content-stretch flex gap-[12px] items-center px-0 py-[10px] relative rounded-[12px] shrink-0 w-full border-none bg-transparent cursor-pointer"
                    >
                      <p className="basis-0 grow min-h-px min-w-px not-italic relative shrink-0 text-left" style={{ fontSize: '15px', fontWeight: 400, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#151515' }}>이용 안내</p>
                      {isUsageGuideExpanded ? <ChevronUp className="w-4 h-4 text-[#B7B7B7]" /> : <ChevronDown className="w-4 h-4 text-[#B7B7B7]" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {isUsageGuideExpanded && (
                        <motion.div
                          layout={false}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden w-full"
                        >
                          <div className="bg-[#f7f8f9] relative shrink-0 w-full" style={{ borderRadius: 20 }}>
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center py-[20px] relative w-full" style={{ paddingLeft: 24, paddingRight: 24 }}>
                                <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0">
                                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                    <p className="relative shrink-0 w-full" style={{ fontSize: '15px', fontWeight: 500, lineHeight: '23.5px', letterSpacing: '-0.3px', color: '#151515' }}>서비스 이용 전 확인해주세요</p>
                                  </div>
                                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" style={{ fontSize: '14px', fontWeight: 400, color: '#737373', letterSpacing: '-0.28px' }}>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span className="block w-full whitespace-normal break-words" style={{ lineHeight: '22px' }}>
                                          AI가 매번 가장 잘 맞는 해석을 만들어 드려요. 같은 사주라도 표현이 조금씩 달라질 수 있어요.
                                        </span>
                                      </li>
                                    </ul>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span style={{ lineHeight: '22px' }}>걱정 마세요. 핵심 기질과 운명의 큰 흐름은 항상 같게 분석돼요. 표현의 작은 차이는 내 운명을 더 다양한 시각으로 이해하는 과정이에요.</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 환불 정책 */}
                  <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[12px] shrink-0 w-full">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsRefundPolicyExpanded(!isRefundPolicyExpanded);
                      }}
                      className="box-border content-stretch flex gap-[12px] items-center px-0 py-[10px] relative rounded-[12px] shrink-0 w-full border-none bg-transparent cursor-pointer"
                    >
                      <p className="basis-0 grow min-h-px min-w-px not-italic relative shrink-0 text-left" style={{ fontSize: '15px', fontWeight: 400, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#151515' }}>환불 정책</p>
                      {isRefundPolicyExpanded ? <ChevronUp className="w-4 h-4 text-[#B7B7B7]" /> : <ChevronDown className="w-4 h-4 text-[#B7B7B7]" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {isRefundPolicyExpanded && (
                        <motion.div
                          layout={false}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden w-full"
                        >
                          <div className="bg-[#f7f8f9] relative shrink-0 w-full" style={{ borderRadius: 20 }}>
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center py-[20px] relative w-full" style={{ paddingLeft: 24, paddingRight: 24 }}>
                                <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0">
                                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                    <p className="relative shrink-0 w-full" style={{ fontSize: '15px', fontWeight: 500, lineHeight: '23.5px', letterSpacing: '-0.3px', color: '#151515' }}>환불 정책 안내</p>
                                  </div>
                                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" style={{ fontSize: '14px', fontWeight: 400, color: '#737373', letterSpacing: '-0.28px' }}>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span style={{ lineHeight: '22px' }}>풀이를 열면 새싹이 차감돼요. 한번 연 풀이는 새싹을 돌려드리기 어려워요.</span>
                                      </li>
                                    </ul>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span style={{ lineHeight: '22px' }}>충전한 새싹은 7일 안에 쓰지 않았다면 전액 환불받을 수 있어요. 7일이 지나면 수수료 10%를 제외하고 돌려드려요.</span>
                                      </li>
                                    </ul>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span style={{ lineHeight: '22px' }}>무료로 받은 새싹은 환불 대상이 아니에요.</span>
                                      </li>
                                    </ul>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span style={{ lineHeight: '22px' }}>환불이 필요하면 stargiosoft2@gmail.com으로 알려주세요.</span>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              </motion.div>

              {/* ⚠️ [개발 전용] 풀이 플로우 확인 버튼 - 배포 시 삭제 */}
              {IS_DEV_MODE && (
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
                  className="px-[20px] mb-[32px]"
                >
                  <div className="rounded-[20px]" style={{ backgroundColor: '#f5f5f5', padding: '12px 20px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 500, color: '#bbb', marginBottom: '6px', textAlign: 'left' }}>
                      DEV
                    </p>
                    <div className="flex gap-[5px]">
                      <motion.button
                        onClick={() => {
                          const devOrderId = `dev_order_${Date.now()}`;
                          console.log('🔧 [개발용] 풀이 플로우 확인하기:', { orderId: devOrderId, contentId: contentId });
                          navigate(`/product/${contentId}/payment/new`);
                        }}
                        whileTap={{ scale: 0.96 }}
                        style={{ flex: 1, backgroundColor: '#e2e2e2', color: '#888', fontSize: '10px', fontWeight: 400, height: '26px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        전체 플로우
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          const devOrderId = `dev_shuffle_${Date.now()}`;
                          console.log('🔧 [개발용] 타로 셔플 화면 이동');
                          navigate(`/tarot/shuffle?orderId=${devOrderId}&questionOrder=1&contentId=${contentId}&from=dev`);
                        }}
                        whileTap={{ scale: 0.96 }}
                        style={{ flex: 1, backgroundColor: '#e2e2e2', color: '#888', fontSize: '10px', fontWeight: 400, height: '26px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        셔플/선택
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          const devOrderId = `dev_result_${Date.now()}`;
                          console.log('🔧 [개발용] 타로 결과 화면 이동');
                          navigate(`/result/tarot?orderId=${devOrderId}&questionOrder=1&contentId=${contentId}&from=dev`);
                        }}
                        whileTap={{ scale: 0.96 }}
                        style={{ flex: 1, backgroundColor: '#e2e2e2', color: '#888', fontSize: '10px', fontWeight: 400, height: '26px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        결과 화면
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            </div>
            )}

            { (isFreeContent || activeTab === 'principle') && (
            <div className={`${isFreeContent ? "w-1/3" : "w-full"} shrink-0 bg-white`}>
            <motion.div 
              className="content-stretch flex flex-col gap-[10px] items-start w-full"
              initial={!isFreeContent ? "hidden" : undefined}
              animate={!isFreeContent ? "visible" : undefined}
              variants={staggerContainer}
            >
              {/* 우리 운세는 왜 다를까요 */}
              <motion.div 
                className="relative shrink-0 w-full"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
              >
                <div className="flex flex-col items-center justify-center size-full">
                  <div className="box-border content-stretch flex flex-col gap-[24px] items-center justify-center pb-[0px] pt-[50px] px-[20px] relative w-full pr-[20px] pl-[20px] mb-[36px]">
                    <div className="content-stretch flex flex-col gap-[4px] h-[298px] items-start justify-center relative shrink-0 w-[310px]">
                      <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                        <div className="content-stretch flex flex-col gap-[30px] items-center justify-center relative shrink-0 w-full">
                          <div className="h-[152px] relative shrink-0 w-[146px]">
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <img alt="오리 캐릭터" className="absolute h-[125.71%] left-[-1.09%] max-w-none top-[-17.49%] w-[102.17%]" src={imgGeminiGeneratedImageEj66M7Ej66M7Ej661} loading="eager" />
                            </div>
                          </div>
                          <p className="font-bold leading-[24px] min-w-full not-italic relative shrink-0 text-[19px] text-black text-center tracking-[-0.36px] w-[min-content]">우리 운세는 왜 다를까요?</p>
                        </div>
                        <div className="content-stretch flex flex-col gap-[2px] items-start relative shrink-0 w-full">
                          <p className="font-semibold leading-[28.5px] not-italic relative shrink-0 text-[#41a09e] text-[16px] text-center text-nowrap tracking-[-0.32px] whitespace-pre">시중의 수많은 운세, 왜 조금씩 다를까 궁금하셨죠?</p>
                          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                              <div className="font-medium leading-[28.5px] not-italic relative shrink-0 text-[#151515] text-[16px] text-center tracking-[-0.32px] w-full">
                                <p className="mb-0">{`저희는 '평균적인' 해석이 아닌 당신만을 위한`}</p>
                                <p>가장 정확한 답을 찾아드립니다.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" />
                </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
                <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" />
              </motion.div>

              {/* 믿을 수 있는 이유 3가지 */}
              <motion.div 
                className="content-stretch flex flex-col gap-[32px] items-start relative shrink-0 w-full px-[20px]"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
              >
                <div className="relative shrink-0 w-full">
                  <div className="flex flex-col items-center size-full">
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                        <p className="basis-0 font-bold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[18px] text-black tracking-[-0.36px]">믿을 수 있는 이유 3가지</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
                  {/* 01 정통 명리 해석 */}
                  <div className="relative shrink-0 w-full">
                    <div className="size-full">
                      <div className="content-stretch flex flex-col gap-[12px] items-start relative w-full">
                        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                          <div className="bg-[#f0f8f8] box-border content-stretch flex gap-[10px] items-center justify-center px-[6px] py-px relative rounded-[8px] shrink-0">
                            <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#41a09e] text-[13px] text-nowrap whitespace-pre">01</p>
                          </div>
                          <div className="relative shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                                <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                                  <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[17px] tracking-[-0.34px]">정통 명리 해석</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                          <div className="relative shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                                <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[0px] text-[16px] tracking-[-0.32px]">
                                  <span>{`명리학은 태어난 순간의 '팔자(八字)'를 수(數)와 오행(五行)으로 해석하는 학문입니다. 저희는 명리학의 대표적인 3대 고전, 『자평진전』·『적천수』·『궁통보감』에 기반한 정통 추론 방식을 현대 프로그램에 맞게 재해석했습니다. `}</span>
                                  <span className="font-semibold">복잡한 계산을 거치지만, 그만큼 깊이 있고 정통성 있는 분석을 제공해드립니다.</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f3f3f3] h-px shrink-0 w-full" />

                  {/* 02 AI 데��터 분석 */}
                  <div className="relative shrink-0 w-full">
                    <div className="size-full">
                      <div className="content-stretch flex flex-col gap-[12px] items-start relative w-full">
                        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                          <div className="bg-[#f0f8f8] box-border content-stretch flex gap-[10px] items-center justify-center px-[6px] py-px relative rounded-[8px] shrink-0">
                            <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#41a09e] text-[13px] text-nowrap whitespace-pre">02</p>
                          </div>
                          <div className="relative shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                                <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                                  <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[17px] tracking-[-0.34px]">AI 데이터 분석</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                          <div className="relative shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                                <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[0px] text-[16px] tracking-[-0.32px]">
                                  <span>
                                    사주의 핵심은 바로 용신(用神) 해석입니다.
                                    <br aria-hidden="true" />
                                    {`저희는 억부, 전왕, 통관, 병약, 조후 등 다양한 용신법을 명리학자의 검증을 거친 자체 개발 AI로 분석합니다. `}
                                  </span>
                                  <span className="font-semibold">사람마다 달라질 수 있는 주관적 해석 대신, 가장 객관적이고 균형 잡힌 답을 제시합니다.</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f3f3f3] h-px shrink-0 w-full" />

                  {/* 03 10만+ 사례 검증 */}
                  <div className="relative shrink-0 w-full">
                    <div className="size-full">
                      <div className="content-stretch flex flex-col gap-[12px] items-start relative w-full">
                        <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                          <div className="bg-[#f0f8f8] box-border content-stretch flex gap-[10px] items-center justify-center px-[6px] py-px relative rounded-[8px] shrink-0">
                            <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#41a09e] text-[13px] text-nowrap whitespace-pre">03</p>
                          </div>
                          <div className="relative shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                                <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                                  <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[17px] tracking-[-0.34px]">10만+ 사례 검증</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                          <div className="relative shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                                <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[0px] text-[16px] tracking-[-0.32px]">
                                  <span>{`세종대왕부터 현대의 유명 인물까지, 전 세계 인물들의 사주를 분석해왔습니다. 총 경력 200년! 11분의 전문가와 함께 10만 건 이상의 실제 사례를 바탕으로 AI와 함께 완성도를 높였습니다. `}</span>
                                  <span className="font-semibold">단순한 이론이 아니라, 실제 검증된 데이터를 기반으로 신뢰할 수 있는 해석을 제공합니다.</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            </div>
            )}

            { (isFreeContent || activeTab === 'preview') && (
            <div className={`${isFreeContent ? "w-1/3" : "w-full"} shrink-0 bg-white`}>
            <motion.div 
              className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-full"
              initial={!isFreeContent ? "hidden" : undefined}
              animate={!isFreeContent ? "visible" : undefined}
              variants={staggerContainer}
            >
              {/* Header */}
              <motion.div 
                className="content-stretch flex flex-col items-center relative shrink-0 w-full"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
              >
                <div className="relative shrink-0 w-full">
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="content-stretch flex items-center justify-center pb-[20px] pt-[28px] px-[20px] relative w-full">
                      <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] grow leading-[25.5px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black text-center tracking-[-0.34px]">아래는 일부 예시 해석입니다</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" />
              </motion.div>

              {/* Preview Cards - 최대 3개만 표시 */}
              <motion.div 
                className="content-stretch flex flex-col gap-[28px] items-center relative shrink-0 w-full px-[20px]"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
              >
                {questions.slice(0, 3).map((question, index) => (
                  <div key={question.id} className="w-full">
                    <div className="content-stretch flex flex-col gap-[36px] items-center relative shrink-0 w-full">
                      <div className="h-[293px] relative shrink-0 w-full overflow-hidden">
                        <div className="absolute content-stretch flex flex-col inset-0 items-start">
                          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                              <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                                <p className="basis-0 font-semibold grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[17px] tracking-[-0.32px]">
                                  {String(index + 1).padStart(2, '0')}. {question.question_text}
                                </p>
                              </div>
                            </div>
                            <div className="bg-[#f9f9f9] h-[252px] relative rounded-[16px] shrink-0 w-full overflow-hidden transform-gpu">
                              <div className="size-full">
                                <div className="content-stretch flex h-[252px] items-start px-[20px] py-[16px] relative w-full overflow-hidden">
                                  <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                      <p className="font-semibold leading-[23.5px] not-italic relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px] w-full">[맛보기]</p>
                                    </div>
                                    <div className="content-stretch flex flex-col items-start relative w-full overflow-hidden flex-1">
                                      <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[23.5px] not-italic text-[15px] text-neutral-600 tracking-[-0.3px] w-full overflow-hidden">
                                        {question.preview_text || '미리보기 답변이 생성 중입니다...'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute bg-[#f9f9f9] bottom-0 content-stretch flex flex-col items-center justify-center left-0 p-[16px] pt-[16px] right-0 rounded-b-[16px] w-full z-10 transform-gpu" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                          <div className="absolute left-0 right-0 -top-[56px] h-[56px] bg-gradient-to-b from-transparent to-[#f9f9f9] pointer-events-none" />
                          <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[1px_0px_0px] border-solid inset-0 pointer-events-none rounded-b-[16px] shadow-[0px_-26px_26px_0px_#f9f9f9]" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }} />
                          <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                            <div className="relative shrink-0 size-[16px]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <g id="Icons">
                                  <path d={svgPathsPreview.p21158a00} fill="#A0D2D1" id="Vector" />
                                  <path d={svgPathsPreview.p1662d200} fill="#48B2AF" id="Vector_2" />
                                  <path d={svgPathsPreview.p1c098700} fill="#8BD4D2" id="Vector_3" />
                                </g>
                              </svg>
                            </div>
                            <div className="content-stretch flex flex-col items-center justify-center relative shrink-0">
                              <div className="content-stretch flex items-center justify-center pb-0 pt-[3px] px-0 relative shrink-0">
                                <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#41a09e] text-[14px] text-nowrap tracking-[-0.42px] whitespace-pre pt-[2px]">여기까지만 공개돼요</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < Math.min(questions.length, 3) - 1 && (
                        <div className="h-0 relative shrink-0 w-full">
                          <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 390 1">
                              <path d="M0 0.5H390" stroke="#F3F3F3" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* List of remaining items (4개 이상일 경우) */}
              {questions.length > 3 && (
                <motion.div 
                  className="bg-white box-border content-stretch flex flex-col gap-[12px] items-center justify-center px-[20px] py-0 pt-[8px] relative shrink-0 w-full"
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
                >
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col gap-0 items-start relative shrink-0 w-full">
                      {questions.slice(3).map((question, index) => (
                        <div key={question.id} className="w-full">
                          <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                            <div className="relative shrink-0 size-[16px] box-content pt-[7px]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <g id="Icons">
                                  <path d={svgPathsPreview.p21158a00} fill="#A0D2D1" id="Vector" />
                                  <path d={svgPathsPreview.p1662d200} fill="#48B2AF" id="Vector_2" />
                                  <path d={svgPathsPreview.p1c098700} fill="#8BD4D2" id="Vector_3" />
                                </g>
                              </svg>
                            </div>
                            <div className="basis-0 content-stretch flex grow items-start min-h-px min-w-px pb-0 pt-[3px] px-0 relative shrink-0">
                              <p className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                                {String(index + 4).padStart(2, '0')}. {question.question_text}
                              </p>
                            </div>
                          </div>
                          {index < questions.slice(3).length - 1 && (
                            <div className="w-full h-[1px] bg-[#F3F3F3] my-[8px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
                <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" />
              </motion.div>

              {/* Bottom CTA */}
              <motion.div 
                className="px-[20px] w-full mt-[-32px]"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
              >
                <motion.div 
                  className="box-border content-stretch flex gap-[10px] items-center justify-center px-[16px] py-[14px] relative rounded-[12px] shrink-0 w-full"
                  style={{ 
                    background: "linear-gradient(90deg, #F2FAFA 0%, #e0fcfc 25%, #F2FAFA 50%, #e0fcfc 75%, #F2FAFA 100%)",
                    backgroundSize: "200% 100%"
                  }}
                  animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[12px] pointer-events-none"
                    style={{
                      padding: "1px",
                      background: "linear-gradient(90deg, #7fcfc6, #b6ece6, #7fcfc6)",
                      backgroundSize: "200% 100%",
                      WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                    animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] leading-[23.5px] not-italic relative shrink-0 text-[rgb(54,144,143)] text-[15px] text-center tracking-[-0.3px] w-full">더 깊은 풀이는 구매 후 확인할 수 있습니다</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
            </div>
            )}
            </motion.div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="shrink-0 z-50 bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] relative pointer-events-auto">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[20px] py-[12px] relative w-full">
                  <motion.div
                    role="button"
                    tabIndex={0}
                    aria-label="구매하기"
                    onTouchStart={() => console.log('📱 [MasterContentDetailPage] 구매버튼 onTouchStart', { timestamp: new Date().toISOString() })}
                    onTouchEnd={(e) => {
                      console.log('📱 [MasterContentDetailPage] 구매버튼 onTouchEnd', { timestamp: new Date().toISOString() });
                      e.preventDefault(); // ⭐ iOS 더블탭 방지
                      onPurchase();
                    }}
                    onClick={(e) => {
                      console.log('🖱️ [MasterContentDetailPage] 구매버튼 onClick 이벤트 발생', { timestamp: new Date().toISOString() });
                      e.preventDefault(); // ⭐ iOS 더블탭 방지
                      onPurchase();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPurchase();
                      }
                    }}
                    className="bg-[#48b2af] h-[56px] relative shrink-0 w-full cursor-pointer overflow-hidden touch-manipulation pointer-events-auto select-none [-webkit-touch-callout:none] active:bg-[#36908f]" style={{ borderRadius: 20 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="box-border content-stretch flex gap-[10px] h-[56px] items-center justify-center px-[12px] py-0 relative w-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-medium leading-[25px] not-italic relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px] whitespace-pre select-none [-webkit-touch-callout:none]">지금 풀이 확인하기</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>


        </div>
      </div>
      {/* 공유 리워드 바텀시트 */}
      <ShareRewardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        contentId={contentId}
      />
    </>
  );
}
