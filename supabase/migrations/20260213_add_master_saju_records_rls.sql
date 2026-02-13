-- Master 계정이 saju_records 전체 조회 가능하도록 RLS 정책 추가
-- 고객 통계 대시보드에서 사주 데이터 기반 고객 인사이트 제공

CREATE POLICY "Master can view all saju records"
ON saju_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'master'
  )
);
