/**
 * 무료 콘텐츠 전용 사주 정보 입력 페이지
 * - 핸드폰번호 입력 없음
 * - 탈퇴하기 버튼 없음
 * - 간단한 사주 정보만 입력
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "motion/react";
import svgPaths from "../imports/svg-b5r0yb3uuf";
import { supabase } from '../lib/supabase';

interface FreeBirthInfoInputProps {
  productId: string;
  onBack: () => void;
}

// 에러 상태 타입
interface ValidationErrors {
  name?: string;
  birthDate?: string;
  birthTime?: string;
}

export default function FreeBirthInfoInput({ productId, onBack }: FreeBirthInfoInputProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // ⭐ Refs for auto-focus on Enter key
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

  // ⭐️ 컴포넌트 마운트 시 사주 정보 불러오기 (DB 우선 → 캐시 fallback)
  useEffect(() => {
    const loadSajuInfo = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [FreeBirthInfoInput] 컴포넌트 마운트 → 사주 정보 로드');
      
      // 1️⃣ 로그인 사용자면 DB에서 대표 사주 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('👤 [FreeBirthInfoInput] 로그인 사용자 → DB에서 사주 조회');
        
        const { data: primarySaju, error } = await supabase
          .from('saju_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();
        
        if (!error && primarySaju) {
          console.log('✅ [FreeBirthInfoInput] DB에서 대표 사주 발견:', primarySaju);
          
          // 폼 필드 자동 채우기
          setName(primarySaju.full_name || '');
          setGender(primarySaju.gender || 'female');
          
          // birth_date는 ISO 형식 → YYYY-MM-DD 변환
          if (primarySaju.birth_date) {
            const birthDateObj = new Date(primarySaju.birth_date);
            const yyyy = birthDateObj.getFullYear();
            const mm = String(birthDateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(birthDateObj.getDate()).padStart(2, '0');
            setBirthDate(`${yyyy}-${mm}-${dd}`);
          }
          
          // birth_time은 "HH:MM" 형식
          if (primarySaju.birth_time) {
            if (primarySaju.birth_time === '시간 미상') {
              // ⭐️ '시간 미상'일 경우: unknownTime = true, birthTime = ""
              setBirthTime('');
              setUnknownTime(true);
            } else {
              setBirthTime(primarySaju.birth_time);
              setUnknownTime(false);
            }
          }
          
          console.log('✅ [FreeBirthInfoInput] DB 사주 데이터 자동 입력 완료');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          return; // DB에서 찾았으면 캐시 확인 스킵
        } else {
          console.log('⚠️ [FreeBirthInfoInput] DB에 대표 사주 없음 → 캐시 확인');
        }
      } else {
        console.log('⚠️ [FreeBirthInfoInput] 비로그인 사용자 → 캐시 확인');
      }
      
      // 2️⃣ DB에 없으면 캐시 확인 (비로그인 사용자 또는 DB에 사주 없는 경우)
      const cachedSajuStr = localStorage.getItem('cached_saju_info');
      
      if (cachedSajuStr) {
        try {
          const cachedSaju = JSON.parse(cachedSajuStr);
          console.log('✅ [FreeBirthInfoInput] 캐시된 사주 정보 발견:', cachedSaju);
          
          // 폼 필드 자동 채우기
          if (cachedSaju.name) setName(cachedSaju.name);
          if (cachedSaju.gender) setGender(cachedSaju.gender);
          if (cachedSaju.birthDate) {
            // YYYY-MM-DD → YYYY-MM-DD 형식 유지
            setBirthDate(cachedSaju.birthDate);
          }
          if (cachedSaju.birthTime) {
            if (cachedSaju.birthTime === '시간 미상') {
              // ⭐️ '시간 미상'일 경우: unknownTime = true, birthTime = ""
              setBirthTime('');
              setUnknownTime(true);
            } else {
              setBirthTime(cachedSaju.birthTime);
              setUnknownTime(false);
            }
          }
          
          console.log('✅ [FreeBirthInfoInput] 캐시 데이터 자동 입력 완료');
        } catch (error) {
          console.error('❌ [FreeBirthInfoInput] 캐시 파싱 실패:', error);
        }
      } else {
        console.log('⚠️ [FreeBirthInfoInput] 캐시된 사주 정보 없음');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };
    
    loadSajuInfo();
  }, []);

  // Supabase 사주 정보 저장 (로그인 사용자용)
  const saveSajuRecord = async (data: {
    name: string;
    gender: 'female' | 'male';
    birthDate: string;
    birthTime: string;
    unknownTime: boolean;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const genderKorean = data.gender === 'female' ? '여' : '남';

    // ⭐ 기존 사주 개수 확인 (최초 사주면 is_primary: true)
    const { data: existingSaju, error: existingError } = await supabase
      .from('saju_records')
      .select('id')
      .eq('user_id', user.id);

    if (existingError) {
      console.error('기존 사주 조회 실패:', existingError);
    }

    const isFirstSaju = !existingSaju || existingSaju.length === 0;
    console.log(`📌 [FreeBirthInfoInput] 기존 사주 개수: ${existingSaju?.length || 0}, 최초 사주: ${isFirstSaju}`);

    const { data: savedRecord, error } = await supabase
      .from('saju_records')
      .insert({
        user_id: user.id,
        full_name: data.name,
        gender: genderKorean,
        birth_date: new Date(data.birthDate).toISOString(),
        birth_time: data.birthTime,
        notes: '본인',
        is_primary: isFirstSaju // ⭐️ 최초 사주면 대표 사주로 설정
      })
      .select()
      .single();

    if (error) {
      console.error('사주 정보 저장 실패:', error);
      throw error;
    }

    console.log(`✅ [FreeBirthInfoInput] 사주 정보 저장 완료, is_primary: ${isFirstSaju}`);
    return savedRecord;
  };

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

  // 날짜 유효성 검사
  const isValidDate = (dateString: string): boolean => {
    const numbers = dateString.replace(/[^0-9]/g, '');
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
    // ⭐️ 모든 문자 입력 가능 (한글, 숫자, 알파벳, 특수문자) - 최대 20자
    const filtered = value.slice(0, 20);
    setName(filtered);
    
    if (filtered.length > 0) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  // 생년월일 입력 핸들러 (자동 포매팅)
  const handleBirthDateChange = (value: string) => {
    // 숫자만 입력 가능
    const numbers = value.replace(/[^0-9]/g, '');
    
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
        setErrors(prev => ({ ...prev, birthDate: '생년월일을 정확하게 입력해주세요.' }));
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
    // ⭐️ 숫자만 입력 가능
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 4자리 제한
    if (numbers.length > 4) return;
    
    // ⭐️ 4자리 숫자 입력 완료 시 오전/오후 형식으로 자동 변환
    if (numbers.length === 4) {
      const hour = parseInt(numbers.substring(0, 2));
      const minute = numbers.substring(2, 4);
      
      // 유효성 검사
      if (hour > 23 || parseInt(minute) > 59) {
        setErrors(prev => ({ ...prev, birthTime: '태어난 시를 정확하게 입력해주세요.' }));
        setBirthTime(numbers);
        return;
      }
      
      // 오전/오후 변환
      const period = hour < 12 ? '오전' : '오후';
      const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      const formattedTime = `${period} ${displayHour.toString().padStart(2, '0')}:${minute}`;
      
      setBirthTime(formattedTime);
      setErrors(prev => ({ ...prev, birthTime: undefined }));
    } else {
      // 입력 중일 때는 숫자만 표시
      setBirthTime(numbers);
      setErrors(prev => ({ ...prev, birthTime: undefined }));
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

  // 필수값 검사: 이름, 성별, 생년월일
  const isFormValid = () => {
    const nameValid = name.trim().length >= 1;
    const birthDateValid = birthDate.replace(/[^0-9]/g, '').length === 8 && isValidDate(birthDate);
    
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
    const birthDateNumbers = birthDate.replace(/[^0-9]/g, '');
    if (birthDateNumbers.length !== 8) {
      newErrors.birthDate = '생년월일을 정확하게 입력해주세요.';
    } else if (!isValidDate(birthDate)) {
      newErrors.birthDate = '유효한 생년월일을 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 [FreeBirthInfoInput] handleSubmit 시작');
    console.log('📌 [FreeBirthInfoInput] productId:', productId);
    console.log('📌 [FreeBirthInfoInput] name:', name);
    console.log('📌 [FreeBirthInfoInput] gender:', gender);
    console.log('📌 [FreeBirthInfoInput] birthDate:', birthDate);
    console.log('📌 [FreeBirthInfoInput] birthTime:', birthTime);
    console.log('📌 [FreeBirthInfoInput] unknownTime:', unknownTime);

    if (!validateForm() || isSubmitting) {
      console.log('❌ [FreeBirthInfoInput] 유효성 검사 실패 또는 이미 제출 중');
      return;
    }

    console.log('✅ [FreeBirthInfoInput] 유효성 검사 통과');
    setIsSubmitting(true);

    // ⭐️ 태어난 시간 결정: 입력 안 했거나 '모르겠어요' 체크 시 '12:00'으로 설정
    const finalBirthTime = (!unknownTime && birthTime.trim() === '')
      ? '12:00'
      : (unknownTime ? '12:00' : convertTo24Hour(birthTime));
    console.log('📌 [FreeBirthInfoInput] 태어난 시간:', finalBirthTime);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      console.log('👤 [FreeBirthInfoInput] 사용자 조회 결과:', user ? '로그인됨' : '로그아웃됨');
      console.log('📌 [FreeBirthInfoInput] user:', user);
      console.log('📌 [FreeBirthInfoInput] userError:', userError);

      // ⭐️ 로그아웃 상태인 경우: localStorage에 캐시만 저장
      if (userError || !user) {
        console.log('🔓 [FreeBirthInfoInput] 로그아웃 상태 → localStorage에 캐시 저장');

        const cachedSajuData = {
          name: name.trim(),
          gender: gender,
          birthDate: birthDate,
          birthTime: finalBirthTime,
          timestamp: new Date().toISOString()
        };

        localStorage.setItem('cached_saju_info', JSON.stringify(cachedSajuData));
        console.log('✅ [FreeBirthInfoInput] localStorage 캐시 저장 완료:', cachedSajuData);

        // ⭐️ 로그아웃 상태에서는 임시 recordId 생성 (timestamp 기반)
        const tempRecordId = `temp_${Date.now()}`;
        console.log('📌 [FreeBirthInfoInput] 임시 recordId 생성:', tempRecordId);

        // ⭐️ Edge Function 호출 제거 - FreeContentLoading에서 처리
        console.log('🔀 [FreeBirthInfoInput] Edge Function은 로딩 페이지에서 호출됨');

        // 로딩 페이지로 이동 (사주 데이터 직접 전달)
        const loadingUrl = `/free-loading?contentId=${productId}&userName=${encodeURIComponent(name)}&guestMode=true`;
        console.log('🔀 [FreeBirthInfoInput] 로딩 페이지로 이동 (게스트):', loadingUrl);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        navigate(loadingUrl);
        return;
      }

      // ⭐️ 로그인 상태인 경우: DB에 저장
      console.log('✅ [FreeBirthInfoInput] 로그인 상태 → DB에 사주 정보 저장');
      console.log('💾 [FreeBirthInfoInput] 사주 정보 저장 시작...');

      // 사주 정보 저장
      const sajuData = await saveSajuRecord({
        name: name.trim(),
        gender: gender,
        birthDate: birthDate,
        birthTime: finalBirthTime,
        unknownTime: unknownTime,
      });

      console.log('✅ [FreeBirthInfoInput] 사주 정보 저장 완료:', sajuData);
      console.log('📌 [FreeBirthInfoInput] sajuData.id:', sajuData?.id);

      // ⭐️ Edge Function 호출 제거 - FreeContentLoading에서 처리
      console.log('🔀 [FreeBirthInfoInput] Edge Function은 로딩 페이지에서 호출됨');

      // ⭐️ 로딩 페이지로 이동 (sajuRecordId 전달)
      const loadingUrl = `/free-loading?contentId=${productId}&sajuRecordId=${sajuData.id}&userName=${encodeURIComponent(name)}`;
      console.log('🔀 [FreeBirthInfoInput] 로딩 페이지로 이동:', loadingUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      navigate(loadingUrl);
      
    } catch (error) {
      console.error('❌ [FreeBirthInfoInput] Error saving saju record:', error);
      alert('사주 정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative pb-[120px]">
        {/* Top Navigation */}
        <div className="content-stretch flex flex-col items-start w-full">
          
          {/* Top Bar */}
          <div className="bg-white h-[52px] relative shrink-0 w-full">
            <div className="flex flex-col justify-center size-full">
              <div className="fixed top-0 left-0 right-0 z-10 bg-white box-border content-stretch flex flex-col gap-[10px] h-[52px] items-start justify-center px-[12px] py-[4px] w-full max-w-[440px] mx-auto">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <button
                    onClick={onBack}
                    className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] bg-transparent border-none cursor-pointer"
                  >
                    <div className="relative shrink-0 size-[24px]">
                      <div className="absolute contents inset-0">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                          <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  <p className="basis-0 font-semibold grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                    사주 정보 입력
                  </p>
                  <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <motion.div 
          className="px-[20px] pt-[12px] pr-[20px] pb-[0px] pl-[20px]"
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
          {/* 이름 입력 */}
          <motion.div 
            className="flex flex-col gap-[4px] mb-[32px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
              이름
            </label>
            <div className={`h-[56px] relative rounded-[16px] border transition-colors ${
              errors.name 
                ? 'bg-white border-[#FF0000]' 
                : name.length > 0 
                  ? 'bg-white border-[#48b2af]' 
                  : 'bg-white border-[#e7e7e7] focus-within:border-[#48b2af]'
            }`}>
              <div className="flex items-center h-full px-[12px]">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      console.log('🔹 [이름 필드] Enter 키 감지');
                      if (birthDateInputRef.current) {
                        birthDateInputRef.current.focus();
                      }
                    }
                  }}
                  placeholder="예: 홍길동"
                  autoFocus
                  className={`flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent ${
                    errors.name ? 'text-[#151515] placeholder:text-[#b7b7b7]' : 'text-[#151515] placeholder:text-[#b7b7b7]'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="absolute top-full left-0 mt-[4px] text-[12px] text-[#FF0000] px-[4px]">{errors.name}</p>
              )}
            </div>
          </motion.div>

          {/* 성별 선택 */}
          <motion.div 
            className="flex flex-col gap-[4px] mb-[32px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
              성별
            </label>
            <div className="bg-[#f8f8f8] rounded-[16px] p-[8px] overflow-hidden isolate">
              <div className="flex gap-[8px]">
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

          {/* 생년월일 입력 */}
          <motion.div 
            className="flex flex-col gap-[4px] mb-[32px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
              생년월일 (양력 기준으로 입력해 주세요)
            </label>
            <div className={`h-[56px] relative rounded-[16px] border transition-colors ${
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
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      birthTimeInputRef.current?.focus();
                    }
                  }}
                  placeholder="예: 1992-07-15 (양력)"
                  className={`peer flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent text-left placeholder:text-[#b7b7b7] ${
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
                <p className="absolute top-full left-0 mt-[4px] text-[12px] text-[#FF0000] px-[4px]">{errors.birthDate}</p>
              )}
            </div>
          </motion.div>

          {/* 태어난 시간 입력 */}
          <motion.div 
            className="flex gap-[24px] items-start"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="flex-1 flex flex-col gap-[4px] min-w-0">
              <label className="px-[4px] text-[12px] text-[#848484] leading-[16px] tracking-[-0.24px]">
                태어난 시간
              </label>
              <div className={`h-[48px] relative rounded-[12px] border transition-colors ${
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
                    value={birthTime}
                    onChange={(e) => handleBirthTimeChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (isFormValid() && !isSubmitting) {
                          handleSubmit();
                        }
                      }
                    }}
                    placeholder={unknownTime ? "오후 12:00" : "예: 21:00"}
                    disabled={unknownTime}
                    className={`flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent min-w-0 ${
                      unknownTime 
                        ? 'text-[#b7b7b7] placeholder:text-[#b7b7b7]' 
                        : 'text-[#151515] placeholder:text-[#b7b7b7]'
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
                  <div className={`size-[28px] rounded-[8px] border-1 flex items-center justify-center transition-colors ${
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
        </motion.div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] pb-[env(safe-area-inset-bottom)] z-10">
          <div className="px-[20px] pt-[12px] pb-[12px]">
            <motion.button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className={`w-full h-[56px] rounded-[16px] flex items-center justify-center overflow-hidden transition-all ${
                isFormValid() && !isSubmitting
                  ? 'bg-[#48b2af] text-white cursor-pointer'
                  : 'bg-[#f8f8f8] text-[#b7b7b7] cursor-not-allowed'
              }`}
              whileTap={isFormValid() && !isSubmitting ? { scale: 0.96, backgroundColor: "#36908f" } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="text-[16px] font-medium leading-[25px] tracking-[-0.32px]">
                {isSubmitting ? '처리 중...' : '다음'}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}