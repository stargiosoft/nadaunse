-- 비회원 일일 무료 콘텐츠 조회 제한 테이블
-- IP+UserAgent SHA-256 해시(fingerprint)로 비회원을 식별하여 하루 3회 제한 적용
-- Edge Function: generate-free-preview에서 사용

CREATE TABLE IF NOT EXISTS public.anonymous_free_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    fingerprint text NOT NULL,
    content_id uuid NOT NULL REFERENCES public.master_contents(id) ON DELETE CASCADE,
    viewed_date date NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(fingerprint, content_id, viewed_date)
);

-- 인덱스: fingerprint + viewed_date 기준 일일 사용량 조회 최적화
CREATE INDEX IF NOT EXISTS idx_anonymous_free_views_fingerprint_date
  ON public.anonymous_free_views (fingerprint, viewed_date);

-- RLS 비활성화 (Edge Function에서 Service Role Key로만 접근)
ALTER TABLE public.anonymous_free_views ENABLE ROW LEVEL SECURITY;

-- 코멘트
COMMENT ON TABLE public.anonymous_free_views IS '비회원 무료 콘텐츠 일일 조회 기록 (IP+UA fingerprint 기반)';
COMMENT ON COLUMN public.anonymous_free_views.fingerprint IS 'IP+UserAgent SHA-256 해시 (32자)';
COMMENT ON COLUMN public.anonymous_free_views.viewed_date IS 'KST 기준 조회 날짜';
