-- 미션 쿠폰 추가 (첫 주간 보고서 완료 시 발급, 12,900원)
-- 이미 존재하면 무시
INSERT INTO coupons (name, coupon_type, discount_amount, description, created_at)
SELECT
  '미션쿠폰',
  'mission',
  12900,
  '첫 주간 보고서 완료 미션 쿠폰',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM coupons WHERE coupon_type = 'mission'
);

-- 확인용 SELECT
SELECT * FROM coupons WHERE coupon_type = 'mission';
