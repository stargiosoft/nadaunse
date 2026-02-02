import React from 'react';
import { X } from 'lucide-react';
import svgPaths from "@/imports/svg-cxwdyqr8rc";
import cloverSvgPaths from "@/imports/svg-8dky997t82";
import { motion } from 'motion/react';
import { useWeeklyReport, WeeklyReport, ReportSection } from '@/hooks/useWeeklyReport';
import { DotLoading } from './ui/PageLoader';
import WeeklyReportLoading from './WeeklyReportLoading';

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

function TopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="bg-white shrink-0 w-full z-20" style={{ height: '52px' }}>
      <div className="flex items-center justify-between h-full" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
        <div className="opacity-0" style={{ width: '44px', height: '44px' }} />
        <h1
          className="text-center flex-1"
          style={{
            fontFamily: 'Pretendard Variable, sans-serif',
            fontWeight: 600,
            fontSize: '18px',
            lineHeight: '25.5px',
            letterSpacing: '-0.36px',
            color: '#000000'
          }}
        >
          이번 주 보고서
        </h1>
        <button
          onClick={onClose}
          className="group flex items-center justify-center cursor-pointer transition-colors duration-200 active:bg-gray-100"
          style={{ width: '44px', height: '44px', borderRadius: '12px' }}
        >
          <X
            className="transition-transform duration-200 group-active:scale-90"
            style={{ width: '24px', height: '24px', color: '#848484' }}
            strokeWidth={1.8}
          />
        </button>
      </div>
    </div>
  );
}

interface PrescriptionCardProps {
  paragraphs: string[];
}

function PrescriptionCard({ paragraphs }: PrescriptionCardProps) {
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
               {paragraphs.map((paragraph, index) => (
                 <p key={index} className={index < paragraphs.length - 1 ? "mb-0" : ""}>
                   {paragraph}
                   {index < paragraphs.length - 1 && <><br />&nbsp;<br /></>}
                 </p>
               ))}
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

interface GoalsSectionProps {
  goals: Array<{ id: number; text: string }>;
}

function GoalsSection({ goals }: GoalsSectionProps) {
  if (goals.length === 0) return null;

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
           {goals.map((goal) => (
             <motion.div
               key={goal.id}
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
               <GoalItem text={goal.text} />
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

// 로딩 스켈레톤
function LoadingSkeleton() {
  return (
    <div className="animate-pulse p-5">
      <div className="bg-gray-200 rounded-2xl p-7">
        <div className="h-10 w-10 bg-gray-300 rounded-full mb-5" />
        <div className="h-6 bg-gray-300 rounded w-24 mb-4" />
        <div className="h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-4 bg-gray-300 rounded w-2/3" />
      </div>
      <div className="mt-8 px-7">
        <div className="h-6 bg-gray-300 rounded w-48 mx-auto mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReportWeeklyMindCareProps {
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  reportId?: string;
  // 외부에서 데이터 직접 주입 가능
  reportData?: WeeklyReport;
  sectionData?: ReportSection;
}

export default function ReportWeeklyMindCare({
  onClose,
  onPrev,
  onNext,
  reportId,
  reportData: externalReport,
  sectionData: externalSection
}: ReportWeeklyMindCareProps) {
  const { report: fetchedReport, sections, loading, error } = useWeeklyReport(
    externalReport ? undefined : reportId
  );

  const report = externalReport || fetchedReport;
  const mindCareSection = externalSection || sections.find(s => s.section_type === 'soul_prescription');

  // 데이터 추출
  const paragraphs = mindCareSection?.content?.content_paragraphs || [];
  const toDoList = report?.to_do_list || [];

  if (loading && !externalReport) {
    return <WeeklyReportLoading />;
  }

  if (error && !externalReport) {
    return (
      <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }}>
        <TopBar onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>마음 처방을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!mindCareSection && !externalSection) {
    return (
      <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }}>
        <TopBar onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>마음 처방 정보가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative flex flex-col mx-auto h-screen w-full overflow-hidden" style={{ maxWidth: '440px' }} data-name="나의 보고서 (마음 처방)">
      <TopBar onClose={onClose} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full relative" style={{ paddingBottom: '230px' }}>
        {/* Card Section */}
        <div className="flex items-center justify-center pt-[12px] px-[20px] pb-[40px] w-full">
           <PrescriptionCard paragraphs={paragraphs} />
        </div>

        {/* Divider */}
        <div className="w-full shrink-0" style={{ height: '12px', backgroundColor: '#f9f9f9' }} />

        {/* Goals Section */}
        <GoalsSection goals={toDoList} />
      </div>

      <BottomButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
