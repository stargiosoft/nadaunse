/**
 * 이미지 프리로더 유틸리티
 * 뷰포트에 나타나기 전에 이미지를 미리 로드하여 UX 개선
 */

// ⭐ 로딩 페이지 이미지 프리로드용 (결제 완료 시점에 호출)
import imgLoadingImage from "figma:asset/e2c5a8ca34b2f8422ee7e5c07afc7fb43951737f.png";

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

    // 순차 로딩: high는 즉시(0ms 간격), low는 100ms 간격으로 분산
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

// ⭐ 무료 콘텐츠 캐시 키 (LoadingPage.tsx와 동일)
const FREE_CONTENTS_CACHE_KEY = 'free_contents_cache_v1';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5분

/**
 * 로딩 페이지 이미지 프리로드
 * - 결제 완료 시점에 호출하여 LoadingPage 진입 전 이미지 미리 로드
 * - 오리 캐릭터 이미지 + 무료 콘텐츠 썸네일 3개
 */
export async function preloadLoadingPageImages(): Promise<void> {
  // 세션 내 1번만 실행
  const LOADING_PRELOAD_KEY = 'loading_images_preloaded';
  if (sessionStorage.getItem(LOADING_PRELOAD_KEY)) {
    console.log('✅ [로딩프리로드] 이미 프리로드됨, 스킵');
    return;
  }

  console.log('🚀 [로딩프리로드] 시작');

  try {
    // 1. 오리 캐릭터 이미지 프리로드 (Figma asset)
    const duckImagePromise = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ [로딩프리로드] 오리 캐릭터 로드 완료');
        resolve();
      };
      img.onerror = () => {
        console.warn('⚠️ [로딩프리로드] 오리 캐릭터 로드 실패');
        resolve();
      };
      img.src = imgLoadingImage;
    });

    // 2. 무료 콘텐츠 캐시 확인 → 없으면 Supabase에서 로드
    let thumbnails: string[] = [];

    const cachedData = localStorage.getItem(FREE_CONTENTS_CACHE_KEY);
    if (cachedData) {
      const { contents, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      if (now - timestamp < CACHE_EXPIRY) {
        // 캐시 유효 → 썸네일 URL 추출
        thumbnails = contents
          .slice(0, 3)
          .map((c: { thumbnail_url: string | null }) => c.thumbnail_url)
          .filter(Boolean);
        console.log('✅ [로딩프리로드] 캐시에서 썸네일 URL 추출:', thumbnails.length, '개');
      }
    }

    // 캐시 없으면 Supabase에서 로드
    if (thumbnails.length === 0) {
      try {
        // ⭐ 동적 임포트로 순환 참조 방지
        const { supabase } = await import('./supabase');

        const { data: contents, error } = await supabase
          .from('master_contents')
          .select('id, title, thumbnail_url, weekly_clicks')
          .eq('content_type', 'free')
          .order('weekly_clicks', { ascending: false })
          .limit(6);

        if (!error && contents && contents.length > 0) {
          // 캐시 저장
          localStorage.setItem(FREE_CONTENTS_CACHE_KEY, JSON.stringify({
            contents,
            timestamp: Date.now()
          }));

          thumbnails = contents
            .slice(0, 3)
            .map(c => c.thumbnail_url)
            .filter(Boolean) as string[];

          console.log('✅ [로딩프리로드] Supabase에서 썸네일 로드:', thumbnails.length, '개');
        }
      } catch (err) {
        console.warn('⚠️ [로딩프리로드] 무료 콘텐츠 로드 실패:', err);
      }
    }

    // 3. 모든 이미지 프리로드 (병렬)
    const allImages = [imgLoadingImage, ...thumbnails];
    await Promise.all([
      duckImagePromise,
      preloadImages(thumbnails, 'high')
    ]);

    // 완료 표시
    sessionStorage.setItem(LOADING_PRELOAD_KEY, 'true');
    console.log('✅ [로딩프리로드] 완료:', allImages.length, '개 이미지');
  } catch (error) {
    console.error('❌ [로딩프리로드] 실패:', error);
  }
}