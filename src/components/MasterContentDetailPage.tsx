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
import { supabase, saveOrder } from '../lib/supabase';
import { getThumbnailUrl } from '../lib/image';
import { getABPrice, getABGroup } from '../lib/abTestService';
import FreeContentDetail from './FreeContentDetail';
import PaidContentDetailSkeleton from './skeletons/PaidContentDetailSkeleton';
import { trackViewItem, trackPurchaseClick, trackPageView } from '../utils/analytics';
import SEO from './SEO';
import { ContentTags, isContentNew } from './ContentTags';

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

interface UserCoupon {
  id: string;
  is_used: boolean;
  coupons: {
    name: string;
    discount_amount: number;
    coupon_type: string;
  };
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
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isUsageGuideExpanded, setIsUsageGuideExpanded] = useState(false);
  const [isRefundPolicyExpanded, setIsRefundPolicyExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ⭐ 초기값 false (무료 콘텐츠는 스켈레톤 사용)
  // ⭐ 초기값을 localStorage에서 직접 읽어서 설정 (첫 렌더링부터 올바른 로그인 상태 반영 → 가격 영역 깜빡임 방지)
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('user'));
  const [isFreeContent, setIsFreeContent] = useState<boolean | null>(null); // ⭐ 무료 콘텐츠 여부 (초기 판별용)
  const [welcomeCouponDiscount, setWelcomeCouponDiscount] = useState<number | null>(null); // ⭐ 로그아웃 유저용 welcome 쿠폰 할인 금액
  const [isCouponLoaded, setIsCouponLoaded] = useState(false); // ⭐ 로그아웃 시 쿠폰 로딩 완료 여부

  const [hasExistingAnswers, setHasExistingAnswers] = useState(false); // ⭐ 이미 생성된 답변 존재 여부
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false); // ⭐ 초기값 false
  const [isRead, setIsRead] = useState(false); // ⭐ 읽기 기록 여부

  // ⭐ AI 개인화 구매 가이드
  const [purchaseGuide, setPurchaseGuide] = useState<string | null>(null);
  const [isPurchaseGuideLoading, setIsPurchaseGuideLoading] = useState(false);

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
        .eq('pstatus', 'completed')
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
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto.scrollbar-hide');
    if (scrollContainer) scrollContainer.scrollTop = 0;
  };









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
          final_price_with_welcome_coupon: (optimizedContent.price_discount || 0) - 5000,
          isLoggedIn: !!userJsonParam
        });

        // 🎫 로그인/로그아웃에 따른 쿠폰 조회 (병렬화)
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

            // 🚀 쿠폰 + 주문 동시 조회 (Promise.all)
            const [couponsResult, ordersResult] = await Promise.all([
              supabase
                .from('user_coupons')
                .select(`
                  id,
                  is_used,
                  expired_at,
                  coupons (
                    name,
                    discount_amount,
                    coupon_type
                  )
                `)
                .eq('user_id', user.id)
                .eq('is_used', false),
              supabase
                .from('orders')
                .select('id')
                .eq('user_id', user.id)
                .eq('content_id', contentId)
                .order('created_at', { ascending: false })
                .limit(1)
            ]);

            const { data: couponsData, error: couponsError } = couponsResult;
            const { data: ordersData, error: ordersError } = ordersResult;

            // 쿠폰 처리
            if (couponsError) {
              console.error('❌ 쿠폰 조회 실패:', couponsError);
              // ⭐ 실패해도 쿠폰 로딩 완료 표시 (가격 영역은 표시되어야 함)
              setIsCouponLoaded(true);
            } else {
              // 만료되지 않은 쿠폰만 필터링
              const validCoupons = (couponsData || []).filter((coupon: any) => {
                if (!coupon.expired_at) return true; // 만료일 없음 = 무제한
                return new Date(coupon.expired_at) > new Date(); // 만료일이 미래인 경우만
              }) as UserCoupon[];

              setUserCoupons(validCoupons);
              console.log('🎟️ [쿠폰 조회] 사용 가능한 쿠폰:', validCoupons.length, '개');
              validCoupons.forEach((coupon, idx) => {
                console.log(`  [${idx + 1}] 쿠폰명: "${coupon.coupons.name}", 할인금액: ${coupon.coupons.discount_amount}원`);
              });
              // ⭐ 로그인 상태에서도 쿠폰 로딩 완료 표시 (가격+혜택가 동시 표시)
              setIsCouponLoaded(true);
            }

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
              console.error('쿠폰 조회 중 오류:', error);
            }
            setIsCheckingAnswers(false);
          }
        } else {
          // 로그아웃 상태면 답변 체크 불필요
          setIsCheckingAnswers(false);

          // ⭐ 로그아웃 상태에서도 welcome 쿠폰 금액 조회 (혜택가 표시용)
          try {
            const { data: welcomeCouponData } = await supabase
              .from('coupons')
              .select('discount_amount')
              .eq('coupon_type', 'welcome')
              .eq('is_active', true)
              .single();

            if (welcomeCouponData) {
              setWelcomeCouponDiscount(welcomeCouponData.discount_amount);
              console.log('💰 [로그아웃] welcome 쿠폰 할인 금액:', welcomeCouponData.discount_amount);
            }
          } catch (couponError) {
            console.warn('⚠️ [로그아웃] welcome 쿠폰 조회 실패:', couponError);
          } finally {
            // ⭐ 쿠폰 로딩 완료 (가격 영역 동시 표시용)
            setIsCouponLoaded(true);
          }
        }

        // 💾 새 캐시 저장 (원본 가격으로 저장 - AB 오버라이드 전)
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
      setIsCouponLoaded(false);

      // ⭐ 백그라운드에서 최신 데이터 업데이트 (비동기, 사용자는 기다리지 않음)
      updateInBackground(userJson);
      return; // ⭐ 조기 종료
    }

    // ⭐ 캐시가 없을 때만 상태 초기화 (이전 콘텐츠 깜빡임 방지)
    setContent(null);
    setQuestions([]);
    setIsFreeContent(null);
    setIsLoading(true);
    setIsCouponLoaded(false);

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

  // ⭐ AI 개인화 구매 가이드 로드
  useEffect(() => {
    const fetchPurchaseGuide = async () => {
      // 비로그인 → 스킵
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
            setPurchaseGuide(parsed.guide);
            return;
          }
        }
      } catch {
        // 캐시 파싱 실패 → 무시하고 API 호출
      }

      setIsPurchaseGuideLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-purchase-guide', {
          body: { contentId }
        });

        if (error) {
          console.error('❌ [purchase-guide] Edge Function 오류:', error);
          return;
        }

        if (data?.success && data.guide) {
          setPurchaseGuide(data.guide);
          // 캐시 저장
          localStorage.setItem(cacheKey, JSON.stringify({
            guide: data.guide,
            timestamp: Date.now()
          }));
        }
        // success: false (no_tags) → 섹션 숨김 (purchaseGuide stays null)
      } catch (err) {
        console.error('❌ [purchase-guide] 예외:', err);
      } finally {
        setIsPurchaseGuideLoading(false);
      }
    };

    if (content && !content.content_type?.includes('free')) {
      fetchPurchaseGuide();
    }
  }, [content, contentId]);

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

    // ⭐ Supabase Auth로 로그인 체크
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔐 [MasterContentDetailPage] 로그인 체크 완료:', { isLoggedIn: !!user });
    
    if (!user) {
      // ⭐ 로그아웃 유저 → 로그인 페이지로 이동 (결제 페이지로 리다이렉트)
      const redirectUrl = `/product/${contentId}/payment/new`;
      console.log('🔐 로그아웃 상태 → 리다이렉트 URL 저장:', redirectUrl);
      localStorage.setItem('redirectAfterLogin', redirectUrl);
      console.log('✅ localStorage 저장 확인:', localStorage.getItem('redirectAfterLogin'));
      // ⭐ canGoBack 상태 추가 - 로그인 페이지에서 뒤로가기 시 직전 페이지로 이동 가능
      console.log('🟢 [MasterContentDetailPage] navigate 호출: /login/new');
      navigate('/login/new', { state: { canGoBack: true, fromPath: `/master/content/detail/${contentId}` } });
      return;
    }

    // ⭐ 로그인 유저 → 바로 실제 결제 페이지로 이동 (더미 페이지 건너뜀)
    console.log('✅ 로그인 유저 - 실제 결제 페이지로 이동');
    console.log('🟢 [MasterContentDetailPage] navigate 호출:', `/product/${contentId}/payment/new`);
    navigate(`/product/${contentId}/payment/new`);
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
            <div className="bg-white relative shrink-0 w-full">
              <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
              <div className="size-full">
                <div className="box-border content-stretch flex flex-col items-start px-[16px] py-[8px] relative w-full">
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
                          <p className={`${activeTab === 'description' ? "font-semibold text-[#151515]" : "font-medium text-[#999999]"} leading-[20px] not-italic relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px] whitespace-pre transition-colors duration-200`}>상품 설명</p>
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
                          <p className={`${activeTab === 'principle' ? "font-semibold text-[#151515]" : "font-medium text-[#999999]"} leading-[20px] not-italic relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px] whitespace-pre transition-colors duration-200`}>풀이 원리</p>
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
                          <p className={`${activeTab === 'preview' ? "font-semibold text-[#151515]" : "font-medium text-[#999999]"} leading-[20px] not-italic relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px] whitespace-pre transition-colors duration-200`}>맛보기</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative w-full z-0 scrollbar-hide">
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
              <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full mt-0 pt-0">
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
                      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                          <div className="flex items-center justify-between w-full">
                            <ContentTags
                              isPaid={isPaid}
                              isNew={isContentNew(content.created_at)}
                              isRead={isRead}
                            />
                            {content.view_count > 0 && (
                              <div className="flex items-center gap-[3px] shrink-0">
                                <img src="/eye-icon.svg" width="14" height="14" alt="" aria-hidden="true" />
                                <span style={{ fontSize: '12px', fontWeight: 300, color: '#151515', fontFamily: 'Pretendard Variable', letterSpacing: '-0.24px' }}>
                                  {content.view_count.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="relative shrink-0 w-full">
                            <div className="size-full">
                              <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[2px] py-0 relative w-full">
                                <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                                  <p className="font-semibold leading-[24px] not-italic relative shrink-0 text-[18px] text-black tracking-[-0.36px] w-full">{content.title}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* 가격 영역 - 쿠폰 로딩 완료까지 숨김 (가격+혜택가 동시 표시) */}
                        <div className={`relative shrink-0 w-full mt-[-8px] mb-[-4px] ${isCouponLoaded ? '' : 'hidden'}`}>
                          <div className="size-full">
                            <div className="box-border content-stretch flex flex-col gap-0 items-start px-[2px] py-0 relative w-full">
                                {/* 할인율 + 할인가격 + 정상가격(취소선) */}
                                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                                  <p className="font-bold leading-[32.5px] not-italic relative shrink-0 text-[#ff6b6b] text-[20px] text-nowrap tracking-[-0.4px] mr-[-2px]">
                                    {content.discount_rate || 0}%
                                  </p>
                                  <p className="font-bold leading-[32.5px] not-italic relative shrink-0 text-[#151515] text-[22px] text-nowrap tracking-[-0.22px]">
                                    {content.price_discount?.toLocaleString() || '0'}원
                                  </p>
                                  <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#999999] text-[14px] text-nowrap tracking-[-0.28px]">
                                    <s>{content.price_original?.toLocaleString() || '0'}원</s>
                                  </p>
                                </div>
                                
                                {/* 최종 혜택가 (조건부 표시) */}
                                {(() => {
                                  // ⭐ coupon_type으로 정확히 구분 + 실제 할인 금액 사용
                                  const revisitCoupon = userCoupons.find(c => c.coupons.coupon_type === 'revisit' && !c.is_used);
                                  const welcomeCoupon = userCoupons.find(c => c.coupons.coupon_type === 'welcome' && !c.is_used);
                                  const hasAnyCoupon = userCoupons.length > 0;

                                  // Case 1: 로그인 + 재방문쿠폰 보유 (우선순위 1) — AB 그룹 B는 이벤트가 우선
                                  if (isLoggedIn && revisitCoupon && getABGroup() !== 'B') {
                                    const discountAmount = revisitCoupon.coupons.discount_amount || 3000;
                                    const finalPrice = Math.max(0, (content.price_discount || 0) - discountAmount);
                                    return (
                                      <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                                        <p className="font-bold leading-[32.5px] not-italic relative shrink-0 text-[#48b2af] text-[22px] text-nowrap tracking-[-0.22px] whitespace-pre">
                                          {finalPrice.toLocaleString()}원
                                        </p>
                                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                          <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#48b2af] text-[13px] text-nowrap whitespace-pre">
                                            재구매 혜택가
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Case 2: 로그인 + 웰컴쿠폰 보유 (우선순위 2) — AB 그룹 B는 이벤트가 우선
                                  if (isLoggedIn && welcomeCoupon && getABGroup() !== 'B') {
                                    const discountAmount = welcomeCoupon.coupons.discount_amount || 5000;
                                    const finalPrice = Math.max(0, (content.price_discount || 0) - discountAmount);
                                    return (
                                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
                                        <p className="font-bold leading-[32.5px] not-italic relative shrink-0 text-[#48b2af] text-[22px] text-nowrap tracking-[-0.22px] whitespace-pre">
                                          {finalPrice.toLocaleString()}원
                                        </p>
                                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                          <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#48b2af] text-[13px] text-nowrap whitespace-pre">
                                            첫 구매 혜택가
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Case 3: 로그아웃 상태 + welcomeCouponDiscount 있음 → 첫 구매 혜택가 표시 (A/B 테스트 기간 미노출)
                                  if (false && !isLoggedIn && welcomeCouponDiscount !== null) {
                                    const finalPrice = Math.max(0, (content.price_discount || 0) - welcomeCouponDiscount);
                                    return (
                                      <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                                        className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full"
                                      >
                                        <p className="font-bold leading-[32.5px] not-italic relative shrink-0 text-[#48b2af] text-[22px] text-nowrap tracking-[-0.22px] whitespace-pre">
                                          {finalPrice.toLocaleString()}원
                                        </p>
                                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                          <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#48b2af] text-[13px] text-nowrap whitespace-pre">
                                            첫 구매 혜택가
                                          </p>
                                        </div>
                                      </motion.div>
                                    );
                                  }

                                  // Case 4: AB 그룹 B → 한시 이벤트가 표시
                                  if (getABGroup() === 'B') {
                                    const abPrice = getABPrice({
                                      price_original: content.price_original,
                                      price_discount: content.price_discount,
                                      discount_rate: content.discount_rate,
                                    });
                                    return (
                                      <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
                                        <p className="font-bold leading-[32.5px] not-italic relative shrink-0 text-[#48b2af] text-[22px] text-nowrap tracking-[-0.22px] whitespace-pre">
                                          {abPrice.price_discount.toLocaleString()}원
                                        </p>
                                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                          <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[#48b2af] text-[13px] text-nowrap whitespace-pre">
                                            선착순 이벤트가
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Case 5: 그 외 → 혜택가 미표시
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                      {/* 쿠폰 안내 버튼 (조건부 렌더링) - 쿠폰 로딩 완료까지 숨김 */}
                      <div className={`w-full ${isCouponLoaded ? '' : 'hidden'}`}>
                      {(() => {
                        // ⭐ coupon_type으로 정확히 구분 + 실제 할인 금액 사용
                        const revisitCoupon = userCoupons.find(c => c.coupons.coupon_type === 'revisit' && !c.is_used);
                        const welcomeCoupon = userCoupons.find(c => c.coupons.coupon_type === 'welcome' && !c.is_used);
                        const hasAnyCoupon = userCoupons.length > 0;

                        // ⭐ 로그아웃 상태에서 로그인 페이지로 이동
                        const handleLoginRedirect = () => {
                          const paymentUrl = `/master/content/detail/${content.id}`;
                          localStorage.setItem('redirectAfterLogin', paymentUrl);
                          // ⭐ canGoBack 상태 추가 - 로그인 페이지에서 뒤로가기 시 직전 페이지로 이동 가능
                          navigate('/login/new', { state: { canGoBack: true, fromPath: `/master/content/detail/${content.id}` } });
                        };

                        // Case 1: 로그인 + 재방문쿠폰 보유 (우선순위 1) — AB 그룹 B는 이벤트가 우선
                        if (isLoggedIn && revisitCoupon && getABGroup() !== 'B') {
                          // ✅ 쿠폰의 실제 할인 금액 사용 (하드코딩 제거)
                          const discountAmount = revisitCoupon.coupons.discount_amount || 3000;
                          const finalPrice = Math.max(0, (content.price_discount || 0) - discountAmount);
                          return (
                            <button 
                              onClick={onPurchase}
                              onTouchStart={() => {}}
                              className="bg-[#f0f8f8] relative rounded-[12px] shrink-0 w-full border-none cursor-pointer p-0 group transition-colors duration-150 ease-out active:bg-[#e0f0f0]"
                            >
                              <div aria-hidden="true" className="absolute border border-[#7ed4d2] border-solid inset-0 pointer-events-none rounded-[12px]" />
                              <motion.div 
                                whileTap={{ scale: 0.96 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="flex flex-col items-center justify-center size-full"
                              >
                                <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[16px] py-[12px] relative w-full">
                                  <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full">
                                    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                                      <div className="relative shrink-0 size-[20px] flex items-center justify-center">
                                        <svg className="block w-[20px] h-[17px]" fill="none" viewBox="0 0 20 17">
                                          <g id="Group">
                                            <path clipRule="evenodd" d={svgPathsDetail.p364966f0} fill="var(--fill-0, #48B2AF)" fillRule="evenodd" />
                                            <path clipRule="evenodd" d={svgPathsDetail.p978f000} fill="var(--fill-0, white)" fillRule="evenodd" />
                                          </g>
                                        </svg>
                                      </div>
                                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                        <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[0px] text-[14px] text-black text-nowrap tracking-[-0.42px] whitespace-pre">
                                          재구매 쿠폰 받고<span className="text-[#48b2af]"> </span>
                                          <span className="font-bold text-[#48b2af]">{finalPrice.toLocaleString()}원으로</span>
                                          <span>{` 풀이 보기`}</span>
                                        </p>
                                        <motion.div 
                                          className="relative shrink-0 size-[12px]"
                                          animate={{ x: [0, 3, 0] }}
                                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                            <g id="arrow-right">
                                              <path d={svgPathsDetail.p3117bd00} stroke="var(--stroke-0, #525252)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                                            </g>
                                          </svg>
                                        </motion.div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </button>
                          );
                        }
                        
                        // Case 2: 로그인 + 웰컴쿠폰 보유 (우선순위 2) — AB 그룹 B는 이벤트가 우선
                        if (isLoggedIn && welcomeCoupon && getABGroup() !== 'B') {
                          // ✅ 쿠폰의 실제 할인 금액 사용 (하드코딩 제거)
                          const discountAmount = welcomeCoupon.coupons.discount_amount || 5000;
                          const finalPrice = Math.max(0, (content.price_discount || 0) - discountAmount);
                          return (
                            <button 
                              onClick={onPurchase}
                              onTouchStart={() => {}} // 모바일 active 상태 활성화
                              className="bg-[#f0f8f8] relative rounded-[12px] shrink-0 w-full border-none cursor-pointer p-0 group transition-colors duration-150 ease-out active:bg-[#e0f0f0]"
                            >
                              <div aria-hidden="true" className="absolute border border-[#7ed4d2] border-solid inset-0 pointer-events-none rounded-[12px]" />
                              <motion.div 
                                whileTap={{ scale: 0.96 }}
                                transition={{ duration: 0.1 }}
                                className="flex flex-col items-center justify-center size-full transform-gpu"
                              >
                                <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[16px] py-[12px] relative w-full">
                                  <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full">
                                    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                                      <div className="relative shrink-0 size-[20px] flex items-center justify-center pt-[1px]">
                                        <svg className="block w-[20px] h-[17px]" fill="none" preserveAspectRatio="none" viewBox="0 0 20 17">
                                          <g id="Group">
                                            <path clipRule="evenodd" d={svgPathsDetail.p364966f0} fill="var(--fill-0, #48B2AF)" fillRule="evenodd" />
                                            <path clipRule="evenodd" d={svgPathsDetail.p978f000} fill="var(--fill-0, white)" fillRule="evenodd" />
                                          </g>
                                        </svg>
                                      </div>
                                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                        <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[0px] text-[14px] text-black text-nowrap tracking-[-0.42px] whitespace-pre">
                                          첫 구매 쿠폰 받고<span className="text-[#48b2af]"> </span>
                                          <span className="font-bold text-[#48b2af]">{finalPrice.toLocaleString()}원으로</span>
                                          <span>{` 풀이 보기`}</span>
                                        </p>
                                        <motion.div 
                                          className="relative shrink-0 size-[12px]"
                                          animate={{ x: [0, 3, 0] }}
                                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                            <g id="arrow-right">
                                              <path d={svgPathsDetail.p3117bd00} stroke="var(--stroke-0, #525252)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                                            </g>
                                          </svg>
                                        </motion.div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </button>
                          );
                        }
                        
                        // Case 3: 로그아웃 상태 + welcomeCouponDiscount 있음 → 첫 구매 버튼 (A/B 테스트 기간 미노출)
                        if (false && !isLoggedIn && welcomeCouponDiscount !== null) {
                          const finalPrice = Math.max(0, (content.price_discount || 0) - welcomeCouponDiscount);
                          return (
                            <motion.button
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                              onClick={handleLoginRedirect}
                              onTouchStart={() => {}}
                              className="bg-[#f0f8f8] relative rounded-[12px] shrink-0 w-full border-none cursor-pointer p-0 group transition-colors duration-150 ease-out active:bg-[#e0f0f0]"
                            >
                              <div aria-hidden="true" className="absolute border border-[#7ed4d2] border-solid inset-0 pointer-events-none rounded-[12px]" />
                              <motion.div
                                whileTap={{ scale: 0.96 }}
                                transition={{ duration: 0.1 }}
                                className="flex flex-col items-center justify-center size-full transform-gpu"
                              >
                                <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[16px] py-[12px] relative w-full">
                                  <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full">
                                    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                                      <div className="relative shrink-0 size-[20px] flex items-center justify-center pt-[1px]">
                                        <svg className="block w-[20px] h-[17px]" fill="none" preserveAspectRatio="none" viewBox="0 0 20 17">
                                          <g id="Group">
                                            <path clipRule="evenodd" d={svgPathsDetail.p364966f0} fill="var(--fill-0, #48B2AF)" fillRule="evenodd" />
                                            <path clipRule="evenodd" d={svgPathsDetail.p978f000} fill="var(--fill-0, white)" fillRule="evenodd" />
                                          </g>
                                        </svg>
                                      </div>
                                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                        <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[0px] text-[14px] text-black text-nowrap tracking-[-0.42px] whitespace-pre">
                                          첫 구매 쿠폰 받고<span className="text-[#48b2af]"> </span>
                                          <span className="font-bold text-[#48b2af]">{finalPrice.toLocaleString()}원으로</span>
                                          <span>{` 풀이 보기`}</span>
                                        </p>
                                        <motion.div
                                          className="relative shrink-0 size-[12px]"
                                          animate={{ x: [0, 3, 0] }}
                                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                            <g id="arrow-right">
                                              <path d={svgPathsDetail.p3117bd00} stroke="var(--stroke-0, #525252)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                                            </g>
                                          </svg>
                                        </motion.div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </motion.button>
                          );
                        }

                        // Case 4: AB 그룹 B → 초특가 CTA 버튼
                        if (getABGroup() === 'B') {
                          return (
                            <button
                              onClick={isLoggedIn ? onPurchase : handleLoginRedirect}
                              onTouchStart={() => {}}
                              className="bg-[#f0f8f8] relative rounded-[12px] shrink-0 w-full border-none cursor-pointer p-0 group transition-colors duration-150 ease-out active:bg-[#e0f0f0]"
                            >
                              <div aria-hidden="true" className="absolute border border-[#7ed4d2] border-solid inset-0 pointer-events-none rounded-[12px]" />
                              <motion.div
                                whileTap={{ scale: 0.96 }}
                                transition={{ duration: 0.1 }}
                                className="flex flex-col items-center justify-center size-full transform-gpu"
                              >
                                <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center px-[16px] py-[12px] relative w-full">
                                  <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full">
                                    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                                      <div className="relative shrink-0 size-[20px] flex items-center justify-center pt-[1px]">
                                        <svg className="block w-[20px] h-[17px]" fill="none" preserveAspectRatio="none" viewBox="0 0 20 17">
                                          <g id="Group">
                                            <path clipRule="evenodd" d={svgPathsDetail.p364966f0} fill="var(--fill-0, #48B2AF)" fillRule="evenodd" />
                                            <path clipRule="evenodd" d={svgPathsDetail.p978f000} fill="var(--fill-0, white)" fillRule="evenodd" />
                                          </g>
                                        </svg>
                                      </div>
                                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                        <p className="font-medium leading-[22px] not-italic relative shrink-0 text-[0px] text-[14px] text-black text-nowrap tracking-[-0.42px] whitespace-pre">
                                          초특가 떴을 때<span className="text-[#48b2af]"> </span>
                                          <span className="font-bold text-[#48b2af]">지금 바로</span>
                                          <span>{` 풀이 보기`}</span>
                                        </p>
                                        <motion.div
                                          className="relative shrink-0 size-[12px]"
                                          animate={{ x: [0, 3, 0] }}
                                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                            <g id="arrow-right">
                                              <path d={svgPathsDetail.p3117bd00} stroke="var(--stroke-0, #525252)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                                            </g>
                                          </svg>
                                        </motion.div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </button>
                          );
                        }

                        // Case 5: 그 외 → 버튼 미표시
                        return null;
                      })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div className="bg-[#f9f9f9] h-[12px] w-full mt-[24px] mb-[28px]" />
              </motion.div>

              {/* AI 개인화 구매 가이드 섹션 */}
              {(isPurchaseGuideLoading || purchaseGuide) && (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
                <div className="px-[20px] mb-[28px]">
                  <div className="rounded-[16px] px-[20px] py-[20px]" style={{ backgroundColor: '#f0f8f8' }}>
                    <p style={{ fontSize: '15px', fontWeight: 600, lineHeight: '22px', letterSpacing: '-0.3px', color: '#368683', marginBottom: '12px' }}>
                      {(() => {
                        try {
                          const u = localStorage.getItem('user');
                          if (u) return `✨ ${JSON.parse(u).nickname || '회원'}님을 위한 맞춤 안내`;
                        } catch { /* ignore */ }
                        return '✨ 회원님을 위한 맞춤 안내';
                      })()}
                    </p>
                    {isPurchaseGuideLoading ? (
                      <div className="flex flex-col gap-[8px]">
                        <div className="h-[18px] rounded-[4px] animate-pulse" style={{ backgroundColor: '#d4eceb', width: '90%' }} />
                        <div className="h-[18px] rounded-[4px] animate-pulse" style={{ backgroundColor: '#d4eceb', width: '80%' }} />
                      </div>
                    ) : purchaseGuide ? (
                      <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.28px', color: '#2d2d2d', margin: 0, whiteSpace: 'pre-line' }}>
                        {purchaseGuide}
                      </p>
                    ) : null}
                  </div>
                </div>
                </motion.div>
              )}

              {/* Description Section */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[20px] py-0 relative shrink-0 w-full mb-[28px]">
                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                  <div className="relative shrink-0 w-full">
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                        <div className="basis-0 content-stretch flex gap-[4px] grow items-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">운세 설명</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full mb-[12px]">
                    <div className="relative shrink-0 w-full">
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[2px] py-0 relative w-full">
                          <div className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                            <div className="relative w-full">
                              <p className={`mb-0 ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                                {content.description || '운세 설명이 준비 중입니다.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {!isDescriptionExpanded && (
                      <motion.div
                        initial={{ height: 48, opacity: 1, marginTop: 0 }}
                        exit={{ height: 0, opacity: 0, marginTop: -12 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden w-full"
                      >
                        <button
                          onClick={() => setIsDescriptionExpanded(true)}
                          className="bg-white box-border content-stretch flex gap-[10px] h-[48px] items-center justify-center px-[12px] py-0 relative rounded-[12px] shrink-0 w-full border border-[#e7e7e7]"
                        >
                          <p className="font-medium leading-[20px] not-italic relative shrink-0 text-[15px] text-neutral-600 text-nowrap tracking-[-0.45px]">
                            자세히 보기
                          </p>
                          <ChevronDown className="w-4 h-4 text-[#525252]" />
                        </button>
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
                    <div className="bg-[#f7f8f9] box-border content-stretch flex flex-col gap-[10px] items-start pb-[32px] pt-[28px] px-[20px] relative shrink-0 w-full mb-[44px]">
                    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">핵심만 콕 집어드려요</p>
                        </div>
                      </div>
                      
                      <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
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
                              <p className="font-medium leading-[19px] min-w-full not-italic relative shrink-0 text-[#151515] text-[13px] text-center tracking-[-0.26px] w-[min-content]">나의 본성</p>
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
                              <p className="font-medium leading-[19px] min-w-full not-italic relative shrink-0 text-[#151515] text-[13px] text-center tracking-[-0.26px] w-[min-content]">주의할 점</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="basis-0 bg-white grow h-full min-h-px min-w-px relative rounded-[12px] shrink-0">
                          <div className="flex flex-col items-center size-full">
                            <div className="box-border content-stretch flex flex-col gap-[12px] items-center px-[12px] py-[16px] relative size-full">
                              <div className="overflow-clip relative shrink-0 size-[24px]">
                                <div className="absolute inset-[68.77%_22.2%_1.08%_20.47%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 8">
                                    <path d={svgPathsDetail.p6949280} fill="#557170" />
                                  </svg>
                                </div>
                                <div className="absolute inset-[1.35%_10.15%_15.33%_6.54%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                    <path d={svgPathsDetail.p4f1db80} fill="#3FB5B3" />
                                  </svg>
                                </div>
                                <div className="absolute inset-[1.35%_11.82%_18.45%_8.41%]">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                    <path d={svgPathsDetail.pbc87d00} fill="#8BE1DF" />
                                  </svg>
                                </div>
                              </div>
                              <p className="font-medium leading-[19px] min-w-full not-italic relative shrink-0 text-[#151515] text-[13px] text-center tracking-[-0.26px] w-[min-content]">미래 방향</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Worry Card Section - 작은 고민도 바로 풀어드립니다 */}
                  <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full px-[20px] mb-[44px]">
                    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                      <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                        <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">작은 고민도 바로 풀어드립니다</p>
                      </div>
                    </div>

                    <div className="bg-[#f9f9f9] relative rounded-[16px] shrink-0 w-full">
                      <div className="flex flex-col items-center justify-center size-full">
                        <div className="box-border content-stretch flex flex-col gap-[10px] items-center justify-center p-[20px] relative w-full">
                          <div className="content-stretch flex gap-[16px] items-end relative shrink-0 w-full">
                            <div className="basis-0 box-border content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px pb-[8px] pt-0 px-0 relative shrink-0">
                              <div className="content-stretch flex flex-col gap-[10px] items-start relative rounded-[12px] shrink-0 w-full">
                                <div className="bg-white relative rounded-[12px] shrink-0 w-full">
                                  <div className="flex flex-row items-center justify-center size-full">
                                    <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[10px] relative w-full">
                                      <p className="basis-0 font-normal grow leading-[23.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px]">
                                        {questions.length > 0 ? questions[0].question_text : '운세에 대한 궁금한 점을 풀어드려요'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="relative shrink-0 w-full">
                                <div className="size-full">
                                  <div className="box-border content-stretch flex flex-col gap-[10px] items-start pl-[12px] pr-0 py-0 relative w-full">
                                    <div className="bg-white relative rounded-[12px] shrink-0 w-full">
                                      <div className="flex flex-row items-center justify-center size-full">
                                        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[12px] py-[10px] relative w-full">
                                          <p className="basis-0 font-medium grow leading-[23.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#41a09e] text-[15px] tracking-[-0.3px]">타로와 사주로 명쾌하게 풀어 줄게요!</p>
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
                  <div className="bg-white box-border content-stretch flex flex-col gap-[12px] items-start px-[20px] py-0 relative shrink-0 w-full mb-[52px]">
                    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">운세 구성</p>
                        </div>
                      </div>

                      <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                        {questions.map((question, idx) => (
                          <div key={question.id} className="w-full">
                            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full">
                                  <span className="shrink-0 font-normal leading-[28.5px] text-[#999999] text-[16px] tracking-[-0.32px]">·</span>
                                  <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">{question.question_text}</p>
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

                  <div className="bg-[#f9f9f9] h-[12px] w-full mb-[44px]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {!isDescriptionExpanded && (
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
                  <div className="bg-[#f9f9f9] h-[12px] w-full mb-[44px]" />
                </motion.div>
              )}

              {/* Usage Guide & Refund Policy */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}>
              <div ref={usageGuideRef} className="content-stretch flex flex-col gap-[12px] items-start px-[20px] relative shrink-0 w-full mb-[50px]">
                <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <div className="basis-0 content-stretch flex gap-[10px] grow items-center justify-center min-h-px min-w-px relative shrink-0">
                      <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[17px] text-black tracking-[-0.34px]">이용안내 & 환불 규정</p>
                    </div>
                  </div>
                </div>

                <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                  {/* 이용 안내 */}
                  <div className="content-stretch flex flex-col gap-[8px] items-start overflow-clip relative rounded-[12px] shrink-0 w-full">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsUsageGuideExpanded(!isUsageGuideExpanded);
                      }}
                      className="box-border content-stretch flex gap-[12px] items-center px-0 py-[12px] relative rounded-[12px] shrink-0 w-full border-none bg-transparent cursor-pointer"
                    >
                      <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px] text-left">이용 안내</p>
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
                          <div className="bg-[#f7f8f9] relative rounded-[12px] shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center p-[20px] relative w-full">
                                <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                    <p className="font-bold leading-[23.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px] w-full">서비스 이용 전 확인해주세요</p>
                                  </div>
                                  <div className="content-stretch flex flex-col font-normal gap-[12px] items-start leading-[0] relative shrink-0 text-[15px] text-neutral-600 tracking-[-0.3px] w-full">
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span className="block w-full whitespace-normal break-words leading-[23.5px] text-justify">
                                          저희의 AI는 방대한 데이터를 기반으로 매번 당신에게 가장 적합한 해석을 생성합니다. 이 과정에서 동일한 사주 정보로 분석하더라도, AI의 딥러닝 특성상 표현이나 문장이 미세하게 달라질 수 있습니다.
                                        </span>
                                      </li>
                                    </ul>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span className="leading-[23.5px]">다만, 당신의 핵심적인 기질과 운명의 큰 흐름은 어떤 경우에도 일관되게 분석되니 안심하셔도 좋습니다. 세부적인 표현의 차이는 당신의 운명을 더욱 다각적으로 이해하는 과정으로 여겨주시기 바랍니다.</span>
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
                  <div className="content-stretch flex flex-col gap-[8px] items-start overflow-clip relative rounded-[12px] shrink-0 w-full">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsRefundPolicyExpanded(!isRefundPolicyExpanded);
                      }}
                      className="box-border content-stretch flex gap-[12px] items-center px-0 py-[12px] relative rounded-[12px] shrink-0 w-full border-none bg-transparent cursor-pointer"
                    >
                      <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px not-italic relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px] text-left">환불 정책</p>
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
                          <div className="bg-[#f7f8f9] relative rounded-[12px] shrink-0 w-full">
                            <div className="flex flex-row items-center justify-center size-full">
                              <div className="box-border content-stretch flex gap-[10px] items-center justify-center p-[20px] relative w-full">
                                <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                                    <p className="font-bold leading-[23.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px] w-full">환불 정책 안내</p>
                                  </div>
                                  <div className="content-stretch flex flex-col font-normal gap-[12px] items-start leading-[0] relative shrink-0 text-[15px] text-neutral-600 tracking-[-0.3px] w-full">
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span className="leading-[23.5px]">본 서비스에서 제공하는 모든 운세 풀이는 구매 즉시 열람 및 이용이 가능한 디지털 콘텐츠입니다.</span>
                                      </li>
                                    </ul>
                                    <ul className="block relative shrink-0 w-full">
                                      <li className="ms-[0px]">
                                        <span className="leading-[23.5px]">따라서 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 청약 철회(환불)가 제한되는 점 양해 부탁드립니다. 신중한 구매 결정을 부탁드립니다.</span>
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
                  <div className="bg-red-50 border-2 border-red-300 rounded-[16px] p-[16px]">
                    <p className="font-semibold text-[14px] text-red-600 mb-[8px] text-center">
                      ⚠️ 개발 전용 (배포 시 삭제)
                    </p>
                    <div className="flex flex-col gap-[8px]">
                      <motion.button
                        onClick={() => {
                          // ⭐ [DEV 모드] 풀이 플로우 시작
                          const devOrderId = `dev_order_${Date.now()}`;
                          console.log('🔧 [개발용] 풀이 플로우 확인하기:', {
                            orderId: devOrderId,
                            contentId: contentId
                          });
                          navigate(`/product/${contentId}/payment/new`);
                        }}
                        whileTap={{ scale: 0.96 }}
                        className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold h-[48px] rounded-[12px] w-full cursor-pointer border-none transition-colors text-[14px]"
                      >
                        [DEV] 전체 플로우 (결제~입력)
                      </motion.button>

                      <div className="flex gap-[8px]">
                        <motion.button
                          onClick={() => {
                            // ⭐ [DEV 모드] 타로 셔플 화면 바로가기
                            const devOrderId = `dev_shuffle_${Date.now()}`;
                            console.log('🔧 [개발용] 타로 셔플 화면 이동');
                            navigate(`/tarot/shuffle?orderId=${devOrderId}&questionOrder=1&contentId=${contentId}&from=dev`);
                          }}
                          whileTap={{ scale: 0.96 }}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold h-[48px] rounded-[12px] cursor-pointer border-none transition-colors text-[14px]"
                        >
                          [DEV] 셔플/선택
                        </motion.button>

                        <motion.button
                          onClick={() => {
                            // ⭐ [DEV 모드] 타로 결과 화면 바로가기
                            const devOrderId = `dev_result_${Date.now()}`;
                            console.log('🔧 [개발용] 타로 결과 화면 이동');
                            navigate(`/result/tarot?orderId=${devOrderId}&questionOrder=1&contentId=${contentId}&from=dev`);
                          }}
                          whileTap={{ scale: 0.96 }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold h-[48px] rounded-[12px] cursor-pointer border-none transition-colors text-[14px]"
                        >
                          [DEV] 결과 화면
                        </motion.button>
                      </div>
                    </div>
                    <p className="font-normal text-[12px] text-red-500 mt-[8px] text-center leading-[18px]">
                      로그인 + 구매 완료 상태를 가정하고<br />
                      각 단계별 UI를 확인합니다
                    </p>
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
                    className="bg-[#48b2af] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer overflow-hidden touch-manipulation pointer-events-auto select-none [-webkit-touch-callout:none] active:bg-[#36908f]"
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="box-border content-stretch flex gap-[10px] h-[56px] items-center justify-center px-[12px] py-0 relative w-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-medium leading-[25px] not-italic relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px] whitespace-pre select-none [-webkit-touch-callout:none]">구매하기</p>
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
    </>
  );
}
