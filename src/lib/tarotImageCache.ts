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

/**
 * ⭐ Cache API를 사용하여 이미지 캐싱
 * localStorage의 용량 제한(5-10MB)을 우회하고 큰 이미지도 캐싱 가능
 */
export async function cacheTarotImage(cardName: string, imageUrl: string): Promise<boolean> {
  try {
    // 이미 캐시되어 있으면 스킵
    const cached = await getCachedTarotImage(cardName);
    if (cached) {
      console.log(`✅ [타로캐시] 이미 캐시됨: ${cardName}`);
      return true;
    }

    console.log(`📥 [타로캐시] 다운로드 시작: ${cardName}`);
    
    // ⭐ Cache API 열기
    const cache = await caches.open(CACHE_NAME);
    
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
    const metadata = {
      cardName,
      imageUrl,
      cachedAt: Date.now(),
    };
    localStorage.setItem(`tarot_meta_${cardName}`, JSON.stringify(metadata));
    
    console.log(`✅ [타로캐시] 저장 완료: ${cardName} (${sizeInKB.toFixed(1)}KB)`);
    return true;
  } catch (error) {
    console.error(`❌ [타로캐시] 캐싱 실패: ${cardName}`, error);
    return false;
  }
}

/**
 * ⭐ Cache API에서 캐시된 이미지 가져오기
 * 반환값: 실제 Storage URL (blob URL 대신 직접 URL 사용)
 * 
 * ⚠️ 이전 blob URL 방식의 문제점:
 * - 매번 새로운 blob URL 생성 시 이전 URL revoke 안 됨 → 메모리 누수
 * - 모바일 브라우저가 메모리 부족 시 blob URL을 무효화 → 이미지 로드 실패
 * - 빠른 페이지 전환 시 blob URL이 가비지 컬렉션되어 이미지 깨짐
 * 
 * ✅ 해결 방법: Cache API에서 실제 Storage URL 반환
 * - Blob URL 생성하지 않음 (메모리 누수 없음)
 * - 브라우저가 자체 캐시와 Cache API 활용하여 네트워크 요청 최소화
 * - 모바일에서도 안정적인 이미지 로딩
 */
export async function getCachedTarotImage(cardName: string): Promise<string | null> {
  try {
    // 메타데이터 확인 (만료 체크)
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

    // ⭐ Cache API에서 이미지 확인 (실제 캐시 여부만 체크)
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(metadata.imageUrl);
    
    if (!response) {
      console.log(`⚠️ [타로캐시] 메타데이터는 있지만 캐시 없음: ${cardName}`);
      localStorage.removeItem(metadataKey);
      return null;
    }

    // ⭐ Blob URL 생성하지 않고 실제 Storage URL 반환
    // 브라우저가 Cache API와 자체 캐시를 활용하여 네트워크 요청 최소화
    console.log(`⚡ [타로캐시] 캐시 히트: ${cardName}`);
    return metadata.imageUrl;
  } catch (error) {
    console.error(`❌ [타로캐시] 로드 실패: ${cardName}`, error);
    return null;
  }
}

/**
 * 주문의 모든 타로 카드 이미지를 미리 캐싱
 * LoadingPage에서 AI 생성 완료 후 호출
 */
export async function preloadTarotImages(orderId: string, supabaseUrl: string): Promise<void> {
  try {
    console.log('🎴 [타로캐시] 프리로드 시작:', orderId);
    
    // ⭐ Supabase Client 동적 임포트 (순환 참조 방지)
    const { supabase } = await import('./supabase');
    
    // 1. 주문의 타로 카드 정보 조회
    const { data: tarotCards, error } = await supabase
      .from('order_results')
      .select('tarot_card_name, tarot_card_image_url')
      .eq('order_id', orderId)
      .eq('question_type', 'tarot');
    
    if (error) {
      console.error('❌ [타로캐시] 타로 카드 조회 실패:', error);
      return;
    }
    
    if (!tarotCards || tarotCards.length === 0) {
      console.log('ℹ️ [타로캐시] 타로 카드 없음 (사주만 있는 콘텐츠)');
      return;
    }
    
    console.log(`📦 [타로캐시] ${tarotCards.length}장의 타로 카드 발견`);
    
    // 2. 각 타로 카드 이미지 캐싱 (병렬 처리)
    // ⭐ DB의 tarot_card_image_url 대신 getTarotCardImageUrl 사용 (스테이징 Storage 공용)
    const cachePromises = tarotCards.map((card: { tarot_card_name: string | null }) => {
      if (card.tarot_card_name) {
        const imageUrl = getTarotCardImageUrl(card.tarot_card_name);
        return cacheTarotImage(card.tarot_card_name, imageUrl);
      }
      return Promise.resolve(false);
    });
    
    const results = await Promise.allSettled(cachePromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`✅ [타로캐시] 프리로드 완료: ${successCount}/${tarotCards.length}장 성공`);
  } catch (error) {
    console.error('❌ [타로캐시] 프리로드 실패:', error);
  }
}

/**
 * 특정 카드의 캐시 삭제
 */
export async function clearTarotCache(cardNames?: string[]): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    
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
