/**
 * @file useIOSSafeNavigate.ts
 * @description iOS Safari/Chrome 스와이프 뒤로가기 버그 대응을 위한 안전한 네비게이션 훅
 *
 * iOS 브라우저에서 SPA 히스토리 관리 버그로 인해 스와이프 뒤로가기 시
 * 예상치 못한 페이지 이동이 발생하는 문제를 해결합니다.
 *
 * @features
 * - canGoBack 상태 기반 안전한 뒤로가기
 * - iOS 감지 및 특화 처리
 * - fallback 경로 지원
 *
 * @usage
 * const navigate = useIOSSafeNavigate();
 * navigate('/product/123'); // canGoBack 상태 자동 추가
 *
 * const goBack = useGoBack('/');
 * goBack(); // canGoBack이 없으면 fallback으로 이동
 */

import { useCallback } from 'react';
import { useNavigate, useLocation, NavigateOptions, To } from 'react-router-dom';

/**
 * iOS 기기 감지
 */
export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
};

/**
 * 네비게이션 상태 인터페이스
 */
interface NavigationState {
  canGoBack?: boolean;
  fromPath?: string;
  timestamp?: number;
  [key: string]: unknown;
}

/**
 * iOS 안전한 네비게이션 훅
 *
 * 모든 네비게이션에 canGoBack 상태를 자동으로 추가하여
 * 뒤로가기 시 안전하게 이전 페이지로 이동할 수 있도록 합니다.
 *
 * @example
 * const navigate = useIOSSafeNavigate();
 * navigate('/product/123');
 * navigate('/product/123', { replace: true });
 * navigate('/product/123', { state: { customData: 'value' } });
 */
export const useIOSSafeNavigate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const safeNavigate = useCallback((
    to: To,
    options?: NavigateOptions
  ) => {
    const navigationState: NavigationState = {
      canGoBack: true,
      fromPath: location.pathname,
      timestamp: Date.now(),
      ...(options?.state as NavigationState || {})
    };

    // iOS에서 추가 히스토리 버퍼 생성 (replace가 아닐 때만)
    if (isIOSDevice() && !options?.replace) {
      window.history.pushState(
        {
          type: 'navigation_buffer',
          fromPath: location.pathname,
          toPath: typeof to === 'string' ? to : to.pathname,
          timestamp: Date.now()
        },
        '',
        window.location.href
      );
      console.log(`🔄 [iOS Navigation] ${location.pathname} → ${typeof to === 'string' ? to : to.pathname}`);
    }

    navigate(to, {
      ...options,
      state: navigationState
    });
  }, [navigate, location.pathname]);

  return safeNavigate;
};

/**
 * 안전한 뒤로가기 훅
 *
 * location.state.canGoBack 플래그를 확인하여
 * 안전하게 뒤로갈 수 있는 경우에만 history.back()을 실행하고,
 * 그렇지 않으면 fallback 경로로 이동합니다.
 *
 * @param fallback 뒤로갈 수 없을 때 이동할 경로 (기본값: '/')
 *
 * @example
 * const goBack = useGoBack('/');
 * <button onClick={goBack}>뒤로가기</button>
 *
 * // 커스텀 fallback
 * const goBack = useGoBack('/products');
 */
export const useGoBack = (fallback: string = '/') => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    const state = location.state as NavigationState | null;

    console.log('🔙 [useGoBack] 뒤로가기 시도', {
      canGoBack: state?.canGoBack,
      fromPath: state?.fromPath,
      currentPath: location.pathname,
      isIOS: isIOSDevice()
    });

    if (state?.canGoBack) {
      // 정상적인 네비게이션으로 들어온 경우 - 뒤로가기 가능
      navigate(-1);
    } else {
      // 직접 URL 접근 또는 새로고침 등 - fallback으로 이동
      console.log(`⚠️ [useGoBack] canGoBack 없음 → ${fallback}로 이동`);
      navigate(fallback, { replace: true });
    }
  }, [navigate, location, fallback]);

  return goBack;
};

/**
 * 히스토리 상태 디버그 훅 (개발용)
 *
 * @example
 * useHistoryDebug(); // 콘솔에 히스토리 상태 출력
 */
export const useHistoryDebug = () => {
  const location = useLocation();

  console.log('📍 [History Debug]', {
    pathname: location.pathname,
    state: location.state,
    historyLength: window.history.length,
    isIOS: isIOSDevice(),
    userAgent: navigator.userAgent
  });
};

export default useIOSSafeNavigate;
