import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { preloadTarotImages } from '../lib/tarotImageCache';
import { preloadImages } from '../lib/imagePreloader';
import { motion } from "motion/react";
import kakaoIcon from '../assets/loading/kakao-icon.svg';
import tarotCardBack from '../assets/f494ca2b3b180a2d66b2960718e3e515db3248a2.png';

// ⭐ 무료 콘텐츠 인터페이스
interface FreeContent {
  id: string;
  title: string;
  thumbnail_url: string | null;
  weekly_clicks: number;
}

// ⭐ 무료 콘텐츠 캐시 키 (5분 만료)
const FREE_CONTENTS_CACHE_KEY = 'free_contents_cache_v1';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

// 🚀 동기적 캐시 확인 함수 (useState 초기화 시점)
function getInitialFreeContents(): FreeContent[] {
  try {
    const cachedData = localStorage.getItem(FREE_CONTENTS_CACHE_KEY);
    if (cachedData) {
      const { contents, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      if (now - timestamp < CACHE_EXPIRY && Array.isArray(contents) && contents.length > 0) {
        console.log('🚀 [LoadingPage] 초기화 시 캐시 발견 → 즉시 렌더링:', contents.length, '개');
        return contents;
      }
    }
  } catch (e) {
    console.error('❌ [LoadingPage] 초기 캐시 파싱 실패:', e);
  }
  return [];
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
    const duration = 90000; // 90초

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 99, 99); // 최대 99%

      setProgress(newProgress);

      // 90초 경과 시 99%에서 멈춤
      if (newProgress >= 99) {
        clearInterval(interval);
      }
    }, 100); // 100ms마다 업데이트

    return () => clearInterval(interval);
  }, [isCompleted]);

  return (
    <div className="flex items-center w-full px-[2px]" style={{ gap: '14px' }}>
      <div className="flex-1 rounded-[999px] overflow-hidden relative" style={{ height: '12px', backgroundColor: '#f3f3f3' }}>
        <div
          className="h-full rounded-[999px] transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: '#48b2af'
          }}
        />
      </div>
      <p
        className="shrink-0 text-center"
        style={{
          fontFamily: "'Pretendard Variable', sans-serif",
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '22px',
          letterSpacing: '-0.42px',
          color: '#999'
        }}
      >
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
  const from = searchParams.get('from');

  // Progress bar state
  const [isCompleted, setIsCompleted] = useState(false);
  const [devNextUrl, setDevNextUrl] = useState<string | null>(null);

  // 🚀 무료 콘텐츠 state - 캐시에서 동기적 초기화
  const [freeContents, setFreeContents] = useState<FreeContent[]>(getInitialFreeContents);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set());

  // ⭐ 현재 콘텐츠의 카테고리 (다른 운세 보기 클릭 시 홈 필터에 사용)
  const [contentCategory, setContentCategory] = useState<string | null>(null);

  // ⭐ iOS Safari 고스트 클릭 방지 (페이지 마운트 후 500ms 동안 버튼 클릭 무시)
  const mountTimeRef = useRef<number>(Date.now());

  // ⭐ 세션 체크
  useEffect(() => {
    const checkSession = async () => {
      // DEV 모드 우회
      if (import.meta.env.DEV) {
        const localUserJson = localStorage.getItem('user');
        if (localUserJson) {
          const localUser = JSON.parse(localUserJson);
          if (localUser.provider === 'dev') return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  // ⭐ 뒤로가기 감지
  useEffect(() => {
    if (!contentId) return;

    window.history.pushState({ loadingPage: true }, '');

    const handlePopState = (event: PopStateEvent) => {
      console.log('🔙 [LoadingPage] 뒤로가기 감지 → 콘텐츠 상세 페이지로 이동');
      navigate(`/master/content/detail/${contentId}`, { replace: true });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [contentId, navigate]);

  // ⭐ 현재 콘텐츠의 카테고리 조회
  useEffect(() => {
    if (!contentId) return;

    const fetchContentCategory = async () => {
      try {
        console.log('🔍 [LoadingPage] 콘텐츠 카테고리 조회 시작:', { contentId });

        const { data, error } = await supabase
          .from('master_contents')
          .select('category_main')
          .eq('id', contentId)
          .single();

        if (error) {
          console.error('❌ [LoadingPage] 콘텐츠 카테고리 조회 실패:', error);
          return;
        }

        if (data?.category_main) {
          console.log('✅ [LoadingPage] 콘텐츠 카테고리 조회 성공:', data.category_main);
          setContentCategory(data.category_main);
        }
      } catch (error) {
        console.error('❌ [LoadingPage] 콘텐츠 카테고리 조회 중 오류:', error);
      }
    };

    fetchContentCategory();
  }, [contentId]);

  // ⭐ 결과 페이지 에셋 프리로드 (대기 시간 활용)
  // 사용자가 기다리는 동안 백그라운드로 에셋 로드 → AI 완료 시 즉시 렌더링
  useEffect(() => {
    console.log('🚀 [LoadingPage] 필수 에셋 프리로드 시작');

    // ⭐ 타로 카드 뒷면 이미지 - 즉시 high priority 로드 (셔플 페이지 필수)
    const TAROT_CARD_KEY = 'tarot_card_back_preloaded';
    if (!sessionStorage.getItem(TAROT_CARD_KEY)) {
      preloadImages([tarotCardBack], 'high'); // 즉시 로드
      sessionStorage.setItem(TAROT_CARD_KEY, 'true');
      console.log('🃏 [타로카드뒷면] 즉시 프리로딩 시작 (high priority)');
    } else {
      console.log('✅ [타로카드뒷면] 이미 캐시됨');
    }

    // 타로 배경 이미지 - 백그라운드 low priority 로드
    const TAROT_BG_KEY = 'tarot_bg_preloaded';
    if (!sessionStorage.getItem(TAROT_BG_KEY)) {
      const tarotBackgroundUrl = 'https://i.postimg.cc/WzwkjYXT/talo-seupeuledeu-batang-(wonbon).jpg';
      setTimeout(() => {
        preloadImages([tarotBackgroundUrl], 'low');
        sessionStorage.setItem(TAROT_BG_KEY, 'true');
        console.log('🎨 [타로배경] 백그라운드 프리로딩 완료!');
      }, 2000); // 2초 후 시작
    } else {
      console.log('✅ [타로배경] 이미 캐시됨');
    }
  }, []);

  // ⭐ 무료 콘텐츠 로드 (인기도 순 - weekly_clicks 기준)
  useEffect(() => {
    const fetchFreeContents = async () => {
      try {
        // 🚀 이미 초기화 시점에 캐시에서 로드되었으면 스킵
        if (freeContents.length > 0) {
          console.log('✅ [무료콘텐츠] 이미 캐시에서 로드됨 → API 스킵');

          // 🚀 이미지 프리로드만 수행
          const thumbnails = freeContents
            .slice(0, 3)
            .map((c: FreeContent) => c.thumbnail_url)
            .filter(Boolean) as string[];
          if (thumbnails.length > 0) {
            preloadImages(thumbnails, 'high');
          }
          return;
        }

        console.log('🔍 [무료콘텐츠] 로드 시작');

        // 캐시 확인
        const cachedData = localStorage.getItem(FREE_CONTENTS_CACHE_KEY);
        if (cachedData) {
          const { contents, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('✅ [무료콘텐츠] 캐시 사용:', contents.length, '개');
            setFreeContents(contents);

            const thumbnails = contents
              .slice(0, 3)
              .map((c: FreeContent) => c.thumbnail_url)
              .filter(Boolean) as string[];
            if (thumbnails.length > 0) {
              preloadImages(thumbnails, 'high');
            }
            return;
          }
        }

        // ⭐ master_contents에서 무료 콘텐츠 조회 (weekly_clicks 내림차순 정렬)
        const { data: contents, error: contentsError } = await supabase
          .from('master_contents')
          .select('id, title, thumbnail_url, weekly_clicks')
          .eq('content_type', 'free')
          .order('weekly_clicks', { ascending: false });

        if (contentsError) throw contentsError;
        if (!contents || contents.length === 0) {
          console.log('⚠️ [무료콘텐츠] 데이터 없음');
          return;
        }

        console.log('✅ [무료콘텐츠] 인기순 정렬 완료:', contents.map(c => `${c.title}(${c.weekly_clicks})`));

        setFreeContents(contents);

        // 캐시 저장
        localStorage.setItem(FREE_CONTENTS_CACHE_KEY, JSON.stringify({
          contents: contents,
          timestamp: Date.now()
        }));

        // 🚀 처음 3개 썸네일 우선 프리로드
        const thumbnails = contents
          .slice(0, 3)
          .map(c => c.thumbnail_url)
          .filter(Boolean) as string[];
        if (thumbnails.length > 0) {
          preloadImages(thumbnails, 'high');
        }

        // 🚀 4-6번째 썸네일 백그라운드 프리페칭
        const remainingThumbnails = contents
          .slice(3, 6)
          .map(c => c.thumbnail_url)
          .filter(Boolean) as string[];
        if (remainingThumbnails.length > 0) {
          setTimeout(() => {
            preloadImages(remainingThumbnails, 'low');
          }, 500);
        }
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

      (async () => {
        try {
          const { data: contentData } = await supabase
            .from('master_contents')
            .select('category_main, id, master_content_questions(question_type, question_order)')
            .eq('id', contentId)
            .single();

          const firstQuestion = contentData?.master_content_questions?.find((q: any) => q.question_order === 1);
          const questionType = firstQuestion?.question_type || 'saju';

          let nextUrl = '';
          if (questionType === 'tarot') {
            nextUrl = `/tarot/shuffle?orderId=${orderId}&questionOrder=1&from=dev`;
          } else {
            nextUrl = `/result/saju?orderId=${orderId}&contentId=${contentId}&from=dev`;
          }

          setDevNextUrl(nextUrl);
        } catch (error) {
          console.error('❌ [개발 모드] 콘텐츠 조회 실패:', error);
          setDevNextUrl(`/result/saju?orderId=${orderId}&contentId=${contentId}&from=dev`);
        }
      })();

      return;
    }

    const checkCompletion = async () => {
      try {
        console.log('🔍 주문 상태 확인 중...', { orderId, contentId });

        let query = supabase
          .from('orders')
          .select('ai_generation_completed, content_id, master_contents(content_type, category_main)');

        if (orderId) {
          query = query.eq('id', orderId);
        } else if (contentId) {
          query = query.eq('content_id', contentId);
        }

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

          // ⭐ 타로 결과 카드 이미지 프리로드 (AI 완료 직후)
          if (orderId) {
            try {
              console.log('🎴 [타로결과카드] 프리로딩 시작...');
              await preloadTarotImages(orderId, supabaseUrl);
              console.log('✅ [타로결과카드] 프리로딩 완료!');
            } catch (err) {
              console.error('❌ [타로결과카드] 프리로드 실패 (계속 진행):', err);
            }
          }

          // 프리로딩 완료 후 결과 페이지로 이동
          setTimeout(async () => {
            const finalContentId = data.content_id || contentId;
            const contentType = data.master_contents?.content_type;
            let categoryMain = data.master_contents?.category_main;

            if (!categoryMain && finalContentId) {
              const { data: contentData } = await supabase
                .from('master_contents')
                .select('category_main')
                .eq('id', finalContentId)
                .single();

              categoryMain = contentData?.category_main;
            }

            if (!finalContentId || !orderId) {
              console.error('❌ [플로우] contentId 또는 orderId 없음');
              navigate('/');
              return;
            }

            const { data: firstQuestion, error: firstQuestionError } = await supabase
              .from('order_results')
              .select('question_type, question_order, question_id, question_text')
              .eq('order_id', orderId)
              .eq('question_order', 1)
              .single();

            if (firstQuestionError || !firstQuestion) {
              console.error('❌ [플로우] 첫 번째 질문 조회 실패:', firstQuestionError);
              navigate('/');
              return;
            }

            if (firstQuestion.question_type === 'tarot') {
              const fromParam = from ? `&from=${from}` : '';
              navigate(`/tarot/shuffle?orderId=${orderId}&questionOrder=1${fromParam}`, {
                state: { preloadedQuestionText: firstQuestion.question_text }
              });
            } else {
              const fromParam = from ? `&from=${from}` : '';
              navigate(`/result?orderId=${orderId}&questionOrder=1&contentId=${finalContentId}${fromParam}`);
            }
          }, 1000);
        }
      } catch (err) {
        console.error('❌ 폴링 오류:', err);
      }
    };

    checkCompletion();
    const pollingInterval = setInterval(checkCompletion, 2000);

    return () => clearInterval(pollingInterval);
  }, [orderId, contentId, navigate]);

  // ⭐ iOS Safari 고스트 클릭 방지
  const isGhostClick = (): boolean => {
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < 500) {
      console.log('👻 [LoadingPage] 고스트 클릭 무시 (마운트 후', elapsed, 'ms)');
      return true;
    }
    return false;
  };

  // X 버튼 클릭
  const handleClose = () => {
    if (isGhostClick()) return;

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
    if (isGhostClick()) return;
    navigate('/');
  };

  // 다른 운세 보기
  const handleViewOther = () => {
    if (isGhostClick()) return;

    localStorage.setItem('homeFilter', JSON.stringify({
      category: contentCategory || '전체',
      contentType: 'all'
    }));
    console.log('🏠 [LoadingPage] 다른 운세 보기 클릭 - 홈 필터 설정:', { category: contentCategory || '전체' });
    navigate('/');
  };

  return (
    <div
      className="bg-white flex flex-col w-full max-w-[440px] mx-auto relative overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Top Navigation - Fixed */}
      <div className="bg-white relative shrink-0 w-full sticky top-0 z-20" style={{ height: '52px' }}>
        <div className="flex items-center justify-end h-full" style={{ padding: '0 12px' }}>
          <button
            onClick={handleClose}
            className="group flex items-center justify-center rounded-[12px] cursor-pointer transition-colors duration-200 active:bg-gray-100"
            style={{ width: '44px', height: '44px' }}
          >
            <X className="transition-transform duration-200 group-active:scale-90" strokeWidth={1.8} style={{ width: '24px', height: '24px', color: '#848484' }} />
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
        {/* Main Content Section */}
        <div className="flex flex-col items-start w-full" style={{ padding: '12px 20px 40px 20px' }}>
          <div className="flex flex-col items-start w-full" style={{ gap: '20px' }}>
            {/* 카카오톡 아이콘 */}
            <div
              className="flex items-center justify-center rounded-[16px]"
              style={{ backgroundColor: '#fee500', width: '44px', height: '44px' }}
            >
              <img src={kakaoIcon} alt="카카오톡" style={{ width: '20px', height: '18px' }} />
            </div>

            {/* 텍스트 & 프로그레스바 */}
            <div className="flex flex-col items-start w-full" style={{ gap: '20px' }}>
              {/* 텍스트 */}
              <div className="flex flex-col items-start w-full" style={{ gap: '6px', padding: '0 2px' }}>
                <p
                  className="w-full"
                  style={{
                    fontFamily: "'Pretendard Variable', sans-serif",
                    fontWeight: 600,
                    fontSize: '22px',
                    lineHeight: '32.5px',
                    letterSpacing: '-0.22px',
                    color: '#151515'
                  }}
                >
                  결과가 나오면 <span style={{ fontWeight: 700, color: '#41a09e' }}>알림톡</span> 보내드릴게요
                </p>
                <div className="flex items-center justify-center w-full" style={{ padding: '0 2px' }}>
                  <p
                    className="flex-1"
                    style={{
                      fontFamily: "'Pretendard Variable', sans-serif",
                      fontWeight: 400,
                      fontSize: '15px',
                      lineHeight: '20px',
                      letterSpacing: '-0.45px',
                      color: '#6d6d6d'
                    }}
                  >
                    정확한 해석을 위해 시간이 필요해요
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <ProgressBar isCompleted={isCompleted} />
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-full" style={{ height: '12px', backgroundColor: '#f9f9f9' }} />

        {/* 무료 콘텐츠 섹션 */}
        {freeContents.length > 0 && (
          <div className="flex flex-col items-center w-full" style={{ gap: '8px', padding: '36px 0' }}>
            {/* Section Title */}
            <div className="flex flex-col items-center w-full" style={{ gap: '12px', padding: '0 20px' }}>
              <div className="flex items-center justify-between w-full">
                <p
                  className="flex-1"
                  style={{
                    fontFamily: "'Pretendard Variable', sans-serif",
                    fontWeight: 600,
                    fontSize: '17px',
                    lineHeight: '24px',
                    letterSpacing: '-0.34px',
                    color: 'black'
                  }}
                >
                  기다리는 동안 무료 운세 보기
                </p>
              </div>
            </div>

            {/* Content List */}
            <div className="bg-white flex flex-col items-start w-full" style={{ padding: '0 20px' }}>
              <div className="flex flex-col items-start w-full" style={{ gap: '2px' }}>
                {freeContents.map((content, index) => (
                  <div key={content.id}>
                    {/* 구분선 (첫 번째 아이템 제외) */}
                    {index > 0 && (
                      <div className="w-full" style={{ height: '1px', backgroundColor: '#f9f9f9' }} />
                    )}

                    {/* Content Card */}
                    <button
                      onClick={() => navigate(`/free/content/${content.id}`)}
                      className="flex flex-col items-center justify-center rounded-[16px] w-full cursor-pointer"
                      style={{ height: '78px', padding: '12px 0' }}
                    >
                      <div className="flex items-start w-full" style={{ gap: '12px' }}>
                        {/* Thumbnail */}
                        <div
                          className="relative rounded-[12px] shrink-0 overflow-hidden"
                          style={{ height: '54px', width: '80px', border: '1px solid #f9f9f9' }}
                        >
                          {content.thumbnail_url ? (
                            <motion.img
                              src={content.thumbnail_url}
                              alt={content.title}
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-[12px]"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: loadedThumbnails.has(content.id) ? 1 : 0 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              onLoad={() => setLoadedThumbnails(prev => new Set(prev).add(content.id))}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: '#f3f3f3' }}
                            >
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#f3f3f3"/>
                                <path d="M8 10L12 6L16 10M8 14L12 18L16 14" stroke="#d4d4d4" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col items-start" style={{ gap: '1px' }}>
                          <div className="flex items-center justify-center w-full" style={{ padding: '0 2px' }}>
                            <p
                              className="flex-1 text-left"
                              style={{
                                fontFamily: "'Pretendard Variable', sans-serif",
                                fontWeight: 500,
                                fontSize: '15px',
                                lineHeight: '25.5px',
                                letterSpacing: '-0.3px',
                                color: 'black'
                              }}
                            >
                              {content.title}
                            </p>
                          </div>
                          <div
                            className="flex items-center justify-center rounded-[5px]"
                            style={{ backgroundColor: '#f9f9f9', padding: '2px 5px' }}
                          >
                            <p
                              className="shrink-0"
                              style={{
                                fontFamily: "'Pretendard Variable', sans-serif",
                                fontWeight: 500,
                                fontSize: '12px',
                                lineHeight: '16px',
                                letterSpacing: '-0.24px',
                                color: '#848484'
                              }}
                            >
                              무료 체험판
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons - Fixed */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-10" style={{ boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)' }}>
        <div className="bg-white" style={{ padding: '12px 20px' }}>
          {/* ⭐ [개발 모드] 다음으로 이동 버튼 */}
          {from === 'dev' && devNextUrl && (
            <div style={{ marginBottom: '12px' }}>
              <button
                onClick={() => {
                  navigate(`/tarot/shuffle?orderId=${orderId}&contentId=${contentId}&from=dev`);
                }}
                className="ml-auto w-fit flex items-center cursor-pointer select-none"
                style={{ padding: '8px 12px', gap: '4px' }}
              >
                <p
                  className="underline"
                  style={{
                    fontFamily: "'Pretendard Variable', sans-serif",
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '-0.28px',
                    color: '#ff4444'
                  }}
                >
                  [DEV] 풀이 화면으로 이동 →
                </p>
              </button>
            </div>
          )}

          <div className="flex" style={{ gap: '12px' }}>
            <button
              onClick={handleGoHome}
              className="flex-1 rounded-[16px] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform select-none"
              style={{ height: '56px', backgroundColor: '#f0f8f8' }}
            >
              <p
                style={{
                  fontFamily: "'Pretendard Variable', sans-serif",
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '25px',
                  letterSpacing: '-0.32px',
                  color: '#48b2af'
                }}
              >
                홈으로 가기
              </p>
            </button>
            <button
              onClick={handleViewOther}
              className="flex-1 rounded-[16px] flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform select-none"
              style={{ height: '56px', backgroundColor: '#48b2af' }}
            >
              <p
                style={{
                  fontFamily: "'Pretendard Variable', sans-serif",
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '25px',
                  letterSpacing: '-0.32px',
                  color: 'white'
                }}
              >
                다른 운세 보기
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
