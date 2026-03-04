-- ============================================================
-- 보안 패치: 새싹(sprout) 잔고 조작 방지
-- ============================================================
-- 취약점 1: users 테이블이 RLS disabled 상태에서
--           supabase.from('users').update({ sprout_balance: 999999 }) 가능
-- 취약점 2: SECURITY DEFINER RPC 함수를 클라이언트에서 직접 호출하여
--           Edge Function의 결제 검증을 우회 가능
-- ============================================================

-- [패치 1] 트리거: sprout_balance 직접 수정 차단
-- Edge Function의 SECURITY DEFINER RPC는 current_user='postgres'로 실행되므로 통과
CREATE OR REPLACE FUNCTION protect_sprout_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sprout_balance IS DISTINCT FROM OLD.sprout_balance
     AND current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'sprout_balance cannot be modified directly';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_sprout_balance_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION protect_sprout_balance();

-- [패치 2] RPC 함수 직접 호출 차단
-- Edge Function은 service_role 키로 호출하므로 영향 없음
REVOKE EXECUTE ON FUNCTION process_sprout_charge FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION process_sprout_deduct FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION process_payment_complete FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION process_refund FROM PUBLIC, authenticated, anon;
REVOKE EXECUTE ON FUNCTION process_share_reward FROM PUBLIC, authenticated, anon;
