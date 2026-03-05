-- ============================================================
-- 미션 리워드 fingerprint 검증 추가
-- 2026-03-05
-- ============================================================
-- 같은 기기(IP+UA)에서 다른 계정으로 새싹 리워드 중복 수령 방지

-- 1. sprout_transactions에 ip_fingerprint 컬럼 추가
ALTER TABLE sprout_transactions ADD COLUMN IF NOT EXISTS ip_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_sprout_transactions_mission_fingerprint
  ON sprout_transactions(ip_fingerprint)
  WHERE transaction_type = 'reward'
    AND description = '미션 완료 리워드 (태그 5개 달성)';

-- 2. process_mission_reward RPC 업데이트 (fingerprint + check_only 지원)
CREATE OR REPLACE FUNCTION process_mission_reward(
  p_user_id UUID,
  p_reward_amount INTEGER DEFAULT 30,
  p_ip_fingerprint TEXT DEFAULT NULL,
  p_check_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
BEGIN
  -- 1. user_id 중복 체크 (같은 계정에서 재요청)
  IF EXISTS (
    SELECT 1 FROM sprout_transactions
    WHERE user_id = p_user_id
      AND transaction_type = 'reward'
      AND description = '미션 완료 리워드 (태그 5개 달성)'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_granted', true,
      'error', 'ALREADY_GRANTED'
    );
  END IF;

  -- 2. fingerprint 중복 체크 (다른 계정, 같은 기기)
  IF p_ip_fingerprint IS NOT NULL AND EXISTS (
    SELECT 1 FROM sprout_transactions
    WHERE ip_fingerprint = p_ip_fingerprint
      AND transaction_type = 'reward'
      AND description = '미션 완료 리워드 (태그 5개 달성)'
      AND user_id != p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'fingerprint_used', true,
      'error', 'FINGERPRINT_ALREADY_USED'
    );
  END IF;

  -- 3. check_only 모드: 자격만 확인하고 리턴
  IF p_check_only THEN
    RETURN jsonb_build_object(
      'success', true,
      'eligible', true
    );
  END IF;

  -- 4. 사용자 잔액 조회 (FOR UPDATE 락)
  SELECT sprout_balance INTO v_balance_before
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance_before IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND'
    );
  END IF;

  -- 5. 잔액 업데이트
  v_balance_after := v_balance_before + p_reward_amount;

  UPDATE users
  SET sprout_balance = v_balance_after
  WHERE id = p_user_id;

  -- 6. 트랜잭션 기록 (fingerprint 포함)
  INSERT INTO sprout_transactions (
    user_id, transaction_type, amount,
    balance_before, balance_after, description, ip_fingerprint
  ) VALUES (
    p_user_id, 'reward', p_reward_amount,
    v_balance_before, v_balance_after,
    '미션 완료 리워드 (태그 5개 달성)', p_ip_fingerprint
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_balance_after,
    'reward_amount', p_reward_amount
  );
END;
$$;

-- 보안: service_role만 실행 가능
REVOKE EXECUTE ON FUNCTION process_mission_reward FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION process_mission_reward TO service_role;
