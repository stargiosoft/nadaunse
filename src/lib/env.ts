/**
 * 환경 감지 유틸리티
 * 
 * Figma Make 환경에서는 import.meta.env.DEV가 프로덕션에서도 true일 수 있으므로,
 * 도메인 기반으로 환경을 감지합니다.
 */

/**
 * 프로덕션 환경 여부 체크
 * nadaunse.com 또는 nadaunse.figma.site 도메인이면 프로덕션으로 간주
 * Capacitor 네이티브 앱도 프로덕션으로 간주 (hostname이 localhost)
 */
export const isProduction = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Capacitor 네이티브 앱: 프로덕션 Supabase를 사용하면 프로덕션
  if (import.meta.env.VITE_SUPABASE_PROJECT_ID === 'kcthtpmxffppfbkjjkub') return true;

  const hostname = window.location.hostname;
  return hostname === 'nadaunse.com'
      || hostname === 'www.nadaunse.com'
      || hostname === 'nadaunse.figma.site';
};

/**
 * 개발 환경 여부 체크 (프로덕션이 아닌 모든 환경)
 * - localhost
 * - 기타 figma.site (nadaunse.figma.site 제외)
 * - 기타 테스트 도메인
 */
export const isDevelopment = (): boolean => {
  return !isProduction();
};

/**
 * 로컬 환경 여부 체크
 */
export const isLocalhost = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
};

/**
 * Figma Make 환경 여부 체크
 */
export const isFigmaSite = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname.endsWith('.figma.site');
};

/**
 * import.meta.env.DEV를 대체하는 플래그
 * 프로덕션(nadaunse.com, nadaunse.figma.site)에서는 무조건 false 반환
 * 
 * 사용법:
 * {DEV && <DevOnlyComponent />}
 */
export const DEV = (() => {
  if (typeof window === 'undefined') return false;

  // 프로덕션 Supabase 사용 시 DEV=false (네이티브 앱 포함)
  if (import.meta.env.VITE_SUPABASE_PROJECT_ID === 'kcthtpmxffppfbkjjkub') return false;

  const hostname = window.location.hostname;

  // 프로덕션 도메인 체크
  if (hostname === 'nadaunse.com'
      || hostname === 'www.nadaunse.com'
      || hostname === 'nadaunse.figma.site') {
    return false;
  }

  // 그 외 모든 환경 (localhost, 다른 figma.site 등)
  return true;
})();