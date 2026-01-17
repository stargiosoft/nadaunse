/**
 * 무료 콘텐츠 결과 페이지
 * Figma 디자인 시안 기반 (390-238-3546), DB 연동
 */

import { ArrowLeft, Home } from 'lucide-react';
import svgPaths from "../imports/svg-z3xcg5m9wk";

interface Question {
  id: string;
  question_text: string;
  preview_text: string;
}

interface FreeContentResultProps {
  contentTitle: string;
  questions: Question[];
  onBack: () => void;
  onHome: () => void;
  onPurchase?: () => void;
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

// 홈 인디케이터
function HomeIndicator() {
  return (
    <div className="bg-white h-[28px] relative shrink-0 w-full">
      <div className="absolute bg-black bottom-[8px] h-[5px] left-1/2 rounded-[100px] translate-x-[-50%] w-[134px]" />
    </div>
  );
}

export default function FreeContentResult({
  contentTitle,
  questions,
  onBack,
  onHome,
  onPurchase
}: FreeContentResultProps) {
  // 첫 3개는 카드로 표시
  const cardQuestions = questions.slice(0, 3);
  // 나머지는 리스트로 표시
  const listQuestions = questions.slice(3);

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[390px] relative">
        {/* Top Navigation */}
        <div className="fixed content-stretch flex flex-col items-start left-1/2 -translate-x-1/2 top-0 w-full max-w-[390px] z-10 bg-white">
          <div className="bg-white h-[52px] relative shrink-0 w-full">
            <div className="flex flex-col justify-center size-full">
              <div className="box-border content-stretch flex flex-col gap-[10px] h-[52px] items-start justify-center px-[12px] py-[4px] relative w-full">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div 
                    onClick={onBack}
                    className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-6 h-6 text-[#848484]" />
                  </div>
                  <p className="basis-0 grow leading-[25.5px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-black text-center text-nowrap tracking-[-0.36px]">
                    {contentTitle}
                  </p>
                  <div 
                    onClick={onHome}
                    className="box-border content-stretch flex gap-[10px] items-center justify-center p-[4px] relative rounded-[12px] shrink-0 size-[44px] cursor-pointer hover:bg-gray-100"
                  >
                    <Home className="w-6 h-6 text-[#848484]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-[52px] pb-[120px]">
          {/* 상단 안내 문구 */}
          <div className="relative shrink-0 w-full">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex items-center justify-center pb-[20px] pt-[32px] px-[20px] relative w-full">
                <p className="basis-0 grow leading-[25.5px] min-h-px min-w-px relative shrink-0 text-[17px] text-black text-center tracking-[-0.34px]">
                  아래는 일부 예시 해석입니다
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full" />

          {/* 카드 질문 리스트 (01, 02, 03) */}
          <div className="content-stretch flex flex-col gap-[48px] items-center relative shrink-0 w-full px-[20px] mt-[40px]">
            {cardQuestions.map((question, index) => (
              <div key={question.id} className="w-full">
                {/* Answer Preview Card - Figma 구조 정확히 따름 */}
                <div className={`${index === 2 ? 'h-[441px]' : 'h-[293px]'} relative shrink-0 w-full`}>
                  {/* 카드 내용 컨테이너 */}
                  <div className="absolute content-stretch flex flex-col inset-0 items-start">
                    {/* 질문 제목 */}
                    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 grow leading-[28.5px] min-h-px min-w-px relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                            {String(index + 1).padStart(2, '0')}. {question.question_text}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 답변 카드 배경 */}
                    <div className={`bg-[#f9f9f9] ${index === 2 ? 'h-[400px]' : 'h-[252px]'} relative rounded-[12px] shrink-0 w-full`}>
                      <div className="size-full">
                        <div className="content-stretch flex items-start px-[20px] py-[16px] relative size-full">
                          <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                            {/* [맛보기] 라벨 */}
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                              <p className="leading-[25.5px] relative shrink-0 text-[#151515] text-[15px] tracking-[-0.3px] w-full">
                                [맛보기]
                              </p>
                            </div>
                            {/* 답변 텍스트 */}
                            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                              <p className="font-normal leading-[25.5px] relative shrink-0 text-[#525252] text-[15px] tracking-[-0.3px] w-full">
                                {question.preview_text}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* "여기까지만 공개돼요" 오버레이 - Figma inset 정확히 사용 */}
                  <div className={`absolute bg-[#f9f9f9] content-stretch flex flex-col ${index === 2 ? 'inset-[calc(100%-57px)_0_0_0]' : 'inset-[80.55%_0_0_0]'} items-center justify-center p-[16px] rounded-bl-[16px] rounded-br-[16px]`}>
                    <div aria-hidden="true" className="absolute border-[#f3f3f3] border-[1px_0px_0px] border-solid inset-0 pointer-events-none rounded-bl-[16px] rounded-br-[16px] shadow-[0px_-26px_26px_0px_#f9f9f9]" />
                    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 z-10">
                      <Icons />
                      <div className="content-stretch flex flex-col items-center justify-center relative shrink-0">
                        <div className="content-stretch flex items-center justify-center pb-0 pt-[3px] px-0 relative shrink-0">
                          <p className="leading-[22px] relative shrink-0 text-[#41a09e] text-[14px] text-nowrap tracking-[-0.42px]">
                            여기까지만 공개돼요
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                {index < cardQuestions.length - 1 && (
                  <div className="h-0 relative shrink-0 w-full my-[48px]">
                    <div className="absolute inset-[-0.5px_0]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 390 1">
                        <path d="M0 0.5H390" stroke="#F3F3F3" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 나머지 질문 리스트 (04~) */}
          {listQuestions.length > 0 && (
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full px-[20px] mt-[48px]">
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                {listQuestions.map((question, idx) => (
                  <div key={question.id}>
                    {/* 리스트 아이템 */}
                    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                      <Icons />
                      <div className="basis-0 content-stretch flex grow items-center min-h-px min-w-px pb-0 pt-[3px] px-0 relative shrink-0">
                        <p className="basis-0 font-normal grow leading-[28.5px] min-h-px min-w-px relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                          {String(idx + 4).padStart(2, '0')}. {question.question_text}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    {idx < listQuestions.length - 1 && (
                      <div className="h-0 relative shrink-0 w-full my-[12px]">
                        <div className="absolute inset-[-0.5px_0]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 1">
                            <path d="M0 0.5H350" stroke="#F3F3F3" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="bg-[#f9f9f9] h-[12px] shrink-0 w-full mt-[48px]" />

          {/* 하단 안내 문구 */}
          <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[16px] py-[12px] relative rounded-[12px] shrink-0 mx-[20px] mt-[40px]">
            <div aria-hidden="true" className="absolute border border-[#7ed4d2] border-solid inset-0 pointer-events-none rounded-[12px]" />
            <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
              <p className="leading-[25.5px] relative shrink-0 text-[#41a09e] text-[15px] text-center tracking-[-0.3px] w-full">
                더 깊은 풀이는 구매 후 확인할 수 있습니다
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[390px] z-10">
          <div className="bg-white relative shrink-0 w-full">
            <div className="flex flex-col items-center justify-center size-full">
              <div className="content-stretch flex flex-col items-center justify-center px-[20px] py-[12px] relative w-full">
                <div 
                  onClick={onPurchase}
                  className="bg-[#48b2af] h-[56px] relative rounded-[16px] shrink-0 w-full cursor-pointer hover:bg-[#3a9794] transition-colors"
                >
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="content-stretch flex h-[56px] items-center justify-center px-[12px] py-0 relative w-full">
                      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                        <p className="leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">
                          구매하기
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <HomeIndicator />
        </div>
      </div>
    </div>
  );
}
