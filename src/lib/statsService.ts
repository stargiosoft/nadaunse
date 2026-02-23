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
  '9fb0b23b-b65b-4fb5-a356-b9969a842c55',
  '2ad4d963-d51e-4a17-a7ca-5ca533585627',  // beaverj594@gmail.com
  'fa39bffa-fe66-4146-aedc-9e891e6afe6e',
  '78086751-8a01-4fdc-805f-13e4dc14bec9'
];

// 기간 프리셋 타입
export type DateRangePreset = 'today' | '7days' | '30days' | '90days' | '1year' | 'custom';

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
  contentUsageRate: number;     // 콘텐츠 이용율 (무료 또는 유료 1개라도 이용한 유저 비율 %)
  totalRevenue: number;
  tagStats: TagStat[];
  overallTagConfirmRate: number;
  tagUserRate: number;          // 태그 저장 유저 비율 (%)
  // 태그 상세 통계
  tagUserCount: number;         // 태그 저장 고객 수
  totalTagCount: number;        // 전체 태그 수
  confirmedTagCount: number;    // 확인된 태그 수
  avgTagsPerUser: number;       // 회원 당 평균 태그 저장 개수
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
    case '1year':
      // 지난 1년 (오늘 제외): 어제 기준 -364일 ~ 어제
      return {
        startDate: new Date(yesterday.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
      };
    default:
      // 오늘 (기본값)
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      };
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
  let totalCustomerIds = new Set<string>();  // 콘텐츠 이용율 계산 시 분자 필터용

  if (isAllPeriod) {
    // 전체 기간: visit_dates 배열 길이 기준으로 구분
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, visit_dates, created_at')
      .not('id', 'in', `(${adminFilter})`);

    if (usersError) {
      console.error('고객 데이터 조회 오류:', usersError);
      throw new Error('고객 데이터 조회에 실패했습니다.');
    }

    newCustomers = usersData?.filter(u => (u.visit_dates?.length || 0) <= 1).length || 0;
    returningCustomers = usersData?.filter(u => (u.visit_dates?.length || 0) >= 2).length || 0;
    totalVisits = usersData?.reduce((sum, u) => sum + (u.visit_dates?.length || 0), 0) || 0;
    totalCustomerIds = new Set(usersData?.map(u => u.id) || []);

  } else {
    // 특정 기간: 기간 기준으로 구분
    // 1. 신규 고객 (기간 내 가입) - ID도 조회하여 콘텐츠 이용율 필터에 사용
    let newCustomersQuery = supabase
      .from('users')
      .select('id')
      .not('id', 'in', `(${adminFilter})`);

    if (dateRange?.startDate) {
      newCustomersQuery = newCustomersQuery.gte('created_at', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      newCustomersQuery = newCustomersQuery.lt('created_at', dateRange.endDate);
    }

    const { data: newCustomersData, error: newError } = await newCustomersQuery;
    if (newError) {
      console.error('신규 고객수 조회 오류:', newError);
      throw new Error('신규 고객수 조회에 실패했습니다.');
    }
    newCustomers = newCustomersData?.length || 0;

    // 2. 재방문 고객 (visit_dates 중 기간 내 날짜가 있으면서 기간 전 가입자)
    const { data: returningUsersData, error: returnError } = await supabase
      .from('users')
      .select('id, visit_dates, created_at')
      .not('id', 'in', `(${adminFilter})`)
      .lt('created_at', dateRange.startDate!);  // 기간 전 가입자만

    if (returnError) {
      console.error('재방문 고객수 조회 오류:', returnError);
      throw new Error('재방문 고객수 조회에 실패했습니다.');
    }

    // ISO 문자열을 로컬 날짜 문자열로 변환 (UTC가 아닌 KST 기준)
    const toLocalDateStr = (isoStr: string) => {
      const d = new Date(isoStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const startDateStr = toLocalDateStr(dateRange.startDate!);
    const endDateStr = toLocalDateStr(dateRange.endDate!);

    const returningUsersList = returningUsersData?.filter(u =>
      u.visit_dates?.some((d: string) => d >= startDateStr && d < endDateStr)
    ) || [];
    returningCustomers = returningUsersList.length;

    // totalCustomerIds: 신규 + 재방문 고객 ID 합집합
    const newIds = newCustomersData?.map(u => u.id) || [];
    const returnIds = returningUsersList.map(u => u.id);
    totalCustomerIds = new Set([...newIds, ...returnIds]);

    // 3. 총 방문횟수 (기간 내 모든 사용자의 visit_dates 중 기간 내 날짜 수 합계)
    const { data: allUsersForVisits, error: visitError } = await supabase
      .from('users')
      .select('id, visit_dates')
      .not('id', 'in', `(${adminFilter})`);

    if (visitError) {
      console.error('방문횟수 조회 오류:', visitError);
      throw new Error('방문횟수 조회에 실패했습니다.');
    }

    totalVisits = allUsersForVisits?.reduce((sum, u) => {
      const visitsInRange = u.visit_dates?.filter((d: string) => d >= startDateStr && d < endDateStr).length || 0;
      return sum + visitsInRange;
    }, 0) || 0;
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

  // 4. 유료 콘텐츠 이용 횟수 (paid만, 0원 제외, 관리자 제외)
  let paidContentQuery = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('pstatus', 'completed')
    .gt('paid_amount', 0)
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

  // 5. 총 매출 조회 (paid만, 0원 제외, 관리자 제외)
  let revenueQuery = supabase
    .from('orders')
    .select('paid_amount')
    .eq('pstatus', 'completed')
    .gt('paid_amount', 0)
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
  } else {
    // 기간 필터: 해당 기간 내 생성된 태그만 조회
    const result = await supabase
      .from('user_trait_tags')
      .select('user_id, source_type, is_confirmed, created_at')
      .neq('tag_type', 'neutral')
      .not('user_id', 'in', `(${adminFilter})`)
      .gte('created_at', dateRange.startDate)
      .lt('created_at', dateRange.endDate);
    tagData = result.data;
    tagError = result.error;
  }

  if (tagError) {
    console.error('태그 통계 조회 오류:', tagError);
    throw new Error('태그 통계 조회에 실패했습니다.');
  }

  // 개별 확인 태그 수 (개요 "확인 태그수" 표시용)
  const individualConfirmedTags = tagData?.filter(t => t.is_confirmed).length || 0;

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
  // totalCustomerIds에 포함된 유저만 카운트 (회원가입 고객 통계이므로)
  const uniqueFreeContentUsers = new Set(
    freeContentUsers?.map(r => r.user_id).filter(id => totalCustomerIds.has(id)) || []
  ).size;
  const freeContentUserRate = totalCustomers > 0
    ? Math.round(uniqueFreeContentUsers / totalCustomers * 1000) / 10
    : 0;

  // 8. 유료 콘텐츠 이용 유저 수 (고유 user_id 수, 0원 제외)
  let paidContentUserQuery = supabase
    .from('orders')
    .select('user_id')
    .eq('pstatus', 'completed')
    .gt('paid_amount', 0)
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
  const uniquePaidContentUsers = new Set(
    paidContentUsers?.map(r => r.user_id).filter(id => totalCustomerIds.has(id)) || []
  ).size;
  const paidContentUserRate = totalCustomers > 0
    ? Math.round(uniquePaidContentUsers / totalCustomers * 1000) / 10
    : 0;

  // 8-1. 콘텐츠 이용율: 무료 또는 유료 1개라도 이용한 고유 유저 수 (totalCustomers에 포함된 유저만)
  const freeUserSet = new Set(
    freeContentUsers?.map(r => r.user_id).filter(id => totalCustomerIds.has(id)) || []
  );
  const paidUserSet = new Set(
    paidContentUsers?.map(r => r.user_id).filter(id => totalCustomerIds.has(id)) || []
  );
  const contentUserSet = new Set([...freeUserSet, ...paidUserSet]);
  const uniqueContentUsers = contentUserSet.size;
  const contentUsageRate = totalCustomers > 0
    ? Math.round(uniqueContentUsers / totalCustomers * 1000) / 10
    : 0;

  // 9. 태그 저장 고객: 기간 내 확정 태그를 생성한 유니크 사용자
  let tagUserRate = 0;
  let tagUserCount = 0;  // 태그 저장 고객 수

  if (isAllPeriod) {
    // 전체 기간: 확정 태그 생성자 수 (고유 user_id)
    const { data: tagUsersData, error: tagUserError } = await supabase
      .from('user_trait_tags')
      .select('user_id')
      .eq('is_confirmed', true)
      .neq('tag_type', 'neutral')
      .not('user_id', 'in', `(${adminFilter})`);

    if (tagUserError) {
      console.error('태그 유저 조회 오류:', tagUserError);
    }

    tagUserCount = new Set(tagUsersData?.map(r => r.user_id) || []).size;
    // 저장율: 총 가입 고객 대비
    tagUserRate = totalCustomers > 0
      ? Math.round(tagUserCount / totalCustomers * 1000) / 10
      : 0;
  } else {
    // 기간 필터: 해당 기간 내 확정 태그를 생성한 유니크 사용자
    // 🔍 디버깅 로그: 개요 쿼리 범위
    console.log('=== 개요 디버깅 ===');
    console.log('쿼리 범위:', dateRange.startDate, '~', dateRange.endDate);

    const { data: tagUsersData, error: tagUserError } = await supabase
      .from('user_trait_tags')
      .select('user_id')
      .eq('is_confirmed', true)
      .neq('tag_type', 'neutral')
      .not('user_id', 'in', `(${adminFilter})`)
      .gte('created_at', dateRange.startDate)
      .lt('created_at', dateRange.endDate);

    if (tagUserError) {
      console.error('태그 유저 조회 오류:', tagUserError);
    }

    // 🔍 디버깅 로그: 개요 결과
    console.log('태그 저장 고객 (개요):', tagUsersData?.length, '행');
    tagUserCount = new Set(tagUsersData?.map(r => r.user_id) || []).size;
    console.log('유니크 유저 수 (개요):', tagUserCount);
    // 저장율: 총 가입 고객 대비
    tagUserRate = totalCustomers > 0
      ? Math.round(tagUserCount / totalCustomers * 1000) / 10
      : 0;
  }

  // 회원 당 평균 확인 태그 개수 (개별 확인 태그 수 / 태그 저장 고객 수)
  const avgTagsPerUser = tagUserCount > 0
    ? Math.round(individualConfirmedTags / tagUserCount * 10) / 10
    : 0;

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
    contentUsageRate,
    totalRevenue,
    tagStats,
    overallTagConfirmRate,
    tagUserRate,
    // 태그 상세 통계
    tagUserCount,
    totalTagCount: totalContents,  // 전체 콘텐츠 건수 (UI에서 미사용, 태그 확인율 계산에만 사용)
    confirmedTagCount: individualConfirmedTags,  // 개별 확인 태그 수
    avgTagsPerUser
  };
}

// 추세 프리셋 타입
export type TrendRangePreset = '7days' | '30days' | '90days' | '1year' | 'custom';

// 집계 단위 타입
export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

/**
 * 프리셋에 따른 집계 단위 결정
 */
export function getGranularityFromPreset(preset: TrendRangePreset): TrendGranularity {
  switch (preset) {
    case '7days':
    case '30days':
    case 'custom':
      return 'daily';
    case '90days':
      return 'weekly';
    case '1year':
      return 'monthly';
    default:
      return 'daily';
  }
}

// 일별 GA 데이터 타입
export interface DailyGAData {
  date: string;  // 'YYYYMMDD' 형식
  activeUsers: number;
  newUsers: number;
  averageEngagementTime: number;
}

// 일별 추세 데이터 타입
export interface DailyTrendData {
  date: string;  // 'MM/DD' 형식
  dateLabel: string;  // 표시용 (예: '01/28')
  fullDate: string;  // 'YYYY-MM-DD' 형식
  // 회원가입 지표
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  // 콘텐츠 이용
  freeContentUsage: number;
  paidContentUsage: number;
  totalContentUsage: number;
  // 비율 지표 (%)
  contentUsageRate: number;  // 콘텐츠 이용율 (uniqueContentUsers / totalCustomers)
  // 매출
  revenue: number;
  // 태그 지표
  tagSaved: number;  // 전체 태그 수
  tagConfirmed: number;  // 확인 태그 수
  uniqueTagUsers: number;  // 태그 저장 고객 수
  tagSaveRate: number;  // 태그 저장율 (uniqueTagUsers / totalCustomers * 100)
  tagConfirmRate: number;  // 태그 확인율 (tagConfirmed / tagSaved * 100)
  avgTagsPerUser: number;  // 회원당 태그 수 (tagConfirmed / uniqueTagUsers)
  // 콘텐츠 이용 유저
  uniqueContentUsers: number;  // 콘텐츠 이용한 고유 유저 수
  // GA 관련 지표
  gaActiveUsers: number;  // 총 방문자 (GA)
  gaNewUsers: number;  // GA 신규 방문자
  gaAverageEngagementTime: number;  // 평균 참여 시간 (초)
  signupRate: number;  // 회원가입율 (newCustomers / gaNewUsers * 100)
}

/**
 * 추세 프리셋에 따른 날짜 범위 계산 (전날 기준)
 */
export function getTrendDateRange(preset: TrendRangePreset): DateRangeFilter {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  switch (preset) {
    case '7days':
      // 지난 7일: 어제 기준 -6일 ~ 어제
      return {
        startDate: new Date(yesterday.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
      };
    case '30days':
      return {
        startDate: new Date(yesterday.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
      };
    case '90days':
      return {
        startDate: new Date(yesterday.getTime() - 89 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
      };
    case '1year':
      return {
        startDate: new Date(yesterday.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
      };
    default:
      return {
        startDate: new Date(yesterday.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: today.toISOString()
      };
  }
}

/**
 * 일별 추세 데이터 조회 (Supabase + GA 데이터 병합)
 * @param dateRange 날짜 범위
 * @param preset 프리셋 (90일: 주별, 1년: 월별 집계)
 */
export async function fetchDailyTrendStats(dateRange: DateRangeFilter, preset?: TrendRangePreset): Promise<DailyTrendData[]> {
  const adminFilter = ADMIN_IDS.join(',');

  // 날짜 배열 생성
  const startDate = new Date(dateRange.startDate!);
  const endDate = new Date(dateRange.endDate!);
  const dateArray: Date[] = [];

  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    dateArray.push(new Date(d));
  }

  // 🔍 디버깅 로그 1: 쿼리 범위 및 dateArray
  console.log('=== 추세 디버깅 ===');
  console.log('쿼리 범위 (원본):', dateRange.startDate, '~', dateRange.endDate);
  console.log('쿼리 범위 (로컬):', startDate.toString(), '~', endDate.toString());
  console.log('dateArray 길이:', dateArray.length);
  console.log('dateArray:', dateArray.map(d => ({ iso: d.toISOString(), local: d.toString() })));

  // Supabase 데이터와 GA 데이터를 병렬로 조회
  const [
    newCustomersResult,
    returningCustomersResult,
    freeContentResult,
    paidContentResult,
    tagDataResult,
    gaDataResult,
  ] = await Promise.all([
    // 1. 신규 고객 데이터 (created_at 기준)
    supabase
      .from('users')
      .select('id, created_at')
      .not('id', 'in', `(${adminFilter})`)
      .gte('created_at', dateRange.startDate)
      .lt('created_at', dateRange.endDate),

    // 2. 재방문 고객 데이터 (visit_dates 기준, 기간 내 가입자 포함 - 일별 필터링에서 created_at < 해당일 체크)
    supabase
      .from('users')
      .select('id, visit_dates, created_at')
      .not('id', 'in', `(${adminFilter})`)
      .lt('created_at', dateRange.endDate),

    // 3. 무료 콘텐츠 이용 데이터
    supabase
      .from('free_content_records')
      .select('user_id, created_at')
      .not('user_id', 'in', `(${adminFilter})`)
      .gte('created_at', dateRange.startDate)
      .lt('created_at', dateRange.endDate),

    // 4. 유료 콘텐츠 이용 데이터 (paid만, 0원 제외, 관리자 제외)
    supabase
      .from('orders')
      .select('user_id, created_at, paid_amount')
      .eq('pstatus', 'completed')
      .gt('paid_amount', 0)
      .not('user_id', 'in', `(${adminFilter})`)
      .gte('created_at', dateRange.startDate)
      .lt('created_at', dateRange.endDate),

    // 5. 태그 데이터 (Supabase 기본 limit 1000개 제한 우회: range 사용)
    // source_type 추가: 콘텐츠 건 기준 그룹핑에 필요
    supabase
      .from('user_trait_tags')
      .select('user_id, created_at, is_confirmed, source_type', { count: 'exact' })
      .neq('tag_type', 'neutral')
      .not('user_id', 'in', `(${adminFilter})`)
      .gte('created_at', dateRange.startDate)
      .lt('created_at', dateRange.endDate)
      .range(0, 9999),

    // 6. GA 일별 데이터
    fetchDailyGAStatsInternal(dateRange),
  ]);

  const newCustomersData = newCustomersResult.data;
  const returningCustomersData = returningCustomersResult.data;
  const freeContentData = freeContentResult.data;
  const paidContentData = paidContentResult.data;
  const tagData = tagDataResult.data;
  const gaData = gaDataResult;

  // 🔍 디버깅 로그 2: 쿼리 결과
  console.log('태그 데이터 총 수:', tagData?.length);
  console.log('확정 태그 수:', tagData?.filter(t => t.is_confirmed).length);
  console.log('확정 태그 유니크 유저 (쿼리 전체):', new Set(tagData?.filter(t => t.is_confirmed).map(t => t.user_id)).size);

  // GA 데이터를 날짜별 Map으로 변환 (YYYYMMDD -> data)
  const gaDataMap = new Map<string, DailyGAData>();
  if (gaData) {
    gaData.forEach(d => {
      gaDataMap.set(d.date, d);
    });
  }

  // 날짜별로 그룹핑 (로컬 시간 기준으로 변환)
  const getDateKey = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  // YYYY-MM-DD를 YYYYMMDD로 변환
  const toGADateFormat = (dateKey: string) => dateKey.replace(/-/g, '');

  const dailyData: DailyTrendData[] = dateArray.map(date => {
    // 로컬 시간 기준으로 dateKey 생성 (GA 데이터가 KST 기준이므로)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    // 해당 날짜의 데이터 필터링
    const newCustomersList = newCustomersData?.filter(d => getDateKey(d.created_at) === dateKey) || [];
    // 재방문자: visit_dates에 해당 날짜가 포함되고, 해당 날짜 이전에 가입한 사용자
    const returningCustomersList = returningCustomersData?.filter(d => {
      const createdDateKey = getDateKey(d.created_at);
      return createdDateKey < dateKey && d.visit_dates?.includes(dateKey);
    }) || [];
    const newCustomers = newCustomersList.length;
    const returningCustomers = returningCustomersList.length;
    const totalCustomers = newCustomers + returningCustomers;

    // 해당 일자의 totalCustomers에 포함된 유저 ID (콘텐츠 이용율 필터용)
    const dayCustomerIds = new Set([
      ...newCustomersList.map(d => d.id),
      ...returningCustomersList.map(d => d.id),
    ]);

    // 무료 콘텐츠
    const freeContentList = freeContentData?.filter(d => getDateKey(d.created_at) === dateKey) || [];
    const freeContentUsage = freeContentList.length;
    const uniqueFreeUsers = new Set(freeContentList.map(d => d.user_id).filter(id => dayCustomerIds.has(id)));

    // 유료 콘텐츠
    const paidContentList = paidContentData?.filter(d => getDateKey(d.created_at) === dateKey) || [];
    const paidContentUsage = paidContentList.length;
    const revenue = paidContentList.reduce((sum, d) => sum + (d.paid_amount || 0), 0);
    const uniquePaidUsers = new Set(paidContentList.map(d => d.user_id).filter(id => dayCustomerIds.has(id)));

    // 콘텐츠 이용 고유 유저 (totalCustomers에 포함된 유저만)
    const uniqueContentUsers = new Set([...uniqueFreeUsers, ...uniquePaidUsers]).size;
    const totalContentUsage = freeContentUsage + paidContentUsage;

    // 태그 - 콘텐츠 건 기준으로 그룹핑 (개요와 동일한 로직)
    const tagList = tagData?.filter(d => getDateKey(d.created_at) === dateKey) || [];
    const tagSaved = tagList.length;
    const tagConfirmed = tagList.filter(t => t.is_confirmed).length;

    // 콘텐츠 건 기준 그룹핑: user_id + source_type + created_at(초 단위)
    const contentGroups: Record<string, { hasConfirmed: boolean }> = {};
    tagList.forEach(tag => {
      const sourceType = (tag as { source_type?: string }).source_type || 'unknown';
      const createdAtSec = tag.created_at?.substring(0, 19) || '';
      const groupKey = `${tag.user_id}_${sourceType}_${createdAtSec}`;

      if (!contentGroups[groupKey]) {
        contentGroups[groupKey] = { hasConfirmed: false };
      }
      if (tag.is_confirmed) {
        contentGroups[groupKey].hasConfirmed = true;
      }
    });

    // 콘텐츠 건 수 계산
    const totalContentGroups = Object.keys(contentGroups).length;
    const confirmedContentGroups = Object.values(contentGroups).filter(g => g.hasConfirmed).length;

    // 태그 저장 고객: 확정 태그(is_confirmed=true)를 저장한 유니크 사용자 (개요와 동일)
    const confirmedTagList = tagList.filter(t => t.is_confirmed);
    const uniqueTagUsers = new Set(confirmedTagList.map(d => d.user_id)).size;

    // 🔍 디버깅 로그 3: 일별 필터링 결과
    console.log(`[${dateKey}] 태그 필터링: 전체=${tagList.length}, 확정=${confirmedTagList.length}, 유니크유저=${uniqueTagUsers}`);
    
    // 🔍 디버깅 로그 4: dateKey 매칭 안 된 태그 샘플
    if (dateArray.length === 1) {
      const unmatchedTags = tagData?.filter(d => getDateKey(d.created_at) !== dateKey) || [];
      if (unmatchedTags.length > 0) {
        console.log(`[${dateKey}] 매칭 안 된 태그 수:`, unmatchedTags.length);
        console.log('매칭 안 된 태그 샘플 (최대 5개):', unmatchedTags.slice(0, 5).map(t => ({
          created_at: t.created_at,
          dateKey: getDateKey(t.created_at),
          is_confirmed: t.is_confirmed
        })));
      }
    }

    // GA 데이터 가져오기
    const gaDateKey = toGADateFormat(dateKey);
    const gaDayData = gaDataMap.get(gaDateKey);
    const gaActiveUsers = gaDayData?.activeUsers || 0;
    const gaNewUsers = gaDayData?.newUsers || 0;
    const gaAverageEngagementTime = gaDayData?.averageEngagementTime || 0;

    // 비율 계산
    // 콘텐츠 이용율: 총 가입 고객 대비 (개요와 동일)
    const contentUsageRate = totalCustomers > 0
      ? Math.round(uniqueContentUsers / totalCustomers * 1000) / 10
      : 0;
    // 태그 저장율: 총 가입 고객 대비 태그 저장 고객
    const tagSaveRate = totalCustomers > 0
      ? Math.round(uniqueTagUsers / totalCustomers * 1000) / 10
      : 0;
    // 태그 확인율: 콘텐츠 건 기준 (개요와 동일)
    // 확인된 콘텐츠 건 / 전체 콘텐츠 건
    const tagConfirmRate = totalContentGroups > 0
      ? Math.round(confirmedContentGroups / totalContentGroups * 1000) / 10
      : 0;
    // 회원당 태그 수: 태그 저장 고객 당 평균 확인 태그 개수
    const avgTagsPerUser = uniqueTagUsers > 0
      ? Math.round(tagConfirmed / uniqueTagUsers * 10) / 10
      : 0;
    // 회원가입율: GA 신규 방문자 대비 Supabase 신규 회원가입
    const signupRate = gaNewUsers > 0
      ? Math.round(newCustomers / gaNewUsers * 1000) / 10
      : 0;

    return {
      date: `${month}/${day}`,
      dateLabel: `${month}/${day}`,
      fullDate: dateKey,
      newCustomers,
      returningCustomers,
      totalCustomers,
      freeContentUsage,
      paidContentUsage,
      totalContentUsage,
      contentUsageRate,
      revenue,
      tagSaved,
      tagConfirmed,
      uniqueTagUsers,
      tagSaveRate,
      tagConfirmRate,
      avgTagsPerUser,
      uniqueContentUsers,
      // GA 관련 지표
      gaActiveUsers,
      gaNewUsers,
      gaAverageEngagementTime,
      signupRate,
    };
  });

  // 프리셋에 따른 집계 적용
  const granularity = preset ? getGranularityFromPreset(preset) : 'daily';

  if (granularity === 'daily') {
    return dailyData;
  }

  return aggregateTrendData(dailyData, granularity);
}

/**
 * 주 번호 계산 (해당 월의 몇 번째 주인지)
 */
function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
}

/**
 * 주의 시작일 계산 (월요일 기준)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  return new Date(d.setDate(diff));
}

/**
 * 일별 데이터를 주별/월별로 집계
 */
function aggregateTrendData(dailyData: DailyTrendData[], granularity: TrendGranularity): DailyTrendData[] {
  if (granularity === 'daily' || dailyData.length === 0) return dailyData;

  // 그룹화
  const groups: Record<string, { label: string; data: DailyTrendData[] }> = {};

  dailyData.forEach(day => {
    const date = new Date(day.fullDate);
    let groupKey: string;
    let groupLabel: string;

    if (granularity === 'weekly') {
      // 주 단위 그룹핑 (월요일 기준)
      const weekStart = getWeekStart(date);
      groupKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      const month = date.getMonth() + 1;
      const weekOfMonth = getWeekOfMonth(date);
      groupLabel = `${month}월 ${weekOfMonth}주`;
    } else {
      // 월 단위 그룹핑
      groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      groupLabel = `${date.getMonth() + 1}월`;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = { label: groupLabel, data: [] };
    }
    groups[groupKey].data.push(day);
  });

  // 그룹별 집계
  const sortedKeys = Object.keys(groups).sort();

  return sortedKeys.map(key => {
    const { label, data } = groups[key];

    // 합계 계산
    const newCustomers = data.reduce((sum, d) => sum + d.newCustomers, 0);
    const returningCustomers = data.reduce((sum, d) => sum + d.returningCustomers, 0);
    const totalCustomers = newCustomers + returningCustomers;
    const freeContentUsage = data.reduce((sum, d) => sum + d.freeContentUsage, 0);
    const paidContentUsage = data.reduce((sum, d) => sum + d.paidContentUsage, 0);
    const totalContentUsage = freeContentUsage + paidContentUsage;
    const revenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const tagSaved = data.reduce((sum, d) => sum + d.tagSaved, 0);
    const tagConfirmed = data.reduce((sum, d) => sum + d.tagConfirmed, 0);
    const uniqueTagUsers = data.reduce((sum, d) => sum + d.uniqueTagUsers, 0);
    const uniqueContentUsers = data.reduce((sum, d) => sum + d.uniqueContentUsers, 0);
    const gaActiveUsers = data.reduce((sum, d) => sum + d.gaActiveUsers, 0);
    const gaNewUsers = data.reduce((sum, d) => sum + d.gaNewUsers, 0);

    // 평균 계산 (시간 관련)
    const gaAverageEngagementTime = data.length > 0
      ? Math.round(data.reduce((sum, d) => sum + d.gaAverageEngagementTime, 0) / data.length)
      : 0;

    // 비율 재계산 (합계 기반)
    const contentUsageRate = totalCustomers > 0
      ? Math.round(uniqueContentUsers / totalCustomers * 1000) / 10
      : 0;
    const tagSaveRate = totalCustomers > 0
      ? Math.round(uniqueTagUsers / totalCustomers * 1000) / 10
      : 0;
    // 태그 확인율: 일별 값의 평균 사용 (콘텐츠 기준 유지)
    const daysWithTags = data.filter(d => d.tagSaved > 0);
    const tagConfirmRate = daysWithTags.length > 0
      ? Math.round(daysWithTags.reduce((sum, d) => sum + d.tagConfirmRate, 0) / daysWithTags.length * 10) / 10
      : 0;
    const avgTagsPerUser = uniqueTagUsers > 0
      ? Math.round(tagConfirmed / uniqueTagUsers * 10) / 10
      : 0;
    const signupRate = gaNewUsers > 0
      ? Math.round(newCustomers / gaNewUsers * 1000) / 10
      : 0;

    return {
      date: label,
      dateLabel: label,
      fullDate: data[0].fullDate, // 그룹의 첫 번째 날짜
      newCustomers,
      returningCustomers,
      totalCustomers,
      freeContentUsage,
      paidContentUsage,
      totalContentUsage,
      contentUsageRate,
      revenue,
      tagSaved,
      tagConfirmed,
      uniqueTagUsers,
      tagSaveRate,
      tagConfirmRate,
      avgTagsPerUser,
      uniqueContentUsers,
      gaActiveUsers,
      gaNewUsers,
      gaAverageEngagementTime,
      signupRate,
    };
  });
}

/**
 * 일별 GA 통계 조회 (내부용 - Promise 반환)
 */
async function fetchDailyGAStatsInternal(
  dateRange: DateRangeFilter
): Promise<DailyGAData[] | null> {
  try {
    const formatLocalDate = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    let startDateStr = '2026-01-11';
    if (dateRange?.startDate) {
      const startDateObj = new Date(dateRange.startDate);
      startDateStr = formatLocalDate(startDateObj);
    }

    let endDateStr = 'today';
    if (dateRange?.endDate) {
      const endDateObj = new Date(dateRange.endDate);
      endDateObj.setDate(endDateObj.getDate() - 1);
      endDateStr = formatLocalDate(endDateObj);
    }

    const params = new URLSearchParams({
      type: 'daily',
      startDate: startDateStr,
      endDate: endDateStr,
    });

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ga-stats?${params.toString()}`;

    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('일별 GA 통계 조회 실패:', response.status);
      return null;
    }

    const result = await response.json();
    if (!result.success) {
      console.error('일별 GA 통계 조회 오류:', result.error);
      return null;
    }

    return result.data as DailyGAData[];
  } catch (error) {
    console.error('일별 GA 통계 조회 예외:', error);
    return null;
  }
}

// GA 통계 타입
export interface GAStats {
  realtimeActiveUsers?: number;
  activeUsers?: number;
  newUsers?: number;
  averageEngagementTime?: number;  // 활성 사용자당 평균 참여 시간 (초)
  freeResultPageViews?: number;    // 무료 운세 결과 페이지 조회수
  freeResultPageViewsPerUser?: number;  // 활성 사용자당 무료 운세 결과 조회수
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
      // 로컬 날짜 형식 변환 함수 (UTC 시간대 문제 방지)
      const formatLocalDate = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };

      // 전체 기간이면 서비스 시작일부터 조회 (2026-01-11)
      let startDateStr = '2026-01-11';  // 서비스 시작일
      if (dateRange?.startDate) {
        const startDateObj = new Date(dateRange.startDate);
        startDateStr = formatLocalDate(startDateObj);
      }

      // endDate 처리 (GA API는 endDate를 inclusive하게 처리하므로 항상 1일 빼기)
      let endDateStr = 'today';
      if (dateRange?.endDate) {
        const endDateObj = new Date(dateRange.endDate);
        endDateObj.setDate(endDateObj.getDate() - 1);
        endDateStr = formatLocalDate(endDateObj);
      }

      params.append('startDate', startDateStr);
      params.append('endDate', endDateStr);
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
      averageEngagementTime: result.averageEngagementTime,
      freeResultPageViews: result.freeResultPageViews,
      freeResultPageViewsPerUser: result.freeResultPageViewsPerUser,
    };
  } catch (error) {
    console.error('GA 통계 조회 예외:', error);
    return null;
  }
}

/**
 * 일별 GA 통계 조회
 * @param dateRange - 날짜 범위
 */
export async function fetchDailyGAStats(
  dateRange: DateRangeFilter
): Promise<DailyGAData[] | null> {
  try {
    // 로컬 날짜 형식 변환 함수 (UTC 시간대 문제 방지)
    const formatLocalDate = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // startDate 처리
    let startDateStr = '2026-01-11';  // 서비스 시작일
    if (dateRange?.startDate) {
      const startDateObj = new Date(dateRange.startDate);
      startDateStr = formatLocalDate(startDateObj);
    }

    // endDate 처리 (오늘 제외)
    let endDateStr = 'today';
    if (dateRange?.endDate) {
      const endDateObj = new Date(dateRange.endDate);
      endDateObj.setDate(endDateObj.getDate() - 1);  // GA API는 endDate 포함이므로 1일 빼기
      endDateStr = formatLocalDate(endDateObj);
    }

    const params = new URLSearchParams({
      type: 'daily',
      startDate: startDateStr,
      endDate: endDateStr,
    });

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ga-stats?${params.toString()}`;

    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('일별 GA 통계 조회 실패:', response.status);
      return null;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('일별 GA 통계 조회 오류:', result.error);
      return null;
    }

    return result.data as DailyGAData[];
  } catch (error) {
    console.error('일별 GA 통계 조회 예외:', error);
    return null;
  }
}

// ========== 콘텐츠 랭킹 타입 및 함수 ==========

/** 콘텐츠 타입 필터 */
export type ContentTypeFilter = 'all' | 'paid' | 'free';

/** 콘텐츠 기간 필터 */
export type ContentPeriodFilter = 'this_week' | 'last_week' | 'all';

/** 카테고리별 이용 통계 */
export interface CategoryViewStats {
  category: string;
  totalViews: number;
  contentCount: number;
}

/** 개별 콘텐츠 이용 통계 */
export interface ContentViewStats {
  id: string;
  title: string;
  contentType: 'free' | 'paid';
  viewCount: number;
  categoryMain: string;
}

// DB에 혼재하는 카테고리명 이형(異形)을 정규화하는 매핑 테이블
const CATEGORY_ALIASES: Record<string, string> = {
  '이사매매': '이사/매매',
};

/** 카테고리명을 정규화된 표준 이름으로 변환 */
function normalizeCategoryName(cat: string): string {
  return CATEGORY_ALIASES[cat] ?? cat;
}

/** 정규화된 카테고리명에 해당하는 모든 원본 이름(이형 포함) 반환 */
function getCategoryOriginalNames(normalizedCat: string): string[] {
  const aliases = Object.entries(CATEGORY_ALIASES)
    .filter(([, v]) => v === normalizedCat)
    .map(([k]) => k);
  return [normalizedCat, ...aliases];
}

/**
 * 카테고리별 콘텐츠 뷰수 랭킹 조회 (기간 필터 기반)
 * - 'this_week': weekly_clicks 기준
 * - 'last_week': last_weekly_clicks 기준
 * - 'all': view_count 누적 조회수 기준
 */
export async function fetchCategoryViewRanking(
  contentTypeFilter: ContentTypeFilter = 'all',
  period: ContentPeriodFilter = 'all'
): Promise<CategoryViewStats[]> {
  try {
    const viewColumn = period === 'this_week' ? 'weekly_clicks'
      : period === 'last_week' ? 'last_weekly_clicks'
      : 'view_count';

    let query = supabase
      .from('master_contents')
      .select(`category_main, ${viewColumn}`)
      .eq('status', 'deployed');

    if (contentTypeFilter !== 'all') {
      query = query.eq('content_type', contentTypeFilter);
    }

    const { data, error } = await query;
    if (error) { console.error('카테고리 뷰 랭킹 조회 실패:', error); return []; }
    if (!data || data.length === 0) return [];

    const categoryMap = new Map<string, { totalViews: number; contentCount: number }>();
    for (const item of data) {
      const cat = normalizeCategoryName(item.category_main || '기타');
      const existing = categoryMap.get(cat) || { totalViews: 0, contentCount: 0 };
      existing.totalViews += (item as Record<string, unknown>)[viewColumn] as number || 0;
      existing.contentCount += 1;
      categoryMap.set(cat, existing);
    }

    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        totalViews: stats.totalViews,
        contentCount: stats.contentCount,
      }))
      .sort((a, b) => b.totalViews - a.totalViews);
  } catch (error) {
    console.error('카테고리 뷰 랭킹 조회 예외:', error);
    return [];
  }
}

/**
 * 특정 카테고리의 Top N 콘텐츠 조회 (기간 필터 기반)
 * - 'this_week': weekly_clicks 기준
 * - 'last_week': last_weekly_clicks 기준
 * - 'all': view_count 누적 조회수 기준
 */
export async function fetchTopContentsByCategory(
  category: string,
  contentTypeFilter: ContentTypeFilter = 'all',
  limit: number = 5,
  period: ContentPeriodFilter = 'all'
): Promise<ContentViewStats[]> {
  try {
    const viewColumn = period === 'this_week' ? 'weekly_clicks'
      : period === 'last_week' ? 'last_weekly_clicks'
      : 'view_count';

    let query = supabase
      .from('master_contents')
      .select(`id, title, content_type, ${viewColumn}, category_main`)
      .eq('status', 'deployed')
      .in('category_main', getCategoryOriginalNames(category))
      .order(viewColumn, { ascending: false })
      .limit(limit);

    if (contentTypeFilter !== 'all') {
      query = query.eq('content_type', contentTypeFilter);
    }

    const { data, error } = await query;
    if (error) { console.error('Top 콘텐츠 조회 실패:', error); return []; }
    if (!data) return [];

    return data.map(item => ({
      id: item.id,
      title: item.title,
      contentType: item.content_type as 'free' | 'paid',
      viewCount: (item as Record<string, unknown>)[viewColumn] as number || 0,
      categoryMain: item.category_main,
    }));
  } catch (error) {
    console.error('Top 콘텐츠 조회 예외:', error);
    return [];
  }
}

// ========== 보고서 퍼널/추세 타입 및 함수 ==========

/** 보고서 퍼널 집계 데이터 */
export interface ReportFunnelData {
  totalReports: number;       // 완료된 보고서 수
  tarotGenerated: number;     // 타로 카드 생성된 보고서 수
  tarotStarted: number;       // 타로 1장이라도 확인한 보고서 수
  tarotCompleted: number;     // 타로 3장 모두 확인한 보고서 수
  wroteEncouragement: number; // 응원글 작성한 보고서 수
  couponIssued: number;       // 쿠폰 발급된 보고서 수
}

/** 보고서 추세 데이터 (일별/주별/월별) */
export interface ReportTrendData {
  dateLabel: string;
  fullDate: string;
  totalReports: number;
  tarotCompleted: number;
  wroteEncouragement: number;
  couponIssued: number;
  // 전환율 (%)
  tarotCompletionRate: number;   // tarotCompleted / totalReports
  encouragementRate: number;     // wroteEncouragement / totalReports
  couponIssuedRate: number;      // couponIssued / totalReports
}

/**
 * 보고서 퍼널 전체 집계 조회
 */
export async function fetchReportFunnelStats(): Promise<ReportFunnelData> {
  const adminFilter = ADMIN_IDS.join(',');

  // 1. 완료된 보고서 조회 (관리자 제외)
  const { data: reports, error: reportsError } = await supabase
    .from('weekly_reports')
    .select('id, self_encouragement')
    .eq('status', 'completed')
    .not('user_id', 'in', `(${adminFilter})`);

  if (reportsError) {
    console.error('보고서 퍼널 조회 오류:', reportsError);
    throw new Error('보고서 데이터 조회에 실패했습니다.');
  }

  const totalReports = reports?.length || 0;
  const reportIds = reports?.map(r => r.id) || [];
  const wroteEncouragement = reports?.filter(r => r.self_encouragement && r.self_encouragement.trim().length > 0).length || 0;

  if (reportIds.length === 0) {
    return { totalReports: 0, tarotGenerated: 0, tarotStarted: 0, tarotCompleted: 0, wroteEncouragement: 0, couponIssued: 0 };
  }

  // 2. 타로 선택 데이터 조회
  const { data: tarotSelections, error: tarotError } = await supabase
    .from('report_tarot_selections')
    .select('report_id, user_viewed')
    .in('report_id', reportIds);

  if (tarotError) {
    console.error('타로 선택 조회 오류:', tarotError);
    throw new Error('타로 선택 데이터 조회에 실패했습니다.');
  }

  // 보고서별 타로 상태 집계
  const tarotByReport: Record<string, { total: number; viewed: number }> = {};
  tarotSelections?.forEach(ts => {
    if (!tarotByReport[ts.report_id]) {
      tarotByReport[ts.report_id] = { total: 0, viewed: 0 };
    }
    tarotByReport[ts.report_id].total++;
    if (ts.user_viewed) {
      tarotByReport[ts.report_id].viewed++;
    }
  });

  const tarotGenerated = Object.keys(tarotByReport).length;
  const tarotStarted = Object.values(tarotByReport).filter(t => t.viewed >= 1).length;
  const tarotCompleted = Object.values(tarotByReport).filter(t => t.viewed >= 3).length;

  // 3. 쿠폰 발급 수 조회 (source_order_id가 report ID에 매칭)
  const { data: coupons, error: couponError } = await supabase
    .from('user_coupons')
    .select('source_order_id')
    .not('user_id', 'in', `(${adminFilter})`)
    .in('source_order_id', reportIds);

  if (couponError) {
    console.error('쿠폰 조회 오류:', couponError);
    throw new Error('쿠폰 데이터 조회에 실패했습니다.');
  }

  const couponIssued = new Set(coupons?.map(c => c.source_order_id) || []).size;

  return { totalReports, tarotGenerated, tarotStarted, tarotCompleted, wroteEncouragement, couponIssued };
}

/**
 * 보고서 발행 횟수별 퍼널 조회
 * count: 사용자별 N번째 보고서를 대상으로 집계
 * (예: count=1 → 각 사용자의 첫 번째 보고서들의 퍼널)
 */
export async function fetchReportFunnelByCount(count: number): Promise<ReportFunnelData> {
  const adminFilter = ADMIN_IDS.join(',');

  // 1. 완료된 보고서 전체 조회 (user_id, 날짜 포함, 날짜 오름차순)
  const { data: allReports, error: reportsError } = await supabase
    .from('weekly_reports')
    .select('id, user_id, week_start_date, self_encouragement')
    .eq('status', 'completed')
    .not('user_id', 'in', `(${adminFilter})`)
    .order('week_start_date', { ascending: true });

  if (reportsError) {
    console.error('보고서 퍼널(횟수별) 조회 오류:', reportsError);
    throw new Error('보고서 데이터 조회에 실패했습니다.');
  }

  // 2. 사용자별 그룹핑 (week_start_date ASC 이미 정렬됨)
  const byUser = new Map<string, { id: string; self_encouragement: string | null }[]>();
  for (const r of allReports ?? []) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id)!.push({ id: r.id, self_encouragement: r.self_encouragement });
  }

  // 3. N번째 보고서만 추출 (해당 횟수 이상의 보고서를 가진 사용자만)
  const targetReports: { id: string; self_encouragement: string | null }[] = [];
  for (const reports of byUser.values()) {
    if (reports.length >= count) {
      targetReports.push(reports[count - 1]);
    }
  }

  const totalReports = targetReports.length;
  const reportIds = targetReports.map(r => r.id);
  const wroteEncouragement = targetReports.filter(
    r => r.self_encouragement && r.self_encouragement.trim().length > 0
  ).length;

  if (reportIds.length === 0) {
    return { totalReports: 0, tarotGenerated: 0, tarotStarted: 0, tarotCompleted: 0, wroteEncouragement: 0, couponIssued: 0 };
  }

  // 4. 타로 선택 데이터 조회
  const { data: tarotSelections, error: tarotError } = await supabase
    .from('report_tarot_selections')
    .select('report_id, user_viewed')
    .in('report_id', reportIds);

  if (tarotError) throw new Error('타로 선택 데이터 조회에 실패했습니다.');

  const tarotByReport: Record<string, { total: number; viewed: number }> = {};
  tarotSelections?.forEach(ts => {
    if (!tarotByReport[ts.report_id]) tarotByReport[ts.report_id] = { total: 0, viewed: 0 };
    tarotByReport[ts.report_id].total++;
    if (ts.user_viewed) tarotByReport[ts.report_id].viewed++;
  });

  const tarotGenerated = Object.keys(tarotByReport).length;
  const tarotStarted = Object.values(tarotByReport).filter(t => t.viewed >= 1).length;
  const tarotCompleted = Object.values(tarotByReport).filter(t => t.viewed >= 3).length;

  // 5. 쿠폰 발급 조회
  const { data: coupons, error: couponError } = await supabase
    .from('user_coupons')
    .select('source_order_id')
    .not('user_id', 'in', `(${adminFilter})`)
    .in('source_order_id', reportIds);

  if (couponError) throw new Error('쿠폰 데이터 조회에 실패했습니다.');

  const couponIssued = new Set(coupons?.map(c => c.source_order_id) || []).size;

  return { totalReports, tarotGenerated, tarotStarted, tarotCompleted, wroteEncouragement, couponIssued };
}

/**
 * 보고서 추세 데이터 조회 (주별 집계 - 일~토 기준)
 * week_start_date로 그룹핑하여 주 단위 데이터 생성
 * 1년 프리셋은 월별로 추가 집계
 */
export async function fetchReportTrendStats(dateRange: DateRangeFilter, preset?: TrendRangePreset): Promise<ReportTrendData[]> {
  const adminFilter = ADMIN_IDS.join(',');

  const startDate = new Date(dateRange.startDate!);
  const endDate = new Date(dateRange.endDate!);
  const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  // 1. 보고서 데이터 조회
  const { data: reports, error: reportsError } = await supabase
    .from('weekly_reports')
    .select('id, self_encouragement, week_start_date')
    .eq('status', 'completed')
    .not('user_id', 'in', `(${adminFilter})`)
    .gte('week_start_date', startDateStr)
    .lt('week_start_date', endDateStr);

  if (reportsError) {
    console.error('보고서 추세 조회 오류:', reportsError);
    throw new Error('보고서 추세 데이터 조회에 실패했습니다.');
  }

  const reportIds = reports?.map(r => r.id) || [];

  // 2. 타로 선택 데이터
  let tarotSelections: { report_id: string; user_viewed: boolean }[] = [];
  if (reportIds.length > 0) {
    const { data, error } = await supabase
      .from('report_tarot_selections')
      .select('report_id, user_viewed')
      .in('report_id', reportIds);
    if (!error) tarotSelections = data || [];
  }

  // 3. 쿠폰 발급 데이터
  let coupons: { source_order_id: string }[] = [];
  if (reportIds.length > 0) {
    const { data, error } = await supabase
      .from('user_coupons')
      .select('source_order_id')
      .not('user_id', 'in', `(${adminFilter})`)
      .in('source_order_id', reportIds);
    if (!error) coupons = data || [];
  }

  // 보고서별 타로 완료 수 Map
  const tarotByReport: Record<string, number> = {};
  tarotSelections.forEach(ts => {
    if (!tarotByReport[ts.report_id]) tarotByReport[ts.report_id] = 0;
    if (ts.user_viewed) tarotByReport[ts.report_id]++;
  });

  // 쿠폰 발급된 보고서 Set
  const couponReportIds = new Set(coupons.map(c => c.source_order_id));

  // week_start_date 기준으로 그룹핑 (주별 집계)
  const weekGroups: Record<string, typeof reports> = {};
  reports?.forEach(r => {
    const wsd = r.week_start_date; // 'YYYY-MM-DD' (일요일)
    if (!weekGroups[wsd]) weekGroups[wsd] = [];
    weekGroups[wsd]!.push(r);
  });

  // 정렬된 주별 데이터 생성
  const sortedWeeks = Object.keys(weekGroups).sort();
  const weeklyData: ReportTrendData[] = sortedWeeks.map(wsd => {
    const weekReports = weekGroups[wsd]!;
    const totalReports = weekReports.length;
    const tarotCompleted = weekReports.filter(r => (tarotByReport[r.id] || 0) >= 3).length;
    const wroteEncouragement = weekReports.filter(r => r.self_encouragement && r.self_encouragement.trim().length > 0).length;
    const couponIssued = weekReports.filter(r => couponReportIds.has(r.id)).length;

    // 라벨: "MM/DD" (보고서 발송일 기준 = week_start_date + 7일)
    const d = new Date(wsd + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return {
      dateLabel: `${mm}/${dd}`,
      fullDate: wsd,
      totalReports,
      tarotCompleted,
      wroteEncouragement,
      couponIssued,
      tarotCompletionRate: totalReports > 0 ? Math.round(tarotCompleted / totalReports * 1000) / 10 : 0,
      encouragementRate: totalReports > 0 ? Math.round(wroteEncouragement / totalReports * 1000) / 10 : 0,
      couponIssuedRate: totalReports > 0 ? Math.round(couponIssued / totalReports * 1000) / 10 : 0,
    };
  });

  // 1년 프리셋은 월별 집계
  if (preset === '1year') {
    return aggregateReportTrendData(weeklyData, 'monthly');
  }

  return weeklyData;
}

/**
 * 보고서 추세 주별→월별 집계
 */
// ========== 구매 통계 타입 및 함수 ==========

/** 개별 주문 데이터 (최근 구매 리스트용) */
export interface PurchaseOrderData {
  orderId: string;
  userId: string;
  email: string;
  nickname: string;
  contentTitle: string;
  categoryMain: string;
  paidAmount: number;
  payMethod: string;
  pgProvider: string;
  pstatus: string;
  orderedAt: string;
}

/** 고객별 구매 종합 데이터 (상관관계 분석용) */
export interface PurchaseCustomerData {
  userId: string;
  email: string;
  nickname: string;
  totalPurchases: number;
  totalSpent: number;
  totalTags: number;
  weeklyTags: number;
  lastTagDate: string | null;
  visitCount: number;
  signedUpAt: string;
  lastLoginAt: string | null;
}

/** 구매 탭 전체 데이터 */
export interface PurchaseStatsData {
  recentOrders: PurchaseOrderData[];
  customerSummary: PurchaseCustomerData[];
  totalOrders: number;
  totalRevenue: number;
  uniqueBuyers: number;
  avgPurchasesPerBuyer: number;
}

/**
 * 구매 통계 데이터 조회
 * orders + users + master_contents + user_trait_tags 기반 구매 분석
 */
export async function fetchPurchaseStats(dateRange?: DateRangeFilter): Promise<PurchaseStatsData> {
  const adminFilter = ADMIN_IDS.join(',');

  // 주문 쿼리 빌더 (dateRange 적용)
  const buildOrderQuery = (select: string) => {
    let q = supabase
      .from('orders')
      .select(select)
      .eq('pstatus', 'completed')
      .gt('paid_amount', 0)
      .not('user_id', 'in', `(${adminFilter})`);
    if (dateRange?.startDate) q = q.gte('created_at', dateRange.startDate);
    if (dateRange?.endDate) q = q.lte('created_at', dateRange.endDate);
    return q;
  };

  // 5개 쿼리 병렬 실행
  const [
    recentOrdersResult,
    allOrdersResult,
    usersResult,
    tagStatsResult,
    contentsResult,
  ] = await Promise.all([
    // 1. 최근 완료 주문 50건 (0원 쿠폰 결제 제외)
    buildOrderQuery('id, user_id, content_id, paid_amount, pay_method, pg_provider, pstatus, created_at')
      .order('created_at', { ascending: false })
      .limit(50),

    // 2. 전체 완료 주문 (고객별 구매 통계, 0원 쿠폰 결제 제외)
    buildOrderQuery('user_id, paid_amount'),

    // 3. 유저 데이터
    supabase
      .from('users')
      .select('id, email, nickname, visit_count, created_at, last_login_at')
      .not('id', 'in', `(${adminFilter})`),

    // 4. 태그 통계 (확인된 태그만, neutral 제외)
    supabase
      .from('user_trait_tags')
      .select('user_id, created_at')
      .eq('is_confirmed', true)
      .neq('tag_type', 'neutral')
      .not('user_id', 'in', `(${adminFilter})`),

    // 5. 콘텐츠 정보 (최근 주문의 콘텐츠명/카테고리)
    supabase
      .from('master_contents')
      .select('id, title, category_main'),
  ]);

  if (recentOrdersResult.error) throw new Error('최근 주문 데이터 조회에 실패했습니다.');
  if (allOrdersResult.error) throw new Error('전체 주문 데이터 조회에 실패했습니다.');
  if (usersResult.error) throw new Error('유저 데이터 조회에 실패했습니다.');
  if (tagStatsResult.error) throw new Error('태그 데이터 조회에 실패했습니다.');
  if (contentsResult.error) throw new Error('콘텐츠 데이터 조회에 실패했습니다.');

  const recentOrders = recentOrdersResult.data || [];
  const allOrders = allOrdersResult.data || [];
  const users = usersResult.data || [];
  const tagStatsData = tagStatsResult.data || [];
  const contents = contentsResult.data || [];

  // Lookup Maps
  const userMap = new Map(users.map(u => [u.id, u]));
  const contentMap = new Map(contents.map(c => [c.id, c]));

  // 1. 최근 주문 리스트 구성
  const recentPurchaseOrders: PurchaseOrderData[] = recentOrders.map(order => {
    const user = userMap.get(order.user_id);
    const content = contentMap.get(order.content_id);
    return {
      orderId: order.id,
      userId: order.user_id,
      email: user?.email || '',
      nickname: user?.nickname || '',
      contentTitle: content?.title || '',
      categoryMain: content?.category_main || '',
      paidAmount: order.paid_amount || 0,
      payMethod: order.pay_method || '',
      pgProvider: order.pg_provider || '',
      pstatus: order.pstatus || '',
      orderedAt: order.created_at,
    };
  });

  // 2. 고객별 구매 통계
  const customerPurchaseMap = new Map<string, { totalPurchases: number; totalSpent: number }>();
  allOrders.forEach(order => {
    const existing = customerPurchaseMap.get(order.user_id) || { totalPurchases: 0, totalSpent: 0 };
    existing.totalPurchases++;
    existing.totalSpent += order.paid_amount || 0;
    customerPurchaseMap.set(order.user_id, existing);
  });

  // 3. 태그 통계 (고객별)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const customerTagMap = new Map<string, { totalTags: number; weeklyTags: number; lastTagDate: string | null }>();
  tagStatsData.forEach(tag => {
    const existing = customerTagMap.get(tag.user_id) || { totalTags: 0, weeklyTags: 0, lastTagDate: null };
    existing.totalTags++;
    if (new Date(tag.created_at) >= oneWeekAgo) {
      existing.weeklyTags++;
    }
    if (!existing.lastTagDate || tag.created_at > existing.lastTagDate) {
      existing.lastTagDate = tag.created_at;
    }
    customerTagMap.set(tag.user_id, existing);
  });

  // 4. 고객별 구매 종합 데이터 병합
  const customerSummary: PurchaseCustomerData[] = [];
  customerPurchaseMap.forEach((purchase, userId) => {
    const user = userMap.get(userId);
    const tagData = customerTagMap.get(userId) || { totalTags: 0, weeklyTags: 0, lastTagDate: null };
    customerSummary.push({
      userId,
      email: user?.email || '',
      nickname: user?.nickname || '',
      totalPurchases: purchase.totalPurchases,
      totalSpent: purchase.totalSpent,
      totalTags: tagData.totalTags,
      weeklyTags: tagData.weeklyTags,
      lastTagDate: tagData.lastTagDate,
      visitCount: user?.visit_count || 0,
      signedUpAt: user?.created_at || '',
      lastLoginAt: user?.last_login_at || null,
    });
  });

  // 정렬: totalPurchases 내림차순
  customerSummary.sort((a, b) => b.totalPurchases - a.totalPurchases);

  // 5. 요약 통계
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const uniqueBuyers = customerPurchaseMap.size;
  const avgPurchasesPerBuyer = uniqueBuyers > 0
    ? Math.round(totalOrders / uniqueBuyers * 10) / 10
    : 0;

  return {
    recentOrders: recentPurchaseOrders,
    customerSummary,
    totalOrders,
    totalRevenue,
    uniqueBuyers,
    avgPurchasesPerBuyer,
  };
}

// ========== 고객 통계 타입 및 함수 ==========

/** 고객 통계 데이터 */
export interface CustomerStatsData {
  totalSajuUsers: number;        // 본인 사주 등록 유저 수
  totalSajuRecords: number;      // 전체 사주 기록 수
  avgRecordsPerUser: number;     // 유저당 평균 기록 수
  genderDistribution: {
    male: number;
    female: number;
    total: number;
    maleRate: number;
    femaleRate: number;
  };
  ageGroupDistribution: { group: string; count: number; rate: number }[];
  providerDistribution: { provider: string; count: number; rate: number }[];
  zodiacDistribution: { zodiac: string; count: number; rate: number }[];
  relationshipDistribution: { relationship: string; count: number; rate: number }[];
  paidConversionByGender: {
    male: { total: number; paid: number; rate: number };
    female: { total: number; paid: number; rate: number };
  };
}

/**
 * 고객 통계 데이터 조회
 * saju_records + users + orders 기반 고객 인사이트
 */
export async function fetchCustomerStats(): Promise<CustomerStatsData> {
  const adminFilter = ADMIN_IDS.join(',');

  // 4개 쿼리 병렬 실행
  const [
    sajuOwnResult,
    sajuAllResult,
    usersResult,
    ordersResult,
  ] = await Promise.all([
    // 1. 본인 사주 레코드 (notes='본인' 또는 notes IS NULL)
    supabase
      .from('saju_records')
      .select('user_id, gender, birth_date, zodiac, notes')
      .not('user_id', 'in', `(${adminFilter})`)
      .or('notes.eq.본인,notes.is.null'),

    // 2. 전체 사주 레코드
    supabase
      .from('saju_records')
      .select('user_id, notes')
      .not('user_id', 'in', `(${adminFilter})`),

    // 3. 유저 데이터 (provider 정보)
    supabase
      .from('users')
      .select('id, provider')
      .not('id', 'in', `(${adminFilter})`),

    // 4. 완료된 주문 데이터 (성별 유료 전환율용, 0원 쿠폰 결제 제외)
    supabase
      .from('orders')
      .select('user_id')
      .eq('pstatus', 'completed')
      .gt('paid_amount', 0)
      .not('user_id', 'in', `(${adminFilter})`),
  ]);

  if (sajuOwnResult.error) throw new Error('본인 사주 데이터 조회에 실패했습니다.');
  if (sajuAllResult.error) throw new Error('전체 사주 데이터 조회에 실패했습니다.');
  if (usersResult.error) throw new Error('유저 데이터 조회에 실패했습니다.');
  if (ordersResult.error) throw new Error('주문 데이터 조회에 실패했습니다.');

  const sajuOwn = sajuOwnResult.data || [];
  const sajuAll = sajuAllResult.data || [];
  const users = usersResult.data || [];
  const orders = ordersResult.data || [];

  // 본인 사주 user 중복 제거 (user_id 기준 첫 레코드)
  const seenUserIds = new Set<string>();
  const uniqueOwnRecords: typeof sajuOwn = [];
  for (const record of sajuOwn) {
    if (!seenUserIds.has(record.user_id)) {
      seenUserIds.add(record.user_id);
      uniqueOwnRecords.push(record);
    }
  }

  const totalSajuUsers = uniqueOwnRecords.length;
  const totalSajuRecords = sajuAll.length;
  const avgRecordsPerUser = totalSajuUsers > 0
    ? Math.round(totalSajuRecords / totalSajuUsers * 10) / 10
    : 0;

  // 성별 분포 (본인 사주 기준)
  const male = uniqueOwnRecords.filter(r => r.gender === 'male').length;
  const female = uniqueOwnRecords.filter(r => r.gender === 'female').length;
  const genderTotal = male + female;
  const genderDistribution = {
    male,
    female,
    total: genderTotal,
    maleRate: genderTotal > 0 ? Math.round(male / genderTotal * 1000) / 10 : 0,
    femaleRate: genderTotal > 0 ? Math.round(female / genderTotal * 1000) / 10 : 0,
  };

  // 연령대 분포 (본인 사주 기준)
  const now = new Date();
  const ageGroups: Record<string, number> = {};
  uniqueOwnRecords.forEach(r => {
    if (!r.birth_date) return;
    const birthDate = new Date(r.birth_date);
    let age = now.getFullYear() - birthDate.getFullYear();
    // 생일이 아직 안 지났으면 1살 빼기 (SQL AGE() 함수와 동일)
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    let group: string;
    if (age < 20) group = '10대';
    else if (age < 30) group = '20대';
    else if (age < 40) group = '30대';
    else if (age < 50) group = '40대';
    else if (age < 60) group = '50대';
    else group = '60대+';
    ageGroups[group] = (ageGroups[group] || 0) + 1;
  });

  const ageOrder = ['10대', '20대', '30대', '40대', '50대', '60대+'];
  const ageGroupDistribution = ageOrder
    .filter(group => ageGroups[group])
    .map(group => ({
      group,
      count: ageGroups[group],
      rate: totalSajuUsers > 0 ? Math.round(ageGroups[group] / totalSajuUsers * 1000) / 10 : 0,
    }));

  // 가입 채널 분포 (users.provider)
  const providerCounts: Record<string, number> = {};
  users.forEach(u => {
    const p = u.provider || 'unknown';
    providerCounts[p] = (providerCounts[p] || 0) + 1;
  });
  const totalUsers = users.length;
  const providerDistribution = Object.entries(providerCounts)
    .map(([provider, count]) => ({
      provider: provider === 'kakao' ? '카카오' : provider === 'google' ? '구글' : provider,
      count,
      rate: totalUsers > 0 ? Math.round(count / totalUsers * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 띠 분포 (본인 사주 기준)
  const zodiacCounts: Record<string, number> = {};
  uniqueOwnRecords.forEach(r => {
    if (!r.zodiac) return;
    zodiacCounts[r.zodiac] = (zodiacCounts[r.zodiac] || 0) + 1;
  });
  const zodiacDistribution = Object.entries(zodiacCounts)
    .map(([zodiac, count]) => ({
      zodiac,
      count,
      rate: totalSajuUsers > 0 ? Math.round(count / totalSajuUsers * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 관계 사주 분포 (전체 레코드 기준)
  const relationCounts: Record<string, number> = {};
  sajuAll.forEach(r => {
    const rel = r.notes || '본인';
    relationCounts[rel] = (relationCounts[rel] || 0) + 1;
  });
  const relationshipDistribution = Object.entries(relationCounts)
    .map(([relationship, count]) => ({
      relationship,
      count,
      rate: totalSajuRecords > 0 ? Math.round(count / totalSajuRecords * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 성별 유료 전환율
  const paidUserIds = new Set(orders.map(o => o.user_id));
  // 본인 사주 기준 성별별 유저
  const maleUsers = uniqueOwnRecords.filter(r => r.gender === 'male');
  const femaleUsers = uniqueOwnRecords.filter(r => r.gender === 'female');
  const malePaid = maleUsers.filter(r => paidUserIds.has(r.user_id)).length;
  const femalePaid = femaleUsers.filter(r => paidUserIds.has(r.user_id)).length;

  const paidConversionByGender = {
    male: {
      total: maleUsers.length,
      paid: malePaid,
      rate: maleUsers.length > 0 ? Math.round(malePaid / maleUsers.length * 1000) / 10 : 0,
    },
    female: {
      total: femaleUsers.length,
      paid: femalePaid,
      rate: femaleUsers.length > 0 ? Math.round(femalePaid / femaleUsers.length * 1000) / 10 : 0,
    },
  };

  return {
    totalSajuUsers,
    totalSajuRecords,
    avgRecordsPerUser,
    genderDistribution,
    ageGroupDistribution,
    providerDistribution,
    zodiacDistribution,
    relationshipDistribution,
    paidConversionByGender,
  };
}

/**
 * 보고서 추세 주별→월별 집계
 */
function aggregateReportTrendData(weeklyData: ReportTrendData[], granularity: 'monthly'): ReportTrendData[] {
  if (weeklyData.length === 0) return weeklyData;

  const groups: Record<string, { label: string; data: ReportTrendData[] }> = {};

  weeklyData.forEach(week => {
    const date = new Date(week.fullDate + 'T00:00:00');
    const groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const groupLabel = `${date.getMonth() + 1}월`;

    if (!groups[groupKey]) {
      groups[groupKey] = { label: groupLabel, data: [] };
    }
    groups[groupKey].data.push(week);
  });

  const sortedKeys = Object.keys(groups).sort();

  return sortedKeys.map(key => {
    const { label, data } = groups[key];
    const totalReports = data.reduce((sum, d) => sum + d.totalReports, 0);
    const tarotCompleted = data.reduce((sum, d) => sum + d.tarotCompleted, 0);
    const wroteEncouragement = data.reduce((sum, d) => sum + d.wroteEncouragement, 0);
    const couponIssued = data.reduce((sum, d) => sum + d.couponIssued, 0);

    return {
      dateLabel: label,
      fullDate: data[0].fullDate,
      totalReports,
      tarotCompleted,
      wroteEncouragement,
      couponIssued,
      tarotCompletionRate: totalReports > 0 ? Math.round(tarotCompleted / totalReports * 1000) / 10 : 0,
      encouragementRate: totalReports > 0 ? Math.round(wroteEncouragement / totalReports * 1000) / 10 : 0,
      couponIssuedRate: totalReports > 0 ? Math.round(couponIssued / totalReports * 1000) / 10 : 0,
    };
  });
}
