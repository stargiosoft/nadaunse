-- 스테이징 스키마를 프로덕션 기준으로 되돌리기
-- 최근 잘못 수정된 content_id NOT NULL, refund_amount DEFAULT 0 제거

BEGIN;

-- 1. orders.content_id를 nullable로 변경 (프로덕션과 동일)
ALTER TABLE orders
  ALTER COLUMN content_id DROP NOT NULL;

-- 2. orders.refund_amount의 DEFAULT 제거 (프로덕션과 동일)
ALTER TABLE orders
  ALTER COLUMN refund_amount DROP DEFAULT;

COMMIT;
