/**
 * 알림톡 정보 입력 페이지
 * - 결제 완료 후 알림톡 수신을 위한 휴대폰 번호 입력
 * - 무료 콘텐츠에서 사주 정보를 입력한 경우 phone_number가 null일 수 있어, 유료 결제 후 최초 1회 입력받음
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeft from './ArrowLeft';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { getTarotCardsForQuestions } from '../lib/tarotCards';

// 카카오 말풍선 아이콘 SVG
const KakaoIcon = () => (
  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.0001 0C4.47725 0 0 3.57389 0 7.98391C0 10.7889 1.84347 13.2519 4.62064 14.6584L3.44767 18.5044C3.33439 18.8636 3.74936 19.1502 4.06262 18.9365L8.65766 15.8453C9.09736 15.9151 9.54539 15.9531 10.0001 15.9531C15.5226 15.9531 20 12.3939 20 7.98391C20 3.57389 15.5226 0 10.0001 0Z"
      fill="#191919"
    />
  </svg>
);

interface AlimtalkInfoInputPageProps {
  onBack: () => void;
  orderId: string;
  contentId: string;
  selectedSajuId: string;
}

export default function AlimtalkInfoInputPage({
  onBack,
  orderId,
  contentId,
  selectedSajuId
}: AlimtalkInfoInputPageProps) {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 휴대폰 번호 입력 핸들러 (자동 포매팅 - BirthInfoInput.tsx와 동일)
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
        setError('휴대폰 번호를 다시 확인해 주세요.');
      } else {
        setError(undefined);
      }
    } else if (numbers.length > 0 && numbers.length < 11) {
      // 입력 중일 때는 에러 표시 안함
      setError(undefined);
    } else {
      setError(undefined);
    }
  };

  // 휴대폰 번호 유효성 검사 (11자리, 01로 시작)
  const isValidPhoneNumber = () => {
    const phoneNumbers = phoneNumber.replace(/[^\d]/g, '');
    return phoneNumbers.length === 11 && phoneNumbers.startsWith('01');
  };

  // ⭐ "다음에 할래요" - 핸드폰 번호 저장 없이 바로 로딩 페이지로 이동
  const handleSkip = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        setIsSubmitting(false);
        return;
      }

      // 주문 소유자 확인
      const { data: orderData, error: orderCheckError } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (orderCheckError || !orderData || orderData.user_id !== user.id) {
        toast.error('주문 정보를 찾을 수 없습니다.');
        setIsSubmitting(false);
        return;
      }

      // 선택된 사주 정보 조회 및 orders 업데이트
      const { data: selectedSaju, error: sajuFetchError } = await supabase
        .from('saju_records')
        .select('full_name, gender, birth_date, birth_time')
        .eq('id', selectedSajuId)
        .eq('user_id', user.id)
        .single();

      if (sajuFetchError || !selectedSaju) {
        toast.error('사주 정보를 찾을 수 없습니다.');
        setIsSubmitting(false);
        return;
      }

      await supabase
        .from('orders')
        .update({
          saju_record_id: selectedSajuId,
          full_name: selectedSaju.full_name,
          gender: selectedSaju.gender,
          birth_date: selectedSaju.birth_date,
          birth_time: selectedSaju.birth_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', user.id);

      // 로딩 페이지로 이동
      navigate(`/loading?contentId=${contentId}&orderId=${orderId}`);

      // 백그라운드 AI 생성
      const [contentResult, questionsResult] = await Promise.all([
        supabase.from('master_contents').select('category_main').eq('id', contentId).single(),
        supabase.from('master_content_questions').select('question_type').eq('content_id', contentId).eq('question_type', 'tarot')
      ]);

      const contentData = contentResult.data;
      const questionsData = questionsResult.data;
      const isTarotContent = contentData?.category_main?.includes('타로') || contentData?.category_main?.toLowerCase() === 'tarot';
      const tarotQuestionCount = questionsData?.length || 0;

      const requestBody: Record<string, unknown> = { contentId, orderId, sajuRecordId: selectedSajuId };
      if (isTarotContent && tarotQuestionCount > 0) {
        requestBody.tarotCards = getTarotCardsForQuestions(tarotQuestionCount);
      }

      supabase.functions.invoke('generate-content-answers', { body: requestBody }).catch(console.error);
    } catch (error) {
      console.error('❌ [AlimtalkInfoInput] 스킵 처리 오류:', error);
      toast.error('처리 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  // 다음 버튼 클릭 핸들러
  const handleNext = async () => {
    if (!isValidPhoneNumber()) {
      setError('휴대폰 번호를 정확하게 입력해 주세요.');
      return;
    }

    if (isSubmitting) {
      console.warn('⚠️ [AlimtalkInfoInput] 이미 처리 중입니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚀 [AlimtalkInfoInput] 휴대폰 번호 저장 시작');

      // ⭐ 1단계: 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다.');
        setIsSubmitting(false);
        return;
      }

      // ⭐ 2단계: 주문 소유자 확인 (보안 검증)
      console.log('🔍 [AlimtalkInfoInput] 주문 소유자 확인:', orderId);
      const { data: orderData, error: orderCheckError } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (orderCheckError || !orderData) {
        console.error('❌ [AlimtalkInfoInput] 주문 조회 실패:', orderCheckError);
        toast.error('주문 정보를 찾을 수 없습니다.');
        setIsSubmitting(false);
        return;
      }

      if (orderData.user_id !== user.id) {
        console.error('❌ [AlimtalkInfoInput] 다른 사용자의 주문:', {
          orderUserId: orderData.user_id,
          currentUserId: user.id
        });
        toast.error('잘못된 접근입니다. 본인의 주문만 접근할 수 있습니다.');
        setIsSubmitting(false);
        navigate('/', { replace: true });
        return;
      }

      console.log('✅ [AlimtalkInfoInput] 주문 소유자 확인 완료');

      // ⭐ 3단계: notes='본인' 사주 찾기
      const { data: mySajuList, error: sajuError } = await supabase
        .from('saju_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('notes', '본인')
        .limit(1);

      if (sajuError) {
        console.error('❌ [AlimtalkInfoInput] 본인 사주 조회 실패:', sajuError);
        toast.error('사주 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      if (!mySajuList || mySajuList.length === 0) {
        console.error('❌ [AlimtalkInfoInput] 본인 사주가 없습니다.');
        toast.error('본인 사주 정보가 없습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      const mySajuId = mySajuList[0].id;

      // ⭐ 4단계: notes='본인' 사주의 phone_number 업데이트 (하이픈 제거하여 숫자만 저장)
      const normalizedPhoneNumber = phoneNumber.replace(/[^\d]/g, '');

      const { error: updateError } = await supabase
        .from('saju_records')
        .update({ phone_number: normalizedPhoneNumber })
        .eq('id', mySajuId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ [AlimtalkInfoInput] 휴대폰 번호 업데이트 실패:', updateError);
        toast.error('휴대폰 번호 저장에 실패했습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ [AlimtalkInfoInput] 휴대폰 번호 업데이트 완료:', normalizedPhoneNumber);

      // ⭐ 캐시 무효화 (saju_cache_checked도 함께 삭제 → ProfilePage에서 API 재호출 보장)
      localStorage.removeItem('primary_saju');
      localStorage.removeItem('saju_records_cache');
      localStorage.removeItem('saju_cache_checked');

      // ⭐ 5단계: 선택된 사주 정보 조회 및 orders 테이블 업데이트
      console.log('🔍 [AlimtalkInfoInput] 선택된 사주 정보 조회:', selectedSajuId);
      const { data: selectedSaju, error: sajuFetchError } = await supabase
        .from('saju_records')
        .select('full_name, gender, birth_date, birth_time')
        .eq('id', selectedSajuId)
        .eq('user_id', user.id)
        .single();

      if (sajuFetchError || !selectedSaju) {
        console.error('❌ [AlimtalkInfoInput] 선택된 사주 조회 실패:', sajuFetchError);
        toast.error('사주 정보를 찾을 수 없습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      console.log('🔄 [AlimtalkInfoInput] orders 테이블 업데이트...');
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          saju_record_id: selectedSajuId,
          full_name: selectedSaju.full_name,
          gender: selectedSaju.gender,
          birth_date: selectedSaju.birth_date,
          birth_time: selectedSaju.birth_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (orderUpdateError) {
        console.error('❌ [AlimtalkInfoInput] orders 업데이트 실패:', orderUpdateError);
        toast.error('주문 정보 업데이트에 실패했습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ [AlimtalkInfoInput] orders 테이블 업데이트 완료');

      // ⭐ 6단계: 즉시 로딩 페이지로 이동
      console.log('🚀 [AlimtalkInfoInput] 로딩 페이지로 이동');
      navigate(`/loading?contentId=${contentId}&orderId=${orderId}`);

      // ⭐ 7단계: 백그라운드에서 AI 응답 생성 시작
      console.log('🔄 [AlimtalkInfoInput] 백그라운드 AI 생성 시작...');

      // 타로 콘텐츠인지 확인하고 타로 카드 선택 (병렬 실행)
      const [contentResult, questionsResult] = await Promise.all([
        supabase
          .from('master_contents')
          .select('category_main')
          .eq('id', contentId)
          .single(),
        supabase
          .from('master_content_questions')
          .select('question_type')
          .eq('content_id', contentId)
          .eq('question_type', 'tarot')
      ]);

      const contentData = contentResult.data;
      const questionsData = questionsResult.data;

      const isTarotContent = contentData?.category_main?.includes('타로') || contentData?.category_main?.toLowerCase() === 'tarot';
      const tarotQuestionCount = questionsData?.length || 0;

      const requestBody: Record<string, unknown> = {
        contentId: contentId,
        orderId: orderId,
        sajuRecordId: selectedSajuId,
      };

      // 타로 콘텐츠이고 타로 질문이 있으면 랜덤 카드 선택
      if (isTarotContent && tarotQuestionCount > 0) {
        const tarotCards = getTarotCardsForQuestions(tarotQuestionCount);
        requestBody.tarotCards = tarotCards;
        console.log('🎴 [타로] 랜덤 카드 선택:', tarotCards);
      }

      console.log('📤 [AlimtalkInfoInput] 백그라운드 Edge Function 호출:', requestBody);

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
      console.error('❌ [AlimtalkInfoInput] 오류:', error);
      toast.error('처리 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative pb-[120px]">
        {/* 상단 네비게이션 */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={onBack} />
              <p
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  lineHeight: '25.5px',
                  letterSpacing: '-0.36px',
                  color: '#000000',
                  textAlign: 'center',
                }}
              >
                알림톡 정보 입력
              </p>
              <div className="w-[44px]" /> {/* 우측 공간 확보 */}
            </div>
          </div>
        </div>

        {/* 네비게이션 높이만큼 여백 (52px + 8px) */}
        <div style={{ height: '60px' }} />

        {/* 메인 콘텐츠 */}
        <div
          className="flex flex-col w-full"
          style={{ padding: '12px 20px 40px 20px' }}
        >
          <div className="flex flex-col w-full" style={{ gap: '36px' }}>
            {/* 상단 안내 섹션 */}
            <div className="flex flex-col w-full" style={{ gap: '20px' }}>
              {/* 카카오 아이콘 */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: '#fee500',
                  borderRadius: '16px',
                  border: '1px solid #fee500',
                }}
              >
                <KakaoIcon />
              </div>

              {/* 타이틀 & 서브타이틀 */}
              <div className="flex flex-col w-full" style={{ gap: '6px', padding: '0 2px' }}>
                <p
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '22px',
                    fontWeight: 600,
                    lineHeight: '32.5px',
                    letterSpacing: '-0.22px',
                    color: '#151515',
                  }}
                >
                  결과가 나오면{' '}
                  <span style={{ fontWeight: 700, color: '#41a09e' }}>알림톡</span>{' '}
                  보내드릴게요
                </p>
                <p
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '15px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: '#6d6d6d',
                    padding: '0 2px',
                  }}
                >
                  고객 정보는 알림톡 발송에만 사용돼요
                </p>
              </div>
            </div>

            {/* 휴대폰 번호 입력 필드 */}
            <div className="flex flex-col w-full" style={{ gap: '4px' }}>
              {/* 라벨 */}
              <div style={{ padding: '0 4px' }}>
                <label
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '16px',
                    letterSpacing: '-0.24px',
                    color: '#848484',
                  }}
                >
                  휴대폰 번호
                </label>
              </div>

              {/* 입력 필드 */}
              <div
                className="flex items-center w-full"
                style={{
                  height: '56px',
                  backgroundColor: '#ffffff',
                  border: `1px solid ${error ? '#e87878' : '#e7e7e7'}`,
                  borderRadius: '20px',
                  padding: '0 12px',
                }}
              >
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9-]*"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  placeholder="'-'하이픈 없이 숫자만 입력해 주세요"
                  className="w-full outline-none bg-transparent"
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '15px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: phoneNumber ? '#151515' : '#b7b7b7',
                  }}
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div style={{ padding: '0 4px' }}>
                  <p
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '12px',
                      fontWeight: 400,
                      lineHeight: '16px',
                      letterSpacing: '-0.24px',
                      color: '#e87878',
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 - fixed 위치, 중앙 정렬 */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white"
          style={{
            boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
          }}
        >
          <div style={{ padding: '12px 20px' }}>
            <button
              onClick={handleNext}
              disabled={!isValidPhoneNumber() || isSubmitting}
              className="w-full flex items-center justify-center transition-colors"
              style={{
                height: '56px',
                backgroundColor: (isValidPhoneNumber() && !isSubmitting) ? '#41a09e' : '#f8f8f8',
                cursor: (isValidPhoneNumber() && !isSubmitting) ? 'pointer' : 'not-allowed',
                border: 'none',
                borderRadius: '20px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '25px',
                  letterSpacing: '-0.32px',
                  color: (isValidPhoneNumber() && !isSubmitting) ? '#ffffff' : '#b7b7b7',
                }}
              >
                {isSubmitting ? '처리 중...' : '다음'}
              </span>
            </button>

            {/* 다음에 할래요 버튼 */}
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center"
              style={{
                marginTop: '8px',
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              <p style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '22px',
                color: '#848484',
                letterSpacing: '-0.42px'
              }}>
                다음에 할래요
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
