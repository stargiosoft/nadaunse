CREATE OR REPLACE FUNCTION get_home_contents(
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
BEGIN
  RETURN QUERY
  WITH read_ids AS (
    SELECT DISTINCT o.content_id FROM orders o
    WHERE o.user_id = v_user_id AND o.pstatus = 'completed'
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
END;
$$;
