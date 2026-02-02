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
  'bb20c4d4-9f8e-4952-9452-a38df762b45a',
  '9fb0b23b-b65b-4fb5-a356-b9969a842c55'
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
  totalCustomers: number;      // 총 가입 고객
  newCustomers: number;        // 신규 고객 (기간 내 가입)
  returningCustomers: number;  // 재방문 고객 (기간 내 방문, 기간 전 가입)
  returnRate: number;          // 재방문율 (%)
  totalVisits: number;         // 기간 내 방문 고객의 총 방문 횟수
  freeContentUsage: number;
  paidContentUsage: number;
  freeContentUserRate: number;  // 무료 콘텐츠 이용 유저 비율 (%)
  paidContentUserRate: number;  // 유료 콘텐츠 이용 유저 비율 (%)
  totalRevenue: number;
  tagStats: TagStat[];
  overallTagConfirmRate: number;
  tagUserRate: number;          // 태그 저장 유저 비율 (%)
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
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  switch (preset) {
    case 'today':
      // 오늘만 (오늘 00:00 ~ 내일 00:00)
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
    case '7days':
      // 지난 7일 (오늘 제외): 어제 기준 -6일 ~ 어제
      return {
        startDate: new Date(yesterday.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()  // lt 연산자용 (어제까지 포함)
      };
    case '30days':
      // 지난 30일 (오늘 제외): 어제 기준 -29일 ~ 어제
      return {
        startDate: new Date(yesterday.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
      };
    case '90days':
      // 지난 90일 (오늘 제외): 어제 기준 -89일 ~ 어제
      return {
        startDate: new Date(yesterday.getTime() - 89 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
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

  // 6. 태그 통계 조회 (source_type별, neutral 제외)
  // 콘텐츠 건 기준으로 계산 (태그 3개 = 1건, 1개라도 확인하면 확인된 건)
  // 기간 내 방문 회원의 태그만 조회
  let periodUserIds: string[] = [];

  if (!isAllPeriod && dateRange?.startDate && dateRange?.endDate) {
    // 기간 내 방문 회원 ID 조회
    const { data: periodUsers, error: periodUsersError } = await supabase
      .from('users')
      .select('id')
      .not('id', 'in', `(${adminFilter})`)
      .gte('last_login_at', dateRange.startDate)
      .lt('last_login_at', dateRange.endDate);

    if (periodUsersError) {
      console.error('기간 내 방문 유저 조회 오류:', periodUsersError);
    }
    periodUserIds = periodUsers?.map(u => u.id) || [];
  }

  // 태그 데이터 조회 (그룹핑을 위해 user_id, created_at도 포함)
  let tagData: { user_id: string; source_type: string; is_confirmed: boolean; created_at: string }[] | null = null;
  let tagError: Error | null = null;

  if (isAllPeriod) {
    // 전체 기간: 최근 5000개 태그만 조회 (성능 최적화)
    const result = await supabase
      .from('user_trait_tags')
      .select('user_id, source_type, is_confirmed, created_at')
      .not('user_id', 'in', `(${adminFilter})`)
      .neq('tag_type', 'neutral')
      .order('created_at', { ascending: false })
      .limit(5000);
    tagData = result.data;
    tagError = result.error;
  } else if (periodUserIds.length > 0 && periodUserIds.length <= 1000) {
    // 기간 내 방문 회원의 태그만 조회
    const result = await supabase
      .from('user_trait_tags')
      .select('user_id, source_type, is_confirmed, created_at')
      .neq('tag_type', 'neutral')
      .in('user_id', periodUserIds);
    tagData = result.data;
    tagError = result.error;
  } else {
    // 유저가 없거나 너무 많으면 빈 결과
    tagData = [];
  }

  if (tagError) {
    console.error('태그 통계 조회 오류:', tagError);
    throw new Error('태그 통계 조회에 실패했습니다.');
  }

  // 콘텐츠 이용 건 기준으로 그룹핑 (user_id + source_type + 초 단위 created_at)
  // 같은 시점에 생성된 태그들을 하나의 콘텐츠 이용 건으로 처리
  const contentGroups: Record<string, { sourceType: string; hasConfirmed: boolean }> = {};

  tagData?.forEach(tag => {
    const sourceType = tag.source_type || 'unknown';
    // 초 단위까지만 사용하여 그룹 키 생성 (밀리초 차이 무시)
    const createdAtSec = tag.created_at?.substring(0, 19) || '';
    const groupKey = `${tag.user_id}_${sourceType}_${createdAtSec}`;

    if (!contentGroups[groupKey]) {
      contentGroups[groupKey] = { sourceType, hasConfirmed: false };
    }
    // 1개라도 확인했으면 해당 콘텐츠 건은 확인된 것으로 처리
    if (tag.is_confirmed) {
      contentGroups[groupKey].hasConfirmed = true;
    }
  });

  // source_type별 콘텐츠 건 통계 계산
  const tagGrouped: Record<string, { total: number; confirmed: number }> = {};
  let totalContents = 0;
  let totalConfirmedContents = 0;

  Object.values(contentGroups).forEach(group => {
    const sourceType = group.sourceType;
    if (!tagGrouped[sourceType]) {
      tagGrouped[sourceType] = { total: 0, confirmed: 0 };
    }
    tagGrouped[sourceType].total++;
    totalContents++;
    if (group.hasConfirmed) {
      tagGrouped[sourceType].confirmed++;
      totalConfirmedContents++;
    }
  });

  // TagStat 배열로 변환
  const tagStats: TagStat[] = Object.entries(tagGrouped).map(([sourceType, stats]) => ({
    sourceType,
    total: stats.total,
    confirmed: stats.confirmed,
    confirmRate: stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 1000) / 10 : 0
  }));

  // 총 콘텐츠 건 수 높은 순으로 정렬
  tagStats.sort((a, b) => b.total - a.total);

  // 전체 확인율 계산 (콘텐츠 건 기준)
  const overallTagConfirmRate = totalContents > 0
    ? Math.round((totalConfirmedContents / totalContents) * 1000) / 10
    : 0;

  // 재방문율 계산 (재방문 고객 / 전체 고객)
  const totalCustomers = (newCustomers || 0) + (returningCustomers || 0);
  const returnRate = totalCustomers > 0
    ? Math.round((returningCustomers || 0) / totalCustomers * 1000) / 10
    : 0;

  // 7. 무료 콘텐츠 이용 유저 수 (고유 user_id 수)
  let freeContentUserQuery = supabase
    .from('free_content_records')
    .select('user_id')
    .not('user_id', 'in', `(${adminFilter})`);

  if (dateRange?.startDate) {
    freeContentUserQuery = freeContentUserQuery.gte('created_at', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    freeContentUserQuery = freeContentUserQuery.lt('created_at', dateRange.endDate);
  }

  const { data: freeContentUsers, error: freeContentUserError } = await freeContentUserQuery;
  if (freeContentUserError) {
    console.error('무료 콘텐츠 유저 조회 오류:', freeContentUserError);
  }
  const uniqueFreeContentUsers = new Set(freeContentUsers?.map(r => r.user_id) || []).size;
  const freeContentUserRate = totalCustomers > 0
    ? Math.round(uniqueFreeContentUsers / totalCustomers * 1000) / 10
    : 0;

  // 8. 유료 콘텐츠 이용 유저 수 (고유 user_id 수)
  let paidContentUserQuery = supabase
    .from('orders')
    .select('user_id')
    .eq('pstatus', 'completed')
    .not('user_id', 'in', `(${adminFilter})`);

  if (dateRange?.startDate) {
    paidContentUserQuery = paidContentUserQuery.gte('created_at', dateRange.startDate);
  }
  if (dateRange?.endDate) {
    paidContentUserQuery = paidContentUserQuery.lt('created_at', dateRange.endDate);
  }

  const { data: paidContentUsers, error: paidContentUserError } = await paidContentUserQuery;
  if (paidContentUserError) {
    console.error('유료 콘텐츠 유저 조회 오류:', paidContentUserError);
  }
  const uniquePaidContentUsers = new Set(paidContentUsers?.map(r => r.user_id) || []).size;
  const paidContentUserRate = totalCustomers > 0
    ? Math.round(uniquePaidContentUsers / totalCustomers * 1000) / 10
    : 0;

  // 9. 회원 태그 저장율: 기간 내 활동 회원 중 확정 태그 1개 이상 보유 비율
  let tagUserRate = 0;

  if (isAllPeriod) {
    // 전체 기간: 전체 회원 대비 태그 보유자 비율 (간소화된 쿼리)
    const { count: totalUserCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'in', `(${adminFilter})`);

    // 확정 태그 보유자 수 (고유 user_id)
    const { data: tagUsersData, error: tagUserError } = await supabase
      .from('user_trait_tags')
      .select('user_id')
      .eq('is_confirmed', true)
      .neq('tag_type', 'neutral')
      .not('user_id', 'in', `(${adminFilter})`);

    if (tagUserError) {
      console.error('태그 유저 조회 오류:', tagUserError);
    }

    const uniqueTagUsers = new Set(tagUsersData?.map(r => r.user_id) || []).size;
    tagUserRate = (totalUserCount || 0) > 0
      ? Math.round(uniqueTagUsers / (totalUserCount || 1) * 1000) / 10
      : 0;
  } else {
    // 기간 필터: 기간 내 활동한 회원 ID 목록 조회
    let activeUsersQuery = supabase
      .from('users')
      .select('id')
      .not('id', 'in', `(${adminFilter})`);

    if (dateRange?.startDate && dateRange?.endDate) {
      activeUsersQuery = activeUsersQuery
        .gte('last_login_at', dateRange.startDate)
        .lt('last_login_at', dateRange.endDate);
    }

    const { data: activeUsersData, error: activeUsersError } = await activeUsersQuery;
    if (activeUsersError) {
      console.error('활동 유저 조회 오류:', activeUsersError);
    }
    const activeUserIds = activeUsersData?.map(u => u.id) || [];

    if (activeUserIds.length > 0 && activeUserIds.length <= 1000) {
      const { data: tagUsersData, error: tagUserError } = await supabase
        .from('user_trait_tags')
        .select('user_id')
        .eq('is_confirmed', true)
        .neq('tag_type', 'neutral')
        .in('user_id', activeUserIds);

      if (tagUserError) {
        console.error('태그 유저 조회 오류:', tagUserError);
      }

      const uniqueTagUsers = new Set(tagUsersData?.map(r => r.user_id) || []).size;
      tagUserRate = activeUserIds.length > 0
        ? Math.round(uniqueTagUsers / activeUserIds.length * 1000) / 10
        : 0;
    }
  }

  return {
    totalCustomers,
    newCustomers: newCustomers || 0,
    returningCustomers: returningCustomers || 0,
    returnRate,
    totalVisits,
    freeContentUsage: freeContentUsage || 0,
    paidContentUsage: paidContentUsage || 0,
    freeContentUserRate,
    paidContentUserRate,
    totalRevenue,
    tagStats,
    overallTagConfirmRate,
    tagUserRate
  };
}

// GA 통계 타입
export interface GAStats {
  realtimeActiveUsers?: number;
  activeUsers?: number;
  newUsers?: number;
  type: 'realtime' | 'period';
}

/**
 * GA 활성 사용자 통계 조회
 * @param type - 'realtime' (실시간) 또는 'period' (기간별)
 * @param dateRange - 기간별 조회 시 날짜 범위
 */
export async function fetchGAStats(
  type: 'realtime' | 'period' = 'realtime',
  dateRange?: DateRangeFilter
): Promise<GAStats | null> {
  try {
    // Edge Function URL 구성
    const params = new URLSearchParams({ type });

    if (type === 'period') {
      // 전체 기간이면 서비스 시작일부터 조회 (2026-01-11)
      const startDate = dateRange?.startDate
        ? dateRange.startDate.split('T')[0]
        : '2026-01-11';  // 서비스 시작일

      // GA API는 endDate를 포함하므로, Supabase용 endDate(+1일)에서 1일 빼기
      let endDate = 'today';
      if (dateRange?.endDate) {
        const endDateObj = new Date(dateRange.endDate);
        endDateObj.setDate(endDateObj.getDate() - 1);  // 1일 빼기
        endDate = endDateObj.toISOString().split('T')[0];
      }

      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }

    const { data, error } = await supabase.functions.invoke('get-ga-stats', {
      body: null,
      headers: {},
    });

    // URL 파라미터를 사용하는 방식으로 변경
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ga-stats?${params.toString()}`;

    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('GA 통계 조회 실패:', response.status);
      return null;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('GA 통계 조회 오류:', result.error);
      return null;
    }

    return {
      type: result.type,
      realtimeActiveUsers: result.realtimeActiveUsers,
      activeUsers: result.activeUsers,
      newUsers: result.newUsers,
    };
  } catch (error) {
    console.error('GA 통계 조회 예외:', error);
    return null;
  }
}
