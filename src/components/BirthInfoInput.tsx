import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import svgPaths from "../imports/svg-b5r0yb3uuf";
import { supabase } from '../lib/supabase';
import MasterContentLoadingPage from './MasterContentLoadingPage';
import { getTarotCardsForQuestions } from '../lib/tarotCards';

interface BirthInfoInputProps {
  productId: string;
  onBack: () => void;
  onComplete: (recordId: string, userName: string) => void;
}

// 에러 상태 타입
interface ValidationErrors {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  phoneNumber?: string;
}

export default function BirthInfoInput({ productId, onBack, onComplete }: BirthInfoInputProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId'); // ⭐ [DEV] URL에서 orderId 가져오기
  const from = searchParams.get('from'); // ⭐ [DEV] from=dev 파라미터
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isBirthDateFocused, setIsBirthDateFocused] = useState(false);
  
  // ⭐ Refs for auto-focus on Enter key
  const nameInputRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);
  const birthTimeInputRef = useRef<HTMLInputElement>(null);
  const phoneNumberInputRef = useRef<HTMLInputElement>(null);

  // 페이지 마운트 시 스크롤 최상단으로 리셋 (iOS Safari 호환)
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // 컴포넌트 마운트 시 이름 필드에 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 사주 정보 저장 함수
  const saveSajuRecord = async (data: {
    name: string;
    gender: 'female' | 'male';
    birthDate: string;
    birthTime: string;
    unknownTime: boolean;
    phoneNumber?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('사용자 정보를 찾을 수 없습니다');
    }

    // ⭐ 기존 사주 개수 확인 (최초 사주면 is_primary: true)
    const { data: existingSaju, error: existingError } = await supabase
      .from('saju_records')
      .select('id')
      .eq('user_id', user.id);

    if (existingError) {
      console.error('기존 사주 조회 실패:', existingError);
    }

    const isFirstSaju = !existingSaju || existingSaju.length === 0;
    console.log(`📌 [BirthInfoInput] 기존 사주 개수: ${existingSaju?.length || 0}, 최초 사주: ${isFirstSaju}`);

    const { data: sajuRecord, error } = await supabase
      .from('saju_records')
      .insert({
        user_id: user.id,
        full_name: data.name,
        gender: data.gender,
        birth_date: new Date(data.birthDate).toISOString(),
        birth_time: data.birthTime,
        phone_number: data.phoneNumber || null,
        notes: '본인',
        is_primary: isFirstSaju // ⭐️ 최초 사주면 대표 사주로 설정
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ [BirthInfoInput] 사주 정보 저장 완료, is_primary: ${isFirstSaju}`);
    return sajuRecord;
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
          // ⭐ 아이폰 숫자 키보드 대응: 4자리 입력 완료 시 자동으로 휴대폰 번호로 포커스 이동
          setTimeout(() => {
            phoneNumberInputRef.current?.focus();
          }, 100);
        } else {
          // 오후 (12:00 ~ 23:59)
          const displayHour = hour === 12 ? 12 : hour - 12;
          const formatted = `오후 ${String(displayHour).padStart(2, '0')}:${minute}`;
          setBirthTime(formatted);
          setErrors(prev => ({ ...prev, birthTime: undefined }));
          // ⭐ 아이폰 숫자 키보드 대응: 4자리 입력 완료 시 자동으로 휴대폰 번호로 포커스 이동
          setTimeout(() => {
            phoneNumberInputRef.current?.focus();
          }, 100);
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
      if (!numbers.startsWith('01')) {
        setErrors(prev => ({ ...prev, phoneNumber: '휴대폰 번호를 다시 확인해 주세요.' }));
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

  // 필수값 검사: 이름, 성별, 생년월일
  const isFormValid = () => {
    const nameValid = name.trim().length >= 1;
    const birthDateValid = birthDate.replace(/[^\d]/g, '').length === 8 && isValidDate(birthDate);
    
    return nameValid && birthDateValid;
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
    // ⭐ 참고: 시간 입력 안했을 경우의 처리는 handleSubmit에서 finalBirthTime으로 처리
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

  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // ⚠️ [개발 모드] from=dev이고 orderId가 있으면 DB 저장 스킵하고 바로 로딩 페이지로
      if (from === 'dev' && orderId) {
        console.log('🔧 [개발 모드] 사주 입력 스킵 → 로딩 페이지로 이동');
        console.log('📌 orderId:', orderId);
        console.log('📌 contentId:', productId);
        
        // 로딩 페이지로 이동 (from=dev 파라미터 전달)
        navigate(`/loading?contentId=${productId}&orderId=${orderId}&from=dev`);
        return;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ 사용자 정보 조회 실패:', userError);
        alert('사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
        setIsSubmitting(false);
        return;
      }

      // ⭐️ 태어난 시간 결정: 입력 안 했거나 '모르겠어요' 체크 시 '12:00'으로 설정
      const finalBirthTime = (!unknownTime && birthTime.trim() === '')
        ? '12:00'
        : (unknownTime ? '12:00' : convertTo24Hour(birthTime));

      console.log('📝 [사주입력] 저장 시작:', { name, gender, birthDate, birthTime: finalBirthTime });
      console.log('📌 [BirthInfoInput] 태어난 시간:', finalBirthTime);

      // 사주 정보 저장
      const sajuData = await saveSajuRecord({
        name: name.trim(),
        gender: gender,
        birthDate: birthDate,
        birthTime: finalBirthTime,
        unknownTime: unknownTime || birthTime.trim() === '',
        phoneNumber: phoneNumber.replace(/[^\\d]/g, '') || undefined
      });

      console.log('✅ [사주입력] 저장 성공:', sajuData);

      // ⭐️ localStorage 대신 DB에서 진행 중인 주문 직접 조회 (GlobalAIMonitor와 동일한 로직)
      console.log('🔍 [사주입력] 진행 중인 주문 조회 시작...');
      
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('ai_generation_completed', false)
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (ordersError) {
        console.error('❌ [사주입력] 주문 조회 실패:', ordersError);
        alert('주문 정보를 불러올 수 없습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      if (!orders || orders.length === 0) {
        console.error('❌ [사주입력] 진행 중인 주문이 없습니다!');
        alert('주문 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      const existingOrder = orders[0];
      const pendingOrderId = existingOrder.id;

      console.log('✅ [사주입력] 진행 중인 주문 발견:', pendingOrderId);
      console.log('📦 [사주입력] 주문 데이터:', existingOrder);
      
      // 주문에 사주 정보 연결
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          saju_record_id: sajuData.id,
          full_name: name,
          gender: gender,
          birth_date: new Date(birthDate).toISOString(),
          birth_time: finalBirthTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingOrderId);

      if (updateError) {
        console.error('❌ [사주입력] 주문 업데이트 실패:', updateError);
        // 업데이트 실패해도 계속 진행 (사주 정보는 이미 저장됨)
      } else {
        console.log('✅ [사주입력] 주문 업데이트 완료');
      }

      // ⭐️ 즉시 로딩 페이지로 이동 (SajuSelectPage와 동일한 UX)
      console.log('🚀 [사주입력] 로딩 페이지로 즉시 이동');
      console.log('📌 contentId:', existingOrder.content_id);
      console.log('📌 orderId:', pendingOrderId);
      
      // ⭐ navigate 호출 직전 로그
      console.log('⏰ [사주입력] navigate 호출 직전!');
      navigate(`/loading?contentId=${existingOrder.content_id}&orderId=${pendingOrderId}`);
      console.log('⏰ [사주입력] navigate 호출 완료!');

      // ⭐️ 백그라운드에서 AI 답변 생성 시작 (비동기, 결과 대기 안 )
      console.log('🚀 AI 답변 생성 시작 (백그라운드)');
      console.log('📌 sajuRecordId:', sajuData.id);
      
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
        orderId: pendingOrderId,
        sajuRecordId: sajuData.id
      };
      
      // 타로 콘텐츠이고 타로 질문이 있으면 랜덤 카드 선택
      if (isTarotContent && tarotQuestionCount > 0) {
        const tarotCards = getTarotCardsForQuestions(tarotQuestionCount);
        requestBody.tarotCards = tarotCards;
        console.log('🎴 [타로] 랜덤 카드 선택:', tarotCards);
      }
      
      console.log('📤 Edge Function 호출 파라미터:', requestBody);

      supabase.functions
        .invoke('generate-content-answers', {
          body: requestBody
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ AI 생성 실패:', error);
            console.error('❌ 에러 상세:', JSON.stringify(error));
          } else {
            console.log('✅ AI 생성 완료:', data);
          }
        })
        .catch((err) => {
          console.error('❌ AI 생성 오류:', err);
          console.error('❌ 오류 상세:', JSON.stringify(err));
        });
      
    } catch (error) {
      console.error('❌ [사주입력] 처리 중 오류:', error);
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
              <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white box-border content-stretch flex flex-col gap-[10px] h-[52px] items-start justify-center px-[12px] py-[4px] w-full max-w-[440px]">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <motion.button
                    onClick={onBack}
                    className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] bg-transparent border-none cursor-pointer"
                    initial="rest"
                    whileTap="pressed"
                    variants={{
                      rest: { backgroundColor: "transparent" },
                      pressed: { backgroundColor: "#f3f4f6" }
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className="relative shrink-0 size-[24px]"
                      variants={{
                        rest: { scale: 1 },
                        pressed: { scale: 0.9 }
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="absolute contents inset-0">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                          <g id="arrow-left">
                            <path d={svgPaths.p2a5cd480} stroke="var(--stroke-0, #848484)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                          </g>
                        </svg>
                      </div>
                    </motion.div>
                  </motion.button>
                  <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">사주 정보 입력</p>
                  <div className="box-border content-stretch flex gap-[10px] items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
                </div>
              </div>
            </div>
          </div>
          <div className="h-[16px] shrink-0 w-full" />
        </div>

        {/* Form Content */}
        <motion.div 
          className="px-[20px]"
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
          {/* Name Input */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mb-[28px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                  <p className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">이름</p>
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
                    className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[16px] tracking-[-0.45px] bg-transparent outline-none placeholder:text-[#b7b7b7] text-black"
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

          {/* Gender Selection */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mb-[28px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                  <p className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">성별</p>
                </div>
              </div>
            </div>
            <div className="bg-[#f8f8f8] relative rounded-[16px] shrink-0 w-full">
              <div className="size-full">
                <div className="content-stretch flex flex-col items-start p-[8px] relative w-full">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                    {/* Female Option */}
                    <button
                      onClick={() => setGender('female')}
                      className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 bg-transparent"
                    >
                      {gender === 'female' && (
                        <motion.div
                          layoutId="gender-indicator"
                          className="absolute inset-0 bg-[#48b2af] rounded-[12px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className="flex flex-row items-center justify-center size-full relative z-10">
                        <div className="content-stretch flex items-center justify-center px-[20px] py-[12px] relative w-full">
                          <div className="basis-0 content-stretch flex grow items-center justify-between min-h-px min-w-px relative shrink-0">
                            <p className={`font-['Pretendard_Variable:${gender === 'female' ? 'Medium' : 'Regular'}',sans-serif] ${gender === 'female' ? 'font-medium' : 'font-normal'} leading-[20px] relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px] transition-colors duration-200 ${
                              gender === 'female' ? 'text-white' : 'text-[#b7b7b7]'
                            }`}>여성</p>
                            <div className="relative shrink-0 size-[24px]">
                              <div className="absolute contents inset-0">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                  <g id="tick-circle">
                                    <path d="M7 11.625L10.3294 16L17 9" id="Vector" stroke={gender === 'female' ? 'white' : '#E7E7E7'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="transition-colors duration-200" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Male Option */}
                    <button
                      onClick={() => setGender('male')}
                      className="basis-0 grow min-h-px min-w-px relative rounded-[12px] shrink-0 bg-transparent"
                    >
                      {gender === 'male' && (
                        <motion.div
                          layoutId="gender-indicator"
                          className="absolute inset-0 bg-[#48b2af] rounded-[12px] shadow-[0px_2px_7px_0px_rgba(0,0,0,0.12)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className="flex flex-row items-center justify-center size-full relative z-10">
                        <div className="content-stretch flex items-center justify-center px-[20px] py-[12px] relative w-full">
                          <div className="basis-0 content-stretch flex grow items-center justify-between min-h-px min-w-px relative shrink-0">
                            <p className={`font-['Pretendard_Variable:${gender === 'male' ? 'Medium' : 'Regular'}',sans-serif] ${gender === 'male' ? 'font-medium' : 'font-normal'} leading-[20px] relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px] transition-colors duration-200 ${
                              gender === 'male' ? 'text-white' : 'text-[#b7b7b7]'
                            }`}>남성</p>
                            <div className="relative shrink-0 size-[24px]">
                              <div className="absolute contents inset-0">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                  <g id="tick-circle">
                                    <path d="M7 11.625L10.3294 16L17 9" id="Vector" stroke={gender === 'male' ? 'white' : '#E7E7E7'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" className="transition-colors duration-200" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Birth Date Input */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mb-[28px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="flex items-center px-[4px] py-0 relative w-full">
                  <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[16px] text-[#848484] text-[12px] tracking-[-0.24px] text-left w-full">생년월일 (양력 기준으로 입력해 주세요)</p>
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
                  type="text"
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  onFocus={() => setIsBirthDateFocused(true)}
                  onBlur={() => setIsBirthDateFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      birthTimeInputRef.current?.focus();
                    }
                  }}
                  placeholder="예: 1992-07-15 (양력)"
                  inputMode="numeric"
                  autoComplete="off"
                  className={`peer flex-1 text-[16px] leading-[20px] tracking-[-0.45px] outline-none bg-transparent text-left placeholder:text-[#b7b7b7] w-full ${
                    isValidDate(birthDate) && !isBirthDateFocused ? 'text-transparent' : 'text-black'
                  }`}
                  ref={birthDateInputRef}
                />
                {isValidDate(birthDate) && !isBirthDateFocused && (
                  <div className="absolute left-[12px] h-full flex items-center pointer-events-none peer-focus:hidden">
                    <span className="text-[16px] leading-[20px] tracking-[-0.45px] text-black">
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

          {/* Birth Time Input (Optional) */}
          <motion.div 
            className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full mb-[28px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0">
              <div className="relative shrink-0 w-full">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                    <p className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">태어난 시간</p>
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
                          if (isFormValid() && !isSubmitting) {
                            handleSubmit();
                          }
                        }
                      }}
                      placeholder="예: 21:00"
                      disabled={unknownTime}
                      inputMode="numeric"
                      autoComplete="off"
                      className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[16px] tracking-[-0.45px] bg-transparent outline-none placeholder:text-[#b7b7b7] disabled:text-[#b7b7b7]"
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
              <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[#525252] text-[15px] text-nowrap tracking-[-0.45px]">모르겠어요</p>
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

          {/* Phone Number Input (Optional) */}
          <motion.div 
            className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full mb-[28px]"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[4px] py-0 relative w-full">
                  <p className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] font-normal grow leading-[16px] min-h-px min-w-px relative shrink-0 text-[#848484] text-[12px] tracking-[-0.24px]">휴대폰 번호 (선택)</p>
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
                    className="basis-0 font-['Pretendard_Variable:Regular',sans-serif] font-normal grow leading-[20px] min-h-px min-w-px relative shrink-0 text-[16px] tracking-[-0.45px] bg-transparent outline-none placeholder:text-[#b7b7b7] text-black"
                    ref={phoneNumberInputRef}
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
        </motion.div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] z-10">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {/* ⭐ [개발 모드] DEV 버튼 */}
            {from === 'dev' && orderId && (
              <div className="bg-red-50 border-t-2 border-red-300 relative shrink-0 w-full">
                <div className="flex flex-col items-center justify-center size-full">
                  <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                    <button
                      onClick={handleSubmit}
                      className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold h-[52px] rounded-[12px] w-full cursor-pointer border-none transition-colors"
                    >
                      <span className="select-none" style={{ WebkitTouchCallout: 'none' }}>
                        [DEV] 입력 스킵하고 로딩 화면으로
                      </span>
                    </button>
                    <p className="font-normal text-[12px] text-red-500 mt-[8px] text-center leading-[18px]">
                      사주 정보 입력을 건너뛰고<br />
                      로딩 화면부터 확인합니다
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!isFormValid() || isSubmitting}
                    whileTap={isFormValid() && !isSubmitting ? { scale: 0.96 } : {}}
                    transition={{ duration: 0.1 }}
                    className={`${
                      isFormValid() && !isSubmitting
                        ? 'bg-[#48b2af] active:bg-[#3a9693]'
                        : 'bg-[#f8f8f8]'
                    } content-stretch flex h-[56px] items-center justify-center px-[12px] py-0 relative rounded-[16px] shrink-0 w-full cursor-pointer border-none transition-colors`}
                  >
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                      <p className={`font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap tracking-[-0.32px] ${
                        isFormValid() && !isSubmitting ? 'text-white' : 'text-[#b7b7b7]'
                      }`}>
                        {isSubmitting ? '처리 중...' : '다음'}
                      </p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}