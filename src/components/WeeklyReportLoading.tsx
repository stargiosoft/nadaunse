/**
 * 주간 보고서 로딩 페이지
 * - FreeContentLoading.tsx 스타일과 동일한 전체 화면 로딩
 * - 프로필 페이지 보고서 다시보기 / 알림톡 보고서 보기 진입 시 사용
 */

import { DotLoading } from './ui/PageLoader';

interface WeeklyReportLoadingProps {
  message?: string;
}

export default function WeeklyReportLoading({
  message = '보고서를 불러오는 중이에요!'
}: WeeklyReportLoadingProps) {
  return (
    <div className="bg-white fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[440px] flex flex-col gap-[44px] items-center px-[20px]">
        <DotLoading />
        <div className="flex flex-col items-center relative shrink-0 w-full">
          <p style={{
            fontFamily: 'Pretendard Variable',
            fontWeight: 600,
            fontSize: '22px',
            lineHeight: '32.5px',
            color: '#000000',
            letterSpacing: '-0.22px',
            textAlign: 'center'
          }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
