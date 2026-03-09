/**
 * 사주 정보 추가 전용 페이지 (관계 필드 포함)
 * - 프로필 > 사주 정보 관리 > "사주 정보 추가" 버튼 클릭 시 사용
 * - "함께 보는 사주" 추가 전용
 * - 관계 필드 필수 입력
 * - AI 호출 없음, 단순 저장만
 * Figma import: 사주정보추가-255-3568.tsx
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useDragControls } from "motion/react";
import svgPaths from "../imports/svg-br5ag5z658";
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { SessionExpiredDialog } from './SessionExpiredDialog';
import { NavigationHeader } from './NavigationHeader';

interface SajuAddPageProps {
  onBack: () => void;
  onSaved: () => void;
}

// 에러 상태 타입
interface ValidationErrors {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  relationship?: string;
}

export default function SajuAddPage({ onBack, onSaved }: SajuAddPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dragControls = useDragControls();
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
  const [relationship, setRelationship] = useState('');
  const [tempRelationship, setTempRelationship] = useState('');
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Refs for auto-focus on Enter key
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

  // 바텀 시트 오픈 시 바디 스크롤 잠금 및 상태바 딤 처리
  useEffect(() => {
    if (showRelationshipPicker) {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      const originalThemeColor = metaThemeColor?.getAttribute('content');
      
      document.body.style.overflow = 'hidden';
      metaThemeColor?.setAttribute('content', '#000000');

      return () => {
        document.body.style.overflow = '';
        if (originalThemeColor) metaThemeColor?.setAttribute('content', originalThemeColor);
      };
    }
  }, [showRelationshipPicker]);

  // ⭐ 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    // editMode가 있을 때: sajuData 사용 (기존 로직)
    // sajuInfo가 있을 때: 케밥 메뉴에서 전달받은 사주 정보 사용
    const dataToLoad = editMode ? sajuData : sajuInfo;
    
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
      
      // ⭐ 관계 정보 로드 (notes 필드)
      setRelationship(dataToLoad.notes || '');
    }
  }, [editMode, sajuData, sajuInfo]);

  const relationshipOptions = [
    '연인',
    '가족',
    '친구',
    '지인',
    '동료',
    '기타'
  ];

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
  const isValidDate = (dateString: string): boolean => {
    const numbers = dateString.replace(/[^\d]/g, '');
    if (numbers.length !== 8) return false;

    const year = parseInt(numbers.substring(0, 4));
    const month = parseInt(numbers.substring(4, 6));
    const day = parseInt(numbers.substring(6, 8));

    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (month < 1 || month > 12) return false;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;

    return true;
  };

  // 이름 입력 핸들러
  const handleNameChange = (value: string) => {
    // 모든 문자 입력 가능 (최대 20자)
    const filtered = value.slice(0, 20);
    setName(filtered);
    
    if (filtered.length > 0) {
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
      if (!isValidDate(formatted)) {
        setErrors(prev => ({ ...prev, birthDate: '유효한 생년월일을 입력해주세요.' }));
      } else {
        setErrors(prev => ({ ...prev, birthDate: undefined }));
        // ⭐ 아이폰 숫자 키보드 대응: 8자리 입력 완료 시 자동으로 태어난 시간으로 포커스 이동
        setTimeout(() => {
          birthTimeInputRef.current?.focus();
        }, 100);
      }
    } else {
      // 입력 중일 때는 에러 표시 안함
      setErrors(prev => ({ ...prev, birthDate: undefined }));
    }
  };

  // 태어난 시간 입력 핸들러
  const handleBirthTimeChange = (value: string) => {
    // 숫자만 입력 가능
    const numbers = value.replace(/[^\d]/g, '');
    
    // 4자리 제한 (HHMM)
    if (numbers.length > 4) return;
    
    // 입력 중일 때는 숫자만 표시
    if (numbers.length < 4) {
      setBirthTime(numbers);
      setErrors(prev => ({ ...prev, birthTime: undefined }));
      return;
    }
    
    // 4자리 입력 완료 시 오전/오후 자동 변환
    if (numbers.length === 4) {
      const hourStr = numbers.substring(0, 2);
      const minuteStr = numbers.substring(2, 4);
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      
      // 유효성 검사
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        setErrors(prev => ({ ...prev, birthTime: '태어난 시를 정확하게 입력해주세요.' }));
        setBirthTime(numbers);
        return;
      }
      
      // 오전/오후 변환
      const period = hour < 12 ? '오전' : '오후';
      const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      const formattedTime = `${period} ${displayHour}:${minuteStr}`;
      
      setBirthTime(formattedTime);
      setErrors(prev => ({ ...prev, birthTime: undefined }));
      
      // ⭐ 4자리 입력 완료 시 키보드 닫고 관계 바텀시트 자동 노출
      console.log('✅ [태어난 시간] 4자리 입력 완료 → 키보드 닫고 관계 바텀시트 자동 노출');
      birthTimeInputRef.current?.blur(); // 키보드 닫기
      setTimeout(() => {
        setShowRelationshipPicker(true);
      }, 600); // 600ms 딜레이로 키보드가 완전히 닫힌 후 바텀시트 노출
    }
  };

  // "모르겠어요" 토글 핸들러
  const handleUnknownTimeToggle = () => {
    const newValue = !unknownTime;
    setUnknownTime(newValue);
    
    if (newValue) {
      // 체크 시 빈 값으로 설정 (placeholder 노출용)
      setBirthTime('');
      setErrors(prev => ({ ...prev, birthTime: undefined }));
    } else {
      // 체크 해제 시 초기화
      setBirthTime('');
    }
  };

  // 필수값 검사
  const isFormValid = () => {
    const nameValid = name.trim().length >= 1;
    const birthDateValid = birthDate.replace(/[^\d]/g, '').length === 8 && isValidDate(birthDate);
    // ⭐️ 관계는 선택 사항으로 변경
    
    return nameValid && birthDateValid;
  };

  // 저장 버튼 클릭 시 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 이름 검증
    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // 생년월일 검증
    const birthDateNumbers = birthDate.replace(/[^\d]/g, '');
    if (birthDateNumbers.length !== 8) {
      newErrors.birthDate = '생년월일을 정확하게 입력해주세요.';
    } else if (!isValidDate(birthDate)) {
      newErrors.birthDate = '유효한 생년월일을 입력해주세요.';
    }

    // ⭐️ 관계는 선택 사항 - 검증 제거

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!validateForm() || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      console.log('💾 [SajuAddPage] 사주 정보 저장 시작');

      // ⭐ 항상 Supabase에 저장 (DEV/PROD 동일)
      // 로그인 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      console.log('✅ [SajuAddPage] 로그인 확인:', user.email);

      // ⭐️ 관계가 비어있으면 '지인'으로 기본값 설정
      const finalRelationship = relationship.trim() || '지인';
      console.log('📌 [SajuAddPage] 관계:', finalRelationship);

      // ⭐️ 태어난 시간 결정: 입력 안 했거나 '모르겠어요' 체크 시 '12:00'으로 설정
      const finalBirthTime = (!unknownTime && birthTime.trim() === '')
        ? '12:00'
        : (unknownTime ? '12:00' : convertTo24Hour(birthTime));
      console.log('📌 [SajuAddPage] 태어난 시간:', finalBirthTime);

      const sajuPayload = {
        full_name: name.trim(),
        gender: gender, // 'female' 또는 'male'로 그대로 저장
        birth_date: new Date(birthDate).toISOString(),
        birth_time: finalBirthTime,
        notes: finalRelationship, // 관계를 notes 필드에 저장 (기본값: '지인')
      };

      if (isEditMode && editingSaju?.id) {
        // ⭐ 편집 모드: UPDATE
        console.log('✏️ [편집모드] 사주 정보 업데이트:', editingSaju.id, sajuPayload);
        
        const { error } = await supabase
          .from('saju_records')
          .update(sajuPayload)
          .eq('id', editingSaju.id);

        if (error) {
          console.error('❌ [SajuAddPage] 업데이트 실패:', error);
          throw error;
        }

        console.log('✅ [SajuAddPage] 사주 정보 업데이트 완료');
        // ⭐ 토스트는 onSaved 콜백(App.tsx)에서 navigate 이후 표시
      } else {
        // ⭐ 신규 등록 모드: INSERT
        console.log('➕ [신규등록] 사주 정보 저장:', sajuPayload);
        
        const { data, error } = await supabase
          .from('saju_records')
          .insert({
            user_id: user.id,
            ...sajuPayload,
            is_primary: true // ⭐️ 함께 보는 사주 추가 시 대표 사주로 자동 지정
          })
          .select()
          .single();

        if (error) {
          console.error('❌ [SajuAddPage] 저장 실패:', error);
          throw error;
        }

        console.log('✅ [SajuAddPage] 사주 정보 저장 완료 (대표 사주로 지정):', data);
        
        // ⭐️ 기존 대표 사주 해제 (새로 추가된 사주가 대표 사주가 됨)
        const { error: resetError } = await supabase
          .from('saju_records')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .neq('id', data.id);

        if (resetError) {
          console.error('❌ [SajuAddPage] 기존 대표 사주 해제 실패:', resetError);
        } else {
          console.log('✅ [SajuAddPage] 기존 대표 사주 해제 완료');
        }

        toast.success('저장되었습니다.', {
          duration: 2200
        });
      }

      // ⭐ 캐시 선행 업데이트: 저장 후 최신 사주 데이터 조회해서 캐시에 저장
      // → ProfilePage에서 백그라운드 API 호출 없이 즉시 표시
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
        console.log('✅ [SajuAddPage] 캐시 선행 업데이트 완료 - 새 대표 사주:', newPrimary.full_name);
      } else {
        // 조회 실패 시 기존 방식대로 무효화
        localStorage.removeItem('saju_records_cache');
        localStorage.removeItem('primary_saju');
        console.log('🗑️ [SajuAddPage] saju_records_cache, primary_saju 캐시 무효화');
      }

      // 저장 완료 후 관리 페이지로 이동
      setTimeout(() => {
        if (returnTo) {
          navigate(returnTo);
        } else {
          onSaved();
        }
      }, 300);
    } catch (error) {
      console.error('❌ [SajuAddPage] 저장 중 오류:', error);
      toast.error('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative">
        {/* Top Navigation */}
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

        {/* Main Content */}
        <motion.div 
          className="pt-[68px] pb-[140px] w-full max-w-[440px] px-[20px] mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* 이름 */}
          <motion.div 
            className="flex flex-col gap-[4px] mb-[28px] w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
              이름
            </label>
            <div className={`h-[56px] relative rounded-[20px] border transition-colors w-full ${
              errors.name
                ? 'bg-white border-[#FF0000]' 
                : name.length > 0 
                  ? 'bg-white border-[#48b2af]' 
                  : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]'
            }`}>
              <div className="flex items-center h-full px-[12px]">
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
                  className="flex-1 text-[16px] text-[#151515] leading-[20px] tracking-[-0.45px] outline-none bg-transparent placeholder:text-[#b7b7b7] placeholder:text-[15px] w-full"
                  ref={nameInputRef}
                />
              </div>
              {errors.name && (
                <p className="absolute top-full left-0 mt-[4px] text-[12px] text-[#FF0000] px-[4px]">{errors.name}</p>
              )}
            </div>
          </motion.div>

          {/* 성별 */}
          <motion.div 
            className="flex flex-col gap-[4px] mb-[28px] w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
              성별
            </label>
            <div className="bg-[#f8f8f8] rounded-[20px] p-[8px] w-full overflow-hidden isolate">
              <div className="flex gap-[8px] w-full">
                <button
                  onClick={() => setGender('female')}
                  className="flex-1 h-[48px] rounded-[17px] flex items-center justify-between px-[20px] py-[12px] relative bg-transparent transition-colors duration-200"
                >
                  {gender === 'female' && (
                    <motion.div
                      layoutId="gender-selection-indicator"
                      className="absolute inset-0 bg-[#48b2af] rounded-[17px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
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
                  className="flex-1 h-[48px] rounded-[17px] flex items-center justify-between px-[20px] py-[12px] relative bg-transparent transition-colors duration-200"
                >
                  {gender === 'male' && (
                    <motion.div
                      layoutId="gender-selection-indicator"
                      className="absolute inset-0 bg-[#48b2af] rounded-[17px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
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
            className="flex flex-col gap-[4px] mb-[28px] w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
              생년월일 (양력 기준으로 입력해 주세요)
            </label>
            <div className={`h-[56px] relative rounded-[20px] border transition-colors w-full ${
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
                  className={`peer flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent text-left placeholder:text-[#b7b7b7] placeholder:text-[15px] w-full ${
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
            className="flex gap-[24px] items-start mb-[28px] w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="flex-1 flex flex-col gap-[4px] min-w-0">
              <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
                태어난 시간
              </label>
              <div className={`h-[56px] relative rounded-[20px] border transition-colors w-full ${
                unknownTime
                  ? 'bg-[#f5f5f5] border-[#e7e7e7]' 
                  : errors.birthTime
                    ? 'bg-white border-[#FF0000]' 
                    : birthTime.length > 0
                      ? 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]' 
                      : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]' 
              }`}>
                <div className="flex items-center h-full px-[12px]">
                  <input
                    ref={birthTimeInputRef}
                    type="text"
                    inputMode="numeric"
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
                    placeholder={unknownTime ? "오후 12:00" : "예: 21:00"}
                    disabled={unknownTime}
                    className={`flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent min-w-0 w-full ${
                      unknownTime
                        ? 'text-[#b7b7b7] placeholder:text-[#b7b7b7] placeholder:text-[15px]'
                        : 'text-[#151515] placeholder:text-[#b7b7b7] placeholder:text-[15px]'
                    }`}
                  />
                </div>
                {errors.birthTime && (
                  <p className="absolute top-full left-0 mt-[4px] text-[12px] text-[#FF0000] px-[4px]">{errors.birthTime}</p>
                )}
              </div>
            </div>

            {/* 모르겠어요 체크박스 */}
            <div className="pt-[24px] shrink-0">
              <button
                onClick={handleUnknownTimeToggle}
                className="flex items-center gap-[4px] cursor-pointer bg-transparent border-none p-0"
              >
                <span className="text-[15px] font-medium text-[#525252] leading-[20px] tracking-[-0.45px] whitespace-nowrap">
                  모르겠어요
                </span>
                <div className="flex items-center justify-center size-[44px]">
                  <div className={`size-[28px] rounded-[8px] border flex items-center justify-center transition-colors ${
                    unknownTime ? 'border-[#48b2af] bg-[#48b2af]' : 'border-[#e7e7e7] bg-white'
                  }`}>
                    {unknownTime && (
                      <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                        <path
                          d="M4 10L8 14L16 6"
                          stroke="white"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* 관계 */}
          <motion.div 
            className="flex flex-col gap-[0px] w-full"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
              관계
            </label>
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
              {/* Label Container */}
              <div className="relative shrink-0 w-full">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                    
                  </div>
                </div>
              </div>

              {/* Input Container */}
              <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-full">
                {/* Input Row */}
                <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full">
                  {/* Input Field */}
                  <div 
                    className="basis-0 grow min-h-px min-w-px relative shrink-0 cursor-pointer"
                    onClick={() => {
                      setTempRelationship(relationship);
                      setShowRelationshipPicker(true);
                    }}
                  >
                    <div className="flex flex-row items-center justify-start size-full">
                      <div className="content-stretch flex items-center justify-start px-[5px] py-0 relative w-full">
                        <p className={`basis-0 font-['Pretendard_Variable:Regular',sans-serif] pt-[4px] font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[15px] tracking-[-0.45px] ${relationship ? 'text-[#151515]' : 'text-[#b7b7b7]'}`}>
                          {relationship || '관계를 선택해 주세요'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => {
                      setTempRelationship(relationship);
                      setShowRelationshipPicker(true);
                    }}
                    className="bg-transparent content-stretch flex h-[38px] items-center justify-center px-[12px] py-0 relative rounded-[12px] shrink-0 w-[80px] border border-[#e7e7e7] cursor-pointer group transition-colors active:bg-gray-100"
                  >
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#525252] text-[14px] text-nowrap tracking-[-0.42px] transition-transform group-active:scale-96" style={{ paddingTop: '2px' }}>
                      선택
                    </p>
                  </button>
                </div>

                {/* Divider */}
                <div className="h-0 relative shrink-0 w-full">
                  <div className="absolute inset-[-0.5px_0] h-[1px] bg-[#f3f3f3]" />
                </div>

                {/* Error Message */}
                {errors.relationship && (
                  <p className="w-full text-left mt-[-8px] text-[12px] text-[#FF0000] px-[4px]">
                    {errors.relationship}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] pb-[28px] z-10">
          <div className="px-[20px] pt-[12px]">
            <button
              onClick={handleSave}
              disabled={!isFormValid() || isSaving}
              className={`w-full h-[56px] rounded-[20px] flex items-center justify-center transition-all ${
                isFormValid() && !isSaving
                  ? 'bg-[#48b2af] text-white cursor-pointer hover:bg-[#3a9794] active:scale-99 active:bg-[#3a9794]'
                  : 'bg-[#f8f8f8] text-[#b7b7b7] cursor-not-allowed'
              }`}
            >
              <span className="text-[16px] font-medium leading-[25px] tracking-[-0.32px]">
                {isSaving ? (editMode ? '수정 중...' : '저장 중...') : (editMode ? '수정하기' : '저장하기')}
              </span>
            </button>
          </div>
        </div>

        {/* 관계 선택 Bottom Sheet */}
        {createPortal(
          <AnimatePresence>
            {showRelationshipPicker && (
              <div className="fixed inset-0 z-[9999] pointer-events-none">
                {/* Backdrop */}
                <motion.div
                  className="fixed inset-0 bg-black/50 touch-none pointer-events-auto"
                  onClick={() => setShowRelationshipPicker(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                {/* Bottom Sheet */}
                <motion.div
                  className="fixed bottom-0 left-0 right-0 w-full max-w-[440px] mx-auto bg-white flex flex-col pointer-events-auto z-[10000]" style={{ borderRadius: '24px 24px 0 0' }}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  drag="y"
                  dragControls={dragControls}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 80) {
                      setShowRelationshipPicker(false);
                    }
                  }}
                >
                  {/* Handle */}
                  <div 
                    className="flex items-center justify-center py-[12px] cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => dragControls.start(e)}
                  >
                    <div className="w-[48px] h-[4px] bg-[#d4d4d4] rounded-full" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center px-[32px]" style={{ paddingBottom: '16px', paddingTop: '14px' }}>
                    <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '18px', fontWeight: 600, lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#000000' }}>
                      관계 선택
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="flex flex-col gap-[8px] px-[24px] pb-[32px]">
                    {relationshipOptions.map((option, index) => (
                      <div key={option}>
                        <div
                          className="flex gap-[6px] items-center w-full cursor-pointer"
                          onClick={() => setTempRelationship(option)}
                        >
                          {/* Radio - 좌측 */}
                          <div className="flex items-center justify-center shrink-0 size-[36px]">
                            {tempRelationship === option ? (
                              <div className="flex items-center justify-center rounded-full shrink-0 size-[20px] border-[6px]" style={{ borderColor: '#48b2af' }} />
                            ) : (
                              <div className="rounded-full shrink-0 size-[20px] border-2 bg-white" style={{ borderColor: '#e7e7e7' }} />
                            )}
                          </div>
                          {/* Text - 우측 */}
                          <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '15px', fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.45px', color: '#151515' }}>
                            {option}
                          </p>
                        </div>
                        {index < relationshipOptions.length - 1 && (
                          <div className="w-full h-[1px] bg-[#f8f8f8] mt-[8px]" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Buttons */}
                  <div className="sticky bottom-0 w-full z-20 bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] px-[20px] pt-[12px] pb-[calc(20px+env(safe-area-inset-bottom))]">
                    <div className="flex gap-[12px] w-full">
                      <motion.button
                        onClick={() => setShowRelationshipPicker(false)}
                        className="flex-1 h-[56px] bg-[#f0f8f8] flex items-center justify-center cursor-pointer"
                        style={{ borderRadius: '20px' }}
                        whileTap={{ scale: 0.99, backgroundColor: "#E4F7F7" }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '25px', letterSpacing: '-0.32px', color: '#48b2af' }}>
                          취소
                        </span>
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setRelationship(tempRelationship);
                          setShowRelationshipPicker(false);
                          setErrors(prev => ({ ...prev, relationship: undefined }));
                        }}
                        className="flex-1 h-[56px] bg-[#48b2af] flex items-center justify-center cursor-pointer"
                        style={{ borderRadius: '20px' }}
                        whileTap={{ scale: 0.99, backgroundColor: "#368d8a" }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '16px', fontWeight: 500, lineHeight: '25px', letterSpacing: '-0.32px', color: '#ffffff' }}>
                          선택 완료
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
      <SessionExpiredDialog isOpen={isSessionExpired} />
    </div>
  );
}