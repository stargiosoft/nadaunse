-- =====================================================
-- 주간 보고서 추가 컬럼 마이그레이션
-- 목적: generate-weekly-report Edge Function에서 필요한 컬럼 추가
-- 적용: 스테이징 먼저 테스트 후 프로덕션 반영
-- =====================================================

-- =====================================================
-- 1. weekly_reports 테이블에 situation_summary 컬럼 추가
-- =====================================================
ALTER TABLE public.weekly_reports
ADD COLUMN IF NOT EXISTS situation_summary text;

COMMENT ON COLUMN public.weekly_reports.situation_summary IS '사용자 상황 요약 (GPT 생성, 150-200자)';

-- =====================================================
-- 2. weekly_reports 테이블에 to_do_list 컬럼 추가
-- =====================================================
ALTER TABLE public.weekly_reports
ADD COLUMN IF NOT EXISTS to_do_list jsonb;

COMMENT ON COLUMN public.weekly_reports.to_do_list IS '개운 행동 지침 리스트 (GPT 생성, 3개 항목)';

-- =====================================================
-- 3. user_trait_tags 테이블에 is_confirmed 컬럼 추가 (이미 존재할 수 있음)
-- =====================================================
ALTER TABLE public.user_trait_tags
ADD COLUMN IF NOT EXISTS is_confirmed boolean DEFAULT false;

COMMENT ON COLUMN public.user_trait_tags.is_confirmed IS '사용자가 태그를 확정했는지 여부';

-- RLS UPDATE 정책 추가 (is_confirmed 업데이트용)
-- 정책이 이미 존재하면 DROP 후 재생성
DROP POLICY IF EXISTS "Users can update own trait tags" ON public.user_trait_tags;
CREATE POLICY "Users can update own trait tags" ON public.user_trait_tags
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
