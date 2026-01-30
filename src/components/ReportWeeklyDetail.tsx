import { useState } from 'react';
import { Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import svgPathsDove from "@/imports/svg-d6wqnyhzay";
import ArrowLeft from './ArrowLeft';
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


function RightAction() {
  return (
    <div className="flex items-center justify-center opacity-0 relative shrink-0" style={{ padding: '4px', borderRadius: '12px', width: '44px', height: '44px' }} data-name="Right Action">
      <div className="relative shrink-0" style={{ width: '24px', height: '24px' }}>
         <Settings className="size-full text-[#848484]" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function Icon1({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between relative shrink-0 w-full" data-name="Icon">
      <ArrowLeft onClick={onBack || (() => {})} />
      <p className="flex-[1_0_0] overflow-hidden text-center text-ellipsis" style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 600,
        lineHeight: '25.5px',
        color: '#000000',
        fontSize: '18px',
        letterSpacing: '-0.36px'
      }}>이번 주 보고서</p>
      <RightAction />
    </div>
  );
}

function NavigationTopBar({ onBack }: { onBack?: () => void }) {
  return (
    <div className="bg-white relative shrink-0 w-full" style={{ height: '52px' }} data-name="Navigation / Top Bar">
      <div className="flex flex-col justify-center size-full">
        <div className="flex flex-col items-start justify-center relative size-full" style={{ padding: '4px 12px' }}>
          <Icon1 onBack={onBack} />
        </div>
      </div>
    </div>
  );
}

function NavigationTopNavigationWidget({ onBack }: { onBack?: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-white w-full" data-name="Navigation / Top Navigation (Widget)">
      <NavigationTopBar onBack={onBack} />
    </div>
  );
}

function ButtonContainer() {
  return (
    <div className="flex items-center relative shrink-0" style={{ gap: '4px' }} data-name="Button Container">
      <p style={{
        fontFamily: 'Pretendard Variable',
        fontWeight: 500,
        lineHeight: '25px',
        color: '#ffffff',
        fontSize: '16px',
        letterSpacing: '-0.32px'
      }}>이번 주 타로 뽑기</p>
    </div>
  );
}

function ButtonSquareButton({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center justify-center relative shrink-0 w-full cursor-pointer transition-all duration-200 ease-in-out active:scale-[0.99] active:bg-[#41A09E]" style={{ height: '56px', padding: '0 12px', borderRadius: '16px', backgroundColor: '#48b2af' }} data-name="Button / Square Button">
      <ButtonContainer />
    </div>
  );
}

function CommonBottomButton({ onTarotStart }: { onTarotStart?: () => void }) {
  return (
    <div className="fixed bottom-0 bg-white w-full z-40" style={{ maxWidth: '440px', boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }} data-name="Common / Bottom Button">
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '12px 20px' }}>
        <ButtonSquareButton onClick={onTarotStart} />
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
  onBack: () => void;
  onTarotStart?: () => void;
  reportId?: string;
  // 외부에서 데이터 직접 주입 가능
  reportData?: WeeklyReport;
  sectionData?: ReportSection;
  tagsData?: UserTraitTag[];
}

export default function ReportWeeklyDetail({
  onBack,
  onTarotStart,
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
        <NavigationTopNavigationWidget onBack={onBack} />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !externalReport) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }}>
        <NavigationTopNavigationWidget onBack={onBack} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>보고서를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!report && !externalReport) {
    return (
      <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }}>
        <NavigationTopNavigationWidget onBack={onBack} />
        <div className="flex-1 flex items-center justify-center p-5">
          <p style={{ color: '#999', fontSize: '15px' }}>보고서가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative size-full flex flex-col mx-auto h-full" style={{ maxWidth: '440px' }} data-name="나의 보고서 (보고서 상세)">
      <NavigationTopNavigationWidget onBack={onBack} />
      <div className="flex-1 overflow-y-auto w-full">
        <ContentContainer3
          title={title}
          dateRange={dateRange}
          paragraphs={paragraphs}
          tags={tags}
        />
      </div>
      <CommonBottomButton onTarotStart={onTarotStart} />
    </div>
  );
}
