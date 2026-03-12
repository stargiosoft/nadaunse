-- 바이럴 사주 테스트 플랫폼 (운테) 스키마
-- 2026-03-12

-- 1. viral_tests (테스트 메타데이터)
CREATE TABLE viral_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  template_type text NOT NULL CHECK (template_type IN ('slot_machine', 'compatibility', 'adult')),
  title text NOT NULL,
  description text,
  idea_input text NOT NULL,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'review', 'live', 'archived', 'failed')),
  is_adult boolean NOT NULL DEFAULT false,
  view_count integer DEFAULT 0,
  play_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  slug text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- 2. viral_test_results (10개 일간별 결과)
CREATE TABLE viral_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES viral_tests(id) ON DELETE CASCADE,
  day_master text NOT NULL CHECK (day_master IN ('갑','을','병','정','무','기','경','신','임','계')),
  element text NOT NULL CHECK (element IN ('목','화','토','금','수')),
  result_title text NOT NULL,
  result_description text NOT NULL,
  result_image_url text,
  score integer,
  share_image_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_id, day_master)
);

-- 3. viral_test_plays (플레이 기록)
CREATE TABLE viral_test_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES viral_tests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  result_id uuid NOT NULL REFERENCES viral_test_results(id),
  fingerprint text,
  partner_day_master text,
  created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_viral_tests_status_published ON viral_tests (status, published_at DESC);
CREATE INDEX idx_viral_test_results_test_day ON viral_test_results (test_id, day_master);
CREATE INDEX idx_viral_test_plays_fingerprint ON viral_test_plays (fingerprint, test_id);

-- RLS 활성화
ALTER TABLE viral_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_test_plays ENABLE ROW LEVEL SECURITY;

-- RLS 정책: viral_tests
CREATE POLICY "live 테스트 공개 읽기" ON viral_tests
  FOR SELECT USING (status = 'live');

CREATE POLICY "본인 테스트 전체 읽기" ON viral_tests
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "로그인 사용자 테스트 생성" ON viral_tests
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "본인 테스트 수정" ON viral_tests
  FOR UPDATE USING (auth.uid() = creator_id);

-- RLS 정책: viral_test_results
CREATE POLICY "결과 공개 읽기" ON viral_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM viral_tests
      WHERE viral_tests.id = viral_test_results.test_id
      AND viral_tests.status = 'live'
    )
  );

CREATE POLICY "본인 테스트 결과 읽기" ON viral_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM viral_tests
      WHERE viral_tests.id = viral_test_results.test_id
      AND viral_tests.creator_id = auth.uid()
    )
  );

-- RLS 정책: viral_test_plays
CREATE POLICY "플레이 누구나 삽입" ON viral_test_plays
  FOR INSERT WITH CHECK (true);

CREATE POLICY "본인 플레이 읽기" ON viral_test_plays
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Service role bypass (Edge Functions에서 사용)
CREATE POLICY "service_role_viral_tests" ON viral_tests
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "service_role_viral_test_results" ON viral_test_results
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "service_role_viral_test_plays" ON viral_test_plays
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
