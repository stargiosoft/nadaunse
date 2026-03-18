import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';

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

// ─── 카테고리 데이터 ────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: '연애',
    emoji: '💕',
    title: '연애',
    subtitle: '나의 연애 흐름은 어디로?',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  },
  {
    id: '재물',
    emoji: '💰',
    title: '재물',
    subtitle: '재물운의 방향은?',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  },
  {
    id: '커리어',
    emoji: '🚀',
    title: '커리어',
    subtitle: '나의 커리어 미래는?',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
  {
    id: '건강',
    emoji: '🌿',
    title: '건강',
    subtitle: '몸과 마음의 흐름은?',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  },
  {
    id: '인간관계',
    emoji: '🤝',
    title: '인간관계',
    subtitle: '관계의 미래를 예측해요',
    gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  },
];

// ─── FuturePredictionPage ───────────────────────────────────────────────────
export function FuturePredictionPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSaju, setHasSaju] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data } = await supabase
          .from('saju_records')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();
        setHasSaju(!!data);
      } else {
        setHasSaju(false);
      }
    };
    checkUser();
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/future-prediction' } });
      return;
    }

    if (!hasSaju) {
      navigate('/profile');
      return;
    }

    sessionStorage.setItem('future_prediction_category', categoryId);
    navigate('/future-prediction/test');
  };

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
      <SEO title="미래 예측기" description="AI가 당신의 미래를 시뮬레이션합니다" />
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.bg,
          overflow: 'hidden',
        }}
      >
        {/* ── 공통 헤더 ── */}
        <NavigationHeader title="미래 예측기" onBack={() => navigate(-1)} />

        {/* ── 헤더 ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '80px 20px 20px',
          }}
        >
          <p
            style={{
              fontFamily: font,
              fontSize: 22,
              fontWeight: 700,
              color: C.black,
              letterSpacing: '-0.44px',
              lineHeight: '32px',
            }}
          >
            AI가 당신의 미래를
            <br />
            시뮬레이션합니다
          </p>
          <p
            style={{
              fontFamily: font,
              fontSize: 14,
              fontWeight: 400,
              color: C.gray600,
              letterSpacing: '-0.28px',
              lineHeight: '22px',
              marginTop: 8,
            }}
          >
            HEXACO 성격심리학 + 사주를 결합해
            <br />
            3명의 AI 에이전트가 토론합니다
          </p>
        </motion.div>

        {/* ── 카테고리 카드 ── */}
        <div
          style={{
            padding: '0 20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
              onClick={() => handleCategorySelect(cat.id)}
              style={{
                width: '100%',
                padding: '20px 20px',
                borderRadius: 16,
                border: 'none',
                background: C.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
                <p
                  style={{
                    fontFamily: font,
                    fontSize: 16,
                    fontWeight: 600,
                    color: C.black,
                    letterSpacing: '-0.32px',
                  }}
                >
                  {cat.title}
                </p>
                <p
                  style={{
                    fontFamily: font,
                    fontSize: 13,
                    fontWeight: 400,
                    color: C.gray600,
                    letterSpacing: '-0.26px',
                    marginTop: 2,
                  }}
                >
                  {cat.subtitle}
                </p>
              </div>
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path d="M7.5 5l5 5-5 5" stroke={C.gray400} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          ))}
        </div>

        {/* ── 안내 문구 ── */}
        <div style={{ padding: '0 20px 40px', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: font,
              fontSize: 12,
              fontWeight: 400,
              color: C.gray400,
              letterSpacing: '-0.24px',
              lineHeight: '18px',
            }}
          >
            무료로 1개 카테고리를 예측할 수 있어요
            <br />
            전체 리포트는 새싹 15개로 열람 가능합니다
          </p>
        </div>
      </div>
    </div>
  );
}
