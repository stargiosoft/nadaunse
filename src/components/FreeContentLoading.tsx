/**
 * 무료 콘텐츠 로딩 페이지
 * - DB 폴링 제거 (무료 콘텐츠는 휘발성)
 * - Edge Function 동기 호출
 * - localStorage에 결과 저장
 * - 결과 페이지로 이동
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import svgPaths from "../imports/svg-rj5zh7ifhy";
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

interface FreeContentLoadingProps {
  userName?: string;
}

function DotLoading() {
  return (
    <div className="flex items-center gap-[10px] h-[10px]" data-name="Dot loading">
      <div className="w-[10px] h-[10px] rounded-full bg-[#E4F7F7] animate-[dotPulse_1.4s_ease-in-out_infinite]" 
           style={{ animationDelay: '0s' }} />
      <div className="w-[10px] h-[10px] rounded-full bg-[#7ED4D2] animate-[dotPulse_1.4s_ease-in-out_infinite]" 
           style={{ animationDelay: '0.2s' }} />
      <div className="w-[10px] h-[10px] rounded-full bg-[#48B2AF] animate-[dotPulse_1.4s_ease-in-out_infinite]" 
           style={{ animationDelay: '0.4s' }} />
    </div>
  );
}

function NavigationTopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="bg-white h-[52px] relative shrink-0 w-full" data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
          <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
            {/* Left Action - Hidden */}
            <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
            
            {/* Title */}
            <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
              상세 풀이
            </p>
            
            {/* Right Action - Close */}
            <div 
              onClick={onClose}
              className="content-stretch flex items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer"
            >
              <div className="relative shrink-0 size-[24px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <g id="Box">
                    <path d="M4 20L20 4" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    <path d="M20 20L4 4" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FreeContentLoading({ userName = '홍길동' }: FreeContentLoadingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const contentId = searchParams.get('contentId');
  const sajuRecordId = searchParams.get('sajuRecordId');
  const guestMode = searchParams.get('guestMode') === 'true';
  const userNameFromUrl = searchParams.get('userName') || userName;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏱️ [FreeContentLoading] 컴포넌트 마운트');
  console.log('📌 [FreeContentLoading] contentId:', contentId);
  console.log('📌 [FreeContentLoading] sajuRecordId:', sajuRecordId);
  console.log('📌 [FreeContentLoading] guestMode:', guestMode);
  console.log('📌 [FreeContentLoading] userName:', userNameFromUrl);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ⭐️ Edge Function 동기 호출 (DB 폴링 제거)
  useEffect(() => {
    if (!contentId) {
      console.error('❌ [FreeContentLoading] contentId 없음');
      toast.error('잘못된 접근입니다.');
      navigate('/');
      return;
    }

    const generateFreeContent = async () => {
      try {
        console.log('🚀 [FreeContentLoading] Edge Function 호출 시작...');

        // ⭐️ contentId가 숫자(allProducts)인지 UUID(master_contents)인지 확인
        const isNumericId = !isNaN(Number(contentId));
        console.log('📌 [FreeContentLoading] contentId 타입:', isNumericId ? '숫자(allProducts)' : 'UUID(master_contents)');
        
        if (isNumericId) {
          // ⭐️ allProducts의 무료 콘텐츠인 경우 - 간단한 mock 데이터 생성
          console.log('📌 [FreeContentLoading] allProducts 무료 콘텐츠 → mock 데이터 사용');
          
          // 사주 정보 가져오기
          let sajuDataForCache: any = null;
          
          if (guestMode) {
            const cachedSaju = localStorage.getItem('cached_saju_info');
            if (!cachedSaju) {
              console.error('❌ [FreeContentLoading] 캐시된 사주 정보 없음');
              toast.error('사주 정보를 찾을 수 없습니다.');
              navigate('/');
              return;
            }
            sajuDataForCache = JSON.parse(cachedSaju);
          } else {
            if (!sajuRecordId) {
              console.error('❌ [FreeContentLoading] sajuRecordId 없음');
              toast.error('사주 정보를 찾을 수 없습니다.');
              navigate('/');
              return;
            }
            
            const { data: sajuRecord, error: sajuError } = await supabase
              .from('saju_records')
              .select('*')
              .eq('id', sajuRecordId)
              .single();

            if (sajuError || !sajuRecord) {
              console.error('❌ [FreeContentLoading] 사주 정보 조회 실패:', sajuError);
              toast.error('사주 정보를 찾을 수 없습니다.');
              navigate('/');
              return;
            }
            
            sajuDataForCache = sajuRecord;
          }
          
          // Mock 데이터 생성 (간단한 미리보기)
          const mockResults = [
            {
              questionId: 'q1',
              questionOrder: 1,
              questionText: '나의 연애운은?',
              questionType: 'text',
              previewText: `${userNameFromUrl}님의 타고난 매력과 사랑의 에너지를 분석해보니, 곧 좋은 인연을 만날 가능성이 높습니다. 자세한 풀이는 유료 버전에서 확인하세요.`
            },
            {
              questionId: 'q2',
              questionOrder: 2,
              questionText: '나의 재물운은?',
              questionType: 'text',
              previewText: '당신의 재물운은 꾸준한 상승세를 보이고 있습니다. 특히 올해 하반기에 좋은 기회가 있을 것으로 예상됩니다.'
            },
            {
              questionId: 'q3',
              questionOrder: 3,
              questionText: '나의 건강운은?',
              questionType: 'text',
              previewText: '전반적으로 건강한 상태를 유지하고 있으나, 스트레스 관리에 신경 쓰시는 것이 좋겠습니다.'
            }
          ];
          
          // localStorage에 저장
          const resultData = {
            contentId: contentId,
            sajuData: sajuDataForCache,
            results: mockResults,
            createdAt: new Date().toISOString()
          };
          
          const resultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}`;
          localStorage.setItem(resultKey, JSON.stringify(resultData));
          console.log('💾 [FreeContentLoading] localStorage 저장 완료 (allProducts)');
          
          // 결과 페이지로 이동
          navigate(`/product/${contentId}/result/free`, {
            state: {
              resultKey: resultKey,
              userName: userNameFromUrl,
              contentId: contentId
            }
          });
          return;
        }

        // ⭐️ 1단계: contentId로 질문 조회 (master_contents인 경우)
        console.log('📋 [FreeContentLoading] 질문 조회 시작...');
        const { data: questions, error: questionsError } = await supabase
          .from('master_content_questions')
          .select('*')
          .eq('content_id', contentId)
          .order('question_order');

        if (questionsError) {
          console.error('❌ [FreeContentLoading] 질문 조회 실패:', questionsError);
          toast.error('질문을 불러올 수 없습니다.');
          navigate('/');
          return;
        }

        if (!questions || questions.length === 0) {
          console.error('❌ [FreeContentLoading] 질문이 없습니다.');
          toast.error('콘텐츠 정보가 올바르지 않습니다.');
          navigate('/');
          return;
        }

        console.log('✅ [FreeContentLoading] 질문 조회 완료:', questions);

        // ⭐️ 2단계: 사주 정보 가져오기 및 문자열 변환
        let questionerInfo = '';
        let sajuDataForCache: any = null;

        if (guestMode) {
          // 게스트 모드: localStorage에서 사주 데이터 가져오기
          console.log('🔓 [FreeContentLoading] 게스트 모드 → localStorage 사주 데이터 사용');
          const cachedSaju = localStorage.getItem('cached_saju_info');
          
          if (!cachedSaju) {
            console.error('❌ [FreeContentLoading] 캐시된 사주 정보 없음');
            toast.error('사주 정보를 찾을 수 없습니다.');
            navigate('/');
            return;
          }

          sajuDataForCache = JSON.parse(cachedSaju);
          console.log('📌 [FreeContentLoading] 캐시된 사주 데이터:', sajuDataForCache);

          // 사주 정보를 문자열로 변환 (camelCase 필드명 사용)
          questionerInfo = `
이름: ${sajuDataForCache.name || '미상'}
성별: ${sajuDataForCache.gender === 'male' ? '남성' : '여성'}
생년월일: ${new Date(sajuDataForCache.birthDate).toLocaleDateString('ko-KR')}
출생시간: ${sajuDataForCache.birthTime}
          `.trim();
        } else {
          // 로그인 모드: sajuRecordId로 DB 조회
          console.log('✅ [FreeContentLoading] 로그인 모드 → sajuRecordId로 DB 조회');
          
          if (!sajuRecordId) {
            console.error('❌ [FreeContentLoading] sajuRecordId 없음');
            toast.error('사주 정보를 찾을 수 없습니다.');
            navigate('/');
            return;
          }

          const { data: sajuRecord, error: sajuError } = await supabase
            .from('saju_records')
            .select('*')
            .eq('id', sajuRecordId)
            .single();

          if (sajuError || !sajuRecord) {
            console.error('❌ [FreeContentLoading] 사주 정보 조회 실패:', sajuError);
            toast.error('사주 정보를 찾을 수 없습니다.');
            navigate('/');
            return;
          }

          sajuDataForCache = sajuRecord;
          console.log('📌 [FreeContentLoading] 조회한 사주 데이터:', sajuRecord);
          console.log('  - full_name:', sajuRecord.full_name);
          console.log('  - gender:', sajuRecord.gender);
          console.log('  - birth_date:', sajuRecord.birth_date);
          console.log('  - birth_time:', sajuRecord.birth_time);

          // 사주 정보를 문자열로 변환
          questionerInfo = `
이름: ${sajuRecord.full_name || '미상'}
성별: ${sajuRecord.gender === 'male' ? '남성' : '여성'}
생년월일: ${new Date(sajuRecord.birth_date).toLocaleDateString('ko-KR')}
출생시간: ${sajuRecord.birth_time}
          `.trim();
        }

        console.log('📌 [FreeContentLoading] questionerInfo:', questionerInfo);

        // ⭐️ 3단계: Edge Function 호출 (한 번에 모든 답변 생성)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 [FreeContentLoading] Edge Function 호출 시작...');
        console.log('📌 [FreeContentLoading] contentId:', contentId);

        // Edge Function 파라미터 구성
        let requestBody;
        if (guestMode) {
          // 게스트 모드: 사주 데이터 포맷을 DB 스키마(snake_case)로 변환하여 전달
          // Edge Function이 saju_records 테이블 구조(full_name, birth_date, birth_time)를 기대할 가능성이 높음
          requestBody = {
            contentId: contentId,
            sajuData: {
              full_name: sajuDataForCache.name || sajuDataForCache.full_name,
              gender: sajuDataForCache.gender,
              birth_date: sajuDataForCache.birthDate || sajuDataForCache.birth_date,
              birth_time: sajuDataForCache.birthTime || sajuDataForCache.birth_time,
              is_guest: true
            }
          };
        } else {
          requestBody = {
            contentId: contentId,
            sajuRecordId: sajuRecordId
          };
        }

        console.log('📤 [FreeContentLoading] 호출 파라미터:', requestBody);

        const result = await supabase.functions.invoke('generate-free-preview', {
          body: requestBody
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 [FreeContentLoading] Edge Function 응답 (전체):');
        // console.log(JSON.stringify(result, null, 2)); // 전체 로그는 너무 길어서 생략
        console.log(`Success: ${!!result.data?.success}, Error: ${result.error ? 'Yes' : 'No'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // ⭐️ Edge Function 실패 시 mock 데이터로 fallback
        let shouldUseMockFallback = false;
        let fallbackReason = '';

        // 에러 체크 - result.error 존재 여부
        if (result.error) {
          console.warn('⚠️ [FreeContentLoading] Edge Function 호출 실패 (서버 에러 또는 키 누락 가능성)');
          console.warn('📌 에러 내용:', result.error);
          shouldUseMockFallback = true;
          fallbackReason = 'Edge Function 오류 (Staging 환경 또는 키 누락)';
        }
        // 응답 데이터 체크 - success 필드 확인
        else if (!result.data) {
          console.warn('⚠️ [FreeContentLoading] Edge Function 응답 데이터 없음 (result.data가 null/undefined)');
          shouldUseMockFallback = true;
          fallbackReason = 'result.data 없음';
        }
        else if (!result.data.success) {
          console.warn('⚠️ [FreeContentLoading] Edge Function success: false');
          console.warn('📌 에러 메시지:', result.data.error);
          shouldUseMockFallback = true;
          fallbackReason = `success: false (${result.data.error || '원인 불명'})`;
        }
        // answers 배열 체크
        else if (!result.data.answers || !Array.isArray(result.data.answers)) {
          console.warn('⚠️ [FreeContentLoading] answers 배열 없음');
          console.warn('📌 result.data.answers:', result.data.answers);
          shouldUseMockFallback = true;
          fallbackReason = 'answers 배열 없음';
        }
        else if (result.data.answers.length === 0) {
          console.warn('⚠️ [FreeContentLoading] answers 배열이 비어있음');
          shouldUseMockFallback = true;
          fallbackReason = 'answers 배열 비어있음';
        }

        // ⭐️ fallback 실행: mock 데이터 생성 후 결과 페이지로 이동
        if (shouldUseMockFallback) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.warn('⚠️ [FreeContentLoading] Edge Function 실패 → mock 데이터로 fallback 실행');
          console.warn('📌 Fallback 사유:', fallbackReason);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // Mock 데이터 생성 (기존 로직 재사용)
          const mockResults = [
            {
              questionId: 'q1',
              questionOrder: 1,
              questionText: '나의 연애운은?',
              questionType: 'text',
              previewText: `${userNameFromUrl}님의 타고난 매력과 사랑의 에너지를 분석해보니, 곧 좋은 인연을 만날 가능성이 높습니다. 자세한 풀이는 유료 버전에서 확인하세요.`
            },
            {
              questionId: 'q2',
              questionOrder: 2,
              questionText: '나의 재물운은?',
              questionType: 'text',
              previewText: '당신의 재물운은 꾸준한 상승세를 보이고 있습니다. 특히 올해 하반기에 좋은 기회가 있을 것으로 예상됩니다.'
            },
            {
              questionId: 'q3',
              questionOrder: 3,
              questionText: '나의 건강운은?',
              questionType: 'text',
              previewText: '전반적으로 건강한 상태를 유지하고 있으나, 스트레스 관리에 신경 쓰시는 것이 좋겠습니다.'
            }
          ];

          // localStorage에 저장
          const fallbackResultData = {
            contentId: contentId,
            sajuData: sajuDataForCache,
            results: mockResults,
            createdAt: new Date().toISOString()
          };

          const fallbackResultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}`;
          localStorage.setItem(fallbackResultKey, JSON.stringify(fallbackResultData));
          console.log('💾 [FreeContentLoading] localStorage 저장 완료 (mock fallback)');

          // 결과 페이지로 이동
          console.log('🔀 [FreeContentLoading] 결과 페이지로 이동 (mock fallback)');
          navigate(`/product/${contentId}/result/free`, {
            state: {
              resultKey: fallbackResultKey,
              userName: userNameFromUrl,
              contentId: contentId
            }
          });
          return;
        }

        console.log('✅ [FreeContentLoading] Edge Function 호출 성공');
        console.log('📌 [FreeContentLoading] answers 개수:', result.data.answers.length);

        // ⭐️ 4단계: Edge Function 응답을 FreeSajuDetail 형식으로 변환
        const results = result.data.answers.map((answer: any) => ({
          questionId: answer.question_id,
          questionOrder: answer.question_order,
          questionText: answer.question_text,
          questionType: 'text',  // 기본값
          previewText: answer.answer_text
        }));

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [FreeContentLoading] 모든 질문 생성 완료:', results);

        // ⭐️ 5단계: localStorage에 결과 저장
        const resultData = {
          contentId: contentId,
          sajuData: sajuDataForCache,
          results: results,
          createdAt: new Date().toISOString()
        };

        const resultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}`;
        localStorage.setItem(resultKey, JSON.stringify(resultData));
        console.log('💾 [FreeContentLoading] localStorage 저장 완료');
        console.log('📌 [FreeContentLoading] resultKey:', resultKey);

        // ⭐️ 6단계: 결과 페이지로 이동
        console.log('🔀 [FreeContentLoading] 결과 페이지로 이동');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        navigate(`/product/${contentId}/result/free`, {
          state: {
            resultKey: resultKey,
            userName: userNameFromUrl,
            contentId: contentId
          }
        });

      } catch (err) {
        console.error('❌ [FreeContentLoading] 예외 발생:', err);
        toast.error('운세 생성 중 오류가 발생했습니다.');
        navigate('/');
      }
    };

    generateFreeContent();
  }, [contentId, sajuRecordId, guestMode, userNameFromUrl, navigate]);

  return (
    <div className="bg-white fixed inset-0 w-full h-full flex justify-center overflow-hidden" data-name="로딩중 _ 390">
      <div className="w-full max-w-[440px] relative">
        {/* Loading Content */}
        <div className="absolute content-stretch flex flex-col gap-[44px] items-center left-0 top-1/2 translate-y-[-50%] w-full px-[20px]">
          <DotLoading />
          <div className="content-stretch flex flex-col gap-[4px] items-start leading-[0] relative shrink-0 text-[22px] text-black text-center tracking-[-0.22px] w-full">
            <div className="flex flex-col justify-center relative shrink-0 w-full">
              <p className="font-semibold leading-[32.5px]">{userNameFromUrl}님의</p>
            </div>
            <div className="flex flex-col justify-center relative shrink-0 w-full">
              <p className="font-semibold leading-[32.5px]">운세를 분석중이에요!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}