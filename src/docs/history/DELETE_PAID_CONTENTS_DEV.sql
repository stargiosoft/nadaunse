-- ========================================
-- 🗑️ 유료 콘텐츠 + 관련 주문 완전 삭제 (개발/테스트용)
-- ========================================
-- ⚠️ 주의: 이 작업은 되돌릴 수 없습니다!
-- ⚠️ 주문 데이터(결제 내역)도 함께 삭제됩니다!
-- ⚠️ 실제 운영 환경에서는 절대 사용하지 마세요!
-- ========================================
-- 실행 방법: 
-- 1. Supabase Dashboard > SQL Editor > New Query
-- 2. 아래 전체 코드를 복사해서 붙여넣기
-- 3. Run 버튼 클릭 (전체 실행)
-- ========================================

BEGIN;

-- 1단계: 유료 콘텐츠와 연결된 주문 삭제 (외래 키 제약조건 해결)
DELETE FROM orders
WHERE content_id IN (
  SELECT id FROM master_contents WHERE content_type = 'paid'
);

-- 2단계: 유료 콘텐츠의 질문 삭제 (외래 키 제약조건)
DELETE FROM master_content_questions
WHERE content_id IN (
  SELECT id FROM master_contents WHERE content_type = 'paid'
);

-- 3단계: 유료 콘텐츠 삭제
DELETE FROM master_contents
WHERE content_type = 'paid';

COMMIT;

-- ========================================
-- 📊 삭제 결과 확인
-- ========================================

SELECT 
  '✅ 유료 콘텐츠 관련 주문 삭제 완료' as message,
  COUNT(*) as remaining_count 
FROM orders
WHERE content_id IN (
  SELECT id FROM master_contents WHERE content_type = 'paid'
)
UNION ALL
SELECT 
  '✅ 유료 콘텐츠 질문 삭제 완료' as message,
  COUNT(*) as remaining_count 
FROM master_content_questions
WHERE content_id IN (
  SELECT id FROM master_contents WHERE content_type = 'paid'
)
UNION ALL
SELECT 
  '✅ 유료 콘텐츠 삭제 완료' as message,
  COUNT(*) as remaining_count 
FROM master_contents
WHERE content_type = 'paid'
UNION ALL
SELECT 
  '📊 무료 콘텐츠는 유지됨' as message,
  COUNT(*) as remaining_count 
FROM master_contents
WHERE content_type = 'free';

-- ========================================
-- 📊 전체 데이터 현황
-- ========================================

SELECT 
  '📦 전체 콘텐츠 수' as category,
  COUNT(*) as count 
FROM master_contents
UNION ALL
SELECT 
  '💰 유료 콘텐츠 수' as category,
  COUNT(*) as count 
FROM master_contents
WHERE content_type = 'paid'
UNION ALL
SELECT 
  '🆓 무료 콘텐츠 수' as category,
  COUNT(*) as count 
FROM master_contents
WHERE content_type = 'free'
UNION ALL
SELECT 
  '📝 전체 질문 수' as category,
  COUNT(*) as count 
FROM master_content_questions
UNION ALL
SELECT 
  '🛒 전체 주문 수' as category,
  COUNT(*) as count 
FROM orders;

-- ========================================
-- ✅ 결과 확인
-- ========================================
-- remaining_count가 모두 0이면 삭제 성공!
-- 무료 콘텐츠와 관련 데이터는 그대로 유지됩니다.
-- ========================================