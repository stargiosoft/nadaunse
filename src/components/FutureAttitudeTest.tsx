import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Sparkles } from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const font = "'Pretendard Variable', sans-serif";

const C = {
  primary: '#48b2af',
  primaryAccent: '#41a09e',
  primaryLight: '#f0f8f8',
  primaryDark: '#368683',
  primaryPressed: '#389998',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#ffffff',
  cardBorder: '#f3f3f3',
  white: '#ffffff',
  // Category
  love: '#ef6878',
  money: '#f5a623',
  career: '#4590d6',
  health: '#8b5cf6',
  relation: '#41a09e',
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  love: C.love,
  money: C.money,
  career: C.career,
  health: C.health,
  relation: C.relation,
};

const CATEGORY_LABELS: Record<string, string> = {
  love: '연애',
  money: '재물',
  career: '커리어',
  health: '건강',
  relation: '인간관계',
};

// ─── Question Data ────────────────────────────────────────────────────────────

interface Question {
  text: string;
  options: { label: string; value: string; score: number }[];
}

const QUESTIONS: Record<string, Question[]> = {
  love: [
    {
      text: '좋아하는 사람이 연락이 늦을 때\n나는 보통...',
      options: [
        { label: '바쁜가 보다 하고 기다린다', value: 'secure', score: 3 },
        { label: '혹시 나한테 관심 없나 불안해진다', value: 'anxious', score: 1 },
        { label: '나도 일부러 늦게 답한다', value: 'avoidant', score: 2 },
      ],
    },
    {
      text: '연인과 갈등이 생기면\n나의 첫 반응은?',
      options: [
        { label: '바로 대화로 풀려고 한다', value: 'approach', score: 3 },
        { label: '일단 혼자 정리할 시간이 필요하다', value: 'withdraw', score: 2 },
        { label: '감정이 복잡해서 눈물이 먼저 난다', value: 'emotional', score: 1 },
      ],
    },
    {
      text: '이상적인 관계에서 가장\n중요한 것은?',
      options: [
        { label: '서로의 독립성과 자유', value: 'freedom', score: 2 },
        { label: '깊은 정서적 교감', value: 'depth', score: 1 },
        { label: '안정감과 신뢰', value: 'stability', score: 3 },
      ],
    },
    {
      text: '새로운 만남 앞에서\n나의 마음은?',
      options: [
        { label: '기대 반 설렘 반', value: 'open', score: 3 },
        { label: '상처받을까 봐 조심스럽다', value: 'cautious', score: 1 },
        { label: '크게 기대하지 않는 편이다', value: 'detached', score: 2 },
      ],
    },
    {
      text: '지금 연애에 대한\n나의 태도는?',
      options: [
        { label: '적극적으로 찾고 싶다', value: 'active', score: 3 },
        { label: '자연스럽게 올 때를 기다린다', value: 'passive', score: 2 },
        { label: '지금은 나에게 집중하고 싶다', value: 'self', score: 1 },
      ],
    },
  ],
  money: [
    {
      text: '예상치 못한 목돈이 생기면\n나는 보통...',
      options: [
        { label: '일단 저축 또는 투자한다', value: 'save', score: 3 },
        { label: '갖고 싶던 것부터 산다', value: 'spend', score: 1 },
        { label: '반은 저축, 반은 사용한다', value: 'balance', score: 2 },
      ],
    },
    {
      text: '월말에 통장 잔고를 보면\n드는 생각은?',
      options: [
        { label: '계획대로 잘 관리했다', value: 'planned', score: 3 },
        { label: '어디서 이렇게 나갔지?', value: 'surprised', score: 1 },
        { label: '조금만 더 아낄 수 있었는데', value: 'regret', score: 2 },
      ],
    },
    {
      text: '투자에 대한 나의 성향은?',
      options: [
        { label: '안전한 예금/적금 위주', value: 'safe', score: 2 },
        { label: '리스크가 있어도 수익을 추구', value: 'aggressive', score: 1 },
        { label: '공부하고 분산 투자한다', value: 'strategic', score: 3 },
      ],
    },
    {
      text: '큰 지출 결정을 할 때\n나의 방식은?',
      options: [
        { label: '꼼꼼히 비교하고 고민한다', value: 'careful', score: 3 },
        { label: '필요하면 바로 결정한다', value: 'decisive', score: 2 },
        { label: '주변 의견을 많이 구한다', value: 'consulting', score: 1 },
      ],
    },
    {
      text: '돈에 대한 나의 현재 감정은?',
      options: [
        { label: '충분하진 않지만 괜찮다', value: 'content', score: 3 },
        { label: '불안하고 더 벌어야 할 것 같다', value: 'anxious', score: 1 },
        { label: '관심은 있지만 크게 걱정은 안 한다', value: 'relaxed', score: 2 },
      ],
    },
  ],
  career: [
    {
      text: '일할 때 가장 중요한 것은?',
      options: [
        { label: '안정적인 수입과 복지', value: 'stability', score: 2 },
        { label: '성장할 수 있는 도전적 환경', value: 'growth', score: 3 },
        { label: '주변의 인정과 성취감', value: 'recognition', score: 1 },
      ],
    },
    {
      text: '새로운 업무를 맡게 되면\n나는 보통...',
      options: [
        { label: '빠르게 시작하고 부딪히며 배운다', value: 'action', score: 3 },
        { label: '충분히 공부한 뒤에 시작한다', value: 'prepare', score: 2 },
        { label: '누군가 알려주길 기다린다', value: 'passive', score: 1 },
      ],
    },
    {
      text: '직장에서 스트레스를 받으면\n나는...',
      options: [
        { label: '운동이나 취미로 해소한다', value: 'healthy', score: 3 },
        { label: '참고 견딘다', value: 'endure', score: 1 },
        { label: '신뢰하는 사람에게 이야기한다', value: 'share', score: 2 },
      ],
    },
    {
      text: '5년 후 나의 커리어는?',
      options: [
        { label: '전문가로 깊이 성장해 있고 싶다', value: 'expert', score: 3 },
        { label: '리더 위치에서 팀을 이끌고 싶다', value: 'leader', score: 2 },
        { label: '나만의 사업을 하고 싶다', value: 'entrepreneur', score: 1 },
      ],
    },
    {
      text: '지금 커리어 만족도는?',
      options: [
        { label: '대체로 만족하고 방향이 맞다', value: 'satisfied', score: 3 },
        { label: '변화가 필요한 시기인 것 같다', value: 'change', score: 1 },
        { label: '잘 모르겠고 고민 중이다', value: 'uncertain', score: 2 },
      ],
    },
  ],
  health: [
    {
      text: '스트레스를 받으면\n내 몸은 어떻게 반응하나요?',
      options: [
        { label: '잠이 안 오거나 피로가 쌓인다', value: 'fatigue', score: 1 },
        { label: '소화가 안 되거나 몸이 뻣뻣해진다', value: 'tension', score: 2 },
        { label: '크게 신체 반응은 없는 편이다', value: 'resilient', score: 3 },
      ],
    },
    {
      text: '운동이나 건강 관리에 대한\n나의 태도는?',
      options: [
        { label: '규칙적으로 관리하고 있다', value: 'regular', score: 3 },
        { label: '해야 하는데 잘 안 된다', value: 'struggling', score: 1 },
        { label: '필요할 때만 한다', value: 'occasional', score: 2 },
      ],
    },
    {
      text: '아플 때 나의 대처 방식은?',
      options: [
        { label: '바로 병원에 간다', value: 'proactive', score: 3 },
        { label: '좀 참다가 안 나으면 간다', value: 'delayed', score: 2 },
        { label: '웬만하면 참고 넘긴다', value: 'ignore', score: 1 },
      ],
    },
    {
      text: '수면 습관은 어떤가요?',
      options: [
        { label: '규칙적이고 충분히 잔다', value: 'good', score: 3 },
        { label: '불규칙하지만 나름 괜찮다', value: 'irregular', score: 2 },
        { label: '만성적으로 수면이 부족하다', value: 'deprived', score: 1 },
      ],
    },
    {
      text: '지금 건강에 대한 나의 감정은?',
      options: [
        { label: '건강한 편이라 감사하다', value: 'grateful', score: 3 },
        { label: '관리해야 할 부분이 있다', value: 'aware', score: 2 },
        { label: '걱정이 되는 부분이 있다', value: 'worried', score: 1 },
      ],
    },
  ],
  relation: [
    {
      text: '새로운 모임에 가면\n나는 보통...',
      options: [
        { label: '먼저 다가가서 말을 건다', value: 'initiative', score: 3 },
        { label: '누가 말 걸면 잘 대화한다', value: 'responsive', score: 2 },
        { label: '조용히 관찰하는 편이다', value: 'observer', score: 1 },
      ],
    },
    {
      text: '친구와 의견이 다를 때\n나의 스타일은?',
      options: [
        { label: '솔직하게 내 생각을 말한다', value: 'direct', score: 2 },
        { label: '상대방 의견을 먼저 존중한다', value: 'harmonious', score: 3 },
        { label: '굳이 충돌하지 않으려 한다', value: 'avoidant', score: 1 },
      ],
    },
    {
      text: '힘든 일이 있을 때\n나는...',
      options: [
        { label: '가까운 사람에게 바로 이야기한다', value: 'open', score: 3 },
        { label: '혼자 정리한 뒤에 이야기한다', value: 'process', score: 2 },
        { label: '대부분 혼자 해결한다', value: 'independent', score: 1 },
      ],
    },
    {
      text: '오래된 친구 관계에서\n가장 중요한 것은?',
      options: [
        { label: '서로 연락하고 시간을 내는 것', value: 'effort', score: 3 },
        { label: '오래 안 봐도 변하지 않는 신뢰', value: 'trust', score: 2 },
        { label: '필요할 때 도움을 줄 수 있는 것', value: 'support', score: 1 },
      ],
    },
    {
      text: '지금 인간관계 만족도는?',
      options: [
        { label: '좋은 사람들에게 둘러싸여 있다', value: 'satisfied', score: 3 },
        { label: '정리하거나 넓혀야 할 것 같다', value: 'change', score: 1 },
        { label: '적당히 괜찮은 편이다', value: 'moderate', score: 2 },
      ],
    },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FutureAttitudeTest() {
  const navigate = useNavigate();
  const category = sessionStorage.getItem('future_category') || 'love';
  const questions = QUESTIONS[category] || QUESTIONS.love;
  const categoryColor = CATEGORY_COLORS[category] || C.primary;
  const categoryLabel = CATEGORY_LABELS[category] || '연애';

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ value: string; score: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back

  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleSelect = useCallback((optionIdx: number) => {
    if (selectedOption !== null) return; // 중복 방지
    setSelectedOption(optionIdx);

    const option = questions[currentQ].options[optionIdx];
    const newAnswers = [...answers, { value: option.value, score: option.score }];

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setDirection(1);
        setAnswers(newAnswers);
        setCurrentQ(prev => prev + 1);
        setSelectedOption(null);
      } else {
        // 테스트 완료 → 결과 페이지
        sessionStorage.setItem('future_answers', JSON.stringify(newAnswers));
        const totalScore = newAnswers.reduce((sum, a) => sum + a.score, 0);
        sessionStorage.setItem('future_score', String(totalScore));
        navigate('/future/result');
      }
    }, 350);
  }, [selectedOption, currentQ, answers, questions, navigate]);

  const handleBack = () => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ(prev => prev - 1);
      setAnswers(prev => prev.slice(0, -1));
      setSelectedOption(null);
    } else {
      navigate('/future');
    }
  };

  const q = questions[currentQ];

  return (
    <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.bg }}>
      <div className="w-full max-w-[440px] h-full flex flex-col" style={{ backgroundColor: C.bg }}>

        {/* ─── Header ───────────────────────────────────────── */}
        <div className="shrink-0" style={{ padding: '4px 12px', height: '52px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleBack}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'transparent',
              transition: 'background-color 0.15s ease',
            }}
            onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#f4f4f4'; }}
            onPointerUp={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <ChevronLeft size={24} style={{ color: C.gray600 }} strokeWidth={1.7} />
          </button>
          <span style={{
            fontFamily: font,
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '-0.32px',
            color: C.black,
          }}>
            {categoryLabel} 태도 테스트
          </span>
        </div>

        {/* ─── Progress Bar ─────────────────────────────────── */}
        <div className="shrink-0" style={{ padding: '0 20px', marginBottom: '4px' }}>
          <div style={{ height: '4px', backgroundColor: '#f3f3f3', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              style={{ height: '100%', backgroundColor: categoryColor, borderRadius: '2px' }}
            />
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
            <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray400 }}>
              {currentQ + 1} / {questions.length}
            </span>
            <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: categoryColor }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* ─── Question Area ───────────────────────────────── */}
        <div className="flex-1 overflow-hidden" style={{ padding: '0 20px' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQ}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {/* Question Text */}
              <div style={{ paddingTop: '32px', paddingBottom: '28px' }}>
                <p style={{
                  fontFamily: font,
                  fontSize: '22px',
                  fontWeight: 600,
                  lineHeight: '32px',
                  letterSpacing: '-0.44px',
                  color: C.black,
                  whiteSpace: 'pre-line',
                }}>
                  {q.text}
                </p>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options.map((opt, oi) => {
                  const isSelected = selectedOption === oi;
                  return (
                    <motion.button
                      key={oi}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: oi * 0.08, duration: 0.3 }}
                      onClick={() => handleSelect(oi)}
                      className="w-full cursor-pointer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '18px 16px',
                        backgroundColor: isSelected ? categoryColor : C.white,
                        borderRadius: '16px',
                        border: `1.5px solid ${isSelected ? categoryColor : C.gray200}`,
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Number Circle */}
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#f7f8f9',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <span style={{
                          fontFamily: font,
                          fontSize: '14px',
                          fontWeight: 600,
                          color: isSelected ? C.white : C.gray600,
                          transition: 'color 0.2s ease',
                        }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                      </div>

                      {/* Option Text */}
                      <span style={{
                        fontFamily: font,
                        fontSize: '15px',
                        fontWeight: isSelected ? 500 : 400,
                        lineHeight: '22px',
                        letterSpacing: '-0.3px',
                        color: isSelected ? C.white : C.black,
                        transition: 'color 0.2s ease',
                      }}>
                        {opt.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Bottom Hint ─────────────────────────────────── */}
        <div className="shrink-0" style={{ padding: '16px 20px 32px', textAlign: 'center' }}>
          <div className="flex items-center justify-center gap-1">
            <Sparkles size={14} style={{ color: C.gray400 }} strokeWidth={1.5} />
            <span style={{
              fontFamily: font,
              fontSize: '12px',
              fontWeight: 400,
              color: C.gray400,
            }}>
              정답은 없어요, 평소 느끼는 대로 선택하세요
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
