import { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import svgPaths from "../imports/svg-tta3ixz6w2";
import emptyStateSvgPaths from "../imports/svg-hw6oxtisye";
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import Loading from './Loading';
import { getTarotCardsForQuestions } from '../lib/tarotCards';
import { SajuKebabMenu } from './SajuKebabMenu';
import { ConfirmDialog } from './ConfirmDialog';
import SajuCard, { SajuCardData } from './SajuCard';

interface SajuRecord {
  id: string;
  full_name: string;
  gender: string;
  birth_date: string;
  birth_time: string;
  notes?: string;
  is_primary?: boolean;
  calendar_type?: string;
  zodiac?: string;
  relationship?: string;
}

export default function SajuSelectPage() {
  const navigate = useNavigate();
  const { id: productId } = useParams();
  const location = useLocation();
  const [selectedSajuId, setSelectedSajuId] = useState<string | null>(null);
  const [sajuList, setSajuList] = useState<SajuRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [loadingName, setLoadingName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false); // ⭐ 중복 호출 방지
  
  // ⭐ 케밥 메뉴 상태
  const [kebabMenuOpen, setKebabMenuOpen] = useState(false);
  const [kebabMenuPosition, setKebabMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedSajuForKebab, setSelectedSajuForKebab] = useState<SajuRecord | null>(null);
  
  // ⭐ 삭제 확인 다이얼로그 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 페이지 마운트 시 스크롤 최상단으로 리셋 (iOS Safari 호환)
  // useLayoutEffect 사용: 화면 렌더링 전에 동기적으로 실행
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // ⭐ iOS Safari 스와이프 뒤로가기 대응 - 페이지가 다시 보일 때 케밥 메뉴 닫기
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 [SajuSelectPage] 페이지 visible → 케밥 메뉴 닫기');
        setKebabMenuOpen(false);
        setSelectedSajuForKebab(null);
      }
    };

    // ⭐ pageshow: bfcache 복원 시 (event.persisted=true) 바텀시트 닫기
    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('🔄 [SajuSelectPage] pageshow → persisted:', event.persisted);
      // bfcache에서 복원되었거나 일반 pageshow 모두 처리
      setKebabMenuOpen(false);
      setSelectedSajuForKebab(null);
    };

    // ⭐ popstate: 브라우저 뒤로가기/앞으로가기 시 바텀시트 닫기
    const handlePopState = () => {
      console.log('🔄 [SajuSelectPage] popstate → 케밥 메뉴 닫기');
      setKebabMenuOpen(false);
      setSelectedSajuForKebab(null);
    };

    // ⭐ focus: 윈도우가 포커스를 받을 때 바텀시트 닫기 (iOS Safari 추가 보호)
    const handleFocus = () => {
      console.log('🔄 [SajuSelectPage] focus → 케밥 메뉴 닫기');
      setKebabMenuOpen(false);
      setSelectedSajuForKebab(null);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    // ⭐ 페이지 진입/복귀 시 케밥 메뉴 닫기 (iOS Safari 스와이프 뒤로가기 대응)
    setKebabMenuOpen(false);
    setSelectedSajuForKebab(null);

    // ⭐ URL 쿼리 파라미터에서 orderId 가져오기 (구매내역에서 재접속한 경우)
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      console.log('📦 [SajuSelectPage] orderId 감지:', orderId);
      console.log('💾 [SajuSelectPage] localStorage에 pendingOrderId 저장');
      localStorage.setItem('pendingOrderId', orderId);
    }

    // ⭐ 뒤로가기를 위한 referrer 저장
    // orderId가 있고 아직 referrer가 저장되지 않은 경우에만 저장
    // (사주 추가 페이지에서 돌아온 경우 기존 referrer 유지)
    const existingReferrer = sessionStorage.getItem('sajuSelectReferrer');
    if (orderId && !existingReferrer) {
      sessionStorage.setItem('sajuSelectReferrer', '/purchase-history');
      console.log('💾 [SajuSelectPage] referrer 저장: /purchase-history');
    }

    loadSajuList();
  }, [location]);

  const loadSajuList = async () => {
    try {
      // ⭐ 항상 Supabase에서 데이터 로드 (DEV/PROD 동일)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ 로그인 필요');
        navigate('/login');
        return;
      }

      const { data: sajuData, error } = await supabase
        .from('saju_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 사주 목록 조회 실패:', error);
        setIsLoading(false);
        return;
      }

      setSajuList(sajuData || []);
      
      // ⭐ 대표 사주 자동 선택 (is_primary=true → 본인 사주 → 첫 번째 사주 순)
      const primarySaju = (sajuData || []).find(s => s.is_primary);
      const mySaju = (sajuData || []).find(s => s.notes === '본인');
      
      if (primarySaju) {
        setSelectedSajuId(primarySaju.id);
        console.log('✅ [유료사주선택] 대표 사주 자동 선택:', primarySaju.id, primarySaju.full_name);
      } else if (mySaju) {
        setSelectedSajuId(mySaju.id);
        console.log('✅ [유료사주선택] 본인 사주 자동 선택:', mySaju.id);
      } else if (sajuData && sajuData.length > 0) {
        setSelectedSajuId(sajuData[0].id);
        console.log('✅ [유료사주선택] 첫 번째 사주 자동 선택:', sajuData[0].id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('사주 목록 로드 실패:', error);
      setIsLoading(false);
    }
  };

  const handleAddSaju = () => {
    // ⭐ 함께 보는 사주 20개 제한 체크
    const otherSajuCount = sajuList.filter(s => s.notes !== '본인').length;
    if (otherSajuCount >= 20) {
      toast.warning('사주 정보는 최대 20개까지 등록할 수 있습니다.', { duration: 2200 });
      return;
    }

    // ⭐ 관계 사주 추가 페이지로 이동 (함께 보는 사주 추가)
    navigate('/saju/add', {
      state: {
        returnTo: `/product/${productId}/saju-select`
      }
    });
  };

  const handleNext = async () => {
    if (!selectedSajuId) {
      toast.error('사주를 선택해주세요.');
      return;
    }
    
    // ⭐ 중복 호출 방지
    if (isGenerating) {
      console.warn('⚠️ [사주선택] 이미 처리 중입니다.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      console.log('🚀 [사주선택] 선택된 사주 ID:', selectedSajuId);

      // ⭐️ 1단계: 최소한의 정보만 조회 (즉시 로딩 페이지 이동을 위해)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('로그인이 필요합니다.');
        setIsGenerating(false);
        return;
      }

      // 진행 중인 주문 조회 (가장 중요!)
      console.log('🔍 [사주선택] 진행 중인 주문 조회...');

      // ⭐ localStorage에 pendingOrderId가 있으면 해당 주문 직접 조회 (구매내역에서 재접속한 경우)
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      let orders: any[] = [];
      let ordersError: any = null;

      if (pendingOrderId) {
        console.log('🔍 [사주선택] pendingOrderId로 직접 조회:', pendingOrderId);
        const { data, error } = await supabase
          .from('orders')
          .select('id, content_id, ai_generation_completed')
          .eq('id', pendingOrderId)
          .eq('user_id', user.id)
          .single();

        orders = data ? [data] : [];
        ordersError = error;
      } else {
        // 일반적인 경우: 최근 10분 이내의 미완료 주문 조회
        console.log('🔍 [사주선택] 최근 미완료 주문 조회...');
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('orders')
          .select('id, content_id, ai_generation_completed')
          .eq('user_id', user.id)
          .eq('ai_generation_completed', false)
          .gte('created_at', tenMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(1);

        orders = data || [];
        ordersError = error;
      }

      if (ordersError) {
        console.error('❌ [사주선택] 주문 조회 실패:', ordersError);
        toast.error('주문 정보를 불러올 수 없습���다. 다시 시도해주세요.');
        setIsGenerating(false);
        return;
      }

      if (!orders || orders.length === 0) {
        console.error('❌ [사주선택] 진행 중인 주문이 없습니다!');
        toast.error('주문 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        setIsGenerating(false);
        return;
      }

      const existingOrder = orders[0];
      const orderId = existingOrder.id;
      const contentId = existingOrder.content_id;

      console.log('✅ [사주선택] 진행 중인 주문 발견:', orderId);

      // 선택된 사주 정보 조회 (이름 표시용)
      const { data: sajuData } = await supabase
        .from('saju_records')
        .select('full_name, gender, birth_date, birth_time')
        .eq('id', selectedSajuId)
        .single();

      if (sajuData) {
        setLoadingName(sajuData.full_name);
      }

      // ⭐️ 2단계: 즉시 로딩 페이지로 이동 (사용자 대기 시간 최소화!)
      console.log('🚀 [사주선택] 로딩 페이지로 즉시 이동');
      navigate(`/loading?contentId=${contentId}&orderId=${orderId}`);

      // ⭐️ 3단계: 백그라운드에서 대표 사주 업데이트 및 주문 업데이트 (비동기)
      console.log('🔄 [사주선택] 백그라운드 업데이트 시작...');
      
      // 백그라운드 작업을 Promise로 감싸서 비동기 처리
      Promise.all([
        // 대표 사주 업데이트
        (async () => {
          try {
            // 모든 사주 is_primary=false로 변경
            await supabase
              .from('saju_records')
              .update({ is_primary: false })
              .eq('user_id', user.id);

            // 선택된 사주만 is_primary=true로 변경
            await supabase
              .from('saju_records')
              .update({ is_primary: true })
              .eq('id', selectedSajuId)
              .eq('user_id', user.id);

            console.log('✅ [백그라운드] 대표 사주 업데이트 완료');
          } catch (error) {
            console.error('❌ [백그라운드] 대표 사주 업데이트 실패:', error);
          }
        })(),
        
        // 주문에 사주 정보 업데이트
        (async () => {
          if (sajuData) {
            try {
              await supabase
                .from('orders')
                .update({
                  saju_record_id: selectedSajuId,
                  full_name: sajuData.full_name,
                  gender: sajuData.gender,
                  birth_date: sajuData.birth_date,
                  birth_time: sajuData.birth_time,
                  updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

              console.log('✅ [백그라운드] 주문 업데이트 완료');
            } catch (error) {
              console.error('❌ [백그라운드] 주문 업데이트 실패:', error);
            }
          }
        })()
      ]).then(() => {
        console.log('✅ [백그라운드] 모든 업데이트 완료');
      });

      // ⭐️ 백그라운드에서 AI ���변 생성 시작 (비동기, 결과 대기 안 함)
      // 이미 AI 생성이 완료되었거나 진행 중인지 확인
      if (existingOrder.ai_generation_completed === true) {
        console.log('✅ [사주선택] AI 생성 이미 완료됨');
        return;
      }

      // ⭐ AI 생성이 진행 중인지 확인 (order_results 테이블 체크)
      const { data: resultsCheck, error: resultsError } = await supabase
        .from('order_results')
        .select('id')
        .eq('order_id', orderId)
        .limit(1);

      // ⭐ 404 에러는 정상 (데이터 없음), 다른 에러만 로그
      if (resultsError && resultsError.code !== 'PGRST116') {
        console.warn('⚠️ [사주선택] order_results 체크 중 에러 (무시):', resultsError);
      }

      if (resultsCheck && resultsCheck.length > 0) {
        console.log('⏳ [사주선택] AI 생성 이미 진행 중 → 새 호출 생략');
        return;
      }
      
      console.log('✅ [사주선택] AI 생성 이력 없음 → 백그라운드 생성 시작');
      
      // ⭐ 타로 콘텐츠인지 확인하고 타로 카드 선택
      const { data: contentData } = await supabase
        .from('master_contents')
        .select('category_main')
        .eq('id', existingOrder.content_id)
        .single();
      
      const { data: questionsData } = await supabase
        .from('master_content_questions')
        .select('question_type')
        .eq('content_id', existingOrder.content_id)
        .eq('question_type', 'tarot');
      
      const isTarotContent = contentData?.category_main?.includes('타로') || contentData?.category_main?.toLowerCase() === 'tarot';
      const tarotQuestionCount = questionsData?.length || 0;
      
      let requestBody: any = {
        contentId: existingOrder.content_id,
        orderId: orderId,
        sajuRecordId: selectedSajuId
      };
      
      // 타로 콘텐츠이고 타로 질문이 있으면 랜덤 카드 선택
      if (isTarotContent && tarotQuestionCount > 0) {
        const tarotCards = getTarotCardsForQuestions(tarotQuestionCount);
        requestBody.tarotCards = tarotCards;
        console.log('🎴 [타로] 랜덤 카드 선택:', tarotCards);
      }
      
      console.log('📤 [사주선택] 백그라운드 Edge Function 호출:', requestBody);
      
      // ⭐ 백그라운드에서 실행 (await 없이)
      supabase.functions
        .invoke('generate-content-answers', {
          body: requestBody
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ [백그라운드] AI 생성 실패:', error);
          } else {
            console.log('✅ [백그라운드] AI 생성 성공:', data);
          }
        })
        .catch((err) => {
          console.error('❌ [백그라운드] AI 생성 오류:', err);
        });

    } catch (error) {
      console.error('❌ [사주선택] 오류:', error);
      toast.error('처리 중 오류가 발생했습니다.');
      setIsGenerating(false);
    }
    // ⭐ finally 제거 - 백그라운드 실행이므로 상태 유지 필요 없음
  };

  // 프로필 이미지 (임시)
  const getProfileImageUrl = (index: number) => {
    const images = [
      "figma:asset/23b9117ba4bdef1f5ecec145e7fd9de948dfdc19.png",
      "figma:asset/daaca24c14d101c5cbe4ec842ac5cd84bb75641c.png",
      "figma:asset/5312b734fc1c2fbac6211448d9eaa86aaab976d3.png",
      "figma:asset/35896a24e9fd1c140809ac07411f35177742c019.png"
    ];
    return images[index % images.length];
  };

  /**
   * 케밥 버튼 클릭 핸들러
   */
  const handleKebabClick = (event: React.MouseEvent, saju: SajuRecord) => {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    setKebabMenuPosition({
      top: rect.bottom,
      left: rect.right,
    });
    setSelectedSajuForKebab(saju);
    setKebabMenuOpen(true);
  };

  /**
   * 정보 수정 핸들러
   * ⭐ iOS Safari bfcache 대응: 바텀시트가 완전히 닫힌 후 네비게이션
   */
  const handleEditSaju = () => {
    if (!selectedSajuForKebab) return;

    console.log('✏️ [SajuSelectPage] 수정 시작:', selectedSajuForKebab);

    // 네비게이션에 필요한 데이터 미리 저장 (클로저)
    const sajuToEdit = selectedSajuForKebab;
    const currentPath = location.pathname + location.search;

    // ⭐ 케밥 메뉴(바텀시트) 상태 즉시 초기화
    setKebabMenuOpen(false);
    setSelectedSajuForKebab(null);

    // ⭐ setTimeout 150ms: 바텀시트 닫힘 애니메이션 완료 + React 렌더링 대기
    // iOS Safari bfcache에 바텀시트가 닫힌 상태로 저장됨
    setTimeout(() => {
      if (sajuToEdit.notes === '본인') {
        navigate('/saju/input', { state: { sajuInfo: sajuToEdit, returnTo: currentPath } });
      } else {
        navigate('/saju/add', { state: { sajuInfo: sajuToEdit, returnTo: currentPath } });
      }
    }, 150);
  };

  /**
   * 삭제 버튼 클릭 핸들러 (다이얼로그 열기)
   */
  const handleDeleteClick = () => {
    // 케밥 메뉴 닫기
    setKebabMenuOpen(false);
    // 삭제 확인 다이얼로그 열기
    setIsDeleteDialogOpen(true);
  };

  /**
   * 사주 정보 삭제 확인 핸들러
   */
  const handleConfirmDelete = async () => {
    if (!selectedSajuForKebab) return;

    // 다이얼로그 닫기
    setIsDeleteDialogOpen(false);

    // 본인 사주는 삭제 불가
    if (selectedSajuForKebab.notes === '본인') {
      console.error('❌ [SajuSelectPage] 본인 사주는 삭제할 수 없습니다');
      toast.error('본인 사주는 삭제할 수 없습니다.');
      return;
    }

    try {
      console.log('🗑️ [SajuSelectPage] 삭제 시작:', selectedSajuForKebab.id);

      // 현재 로그인된 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ [SajuSelectPage] 로그인 필요');
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 1단계: 해당 사주를 참조하는 orders 조회
      const { data: relatedOrders, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('saju_record_id', selectedSajuForKebab.id);

      if (fetchError) throw fetchError;

      console.log('📋 [SajuSelectPage] 연관된 주문:', relatedOrders?.length || 0, '건');

      // 2단계: orders에 사주 정보 하드코딩으로 채우기
      if (relatedOrders && relatedOrders.length > 0) {
        for (const order of relatedOrders) {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              full_name: order.full_name || selectedSajuForKebab.full_name,
              gender: order.gender || selectedSajuForKebab.gender,
              birth_date: order.birth_date || selectedSajuForKebab.birth_date,
              birth_time: order.birth_time || selectedSajuForKebab.birth_time,
              saju_record_id: null // FK 해제
            })
            .eq('id', order.id);

          if (updateError) {
            console.error('❌ [SajuSelectPage] 주문 업데이트 실패:', order.id, updateError);
            throw updateError;
          }

          console.log('✅ [SajuSelectPage] 주문 업데이트 완료:', order.id);
        }
      }

      // 3단계: saju_records 삭제 (user_id 조건 추가로 RLS 우회)
      const { data: deletedData, error: deleteError } = await supabase
        .from('saju_records')
        .delete()
        .eq('id', selectedSajuForKebab.id)
        .eq('user_id', user.id)
        .select();

      if (deleteError) {
        console.error('❌ [SajuSelectPage] 삭제 쿼리 에러:', deleteError);
        throw deleteError;
      }

      // 삭제된 행 수 확인
      if (!deletedData || deletedData.length === 0) {
        console.error('❌ [SajuSelectPage] 삭제된 행이 없음. RLS 정책 또는 권한 문제일 수 있습니다.');
        throw new Error('사주 정보를 삭제할 수 없습니다. 권한을 확인해주세요.');
      }

      console.log('✅ [SajuSelectPage] 사주 정보 삭제 완료:', selectedSajuForKebab.id, '(삭제된 행:', deletedData.length, '개)');
      toast.success('삭제되었습니다.');

      // ⭐ 삭제된 사주가 대표 사주(is_primary=true)였다면, 본인 사주를 대표 사주로 설정
      if (selectedSajuForKebab.is_primary) {
        console.log('🔄 [SajuSelectPage] 대표 사주 삭제됨 → 본인 사주를 대표 사주로 변경');
        
        // 본인 사주 조회
        const { data: mySajuData, error: mySajuError } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('notes', '본인')
          .single();
        
        if (mySajuError) {
          console.error('❌ [SajuSelectPage] 본인 사주 조회 실패:', mySajuError);
        } else if (mySajuData) {
          // 본인 사주를 대표 사주로 설정
          const { error: setPrimaryError } = await supabase
            .from('saju_records')
            .update({ is_primary: true })
            .eq('id', mySajuData.id)
            .eq('user_id', user.id);
          
          if (setPrimaryError) {
            console.error('❌ [SajuSelectPage] 본인 사주 대표 설정 실패:', setPrimaryError);
          } else {
            console.log('✅ [SajuSelectPage] 본인 사주를 대표 사주로 설정 완료:', mySajuData.id);
          }
        } else {
          console.log('ℹ️ [SajuSelectPage] 본인 사주 없음 - 대표 사주 설정 생략');
        }
      }

      // 4단계: 목록 새로고침
      await loadSajuList();
    } catch (error) {
      console.error('❌ [SajuSelectPage] 삭제 실패:', error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const mySaju = sajuList.filter(s => s.notes === '본인');
  const otherSaju = sajuList.filter(s => s.notes !== '본인');

  if (isLoading) {
    return (
      <div className="bg-white relative min-h-screen w-full flex justify-center items-center">
        <p className="text-[#848484]">로딩 중...</p>
      </div>
    );
  }

  if (showLoading) {
    return <Loading name={loadingName} />;
  }

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[390px] relative">
        {/* Top Navigation - 고정 */}
        <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full max-w-[390px] z-10 bg-white">
          {/* Navigation Bar */}
          <div className="bg-white h-[52px] relative shrink-0 w-full">
            <div className="flex flex-col justify-center size-full">
              <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <button
                    onClick={() => {
                      // ⭐ 저장된 referrer로 이동 (사주 추가 → 사주 선택 → 뒤로가기 시 루프 방지)
                      const referrer = sessionStorage.getItem('sajuSelectReferrer');
                      sessionStorage.removeItem('sajuSelectReferrer'); // 사용 후 삭제
                      if (referrer) {
                        console.log('🔙 [SajuSelectPage] referrer로 이동:', referrer);
                        navigate(referrer);
                      } else {
                        console.log('🔙 [SajuSelectPage] referrer 없음 → /purchase-history로 이동');
                        navigate('/purchase-history');
                      }
                    }}
                    className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] bg-transparent border-none cursor-pointer"
                  >
                    <div className="relative shrink-0 size-[24px]">
                      <div className="absolute contents inset-0">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                          <g id="arrow-left">
                            <path d={svgPaths.p2a5cd480} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </button>
                  <p className="basis-0 grow leading-[25.5px] font-semibold min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">사주 정보 선택</p>
                  <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
                </div>
              </div>
            </div>
          </div>
          <div className="h-[16px] shrink-0 w-full" />
        </div>

        {/* Main Content - 스크롤 가능 영역 */}
        <div className="pt-[68px] pb-[120px] px-[20px]">
          {/* 내 사주 섹션 */}
          {mySaju.length > 0 && (
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full mb-[44px]">
              {/* Section Title */}
              <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                    <p className="basis-0 grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">내 사주</p>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                    <path d="M0 0.5H350" stroke="#F3F3F3" />
                  </svg>
                </div>
              </div>

              {/* 사주 카드 - 공통 컴포넌트 사용 */}
              {mySaju.map((saju) => (
                <SajuCard
                  key={saju.id}
                  saju={saju as SajuCardData}
                  isSelected={selectedSajuId === saju.id}
                  onSelect={() => setSelectedSajuId(saju.id)}
                  onKebabClick={(event) => handleKebabClick(event, saju)}
                />
              ))}
            </div>
          )}

          {/* 함께 보는 사주 섹션 */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            {/* Section Title */}
            <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                  <p className="basis-0 grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">함께 보는 사주</p>
                </div>
              </div>
              <div className="h-0 relative shrink-0 w-full">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                  <path d="M0 0.5H350" stroke="#F3F3F3" />
                </svg>
              </div>
            </div>

            {/* Empty State or Cards */}
            {otherSaju.length === 0 ? (
              <div className="content-stretch flex flex-col gap-[28px] items-center justify-center py-[40px] relative shrink-0 w-full">
                <div className="relative shrink-0 size-[62px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62 62">
                    <path d={emptyStateSvgPaths.p30e68780} fill="#E7E7E7" />
                    <path d={emptyStateSvgPaths.p14ef2c00} fill="#E7E7E7" />
                  </svg>
                </div>
                <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                  <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[25.5px] relative shrink-0 text-[#848484] text-[15px] text-center tracking-[-0.3px] w-full">
                    함께 보는 사주를 등록해 보세요.
                    <br />
                    소중한 인연의 운세를 함께 확인할 수 있어요.
                  </p>
                </div>
              </div>
            ) : (
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                {otherSaju.map((saju) => (
                  <SajuCard
                    key={saju.id}
                    saju={saju as SajuCardData}
                    isSelected={selectedSajuId === saju.id}
                    onSelect={() => setSelectedSajuId(saju.id)}
                    onKebabClick={(event) => handleKebabClick(event, saju)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Buttons - 고정 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[390px] z-10">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                  <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                    {/* 사주 정보 추가 버튼 */}
                    <motion.button
                      onClick={handleAddSaju}
                      onTouchStart={() => {}}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.1 }}
                      className="basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0 bg-[#f0f8f8] h-[56px] cursor-pointer border-none transition-colors duration-150 active:bg-[#e0f0f0]"
                    >
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                            <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[#48b2af] text-[16px] text-nowrap tracking-[-0.32px]">사주 정보 추가</p>
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    {/* 다음 버튼 */}
                    <motion.button
                      onClick={handleNext}
                      onTouchStart={() => {}}
                      disabled={!selectedSajuId}
                      whileTap={selectedSajuId ? { scale: 0.96 } : {}}
                      transition={{ duration: 0.1 }}
                      className={`basis-0 grow min-h-px min-w-px relative rounded-[16px] shrink-0 h-[56px] cursor-pointer border-none transition-colors duration-150 ${
                        selectedSajuId ? 'bg-[#48b2af] active:bg-[#3a9693]' : 'bg-[#f8f8f8]'
                      }`}
                    >
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                            <p className={`font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap tracking-[-0.32px] ${
                              selectedSajuId ? 'text-white' : 'text-[#b7b7b7]'
                            }`}>다음</p>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white h-[28px] relative shrink-0 w-full">
            <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" />
          </div>
        </div>

        {/* 케밥 메뉴 */}
        {kebabMenuOpen && selectedSajuForKebab && (
          <SajuKebabMenu
            isOpen={kebabMenuOpen}
            position={kebabMenuPosition}
            isOwnerSaju={selectedSajuForKebab.notes === '본인'}
            onEdit={handleEditSaju}
            onDelete={handleDeleteClick}
            onClose={() => setKebabMenuOpen(false)}
          />
        )}

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="등록된 사주를 삭제하시겠어요?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
        />
      </div>
    </div>
  );
}