/**
 * 이미지 프리로더 유틸리티
 * 뷰포트에 나타나기 전에 이미지를 미리 로드하여 UX 개선
 */

/**
 * URL에서 쿼리 파라미터 제거
 */
function cleanImageUrl(url: string): string {
  if (!url) return url;
  return url.split('?')[0];
}

/**
 * 여러 이미지를 미리 로드
 * @param urls - 프리로드할 이미지 URL 배열
 * @param priority - 'high' (즉시 로드) | 'low' (지연 로드)
 * @returns Promise<void>
 */
export function preloadImages(urls: string[], priority: 'high' | 'low' = 'low'): Promise<void> {
  return new Promise((resolve) => {
    if (urls.length === 0) {
      resolve();
      return;
    }

    const delay = priority === 'high' ? 0 : 100;
    let loadedCount = 0;
    const totalCount = urls.length;

    urls.forEach((url, index) => {
      setTimeout(() => {
        const cleanedUrl = cleanImageUrl(url);
        const img = new Image();
        img.src = cleanedUrl;
        
        img.onload = () => {
          loadedCount++;
          console.log(`✅ [Preload] 이미지 로드 완료: ${cleanedUrl} (${loadedCount}/${totalCount})`);
          
          if (loadedCount === totalCount) {
            resolve();
          }
        };
        
        img.onerror = () => {
          loadedCount++;
          console.warn(`⚠️ [Preload] 이미지 로드 실패: ${cleanedUrl} (${loadedCount}/${totalCount})`);
          
          if (loadedCount === totalCount) {
            resolve();
          }
        };
      }, index * delay);
    });
  });
}