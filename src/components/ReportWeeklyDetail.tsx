import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import svgPathsDove from "@/imports/svg-d6wqnyhzay";
import { useWeeklyReport, formatReportTitle, formatWeekRange, WeeklyReport, ReportSection, UserTraitTag } from '@/hooks/useWeeklyReport';
import { DotLoading } from './ui/PageLoader';
import WeeklyReportLoading from './WeeklyReportLoading';
import { supabase } from '@/lib/supabase';
import FlowerPotIcon from './ui/FlowerPotIcon';

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
          fontSize: '17px',
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
          paddingTop: '4px',
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
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '12px' }} data-name="Text Container">
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
          <p
            key={index}
            style={{
              marginBottom: index < paragraphs.length - 1 ? '12px' : '0',
              margin: index < paragraphs.length - 1 ? '0 0 12px 0' : '0'
            }}
          >
            {paragraph}
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
    <div className="flex flex-col items-start relative self-stretch shrink-0 w-full" style={{ gap: '8px' }} data-name="Content Container">
      <div className="flex items-center justify-start relative shrink-0" style={{ marginLeft: '-14px' }}>
        <FlowerPotIcon size={56} />
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
        <div className="flex items-start justify-center relative w-full" style={{ padding: '16px 20px 20px 20px' }}>
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
    <div className="flex items-center justify-center relative shrink-0 w-full" style={{ padding: '8px 20px 24px 20px' }} data-name="Content Container">
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
      <div className="shrink-0 w-full" style={{ height: '8px', backgroundColor: '#f9f9f9' }} data-name="Divider" />
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
        <div className="flex items-center justify-between relative w-full" style={{ padding: '14px 20px' }}>
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: isOpen ? 600 : 500,
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
    <div className="flex items-center justify-center relative shrink-0" style={{ padding: '1px 8px', borderRadius: '99px' }} data-name="Tag label">
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
    <div className="flex items-center justify-start relative shrink-0 w-full content-start" style={{ flexWrap: 'wrap', gap: '5px' }}>
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
    <div className="flex flex-col items-start relative shrink-0 w-full" style={{ gap: '4px', paddingBottom: '130px' }} data-name="Content Container">
      <ContentContainer2 title={title} dateRange={dateRange} paragraphs={paragraphs} />
      <TagListAccordion tags={tags} />
    </div>
  );
}


function NavigationTopBar({ onClose }: { onClose?: () => void }) {
  return (
    <div className="shrink-0 w-full z-20" style={{ height: '52px' }}>
      <div className="flex items-center justify-between h-full" style={{ paddingLeft: '24px', paddingRight: '12px' }}>
        <h1
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
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} data-name="Navigation / Top Navigation (Widget)">
      <div className="w-full" style={{ maxWidth: '440px' }}>
        <NavigationTopBar onClose={onClose} />
      </div>
    </div>
  );
}

function BottomButtons({ onPrev, onNext }: { onPrev?: () => void; onNext?: () => void }) {
  const [isPrevPressed, setIsPrevPressed] = useState(false);
  const [isNextPressed, setIsNextPressed] = useState(false);

  const handlePrevPress = () => setIsPrevPressed(true);
  const handlePrevRelease = () => setIsPrevPressed(false);
  const handleNextPress = () => setIsNextPressed(true);
  const handleNextRelease = () => setIsNextPressed(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white z-40 flex justify-center" style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
      <div className="flex flex-col items-center justify-center w-full" style={{ maxWidth: '440px', padding: '12px 20px' }}>
        <div className="flex w-full" style={{ gap: '12px' }}>
          {/* 이전 버튼 */}
          <button
            onClick={onPrev}
            onMouseDown={handlePrevPress}
            onMouseUp={handlePrevRelease}
            onMouseLeave={handlePrevRelease}
            onTouchStart={handlePrevPress}
            onTouchEnd={handlePrevRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isPrevPressed ? '#E4F7F7' : '#f0f8f8',
              height: '56px',
              transform: isPrevPressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
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
            onMouseDown={handleNextPress}
            onMouseUp={handleNextRelease}
            onMouseLeave={handleNextRelease}
            onTouchStart={handleNextPress}
            onTouchEnd={handleNextRelease}
            className="flex-1 flex items-center justify-center relative cursor-pointer"
            style={{
              borderRadius: '16px',
              backgroundColor: isNextPressed ? '#41A09E' : '#48b2af',
              height: '56px',
              transform: isNextPressed ? 'scale(0.99)' : 'scale(1)',
              transition: 'all 0.1s ease'
            }}
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
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ 계정 불일치 상태
  const [isWrongAccount, setIsWrongAccount] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<{
    loginProvider: string;
    maskedEmail: string;
    maskedPhone: string;
  } | null>(null);
  const [isCheckingOwner, setIsCheckingOwner] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // ⭐ 로그아웃 상태 체크 → 로그인 페이지로 리다이렉트
  useEffect(() => {
    async function checkSession() {
      // 외부 데이터가 있으면 세션 체크 불필요
      if (externalReport) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.log('🔐 [ReportWeeklyDetail] 로그아웃 상태 → 로그인 페이지로 이동');
          // 현재 URL 저장 (로그인 후 리다이렉트용)
          const currentUrl = `${location.pathname}${location.search}`;
          localStorage.setItem('redirectAfterLogin', currentUrl);
          navigate('/login/new', { replace: true });
          return;
        }

        setIsCheckingSession(false);
      } catch (e) {
        console.error('❌ [ReportWeeklyDetail] 세션 체크 오류:', e);
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, [externalReport, location.pathname, location.search, navigate]);

  // iOS Safari viewport height 처리
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  // 외부 데이터가 없으면 훅으로 조회
  const { report: fetchedReport, sections, weeklyTags, loading, error } = useWeeklyReport(
    externalReport ? undefined : reportId
  );

  const report = externalReport || fetchedReport;
  const myStorySection = externalSection || sections.find(s => s.section_type === 'my_story');
  const tags = externalTags || weeklyTags;

  // ⭐ 보고서가 로드되면 캐시에 없는 경우 refresh 플래그 설정
  useEffect(() => {
    if (!report || externalReport) return;

    try {
      const cachedJson = localStorage.getItem('my_report_cache_v3');
      if (!cachedJson) {
        // 캐시가 없으면 refresh 필요
        localStorage.setItem('my_report_needs_refresh', 'true');
        console.log('🔄 [ReportWeeklyDetail] 캐시 없음 → refresh 플래그 설정');
        return;
      }

      const cache = JSON.parse(cachedJson);
      const cachedReportIds = new Set<string>();

      // 캐시된 모든 보고서 ID 수집
      if (cache.reports && Array.isArray(cache.reports)) {
        for (const monthly of cache.reports) {
          if (monthly.reports && Array.isArray(monthly.reports)) {
            for (const r of monthly.reports) {
              if (r.id) cachedReportIds.add(r.id);
            }
          }
        }
      }

      // 현재 보고서가 캐시에 없으면 refresh 플래그 설정
      if (!cachedReportIds.has(report.id)) {
        localStorage.setItem('my_report_needs_refresh', 'true');
        console.log('🔄 [ReportWeeklyDetail] 새 보고서 감지 → refresh 플래그 설정:', report.id);
      }
    } catch (e) {
      console.error('❌ [ReportWeeklyDetail] 캐시 체크 실패:', e);
    }
  }, [report, externalReport]);

  // ⭐ 보고서가 없을 때 소유자 정보 확인 (계정 불일치 체크)
  useEffect(() => {
    async function checkReportOwner() {
      // 세션 체크 중이거나, 보고서가 있거나, 로딩 중이거나, 외부 데이터가 있으면 스킵
      if (isCheckingSession || report || loading || externalReport || !reportId || isCheckingOwner) return;

      try {
        setIsCheckingOwner(true);
        console.log('🔍 [ReportWeeklyDetail] 보고서 소유자 확인 중...', reportId);

        const { data, error: fnError } = await supabase.functions.invoke('get-report-owner', {
          body: { reportId }
        });

        console.log('📦 [ReportWeeklyDetail] Edge Function 응답:', data);

        if (fnError) {
          console.error('❌ [ReportWeeklyDetail] 소유자 조회 실패:', fnError);
          return;
        }

        if (data?.success && data?.exists) {
          // 보고서가 존재하지만 내 것이 아님 → 계정 불일치
          console.log('🔐 [ReportWeeklyDetail] 다른 계정의 보고서:', data.owner);
          if (data.owner) {
            setOwnerInfo(data.owner);
          }
          setIsWrongAccount(true);
        } else {
          console.log('📭 [ReportWeeklyDetail] 보고서 없음');
        }
      } catch (e) {
        console.error('❌ [ReportWeeklyDetail] 소유자 확인 오류:', e);
      } finally {
        setIsCheckingOwner(false);
      }
    }

    checkReportOwner();
  }, [isCheckingSession, report, loading, externalReport, reportId]);

  // ⭐ 다른 계정 로그아웃
  const handleLogoutAndRetry = async () => {
    const currentUrl = `${location.pathname}${location.search}`;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    await supabase.auth.signOut();
    navigate('/login/new', { replace: true });
  };

  // 데이터 추출
  const title = report ? formatReportTitle(report) : '보고서';
  const dateRange = report ? formatWeekRange(report) : '';
  const paragraphs = myStorySection?.content?.content_paragraphs || [];

  if ((loading || isCheckingSession) && !externalReport) {
    return <WeeklyReportLoading />;
  }

  if (error && !externalReport) {
    return (
      <div className="bg-white fixed inset-0 flex justify-center">
        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
          <NavigationTopNavigationWidget onClose={onClose} />
          <div className="flex-1 flex items-center justify-center p-5">
            <p style={{ color: '#999', fontSize: '15px' }}>보고서를 불러올 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // ⭐ 계정 불일치 - 다이얼로그 표시
  if (isWrongAccount) {
    const providerName = ownerInfo?.loginProvider === 'kakao' ? '카카오' :
                         ownerInfo?.loginProvider === 'google' ? '구글' : '다른';
    const accountHint = ownerInfo?.maskedEmail || ownerInfo?.maskedPhone || '';

    return (
      <div className="bg-white fixed inset-0 flex justify-center">
        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
          <NavigationTopNavigationWidget onClose={onClose} />
          <div className="flex-1 flex items-center justify-center">
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" />
              <div
                className="relative bg-white overflow-hidden border"
                style={{ width: '320px', borderColor: '#f3f3f3', borderRadius: '20px' }}
              >
                <div style={{ paddingLeft: '28px', paddingRight: '28px', paddingTop: '20px', paddingBottom: '20px' }}>
                  <div className="flex flex-col items-center text-center" style={{ gap: '8px' }}>
                    <p
                      style={{
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: 600,
                        fontSize: '17px',
                        lineHeight: '25.5px',
                        letterSpacing: '-0.34px',
                        color: '#000000'
                      }}
                    >
                      다른 계정의 보고서예요
                    </p>
                    <p
                      style={{
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: 500,
                        fontSize: '15px',
                        lineHeight: '22px',
                        letterSpacing: '-0.3px',
                        color: '#868686'
                      }}
                    >
                      {accountHint ? (
                        <>
                          <span style={{ color: '#48b2af', fontWeight: 600 }}>{accountHint}</span>
                          (으)로<br />다시 로그인해 주세요.
                        </>
                      ) : (
                        <>보고서를 작성한 계정으로<br />다시 로그인해 주세요.</>
                      )}
                    </p>
                  </div>
                </div>
                <div
                  className="flex flex-col"
                  style={{ paddingLeft: '24px', paddingRight: '24px', paddingBottom: '20px', gap: '8px' }}
                >
                  <button
                    onClick={handleLogoutAndRetry}
                    className="w-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    style={{ height: '48px', backgroundColor: '#48b2af', borderRadius: '12px' }}
                  >
                    <span
                      style={{
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '25px',
                        letterSpacing: '-0.32px',
                        color: '#ffffff'
                      }}
                    >
                      다른 계정으로 로그인
                    </span>
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    style={{ height: '48px', backgroundColor: '#f5f5f5', borderRadius: '12px' }}
                  >
                    <span
                      style={{
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '25px',
                        letterSpacing: '-0.32px',
                        color: '#151515'
                      }}
                    >
                      홈으로 이동
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 소유자 확인 중
  if (isCheckingOwner && !report && !externalReport) {
    return <WeeklyReportLoading />;
  }

  if (!report && !externalReport) {
    return (
      <div className="bg-white fixed inset-0 flex justify-center">
        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
          <NavigationTopNavigationWidget onClose={onClose} />
          <div className="flex-1 flex items-center justify-center p-5">
            <p style={{ color: '#999', fontSize: '15px' }}>보고서가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari/Chrome 스크롤 바운스 방지 패턴 (fixed inset-0 + --vh)
  return (
    <div
      className="bg-white fixed inset-0 flex justify-center overflow-hidden"
      style={{
        height: 'calc(var(--vh, 1vh) * 100)',
        minHeight: 'calc(var(--vh, 1vh) * 100)'
      }}
      data-name="나의 보고서 (보고서 상세)"
    >
      <NavigationTopNavigationWidget onClose={onClose} />
      <div className="w-full h-full overflow-y-auto bg-white" style={{ maxWidth: '440px', paddingTop: '52px', paddingBottom: '80px', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
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
