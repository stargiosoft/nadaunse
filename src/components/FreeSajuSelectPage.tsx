/**
 * 무료 콘텐츠 전용 사주 정보 선택 페이지
 * - 로그인 사용자가 등록된 사주 정보를 선택
 * - "내 사주" + "함께 보는 사주" 섹션
 * - UI는 SajuManagementPage와 동일, 하단 버튼만 다름
 */

import { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import svgPaths from "../imports/svg-b51v8udqqu"; // ⭐️ SajuManagementPage와 동일한 SVG 사용
import emptyStateSvgPaths from "../imports/svg-hw6oxtisye"; // Empty State 아이콘
import { SajuKebabMenu } from './SajuKebabMenu';
import { ConfirmDialog } from './ConfirmDialog';
import SajuCard, { SajuCardData } from './SajuCard';

interface FreeSajuSelectPageProps {
  productId: string;
  onBack: () => void;
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

export default function FreeSajuSelectPage({ productId, onBack }: FreeSajuSelectPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sajuRecords, setSajuRecords] = useState<SajuRecord[]>([]);
  const [selectedSajuId, setSelectedSajuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // 사주 정보 로드
  useEffect(() => {
    const loadSajuRecords = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [FreeSajuSelectPage] 사주 정보 로드 시작');

      try {
        // ⭐ 항상 Supabase에서 데이터 로드 (DEV/PROD 동일)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('❌ [FreeSajuSelectPage] 로그인 필요');
          navigate(`/product/${productId}/birthinfo`);
          return;
        }

        console.log('✅ [FreeSajuSelectPage] 로그인 확인:', user.email);

        // ⭐️ 모든 사주 정보 조회 (본인 + 함께 보는 사주)
        const { data: records, error } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ [FreeSajuSelectPage] 사주 정보 조회 실패:', error);
          throw error;
        }

        console.log('✅ [FreeSajuSelectPage] 사주 정보 로드 완료:', records?.length);
        console.log('📌 [FreeSajuSelectPage] 사주 목록:', records);

        if (!records || records.length === 0) {
          console.log('⚠️ [FreeSajuSelectPage] 사주 정보 없음 → 입력 페이지로 이동');
          navigate(`/product/${productId}/birthinfo`);
          return;
        }

        setSajuRecords(records);
        
        // ⭐ 대표 사주 자동 선택 (is_primary=true → 본인 사주 → 첫 번째 사주 순)
        const primarySaju = records.find(r => r.is_primary);
        const mySaju = records.find(r => r.notes === '본인');
        
        if (primarySaju) {
          setSelectedSajuId(primarySaju.id);
          console.log('✅ [FreeSajuSelectPage] ��표 사주 자동 선택:', primarySaju.id, primarySaju.full_name);
        } else if (mySaju) {
          setSelectedSajuId(mySaju.id);
          console.log('✅ [FreeSajuSelectPage] 본인 사주 자동 선택:', mySaju.id);
        } else {
          setSelectedSajuId(records[0].id);
          console.log('✅ [FreeSajuSelectPage] 첫 번째 사주 자동 선택:', records[0].id);
        }

      } catch (error) {
        console.error('❌ [FreeSajuSelectPage] 에러:', error);
        alert('사주 정보를 불러올 수 없습니다.');
        onBack();
      } finally {
        setIsLoading(false);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    };

    loadSajuRecords();
  }, [productId, navigate, onBack]);

  // "다음" 버튼 클릭
  const handleNext = async () => {
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

    // ⭐ 로그인 사용자인 경우 대표 사주 업데이트
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('🔄 [FreeSajuSelectPage] 대표 사주 업데이트 시작');

      // 1단계: 해당 사용자의 모든 사주 is_primary=false로 변경
      const { error: resetPrimaryError } = await supabase
        .from('saju_records')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      if (resetPrimaryError) {
        console.error('❌ [FreeSajuSelectPage] 대표 사주 초기화 실패:', resetPrimaryError);
      } else {
        console.log('✅ [FreeSajuSelectPage] 모든 사주 is_primary=false 설정 완료');
      }

      // 2단계: 선택된 사주만 is_primary=true로 변경
      const { error: setPrimaryError } = await supabase
        .from('saju_records')
        .update({ is_primary: true })
        .eq('id', selectedSajuId)
        .eq('user_id', user.id);

      if (setPrimaryError) {
        console.error('❌ [FreeSajuSelectPage] 대표 사주 설정 실패:', setPrimaryError);
      } else {
        console.log('✅ [FreeSajuSelectPage] 선택된 사주를 대표 사주로 설정 완료:', selectedSajuId);
      }
    } else {
      console.log('ℹ️ [FreeSajuSelectPage] 로그아웃 사용자 - 대표 사주 업데이트 생략');
    }

    console.log('🔀 [FreeSajuSelectPage] 로딩 페이지로 이동');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 로딩 페이지로 이동
    navigate(`/free-loading?contentId=${productId}&sajuRecordId=${selectedSajuId}&userName=${selectedSaju.full_name}`);
  };

  // 사주 정보 추가 버튼 클릭
  const handleAddSaju = () => {
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
   */
  const handleEditSaju = () => {
    if (!selectedSajuForKebab) return;
    
    console.log('✏️ [FreeSajuSelectPage] 수정 시작:', selectedSajuForKebab);
    
    // 케밥 메뉴 닫기
    setKebabMenuOpen(false);
    
    // 현재 페이지 경로 (사주 정보 선택 페이지)
    const currentPath = location.pathname + location.search;
    
    // 프로필 사주 입력 페이지로 이동 (편집 모드)
    if (selectedSajuForKebab.notes === '본인') {
      navigate('/saju/input', { state: { sajuInfo: selectedSajuForKebab, returnTo: currentPath } });
    } else {
      navigate('/saju/add', { state: { sajuInfo: selectedSajuForKebab, returnTo: currentPath } });
    }
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
            console.error('❌ [FreeSajuSelectPage] 주문 업데이트 실패:', order.id, updateError);
            throw updateError;
          }

          console.log('✅ [FreeSajuSelectPage] 주문 업데이트 완료:', order.id);
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

      // 4단계: 목록 새로고침 - 페이지 새로고침으로 대체
      window.location.reload();
    } catch (error) {
      console.error('❌ [FreeSajuSelectPage] 삭제 실패:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white relative min-h-screen w-full flex justify-center items-center">
        <p className="text-[#848484]">로딩 중...</p>
      </div>
    );
  }

  // 본인 사주와 함께 보는 사주 분리
  const mySaju = sajuRecords.find(r => r.notes === '본인');
  const otherSajus = sajuRecords.filter(r => r.notes !== '본인');
  const hasOtherSaju = otherSajus.length > 0;

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[390px] relative">
        {/* Top Navigation */}
        <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full max-w-[390px] z-10 bg-white">
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

        {/* Content */}
        <div className="pt-[68px] pb-[120px] px-[20px]">
          {/* 내 사주 섹션 */}
          {mySaju && (
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              {/* Section Title */}
              <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                    <p className="basis-0 grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
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
          <div className="content-stretch flex flex-col gap-[88px] items-start relative shrink-0 w-full mt-[44px]">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              {/* Section Title */}
              <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                    <p className="basis-0 grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
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
                  <div className="relative shrink-0 size-[62px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 62 62">
                      <path d={emptyStateSvgPaths.p30e68780} fill="#E7E7E7" />
                      <path d={emptyStateSvgPaths.p14ef2c00} fill="#E7E7E7" />
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
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full -mt-[80px]">
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

        {/* Bottom Button - 프로필용과 다른 부분 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[390px] z-10">
          <div className="bg-white relative shrink-0 w-full">
            <div className="flex flex-col items-center justify-center size-full">
              <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                {/* Button Group - 사주 정보 추가 + 다음 */}
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                  {/* 사주 정보 추가 버튼 */}
                  <div
                    onClick={handleAddSaju}
                    className="basis-0 grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 bg-[#f0f8f8] cursor-pointer hover:bg-[#e0f0f0] transition-colors"
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
                  </div>

                  {/* 다음 버튼 */}
                  <div
                    onClick={handleNext}
                    className="basis-0 grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 bg-[#48b2af] cursor-pointer hover:bg-[#3a9794] transition-colors"
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