-- 비회원 무료 콘텐츠 일일 조회 추적 테이블
-- 프론트 localStorage 차단 + 백엔드 IP+UA 해시 이중 검증용

CREATE TABLE IF NOT EXISTS public.anonymous_free_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint text NOT NULL,              -- sha256(IP + User-Agent)
    content_id text NOT NULL,               -- contentId (text for flexibility)
    viewed_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- 일일 카운트 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_anon_views_fp_date
    ON public.anonymous_free_views (fingerprint, viewed_date);

-- 같은 fingerprint + content + 날짜 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_anon_views_unique
    ON public.anonymous_free_views (fingerprint, content_id, viewed_date);

-- RLS 불필요 (Edge Function에서 Service Role Key로만 접근)
-- RLS를 비활성화 상태로 유지

COMMENT ON TABLE public.anonymous_free_views IS '비회원 무료 콘텐츠 일일 조회 추적 (IP+UA 해시 기반)';
COMMENT ON COLUMN public.anonymous_free_views.fingerprint IS 'sha256(IP + User-Agent) 해시값';
COMMENT ON COLUMN public.anonymous_free_views.content_id IS '조회한 콘텐츠 ID (text 타입으로 UUID/숫자 모두 대응)';
COMMENT ON COLUMN public.anonymous_free_views.viewed_date IS '조회 날짜 (KST 기준 일일 제한용)';
