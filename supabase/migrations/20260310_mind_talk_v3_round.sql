-- mind_talk_conversations에 round 컬럼 추가
-- 새로고침 시 새 라운드 시작, 모드 전환 시 같은 라운드 유지

ALTER TABLE mind_talk_conversations ADD COLUMN round INTEGER NOT NULL DEFAULT 1;

-- 기존 UNIQUE 제약 제거 후 round 포함 재생성
ALTER TABLE mind_talk_conversations DROP CONSTRAINT IF EXISTS mind_talk_conversations_user_id_session_date_mode_key;
ALTER TABLE mind_talk_conversations ADD CONSTRAINT mind_talk_conversations_user_date_mode_round_key UNIQUE (user_id, session_date, mode, round);

-- 인덱스 업데이트
DROP INDEX IF EXISTS idx_mind_talk_conversations_user_date_mode;
CREATE INDEX idx_mind_talk_conversations_user_date_mode_round ON mind_talk_conversations(user_id, session_date, mode, round);
