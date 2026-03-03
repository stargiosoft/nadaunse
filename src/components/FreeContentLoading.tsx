/**
 * 무료 콘텐츠 로딩 페이지
 * - DB 폴링 제거 (무료 콘텐츠는 휘발성)
 * - Edge Function 동기 호출
 * - localStorage에 결과 저장
 * - 결과 페이지로 이동
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import svgPaths from "../imports/svg-rj5zh7ifhy";
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { LoadingWithMessage } from './ui/LoadingWithMessage';

interface FreeContentLoadingProps {
  userName?: string;
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

  // ⭐ 중복 실행 방지를 위한 ref
  const hasStartedGeneration = useRef(false);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏱️ [FreeContentLoading] 컴포넌트 렌더링');
  console.log('📌 [FreeContentLoading] hasStartedGeneration:', hasStartedGeneration.current);
  console.log('📌 [FreeContentLoading] contentId:', contentId);
  console.log('📌 [FreeContentLoading] sajuRecordId:', sajuRecordId);
  console.log('📌 [FreeContentLoading] guestMode:', guestMode);
  console.log('📌 [FreeContentLoading] userName:', userNameFromUrl);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ⭐ 비회원 일일 사용 카운터 증가 (localStorage 기반)
  const incrementFreeDailyUsage = () => {
    const FREE_DAILY_LIMIT = 3;
    const STORAGE_KEY = 'free_content_daily_usage';
    try {
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const todayKST = kstDate.toISOString().split('T')[0];

      const stored = localStorage.getItem(STORAGE_KEY);
      let newCount = 1;

      if (stored) {
        const { date, count } = JSON.parse(stored);
        if (date === todayKST) {
          newCount = count + 1;
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKST, count: newCount }));
      console.log(`📊 [FreeContentLoading] 비회원 일일 사용량 업데이트: ${newCount}/${FREE_DAILY_LIMIT}`);
    } catch (e) {
      console.warn('⚠️ [FreeContentLoading] 일일 사용량 카운터 업데이트 실패:', e);
    }
  };

  // ⭐️ Edge Function 동기 호출 (DB 폴링 제거)
  useEffect(() => {
    // ⭐ 이미 생성 시작했으면 중복 실행 방지
    if (hasStartedGeneration.current) {
      console.log('⚠️ [FreeContentLoading] 이미 생성 시작됨 → 중복 실행 방지');
      return;
    }

    if (!contentId) {
      console.error('❌ [FreeContentLoading] contentId 없음');
      toast.error('잘못된 접근입니다.');
      navigate('/', { replace: true });
      return;
    }

    // ⭐ 생성 시작 플래그 설정
    hasStartedGeneration.current = true;
    console.log('✅ [FreeContentLoading] 생성 시작 플래그 설정 → 중복 방지 활성화');

    const generateFreeContent = async () => {
      try {
        console.log('🚀 [FreeContentLoading] Edge Function 호출 시작...');

        // ⭐ 로그인 사용자 확인 (DB 저장용)
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || null;
        console.log('📌 [FreeContentLoading] 현재 사용자 ID:', currentUserId || '(게스트)');

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
              navigate('/', { replace: true });
              return;
            }
            sajuDataForCache = JSON.parse(cachedSaju);
          } else {
            if (!sajuRecordId) {
              console.error('❌ [FreeContentLoading] sajuRecordId 없음');
              toast.error('사주 정보를 찾을 수 없습니다.');
              navigate('/', { replace: true });
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
              navigate('/', { replace: true });
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

          // ⭐ 비회원 일일 카운터 증가 (allProducts mock 데이터)
          incrementFreeDailyUsage();

          // localStorage에 저장
          const resultData = {
            contentId: contentId,
            sajuData: sajuDataForCache,
            results: mockResults,
            createdAt: new Date().toISOString()
          };

          // ⭐ 타임스탬프 추가: 동일 콘텐츠+사주로 다시 볼 때도 새로운 키 생성 (이전 태그 재사용 방지)
          const resultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}_${Date.now()}`;
          localStorage.setItem(resultKey, JSON.stringify(resultData));
          console.log('💾 [FreeContentLoading] localStorage 저장 완료 (allProducts)');
          
          // 결과 페이지로 이동
          // ⭐ replace: true - iOS 스와이프 뒤로가기 시 콘텐츠 상세로 이동하도록 히스토리 교체
          navigate(`/product/${contentId}/result/free`, {
            replace: true,
            state: {
              resultKey: resultKey,
              userName: userNameFromUrl,
              contentId: contentId
            }
          });
          return;
        }

        // ⭐️ 1단계: 게스트 사주 데이터 준비 (동기 - localStorage)
        let sajuDataForGuest: any = null;
        if (guestMode) {
          console.log('🔓 [FreeContentLoading] 게스트 모드 → localStorage 사주 데이터 사용');
          const cachedSaju = localStorage.getItem('cached_saju_info');
          if (!cachedSaju) {
            console.error('❌ [FreeContentLoading] 캐시된 사주 정보 없음');
            toast.error('사주 정보를 찾을 수 없습니다.');
            navigate('/', { replace: true });
            return;
          }
          sajuDataForGuest = JSON.parse(cachedSaju);
        } else if (!sajuRecordId) {
          console.error('❌ [FreeContentLoading] sajuRecordId 없음');
          toast.error('사주 정보를 찾을 수 없습니다.');
          navigate('/', { replace: true });
          return;
        }

        // ⭐️ 2단계: Edge Function + 콘텐츠 정보 동시 호출 (병렬)
        // - Edge Function: AI 답변 생성 (내부에서 content, questions, saju 모두 조회)
        // - master_contents: 결과 페이지 이동 시 productInfo용 (DB 재조회 방지)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 [FreeContentLoading] Edge Function + 콘텐츠 조회 병렬 시작...');

        const requestBody = guestMode
          ? {
              contentId,
              sajuData: {
                full_name: sajuDataForGuest.name || sajuDataForGuest.full_name,
                gender: sajuDataForGuest.gender,
                birth_date: sajuDataForGuest.birthDate || sajuDataForGuest.birth_date,
                birth_time: sajuDataForGuest.birthTime || sajuDataForGuest.birth_time,
                is_guest: true
              },
              userId: currentUserId
            }
          : { contentId, sajuRecordId, userId: currentUserId };

        console.log('📤 [FreeContentLoading] 호출 파라미터:', requestBody);

        const [result, { data: contentData }] = await Promise.all([
          supabase.functions.invoke('generate-free-preview', { body: requestBody }),
          supabase.from('master_contents')
            .select('id,title,category_main,thumbnail_url,description')
            .eq('id', contentId)
            .single()
        ]);

        // product 형식으로 변환 (결과 페이지 네비게이션용)
        const productInfo = contentData
          ? {
              id: contentData.id,
              title: contentData.title,
              type: 'free',
              category: contentData.category_main,
              image: contentData.thumbnail_url || '',
              description: contentData.description || ''
            }
          : { id: contentId, title: '', type: 'free', category: '', image: '', description: '' };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 [FreeContentLoading] Edge Function 응답 (전체):');
        // console.log(JSON.stringify(result, null, 2)); // 전체 로그는 너무 길어서 생략
        console.log(`Success: ${!!result.data?.success}, Error: ${result.error ? 'Yes' : 'No'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // ⭐️ Edge Function 실패 시 mock 데이터로 fallback
        let shouldUseMockFallback = false;
        let fallbackReason = '';

        // ⭐ 비회원 일일 제한 도달 체크 (서버 2차 검증)
        if (result.data?.error === 'DAILY_LIMIT_REACHED') {
          console.log('🚫 [FreeContentLoading] 서버 일일 제한 도달 → 콘텐츠 상세로 이동');

          // localStorage도 동기화 (서버와 클라이언트 상태 일치)
          const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
          const todayKST = kstNow.toISOString().split('T')[0];
          localStorage.setItem('free_content_daily_usage', JSON.stringify({ date: todayKST, count: 3 }));

          // 콘텐츠 상세로 돌아가면서 LoginBottomSheet 표시 유도
          navigate(`/free/content/${contentId}`, {
            replace: true,
            state: { dailyLimitReached: true }
          });
          return;
        }

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

          // ⭐ 비회원 일일 카운터 증가 (mock fallback)
          incrementFreeDailyUsage();

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

          // ⭐ 타임스탬프 추가: 동일 콘텐츠+사주로 다시 볼 때도 새로운 키 생성 (이전 태그 재사용 방지)
          const fallbackResultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}_${Date.now()}`;
          localStorage.setItem(fallbackResultKey, JSON.stringify(fallbackResultData));
          console.log('💾 [FreeContentLoading] localStorage 저장 완료 (mock fallback)');

          // 결과 페이지로 이동
          // ⭐ replace: true - iOS 스와이프 뒤로가기 시 콘텐츠 상세로 이동하도록 히스토리 교체
          console.log('🔀 [FreeContentLoading] 결과 페이지로 이동 (mock fallback)');
          navigate(`/product/${contentId}/result/free`, {
            replace: true,
            state: {
              resultKey: fallbackResultKey,
              userName: userNameFromUrl,
              contentId: contentId,
              product: productInfo  // ⭐ FreeResultPage의 DB 조회 스킵용
            }
          });
          return;
        }

        console.log('✅ [FreeContentLoading] Edge Function 호출 성공');
        console.log('📌 [FreeContentLoading] answers 개수:', result.data.answers.length);

        // ⭐ 비회원 일일 카운터 증가 (Edge Function 성공)
        incrementFreeDailyUsage();

        // ⭐️ 3단계: Edge Function 응답을 FreeSajuDetail 형식으로 변환
        const results = result.data.answers.map((answer: any) => ({
          questionId: answer.question_id,
          questionOrder: answer.question_order,
          questionText: answer.question_text,
          questionType: 'text',
          previewText: answer.answer_text
        }));

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [FreeContentLoading] 모든 질문 생성 완료');

        // ⭐️ 4단계: localStorage에 결과 저장
        // sajuData: Edge Function 응답의 saju_info 사용 (프론트 DB 조회 제거)
        const sajuDataForCache = result.data.saju_info || sajuDataForGuest;
        const resultData = {
          contentId: contentId,
          sajuData: sajuDataForCache,
          results: results,
          // ⭐ contentAnswers: 결과 페이지에서 백그라운드 태그 추출에 사용
          contentAnswers: result.data.answers.map((a: any) => ({
            questionText: a.question_text,
            answerText: a.answer_text
          })),
          createdAt: new Date().toISOString()
        };

        // ⭐ 타임스탬프 추가: 동일 콘텐츠+사주로 다시 볼 때도 새로운 키 생성 (이전 태그 재사용 방지)
        const resultKey = `free_content_${contentId}_${sajuRecordId || 'guest'}_${Date.now()}`;
        localStorage.setItem(resultKey, JSON.stringify(resultData));
        console.log('💾 [FreeContentLoading] localStorage 저장 완료');
        console.log('📌 [FreeContentLoading] resultKey:', resultKey);

        // ⭐ 운세 기록 캐시 갱신 플래그 설정 (로그인 사용자만)
        // → PurchaseHistoryPage에서 무료 탭 진입 시 새 데이터 반영
        if (currentUserId) {
          localStorage.setItem('free_content_needs_refresh', 'true');
          console.log('🔄 [FreeContentLoading] 운세 기록 캐시 갱신 플래그 설정');
        }

        // ⭐️ 6단계: 결과 페이지로 이동
        // ⭐ replace: true - iOS 스와이프 뒤로가기 시 콘텐츠 상세로 이동하도록 히스토리 교체
        console.log('🔀 [FreeContentLoading] 결과 페이지로 이동');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // ⭐ DB 레코드 ID가 있으면 전달 (운세 기록 페이지에서 사용)
        const dbRecordId = result.data.record_id || null;
        console.log('📌 [FreeContentLoading] DB 레코드 ID:', dbRecordId || '(없음)');

        navigate(`/product/${contentId}/result/free`, {
          replace: true,
          state: {
            resultKey: resultKey,
            userName: userNameFromUrl,
            contentId: contentId,
            product: productInfo,  // ⭐ FreeResultPage의 DB 조회 스킵용
            recordId: dbRecordId,  // ⭐ DB 레코드 ID (나다움 태그 저장용)
            // ⭐ 태그 추출은 결과 페이지에서 백그라운드로 처리
            contentAnswers: result.data.answers.map((a: any) => ({
              questionText: a.question_text,
              answerText: a.answer_text
            })),
            // ⭐ fromDB 제거: 이미 localStorage에 결과 저장됨 → DB 재조회 불필요
            // fromDB: !!dbRecordId 제거 → FreeSajuDetail에서 불필요한 DB 로딩 방지
            isNewResult: true  // ⭐ 새로 생성된 결과 (나다움 기록하기 버튼 표시)
          }
        });

      } catch (err) {
        console.error('❌ [FreeContentLoading] 예외 발생:', err);
        toast.error('운세 생성 중 오류가 발생했습니다.');
        navigate('/', { replace: true });
      }
    };

    generateFreeContent();

    // ⭐ 클린업 함수: 컴포넌트 언마운트 시 로그
    return () => {
      console.log('🔄 [FreeContentLoading] 컴포넌트 언마운트 또는 useEffect 클린업');
    };
  }, [contentId, sajuRecordId, guestMode, userNameFromUrl, navigate]);

  return (
    <div className="bg-white fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden" data-name="로딩중 _ 390">
      <div className="w-full max-w-[440px]">
        <LoadingWithMessage message={`${userNameFromUrl}님의 운세를 분석중이에요!`} padding="0 20px" />
      </div>
    </div>
  );
}