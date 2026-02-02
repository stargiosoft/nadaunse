-- Master 계정용 RLS 정책 추가
-- 통계 대시보드에서 전체 데이터 조회 가능하도록

-- 1. orders 테이블: Master가 전체 주문 조회 가능
CREATE POLICY "Master can view all orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'master'
  )
);

-- 2. free_content_records 테이블: Master가 전체 무료 콘텐츠 기록 조회 가능
CREATE POLICY "Master can view all free content records"
ON free_content_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'master'
  )
);

-- 3. user_trait_tags 테이블: Master가 전체 태그 조회 가능
CREATE POLICY "Master can view all user trait tags"
ON user_trait_tags
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'master'
  )
);
