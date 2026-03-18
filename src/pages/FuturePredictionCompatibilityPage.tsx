import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';
import CompatibilityMeter from '../components/CompatibilityMeter';

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
  resonance: '#4CAF50',
  resonanceBg: '#f1f8f1',
  friction: '#FF9800',
  frictionBg: '#fff8e1',
  scenario: '#7c3aed',
  scenarioBg: '#f8f5ff',
  advice: '#2196F3',
  adviceBg: '#f0f6ff',
} as const;

const font = "'Pretendard Variable', sans-serif";

interface CompatibilityResult {
  compatibility_score: number;
  compatibility_type: string;
  resonance_points: string[];
  friction_points: string[];
  future_scenario: string;
  advice: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  '연애': '💕',
  '재물': '💰',
  '학업': '📚',
  '직장': '💼',
  '커리어': '🚀',
};

// ─── FuturePredictionCompatibilityPage ──────────────────────────────────────
export function FuturePredictionCompatibilityPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [category, setCategory] = useState('');
  const [meterDone, setMeterDone] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('fp_compatibility_result');
    const storedCategory = sessionStorage.getItem('fp_compatibility_category');
    if (!stored) {
      navigate('/future-prediction', { replace: true });
      return;
    }
    try {
      setResult(JSON.parse(stored));
      setCategory(storedCategory || '');
    } catch {
      navigate('/future-prediction', { replace: true });
    }
  }, [navigate]);

  const handleShareKakao = useCallback(async () => {
    if (!result) return;
    try {
      if (!window.Kakao) {
        const script = document.createElement('script');
        script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init('da0e07cca0c104a3b59f79a24911587c');
      }
      const shareUrl = `${window.location.origin}/future-prediction?utm_source=share&utm_medium=kakao&utm_campaign=compatibility`;
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `궁합 ${result.compatibility_score}점 — ${result.compatibility_type}`,
          description: `${category} 궁합 분석 결과가 나왔어요! 나도 해보기`,
          imageUrl: `${window.location.origin}/og-image.png`,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: '나도 궁합 분석하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
    } catch {
      const shareUrl = `${window.location.origin}/future-prediction`;
      if (navigator.share) {
        navigator.share({ title: `궁합 ${result.compatibility_score}점`, text: result.compatibility_type, url: shareUrl });
      } else {
        try { await navigator.clipboard.writeText(shareUrl); } catch { /* noop */ }
      }
    }
  }, [result, category]);

  if (!result) return null;

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
      <SEO title={`${category} 궁합 분석 결과`} noIndex={true} />
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
        <NavigationHeader
          title={`${CATEGORY_EMOJIS[category] || '🔮'} ${category} 궁합 분석`}
          onBack={() => navigate('/future-prediction')}
        />

        <div style={{ padding: '76px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 궁합 점수 원형 게이지 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              padding: '32px 20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <CompatibilityMeter
              score={result.compatibility_score}
              myTitle="나"
              partnerTitle="상대"
              onComplete={() => setMeterDone(true)}
            />
            {/* 궁합 유형 */}
            {meterDone && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: font,
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.primary,
                  letterSpacing: '-0.32px',
                  textAlign: 'center',
                  marginTop: 16,
                }}
              >
                {result.compatibility_type}
              </motion.p>
            )}
          </motion.div>

          {/* 공명점 (공통점) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 2.2 }}
            style={{
              padding: '20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.resonanceBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14 }}>🤝</span>
              </div>
              <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.resonance, letterSpacing: '-0.3px' }}>
                공명 포인트
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.resonance_points.map((point, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 2.4 + idx * 0.15 }}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: C.resonanceBg,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.resonance, flexShrink: 0 }}>
                    {idx + 1}.
                  </span>
                  <span style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray700, letterSpacing: '-0.28px', lineHeight: '22px' }}>
                    {point}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 마찰점 (차이점) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 3.0 }}
            style={{
              padding: '20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.frictionBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14 }}>⚡</span>
              </div>
              <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.friction, letterSpacing: '-0.3px' }}>
                마찰 포인트
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.friction_points.map((point, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 3.2 + idx * 0.15 }}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: C.frictionBg,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.friction, flexShrink: 0 }}>
                    {idx + 1}.
                  </span>
                  <span style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray700, letterSpacing: '-0.28px', lineHeight: '22px' }}>
                    {point}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 미래 시나리오 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 3.6 }}
            style={{
              padding: '20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.scenarioBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14 }}>🔮</span>
              </div>
              <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.scenario, letterSpacing: '-0.3px' }}>
                두 사람의 미래 시나리오
              </span>
            </div>
            <p style={{
              fontFamily: font,
              fontSize: 14,
              fontWeight: 400,
              color: C.gray700,
              letterSpacing: '-0.28px',
              lineHeight: '24px',
              whiteSpace: 'pre-line',
            }}>
              {result.future_scenario}
            </p>
          </motion.div>

          {/* 조언 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 3.9 }}
            style={{
              padding: '20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderLeft: `3px solid ${C.advice}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.advice, letterSpacing: '-0.3px' }}>
                관계를 위한 조언
              </span>
            </div>
            <p style={{
              fontFamily: font,
              fontSize: 14,
              fontWeight: 400,
              color: C.gray700,
              letterSpacing: '-0.28px',
              lineHeight: '24px',
              whiteSpace: 'pre-line',
            }}>
              {result.advice}
            </p>
          </motion.div>

          {/* 공유 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 4.2 }}
            style={{ display: 'flex', gap: 10 }}
          >
            <button
              onClick={handleShareKakao}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 14,
                border: '1px solid #fee500',
                backgroundColor: '#fee500',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: '#3c1e1e', letterSpacing: '-0.26px' }}>
                카카오톡 공유
              </span>
            </button>
          </motion.div>

          {/* 처음부터 다시 하기 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 4.4 }}
          >
            <button
              onClick={() => navigate('/future-prediction')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                border: `1px solid ${C.gray200}`,
                backgroundColor: C.white,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.gray600, letterSpacing: '-0.28px' }}>
                처음부터 다시 하기
              </p>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
