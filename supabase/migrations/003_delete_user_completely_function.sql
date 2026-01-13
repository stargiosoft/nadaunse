-- ========================================
-- 🗑️ 사용자 완전 삭제 함수
-- ========================================
-- 사용자와 관련된 모든 데이터를 한 번에 삭제합니다.
-- ========================================

CREATE OR REPLACE FUNCTION delete_user_completely(user_email TEXT)
RETURNS TABLE(
  deleted_user_id UUID,
  deleted_email TEXT,
  deleted_user_coupons INT,
  deleted_order_results INT,
  deleted_orders INT,
  deleted_saju_records INT,
  deleted_alimtalk_logs INT,
  status TEXT
) AS $$
DECLARE
  target_user_id UUID;
  v_user_coupons INT := 0;
  v_order_results INT := 0;
  v_orders INT := 0;
  v_saju_records INT := 0;
  v_alimtalk_logs INT := 0;
BEGIN
  -- 1️⃣ 사용자 ID 조회
  SELECT id INTO target_user_id
  FROM users
  WHERE email = user_email;

  -- 사용자가 없으면 에러
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION '❌ 사용자를 찾을 수 없습니다: %', user_email;
  END IF;

  RAISE NOTICE '🔍 삭제 대상 사용자: % (ID: %)', user_email, target_user_id;

  -- 2️⃣ user_coupons 삭제
  DELETE FROM user_coupons 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_user_coupons = ROW_COUNT;
  RAISE NOTICE '✅ user_coupons 삭제: %건', v_user_coupons;

  -- 3️⃣ order_results 삭제 (orders와 연결된 결과 먼저 삭제)
  DELETE FROM order_results 
  WHERE order_id IN (
    SELECT id FROM orders WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS v_order_results = ROW_COUNT;
  RAISE NOTICE '✅ order_results 삭제: %건', v_order_results;

  -- 4️⃣ orders 삭제
  DELETE FROM orders 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_orders = ROW_COUNT;
  RAISE NOTICE '✅ orders 삭제: %건', v_orders;

  -- 5️⃣ saju_records 삭제
  DELETE FROM saju_records 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_saju_records = ROW_COUNT;
  RAISE NOTICE '✅ saju_records 삭제: %건', v_saju_records;

  -- 6️⃣ alimtalk_logs 삭제 (테이블이 존재하는 경우)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alimtalk_logs') THEN
    DELETE FROM alimtalk_logs 
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS v_alimtalk_logs = ROW_COUNT;
    RAISE NOTICE '✅ alimtalk_logs 삭제: %건', v_alimtalk_logs;
  END IF;

  -- 7️⃣ users 삭제
  DELETE FROM users 
  WHERE id = target_user_id;
  RAISE NOTICE '✅ users 삭제 완료';

  -- 결과 반환
  RETURN QUERY SELECT 
    target_user_id,
    user_email,
    v_user_coupons,
    v_order_results,
    v_orders,
    v_saju_records,
    v_alimtalk_logs,
    '✅ 완전 삭제 완료'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 📝 사용 방법
-- ========================================
-- 
-- 1️⃣ 먼저 삭제될 데이터 확인:
--
-- SELECT 
--   u.id,
--   u.email,
--   u.full_name,
--   u.provider,
--   (SELECT COUNT(*) FROM user_coupons WHERE user_id = u.id) as coupons,
--   (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as orders,
--   (SELECT COUNT(*) FROM saju_records WHERE user_id = u.id) as saju_records
-- FROM users u
-- WHERE u.email = 'user@example.com';
--
-- 2️⃣ 확인 후 삭제 실행:
--
-- SELECT * FROM delete_user_completely('user@example.com');
--
-- 3️⃣ 결과 예시:
-- deleted_user_id | deleted_email        | deleted_user_coupons | deleted_orders | ...
-- ----------------|---------------------|---------------------|----------------|-----
-- abc-123-def     | user@example.com    | 2                   | 5              | ...
--
-- ========================================
-- ⚠️ 주의사항
-- ========================================
-- - 이 함수는 모든 관련 데이터를 영구적으로 삭제합니다.
-- - 삭제된 데이터는 복구할 수 없습니다.
-- - 반드시 SELECT로 먼저 확인한 후 실행하세요!
-- ========================================

-- ========================================
-- 🔧 User ID로 삭제하는 함수 (추가)
-- ========================================

CREATE OR REPLACE FUNCTION delete_user_by_id_completely(target_user_id UUID)
RETURNS TABLE(
  deleted_user_id UUID,
  deleted_email TEXT,
  deleted_user_coupons INT,
  deleted_order_results INT,
  deleted_orders INT,
  deleted_saju_records INT,
  deleted_alimtalk_logs INT,
  status TEXT
) AS $$
DECLARE
  user_email_found TEXT;
  v_user_coupons INT := 0;
  v_order_results INT := 0;
  v_orders INT := 0;
  v_saju_records INT := 0;
  v_alimtalk_logs INT := 0;
BEGIN
  -- 1️⃣ 사용자 이메일 조회
  SELECT email INTO user_email_found
  FROM users
  WHERE id = target_user_id;

  -- 사용자가 없으면 에러
  IF user_email_found IS NULL THEN
    RAISE EXCEPTION '❌ 사용자를 찾을 수 없습니다: %', target_user_id;
  END IF;

  RAISE NOTICE '🔍 삭제 대상 사용자: % (ID: %)', user_email_found, target_user_id;

  -- 2️⃣ user_coupons 삭제
  DELETE FROM user_coupons 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_user_coupons = ROW_COUNT;
  RAISE NOTICE '✅ user_coupons 삭제: %건', v_user_coupons;

  -- 3️⃣ order_results 삭제
  DELETE FROM order_results 
  WHERE order_id IN (
    SELECT id FROM orders WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS v_order_results = ROW_COUNT;
  RAISE NOTICE '✅ order_results 삭제: %건', v_order_results;

  -- 4️⃣ orders 삭제
  DELETE FROM orders 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_orders = ROW_COUNT;
  RAISE NOTICE '✅ orders 삭제: %건', v_orders;

  -- 5️⃣ saju_records 삭제
  DELETE FROM saju_records 
  WHERE user_id = target_user_id;
  GET DIAGNOSTICS v_saju_records = ROW_COUNT;
  RAISE NOTICE '✅ saju_records 삭제: %건', v_saju_records;

  -- 6️⃣ alimtalk_logs 삭제
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alimtalk_logs') THEN
    DELETE FROM alimtalk_logs 
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS v_alimtalk_logs = ROW_COUNT;
    RAISE NOTICE '✅ alimtalk_logs 삭제: %건', v_alimtalk_logs;
  END IF;

  -- 7️⃣ users 삭제
  DELETE FROM users 
  WHERE id = target_user_id;
  RAISE NOTICE '✅ users 삭제 완료';

  -- 결과 반환
  RETURN QUERY SELECT 
    target_user_id,
    user_email_found,
    v_user_coupons,
    v_order_results,
    v_orders,
    v_saju_records,
    v_alimtalk_logs,
    '✅ 완전 삭제 완료'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 📝 User ID로 삭제 사용 방법
-- ========================================
--
-- SELECT * FROM delete_user_by_id_completely('사용자UUID');
--
-- ========================================
