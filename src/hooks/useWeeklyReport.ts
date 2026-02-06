import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// ⭐ 캐시 설정 (CLAUDE.md 캐싱 전략 준수)
const CACHE_KEY_PREFIX = 'weekly_report_detail_cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5분

// 타입 정의
export interface WeeklyReport {
  id: string;
  user_id: string;
  year: number;
  month: number;
  week: number;
  week_start_date: string;
  week_end_date: string;
  status: string;
  tag_count: number;
  situation_summary: string | null;
  to_do_list: Array<{ id: number; text: string }> | null;
  published_at: string | null;
}

export interface ReportSection {
  id: string;
  report_id: string;
  section_type: 'my_story' | 'tarot_reading' | 'soul_prescription';
  section_order: number;
  title: string;
  content: {
    section_id: number;
    title: string;
    content_paragraphs?: string[];
    card_1_interpretation?: string;
    card_2_interpretation?: string;
    card_3_interpretation?: string;
  };
}

export interface TarotSelection {
  id: string;
  report_id: string;
  card_order: number;
  card_name: string;
  card_image_url: string;
  interpretation: string | null;
  user_viewed: boolean;
}

export interface UserTraitTag {
  id: string;
  tag_name: string;
  tag_type: 'positive' | 'negative';
  created_at: string;
}

export interface WeeklyReportData {
  report: WeeklyReport | null;
  sections: ReportSection[];
  tarotSelections: TarotSelection[];
  weeklyTags: UserTraitTag[];
  loading: boolean;
  error: string | null;
}

// ⭐ 캐시 데이터 타입
interface CachedReportData {
  report: WeeklyReport | null;
  sections: ReportSection[];
  tarotSelections: TarotSelection[];
  weeklyTags: UserTraitTag[];
  timestamp: number;
}

/**
 * 🚀 동기적 캐시 초기화 (로딩 플래시 방지)
 * - localStorage에서 캐시 데이터 즉시 로드
 * - 유효한 캐시가 있으면 loading: false로 시작
 */
function getInitialCacheState(reportId?: string): {
  report: WeeklyReport | null;
  sections: ReportSection[];
  tarotSelections: TarotSelection[];
  weeklyTags: UserTraitTag[];
  loading: boolean;
  hasValidCache: boolean;
} {
  if (!reportId) {
    return {
      report: null,
      sections: [],
      tarotSelections: [],
      weeklyTags: [],
      loading: true,
      hasValidCache: false
    };
  }

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${reportId}`;
    const cachedJson = localStorage.getItem(cacheKey);

    if (cachedJson) {
      const cache: CachedReportData & { userId?: string } = JSON.parse(cachedJson);
      const isExpired = Date.now() - cache.timestamp > CACHE_EXPIRY_MS;

      // ⚠️ userId 검증: 현재 로그인한 사용자의 캐시인지 확인
      const currentUserJson = localStorage.getItem('user');
      const currentUserId = currentUserJson ? JSON.parse(currentUserJson)?.id : null;
      const isCorrectUser = cache.userId && cache.userId === currentUserId;

      if (!isCorrectUser) {
        console.log('⚠️ [useWeeklyReport] 캐시 userId 불일치 → 캐시 무효화');
        localStorage.removeItem(cacheKey);
      } else if (!isExpired && cache.report) {
        console.log('🚀 [useWeeklyReport] 캐시 히트! 즉시 렌더링 (reportId:', reportId, ')');
        return {
          report: cache.report,
          sections: cache.sections || [],
          tarotSelections: cache.tarotSelections || [],
          weeklyTags: cache.weeklyTags || [],
          loading: false,
          hasValidCache: true
        };
      } else {
        console.log('⏰ [useWeeklyReport] 캐시 만료 (5분 초과)');
      }
    }
  } catch (e) {
    console.error('❌ [useWeeklyReport] 캐시 파싱 실패:', e);
  }

  return {
    report: null,
    sections: [],
    tarotSelections: [],
    weeklyTags: [],
    loading: true,
    hasValidCache: false
  };
}

/**
 * 주간 보고서 데이터를 가져오는 훅
 * @param reportId - 특정 보고서 ID (없으면 최신 보고서 조회)
 *
 * ⭐ 캐싱 전략 (CLAUDE.md 준수):
 * - localStorage 캐시 (5분 만료)
 * - 동기적 초기화로 로딩 플래시 방지
 * - 캐시 키: weekly_report_detail_cache_{reportId}
 */
export function useWeeklyReport(reportId?: string): WeeklyReportData {
  const [user, setUser] = useState<User | null>(null);

  // 🚀 동기적 캐시 초기화 (useState 초기화 시점에 캐시 로드)
  const initialState = getInitialCacheState(reportId);

  const [report, setReport] = useState<WeeklyReport | null>(initialState.report);
  const [sections, setSections] = useState<ReportSection[]>(initialState.sections);
  const [tarotSelections, setTarotSelections] = useState<TarotSelection[]>(initialState.tarotSelections);
  const [weeklyTags, setWeeklyTags] = useState<UserTraitTag[]>(initialState.weeklyTags);
  const [loading, setLoading] = useState(!initialState.hasValidCache);
  const [error, setError] = useState<string | null>(null);

  // 사용자 세션 가져오기
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    async function fetchReportData() {
      if (!user?.id) {
        // ⚠️ user 로드 전에는 loading 유지 (소유자 확인 Edge Function 조기 호출 방지)
        return;
      }

      // 🚀 캐시가 유효하면 API 호출 스킵
      const cachedState = getInitialCacheState(reportId);
      if (cachedState.hasValidCache) {
        console.log('✅ [useWeeklyReport] 유효한 캐시 존재 → API 호출 스킵');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('📊 [useWeeklyReport] API 호출 시작 (reportId:', reportId, ')');

        // 1. 보고서 조회 (reportId가 있으면 특정 보고서, 없으면 최신 보고서)
        let reportQuery = supabase
          .from('weekly_reports')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (reportId) {
          reportQuery = reportQuery.eq('id', reportId);
        } else {
          reportQuery = reportQuery.order('published_at', { ascending: false }).limit(1);
        }

        const { data: reportData, error: reportError } = await reportQuery.single();

        if (reportError) {
          if (reportError.code === 'PGRST116') {
            // 보고서 없음
            setReport(null);
            setLoading(false);
            return;
          }
          throw reportError;
        }

        setReport(reportData);

        // 2. 섹션 조회
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('weekly_report_sections')
          .select('*')
          .eq('report_id', reportData.id)
          .order('section_order', { ascending: true });

        if (sectionsError) throw sectionsError;
        setSections(sectionsData || []);

        // 3. 타로 선택 조회
        const { data: tarotData, error: tarotError } = await supabase
          .from('report_tarot_selections')
          .select('*')
          .eq('report_id', reportData.id)
          .order('card_order', { ascending: true });

        if (tarotError) throw tarotError;
        setTarotSelections(tarotData || []);

        // 4. 해당 주차 태그 조회
        const weekStart = new Date(reportData.week_start_date);
        const weekEnd = new Date(reportData.week_end_date);
        weekEnd.setHours(23, 59, 59, 999);

        const { data: tagsData, error: tagsError } = await supabase
          .from('user_trait_tags')
          .select('id, tag_name, tag_type, created_at')
          .eq('user_id', user.id)
          .eq('is_confirmed', true)
          .neq('tag_name', '__SKIPPED__')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())
          .order('created_at', { ascending: false });

        if (tagsError) throw tagsError;
        setWeeklyTags(tagsData || []);

        // 🚀 캐시에 저장 (만료 시간 포함)
        if (reportId) {
          const cacheKey = `${CACHE_KEY_PREFIX}${reportId}`;
          const cacheData: CachedReportData & { userId: string } = {
            userId: user.id, // ⚠️ 계정 전환 시 캐시 무효화용
            report: reportData,
            sections: sectionsData || [],
            tarotSelections: tarotData || [],
            weeklyTags: tagsData || [],
            timestamp: Date.now()
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
          console.log('💾 [useWeeklyReport] 캐시 저장 완료 (reportId:', reportId, ', userId:', user.id, ')');
        }

      } catch (err) {
        console.error('주간 보고서 조회 실패:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [user?.id, reportId]);

  return { report, sections, tarotSelections, weeklyTags, loading, error };
}

/**
 * 주간 보고서 캐시 무효화
 * - 응원글 저장, 보고서 생성 등 데이터 변경 시 호출
 */
export function invalidateWeeklyReportCache(reportId?: string): void {
  if (reportId) {
    const cacheKey = `${CACHE_KEY_PREFIX}${reportId}`;
    localStorage.removeItem(cacheKey);
    console.log('🗑️ [useWeeklyReport] 캐시 삭제 (reportId:', reportId, ')');
  } else {
    // 모든 주간 보고서 캐시 삭제
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🗑️ [useWeeklyReport] 모든 캐시 삭제 (', keysToRemove.length, '개)');
  }
}

/**
 * 타로 카드 열람 상태 업데이트
 */
export async function markTarotAsViewed(selectionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('report_tarot_selections')
      .update({ user_viewed: true })
      .eq('id', selectionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('타로 열람 상태 업데이트 실패:', err);
    return false;
  }
}

/**
 * 보고서 제목 포맷팅 (예: "26년 1월 4주차 보고서")
 */
export function formatReportTitle(report: WeeklyReport): string {
  const yearShort = report.year.toString().slice(-2);
  return `${yearShort}년 ${report.month}월 ${report.week}주차 보고서`;
}

/**
 * 주차 날짜 범위 포맷팅 (예: "01.25 ~ 01.31")
 */
export function formatWeekRange(report: WeeklyReport): string {
  const start = new Date(report.week_start_date);
  const end = new Date(report.week_end_date);

  const formatDate = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

  return `${formatDate(start)} ~ ${formatDate(end)}`;
}
