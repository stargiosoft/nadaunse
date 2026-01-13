-- ============================================
-- RLS 정책 동기화: Production → Staging
-- ============================================
-- 주의: 이 스크립트는 Staging DB(kcthtpmxffppfbkjjkub)에만 실행하세요!
-- 실행 전 Production DB에서 현재 RLS 정책을 확인한 후 수정이 필요할 수 있습니다.
-- ============================================

-- ============================================
-- Step 1: Production에서 RLS 정책 확인 (참고용)
-- ============================================
-- 아래 쿼리를 Production DB에서 실행하여 정확한 정책을 확인하세요:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================
-- Step 2: Staging 기존 RLS 정책 제거
-- ============================================

-- 기존 정책 모두 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 모든 테이블의 RLS 비활성화
ALTER TABLE public.alimtalk_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_content_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_contents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saju_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 3: Production RLS 정책 적용
-- ============================================

-- ⚠️ 아래는 예시 정책입니다.
-- Production DB에서 실제 정책을 확인한 후 수정하세요!

-- ------------------------------------------------
-- 1️⃣ alimtalk_logs
-- ------------------------------------------------
ALTER TABLE public.alimtalk_logs ENABLE ROW LEVEL SECURITY;

-- 예시: Service role만 접근 가능
CREATE POLICY "Service role can manage alimtalk_logs"
  ON public.alimtalk_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------
-- 2️⃣ coupons
-- ------------------------------------------------
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 예시: 모든 사용자가 조회 가능, Service role만 수정 가능
CREATE POLICY "Public can view coupons"
  ON public.coupons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage coupons"
  ON public.coupons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------
-- 3️⃣ order_results
-- ------------------------------------------------
ALTER TABLE public.order_results ENABLE ROW LEVEL SECURITY;

-- 예시: 자신의 주문 결과만 조회 가능
CREATE POLICY "Users can view own order results"
  ON public.order_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_results.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage order results"
  ON public.order_results
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------
-- 4️⃣ orders
-- ------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 예시: 자신의 주문만 조회 가능
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage orders"
  ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------
-- 5️⃣ saju_records
-- ------------------------------------------------
ALTER TABLE public.saju_records ENABLE ROW LEVEL SECURITY;

-- 예시: 자신의 사주 기록만 조회/수정 가능
CREATE POLICY "Users can view own saju records"
  ON public.saju_records
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saju records"
  ON public.saju_records
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saju records"
  ON public.saju_records
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saju records"
  ON public.saju_records
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage saju records"
  ON public.saju_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------
-- 6️⃣ user_coupons
-- ------------------------------------------------
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- 예시: 자신의 쿠폰만 조회 가능
CREATE POLICY "Users can view own coupons"
  ON public.user_coupons
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage user coupons"
  ON public.user_coupons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------
-- 7️⃣ master_content_questions (UNRESTRICTED 유지)
-- ------------------------------------------------
ALTER TABLE public.master_content_questions DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------
-- 8️⃣ master_contents (UNRESTRICTED 유지)
-- ------------------------------------------------
ALTER TABLE public.master_contents DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------
-- 9️⃣ users (UNRESTRICTED 유지)
-- ------------------------------------------------
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 4: 검증 쿼리
-- ============================================

-- RLS 활성화 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 모든 RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Operation"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
