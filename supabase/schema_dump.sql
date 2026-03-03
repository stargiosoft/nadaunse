


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_zodiac"("birth_date" timestamp with time zone) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  year_val integer;
  zodiac_arr text[] := ARRAY['원숭이띠', '닭띠', '개띠', '돼지띠', '쥐띠', '소띠', '호랑이띠', '토끼띠', '용띠', '뱀띠', '말띠', '양띠'];
BEGIN
  year_val := EXTRACT(YEAR FROM birth_date)::integer;
  RETURN zodiac_arr[(year_val % 12) + 1];
END;
$$;


ALTER FUNCTION "public"."calculate_zodiac"("birth_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fill_gname_from_content"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- content_id가 있으면 title을 gname에 복사
  IF NEW.content_id IS NOT NULL THEN
    SELECT title INTO NEW.gname
    FROM master_contents
    WHERE id = NEW.content_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fill_gname_from_content"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, provider, provider_id, email, nickname, sprout_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google'),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    20
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_payment_complete"("p_user_id" "uuid", "p_content_id" "uuid", "p_paid_amount" integer, "p_pay_method" "text", "p_imp_uid" "text", "p_merchant_uid" "text", "p_pg_provider" "text", "p_user_coupon_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order_id UUID;
  v_coupon_discount INTEGER := 0;
  v_result JSON;
BEGIN
  -- 1. 쿠폰 사용 처리 (있는 경우)
  IF p_user_coupon_id IS NOT NULL THEN
    -- 쿠폰 유효성 검증
    SELECT c.discount_amount INTO v_coupon_discount
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    WHERE uc.id = p_user_coupon_id
      AND uc.user_id = p_user_id
      AND uc.is_used = FALSE
      AND (uc.expired_at IS NULL OR uc.expired_at > NOW());
    
    IF v_coupon_discount IS NULL THEN
      RAISE EXCEPTION 'COUPON_INVALID: 유효하지 않은 쿠폰입니다';
    END IF;
  END IF;

  -- 2. 주문 생성
  INSERT INTO orders (
    user_id,
    content_id,
    paid_amount,
    pay_method,
    imp_uid,
    merchant_uid,
    pg_provider,
    pstatus,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_content_id,
    p_paid_amount,
    p_pay_method,
    p_imp_uid,
    p_merchant_uid,
    p_pg_provider,
    'completed',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- 3. 쿠폰 사용 처리 (주문 생성 후)
  IF p_user_coupon_id IS NOT NULL THEN
    UPDATE user_coupons
    SET 
      is_used = TRUE,
      used_at = NOW(),
      used_order_id = v_order_id
    WHERE id = p_user_coupon_id
      AND user_id = p_user_id
      AND is_used = FALSE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'COUPON_UPDATE_FAILED: 쿠폰 사용 처리 실패';
    END IF;
  END IF;

  -- 4. 결과 반환
  v_result := json_build_object(
    'success', TRUE,
    'order_id', v_order_id,
    'coupon_discount', v_coupon_discount
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- 트랜잭션 롤백 (자동)
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."process_payment_complete"("p_user_id" "uuid", "p_content_id" "uuid", "p_paid_amount" integer, "p_pay_method" "text", "p_imp_uid" "text", "p_merchant_uid" "text", "p_pg_provider" "text", "p_user_coupon_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_payment_complete"("p_user_id" "uuid", "p_content_id" "uuid", "p_paid_amount" integer, "p_pay_method" "text", "p_imp_uid" "text", "p_merchant_uid" "text", "p_pg_provider" "text", "p_user_coupon_id" "uuid") IS '결제 완료 처리 - 주문 생성 및 쿠폰 사용을 단일 트랜잭션으로 처리';



CREATE OR REPLACE FUNCTION "public"."process_refund"("p_order_id" "uuid", "p_user_id" "uuid", "p_refund_amount" integer, "p_refund_reason" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order RECORD;
  v_user_coupon_id UUID;
  v_result JSON;
BEGIN
  -- 1. 주문 조회 및 검증
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: 주문을 찾을 수 없습니다';
  END IF;
  
  IF v_order.pstatus = 'refunded' THEN
    RAISE EXCEPTION 'ALREADY_REFUNDED: 이미 환불 처리된 주문입니다';
  END IF;
  
  IF v_order.pstatus != 'completed' THEN
    RAISE EXCEPTION 'INVALID_STATUS: 완료된 주문만 환불할 수 있습니다';
  END IF;

  -- 2. 주문 상태 업데이트
  UPDATE orders
  SET 
    pstatus = 'refunded',
    refund_amount = p_refund_amount,
    refund_reason = p_refund_reason,
    refunded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- 3. 사용된 쿠폰 복원 (있는 경우)
  SELECT id INTO v_user_coupon_id
  FROM user_coupons
  WHERE used_order_id = p_order_id;
  
  IF v_user_coupon_id IS NOT NULL THEN
    UPDATE user_coupons
    SET 
      is_used = FALSE,
      used_at = NULL,
      used_order_id = NULL
    WHERE id = v_user_coupon_id;
  END IF;

  -- 4. 결과 반환
  v_result := json_build_object(
    'success', TRUE,
    'order_id', p_order_id,
    'refund_amount', p_refund_amount,
    'coupon_restored', v_user_coupon_id IS NOT NULL
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."process_refund"("p_order_id" "uuid", "p_user_id" "uuid", "p_refund_amount" integer, "p_refund_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_refund"("p_order_id" "uuid", "p_user_id" "uuid", "p_refund_amount" integer, "p_refund_reason" "text") IS '환불 처리 - 주문 상태 업데이트 및 쿠폰 복원을 단일 트랜잭션으로 처리';



CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alimtalk_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "order_id" "uuid",
    "phone_number" "text" NOT NULL,
    "template_code" "text" NOT NULL,
    "message_content" "text",
    "variables" "jsonb",
    "status" "text" NOT NULL,
    "error_code" "text",
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."alimtalk_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "discount_amount" integer NOT NULL,
    "coupon_type" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_content_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid",
    "question_order" integer NOT NULL,
    "question_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "question_type" "text" DEFAULT 'saju'::"text",
    "preview_text" "text",
    CONSTRAINT "chk_question_type" CHECK (("question_type" = ANY (ARRAY['saju'::"text", 'tarot'::"text"])))
);


ALTER TABLE "public"."master_content_questions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."master_content_questions"."question_type" IS '질문 유형: saju(사주) | tarot(타로)';



COMMENT ON COLUMN "public"."master_content_questions"."preview_text" IS 'AI 생성 미리보기 답변';



CREATE TABLE IF NOT EXISTS "public"."master_contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_type" "text" NOT NULL,
    "category_main" "text" NOT NULL,
    "category_sub" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "user_concern" "text",
    "price_original" integer,
    "price_discount" integer,
    "discount_rate" integer,
    "thumbnail_url" "text",
    "view_count" integer DEFAULT 0,
    "weekly_clicks" integer DEFAULT 0,
    "status" "text" DEFAULT 'loading'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    "questioner_info" "text",
    CONSTRAINT "master_contents_content_type_check" CHECK (("content_type" = ANY (ARRAY['free'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."master_contents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."master_contents"."questioner_info" IS '질문자 정보 (사주/타로 API 호출 시 {질문자 정보} 변수로 사용)';



CREATE TABLE IF NOT EXISTS "public"."order_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "question_order" integer NOT NULL,
    "question_text" "text",
    "gpt_response" "text",
    "tarot_card_name" "text",
    "tarot_card_image_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "question_type" "text",
    "model_used" "text",
    "tarot_user_viewed" boolean DEFAULT false
);


ALTER TABLE "public"."order_results" OWNER TO "postgres";


COMMENT ON COLUMN "public"."order_results"."tarot_user_viewed" IS '사용자가 타로 카드 뽑기 화면을 완료했는지 여부 (true면 다음 접근 시 바로 결과 페이지로 이동)';



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "saju_record_id" "uuid",
    "gname" "text",
    "full_name" "text",
    "gender" "text",
    "birth_date" timestamp with time zone,
    "birth_time" "text",
    "imp_uid" "text",
    "merchant_uid" "text" NOT NULL,
    "paid_amount" integer NOT NULL,
    "pay_method" "text",
    "pg_provider" "text",
    "pg_type" "text",
    "pstatus" "text" DEFAULT 'pending'::"text",
    "success" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content_id" "uuid",
    "ai_generation_completed" boolean DEFAULT false,
    "ai_generation_started_at" timestamp with time zone,
    "webhook_verified_at" timestamp with time zone,
    "refund_amount" integer,
    "refund_reason" "text",
    "refunded_at" timestamp with time zone
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."webhook_verified_at" IS '결제 웹훅을 통해 결제가 검증된 시점';



COMMENT ON COLUMN "public"."orders"."refund_amount" IS '환불 금액';



COMMENT ON COLUMN "public"."orders"."refund_reason" IS '환불 사유';



COMMENT ON COLUMN "public"."orders"."refunded_at" IS '환불 처리 시점';



CREATE TABLE IF NOT EXISTS "public"."saju_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "gender" "text" NOT NULL,
    "birth_date" timestamp with time zone NOT NULL,
    "birth_time" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone_number" "text",
    "calendar_type" "text" DEFAULT 'solar'::"text",
    "zodiac" "text",
    "is_primary" boolean DEFAULT false
);


ALTER TABLE "public"."saju_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."saju_records" IS '사주(사주명식) 정보 입력 기록';



COMMENT ON COLUMN "public"."saju_records"."id" IS 'Primary key';



COMMENT ON COLUMN "public"."saju_records"."calendar_type" IS '양력/음력 구분: solar(양력), lunar(음력)';



COMMENT ON COLUMN "public"."saju_records"."zodiac" IS '띠 정보: 쥐띠, 소띠, 호랑이띠, 토끼띠, 용띠, 뱀띠, 말띠, 양띠, 원숭이띠, 닭띠, 개띠, 돼지띠';



CREATE TABLE IF NOT EXISTS "public"."user_coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "is_used" boolean DEFAULT false,
    "used_at" timestamp with time zone,
    "used_order_id" "uuid",
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "expired_at" timestamp with time zone,
    "source_order_id" "uuid"
);


ALTER TABLE "public"."user_coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "provider_id" "text" NOT NULL,
    "email" "text",
    "nickname" "text",
    "profile_image" "text",
    "terms_agreed" boolean DEFAULT false,
    "privacy_agreed" boolean DEFAULT false,
    "marketing_agreed" boolean DEFAULT false,
    "ads_agreed" boolean DEFAULT false,
    "terms_agreed_at" timestamp with time zone,
    "last_login_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text",
    "visit_count" integer DEFAULT 1,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['master'::"text", 'admin'::"text", 'user'::"text"])))
);

ALTER TABLE ONLY "public"."users" REPLICA IDENTITY FULL;


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."alimtalk_logs"
    ADD CONSTRAINT "alimtalk_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_content_questions"
    ADD CONSTRAINT "master_content_questions_content_id_question_order_key" UNIQUE ("content_id", "question_order");



ALTER TABLE ONLY "public"."master_content_questions"
    ADD CONSTRAINT "master_content_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_contents"
    ADD CONSTRAINT "master_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_results"
    ADD CONSTRAINT "order_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_imp_uid_key" UNIQUE ("imp_uid");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_merchant_uid_key" UNIQUE ("merchant_uid");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saju_records"
    ADD CONSTRAINT "saju_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_alimtalk_logs_created_at" ON "public"."alimtalk_logs" USING "btree" ("created_at");



CREATE INDEX "idx_alimtalk_logs_order_id" ON "public"."alimtalk_logs" USING "btree" ("order_id");



CREATE INDEX "idx_alimtalk_logs_status" ON "public"."alimtalk_logs" USING "btree" ("status");



CREATE INDEX "idx_alimtalk_logs_user_id" ON "public"."alimtalk_logs" USING "btree" ("user_id");



CREATE INDEX "idx_content_id" ON "public"."master_content_questions" USING "btree" ("content_id");



CREATE INDEX "idx_content_type" ON "public"."master_contents" USING "btree" ("content_type");



CREATE INDEX "idx_created_at" ON "public"."master_contents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_master_contents_category" ON "public"."master_contents" USING "btree" ("category_main");



CREATE INDEX "idx_master_contents_created" ON "public"."master_contents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_master_contents_popularity" ON "public"."master_contents" USING "btree" ("weekly_clicks" DESC);



CREATE INDEX "idx_master_contents_status" ON "public"."master_contents" USING "btree" ("status");



CREATE INDEX "idx_master_contents_type" ON "public"."master_contents" USING "btree" ("content_type");



CREATE INDEX "idx_order_results_order_id" ON "public"."order_results" USING "btree" ("order_id");



CREATE INDEX "idx_order_results_status" ON "public"."order_results" USING "btree" ("status");



CREATE INDEX "idx_orders_ai_generation_completed" ON "public"."orders" USING "btree" ("ai_generation_completed");



CREATE INDEX "idx_orders_content_id" ON "public"."orders" USING "btree" ("content_id") WHERE ("content_id" IS NOT NULL);



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_imp_uid" ON "public"."orders" USING "btree" ("imp_uid");



CREATE INDEX "idx_orders_merchant_uid" ON "public"."orders" USING "btree" ("merchant_uid");



CREATE INDEX "idx_orders_saju_record_id" ON "public"."orders" USING "btree" ("saju_record_id");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_question_order" ON "public"."master_content_questions" USING "btree" ("content_id", "question_order");



CREATE INDEX "idx_questions_content" ON "public"."master_content_questions" USING "btree" ("content_id");



CREATE INDEX "idx_saju_records_calendar_type" ON "public"."saju_records" USING "btree" ("calendar_type");



CREATE INDEX "idx_saju_records_phone_number" ON "public"."saju_records" USING "btree" ("phone_number");



CREATE INDEX "idx_saju_records_zodiac" ON "public"."saju_records" USING "btree" ("zodiac");



CREATE INDEX "idx_status" ON "public"."master_contents" USING "btree" ("status");



CREATE INDEX "idx_user_coupons_is_used" ON "public"."user_coupons" USING "btree" ("is_used");



CREATE INDEX "idx_user_coupons_source_order" ON "public"."user_coupons" USING "btree" ("user_id", "coupon_id", "source_order_id");



CREATE INDEX "idx_user_coupons_user_id" ON "public"."user_coupons" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_fill_gname" BEFORE INSERT OR UPDATE OF "content_id" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."fill_gname_from_content"();



CREATE OR REPLACE TRIGGER "update_master_contents_updated_at" BEFORE UPDATE ON "public"."master_contents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_order_results_updated_at" BEFORE UPDATE ON "public"."order_results" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_questions_updated_at" BEFORE UPDATE ON "public"."master_content_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."alimtalk_logs"
    ADD CONSTRAINT "alimtalk_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."alimtalk_logs"
    ADD CONSTRAINT "alimtalk_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."master_content_questions"
    ADD CONSTRAINT "master_content_questions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."master_contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_results"
    ADD CONSTRAINT "order_results_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_results"
    ADD CONSTRAINT "order_results_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."master_content_questions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."master_contents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_saju_record_id_fkey" FOREIGN KEY ("saju_record_id") REFERENCES "public"."saju_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."saju_records"
    ADD CONSTRAINT "saju_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_source_order_id_fkey" FOREIGN KEY ("source_order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_used_order_id_fkey" FOREIGN KEY ("used_order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_coupons"
    ADD CONSTRAINT "user_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view coupons" ON "public"."coupons" FOR SELECT USING (true);



CREATE POLICY "Anyone can view master contents" ON "public"."master_contents" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can view questions" ON "public"."master_content_questions" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can insert orders" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Master can manage questions" ON "public"."master_content_questions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'master'::"text")))));



CREATE POLICY "Service role can insert orders" ON "public"."orders" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert users" ON "public"."users" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage master contents" ON "public"."master_contents" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage saju records" ON "public"."saju_records" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can update orders" ON "public"."orders" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System can insert alimtalk_logs" ON "public"."alimtalk_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert user_coupons" ON "public"."user_coupons" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage order_results" ON "public"."order_results" USING (true);



CREATE POLICY "Users can delete their own saju records" ON "public"."saju_records" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own saju records" ON "public"."saju_records" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own coupons" ON "public"."user_coupons" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own data" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own orders" ON "public"."orders" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own saju records" ON "public"."saju_records" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own alimtalk_logs" ON "public"."alimtalk_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own coupons" ON "public"."user_coupons" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own data" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view own order_results" ON "public"."order_results" FOR SELECT USING (("auth"."uid"() = ( SELECT "orders"."user_id"
   FROM "public"."orders"
  WHERE ("orders"."id" = "order_results"."order_id"))));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own saju records" ON "public"."saju_records" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."alimtalk_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saju_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_coupons" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_zodiac"("birth_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_zodiac"("birth_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_zodiac"("birth_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."fill_gname_from_content"() TO "anon";
GRANT ALL ON FUNCTION "public"."fill_gname_from_content"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fill_gname_from_content"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_payment_complete"("p_user_id" "uuid", "p_content_id" "uuid", "p_paid_amount" integer, "p_pay_method" "text", "p_imp_uid" "text", "p_merchant_uid" "text", "p_pg_provider" "text", "p_user_coupon_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment_complete"("p_user_id" "uuid", "p_content_id" "uuid", "p_paid_amount" integer, "p_pay_method" "text", "p_imp_uid" "text", "p_merchant_uid" "text", "p_pg_provider" "text", "p_user_coupon_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment_complete"("p_user_id" "uuid", "p_content_id" "uuid", "p_paid_amount" integer, "p_pay_method" "text", "p_imp_uid" "text", "p_merchant_uid" "text", "p_pg_provider" "text", "p_user_coupon_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_refund"("p_order_id" "uuid", "p_user_id" "uuid", "p_refund_amount" integer, "p_refund_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_refund"("p_order_id" "uuid", "p_user_id" "uuid", "p_refund_amount" integer, "p_refund_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_refund"("p_order_id" "uuid", "p_user_id" "uuid", "p_refund_amount" integer, "p_refund_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."alimtalk_logs" TO "anon";
GRANT ALL ON TABLE "public"."alimtalk_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."alimtalk_logs" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."master_content_questions" TO "anon";
GRANT ALL ON TABLE "public"."master_content_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."master_content_questions" TO "service_role";



GRANT ALL ON TABLE "public"."master_contents" TO "anon";
GRANT ALL ON TABLE "public"."master_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."master_contents" TO "service_role";



GRANT ALL ON TABLE "public"."order_results" TO "anon";
GRANT ALL ON TABLE "public"."order_results" TO "authenticated";
GRANT ALL ON TABLE "public"."order_results" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."saju_records" TO "anon";
GRANT ALL ON TABLE "public"."saju_records" TO "authenticated";
GRANT ALL ON TABLE "public"."saju_records" TO "service_role";



GRANT ALL ON TABLE "public"."user_coupons" TO "anon";
GRANT ALL ON TABLE "public"."user_coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."user_coupons" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







