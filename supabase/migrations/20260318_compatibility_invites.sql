-- 궁합 시뮬레이션 초대 테이블
-- 비회원도 사용 가능 (RLS 불필요, Edge Function 서비스 역할로만 접근)
CREATE TABLE IF NOT EXISTS public.compatibility_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_code text UNIQUE NOT NULL,
  category text NOT NULL,
  inviter_prediction jsonb NOT NULL,
  inviter_gap jsonb,
  invitee_prediction jsonb,
  compatibility_result jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL
);

-- match_code 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_compatibility_invites_match_code
  ON public.compatibility_invites (match_code);

-- 만료된 초대 정리용 인덱스
CREATE INDEX IF NOT EXISTS idx_compatibility_invites_expires_at
  ON public.compatibility_invites (expires_at);
