/**
 * 유료 콘텐츠(마스터 콘텐츠) 전용 로딩 페이지
 * Figma import: /imports/로딩중443.tsx
 */

import svgPaths from "../imports/svg-v8aod9r8yu";
import imgGeminiGeneratedImageGmbs6Lgmbs6Lgmbs1 from "@/assets/35682d96407edc7fb5921d3d1b58f0b20b40da6e.png";
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ContentTags, isContentNew } from './ContentTags';

interface RecommendedContent {
  id: string;
  title: string;
  content_type: 'paid' | 'free';
  thumbnail_url: string | null;
  created_at: string;
}

interface MasterContentLoadingPageProps {
  name?: string;
}

export default function MasterContentLoadingPage({ name }: MasterContentLoadingPageProps) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(24);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [recommendedContents, setRecommendedContents] = useState<RecommendedContent[]>([]);
  const [readContentIds, setReadContentIds] = useState<Set<string>>(new Set());

  // ⭐️ AI 생성 완료 폴링
  useEffect(() => {
    const pendingOrderId = localStorage.getItem('pendingOrderId');
    
    if (!pendingOrderId) {
      console.error('❌ [로딩페이지] pendingOrderId가 없습니다!');
      setShowErrorModal(true);
      return;
    }

    console.log('🔄 [로딩페이지] AI 생성 완료 대기 시작:', pendingOrderId);

    let pollCount = 0;
    const maxPolls = 150; // 최대 5분 (2초 * 150)

    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`🔍 [로딩페이지] 폴링 ${pollCount}/${maxPolls}...`);

      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('ai_generation_completed, content_id')
          .eq('id', pendingOrderId)
          .single();

        if (error) {
          console.error('❌ [로딩페이지] 주문 조회 실패:', error);
          return;
        }

        console.log('📊 [로딩페이지] 주문 상태:', order);

        if (order?.ai_generation_completed) {
          console.log('✅ [로딩페이지] AI 생성 완료! 결과 페이지로 이동');
          clearInterval(pollInterval);
          
          // 프로그레스 100% 표시 후 이동
          setProgress(100);
          setTimeout(() => {
            navigate(`/product/${order.content_id}/result`);
          }, 500);
          return;
        }

        // 타임아웃 체크
        if (pollCount >= maxPolls) {
          console.error('❌ [로딩페이지] 타임아웃: AI 생성이 너무 오래 걸립니다');
          clearInterval(pollInterval);
          setShowErrorModal(true);
        }

      } catch (err) {
        console.error('❌ [로딩페이지] 폴링 오류:', err);
      }
    }, 2000); // 2초마다 체크

    return () => clearInterval(pollInterval);
  }, [navigate]);

  // 프로그레스 바 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // ⭐ 추천 콘텐츠 + 읽기 기록 fetch
  useEffect(() => {
    const fetchData = async () => {
      // 현재 콘텐츠 ID (제외용)
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      let currentContentId: string | null = null;
      if (pendingOrderId) {
        const { data } = await supabase
          .from('orders')
          .select('content_id')
          .eq('id', pendingOrderId)
          .single();
        if (data) currentContentId = data.content_id;
      }

      // 추천 콘텐츠 조회 (인기순, 최대 4개)
      let query = supabase
        .from('master_contents')
        .select('id, title, content_type, thumbnail_url, created_at')
        .eq('status', 'deployed')
        .order('weekly_clicks', { ascending: false })
        .limit(5);
      if (currentContentId) query = query.neq('id', currentContentId);
      const { data: contents } = await query;
      if (contents) setRecommendedContents(contents.slice(0, 4) as RecommendedContent[]);

      // 읽기 기록 조회
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const ids = new Set<string>();
      const { data: orders } = await supabase.from('orders').select('content_id').eq('user_id', userId).eq('success', true);
      if (orders) orders.forEach((o: { content_id: string | null }) => { if (o.content_id) ids.add(o.content_id); });
      const { data: freeRecords } = await supabase.from('free_content_records').select('content_id').eq('user_id', userId);
      if (freeRecords) freeRecords.forEach((r: { content_id: string | null }) => { if (r.content_id) ids.add(r.content_id); });
      setReadContentIds(ids);
    };
    fetchData();
  }, []);

  const handleClose = () => {
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewOtherFortune = () => {
    navigate('/');
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[390px] relative">
        {/* Top Navigation */}
        <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full max-w-[390px] z-10 bg-white">
          {/* Status Bar */}
          <div className="bg-white h-[47px] overflow-clip relative shrink-0 w-[390px]">
            <div className="absolute h-[30px] left-[103px] top-[-2px] w-[183px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 183 30">
                <g id="Notch">
                  <path d={svgPaths.pf91bfc0} fill="var(--fill-0, black)" id="Notch_2" />
                </g>
              </svg>
            </div>
            <div className="absolute h-[11.336px] right-[14.67px] top-[17.33px] w-[66.662px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 67 12">
                <g id="Right Side">
                  <g id="Battery">
                    <path d={svgPaths.p2d05aa80} id="Rectangle" opacity="0.35" stroke="var(--stroke-0, black)" />
                    <path d={svgPaths.p1fcfdd80} fill="var(--fill-0, black)" id="Combined Shape" opacity="0.4" />
                    <path d={svgPaths.p12636800} fill="var(--fill-0, black)" id="Rectangle_2" />
                  </g>
                  <path d={svgPaths.p10be8f00} fill="var(--fill-0, black)" id="Wifi" />
                  <path d={svgPaths.p3cc2d900} fill="var(--fill-0, black)" id="Mobile Signal" />
                </g>
              </svg>
            </div>
            <div className="absolute contents left-[21px] top-[12px]">
              <div className="absolute h-[21px] left-[21px] top-[12px] w-[54px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 54 21">
                  <g id="Time">
                    <g id="9:41">
                      <path d={svgPaths.p24372f50} fill="var(--fill-0, black)" />
                      <path d={svgPaths.p3aa84e00} fill="var(--fill-0, black)" />
                      <path d={svgPaths.p2e6b3780} fill="var(--fill-0, black)" />
                      <path d={svgPaths.p12b0b900} fill="var(--fill-0, black)" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="bg-white h-[52px] relative shrink-0 w-full">
            <div className="flex flex-col justify-center size-full">
              <div className="content-stretch flex flex-col items-start justify-center px-[12px] py-[4px] relative size-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="content-stretch flex items-center justify-center opacity-0 p-[4px] relative rounded-[12px] shrink-0 size-[44px]">
                    <div className="relative shrink-0 size-[24px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                        <g id="arrow-left">
                          <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  <p className="basis-0 grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                    풀이중...
                  </p>
                  <div 
                    onClick={handleClose}
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
        </div>

        {/* Main Content */}
        <div className="pt-[99px]">
          {/* Top Image Section */}
          <div className="content-stretch flex flex-col items-start w-full">
            <div className="aspect-[390/324] relative shrink-0 w-full">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute h-[165.13%] left-[-3.1%] max-w-none top-[-28.23%] w-[106.67%]" src={imgGeminiGeneratedImageGmbs6Lgmbs6Lgmbs1} />
              </div>
            </div>
            <div className="bg-[#f9f9f9] relative shrink-0 w-full border-b border-[#f3f3f3]">
              <div className="size-full">
                <div className="content-stretch flex flex-col items-start px-[20px] py-[32px] relative w-full">
                  <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 text-[#151515] w-full">
                      <p className="leading-[28.5px] min-w-full relative shrink-0 text-[16px] tracking-[-0.32px] w-[min-content]">정확한 해석을 위해 시간이 필요해요</p>
                      <p className="leading-[24px] relative shrink-0 text-[18px] tracking-[-0.36px] w-[310px]">
                        <span>결과가 나오면 </span>
                        <span className="text-[#48b2af] font-bold">알림톡 보내드릴게요</span>
                      </p>
                    </div>
                    <div className="relative shrink-0 w-full">
                      <div className="flex flex-row items-center size-full">
                        <div className="content-stretch flex gap-[16px] items-center px-[2px] py-0 relative w-full">
                          <div className="basis-0 grid-cols-[max-content] grid-rows-[max-content] grow inline-grid leading-[0] min-h-px min-w-px place-items-start relative shrink-0">
                            <div className="[grid-area:1_/_1] bg-[#e7e7e7] h-[14px] ml-0 mt-0 rounded-[999px] w-[298px]" />
                            <div 
                              className="[grid-area:1_/_1] bg-[#48b2af] h-[14px] ml-0 mt-0 rounded-[999px] transition-all duration-500" 
                              style={{ width: `${(progress / 100) * 298}px` }}
                            />
                          </div>
                          <p className="leading-[25.5px] relative shrink-0 text-[#6d6d6d] text-[15px] text-center text-nowrap tracking-[-0.3px]">{Math.round(progress)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Free Content Section */}
          <div className="content-stretch flex flex-col gap-[12px] items-start px-[20px] pt-[40px] pb-[120px] w-full">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                <p style={{ fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#000', fontFamily: 'Pretendard Variable' }}>기다리는 동안 무료 운세 보기</p>
              </div>
            </div>
            <div className="flex flex-col w-full">
              {recommendedContents.map((item) => {
                const isPaid = item.content_type === 'paid';
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="flex gap-[10px] items-start py-[10px] w-full cursor-pointer active:bg-gray-50 rounded-[12px]"
                  >
                    <div className="h-[54px] relative rounded-[12px] shrink-0 w-[80px]" style={{ backgroundColor: '#f0f0f0' }}>
                      {item.thumbnail_url && (
                        <img
                          alt={item.title}
                          className="absolute inset-0 object-cover rounded-[12px] size-full"
                          src={item.thumbnail_url}
                        />
                      )}
                      <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]" />
                    </div>
                    <div className="flex flex-col gap-[3px] grow min-w-0">
                      <ContentTags
                        isPaid={isPaid}
                        isNew={isContentNew(item.created_at)}
                        isRead={readContentIds.has(item.id)}
                      />
                      <p style={{ fontSize: '15px', fontWeight: 500, lineHeight: '23.5px', letterSpacing: '-0.3px', color: '#000', fontFamily: 'Pretendard Variable' }} className="line-clamp-1 overflow-hidden">
                        {item.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[390px] z-10">
          <div className="bg-white relative shrink-0 w-full">
            <div className="flex flex-col items-center justify-center size-full">
              <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                  <div 
                    onClick={handleGoHome}
                    className="basis-0 grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 bg-[#f0f8f8] cursor-pointer hover:bg-[#e0f0f0] transition-colors"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="leading-[25px] relative shrink-0 text-[#48b2af] text-[16px] text-nowrap tracking-[-0.32px]">홈으로 가기</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div 
                    onClick={handleViewOtherFortune}
                    className="basis-0 grow h-[56px] min-h-px min-w-px relative rounded-[16px] shrink-0 bg-[#48b2af] cursor-pointer hover:bg-[#3a9794] transition-colors"
                  >
                    <div className="flex flex-row items-center justify-center size-full">
                      <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                        <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                          <p className="leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">다른 운세 보기</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white h-[28px] relative shrink-0 w-full">
            <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" />
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowErrorModal(false)}>
          <div className="bg-white rounded-[20px] p-[28px] w-[320px] mx-[20px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-[20px]">
              <div className="flex flex-col gap-[8px]">
                <p className="text-[18px] text-black font-semibold text-center">결과를 찾을 수 없습니다</p>
                <p className="text-[14px] text-[#848484] text-center">
                  AI 답변 생성이 지연되고 있습니다.<br />
                  잠시 후 다시 확인해 주세요.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  navigate('/');
                }}
                className="bg-[#48b2af] text-white h-[48px] rounded-[12px] font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}