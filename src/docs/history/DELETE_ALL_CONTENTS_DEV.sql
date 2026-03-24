-- ========================================
-- 🗑️ 모든 콘텐츠(유료+무료) + 관련 데이터 완전 삭제 (개발/테스트용)
-- ========================================
-- ⚠️ 주의: 이 작업은 되돌릴 수 없습니다!
-- ⚠️ 모든 마스터 콘텐츠와 주문 데이터가 삭제됩니다!
-- ⚠️ 실제 운영 환경에서는 절대 사용하지 마세요!
-- ========================================
-- 실행 방법: 
-- 1. Supabase Dashboard > SQL Editor > New Query
-- 2. 아래 전체 코드를 복사해서 붙여넣기
-- 3. Run 버튼 클릭 (전체 실행)
-- ========================================

BEGIN;

-- 1단계: 모든 콘텐츠와 연결된 주문 삭제 (외래 키 제약조건 해결)
DELETE FROM orders
WHERE content_id IN (
  SELECT id FROM master_contents
);

-- 2단계: 모든 콘텐츠의 질문 삭제 (외래 키 제약조건)
DELETE FROM master_content_questions;

-- 3단계: 모든 마스터 콘텐츠 삭제
DELETE FROM master_contents;

COMMIT;

-- ========================================
-- 📊 삭제 결과 확인
-- ========================================

SELECT 
  '✅ 모든 주문 삭제 완료' as message,
  COUNT(*) as remaining_count 
FROM orders
UNION ALL
SELECT 
  '✅ 모든 질문 삭제 완료' as message,
  COUNT(*) as remaining_count 
FROM master_content_questions
UNION ALL
SELECT 
  '✅ 모든 콘텐츠 삭제 완료' as message,
  COUNT(*) as remaining_count 
FROM master_contents;

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
-- 모든 카운트가 0이면 완전 삭제 성공!
-- 테이블 구조는 유지되며, 데이터만 삭제됩니다.
-- ========================================
