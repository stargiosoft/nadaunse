-- 무료 콘텐츠 이용 기록 테이블 생성
-- 목적: 로그인 사용자의 무료 콘텐츠 이용 기록을 DB에 저장하여 "운세 기록" 페이지에서 조회 가능하게 함

CREATE TABLE IF NOT EXISTS public.free_content_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    content_id uuid NOT NULL REFERENCES public.master_contents(id) ON DELETE CASCADE,
    saju_record_id uuid REFERENCES public.saju_records(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    gender text NOT NULL,
    birth_date timestamptz NOT NULL,
    birth_time text,
    is_guest boolean DEFAULT false,
    answers jsonb NOT NULL,  -- [{question_id, question_order, question_text, answer_text}]
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스: 사용자별 기록 조회 최적화 (최신순 정렬)
CREATE INDEX IF NOT EXISTS idx_free_content_records_user_created
  ON public.free_content_records (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- 인덱스: 콘텐츠별 기록 조회
CREATE INDEX IF NOT EXISTS idx_free_content_records_content
  ON public.free_content_records (content_id);

-- RLS 활성화
ALTER TABLE public.free_content_records ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 본인의 기록만 조회 가능
CREATE POLICY "Users can view own free content records" ON public.free_content_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 본인의 기록만 생성 가능
CREATE POLICY "Users can insert own free content records" ON public.free_content_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE public.free_content_records IS '무료 콘텐츠 이용 기록 (로그인 사용자만)';
COMMENT ON COLUMN public.free_content_records.answers IS 'AI 생성 답변 배열: [{question_id, question_order, question_text, answer_text}]';
