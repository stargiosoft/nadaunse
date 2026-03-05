/**
 * 사주 정보 관리 페이지
 * Figma imports: 등록된사주정보있음-240-6725.tsx, 등록된사주정보없음-240-7200.tsx
 */

import React, { useState, useEffect } from 'react';
import svgPaths from "../imports/svg-b51v8udqqu";
import emptyStateSvgPaths from "../imports/svg-297vu4q7h0"; // Empty State 아이콘
import { supabase } from '../lib/supabase';
import { DEV } from '../lib/env';
import { toast } from '../lib/toast';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import { PrimarySajuChangeDialog } from './PrimarySajuChangeDialog';
import { SajuKebabMenu } from './SajuKebabMenu';
import { ConfirmDialog } from './ConfirmDialog';
import { getZodiacImageUrl, getConstellation } from '../lib/zodiacUtils';
import { getChineseZodiacByLichun } from '../lib/zodiacCalculator';
import { Radio } from './ui/Radio';
import { motion } from "motion/react";
import { PageLoader } from './ui/PageLoader';

const containerVariants = {
  hidden: { opacity: 1 },
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

interface SajuInfo {
  id: string;
  full_name: string;
  gender: 'female' | 'male';
  birth_date: string;
  birth_time: string;
  notes: string;
  is_primary?: boolean;
  calendar_type?: string;
  zodiac?: string;
  created_at?: string;
}

interface SajuManagementPageProps {
  onBack: () => void;
  onNavigateToInput: () => void;
  onNavigateToAdd: () => void;
  onEditMySaju?: (sajuInfo: SajuInfo) => void;
  onEditOtherSaju?: (sajuInfo: SajuInfo) => void;
}

export default function SajuManagementPage({ onBack, onNavigateToInput, onNavigateToAdd, onEditMySaju, onEditOtherSaju }: SajuManagementPageProps) {
  // 🚀 동기적 캐시 확인 (useState 초기화 시점)
  const getInitialState = () => {
    try {
      const cachedJson = localStorage.getItem('saju_records_cache');
      if (cachedJson) {
        const cached = JSON.parse(cachedJson) as SajuInfo[];
        if (cached.length > 0) {
          console.log('🚀 [SajuManagementPage] 초기화 시 캐시 발견 → 즉시 렌더링');
          const ownerSaju = cached.find(s => s.notes === '본인');
          const others = cached.filter(s => s.notes !== '본인');

          // ⭐ setSajuList와 동일한 정렬 적용 (최신순)
          const sortedOthers = [...others].sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            if (dateB !== dateA) {
              return dateB - dateA; // 최신순 (내림차순)
            }
            return (b.id || '').localeCompare(a.id || '');
          });

          // 대표 사주 선택
          const primarySaju = cached.find(s => s.is_primary === true);
          const selectedId = primarySaju?.id || ownerSaju?.id || (cached.length > 0 ? cached[0].id : null);
          return { mySaju: ownerSaju || null, otherSajuList: sortedOthers, selectedId, hasCache: true };
        }
      }
    } catch (e) {
      console.error('❌ [SajuManagementPage] 초기 캐시 파싱 실패:', e);
    }
    return { mySaju: null, otherSajuList: [], selectedId: null, hasCache: false };
  };

  const initialState = getInitialState();
  const [mySaju, setMySaju] = useState<SajuInfo | null>(initialState.mySaju);
  const [otherSajuList, setOtherSajuList] = useState<SajuInfo[]>(initialState.otherSajuList);
  // 🚀 캐시가 있으면 isLoading: false로 시작 (스켈레톤 없이 즉시 렌더링)
  const [isLoading, setIsLoading] = useState(!initialState.hasCache);
  const [selectedSajuId, setSelectedSajuId] = useState<string | null>(initialState.selectedId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isPrimarySajuChangeDialogOpen, setIsPrimarySajuChangeDialogOpen] = useState(false);
  const [pendingPrimarySajuId, setPendingPrimarySajuId] = useState<string | null>(null);
  const [isChangingPrimary, setIsChangingPrimary] = useState(false);
  
  // ⭐ 케밥 메뉴 상태
  const [kebabMenuOpen, setKebabMenuOpen] = useState(false);
  const [kebabMenuPosition, setKebabMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedSajuForKebab, setSelectedSajuForKebab] = useState<SajuInfo | null>(null);
  
  // ⭐ 삭제 확인 다이얼로그 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 페이지 마운트 시 스크롤 최상단으로 리셋 (iOS Safari 호환)
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // ⭐ 페이지 진입 시 케밥 메뉴 닫기
    setKebabMenuOpen(false);
    setSelectedSajuForKebab(null);
  }, []);

  // ⭐ iOS Safari 스와이프 뒤로가기 대응 - 페이지가 다시 보일 때 케밥 메뉴 닫기
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 🛡️ bfcache 대응: 현재 페이지가 /saju/management일 때만 처리
      if (window.location.pathname !== '/saju/management') {
        return;
      }
      if (document.visibilityState === 'visible') {
        console.log('🔄 [SajuManagementPage] 페이지 visible → 케밥 메뉴 닫기');
        setKebabMenuOpen(false);
        setSelectedSajuForKebab(null);
      }
    };

    // ⭐ pageshow: bfcache 복원 시 (event.persisted=true) 바텀시트 닫기
    // 🛡️ bfcache 대응: 현재 페이지가 /saju/management일 때만 처리
    const handlePageShow = (event: PageTransitionEvent) => {
      if (window.location.pathname !== '/saju/management') {
        return;
      }
      console.log('🔄 [SajuManagementPage] pageshow → persisted:', event.persisted);
      setKebabMenuOpen(false);
      setSelectedSajuForKebab(null);
    };

    // ⭐ focus: 윈도우가 포커스를 받을 때 바텀시트 닫기 (iOS Safari 추가 보호)
    // 🛡️ bfcache 대응: 현재 페이지가 /saju/management일 때만 처리
    const handleFocus = () => {
      if (window.location.pathname !== '/saju/management') {
        return;
      }
      console.log('🔄 [SajuManagementPage] focus → 케밥 메뉴 닫기');
      setKebabMenuOpen(false);
      setSelectedSajuForKebab(null);
    };

    // ⚠️ popstate 이벤트 제거: iOS 스와이프 뒤로가기와 충돌
    // PaymentNew.tsx와 동일한 이슈 (DECISIONS.md 참고)
    // iOS 스와이프 뒤로가기는 브라우저가 자연스럽게 처리하도록 둠

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 세션 체크
  useEffect(() => {
    const checkSession = async () => {
      // ⭐️ [DEV] 개발 환경에서만 개발용 유저 감지 시 세션 체크 건너뛰기
      if (DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          try {
            const localUser = JSON.parse(localUserJson);
            if (localUser.provider === 'dev') return;
          } catch {}
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSessionExpired(true);
      }
    };
    checkSession();
  }, []);

  const loadSajuList = async () => {
    // ⭐ setIsLoading(true) 제거 - 삭제 후 새로고침 시 로딩 화면 방지
    // 초기 상태가 useState(true)이므로 첫 로드 시에는 로딩이 보임
    try {
      // ⭐️ [DEV] 개발 환경에서만 개발용 유저 감지 시 localStorage에서 데이터 로드
      if (DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          try {
            const localUser = JSON.parse(localUserJson);
            if (localUser.provider === 'dev') {
              console.log('⚡ [SajuManagement] Dev User Detected - Loading from localStorage');

              // 1. 내 사주: localStorage의 'saju_info'에서 읽기
              const mySajuJson = localStorage.getItem('saju_info');
              let mySajuData: SajuInfo | null = null;

              if (mySajuJson) {
                try {
                  const parsed = JSON.parse(mySajuJson);
                  mySajuData = {
                    id: 'my_saju',
                    full_name: parsed.full_name || parsed.name || '',
                    gender: parsed.gender || 'female',
                    birth_date: parsed.birth_date || '',
                    birth_time: parsed.birth_time || '',
                    notes: '본인',
                    is_primary: true,
                    calendar_type: parsed.calendar_type || 'solar',
                    zodiac: parsed.zodiac || ''
                  };
                  console.log('✅ [DEV] 내 사주 로드 완료:', mySajuData.full_name);
                } catch (e) {
                  console.error('❌ [DEV] saju_info 파싱 실패:', e);
                }
              }

              // ⭐ [DEV] saju_info가 없으면 테스트용 임시 데이터 생성
              if (!mySajuData) {
                mySajuData = {
                  id: 'my_saju_dev_temp',
                  full_name: '별빛 속에 피어난 작은 꿈',
                  gender: 'female',
                  birth_date: '1994-07-23T14:00:00+09:00',
                  birth_time: '14:00',
                  notes: '본인',
                  is_primary: true,
                  calendar_type: 'solar',
                  zodiac: '개띠'
                };
                console.log('⚡ [DEV] saju_info 없음 → 테스트용 임시 데이터 생성');
              }

              // 2. 함께 보는 사주: localStorage의 'dev_saju_records'에서 읽기
              const devRecordsJson = localStorage.getItem('dev_saju_records');
              let otherSajuData: SajuInfo[] = [];

              if (devRecordsJson) {
                try {
                  otherSajuData = JSON.parse(devRecordsJson);
                  console.log('✅ [DEV] 함께 보는 사주 로드 완료:', otherSajuData.length, '건');
                } catch (e) {
                  console.error('❌ [DEV] dev_saju_records 파싱 실패:', e);
                }
              }

              // 3. UI 업데이트
              setMySaju(mySajuData);
              setOtherSajuList(otherSajuData);

              // 4. 대표 사주 선택
              if (mySajuData) {
                setSelectedSajuId(mySajuData.id);
              } else if (otherSajuData.length > 0) {
                const primarySaju = otherSajuData.find(s => s.is_primary);
                setSelectedSajuId(primarySaju?.id || otherSajuData[0].id);
              }

              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error('JSON parse error', e);
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // toast.error('로그인이 필요합니다');
        return;
      }

      const { data, error } = await supabase
        .from('saju_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📋 [사주목록] 조회 완료:', data?.length || 0, '건');

      // 🚀 캐시 저장
      if (data && data.length > 0) {
        localStorage.setItem('saju_records_cache', JSON.stringify(data));
      }

      setSajuList(data || []);
    } catch (error) {
      console.error('❌ [사주목록] 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ⭐ 캐시 버스터 플래그: 사주 수정 시 설정됨
    const needsRefresh = localStorage.getItem('saju_management_needs_refresh') === 'true';

    // 🚀 캐시가 있고 refresh 불필요하면 API 호출 스킵 → 정렬 순서 변경 방지
    if (initialState.hasCache && !needsRefresh) {
      console.log('🚀 [SajuManagementPage] 캐시 유효 + refresh 불필요 → API 호출 스킵');
      return;
    }

    // refresh 플래그가 있으면 제거
    if (needsRefresh) {
      localStorage.removeItem('saju_management_needs_refresh');
      console.log('🔄 [SajuManagementPage] refresh 플래그 감지 → API 호출');
    }

    // 캐시가 없거나 refresh 필요시 API 호출
    loadSajuList();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadSajuList();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setSajuList = (data: SajuInfo[]) => {
    // notes가 "본인"인 것을 내 사주로 분류
    const ownerSaju = data.find(s => s.notes === '본인');
    const others = data.filter(s => s.notes !== '본인');

    // ⭐ 최신순 정렬 (created_at 기준 내림차순, 같으면 id로 정렬)
    const sortedOthers = [...others].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      if (dateB !== dateA) {
        return dateB - dateA; // 최신순 (내림차순)
      }
      // created_at이 같으면 id로 정렬 (일관성 유지)
      return (b.id || '').localeCompare(a.id || '');
    });

    setMySaju(ownerSaju || null);
    setOtherSajuList(sortedOthers);
    
    // ⭐ is_primary가 true인 사주를 대표 사주로 선택
    const primarySaju = data.find(s => s.is_primary === true);
    
    if (primarySaju) {
      setSelectedSajuId(primarySaju.id);
    } else if (ownerSaju) {
      setSelectedSajuId(ownerSaju.id);
    } else if (data.length > 0) {
      setSelectedSajuId(data[0].id);
    }
  };

  // 생년월일 포맷팅 (예: "양력 1991.12.25")
  const formatBirthDate = (birthDate: string, calendarType?: string): string => {
    // ISO 형식에서 날짜 부분만 추출: "1991-12-25T09:00:00+09:00" -> "1991-12-25"
    const dateOnly = birthDate.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    
    // calendar_type 필드가 없으면 기본값으로 양력 사용
    const calendarPrefix = calendarType === 'lunar' ? '음력' : '양력';
    
    return `${calendarPrefix} ${year}.${month}.${day}`;
  };

  // 띠 계산 (입춘 기준)
  const getChineseZodiac = (birthDate: string, birthTime?: string): string => {
    return getChineseZodiacByLichun(birthDate, birthTime);
  };

  /**
   * 핸드폰 번호 포맷팅 (010-1234-5678)
   */
  const formatPhoneNumber = (phoneNumber?: string): string => {
    if (!phoneNumber) return '';
    
    // 숫자만 추출
    const numbers = phoneNumber.replace(/\D/g, '');
    
    // 11자리인 경우 포맷팅
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
    
    // 10자리인 경우 포맷팅
    if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
    
    // 그 외에는 원본 반환
    return phoneNumber;
  };

  /**
   * 케밥 버튼 클릭 핸들러
   */
  const handleKebabClick = (event: React.MouseEvent, saju: SajuInfo) => {
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

    console.log('✏️ [사주수정] 수정 시작:', selectedSajuForKebab);

    // 네비게이션에 필요한 데이터 미리 저장 (클로저)
    const sajuToEdit = selectedSajuForKebab;

    // ⭐ 케밥 메뉴(바텀시트) 상태 즉시 초기화
    setKebabMenuOpen(false);
    setSelectedSajuForKebab(null);

    // ⭐ setTimeout 150ms: 바텀시트 닫힘 애니메이션 완료 + React 렌더링 대기
    // iOS Safari bfcache에 바텀시트가 닫힌 상태로 저장됨
    setTimeout(() => {
      // 페이지 이동 전 스크롤 리셋
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // 본인 사주인지 여부에 따라 다른 페이지로 이동
      if (sajuToEdit.notes === '본인') {
        // 내 사주 → SajuInputPage
        onEditMySaju?.(sajuToEdit);
      } else {
        // 함께 보는 사주 → SajuAddPage
        onEditOtherSaju?.(sajuToEdit);
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
   * 1. 해당 saju_record_id를 참조하는 orders 찾기
   * 2. orders에 사주 정보가 없으면 하드코딩으로 채우기
   * 3. FK를 NULL로 설정
   * 4. saju_records 삭제
   */
  const handleConfirmDelete = async () => {
    if (!selectedSajuForKebab) return;

    // 다이얼로그 닫기
    setIsDeleteDialogOpen(false);

    // 본인 사주는 삭제 불가 (안전 장치, UI에서는 이미 숨김)
    if (selectedSajuForKebab.notes === '본인') {
      console.error('❌ [사주삭제] 본인 사주는 삭제할 수 없습니다');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('🗑️ [사주삭제] 삭제 시작:', selectedSajuForKebab.id);

      // 현재 로그인된 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ [사주삭제] 로그인 필요');
        return;
      }

      // 1단계: 해당 사주를 참조하는 orders 조회
      const { data: relatedOrders, error: fetchError } = await supabase
        .from('orders')
        .select('id, pstatus, ai_generation_completed')
        .eq('saju_record_id', selectedSajuForKebab.id);

      if (fetchError) throw fetchError;

      console.log('📋 [사주삭제] 연관된 주문:', relatedOrders?.length || 0, '건');

      // 2단계: orders 테이블에 사주 정보 스냅샷 저장 (이미 완료된 주문도 포함)
      if (relatedOrders && relatedOrders.length > 0) {
        // 전체 주문 정보 다시 가져오기 (update에 필요한 필드 포함)
        const { data: fullOrders, error: fullFetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('saju_record_id', selectedSajuForKebab.id);

        if (fullFetchError) throw fullFetchError;

        // ⚡ 병렬 처리로 성능 개선
        await Promise.all(
          (fullOrders || []).map(order =>
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
                  console.error('❌ [사주삭제] 주문 업데이트 실패:', order.id, error);
                  throw error;
                }
                console.log('✅ [사주삭제] 주문 업데이트 완료:', order.id);
              })
          )
        );
      }

      // 3단계: saju_records 삭제 (user_id 조건 추가로 RLS 우회)
      const { data: deletedData, error: deleteError } = await supabase
        .from('saju_records')
        .delete()
        .eq('id', selectedSajuForKebab.id)
        .eq('user_id', user.id)  // 🔥 user_id 조건 추가
        .select();  // 🔥 삭제된 행 반환

      if (deleteError) {
        console.error('❌ [사주삭제] 삭제 쿼리 에러:', deleteError);
        throw deleteError;
      }

      // 🔥 삭제된 행 수 확인
      if (!deletedData || deletedData.length === 0) {
        console.error('❌ [사주삭제] 삭제된 행이 없음. RLS 정책 또는 권한 문제일 수 있습니다.');
        throw new Error('사주 정보를 삭제할 수 없습니다. 권한을 확인해주세요.');
      }

      console.log('✅ [사주삭제] 사주 정보 삭제 완료:', selectedSajuForKebab.id, '(삭제된 행:', deletedData.length, '개)');

      // ⭐ 삭제된 사주가 대표 사주(is_primary=true)였다면, 본인 사주를 대표 사주로 설정
      if (selectedSajuForKebab.is_primary) {
        console.log('🔄 [사주삭제] 대표 사주 삭제됨 → 본인 사주를 대표 사주로 변경');
        
        // 본인 사주 조회
        const { data: mySajuData, error: mySajuError } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('notes', '본인')
          .single();
        
        if (mySajuError) {
          console.error('❌ [사주삭제] 본인 사주 조회 실패:', mySajuError);
        } else if (mySajuData) {
          // 본인 사주를 대표 사주로 설정
          const { error: setPrimaryError } = await supabase
            .from('saju_records')
            .update({ is_primary: true })
            .eq('id', mySajuData.id)
            .eq('user_id', user.id);
          
          if (setPrimaryError) {
            console.error('❌ [사주삭제] 본인 사주 대표 설정 실패:', setPrimaryError);
          } else {
            console.log('✅ [사주삭제] 본인 사주를 대표 사주로 설정 완료:', mySajuData.id);
          }
        } else {
          console.log('ℹ️ [사주삭제] 본인 사주 없음 - 대표 사주 설정 생략');
        }
      }

      // ⭐ 캐시 선행 업데이트 + 메모리 state 동기화
      const { data: updatedSajuList, error: fetchUpdatedError } = await supabase
        .from('saju_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (!fetchUpdatedError && updatedSajuList && updatedSajuList.length > 0) {
        // 새 대표 사주 찾기 (is_primary=true 또는 첫 번째)
        const newPrimary = updatedSajuList.find((s: any) => s.is_primary) || updatedSajuList[0];
        localStorage.setItem('primary_saju', JSON.stringify(newPrimary));
        localStorage.setItem('saju_records_cache', JSON.stringify(updatedSajuList));

        // ⚡ 메모리 state 즉시 업데이트 (loadSajuList 호출 불필요)
        setSajuList(updatedSajuList);
        setMySaju(updatedSajuList.find((s: any) => s.notes === '본인') || null);
        setOtherSajuList(updatedSajuList.filter((s: any) => s.notes !== '본인'));
        setSelectedSajuId(newPrimary.id);

        console.log('✅ [사주삭제] 캐시 + 메모리 state 업데이트 완료 - 새 대표 사주:', newPrimary.full_name);
      } else if (updatedSajuList && updatedSajuList.length === 0) {
        // 모든 사주가 삭제된 경우
        localStorage.removeItem('primary_saju');
        localStorage.removeItem('saju_records_cache');
        localStorage.removeItem('saju_cache_checked');
        setSajuList([]);
        setMySaju(null);
        setOtherSajuList([]);
        setSelectedSajuId(null);
        console.log('🗑️ [사주삭제] 모든 사주 삭제됨 - 캐시 무효화');
      } else {
        // 조회 실패 시 기존 방식대로 무효화
        localStorage.removeItem('primary_saju');
        localStorage.removeItem('saju_records_cache');
        localStorage.removeItem('saju_cache_checked');
        console.log('🗑️ [사주삭제] primary_saju, saju_records_cache 캐시 무효화');
      }

      // 4단계: 토스트 표시
      toast.success('삭제되었습니다.');
      setSelectedSajuForKebab(null);
    } catch (error) {
      console.error('❌ [사주삭제] 삭제 실패:', error);
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * 라디오 버튼 클릭 핸들러
   * 현재 선택된 사주가 아닌 다른 사주를 클릭하면 확인 다이얼로그 표시
   */
  const handleRadioClick = (sajuId: string) => {
    if (sajuId === selectedSajuId) {
      // 이미 선택된 사주를 다시 클릭한 경우 아무 동작 안 함
      return;
    }

    // 다른 사주를 클릭한 경우 확인 다이얼로그 표시
    setPendingPrimarySajuId(sajuId);
    setIsPrimarySajuChangeDialogOpen(true);
  };

  /**
   * 대표 사주 변경 확인 핸들러
   */
  const handleConfirmPrimarySajuChange = async () => {
    if (!pendingPrimarySajuId || isChangingPrimary) return;

    setIsChangingPrimary(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        setIsChangingPrimary(false);
        return;
      }

      console.log('🔄 [대표사주변경] 시작:', pendingPrimarySajuId);

      // 1단계: 기존 대표 해제 → 새 대표 설정 (순차 실행 필수: 병렬 시 race condition)
      const resetResult = await supabase
        .from('saju_records')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('is_primary', true);

      if (resetResult.error) {
        console.error('❌ [대표사주변경] 기존 대표 해제 실패:', resetResult.error);
        throw resetResult.error;
      }

      const updateResult = await supabase
        .from('saju_records')
        .update({ is_primary: true })
        .eq('id', pendingPrimarySajuId);

      if (updateResult.error) {
        console.error('❌ [대표사주변경] 새 대표 설정 실패:', updateResult.error);
        throw updateResult.error;
      }

      console.log('✅ [대표사주변경] DB 업데이트 완료:', pendingPrimarySajuId);

      // 2단계: 낙관적 캐시 업데이트 (DB 재조회 없이 로컬 데이터로 즉시 반영)
      const cachedListJson = localStorage.getItem('saju_records_cache');
      if (cachedListJson) {
        try {
          const cachedList = JSON.parse(cachedListJson) as SajuInfo[];
          const updatedList = cachedList.map(s => ({
            ...s,
            is_primary: s.id === pendingPrimarySajuId,
          }));
          const newPrimary = updatedList.find(s => s.id === pendingPrimarySajuId);

          localStorage.setItem('saju_records_cache', JSON.stringify(updatedList));
          if (newPrimary) {
            localStorage.setItem('primary_saju', JSON.stringify(newPrimary));
            console.log('✅ [대표사주변경] 캐시 낙관적 업데이트 완료 - 새 대표 사주:', newPrimary.full_name);
          }
        } catch {
          // 캐시 파싱 실패 시 무효화
          localStorage.removeItem('primary_saju');
          localStorage.removeItem('saju_records_cache');
          localStorage.removeItem('saju_cache_checked');
          console.log('🗑️ [대표사주변경] 캐시 무효화 (파싱 실패)');
        }
      } else {
        localStorage.removeItem('primary_saju');
        localStorage.removeItem('saju_cache_checked');
        console.log('🗑️ [대표사주변경] 캐시 무효화 (캐시 없음)');
      }

      // 3단계: UI 업데이트 + 다이얼로그 닫기 + 프로필 이동
      setSelectedSajuId(pendingPrimarySajuId);
      setIsPrimarySajuChangeDialogOpen(false);
      setPendingPrimarySajuId(null);

      toast.success('대표 사주가 변경되었습니다.', { duration: 2200 });

      onBack();
    } catch (error) {
      console.error('❌ [대표사주변경] 실패:', error);
      toast.error('대표 사주 변경에 실패했습니다');
      setIsPrimarySajuChangeDialogOpen(false);
      setPendingPrimarySajuId(null);
    } finally {
      setIsChangingPrimary(false);
    }
  };

  /**
   * 대표 사주 변경 취소 핸들러
   */
  const handleCancelPrimarySajuChange = () => {
    setIsPrimarySajuChangeDialogOpen(false);
    setPendingPrimarySajuId(null);
  };

  /**
   * 사주 정보 추가 핸들러 (스크롤 리셋 포함)
   */
  const handleNavigateToAdd = () => {
    // ⭐ 함께 보는 사주 20개 제한 체크
    if (otherSajuList.length >= 20) {
      toast.warning('사주 정보는 최대 20개까지 등록할 수 있습니다.', { duration: 2200 });
      return;
    }

    // 페이지 이동 전 스크롤 리셋
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    onNavigateToAdd();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  const hasOtherSaju = otherSajuList.length > 0;

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative mx-auto">
        {/* Top Navigation */}
        <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full max-w-[440px] z-10 bg-white">
          {/* Navigation Bar */}
          <div className="bg-white h-[52px] relative shrink-0 w-full">
            <div className="flex flex-col justify-center size-full">
              <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div onClick={onBack} className="group content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer transition-colors duration-200 active:bg-gray-100">
                    <div className="relative shrink-0 size-[24px] transition-transform duration-200 group-active:scale-90">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                        <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                      </svg>
                    </div>
                  </div>
                  <p className="basis-0 grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px] font-semibold">
                    사주 정보 관리
                  </p>
                  <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Content */}
        <motion.div className="pt-[52px] pb-[120px]" variants={containerVariants} initial="hidden" animate="visible">
          <div className="flex flex-col" style={{ gap: '8px' }}>
          {/* 내 사주 섹션 */}
          {mySaju && (
            <motion.div className="flex flex-col" style={{ gap: '12px' }} variants={itemVariants}>
              <div className="flex flex-col">
                {/* Section Header */}
                <div className="flex items-center px-[20px]" style={{ paddingTop: '10px' }}>
                  <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                    내 사주
                  </p>
                </div>
                {/* Profile Item */}
                <div className="flex items-start justify-between px-[20px]" style={{ paddingBottom: '10px', paddingTop: '4px' }}>
                  {/* Left: Profile Container (Radio + Image) + Text */}
                  <div className="flex flex-1 gap-[10px] items-center min-w-0" style={{ paddingTop: '6px' }}>
                    {/* Profile Container: Radio + Image */}
                    <div className="flex gap-[4px] items-center shrink-0">
                      <div className="flex items-center justify-center shrink-0 size-[36px]">
                        <Radio
                          checked={selectedSajuId === mySaju.id}
                          onClick={() => handleRadioClick(mySaju.id)}
                        />
                      </div>
                      {/* Profile Image 44x44 */}
                      <div className="relative shrink-0 size-[44px] overflow-hidden transform-gpu" style={{ borderRadius: "14px" }}>
                        <img
                          alt={mySaju.zodiac || getChineseZodiac(mySaju.birth_date, mySaju.birth_time)}
                          className="absolute inset-0 max-w-none object-cover size-full"
                          src={getZodiacImageUrl(mySaju.zodiac || getChineseZodiac(mySaju.birth_date, mySaju.birth_time))}
                          loading="lazy"
                        />
                      </div>
                    </div>
                    {/* Text Group */}
                    <div className="flex flex-col min-w-0" style={{ gap: '3px' }}>
                      <p className="overflow-hidden line-clamp-2" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '-0.42px', color: '#000000' }}>
                        {mySaju.full_name} {mySaju.notes && `(${mySaju.notes})`}
                      </p>
                      <p className="overflow-hidden text-nowrap" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484' }}>
                        {formatBirthDate(mySaju.birth_date, mySaju.calendar_type)}
                      </p>
                    </div>
                  </div>
                  {/* Kebab button */}
                  <div
                    onClick={(event) => handleKebabClick(event, mySaju)}
                    className="group flex items-center justify-center p-[4px] rounded-[8px] shrink-0 size-[36px] cursor-pointer transition-colors duration-200 active:bg-gray-100 pointer-events-auto z-10"
                  >
                    <div className="relative shrink-0 size-[16px] transition-transform duration-200 group-active:scale-90">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                        <path d={svgPaths.pdd51400} fill="#B7B7B7" stroke="#B7B7B7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* 4px 구분선 */}
              <div className="shrink-0 w-full" style={{ height: '4px', backgroundColor: '#f9f9f9' }} />
            </motion.div>
          )}

          {/* 함께 보는 사주 섹션 */}
          <motion.div className="flex flex-col" variants={itemVariants}>
            {/* Section Header */}
            <div className="flex items-center px-[20px]" style={{ paddingTop: '10px' }}>
              <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 600, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#000000' }}>
                함께 보는 사주
              </p>
            </div>

            {/* Empty State or List */}
            {!hasOtherSaju ? (
              <motion.div className="flex flex-col items-center px-[20px] pt-[24px] pb-[16px]" variants={itemVariants}>
                <div className="flex flex-col gap-[16px] items-center justify-center w-full">
                  <div className="relative shrink-0" style={{ width: '56px', height: '56px' }}>
                    <svg className="block" style={{ width: '56px', height: '56px' }} fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
                      <g id="Icons">
                        <path d={emptyStateSvgPaths.p3a144140} fill="var(--fill-0, #E7E7E7)" id="Vector" />
                        <path d={emptyStateSvgPaths.p15b23580} fill="var(--fill-0, #D4D4D4)" id="Vector_2" />
                        <path d={emptyStateSvgPaths.p3b09d000} fill="var(--fill-0, #D4D4D4)" id="Vector_3" />
                        <path d={emptyStateSvgPaths.p1c433500} fill="var(--fill-0, #E7E7E7)" id="Vector_4" />
                        <path d={emptyStateSvgPaths.p136e2000} fill="var(--fill-0, #F3F3F3)" id="Vector_5" />
                        <path d={emptyStateSvgPaths.p15328600} fill="var(--fill-0, #D4D4D4)" id="Vector_6" />
                        <path d={emptyStateSvgPaths.p1d148980} fill="var(--fill-0, #E7E7E7)" id="Vector_7" />
                        <path d={emptyStateSvgPaths.p2d904400} fill="var(--fill-0, #F3F3F3)" id="Vector_8" />
                      </g>
                    </svg>
                  </div>
                  <p className="w-full text-center" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '26.5px', letterSpacing: '-0.3px', color: '#B7B7B7' }}>
                    함께 보는 사주를 등록해 보세요.
                    <br />
                    소중한 인연의 운세를 함께 확인할 수 있어요.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col" style={{ gap: '2px' }}>
                {otherSajuList.map((saju) => (
                  <motion.div key={saju.id} className="flex items-start justify-between px-[20px]" style={{ paddingBottom: '10px', paddingTop: '4px' }} variants={itemVariants}>
                    {/* Left: Profile Container (Radio + Image) + Text */}
                    <div className="flex flex-1 gap-[10px] items-center min-w-0" style={{ paddingTop: '6px' }}>
                      {/* Profile Container: Radio + Image */}
                      <div className="flex gap-[4px] items-center shrink-0">
                        <div className="flex items-center justify-center shrink-0 size-[36px]">
                          <Radio
                            checked={selectedSajuId === saju.id}
                            onClick={() => handleRadioClick(saju.id)}
                          />
                        </div>
                        {/* Profile Image 44x44 */}
                        <div className="relative shrink-0 size-[44px] overflow-hidden transform-gpu" style={{ borderRadius: "14px" }}>
                          <img
                            alt={saju.zodiac || getChineseZodiac(saju.birth_date, saju.birth_time)}
                            className="absolute inset-0 max-w-none object-cover size-full"
                            src={getZodiacImageUrl(saju.zodiac || getChineseZodiac(saju.birth_date, saju.birth_time))}
                            loading="lazy"
                          />
                        </div>
                      </div>
                      {/* Text Group */}
                      <div className="flex flex-col min-w-0" style={{ gap: '3px' }}>
                        <p className="overflow-hidden line-clamp-2" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '-0.42px', color: '#000000' }}>
                          {saju.full_name} {saju.notes && `(${saju.notes})`}
                        </p>
                        <p className="overflow-hidden text-nowrap" style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484' }}>
                          {formatBirthDate(saju.birth_date, saju.calendar_type)}
                        </p>
                      </div>
                    </div>
                    {/* Kebab button */}
                    <div
                      onClick={(event) => handleKebabClick(event, saju)}
                      className="group flex items-center justify-center p-[4px] rounded-[8px] shrink-0 size-[36px] cursor-pointer transition-colors duration-200 active:bg-gray-100 pointer-events-auto z-10"
                    >
                      <div className="relative shrink-0 size-[16px] transition-transform duration-200 group-active:scale-90">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                          <path d={svgPaths.pdd51400} fill="#B7B7B7" stroke="#B7B7B7" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          </div>
        </motion.div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[440px] z-10">
          <div className="bg-white relative shrink-0 w-full">
            <div className="flex flex-col items-center justify-center size-full">
              <div className="w-full flex justify-center relative">
                <div className="w-full max-w-[440px] px-[20px] py-[12px]">
                  <div
                    onClick={onNavigateToInput}
                    className="bg-[#48b2af] h-[56px] w-full cursor-pointer flex items-center justify-center"
                    style={{ borderRadius: '20px', transition: 'all 0.15s ease' }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#41a09e'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#48b2af'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#48b2af'; }}
                    onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = '#41a09e'; }}
                    onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#48b2af'; }}
                  >
                    <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '25px', letterSpacing: '-0.32px', color: '#ffffff' }}>
                      사주 정보 추가
                    </p>
                  </div>
                </div>
              </div>
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
      </div>
      <SessionExpiredDialog isOpen={isSessionExpired} />
      <PrimarySajuChangeDialog
        isOpen={isPrimarySajuChangeDialogOpen}
        isLoading={isChangingPrimary}
        onConfirm={handleConfirmPrimarySajuChange}
        onCancel={handleCancelPrimarySajuChange}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="등록된 사주를 삭제하시겠어요?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}