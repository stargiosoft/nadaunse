-- ============================================================
-- 마음톡 테이블 (3개) + RLS + 인덱스
-- ============================================================

-- 1. 일일 감정 체크인
CREATE TABLE mind_talk_emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion_score INTEGER NOT NULL CHECK (emotion_score BETWEEN 1 AND 5),
  emotion_label TEXT NOT NULL CHECK (emotion_label IN ('great', 'good', 'neutral', 'bad', 'terrible')),
  memo TEXT CHECK (char_length(memo) <= 100),
  checked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, checked_date)
);

-- 2. 대화 세션 (하루 1세션)
CREATE TABLE mind_talk_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  free_messages_used INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- 3. 개별 메시지
CREATE TABLE mind_talk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES mind_talk_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_mind_talk_emotions_user_date ON mind_talk_emotions(user_id, checked_date);
CREATE INDEX idx_mind_talk_conversations_user_date ON mind_talk_conversations(user_id, session_date);
CREATE INDEX idx_mind_talk_messages_conv ON mind_talk_messages(conversation_id, created_at);

-- ============================================================
-- RLS 정책
-- ============================================================

ALTER TABLE mind_talk_emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_talk_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_talk_messages ENABLE ROW LEVEL SECURITY;

-- mind_talk_emotions: 본인만 CRUD (체크인 직접 호출)
CREATE POLICY "emotions_select" ON mind_talk_emotions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emotions_insert" ON mind_talk_emotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "emotions_update" ON mind_talk_emotions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "emotions_delete" ON mind_talk_emotions FOR DELETE USING (auth.uid() = user_id);

-- mind_talk_conversations: 본인만 SELECT (INSERT/UPDATE는 Edge Function에서 service_role)
CREATE POLICY "conv_select" ON mind_talk_conversations FOR SELECT USING (auth.uid() = user_id);

-- mind_talk_messages: 본인만 SELECT (INSERT는 Edge Function에서 service_role)
CREATE POLICY "msg_select" ON mind_talk_messages FOR SELECT USING (auth.uid() = user_id);
