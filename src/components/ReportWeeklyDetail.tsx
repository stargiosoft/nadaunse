import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import svgPathsDove from "@/imports/svg-d6wqnyhzay";
import { useWeeklyReport, formatReportTitle, formatWeekRange, WeeklyReport, ReportSection, UserTraitTag } from '@/hooks/useWeeklyReport';

function Icon() {
  return (
    <div className="absolute" style={{ inset: '10% -0.02% 3.02% 0.65%' }} data-name="Icon">
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 39.7459 34.7902">
        <g id="Icon">
          <path d={svgPathsDove.p130ba700} fill="var(--fill-0, #6ABC13)" id="Vector" />
          <path d={svgPathsDove.p13fdf100} fill="var(--fill-0, #6ABC13)" id="Vector_2" />
          <path d={svgPathsDove.pb501000} fill="var(--fill-0, #6ABC13)" id="Vector_3" />
          <path d={svgPathsDove.p20ac8d40} fill="var(--fill-0, #83C6FF)" id="Vector_4" />
          <path d={svgPathsDove.p29743380} fill="var(--fill-0, #BFE1FF)" id="Vector_5" />
          <path d={svgPathsDove.p1992f660} fill="var(--fill-0, #83C6FF)" id="Vector_6" />
          <path d={svgPathsDove.p39404b80} fill="var(--fill-0, #555555)" id="Vector_7" />
          <path d={svgPathsDove.p1939f500} fill="var(--fill-0, #FFC300)" id="Vector_8" />
        </g>
      </svg>
    </div>
  );
}

function NotoDove() {
  return (
    <div className="overflow-clip relative" style={{ width: '40px', height: '40px' }} data-name="noto:dove">
      <Icon />
    </div>
  );
}

interface TitleContainerProps {
  title: string;
  dateRange: string;
}

function TitleContainer({ title, dateRange }: TitleContainerProps) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Title Container">
      <div className="flex items-center w-full" style={{ gap: '8px' }}>
        <span style={{
          fontFamily: 'Pretendard Variable',
          fontWeight: 600,
          lineHeight: '24px',
          color: '#151515',
          fontSize: '18px',
          letterSpacing: '-0.36px'
        }}>
          {title}
        </span>
        <span style={{
          fontFamily: 'Pretendard Variable',
          fontWeight: 400,
          lineHeight: '17px',
          color: '#999999',
          fontSize: '13px',
          letterSpacing: '-0.26px',
          paddingTop: '2px',
          paddingBottom: '3px'
        }}>
          {dateRange}
        </span>
      </div>
    </div>
  );
}

interface TextContainerProps {
  title: string;
  dateRange: string;
  paragraphs: string[];
}

function TextContainer({ title, dateRange, paragraphs }: TextContainerProps) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '8px' }} data-name="Text Container">
      <TitleContainer title={title} dateRange={dateRange} />
      <div style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 400,
        lineHeight: '28.5px',
        color: '#151515',
        fontSize: '16px',
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
  );
}

interface ContentContainerProps {
  title: string;
  dateRange: string;
  paragraphs: string[];
}

function ContentContainer({ title, dateRange, paragraphs }: ContentContainerProps) {
  return (
    <div className="flex flex-col items-start relative self-stretch shrink-0 w-full" style={{ gap: '20px' }} data-name="Content Container">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <NotoDove />
        </div>
      </div>
      <TextContainer title={title} dateRange={dateRange} paragraphs={paragraphs} />
    </div>
  );
}

interface ContainerProps {
  title: string;
  dateRange: string;
  paragraphs: string[];
}

function Container({ title, dateRange, paragraphs }: ContainerProps) {
  return (
    <div className="relative shrink-0 w-full" style={{ borderRadius: '16px', backgroundColor: '#f9f9f9' }} data-name="Container">
      <div className="flex flex-row justify-center" style={{ width: '100%', height: '100%' }}>
        <div className="flex items-start justify-center relative w-full" style={{ padding: '28px 20px' }}>
          <ContentContainer title={title} dateRange={dateRange} paragraphs={paragraphs} />
        </div>
      </div>
    </div>
  );
}

interface CardInterpretationCardProps {
  title: string;
  dateRange: string;
  paragraphs: string[];
}

function CardInterpretationCard({ title, dateRange, paragraphs }: CardInterpretationCardProps) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Card / Interpretation Card">
      <Container title={title} dateRange={dateRange} paragraphs={paragraphs} />
    </div>
  );
}

interface ContentContainer1Props {
  title: string;
  dateRange: string;
  paragraphs: string[];
}

function ContentContainer1({ title, dateRange, paragraphs }: ContentContainer1Props) {
  return (
    <div className="flex items-center justify-center relative shrink-0 w-full" style={{ padding: '12px 20px 40px 20px' }} data-name="Content Container">
      <CardInterpretationCard title={title} dateRange={dateRange} paragraphs={paragraphs} />
    </div>
  );
}

interface ContentContainer2Props {
  title: string;
  dateRange: string;
  paragraphs: string[];
}

function ContentContainer2({ title, dateRange, paragraphs }: ContentContainer2Props) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Content Container">
      <ContentContainer1 title={title} dateRange={dateRange} paragraphs={paragraphs} />
      <div className="shrink-0 w-full" style={{ height: '12px', backgroundColor: '#f9f9f9' }} data-name="Divider" />
    </div>
  );
}

function Icons({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: '16px', height: '16px' }}
      data-name="Icons"
      animate={{ rotate: isOpen ? -180 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-up">
          <path d={svgPathsDove.peb9d380} id="Vector" stroke="#B7B7B7" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
        </g>
      </svg>
    </motion.div>
  );
}

function Frame({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center justify-center" style={{ width: '100%', height: '100%' }}>
        <div className="flex items-center justify-center relative w-full" style={{ gap: '11px', padding: '14px 20px' }}>
          <p className="flex-[1_0_0]" style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 500,
            lineHeight: '24px',
            color: '#000000',
            fontSize: '17px',
            letterSpacing: '-0.34px'
          }}>이주의 나의 성향 태그</p>
          <Icons isOpen={isOpen} />
        </div>
      </div>
    </div>
  );
}

function ReportAccordion({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex flex-col items-start relative shrink-0 w-full cursor-pointer"
      data-name="Report Accordion"
      onClick={onToggle}
    >
      <Frame isOpen={isOpen} />
    </div>
  );
}

function TagLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center relative shrink-0" style={{ padding: '3px 10px 4px 10px', borderRadius: '99px' }} data-name="Tag label">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ border: '1px solid #e7e7e7', borderRadius: '99px' }} />
      <p style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 400,
        lineHeight: '22px',
        color: '#151515',
        fontSize: '13px'
      }}># {text}</p>
    </div>
  );
}

interface Frame1Props {
  tags: UserTraitTag[];
}

function Frame1({ tags }: Frame1Props) {
  return (
    <div className="flex items-center justify-start relative shrink-0 w-full content-start" style={{ flexWrap: 'wrap', gap: '6px' }}>
      {tags.map((tag) => (
        <TagLabel key={tag.id} text={tag.tag_name} />
      ))}
    </div>
  );
}

interface Frame2Props {
  tags: UserTraitTag[];
}

function Frame2({ tags }: Frame2Props) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-start relative w-full" style={{ padding: '0 20px' }}>
        <Frame1 tags={tags} />
      </div>
    </div>
  );
}

interface TagListAccordionProps {
  tags: UserTraitTag[];
}

function TagListAccordion({ tags }: TagListAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" data-name="Tag List Accordion">
      <ReportAccordion isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden", width: "100%" }}
          >
            <Frame2 tags={tags} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ContentContainer3Props {
  title: string;
  dateRange: string;
  paragraphs: string[];
  tags: UserTraitTag[];
}

function ContentContainer3({ title, dateRange, paragraphs, tags }: ContentContainer3Props) {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '16px', paddingBottom: '230px' }} data-name="Content Container">
      <ContentContainer2 title={title} dateRange={dateRange} paragraphs={paragraphs} />
      <TagListAccordion tags={tags} />
    </div>
  );
}


function NavigationTopBar({ onClose }: { onClose?: () => void }) {
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

function NavigationTopNavigationWidget({ onClose }: { onClose?: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-white w-full" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar onClose={onClose} />
    </div>
  );
}

function BottomButtons({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
          {/* 이전 버튼 */}
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

          {/* 다음 버튼 */}
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
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-4 bg-gray-300 rounded w-full mb-2" />
        <div className="h-4 bg-gray-300 rounded w-2/3" />
      </div>
    </div>
  );
}

interface ReportWeeklyDetailProps {
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  reportId?: string;
  // 외부에서 데이터 직접 주입 가능
  reportData?: WeeklyReport;
  sectionData?: ReportSection;
  tagsData?: UserTraitTag[];
}

export default function ReportWeeklyDetail({
  onClose,
  onPrev,
  onNext,
  reportId,
  reportData: externalReport,
  sectionData: externalSection,
  tagsData: externalTags
}: ReportWeeklyDetailProps) {
  // 외부 데이터가 없으면 훅으로 조회
  const { report: fetchedReport, sections, weeklyTags, loading, error } = useWeeklyReport(
    externalReport ? undefined : reportId
  );

  const report = externalReport || fetchedReport;
  const myStorySection = externalSection || sections.find(s => s.section_type === 'my_story');
  const tags = externalTags || weeklyTags;

  // 데이터 추출
  const title = report ? formatReportTitle(report) : '보고서';
  const dateRange = report ? formatWeekRange(report) : '';
  const paragraphs = myStorySection?.content?.content_paragraphs || [];

  if (loading && !externalReport) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }}>
        <NavigationTopNavigationWidget onClose={onClose} />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !externalReport) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }}>
        <NavigationTopNavigationWidget onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>보고서를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!report && !externalReport) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }}>
        <NavigationTopNavigationWidget onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>보고서가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }} data-name="나의 보고서 (보고서 상세)">
      <NavigationTopNavigationWidget onClose={onClose} />
      <div className="flex-1 overflow-y-auto w-full">
        <ContentContainer3
          title={title}
          dateRange={dateRange}
          paragraphs={paragraphs}
          tags={tags}
        />
      </div>
      <BottomButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
