-- =====================================================
-- user_trait_tags 테이블에 is_confirmed 컬럼 추가
-- 태그 추출 시 임시 저장 (false) → 선택 시 확정 (true)
-- =====================================================

-- 1. is_confirmed 컬럼 추가
ALTER TABLE public.user_trait_tags
ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT false;

-- 2. 기존 데이터는 모두 확정된 것으로 처리
UPDATE public.user_trait_tags SET is_confirmed = true WHERE is_confirmed = false;

-- 3. UPDATE RLS 정책 추가 (기존에 없었음)
CREATE POLICY "Users can update own trait tags" ON public.user_trait_tags
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. 인덱스 추가 (is_confirmed 기반 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_user_trait_tags_confirmed
    ON public.user_trait_tags (user_id, is_confirmed);

-- 5. source_order_id 기반 인덱스 추가 (주문별 태그 조회용)
CREATE INDEX IF NOT EXISTS idx_user_trait_tags_order_id
    ON public.user_trait_tags (source_order_id) WHERE source_order_id IS NOT NULL;

-- 코멘트
COMMENT ON COLUMN public.user_trait_tags.is_confirmed IS '태그 확정 여부: false(추출됨, 미선택), true(사용자가 선택 완료)';
