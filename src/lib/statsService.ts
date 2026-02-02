/**
 * 통계 대시보드 서비스
 * Master 계정 전용 통계 데이터 조회
 */

import { supabase } from './supabase';

// 관리자 ID 목록 (통계에서 제외)
const ADMIN_IDS = [
  'ed0f8340-77fd-4b4c-9e59-65d69dcb6af8',
  '4bf6e63b-740b-474d-8b1f-490c30a0d6b7',
  '689105c2-ae2d-4cce-af25-7bd27b65f435',
  '7ca0c25e-3064-4dbf-b1e1-e7ad0c64c8cd',
  '48f1d43e-b1fa-4e1d-a1d0-01d8511947e0',
  'cc331c7d-feb4-4119-8a3f-3717e1effffd',
  'bb20c4d4-9f8e-4952-9452-a38df762b45a'
];

// 기간 프리셋 타입
export type DateRangePreset = 'today' | '7days' | '30days' | '90days' | 'all' | 'custom';

// 태그별 통계 타입
export interface TagStat {
  sourceType: string;
  total: number;
  confirmed: number;
  confirmRate: number;
}

// 대시보드 통계 타입
export interface DashboardStats {
  newCustomers: number;        // 신규 고객 (기간 내 가입)
  returningCustomers: number;  // 재방문 고객 (기간 내 방문, 기간 전 가입)
  returnRate: number;          // 재방문율 (%)
  totalVisits: number;         // 기간 내 방문 고객의 총 방문 횟수
  freeContentUsage: number;
  paidContentUsage: number;
  totalRevenue: number;
  tagStats: TagStat[];
  overallTagConfirmRate: number;
}

// 기간 필터 옵션
export interface DateRangeFilter {
  startDate?: string; // ISO 형식 (예: '2025-01-01')
  endDate?: string;   // ISO 형식
}

/**
 * 프리셋에 따른 날짜 범위 계산
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRangeFilter {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    case '7days':
      return {
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    case '30days':
      return {
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    case '90days':
      return {
        startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    case 'all':
    default:
      return {}; // 필터 없음
  }
}

/**
 * 대시보드 통계 데이터 조회
 */
export async function fetchDashboardStats(dateRange?: DateRangeFilter): Promise<DashboardStats> {
  // 관리자 ID 필터 문자열 생성 (Supabase는 따옴표 없이 전달)
  const adminFilter = ADMIN_IDS.join(',');

  // 전체 기간 여부 확인
  const isAllPeriod = !dateRange?.startDate && !dateRange?.endDate;

  let newCustomers = 0;
  let returningCustomers = 0;
  let totalVisits = 0;

  if (isAllPeriod) {
    // 전체 기간: visit_count 기준으로 구분
    // 신규 고객: visit_count = 1
    const { count: newCount, error: newError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${adminFilter})`)
      .eq('visit_count', 1);

    if (newError) {
      console.error('신규 고객수 조회 오류:', newError);
      throw new Error('신규 고객수 조회에 실패했습니다.');
    }
    newCustomers = newCount || 0;

    // 재방문 고객: visit_count >= 2
    const { count: returnCount, error: returnError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${adminFilter})`)
      .gte('visit_count', 2);

    if (returnError) {
      console.error('재방문 고객수 조회 오류:', returnError);
      throw new Error('재방문 고객수 조회에 실패했습니다.');
    }
    returningCustomers = returnCount || 0;

    // 총 방문횟수: 전체 visit_count 합계
    const { data: visitData, error: visitError } = await supabase
      .from('users')
      .select('visit_count')
      .not('id', 'in', `(${adminFilter})`);

    if (visitError) {
      console.error('방문횟수 조회 오류:', visitError);
      throw new Error('방문횟수 조회에 실패했습니다.');
    }
    totalVisits = visitData?.reduce((sum, user) => sum + (user.visit_count || 0), 0) || 0;

  } else {
    // 특정 기간: 기간 기준으로 구분
    // 1. 신규 고객 (기간 내 가입)
    let newCustomersQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${adminFilter})`);

    if (dateRange?.startDate) {
      newCustomersQuery = newCustomersQuery.gte('created_at', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      newCustomersQuery = newCustomersQuery.lt('created_at', dateRange.endDate);
    }

    const { count: newCount, error: newError } = await newCustomersQuery;
    if (newError) {
      console.error('신규 고객수 조회 오류:', newError);
      throw new Error('신규 고객수 조회에 실패했습니다.');
    }
    newCustomers = newCount || 0;

    // 2. 재방문 고객 (기간 내 방문했지만 기간 전에 가입)
    let returningCustomersQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${adminFilter})`);

    if (dateRange?.startDate) {
      returningCustomersQuery = returningCustomersQuery.gte('last_login_at', dateRange.startDate);
      returningCustomersQuery = returningCustomersQuery.lt('created_at', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      returningCustomersQuery = returningCustomersQuery.lt('last_login_at', dateRange.endDate);
    }

    const { count: returnCount, error: returnError } = await returningCustomersQuery;
    if (returnError) {
      console.error('재방문 고객수 조회 오류:', returnError);
      throw new Error('재방문 고객수 조회에 실패했습니다.');
    }
    returningCustomers = returnCount || 0;

    // 3. 총 방문횟수 (기간 내 방문한 고객의 visit_count 합계)
    let visitQuery = supabase
      .from('users')
      .select('visit_count')
      .not('id', 'in', `(${adminFilter})`);

    if (dateRange?.startDate) {
      visitQuery = visitQuery.gte('last_login_at', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      visitQuery = visitQuery.lt('last_login_at', dateRange.endDate);
    }

    const { data: visitData, error: visitError } = await visitQuery;
    if (visitError) {
      console.error('방문횟수 조회 오류:', visitError);
      throw new Error('방문횟수 조회에 실패했습니다.');
    }
    totalVisits = visitData?.reduce((sum, user) => sum + (user.visit_count || 0), 0) || 0;
  }

  // 4. 무료 콘텐츠 이용 횟수 (관리자 제외)
  let freeContentQuery = supabase
    .from('free_content_records')
    .select('*', { count: 'exact', head: true })
    .not('user_id', 'in', `(${adminFilter})`);

  if (dateRange?.startDate) {
    freeContentQuery = freeContentQuery.gte('created_at', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    freeContentQuery = freeContentQuery.lt('created_at', dateRange.endDate);
  }

  const { count: freeContentUsage, error: freeContentError } = await freeContentQuery;

  if (freeContentError) {
    console.error('무료 콘텐츠 조회 오류:', freeContentError);
    throw new Error('무료 콘텐츠 이용 횟수 조회에 실패했습니다.');
  }

  // 4. 유료 콘텐츠 이용 횟수 (paid만, 관리자 제외)
  let paidContentQuery = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('pstatus', 'completed')
    .not('user_id', 'in', `(${adminFilter})`);

  if (dateRange?.startDate) {
    paidContentQuery = paidContentQuery.gte('created_at', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    paidContentQuery = paidContentQuery.lt('created_at', dateRange.endDate);
  }

  const { count: paidContentUsage, error: paidContentError } = await paidContentQuery;

  if (paidContentError) {
    console.error('유료 콘텐츠 조회 오류:', paidContentError);
    throw new Error('유료 콘텐츠 이용 횟수 조회에 실패했습니다.');
  }

  // 5. 총 매출 조회 (paid만, 관리자 제외)
  let revenueQuery = supabase
    .from('orders')
    .select('paid_amount')
    .eq('pstatus', 'completed')
    .not('user_id', 'in', `(${adminFilter})`);

  if (dateRange?.startDate) {
    revenueQuery = revenueQuery.gte('created_at', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    revenueQuery = revenueQuery.lt('created_at', dateRange.endDate);
  }

  const { data: revenueData, error: revenueError } = await revenueQuery;

  if (revenueError) {
    console.error('매출 조회 오류:', revenueError);
    throw new Error('매출 조회에 실패했습니다.');
  }

  const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.paid_amount || 0), 0) || 0;

  // 6. 태그 통계 조회 (source_type별)
  let tagQuery = supabase
    .from('user_trait_tags')
    .select('source_type, is_confirmed')
    .not('user_id', 'in', `(${adminFilter})`);

  if (dateRange?.startDate) {
    tagQuery = tagQuery.gte('created_at', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    tagQuery = tagQuery.lt('created_at', dateRange.endDate);
  }

  const { data: tagData, error: tagError } = await tagQuery;

  if (tagError) {
    console.error('태그 통계 조회 오류:', tagError);
    throw new Error('태그 통계 조회에 실패했습니다.');
  }

  // source_type별 그룹화
  const tagGrouped: Record<string, { total: number; confirmed: number }> = {};
  let totalTags = 0;
  let totalConfirmed = 0;

  tagData?.forEach(tag => {
    const sourceType = tag.source_type || 'unknown';
    if (!tagGrouped[sourceType]) {
      tagGrouped[sourceType] = { total: 0, confirmed: 0 };
    }
    tagGrouped[sourceType].total++;
    totalTags++;
    if (tag.is_confirmed) {
      tagGrouped[sourceType].confirmed++;
      totalConfirmed++;
    }
  });

  // TagStat 배열로 변환
  const tagStats: TagStat[] = Object.entries(tagGrouped).map(([sourceType, stats]) => ({
    sourceType,
    total: stats.total,
    confirmed: stats.confirmed,
    confirmRate: stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 1000) / 10 : 0
  }));

  // 총 태그 수 높은 순으로 정렬
  tagStats.sort((a, b) => b.total - a.total);

  // 전체 확인율 계산
  const overallTagConfirmRate = totalTags > 0
    ? Math.round((totalConfirmed / totalTags) * 1000) / 10
    : 0;

  // 재방문율 계산 (재방문 고객 / 전체 고객)
  const totalCustomers = (newCustomers || 0) + (returningCustomers || 0);
  const returnRate = totalCustomers > 0
    ? Math.round((returningCustomers || 0) / totalCustomers * 1000) / 10
    : 0;

  return {
    newCustomers: newCustomers || 0,
    returningCustomers: returningCustomers || 0,
    returnRate,
    totalVisits,
    freeContentUsage: freeContentUsage || 0,
    paidContentUsage: paidContentUsage || 0,
    totalRevenue,
    tagStats,
    overallTagConfirmRate
  };
}
