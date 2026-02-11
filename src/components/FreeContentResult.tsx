/**
 * 무료 콘텐츠 결과 페이지
 * - 무료 콘텐츠 AI 생성 결과 표시
 * - 하단 '다음' 버튼으로 나다움 기록하기 페이지로 이동
 *
 * @author Figma Make
 * @since 2024-12-16
 * @updated 2026-01-28 - 나다움 기록하기 연결을 위한 '다음' 버튼 추가
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';
import svgPaths from "../imports/svg-z3xcg5m9wk";
import { supabase } from '../lib/supabase';
import { ContentTags, isContentNew } from './ContentTags';

interface Question {
  question_text: string;
  answer_text: string;
}

interface RecommendedContent {
  id: string;
  title: string;
  content_type: 'paid' | 'free';
  thumbnail_url: string | null;
  created_at: string;
}

interface FreeContentResultProps {
  contentId: string;
  contentTitle: string;
  contentThumbnail?: string;
  questions: string[] | Question[];
  onBack: () => void;
  onHome: () => void;
  onPurchase?: () => void;
  onNext?: () => void; // 나다움 기록하기로 이동
}

// 아이콘 컴포넌트
function Icons() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g>
          <path d={svgPaths.p21158a00} fill="#A0D2D1" />
          <path d={svgPaths.p1662d200} fill="#48B2AF" />
          <path d={svgPaths.p1c098700} fill="#8BD4D2" />
        </g>
      </svg>
    </div>
  );
}

export default function FreeContentResult({
  contentId,
  contentTitle,
  contentThumbnail,
  questions,
  onBack,
  onHome,
  onPurchase,
  onNext
}: FreeContentResultProps) {
  const navigate = useNavigate();
  const [recommendedContents, setRecommendedContents] = useState<RecommendedContent[]>([]);
  const [readContentIds, setReadContentIds] = useState<Set<string>>(new Set());

  // ⭐ 추천 콘텐츠 + 읽기 기록 fetch
  useEffect(() => {
    const fetchData = async () => {
      // 추천 콘텐츠 조회 (인기순, 최대 4개, 현재 콘텐츠 제외)
      const { data: contents } = await supabase
        .from('master_contents')
        .select('id, title, content_type, thumbnail_url, created_at')
        .eq('status', 'deployed')
        .neq('id', contentId)
        .order('weekly_clicks', { ascending: false })
        .limit(4);
      if (contents) setRecommendedContents(contents as RecommendedContent[]);

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
  }, [contentId]);

  // questions가 string[]인 경우와 Question[]인 경우 모두 처리
  const normalizedQuestions = questions.map((q, idx) => {
    if (typeof q === 'string') {
      return {
        question_text: `Q${idx + 1}`,
        answer_text: q
      };
    }
    return {
      question_text: q.question_text,
      answer_text: q.answer_text
    };
  });

  return (
    <div className="bg-white fixed inset-0 flex flex-col w-full">
      <div className="w-full max-w-[440px] mx-auto flex flex-col h-full relative">
        {/* Top Navigation */}
        <div className="sticky top-0 flex flex-col w-full z-10 bg-white">
          <div className="bg-white h-[52px] relative shrink-0 w-full">
            <div className="flex flex-col justify-center size-full">
              <div className="box-border flex flex-col gap-[10px] h-[52px] justify-center px-[12px] py-[4px] relative w-full">
                <div className="flex items-center justify-between relative shrink-0 w-full">
                  <div
                    onClick={onBack}
                    className="box-border flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer hover:bg-gray-100 active:bg-gray-100"
                  >
                    <ArrowLeft className="w-6 h-6 text-[#848484]" />
                  </div>
                  <p
                    className="basis-0 grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-center text-nowrap"
                    style={{
                      fontFamily: 'Pretendard Variable',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: '#000000',
                      letterSpacing: '-0.36px'
                    }}
                  >
                    상세 풀이
                  </p>
                  <div
                    onClick={onHome}
                    className="box-border flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer hover:bg-gray-100 active:bg-gray-100"
                  >
                    <Home className="w-6 h-6 text-[#848484]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* 상단 콘텐츠 정보 */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[#f9f9f9]">
            {contentThumbnail && (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img
                  src={contentThumbnail}
                  alt={contentTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <ContentTags isPaid={false} isNew={false} isRead={true} />
              <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 500,
                fontSize: '15px',
                color: '#151515',
                letterSpacing: '-0.3px'
              }}>
                {contentTitle}
              </p>
            </div>
          </div>

          {/* 질문 및 답변 리스트 */}
          <div className="flex flex-col gap-8 px-5 py-8" style={{ paddingBottom: '180px' }}>
            {normalizedQuestions.map((question, index) => (
              <div key={index} className="flex flex-col gap-3">
                {/* 질문 번호 및 텍스트 */}
                <div className="flex items-start gap-2">
                  <span style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 600,
                    fontSize: '15px',
                    color: '#41a09e',
                    minWidth: '24px'
                  }}>
                    Q{index + 1}
                  </span>
                  <p style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 500,
                    fontSize: '15px',
                    color: '#151515',
                    lineHeight: '24px',
                    letterSpacing: '-0.3px'
                  }}>
                    {question.question_text}
                  </p>
                </div>

                {/* 답변 카드 */}
                <div className="bg-[#f9f9f9] rounded-xl p-4">
                  <p style={{
                    fontFamily: 'Pretendard Variable',
                    fontWeight: 400,
                    fontSize: '15px',
                    color: '#525252',
                    lineHeight: '25.5px',
                    letterSpacing: '-0.3px'
                  }}>
                    {question.answer_text}
                  </p>
                </div>

                {/* Divider */}
                {index < normalizedQuestions.length - 1 && (
                  <div className="h-px bg-[#f3f3f3] mt-4" />
                )}
              </div>
            ))}

            {/* 추천 콘텐츠 섹션 (이런 운세는 어때요?) */}
            <div className="mt-4">
              <div className="bg-[#f9f9f9] h-3 -mx-5 mb-8" />

              <p style={{
                fontFamily: 'Pretendard Variable',
                fontWeight: 600,
                fontSize: '16px',
                color: '#151515',
                marginBottom: '16px'
              }}>
                이런 운세는 어때요?
              </p>

              {/* 추천 콘텐츠 카드 리스트 */}
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
        </div>

        {/* Bottom Fixed Button - '다음' 버튼 */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-white"
          style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}
        >
          <div className="flex flex-col items-center justify-center px-5 py-3 pb-8">
            <Button
              onClick={onNext}
              className="w-full h-14 rounded-2xl transition-all active:scale-[0.99]"
              style={{
                backgroundColor: '#48b2af',
                fontFamily: 'Pretendard Variable',
                fontWeight: 500,
                fontSize: '16px',
                color: '#ffffff',
                letterSpacing: '-0.32px'
              }}
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
