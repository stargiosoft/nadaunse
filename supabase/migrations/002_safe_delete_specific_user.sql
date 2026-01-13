-- ========================================
-- 🗑️ 특정 사용자 안전 삭제
-- ========================================
-- ⚠️ 이 SQL을 Supabase SQL Editor에서 실행하세요!
-- ========================================
-- 
-- 📌 삭제 방법:
-- 1. 이메일로 삭제
-- 2. user_id로 삭제
-- 3. 제공자(kakao/google)로 삭제
-- 
-- 📌 삭제 정책:
-- - users: 특정 사용자만 삭제
-- - user_coupons: CASCADE 삭제 (사용자 종속 데이터)
-- - orders: 보존 (user_id → NULL)
-- - order_results: 보존
-- - saju_records: 보존 (user_id → NULL)
-- ========================================

-- ========================================
-- STEP 1: FK 제약조건 설정 (최초 1회만 실행)
-- ========================================
-- 이미 설정되어 있다면 건너뛰어도 됩니다.
-- ========================================

-- 1️⃣ orders.user_id FK 처리
DO $$ 
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
  ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
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

-- 4️⃣ alimtalk_logs.user_id FK 처리
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
  END IF;
END $$;

-- ========================================
-- STEP 2: 특정 사용자 삭제
-- ========================================
-- ⚠️ 아래 방법 중 하나를 선택해서 실행하세요!
-- ========================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 방법 1️⃣: 이메일로 특정 사용자 삭제
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔽 아래 이메일을 수정하고 실행하세요

-- 삭제 전 확인
SELECT 
  id,
  email,
  full_name,
  provider,
  created_at,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as orders_count,
  (SELECT COUNT(*) FROM user_coupons WHERE user_id = users.id) as coupons_count,
  (SELECT COUNT(*) FROM saju_records WHERE user_id = users.id) as saju_count
FROM users
WHERE email = 'example@gmail.com';  -- ⚠️ 이메일을 수정하세요!

-- 삭제 실행 (위 결과를 확인한 후)
/*
DELETE FROM users 
WHERE email = 'example@gmail.com';  -- ⚠️ 이메일을 수정하세요!
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 방법 2️⃣: user_id로 특정 사용자 삭제
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔽 아래 user_id를 수정하고 실행하세요

-- 삭제 전 확인
SELECT 
  id,
  email,
  full_name,
  provider,
  created_at,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as orders_count,
  (SELECT COUNT(*) FROM user_coupons WHERE user_id = users.id) as coupons_count,
  (SELECT COUNT(*) FROM saju_records WHERE user_id = users.id) as saju_count
FROM users
WHERE id = '00000000-0000-0000-0000-000000000000';  -- ⚠️ user_id를 수정하세요!

-- 삭제 실행 (위 결과를 확인한 후)
/*
DELETE FROM users 
WHERE id = '00000000-0000-0000-0000-000000000000';  -- ⚠️ user_id를 수정하세요!
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 방법 3️⃣: 제공자(kakao/google)로 모든 계정 삭제
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔽 특정 제공자의 모든 계정을 삭제합니다 (주의!)

-- 삭제 전 확인
SELECT 
  id,
  email,
  full_name,
  provider,
  created_at,
  (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as orders_count,
  (SELECT COUNT(*) FROM user_coupons WHERE user_id = users.id) as coupons_count,
  (SELECT COUNT(*) FROM saju_records WHERE user_id = users.id) as saju_count
FROM users
WHERE provider = 'kakao';  -- 또는 'google'

-- 삭제 실행 (위 결과를 확인한 후)
/*
DELETE FROM users 
WHERE provider = 'kakao';  -- 또는 'google'
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 방법 4️⃣: 여러 사용자를 한 번에 삭제
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 삭제 전 확인
SELECT 
  id,
  email,
  full_name,
  provider,
  created_at
FROM users
WHERE email IN (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
);

-- 삭제 실행 (위 결과를 확인한 후)
/*
DELETE FROM users 
WHERE email IN (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
);
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 방법 5️⃣: 특정 날짜 이전의 사용자 삭제
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 삭제 전 확인
SELECT 
  id,
  email,
  full_name,
  provider,
  created_at
FROM users
WHERE created_at < '2024-01-01'  -- ⚠️ 날짜를 수정하세요!
ORDER BY created_at;

-- 삭제 실행 (위 결과를 확인한 후)
/*
DELETE FROM users 
WHERE created_at < '2024-01-01';  -- ⚠️ 날짜를 수정하세요!
*/

-- ========================================
-- STEP 3: 삭제 후 결과 확인
-- ========================================

SELECT 
  1 as sort_order,
  'users' as table_name, 
  COUNT(*) as count,
  '남은 사용자 수' as description
FROM users
UNION ALL
SELECT 
  2,
  'user_coupons', 
  COUNT(*),
  '남은 쿠폰 수 (CASCADE 삭제됨)'
FROM user_coupons
UNION ALL
SELECT 
  3,
  'orders', 
  COUNT(*),
  '전체 주문 수 (보존됨)'
FROM orders
UNION ALL
SELECT 
  4,
  'orders (user_id NULL)', 
  COUNT(*) FILTER (WHERE user_id IS NULL),
  'user_id가 NULL인 주문 (삭제된 사용자의 주문)'
FROM orders
UNION ALL
SELECT 
  5,
  'saju_records', 
  COUNT(*),
  '전체 사주 기록 (보존됨)'
FROM saju_records
UNION ALL
SELECT 
  6,
  'saju_records (user_id NULL)', 
  COUNT(*) FILTER (WHERE user_id IS NULL),
  'user_id가 NULL인 사주 기록'
FROM saju_records
ORDER BY sort_order;

-- ========================================
-- ✅ 완료!
-- ========================================
-- 
-- 📝 실행 순서:
-- 1. STEP 1 실행 (최초 1회만)
-- 2. STEP 2에서 삭제 방법 선택
-- 3. 먼저 SELECT 문으로 삭제될 데이터 확인
-- 4. 확인 후 DELETE 문의 주석(/* */)을 제거하고 실행
-- 5. STEP 3으로 결과 확인
-- 
-- ⚠️ 주의사항:
-- - DELETE는 되돌릴 수 없으니 반드시 SELECT로 먼저 확인하세요!
-- - 삭제된 사용자의 주문/사주 기록은 보존되지만 user_id가 NULL이 됩니다.
-- - user_coupons는 CASCADE로 함께 삭제됩니다.
-- ========================================
