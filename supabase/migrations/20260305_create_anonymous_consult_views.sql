-- 비회원 사주/타로 상담 체험 1회 제한 테이블
-- fingerprint(IP+UA SHA-256)당 최초 1회만 허용 (사주+타로 통합)
-- RLS 불필요 (Edge Function Service Role Key 전용)
-- cron 정리 없음 (영구 보관)

CREATE TABLE anonymous_consult_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint text NOT NULL,
    consult_type text NOT NULL,  -- 'saju' | 'taro'
    created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX ON anonymous_consult_views (fingerprint);
