-- 1. 유료 콘텐츠 주문 완료 시 카테고리 이용 기록 자동 저장
CREATE OR REPLACE FUNCTION log_order_category_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cat_main TEXT;
  v_cat_sub TEXT;
BEGIN
  -- pstatus가 completed 또는 paid일 때만 기록
  IF NEW.pstatus NOT IN ('completed', 'paid') THEN
    RETURN NEW;
  END IF;

  -- master_contents에서 카테고리 조회
  SELECT mc.category_main, mc.category_sub
    INTO v_cat_main, v_cat_sub
    FROM master_contents mc
   WHERE mc.id = NEW.content_id;

  IF v_cat_main IS NULL THEN
    RETURN NEW;
  END IF;

  -- UPSERT: 같은 콘텐츠 재이용 시 interacted_at만 갱신
  INSERT INTO user_category_interactions (user_id, content_id, category_main, category_sub, content_type, interacted_at)
  VALUES (NEW.user_id, NEW.content_id, v_cat_main, v_cat_sub, 'paid', now())
  ON CONFLICT (user_id, content_id)
  DO UPDATE SET interacted_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_order_interaction
  AFTER INSERT OR UPDATE OF pstatus ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_category_interaction();

-- 2. 무료 콘텐츠 이용 시 카테고리 이용 기록 자동 저장
CREATE OR REPLACE FUNCTION log_free_content_category_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cat_main TEXT;
  v_cat_sub TEXT;
BEGIN
  -- master_contents에서 카테고리 조회
  SELECT mc.category_main, mc.category_sub
    INTO v_cat_main, v_cat_sub
    FROM master_contents mc
   WHERE mc.id = NEW.content_id;

  IF v_cat_main IS NULL THEN
    RETURN NEW;
  END IF;

  -- UPSERT: 같은 콘텐츠 재이용 시 interacted_at만 갱신
  INSERT INTO user_category_interactions (user_id, content_id, category_main, category_sub, content_type, interacted_at)
  VALUES (NEW.user_id, NEW.content_id, v_cat_main, v_cat_sub, 'free', now())
  ON CONFLICT (user_id, content_id)
  DO UPDATE SET interacted_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_free_content_interaction
  AFTER INSERT ON free_content_records
  FOR EACH ROW
  EXECUTE FUNCTION log_free_content_category_interaction();
