/**
 * 콘텐츠 썸네일 이미지 캐싱 유틸리티
 *
 * ⭐ Cache API를 사용하여 썸네일 이미지를 효율적으로 캐싱합니다.
 * - localStorage: 5-10MB 제한
 * - Cache API: 50MB 이상 (브라우저에 따라 다름)
 *
 * 홈 화면 로딩 시 썸네일을 미리 캐싱하여
 * 사용자가 다시 방문할 때 즉시 로드할 수 있도록 합니다.
 */

const CACHE_NAME = 'thumbnails-v1';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1일 (콘텐츠 썸네일은 타로보다 자주 바뀔 수 있음)

// 싱글톤 Cache 인스턴스
let cacheInstance: Cache | null = null;
let cachePromise: Promise<Cache> | null = null;

/**
 * Cache API 인스턴스 싱글톤
 * 최초 1회만 open, 이후 재사용
 */
async function getCacheInstance(): Promise<Cache> {
  if (cacheInstance) return cacheInstance;

  if (!cachePromise) {
    cachePromise = caches.open(CACHE_NAME).then(cache => {
      cacheInstance = cache;
      return cache;
    });
  }

  return cachePromise;
}

// 메모리 캐시: { contentId: { imageUrl, cachedAt } }
const memoryCache = new Map<number, { imageUrl: string; cachedAt: number }>();

/**
 * 메모리 캐시 초기화 (페이지 로드 시 1회)
 */
async function initMemoryCache(): Promise<void> {
  if (memoryCache.size > 0) return; // 이미 초기화됨

  // localStorage 메타데이터 → 메모리로 복사
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('thumbnail_meta_')) {
      const metadataStr = localStorage.getItem(key);
      if (metadataStr) {
        try {
          const metadata = JSON.parse(metadataStr);
          const contentId = parseInt(key.replace('thumbnail_meta_', ''), 10);

          // 만료 체크
          const age = Date.now() - metadata.cachedAt;
          if (age <= CACHE_EXPIRY_MS) {
            memoryCache.set(contentId, {
              imageUrl: metadata.imageUrl,
              cachedAt: metadata.cachedAt
            });
          } else {
            // 만료된 메타데이터 삭제
            localStorage.removeItem(key);
          }
        } catch (error) {
          console.error(`❌ [썸네일캐시] 메타데이터 파싱 실패: ${key}`, error);
          localStorage.removeItem(key);
        }
      }
    }
  }

  console.log(`✅ [썸네일캐시] 메모리 캐시 초기화: ${memoryCache.size}개`);
}

/**
 * ⭐ Cache API를 사용하여 썸네일 캐싱
 * localStorage의 용량 제한(5-10MB)을 우회하고 큰 이미지도 캐싱 가능
 */
export async function cacheThumbnail(contentId: number, imageUrl: string): Promise<boolean> {
  try {
    // 🚀 메모리 캐시 우선 체크
    const cached = memoryCache.get(contentId);
    if (cached) {
      const age = Date.now() - cached.cachedAt;
      if (age <= CACHE_EXPIRY_MS) {
        console.log(`✅ [썸네일캐시] 이미 캐시됨 (메모리): ${contentId}`);
        return true;
      }
    }

    console.log(`📥 [썸네일캐시] 다운로드 시작: ${contentId}`);

    // ⭐ Cache API 열기 (싱글톤 사용)
    const cache = await getCacheInstance();

    // ⭐ 이미지 다운로드 및 캐싱
    const response = await fetch(imageUrl, {
      mode: 'cors',
      cache: 'default',
    });

    if (!response.ok) {
      console.error(`❌ [썸네일캐시] 다운로드 실패: ${contentId}`, response.status);
      return false;
    }

    // 이미지 크기 확인 (로깅용)
    const blob = await response.clone().blob();
    const sizeInKB = blob.size / 1024;
    console.log(`📦 [썸네일캐시] 이미지 크기: ${sizeInKB.toFixed(1)}KB - ${contentId}`);

    // ⭐ Cache API에 저장 (실제 이미지 URL을 키로 사용)
    await cache.put(imageUrl, response);

    // 메타데이터 저장 (만료 시간 체크용)
    const cachedAt = Date.now();
    const metadata = {
      contentId,
      imageUrl,
      cachedAt,
    };
    localStorage.setItem(`thumbnail_meta_${contentId}`, JSON.stringify(metadata));

    // ✅ 성공 시 메모리 캐시도 업데이트
    memoryCache.set(contentId, {
      imageUrl,
      cachedAt
    });

    console.log(`✅ [썸네일캐시] 저장 완료: ${contentId} (${sizeInKB.toFixed(1)}KB)`);
    return true;
  } catch (error) {
    console.error(`❌ [썸네일캐시] 캐싱 실패: ${contentId}`, error);
    return false;
  }
}

/**
 * ⭐ Cache API에서 캐시된 썸네일 가져오기
 * 반환값: 실제 Storage URL (blob URL 대신 직접 URL 사용)
 */
export async function getCachedThumbnail(contentId: number): Promise<string | null> {
  try {
    // 🚀 1차 체크: 메모리 캐시 (0.01ms - 즉시)
    const cached = memoryCache.get(contentId);
    if (cached) {
      // 만료 체크 (메모리에서 빠르게)
      const age = Date.now() - cached.cachedAt;
      if (age <= CACHE_EXPIRY_MS) {
        console.log(`⚡ [썸네일캐시] 메모리 히트: ${contentId}`);
        return cached.imageUrl;
      } else {
        // 만료됨 → 삭제
        memoryCache.delete(contentId);
        localStorage.removeItem(`thumbnail_meta_${contentId}`);
      }
    }

    // 2차 체크: localStorage 메타데이터 확인 (메모리 캐시 미스 시)
    const metadataKey = `thumbnail_meta_${contentId}`;
    const metadataStr = localStorage.getItem(metadataKey);

    if (!metadataStr) {
      return null; // 캐시되지 않음
    }

    const metadata = JSON.parse(metadataStr);

    // 만료 체크 (1일)
    const age = Date.now() - metadata.cachedAt;
    if (age > CACHE_EXPIRY_MS) {
      console.log(`🔄 [썸네일캐시] 만료됨, 삭제: ${contentId} (${(age / (1000 * 60 * 60)).toFixed(1)}시간 경과)`);
      await clearThumbnailCache([contentId]);
      return null;
    }

    // ⭐ Cache API에서 이미지 확인 (실제 캐시 여부만 체크, 싱글톤 사용)
    const cache = await getCacheInstance();
    const response = await cache.match(metadata.imageUrl);

    if (!response) {
      console.log(`⚠️ [썸네일캐시] 메타데이터는 있지만 캐시 없음: ${contentId}`);
      localStorage.removeItem(metadataKey);
      return null;
    }

    // ⭐ Blob URL 생성하지 않고 실제 Storage URL 반환
    // 브라우저가 Cache API와 자체 캐시를 활용하여 네트워크 요청 최소화
    console.log(`⚡ [썸네일캐시] 캐시 히트: ${contentId}`);
    return metadata.imageUrl;
  } catch (error) {
    console.error(`❌ [썸네일캐시] 로드 실패: ${contentId}`, error);
    return null;
  }
}

/**
 * 동시성 제어 헬퍼 (최대 N개씩 배치 처리)
 */
async function batchPromises<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 6
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(task => task()));
    results.push(...batchResults);

    console.log(`📦 [썸네일캐시] 배치 ${Math.floor(i / concurrency) + 1} 완료 (${batchResults.length}개)`);
  }

  return results;
}

/**
 * 여러 콘텐츠의 썸네일을 미리 캐싱
 * HomePage에서 콘텐츠 로드 후 호출
 */
export async function preloadThumbnails(contents: Array<{ id: number; thumbnail_url: string | null }>): Promise<void> {
  try {
    console.log('🖼️ [썸네일캐시] 프리로드 시작:', contents.length, '개');

    // 🚀 메모리 캐시 초기화 (최초 1회)
    await initMemoryCache();

    // 유효한 썸네일 URL만 필터링
    const validContents = contents.filter(c => c.thumbnail_url);

    if (validContents.length === 0) {
      console.log('ℹ️ [썸네일캐시] 캐싱할 썸네일 없음');
      return;
    }

    // ⚡ 이미 캐시된 콘텐츠 필터링 (메모리 캐시로 빠르게)
    const uncachedContents = validContents.filter(content => {
      const cached = memoryCache.get(content.id);
      if (!cached) return true;

      const age = Date.now() - cached.cachedAt;
      return age > CACHE_EXPIRY_MS; // 만료된 것만 다시 캐싱
    });

    if (uncachedContents.length === 0) {
      console.log('✅ [썸네일캐시] 모든 썸네일 이미 캐시됨');
      return;
    }

    console.log(`📥 [썸네일캐시] ${uncachedContents.length}개 다운로드 필요`);

    // 🚀 배치 처리 (최대 6개씩)
    const tasks = uncachedContents.map(content => () => {
      return cacheThumbnail(content.id, content.thumbnail_url!);
    });

    const results = await batchPromises(tasks, 6);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`✅ [썸네일캐시] 프리로드 완료: ${successCount}/${uncachedContents.length}개 성공`);
  } catch (error) {
    console.error('❌ [썸네일캐시] 프리로드 실패:', error);
  }
}

/**
 * 특정 콘텐츠의 캐시 삭제
 */
export async function clearThumbnailCache(contentIds?: number[]): Promise<void> {
  try {
    const cache = await getCacheInstance();

    if (contentIds) {
      // 특정 콘텐츠만 삭제
      for (const id of contentIds) {
        // 메타데이터에서 imageUrl 조회
        const metadataKey = `thumbnail_meta_${id}`;
        const metadataStr = localStorage.getItem(metadataKey);

        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          // ⭐ imageUrl을 키로 사용하여 삭제
          await cache.delete(metadata.imageUrl);
        }

        localStorage.removeItem(metadataKey);
        memoryCache.delete(id);
        console.log(`🗑️ [썸네일캐시] 삭제: ${id}`);
      }
    } else {
      // 모든 썸네일 캐시 삭제
      await caches.delete(CACHE_NAME);
      cacheInstance = null;
      cachePromise = null;

      // 메타데이터도 삭제
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('thumbnail_meta_')) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));

      // 메모리 캐시도 초기화
      memoryCache.clear();

      console.log(`🗑️ [썸네일캐시] 전체 삭제: ${keys.length}개`);
    }
  } catch (error) {
    console.error('❌ [썸네일캐시] 삭제 실패:', error);
  }
}

/**
 * ⭐ 캐시 상태 확인 (디버깅용)
 */
export async function getThumbnailCacheStats(): Promise<{
  cacheSize: number;
  contentCount: number;
  contentIds: number[];
}> {
  try {
    const cache = await getCacheInstance();
    const requests = await cache.keys();

    // ⭐ localStorage 메타데이터에서 콘텐츠 ID 조회
    const contentIds: number[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('thumbnail_meta_')) {
        const id = parseInt(key.replace('thumbnail_meta_', ''), 10);
        contentIds.push(id);
      }
    }

    let totalSize = 0;
    for (const req of requests) {
      const response = await cache.match(req);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return {
      cacheSize: totalSize,
      contentCount: contentIds.length,
      contentIds,
    };
  } catch (error) {
    console.error('❌ [썸네일캐시] 상태 조회 실패:', error);
    return { cacheSize: 0, contentCount: 0, contentIds: [] };
  }
}
