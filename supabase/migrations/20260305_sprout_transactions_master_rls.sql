-- 관리자(master)가 sprout_transactions 전체 조회 가능하도록 RLS 정책 추가
-- 통계 대시보드에서 새싹 충전 기준 매출/주문 통계 조회에 필요
CREATE POLICY "Masters can view all sprout transactions"
  ON sprout_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );
