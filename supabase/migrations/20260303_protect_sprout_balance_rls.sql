-- ============================================================
-- 보안 패치: users 테이블 sprout_balance 직접 수정 차단
-- ============================================================
-- 문제: users 테이블이 RLS disabled (UNRESTRICTED) 상태에서
--       브라우저 콘솔로 sprout_balance를 임의 값으로 변경 가능
-- 해결: BEFORE UPDATE 트리거로 authenticated/anon 역할의 직접 수정 차단
--       (Edge Function의 SECURITY DEFINER RPC는 current_user='postgres'로
--        실행되므로 정상 작동)
-- ============================================================

-- 트리거 함수
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

-- 트리거 생성
CREATE TRIGGER protect_sprout_balance_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION protect_sprout_balance();
