/**
 * LoadingWithMessage - 닷 로딩 + 메시지 컴포넌트
 *
 * 사용법:
 * - 기본: <LoadingWithMessage message="보고서를 불러오는 중이에요!" />
 * - 패딩 조절: <LoadingWithMessage message="..." padding="60px 20px" />
 * - 메시지 없이: <DotLoading /> (닷만 표시)
 */

interface DotLoadingProps {
  className?: string;
}

/**
 * DotLoading - 3개의 점이 펄스 애니메이션하는 로딩 인디케이터
 */
export function DotLoading({ className }: DotLoadingProps) {
  return (
    <div className={`flex items-center gap-[10px] h-[10px] ${className || ''}`} data-name="Dot loading">
      <div
        className="w-[10px] h-[10px] rounded-full animate-[dotPulse_1.4s_ease-in-out_infinite]"
        style={{ backgroundColor: '#E4F7F7', animationDelay: '0s' }}
      />
      <div
        className="w-[10px] h-[10px] rounded-full animate-[dotPulse_1.4s_ease-in-out_infinite]"
        style={{ backgroundColor: '#7ED4D2', animationDelay: '0.2s' }}
      />
      <div
        className="w-[10px] h-[10px] rounded-full animate-[dotPulse_1.4s_ease-in-out_infinite]"
        style={{ backgroundColor: '#48B2AF', animationDelay: '0.4s' }}
      />
    </div>
  );
}

export interface LoadingWithMessageProps {
  /** 로딩 메시지 */
  message: string;
  /** 패딩 (기본값: "80px 20px") */
  padding?: string;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * LoadingWithMessage - 인라인 로딩 컴포넌트
 * 닷 로딩 + 커스텀 메시지를 표시합니다.
 */
export function LoadingWithMessage({
  message,
  padding = '80px 20px',
  className
}: LoadingWithMessageProps) {
  return (
    <div
      className={`flex items-center justify-center w-full ${className || ''}`}
      style={{ padding }}
    >
      <div className="flex flex-col items-center gap-[20px]">
        <DotLoading />
        <p
          className="text-center"
          style={{
            fontFamily: "'Pretendard Variable', sans-serif",
            fontSize: '18px',
            fontWeight: 600,
            color: '#1a1a1a',
            letterSpacing: '-0.36px'
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default LoadingWithMessage;
