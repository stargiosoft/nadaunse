/**
 * 무료 콘텐츠 전용 사주 정보 선택 페이지
 * - 로그인 사용자가 등록된 사주 정보를 선택
 * - "내 사주" + "함께 보는 사주" 섹션
 * - UI는 SajuManagementPage와 동일, 하단 버튼만 다름
 */

import { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import svgPaths from "../imports/svg-b51v8udqqu"; // ⭐️ SajuManagementPage와 동일한 SVG 사용
import emptyStateSvgPaths from "../imports/svg-297vu4q7h0"; // Empty State 아이콘 (둥지)
import { SajuKebabMenu } from './SajuKebabMenu';
import { ConfirmDialog } from './ConfirmDialog';
import SajuCard, { SajuCardData } from './SajuCard';
import { PageLoader } from './ui/PageLoader';

interface FreeSajuSelectPageProps {
  productId: string;
  onBack: () => void;
  prefetchedSajuRecords?: SajuRecord[] | null; // ⭐ BirthInfoPage에서 전달받은 전체 사주 배열
  prefetchedMySaju?: SajuRecord | null; // ⭐ ProductDetailPage에서 전달받은 본인 사주 (하위 호환)
}

interface SajuRecord {
  id: string;
  user_id?: string;
  full_name: string;
  gender: string;
  birth_date: string;
  birth_time: string;
  notes: string;
  zodiac_sign?: string;
  chinese_zodiac?: string;
  created_at?: string;
  updated_at?: string;
  is_primary?: boolean;
  calendar_type?: string;
  zodiac?: string;
}

export default function FreeSajuSelectPage({ productId, onBack, prefetchedSajuRecords, prefetchedMySaju }: FreeSajuSelectPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ prefetchedSajuRecords(전체 배열)가 있으면 우선 사용, 없으면 prefetchedMySaju(단일) 사용
  const hasPrefetchedData = !!(prefetchedSajuRecords?.length || prefetchedMySaju);

  // 🚀 동기적 캐시 확인 (useState 초기화 시점)
  const getInitialState = () => {
    // prefetched 데이터가 있으면 우선 사용
    if (prefetchedSajuRecords?.length) {
      return { records: prefetchedSajuRecords, hasCache: true };
    }
    if (prefetchedMySaju) {
      return { records: [prefetchedMySaju], hasCache: true };
    }

    // localStorage 캐시 확인
    try {
      const cachedJson = localStorage.getItem('saju_records_cache');
      if (cachedJson) {
        const cached = JSON.parse(cachedJson) as SajuRecord[];
        if (cached.length > 0) {
          console.log('🚀 [FreeSajuSelectPage] 초기화 시 캐시 발견 → 즉시 렌더링');
          return { records: cached, hasCache: true };
        }
      }
    } catch (e) {
      console.error('❌ [FreeSajuSelectPage] 초기 캐시 파싱 실패:', e);
    }

    return { records: [], hasCache: false };
  };

  const initialState = getInitialState();
  const [sajuRecords, setSajuRecords] = useState<SajuRecord[]>(initialState.records);

  // ⭐ 초기 선택: 대표 사주 > 본인 사주 > 첫번째
  const getInitialSelectedId = () => {
    if (!initialState.records.length) return null;
    const primary = initialState.records.find(r => r.is_primary);
    if (primary) return primary.id;
    const mySaju = initialState.records.find(r => r.notes === '본인');
    if (mySaju) return mySaju.id;
    return initialState.records[0].id;
  };

  const [selectedSajuId, setSelectedSajuId] = useState<string | null>(getInitialSelectedId());
  // 🚀 캐시가 있으면 isLoading: false로 시작 (스켈레톤 없이 즉시 렌더링)
  const [isLoading, setIsLoading] = useState(!initialState.hasCache);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
        console.log('🔄 [FreeSajuSelectPage] 페이지 visible → 케밥 메뉴 닫기');
        setKebabMenuOpen(false);
        setSelectedSajuForKebab(null);
      }
    };

    // ⭐ pageshow: bfcache 복원 시 (event.persisted=true) 바텀시트 닫기
    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('🔄 [FreeSajuSelectPage] pageshow → persisted:', event.persisted);
      setKebabMenuOpen(false);
      setSelectedSajuForKebab(null);
    };

    // ⭐ popstate: 브라우저 뒤로가기/앞으로가기 시 바텀시트 닫기
    const handlePopState = () => {
      console.log('🔄 [FreeSajuSelectPage] popstate → 케밥 메뉴 닫기');
      setKebabMenuOpen(false);
      setSelectedSajuForKebab(null);
    };

    // ⭐ focus: 윈도우가 포커스를 받을 때 바텀시트 닫기 (iOS Safari 추가 보호)
    const handleFocus = () => {
      console.log('🔄 [FreeSajuSelectPage] focus → 케밥 메뉴 닫기');
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

  // ⭐ 사주 목록 로드 함수 (외부에서 호출 가능)
  const loadSajuRecords = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 [FreeSajuSelectPage] 사주 정보 로드 시작');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ [FreeSajuSelectPage] 로그인 필요');
        navigate(`/product/${productId}/birthinfo`);
        return;
      }

      console.log('✅ [FreeSajuSelectPage] 로그인 확인:', user.email);

      const { data: records, error } = await supabase
        .from('saju_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [FreeSajuSelectPage] 사주 정보 조회 실패:', error);
        throw error;
      }

      console.log('✅ [FreeSajuSelectPage] 사주 정보 로드 완료:', records?.length);

      if (!records || records.length === 0) {
        console.log('⚠️ [FreeSajuSelectPage] 사주 정보 없음 → 입력 페이지로 이동');
        navigate(`/product/${productId}/birthinfo`);
        return;
      }

      // 🚀 캐시 저장
      localStorage.setItem('saju_records_cache', JSON.stringify(records));

      setSajuRecords(records);

      // ⭐ prefetchedMySaju로 이미 선택된 경우 유지, 아니면 대표 사주 자동 선택
      setSelectedSajuId(prev => {
        // 이미 유효한 선택이 있으면 유지
        if (prev && records.find(r => r.id === prev)) {
          return prev;
        }
        // 대표 사주 자동 선택
        const primarySaju = records.find(r => r.is_primary);
        const mySaju = records.find(r => r.notes === '본인');

        if (primarySaju) return primarySaju.id;
        if (mySaju) return mySaju.id;
        return records[0].id;
      });
    } catch (error) {
      console.error('❌ [FreeSajuSelectPage] 에러:', error);
      alert('사주 정보를 불러올 수 없습니다.');
      onBack();
    } finally {
      setIsLoading(false);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  };

  // 사주 정보 로드
  useEffect(() => {
    // ⭐ 페이지 진입/복귀 시 케밥 메뉴 닫기
    setKebabMenuOpen(false);
    setSelectedSajuForKebab(null);

    // ⭐ prefetched 데이터가 있으면 DB 쿼리 스킵 + 캐시에 저장
    if (hasPrefetchedData) {
      console.log('✅ [FreeSajuSelectPage] prefetched 데이터 사용 → DB 쿼리 스킵');
      // 🚀 prefetched 데이터를 캐시에 저장 (두 번째 방문 시 즉시 로드용)
      // ⚠️ sajuRecords 대신 initialState.records 사용 (클로저 문제 방지)
      const recordsToCache = initialState.records;
      if (recordsToCache.length > 0) {
        localStorage.setItem('saju_records_cache', JSON.stringify(recordsToCache));
        console.log('💾 [FreeSajuSelectPage] prefetched 데이터 캐시 저장 완료:', recordsToCache.length, '개');
      } else {
        console.warn('⚠️ [FreeSajuSelectPage] prefetched 데이터 캐시 저장 실패 - 데이터 없음');
      }
      return;
    }

    // 🚀 캐시 유효성 확인 (사주 추가 후 돌아왔을 때 캐시가 삭제되었을 수 있음)
    const cachedJson = localStorage.getItem('saju_records_cache');
    if (cachedJson) {
      try {
        const cached = JSON.parse(cachedJson) as SajuRecord[];
        if (cached.length > 0) {
          console.log('✅ [FreeSajuSelectPage] 캐시 사용 → API 쿼리 스킵');
          // ⭐ 캐시 데이터로 상태 업데이트 (사주 추가 후 돌아온 경우 대응)
          setSajuRecords(cached);
          setIsLoading(false);
          // 선택된 사주가 유효한지 확인
          setSelectedSajuId(prev => {
            if (prev && cached.find(r => r.id === prev)) return prev;
            const primary = cached.find(r => r.is_primary);
            if (primary) return primary.id;
            const mySaju = cached.find(r => r.notes === '본인');
            if (mySaju) return mySaju.id;
            return cached[0]?.id || null;
          });
          return;
        }
      } catch (e) {
        console.error('❌ [FreeSajuSelectPage] 캐시 파싱 실패:', e);
      }
    }

    // 캐시가 없거나 무효화된 경우 API 호출
    console.log('✅ [FreeSajuSelectPage] 캐시 없음 → API 호출');
    loadSajuRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, hasPrefetchedData]);  // ← onBack, navigate 제거

  // "다음" 버튼 클릭
  const handleNext = () => {
    if (!selectedSajuId) {
      alert('사주 정보를 선택해주세요.');
      return;
    }

    const selectedSaju = sajuRecords.find(r => r.id === selectedSajuId);
    if (!selectedSaju) {
      alert('선택한 사주 정보를 찾을 수 없습니다.');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [FreeSajuSelectPage] 다음 버튼 클릭');
    console.log('📌 [FreeSajuSelectPage] 선택된 사주:', selectedSaju);
    console.log('🔀 [FreeSajuSelectPage] 로딩 페이지로 즉시 이동');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 🚀 UX 개선: 먼저 로딩 페이지로 이동 (즉시 반응)
    // ⭐ replace: true - iOS 스와이프 뒤로가기 시 콘텐츠 상세로 이동하도록 히스토리 교체
    navigate(`/free-loading?contentId=${productId}&sajuRecordId=${selectedSajuId}&userName=${selectedSaju.full_name}`, { replace: true });

    // ⭐ 백그라운드에서 대표 사주 업데이트 (navigate 후 비동기 처리)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          console.log('🔄 [FreeSajuSelectPage] 백그라운드: 대표 사주 업데이트 시작');

          // 1단계: 해당 사용자의 모든 사주 is_primary=false로 변경
          await supabase
            .from('saju_records')
            .update({ is_primary: false })
            .eq('user_id', user.id);

          // 2단계: 선택된 사주만 is_primary=true로 변경
          await supabase
            .from('saju_records')
            .update({ is_primary: true })
            .eq('id', selectedSajuId)
            .eq('user_id', user.id);

          // ⭐ 캐시 업데이트 (ProfilePage에서 즉시 사용 가능하도록)
          // 선택된 사주를 대표 사주로 캐시에 저장
          const updatedPrimarySaju = { ...selectedSaju, is_primary: true };
          localStorage.setItem('primary_saju', JSON.stringify(updatedPrimarySaju));

          // saju_records_cache도 업데이트 (is_primary 플래그 반영)
          const updatedRecords = sajuRecords.map(r => ({
            ...r,
            is_primary: r.id === selectedSajuId
          }));
          localStorage.setItem('saju_records_cache', JSON.stringify(updatedRecords));

          console.log('✅ [FreeSajuSelectPage] 백그라운드: 대표 사주 업데이트 완료 + 캐시 갱신');
          console.log('💾 [FreeSajuSelectPage] 캐시 저장:', updatedPrimarySaju.full_name, '(', updatedPrimarySaju.notes, ')');
        }
      } catch (error) {
        console.error('❌ [FreeSajuSelectPage] 백그라운드: 대표 사주 업데이트 실패:', error);
      }
    })();
  };

  // 사주 정보 추가 버튼 클릭
  const handleAddSaju = () => {
    // ⭐ 함께 보는 사주 20개 제한 체크
    const otherSajuCount = sajuRecords.filter(r => r.notes !== '본인').length;
    if (otherSajuCount >= 20) {
      toast.warning('사주 정보는 최대 20개까지 등록할 수 있습니다.', { duration: 2200 });
      return;
    }

    console.log('➕ [FreeSajuSelectPage] 사주 정보 추가 버튼 클릭');
    console.log('🔀 [FreeSajuSelectPage] 사주 입력 페이지로 이동:', `/product/${productId}/free-saju-add`);
    navigate(`/product/${productId}/free-saju-add`);
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

    console.log('✏️ [FreeSajuSelectPage] 수정 시작:', selectedSajuForKebab);

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
      console.error('❌ [FreeSajuSelectPage] 본인 사주는 삭제할 수 없습니다');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('🗑️ [FreeSajuSelectPage] 삭제 시작:', selectedSajuForKebab.id);

      // 현재 로그인된 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ [FreeSajuSelectPage] 로그인 필요');
        return;
      }

      // 1단계: 해당 사주를 참조하는 orders 조회
      const { data: relatedOrders, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('saju_record_id', selectedSajuForKebab.id);

      if (fetchError) throw fetchError;

      console.log('📋 [FreeSajuSelectPage] 연관된 주문:', relatedOrders?.length || 0, '건');

      // 2단계: orders에 사주 정보 하드코딩으로 채우기 (병렬 처리)
      if (relatedOrders && relatedOrders.length > 0) {
        await Promise.all(
          relatedOrders.map(order =>
            supabase
              .from('orders')
              .update({
                full_name: order.full_name || selectedSajuForKebab.full_name,
                gender: order.gender || selectedSajuForKebab.gender,
                birth_date: order.birth_date || selectedSajuForKebab.birth_date,
                birth_time: order.birth_time || selectedSajuForKebab.birth_time,
                saju_record_id: null // FK 해제
              })
              .eq('id', order.id)
              .then(({ error }) => {
                if (error) {
                  console.error('❌ [FreeSajuSelectPage] 주문 업데이트 실패:', order.id, error);
                  throw error;
                }
                console.log('✅ [FreeSajuSelectPage] 주문 업데이트 완료:', order.id);
              })
          )
        );
      }

      // 3단계: saju_records 삭제 (user_id 조건 추가로 RLS 우회)
      const { data: deletedData, error: deleteError } = await supabase
        .from('saju_records')
        .delete()
        .eq('id', selectedSajuForKebab.id)
        .eq('user_id', user.id)
        .select();

      if (deleteError) {
        console.error('❌ [FreeSajuSelectPage] 삭제 쿼리 에러:', deleteError);
        throw deleteError;
      }

      // 삭제된 행 수 확인
      if (!deletedData || deletedData.length === 0) {
        console.error('❌ [FreeSajuSelectPage] 삭제된 행이 없음. RLS 정책 또는 권한 문제일 수 있습니다.');
        throw new Error('사주 정보를 삭제할 수 없습니다. 권한을 확인해주세요.');
      }

      console.log('✅ [FreeSajuSelectPage] 사주 정보 삭제 완료:', selectedSajuForKebab.id, '(삭제된 행:', deletedData.length, '개)');

      // ⭐ 삭제된 사주가 대표 사주(is_primary=true)였다면, 본인 사주를 대표 사주로 설정
      if (selectedSajuForKebab.is_primary) {
        console.log('🔄 [FreeSajuSelectPage] 대표 사주 삭제됨 → 본인 사주를 대표 사주로 변경');
        
        // 본인 사주 조회
        const { data: mySajuData, error: mySajuError } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('notes', '본인')
          .single();
        
        if (mySajuError) {
          console.error('❌ [FreeSajuSelectPage] 본인 사주 조회 실패:', mySajuError);
        } else if (mySajuData) {
          // 본인 사주를 대표 사주로 설정
          const { error: setPrimaryError } = await supabase
            .from('saju_records')
            .update({ is_primary: true })
            .eq('id', mySajuData.id)
            .eq('user_id', user.id);
          
          if (setPrimaryError) {
            console.error('❌ [FreeSajuSelectPage] 본인 사주 대표 설정 실패:', setPrimaryError);
          } else {
            console.log('✅ [FreeSajuSelectPage] 본인 사주를 대표 사주로 설정 완료:', mySajuData.id);
          }
        } else {
          console.log('ℹ️ [FreeSajuSelectPage] 본인 사주 없음 - 대표 사주 설정 생략');
        }
      }

      // 4단계: 토스트 + 목록 새로고침
      toast.success('삭제되었습니다.');
      await loadSajuRecords();
      setSelectedSajuForKebab(null);
    } catch (error) {
      console.error('❌ [FreeSajuSelectPage] 삭제 실패:', error);
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  // 본인 사주와 함께 보는 사주 분리
  const mySaju = sajuRecords.find(r => r.notes === '본인');
  // ⭐ 최신순 정렬 (created_at 기준 내림차순, 같으면 id로 정렬)
  const otherSajus = sajuRecords
    .filter(r => r.notes !== '본인')
    .sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  const hasOtherSaju = otherSajus.length > 0;

  return (
    <div className="bg-white fixed inset-0 flex justify-center">
      <div className="w-full max-w-[390px] h-full flex flex-col bg-white">
        {/* Top Navigation - shrink-0로 고정 높이 */}
        <div className="bg-white shrink-0 w-full z-10">
        {/* Navigation Bar */}
        <div className="bg-white h-[52px] relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div onClick={onBack} className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer">
                  <div className="relative shrink-0 size-[24px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                    </svg>
                  </div>
                </div>
                <p className="basis-0 grow leading-[25.5px] font-semibold min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                  사주 정보 선택
                </p>
                <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="h-[16px] shrink-0 w-full" />
      </div>

      {/* Scrollable Content Area - flex-1로 남은 공간 차지, overscroll-contain으로 바운스 방지 */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-[20px] pb-[20px]">
          {/* 내 사주 섹션 */}
          {mySaju && (
            <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
              {/* Section Title */}
              <div className="content-stretch flex flex-col gap-[6px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                    <p className="basis-0 grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px] font-semibold">
                      내 사주
                    </p>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full">
                  <div className="absolute inset-[-0.5px_0]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                      <path d="M0 0.5H350" stroke="#F3F3F3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Profile Card - 공통 컴포넌트 사용 */}
              <SajuCard
                saju={mySaju as SajuCardData}
                isSelected={selectedSajuId === mySaju.id}
                onSelect={() => setSelectedSajuId(mySaju.id)}
                onKebabClick={(event) => handleKebabClick(event, mySaju)}
              />
            </div>
          )}

          {/* 함께 보는 사주 섹션 */}
          <div className="content-stretch flex flex-col gap-[120px] items-start relative shrink-0 w-full mt-[32px]">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              {/* Section Title */}
              <div className="content-stretch flex flex-col gap-[6px] items-center relative shrink-0 w-full mb-[-6px]">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                    <p className="basis-0 grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px] font-semibold">
                      함께 보는 사주
                    </p>
                  </div>
                </div>
                <div className="h-0 relative shrink-0 w-full">
                  <div className="absolute inset-[-0.5px_0]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                      <path d="M0 0.5H350" stroke="#F3F3F3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State or List */}
            {!hasOtherSaju ? (
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full -mt-[44px]">
                <div className="content-stretch flex flex-col gap-[28px] items-center justify-center relative shrink-0 w-full">
                  <div className="relative shrink-0 size-[64px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
                      <g id="Icons">
                        <path d={emptyStateSvgPaths.p3a144140} fill="#E7E7E7" id="Vector" />
                        <path d={emptyStateSvgPaths.p15b23580} fill="#D4D4D4" id="Vector_2" />
                        <path d={emptyStateSvgPaths.p3b09d000} fill="#D4D4D4" id="Vector_3" />
                        <path d={emptyStateSvgPaths.p1c433500} fill="#E7E7E7" id="Vector_4" />
                        <path d={emptyStateSvgPaths.p136e2000} fill="#F3F3F3" id="Vector_5" />
                        <path d={emptyStateSvgPaths.p15328600} fill="#D4D4D4" id="Vector_6" />
                        <path d={emptyStateSvgPaths.p1d148980} fill="#E7E7E7" id="Vector_7" />
                        <path d={emptyStateSvgPaths.p2d904400} fill="#F3F3F3" id="Vector_8" />
                      </g>
                    </svg>
                  </div>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                    <p className="font-normal leading-[25.5px] relative shrink-0 text-[#848484] text-[15px] text-center tracking-[-0.3px] w-full">
                      함께 보는 사주를 등록해 보세요.
                      <br />
                      소중한 인연의 운세를 함께 확인할 수 있어요.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="content-stretch flex flex-col gap-[1px] items-start relative shrink-0 w-full -mt-[108px]">
                {otherSajus.map((saju) => (
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
      </div>

      {/* Bottom Button - shrink-0로 고정 */}
      <div className="bg-white shrink-0 w-full shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] z-10">
        <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                {/* Button Group - 사주 정보 추가 + 다음 */}
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                  {/* 사주 정보 추가 버튼 */}
                  <motion.button
                    onClick={handleAddSaju}
                    onTouchStart={() => {}}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.1 }}
                    className="basis-0 grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 bg-[#f0f8f8] cursor-pointer border-none transition-colors duration-150 active:bg-[#e0f0f0]"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-medium leading-[25px] relative shrink-0 text-[#48b2af] text-[16px] text-nowrap tracking-[-0.32px]">
                            사주 정보 추가
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {/* 다음 버튼 */}
                  <motion.button
                    onClick={handleNext}
                    onTouchStart={() => {}}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.1 }}
                    className="basis-0 grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 bg-[#48b2af] cursor-pointer border-none transition-colors duration-150 active:bg-[#3a9693]"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">
                            다음
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.button>
          </div>
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