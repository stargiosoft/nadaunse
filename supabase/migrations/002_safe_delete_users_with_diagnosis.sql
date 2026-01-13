-- ========================================
-- 🔍 1단계: 현재 FK 제약조건 진단
-- ========================================
-- ⚠️ 먼저 이 쿼리로 현재 상태를 확인하세요!
-- ========================================

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  col.is_nullable
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.columns AS col
  ON col.table_name = tc.table_name 
  AND col.column_name = kcu.column_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 📊 예상 결과:
-- table_name       | column_name | foreign_table | delete_rule | is_nullable
-- -----------------|-------------|---------------|-------------|-------------
-- orders           | user_id     | users         | NO ACTION   | NO or YES
-- saju_records     | user_id     | users         | NO ACTION   | NO or YES
-- user_coupons     | user_id     | users         | NO ACTION   | NO
-- alimtalk_logs    | user_id     | users         | NO ACTION   | NO or YES

-- ========================================
-- 🗑️ 2단계: users 안전 삭제 (진단 기반)
-- ========================================
-- ⚠️ 위 진단 결과를 확인한 후 이 섹션을 실행하세요!
-- ========================================

-- 1️⃣ orders FK 처리
DO $$ 
DECLARE
  current_nullable text;
  current_delete_rule text;
BEGIN
  -- 현재 nullable 상태 확인
  SELECT is_nullable INTO current_nullable
  FROM information_schema.columns
  WHERE table_name = 'orders' AND column_name = 'user_id';
  
  -- 현재 delete rule 확인
  SELECT delete_rule INTO current_delete_rule
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc 
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.table_name = 'orders' 
    AND tc.constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE '📋 orders.user_id 현재 상태: nullable=%, delete_rule=%', 
    current_nullable, current_delete_rule;
  
  -- FK 제약조건 제거
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
  
  -- nullable이 아니면 nullable로 변경
  IF current_nullable = 'NO' THEN
    ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
    RAISE NOTICE '✅ orders.user_id를 nullable로 변경';
  ELSE
    RAISE NOTICE 'ℹ️ orders.user_id는 이미 nullable';
  END IF;
  
  -- FK 재생성 (ON DELETE SET NULL)
  ALTER TABLE orders 
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;
  
  RAISE NOTICE '✅ orders FK 처리 완료 (ON DELETE SET NULL)';
END $$;

-- 2️⃣ saju_records FK 처리
DO $$ 
DECLARE
  current_nullable text;
BEGIN
  SELECT is_nullable INTO current_nullable
  FROM information_schema.columns
  WHERE table_name = 'saju_records' AND column_name = 'user_id';
  
  RAISE NOTICE '📋 saju_records.user_id 현재 상태: nullable=%', current_nullable;
  
  ALTER TABLE saju_records DROP CONSTRAINT IF EXISTS saju_records_user_id_fkey;
  
  IF current_nullable = 'NO' THEN
    ALTER TABLE saju_records ALTER COLUMN user_id DROP NOT NULL;
    RAISE NOTICE '✅ saju_records.user_id를 nullable로 변경';
  ELSE
    RAISE NOTICE 'ℹ️ saju_records.user_id는 이미 nullable';
  END IF;
  
  ALTER TABLE saju_records 
  ADD CONSTRAINT saju_records_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;
  
  RAISE NOTICE '✅ saju_records FK 처리 완료 (ON DELETE SET NULL)';
END $$;

-- 3️⃣ user_coupons FK 처리 (CASCADE 삭제)
DO $$ 
BEGIN
  ALTER TABLE user_coupons DROP CONSTRAINT IF EXISTS user_coupons_user_id_fkey;
  
  -- user_coupons는 CASCADE로 삭제 (사용자 종속 데이터)
  ALTER TABLE user_coupons 
  ADD CONSTRAINT user_coupons_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;
  
  RAISE NOTICE '✅ user_coupons FK 처리 완료 (ON DELETE CASCADE)';
END $$;

-- 4️⃣ alimtalk_logs FK 처리
DO $$ 
DECLARE
  current_nullable text;
BEGIN
  -- 테이블 존재 여부 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'alimtalk_logs'
  ) THEN
    SELECT is_nullable INTO current_nullable
    FROM information_schema.columns
    WHERE table_name = 'alimtalk_logs' AND column_name = 'user_id';
    
    RAISE NOTICE '📋 alimtalk_logs.user_id 현재 상태: nullable=%', current_nullable;
    
    ALTER TABLE alimtalk_logs DROP CONSTRAINT IF EXISTS alimtalk_logs_user_id_fkey;
    
    IF current_nullable = 'NO' THEN
      ALTER TABLE alimtalk_logs ALTER COLUMN user_id DROP NOT NULL;
      RAISE NOTICE '✅ alimtalk_logs.user_id를 nullable로 변경';
    ELSE
      RAISE NOTICE 'ℹ️ alimtalk_logs.user_id는 이미 nullable';
    END IF;
    
    ALTER TABLE alimtalk_logs 
    ADD CONSTRAINT alimtalk_logs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE '✅ alimtalk_logs FK 처리 완료 (ON DELETE SET NULL)';
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
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 삭제 전 통계:';
  RAISE NOTICE '  ├─ users: % 명', users_count;
  RAISE NOTICE '  ├─ orders: % 건', orders_count;
  RAISE NOTICE '  ├─ user_coupons: % 건', coupons_count;
  RAISE NOTICE '  └─ saju_records: % 건', saju_count;
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 6️⃣ users 테이블 삭제
TRUNCATE TABLE users CASCADE;

-- 7️⃣ 삭제 후 결과 확인
SELECT 
  'users' as table_name, 
  COUNT(*) as count,
  '🗑️ 전체 삭제됨' as description
FROM users
UNION ALL
SELECT 
  'user_coupons', 
  COUNT(*),
  '🗑️ CASCADE 삭제됨'
FROM user_coupons
UNION ALL
SELECT 
  'orders', 
  COUNT(*),
  '💾 보존됨 (user_id → NULL)'
FROM orders
UNION ALL
SELECT 
  'orders (user_id NULL)', 
  COUNT(*) FILTER (WHERE user_id IS NULL),
  '↳ user_id가 NULL인 주문'
FROM orders
UNION ALL
SELECT 
  'order_results', 
  COUNT(*),
  '💾 보존됨'
FROM order_results
UNION ALL
SELECT 
  'saju_records', 
  COUNT(*),
  '💾 보존됨 (user_id → NULL)'
FROM saju_records
ORDER BY 
  CASE table_name
    WHEN 'users' THEN 1
    WHEN 'user_coupons' THEN 2
    WHEN 'orders' THEN 3
    WHEN 'orders (user_id NULL)' THEN 4
    WHEN 'order_results' THEN 5
    WHEN 'saju_records' THEN 6
  END;

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
