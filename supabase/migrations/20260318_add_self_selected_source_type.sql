-- user_trait_tags.source_type CHECK 제약조건에 'self_selected' 추가
-- 미래예측기에서 사용자가 직접 선택한 태그 저장용

-- 기존 CHECK 제약조건 삭제
ALTER TABLE public.user_trait_tags
  DROP CONSTRAINT IF EXISTS user_trait_tags_source_type_check;

-- 새 CHECK 제약조건 추가 (self_selected 포함)
ALTER TABLE public.user_trait_tags
  ADD CONSTRAINT user_trait_tags_source_type_check
  CHECK (source_type IN ('free_content', 'paid_content', 'self_selected'));

COMMENT ON COLUMN public.user_trait_tags.source_type IS '출처 타입: free_content(무료), paid_content(유료), self_selected(직접 선택)';
