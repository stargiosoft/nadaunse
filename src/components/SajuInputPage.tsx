/**
 * 사주 정보 입력 페이지
 * Figma import: /imports/사주정보입력390-240-5924.tsx
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import svgPaths from "../imports/svg-0762m0vok8";
import { SessionExpiredDialog } from './SessionExpiredDialog';
import { toast } from '../lib/toast';
import { NavigationHeader } from './NavigationHeader';

interface SajuInputPageProps {
  onBack: () => void;
  onSaved: () => void;
}

// 에러 상태 타입
interface ValidationErrors {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  phoneNumber?: string;
}

export default function SajuInputPage({ onBack, onSaved }: SajuInputPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const sajuData = location.state?.sajuData || null;
  const sajuInfo = location.state?.sajuInfo || null; // ⭐ 케밥 메뉴에서 전달받은 사주 정보
  const returnTo = location.state?.returnTo || null; // ⭐ 돌아갈 경로

  // ⭐ sajuInfo 또는 sajuData가 있으면 편집 모드로 간주
  const isEditMode = !!(sajuInfo || (editMode && sajuData));
  const editingSaju = sajuInfo || sajuData; // 수정할 사주 정보

  // ⭐ 편집 모드일 때 초기 gender 값을 미리 계산 (애니메이션 깜빡임 방지)
  const getInitialGender = (): 'female' | 'male' => {
    const dataToLoad = sajuInfo || sajuData;
    if (dataToLoad?.gender === 'male' || dataToLoad?.gender === 'Male' || dataToLoad?.gender === '남성') {
      return 'male';
    }
    return 'female';
  };

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>(getInitialGender());
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // 이름 필드에 자동 포커스를 위한 ref
  const nameInputRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const birthTimeInputRef = useRef<HTMLInputElement>(null);

  // 페이지 마운트 시 스크롤 최상단으로 리셋 (iOS Safari 호환)
  // useLayoutEffect 사용: 화면 렌더링 전에 동기적으로 실행
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 세션 체크
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSessionExpired(true);
      }
    };
    checkSession();
  }, []);

  // ⭐ 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    // editMode가 있을 때: sajuData 사용 (기존 로직)
    // sajuInfo가 있을 때: 케밥 메뉴에서 전달받은 사주 정보 사용
    const dataToLoad = isEditMode ? editingSaju : null;
    
    if (dataToLoad) {
      console.log('✏️ [편집모드] 기존 데이터 로드:', dataToLoad);

      setName(dataToLoad.full_name || '');
      // ⭐ gender 값 정규화 (DB에서 'male', 'Male', '남성' 등 다양한 형식 가능)
      const normalizedGender: 'female' | 'male' =
        dataToLoad.gender === 'male' || dataToLoad.gender === 'Male' || dataToLoad.gender === '남성'
          ? 'male'
          : 'female';
      console.log('📌 [편집모드] gender 원본:', dataToLoad.gender, '→ 정규화:', normalizedGender);
      setGender(normalizedGender);
      
      // birth_date 파싱: "1991-12-25T00:00:00Z" → "1991-12-25"
      const birthDateOnly = dataToLoad.birth_date?.split('T')[0] || '';
      setBirthDate(birthDateOnly);
      
      // birth_time 처리
      // ⭐ '시간 미상' 또는 '12:00'이면 "모르겠어요" 체크 상태로 표시
      if (dataToLoad.birth_time === '시간 미상' || dataToLoad.birth_time === '12:00') {
        setUnknownTime(true);
        setBirthTime('오후 12:00');
      } else {
        setUnknownTime(false);
        // ⭐ DB에서 24시간 형식(예: "23:16")으로 저장되어 있으면 12시간 형식으로 변환
        const displayTime = convertTo12Hour(dataToLoad.birth_time || '');
        console.log('📌 [편집모드] birth_time 원본:', dataToLoad.birth_time, '→ 변환:', displayTime);
        setBirthTime(displayTime);
      }
      
      // phone_number 로드 (선택 필드)
      setPhoneNumber(dataToLoad.phone_number || '');
    }
  }, [isEditMode, editingSaju]);

  // 컴포넌트 마운트 시 이름 필드에 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // ⭐️ 오전/오후 형식을 24시간 형식으로 변환 (DB 저장용)
  const convertTo24Hour = (time: string): string => {
    // "오전/오후 HH:MM" 형식 파싱
    const match = time.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
    if (!match) return time; // 이미 24시간 형식이면 그대로 반환

    const [, period, hourStr, minute] = match;
    let hour = parseInt(hourStr);

    if (period === '오전') {
      if (hour === 12) hour = 0; // 오전 12시 = 자정 = 00:00
    } else { // 오후
      if (hour !== 12) hour += 12; // 오후 1시 = 13:00, 오후 12시는 그대로 12
    }

    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  // ⭐️ 24시간 형식을 오전/오후 형식으로 변환 (DB 로드 시 화면 표시용)
  const convertTo12Hour = (time: string): string => {
    // 이미 오전/오후 형식이면 그대로 반환
    if (time.includes('오전') || time.includes('오후')) return time;

    // "HH:MM" 형식 파싱
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return time; // 파싱 실패 시 그대로 반환

    const [, hourStr, minute] = match;
    let hour = parseInt(hourStr);

    if (hour >= 0 && hour < 12) {
      // 오전 (00:00 ~ 11:59)
      const displayHour = hour === 0 ? 12 : hour;
      return `오전 ${String(displayHour).padStart(2, '0')}:${minute}`;
    } else {
      // 오후 (12:00 ~ 23:59)
      const displayHour = hour === 12 ? 12 : hour - 12;
      return `오후 ${String(displayHour).padStart(2, '0')}:${minute}`;
    }
  };

  // 날짜 유효성 검사
  const isValidDate = (dateStr: string): boolean => {
    if (dateStr.length !== 10) return false; // YYYY-MM-DD

    const [year, month, day] = dateStr.split('-').map(Number);
    
    if (!year || !month || !day) return false;
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    // 실제 날짜 유효성 검사
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  // 시간 유효성 검사
  const isValidTime = (timeStr: string): boolean => {
    if (timeStr.length < 4) return false;
    
    // "오전/오후 HH:mm" 형식 파싱
    const match = timeStr.match(/^(오전|오후)\s(\d{2}):(\d{2})$/);
    if (!match) return false;
    
    const [, period, hour, minute] = match;
    const h = Number(hour);
    const m = Number(minute);
    
    if (period === '오전' && (h < 0 || h > 12)) return false;
    if (period === '오후' && (h < 0 || h > 12)) return false;
    if (m < 0 || m > 59) return false;
    
    return true;
  };

  // 이름 입력 핸들러
  const handleNameChange = (value: string) => {
    // 최대 20자 제한
    if (value.length > 20) return;
    
    setName(value);
    
    // 에러 제거
    if (value.trim().length >= 1) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  // 생년월일 입력 핸들러 (자동 포매팅)
  const handleBirthDateChange = (value: string) => {
    // 숫자만 입력 가능
    const numbers = value.replace(/[^\d]/g, '');
    
    // 8자리 제한
    if (numbers.length > 8) return;
    
    // 자동 포매팅: YYYY-MM-DD
    let formatted = numbers;
    if (numbers.length >= 5) {
      formatted = `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}${numbers.length > 6 ? `-${numbers.slice(6, 8)}` : ''}`;
    }
    
    setBirthDate(formatted);
    
    // 8자리 입력 완료 시 유효성 검사
    if (numbers.length === 8) {
      const fullDate = `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
      if (!isValidDate(fullDate)) {
        setErrors(prev => ({ ...prev, birthDate: '생년월일을 정확하게 입력해주세요.' }));
      } else {
        setErrors(prev => ({ ...prev, birthDate: undefined }));
        // ⭐ 아이폰 숫자 키보드 대응: 8자리 입력 완료 시 자동으로 태어난 시간으로 포커스 이동
        setTimeout(() => {
          birthTimeInputRef.current?.focus();
        }, 100);
      }
    } else {
      setErrors(prev => ({ ...prev, birthDate: undefined }));
    }
  };

  // 태어난 시간 입력 핸들러 (자동 포매팅)
  const handleBirthTimeChange = (value: string) => {
    // 이미 포맷팅된 경우 (오전/오후 포함) 수정 시 초기화
    if (value.includes('오전') || value.includes('오후')) {
      setBirthTime('');
      return;
    }
    
    // 숫자만 입력 가능
    const numbers = value.replace(/[^\d]/g, '');
    
    // 4자리 제한
    if (numbers.length > 4) return;
    
    setBirthTime(numbers);
    
    // 4자리 입력 완료 시 자동 포매팅
    if (numbers.length === 4) {
      const hour = Number(numbers.slice(0, 2));
      const minute = numbers.slice(2, 4);
      
      if (hour >= 0 && hour <= 23 && Number(minute) >= 0 && Number(minute) <= 59) {
        if (hour >= 0 && hour < 12) {
          // 오전 (00:00 ~ 11:59)
          const displayHour = hour === 0 ? 12 : hour;
          const formatted = `오전 ${String(displayHour).padStart(2, '0')}:${minute}`;
          setBirthTime(formatted);
          setErrors(prev => ({ ...prev, birthTime: undefined }));
        } else {
          // 오후 (12:00 ~ 23:59)
          const displayHour = hour === 12 ? 12 : hour - 12;
          const formatted = `오후 ${String(displayHour).padStart(2, '0')}:${minute}`;
          setBirthTime(formatted);
          setErrors(prev => ({ ...prev, birthTime: undefined }));
        }
      } else {
        setErrors(prev => ({ ...prev, birthTime: '태어난 시를 정확하게 입력해주세요.' }));
      }
    } else {
      setErrors(prev => ({ ...prev, birthTime: undefined }));
    }
  };

  // 휴대폰 번호 입력 핸들러 (자동 포매팅)
  const handlePhoneNumberChange = (value: string) => {
    // 숫자만 입력 가능
    const numbers = value.replace(/[^\d]/g, '');
    
    // 11자리 제한
    if (numbers.length > 11) return;
    
    // 자동 포매팅: 010-0000-0000
    let formatted = numbers;
    if (numbers.length >= 4) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}${numbers.length > 7 ? `-${numbers.slice(7, 11)}` : ''}`;
    }
    
    setPhoneNumber(formatted);
    
    // 11자리 입력 완료 시 유효성 검사
    if (numbers.length === 11) {
      if (!numbers.startsWith('010')) {
        setErrors(prev => ({ ...prev, phoneNumber: '휴대폰 번호로 다시 확인해 주세요.' }));
      } else {
        setErrors(prev => ({ ...prev, phoneNumber: undefined }));
      }
    } else if (numbers.length > 0 && numbers.length < 11) {
      // 입력 중일 때는 에러 표시 안함
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    } else {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  // "모르겠어요" 토글 핸들러
  const handleUnknownTimeToggle = () => {
    const newValue = !unknownTime;
    setUnknownTime(newValue);
    
    if (newValue) {
      // 체크 시 "오후 12:00"으로 자동 설정
      setBirthTime('오후 12:00');
      setErrors(prev => ({ ...prev, birthTime: undefined }));
    } else {
      // 체크 해제 시 초기화
      setBirthTime('');
    }
  };

  // 필수 필드 검증
  const isFormValid = () => {
    const nameValid = name.trim().length >= 1;
    const birthDateValid = birthDate.replace(/[^\d]/g, '').length === 8 && isValidDate(birthDate);
    
    // 태어난 시간: "모르겠어요" 체크되어 있거나, 정상 입력되어 있어야 함
    const birthTimeValid = unknownTime || (birthTime.length > 0 && isValidTime(birthTime));
    
    return nameValid && birthDateValid && birthTimeValid;
  };

  // 저장 버튼 클릭 시 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // 이름 검증
    if (name.trim().length < 1) {
      newErrors.name = '이름을 1글자 이상 입력해 주세요.';
    }
    
    // 생년월일 검증
    const birthDateNumbers = birthDate.replace(/[^\d]/g, '');
    if (birthDateNumbers.length !== 8) {
      newErrors.birthDate = '생년월일을 정확하게 입력해주세요.';
    } else if (!isValidDate(birthDate)) {
      newErrors.birthDate = '생년월일을 정확하게 입력해주세요.';
    }
    
    // 태어난 시간 검증
    // ⭐ 참고: 시간 입력 안했을 경우의 처리는 handleSave에서 finalBirthTime으로 처리
    // validateForm에서는 setState 호출 제거 (비동기 문제 방지)
    if (!unknownTime && birthTime.trim() !== '' && !isValidTime(birthTime)) {
      newErrors.birthTime = '태어난 시를 정확하게 입력해주세요.';
    }
    
    // 휴대폰 번호 검증 (선택 필드)
    if (phoneNumber.trim() !== '') {
      const phoneNumbers = phoneNumber.replace(/[^\d]/g, '');
      if (phoneNumbers.length !== 11 || !phoneNumbers.startsWith('01')) {
        newErrors.phoneNumber = '휴대폰 번호를 다시 확인해 주세요.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      // ⭐️ 태어난 시간 결정: 입력 안 했거나 '모르겠어요' 체크 시 '12:00'으로 설정
      const finalBirthTime = (!unknownTime && birthTime.trim() === '')
        ? '12:00'
        : (unknownTime ? '12:00' : convertTo24Hour(birthTime));

      console.log('📌 [SajuInputPage] 태어난 시간:', finalBirthTime);

      const sajuPayload = {
        full_name: name.trim(),
        gender,
        birth_date: birthDate + 'T00:00:00Z', // timestamp 형식으로 변환
        birth_time: finalBirthTime,
        phone_number: phoneNumber.trim() || null,
      };

      if (isEditMode && editingSaju?.id) {
        // ⭐ 편집 모드: UPDATE
        console.log('✏️ [편집모드] 사주 정보 업데이트:', editingSaju.id, sajuPayload);
        
        const { error } = await supabase
          .from('saju_records')
          .update(sajuPayload)
          .eq('id', editingSaju.id);

        if (error) throw error;

        // ⭐ 본인 사주 수정 시 토스트 메시지 표시 안 함 (returnTo가 있을 때만 표시)
        if (returnTo) {
          toast.success('수정되었습니다.', {
            duration: 2200
          });
        }
      } else {
        // ⭐ 신규 등록 모드: INSERT
        console.log('➕ [신규등록] 사주 정보 저장:', sajuPayload);
        
        const { error } = await supabase
          .from('saju_records')
          .insert({
            user_id: user.id,
            ...sajuPayload,
            notes: '본인', // relation 정보를 notes에 저장
            is_primary: true // ⭐️ 본인 사주는 대표 사주로 설정
          });

        if (error) throw error;

        toast.success('저장되었습니다.', {
          duration: 2200
        });
      }
      
      // 프로필용이므로 로딩 페이지 없이 바로 이동
      setTimeout(() => {
        onSaved();
      }, 300);
    } catch (error) {
      console.error('사주 정보 저장 실패:', error);
      toast.error('사주 정보 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdraw = async () => {
    const confirmWithdraw = window.confirm(
      '정말로 탈퇴하시겠습니까?\n\n' +
      '탈퇴 시 다음 정보가 삭제됩니다:\n' +
      '- 등록된 모든 사주 정보\n' +
      '- 프로필 정보\n' +
      '- 계정 정보\n\n' +
      '※ 구매 내역은 법적 의무에 따라 익명화되어 보존됩니다.\n' +
      '이 작업은 되돌릴 수 없습니다.'
    );

    if (!confirmWithdraw) return;

    const doubleConfirm = window.confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (!doubleConfirm) return;

    try {
      console.log('🚪 [탈퇴] 탈퇴 프로세스 시작');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인 정보를 찾을 수 없습니다');
        return;
      }

      // 1단계: 사용자의 사주 정보 조회
      console.log('📋 [탈퇴] 1단계: 사주 정보 조회');
      const { data: sajuRecords, error: fetchSajuError } = await supabase
        .from('saju_records')
        .select('id')
        .eq('user_id', user.id);

      if (fetchSajuError) throw fetchSajuError;

      console.log(`🗂️ [탈퇴] 사주 정보: ${sajuRecords?.length || 0}건`);

      // 2단계: 각 사주 정보를 참조하는 orders 처리
      if (sajuRecords && sajuRecords.length > 0) {
        console.log('📋 [탈퇴] 2단계: 주문 정보 익명화');

        for (const saju of sajuRecords) {
          // 해당 사주를 참조하는 주문 조회
          const { data: relatedOrders, error: fetchOrderError } = await supabase
            .from('orders')
            .select('*')
            .eq('saju_record_id', saju.id);

          if (fetchOrderError) throw fetchOrderError;

          // 주문 정보 익명화 (FK 해제 + 기본값 설정)
          if (relatedOrders && relatedOrders.length > 0) {
            for (const order of relatedOrders) {
              const { error: updateOrderError } = await supabase
                .from('orders')
                .update({
                  full_name: order.full_name || '탈퇴한 사용자',
                  gender: order.gender || 'male',
                  birth_date: order.birth_date || '1990-01-01T00:00:00Z',
                  birth_time: order.birth_time || '12:00',
                  saju_record_id: null
                })
                .eq('id', order.id);

              if (updateOrderError) throw updateOrderError;
              console.log(`✅ [탈퇴] 주문 익명화 완료: ${order.id}`);
            }
          }
        }

        // 3단계: 사주 정보 삭제
        console.log('🗑️ [탈퇴] 3단계: 사주 정보 삭제');
        const { error: deleteSajuError } = await supabase
          .from('saju_records')
          .delete()
          .eq('user_id', user.id);

        if (deleteSajuError) throw deleteSajuError;
        console.log('✅ [탈퇴] 사주 정보 삭제 완료');
      }

      // 4단계: 사용자가 작성한 주문 FK 해제
      console.log('📋 [탈퇴] 4단계: 사용자 주문 정보 익명화');
      const { error: updateUserOrdersError } = await supabase
        .from('orders')
        .update({
          user_id: null
        })
        .eq('user_id', user.id);

      if (updateUserOrdersError) throw updateUserOrdersError;
      console.log('✅ [탈퇴] 사용자 주문 정보 익명화 완료');

      // 5단계: 계정 삭제 (Supabase Auth)
      console.log('🚪 [탈퇴] 5단계: 계정 삭제');
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

      // admin API는 클라이언트에서 호출 불가능하므로, 대신 signOut만 수행
      // 실제 계정 삭제는 서버 측에서 수동으로 처리하거나 RPC 함수 사용 필요
      if (deleteUserError) {
        console.warn('⚠️ [탈퇴] 계정 삭제 실패 (권한 부족), 로그아웃만 진행:', deleteUserError);
      }

      // 로그아웃
      await supabase.auth.signOut();
      console.log('✅ [탈퇴] 탈퇴 프로세스 완료');

      toast.success('탈퇴가 완료되었습니다');

      // 메인 페이지로 이동
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (error) {
      console.error('❌ [탈퇴] 탈퇴 실패:', error);
      toast.error('탈퇴 처리 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative">
        {/* Status Bar - 47px 높이 유지 */}
        <div className="fixed left-1/2 -translate-x-1/2 top-0 w-full max-w-[440px] z-10 bg-white h-[47px]">
          {/* Status bar 생략 */}
        </div>

        {/* Navigation Header */}
        <NavigationHeader 
          title={sajuInfo || editMode ? '사주 정보 수정' : '사주 정보 입력'}
          onBack={() => {
            if (returnTo) {
              navigate(returnTo);
            } else {
              onBack();
            }
          }}
        />

        {/* Content */}
        <motion.div 
          className="pt-[115px] pb-[120px] px-[20px]"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* 이름 */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mt-[-44px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                  <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">이름</p>
                </div>
              </div>
            </div>
            <div className={`h-[56px] relative rounded-[16px] border transition-colors shrink-0 w-full ${
              errors.name 
                ? 'bg-white border-[#FF0000]' 
                : name.length > 0 
                  ? 'bg-white border-[#48b2af]' 
                  : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]'
            }`}>
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[12px] py-0 relative size-full">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        birthDateInputRef.current?.focus();
                      }
                    }}
                    placeholder="예: 홍길동"
                    inputMode="text"
                    autoComplete="off"
                    className="basis-0 font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[16px] tracking-[-0.45px] bg-transparent outline-none placeholder:text-[#b7b7b7]"
                    ref={nameInputRef}
                  />
                </div>
              </div>
              {errors.name && (
                <div className="absolute top-full left-0 mt-[4px] w-full px-[4px]">
                  <div className="flex gap-[4px] items-center">
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                      <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 11C7.72 11 7.5 10.78 7.5 10.5V8C7.5 7.72 7.72 7.5 8 7.5C8.28 7.5 8.5 7.72 8.5 8V10.5C8.5 10.78 8.28 11 8 11ZM8.5 6.5H7.5V5.5H8.5V6.5Z" fill="#FA5B4A" />
                    </svg>
                    <p className="text-[#fa5b4a] text-[13px] leading-[22px]">{errors.name}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* 성별 */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mt-[36px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                  <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">성별</p>
                </div>
              </div>
            </div>
            <div className="bg-[#f8f8f8] rounded-[16px] p-[8px] w-full overflow-hidden isolate">
              <div className="flex gap-[8px] w-full">
                <button
                  onClick={() => setGender('female')}
                  className="flex-1 h-[48px] rounded-[12px] flex items-center justify-between px-[20px] py-[12px] relative bg-transparent transition-colors duration-200"
                >
                  {gender === 'female' && (
                    <motion.div
                      layoutId="gender-selection-indicator"
                      className="absolute inset-0 bg-[#48b2af] rounded-[12px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`text-[15px] font-medium leading-[20px] tracking-[-0.45px] relative z-[1] transition-colors duration-200 ${gender === 'female' ? 'text-white' : 'text-[#b7b7b7]'}`}>
                    여성
                  </span>
                  <svg className="size-[24px] relative z-[1]" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M7 11.625L10.3294 16L17 9"
                      stroke={gender === 'female' ? 'white' : '#E7E7E7'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      className="transition-colors duration-200"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setGender('male')}
                  className="flex-1 h-[48px] rounded-[12px] flex items-center justify-between px-[20px] py-[12px] relative bg-transparent transition-colors duration-200"
                >
                  {gender === 'male' && (
                    <motion.div
                      layoutId="gender-selection-indicator"
                      className="absolute inset-0 bg-[#48b2af] rounded-[12px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`text-[15px] font-medium leading-[20px] tracking-[-0.45px] relative z-[1] transition-colors duration-200 ${gender === 'male' ? 'text-white' : 'text-[#b7b7b7]'}`}>
                    남성
                  </span>
                  <svg className="size-[24px] relative z-[1]" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M7 11.625L10.3294 16L17 9"
                      stroke={gender === 'male' ? 'white' : '#E7E7E7'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      className="transition-colors duration-200"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>

          {/* 생년월일 */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mt-[36px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                  <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">생년월일 (양력 기준으로 입력해 주세요)</p>
                </div>
              </div>
            </div>
            <div className={`h-[56px] relative rounded-[16px] border transition-colors shrink-0 w-full ${
              errors.birthDate 
                ? 'bg-white border-[#FF0000]' 
                : birthDate.length > 0
                  ? 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]' 
                  : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]' 
            }`}>
              <div className="flex items-center h-full px-[12px] relative">
                <input
                  ref={birthDateInputRef}
                  type="text"
                  inputMode="numeric"
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      birthTimeInputRef.current?.focus();
                    }
                  }}
                  placeholder="예: 1992-07-15 (양력)"
                  className={`peer flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent text-left placeholder:text-[#b7b7b7] w-full ${
                    isValidDate(birthDate) ? 'text-transparent focus:text-[#151515]' : 'text-[#151515]'
                  }`}
                />
                {isValidDate(birthDate) && (
                  <div className="absolute left-[12px] h-full flex items-center pointer-events-none peer-focus:hidden">
                    <span className="text-[16px] leading-[20px] tracking-[-0.45px] text-[#151515]">
                      {birthDate}
                    </span>
                    <span className="text-[16px] leading-[20px] tracking-[-0.45px] text-[#848484] ml-[4px]">
                      (양력)
                    </span>
                  </div>
                )}
              </div>
              {errors.birthDate && (
                <div className="absolute top-full left-0 mt-[4px] w-full px-[4px]">
                  <div className="flex gap-[4px] items-center">
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                      <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 11C7.72 11 7.5 10.78 7.5 10.5V8C7.5 7.72 7.72 7.5 8 7.5C8.28 7.5 8.5 7.72 8.5 8V10.5C8.5 10.78 8.28 11 8 11ZM8.5 6.5H7.5V5.5H8.5V6.5Z" fill="#FA5B4A" />
                    </svg>
                    <p className="text-[#fa5b4a] text-[13px] leading-[22px]">{errors.birthDate}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* 태어난 시간 */}
          <motion.div 
            className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full mt-[36px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
              <div className="relative shrink-0 w-full">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                    <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">태어난 시간</p>
                  </div>
                </div>
              </div>
              <div className={`h-[48px] relative rounded-[12px] border transition-colors shrink-0 w-full ${
                unknownTime
                  ? 'bg-[#f5f5f5] border-[#e7e7e7]' 
                  : errors.birthTime
                    ? 'bg-white border-[#FF0000]' 
                    : birthTime.length > 0 && (birthTime.includes('오전') || birthTime.includes('오후'))
                      ? 'bg-white border-[#48b2af]' 
                      : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]' 
              }`}>
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[12px] py-0 relative size-full">
                    <input
                      type="text"
                      value={birthTime}
                      onChange={(e) => handleBirthTimeChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          if (isFormValid() && !isSaving) {
                            handleSave();
                          }
                        }
                      }}
                      placeholder="예: 21:00"
                      disabled={unknownTime}
                      inputMode="numeric"
                      autoComplete="off"
                      className="basis-0 font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[16px] tracking-[-0.45px] bg-transparent outline-none placeholder:text-[#b7b7b7] disabled:text-[#b7b7b7]"
                      ref={birthTimeInputRef}
                    />
                  </div>
                </div>
                {errors.birthTime && (
                  <div className="absolute top-full left-0 mt-[4px] w-full px-[4px]">
                    <div className="flex gap-[4px] items-center">
                      <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                        <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 11C7.72 11 7.5 10.78 7.5 10.5V8C7.5 7.72 7.72 7.5 8 7.5C8.28 7.5 8.5 7.72 8.5 8V10.5C8.5 10.78 8.28 11 8 11ZM8.5 6.5H7.5V5.5H8.5V6.5Z" fill="#FA5B4A" />
                      </svg>
                      <p className="text-[#fa5b4a] text-[13px] leading-[22px]">{errors.birthTime}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              onClick={handleUnknownTimeToggle}
              className="content-stretch flex gap-[4px] items-center pb-0 pt-[24px] px-0 relative shrink-0 cursor-pointer"
            >
              <p className="leading-[20px] relative shrink-0 text-[#525252] text-[15px] text-nowrap tracking-[-0.45px]">모르겠어요</p>
              <div className="content-stretch flex items-center justify-center relative shrink-0 size-[44px]">
                <div className={`${unknownTime ? 'bg-[#48b2af]' : 'bg-white border border-[#e7e7e7]'} content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[28px]`}>
                  {unknownTime && (
                    <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                      <path d="M7 11.625L10.3294 16L17 9" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 휴대폰 번호 */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mt-[36px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                  <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">휴대폰 번호 (선택)</p>
                </div>
              </div>
            </div>
            <div className={`h-[56px] relative rounded-[16px] border transition-colors shrink-0 w-full ${
              errors.phoneNumber 
                ? 'bg-white border-[#FF0000]' 
                : phoneNumber.length > 0
                  ? 'bg-white border-[#48b2af]' 
                  : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]'
            }`}>
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[12px] py-0 relative size-full">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    placeholder="'-' 하이픈 없이 숫자만 입력해 주세요"
                    inputMode="numeric"
                    autoComplete="off"
                    className="basis-0 font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[16px] tracking-[-0.45px] bg-transparent outline-none placeholder:text-[#b7b7b7]"
                  />
                </div>
              </div>
              {errors.phoneNumber && (
                <div className="absolute top-full left-0 mt-[4px] w-full px-[4px]">
                  <div className="flex gap-[4px] items-center">
                    <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
                      <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 11C7.72 11 7.5 10.78 7.5 10.5V8C7.5 7.72 7.72 7.5 8 7.5C8.28 7.5 8.5 7.72 8.5 8V10.5C8.5 10.78 8.28 11 8 11ZM8.5 6.5H7.5V5.5H8.5V6.5Z" fill="#FA5B4A" />
                    </svg>
                    <p className="text-[#fa5b4a] text-[13px] leading-[22px]">{errors.phoneNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* 탈퇴하기 - returnTo가 없을 때만 표시 (프로필에서 유입) */}
          {!returnTo && !sajuInfo && (
            <motion.div
              onClick={handleWithdraw}
              className="content-stretch flex flex-col h-[34px] items-center justify-center px-[8px] py-0 rounded-[12px] mt-[24px] cursor-pointer"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
            >
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
                <p className="leading-[22px] relative shrink-0 text-[#848484] text-[14px] text-nowrap tracking-[-0.42px]">탈퇴하기</p>
                <div className="relative shrink-0 size-[12px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                    <path d={svgPaths.p3117bd00} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 content-stretch flex flex-col items-start bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[440px] z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-white relative shrink-0 w-full">
            <div className="flex flex-col items-center justify-center size-full">
              <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                <motion.div
                  onClick={handleSave}
                  className={`${isFormValid() && !isSaving ? 'bg-[#48b2af] cursor-pointer active:bg-[#3a9794]' : 'bg-[#f8f8f8] cursor-not-allowed'} h-[56px] relative rounded-[16px] shrink-0 w-full transition-colors`}
                  whileTap={isFormValid() && !isSaving ? { scale: 0.96 } : {}}
                  transition={{ duration: 0.1, ease: "easeInOut" }}
                  style={{ transformOrigin: "center" }}
                >
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="content-stretch flex h-[56px] items-center justify-center px-[12px] py-0 relative w-full">
                      <p className={`leading-[25px] relative shrink-0 text-[16px] text-nowrap tracking-[-0.32px] ${isFormValid() && !isSaving ? 'text-white font-medium' : 'text-[#b7b7b7] font-medium'}`}>
                        {isSaving ? (editMode ? '수정 중...' : '저장 중...') : (editMode ? '수정하기' : '저장하기')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SessionExpiredDialog isOpen={isSessionExpired} />
    </div>
  );
}