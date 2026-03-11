-- 추천순 정렬을 위한 사용자 카테고리 이용 기록 테이블
CREATE TABLE user_category_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES master_contents(id) ON DELETE CASCADE,
  category_main TEXT NOT NULL,
  category_sub TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('free', 'paid')),
  interacted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_uci_user_created ON user_category_interactions(user_id, interacted_at DESC);
CREATE INDEX idx_uci_user_main ON user_category_interactions(user_id, category_main);
CREATE UNIQUE INDEX idx_uci_user_content ON user_category_interactions(user_id, content_id);

-- RLS: SELECT만 허용 (INSERT/UPDATE는 SECURITY DEFINER 트리거가 담당)
ALTER TABLE user_category_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON user_category_interactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
