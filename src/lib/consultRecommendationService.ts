import { supabase } from './supabase';
import type { MasterContent } from './freeContentService';

interface RecommendedCategory {
  main: string;
  sub: string;
}

/**
 * AI가 분류한 카테고리 기반 유료 콘텐츠 추천 조회
 * 매칭 카테고리 우선 노출 + 나머지 전체 인기순으로 채움
 */
export async function fetchConsultRecommendations(
  category: RecommendedCategory | null | undefined,
  limit = 6
): Promise<MasterContent[]> {
  const results: MasterContent[] = [];
  const usedIds = new Set<string>();

  // 1단계: 매칭 카테고리 콘텐츠 우선 수집 (sub → main 순서)
  if (category?.sub) {
    const { data } = await supabase
      .from('master_contents')
      .select('id, content_type, category_main, category_sub, title, description, thumbnail_url, view_count, price_original, price_discount, discount_rate, status')
      .eq('category_sub', category.sub)
      .eq('content_type', 'paid')
      .eq('status', 'deployed')
      .order('weekly_clicks', { ascending: false })
      .limit(limit);
    if (data) {
      for (const item of data) {
        if (!usedIds.has(item.id)) { results.push(item as MasterContent); usedIds.add(item.id); }
      }
    }
  }

  if (results.length < limit && category?.main) {
    const { data } = await supabase
      .from('master_contents')
      .select('id, content_type, category_main, category_sub, title, description, thumbnail_url, view_count, price_original, price_discount, discount_rate, status')
      .eq('category_main', category.main)
      .eq('content_type', 'paid')
      .eq('status', 'deployed')
      .order('weekly_clicks', { ascending: false })
      .limit(limit);
    if (data) {
      for (const item of data) {
        if (!usedIds.has(item.id) && results.length < limit) {
          results.push(item as MasterContent); usedIds.add(item.id);
        }
      }
    }
  }

  // 2단계: 나머지는 전체 인기순으로 채우기
  if (results.length < limit) {
    const { data } = await supabase
      .from('master_contents')
      .select('id, content_type, category_main, category_sub, title, description, thumbnail_url, view_count, price_original, price_discount, discount_rate, status')
      .eq('content_type', 'paid')
      .eq('status', 'deployed')
      .order('weekly_clicks', { ascending: false })
      .limit(limit + results.length);
    if (data) {
      for (const item of data) {
        if (!usedIds.has(item.id) && results.length < limit) {
          results.push(item as MasterContent); usedIds.add(item.id);
        }
      }
    }
  }

  return results;
}
