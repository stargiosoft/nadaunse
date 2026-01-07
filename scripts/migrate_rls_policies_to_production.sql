-- ============================================
-- RLS 정책 이관 스크립트 (Staging → Production)
-- 생성일: 2026-01-06
-- ============================================

-- 1. alimtalk_logs
ALTER TABLE public.alimtalk_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert alimtalk_logs" ON public.alimtalk_logs;
CREATE POLICY "System can insert alimtalk_logs" ON public.alimtalk_logs
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own alimtalk_logs" ON public.alimtalk_logs;
CREATE POLICY "Users can view own alimtalk_logs" ON public.alimtalk_logs
  FOR SELECT TO public
  USING (auth.uid() = user_id);

-- 2. coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view coupons" ON public.coupons;
CREATE POLICY "Anyone can view coupons" ON public.coupons
  FOR SELECT TO public
  USING (true);

-- 3. master_content_questions (RLS DISABLED 유지)
-- ALTER TABLE public.master_content_questions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view questions" ON public.master_content_questions;
CREATE POLICY "Anyone can view questions" ON public.master_content_questions
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Master can manage questions" ON public.master_content_questions;
CREATE POLICY "Master can manage questions" ON public.master_content_questions
  FOR ALL TO public
  USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'master'::text))));

-- 4. master_contents (RLS DISABLED 유지)
-- ALTER TABLE public.master_contents DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view master contents" ON public.master_contents;
CREATE POLICY "Anyone can view master contents" ON public.master_contents
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role can manage master contents" ON public.master_contents;
CREATE POLICY "Service role can manage master contents" ON public.master_contents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. order_results
ALTER TABLE public.order_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can manage order_results" ON public.order_results;
CREATE POLICY "System can manage order_results" ON public.order_results
  FOR ALL TO public
  USING (true);

DROP POLICY IF EXISTS "Users can view own order_results" ON public.order_results;
CREATE POLICY "Users can view own order_results" ON public.order_results
  FOR SELECT TO public
  USING (auth.uid() = ( SELECT orders.user_id
   FROM orders
  WHERE (orders.id = order_results.order_id)));

-- 6. orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
CREATE POLICY "Authenticated users can insert orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;
CREATE POLICY "Service role can insert orders" ON public.orders
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;
CREATE POLICY "Service role can update orders" ON public.orders
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 7. saju_records
ALTER TABLE public.saju_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage saju records" ON public.saju_records;
CREATE POLICY "Service role can manage saju records" ON public.saju_records
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own saju records" ON public.saju_records;
CREATE POLICY "Users can delete their own saju records" ON public.saju_records
  FOR DELETE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saju records" ON public.saju_records;
CREATE POLICY "Users can insert own saju records" ON public.saju_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saju records" ON public.saju_records;
CREATE POLICY "Users can update own saju records" ON public.saju_records
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own saju records" ON public.saju_records;
CREATE POLICY "Users can view own saju records" ON public.saju_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 8. user_coupons
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert user_coupons" ON public.user_coupons;
CREATE POLICY "System can insert user_coupons" ON public.user_coupons
  FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own coupons" ON public.user_coupons;
CREATE POLICY "Users can update own coupons" ON public.user_coupons
  FOR UPDATE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own coupons" ON public.user_coupons;
CREATE POLICY "Users can view own coupons" ON public.user_coupons
  FOR SELECT TO public
  USING (auth.uid() = user_id);

-- 9. users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- ============================================
-- 완료! 총 26개 정책 적용
-- ============================================
