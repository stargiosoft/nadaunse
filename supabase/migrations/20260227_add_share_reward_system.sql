-- ============================================================
-- 공유 리워드 시스템 마이그레이션
-- 2026-02-27
-- ============================================================

-- 1. users 테이블에 referral_code + is_suspicious_referral 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspicious_referral BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.is_suspicious_referral IS '부정 레퍼럴 가입 의심 유저 (동일 IP+UA fingerprint 3건 이상)';

-- 2. 기존 사용자에게 레퍼럴 코드 일괄 생성
-- 형식: NDS-{랜덤6자} (영문 대소문자 + 숫자)
UPDATE users
SET referral_code = 'NDS-' || substr(
  replace(replace(replace(
    encode(gen_random_bytes(6), 'base64'),
    '+', ''), '/', ''), '=', ''),
  1, 6)
WHERE referral_code IS NULL;

-- 3. referral_signups 테이블 (레퍼럴 가입 기록)
CREATE TABLE IF NOT EXISTS referral_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_round INTEGER NOT NULL,
  ip_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_referred UNIQUE (referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON referral_signups(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_round ON referral_signups(referrer_id, reward_round);
CREATE INDEX IF NOT EXISTS idx_referral_signups_fingerprint ON referral_signups(ip_fingerprint);

-- 4. share_rewards 테이블 (리워드 회차 기록)
CREATE TABLE IF NOT EXISTS share_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  required_count INTEGER NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0,
  sprout_amount INTEGER NOT NULL DEFAULT 30,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_round UNIQUE (user_id, round)
);

CREATE INDEX IF NOT EXISTS idx_share_rewards_user ON share_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_share_rewards_active ON share_rewards(user_id) WHERE achieved_at IS NULL;

-- 5. RLS 정책
ALTER TABLE referral_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral signups"
  ON referral_signups FOR SELECT
  USING (referrer_id = auth.uid());

CREATE POLICY "Users can view own share rewards"
  ON share_rewards FOR SELECT
  USING (user_id = auth.uid());

-- 6. 피보나치 계산 함수
CREATE OR REPLACE FUNCTION get_fibonacci(n INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  a INTEGER := 1;
  b INTEGER := 1;
  temp INTEGER;
  i INTEGER;
BEGIN
  IF n <= 0 THEN RETURN 0; END IF;
  IF n <= 2 THEN RETURN 1; END IF;
  FOR i IN 3..n LOOP
    temp := b;
    b := a + b;
    a := temp;
  END LOOP;
  RETURN b;
END;
$$;

-- 7. 리워드 처리 RPC 함수 (SECURITY DEFINER)
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
  v_balance_before INTEGER;
  v_balance_after INTEGER;
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

  -- 6. 부정 의심 유저: 카운트/리워드 없이 조용히 성공 반환
  --    (Edge Function에서 fingerprint 체크 → users.is_suspicious_referral 설정 후 전달)
  IF p_is_suspicious THEN
    SELECT current_count INTO v_new_count
    FROM share_rewards
    WHERE user_id = p_referrer_id AND round = v_current_round AND achieved_at IS NULL;

    RETURN jsonb_build_object(
      'success', true,
      'reward_granted', false,
      'current_round', v_current_round,
      'current_count', v_new_count,
      'required_count', v_required_count
    );
  END IF;

  -- 7. 정상 가입: 현재 회차 카운트 증가
  UPDATE share_rewards
  SET current_count = current_count + 1
  WHERE user_id = p_referrer_id AND round = v_current_round AND achieved_at IS NULL
  RETURNING current_count INTO v_new_count;

  -- 8. 회차 달성 체크
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
    'current_round', v_current_round,
    'current_count', v_new_count,
    'required_count', v_required_count
  );
END;
$$;
