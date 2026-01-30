import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

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

/**
 * 주간 보고서 데이터를 가져오는 훅
 * @param reportId - 특정 보고서 ID (없으면 최신 보고서 조회)
 */
export function useWeeklyReport(reportId?: string): WeeklyReportData {
  const { user } = useAuth();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [tarotSelections, setTarotSelections] = useState<TarotSelection[]>([]);
  const [weeklyTags, setWeeklyTags] = useState<UserTraitTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

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
