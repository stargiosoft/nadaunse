/**
 * 타로 카드 이미지 캐싱 유틸리티
 *
 * ⭐ Cache API를 사용하여 큰 이미지도 효율적으로 캐싱합니다.
 * - localStorage: 5-10MB 제한
 * - Cache API: 50MB 이상 (브라우저에 따라 다름)
 *
 * 사용자가 사주 풀이를 보는 동안 타로 이미지를 미리 캐싱하여
 * 타로 결과 페이지에서 즉시 로드할 수 있도록 합니다.
 */

import { getTarotCardImageUrl } from './tarotCards';

const CACHE_NAME = 'tarot-images-v1';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7일

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

// 메모리 캐시: { cardName: { imageUrl, cachedAt } }
const memoryCache = new Map<string, { imageUrl: string; cachedAt: number }>();

// ⭐ Blob URL 메모리 캐시: 동기식 즉시 반환용
// 캐시된 Blob URL을 저장하여 async 없이 0.01ms로 반환
const blobUrlCache = new Map<string, { blobUrl: string; cachedAt: number }>();

/**
 * ⭐ [신규] 동기식 메모리 캐시 체크 (0.01ms)
 * Blob URL이 메모리에 캐시되어 있으면 즉시 반환
 * 캐시 미스 시 null 반환 (이후 getCachedTarotImage 호출 필요)
 * 
 * ⚠️ 호출자는 useEffect cleanup에서 URL.revokeObjectURL() 호출 불필요
 *    (blobUrlCache가 관리하므로 revoke하면 안 됨)
 */
export function getMemoryCachedBlobUrl(cardName: string): string | null {
  const cached = blobUrlCache.get(cardName);
  if (!cached) return null;

  // 만료 체크 (7일)
  const age = Date.now() - cached.cachedAt;
  if (age > CACHE_EXPIRY_MS) {
    // 만료된 Blob URL 정리
    URL.revokeObjectURL(cached.blobUrl);
    blobUrlCache.delete(cardName);
    return null;
  }

  console.log(`⚡ [타로캐시] Blob URL 메모리 히트 (동기): ${cardName}`);
  return cached.blobUrl;
}

/**
 * 메모리 캐시 초기화 (페이지 로드 시 1회)
 */
async function initMemoryCache(): Promise<void> {
  if (memoryCache.size > 0) return; // 이미 초기화됨

  // localStorage 메타데이터 → 메모리로 복사
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('tarot_meta_')) {
      const metadataStr = localStorage.getItem(key);
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        const cardName = key.replace('tarot_meta_', '');

        // 만료 체크
        const age = Date.now() - metadata.cachedAt;
        if (age <= CACHE_EXPIRY_MS) {
          memoryCache.set(cardName, {
            imageUrl: metadata.imageUrl,
            cachedAt: metadata.cachedAt
          });
        } else {
          // 만료된 메타데이터 삭제
          localStorage.removeItem(key);
        }
      }
    }
  }

  console.log(`✅ [타로캐시] 메모리 캐시 초기화: ${memoryCache.size}장`);
}

/**
 * ⭐ Cache API를 사용하여 이미지 캐싱
 * localStorage의 용량 제한(5-10MB)을 우회하고 큰 이미지도 캐싱 가능
 */
export async function cacheTarotImage(cardName: string, imageUrl: string): Promise<boolean> {
  try {
    // 🚀 메모리 캐시 우선 체크
    const cached = memoryCache.get(cardName);
    if (cached) {
      const age = Date.now() - cached.cachedAt;
      if (age <= CACHE_EXPIRY_MS) {
        console.log(`✅ [타로캐시] 이미 캐시됨 (메모리): ${cardName}`);
        return true;
      }
    }

    console.log(`📥 [타로캐시] 다운로드 시작: ${cardName}`);

    // ⭐ Cache API 열기 (싱글톤 사용)
    const cache = await getCacheInstance();
    
    // ⭐ 이미지 다운로드 및 캐싱
    const response = await fetch(imageUrl, {
      mode: 'cors',
      cache: 'default',
    });
    
    if (!response.ok) {
      console.error(`❌ [타로캐시] 다운로드 실패: ${cardName}`, response.status);
      return false;
    }

    // 이미지 크기 확인 (로깅용)
    const blob = await response.clone().blob();
    const sizeInKB = blob.size / 1024;
    console.log(`📦 [타로캐시] 이미지 크기: ${sizeInKB.toFixed(1)}KB - ${cardName}`);

    // ⭐ Cache API에 저장 (실제 이미지 URL을 키로 사용)
    // ✅ HTTP(S) URL만 Cache API에서 지원
    await cache.put(imageUrl, response);
    
    // 메타데이터 저장 (만료 시간 체크용)
    const cachedAt = Date.now();
    const metadata = {
      cardName,
      imageUrl,
      cachedAt,
    };
    localStorage.setItem(`tarot_meta_${cardName}`, JSON.stringify(metadata));

    // ✅ 성공 시 메모리 캐시도 업데이트
    memoryCache.set(cardName, {
      imageUrl,
      cachedAt
    });

    // ⭐ Blob URL도 미리 생성하여 blobUrlCache에 저장 (동기식 체크용)
    const blobUrl = URL.createObjectURL(blob);
    blobUrlCache.set(cardName, { blobUrl, cachedAt });

    console.log(`✅ [타로캐시] 저장 완료 (+ Blob URL 캐시): ${cardName} (${sizeInKB.toFixed(1)}KB)`);
    return true;
  } catch (error) {
    console.error(`❌ [타로캐시] 캐싱 실패: ${cardName}`, error);
    return false;
  }
}

/**
 * ⭐ Cache API에서 캐시된 이미지 가져오기
 * 반환값: Blob URL (모바일 안정성 개선)
 *
 * ⚠️ Storage URL 방식의 문제점 (2026-01-20 재발견):
 * - 모바일 브라우저가 Cache API를 제대로 활용하지 못함
 * - 네트워크 요청 실패 시 onError 발생
 * - 빠른 페이지 전환 시 불안정
 *
 * ✅ Blob URL 방식 (메모리 누수 방지):
 * - Cache API에서 Blob 생성
 * - 호출자가 useEffect cleanup에서 URL.revokeObjectURL() 호출 필수
 * - 모바일에서도 안정적인 이미지 로딩
 */
export async function getCachedTarotImage(cardName: string): Promise<string | null> {
  try {
    // 🚀 1차 체크: 메모리 캐시 (0.01ms - 즉시)
    const cached = memoryCache.get(cardName);
    if (cached) {
      // 만료 체크 (메모리에서 빠르게)
      const age = Date.now() - cached.cachedAt;
      if (age <= CACHE_EXPIRY_MS) {
        // ⭐ Cache API에서 실제 존재 여부 확인 (메모리 캐시와 동기화)
        const cache = await getCacheInstance();
        const response = await cache.match(cached.imageUrl);

        if (response) {
          console.log(`⚡ [타로캐시] 메모리 히트 + Cache API 검증 완료: ${cardName}`);

          // ⭐ Blob URL 생성하여 반환 + blobUrlCache에도 저장
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          // ⭐ 다음 호출 시 동기식으로 반환할 수 있도록 저장
          blobUrlCache.set(cardName, { blobUrl, cachedAt: Date.now() });
          
          return blobUrl;
        } else {
          // Cache API에 없으면 메모리 캐시도 무효화
          console.log(`⚠️ [타로캐시] 메모리 히트했지만 Cache API에 없음 → 삭제: ${cardName}`);
          memoryCache.delete(cardName);
          localStorage.removeItem(`tarot_meta_${cardName}`);
          return null;
        }
      } else {
        // 만료됨 → 삭제
        memoryCache.delete(cardName);
        localStorage.removeItem(`tarot_meta_${cardName}`);
      }
    }

    // 2차 체크: localStorage 메타데이터 확인 (메모리 캐시 미스 시)
    const metadataKey = `tarot_meta_${cardName}`;
    const metadataStr = localStorage.getItem(metadataKey);

    if (!metadataStr) {
      return null; // 캐시되지 않음
    }

    const metadata = JSON.parse(metadataStr);

    // 만료 체크 (7일)
    const age = Date.now() - metadata.cachedAt;
    if (age > CACHE_EXPIRY_MS) {
      console.log(`🔄 [타로캐시] 만료됨, 삭제: ${cardName} (${(age / (1000 * 60 * 60 * 24)).toFixed(1)}일 경과)`);
      await clearTarotCache([cardName]);
      return null;
    }

    // ⭐ Cache API에서 이미지 확인 (실제 캐시 여부만 체크, 싱글톤 사용)
    const cache = await getCacheInstance();
    const response = await cache.match(metadata.imageUrl);

    if (!response) {
      console.log(`⚠️ [타로캐시] 메타데이터는 있지만 캐시 없음: ${cardName}`);
      localStorage.removeItem(metadataKey);
      return null;
    }

    // ⭐ Blob URL 생성하여 반환 + blobUrlCache에도 저장
    console.log(`⚡ [타로캐시] 캐시 히트: ${cardName}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // ⭐ 다음 호출 시 동기식으로 반환할 수 있도록 저장
    blobUrlCache.set(cardName, { blobUrl, cachedAt: Date.now() });
    
    return blobUrl;
  } catch (error) {
    console.error(`❌ [타로캐시] 로드 실패: ${cardName}`, error);
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

    console.log(`📦 [타로캐시] 배치 ${Math.floor(i / concurrency) + 1} 완료 (${batchResults.length}개)`);
  }

  return results;
}

/**
 * 주문의 모든 타로 카드 이미지를 미리 캐싱
 * LoadingPage에서 AI 생성 완료 후 호출
 */
export async function preloadTarotImages(orderId: string, supabaseUrl: string): Promise<void> {
  try {
    console.log('🎴 [타로캐시] 프리로드 시작:', orderId);

    // 🚀 메모리 캐시 초기화 (최초 1회)
    await initMemoryCache();

    // ⭐ Supabase Client 동적 임포트 (순환 참조 방지)
    const { supabase } = await import('./supabase');

    // 1. 주문의 타로 카드 정보 조회
    const { data: tarotCards, error } = await supabase
      .from('order_results')
      .select('tarot_card_name, tarot_card_image_url')
      .eq('order_id', orderId)
      .eq('question_type', 'tarot');

    if (error || !tarotCards || tarotCards.length === 0) {
      console.log('ℹ️ [타로캐시] 타로 카드 없음 (사주만 있는 콘텐츠)');
      return;
    }

    // 🔍 중복 제거 (같은 카드명 여러 번 나올 수 있음)
    const uniqueCards = Array.from(
      new Set(tarotCards.map(c => c.tarot_card_name).filter(Boolean))
    );

    console.log(`📦 [타로캐시] ${uniqueCards.length}장의 유니크 타로 카드 발견 (원본: ${tarotCards.length}장)`);

    // ⚡ 이미 캐시된 카드 필터링 (메모리 캐시로 빠르게)
    const uncachedCards = uniqueCards.filter(cardName => {
      const cached = memoryCache.get(cardName!);
      if (!cached) return true;

      const age = Date.now() - cached.cachedAt;
      return age > CACHE_EXPIRY_MS; // 만료된 것만 다시 캐싱
    });

    if (uncachedCards.length === 0) {
      console.log('✅ [타로캐시] 모든 카드 이미 캐시됨');
      return;
    }

    console.log(`📥 [타로캐시] ${uncachedCards.length}장 다운로드 필요`);

    // 🚀 배치 처리 (최대 6개씩)
    const tasks = uncachedCards.map(cardName => () => {
      const imageUrl = getTarotCardImageUrl(cardName!);
      return cacheTarotImage(cardName!, imageUrl);
    });

    const results = await batchPromises(tasks, 6);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`✅ [타로캐시] 프리로드 완료: ${successCount}/${uncachedCards.length}장 성공`);
  } catch (error) {
    console.error('❌ [타로캐시] 프리로드 실패:', error);
  }
}

/**
 * 특정 카드의 캐시 삭제
 */
export async function clearTarotCache(cardNames?: string[]): Promise<void> {
  try {
    const cache = await getCacheInstance();
    
    if (cardNames) {
      // 특정 카드만 삭제
      for (const name of cardNames) {
        // 메타데이터에서 imageUrl 조회
        const metadataKey = `tarot_meta_${name}`;
        const metadataStr = localStorage.getItem(metadataKey);
        
        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);
          // ⭐ imageUrl을 키로 사용하여 삭제
          await cache.delete(metadata.imageUrl);
        }
        
        localStorage.removeItem(metadataKey);
        console.log(`🗑️ [타로캐시] 삭제: ${name}`);
      }
    } else {
      // 모든 타로 캐시 삭제
      await caches.delete(CACHE_NAME);
      
      // 메타데이터도 삭제
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tarot_meta_')) {
          keys.push(key);
        }
      }
      keys.forEach(key => localStorage.removeItem(key));
      
      console.log(`🗑️ [타로캐시] 전체 삭제: ${keys.length}개`);
    }
  } catch (error) {
    console.error('❌ [타로캐시] 삭제 실패:', error);
  }
}

/**
 * ⭐ 캐시 상태 확인 (디버깅용)
 */
export async function getCacheStats(): Promise<{
  cacheSize: number;
  cardCount: number;
  cards: string[];
}> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // ⭐ localStorage 메타데이터에서 카드 이름 조회
    const cards: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tarot_meta_')) {
        const cardName = key.replace('tarot_meta_', '');
        cards.push(cardName);
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
      cardCount: cards.length,
      cards,
    };
  } catch (error) {
    console.error('❌ [타로캐시] 상태 조회 실패:', error);
    return { cacheSize: 0, cardCount: 0, cards: [] };
  }
}
