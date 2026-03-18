import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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

// ─── 간극 유형 ──────────────────────────────────────────────────────────────
const GAP_TYPES = [
  { min: 0, max: 25, label: '조화형', emoji: '🎵', color: '#22c55e', bgColor: '#f0fdf4', description: '성격과 운명이 같은 방향을 가리키고 있어요' },
  { min: 26, max: 50, label: '보완형', emoji: '🔄', color: '#3b82f6', bgColor: '#eff6ff', description: '약간의 차이가 있지만 서로 보완할 수 있어요' },
  { min: 51, max: 75, label: '전환형', emoji: '⚡', color: '#f59e0b', bgColor: '#fffbeb', description: '의미 있는 간극이에요. 놓치고 있는 잠재력이 있어요' },
  { min: 76, max: 100, label: '반전형', emoji: '🌊', color: '#ef4444', bgColor: '#fef2f2', description: '큰 간극이 있어요. 방향 전환이 필요할 수 있어요' },
] as const;

function getGapType(percentage: number) {
  return GAP_TYPES.find(t => percentage >= t.min && percentage <= t.max) || GAP_TYPES[0];
}

// ─── 원형 게이지 SVG ────────────────────────────────────────────────────────
function CircularGauge({ percentage }: { percentage: number }) {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapType = getGapType(percentage);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={C.gray200}
          strokeWidth={strokeWidth}
        />
        {/* 게이지 arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gapType.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percentage / 100) }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontFamily: font, fontSize: 36, fontWeight: 700, color: gapType.color, letterSpacing: '-0.72px' }}
        >
          {percentage}%
        </motion.span>
        <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray600, letterSpacing: '-0.26px' }}>
          간극 지수
        </span>
      </div>
    </div>
  );
}

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface GapResult {
  gap_percentage: number;
  gap_type: string;
  personality_summary: string;
  saju_summary: string;
  gap_interpretation: string;
  hook_message: string;
}

// ─── FuturePredictionGapPage ────────────────────────────────────────────────
export function FuturePredictionGapPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<GapResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('future_gap_result');
    if (!stored) {
      navigate('/future-prediction', { replace: true });
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      navigate('/future-prediction', { replace: true });
    }
  }, [navigate]);

  if (!result) return null;

  const gapType = getGapType(result.gap_percentage);

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
      <SEO title="미래 간극 분석" noIndex={true} />
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
        <NavigationHeader title="미래 간극 분석" onBack={() => navigate('/future-prediction/result')} />

        <div style={{ padding: '76px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ── 헤더 ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '0 8px' }}
          >
            <p style={{ fontFamily: font, fontSize: 20, fontWeight: 700, color: C.black, letterSpacing: '-0.4px', lineHeight: '30px' }}>
              성격 vs 사주, 당신의 미래 간극은?
            </p>
          </motion.div>

          {/* ── 원형 게이지 ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              padding: '28px 20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <CircularGauge percentage={result.gap_percentage} />
          </motion.div>

          {/* ── 간극 유형 카드 ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              padding: '20px',
              backgroundColor: gapType.bgColor,
              borderRadius: 16,
              borderLeft: `4px solid ${gapType.color}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{gapType.emoji}</span>
              <span style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: gapType.color, letterSpacing: '-0.32px' }}>
                {gapType.label}
              </span>
            </div>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray700, letterSpacing: '-0.28px', lineHeight: '22px' }}>
              {result.gap_interpretation}
            </p>
          </motion.div>

          {/* ── 2열 비교 ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            style={{ display: 'flex', gap: 10 }}
          >
            {/* 성격 기반 */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: C.white,
                borderRadius: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                borderTop: `3px solid ${C.primary}`,
              }}
            >
              <p style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.primary, letterSpacing: '-0.24px', marginBottom: 8 }}>
                🧠 성격 기반 미래
              </p>
              <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray700, letterSpacing: '-0.26px', lineHeight: '20px' }}>
                {result.personality_summary}
              </p>
            </div>
            {/* 사주 기반 */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: C.white,
                borderRadius: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                borderTop: '3px solid #e91e63',
              }}
            >
              <p style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: '#e91e63', letterSpacing: '-0.24px', marginBottom: 8 }}>
                🔮 사주 기반 미래
              </p>
              <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray700, letterSpacing: '-0.26px', lineHeight: '20px' }}>
                {result.saju_summary}
              </p>
            </div>
          </motion.div>

          {/* ── 후킹 멘트 + CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            style={{
              padding: '20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.black, letterSpacing: '-0.3px', lineHeight: '24px', marginBottom: 16 }}>
              {result.hook_message}
            </p>
            <button
              onClick={() => {
                // TODO: 결제 플로우 연결
              }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 4px 16px rgba(65,160,158,0.3)',
              }}
            >
              <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, letterSpacing: '-0.3px' }}>
                맞춤 대응 리포트 구매하기
              </p>
            </button>
          </motion.div>

          {/* ── 다시 하기 ── */}
          <button
            onClick={() => navigate('/future-prediction')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: `1.5px solid ${C.gray200}`,
              backgroundColor: C.white,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 500, color: C.gray700, letterSpacing: '-0.28px' }}>
              처음부터 다시 하기
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
