-- ============================================================
-- 추천인 양방향 리워드: 추천인(User A) + 피추천인(User B) 모두 30새싹
-- 2026-03-09
-- ============================================================

-- process_share_reward RPC 함수 업데이트
-- 변경사항: 피추천인(User B)에게도 30새싹 즉시 지급
CREATE OR REPLACE FUNCTION process_share_reward(
  p_referrer_id UUID,
  p_referred_id UUID,
  p_ip_fingerprint TEXT DEFAULT NULL,
  p_is_suspicious BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_round INTEGER;
  v_required_count INTEGER;
  v_new_count INTEGER;
  v_reward_granted BOOLEAN := false;
  v_referred_reward_granted BOOLEAN := false;
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_referred_balance_before INTEGER;
  v_referred_balance_after INTEGER;
BEGIN
  -- 1. 자기 추천 방지
  IF p_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'SELF_REFERRAL');
  END IF;

  -- 2. 중복 체크: referred_id가 이미 등록됨
  IF EXISTS (SELECT 1 FROM referral_signups WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_REFERRED');
  END IF;

  -- 3. 추천인이 실제 존재하는지 확인
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_referrer_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'REFERRER_NOT_FOUND');
  END IF;

  -- 4. 현재 진행 중인 회차 조회 (없으면 1회차 생성)
  SELECT round, required_count INTO v_current_round, v_required_count
  FROM share_rewards
  WHERE user_id = p_referrer_id AND achieved_at IS NULL
  ORDER BY round
  LIMIT 1;

  IF v_current_round IS NULL THEN
    v_current_round := 1;
    v_required_count := get_fibonacci(1);
    INSERT INTO share_rewards (user_id, round, required_count, current_count)
    VALUES (p_referrer_id, 1, v_required_count, 0);
  END IF;

  -- 5. referral_signups 기록 (의심 여부와 무관하게 항상 기록)
  INSERT INTO referral_signups (referrer_id, referred_id, reward_round, ip_fingerprint)
  VALUES (p_referrer_id, p_referred_id, v_current_round, p_ip_fingerprint);

  -- 6. 피추천인(User B)에게 30새싹 즉시 지급 (부정 의심이 아닌 경우)
  IF NOT p_is_suspicious THEN
    SELECT sprout_balance INTO v_referred_balance_before
    FROM users WHERE id = p_referred_id FOR UPDATE;

    UPDATE users SET sprout_balance = sprout_balance + 30
    WHERE id = p_referred_id;

    v_referred_balance_after := v_referred_balance_before + 30;

    INSERT INTO sprout_transactions (user_id, transaction_type, amount, balance_before, balance_after, description)
    VALUES (p_referred_id, 'reward', 30, v_referred_balance_before, v_referred_balance_after,
            '친구 추천 가입 보너스');

    v_referred_reward_granted := true;
  END IF;

  -- 7. 부정 의심 유저: 카운트/리워드 없이 조용히 성공 반환
  IF p_is_suspicious THEN
    SELECT current_count INTO v_new_count
    FROM share_rewards
    WHERE user_id = p_referrer_id AND round = v_current_round AND achieved_at IS NULL;

    RETURN jsonb_build_object(
      'success', true,
      'reward_granted', false,
      'referred_reward_granted', false,
      'current_round', v_current_round,
      'current_count', v_new_count,
      'required_count', v_required_count
    );
  END IF;

  -- 8. 정상 가입: 현재 회차 카운트 증가
  UPDATE share_rewards
  SET current_count = current_count + 1
  WHERE user_id = p_referrer_id AND round = v_current_round AND achieved_at IS NULL
  RETURNING current_count INTO v_new_count;

  -- 9. 회차 달성 체크
  IF v_new_count >= v_required_count THEN
    UPDATE share_rewards
    SET achieved_at = now()
    WHERE user_id = p_referrer_id AND round = v_current_round;

    SELECT sprout_balance INTO v_balance_before
    FROM users WHERE id = p_referrer_id FOR UPDATE;

    UPDATE users SET sprout_balance = sprout_balance + 30
    WHERE id = p_referrer_id;

    v_balance_after := v_balance_before + 30;

    INSERT INTO sprout_transactions (user_id, transaction_type, amount, balance_before, balance_after, description)
    VALUES (p_referrer_id, 'reward', 30, v_balance_before, v_balance_after,
            '공유 리워드 ' || v_current_round || '회차 달성');

    INSERT INTO share_rewards (user_id, round, required_count, current_count)
    VALUES (p_referrer_id, v_current_round + 1, get_fibonacci(v_current_round + 1), 0);

    v_reward_granted := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward_granted', v_reward_granted,
    'referred_reward_granted', v_referred_reward_granted,
    'current_round', v_current_round,
    'current_count', v_new_count,
    'required_count', v_required_count
  );
END;
$$;
