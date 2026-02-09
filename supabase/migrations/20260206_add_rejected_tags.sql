-- 사용자가 나다움 기록하기에서 선택하지 않은 태그 저장 (AI 추출 시 제외)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS rejected_tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.users.rejected_tags IS '사용자가 나다움 기록하기에서 선택하지 않은 태그 (AI 추출 시 제외)';
