-- users 테이블에 phone_number 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_number TEXT;
    CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
  END IF;
END $$;

-- saju_records 테이블에 phone_number 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'saju_records' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE saju_records ADD COLUMN phone_number TEXT;
    CREATE INDEX IF NOT EXISTS idx_saju_records_phone_number ON saju_records(phone_number);
  END IF;
END $$;

-- orders 테이블에 ai_generation_completed 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'ai_generation_completed'
  ) THEN
    ALTER TABLE orders ADD COLUMN ai_generation_completed BOOLEAN DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS idx_orders_ai_generation_completed ON orders(ai_generation_completed);
  END IF;
END $$;
