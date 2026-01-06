import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseUrl } from '../lib/supabase';
import ArrowLeft from './ArrowLeft';
import svgPathsEmpty from '../imports/svg-q49yf219uv';
import { preloadTarotImages } from '../lib/tarotImageCache'; // ⭐ 타로 캐시 추가

interface PurchaseItem {
  id: string;
  content_id: string;
  saju_record_id: string | null;
  paid_amount: number;
  created_at: string;
  pstatus: string;
  master_contents: {
    title: string;
    thumbnail_url: string | null;
    content_type: string;
  };
  saju_records: {
    full_name: string;
    birth_date: string;
  } | null;
}

interface GroupedPurchases {
  [date: string]: PurchaseItem[];
}

export default function PurchaseHistoryPage() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPurchaseHistory();
  }, []);

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);

      // ⭐️ UI TEST 모드 체크 (구매내역 페이지에서만 사용)
      const isUITestMode = localStorage.getItem('ui_test_mode') === 'true';
      
      if (isUITestMode) {
        console.log('⚡ [UI TEST] UI TEST 모드 감지 → 더미 구매내역 로드');
        
        // ⭐️ 플래그 즉시 제거 (일회성 동작)
        localStorage.removeItem('ui_test_mode');
        
        // 더미 구매내역 로드
        const devPurchases = localStorage.getItem('dev_purchase_records');
        if (devPurchases) {
          try {
            const parsedData = JSON.parse(devPurchases);
            console.log('✅ [UI TEST] 더미 구매내역 로드 완료:', parsedData.length, '건');
            setPurchases(parsedData);
            setLoading(false);
            return; // ⭐ 실제 API 호출 방지
          } catch (e) {
            console.error('❌ [UI TEST] 더미 데이터 파싱 실패:', e);
            // 파싱 실패 시 정상 플로우로 진행
          }
        }
      }

      // 🔍 localStorage 캐시 체크 (5분 유효)
      const cacheKey = 'purchase_history_cache';
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // 캐시가 5분 이내면 즉시 표시 (Optimistic UI)
        if (now - timestamp < fiveMinutes) {
          console.log('✅ 캐시에서 구매내역 로드');
          setPurchases(data);
          setLoading(false);
        }
      }

      // 🔄 백그라운드에서 최신 데이터 로드
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      console.log('🔍 구매내역 조회 시작 - User ID:', user.id);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          content_id,
          saju_record_id,
          paid_amount,
          created_at,
          pstatus,
          master_contents (
            title,
            thumbnail_url,
            content_type
          ),
          saju_records (
            full_name,
            birth_date
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('❌ 구매내역 조회 실패:', fetchError);
        setError('구매내역을 불러오는데 실패했습니다.');
        setLoading(false);
        return;
      }

      console.log('✅ 구매내역 조회 성공:', data);

      setPurchases(data || []);

      // 🔄 캐시 업데이트
      localStorage.setItem(cacheKey, JSON.stringify({
        data: data || [],
        timestamp: Date.now(),
      }));

      setLoading(false);

      // ⭐ 백그라운드에서 타로 이미지 프리로드 (완료 대기 없음)
      if (data && data.length > 0) {
        console.log('🎴 [구매내역] 백그라운드 타로 프리로드 시작...');
        
        // 완료된 주문만 필터링
        const completedOrders = data.filter((order: PurchaseItem) => 
          order.pstatus === 'completed'
        );
        
        // 각 주문의 타로 이미지 프리로드 (병렬 처리, 완료 대기 안함)
        completedOrders.forEach((order: PurchaseItem) => {
          preloadTarotImages(order.id, supabaseUrl).catch(err => {
            console.log(`⚠️ [구매내역] ${order.id} 타로 프리로드 실패 (무시):`, err);
          });
        });
        
        console.log(`✅ [구매내역] ${completedOrders.length}개 주문의 타로 프리로드 백그라운드 시작`);
      }
    } catch (err) {
      console.error('❌ 구매내역 로드 에러:', err);
      setError('구매내역을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  // 날짜별로 그룹핑 (Figma 시안: "2025.9.30" 형식)
  const groupByDate = (items: PurchaseItem[]): GroupedPurchases => {
    return items.reduce((acc, item) => {
      const date = new Date(item.created_at);
      const formattedDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
      
      if (!acc[formattedDate]) {
        acc[formattedDate] = [];
      }
      acc[formattedDate].push(item);
      return acc;
    }, {} as GroupedPurchases);
  };

  const groupedPurchases = groupByDate(purchases);

  const handleBackClick = () => {
    console.log('🔙 [구매내역] 뒤로가기 클릭');
    navigate('/profile'); // ⭐ 명시적으로 프로필로 이동 (히스토리 스택 문제 방지)
  };

  const handleViewPurchase = async (item: PurchaseItem) => {
    console.log('📦 운세 보기:', item);
    
    // 콘텐츠 타입에 따라 다른 페이지로 이동
    if (item.master_contents.content_type === 'free') {
      // 무료 콘텐츠는 무료 사주 결과 페이지로
      navigate(`/free-saju/${item.id}`);
    } else {
      // ⭐ 유료 콘텐츠: 사주 정보 입력 여부 & order_results 체크
      console.log('🔍 [구매내역] 유료 콘텐츠 상태 체크 시작:', item.id);
      
      try {
        // 1️⃣ 사주 정보 입력 여부 체크
        if (!item.saju_record_id) {
          // ❌ 사주 정보가 입력되지 않음 → 사주 선택/입력 페이지로
          console.log('❌ [구매내역] 사주 정보 미입력 → 사주 선택/입력 페이지로 이동');
          
          // 등록된 사주 정보가 있는지 확인
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: sajuRecords, error: sajuError } = await supabase
              .from('saju_records')
              .select('id')
              .eq('user_id', user.id);
            
            if (sajuError) {
              console.error('❌ [구매내역] 사주 정보 조회 실패:', sajuError);
              // 에러 시 사주 입력 페이지로 이동
              navigate(`/product/${item.content_id}/birthinfo?orderId=${item.id}`);
              return;
            }
            
            const hasSajuRecords = sajuRecords && sajuRecords.length > 0;
            console.log('📊 [구매내역] 등록된 사주 개수:', sajuRecords?.length || 0);
            
            if (hasSajuRecords) {
              // 등록된 사주 정보가 있으면 → 사주 선택 페이지로
              console.log('✅ [구매내역] 등록된 사주 있음 → 사주 선택 페이지로 이동');
              navigate(`/product/${item.content_id}/saju-select?orderId=${item.id}`);
            } else {
              // 등록된 사주 정보가 없으면 → 사주 입력 페이지로
              console.log('✅ [구매내역] 등록된 사주 없음 → 사주 입력 페이지로 이동');
              navigate(`/product/${item.content_id}/birthinfo?orderId=${item.id}`);
            }
          }
          return;
        }
        
        // 2️⃣ 사주 정보는 있음 → order_results 체크 (API call 완료 여부 확인)
        console.log('🔍 [구매내역] order_results 체크 시작:', item.id);
        
        // 전체 질문 개수 조회
        const { data: questionsData, error: questionsError } = await supabase
          .from('master_content_questions')
          .select('id')
          .eq('content_id', item.content_id);

        if (questionsError) {
          console.error('❌ [구매내역] 질문 개수 조회 실패:', questionsError);
          // 에러 시 일단 결과 페이지로 이동
          navigate(`/result/saju?orderId=${item.id}&contentId=${item.content_id}`);
          return;
        }

        const totalQuestions = questionsData?.length || 0;
        console.log(`📋 [구매내역] 전체 질문 개수: ${totalQuestions}`);

        // 생성 완료된 답변 개수 조회
        const { data: resultsData, error: resultsError } = await supabase
          .from('order_results')
          .select('id')
          .eq('order_id', item.id);

        if (resultsError) {
          console.error('❌ [구매내역] order_results 조회 실패:', resultsError);
        }

        const completedAnswers = resultsData?.length || 0;
        console.log(`📊 [구매내역] 완료된 답변 개수: ${completedAnswers} / ${totalQuestions}`);

        // 모든 질문에 답변이 완료되었는지 확인
        if (completedAnswers > 0 && completedAnswers >= totalQuestions) {
          // ✅ 모든 답변 완료 → 결과 페이지로 즉시 이동
          console.log('✅ [구매내역] 모든 답변 완료 → 결과 페이지로 즉시 이동');
          
          // ⭐ 타로 이미지 프리로드 (백그라운드 처리, 완료 대기 안함)
          preloadTarotImages(item.id, supabaseUrl).catch(err => {
            console.log('⚠️ [구매내역] 타로 프리로드 실패 (무시):', err);
          });
          
          // 즉시 결과 페이지로 이동 (히스토리에서 구매내역을 대체하여 뒤로가기 시 프로필로 이동)
          navigate(`/result/saju?orderId=${item.id}&contentId=${item.content_id}&from=purchase`, { replace: true });
        } else {
          // ⚠️ 아직 생성 중 → 로딩 페이지로 이동
          console.log(`⚠️ [구매내역] 아직 생성 중 (${completedAnswers}/${totalQuestions}) → 로딩 페이지로 이동`);
          navigate(`/loading?orderId=${item.id}&contentId=${item.content_id}&from=purchase`);
        }
      } catch (error) {
        console.error('❌ [구매내역] order_results 체크 에러:', error);
        // 에러 시 일단 결과 페이지로 이동 (결과 페이지에서 다시 체크)
        navigate(`/result/saju?orderId=${item.id}&contentId=${item.content_id}&from=purchase`);
      }
    }
  };

  // 날짜 포맷: "2025.09.30 (14:33)"
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} (${hours}:${minutes})`;
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#48b2af] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-white flex flex-col w-full max-w-[440px] mx-auto overflow-hidden">
      {/* Top Navigation - 스테이터스바 제거 */}
      <div className="bg-white h-[52px] relative shrink-0 w-full sticky top-0 z-10">
        <div className="flex flex-col justify-center size-full">
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] h-[52px] z-50 bg-white flex flex-col items-start justify-center px-[12px] py-[4px]">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <ArrowLeft onClick={handleBackClick} />
              <p className="basis-0 font-semibold grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                구매 내역
              </p>
              <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 w-full safe-area-bottom ${purchases.length === 0 ? 'overflow-hidden flex flex-col items-center justify-center' : 'overflow-y-auto pb-[60px]'}`}>
        {purchases.length === 0 ? (
          // Empty State - Figma 시안 적용
          <motion.div 
            className="flex flex-col gap-[28px] items-center w-full px-[20px]"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            {/* Icon */}
            <motion.div 
              className="relative shrink-0 size-[76px]"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
            >
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 76 76">
                <g>
                  <path d={svgPathsEmpty.p17261880} fill="#E4F7F7" />
                </g>
              </svg>
              <div className="absolute aspect-[24/24] left-[13.16%] overflow-clip right-[13.16%] top-[9px]">
                <div className="absolute inset-[29.5%_21.97%_8.33%_8.33%]">
                  <div className="absolute inset-0">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 35">
                      <path d={svgPathsEmpty.p2a521a80} fill="#48B2AF" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-[8.33%_8.34%_29.16%_33.33%]">
                  <div className="absolute inset-0">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 33 35">
                      <path d={svgPathsEmpty.p58a5d00} fill="#48B2AF" opacity="0.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Text */}
            <motion.div 
              className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
            >
              <div className="flex flex-col font-semibold justify-center leading-[0] relative shrink-0 text-[24px] text-black text-center tracking-[-0.48px] w-full">
                <p className="leading-[35.5px]">아직 구매한 운세가 없어요</p>
              </div>
              <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full">
                <div className="font-normal leading-[28.5px] relative shrink-0 text-[#6d6d6d] text-[16px] text-center text-nowrap tracking-[-0.32px]">
                  <p className="mb-0">구매한 운세는 이곳에서</p>
                  <p>다시 확인할 수 있어요</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // Purchase List - Figma 시안 적용
          <motion.div 
            className="flex flex-col pt-[14px]"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
            {Object.entries(groupedPurchases).map(([date, items], index, arr) => (
              <div key={date}>
                {/* Date Group with Padding */}
                <motion.div 
                  className="px-[20px]"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        duration: 0.5,
                        ease: "easeOut"
                      }
                    }
                  }}
                >
                  <div className="flex flex-col gap-[16px]">
                    {/* Date Divider */}
                    <div className="content-stretch flex flex-col gap-[6px] items-center relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
                        <p className="basis-0 font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[18px] text-black tracking-[-0.34px]">
                          {date}
                        </p>
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-0.5px_0]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                            <path d="M0 0.5H350" stroke="#F3F3F3" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Cards */}
                    {items.map((item) => (
                      <div key={item.id} className="bg-white relative shrink-0 w-full">
                        <div className="flex flex-col items-end size-full">
                          <div className="content-stretch flex flex-col items-end relative w-full">
                            <div className="content-stretch flex gap-[14px] items-start relative shrink-0 w-full pb-[8px]">
                              {/* Thumbnail */}
                              <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px] bg-gray-100">
                                {item.master_contents.thumbnail_url ? (
                                  <>
                                    <img
                                      alt={item.master_contents.title}
                                      className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full"
                                      src={item.master_contents.thumbnail_url}
                                    />
                                    <div className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
                                  </>
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center rounded-[12px]">
                                    <span className="text-[24px]">🔮</span>
                                  </div>
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px relative shrink-0">
                                <div className="relative shrink-0 w-full">
                                  <div className="size-full">
                                    <div className="content-stretch flex flex-col gap-[6px] items-start px-[2px] py-0 relative w-full">
                                      {/* Title & Price */}
                                      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                                        <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0 w-full">
                                          <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                                            <div className="relative shrink-0 w-full">
                                              <div className="size-full">
                                                <div className="content-stretch flex flex-col items-start px-px py-0 relative w-full">
                                                  <p className="font-medium leading-[22px] relative shrink-0 text-[14px] text-black tracking-[-0.42px] w-full line-clamp-2">
                                                    {item.master_contents.title}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <p className="-mt-[4px] pl-[1px] font-semibold leading-[20px] relative shrink-0 text-[15px] text-black tracking-[-0.42px] w-full">
                                          {item.paid_amount.toLocaleString()}원
                                        </p>
                                      </div>

                                      {/* Additional Info */}
                                      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                                        {item.saju_records && (
                                          <div className="relative shrink-0 w-full">
                                            <div className="flex flex-row items-center size-full">
                                              <div className="content-stretch flex items-center px-[2px] py-0 relative w-full">
                                                <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[#848484] text-[12px] pl-[1px] text-nowrap tracking-[-0.24px]">
                                                  풀이 대상 : {item.saju_records.full_name} ({item.saju_records.birth_date})
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        <div className="relative shrink-0 w-full">
                                          <div className="flex flex-row items-center size-full">
                                            <div className="content-stretch flex items-center px-[2px] py-0 relative w-full">
                                              <p className="basis-0 font-normal grow leading-[16px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[#848484] text-[12px] pl-[1px] text-nowrap tracking-[-0.24px]">
                                                구매 일시 : {formatDateTime(item.created_at)}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* View Button */}
                                <div className="content-stretch flex gap-[5px] items-start relative shrink-0 w-full">
                                  <motion.button
                                    onClick={() => handleViewPurchase(item)}
                                    className="basis-0 grow h-[38px] min-h-px min-w-px relative rounded-[12px] shrink-0 border border-[#e7e7e7] border-solid hover:bg-gray-50 transition-colors"
                                    animate={{ backgroundColor: '#ffffff' }}
                                    whileTap={{ backgroundColor: '#f3f4f6' }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <div className="flex flex-row items-center justify-center size-full">
                                      <motion.div 
                                        className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full"
                                        whileTap={{ scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                      >
                                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                                          <p className="font-medium leading-[20px] relative shrink-0 text-[#525252] text-[14px] text-nowrap tracking-[-0.42px]">
                                            운세 보기
                                          </p>
                                        </div>
                                      </motion.div>
                                    </div>
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
                
                {/* Full-width Divider between date groups (outside padding container) */}
                {index < arr.length - 1 && (
                  <div className="w-full h-[12px] bg-[#F9F9F9] mt-[36px] mb-[32px]" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Home Indicator */}

    </div>
  );
}