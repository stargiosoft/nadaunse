import { useEffect, useState, useRef, useCallback } from 'react';
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
import MansePage from './components/MansePage';
import StatsDashboard from './components/StatsDashboard'; // ⭐ 통계 대시보드
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
import { freeContentService, type MasterContent } from './lib/freeContentService'; // ⭐ 무료 콘텐츠 캐시 체크
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
import AlimtalkInfoInputPage from './components/AlimtalkInfoInputPage'; // ⭐ 알림톡 정보 입력 페이지
import BlogListPage from './components/BlogListPage'; // ⭐ 블로그 목록
import BlogDetailPage from './components/BlogDetailPage'; // ⭐ 블로그 상세
import ErrorPage from './components/ErrorPage'; // ⭐ 공통 에러 페이지
import { SessionExpiredDialog } from './components/SessionExpiredDialog'; // ⭐ 로그인 필요 다이얼로그
import ErrorBoundary from './components/ErrorBoundary'; // ⭐ 에러 바운더리
import { PageLoader } from './components/ui/PageLoader'; // ⭐ 공통 로딩 컴포넌트
import { LoadingWithMessage } from './components/ui/LoadingWithMessage'; // ⭐ 로딩 + 메시지
import HomePage from './pages/HomePage';
import TestTarotPage from './pages/TestTarotPage'; // ⭐ 테스트용 타로 페이지
import EmailAuthPage from './pages/EmailAuthPage'; // ⭐ AI 테스트용 이메일 인증 페이지
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
import ReportWeeklyMemoQuickEdit from './components/ReportWeeklyMemoQuickEdit';
import CompletionCoupon from './components/CompletionCoupon';
import AuthCallback from './pages/AuthCallback';
import SproutChargingStation from './components/SproutChargingStation'; // ⭐ 새싹 충전소
import ShareRewardInfoPage from './components/ShareRewardInfoPage'; // ⭐ 공유 새싹 지급 안내
import { useSproutBalance, writeSproutBalanceCache } from './hooks/useSproutBalance'; // ⭐ 새싹 잔액 훅
// TarotDemo 백업됨 (TarotFlowPage 제거로 인해)
import { allProducts } from './data/products';
import { initGA, trackPageView } from './utils/analytics';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';
import { toast } from './lib/toast'; // ⭐ 커스텀 토스트 (subtitle 지원)
import { prefetchZodiacImages } from './lib/zodiacUtils'; // 🔥 이미지 프리페칭
import { preloadLoadingPageImages } from './lib/imagePreloader'; // ⭐ 로딩 페이지 이미지 프리로드
import { DEV } from './lib/env'; // ⭐ 프로덕션 환경 체크
import { clearUserCaches, recordTodayVisit } from './lib/auth'; // ⭐ 캐시 삭제 + 방문 기록 함수
import { initTestMode, isTestMode } from './lib/testAuth'; // 🧪 TestSprite 테스트 모드
import { projectId } from './utils/supabase/info'; // ⚡ Edge Function warm-up용
import { captureReferralFromUrl } from './lib/shareRewardService'; // 🔗 공유 리워드 레퍼럴 캡처

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

// ⭐ iOS Safari: 홈에서 새로고침 시 히스토리 버퍼 초기화 (스와이프 뒤로가기 보호)
if (window.location.pathname === '/') {
  sessionStorage.removeItem('homepage_history_initialized');
  sessionStorage.removeItem('navigatedFromHome');
}

/**
 * 직접 링크 진입 시 브라우저 뒤로가기 보호
 * - 외부 링크(카카오톡, 구글 등)로 콘텐츠 상세 페이지에 바로 진입하면
 *   브라우저 히스토리에 나다운세 홈(/)이 없어서 뒤로가기 시 앱 밖으로 나감
 * - 앱 최초 로드 시 홈(/)이 아닌 페이지에 진입하면 히스토리에 /를 삽입
 * - 결과: [외부, /detail/xxx] → [외부, /, /detail/xxx]
 *         브라우저 뒤로가기 → 홈 페이지로 이동 (앱 밖으로 나가지 않음)
 */
function DirectEntryHistoryGuard() {
  const { pathname, search, hash } = useLocation();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    // 홈페이지로 진입한 경우 처리 불필요
    if (pathname === '/') return;

    // 이미 처리된 세션이면 스킵 (같은 탭에서 새로고침 시)
    if (sessionStorage.getItem('nadaunse_history_guard')) return;
    sessionStorage.setItem('nadaunse_history_guard', 'true');

    // 히스토리 스택에 홈(/)을 현재 페이지 앞에 삽입
    // ⭐ React Router state 보존 필수 (null 사용 시 React Router 내부 추적 깨짐)
    const currentState = window.history.state;
    const currentUrl = pathname + search + hash;
    window.history.replaceState(currentState, '', '/');
    window.history.pushState(currentState, '', currentUrl);

    console.log('🛡️ [DirectEntryGuard] 히스토리에 홈(/) 삽입:', currentUrl);
  }, [pathname, search, hash]);

  return null;
}

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
      // ⭐ 태그 저장 토스트 플래그 먼저 확인 (무료 운세 → 회원가입 플로우)
      const showTagSavedToast = sessionStorage.getItem('show_tag_saved_toast');

      if (showTagSavedToast === 'true') {
        sessionStorage.removeItem('show_tag_saved_toast');

        toast.success('태그가 저장됐어요!', {
          subtitle: '프로필에서 확인할 수 있어요',
          duration: 3000,
        });

        console.log('🎉 [Toast] 태그 저장 토스트 표시');
        return; // 태그 저장 토스트를 표시했으면 로그인 토스트는 표시하지 않음
      }

      // sessionStorage에서 로그인 토스트 플래그 확인
      const showLoginToast = sessionStorage.getItem('show_login_toast');

      console.log('🔍 [LoginToast] 플래그 체크:', showLoginToast, 'pathname:', location.pathname);

      if (showLoginToast === 'true') {
        // 플래그 즉시 삭제 (중복 표시 방지)
        sessionStorage.removeItem('show_login_toast');

        // 토스트 표시 (2.2초간) - toast 래퍼 사용 (unstyled: true 포함으로 auto-dismiss 보장)
        toast.success('로그인 되었어요, 반가워요', { duration: 2200 });

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
        '/profile/nadaum-tags': '나다움 태그',
        '/purchase-history': '이용 기록',
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
        '/pending-tags-check': '태그 확인 중',
        '/paid/tag-loading': '태그 추출 중',
        '/master/content': '콘텐츠 관리',
        '/master/stats': '통계 대시보드',
        '/master/content/create': '콘텐츠 생성',
        '/master/content/create/questions': '질문 작성',
        '/error/404': '페이지를 찾을 수 없음',
        '/error/500': '서버 오류',
        '/error/503': '서비스 점검 중',
        '/error/network': '네트워크 오류',
        // 주간 보고서 페이지
        '/my-report-list': '보고서 리스트',
        '/manse': '만세력',
        '/blog': '운세 콘텐츠',
        '/share-reward-info': '공유 새싹 지급 안내',
      };

      // 정적 라우트 확인
      if (staticRoutes[pathname]) {
        return `${staticRoutes[pathname]} | ${BASE_TITLE}`;
      }

      // 동적 라우트 패턴 매칭
      if (pathname.startsWith('/product/') && pathname.endsWith('/tag-loading')) {
        return `태그 추출 중 | ${BASE_TITLE}`;
      }
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
      // 나다움 기록하기 페이지 (유료/무료 구분)
      if (pathname === '/paid/nadaum-record') {
        return `[유료] 나다움 기록하기 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/nadaum-record/')) {
        return `[무료] 나다움 기록하기 | ${BASE_TITLE}`;
      }

      // 주간 보고서 페이지 (동적 라우트)
      if (pathname.startsWith('/report-weekly-detail/')) {
        return `보고서 시작 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/report-weekly-tarot-result/')) {
        return `보고서 타로 결과 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/report-weekly-tarot/')) {
        return `보고서 타로 셔플 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/report-weekly-mind-care/')) {
        return `보고서 마음처방 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/report-weekly-memo/')) {
        return `보고서 나 응원하기 | ${BASE_TITLE}`;
      }
      if (pathname.startsWith('/report-completion/')) {
        return `보고서 완료/쿠폰 | ${BASE_TITLE}`;
      }
      if (pathname.includes('/cheer-edit')) {
        return `나 응원하기 수정 | ${BASE_TITLE}`;
      }

      // 블로그 상세 페이지 (/blog/:slug)
      if (pathname.startsWith('/blog/')) {
        return `운세 콘텐츠 | ${BASE_TITLE}`;
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
    // ⭐ /result 경로는 UnifiedResultPage에서 orderId당 최초 1회만 트래킹 (중복 방지)
    // ⭐ /product/:id/result/free 경로는 FreeResultPage에서 recordId당 최초 1회만 트래킹 (중복 방지)
    const isFreeResultPage = location.pathname.includes('/result/free');
    if (location.pathname !== '/result' && !isFreeResultPage) {
      trackPageView(location.pathname + location.search, pageTitle);
    }
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
        onBack={() => navigate('/', { replace: true })}
        onHome={() => navigate('/', { replace: true })}
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
        onBack={() => navigate('/', { replace: true })}
        onHome={() => navigate('/', { replace: true })}
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
  const location = useLocation();
  const loginAuth = useLoginRequired();

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

  // ⭐ 로그인 체크 (모든 hooks 이후에 조기 반환)
  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // ⭐ PG 리다이렉트에서 뒤로가기로 복귀한 경우 → 상품 상세로 이동 (모바일 다날 PG 루프 방지)
  const pgRedirectPath = sessionStorage.getItem('pg_payment_in_progress');
  if (pgRedirectPath) {
    sessionStorage.removeItem('pg_payment_in_progress');
    console.log('🛡️ [PaymentNewPage] PG 리다이렉트 복귀 감지 → 상품 상세로 이동:', pgRedirectPath);
    // location.replace로 forward 히스토리(PG 중간 페이지)도 정리
    window.location.replace(pgRedirectPath);
    return null;
  }
  // ⭐ 로그인 상태에서 중간 경로 직접 접속 시 홈으로 리다이렉트
  if (location.key === 'default') return <Navigate to="/" replace />;

  if (isLoading) {
    return <PageLoader />;
  }

  // ⭐ allProducts에서 찾지 못한 경우 (UUID인 경우)는 contentId만 전달
  // PaymentNew 컴포넌트가 master_contents에서 직접 가격 정보를 조회함
  if (!product) {
    return (
      <PaymentNew
        contentId={id}
        onBack={() => navigate(-1)}
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
              const { data: mySajuList } = await supabase
                .from('saju_records')
                .select('*')
                .eq('user_id', user.id);

              hasSaju = mySajuList && mySajuList.length > 0;
              console.log('🔍 [PaymentNew→onPurchase] API 쿼리 결과:', { hasSaju, count: mySajuList?.length });

              // ⭐ 사주 캐시 미리 저장 (프로필 페이지 플래시 방지)
              if (hasSaju && mySajuList) {
                const primary = mySajuList.find((s: Record<string, unknown>) => s.is_primary) || mySajuList[0];
                localStorage.setItem('primary_saju', JSON.stringify(primary));
                localStorage.setItem('saju_records_cache', JSON.stringify(mySajuList));
                console.log('🚀 [onPurchase] 사주 캐시 미리 저장:', primary.name || primary.id);
              }
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
        const { data: mySajuList } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id);

        hasSaju = mySajuList && mySajuList.length > 0;
        console.log('🔍 [handlePurchaseComplete] API 쿼리 결과:', { hasSaju, count: mySajuList?.length });

        // ⭐ 사주 캐시 미리 저장 (프로필 페이지 플래시 방지)
        if (hasSaju && mySajuList) {
          const primary = mySajuList.find((s: Record<string, unknown>) => s.is_primary) || mySajuList[0];
          localStorage.setItem('primary_saju', JSON.stringify(primary));
          localStorage.setItem('saju_records_cache', JSON.stringify(mySajuList));
          console.log('🚀 [handlePurchaseComplete] 사주 캐시 미리 저장:', primary.name || primary.id);
        }
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
      onBack={() => navigate(-1)}
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
          }
        } catch (err) {
          console.error('❌ [BirthInfoPage] 마스터 콘텐츠 조회 중 예외 발생:', err);
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

  // ⭐ 상품 로딩 중
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

  // ⭐️ 무료 콘텐츠 → 로그인 체크 없이 바로 FreeBirthInfoInput
  if (product.type === 'free') {
    console.log('✅ [BirthInfoPage] 무료 콘텐츠 → FreeBirthInfoInput 렌더링');
    return (
      <FreeBirthInfoInput
        productId={id || ''}
        onBack={goBack}
      />
    );
  }

  // ⭐️ 유료 콘텐츠 → 로그인 필수
  return <PaidBirthInfoContent id={id} product={product} goBack={goBack} />;
}

// ⭐ 유료 콘텐츠 전용 래퍼 (useLoginRequired 훅 사용)
function PaidBirthInfoContent({ id, product, goBack }: { id: string | undefined; product: Product; goBack: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // ⭐ 로그인 상태에서 중간 경로 직접 접속 시 홈으로 리다이렉트
  if (location.key === 'default') return <Navigate to="/" replace />;

  console.log('✅ [BirthInfoPage] 유료 콘텐츠 → BirthInfoInput 렌더링');
  return (
    <BirthInfoInput
      productId={id || ''}
      onBack={goBack}
      onComplete={(recordId: string, userName?: string) => {
        navigate(`/product/${id}/result`, { state: { recordId, userName } });
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
  
  // ⭐️ resultKey (localStorage 키)를 우선 사용
  // - FreeContentLoading에서 온 경우: resultKey 있음 → localStorage에서 읽기
  // - 운세 기록에서 진입: resultKey 없음, recordId만 있음 → DB에서 읽기
  const resultKey = location.state?.resultKey;
  let recordId = resultKey || location.state?.recordId;
  const userName = location.state?.userName;
  const contentId = location.state?.contentId || id;
  const productFromState = location.state?.product;  // ⭐ FreeContentLoading에서 전달받은 product
  const contentAnswersFromState = location.state?.contentAnswers;  // ⭐ 백그라운드 태그 추출용
  const fromPurchaseHistory = location.state?.fromPurchaseHistory === true;  // ⭐ 운세 기록에서 진입 여부
  const hasConfirmedTags = location.state?.hasConfirmedTags === true;  // ⭐ 이미 태그 확정됨 (나다움 기록하기 스킵)
  // ⭐ DB 레코드 ID (free_content_records.id) - 각 운세 결과별 태그 구분용
  const freeRecordId = location.state?.recordId as string | undefined;

  // ⭐ 나다움 기록하기용 태그 (백그라운드 추출)
  const [tags, setTags] = useState<{ name: string; type: 'positive' | 'negative' | 'neutral' }[] | undefined>(undefined);
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [isTagExtracted, setIsTagExtracted] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(false);  // ⭐ '다음' 클릭 후 태그 대기 중

  // 📊 GA 이벤트: 무료 결과 조회 (recordId당 최초 1회만 page_view 전송)
  useEffect(() => {
    // recordId가 없으면 스킵 (DB 조회 모드에서 처리)
    if (!recordId || !id) return;

    const viewedRecordsKey = 'viewed_free_result_records';
    const viewedRecords: string[] = JSON.parse(localStorage.getItem(viewedRecordsKey) || '[]');
    const recordKey = `${id}_${recordId}`;  // contentId + recordId 조합으로 유니크 키 생성

    if (!viewedRecords.includes(recordKey)) {
      // ⭐ 최초 조회 시에만 page_view 전송 (재조회 시 제외)
      trackPageView(`/product/${id}/result/free`, '무료 운세 결과 | 나다운세');
      console.log('📊 [FreeResultPage] GA page_view 전송 (최초 조회):', recordKey);

      // 조회 기록 저장 (최대 100개 유지)
      const updatedRecords = [...viewedRecords, recordKey].slice(-100);
      localStorage.setItem(viewedRecordsKey, JSON.stringify(updatedRecords));
    } else {
      console.log('📊 [FreeResultPage] GA page_view 스킵 (재조회):', recordKey);
    }
  }, [id, recordId]);

  // ⭐ 백그라운드 태그 추출 (결과 페이지 진입 시 즉시 시작)
  useEffect(() => {
    const extractTags = async () => {
      // ⭐ 이미 태그가 확정된 경우 태그 추출 스킵
      if (hasConfirmedTags) {
        console.log('✅ [FreeResultPage] 이미 태그 확정됨 → 태그 추출 스킵');
        setIsTagExtracted(true);
        return;
      }

      // ⭐ [중요] 재진입 시 DB에 태그가 있는지 먼저 확인 (확정/미확정 모두)
      // - freeRecordId가 있으면 해당 운세 결과의 태그만 조회 (각 결과별 구분)
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id && freeRecordId) {
        const { data: existingTagsForRecord, error: tagError } = await supabase
          .from('user_trait_tags')
          .select('tag_name, tag_type, is_confirmed')
          .eq('user_id', userData.user.id)
          .eq('source_order_id', freeRecordId)
          .eq('source_type', 'free_content');

        if (!tagError && existingTagsForRecord && existingTagsForRecord.length > 0) {
          // 이미 태그가 있으면 해당 태그 사용 (재추출 불필요)
          const existingTags = existingTagsForRecord.map(t => ({
            name: t.tag_name,
            type: t.tag_type as 'positive' | 'negative' | 'neutral'
          }));
          const isConfirmed = existingTagsForRecord.some(t => t.is_confirmed);
          console.log(`✅ [FreeResultPage] DB에서 기존 태그 발견 (${isConfirmed ? '확정' : '미확정'}):`, existingTags.length, `개 → API 호출 스킵 (freeRecordId: ${freeRecordId})`);
          setTags(existingTags);
          setIsTagExtracted(true);
          return;
        }
      }

      // contentAnswers가 있을 때만 태그 추출 (새 결과일 때)
      let contentAnswers = contentAnswersFromState;

      // state에 없으면 localStorage에서 읽기
      if (!contentAnswers && recordId) {
        try {
          const storedResult = localStorage.getItem(recordId);
          if (storedResult) {
            const parsed = JSON.parse(storedResult);
            // ⭐ contentAnswers가 있으면 사용, 없으면 results에서 변환
            if (parsed.contentAnswers) {
              contentAnswers = parsed.contentAnswers;
            } else if (parsed.results && parsed.results.length > 0) {
              // PurchaseHistoryPage에서 저장한 results 형식을 contentAnswers로 변환
              contentAnswers = parsed.results.map((r: { questionText: string; previewText: string }) => ({
                questionText: r.questionText,
                answerText: r.previewText
              }));
              console.log('🔄 [FreeResultPage] results → contentAnswers 변환 완료:', contentAnswers.length, '개');
            }
          }
        } catch (err) {
          console.error('❌ [FreeResultPage] localStorage contentAnswers 읽기 실패:', err);
        }
      }

      if (!contentAnswers || contentAnswers.length === 0) {
        console.log('ℹ️ [FreeResultPage] contentAnswers 없음 → 태그 추출 스킵');
        setIsTagExtracted(true);  // 추출 완료로 처리 (빈 태그)
        return;
      }

      console.log('🏷️ [FreeResultPage] 백그라운드 태그 추출 시작...');
      setIsTagLoading(true);

      try {
        // ⭐ 사용자의 기존 태그 조회 (중복 방지용)
        let existingTags: string[] = [];
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: existingTagsData } = await supabase
            .from('user_trait_tags')
            .select('tag_name')
            .eq('user_id', userData.user.id);

          if (existingTagsData && existingTagsData.length > 0) {
            existingTags = existingTagsData.map(t => t.tag_name);
            console.log('📌 [FreeResultPage] 기존 태그 조회:', existingTags.length, '개');
          }
        }

        // ⭐ rejected_tags 조회 (users 테이블)
        let rejectedTags: string[] = [];
        if (userData?.user?.id) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('rejected_tags')
            .eq('id', userData.user.id)
            .single();
          rejectedTags = userRecord?.rejected_tags || [];
          if (rejectedTags.length > 0) {
            console.log('🚫 [FreeResultPage] rejected_tags 조회:', rejectedTags.length, '개');
          }
        }

        const tagResponse = await supabase.functions.invoke('extract-trait-tags', {
          body: {
            contentAnswers: contentAnswers,
            existingTags,
            rejectedTags
          }
        });

        if (tagResponse.error) {
          console.error('❌ [FreeResultPage] 태그 추출 API 오류:', tagResponse.error);
        } else if (tagResponse.data?.success && tagResponse.data?.tags) {
          const extractedTags = tagResponse.data.tags;
          console.log('✅ [FreeResultPage] 백그라운드 태그 추출 완료:', extractedTags);
          setTags(extractedTags);

          // localStorage에도 태그 저장
          if (recordId) {
            try {
              const storedResult = localStorage.getItem(recordId);
              if (storedResult) {
                const parsed = JSON.parse(storedResult);
                parsed.tags = extractedTags;
                localStorage.setItem(recordId, JSON.stringify(parsed));
                console.log('💾 [FreeResultPage] localStorage에 태그 저장 완료');
              }
            } catch (err) {
              console.error('❌ [FreeResultPage] localStorage 태그 저장 실패:', err);
            }
          }

          // ⭐ DB에 즉시 저장 (is_confirmed: false) - 나중에 태그 선택 시 확정
          // freeRecordId로 각 운세 결과별 구분 (source_order_id에 저장)
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.id && freeRecordId) {
            try {
              // 해당 운세 결과의 기존 임시 태그 삭제 (중복 방지)
              await supabase
                .from('user_trait_tags')
                .delete()
                .eq('user_id', userData.user.id)
                .eq('source_order_id', freeRecordId)
                .eq('source_type', 'free_content')
                .eq('is_confirmed', false);

              // 새 태그 INSERT
              const { error: insertError } = await supabase
                .from('user_trait_tags')
                .insert(
                  extractedTags.map((tag: { name: string; type: string }) => ({
                    user_id: userData.user.id,
                    tag_name: tag.name,
                    tag_type: tag.type,
                    source_type: 'free_content',
                    source_content_id: contentId,
                    source_order_id: freeRecordId,  // ⭐ 각 운세 결과별 구분
                    is_confirmed: false
                  }))
                );

              if (insertError) {
                console.warn('⚠️ [FreeResultPage] 태그 DB 저장 실패:', insertError);
              } else {
                console.log('💾 [FreeResultPage] 태그 DB 저장 완료 (freeRecordId:', freeRecordId, ')');
              }
            } catch (dbError) {
              console.warn('⚠️ [FreeResultPage] 태그 DB 저장 예외:', dbError);
            }
          }
        }
      } catch (tagError) {
        console.error('❌ [FreeResultPage] 태그 추출 실패:', tagError);
      } finally {
        setIsTagLoading(false);
        setIsTagExtracted(true);
      }
    };

    extractTags();
  }, [contentAnswersFromState, recordId, hasConfirmedTags]);

  // ⭐ 태그 추출 완료 후 pendingNavigation이 true면 자동 이동
  useEffect(() => {
    if (pendingNavigation && isTagExtracted && id) {
      // ⭐ 이미 태그를 확정한 경우 → 나다움 기록하기 스킵
      if (hasConfirmedTags) {
        console.log('✅ [FreeResultPage] 이미 태그 확정됨 → 나다움 기록하기 스킵');
        if (fromPurchaseHistory) {
          navigate('/purchase-history', { state: { activeTab: 'free' } });
        } else {
          navigate('/');
        }
        return;
      }
      console.log('🔀 [FreeResultPage] 태그 추출 완료 → 나다움 기록하기로 이동');
      navigate(`/nadaum-record/${id}`, { state: { tags, freeRecordId, resultKey } });
    }
  }, [pendingNavigation, isTagExtracted, id, tags, navigate, hasConfirmedTags, fromPurchaseHistory, freeRecordId, resultKey]);

  // ⭐ '다음' 버튼 클릭 핸들러
  const handleNext = () => {
    console.log('🔘 [FreeResultPage] handleNext 호출됨');
    console.log('  - hasConfirmedTags:', hasConfirmedTags);
    console.log('  - isTagExtracted:', isTagExtracted);
    console.log('  - fromPurchaseHistory:', fromPurchaseHistory);
    console.log('  - tags:', tags);

    // ⭐ 이미 태그를 확정한 경우 (운세 기록에서 재진입) → 나다움 기록하기 스킵
    if (hasConfirmedTags) {
      console.log('✅ [FreeResultPage] 이미 태그 확정됨 → 나다움 기록하기 스킵');
      if (fromPurchaseHistory) {
        // 운세 기록에서 진입한 경우 → 운세 기록으로 복귀
        navigate('/purchase-history', { state: { activeTab: 'free' } });
      } else {
        // 그 외 → 홈으로 이동
        navigate('/');
      }
      return;
    }

    if (isTagExtracted) {
      // 태그 추출 완료 → 바로 이동
      console.log('🔀 [FreeResultPage] 태그 완료됨 → 바로 이동');
      console.log('  - 이동 경로: /nadaum-record/' + id);
      console.log('  - tags:', tags);
      console.log('  - tags 개수:', tags?.length || 0);
      console.log('  - freeRecordId:', freeRecordId);
      navigate(`/nadaum-record/${id}`, { state: { tags, freeRecordId, resultKey } });
    } else {
      // 태그 추출 중 → 로딩 페이지로 이동
      console.log('⏳ [FreeResultPage] 태그 추출 중 → 로딩 페이지로 이동');
      navigate(`/product/${id}/tag-loading`, {
        state: {
          contentAnswers: contentAnswersFromState,
          userName: userName,
          freeRecordId  // ⭐ 각 운세 결과별 구분용
        }
      });
    }
  };

  // ⭐️ DB 조회 모드 (운세 기록 페이지에서 진입 시)
  const fromDB = location.state?.fromDB === true;
  const dbRecordId = fromDB ? recordId : undefined;  // fromDB 모드에서 recordId는 DB ID
  const isNewResult = location.state?.isNewResult === true;  // ⭐ 새로 생성된 결과 (나다움 기록하기 버튼 표시)

  // ⭐ resultKey 없이 접근 시 DB에서 최근 결과 조회 (로그인 사용자)
  const [dbResult, setDbResult] = useState<any>(null);
  const [isLoadingDbResult, setIsLoadingDbResult] = useState(false);

  useEffect(() => {
    const fetchDbResult = async () => {
      // resultKey가 있거나 fromDB 모드면 스킵
      if (recordId || fromDB || !id) return;

      // 로그인 사용자 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log('⚠️ [FreeResultPage] 비로그인 + resultKey 없음 → 콘텐츠 상세로 이동');
        navigate(`/product/${id}`, { replace: true });
        return;
      }

      // DB에서 최근 결과 조회
      setIsLoadingDbResult(true);
      console.log('🔍 [FreeResultPage] DB에서 최근 결과 조회 중...');

      const { data: recentRecord, error } = await supabase
        .from('free_content_records')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('content_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setIsLoadingDbResult(false);

      if (error || !recentRecord) {
        console.log('⚠️ [FreeResultPage] DB 결과 없음 → 콘텐츠 상세로 이동');
        navigate(`/product/${id}`, { replace: true });
        return;
      }

      console.log('✅ [FreeResultPage] DB에서 최근 결과 조회 완료:', recentRecord.id);
      setDbResult(recentRecord);

      // 📊 GA 이벤트: DB 조회 결과도 최초 1회만 page_view 전송
      const viewedRecordsKey = 'viewed_free_result_records';
      const viewedRecords: string[] = JSON.parse(localStorage.getItem(viewedRecordsKey) || '[]');
      const recordKey = `${id}_${recentRecord.id}`;

      if (!viewedRecords.includes(recordKey)) {
        trackPageView(`/product/${id}/result/free`, '무료 운세 결과 | 나다운세');
        console.log('📊 [FreeResultPage] GA page_view 전송 (DB 조회 - 최초):', recordKey);

        const updatedRecords = [...viewedRecords, recordKey].slice(-100);
        localStorage.setItem(viewedRecordsKey, JSON.stringify(updatedRecords));
      } else {
        console.log('📊 [FreeResultPage] GA page_view 스킵 (DB 조회 - 재조회):', recordKey);
      }
    };

    fetchDbResult();
  }, [recordId, id, fromDB, navigate]);

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
  const [recommendedPaidContent, setRecommendedPaidContent] = useState<MasterContent | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      // ⭐️ product가 이미 있으면 product 조회만 스킵, 추천 콘텐츠는 조회
      if (initialProduct) {
        console.log('✅ [FreeResultPage] product 이미 있음 → product 조회 스킵:', initialProduct);
        console.log('  - 출처:', productFromState ? 'FreeContentLoading state' : 'allProducts');

        // ⭐ 추천 콘텐츠 조회
        try {
          const { freeContentService } = await import('./lib/freeContentService');
          const [recommended, paidRec] = await Promise.all([
            freeContentService.fetchRecommendedContents(initialProduct.id),
            (async () => {
              const { data: { session } } = await supabase.auth.getSession();
              return freeContentService.fetchRecommendedPaidContent(initialProduct.id, session?.user?.id);
            })()
          ]);
          console.log('✅ [FreeResultPage] 추천 콘텐츠 로드 (initialProduct):', recommended.length, '개');

          const formattedRecommended = recommended.map(content => ({
            id: content.id,
            title: content.title,
            type: content.content_type as 'free' | 'paid',
            image: content.thumbnail_url || '',
            created_at: (content as MasterContent & { created_at?: string }).created_at || ''
          }));

          setRecommendedContents(formattedRecommended);
          setRecommendedPaidContent(paidRec);
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
            const { data: { session } } = await supabase.auth.getSession();
            const [recommended, paidRec] = await Promise.all([
              freeContentService.fetchRecommendedContents(data.id),
              freeContentService.fetchRecommendedPaidContent(data.id, session?.user?.id)
            ]);
            console.log('✅ [FreeResultPage] 추천 콘텐츠 로드:', recommended.length, '개');

            // FreeSajuDetail 형식에 맞게 변환
            const formattedRecommended = recommended.map(content => ({
              id: content.id,
              title: content.title,
              type: content.content_type as 'free' | 'paid',
              image: content.thumbnail_url || '',
              created_at: (content as MasterContent & { created_at?: string }).created_at || ''
            }));

            setRecommendedContents(formattedRecommended);
            setRecommendedPaidContent(paidRec);
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

  // ⭐ 로딩 조건 통합: product 로딩 또는 DB 조회 필요 시
  // state 없이 진입한 경우 (뒤로가기 등) dbResult가 설정될 때까지 한 번만 로딩
  const needsDbLookup = !recordId && !fromDB;
  if (isLoading || (needsDbLookup && !dbResult)) {
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
  
  // ⭐️ recordId 없으면 에러 (fromDB 모드 또는 dbResult가 있을 때는 예외)
  // fromDB 모드에서는 dbRecordId로 DB 조회, dbResult가 있으면 그걸로 조회
  // ※ DB 조회 로딩은 위에서 통합 처리됨 (needsDbLookup && !dbResult)
  if (!recordId && !fromDB && !dbResult) {
    console.error('❌ [FreeResultPage] recordId (resultKey) 없음');
    console.error('  - id:', id);
    console.error('  - recordId:', recordId);
    console.error('  - fromDB:', fromDB);
    console.error('  - dbResult:', dbResult);

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

  // ⭐ dbResult가 있으면 fromDB 모드처럼 처리
  const effectiveFromDB = fromDB || !!dbResult;
  const effectiveDbRecordId = dbRecordId || dbResult?.id;

  console.log('✅ [FreeResultPage] FreeSajuDetail 렌더링');
  console.log('📌 [FreeResultPage] recordId 전달:', recordId);
  console.log('📌 [FreeResultPage] fromDB:', fromDB);
  console.log('📌 [FreeResultPage] effectiveFromDB:', effectiveFromDB);
  console.log('📌 [FreeResultPage] dbRecordId:', dbRecordId);
  console.log('📌 [FreeResultPage] effectiveDbRecordId:', effectiveDbRecordId);
  console.log('📌 [FreeResultPage] productImage:', product.image);
  console.log('📌 [FreeResultPage] product:', product);
  console.log('📌 [FreeResultPage] hasConfirmedTags:', hasConfirmedTags);
  console.log('📌 [FreeResultPage] fromPurchaseHistory:', fromPurchaseHistory);
  console.log('📌 [FreeResultPage] isTagExtracted:', isTagExtracted);
  console.log('📌 [FreeResultPage] nextLabel:', hasConfirmedTags ? '완료' : '다음');

  // ⭐ X 버튼 클릭 시 이동 경로 결정
  const handleClose = () => {
    if (fromPurchaseHistory) {
      // 운세 기록에서 진입한 경우 → 운세 기록 무료 체험판 탭으로 복귀
      navigate('/purchase-history', { state: { activeTab: 'free' } });
    } else {
      // 일반 진입 → 홈으로 이동
      navigate('/');
    }
  };

  return (
    <FreeSajuDetail
      recordId={recordId || ''}  // fromDB 모드에서도 빈 문자열 전달 (required prop)
      userName={userName || dbResult?.saju_name}
      productTitle={product.title}
      productImage={product.image}
      contentId={id}
      onClose={handleClose}
      recommendedPaidContent={recommendedPaidContent}
      onUserIconClick={() => navigate('/profile')}
      fromDB={effectiveFromDB}
      dbRecordId={effectiveDbRecordId}
      dbData={dbResult}  // ⭐ 이미 로드된 DB 데이터 전달 (이중 조회 방지)
      onNext={id ? handleNext : undefined}  // ⭐ 무료 콘텐츠면 항상 나다움 기록하기 버튼 표시 (재조회 시에도)
      nextLabel={hasConfirmedTags ? '완료' : '다음'}  // ⭐ 태그 확정 여부에 따라 버튼 레이블 변경
      isNextLoading={false}  // ⭐ 태그 추출 중이면 로딩 페이지로 이동 (버튼 스피너 표시 안 함)
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

// ⭐ 새싹 충전소 페이지 Wrapper
function SproutChargingStationPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const loginAuth = useLoginRequired();
  const { balance, loading: balanceLoading } = useSproutBalance();
  const [isDeducting, setIsDeducting] = useState(false);

  // ⭐ PortOne 모바일 결제 리다이렉트 감지
  const searchParams = new URLSearchParams(location.search);
  const impUid = searchParams.get('imp_uid');
  const isPaymentRedirect = !!impUid;

  // 로그인 체크
  if (loginAuth === 'checking' || balanceLoading) return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // 직접 접속 가드 (⭐ 결제 리다이렉트 시에는 허용)
  if (location.key === 'default' && !isPaymentRedirect) return <Navigate to="/" replace />;

  // ⭐ 결제 실패 리다이렉트 처리
  if (isPaymentRedirect && searchParams.get('imp_success') !== 'true') {
    const isFromProfile = contentId === 'profile';
    return <Navigate to={isFromProfile ? '/profile' : '/'} replace />;
  }

  const isFromProfile = contentId === 'profile';
  const requiredAmount = (location.state as { requiredAmount?: number })?.requiredAmount || 30;

  const handleChargeComplete = async (newBalance: number) => {
    // 충전 후 잔액 캐시 즉시 갱신
    writeSproutBalanceCache(newBalance);

    if (!contentId || isFromProfile) {
      navigate('/profile', { replace: true });
      toast.success('충전되었어요.');
      return;
    }

    // 충전 후 잔액이 필요량 이상이면 차감 → 사주 플로우 이동
    if (newBalance >= requiredAmount) {
      setIsDeducting(true);
      // 사주 보유 여부를 차감 전에 미리 판단 (캐시 활용)
      const sajuCacheJson = localStorage.getItem('saju_records_cache');
      let hasSajuFromCache: boolean | null = null;
      if (sajuCacheJson) {
        try {
          hasSajuFromCache = JSON.parse(sajuCacheJson).length > 0;
        } catch { /* ignore */ }
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('로그인이 필요합니다. 다시 로그인해주세요.');
          return;
        }

        const userId = session.user.id;

        // 네트워크 호출 병렬화: 차감 + 제목 + (캐시 미스 시 사주 조회) 동시 실행
        const deductPromise = fetch(`https://${projectId}.supabase.co/functions/v1/sprout-deduct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            content_id: contentId,
            amount: requiredAmount,
          }),
        }).then(r => r.json());

        const titlePromise = supabase
          .from('master_contents')
          .select('title')
          .eq('id', contentId)
          .single();

        const sajuPromise = hasSajuFromCache === null
          ? supabase.from('saju_records').select('*').eq('user_id', userId)
          : null;

        const [result, titleResult, sajuResult] = await Promise.all([
          deductPromise,
          titlePromise,
          sajuPromise,
        ]);

        if (!result.success) {
          console.error('❌ [SproutChargingStationPage] 차감 실패:', result);
          alert('새싹 차감에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        if (result.new_balance != null) {
          writeSproutBalanceCache(result.new_balance);
        }

        console.log('✅ [SproutChargingStationPage] 차감 성공 → 주문 생성 시작');

        // 주문 생성 (차감 + 제목 완료 후)
        const merchantUid = `order_${Date.now()}`;
        const gname = titleResult.data?.title || '운세 구성';
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            content_id: contentId,
            merchant_uid: merchantUid,
            paid_amount: requiredAmount,
            pay_method: 'sprout',
            pg_provider: 'sprout',
            pstatus: 'completed',
            success: true,
            gname,
          })
          .select('id')
          .single();

        if (orderError || !orderData) {
          console.error('❌ [SproutChargingStationPage] 주문 생성 실패:', orderError);
          alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
          return;
        }
        localStorage.setItem('pendingOrderId', orderData.id);
        console.log('✅ 주문 생성 완료:', orderData.id);

        let hasSaju = hasSajuFromCache ?? false;
        if (sajuResult) {
          const mySajuList = sajuResult.data;
          hasSaju = mySajuList ? mySajuList.length > 0 : false;
          if (hasSaju && mySajuList) {
            const primary = mySajuList.find((s: Record<string, unknown>) => s.is_primary) || mySajuList[0];
            localStorage.setItem('primary_saju', JSON.stringify(primary));
            localStorage.setItem('saju_records_cache', JSON.stringify(mySajuList));
          }
        }

        localStorage.removeItem('purchase_history_cache');
        preloadLoadingPageImages();

        if (hasSaju) {
          navigate(`/product/${contentId}/saju-select`, { replace: true });
        } else {
          navigate(`/product/${contentId}/birthinfo`, { replace: true });
        }
      } catch (err) {
        console.error('❌ [SproutChargingStationPage] 차감 처리 예외:', err);
        alert('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } else {
      // 아직 잔액 부족 (여러 번 충전 가능)
      navigate(0); // 페이지 새로고침
    }
  };

  // ⭐ 리다이렉트 결제 정보 구성
  const redirectPayment = isPaymentRedirect ? {
    impUid: impUid!,
    merchantUid: searchParams.get('merchant_uid') || '',
    packageId: searchParams.get('packageId') || '',
    payMethod: searchParams.get('payMethod') || 'card',
    pgProvider: decodeURIComponent(searchParams.get('pgProvider') || ''),
  } : undefined;

  if (isDeducting) {
    return (
      <div className="bg-white fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[440px]">
          <LoadingWithMessage message="운세 준비 중이에요!" padding="0 20px" />
        </div>
      </div>
    );
  }

  return (
    <SproutChargingStation
      contentId={contentId}
      currentBalance={balance}
      requiredAmount={requiredAmount}
      fromProfile={isFromProfile}
      onBack={() => navigate(-1)}
      onChargeComplete={handleChargeComplete}
      redirectPayment={redirectPayment}
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
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <ProfilePage
      onBack={goBack}
      onLogout={handleLogout}
      onNavigateToMasterContent={() => navigate('/master/content', { state: { canGoBack: true } })}
      onNavigateToStatsDashboard={() => navigate('/master/stats', { state: { canGoBack: true } })} // ⭐ 통계 대시보드
      onNavigateToTermsOfService={() => navigate('/terms-of-service', { state: { canGoBack: true } })}
      onNavigateToPrivacyPolicy={() => navigate('/privacy-policy', { state: { canGoBack: true } })}
      onNavigateToPurchaseHistory={() => navigate('/purchase-history', { state: { canGoBack: true } })}
      onNavigateToSajuInput={() => navigate('/saju/input', { state: { canGoBack: true } })}
      onNavigateToSajuManagement={() => navigate('/saju/management', { state: { canGoBack: true } })}
      onNavigateToManse={() => navigate('/manse', { state: { canGoBack: true } })}
      onNavigateToBlog={() => navigate('/blog', { state: { canGoBack: true } })}
    />
  );
}

// ⭐ 만세력 Wrapper
function MansePageWrapper() {
  const goBack = useGoBack('/');
  return <MansePage onBack={goBack} />;
}

// ⭐ 공유 새싹 지급 안내 Wrapper
function ShareRewardInfoPageWrapper() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  return <ShareRewardInfoPage onBack={goBack} />;
}

// ⭐ 블로그 목록 Wrapper (로그인 불필요)
function BlogListPageWrapper() {
  const navigate = useNavigate();
  const goBack = useGoBack('/');

  return (
    <BlogListPage
      onBack={goBack}
    />
  );
}

// NadaumTagsList Wrapper
function NadaumTagsListWrapper() {
  const navigate = useNavigate();
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;

  return (
    <NadaumTagsList
      onBack={() => window.history.back()}
      onHome={() => navigate('/')}
    />
  );
}

// ⭐ 나의 분석 보고서 리스트 Wrapper (로그인 필수)
function MyReportListWrapper() {
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;

  return <MyReportList />;
}

// ⭐ 사주 선택 Wrapper (로그인 필수)
function SajuSelectPageWrapper() {
  const location = useLocation();
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // ⭐ 로그인 상태에서 중간 경로 직접 접속 시 홈으로 리다이렉트
  if (location.key === 'default') return <Navigate to="/" replace />;

  return <SajuSelectPage />;
}

// ⭐ 이용 기록 Wrapper (로그인 필수)
function PurchaseHistoryPageWrapper() {
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;

  return <PurchaseHistoryPage />;
}

// ⭐ 유료 콘텐츠 로딩 Wrapper (로그인 필수)
function LoadingPageWrapper() {
  const location = useLocation();
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // ⭐ 로그인 상태에서 중간 경로 직접 접속 시 홈으로 리다이렉트
  if (location.key === 'default') return <Navigate to="/" replace />;

  return <LoadingPage />;
}

// ⭐ 통계 대시보드 Wrapper (마스터 전용)
function StatsDashboardWrapper() {
  const navigate = useNavigate();
  const masterAuth = useMasterAuth();

  if (masterAuth === 'checking') return <PageLoader />;
  if (masterAuth === 'denied') return <AccessDeniedDialog />;

  return (
    <StatsDashboard
      onBack={() => navigate(-1)}
      onHome={() => navigate('/')}
    />
  );
}

// ⭐ 로그인 후 pending_trait_tags 처리 페이지
// - 사주 정보 저장 (cached_saju_info → saju_records)
// - 무료 콘텐츠 결과 저장 (localStorage → free_content_records)
// - 태그 저장 또는 phone_number 입력 요청
function PendingTagsCheckPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // ⭐ 진입 즉시 로그인 토스트 플래그 제거 (태그 저장 토스트와 겹침 방지)
    sessionStorage.removeItem('show_login_toast');

    const processPendingTags = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          console.log('❌ [PendingTagsCheck] 세션 없음 → 홈으로 이동');
          navigate('/', { replace: true });
          return;
        }

        // pending_trait_tags 확인
        const pendingTagsJson = localStorage.getItem('pending_trait_tags');
        if (!pendingTagsJson) {
          console.log('❌ [PendingTagsCheck] pending_trait_tags 없음 → 홈으로 이동');
          navigate('/', { replace: true });
          return;
        }

        const pendingData = JSON.parse(pendingTagsJson);
        console.log('📦 [PendingTagsCheck] pending_trait_tags 발견:', pendingData);

        // ========================================
        // 1️⃣ 사주 정보 저장 (cached_saju_info → saju_records)
        // ========================================
        const cachedSajuJson = localStorage.getItem('cached_saju_info');
        let savedSajuRecordId: string | null = null;

        if (cachedSajuJson) {
          try {
            const cachedSaju = JSON.parse(cachedSajuJson);
            console.log('📋 [PendingTagsCheck] cached_saju_info 발견:', cachedSaju);

            // ⭐ 기존 대표 사주(is_primary) 존재 여부 확인
            const { data: primarySaju, error: primaryCheckError } = await supabase
              .from('saju_records')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('is_primary', true)
              .maybeSingle();

            if (primaryCheckError) {
              console.warn('⚠️ [PendingTagsCheck] 대표 사주 조회 오류 (무시하고 진행):', primaryCheckError);
            }

            const hasPrimary = !!primarySaju;
            const shouldBePrimary = !hasPrimary;
            console.log(`📌 [PendingTagsCheck] 기존 대표 사주: ${hasPrimary ? '있음' : '없음'}, 이번 사주 is_primary: ${shouldBePrimary}`);

            // 사주 레코드 INSERT
            const { data: newSajuRecord, error: sajuInsertError } = await supabase
              .from('saju_records')
              .insert({
                user_id: session.user.id,
                full_name: cachedSaju.name,
                gender: cachedSaju.gender === 'female' ? 'female' : 'male',
                birth_date: new Date(cachedSaju.birthDate).toISOString(),
                birth_time: cachedSaju.birthTime || '12:00',
                notes: shouldBePrimary ? '본인' : '',
                is_primary: shouldBePrimary // ⭐ 대표 사주가 없을 때만 내 사주로 설정
              })
              .select()
              .single();

            if (sajuInsertError) {
              console.error('❌ [PendingTagsCheck] 사주 정보 저장 실패:', sajuInsertError);
            } else {
              savedSajuRecordId = newSajuRecord.id;
              console.log('✅ [PendingTagsCheck] 사주 정보 저장 완료:', newSajuRecord.id);

              // ⭐ 대표 사주인 경우에만 primary_saju 캐시 업데이트
              if (shouldBePrimary) {
                localStorage.setItem('primary_saju', JSON.stringify(newSajuRecord));
              }
              localStorage.setItem('profile_needs_refresh', 'true');
            }

            // cached_saju_info 삭제
            localStorage.removeItem('cached_saju_info');
          } catch (sajuErr) {
            console.error('❌ [PendingTagsCheck] 사주 정보 처리 오류:', sajuErr);
          }
        } else {
          console.warn('⚠️ [PendingTagsCheck] cached_saju_info 없음 → 사주 정보 저장 스킵');
        }

        // ========================================
        // 2️⃣ 무료 콘텐츠 결과 저장 (localStorage → free_content_records)
        // ========================================
        // ⭐ resultKey를 우선 사용 (정확한 localStorage 키), 없으면 orderId fallback
        let freeResultKey = pendingData.resultKey || pendingData.orderId;
        let newFreeRecordId: string | null = null;

        // resultKey/orderId가 없거나 free_content_ 형식이 아니면 localStorage에서 패턴 매칭으로 찾기
        if (!freeResultKey || (!freeResultKey.startsWith('free_content_') && !freeResultKey.startsWith('temp_'))) {
          const contentId = pendingData.contentId;
          if (contentId) {
            // localStorage에서 free_content_{contentId}_guest_ 패턴 찾기
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith(`free_content_${contentId}_guest_`)) {
                freeResultKey = key;
                console.log('🔍 [PendingTagsCheck] localStorage에서 무료 콘텐츠 키 발견:', key);
                break;
              }
            }
          }
        }

        // cached_free_result에서도 확인
        if (!freeResultKey) {
          const cachedFreeResult = localStorage.getItem('cached_free_result');
          if (cachedFreeResult) {
            try {
              const cached = JSON.parse(cachedFreeResult);
              if (cached.contentId === pendingData.contentId && cached.resultKey) {
                freeResultKey = cached.resultKey;
                console.log('🔍 [PendingTagsCheck] cached_free_result에서 키 발견:', freeResultKey);
              }
            } catch {
              // ignore
            }
          }
        }

        console.log('📌 [PendingTagsCheck] freeResultKey:', freeResultKey);

        if (freeResultKey) {
          const freeResultJson = localStorage.getItem(freeResultKey);
          console.log('📌 [PendingTagsCheck] freeResultJson 존재:', !!freeResultJson);

          if (freeResultJson) {
            try {
              const freeResult = JSON.parse(freeResultJson);
              console.log('📋 [PendingTagsCheck] 무료 콘텐츠 결과 발견:', Object.keys(freeResult));

              // free_content_records에 INSERT
              // ⭐ answers에 question_id, question_order도 포함 (PurchaseHistoryPage에서 필요)
              const answersForDb = freeResult.contentAnswers?.map((a: { questionText: string; answerText: string }, index: number) => ({
                question_id: `q${index + 1}`,
                question_order: index + 1,
                question_text: a.questionText,
                answer_text: a.answerText
              })) || freeResult.results?.map((r: { questionId?: string; questionOrder?: number; questionText: string; previewText: string }, index: number) => ({
                question_id: r.questionId || `q${index + 1}`,
                question_order: r.questionOrder || (index + 1),
                question_text: r.questionText,
                answer_text: r.previewText
              })) || [];

              const { data: newFreeRecord, error: freeInsertError } = await supabase
                .from('free_content_records')
                .insert({
                  user_id: session.user.id,
                  content_id: pendingData.contentId,
                  saju_record_id: savedSajuRecordId,
                  full_name: freeResult.sajuData?.name || freeResult.userName || '회원',
                  gender: freeResult.sajuData?.gender || 'female', // 기본값 'female'로 저장
                  birth_date: freeResult.sajuData?.birthDate
                    ? new Date(freeResult.sajuData.birthDate).toISOString()
                    : new Date().toISOString(),
                  birth_time: freeResult.sajuData?.birthTime || '12:00',
                  is_guest: false,
                  answers: answersForDb
                })
                .select()
                .single();

              if (freeInsertError) {
                console.error('❌ [PendingTagsCheck] 무료 콘텐츠 결과 저장 실패:', freeInsertError);
              } else {
                newFreeRecordId = newFreeRecord.id;
                console.log('✅ [PendingTagsCheck] 무료 콘텐츠 결과 저장 완료:', newFreeRecord.id);

                // 임시 localStorage 데이터는 삭제하지 않음 (결과 페이지에서 사용)
                // 대신 새 recordId로 업데이트
                const updatedResult = { ...freeResult, dbRecordId: newFreeRecordId };
                localStorage.setItem(freeResultKey, JSON.stringify(updatedResult));

                // ⭐ 이용 기록 페이지 캐시 갱신 플래그 설정
                localStorage.setItem('free_content_needs_refresh', 'true');
                console.log('🔄 [PendingTagsCheck] free_content_needs_refresh 플래그 설정');
              }
            } catch (freeErr) {
              console.error('❌ [PendingTagsCheck] 무료 콘텐츠 결과 처리 오류:', freeErr);
            }
          }
        }

        // pendingData.orderId를 새 DB recordId로 업데이트
        const finalOrderId = newFreeRecordId || pendingData.orderId;

        // ========================================
        // 3️⃣ 태그 저장 후 홈으로 이동 (phone_number 체크 없이 바로 처리)
        // ⭐ NEW 플로우: phone_number 입력은 마이페이지 → "나의 분석 보고서" 탭 클릭 시 (처음 1회만)
        // ========================================
        console.log('🏷️ [PendingTagsCheck] 태그 저장 시작');

        // 태그 저장 로직
        for (const tag of pendingData.tags) {
          await supabase
            .from('user_trait_tags')
            .insert({
              user_id: session.user.id,
              tag_name: tag.label,
              tag_type: tag.type || 'positive',
              source_type: pendingData.sourceType || 'free_content',
              source_content_id: pendingData.contentId || null,
              source_order_id: finalOrderId || null,
              is_confirmed: true
            });
        }

        console.log('✅ [PendingTagsCheck] 태그 저장 완료');

        // ⭐ 미선택 태그 → users.rejected_tags에 추가 (AI 재추출 방지)
        const unselectedTags: string[] = pendingData.unselectedTags || [];
        if (unselectedTags.length > 0) {
          try {
            const { data: userRecord } = await supabase
              .from('users')
              .select('rejected_tags')
              .eq('id', session.user.id)
              .single();

            const currentRejected: string[] = userRecord?.rejected_tags || [];
            const merged = [...new Set([...currentRejected, ...unselectedTags])];

            await supabase
              .from('users')
              .update({ rejected_tags: merged })
              .eq('id', session.user.id);

            console.log('✅ [PendingTagsCheck] rejected_tags 업데이트:', unselectedTags);
          } catch (err) {
            console.warn('⚠️ [PendingTagsCheck] rejected_tags 업데이트 실패:', err);
          }
        }

        // 캐시 무효화
        localStorage.setItem('trait_tags_needs_refresh', 'true');
        localStorage.setItem('my_report_needs_refresh', 'true');
        localStorage.removeItem('trait_tags_cache');
        localStorage.removeItem('nadaum_all_tags_cache');
        localStorage.removeItem('pending_trait_tags');
        localStorage.removeItem('open_phone_bottomsheet');
        localStorage.removeItem('redirectAfterLogin');

        // ⭐ "태그가 저장됐어요!" 토스트 플래그 설정 (홈에서 표시)
        sessionStorage.setItem('show_tag_saved_toast', 'true');
        sessionStorage.removeItem('show_login_toast');

        // 홈으로 이동
        navigate('/', { replace: true });
      } catch (err) {
        console.error('❌ [PendingTagsCheck] 처리 중 오류:', err);
        localStorage.removeItem('pending_trait_tags');
        navigate('/', { replace: true });
      }
    };

    processPendingTags();
  }, [navigate]);

  // 처리 중 로딩 화면 (LoadingWithMessage 사용)
  return (
    <div className="bg-white fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[440px]">
        <LoadingWithMessage message="나다움 기록을 준비중이에요!" padding="0 20px" />
      </div>
    </div>
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

    // ⭐ iOS Safari: 로그인 후 홈 버퍼 재생성 (스와이프 뒤로가기 → 이전 페이지/탭 닫힘 방지)
    sessionStorage.removeItem('homepage_history_initialized');
    sessionStorage.removeItem('navigatedFromHome');

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
        sessionStorage.removeItem('homepage_history_initialized');
        sessionStorage.removeItem('navigatedFromHome');
        navigate('/', { replace: true });
      }}
      onNavigateToHome={() => {
        sessionStorage.removeItem('homepage_history_initialized');
        sessionStorage.removeItem('navigatedFromHome');
        navigate('/', { replace: true });
      }}
    />
  );
}

// Terms Page Wrapper
function TermsPageWrapper() {
  const navigate = useNavigate();
  const signupCompletedRef = useRef(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // ⭐ 약관 동의 취소 시 세션 삭제 (신규 가입 중단)
  const cleanupSession = useCallback(async () => {
    console.log('⚠️ [TermsPage] 약관 동의 취소 → 세션 삭제');
    localStorage.removeItem('tempUser');
    await supabase.auth.signOut();
  }, []);

  // ⭐ 이미 회원가입이 완료된 상태면 홈으로 리다이렉트 (뒤로가기로 돌아왔을 때 처리)
  useEffect(() => {
    const user = localStorage.getItem('user');
    const tempUser = localStorage.getItem('tempUser');

    if (user) {
      console.log('🔄 [TermsPage] 이미 회원가입 완료 → 홈으로 리다이렉트');
      navigate('/', { replace: true });
    } else if (!tempUser) {
      console.log('🔄 [TermsPage] 임시 사용자 정보 없음 → 로그인 안내 다이얼로그 표시');
      setShowLoginDialog(true);
    }
  }, [navigate]);

  // ⭐ 브라우저 뒤로가기 감지 및 세션 삭제
  useEffect(() => {
    // 가상 히스토리 항목 추가 (뒤로가기 감지용)
    window.history.pushState({ termsPage: true }, '');

    const handlePopState = async (event: PopStateEvent) => {
      // 회원가입이 완료되지 않은 상태에서 뒤로가기 시 세션 삭제
      if (!signupCompletedRef.current) {
        console.log('🔙 [TermsPage] 브라우저 뒤로가기 감지 → 세션 삭제');
        await cleanupSession();
        navigate('/login/new', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [cleanupSession, navigate]);

  if (showLoginDialog) return <SessionExpiredDialog isOpen={true} />;

  const handleComplete = () => {
    // ⭐ 회원가입 완료 플래그 설정 (unmount 시 세션 삭제 방지)
    signupCompletedRef.current = true;

    // ⭐️ 가입 축하 쿠폰 페이지로 이동
    console.log('✅ 회원가입 완료 → 가입 축하 쿠폰 페이지로 이동');

    // ⭐ 환영 페이지 플래그 초기화 (새 회원가입이므로 환영 페이지를 봐야 함)
    sessionStorage.removeItem('welcomePageViewed');

    navigate('/welcome-coupon', { replace: true });
  };

  const handleBack = async () => {
    await cleanupSession();
    navigate('/login/new', { replace: true });
  };

  return (
    <TermsPage
      onBack={handleBack}
      onComplete={handleComplete}
    />
  );
}

// ⭐ Welcome Coupon Page Wrapper
function WelcomeCouponPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginAuth = useLoginRequired();

  // ⭐ 이미 환영 페이지를 본 경우 홈으로 리다이렉트 (뒤로가기로 돌아왔을 때 처리)
  useEffect(() => {
    const welcomed = sessionStorage.getItem('welcomePageViewed');
    if (welcomed) {
      console.log('🔄 [WelcomeCoupon] 이미 환영 페이지를 봄 → 홈으로 리다이렉트');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // ⭐ 로그인 상태에서 중간 경로 직접 접속 시 홈으로 리다이렉트
  if (location.key === 'default') return <Navigate to="/" replace />;

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

// ⭐ 마스터 권한 확인 훅 (DB 검증)
function useMasterAuth() {
  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'denied'>('checking');

  useEffect(() => {
    const checkMasterRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAuthState('denied');
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        setAuthState(userData?.role === 'master' ? 'authorized' : 'denied');
      } catch {
        setAuthState('denied');
      }
    };

    checkMasterRole();
  }, []);

  return authState;
}

// ⭐ 로그인 필요 확인 훅
function useLoginRequired() {
  const [authState, setAuthState] = useState<'checking' | 'logged_in' | 'not_logged_in'>('checking');

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthState(user ? 'logged_in' : 'not_logged_in');
      } catch {
        setAuthState('not_logged_in');
      }
    };

    checkLogin();
  }, []);

  return authState;
}

// ⭐ 접근 권한 제한 다이얼로그 (ConfirmDialog 스타일 통일)
function AccessDeniedDialog() {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="bg-white rounded-[16px] w-[320px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 제목 */}
        <div className="px-[24px] pt-[32px] pb-[24px]">
          <p
            className="text-center"
            style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '25.5px',
              letterSpacing: '-0.36px',
              color: '#151515'
            }}
          >
            접근 권한이 없어요
          </p>
          <p
            className="text-center mt-[8px]"
            style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontWeight: 400,
              fontSize: '15px',
              lineHeight: '20px',
              letterSpacing: '-0.3px',
              color: '#848484'
            }}
          >
            관리자 계정으로 로그인해 주세요.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="px-[16px] pb-[16px]">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full h-[48px] rounded-[12px] transition-colors active:opacity-80"
            style={{ backgroundColor: '#48b2af' }}
          >
            <p
              style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontWeight: 600,
                fontSize: '15px',
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#ffffff'
              }}
            >
              홈으로 가기
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

// Master Content List Wrapper
function MasterContentListWrapper() {
  const navigate = useNavigate();
  const masterAuth = useMasterAuth();

  if (masterAuth === 'checking') return <PageLoader />;
  if (masterAuth === 'denied') return <AccessDeniedDialog />;

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
  const masterAuth = useMasterAuth();

  if (masterAuth === 'checking') return <PageLoader />;
  if (masterAuth === 'denied') return <AccessDeniedDialog />;

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p style={{ color: '#999999' }} className="mb-4">콘텐츠를 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/master/content')}
            style={{ backgroundColor: '#48b2af', color: '#ffffff' }}
            className="px-6 py-2 rounded-lg"
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
      onBack={() => navigate('/', { replace: true })}
      onHome={() => navigate('/', { replace: true })}
      onContentClick={(contentId) => {
        console.log('🔥 App.tsx navigate 시도 (replace):', `/master/content/detail/${contentId}`);
        // ⭐ 추천 콘텐츠 클릭 시 현재 페이지를 교체 (히스토리 쌓지 않음)
        navigate(`/master/content/detail/${contentId}`, { replace: true });
      }}
      onBannerClick={(productId) => navigate(`/product/${productId}`)}
      onPurchase={undefined} // ⭐ handlePurchase fallback 사용
      onNext={() => navigate(`/nadaum-record/${id}`)} // ⭐ 나다움 기록하기로 이동
    />
  );
}

// ⭐ 태그 추출 로딩 페이지 Wrapper (DB 폴링 방식 - API 중복 호출 방지)
function TagExtractionLoadingWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const hasStarted = useRef(false);

  const userName = location.state?.userName || '회원';
  // ⭐ 무료 콘텐츠 레코드 ID (각 운세 결과별 구분용)
  const freeRecordId = location.state?.freeRecordId as string | undefined;

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // ⭐ DB 폴링으로 FreeResultPage에서 추출 완료를 기다림 (API 중복 호출 방지)
    const pollForTags = async () => {
      console.log('🔄 [TagExtractionLoading] DB 폴링 시작 (FreeResultPage 태그 추출 대기)...');
      console.log('📌 [TagExtractionLoading] freeRecordId:', freeRecordId);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        console.warn('⚠️ [TagExtractionLoading] 로그인 필요 → 바로 이동');
        navigate(`/nadaum-record/${id}`, { replace: true, state: { freeRecordId } });
        return;
      }

      let pollCount = 0;
      const maxPolls = 30; // 최대 15초 대기 (500ms * 30)

      const pollInterval = setInterval(async () => {
        pollCount++;

        try {
          // DB에서 태그 확인 (FreeResultPage에서 저장했는지)
          const { data: tags, error } = await supabase
            .from('user_trait_tags')
            .select('tag_name, tag_type')
            .eq('user_id', userData.user.id)
            .eq('source_order_id', freeRecordId)
            .eq('source_type', 'free_content');

          if (!error && tags && tags.length > 0) {
            // 태그 발견 → 이동
            clearInterval(pollInterval);
            console.log('✅ [TagExtractionLoading] DB에서 태그 발견:', tags.length, '개 → nadaum-record로 이동');
            const extractedTags = tags.map(t => ({
              name: t.tag_name,
              type: t.tag_type as 'positive' | 'negative' | 'neutral'
            }));
            navigate(`/nadaum-record/${id}`, {
              replace: true,
              state: { tags: extractedTags, freeRecordId }
            });
            return;
          }

          console.log(`🔄 [TagExtractionLoading] 폴링 ${pollCount}/${maxPolls}... 태그 아직 없음`);

          if (pollCount >= maxPolls) {
            // 타임아웃 → 태그 없이 이동
            clearInterval(pollInterval);
            console.warn('⚠️ [TagExtractionLoading] 폴링 타임아웃 → nadaum-record로 이동');
            navigate(`/nadaum-record/${id}`, { replace: true, state: { freeRecordId } });
          }
        } catch (err) {
          console.error('❌ [TagExtractionLoading] 폴링 에러:', err);
        }
      }, 500);

      // 클린업
      return () => clearInterval(pollInterval);
    };

    pollForTags();
  }, [id, freeRecordId, navigate]);

  return (
    <div className="bg-white fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[440px]">
        <LoadingWithMessage message={`${userName}님의 나다움 태그를 분석중이에요!`} padding="0 20px" />
      </div>
    </div>
  );
}

// 나다움 기록하기 페이지 Wrapper
function NadaumRecordWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ 나다움 기록하기용 태그 (navigation state에서 전달받음)
  const tags = location.state?.tags as { name: string; type: 'positive' | 'negative' | 'neutral' }[] | undefined;
  // ⭐ 무료 콘텐츠 레코드 ID (각 운세 결과별 구분용) - orderId로 전달하여 source_order_id에 저장
  const freeRecordId = location.state?.freeRecordId as string | undefined;
  // ⭐ localStorage 결과 키 (게스트→로그인 시 정확한 결과 매칭용)
  const resultKeyFromState = location.state?.resultKey as string | undefined;

  return (
    <CheckRecordMe
      contentId={id}
      orderId={freeRecordId}  // ⭐ 각 운세 결과별 구분 (source_order_id에 저장됨)
      tags={tags}
      resultKey={resultKeyFromState}
      onBack={() => navigate(`/product/${id}/result/free`)} // 무료 운세 결과 페이지로 이동
      onHome={() => navigate('/')}
      onSkip={() => navigate('/')} // 다음에 할래요
    />
  );
}

// ⭐ 유료 콘텐츠 태그 추출 로딩 페이지 Wrapper
function PaidTagExtractionLoadingWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasStarted = useRef(false);

  const { orderId, contentId } = location.state || {};

  // 사용자 이름 가져오기
  const [userName, setUserName] = useState<string>('회원');
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.full_name) setUserName(user.full_name);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (!orderId || !contentId) {
      console.warn('⚠️ [PaidTagExtractionLoading] orderId 또는 contentId 없음 → 홈으로 이동');
      navigate('/');
      return;
    }

    // ⭐ localStorage 폴링 (UnifiedResultPage에서 태그 추출 완료를 기다림)
    console.log('🏷️ [PaidTagExtractionLoading] localStorage 폴링 시작 (UnifiedResultPage 태그 추출 대기)...');
    const cacheKey = `extracted_tags_${orderId}`;
    let pollCount = 0;
    const maxPolls = 30; // 최대 15초 대기 (500ms * 30)

    const pollInterval = setInterval(() => {
      pollCount++;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        clearInterval(pollInterval);
        try {
          const { tags } = JSON.parse(cached);
          console.log('✅ [PaidTagExtractionLoading] localStorage에서 태그 발견:', tags);
          // 캐시 삭제 (일회성)
          localStorage.removeItem(cacheKey);
          navigate('/paid/nadaum-record', {
            replace: true,
            state: { orderId, contentId, tags: tags || [] }
          });
        } catch {
          navigate('/paid/nadaum-record', {
            replace: true,
            state: { orderId, contentId, tags: [] }
          });
        }
        return;
      }

      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        console.warn('⚠️ [PaidTagExtractionLoading] 폴링 타임아웃 → 빈 태그로 이동');
        navigate('/paid/nadaum-record', {
          replace: true,
          state: { orderId, contentId, tags: [] }
        });
      }
    }, 500);

    return () => clearInterval(pollInterval);
  }, [orderId, contentId, navigate]);

  return (
    <div className="bg-white fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[440px]">
        <LoadingWithMessage message={`${userName}님의 나다움 태그를 분석중이에요!`} padding="0 20px" />
      </div>
    </div>
  );
}

// ⭐ 유료 콘텐츠 나다움 기록하기 페이지 Wrapper
function PaidNadaumRecordWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  const { orderId, contentId, tags } = location.state || {};

  if (!orderId || !contentId) {
    console.warn('⚠️ [PaidNadaumRecordWrapper] orderId 또는 contentId 없음 → 홈으로 이동');
    navigate('/');
    return null;
  }

  return (
    <CheckRecordMe
      contentId={contentId}
      orderId={orderId}
      tags={tags}
      sourceType="paid_content"
      onBack={() => navigate(-1)}
      onHome={() => navigate('/')}
      onSkip={() => navigate('/')}
      onComplete={() => navigate('/')}  // ⭐ 무료와 동일하게 홈으로 이동 + 토스트 표시
    />
  );
}

// Saju Input Page Wrapper
function SajuInputPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // ⭐ 로그인 상태에서 중간 경로 직접 접속 시 홈으로 리다이렉트
  if (location.key === 'default') return <Navigate to="/" replace />;

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
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;

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
  const loginAuth = useLoginRequired();

  if (loginAuth === 'checking') return <PageLoader />;
  if (loginAuth === 'not_logged_in') return <SessionExpiredDialog isOpen={true} />;
  // ⭐ 로그인 상태에서 중간 경로 직접 접속 시 홈으로 리다이렉트
  if (location.key === 'default') return <Navigate to="/" replace />;

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

  // ⭐ PG 리다이렉트에서 뒤로가기로 복귀한 경우 → 콘텐츠 상세로 이동 (모바일 다날 PG 루프 방지)
  const pgRedirectPath = sessionStorage.getItem('pg_payment_in_progress');
  if (pgRedirectPath) {
    sessionStorage.removeItem('pg_payment_in_progress');
    console.log('🛡️ [MasterContentPayment] PG 리다이렉트 복귀 감지 → 콘텐츠 상세로 이동:', pgRedirectPath);
    window.location.replace(pgRedirectPath);
    return null;
  }

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
  const masterAuth = useMasterAuth();

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

  // 권한 확인 중이면 로딩 표시
  if (masterAuth === 'checking') return <PageLoader />;
  if (masterAuth === 'denied') return <AccessDeniedDialog />;

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

// ⭐ 주간 보고서 상세 페이지 Wrapper (알림톡에서 접근)
function ReportWeeklyDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hasTarot, setHasTarot] = useState<boolean | null>(null);

  // 타로가 이미 뽑혔는지 확인 (user_viewed = true인 카드가 있는지)
  useEffect(() => {
    async function checkTarotSelections() {
      if (!id) return;

      try {
        // user_viewed = true인 카드가 있는지 확인 (실제로 사용자가 뽑은 카드)
        const { count, error } = await supabase
          .from('report_tarot_selections')
          .select('id', { count: 'exact', head: true })
          .eq('report_id', id)
          .eq('user_viewed', true);

        if (error) {
          console.error('타로 선택 확인 실패:', error);
          setHasTarot(false);
          return;
        }

        setHasTarot((count ?? 0) > 0);
        console.log(`🎴 [타로] 보고서 ${id} - 타로 뽑힘 여부 (user_viewed):`, (count ?? 0) > 0);
      } catch (err) {
        console.error('타로 선택 확인 중 오류:', err);
        setHasTarot(false);
      }
    }

    checkTarotSelections();
  }, [id]);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  // 타로 뽑힘 여부 확인 중이면 로딩
  if (hasTarot === null) {
    return (
      <ReportWeeklyDetail
        reportId={id}
        onClose={() => navigate('/my-report-list', { replace: true })}
        onPrev={() => navigate('/my-report-list', { replace: true })}
        onNext={() => {}} // 로딩 중에는 비활성화
      />
    );
  }

  return (
    <ReportWeeklyDetail
      reportId={id}
      onClose={() => navigate('/my-report-list', { replace: true })}
      onPrev={() => navigate('/my-report-list', { replace: true })}
      onNext={() => {
        // 타로가 이미 뽑혔으면 타로 결과 페이지로, 아니면 타로 뽑기 페이지로
        if (hasTarot) {
          navigate(`/report-weekly-tarot-result/${id}`, { replace: true });
        } else {
          navigate(`/report-weekly-tarot/${id}`, { replace: true });
        }
      }}
    />
  );
}

// ⭐ 주간 보고서 타로 뽑기 페이지 Wrapper
function ReportWeeklyTarotWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <ReportWeeklyTarot
      onClose={() => navigate('/my-report-list', { replace: true })}
      onNext={() => navigate(`/report-weekly-tarot-result/${id}`, { replace: true })}
    />
  );
}

// ⭐ 주간 보고서 타로 결과 페이지 Wrapper
function ReportWeeklyTarotResultWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <ReportWeeklyTarotResult
      reportId={id}
      onClose={() => navigate('/my-report-list', { replace: true })}
      onPrev={() => navigate(`/report-weekly-detail/${id}`, { replace: true })}
      onNext={() => navigate(`/report-weekly-mind-care/${id}`, { replace: true })}
    />
  );
}

// ⭐ 주간 보고서 마음 처방 페이지 Wrapper
function ReportWeeklyMindCareWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <ReportWeeklyMindCare
      reportId={id}
      onClose={() => navigate('/my-report-list', { replace: true })}
      onPrev={() => navigate(`/report-weekly-tarot-result/${id}`, { replace: true })}
      onNext={() => navigate(`/report-weekly-memo/${id}`, { replace: true })}
    />
  );
}

// ⭐ 주간 보고서 나 응원하기 페이지 Wrapper
function ReportWeeklyMemoWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasEncouragement, setHasEncouragement] = useState<boolean | null>(null);
  const [hasCoupon, setHasCoupon] = useState<boolean | null>(null);
  const [isMissionEligible, setIsMissionEligible] = useState<boolean | null>(null);

  // 응원글 존재 여부 + 쿠폰 발급 여부 + 미션 쿠폰 대상 여부 확인
  useEffect(() => {
    async function checkStatus() {
      if (!id) return;

      try {
        // 🚀 1차 병렬: 보고서 + 세션 + 미션 쿠폰 마스터 동시 조회
        const [reportResult, sessionResult, missionMasterResult] = await Promise.all([
          supabase.from('weekly_reports').select('self_encouragement, tag_count').eq('id', id).single(),
          supabase.auth.getSession(),
          supabase.from('coupons').select('id').eq('coupon_type', 'mission').maybeSingle(),
        ]);

        const reportData = reportResult.data;
        if (reportResult.error) {
          console.error('응원글 확인 실패:', reportResult.error);
          setHasEncouragement(false);
        } else {
          setHasEncouragement(!!reportData?.self_encouragement);
        }

        const tagCount = reportData?.tag_count ?? 0;
        const user = sessionResult.data?.session?.user;
        const missionCouponId = missionMasterResult.data?.id;

        console.log(`📝 [응원글] 보고서 ${id} - 응원글: ${!!reportData?.self_encouragement}, 태그: ${tagCount}`);

        if (!user) {
          setHasCoupon(false);
          setIsMissionEligible(false);
          return;
        }

        // 🚀 2차 병렬: 쿠폰 발급 여부 + 미션 쿠폰 수령 여부 동시 조회
        const queries: Promise<{ data: { id: string }[] | { id: string } | null; error: unknown }>[] = [
          supabase.from('user_coupons').select('id').eq('user_id', user.id).eq('source_order_id', id).limit(1),
        ];

        if (tagCount >= 5 && missionCouponId) {
          queries.push(
            supabase.from('user_coupons').select('id').eq('user_id', user.id).eq('coupon_id', missionCouponId).maybeSingle()
          );
        }

        const results = await Promise.all(queries);

        // 쿠폰 발급 여부
        const couponData = results[0].data as { id: string }[] | null;
        const couponExists = !!(couponData && couponData.length > 0);
        setHasCoupon(couponExists);
        console.log(`🎟️ [쿠폰] 보고서 ${id} - 쿠폰 발급 여부:`, couponExists);

        // 미션 쿠폰 대상 여부
        if (tagCount >= 5 && missionCouponId && results[1]) {
          const eligible = !results[1].data;
          setIsMissionEligible(eligible);
          console.log(`🎯 [미션쿠폰] 태그 ${tagCount}개, 미수령:`, eligible);
        } else {
          setIsMissionEligible(false);
          if (tagCount < 5) console.log(`🎯 [미션쿠폰] 태그 ${tagCount}개 < 5 → 대상 아님`);
        }
      } catch (err) {
        console.error('상태 확인 중 오류:', err);
        setHasEncouragement(false);
        setHasCoupon(false);
        setIsMissionEligible(false);
      }
    }

    checkStatus();
  }, [id]);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  // 수정 페이지에서 왔으면 닫기 시 나의 분석 보고서 페이지로 이동
  const fromEdit = (location.state as { fromEdit?: boolean })?.fromEdit;

  // 상태 확인 중이면 로딩 상태로 렌더링
  if (hasEncouragement === null || hasCoupon === null || isMissionEligible === null) {
    return (
      <ReportWeeklyMemo
        reportId={id}
        onClose={() => navigate('/my-report-list', { replace: true })}
        onPrev={() => navigate(`/report-weekly-mind-care/${id}`, { replace: true })}
        onNext={() => {}} // 로딩 중에는 비활성화
      />
    );
  }

  // 프로필로 바로 이동해야 하는 경우:
  // 1. 수정 페이지에서 왔으면
  // 2. 응원글이 이미 있으면 (view 모드)
  // 3. 쿠폰이 이미 발급되었으면 (두 번째 방문)
  // 4. 미션 쿠폰 대상이 아닌 경우 (태그 5개 미만 or 이미 수령)
  const shouldGoToProfile = fromEdit || hasEncouragement || hasCoupon || !isMissionEligible;

  return (
    <ReportWeeklyMemo
      reportId={id}
      onClose={() => navigate('/my-report-list', { replace: true })}
      onPrev={() => navigate(`/report-weekly-mind-care/${id}`, { replace: true })}
      onNext={() => {
        if (shouldGoToProfile) {
          console.log('✅ [응원글] 프로필로 이동 (fromEdit:', fromEdit, ', hasEncouragement:', hasEncouragement, ', hasCoupon:', hasCoupon, ', isMissionEligible:', isMissionEligible, ')');
          navigate('/my-report-list', { replace: true });
        } else {
          console.log('🎟️ [응원글] 미션 쿠폰 페이지로 이동 (태그 5개↑ & 미션 쿠폰 미수령)');
          navigate(`/report-completion/${id}`, { replace: true });
        }
      }}
    />
  );
}

// ⭐ 보고서 완료 & 쿠폰 증정 페이지 Wrapper
function ReportCompletionWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <CompletionCoupon
      reportId={id}
      onClose={() => navigate('/my-report-list', { replace: true })}
      onHome={() => navigate('/', { replace: true })}
    />
  );
}

// ⭐ 나 응원하기 수정 페이지 Wrapper (프로필 > 이번주 나에게에서 연필 아이콘 클릭 시)
function ReportWeeklyMemoEditWrapper() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  const initialText = (location.state as { initialText?: string })?.initialText || '';

  // X 버튼 클릭: 보고서 리스트로 돌아가기
  const handleClose = () => {
    navigate('/my-report-list', { replace: true });
  };

  // 이전 버튼: 보고서 리스트로 돌아가기
  const handlePrev = () => {
    navigate('/my-report-list', { replace: true });
  };

  // 다음 버튼: 저장 후 보고서 리스트로 돌아가기 (ReportWeeklyMemoQuickEdit 내부에서 저장 처리)
  const handleNext = () => {
    // 토스트 표시 - toast 래퍼 사용 (unstyled: true 포함으로 auto-dismiss 보장)
    toast.success('수정이 반영됐어요.', { duration: 2200 });

    // 보고서 리스트로 이동
    navigate('/my-report-list', { replace: true });
  };

  return (
    <ReportWeeklyMemoQuickEdit
      reportId={id}
      initialText={initialText}
      onClose={handleClose}
      onPrev={handlePrev}
      onNext={handleNext}
    />
  );
}

export default function App() {
  // 🌐 HTML lang 속성 설정 (브라우저 자동번역 방지)
  useEffect(() => {
    document.documentElement.lang = 'ko';
  }, []);

  // 🔗 공유 리워드: URL의 ?ref= 파라미터 캡처 (최초 1회)
  useEffect(() => {
    captureReferralFromUrl();
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
      if (event === 'SIGNED_OUT') {
        // 명시적 로그아웃/세션 무효화 → 모든 사용자 캐시 삭제
        // ※ !session 조건 제거: INITIAL_SESSION 이벤트의 일시적 null session으로 오작동 방지
        console.log('🧹 로그아웃 감지 → 사용자 캐시 전체 삭제');
        clearUserCaches();
      } else if (event === 'SIGNED_IN' && session) {
        // 로그인/가입 완료 → 오늘 방문 기록 (가입 첫날 visit_dates 누락 방지)
        recordTodayVisit();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 📅 앱 접속 시 방문 기록 (KST 기준 날짜별)
  useEffect(() => {
    recordTodayVisit();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <ErrorBoundary>
        <DirectEntryHistoryGuard />
        <HistoryDebug />
        <GAInit />
        <LoginToast />
        <PortOneInit />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPageNewWrapper />} />
          <Route path="/login/new" element={<LoginPageNewWrapper />} />
          <Route path="/login/existing/new" element={<ExistingAccountPageNewWrapper />} />
          <Route path="/pending-tags-check" element={<PendingTagsCheckPage />} />
          <Route path="/terms" element={<TermsPageWrapper />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/product/:id/payment" element={<PaymentNewPage />} />
          <Route path="/product/:id/payment/new" element={<PaymentNewPage />} />
          <Route path="/product/:id/birthinfo" element={<BirthInfoPage />} />
          <Route path="/product/:id/saju-select" element={<SajuSelectPageWrapper />} />
          <Route path="/product/:id/free-saju-select" element={<FreeSajuSelectPageWrapper />} />
          <Route path="/product/:id/free-saju-add" element={<FreeSajuAddPageWrapper />} />
          <Route path="/product/:id/result" element={<ResultPage />} />
          <Route path="/product/:id/result/free" element={<FreeResultPage />} />
          <Route path="/payment/complete" element={<PaymentComplete />} />
          <Route path="/profile" element={<ProfilePageWrapper />} />
          <Route path="/manse" element={<MansePageWrapper />} />
          <Route path="/share-reward-info" element={<ShareRewardInfoPageWrapper />} /> {/* ⭐ 공유 새싹 지급 안내 */}
          <Route path="/blog" element={<BlogListPageWrapper />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/purchase-history" element={<PurchaseHistoryPageWrapper />} />
          <Route path="/master/content" element={<MasterContentListWrapper />} />
          <Route path="/master/stats" element={<StatsDashboardWrapper />} /> {/* ⭐ 통계 대시보드 */}
          <Route path="/master/content/create" element={<MasterContentCreateFlowWrapper />} />
          <Route path="/master/content/create/questions" element={<MasterContentCreateFlowWrapper />} />
          <Route path="/master/content/detail/:id/payment" element={<MasterContentPaymentPageWrapper />} />
          <Route path="/master/content/detail/:id" element={<MasterContentDetailPageWrapper />} />
          <Route path="/master/content/:id/birthinfo" element={<BirthInfoPage />} />
          <Route path="/master/content/:id" element={<MasterContentDetailWrapper />} />
          <Route path="/free/content/:id" element={<FreeContentDetailWrapper />} />
          <Route path="/product/:id/tag-loading" element={<TagExtractionLoadingWrapper />} /> {/* ⭐ 태그 추출 로딩 페이지 */}
          <Route path="/nadaum-record/:id" element={<NadaumRecordWrapper />} /> {/* ⭐ 나다움 기록하기 페이지 */}
          <Route path="/paid/tag-loading" element={<PaidTagExtractionLoadingWrapper />} /> {/* ⭐ 유료 콘텐츠 태그 추출 로딩 페이지 */}
          <Route path="/paid/nadaum-record" element={<PaidNadaumRecordWrapper />} /> {/* ⭐ 유료 콘텐츠 나다움 기록하기 페이지 */}
          <Route path="/saju/input" element={<SajuInputPageWrapper />} />
          <Route path="/saju/management" element={<SajuManagementPageWrapper />} />
          <Route path="/saju/add" element={<SajuAddPageWrapper />} />
          <Route path="/loading" element={<LoadingPageWrapper />} />
          <Route path="/free-loading" element={<FreeContentLoading />} />
          <Route path="/result" element={<UnifiedResultPage />} /> {/* ⭐ 통합 결과 페이지 */}
          <Route path="/result/saju" element={<ResultSajuRedirect />} /> {/* ⭐ 알림톡 템플릿 호환성 (리다이렉트) */}
          <Route path="/tarot/shuffle" element={<TarotShufflePage />} /> {/* ⭐ 타로 셔플 페이지 */}
          <Route path="/test/tarot" element={<TestTarotPage />} /> {/* ⭐ 테스트용 타로 셔플 (로그인 불필요) */}
          <Route path="/test/email-auth" element={<EmailAuthPage />} /> {/* ⭐ AI 테스트용 이메일 인증 */}
          {/* ⭐ 테스트용 Figma 컴포넌트 라우트 */}
          <Route path="/test/check-record-me" element={<CheckRecordMe />} />
          <Route path="/test/receive-my-analysis" element={<ReceiveMyAnalysis onClose={() => {}} onSave={() => {}} phoneNumber="" setPhoneNumber={() => {}} />} />
          <Route path="/my-report-list" element={<MyReportListWrapper />} />
          <Route path="/test/my-report-weekly" element={<MyReportList />} /> {/* MyReportList가 전체 화면 렌더링 */}
          <Route path="/test/my-report-empty" element={<MyReportList forceEmptyState={true} />} />
          <Route path="/test/nadaum-tags" element={<NadaumTags onBack={() => {}} />} />
          <Route path="/test/nadaum-tags-list" element={<NadaumTagsList onBack={() => {}} onHome={() => {}} />} />
          {/* ⭐ 프로필 > 나다움 태그 전체보기 */}
          <Route path="/profile/nadaum-tags" element={<NadaumTagsListWrapper />} />
          <Route path="/test/report-weekly-detail" element={<ReportWeeklyDetail />} />
          <Route path="/test/report-weekly-tarot" element={<ReportWeeklyTarot />} />
          <Route path="/test/report-weekly-tarot-result" element={<ReportWeeklyTarotResult />} />
          <Route path="/test/report-weekly-mind-care" element={<ReportWeeklyMindCare />} />
          <Route path="/test/report-weekly-memo" element={<ReportWeeklyMemo />} />
          {/* ⭐ 주간 보고서 페이지 (알림톡에서 접근) */}
          <Route path="/report-weekly-detail/:id" element={<ReportWeeklyDetailWrapper />} />
          <Route path="/report-weekly-tarot/:id" element={<ReportWeeklyTarotWrapper />} />
          <Route path="/report-weekly-tarot-result/:id" element={<ReportWeeklyTarotResultWrapper />} />
          <Route path="/report-weekly-mind-care/:id" element={<ReportWeeklyMindCareWrapper />} />
          <Route path="/report-weekly-memo/:id" element={<ReportWeeklyMemoWrapper />} />
          <Route path="/report-completion/:id" element={<ReportCompletionWrapper />} />
          <Route path="/report-weekly/:id/cheer-edit" element={<ReportWeeklyMemoEditWrapper />} />
          <Route path="/test/report-weekly-memo-edit" element={<ReportWeeklyMemoEdit initialText="" onCancel={() => {}} onSave={() => {}} />} />
          <Route path="/test/completion-coupon" element={<CompletionCoupon />} />
          <Route path="/signup/terms" element={<TermsPageWrapper />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/welcome-coupon" element={<WelcomeCouponPageWrapper />} />
          <Route path="/alimtalk/input" element={<AlimtalkInfoInputPageWrapper />} /> {/* ⭐ 알림톡 정보 입력 */}
          <Route path="/sprout-charging/:contentId" element={<SproutChargingStationPage />} /> {/* ⭐ 새싹 충전소 */}
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
          style={{ zIndex: 9999 }}
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