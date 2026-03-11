-- 기존 이용 기록을 user_category_interactions에 백필
-- 1. 유료 콘텐츠 (orders에서 completed/paid)
INSERT INTO user_category_interactions (user_id, content_id, category_main, category_sub, content_type, interacted_at)
SELECT DISTINCT ON (o.user_id, o.content_id)
  o.user_id,
  o.content_id,
  mc.category_main,
  mc.category_sub,
  'paid',
  o.created_at
FROM orders o
JOIN master_contents mc ON mc.id = o.content_id
JOIN auth.users au ON au.id = o.user_id
WHERE o.pstatus IN ('completed', 'paid')
  AND o.user_id IS NOT NULL
  AND mc.category_main IS NOT NULL
ORDER BY o.user_id, o.content_id, o.created_at DESC
ON CONFLICT (user_id, content_id) DO NOTHING;

-- 2. 무료 콘텐츠 (free_content_records)
INSERT INTO user_category_interactions (user_id, content_id, category_main, category_sub, content_type, interacted_at)
SELECT DISTINCT ON (f.user_id, f.content_id)
  f.user_id,
  f.content_id,
  mc.category_main,
  mc.category_sub,
  'free',
  f.created_at
FROM free_content_records f
JOIN master_contents mc ON mc.id = f.content_id
JOIN auth.users au ON au.id = f.user_id
WHERE f.user_id IS NOT NULL
  AND mc.category_main IS NOT NULL
ORDER BY f.user_id, f.content_id, f.created_at DESC
ON CONFLICT (user_id, content_id)
DO UPDATE SET interacted_at = GREATEST(user_category_interactions.interacted_at, EXCLUDED.interacted_at);
