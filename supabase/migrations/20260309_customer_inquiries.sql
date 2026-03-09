-- 고객 문의 테이블
CREATE TABLE customer_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'bug', 'payment', 'suggestion', 'other')),
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
  reply text,
  replied_at timestamptz,
  replied_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_customer_inquiries_user_id ON customer_inquiries(user_id);
CREATE INDEX idx_customer_inquiries_status ON customer_inquiries(status);
CREATE INDEX idx_customer_inquiries_created_at ON customer_inquiries(created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_customer_inquiries_updated_at
  BEFORE UPDATE ON customer_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

-- 사용자: 자기 문의만 조회
CREATE POLICY "Users can view own inquiries" ON customer_inquiries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 사용자: 자기 문의 작성
CREATE POLICY "Users can insert own inquiries" ON customer_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 마스터: 전체 문의 조회
CREATE POLICY "Master can view all inquiries" ON customer_inquiries
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'master')
  );

-- 마스터: 문의 답변 (업데이트)
CREATE POLICY "Master can update all inquiries" ON customer_inquiries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'master')
  );
