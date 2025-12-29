import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import svgPaths from "../imports/svg-ezi6geedzp";
import imgLoadingImage from "figma:asset/35682d96407edc7fb5921d3d1b58f0b20b40da6e.png";
import { supabase, supabaseUrl } from '../lib/supabase';
import { preloadTarotImages } from '../lib/tarotImageCache';
import { motion } from "motion/react";

// ⭐ 무료 콘텐츠 인터페이스
interface FreeContent {
  id: string;
  title: string;
  thumbnail_url: string | null;
  weekly_clicks: number;
}

// ⭐ Progress Bar 컴포넌트 분리 (100ms 리렌더링 격리)
function ProgressBar({ isCompleted }: { isCompleted: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isCompleted) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const duration = 40000; // 40초

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 99, 99); // 최대 99%

      setProgress(newProgress);

      // 40초 경과 시 99%에서 멈춤
      if (newProgress >= 99) {
        clearInterval(interval);
      }
    }, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [isCompleted]);

  return (
    <div className="flex items-center gap-[16px]">
      <div className="flex-1 h-[14px] bg-[#e7e7e7] rounded-[999px] overflow-hidden relative">
        <div
          className="h-full bg-[#48b2af] rounded-[999px] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[15px] leading-[23.5px] tracking-[-0.3px] text-[#6d6d6d] text-nowrap pt-[2px]">
        {Math.round(progress)}%
      </p>
    </div>
  );
}



export default function LoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const contentId = searchParams.get('contentId');
  const orderId = searchParams.get('orderId');
  const from = searchParams.get('from'); // ⭐ 출처 파라미터 추가

  // Progress bar state
  const [isCompleted, setIsCompleted] = useState(false);
  const [contentTitle, setContentTitle] = useState('AI 풀이 생성 중');
  const [devNextUrl, setDevNextUrl] = useState<string | null>(null); // ⭐ [개발 모드] 다음 URL state

  // ⭐ 무료 콘텐츠 state
  const [freeContents, setFreeContents] = useState<FreeContent[]>([]);
  const [displayCount, setDisplayCount] = useState(6); // 초기 6개 표시

  // 콘텐츠 정보 로드
  useEffect(() => {
    if (!contentId) return;

    const fetchContentTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('master_contents')
          .select('title')
          .eq('id', contentId)
          .single();

        if (error) throw error;
        if (data?.title) {
          setContentTitle(data.title);
        }
      } catch (error) {
        console.error('❌ 콘텐츠 제목 로드 실패:', error);
      }
    };

    fetchContentTitle();
  }, [contentId]);

  // ⭐ 무료 콘텐츠 로드 (인기도 순)
  useEffect(() => {
    const fetchFreeContents = async () => {
      try {
        console.log('🔍 [무료콘텐츠] 로드 시작');
        
        // 일주일 전 날짜 계산
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString();

        // 1. master_contents에서 무료 콘텐츠 조회
        const { data: contents, error: contentsError } = await supabase
          .from('master_contents')
          .select('id, title, thumbnail_url')
          .eq('content_type', 'free');

        if (contentsError) throw contentsError;
        if (!contents || contents.length === 0) {
          console.log('⚠️ [무료콘텐츠] 데이터 없음');
          return;
        }

        console.log('✅ [��료콘텐츠] master_contents 조회:', contents.length, '개');

        // 2. 각 콘텐츠의 주간 클릭수 계산
        const contentsWithClicks = await Promise.all(
          contents.map(async (content) => {
            const { count, error } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('content_id', content.id)
              .gte('created_at', oneWeekAgoStr);

            if (error) {
              console.error(`❌ [무료콘텐츠] ${content.title} 클릭수 조회 실패:`, error);
              return { ...content, weekly_clicks: 0 };
            }

            console.log(`📊 [무료콘텐츠] ${content.title}: ${count}회`);
            return { ...content, weekly_clicks: count || 0 };
          })
        );

        // 3. 인기도 순으로 정렬
        const sorted = contentsWithClicks.sort((a, b) => b.weekly_clicks - a.weekly_clicks);
        
        console.log('✅ [무료콘텐츠] 정렬 완료:', sorted.map(c => `${c.title}(${c.weekly_clicks})`));
        
        setFreeContents(sorted);
      } catch (error) {
        console.error('❌ [무료콘텐츠] 로드 실패:', error);
      }
    };

    fetchFreeContents();
  }, []);

  // ⭐️ AI 생성 완료 폴링 (2초마다 체크)
  useEffect(() => {
    if (!orderId && !contentId) {
      console.error('❌ orderId 또는 contentId 없음');
      navigate('/');
      return;
    }

    // ⚠️ [개발 모드] from=dev 파라미터가 있으면 즉시 완료 처리
    if (from === 'dev') {
      console.log('🔧 [개발 모드] 로딩 페이지 - 즉시 완료 처리');
      setIsCompleted(true);
      
      // ⭐ [개발 모드] 자동 이동하지 않고, URL만 미리 계산해서 state에 저장
      (async () => {
        try {
          const { data: contentData } = await supabase
            .from('master_contents')
            .select('category_main, id, master_content_questions(question_type, question_order)')
            .eq('id', contentId)
            .single();
          
          const firstQuestion = contentData?.master_content_questions?.find((q: any) => q.question_order === 1);
          const questionType = firstQuestion?.question_type || 'saju';
          
          console.log('🔧 [개발 모드] 첫 번째 질문 타입:', questionType);
          
          let nextUrl = '';
          if (questionType === 'tarot') {
            nextUrl = `/tarot/shuffle?orderId=${orderId}&questionOrder=1&from=dev`;
          } else {
            nextUrl = `/result/saju?orderId=${orderId}&contentId=${contentId}&from=dev`;
          }
          
          console.log('🔧 [개발 모드] 다음 URL 계산 완료:', nextUrl);
          setDevNextUrl(nextUrl);
        } catch (error) {
          console.error('❌ [개발 모드] 콘텐츠 조회 실패:', error);
          // 실패 시 기본적으로 사주 결과 페이지로
          setDevNextUrl(`/result/saju?orderId=${orderId}&contentId=${contentId}&from=dev`);
        }
      })();
      
      return;
    }

    const checkCompletion = async () => {
      try {
        console.log('🔍 주문 상태 확인 중...', { orderId, contentId });
        
        // orderId가 있으면 orderId로, 없으면 contentId로 조회
        let query = supabase
          .from('orders')
          .select('ai_generation_completed, content_id, master_contents(content_type, category_main)');

        if (orderId) {
          query = query.eq('id', orderId);
        } else if (contentId) {
          query = query.eq('content_id', contentId);
        }

        // ⭐️ .single() 대신 .maybeSingle() 사용 (0개 행 허용)
        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('❌ 주문 조회 실패:', error);
          return;
        }

        if (!data) {
          console.log('⏳ 주문 데이터 아직 없음, 계속 대기...');
          return;
        }

        console.log('📦 주문 데이터:', data);
        console.log('🔄 AI 생성 상태:', data.ai_generation_completed ? '✅ 완료' : '⏳ 진행 중');

        if (data.ai_generation_completed) {
          console.log('✅ AI 생성 완료!');
          setIsCompleted(true);

          // ⭐ 타로 이미지 프리로드 (완료될 때까지 대기)
          if (orderId) {
            try {
              console.log('🎴 [타로캐시] 프리로딩 시작...');
              await preloadTarotImages(orderId, supabaseUrl);
              console.log('✅ [타로캐시] 프리로딩 완료!');
            } catch (err) {
              console.error('❌ [타로캐시] 프리로드 실패 (계속 진행):', err);
            }
          }

          // 프리로딩 완료 후 결과 페이지로 이동
          setTimeout(async () => {
            const finalContentId = data.content_id || contentId;
            const contentType = data.master_contents?.content_type;
            let categoryMain = data.master_contents?.category_main;

            // ⭐ category_main이 없으면 별도 쿼리로 가져오기
            if (!categoryMain && finalContentId) {
              console.log('⚠️ [플로우] category_main 없음 → 별도 쿼리 실행');
              const { data: contentData } = await supabase
                .from('master_contents')
                .select('category_main')
                .eq('id', finalContentId)
                .single();
              
              categoryMain = contentData?.category_main;
              console.log('✅ [플로우] 별도 쿼리 결과:', categoryMain);
            }

            console.log('🔀 [플로우] 다음 페이지 결정 중...');
            console.log('🔀 [플로우] contentType:', contentType);
            console.log('🔀 [플로우] category_main:', categoryMain);
            console.log('🔀 [플로우] master_contents 전체:', data.master_contents);
            console.log('🔀 [플로우] contentId:', finalContentId);
            console.log('🔀 [플로우] orderId:', orderId);

            // ⭐ 첫 번째 질문의 타입 확인 (question_order = 1)
            if (!finalContentId || !orderId) {
              console.error('❌ [플로우] contentId 또는 orderId 없음');
              navigate('/');
              return;
            }

            const { data: firstQuestion, error: firstQuestionError } = await supabase
              .from('order_results')
              .select('question_type, question_order, question_id')
              .eq('order_id', orderId)
              .eq('question_order', 1)
              .single();

            if (firstQuestionError || !firstQuestion) {
              console.error('❌ [플로우] 첫 번째 질문 조회 실패:', firstQuestionError);
              navigate('/');
              return;
            }

            console.log('🔍 [플로우] 첫 번째 질문:', firstQuestion);
            console.log('🔍 [플로우] 첫 번째 질문 타입:', firstQuestion.question_type);

            // ⭐ 첫 번째 질문이 타로면 → 타로 셔플 페이지
            // ⭐ 첫 번째 질문이 사주면 → 사주 결과 페이지
            if (firstQuestion.question_type === 'tarot') {
              console.log('🎴 [플로우] 첫 번째 질문이 타로 → 타로 셔플 페이지로 이동');
              const fromParam = from ? `&from=${from}` : '';
              console.log('🎴 [플로우] 이동 URL:', `/tarot/shuffle?orderId=${orderId}&questionOrder=1${fromParam}`);
              navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=1${fromParam}`);
            } else {
              console.log('🔮 [플로우] 첫 번째 질문이 사주 → 사주 결과 페이지로 이동');
              const fromParam = from ? `&from=${from}` : '';
              console.log('🔮 [플로우] 이동 URL:', `/result/saju?orderId=${orderId}&contentId=${finalContentId}${fromParam}`);
              navigate(`/result/saju?orderId=${orderId}&contentId=${finalContentId}${fromParam}`);
            }
          }, 1000);
        }
      } catch (err) {
        console.error('❌ 폴링 오류:', err);
      }
    };

    // 즉시 1회 실행
    checkCompletion();

    // 2초마다 폴링
    const pollingInterval = setInterval(checkCompletion, 2000);

    return () => clearInterval(pollingInterval);
  }, [orderId, contentId, navigate]);

  // X 버튼 클릭 (홈으로)
  const handleClose = () => {
    // 로딩 상태 저장 (이탈 후 재진입 대응)
    if (contentId) {
      localStorage.setItem(`loading_${contentId}`, JSON.stringify({
        inProgress: !isCompleted,
        timestamp: Date.now()
      }));
    }
    navigate('/');
  };

  // 홈으로 가기
  const handleGoHome = () => {
    navigate('/');
  };

  // 다른 운세 보기
  const handleViewOther = () => {
    // Tab Bar '전체', Segmented Control '심화 해석판' 설정
    localStorage.setItem('home_tab', '전체');
    localStorage.setItem('home_segment', '심화 해석판');
    navigate('/');
  };

  return (
    <div 
      className="bg-white flex flex-col w-full max-w-[440px] mx-auto relative overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Top Navigation - Fixed */}
      <div className="bg-white h-[52px] relative shrink-0 w-full sticky top-0 z-20">
        <div className="flex items-center justify-between px-[12px] h-full">
          <div className="w-[44px] h-[44px]" />
          <h1 className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[18px] leading-[25.5px] tracking-[-0.36px] text-black select-none">
            {contentTitle}
          </h1>
          <button
            onClick={handleClose}
            className="group flex items-center justify-center w-[44px] h-[44px] rounded-[12px] cursor-pointer transition-colors duration-200 active:bg-gray-100"
          >
            <X className="w-[24px] h-[24px] text-[#848484] transition-transform duration-200 group-active:scale-90" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto pb-[140px]"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overflowAnchor: 'none'
        }}
      >
        {/* Loading Image */}
        <div className="w-full max-w-[440px] h-auto mx-auto relative overflow-hidden p-0 select-none">
          <img
            alt=""
            className="w-full h-auto object-cover pointer-events-none block"
            src={imgLoadingImage}
          />
        </div>

        {/* Progress Section */}
        <div className="bg-[#f9f9f9] border-t border-[#f3f3f3] px-[20px] py-[32px] select-none">
          <div className="flex flex-col gap-[12px]">
            {/* Text */}
            <div className="flex flex-col gap-[6px]">
              <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[16px] leading-[24.5px] tracking-[-0.32px] text-[#151515]">
                정확한 해석을 위해 시간이 필요해요
              </p>
              <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold text-[18px] leading-[24px] tracking-[-0.36px] text-[#151515]">
                결과가 나오면 <span className="text-[#48b2af]">알림톡 보내드릴게요</span>
              </p>
            </div>

            {/* Progress Bar */}
            <ProgressBar isCompleted={isCompleted} />
          </div>
        </div>

        {/* ⭐ 무료 콘텐츠 섹션 */}
        {freeContents.length > 0 && (
          <div className="bg-white px-[20px] py-[48px] pt-[32px] pr-[20px] pb-[80px] pl-[20px]">
            {/* Section Title */}
            <div className="mb-[12px]">
              <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[17px] leading-[24px] tracking-[-0.34px] text-black">
                기다리는 동안 무료 운세 보기
              </p>
            </div>

            {/* Content Cards - Horizontal Scroll */}
            <div className="flex gap-[12px] overflow-x-auto pb-[4px] -mx-[20px] px-[20px] items-stretch" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {freeContents.slice(0, displayCount).map((content) => (
                <button
                  key={content.id}
                  onClick={() => navigate(`/free/content/${content.id}`)}
                  className="flex-none w-[200px] cursor-pointer"
                >
                  <div className="flex flex-col gap-[8px]">
                    {/* Thumbnail */}
                    <div className="h-[120px] w-[200px] rounded-[12px] overflow-hidden bg-[#f9f9f9] relative">
                      {content.thumbnail_url ? (
                        <img
                          src={content.thumbnail_url}
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#d4d4d4]">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <rect width="24" height="24" rx="4" fill="#f3f3f3"/>
                            <path d="M8 10L12 6L16 10M8 14L12 18L16 14" stroke="#d4d4d4" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col gap-[6px] items-start w-full">
                      {/* Tag */}
                      <div className="bg-[#f9f9f9] px-[6px] py-[2px] rounded-[4px]">
                        <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[12px] leading-[16px] tracking-[-0.24px] text-[#848484]">
                          무료 체험판
                        </p>
                      </div>

                      {/* Title */}
                      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[15px] leading-[22.5px] tracking-[-0.3px] text-black text-left w-full line-clamp-2 pl-[3px]">
                        {content.title}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {/* "더 볼래요!" 버튼 */}
              {freeContents.length > displayCount && (
                <button
                  onClick={() => setDisplayCount(prev => prev + 6)}
                  className="flex-none content-stretch flex items-center pl-0 pr-[20px] py-0 relative group cursor-pointer"
                >
                  <div className="content-stretch flex h-full items-center justify-center mr-[-20px] p-[12px] pt-[13px] relative rounded-[12px] shrink-0 w-[200px]">
                    <div aria-hidden="true" className="absolute border border-[#d4d4d4] border-dashed inset-[0px] pointer-events-none rounded-[12.5px] transition-colors" />
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[#6d6d6d] text-[16px] text-nowrap tracking-[-0.3px]">
                      더 볼래요!
                    </p>
                  </div>
                  <div className="flex items-center justify-center mr-[-20px] relative shrink-0">
                    <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                      <div className="relative size-[44px]">
                        <div className="absolute inset-0">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 44 44">
                            <g>
                              <rect fill="white" height="44" width="44" />
                              <motion.path 
                                d="M18.7044 33.6472L7.41884 22.9923C7.28676 22.8658 7.18137 22.7123 7.10929 22.5415C7.03721 22.3708 7 22.1864 7 22C7 21.8136 7.03721 21.6292 7.10929 21.4585C7.18137 21.2877 7.28676 21.1342 7.41884 21.0077L18.7044 10.3528C19.5328 9.56462 20.8773 10.1839 20.8773 11.3522V16.4614C20.8773 16.9541 21.2711 17.3622 21.7464 17.3622H35.3839C36.2802 17.3622 37 18.1082 37 19.0372V24.9628C37 25.8918 36.2802 26.6378 35.3839 26.6378H21.7464C21.2711 26.6378 20.8773 27.0459 20.8773 27.5386V32.6478C20.8773 33.8161 19.5328 34.4354 18.7044 33.6472Z" 
                                fill="#D4D4D4"
                                animate={{ x: [0, 4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                              />
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons - Fixed */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] z-10">
        <div className="bg-white px-[20px] py-[12px]">
          {/* ⭐ [개발 모드] 다음으로 이동 버튼 */}
          {from === 'dev' && devNextUrl && (
            <div className="mb-[12px]">
              <button
                onClick={() => {
                  // ⭐ [DEV] 타로 카드 뽑기 화면으로 이동 (전체 플로우 확인용)
                  // ���존에는 devNextUrl로 바로 이동했으나, 타로 셔플부터 시작하도록 변경
                  navigate(`/tarot/shuffle?orderId=${orderId}&contentId=${contentId}&from=dev`);
                }}
                className="ml-auto w-fit px-[12px] py-[8px] flex items-center gap-[4px] cursor-pointer select-none"
              >
                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[14px] leading-[20px] tracking-[-0.28px] text-[#ff4444] underline">
                  [DEV] 풀이 화면으로 이동 →
                </p>
              </button>
            </div>
          )}
          
          <div className="flex gap-[12px]">
            <button
              onClick={handleGoHome}
              className="flex-1 h-[56px] bg-[#f0f8f8] rounded-[16px] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform select-none"
            >
              <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[16px] leading-[25px] tracking-[-0.32px] text-[#48b2af]">
                홈으로 가기
              </p>
            </button>
            <button
              onClick={handleViewOther}
              className="flex-1 h-[56px] bg-[#48b2af] rounded-[16px] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform select-none"
            >
              <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium text-[16px] leading-[25px] tracking-[-0.32px] text-white">
                다른 운세 보기
              </p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}