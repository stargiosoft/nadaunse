import { Component, ReactNode } from 'react';
import ErrorPage from './ErrorPage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorType: '500' | '503' | 'network' | null;
}

/**
 * 에러 바운더리 컴포넌트
 * - React 렌더링 중 발생하는 에러를 캐치
 * - 500/503/network 에러 타입 자동 판별
 * - 공통 ErrorPage로 에러 화면 표시
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorType: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('[ErrorBoundary] 에러 캐치:', error);
    console.error('[ErrorBoundary] 에러 메시지:', error.message);
    console.error('[ErrorBoundary] 에러 스택:', error.stack);

    // 에러 타입 자동 판별
    let errorType: '500' | '503' | 'network' = '500';

    // 네트워크 에러 감지
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('NetworkError') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError' && error.message.includes('fetch')
    ) {
      errorType = 'network';
      console.log('[ErrorBoundary] → 네트워크 에러로 분류');
    }
    // 503 에러 감지
    else if (
      error.message.includes('503') ||
      error.message.includes('Service Unavailable') ||
      error.message.includes('over capacity')
    ) {
      errorType = '503';
      console.log('[ErrorBoundary] → 503 서비스 과부하로 분류');
    }
    // 기본: 500 서버 에러
    else {
      errorType = '500';
      console.log('[ErrorBoundary] → 500 서버 에러로 분류');
    }

    return {
      hasError: true,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sentry 등 에러 로깅 서비스 연동 시 활용
    console.error('[ErrorBoundary] 상세 정보:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      errorType: this.state.errorType,
    });
  }

  render() {
    if (this.state.hasError && this.state.errorType) {
      return <ErrorPage type={this.state.errorType} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
