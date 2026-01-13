-- 쿠폰 마스터 데이터 초기화
-- 작성일: 2024-12-17

-- 기존 쿠폰 데이터 삭제 (개발 환경용)
-- 운영 환경에서는 주석 처리하세요
DELETE FROM user_coupons;
DELETE FROM coupons;

-- 쿠폰 마스터 데이터 INSERT
INSERT INTO coupons (name, coupon_type, discount_amount, description, is_active)
VALUES 
  ('가입축하쿠폰', 'amount', 5000, '회원가입 시 자동 발급', true),
  ('재구매쿠폰', 'amount', 3000, '콘텐츠 완료 후 다운로드', true);

-- 확인 쿼리
SELECT * FROM coupons ORDER BY discount_amount DESC;
