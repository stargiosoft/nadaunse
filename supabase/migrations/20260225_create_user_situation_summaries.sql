-- user_situation_summaries: 주간 보고서 + 콘텐츠 풀이에서 생성되는 situation_summary 통합 관리
CREATE TABLE IF NOT EXISTS public.user_situation_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    situation_summary text NOT NULL,
    source_type text NOT NULL CHECK (source_type IN ('weekly_report', 'content_answer')),
    source_id uuid,                    -- weekly_reports.id 또는 orders.id
    period_start date NOT NULL,        -- 분석 대상 기간 시작
    period_end date NOT NULL,          -- 분석 대상 기간 종료
    model_used text,                   -- 'gpt-4.1-nano', 'gpt-5.1'
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_situation_summaries_user_created
    ON public.user_situation_summaries (user_id, created_at DESC);

ALTER TABLE public.user_situation_summaries ENABLE ROW LEVEL SECURITY;

-- Service Role Key 전용 (Edge Function에서만 접근)
CREATE POLICY "Service role full access" ON public.user_situation_summaries
    FOR ALL USING (true) WITH CHECK (true);

-- 기존 weekly_reports의 situation_summary 데이터 이관
INSERT INTO public.user_situation_summaries (user_id, situation_summary, source_type, source_id, period_start, period_end, model_used, created_at)
SELECT
    wr.user_id,
    wr.situation_summary,
    'weekly_report',
    wr.id,
    wr.week_start_date,
    wr.week_end_date,
    'gpt-5.1',
    wr.published_at
FROM public.weekly_reports wr
WHERE wr.situation_summary IS NOT NULL
  AND wr.status = 'completed'
ORDER BY wr.published_at ASC;
