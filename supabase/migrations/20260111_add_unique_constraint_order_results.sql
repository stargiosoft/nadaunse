-- 중복 답변 방지를 위한 UNIQUE 제약조건 추가
-- 동일한 주문에 대해 동일한 질문에 대한 답변은 하나만 존재해야 함

-- 먼저 기존 중복 데이터 제거 (가장 먼저 생성된 것만 유지)
DELETE FROM order_results a
USING order_results b
WHERE a.order_id = b.order_id
  AND a.question_id = b.question_id
  AND a.created_at > b.created_at;

-- UNIQUE 제약조건 추가
ALTER TABLE order_results
ADD CONSTRAINT order_results_order_question_unique
UNIQUE (order_id, question_id);
