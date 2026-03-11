-- 추천순 RPC: 로그인+이력 있으면 카테고리 점수 기반, 아니면 인기순 폴백
CREATE OR REPLACE FUNCTION get_recommended_contents(
  p_category TEXT DEFAULT '전체',
  p_content_type TEXT DEFAULT 'all',
  p_offset INT DEFAULT 0,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID, content_type TEXT, title TEXT, status TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  thumbnail_url TEXT, weekly_clicks INT, view_count INT,
  category_main TEXT, category_sub TEXT,
  price_original INT, price_discount INT, discount_rate INT,
  is_read BOOLEAN, total_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_has_history BOOLEAN := false;
BEGIN
  -- 이력 존재 확인
  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM user_category_interactions uci
      WHERE uci.user_id = v_user_id
      LIMIT 1
    ) INTO v_has_history;
  END IF;

  -- 비로그인 또는 이력 없음: 인기순 폴백 (get_home_contents와 동일)
  IF v_user_id IS NULL OR NOT v_has_history THEN
    RETURN QUERY
    WITH read_ids AS (
      SELECT DISTINCT o.content_id FROM orders o
      WHERE o.user_id = v_user_id AND o.pstatus IN ('completed', 'paid')
        AND v_user_id IS NOT NULL
      UNION
      SELECT DISTINCT f.content_id FROM free_content_records f
      WHERE f.user_id = v_user_id AND v_user_id IS NOT NULL
    )
    SELECT mc.id, mc.content_type, mc.title, mc.status,
      mc.created_at, mc.updated_at, mc.thumbnail_url,
      mc.weekly_clicks, mc.view_count, mc.category_main,
      mc.category_sub, mc.price_original, mc.price_discount,
      mc.discount_rate,
      (r.content_id IS NOT NULL) AS is_read,
      COUNT(*) OVER() AS total_count
    FROM master_contents mc
    LEFT JOIN read_ids r ON mc.id = r.content_id
    WHERE mc.status = 'deployed'
      AND (p_category = '전체' OR mc.category_main = p_category)
      AND (p_content_type = 'all' OR mc.content_type = p_content_type)
    ORDER BY
      (CASE WHEN r.content_id IS NOT NULL THEN 1 ELSE 0 END) ASC,
      mc.weekly_clicks DESC,
      mc.created_at DESC
    OFFSET p_offset LIMIT p_limit;
    RETURN;
  END IF;

  -- 로그인 + 이력 있음: 추천 로직
  RETURN QUERY
  WITH read_ids AS (
    SELECT DISTINCT o.content_id FROM orders o
    WHERE o.user_id = v_user_id AND o.pstatus IN ('completed', 'paid')
    UNION
    SELECT DISTINCT f.content_id FROM free_content_records f
    WHERE f.user_id = v_user_id
  ),
  main_scores AS (
    SELECT uci.category_main AS cat_main,
      SUM(exp(-0.01 * EXTRACT(EPOCH FROM (now() - uci.interacted_at)) / 86400.0)) AS score
    FROM user_category_interactions uci
    WHERE uci.user_id = v_user_id
      AND uci.interacted_at > now() - INTERVAL '365 days'
    GROUP BY uci.category_main
  ),
  sub_scores AS (
    SELECT uci.category_sub AS cat_sub,
      SUM(exp(-0.01 * EXTRACT(EPOCH FROM (now() - uci.interacted_at)) / 86400.0)) AS score
    FROM user_category_interactions uci
    WHERE uci.user_id = v_user_id
      AND uci.interacted_at > now() - INTERVAL '365 days'
      AND uci.category_sub IS NOT NULL
    GROUP BY uci.category_sub
  ),
  recent_upsell AS (
    SELECT DISTINCT mc2.recommended_paid_content_id AS upsell_id
    FROM user_category_interactions uci2
    JOIN master_contents mc2 ON mc2.id = uci2.content_id
    WHERE uci2.user_id = v_user_id
      AND uci2.content_type = 'free'
      AND uci2.interacted_at > now() - INTERVAL '90 days'
      AND mc2.recommended_paid_content_id IS NOT NULL
  )
  SELECT mc.id, mc.content_type, mc.title, mc.status,
    mc.created_at, mc.updated_at, mc.thumbnail_url,
    mc.weekly_clicks, mc.view_count, mc.category_main,
    mc.category_sub, mc.price_original, mc.price_discount,
    mc.discount_rate,
    (r.content_id IS NOT NULL) AS is_read,
    COUNT(*) OVER() AS total_count
  FROM master_contents mc
  LEFT JOIN read_ids r ON mc.id = r.content_id
  LEFT JOIN main_scores ms ON ms.cat_main = mc.category_main
  LEFT JOIN sub_scores ss ON ss.cat_sub = mc.category_sub
  LEFT JOIN recent_upsell ru ON ru.upsell_id = mc.id
  WHERE mc.status = 'deployed'
    AND (p_category = '전체' OR mc.category_main = p_category)
    AND (p_content_type = 'all' OR mc.content_type = p_content_type)
  ORDER BY
    (CASE WHEN r.content_id IS NOT NULL THEN 1 ELSE 0 END) ASC,
    COALESCE(ms.score, 0) DESC,
    COALESCE(ss.score, 0) DESC,
    (CASE WHEN ru.upsell_id IS NOT NULL THEN 1 ELSE 0 END) DESC,
    mc.weekly_clicks DESC,
    mc.created_at DESC
  OFFSET p_offset LIMIT p_limit;
END;
$$;
