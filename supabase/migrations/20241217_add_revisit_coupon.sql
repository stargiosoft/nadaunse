-- 재구매 쿠폰 추가 (이미 존재하면 무시)
INSERT INTO coupons (name, coupon_type, discount_amount, description, created_at)
SELECT 
  '재구매쿠폰',
  'revisit',
  3000,
  '운세 구매 고객 전용 쿠폰',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM coupons WHERE coupon_type = 'revisit'
);

-- 확인용 SELECT
SELECT * FROM coupons WHERE coupon_type = 'revisit';
