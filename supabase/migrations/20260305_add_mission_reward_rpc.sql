-- ============================================================
-- 미션 완료 리워드 (태그 5개 달성 → 새싹 30개) RPC
-- 2026-03-05
-- ============================================================
-- 기존 미션 쿠폰(12,900원) 프로세스를 새싹 30개 즉시 지급으로 대체
-- 패턴 참고: process_share_reward (공유 리워드)

CREATE OR REPLACE FUNCTION process_mission_reward(
  p_user_id UUID,
  p_reward_amount INTEGER DEFAULT 30
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
  -- 1. 중복 방지: 이미 미션 리워드를 받았는지 확인
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

  -- 2. 사용자 잔액 조회 (FOR UPDATE 락)
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

  -- 3. 잔액 업데이트
  v_balance_after := v_balance_before + p_reward_amount;

  UPDATE users
  SET sprout_balance = v_balance_after
  WHERE id = p_user_id;

  -- 4. 트랜잭션 기록
  INSERT INTO sprout_transactions (
    user_id, transaction_type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_user_id, 'reward', p_reward_amount,
    v_balance_before, v_balance_after,
    '미션 완료 리워드 (태그 5개 달성)'
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_balance_after,
    'reward_amount', p_reward_amount
  );
END;
$$;

-- 보안: service_role만 실행 가능 (기존 패턴과 동일)
REVOKE EXECUTE ON FUNCTION process_mission_reward FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION process_mission_reward TO service_role;
