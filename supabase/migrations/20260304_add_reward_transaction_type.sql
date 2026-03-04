-- ============================================================
-- sprout_transactions: 'reward' 거래 유형 추가
-- 2026-03-04
-- ============================================================
-- 공유 리워드 시스템(process_share_reward RPC)에서 transaction_type='reward' 사용
-- 기존 CHECK 제약조건에 'reward' 누락되어 INSERT 실패

ALTER TABLE sprout_transactions
  DROP CONSTRAINT IF EXISTS sprout_transactions_transaction_type_check;

ALTER TABLE sprout_transactions
  ADD CONSTRAINT sprout_transactions_transaction_type_check
  CHECK (transaction_type IN ('charge', 'deduct', 'refund', 'reward'));
