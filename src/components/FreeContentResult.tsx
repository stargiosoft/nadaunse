/**
 * 무료 콘텐츠 결과 페이지
 * - 무료 콘텐츠 AI 생성 결과 표시
 * - 하단 '다음' 버튼으로 나다움 기록하기 페이지로 이동
 *
 * @author Figma Make
 * @since 2024-12-16
 * @updated 2026-01-28 - 나다움 기록하기 연결을 위한 '다음' 버튼 추가
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';
import svgPaths from "../imports/svg-z3xcg5m9wk";
import { ContentTags, isContentNew } from './ContentTags';
import type { MasterContent } from '../lib/freeContentService';

interface Question {
  question_text: string;
  answer_text: string;
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
  recommendedPaidContent?: MasterContent | null; // ⭐ 유료 추천 콘텐츠 1개
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
  onNext,
  recommendedPaidContent
}: FreeContentResultProps) {
  const navigate = useNavigate();

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

            {/* ⭐ 유료 추천 콘텐츠 카드 1개 */}
            {recommendedPaidContent && (
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

                {/* 대형 썸네일 카드 (홈 Featured Card 스타일) */}
                <div
                  onClick={() => navigate(`/product/${recommendedPaidContent.id}?from=free`)}
                  className="flex flex-col gap-[12px] items-start w-full cursor-pointer transition-all duration-150 ease-out active:bg-gray-50 rounded-[16px]"
                >
                  <div className="aspect-[350/220] pointer-events-none relative rounded-[16px] shrink-0 w-full" style={{ backgroundColor: '#f0f0f0' }}>
                    {recommendedPaidContent.thumbnail_url ? (
                      <img
                        alt={recommendedPaidContent.title}
                        className="absolute inset-0 object-cover rounded-[16px] size-full"
                        src={recommendedPaidContent.thumbnail_url}
                      />
                    ) : (
                      <div className="absolute inset-0 rounded-[16px] flex items-center justify-center">
                        <p style={{ fontSize: '14px', color: '#999' }}>이미지 없음</p>
                      </div>
                    )}
                    <div aria-hidden="true" className="absolute inset-[-1px] rounded-[17px] border border-[#f9f9f9]" />
                  </div>
                  <div className="flex flex-col gap-[4px] w-full">
                    <ContentTags
                      isPaid={true}
                      isNew={isContentNew((recommendedPaidContent as MasterContent & { created_at?: string }).created_at)}
                    />
                    <p style={{ fontSize: '16px', fontWeight: 500, lineHeight: '24px', letterSpacing: '-0.32px', color: '#000', fontFamily: 'Pretendard Variable' }} className="line-clamp-2 overflow-hidden">
                      {recommendedPaidContent.title}
                    </p>
                    <div className="flex items-center gap-[6px]">
                      {recommendedPaidContent.discount_rate > 0 && (
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef6878', fontFamily: 'Pretendard Variable' }}>
                          {recommendedPaidContent.discount_rate}%
                        </span>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#151515', fontFamily: 'Pretendard Variable' }}>
                        {recommendedPaidContent.price_discount.toLocaleString()}원
                      </span>
                      {recommendedPaidContent.discount_rate > 0 && (
                        <span style={{ fontSize: '13px', fontWeight: 400, color: '#999', textDecoration: 'line-through', fontFamily: 'Pretendard Variable' }}>
                          {recommendedPaidContent.price_original.toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
