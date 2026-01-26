import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useGoBack } from './hooks/useIOSSafeNavigate';
// ProductDetail, FreeProductDetail은 백업 처리됨 (2026-01-09)
// FreeProductDetail → FreeContentDetail로 대체 (하드코딩 더미 데이터 버그 수정)
import PaymentNew from './components/PaymentNew';
import BirthInfoInput from './components/BirthInfoInput';
import SajuDetail from './components/SajuDetail';
import FreeSajuDetail from './components/FreeSajuDetail';
import ProfilePage from './components/ProfilePage';
import PurchaseHistoryPage from './components/PurchaseHistoryPage';
import LoginPageNew from './components/LoginPageNew';
import ExistingAccountPageNew from './components/ExistingAccountPageNew';
import TermsPage from './components/TermsPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import PaymentComplete from './components/PaymentComplete';
import MasterContentList from './components/MasterContentList';
import MasterContentCreate, { ContentFormData } from './components/MasterContentCreate';
import MasterContentQuestions, { Question } from './components/MasterContentQuestions';
import MasterContentDetail from './components/MasterContentDetail';
import MasterContentDetailPage from './components/MasterContentDetailPage';
import FreeContentDetail from './components/FreeContentDetail';
import PaidContentDetailSkeleton from './components/skeletons/PaidContentDetailSkeleton'; // ⭐ 스켈레톤 로딩
import { freeContentService } from './lib/freeContentService'; // ⭐ 무료 콘텐츠 캐시 체크
import SajuInputPage from './components/SajuInputPage';
import SajuManagementPage from './components/SajuManagementPage';
import SajuAddPage from './components/SajuAddPage';
import SajuSelectPage from './components/SajuSelectPage';
import FreeSajuSelectPageWrapper from './components/FreeSajuSelectPageWrapper';
import FreeSajuAddPage from './components/FreeSajuAddPage';
import LoadingPage from './components/LoadingPage';
import FreeContentLoading from './components/FreeContentLoading';
import FreeBirthInfoInput from './components/FreeBirthInfoInput';
import UnifiedResultPage from './components/UnifiedResultPage'; // ⭐ 통합 결과 페이지
import TarotShufflePage from './components/TarotShufflePage'; // ⭐ 타로 셔플 페이지
import WelcomeCouponPage from './components/WelcomeCouponPage'; // ⭐ 추가
import ResultCompletePage from './components/ResultCompletePage'; // ⭐ 추가
import AlimtalkInfoInputPage from './components/AlimtalkInfoInputPage'; // ⭐ 알림톡 정보 입력 페이지
import ErrorPage from './components/ErrorPage'; // ⭐ 공통 에러 페이지
import ErrorBoundary from './components/ErrorBoundary'; // ⭐ 에러 바운더리
import { PageLoader } from './components/ui/PageLoader'; // ⭐ 공통 로딩 컴포넌트
import HomePage from './pages/HomePage';
import TestTarotPage from './pages/TestTarotPage'; // ⭐ 테스트용 타로 페이지
// ⭐ 테스트용 Figma 컴포넌트들
import CheckRecordMe from './components/CheckRecordMe';
import ReceiveMyAnalysis from './components/ReceiveMyAnalysis';
import MyReportList from './components/MyReportList';
import MyReportWeekly from './components/MyReportWeekly';
import MyReportEmpty from './components/MyReportEmpty';
import NadaumTags from './components/NadaumTags';
import NadaumTagsList from './components/NadaumTagsList';
import ReportWeeklyDetail from './components/ReportWeeklyDetail';
import ReportWeeklyTarot from './components/ReportWeeklyTarot';
import ReportWeeklyTarotResult from './components/ReportWeeklyTarotResult';
import ReportWeeklyMindCare from './components/ReportWeeklyMindCare';
import ReportWeeklyMemo from './components/ReportWeeklyMemo';
import ReportWeeklyMemoEdit from './components/ReportWeeklyMemoEdit';
import CompletionCoupon from './components/CompletionCoupon';
import AuthCallback from './pages/AuthCallback';
// TarotDemo 백업됨 (TarotFlowPage 제거로 인해)
import { allProducts } from './data/products';
import { initGA, trackPageView } from './utils/analytics';
import { supabase } from './lib/supabase';
import { Toaster, toast } from 'sonner';
import { Toast } from './components/ui/Toast';
import { prefetchZodiacImages } from './lib/zodiacUtils'; // 🔥 이미지 프리페칭
import { preloadLoadingPageImages } from './lib/imagePreloader'; // ⭐ 로딩 페이지 이미지 프리로드
import { DEV } from './lib/env'; // ⭐ 프로덕션 환경 체크
import { clearUserCaches } from './lib/auth'; // ⭐ 캐시 삭제 함수
import { initTestMode, isTestMode } from './lib/testAuth'; // 🧪 TestSprite 테스트 모드
import { projectId } from './utils/supabase/info'; // ⚡ Edge Function warm-up용

// ⚡ 프로덕션 환경 체크 - import.meta.env.DEV 오버라이드
if (!DEV && import.meta.env.DEV) {
  console.warn('⚠️ 프로덕션 환경에서 개발 모드가 감지되었습니다. 개발 UI를 숨깁니다.');
  // import.meta.env.DEV를 false로 오버라이드 (TypeScript 에러 무시)
  Object.defineProperty(import.meta.env, 'DEV', {
    value: false,
    writable: false,
    configurable: false
  });
}

// ⚡ Build Cache Buster v1.4.3 - Fix dynamic import module fetch error

// ⭐ 히스토리 디버깅용 컴포넌트 (스크롤 이동 제거)
function HistoryDebug() {
  const { pathname } = useLocation();

  useEffect(() => {
    console.log('📍 [히스토리] 페이지 이동:', pathname);
    console.log('📍 [히스토리] history.length:', window.history.length);
    // ⭐ window.scrollTo() 제거 - 브라우저 기본 스크롤 복원 사용
  }, [pathname]);

  return null;
}

// ⭐ 로그인 성공 토스트 표시 컴포넌트
function LoginToast() {
  const location = useLocation();

  useEffect(() => {
    // 페이지 로드 후 약간의 딜레이를 주어 안정적으로 토스트 표시
    const timer = setTimeout(() => {
      // sessionStorage에서 로그인 토스트 플래그 확인
      const showLoginToast = sessionStorage.getItem('show_login_toast');

      console.log('🔍 [LoginToast] 플래그 체크:', showLoginToast, 'pathname:', location.pathname);

      if (showLoginToast === 'true') {
        // 플래그 즉시 삭제 (중복 표시 방지)
        sessionStorage.removeItem('show_login_toast');

        // 토스트 표시 (2.2초간)
        toast.custom(
          () => <Toast type="positive" message="로그인 되었어요, 반가워요" />,
          { duration: 2200 }
        );

        console.log('🎉 [LoginToast] 로그인 성공 토스트 표시');
      }
    }, 100); // 100ms 딜레이

    return () => clearTimeout(timer);
  }, [location.key]); // location.key로 페이지 이동 감지 (더 정확함)

  return null;
}

// GA 초기화 컴포넌트
function GAInit() {
  const location = useLocation();

  useEffect(() => {
    // 🔐 세션 자동 갱신 (앱 시작 시)
    const refreshUserSession = async () => {
      const userJson = localStorage.getItem('user');
      if (!userJson) return; // 로그인 안 된 상태면 스킵

      try {
        console.log('🔄 [Session] 세션 갱신 시도...');
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.warn('⚠️ [Session] 세션 갱신 실패:', error.message);
          // 세션 갱신 실패해도 localStorage user는 유지 (오프라인 대응)
          // 실제 API 호출 시 401 에러가 나면 그때 로그아웃 처리
          return;
        }

        if (data.session) {
          console.log('✅ [Session] 세션 갱신 성공');
        }
      } catch (err) {
        console.error('❌ [Session] 세션 갱신 중 에러:', err);
      }
    };

    refreshUserSession();

    // 🧪 TestSprite 테스트 모드 초기화
    if (isTestMode()) {
      initTestMode().then((success) => {
        if (success) {
          console.log('🧪 [TestSprite] 테스트 모드로 앱 시작');
        }
      });
    }

    // ⚡ 빌드 버전 체크 및 캐시 무효화
    const BUILD_VERSION = '1.4.3'; // Fix dynamic import module fetch error
    const storedVersion = localStorage.getItem('app_build_version');

    if (storedVersion !== BUILD_VERSION) {
      console.log(`🔄 새 빌드 감지: ${storedVersion} → ${BUILD_VERSION}`);
      console.log('🗑️ 모든 캐시 삭제 중...');

      // 모든 캐시 삭제
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('cache') ||
          key.includes('_v') ||
          key.startsWith('homepage_') ||
          key.startsWith('master_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      localStorage.setItem('app_build_version', BUILD_VERSION);
      console.log('✅ 캐시 삭제 완료 및 새 버전 저장');
    }
    
    // GA 초기화 (앱 시작 시 한 번만)
    initGA();
    
    // 🔥 띠 이미지 리페칭 (백그라운드)
    prefetchZodiacImages().catch(err => {
      // 이미지 프리페칭 실패는 무시 (경고 없이)
    });

    // 🔍 잘못된 사용자 데이터(dev_user 등) 정리
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        
        if (!isValidUUID) {
          console.warn('⚠️ [App] Invalid user UUID detected in localStorage. Clearing user data.');
          localStorage.removeItem('user');
          // 관련 쿠키도 삭제
          document.cookie = 'last_login_provider=; max-age=0; path=/';
        }
      } catch (e) {
        console.error('⚠️ [App] Failed to parse user data. Clearing corrupted data.');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    // 라우트별 페이지 타이틀 매핑
    const getPageTitle = (pathname: string): string => {
      const BASE_TITLE = '나다운세';

      // 정적 라우트 매핑
      const staticRoutes: Record<string, string> = {
        '/': '홈',
        '/login': '로그인',
        '/login/new': '로그인',
        '/login/existing/new': '기존 계정 연동',
        '/terms': '약관 동의',
        '/terms-of-service': '이용약관',
        '/privacy-policy': '개인정보처리방침',
        '/profile': '마이페이지',
        '/purchase-history': '구매 내역',
        '/saju/management': '사주 관리',
        '/saju/input': '내 사주 입력',
        '/saju/add': '사주 추가',
        '/loading': '운세 생성 중',
        '/free-loading': '무료 운세 생성 중',
        '/result': '운세 결과',
        '/result/complete': '풀이 완료',
        '/result/saju': '운세 결과',
        '/tarot/shuffle': '타로 카드 선택',
        '/test/tarot': '타로 테스트',
        '/payment/complete': '결제 완료',
        '/welcome-coupon': '가입 완료',
        '/signup/terms': '회원가입 약관',
        '/auth/callback': '로그인 처리 중',
        '/alimtalk/input': '알림톡 정보 입력',
        '/master/content': '콘텐츠 관리',
        '/master/content/create': '콘텐츠 생성',
        '/master/content/create/questions': '질문 작성',
        '/error/404': '페이지를 찾을 수 없음',
        '/error/500': '서버 오류',
        '/error/503': '서비스 점검 중',
        '/error/network': '네트워크 오류',
      };

      // 정적 라우트 확인
      if (staticRoutes[pathname]) {
        return `${staticRoutes[pathname]} | ${BASE_TITLE}`;
      }

      // 동적 라우트 패턴 매칭
      if (pathname.startsWith('/product/') && pathname.endsWith('/payment')) {
        return `결제 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/product/') && pathname.endsWith('/birthinfo')) {
        return `사주 정보 입력 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/product/') && pathname.endsWith('/saju-select')) {
        return `사주 선택 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/product/') && pathname.endsWith('/free-saju-select')) {
        return `무료 사주 선택 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/product/') && pathname.endsWith('/free-saju-add')) {
        return `무료 사주 추가 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/product/') && pathname.includes('/result/free')) {
        return `무료 운세 결과 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/product/') && pathname.includes('/result')) {
        return `유료 운세 결과 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/product/')) {
        return `유료 콘텐츠 상세 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/free/content/')) {
        return `무료 콘텐츠 상세 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/master/content/detail/') && pathname.endsWith('/payment')) {
        return `결제 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/master/content/detail/')) {
        return `유료 콘텐츠 상세 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/master/content/') && pathname.includes('/birthinfo')) {
        return `사주 정보 입력 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/master/content/')) {
        return `유료 콘텐츠 상세 | ${BASE_TITLE}`;
      }

      // 기본값
      return BASE_TITLE;
    };

    const pageTitle = getPageTitle(location.pathname);

    // document.title 업데이트
    document.title = pageTitle;

    // GA 페이지뷰 트래킹 (일반 타이틀 - 퍼널 분석용)
    // 콘텐츠 상세 페이지는 여기서 "유료/무료 콘텐츠 상세"로 트래킹하고,
    // 각 컴포넌트에서 "[유료/무료] 콘텐츠명"으로 추가 트래킹 (개별 콘텐츠 분석용)
    trackPageView(location.pathname + location.search, pageTitle);
  }, [location]);

  return null;
}

// Product Detail Page Wrapper
function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ⭐️ allProducts 조회는 동기 작업이므로 즉시 초기값 설정
  const numericId = Number(id);
  const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;

  // ⭐️ UUID 콘텐츠: freeContentService 캐시 확인 (동기)
  // 캐시가 있으면 무료 콘텐츠이므로 즉시 FreeContentDetail 렌더링 가능
  const cachedFreeContent = !staticProduct && id ? freeContentService.loadFromCache(id) : null;

  const [product, setProduct] = useState<any>(staticProduct || null);
  // ⭐️ allProducts에서 찾았거나 캐시가 있으면 로딩 불필요
  const [isLoading, setIsLoading] = useState(!staticProduct && !cachedFreeContent);

  // ⭐️ master_contents 조회 (UUID 콘텐츠인 경우에만)
  useEffect(() => {
    // allProducts에서 이미 찾았거나 캐시가 있으면 DB 조회 스킵
    if (staticProduct) {
      console.log('✅ [ProductDetailPage] allProducts에서 즉시 로드:', staticProduct.title);
      return;
    }

    // ⭐️ freeContentService 캐시가 있으면 DB 조회 스킵
    // (FreeContentDetail이 자체적으로 데이터를 관리함)
    if (cachedFreeContent) {
      console.log('✅ [ProductDetailPage] 캐시 존재 → DB 조회 스킵');
      return;
    }

    const loadProduct = async () => {
      // ⭐️ master_contents 조회 (UUID 콘텐츠인 경우)
      if (id) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📄 [ProductDetailPage] master_contents 조회 시작');
        console.log('📌 [ProductDetailPage] URL id:', id);
        
        try {
          const { data, error } = await supabase
            .from('master_contents')
            .select('*')
            .eq('id', id)
            .single();

          if (data && !error) {
            // 마스터 콘텐츠를 product 형식으로 변환
            const convertedProduct = {
              id: data.id,
              title: data.title,
              type: data.content_type === 'free' ? 'free' : 'paid',
              category: data.category_main,
              image: data.thumbnail_url,
              description: data.description,  // ⭐️ 추가: 운세 설명
              fullDescription: data.description || '',  // ⭐️ FreeContentDetail에서 사용
              price: data.price_original || 0,  // ⭐️ DB에서 가져온 원가
              discountPrice: data.price_discount || data.price_original || 0,  // ⭐️ DB에서 가져온 할인가
              discountPercent: data.discount_rate || 0,  // ⭐️ DB에서 가져온 할인율
            };
            
            console.log('✅ [ProductDetailPage] master_contents에서 발견:', data);
            console.log('📌 [ProductDetailPage] content_type:', data.content_type);
            console.log('📌 [ProductDetailPage] 변환된 product.type:', convertedProduct.type);
            console.log('📌 [ProductDetailPage] description:', data.description?.substring(0, 100));
            console.log('💰 [ProductDetailPage] 가격 정보:', {
              price_original: data.price_original,
              price_discount: data.price_discount,
              discount_rate: data.discount_rate
            });
            
            setProduct(convertedProduct);
          } else {
            console.error('❌ [ProductDetailPage] 마스터 콘텐츠 조회 실패:', error);
          }
        } catch (err) {
          console.error('❌ [ProductDetailPage] 마스터 콘텐츠 조회 중 예외 발생:', err);
        }
      }
      
      setIsLoading(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

    loadProduct();
  }, [id]);

  // ⭐️ 무료 콘텐츠 캐시가 있으면 즉시 FreeContentDetail 렌더링 (로딩 스킵)
  if (cachedFreeContent && id) {
    console.log('✅ [ProductDetailPage] 캐시 감지 → FreeContentDetail 즉시 렌더링');
    return (
      <FreeContentDetail
        contentId={id}
        onBack={() => navigate('/')}
        onHome={() => navigate('/')}
        onContentClick={(contentId) => navigate(`/product/${contentId}`)}
        onBannerClick={(productId) => navigate(`/product/${productId}`)}
      />
    );
  }

  // ⭐️ UUID 콘텐츠 로딩 중: 스켈레톤 표시 (PageLoader 대신)
  // - 자식 컴포넌트(FreeContentDetail, MasterContentDetailPage)가 자체 스켈레톤을 갖고 있어서
  //   PageLoader 사용 시 로딩이 2번 연속 표시되는 문제 해결
  if (isLoading) {
    return <PaidContentDetailSkeleton />;
  }

  if (!product) {
    console.error('❌ [ProductDetailPage] 상품을 찾을 수 없음');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#999999] mb-4">상품을 찾을 수 없습니다</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handlePurchase = async (productId?: number) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔘 [ProductDetailPage] handlePurchase 시작');
    console.log('📌 [ProductDetailPage] productId 인자:', productId);
    console.log('📌 [ProductDetailPage] product:', product);
    console.log('📌 [ProductDetailPage] product.id:', product.id);
    console.log('📌 [ProductDetailPage] product.type:', product.type);
    
    // ⭐️ 무료 콘텐츠인 경우: 로그인 필요 없음
    if (product.type === 'free') {
      console.log('🆓 [ProductDetailPage] 무료 콘텐츠 감지');
      console.log('🔀 [ProductDetailPage] 로그인/사주 정보 확인 시작...');
      
      // ⭐️ Supabase에서 로그인 상태 확인 (localStorage 대신)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 [ProductDetailPage] Supabase 로그인 확인 완료');
      console.log('📌 [ProductDetailPage] user:', user);
      console.log('📌 [ProductDetailPage] user?.id:', user?.id);
      console.log('📌 [ProductDetailPage] user?.email:', user?.email);
      console.log('📌 [ProductDetailPage] userError:', userError);
      console.log('📌 [ProductDetailPage] 로그인 상태:', user ? '✅ 로그인됨' : '❌ 로그아웃됨');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (user) {
        // 로그인 상태: 사주 정보 DB에서 조회
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [ProductDetailPage] 로그인 상태 → DB에서 사주 정보 조회 시작...');
        console.log('📌 [ProductDetailPage] user.id:', user.id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // ⭐️ 무료 콘텐츠는 본인 사주만 조회
        const { data: sajuRecords, error: sajuError } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('notes', '본인')
          .order('created_at', { ascending: false });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 [ProductDetailPage] 사주 정보 조회 완료 (본인만)');
        console.log('📌 [ProductDetailPage] sajuRecords:', sajuRecords);
        console.log('📌 [ProductDetailPage] sajuError:', sajuError);
        console.log('📌 [ProductDetailPage] sajuRecords?.length:', sajuRecords?.length);
        console.log('📌 [ProductDetailPage] sajuRecords 상세:');
        sajuRecords?.forEach((record, idx) => {
          console.log(`   [${idx}] id: ${record.id}, name: ${record.full_name}, birth_date: ${record.birth_date}, notes: ${record.notes}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (sajuRecords && sajuRecords.length > 0) {
          // 사주 정보 있음 → 사주 선택 페이지 (이미 조회한 데이터 전달로 로딩 최적화)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ [ProductDetailPage] 사주 정보 있음 (' + sajuRecords.length + '개)');
          console.log('🔀 [ProductDetailPage] FreeSajuSelectPage로 이동 (사주 데이터 전달)');
          console.log('📍 [ProductDetailPage] navigate to:', `/product/${id}/free-saju-select`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          // ⭐ 이미 조회한 본인 사주는 전달하고, 전체 목록은 FreeSajuSelectPage에서 조회
          navigate(`/product/${id}/free-saju-select`, {
            state: { prefetchedMySaju: sajuRecords[0] }
          });
          return;
        } else {
          // 사주 정보 없음 → 사주 입력 페이지
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ [ProductDetailPage] 사주 정보 없음 (0개)');
          console.log('🔀 [ProductDetailPage] FreeBirthInfoInput으로 이동');
          console.log('📍 [ProductDetailPage] navigate to:', `/product/${id}/birthinfo`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          navigate(`/product/${id}/birthinfo`);
          return;
        }
      } else {
        // ⭐️ 로그아웃 상태: 항상 사주 입력 페이지로 이동 (캐시 있으면 자동 입력)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [ProductDetailPage] 로그아웃 상태');
        console.log('🔍 [ProductDetailPage] localStorage 캐시 확인...');
        
        const cachedSaju = localStorage.getItem('cached_saju_info');
        console.log('📌 [ProductDetailPage] cached_saju_info:', cachedSaju ? '있음' : '없음');
        
        // 캐시 여부와 관계없이 사주 입력 페이지로 이동 (입력 페이지에서 자동 채움)
        console.log('🔀 [ProductDetailPage] FreeBirthInfoInput으로 이동 (캐시 있으면 자동 입력)');
        console.log('📍 [ProductDetailPage] navigate to:', `/product/${id}/birthinfo`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        navigate(`/product/${id}/birthinfo`);
        return;
      }
    }
    
    // ⭐️ 유료 콘텐츠인 경우: 로그인 필수
    console.log('💰 [ProductDetailPage] 유료 콘텐츠 → 로그인 체크');
    
    // 로그인 체크
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    
    console.log('👤 [ProductDetailPage] 로그인 체크');
    console.log('📌 [ProductDetailPage] user:', user);
    
    if (!user) {
      // 로그아웃 상태: 리다이렉트 URL 저장 후 로그인 페이지로
      const redirectUrl = `/product/${id}/payment/new`;
      
      console.log('🔐 [ProductDetailPage] 로그아웃 상태 → 리다이렉트 URL 저장:', redirectUrl);
      localStorage.setItem('redirectAfterLogin', redirectUrl);
      console.log('✅ [ProductDetailPage] localStorage 저장 확인:', localStorage.getItem('redirectAfterLogin'));
      console.log('🔀 [ProductDetailPage] 로그인 페이지로 이동');
      navigate('/login/new');
      return;
    }
    
    // 로그인 상태: 바로 결제 페이지로 이동
    console.log('✅ [ProductDetailPage] 로그인 상태 확인됨');
    console.log('💰 [ProductDetailPage] 유료 콘텐츠 → 결제 페이지로 이동');
    navigate(`/product/${id}/payment/new`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  };

  // ⭐ 무료 콘텐츠: FreeContentDetail 사용 (FreeProductDetail 백업 처리됨 2026-01-09)
  // FreeProductDetail은 하드코딩된 더미 데이터 버그가 있어서 FreeContentDetail로 대체
  if (product.type === 'free') {
    return (
      <FreeContentDetail
        contentId={product.id.toString()}
        onBack={() => navigate('/')}
        onHome={() => navigate('/')}
        onContentClick={(contentId) => navigate(`/product/${contentId}`)}
        onBannerClick={(productId) => navigate(`/product/${productId}`)}
      />
    );
  }

  // ProductDetail → MasterContentDetailPage로 대체 (2026-01-07)
  return (
    <MasterContentDetailPage
      contentId={product.id.toString()}
    />
  );
}

// Payment New Page Wrapper
function PaymentNewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ⭐️ allProducts 조회는 동기 작업이므로 즉시 초기값 설정
  const numericId = Number(id);
  const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;

  const [product, setProduct] = useState<any>(staticProduct || null);
  // ⭐️ allProducts 조회는 즉시 완료, master_contents는 PaymentNew가 직접 조회
  const [isLoading, setIsLoading] = useState(false);

  // 로그 출력 (디버깅용)
  useEffect(() => {
    if (staticProduct) {
      console.log('✅ [PaymentNewPage] allProducts에서 즉시 로드:', staticProduct.title);
    } else {
      console.log('🔍 [PaymentNewPage] master_contents → PaymentNew가 직접 조회');
    }
  }, [staticProduct]);

  if (isLoading) {
    return <PageLoader />;
  }

  // ⭐ allProducts에서 찾지 못한 경우 (UUID인 경우)는 contentId만 전달
  // PaymentNew 컴포넌트가 master_contents에서 직접 가격 정보를 조회함
  if (!product) {
    return (
      <PaymentNew
        contentId={id}
        onBack={() => navigate(`/product/${id}`)}
        onPurchase={async () => {
          // ⭐ 로딩 페이지 이미지 미리 로드 (백그라운드에서 병렬 실행)
          preloadLoadingPageImages();

          // ⭐ 결제 완료 후 사주 정보 유무 확인 (캐시 우선, API는 폴백)
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            // 🚀 1순위: 캐시 확인 (즉시 렌더링, API 쿼리 스킵)
            const cachedJson = localStorage.getItem('saju_records_cache');
            let hasSaju = false;

            if (cachedJson) {
              try {
                const cached = JSON.parse(cachedJson);
                hasSaju = cached.length > 0;
                console.log('🚀 [PaymentNew→onPurchase] 캐시 발견 → API 쿼리 스킵', { count: cached.length });
              } catch (e) {
                console.error('❌ [PaymentNew→onPurchase] 캐시 파싱 실패:', e);
              }
            }

            // 🔍 2순위: 캐시 없을 때만 API 쿼리 (폴백)
            if (!hasSaju) {
              console.log('🔍 [PaymentNew→onPurchase] 캐시 없음 → API 쿼리 실행');
              // ⭐ is_primary 조건 제거: 사주 정보가 하나라도 있으면 선택 페이지로 이동
              const { data: mySajuList } = await supabase
                .from('saju_records')
                .select('id')
                .eq('user_id', user.id)
                .limit(1);

              hasSaju = mySajuList && mySajuList.length > 0;
              console.log('🔍 [PaymentNew→onPurchase] API 쿼리 결과:', { hasSaju, count: mySajuList?.length });
            }

            if (hasSaju) {
              // 본인 사주 있음 → 사주 선택 페이지
              console.log('✅ 결제 완료 → 사주 선택 페이지로 이동 (캐시 기반)');
              navigate(`/product/${id}/saju-select`);
            } else {
              // 본인 사주 없음 → 사주 입력 페이지
              console.log('✅ 결제 완료 → 사주 입력 페이지로 이동');
              navigate(`/product/${id}/birthinfo`);
            }
          } else {
            navigate(`/product/${id}/birthinfo`);
          }
        }}
        onNavigateToTermsOfService={() => navigate('/terms-of-service')}
        onNavigateToPrivacyPolicy={() => navigate('/privacy-policy')}
      />
    );
  }

  // ⭐ allProducts에서 찾은 경우 (기존 로직 유지)
  const handlePurchaseComplete = async () => {
    // ⭐ 로딩 페이지 이미지 미리 로드 (백그라운드에서 병렬 실행)
    preloadLoadingPageImages();

    // ⭐ 결제 완료 후 사주 정보 유무 확인 (캐시 우선, API는 폴백)
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 🚀 1순위: 캐시 확인 (즉시 렌더링, API 쿼리 스킵)
      const cachedJson = localStorage.getItem('saju_records_cache');
      let hasSaju = false;

      if (cachedJson) {
        try {
          const cached = JSON.parse(cachedJson);
          hasSaju = cached.length > 0;
          console.log('🚀 [handlePurchaseComplete] 캐시 발견 → API 쿼리 스킵', { count: cached.length });
        } catch (e) {
          console.error('❌ [handlePurchaseComplete] 캐시 파싱 실패:', e);
        }
      }

      // 🔍 2순위: 캐시 없을 때만 API 쿼리 (폴백)
      if (!hasSaju) {
        console.log('🔍 [handlePurchaseComplete] 캐시 없음 → API 쿼리 실행');
        // ⭐ is_primary 조건 제거: 사주 정보가 하나라도 있으면 선택 페이지로 이동
        const { data: mySajuList } = await supabase
          .from('saju_records')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        hasSaju = mySajuList && mySajuList.length > 0;
        console.log('🔍 [handlePurchaseComplete] API 쿼리 결과:', { hasSaju, count: mySajuList?.length });
      }

      if (hasSaju) {
        // 본인 사주 있음 → 사주 선택 페이지
        console.log('✅ 결제 완료 → 사주 선택 페이지로 이동 (캐시 기반)');
        navigate(`/product/${id}/saju-select`);
      } else {
        // 본인 사주 없음 → 사주 입력 페이지
        console.log('✅ 결제 완료 → 사주 입력 페이지로 이동');
        navigate(`/product/${id}/birthinfo`);
      }
    } else {
      navigate(`/product/${id}/birthinfo`);
    }
  };

  return (
    <PaymentNew
      product={product}
      productId={id}
      onBack={() => navigate(`/product/${id}`)}
      onPurchase={handlePurchaseComplete}
      onNavigateToTermsOfService={() => navigate('/terms-of-service')}
      onNavigateToPrivacyPolicy={() => navigate('/privacy-policy')}
    />
  );
}

// Birth Info Page Wrapper
function BirthInfoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useGoBack(`/product/${id}`); // ⭐ 직전 페이지로 (fallback: 콘텐츠 상세)

  // ⭐️ allProducts 조회는 동기 작업이므로 즉시 초기값 설정
  const numericId = Number(id);
  const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;

  const [product, setProduct] = useState<Product | null>(staticProduct || null);
  // ⭐️ allProducts에서 찾았으면 상품 로딩 불필요
  const [isLoading, setIsLoading] = useState(!staticProduct);
  const [hasSajuInfo, setHasSajuInfo] = useState<boolean | null>(null); // ⭐ 사주 정보 존재 여부

  // ⭐️ master_contents 조회 (UUID 콘텐츠인 경우에만)
  useEffect(() => {
    // allProducts에서 이미 찾았으면 DB 조회 스킵
    if (staticProduct) {
      console.log('✅ [BirthInfoPage] allProducts에서 즉시 로드:', staticProduct.title);
      return;
    }

    const loadProduct = async () => {
      // master_contents 조회 (UUID인 경우)
      if (id) {
        console.log('🔍 [BirthInfoPage] master_contents 조회 시작...');
        
        try {
          const { data, error } = await supabase
            .from('master_contents')
            .select('*')
            .eq('id', id)
            .single();

          if (data && !error) {
            // 마스터 콘텐츠를 product 형식으로 변환
            const convertedProduct = {
              id: data.id,
              title: data.title,
              type: data.content_type === 'free' ? 'free' : 'paid',
              category: data.category_main,
            };
            
            console.log('✅ [BirthInfoPage] master_contents에서 발견:', data);
            console.log('📌 [BirthInfoPage] content_type:', data.content_type);
            console.log('📌 [BirthInfoPage] 변환된 product.type:', convertedProduct.type);
            
            setProduct(convertedProduct);
          } else {
            console.error('❌ [BirthInfoPage] 마스터 콘텐츠 조회 실패:', error);
            // 네트워크 에러 시 null 유지 (에러 화면 표시)
          }
        } catch (err) {
          console.error('❌ [BirthInfoPage] 마스터 콘텐츠 조회 중 예외 발생:', err);
          // 네트워크 에러 시 null 유지 (에러 화면 표시)
        }
      }
      
      setIsLoading(false);
    };

    loadProduct();
  }, [id, location]);

  // ⭐ 무료 콘텐츠일 때 사주 정보 존재 여부 확인
  useEffect(() => {
    const checkSajuInfo = async () => {
      if (!product || product.type !== 'free') {
        setHasSajuInfo(null);
        return;
      }

      console.log('🔍 [BirthInfoPage] 무료 콘텐츠 → 사주 정보 확인 중...');

      // 로그인 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('ℹ️ [BirthInfoPage] 로그아웃 사용자 → 입력 페이지');
        setHasSajuInfo(false);
        return;
      }

      // ⭐ 사주 정보 전체 조회 (존재 여부 확인 + 데이터 프리페치)
      const { data: sajuData, error } = await supabase
        .from('saju_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [BirthInfoPage] 사주 정보 조회 실패:', error);
        setHasSajuInfo(false);
        return;
      }

      const hasSaju = sajuData && sajuData.length > 0;
      console.log(`${hasSaju ? '✅' : 'ℹ️'} [BirthInfoPage] 사주 정보 ${hasSaju ? '있음' : '없음'}`, sajuData?.length);

      setHasSajuInfo(hasSaju);

      // ⭐ 사주 정보가 있으면 데이터와 함께 사주 선택 페이지로 리다이렉트 (로딩 스킵)
      if (hasSaju) {
        console.log('🔀 [BirthInfoPage] 무료 콘텐츠 + 사주 정보 있음 → 사주 선택 페이지로 리다이렉트 (prefetch)');
        navigate(`/product/${id}/free-saju-select`, {
          replace: true,
          state: { prefetchedSajuRecords: sajuData }
        });
      }
    };

    checkSajuInfo();
  }, [product, id, navigate]);

  if (isLoading || (product?.type === 'free' && hasSajuInfo === null)) {
    return <PageLoader />;
  }

  if (!product) {
    console.error('❌ [BirthInfoPage] 상품을 찾을 수 없음');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#999999] mb-4">상품을 찾을 수 없습니다</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  console.log('🔀 [BirthInfoPage] 분기 판단 시작');
  console.log('📌 [BirthInfoPage] product.type:', product.type);
  console.log('📌 [BirthInfoPage] product.type === "free":', product.type === 'free');

  // ⭐️ 무료 콘텐츠인 경우 FreeBirthInfoInput 사용 (사주 정보 없는 경우만)
  if (product.type === 'free') {
    console.log('✅ [BirthInfoPage] 무료 콘텐츠 + 사주 정보 없음 → FreeBirthInfoInput 렌더링');
    return (
      <FreeBirthInfoInput
        productId={id || ''}
        onBack={goBack} // ⭐ 직전 페이지로 (구매내역에서 진입 시 구매내역으로 복귀)
      />
    );
  }

  // ⭐️ 유료 콘텐츠인 경우 BirthInfoInput 사용
  console.log('✅ [BirthInfoPage] 유료 콘텐츠 → BirthInfoInput 렌더링');
  return (
    <BirthInfoInput
      productId={id || ''}
      onBack={goBack} // ⭐ 직전 페이지로 (구매내역에서 진입 시 구매내역으로 복귀)
      onComplete={(recordId: string, userName?: string) => {
        if (product.type === 'free') {
          navigate(`/product/${id}/result/free`, { state: { recordId, userName } });
        } else {
          navigate(`/product/${id}/result`, { state: { recordId, userName } });
        }
      }}
    />
  );
}

// Result Page Wrapper (Paid)
function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const recordId = location.state?.recordId;

  if (!recordId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#999999] mb-4">결과를 찾을 수 없습니다</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <SajuDetail recordId={recordId} onClose={() => navigate('/')} />;
}

// Result Page Wrapper (Free)
function FreeResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ⭐️ resultKey 또는 recordId 둘 다 지원
  const resultKey = location.state?.resultKey;
  let recordId = location.state?.recordId || resultKey;
  const userName = location.state?.userName;
  const contentId = location.state?.contentId || id;
  const productFromState = location.state?.product;  // ⭐ FreeContentLoading에서 전달받은 product

  // ⭐️ resultKey가 없으면 로딩 페이지로 리다이렉트 (Edge Function 호출 필수)
  useEffect(() => {
    if (!recordId && id) {
      console.log('⚠️ [FreeResultPage] resultKey 없음 → 로딩 페이지로 리다이렉트');
      console.log('📌 [FreeResultPage] localStorage fallback 제거됨 - Edge Function 필수 호출');
      navigate(`/product/${id}/loading/free`, { replace: true });
    }
  }, [recordId, id, navigate]);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 [FreeResultPage] 컴포넌트 마운트');
  console.log('📌 [FreeResultPage] id:', id);
  console.log('📌 [FreeResultPage] resultKey:', resultKey);
  console.log('📌 [FreeResultPage] recordId:', recordId);
  console.log('📌 [FreeResultPage] userName:', userName);
  console.log('📌 [FreeResultPage] contentId:', contentId);
  console.log('📌 [FreeResultPage] productFromState:', productFromState ? '있음' : '없음');

  // ⭐️ 상품 정보 로드 (allProducts는 동기, master_contents는 비동기)
  // allProducts 조회는 즉시 완료되므로 초기값으로 설정
  const numericId = Number(id);
  const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;

  // ⭐ state에서 전달받은 product 우선 사용 (FreeContentLoading에서 조회 완료)
  const initialProduct = productFromState || staticProduct || null;
  const [product, setProduct] = useState<any>(initialProduct);
  // ⭐️ product가 이미 있으면 로딩 불필요 (state 전달 or allProducts 조회 완료)
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [recommendedContents, setRecommendedContents] = useState<any[]>([]);

  useEffect(() => {
    const loadProduct = async () => {
      // ⭐️ product가 이미 있으면 product 조회만 스킵, 추천 콘텐츠는 조회
      if (initialProduct) {
        console.log('✅ [FreeResultPage] product 이미 있음 → product 조회 스킵:', initialProduct);
        console.log('  - 출처:', productFromState ? 'FreeContentLoading state' : 'allProducts');

        // ⭐ 추천 콘텐츠만 조회
        try {
          const { freeContentService } = await import('./lib/freeContentService');
          const recommended = await freeContentService.fetchRecommendedContents(initialProduct.id);
          console.log('✅ [FreeResultPage] 추천 콘텐츠 로드 (initialProduct):', recommended.length, '개');

          const formattedRecommended = recommended.map(content => ({
            id: content.id,
            title: content.title,
            type: content.content_type as 'free' | 'paid',
            image: content.thumbnail_url || ''
          }));

          setRecommendedContents(formattedRecommended);
        } catch (error) {
          console.error('❌ [FreeResultPage] 추천 콘텐츠 조회 실패:', error);
        }

        return;
      }

      // ⭐️ master_contents 조회 (UUID 콘텐츠인 경우)
      if (id) {
        console.log('🔍 [FreeResultPage] master_contents 조회 시작...');
        
        try {
          const { data, error } = await supabase
            .from('master_contents')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.error('❌ [FreeResultPage] master_contents 조회 실패:', error);
            setProduct(null);
            setIsLoading(false);
            return;
          }

          if (data) {
            console.log('✅ [FreeResultPage] master_contents에서 발견:', data);
            console.log('📌 [FreeResultPage] DB 컬럼 확인:');
            console.log('  - data.thumbnail_url:', data.thumbnail_url);
            console.log('  - data.image_url:', data.image_url);
            console.log('  - data.category_main:', data.category_main);
            console.log('  - data.category:', data.category);
            
            // master_contents를 product 형식으로 변환
            const masterProduct = {
              id: data.id,
              title: data.title,
              type: 'free',
              category: data.category_main || data.category,
              image: data.thumbnail_url || '',  // ⭐️ ProductDetailPage와 동일하게 수정
              description: data.description || ''
            };
            
            console.log('📦 [FreeResultPage] 변환된 product:', masterProduct);
            console.log('📌 [FreeResultPage] 최종 image 값:', masterProduct.image);
            setProduct(masterProduct);

            // ⭐️ 추천 콘텐츠 조회 (동일한 카테고리, 인기도 순)
            const { freeContentService } = await import('./lib/freeContentService');
            const recommended = await freeContentService.fetchRecommendedContents(data.id);
            console.log('✅ [FreeResultPage] 추천 콘텐츠 로드:', recommended.length, '개');
            
            // FreeSajuDetail 형식에 맞게 변환
            const formattedRecommended = recommended.map(content => ({
              id: content.id,
              title: content.title,
              type: content.content_type as 'free' | 'paid',
              image: content.thumbnail_url || ''
            }));
            
            setRecommendedContents(formattedRecommended);
            setIsLoading(false);
          } else {
            console.error('❌ [FreeResultPage] 상품 없음');
            setProduct(null);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('❌ [FreeResultPage] 예외 발생:', err);
          setProduct(null);
          setIsLoading(false);
        }
      }
    };

    loadProduct();
  }, [id]);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 로딩 중
  if (isLoading) {
    return <PageLoader />;
  }

  // ⭐️ product만 체크 (recordId는 localStorage key이므로 반드시 있음)
  if (!product) {
    console.error('❌ [FreeResultPage] product 없음');
    console.error('  - id:', id);
    console.error('  - recordId:', recordId);
    console.error('  - product:', product);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#999999] mb-4">콘텐츠를 찾을 수 없습니다</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }
  
  // ⭐️ recordId 없으면 에러 (localStorage key가 필요함)
  if (!recordId) {
    console.error('❌ [FreeResultPage] recordId (resultKey) 없음');
    console.error('  - id:', id);
    console.error('  - recordId:', recordId);
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#999999] mb-4">결과를 찾을 수 없습니다</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ [FreeResultPage] FreeSajuDetail 렌더링');
  console.log('📌 [FreeResultPage] recordId 전달:', recordId);
  console.log('📌 [FreeResultPage] productImage:', product.image);
  console.log('📌 [FreeResultPage] product:', product);

  return (
    <FreeSajuDetail
      recordId={recordId}
      userName={userName}
      productTitle={product.title}
      productImage={product.image}
      contentId={id}
      onClose={() => navigate('/')}
      recommendedProducts={recommendedContents}
      onProductClick={(productId) => {
        navigate(`/product/${productId}`);
      }}
      onBannerClick={(productId) => navigate(`/product/${productId}`)}
      onUserIconClick={() => navigate('/profile')}
    />
  );
}

// Profile Page Wrapper
// ⭐ 알림톡 정보 입력 페이지 Wrapper
function AlimtalkInfoInputPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  // URL 쿼리 파라미터에서 orderId, contentId, selectedSajuId 추출
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const contentId = searchParams.get('contentId');
  const selectedSajuId = searchParams.get('selectedSajuId');

  // 필수 파라미터 누락 시 홈으로 리다이렉트
  if (!orderId || !contentId || !selectedSajuId) {
    console.error('❌ [AlimtalkInfoInput] 필수 파라미터 누락:', { orderId, contentId, selectedSajuId });
    toast.error('잘못된 접근입니다.');
    navigate('/', { replace: true });
    return null;
  }

  // ⭐ 뒤로가기: 상품 상세 페이지로 이동
  const handleBack = () => {
    navigate(`/master/content/detail/${contentId}`, { replace: true });
  };

  return (
    <AlimtalkInfoInputPage
      onBack={handleBack}
      orderId={orderId}
      contentId={contentId}
      selectedSajuId={selectedSajuId}
    />
  );
}

// ⭐ /result/saju → /result 리다이렉트 (알림톡 템플릿 호환성)
function ResultSajuRedirect() {
  const location = useLocation();
  return <Navigate to={`/result${location.search}`} replace />;
}

function ProfilePageWrapper() {
  const navigate = useNavigate();
  const goBack = useGoBack('/'); // 🛡️ iOS 스와이프 뒤로가기 대응: navigate(-1) 사용

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <ProfilePage
      onBack={goBack}
      onLogout={handleLogout}
      onNavigateToMasterContent={() => navigate('/master/content', { state: { canGoBack: true } })}
      onNavigateToTermsOfService={() => navigate('/terms-of-service', { state: { canGoBack: true } })}
      onNavigateToPrivacyPolicy={() => navigate('/privacy-policy', { state: { canGoBack: true } })}
      onNavigateToPurchaseHistory={() => navigate('/purchase-history', { state: { canGoBack: true } })}
      onNavigateToSajuInput={() => navigate('/saju/input', { state: { canGoBack: true } })}
      onNavigateToSajuManagement={() => navigate('/saju/management', { state: { canGoBack: true } })}
    />
  );
}

// Login Page New Wrapper
function LoginPageNewWrapper() {
  const navigate = useNavigate();
  const goBack = useGoBack('/'); // ⭐ 직전 페이지로 돌아가기 (fallback: 홈)

  // ⭐ 이미 로그인된 상태면 홈으로 리다이렉트 (뒤로가기로 돌아왔을 때 처리)
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      console.log('🔄 [LoginPage] 이미 로그인된 상태 → 홈으로 리다이렉트');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLoginSuccess = (user: any) => {
    console.log('🎉 로그인 성공! user:', user);

    // ⭐ 로그인 성공 토스트 표시 플래그 저장
    sessionStorage.setItem('show_login_toast', 'true');

    // 리다이렉트 URL 확인
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    console.log('📍 리다이렉트 URL 확인:', redirectUrl);

    if (redirectUrl) {
      console.log('✅ 리다이렉트 URL 존재 → 이동:', redirectUrl);
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectUrl, { replace: true });  // ⭐ replace 추가: 로그인 페이지를 히스토리에서 제거
    } else {
      console.log('❌ 리다이렉트 URL 없음 → 홈으로 이동');
      navigate('/', { replace: true });  // ⭐ replace 추가: 로그인 페이지를 히스토리에서 제거
    }
  };

  return (
    <LoginPageNew
      onBack={goBack} // ⭐ 직전 페이지로 돌아가기
      onLoginSuccess={handleLoginSuccess}
      onNavigateToTerms={() => navigate('/terms')}
      onNavigateToExistingAccount={(provider) => {
        navigate(`/login/existing/new?provider=${provider}`);
      }}
    />
  );
}

// Existing Account Page New Wrapper
function ExistingAccountPageNewWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const provider = searchParams.get('provider') as 'kakao' | 'google' | null;

  if (!provider) {
    return <Navigate to="/login/new" replace />;
  }

  return (
    <ExistingAccountPageNew
      provider={provider}
      onBack={() => navigate('/login/new')}
      onLoginWithCorrectProvider={() => {
        // 로그인 성공 시 홈으로 이동
        navigate('/', { replace: true });
      }}
      onNavigateToHome={() => navigate('/', { replace: true })}
    />
  );
}

// Terms Page Wrapper
function TermsPageWrapper() {
  const navigate = useNavigate();

  // ⭐ 이미 회원가입이 완료된 상태면 홈으로 리다이렉트 (뒤로가기로 돌아왔을 때 처리)
  useEffect(() => {
    const user = localStorage.getItem('user');
    const tempUser = localStorage.getItem('tempUser');

    if (user) {
      console.log('🔄 [TermsPage] 이미 회원가입 완료 → 홈으로 리다이렉트');
      navigate('/', { replace: true });
    } else if (!tempUser) {
      console.log('🔄 [TermsPage] 임시 사용자 정보 없음 → 로그인 페이지로 리다이렉트');
      navigate('/login/new', { replace: true });
    }
  }, [navigate]);

  const handleComplete = () => {
    // ⭐️ 가입 축하 쿠폰 페이지로 이동
    console.log('✅ 회원가입 완료 → 가입 축하 쿠폰 페이지로 이동');
    navigate('/welcome-coupon', { replace: true });
  };

  return (
    <TermsPage
      onBack={() => navigate('/login/new', { replace: true })}
      onComplete={handleComplete}
    />
  );
}

// ⭐ Welcome Coupon Page Wrapper
function WelcomeCouponPageWrapper() {
  const navigate = useNavigate();

  // ⭐ 이미 환영 페이지를 본 경우 홈으로 리다이렉트 (뒤로가기로 돌아왔을 때 처리)
  useEffect(() => {
    const welcomed = sessionStorage.getItem('welcomePageViewed');
    if (welcomed) {
      console.log('🔄 [WelcomeCoupon] 이미 환영 페이지를 봄 → 홈으로 리다이렉트');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleClose = () => {
    // ⭐ 환영 페이지를 봤다는 플래그 설정
    sessionStorage.setItem('welcomePageViewed', 'true');

    // ⭐ 신규 회원 로그인 완료 토스트 표시 플래그 저장
    sessionStorage.setItem('show_login_toast', 'true');

    // ⭐ 프로필 페이지 강제 리로드 플래그 저장
    sessionStorage.setItem('force_profile_reload', 'true');

    // redirectAfterLogin 확인
    const redirectUrl = localStorage.getItem('redirectAfterLogin');

    if (redirectUrl) {
      console.log('✅ [WelcomeCoupon] 리다이렉트 URL 존재 → 이동:', redirectUrl);
      localStorage.removeItem('redirectAfterLogin');
      // replace: true로 welcome-coupon을 히스토리에서 제거
      navigate(redirectUrl, { replace: true });
    } else {
      console.log('✅ [WelcomeCoupon] 리다이렉트 URL 없음 → 홈으로 이동');
      // replace: true로 welcome-coupon을 히스토리에서 제거
      navigate('/', { replace: true });
    }
  };

  return (
    <WelcomeCouponPage onClose={handleClose} />
  );
}

// Master Content List Wrapper
function MasterContentListWrapper() {
  const navigate = useNavigate();
  
  return (
    <MasterContentList 
      onBack={() => navigate(-1)}
      onNavigateHome={() => navigate('/')}
    />
  );
}

// Master Content Detail Wrapper
function MasterContentDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#999999] mb-4">콘텐츠를 찾을 수 없습니다</p>
          <button 
            onClick={() => navigate('/master/content')}
            className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <MasterContentDetail
      contentId={id}
      onBack={() => navigate('/master/content')}
      onHome={() => navigate('/')}
    />
  );
}

// Master Content Detail Page Wrapper (for public view)
function MasterContentDetailPageWrapper() {
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return <MasterContentDetailPage contentId={id} />;
}

// Free Content Detail Wrapper
function FreeContentDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack('/'); // 🛡️ iOS 안전한 뒤로가기

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <FreeContentDetail
      contentId={id}
      onBack={goBack} // 🛡️ useGoBack 사용
      onHome={() => navigate('/')}
      onContentClick={(contentId) => {
        console.log('🔥 App.tsx navigate 시도 (replace):', `/master/content/detail/${contentId}`);
        // ⭐ 추천 콘텐츠 클릭 시 현재 페이지를 교체 (히스토리 쌓지 않음)
        navigate(`/master/content/detail/${contentId}`, { replace: true });
      }}
      onBannerClick={(productId) => navigate(`/product/${productId}`)}
      onPurchase={undefined} // ⭐ handlePurchase fallback 사용
    />
  );
}

// Saju Input Page Wrapper
function SajuInputPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;

  return (
    <SajuInputPage
      onBack={() => navigate('/profile')}
      onSaved={() => {
        // 저장 완료 후 returnTo가 있으면 해당 경로로, 없으면 관리 페이지로 이동
        // ⭐ replace: true로 히스토리 교체 → iOS 스와이프 뒤로가기 시 올바른 페이지(프로필)로 이동
        if (returnTo) {
          navigate(returnTo, { replace: true });
        } else {
          navigate('/saju/management', { replace: true });
        }
      }}
    />
  );
}

// Saju Management Page Wrapper
function SajuManagementPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useGoBack('/profile'); // 🛡️ iOS 스와이프 뒤로가기 대응: navigate(-1) 사용

  return (
    <SajuManagementPage
      onBack={goBack}
      onNavigateToInput={() => navigate('/saju/input', { replace: true })}
      onNavigateToAdd={() => navigate('/saju/add', { replace: true })}
      onEditMySaju={(sajuInfo) => {
        // 내 사주 수정 → SajuInputPage로 이동 (편집 모드)
        // ⭐ replace: true로 히스토리 교체 → iOS 스와이프 뒤로가기 정상 동작
        navigate('/saju/input', { replace: true, state: { editMode: true, sajuData: sajuInfo, returnTo: '/saju/management' } });
      }}
      onEditOtherSaju={(sajuInfo) => {
        // 함께 보는 사주 수정 → SajuAddPage로 이동 (편집 모드)
        // ⭐ replace: true로 히스토리 교체 → iOS 스와이프 뒤로가기 정상 동작
        navigate('/saju/add', { replace: true, state: { editMode: true, sajuData: sajuInfo, returnTo: '/saju/management' } });
      }}
    />
  );
}

// Saju Add Page Wrapper
function SajuAddPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;

  return (
    <SajuAddPage
      onBack={() => navigate('/saju/management')}
      onSaved={() => {
        // 저장 완료 후 returnTo가 있으면 해당 경로로, 없으면 관리 페이지로 이동
        // ⭐ replace: true로 히스토리 교체 → iOS 스와이프 뒤로가기 시 올바른 페이지로 이동
        if (returnTo) {
          navigate(returnTo, { replace: true });
        } else {
          navigate('/saju/management', { replace: true });
        }
      }}
    />
  );
}

// Free Saju Add Page Wrapper (무료 콘텐츠용 사주 추가)
function FreeSajuAddPageWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <SajuAddPage
      onBack={() => navigate(`/product/${id}/free-saju-select`)}
      onSaved={() => navigate(`/product/${id}/free-saju-select`)}
    />
  );
}

// Master Content Payment Page Wrapper
function MasterContentPaymentPageWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  // ⭐ 결제 완료 후 사주 정보 확인 (최적화: 디버깅 쿼리 제거, ~200ms 절약)
  const handlePurchaseSuccess = async () => {
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (!user?.id) {
        navigate('/');
        return;
      }

      // ⭐️ is_primary 필드로 본인 사주 조회 (단일 쿼리)
      const { data: mySaju } = await supabase
        .from('saju_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (mySaju) {
        console.log('✅ 결제 완료 → 사주 선택 페이지로 이동');
        navigate(`/product/${id}/saju-select`);
      } else {
        console.log('✅ 결제 완료 → 사주 입력 페이지로 이동');
        navigate(`/product/${id}/birthinfo`);
      }
    } catch (error) {
      console.error('❌ [결제완료] 처리 중 오류:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
      navigate('/');
    }
  };

  return (
    <PaymentNew
      contentId={id}
      onBack={() => navigate(`/master/content/detail/${id}`)}
      onPurchase={handlePurchaseSuccess}
      onNavigateToTermsOfService={() => navigate('/terms-of-service')}
      onNavigateToPrivacyPolicy={() => navigate('/privacy-policy')}
    />
  );
}

// Master Content Create Flow Wrapper - 상태 관리
function MasterContentCreateFlowWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // 기본 정보 상태 관리
  const [formData, setFormData] = useState<ContentFormData>({
    content_type: 'paid',
    category_main: '',
    category_sub: '',
    title: '',
    questioner_info: '',
    description: '',
    user_concern: '',
  });

  // 질문지 상태 관리
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', type: 'saju', content: '' },
  ]);

  // 컴포넌트 마트 시 로그인 및 권한 확인
  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        console.log('=== 권한 확인 시작 ===');
        
        // localStorage에서 사용자 정보 확인
        const userStr = localStorage.getItem('user');
        console.log('localStorage user:', userStr);
        
        if (!userStr) {
          alert('로그인이 필요합니다.');
          navigate('/');
          return;
        }

        const user = JSON.parse(userStr);
        console.log('Parsed user:', user);
        console.log('User ID:', user.id);
        console.log('User role:', user.role);

        // role이 master인지 확인
        if (user.role !== 'master') {
          alert('마스터 권한이 필요합니다.');
          navigate('/');
          return;
        }

        console.log('=== 권한 확인 완료 ===');
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        alert('인증 확인 중 오류가 발생했습니다.');
        navigate('/');
      }
    };

    checkAuthAndRole();
  }, [navigate]);

  // 권한 확인 중이면 로딩 표시
  if (isCheckingAuth) {
    return <PageLoader />;
  }

  // 현재 화면 결정 (URL 기반)
  const isQuestionsPage = location.pathname.includes('/questions');

  return isQuestionsPage ? (
    <MasterContentQuestions
      onBack={() => navigate('/master/content/create')}
      onHome={() => navigate('/')}
      onComplete={() => {
        // 저장 완료 후 기본정보 입력 페이지로 이동하고 폼 초기화 (연속 등록 목적)
        setFormData({
          content_type: 'paid',
          category_main: '',
          category_sub: '',
          title: '',
          questioner_info: '',
          description: '',
          user_concern: '',
        });
        setQuestions([{ id: '1', type: 'saju', content: '' }]);
        navigate('/master/content/create');
      }}
      formData={formData}
      questions={questions}
      onQuestionsChange={setQuestions}
    />
  ) : (
    <MasterContentCreate
      onBack={() => navigate('/master/content')}
      onHome={() => navigate('/')}
      onNext={(data) => {
        setFormData(data);
        navigate('/master/content/create/questions');
      }}
      initialFormData={formData}
    />
  );
}

// 포트원 초기화 컴포넌트
function PortOneInit() {
  useEffect(() => {
    // 포트원 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    script.onload = () => {
      if (window.IMP) {
        window.IMP.init('imp38022226'); // 포트원 가맹점 식별드 (Payment.tsx와 동일)
        console.log('✅ 포트원 초기화 완료');
      }
    };
    document.head.appendChild(script);

    return () => {
      // 클린업
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}

export default function App() {
  // 🌐 HTML lang 속성 설정 (브라우저 자동번역 방지)
  useEffect(() => {
    document.documentElement.lang = 'ko';
  }, []);

  // ⚡ Edge Function Cold Start 방지 - 앱 로드 시 warm-up
  useEffect(() => {
    const warmupEdgeFunctions = async () => {
      try {
        // /users Edge Function warm-up (카카오 로그인 시 사용됨)
        // OPTIONS preflight 요청으로 함수만 로드 (실제 로직 실행 안 함)
        await fetch(`https://${projectId}.supabase.co/functions/v1/users`, {
          method: 'OPTIONS',
        });
        console.log('⚡ Edge Function warm-up 완료');
      } catch {
        // warm-up 실패해도 무시 (백그라운드 작업)
        console.debug('⚡ Edge Function warm-up 실패 (무시됨)');
      }
    };

    warmupEdgeFunctions();
  }, []);

  // 🔐 세션 만료 감지 및 모든 사용자 캐시 정리
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // 세션 만료/로그아웃 → 모든 사용자 캐시 삭제
        console.log('🧹 세션 만료 → 사용자 캐시 전체 삭제');
        clearUserCaches();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <ErrorBoundary>
        <HistoryDebug />
        <GAInit />
        <LoginToast />
        <PortOneInit />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPageNewWrapper />} />
          <Route path="/login/new" element={<LoginPageNewWrapper />} />
          <Route path="/login/existing/new" element={<ExistingAccountPageNewWrapper />} />
          <Route path="/terms" element={<TermsPageWrapper />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/product/:id/payment" element={<PaymentNewPage />} />
          <Route path="/product/:id/payment/new" element={<PaymentNewPage />} />
          <Route path="/product/:id/birthinfo" element={<BirthInfoPage />} />
          <Route path="/product/:id/saju-select" element={<SajuSelectPage />} />
          <Route path="/product/:id/free-saju-select" element={<FreeSajuSelectPageWrapper />} />
          <Route path="/product/:id/free-saju-add" element={<FreeSajuAddPageWrapper />} />
          <Route path="/product/:id/result" element={<ResultPage />} />
          <Route path="/product/:id/result/free" element={<FreeResultPage />} />
          <Route path="/payment/complete" element={<PaymentComplete />} />
          <Route path="/profile" element={<ProfilePageWrapper />} />
          <Route path="/purchase-history" element={<PurchaseHistoryPage />} />
          <Route path="/master/content" element={<MasterContentListWrapper />} />
          <Route path="/master/content/create" element={<MasterContentCreateFlowWrapper />} />
          <Route path="/master/content/create/questions" element={<MasterContentCreateFlowWrapper />} />
          <Route path="/master/content/detail/:id/payment" element={<MasterContentPaymentPageWrapper />} />
          <Route path="/master/content/detail/:id" element={<MasterContentDetailPageWrapper />} />
          <Route path="/master/content/:id/birthinfo" element={<BirthInfoPage />} />
          <Route path="/master/content/:id" element={<MasterContentDetailWrapper />} />
          <Route path="/free/content/:id" element={<FreeContentDetailWrapper />} />
          <Route path="/saju/input" element={<SajuInputPageWrapper />} />
          <Route path="/saju/management" element={<SajuManagementPageWrapper />} />
          <Route path="/saju/add" element={<SajuAddPageWrapper />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/free-loading" element={<FreeContentLoading />} />
          <Route path="/result" element={<UnifiedResultPage />} /> {/* ⭐ 통합 결과 페이지 */}
          <Route path="/result/saju" element={<ResultSajuRedirect />} /> {/* ⭐ 알림톡 템플릿 호환성 (리다이렉트) */}
          <Route path="/tarot/shuffle" element={<TarotShufflePage />} /> {/* ⭐ 타로 셔플 페이지 */}
          <Route path="/test/tarot" element={<TestTarotPage />} /> {/* ⭐ 테스트용 타로 셔플 (로그인 불필요) */}
          {/* ⭐ 테스트용 Figma 컴포넌트 라우트 */}
          <Route path="/test/check-record-me" element={<CheckRecordMe />} />
          <Route path="/test/receive-my-analysis" element={<ReceiveMyAnalysis onClose={() => {}} onSave={() => {}} phoneNumber="" setPhoneNumber={() => {}} />} />
          <Route path="/test/my-report-list" element={<MyReportList />} />
          <Route path="/test/my-report-weekly" element={<MyReportList />} /> {/* MyReportList가 전체 화면 렌더링 */}
          <Route path="/test/my-report-empty" element={<MyReportList forceEmptyState={true} />} />
          <Route path="/test/nadaum-tags" element={<NadaumTags onBack={() => {}} />} />
          <Route path="/test/nadaum-tags-list" element={<NadaumTagsList onBack={() => {}} />} />
          <Route path="/test/report-weekly-detail" element={<ReportWeeklyDetail onBack={() => {}} />} />
          <Route path="/test/report-weekly-tarot" element={<ReportWeeklyTarot />} />
          <Route path="/test/report-weekly-tarot-result" element={<ReportWeeklyTarotResult />} />
          <Route path="/test/report-weekly-mind-care" element={<ReportWeeklyMindCare />} />
          <Route path="/test/report-weekly-memo" element={<ReportWeeklyMemo />} />
          <Route path="/test/report-weekly-memo-edit" element={<ReportWeeklyMemoEdit initialText="" onCancel={() => {}} onSave={() => {}} />} />
          <Route path="/test/completion-coupon" element={<CompletionCoupon />} />
          <Route path="/signup/terms" element={<TermsPageWrapper />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/welcome-coupon" element={<WelcomeCouponPageWrapper />} />
          <Route path="/result/complete" element={<ResultCompletePage />} />
          <Route path="/alimtalk/input" element={<AlimtalkInfoInputPageWrapper />} /> {/* ⭐ 알림톡 정보 입력 */}
          {/* TarotDemo 백업됨 */}

          {/* ⭐ 공통 에러 페이지 라우트 (DEV 확인용) */}
          <Route path="/error/404" element={<ErrorPage type="404" />} />
          <Route path="/error/500" element={<ErrorPage type="500" />} />
          <Route path="/error/503" element={<ErrorPage type="503" />} />
          <Route path="/error/network" element={<ErrorPage type="network" />} />
          
          {/* ⭐ 404 처리: 존재하지 않는 모든 라우트 */}
          <Route path="*" element={<ErrorPage type="404" />} />
        </Routes>
        <Toaster 
          position="bottom-center"
          visibleToasts={1}
          offset={0}
          toastOptions={{
            unstyled: true,
            className: 'toast-viewport-center',
          }}
        />
        </ErrorBoundary>
      </Router>
    </HelmetProvider>
  );
}