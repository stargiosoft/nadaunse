import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import svgFlowerPaths from "@/imports/svg-cgnjs4xrxp";
import svgEmptyPaths from "@/imports/svg-mzaxb1u3cp";
import editSvgPaths from "@/imports/svg-4xnmni03a0";
import svgArrowPaths from "@/imports/svg-nh8ftbb7rx";

export interface ReportTag {
  label: string;
}

export interface WeeklyReport {
  id: string;
  title: string;
  period: string;
  tags: ReportTag[];
  extraTagsCount?: number;
  message?: {
    label: string;
    content: string;
  };
}

export interface MonthlyReport {
  id: string;
  title: string;
  reports: WeeklyReport[];
}

function WeeklyTagSummary({ count }: { count: number }) {
  const navigate = useNavigate();

  const handleGoToTags = () => {
    // 홈으로 이동 시 무료 체험판 필터 자동 선택
    localStorage.setItem('homeFilter', JSON.stringify({ category: '전체', contentType: 'free' }));
    navigate('/');
  };

  return (
    <div className="flex flex-col w-full bg-white" style={{ paddingBottom: '18px' }}>
      <div className="flex flex-col items-center pb-0 w-full" style={{ paddingTop: '48px', padding: '48px 20px 0 20px', gap: '36px' }}>
        {/* Flower Icon & Text */}
        <div className="flex flex-col items-center w-full" style={{ gap: '20px' }}>
          <div className="relative" style={{ width: '48px', height: '48px' }}>
            <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" viewBox="0 0 48.0038 46.4307">
              <path clipRule="evenodd" d={svgFlowerPaths.p8ff0d80} fill="#FF6678" fillRule="evenodd" />
              <path d={svgFlowerPaths.p3195a000} fill="white" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center w-full" style={{ gap: '2px' }}>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515' }} className="w-full">
              이번 주에 태그 {count}개가 쌓였어요!
            </p>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7' }} className="w-full">
              모인 태그로 일요일에 보고서를 드려요
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="w-full flex items-center justify-center active:scale-[0.98] transition-all"
          style={{ height: '48px', borderRadius: '12px', backgroundColor: '#48b2af' }}
          onClick={handleGoToTags}
        >
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff' }}>
            태그 쌓으러 가기
          </span>
        </button>
      </div>
      <div className="w-full" style={{ height: '12px', marginTop: '40px', backgroundColor: '#f9f9f9' }} />
    </div>
  );
}

function WeeklyEmptySummary() {
  const navigate = useNavigate();

  const handleGoToTags = () => {
    // 홈으로 이동 시 무료 체험판 필터 자동 선택
    localStorage.setItem('homeFilter', JSON.stringify({ category: '전체', contentType: 'free' }));
    navigate('/');
  };

  return (
    <div className="flex flex-col w-full bg-white" style={{ paddingBottom: '18px' }}>
      <div className="flex flex-col items-center pb-0 w-full" style={{ paddingTop: '48px', padding: '48px 20px 0 20px', gap: '36px' }}>
        {/* Empty Flower Icon & Text */}
        <div className="flex flex-col items-center w-full" style={{ gap: '20px' }}>
          <div className="relative" style={{ width: '48px', height: '48px' }}>
            <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" viewBox="0 0 48.0038 46.4307">
              <path clipRule="evenodd" d={svgEmptyPaths.p8ff0d80} fill="#F3F3F3" fillRule="evenodd" />
              <path d={svgEmptyPaths.p3195a000} fill="#D4D4D4" />
            </svg>
          </div>
          <div className="flex flex-col items-center text-center w-full" style={{ gap: '2px' }}>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '16px', lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#b7b7b7' }} className="w-full">
              이번 주 저장한 태그가 없어요
            </p>
            <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7' }} className="w-full">
              태그 하나만 있어도 보고서가 만들어져요
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="w-full flex items-center justify-center active:scale-[0.98] transition-all"
          style={{ height: '48px', borderRadius: '12px', backgroundColor: '#48b2af' }}
          onClick={handleGoToTags}
        >
          <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff' }}>
            태그 쌓으러 가기
          </span>
        </button>
      </div>
      <div className="w-full" style={{ height: '12px', marginTop: '40px', backgroundColor: '#f9f9f9' }} />
    </div>
  );
}

function EditIcon() {
  return (
    <div className="relative shrink-0" style={{ width: '16px', height: '16px' }} data-name="Icons">
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icons">
          <g id="Vector">
            <mask fill="white" id="path-1-inside-1_27_3508">
              <path clipRule="evenodd" d={editSvgPaths.p1c4f0780} fillRule="evenodd" />
            </mask>
            <path clipRule="evenodd" d={editSvgPaths.p1c4f0780} fill="#B7B7B7" fillRule="evenodd" />
            <path d={editSvgPaths.p289ae600} fill="#B7B7B7" mask="url(#path-1-inside-1_27_3508)" />
          </g>
          <g id="Vector_2">
            <mask fill="white" id="path-3-inside-2_27_3508">
              <path d={editSvgPaths.p677f400} />
            </mask>
            <path d={editSvgPaths.p677f400} fill="#B7B7B7" />
            <path d={editSvgPaths.p367c240} fill="#B7B7B7" mask="url(#path-3-inside-2_27_3508)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ViewReportArrowIcon() {
  return (
    <div className="relative" style={{ width: '12px', height: '12px' }}>
      <svg className="block" style={{ width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g>
          <path d={svgArrowPaths.p23113100} stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <path d="M1.75 6H10.165" stroke="#848484" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ReportCard({ report, onReportClick }: { report: WeeklyReport; onReportClick?: (id: string) => void }) {
  return (
    <div className="flex flex-col w-full" style={{ gap: '8px', padding: '0 2px' }}>
      {/* Title & Period */}
      <div className="flex items-center w-full" style={{ gap: '6px', padding: '0 2px' }}>
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '15px', lineHeight: '25.5px', color: '#151515', letterSpacing: '-0.3px' }}>
          {report.title}
        </p>
        <span style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '13px', lineHeight: '19px', color: '#B7B7B7', letterSpacing: '-0.26px' }}>
          {report.period.replace(/^\d{4}\./, '')}
        </span>
      </div>

      {/* Message Box (if exists) */}
      {report.message && (
        <div className="w-full" style={{ borderRadius: '12px', padding: '18px 16px', backgroundColor: '#f9f9f9' }}>
          <div className="flex items-start w-full" style={{ gap: '4px' }}>
            <div className="flex flex-col flex-1 min-w-0" style={{ gap: '4px' }}>
              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#151515', letterSpacing: '-0.42px' }}>
                {report.message.label}
              </p>
              <div style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#151515', letterSpacing: '-0.42px', whiteSpace: 'pre-wrap' }}>
                {report.message.content}
              </div>
            </div>
            <div className="flex items-center justify-center relative shrink-0 cursor-pointer transition-colors active:bg-[#F3F3F3]" style={{ padding: '11px 4px 10px 4px', borderRadius: '8px', width: '36px', marginTop: '-8px' }}>
               <EditIcon />
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex items-center flex-nowrap overflow-hidden" style={{ gap: '6px', padding: '0 2px' }}>
        <div className="flex items-center flex-nowrap" style={{ gap: '4px' }}>
          {report.tags.slice(0, 3).map((tag, idx) => (
            <div key={idx} className={`flex items-center justify-center border bg-white ${idx === 2 ? 'hidden min-[390px]:flex' : ''}`} style={{ padding: '4px 8px 3px 8px', borderRadius: '99px', borderColor: '#e7e7e7' }}>
              <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#151515', letterSpacing: '-0.24px' }}>
                {tag.label}
              </p>
            </div>
          ))}
        </div>
        {(report.tags.length + (report.extraTagsCount || 0)) > 2 && (
          <p className="min-[390px]:hidden" style={{ paddingTop: '2px', fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#999999', letterSpacing: '-0.24px' }}>
            +{(report.tags.length + (report.extraTagsCount || 0)) - 2}
          </p>
        )}
        {(report.tags.length + (report.extraTagsCount || 0)) > 3 && (
          <p className="hidden min-[390px]:block" style={{ fontFamily: 'Pretendard Variable', fontWeight: 500, fontSize: '12px', lineHeight: '16px', color: '#999999', letterSpacing: '-0.24px' }}>
            +{(report.tags.length + (report.extraTagsCount || 0)) - 3}
          </p>
        )}
      </div>

      {/* View Report Link */}
      <div className="flex w-full justify-end" style={{ marginTop: '-4px' }}>
        <div
          className="flex items-center transition-colors hover:bg-[#F8F8F8] cursor-pointer"
          style={{ gap: '4px', padding: '2px 4px 2px 6px', borderRadius: '8px' }}
          onClick={() => {
            if (onReportClick) {
              onReportClick(report.id);
            } else {
              console.log(`Navigate to report: ${report.id}`);
            }
          }}
        >
          <p style={{ fontFamily: 'Pretendard Variable', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#848484', letterSpacing: '-0.42px' }}>
            보고서 보기
          </p>
          <ViewReportArrowIcon />
        </div>
      </div>
    </div>
  );
}

function MonthlySection({ month, defaultExpanded = false, onReportClick }: { month: MonthlyReport; defaultExpanded?: boolean; onReportClick?: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && month.reports.length > 0);

  return (
    <div className="flex flex-col w-full border-b last:border-0" style={{ borderColor: '#f3f3f3' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full bg-white transition-colors active:bg-[#f9f9f9]"
        style={{ padding: '14px 20px' }}
      >
        <p style={{ fontFamily: 'Pretendard Variable', fontWeight: isExpanded ? 500 : 400, fontSize: '17px', lineHeight: '24px', color: '#000000', letterSpacing: '-0.34px' }}>
          {month.title}
        </p>
        <motion.div
          animate={{ rotate: isExpanded ? -180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown size={20} color="#b7b7b7" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && month.reports.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col" style={{ padding: '0 20px 12px 20px' }}>
              {month.reports.map((report, index) => (
                <div key={report.id} className="flex flex-col">
                  {index > 0 && <div className="w-full" style={{ height: '1px', backgroundColor: '#F8F8F8', margin: '12px 0' }} />}
                  <ReportCard report={report} onReportClick={onReportClick} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MyReportWeekly({
  currentWeekTagsCount,
  filteredReports,
  onReportClick
}: {
  currentWeekTagsCount: number;
  filteredReports: MonthlyReport[];
  onReportClick?: (id: string) => void;
}) {
  return (
    <>
      {/* Show summary based on tag count */}
      {currentWeekTagsCount > 0 ? (
        <WeeklyTagSummary count={currentWeekTagsCount} />
      ) : (
        <WeeklyEmptySummary />
      )}

      <div className="flex flex-col w-full" style={{ paddingBottom: '130px' }}>
        {filteredReports.map((month) => (
          <MonthlySection key={month.id} month={month} defaultExpanded={false} onReportClick={onReportClick} />
        ))}
      </div>
    </>
  );
}
