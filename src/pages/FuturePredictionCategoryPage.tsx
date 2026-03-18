import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#41a09e',
  primaryLight: '#e8f5f5',
  black: '#151515',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#f7f8f9',
  white: '#ffffff',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── 카테고리 데이터 ────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: '연애',
    emoji: '💕',
    title: '연애',
    subtitle: '나의 연애 흐름은 어디로?',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    placeholder: '올해 제 연애운이 좋을까요?',
  },
  {
    id: '재물',
    emoji: '💰',
    title: '재물',
    subtitle: '재물운의 방향은?',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    placeholder: '투자하면 돈을 벌 수 있을까요?',
  },
  {
    id: '학업',
    emoji: '📚',
    title: '학업',
    subtitle: '나의 학업 미래는?',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    placeholder: '올해 시험에 합격할 수 있을까요?',
  },
  {
    id: '직장',
    emoji: '💼',
    title: '직장',
    subtitle: '나의 직장 미래는?',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    placeholder: '이직하면 잘 될까요?',
  },
];

// ─── FuturePredictionCategoryPage ───────────────────────────────────────────
export function FuturePredictionCategoryPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCustomQuestion('');
  };

  const handleNext = () => {
    if (!selectedCategory) return;
    sessionStorage.setItem('fp_category', selectedCategory);
    if (customQuestion.trim()) {
      sessionStorage.setItem('fp_custom_question', customQuestion.trim());
    } else {
      sessionStorage.removeItem('fp_custom_question');
    }
    navigate('/future-prediction/test');
  };

  const selectedCat = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: C.bg,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <SEO title="카테고리 선택" noIndex={true} />
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.bg,
          overflow: 'auto',
        }}
      >
        <NavigationHeader title="미래 예측기" onBack={() => navigate('/future-prediction')} />

        {/* ── 헤더 ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ padding: '80px 20px 20px' }}
        >
          <p style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: C.black, letterSpacing: '-0.44px', lineHeight: '32px' }}>
            어떤 미래가 궁금하세요?
          </p>
        </motion.div>

        {/* ── 카테고리 카드 ── */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CATEGORIES.map((cat, idx) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  width: '100%',
                  padding: '20px',
                  borderRadius: 16,
                  border: isSelected ? `2px solid ${C.primary}` : '2px solid transparent',
                  background: C.white,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: isSelected ? '0 2px 12px rgba(65,160,158,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: cat.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                  }}
                >
                  {cat.emoji}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: C.black, letterSpacing: '-0.32px' }}>
                    {cat.title}
                  </p>
                  <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray600, letterSpacing: '-0.26px', marginTop: 2 }}>
                    {cat.subtitle}
                  </p>
                </div>
                {isSelected && (
                  <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                      <path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── 질문 입력 (카테고리 선택 시 슬라이드인) ── */}
        <AnimatePresence>
          {selectedCat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '16px 20px 0' }}>
                <p style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.black, letterSpacing: '-0.28px', marginBottom: 8 }}>
                  구체적으로 궁금한 점이 있나요? <span style={{ color: C.gray400, fontWeight: 400 }}>(선택사항)</span>
                </p>
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder={selectedCat.placeholder}
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${C.gray200}`,
                    backgroundColor: C.white,
                    fontFamily: font,
                    fontSize: 14,
                    fontWeight: 400,
                    color: C.black,
                    letterSpacing: '-0.28px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.primary; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.gray200; }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 하단 버튼 ── */}
        <div style={{ padding: '24px 20px 40px', marginTop: 'auto' }}>
          <button
            onClick={handleNext}
            disabled={!selectedCategory}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: selectedCategory ? C.primary : C.gray200,
              cursor: selectedCategory ? 'pointer' : 'default',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: selectedCategory ? C.white : C.gray400, letterSpacing: '-0.3px' }}>
              다음
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
