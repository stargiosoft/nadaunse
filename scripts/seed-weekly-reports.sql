-- =====================================================
-- 주간 보고서 더미 데이터 생성
-- 스테이징 환경: hyltbeewxaqashyivilu
-- 사용자: bed647b4-79e8-4a45-bbb1-40050745e516
-- 1월~5월, 각 월 4개씩 (메모 있음 2개, 메모 없음 2개)
-- =====================================================

-- 기존 데이터 삭제 (해당 사용자만)
DELETE FROM report_tarot_selections
WHERE report_id IN (
  SELECT id FROM weekly_reports
  WHERE user_id = 'bed647b4-79e8-4a45-bbb1-40050745e516'
);

DELETE FROM weekly_report_sections
WHERE report_id IN (
  SELECT id FROM weekly_reports
  WHERE user_id = 'bed647b4-79e8-4a45-bbb1-40050745e516'
);

DELETE FROM weekly_reports
WHERE user_id = 'bed647b4-79e8-4a45-bbb1-40050745e516';

-- 주간 보고서 생성 (1월~5월, 각 월 4주)
DO $$
DECLARE
  v_user_id uuid := 'bed647b4-79e8-4a45-bbb1-40050745e516';
  v_month int;
  v_week int;
  v_report_id uuid;
  v_has_memo boolean;
  v_week_start date;
  v_week_end date;
  v_situation text;
  v_encouragement text;
  v_card_names text[] := ARRAY[
    'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
    'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
    'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
    'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement', 'The World'
  ];
  v_interpretations text[] := ARRAY[
    '새로운 시작과 순수한 마음을 의미합니다. 두려움 없이 앞으로 나아가세요.',
    '당신 안에 모든 가능성이 있습니다. 창의력을 발휘할 때입니다.',
    '직관을 믿으세요. 내면의 지혜가 답을 알고 있습니다.',
    '풍요와 성장의 에너지가 함께합니다. 당신의 노력이 결실을 맺을 것입니다.',
    '리더십을 발휘할 때입니다. 결단력 있게 행동하세요.',
    '전통과 지혜를 따르세요. 멘토의 조언이 도움이 될 것입니다.',
    '사랑과 조화의 에너지가 함께합니다. 관계에서 기쁨을 찾으세요.',
    '승리와 전진의 카드입니다. 목표를 향해 힘차게 나아가세요.',
    '내면의 힘을 믿으세요. 부드러움 속에 강인함이 있습니다.',
    '혼자만의 시간이 필요합니다. 내면을 들여다보세요.',
    '운명의 수레바퀴가 돌고 있습니다. 변화를 받아들이세요.',
    '공정함과 균형을 추구하세요. 진실이 밝혀질 것입니다.'
  ];
BEGIN
  FOR v_month IN 1..5 LOOP
    FOR v_week IN 1..4 LOOP
      -- 메모 여부 결정 (1,2주차: 메모 있음 / 3,4주차: 메모 없음)
      v_has_memo := v_week <= 2;

      -- 주간 시작/종료일 계산 (2026년 기준)
      v_week_start := DATE '2026-01-06' + ((v_month - 1) * 28 + (v_week - 1) * 7) * INTERVAL '1 day';
      v_week_end := v_week_start + INTERVAL '6 days';

      -- 상황 요약 (다양하게)
      v_situation := CASE (v_month + v_week) % 4
        WHEN 0 THEN '이번 주는 창의적인 에너지가 넘치는 시기입니다. 새로운 아이디어가 떠오르면 바로 실행에 옮겨보세요.'
        WHEN 1 THEN '관계에서 따뜻함을 느낄 수 있는 한 주입니다. 소중한 사람들과 시간을 보내세요.'
        WHEN 2 THEN '내면의 성장에 집중할 때입니다. 조용히 자신을 돌아보는 시간을 가져보세요.'
        ELSE '변화의 바람이 불어오고 있습니다. 새로운 기회를 향해 용기 있게 나아가세요.'
      END;

      -- 응원글 (메모 있는 경우만)
      v_encouragement := CASE WHEN v_has_memo THEN
        CASE (v_month + v_week) % 3
          WHEN 0 THEN '나는 매일 조금씩 성장하고 있어. 오늘도 나 자신이 자랑스러워! 💪'
          WHEN 1 THEN '힘든 순간도 지나갈 거야. 나는 충분히 잘하고 있어. 화이팅! ⭐'
          ELSE '오늘 하루도 감사해. 작은 행복들을 놓치지 말자. 🌸'
        END
      ELSE NULL END;

      -- 보고서 ID 생성
      v_report_id := gen_random_uuid();

      -- weekly_reports 삽입
      INSERT INTO weekly_reports (
        id, user_id, year, month, week,
        week_start_date, week_end_date, status, tag_count,
        situation_summary, to_do_list, self_encouragement,
        created_at, published_at
      ) VALUES (
        v_report_id,
        v_user_id,
        2026,
        v_month,
        v_week,
        v_week_start,
        v_week_end,
        'completed',
        5 + floor(random() * 10)::int,
        v_situation,
        '[{"id": 1, "text": "명상 5분 하기"}, {"id": 2, "text": "감사 일기 쓰기"}, {"id": 3, "text": "산책 30분"}]'::jsonb,
        v_encouragement,
        v_week_start + INTERVAL '1 day',
        v_week_start + INTERVAL '1 day'
      );

      -- weekly_report_sections 삽입 (4개 섹션)
      -- 1. my_story
      INSERT INTO weekly_report_sections (report_id, section_type, section_order, title, content)
      VALUES (
        v_report_id,
        'my_story',
        1,
        '이번 주 나의 이야기',
        jsonb_build_object(
          'section_id', 1,
          'title', '이번 주 나의 이야기',
          'content_paragraphs', ARRAY[
            '이번 주 당신은 ' || v_month || '월 ' || v_week || '주차를 맞이했습니다.',
            '당신이 선택한 태그들을 보니, 내면의 성장과 변화를 추구하고 있는 것 같습니다.',
            '스스로에게 더 관대해지고, 작은 성취들을 축하해주세요.'
          ]
        )
      );

      -- 2. emotion_diagnosis
      INSERT INTO weekly_report_sections (report_id, section_type, section_order, title, content)
      VALUES (
        v_report_id,
        'emotion_diagnosis',
        2,
        '감정 진단',
        jsonb_build_object(
          'section_id', 2,
          'title', '감정 진단',
          'content_paragraphs', ARRAY[
            '이번 주 당신의 감정은 전반적으로 안정적입니다.',
            '때때로 불안감이 찾아올 수 있지만, 이는 성장의 신호입니다.',
            '자신의 감정을 있는 그대로 받아들이는 연습을 해보세요.'
          ]
        )
      );

      -- 3. tarot_reading
      INSERT INTO weekly_report_sections (report_id, section_type, section_order, title, content)
      VALUES (
        v_report_id,
        'tarot_reading',
        3,
        '타로 리딩',
        jsonb_build_object(
          'section_id', 3,
          'title', '타로 리딩',
          'card_1_interpretation', v_interpretations[1 + ((v_month + v_week) % 12)],
          'card_2_interpretation', v_interpretations[1 + ((v_month + v_week + 3) % 12)],
          'card_3_interpretation', v_interpretations[1 + ((v_month + v_week + 6) % 12)]
        )
      );

      -- 4. soul_prescription
      INSERT INTO weekly_report_sections (report_id, section_type, section_order, title, content)
      VALUES (
        v_report_id,
        'soul_prescription',
        4,
        '마음 처방',
        jsonb_build_object(
          'section_id', 4,
          'title', '마음 처방',
          'content_paragraphs', ARRAY[
            '이번 주 당신에게 필요한 것은 "자기 돌봄"입니다.',
            '바쁜 일상 속에서도 나만의 시간을 확보해보세요.',
            '작은 휴식이 큰 에너지가 됩니다.'
          ]
        )
      );

      -- report_tarot_selections 삽입 (3장)
      INSERT INTO report_tarot_selections (report_id, card_order, card_name, card_image_url, interpretation, user_viewed)
      VALUES
        (v_report_id, 1, v_card_names[1 + ((v_month + v_week) % 22)], NULL, v_interpretations[1 + ((v_month + v_week) % 12)], v_has_memo),
        (v_report_id, 2, v_card_names[1 + ((v_month + v_week + 5) % 22)], NULL, v_interpretations[1 + ((v_month + v_week + 3) % 12)], v_has_memo),
        (v_report_id, 3, v_card_names[1 + ((v_month + v_week + 10) % 22)], NULL, v_interpretations[1 + ((v_month + v_week + 6) % 12)], v_has_memo);

    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ 더미 데이터 생성 완료: 20개 보고서 (1월~5월, 각 월 4개)';
END $$;

-- 결과 확인
SELECT
  year || '년 ' || month || '월 ' || week || '주차' as period,
  week_start_date,
  tag_count,
  CASE WHEN self_encouragement IS NOT NULL THEN '✓ 메모있음' ELSE '✗ 메모없음' END as memo_status,
  status
FROM weekly_reports
WHERE user_id = 'bed647b4-79e8-4a45-bbb1-40050745e516'
ORDER BY year, month, week;
