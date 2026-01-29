/**
 * 무료 콘텐츠 결과 페이지
 * - 무료 콘텐츠 AI 생성 결과 표시
 * - 하단 '다음' 버튼으로 나다움 기록하기 페이지로 이동
 *
 * @author Figma Make
 * @since 2024-12-16
 * @updated 2026-01-28 - 나다움 기록하기 연결을 위한 '다음' 버튼 추가
 */

import { ArrowLeft, Home } from 'lucide-react';
import { Button } from './ui/button';
import svgPaths from "../imports/svg-z3xcg5m9wk";

interface Question {
  question_text: string;
  answer_text: string;
}

interface FreeContentResultProps {
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
  contentTitle,
  contentThumbnail,
  questions,
  onBack,
  onHome,
  onPurchase,
  onNext
}: FreeContentResultProps) {
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
              <span
                className="px-2 py-0.5 rounded-full w-fit"
                style={{
                  backgroundColor: '#e8f5f4',
                  fontFamily: 'Pretendard Variable',
                  fontWeight: 500,
                  fontSize: '12px',
                  color: '#41a09e'
                }}
              >
                무료 체험판
              </span>
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

              {/* 추천 콘텐츠 카드들은 여기에 추가 가능 */}
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
