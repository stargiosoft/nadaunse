-- ========================================
-- 🗑️ users 안전 삭제 (orders 보존 + 쿠폰 CASCADE)
-- ========================================
-- ⚠️ 이 SQL 전체를 복사해서 Supabase SQL Editor에 붙여넣고 Run하세요!
-- ========================================
-- 
-- 📌 삭제 정책:
-- - users: 모두 삭제
-- - user_coupons: CASCADE 삭제 (사용자 종속 데이터)
-- - orders: 보존 (user_id → NULL)
-- - order_results: 보존
-- - saju_records: 보존 (user_id → NULL)
-- - alimtalk_logs: 보존 (user_id → NULL)
-- ========================================

-- 1️⃣ orders.user_id FK 제약조건 처리
DO $$ 
BEGIN
  -- FK 제약조건 제거
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
  
  -- user_id를 nullable로 변경
  ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
  
  -- FK 제약조건 재생성 (ON DELETE SET NULL)
  ALTER TABLE orders 
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;
  
  RAISE NOTICE '✅ orders.user_id FK 처리 완료 (ON DELETE SET NULL)';
END $$;

-- 2️⃣ saju_records.user_id FK 처리
DO $$ 
BEGIN
  ALTER TABLE saju_records DROP CONSTRAINT IF EXISTS saju_records_user_id_fkey;
  ALTER TABLE saju_records ALTER COLUMN user_id DROP NOT NULL;
  ALTER TABLE saju_records 
  ADD CONSTRAINT saju_records_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;
  
  RAISE NOTICE '✅ saju_records.user_id FK 처리 완료 (ON DELETE SET NULL)';
END $$;

-- 3️⃣ user_coupons.user_id FK 처리 (CASCADE 삭제)
DO $$ 
BEGIN
  ALTER TABLE user_coupons DROP CONSTRAINT IF EXISTS user_coupons_user_id_fkey;
  ALTER TABLE user_coupons 
  ADD CONSTRAINT user_coupons_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;
  
  RAISE NOTICE '✅ user_coupons.user_id FK 처리 완료 (ON DELETE CASCADE)';
END $$;

-- 4️⃣ alimtalk_logs.user_id FK 처리 (존재하는 경우에만)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'alimtalk_logs'
  ) THEN
    ALTER TABLE alimtalk_logs DROP CONSTRAINT IF EXISTS alimtalk_logs_user_id_fkey;
    ALTER TABLE alimtalk_logs ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE alimtalk_logs 
    ADD CONSTRAINT alimtalk_logs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE '✅ alimtalk_logs.user_id FK 처리 완료 (ON DELETE SET NULL)';
  ELSE
    RAISE NOTICE 'ℹ️ alimtalk_logs 테이블이 존재하지 않음';
  END IF;
END $$;

-- 5️⃣ 삭제 전 통계 확인
DO $$ 
DECLARE
  users_count INT;
  orders_count INT;
  coupons_count INT;
  saju_count INT;
BEGIN
  SELECT COUNT(*) INTO users_count FROM users;
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO coupons_count FROM user_coupons;
  SELECT COUNT(*) INTO saju_count FROM saju_records;
  
  RAISE NOTICE '📊 삭제 전 통계:';
  RAISE NOTICE '  - users: % 명', users_count;
  RAISE NOTICE '  - orders: % 건', orders_count;
  RAISE NOTICE '  - user_coupons: % 건', coupons_count;
  RAISE NOTICE '  - saju_records: % 건', saju_count;
END $$;

-- 6️⃣ users 테이블 삭제 (CASCADE로 user_coupons도 함께 삭제됨)
TRUNCATE TABLE users CASCADE;

-- 7️⃣ 삭제 후 결과 확인
SELECT 
  'users' as table_name, 
  COUNT(*) as count,
  '전체 삭제됨' as description
FROM users
UNION ALL
SELECT 
  'orders', 
  COUNT(*),
  '보존됨 (user_id → NULL)'
FROM orders
UNION ALL
SELECT 
  'orders (user_id NULL)', 
  COUNT(*) FILTER (WHERE user_id IS NULL),
  'user_id가 NULL인 주문'
FROM orders
UNION ALL
SELECT 
  'order_results', 
  COUNT(*),
  '보존됨'
FROM order_results
UNION ALL
SELECT 
  'saju_records', 
  COUNT(*),
  '보존됨 (user_id → NULL)'
FROM saju_records
UNION ALL
SELECT 
  'user_coupons', 
  COUNT(*),
  'CASCADE 삭제됨'
FROM user_coupons
ORDER BY 
  CASE table_name
    WHEN 'users' THEN 1
    WHEN 'user_coupons' THEN 2
    WHEN 'orders' THEN 3
    WHEN 'orders (user_id NULL)' THEN 4
    WHEN 'order_results' THEN 5
    WHEN 'saju_records' THEN 6
  END;

-- 8️⃣ 시퀀스 리셋 (옵션)
-- ⚠️ 주의: 개발 환경에서만 사용하세요!
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE user_coupons_id_seq RESTART WITH 1;

-- ========================================
-- ✅ 완료!
-- ========================================
-- 📝 예상 결과:
-- - users: 0건 (전체 삭제)
-- - user_coupons: 0건 (CASCADE 삭제)
-- - orders: N건 (보존, user_id = NULL)
-- - order_results: N건 (보존)
-- - saju_records: N건 (보존, user_id = NULL)
-- ========================================
