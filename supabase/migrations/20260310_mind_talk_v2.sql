-- ============================================================
-- 마음톡 v2: 모드 시스템 (일반/사주/타로)
-- ============================================================

-- 1. mode 컬럼 추가
ALTER TABLE mind_talk_conversations
ADD COLUMN mode TEXT NOT NULL DEFAULT 'general'
CHECK (mode IN ('general', 'saju', 'tarot'));

-- 2. 기존 UNIQUE 제약 삭제 후 mode 포함 새 제약 생성
ALTER TABLE mind_talk_conversations
DROP CONSTRAINT mind_talk_conversations_user_id_session_date_key;

ALTER TABLE mind_talk_conversations
ADD CONSTRAINT mind_talk_conversations_user_id_session_date_mode_key
UNIQUE (user_id, session_date, mode);

-- 3. 인덱스 업데이트
DROP INDEX IF EXISTS idx_mind_talk_conversations_user_date;
CREATE INDEX idx_mind_talk_conversations_user_date_mode
ON mind_talk_conversations(user_id, session_date, mode);
