import React, { useState } from 'react';
import svgPaths from "@/imports/svg-cxwdyqr8rc";
import cloverSvgPaths from "@/imports/svg-8dky997t82";
import { motion } from 'motion/react';
import ReportWeeklyMemo from '@/components/ReportWeeklyMemo';

// --- Icons & Graphics ---

function GroupIcon() {
  return (
    <div className="absolute" style={{ inset: '6.25% 6.1% 6.16% 6.25%' }} data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.0614 35.0358">
        <g id="Group">
          <path d={svgPaths.p194c330} fill="#FCD53F" id="Vector" />
          <path d={svgPaths.p15556900} fill="#F8312F" id="Vector_2" />
          <path d={svgPaths.p54cab00} fill="#F4F4F4" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

function PillIcon() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: '40px', height: '40px' }} data-name="fluent-emoji-flat:pill">
      <GroupIcon />
    </div>
  );
}

function CloverIcon() {
  return (
    <div className="overflow-clip relative shrink-0" style={{ width: '24px', height: '24px' }}>
      <div className="absolute" style={{ inset: '3.57% 14.28% 2.72% 10.71%' }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0001 22.4892">
          <g id="Group 427318845">
            <path d={cloverSvgPaths.p3dbd0a40} fill="#6AC9C6" id="Vector" />
            <g id="Group">
              <path d={cloverSvgPaths.p7e14af0} fill="#6AC9C6" id="Vector_2" />
              <path d={cloverSvgPaths.p27410100} fill="#7ED4D2" id="Vector_3" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
     <div className="absolute inset-0">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path d={svgPaths.p2a5cd480} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
      </svg>
    </div>
  );
}

function SettingsIcon() {
  return (
     <div className="absolute inset-0">
      <svg className="block size-full" fill="none" viewBox="0 0 24 24">
        <path d={svgPaths.p3cccb600} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
        <path d={svgPaths.p185ecc80} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// --- Components ---

function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full z-10" style={{ height: '52px' }}>
      <div className="flex flex-col justify-center size-full">
        <div className="flex items-center justify-between relative size-full" style={{ padding: '4px 12px' }}>
           {/* Left Action */}
           <button
             onClick={onBack}
             className="flex items-center justify-center relative shrink-0 active:bg-gray-100 transition-colors"
             style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}
           >
             <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
               <ArrowLeftIcon />
             </div>
           </button>

           {/* Title */}
           <p className="flex-1 text-center truncate" style={{
             fontFamily: 'Pretendard Variable',
             fontWeight: 600,
             fontSize: '18px',
             lineHeight: '25.5px',
             color: '#000000',
             letterSpacing: '-0.36px'
           }}>
             이번 주 보고서
           </p>

           {/* Right Action (Placeholder) */}
           <div className="flex items-center justify-center relative shrink-0 opacity-0" style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }}>
             <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
               <SettingsIcon />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function PrescriptionCard() {
  return (
    <div className="relative shrink-0 w-full" style={{ borderRadius: '16px', backgroundColor: '#f9f9f9' }}>
      <div className="flex justify-center w-full" style={{ padding: '28px 20px' }}>
        <div className="flex flex-col items-start relative w-full" style={{ gap: '20px' }}>

          {/* Icon & Title Group */}
          <div className="flex flex-col items-start relative w-full" style={{ gap: '8px' }}>
             <PillIcon />
             <div className="flex flex-col items-start relative w-full">
               <p style={{
                 fontFamily: 'Pretendard Variable',
                 fontWeight: 600,
                 fontSize: '18px',
                 lineHeight: '25.5px',
                 color: '#151515',
                 letterSpacing: '-0.36px',
                 marginTop: '12px'
               }}>마음 처방</p>
             </div>

             {/* Text Content */}
             <div style={{
               fontFamily: 'Pretendard Variable',
               fontWeight: 400,
               fontSize: '16px',
               lineHeight: '28.5px',
               color: '#151515',
               letterSpacing: '-0.32px',
               width: '100%'
             }}>
                <p className="mb-0">지금 힘든 건 당신이 덜 난 사람이어서가 아니라 타고난 예민함과 관계에 민감한 시기가 겹쳤기 때문이에요. 일과 재물 쪽 에너지는 강한데 정작 내 마음을 돌보는 시간은 부족해서 쉽게 소진되기 쉬운 구조예요. 그래서 작은 말에도 '나만 빼고 친한가'라는 생각이 과장되어 느껴지는 거예요.</p>
                <p className="mb-0">&nbsp;</p>
                <p className="mb-0">당신다움은 빠른 이해력과 말로 풀어내는 능력, 그리고 상황을 냉정하게 읽는 분별력이에요. 이 힘 덕분에 일에서는 성과를 내고 돈 흐름도 잘 볼 수 있어요. 조급함과 갈등은 이 강점의 부작용일 뿐이에요. 스스로에게 적용하는 기준을 조금만 느슨하게 하면 같은 기질이 '민감한 문제 해결가'라는 장점으로 바뀔 수 있어요.</p>
                <p className="mb-0">&nbsp;</p>
                <p className="mb-0">올해와 내년 흐름은 일과 연애 운이 함께 살아나는 시기예요. 특히 2025년과 2026년에는 능력 인정과 관계 확장의 기회가 커져요. '나는 맨날 겉돈다'는 생각보다 '이제 내 자리를 찾아가는 중'이라고 보는 편이 실제 운세와도 더 잘 맞아요.</p>
                <p className="mb-0">&nbsp;</p>
                <p>앞으로는 타인의 기준을 따라붙는 삶보다 '나는 어떤 관계에서 편안한가'를 먼저 묻는 태도가 중요해요. 당신 사주는 안정적이면서도 서로를 존중해 주는 성숙한 관계에서 가장 빛나요. 조급하게 아무 관계나 붙잡기보다 나를 지키는 선을 연습할수록 곧 들어올 좋은 흐름을 더 편안하게 맞이할 수 있어요.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function GoalItem({ text }: { text: string }) {
  return (
    <div className="relative shrink-0 w-full" style={{ backgroundColor: '#f8f8f8', borderRadius: '16px' }}>
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center relative w-full" style={{ padding: '20px 24px', gap: '10px' }}>
          <CloverIcon />
          <div className="flex flex-col justify-center relative shrink-0 text-black" style={{ fontSize: '15px', letterSpacing: '-0.3px' }}>
            <p className="leading-[25.5px] font-normal" style={{ fontFamily: 'Pretendard Variable' }}>{text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsSection() {
  const goals = [
    "오늘 있었던 서운함을 한 줄로 적어보기",
    "카톡 보내기 전 숨 고르고 3초 세기",
    "하루 5분, 내 마음 상태를 단어로 쓰기"
  ];

  return (
    <div className="flex flex-col items-center w-full pb-0" style={{ paddingTop: '32px' }}>
       {/* Title */}
       <div className="flex items-center justify-center w-full pb-0" style={{ padding: '0 20px' }}>
         <p className="text-center" style={{
           fontFamily: 'Pretendard Variable',
           fontWeight: 600,
           fontSize: '17px',
           lineHeight: '24px',
           color: '#000000',
           letterSpacing: '-0.34px'
         }}>행운을 잡기 위한 다음주 작은 목표</p>
       </div>

       {/* List */}
       <div className="w-full pb-0" style={{ padding: '16px 28px 0 28px' }}>
         <motion.div
           className="flex flex-col w-full"
           style={{ gap: '10px' }}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, amount: 0.2 }}
           variants={{
             hidden: {},
             visible: {
               transition: {
                 staggerChildren: 0.2
               }
             }
           }}
         >
           {goals.map((goal, i) => (
             <motion.div
               key={i}
               variants={{
                 hidden: { opacity: 0, y: 30 },
                 visible: {
                   opacity: 1,
                   y: 0,
                   transition: {
                     duration: 0.6,
                     ease: [0.22, 1, 0.36, 1]
                   }
                 }
               }}
             >
               <GoalItem text={goal} />
             </motion.div>
           ))}
         </motion.div>
       </div>
    </div>
  );
}

function BottomButtons({ onPrev, onNext }: { onPrev?: () => void, onNext?: () => void }) {
  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
            {/* Prev Button */}
            <button
              onClick={onPrev}
              className="flex-1 flex items-center justify-center relative cursor-pointer transition active:scale-[0.99] active:!bg-[#E4F7F7]"
              style={{ borderRadius: '16px', backgroundColor: '#f0f8f8', height: '56px' }}
            >
               <p style={{
                 fontFamily: 'Pretendard Variable',
                 fontWeight: 500,
                 fontSize: '16px',
                 lineHeight: '25px',
                 color: '#48b2af',
                 letterSpacing: '-0.32px'
               }}>이전</p>
            </button>

            {/* Next Button */}
            <button
              onClick={onNext}
              className="flex-1 flex items-center justify-center relative cursor-pointer transition active:scale-[0.99] active:!bg-[#41A09E]"
              style={{ borderRadius: '16px', backgroundColor: '#48b2af', height: '56px' }}
            >
               <p style={{
                 fontFamily: 'Pretendard Variable',
                 fontWeight: 500,
                 fontSize: '16px',
                 lineHeight: '25px',
                 color: '#ffffff',
                 letterSpacing: '-0.32px'
               }}>다음</p>
            </button>
        </div>
      </div>
    </div>
  );
}

interface ReportWeeklyMindCareProps {
  onBack?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ReportWeeklyMindCare({ onBack, onPrev, onNext }: ReportWeeklyMindCareProps) {
  const [showReport, setShowReport] = useState(false);

  if (showReport) {
    return <ReportWeeklyMemo onBack={() => setShowReport(false)} onNext={onNext} />;
  }

  return (
    <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }} data-name="나의 보고서 (마음 처방)">
      <TopBar onBack={onBack} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full relative" style={{ paddingBottom: '230px' }}>
        {/* Card Section */}
        <div className="flex items-center justify-center pt-[12px] px-[20px] pb-[40px] w-full">
           <PrescriptionCard />
        </div>

        {/* Divider */}
        <div className="w-full shrink-0" style={{ height: '12px', backgroundColor: '#f9f9f9' }} />

        {/* Goals Section */}
        <GoalsSection />
      </div>

      <BottomButtons onPrev={onPrev} onNext={() => setShowReport(true)} />
    </div>
  );
}
