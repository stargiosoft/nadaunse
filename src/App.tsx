import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import ProductDetail from './components/ProductDetail';
import FreeProductDetail from './components/FreeProductDetail';
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
import SajuInputPage from './components/SajuInputPage';
import SajuManagementPage from './components/SajuManagementPage';
import SajuAddPage from './components/SajuAddPage';
import SajuSelectPage from './components/SajuSelectPage';
import FreeSajuSelectPageWrapper from './components/FreeSajuSelectPageWrapper';
import FreeSajuAddPage from './components/FreeSajuAddPage';
import LoadingPage from './components/LoadingPage';
import FreeContentLoading from './components/FreeContentLoading';
import FreeBirthInfoInput from './components/FreeBirthInfoInput';
import SajuResultPage from './components/SajuResultPage';
import TarotResultPage from './components/TarotResultPage';
import TarotShufflePage from './components/TarotShufflePage'; // ⭐ 타로 셔플 페이지
import WelcomeCouponPage from './components/WelcomeCouponPage'; // ⭐ 추가
import ResultCompletePage from './components/ResultCompletePage'; // ⭐ 추가
import { GlobalAIMonitor } from './components/GlobalAIMonitor'; // ⭐ AI 모니터
import HomePage from './pages/HomePage';
import AuthCallback from './pages/AuthCallback';
import TarotDemo from './pages/TarotDemo'; // ⭐ 타로 데모 페이지
import { allProducts } from './data/products';
import { initGA, trackPageView } from './utils/analytics';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';
import { prefetchZodiacImages } from './lib/zodiacUtils'; // 🔥 이미지 프리페칭

// ⚡ Build Cache Buster v1.4.2 - Fix iOS Safari auto-zoom on input fields

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

// GA 초기화 컴포넌트
function GAInit() {
  const location = useLocation();

  useEffect(() => {
    // ⚡ 빌드 버전 체크 및 캐시 무효화
    const BUILD_VERSION = '1.4.2'; // Fix iOS Safari auto-zoom on input fields
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
    // 라우트 변경 시 페이지뷰 트래킹
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
}

// Product Detail Page Wrapper
function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ⭐️ 상품 정보 로드 (allProducts + master_contents)
  useEffect(() => {
    const loadProduct = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 [ProductDetailPage] 상품 로드 시작');
      console.log('📌 [ProductDetailPage] URL id:', id);
      
      // 먼저 allProducts에서 찾기 (숫자 ID인 경우)
      const numericId = Number(id);
      const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;
      
      if (staticProduct) {
        console.log('✅ [ProductDetailPage] allProducts에서 발견:', staticProduct);
        console.log('📌 [ProductDetailPage] product.type:', staticProduct.type);
        setProduct(staticProduct);
        setIsLoading(false);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      // allProducts에 없으면 마스터 콘텐츠 조회 (UUID인 경우)
      if (id) {
        console.log('🔍 [ProductDetailPage] allProducts에 없음 → master_contents 조회');
        
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
              fullDescription: data.description || '',  // ⭐️ 추가: FreeProductDetail에서 사용
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
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
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
          // 사주 정보 있음 → 사주 선택 페이지
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ [ProductDetailPage] 사주 정보 있음 (' + sajuRecords.length + '개)');
          console.log('🔀 [ProductDetailPage] FreeSajuSelectPage로 이동');
          console.log('📍 [ProductDetailPage] navigate to:', `/product/${id}/free-saju-select`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          navigate(`/product/${id}/free-saju-select`);
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

  if (product.type === 'free') {
    return (
      <FreeProductDetail
        product={product}
        onBack={() => navigate('/')}
        onPurchase={handlePurchase}  // ✅ productId 파라미터 없이 호출
      />
    );
  }

  return (
    <ProductDetail
      product={product}
      onBack={() => navigate('/')}
      onPurchase={handlePurchase}
    />
  );
}

// Payment New Page Wrapper
function PaymentNewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ⭐️ 상품 정보 로드 (allProducts + master_contents)
  useEffect(() => {
    const loadProduct = async () => {
      console.log('🔍 [PaymentNewPage] 상품 로드 시작, ID:', id);
      
      // 먼저 allProducts에서 찾기 (숫자 ID인 경우)
      const numericId = Number(id);
      const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;
      
      if (staticProduct) {
        console.log('✅ [PaymentNewPage] allProducts에서 발견:', staticProduct);
        setProduct(staticProduct);
        setIsLoading(false);
        return;
      }

      // allProducts에 없으면 마스터 콘텐츠 조회 (UUID인 경우)
      if (id) {
        console.log('🔍 [PaymentNewPage] allProducts에 없음 → master_contents 조회');
        
        // ⭐ master_contents는 PaymentNew 컴포넌트가 직접 조회하도록 위임
        // contentId만 전달하고 product는 null로 설정
        setProduct(null);
      }
      
      setIsLoading(false);
    };

    loadProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
  }

  // ⭐ allProducts에서 찾지 못한 경우 (UUID인 경우)는 contentId만 전달
  // PaymentNew 컴포넌트가 master_contents에서 직접 가격 정보를 조회함
  if (!product) {
    return (
      <PaymentNew
        contentId={id}
        onBack={() => navigate(`/`)}
        onPurchase={async () => {
          // 결제 완료 후 사주 정보 유무 확인하여 분기
          const { data: { user } } = await supabase.auth.getUser();
          
          console.log('🔍 [handlePurchaseComplete] 사주 정보 확인 시작');
          console.log('👤 [handlePurchaseComplete] user:', user?.id);
          
          if (user) {
            // 전체 사주 정보 조회 (디버깅용)
            const { data: allSajuRecords, error: allError } = await supabase
              .from('saju_records')
              .select('id, full_name, notes, is_primary')
              .eq('user_id', user.id);

            console.log('📋 [handlePurchaseComplete] 전체 사주 레코드:', allSajuRecords);
            console.log('📋 [handlePurchaseComplete] 사주 개수:', allSajuRecords?.length || 0);
            if (allError) console.error('❌ [handlePurchaseComplete] 사주 조회 에러:', allError);

            // ⭐️ is_primary 필드로 본인 사주 확인
            const { data: mySaju, error } = await supabase
              .from('saju_records')
              .select('id, full_name, notes, is_primary')
              .eq('user_id', user.id)
              .eq('is_primary', true)
              .maybeSingle();

            console.log('✅ [handlePurchaseComplete] 본인 사주 정보:', mySaju);

            if (mySaju) {
              // 본인 사주 있음 → 사주 선택 페이지
              console.log('✅ 결제 완료 → 본인 사주 있음 → 사주 선택 페이지로 이동');
              navigate(`/product/${id}/saju-select`);
            } else {
              // 본인 사주 없음 → 사주 입력 페이지
              console.log('✅ 결제 완료 → 본인 사주 없음 → 사주 입력 페이지로 이동');
              navigate(`/product/${id}/birthinfo`);
            }
          } else {
            // 로그인 안됨 (발생하면 안되는 케이스)
            console.log('❌ [handlePurchaseComplete] 로그인 안됨 → 사주 입력 페이지로 이동');
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
    // 결제 완료 후 사주 정보 유무 확인하여 분기
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('🔍 [handlePurchaseComplete] 사주 정보 확인 시작');
    console.log('👤 [handlePurchaseComplete] user:', user?.id);
    
    if (user) {
      // 전체 사주 정보 조회 (디버깅용)
      const { data: allSajuRecords, error: allError } = await supabase
        .from('saju_records')
        .select('id, full_name, notes, is_primary')
        .eq('user_id', user.id);

      console.log('📋 [handlePurchaseComplete] 전체 사주 레코드:', allSajuRecords);
      console.log('📋 [handlePurchaseComplete] 사주 개수:', allSajuRecords?.length || 0);
      if (allError) console.error('❌ [handlePurchaseComplete] 사주 조회 에러:', allError);

      // ⭐️ is_primary 필드로 본인 사주 확인
      const { data: mySaju, error } = await supabase
        .from('saju_records')
        .select('id, full_name, notes, is_primary')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();

      console.log('✅ [handlePurchaseComplete] 본인 사주 정보:', mySaju);

      if (mySaju) {
        // 본인 사주 있음 → 사주 선택 페이지
        console.log('✅ 결제 완료 → 본인 사주 있음 → 사주 선택 페이지로 이동');
        navigate(`/product/${id}/saju-select`);
      } else {
        // 본인 사주 없음 → 사주 입력 페이지
        console.log('✅ 결제 완료 → 본인 사주 없음 → 사주 입력 페이지로 이동');
        navigate(`/product/${id}/birthinfo`);
      }
    } else {
      // 로그인 안됨 (발생하면 안되는 케이스)
      console.log('❌ [handlePurchaseComplete] 로그인 안됨 → 사주 입력 페이지로 이동');
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
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSajuInfo, setHasSajuInfo] = useState<boolean | null>(null); // ⭐ 사주 정보 존재 여부

  useEffect(() => {
    const loadProduct = async () => {
      // 먼저 allProducts에서 찾기 (숫자 ID인 경우)
      const numericId = Number(id);
      const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;
      
      if (staticProduct) {
        console.log('✅ [BirthInfoPage] allProducts에서 발견:', staticProduct);
        console.log('📌 [BirthInfoPage] product.type:', staticProduct.type);
        setProduct(staticProduct);
        setIsLoading(false);
        return;
      }

      // allProducts에 없으면 마스터 콘텐츠 조회 (UUID인 경우)
      if (id) {
        console.log('🔍 [BirthInfoPage] allProducts에 없음 → master_contents 조회');
        
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

      // 사주 정보 존재 여부 확인
      const { data: sajuData, error } = await supabase
        .from('saju_records')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        console.error('❌ [BirthInfoPage] 사주 정보 조회 실패:', error);
        setHasSajuInfo(false);
        return;
      }

      const hasSaju = sajuData && sajuData.length > 0;
      console.log(`${hasSaju ? '✅' : 'ℹ️'} [BirthInfoPage] 사주 정보 ${hasSaju ? '있음' : '없음'}`);
      
      setHasSajuInfo(hasSaju);

      // ⭐ 사주 정보가 있으면 사주 선택 페이지로 리다이렉트
      if (hasSaju) {
        console.log('🔀 [BirthInfoPage] 무료 콘텐츠 + 사주 정보 있음 → 사주 선택 페이지로 리다이렉트');
        navigate(`/product/${id}/free-saju-select`, { replace: true });
      }
    };

    checkSajuInfo();
  }, [product, id, navigate]);

  if (isLoading || (product?.type === 'free' && hasSajuInfo === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      </div>
    );
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
        onBack={() => navigate(`/product/${id}`)}
      />
    );
  }

  // ⭐️ 유료 콘텐츠인 경우 BirthInfoInput 사용
  console.log('✅ [BirthInfoPage] 유료 콘텐츠 → BirthInfoInput 렌더링');
  return (
    <BirthInfoInput
      productId={id || ''}
      onBack={() => {
        // ⭐️ 결제 완료 후에는 콘텐츠 상세 페이지로 이동
        navigate(`/product/${id}`);
      }}
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
  
  // ⭐️ Fallback: resultKey가 없으면 localStorage에서 최신 결과 찾기
  if (!recordId && id) {
    console.log('🔍 [FreeResultPage] resultKey 없음 → localStorage 검색');
    const keys = Object.keys(localStorage);
    const matchingKeys = keys.filter(key => key.startsWith(`free_content_${id}_`));
    
    if (matchingKeys.length > 0) {
      // 가장 최근 결과 사용
      recordId = matchingKeys[matchingKeys.length - 1];
      console.log('✅ [FreeResultPage] localStorage에서 발견:', recordId);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 [FreeResultPage] 컴포넌트 마운트');
  console.log('📌 [FreeResultPage] id:', id);
  console.log('📌 [FreeResultPage] resultKey:', resultKey);
  console.log('📌 [FreeResultPage] recordId:', recordId);
  console.log('📌 [FreeResultPage] userName:', userName);
  console.log('📌 [FreeResultPage] contentId:', contentId);
  
  // ⭐️ 상품 정보 로드 (allProducts + master_contents 통합 처리)
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedContents, setRecommendedContents] = useState<any[]>([]);

  useEffect(() => {
    const loadProduct = async () => {
      console.log('🔍 [FreeResultPage] 상품 로드 시작...');
      
      // 먼저 allProducts에서 찾기 (숫자 ID인 경우)
      const numericId = Number(id);
      const staticProduct = !isNaN(numericId) ? allProducts.find(p => p.id === numericId) : null;
      
      if (staticProduct) {
        console.log('✅ [FreeResultPage] allProducts에서 발견:', staticProduct);
        setProduct(staticProduct);
        setIsLoading(false);
        return;
      }

      // allProducts에 없으면 마스터 콘텐츠 조회 (UUID인 경우)
      if (id) {
        console.log('🔍 [FreeResultPage] allProducts에 없음 → master_contents 조회');
        
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[#999999]">로딩 중...</p>
        </div>
      </div>
    );
  }
  
  if (!recordId || !product) {
    console.error('❌ [FreeResultPage] recordId 또는 product 없음');
    console.error('  - recordId:', recordId);
    console.error('  - product:', product);
    
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

  const recommendedProducts = allProducts
    .filter(p => p.id !== Number(id) && (p.category === product.category || p.type === 'paid'))
    .slice(0, 6)
    .map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      image: p.image
    }));

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
      onClose={() => navigate('/')}
      recommendedProducts={recommendedContents.length > 0 ? recommendedContents : recommendedProducts}
      onProductClick={(productId) => {
        navigate(`/product/${productId}`);
      }}
      onBannerClick={() => {
        const fortuneProduct = allProducts.find(p => p.id === 5 || (p.type === 'paid' && p.category === '재물'));
        if (fortuneProduct) {
          navigate(`/product/${fortuneProduct.id}`);
        }
      }}
      onUserIconClick={() => navigate('/profile')}
    />
  );
}

// Profile Page Wrapper
function ProfilePageWrapper() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <ProfilePage
      onBack={() => navigate('/')}
      onLogout={handleLogout}
      onNavigateToMasterContent={() => navigate('/master/content')}
      onNavigateToTermsOfService={() => navigate('/terms-of-service')}
      onNavigateToPrivacyPolicy={() => navigate('/privacy-policy')}
      onNavigateToPurchaseHistory={() => navigate('/purchase-history')}
      onNavigateToSajuInput={() => navigate('/saju/input')}
      onNavigateToSajuManagement={() => navigate('/saju/management')}
    />
  );
}

// Login Page New Wrapper
function LoginPageNewWrapper() {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: any) => {
    console.log('🎉 로그인 성공! user:', user);
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
      onBack={() => navigate('/')}
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

  const handleComplete = () => {
    // ⭐️ 가입 축하 쿠폰 페이지로 이동
    console.log('✅ 회원가입 완료 → 가입 축하 쿠폰 페이지로 이동');
    navigate('/welcome-coupon', { replace: true });
  };

  return (
    <TermsPage
      onBack={() => navigate('/login/new')}
      onComplete={handleComplete}
    />
  );
}

// ⭐ Welcome Coupon Page Wrapper
function WelcomeCouponPageWrapper() {
  const navigate = useNavigate();

  const handleClose = () => {
    // redirectAfterLogin 확인
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    
    if (redirectUrl) {
      console.log('✅ [WelcomeCoupon] 리다이렉트 URL 존재 → 이동:', redirectUrl);
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectUrl);
    } else {
      console.log('✅ [WelcomeCoupon] 리다이렉트 URL 없음 → 홈으로 이동');
      navigate('/');
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

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return (
    <FreeContentDetail
      contentId={id}
      onBack={() => navigate('/')}
      onHome={() => navigate('/')}
      onContentClick={(contentId) => {
        console.log('🔥 App.tsx navigate 시도 (replace):', `/master/content/detail/${contentId}`);
        // ⭐ 추천 콘텐츠 클릭 시 현재 페이지를 교체 (히스토리 쌓지 않음)
        navigate(`/master/content/detail/${contentId}`, { replace: true });
      }}
      onBannerClick={() => {
        // 배너 클릭 시 특정 콘텐츠로 이동 (예: 재물운)
        navigate('/');
      }}
      onPurchase={async () => {
        // 무료 콘텐츠는 onPurchase 사용 안함 (FreeContentDetail 내부 처리)
      }}
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
        if (returnTo) {
          navigate(returnTo);
        } else {
          navigate('/saju/management');
        }
      }}
    />
  );
}

// Saju Management Page Wrapper
function SajuManagementPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SajuManagementPage
      onBack={() => navigate('/profile')}
      onNavigateToInput={() => navigate('/saju/input')}
      onNavigateToAdd={() => navigate('/saju/add')}
      onEditMySaju={(sajuInfo) => {
        // 내 사주 수정 → SajuInputPage로 이동 (편집 모드)
        navigate('/saju/input', { state: { editMode: true, sajuData: sajuInfo, returnTo: '/saju/management' } });
      }}
      onEditOtherSaju={(sajuInfo) => {
        // 함께 보는 사주 수정 → SajuAddPage로 이동 (편집 모드)
        navigate('/saju/add', { state: { editMode: true, sajuData: sajuInfo, returnTo: '/saju/management' } });
      }}
    />
  );
}

// Saju Add Page Wrapper
function SajuAddPageWrapper() {
  const navigate = useNavigate();

  return (
    <SajuAddPage
      onBack={() => navigate('/saju/management')}
      onSaved={() => navigate('/saju/management')}
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

  const handlePurchaseSuccess = async () => {
    try {
      // 본인 사주 정보 ��재 여부 확인
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      
      if (!user?.id) {
        console.log('로그인되지 않은 사용자');
        navigate('/');
        return;
      }

      console.log('🔍 [결제완료] 사주 정보 조회 시작, user_id:', user.id);

      // 모든 사주 정보 조회 (디버깅용)
      const { data: allSajuRecords, error: allError } = await supabase
        .from('saju_records')
        .select('id, full_name, notes, is_primary')
        .eq('user_id', user.id);

      console.log('📋 [결제완료] 전체 사주 레코드:', allSajuRecords);
      console.log('📋 [결제완료] 사주 레코드 상세:');
      allSajuRecords?.forEach((record, idx) => {
        console.log(`   [${idx}] id: ${record.id}, name: ${record.full_name}, notes: ${record.notes}, is_primary: ${record.is_primary}`);
      });

      // ⭐️ is_primary 필드로 본인 사주 조회 (notes 대신)
      const { data: mySaju, error } = await supabase
        .from('saju_records')
        .select('id, full_name, notes, is_primary')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = Row not found (정상 케이스)
        console.error('❌ [결제완료] 사주 정보 조회 실패:', error);
      }

      console.log('✅ [결제완료] 본인 사주 정보:', mySaju);

      // 분기 처리
      if (mySaju) {
        // 본인 사주 있음 → 사주 정보 선택 페이지
        console.log('✅ [결제완료] 본인 사주 있음 → 사주 선택 페이지로 이동');
        navigate(`/product/${id}/saju-select`);
      } else {
        // 본인 사주 없음 → 사주 정보 입력 페이지 (결제용)
        console.log('📝 [결제완료] 본인 사주 없음 → 사주 입력 페이지로 이동');
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
    return (
      <div className="bg-[#f9f9f9] relative w-full min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="font-medium text-[16px] text-[#1b1b1b]">
            한 확인 중...
          </p>
        </div>
      </div>
    );
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

// Sentry 에러 폴백 컴포넌트
function SentryErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9]">
      <div className="text-center p-6">
        <p className="text-[#1b1b1b] text-lg font-medium mb-2">문제가 발생했어요</p>
        <p className="text-[#999999] text-sm mb-4">잠시 후 다시 시도해주세요.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#48b2af] text-white px-6 py-2 rounded-lg"
        >
          새로고침
        </button>
      </div>
    </div>
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

  // 🛡️ iOS Safari BFCache 문제 해결
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // BFCache에서 복원된 경우 (persisted = true)
      if (event.persisted) {
        console.log('🔄 [BFCache] iOS Safari에서 캐시 복원 감지');

        // 현재 URL 경로 확인
        const currentPath = window.location.pathname;
        console.log('📍 [BFCache] 현재 경로:', currentPath);

        // 페이지 강제 새로고침으로 React 상태 재동기화
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
      <Router>
        <HistoryDebug />
        <GAInit />
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
        <Route path="/result/saju" element={<SajuResultPage />} />
        <Route path="/result/tarot" element={<TarotResultPage />} />
        <Route path="/tarot/shuffle" element={<TarotShufflePage />} /> {/* ⭐ 타로 셔플 페이지 */}
        <Route path="/signup/terms" element={<TermsPageWrapper />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/welcome-coupon" element={<WelcomeCouponPageWrapper />} />
        <Route path="/result/complete" element={<ResultCompletePage />} />
        <Route path="/tarot-demo" element={<TarotDemo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-[15px] shadow-lg',
            title: 'text-white text-[13px] font-normal leading-[22px]',
          },
          style: {
            marginBottom: '116px',
          },
          success: {
            icon: (
              <svg className="size-6 shrink-0" fill="none" viewBox="0 0 24 24">
                <path 
                  d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
                  fill="#46BB6F"
                />
              </svg>
            ),
          },
        }}
      />
      <GlobalAIMonitor />
    </Router>
    </Sentry.ErrorBoundary>
  );
}