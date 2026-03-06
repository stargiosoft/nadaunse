/**
 * PageLoader - 전체 페이지 로딩 컴포넌트
 *
 * 사용법:
 * - 기본: <PageLoader /> → "잠시만 기다려주세요"
 * - 커스텀 메시지: <PageLoader message="결제 처리 중..." />
 * - 메시지 없이: <PageLoader showMessage={false} />
 */

import { DotLoading, LoadingWithMessage } from './LoadingWithMessage';

// Re-export for backward compatibility
export { DotLoading };

interface PageLoaderProps {
  /** 로딩 메시지 (기본값: "잠시만 기다려주세요") */
  message?: string;
  /** 메시지 표시 여부 (기본값: true) */
  showMessage?: boolean;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * PageLoader - 전체 페이지 로딩 UI
 * 중앙에 DotLoading + 메시지를 표시 (LoadingWithMessage 공통 컴포넌트 사용)
 */
export function PageLoader({
  message = '잠시만 기다려 주세요',
  showMessage = true,
  className
}: PageLoaderProps) {
  return (
    <div className={`bg-white fixed inset-0 w-full h-full flex items-center justify-center overflow-hidden ${className || ''}`}>
      {showMessage
        ? <LoadingWithMessage message={message} padding="0" />
        : <DotLoading />
      }
    </div>
  );
}

export default PageLoader;
