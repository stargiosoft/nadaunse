-- 로그인 유저 사주/타로 상담 일일 1회 제한 추적 테이블
-- anonymous_free_views 패턴과 동일하게 설계

CREATE TABLE IF NOT EXISTS public.user_consult_daily (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    consult_type text NOT NULL CHECK (consult_type IN ('saju', 'taro')),
    consulted_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- 일일 제한 조회용 인덱스 (user_id + consult_type + 날짜)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consult_daily_unique
    ON public.user_consult_daily (user_id, consult_type, consulted_date);

-- RLS 불필요 (Edge Function에서 Service Role Key로만 접근)
ALTER TABLE public.user_consult_daily ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_consult_daily IS '로그인 유저 상담 일일 1회 제한 추적 (매일 자동 정리)';
COMMENT ON COLUMN public.user_consult_daily.user_id IS '사용자 ID (auth.users)';
COMMENT ON COLUMN public.user_consult_daily.consult_type IS '상담 유형 (saju | taro)';
COMMENT ON COLUMN public.user_consult_daily.consulted_date IS '상담 날짜 (KST 기준, 매일 09:00 KST 자동 정리)';
