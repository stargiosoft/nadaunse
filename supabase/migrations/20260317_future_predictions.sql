-- =====================================================
-- 미래 예측기 - future_predictions 테이블 생성
-- 목적: AI 미래 예측 결과 저장 (온톨로지, 스펙트럼, 에이전트 토론)
-- 적용: 스테이징 먼저 테스트 후 프로덕션 반영
-- =====================================================

-- =====================================================
-- 1. future_predictions (미래 예측 결과)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.future_predictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    saju_record_id uuid REFERENCES public.saju_records(id) ON DELETE SET NULL,
    category text NOT NULL CHECK (category IN ('연애', '재물', '커리어', '건강', '인간관계')),
    attitude_answers jsonb NOT NULL,
    ontology jsonb NOT NULL,
    spectrum_position real NOT NULL CHECK (spectrum_position >= 0 AND spectrum_position <= 1),
    spectrum_label text NOT NULL,
    spectrum_summary text NOT NULL,
    debate_result jsonb NOT NULL,
    is_paid boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_future_predictions_user_id
    ON public.future_predictions (user_id);
CREATE INDEX IF NOT EXISTS idx_future_predictions_created_at
    ON public.future_predictions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_future_predictions_user_category
    ON public.future_predictions (user_id, category, created_at DESC);

-- RLS 활성화
ALTER TABLE public.future_predictions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 본인 예측 결과만 조회 가능
CREATE POLICY "Users can view own predictions" ON public.future_predictions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- INSERT/UPDATE는 Edge Function (service_role)에서만 가능
-- 별도 정책 없음 - service_role 사용

-- 코멘트
COMMENT ON TABLE public.future_predictions IS '미래 예측기 - AI 에이전트 시뮬레이션 결과';
COMMENT ON COLUMN public.future_predictions.category IS '예측 카테고리: 연애, 재물, 커리어, 건강, 인간관계';
COMMENT ON COLUMN public.future_predictions.attitude_answers IS '5문항 태도 테스트 응답 (JSONB)';
COMMENT ON COLUMN public.future_predictions.ontology IS '온톨로지 그래프 데이터 (center + nodes)';
COMMENT ON COLUMN public.future_predictions.spectrum_position IS '파극(0)↔대성(1) 스펙트럼 위치';
COMMENT ON COLUMN public.future_predictions.debate_result IS '에이전트 토론 결과 (낙관/현실/비관/결론)';
COMMENT ON COLUMN public.future_predictions.is_paid IS '유료 전체 리포트 여부';
