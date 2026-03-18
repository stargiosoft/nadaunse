import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import svgPaths from '../imports/svg-97glg550pf';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#41a09e',
  primaryDark: '#357f7d',
  primaryLight: '#e8f5f5',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#f7f8f9',
  white: '#ffffff',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── 카테고리별 질문 데이터 (IPIP-HEXACO 기반) ──────────────────────────────
// 출처: IPIP (International Personality Item Pool) — 퍼블릭 도메인
// HEXACO 성격 모델 축 매핑으로 학술적 신뢰도 확보
// 각 카테고리는 관련 HEXACO 축의 핵심 문항을 5개로 선별하여 3지선다로 변환
interface QuestionOption {
  label: string;
  value: string;
}

interface Question {
  id: number;
  text: string;
  hexaco: string; // HEXACO 축 참조
  options: QuestionOption[];
}

const QUESTIONS: Record<string, Question[]> = {
  // ── 연애: 감성(Emotionality) + 관계(Agreeableness) ──
  '연애': [
    {
      id: 1,
      hexaco: 'Emotionality:Sentimentality',
      text: '가까운 사람과 떨어져 있으면\n어떤 감정이 드나요?',
      options: [
        { label: '자주 보고 싶고 불안하다', value: 'anxious' },
        { label: '그립지만 각자 시간을 즐긴다', value: 'secure' },
        { label: '크게 신경 쓰이지 않는다', value: 'avoidant' },
      ],
    },
    {
      id: 2,
      hexaco: 'Emotionality:Dependence',
      text: '감정적으로 힘들 때\n어떻게 하나요?',
      options: [
        { label: '누군가에게 바로 이야기한다', value: 'anxious' },
        { label: '정리한 뒤 가까운 사람에게 말한다', value: 'secure' },
        { label: '혼자 해결하는 편이다', value: 'avoidant' },
      ],
    },
    {
      id: 3,
      hexaco: 'Agreeableness:Forgiveness',
      text: '상대가 실수했을 때\n나의 반응은?',
      options: [
        { label: '계속 신경 쓰이고 불안하다', value: 'anxious' },
        { label: '이해하고 자연스럽게 넘어간다', value: 'secure' },
        { label: '마음속으로 거리를 둔다', value: 'avoidant' },
      ],
    },
    {
      id: 4,
      hexaco: 'Emotionality:Anxiety',
      text: '관계에서 거절당할까\n걱정하는 편인가요?',
      options: [
        { label: '자주 걱정하는 편이다', value: 'anxious' },
        { label: '가끔 신경 쓰이지만 괜찮다', value: 'secure' },
        { label: '별로 신경 쓰지 않는다', value: 'avoidant' },
      ],
    },
    {
      id: 5,
      hexaco: 'Agreeableness:Patience',
      text: '의견이 다를 때\n어떻게 대처하나요?',
      options: [
        { label: '상대 의견에 맞추려 한다', value: 'anxious' },
        { label: '서로 조율하며 대화한다', value: 'secure' },
        { label: '내 입장을 유지하고 거리를 둔다', value: 'avoidant' },
      ],
    },
  ],
  // ── 재물: 진실성(Honesty-Humility) + 의지력(Conscientiousness) ──
  '재물': [
    {
      id: 1,
      hexaco: 'Honesty-Humility:Greed Avoidance',
      text: '물질적으로 풍요로운 삶이\n얼마나 중요한가요?',
      options: [
        { label: '소박해도 충분히 행복하다', value: 'saving' },
        { label: '적정선이면 만족한다', value: 'balanced' },
        { label: '풍요로운 삶이 중요하다', value: 'spending' },
      ],
    },
    {
      id: 2,
      hexaco: 'Conscientiousness:Prudence',
      text: '충동적으로 소비한 적이\n있나요?',
      options: [
        { label: '거의 없다, 항상 신중하다', value: 'saving' },
        { label: '가끔 있지만 후회는 적다', value: 'balanced' },
        { label: '종종 있다, 그때 기분이 좋으니까', value: 'spending' },
      ],
    },
    {
      id: 3,
      hexaco: 'Conscientiousness:Diligence',
      text: '재정 목표를 세우면\n꾸준히 실행하나요?',
      options: [
        { label: '계획대로 끝까지 실행한다', value: 'saving' },
        { label: '대체로 하지만 유연하게 조절한다', value: 'balanced' },
        { label: '세우긴 하지만 잘 안 지켜진다', value: 'spending' },
      ],
    },
    {
      id: 4,
      hexaco: 'Honesty-Humility:Modesty',
      text: '남들에게 보여지는\n생활 수준에 대해?',
      options: [
        { label: '신경 쓰지 않는다', value: 'saving' },
        { label: '적당히 맞추는 편이다', value: 'balanced' },
        { label: '좋은 인상을 주고 싶다', value: 'spending' },
      ],
    },
    {
      id: 5,
      hexaco: 'Conscientiousness:Organization',
      text: '가계부나 지출 기록을\n관리하나요?',
      options: [
        { label: '꼼꼼하게 기록한다', value: 'saving' },
        { label: '대략적으로 파악한다', value: 'balanced' },
        { label: '따로 관리하지 않는다', value: 'spending' },
      ],
    },
  ],
  // ── 학업: 실행력(Conscientiousness) + 사고력(Openness) ──
  '학업': [
    {
      id: 1,
      hexaco: 'Conscientiousness:Diligence',
      text: '공부할 때\n몰입하는 편인가요?',
      options: [
        { label: '한번 시작하면 몇 시간이고 빠져든다', value: 'immersive' },
        { label: '계획한 시간만큼 집중한다', value: 'planned' },
        { label: '핵심만 빠르게 파악하고 넘어간다', value: 'efficient' },
      ],
    },
    {
      id: 2,
      hexaco: 'Conscientiousness:Organization',
      text: '학습 계획을\n어떻게 세우나요?',
      options: [
        { label: '관심 가는 주제에 깊이 파고든다', value: 'immersive' },
        { label: '주간/일간 계획표를 만든다', value: 'planned' },
        { label: '시험 범위 중심으로 전략적으로', value: 'efficient' },
      ],
    },
    {
      id: 3,
      hexaco: 'Openness:Inquisitiveness',
      text: '시험 대비 방식은\n어떤가요?',
      options: [
        { label: '이해될 때까지 깊이 파고든다', value: 'immersive' },
        { label: '복습 스케줄을 정해서 반복한다', value: 'planned' },
        { label: '기출 분석 + 빈출 위주로 정리한다', value: 'efficient' },
      ],
    },
    {
      id: 4,
      hexaco: 'Conscientiousness:Diligence',
      text: '공부 중 집중이\n흐트러지면?',
      options: [
        { label: '흥미로운 부분을 찾아서 다시 몰입한다', value: 'immersive' },
        { label: '정해진 루틴으로 돌아간다', value: 'planned' },
        { label: '장소나 방법을 바꿔서 효율을 높인다', value: 'efficient' },
      ],
    },
    {
      id: 5,
      hexaco: 'Openness:Inquisitiveness',
      text: '학습의 궁극적인\n목표는?',
      options: [
        { label: '알아가는 과정 자체가 즐겁다', value: 'immersive' },
        { label: '목표 달성을 위한 단계적 성장', value: 'planned' },
        { label: '최소 노력으로 최대 결과를 내는 것', value: 'efficient' },
      ],
    },
  ],
  // ── 직장: 실행력(Extraversion) + 사고력(Openness) ──
  '직장': [
    {
      id: 1,
      hexaco: 'Extraversion:Social Boldness',
      text: '새로운 환경이나 도전 앞에서\n나는?',
      options: [
        { label: '익숙한 환경이 편하다', value: 'stability' },
        { label: '흥미롭지만 준비가 필요하다', value: 'recognition' },
        { label: '두려움보다 설렘이 크다', value: 'challenge' },
      ],
    },
    {
      id: 2,
      hexaco: 'Openness:Creativity',
      text: '문제를 해결할 때\n나의 방식은?',
      options: [
        { label: '검증된 방법을 따른다', value: 'stability' },
        { label: '효율적인 방법을 찾는다', value: 'recognition' },
        { label: '새로운 접근을 시도해본다', value: 'challenge' },
      ],
    },
    {
      id: 3,
      hexaco: 'Extraversion:Social Self-Esteem',
      text: '나의 능력에 대한\n자신감은?',
      options: [
        { label: '주어진 일은 잘 해내는 편이다', value: 'stability' },
        { label: '인정받을 때 자신감이 올라간다', value: 'recognition' },
        { label: '도전할수록 성장한다고 믿는다', value: 'challenge' },
      ],
    },
    {
      id: 4,
      hexaco: 'Openness:Inquisitiveness',
      text: '전혀 모르는 분야의\n지식을 접하면?',
      options: [
        { label: '내 분야에 집중하는 게 낫다', value: 'stability' },
        { label: '업무에 도움되면 배워본다', value: 'recognition' },
        { label: '호기심이 생겨 파고든다', value: 'challenge' },
      ],
    },
    {
      id: 5,
      hexaco: 'Extraversion:Liveliness',
      text: '일할 때 나의\n에너지 수준은?',
      options: [
        { label: '꾸준하고 안정적으로 일한다', value: 'stability' },
        { label: '성과가 보이면 에너지가 올라간다', value: 'recognition' },
        { label: '열정적으로 몰입하는 편이다', value: 'challenge' },
      ],
    },
  ],
};

const CATEGORY_EMOJIS: Record<string, string> = {
  '연애': '💕',
  '재물': '💰',
  '학업': '📚',
  '직장': '💼',
};

// ─── BackButton ─────────────────────────────────────────────────────────────
function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        border: 'none',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
        padding: 4,
      }}
    >
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
        <path
          d={svgPaths.p2a5cd480}
          stroke={C.gray600}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit="10"
          strokeWidth="1.7"
        />
      </svg>
    </button>
  );
}

// ─── FutureAttitudeTestPage ─────────────────────────────────────────────────
export function FutureAttitudeTestPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: number; answer: string }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const cat = sessionStorage.getItem('fp_category');
    if (!cat || !QUESTIONS[cat]) {
      navigate('/future-prediction/category', { replace: true });
      return;
    }
    setCategory(cat);
  }, [navigate]);

  if (!category) return null;

  const questions = QUESTIONS[category];
  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleSelect = (value: string) => {
    setSelectedOption(value);

    setTimeout(() => {
      const newAnswers = [...answers, { question_id: question.id, answer: value }];
      setAnswers(newAnswers);
      setSelectedOption(null);

      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        // 테스트 완료 → 태그 선택 페이지로
        sessionStorage.setItem(
          'future_prediction_answers',
          JSON.stringify(newAnswers)
        );
        navigate('/future-prediction/tags', { replace: true });
      }
    }, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: C.white,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <SEO title={`${category} 태도 테스트`} noIndex={true} />
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.white,
          overflow: 'auto',
        }}
      >
        {/* ── 상단 네비게이션 ── */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            paddingRight: 16,
            flexShrink: 0,
          }}
        >
          <BackButton
            onPress={() => {
              if (currentQ > 0) {
                setCurrentQ(currentQ - 1);
                setAnswers(answers.slice(0, -1));
              } else {
                navigate('/future-prediction/category');
              }
            }}
          />
          <span
            style={{
              fontFamily: font,
              fontSize: 15,
              fontWeight: 500,
              color: C.gray600,
              marginLeft: 4,
            }}
          >
            {CATEGORY_EMOJIS[category]} {category}
          </span>
          <span
            style={{
              fontFamily: font,
              fontSize: 14,
              fontWeight: 500,
              color: C.gray400,
              marginLeft: 'auto',
            }}
          >
            {currentQ + 1} / {questions.length}
          </span>
        </div>

        {/* ── 프로그레스 바 ── */}
        <div
          style={{
            height: 3,
            backgroundColor: C.gray200,
            marginLeft: 20,
            marginRight: 20,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              height: '100%',
              backgroundColor: C.primary,
              borderRadius: 2,
            }}
          />
        </div>

        {/* ── 질문 + 선택지 ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 24px',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              {/* 질문 텍스트 */}
              <p
                style={{
                  fontFamily: font,
                  fontSize: 21,
                  fontWeight: 700,
                  color: C.black,
                  letterSpacing: '-0.42px',
                  lineHeight: '32px',
                  textAlign: 'center',
                  whiteSpace: 'pre-line',
                  marginBottom: 40,
                }}
              >
                {question.text}
              </p>

              {/* 선택지 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {question.options.map((opt) => {
                  const isSelected = selectedOption === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelect(opt.value)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: 14,
                        border: `1.5px solid ${isSelected ? C.primary : C.gray200}`,
                        backgroundColor: isSelected ? C.primaryLight : C.white,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: font,
                          fontSize: 15,
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? C.primary : C.gray700,
                          letterSpacing: '-0.3px',
                          textAlign: 'center',
                        }}
                      >
                        {opt.label}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
