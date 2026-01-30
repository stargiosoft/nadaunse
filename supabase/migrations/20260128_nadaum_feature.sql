-- =====================================================
-- 나다움 찾기 기능 - 신규 테이블 생성
-- 목적: 성향 태그 저장 및 주간 보고서 시스템
-- 적용: 스테이징 먼저 테스트 후 프로덕션 반영
-- =====================================================

-- =====================================================
-- 1. user_trait_tags (나의 성향 태그)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_trait_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tag_name text NOT NULL,
    tag_type text NOT NULL CHECK (tag_type IN ('positive', 'negative', 'neutral')),
    source_type text NOT NULL CHECK (source_type IN ('free_content', 'paid_content')),
    source_content_id uuid REFERENCES public.master_contents(id) ON DELETE SET NULL,
    source_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_trait_tags_user_id
    ON public.user_trait_tags (user_id);
CREATE INDEX IF NOT EXISTS idx_user_trait_tags_created_at
    ON public.user_trait_tags (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_trait_tags_user_created
    ON public.user_trait_tags (user_id, created_at DESC);

-- RLS 활성화
ALTER TABLE public.user_trait_tags ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own trait tags" ON public.user_trait_tags
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trait tags" ON public.user_trait_tags
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trait tags" ON public.user_trait_tags
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE public.user_trait_tags IS '나다움 성향 태그 - 사용자가 저장한 성향 태그 기록';
COMMENT ON COLUMN public.user_trait_tags.tag_type IS '태그 타입: positive(긍정), negative(부정), neutral(중립)';
COMMENT ON COLUMN public.user_trait_tags.source_type IS '출처 타입: free_content(무료), paid_content(유료)';

-- =====================================================
-- 2. weekly_reports (주간 나 보고서)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    year integer NOT NULL,
    month integer NOT NULL CHECK (month >= 1 AND month <= 12),
    week integer NOT NULL CHECK (week >= 1 AND week <= 5),
    week_start_date date NOT NULL,
    week_end_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    tag_count integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    published_at timestamptz,
    UNIQUE (user_id, year, week_start_date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id
    ON public.weekly_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_year_month
    ON public.weekly_reports (year, month);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_status
    ON public.weekly_reports (status);

-- RLS 활성화
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 본인 보고서만 조회 가능
CREATE POLICY "Users can view own reports" ON public.weekly_reports
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- INSERT/UPDATE는 Edge Function (service_role)에서만 가능
-- 별도 정책 없음 - service_role 사용

-- 코멘트
COMMENT ON TABLE public.weekly_reports IS '주간 나 보고서 - 일요일 발행되는 주간 분석 보고서';
COMMENT ON COLUMN public.weekly_reports.status IS '상태: pending(대기), generating(생성중), completed(완료), failed(실패)';

-- =====================================================
-- 3. weekly_report_sections (보고서 섹션 콘텐츠)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.weekly_report_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    report_id uuid NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
    section_type text NOT NULL CHECK (section_type IN ('my_story', 'emotion_diagnosis', 'tarot_reading', 'soul_prescription')),
    section_order integer NOT NULL CHECK (section_order >= 1 AND section_order <= 4),
    title text NOT NULL,
    content jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (report_id, section_type)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_weekly_report_sections_report_id
    ON public.weekly_report_sections (report_id);

-- RLS 활성화
ALTER TABLE public.weekly_report_sections ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 보고서 소유자만 섹션 조회 가능
CREATE POLICY "Users can view own report sections" ON public.weekly_report_sections
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.weekly_reports
            WHERE weekly_reports.id = report_id
            AND weekly_reports.user_id = auth.uid()
        )
    );

-- 코멘트
COMMENT ON TABLE public.weekly_report_sections IS '보고서 섹션 - AI 생성 콘텐츠';
COMMENT ON COLUMN public.weekly_report_sections.section_type IS '섹션 타입: my_story(나의 이야기), emotion_diagnosis(감정 진단), tarot_reading(타로), soul_prescription(마음 처방)';
COMMENT ON COLUMN public.weekly_report_sections.content IS 'JSON 형식의 섹션 콘텐츠';

-- =====================================================
-- 4. report_tarot_selections (보고서 타로 카드 선택)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.report_tarot_selections (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    report_id uuid NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
    card_order integer NOT NULL CHECK (card_order >= 1 AND card_order <= 3),
    card_name text NOT NULL,
    card_image_url text,
    interpretation text,
    user_viewed boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (report_id, card_order)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_report_tarot_selections_report_id
    ON public.report_tarot_selections (report_id);

-- RLS 활성화
ALTER TABLE public.report_tarot_selections ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 보고서 소유자만 타로 선택 조회 가능
CREATE POLICY "Users can view own tarot selections" ON public.report_tarot_selections
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.weekly_reports
            WHERE weekly_reports.id = report_id
            AND weekly_reports.user_id = auth.uid()
        )
    );

-- RLS 정책: 보고서 소유자만 user_viewed 업데이트 가능
CREATE POLICY "Users can update own tarot selections" ON public.report_tarot_selections
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.weekly_reports
            WHERE weekly_reports.id = report_id
            AND weekly_reports.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.weekly_reports
            WHERE weekly_reports.id = report_id
            AND weekly_reports.user_id = auth.uid()
        )
    );

-- 코멘트
COMMENT ON TABLE public.report_tarot_selections IS '보고서 타로 카드 - 3카드 타로 선택 기록';
COMMENT ON COLUMN public.report_tarot_selections.card_order IS '카드 순서: 1, 2, 3';
COMMENT ON COLUMN public.report_tarot_selections.user_viewed IS '사용자가 해당 카드를 확인했는지 여부';
