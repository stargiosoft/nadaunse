import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';

// ─── Design Tokens (★DESIGN_SYSTEM★.md 기준) ────────────────────────────────
const C = {
  primary: '#48b2af',
  primaryDark: '#41a09e',
  primaryPressed: '#389998',
  primaryLight: '#f0f8f8',
  textPrimary: '#151515',
  textTertiary: '#6d6d6d',
  textCaption: '#848484',
  textDisabled: '#b7b7b7',
  surface: '#ffffff',
  surfaceSecondary: '#f9f9f9',
  surfaceTertiary: '#f3f3f3',
  border: '#e7e7e7',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── 간극 유형 ──────────────────────────────────────────────────────────────
const GAP_TYPES = [
  { min: 0, max: 20, label: '조화형', emoji: '🎵', color: '#22c55e', bgColor: '#f0fdf4', description: '성격과 운명이 같은 방향을 가리키고 있어요' },
  { min: 21, max: 34, label: '보완형', emoji: '🔄', color: '#3b82f6', bgColor: '#eff6ff', description: '약간의 차이가 있지만 서로 보완할 수 있어요' },
  { min: 35, max: 80, label: '전환형', emoji: '⚡', color: '#f59e0b', bgColor: '#fffbeb', description: '의미 있는 간극이에요. 놓치고 있는 잠재력이 있어요' },
  { min: 81, max: 100, label: '반전형', emoji: '🌊', color: '#ef4444', bgColor: '#fef2f2', description: '큰 간극이 있어요. 방향 전환이 필요할 수 있어요' },
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
  const gaugeColor = gapType.color;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={C.border}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - percentage / 100) }}
          transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
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
          style={{ fontFamily: font, fontSize: 36, fontWeight: 700, color: gaugeColor, letterSpacing: '-0.72px' }}
        >
          {percentage}%
        </motion.span>
        <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.textCaption, letterSpacing: '-0.26px' }}>
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
  risk_signals?: string[];
  peak_month?: number;
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
    <div className="bg-white fixed inset-0 flex justify-center" style={{ zIndex: 100 }}>
      <SEO title="미래 간극 분석" noIndex={true} />
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
        <NavigationHeader title="미래 간극 분석" onBack={() => navigate('/future-prediction/result')} />

        {/* 스크롤 콘텐츠 */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div style={{ padding: '68px 20px 40px' }} className="flex flex-col gap-4">
            {/* ── 헤더 ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center' }}
            >
              <p style={{ fontFamily: font, fontSize: 22, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.22px', lineHeight: '32.5px' }}>
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
                backgroundColor: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
              className="flex flex-col items-center"
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
                backgroundColor: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{gapType.emoji}</span>
                <span style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: gapType.color, letterSpacing: '-0.32px' }}>
                  {gapType.label}
                </span>
              </div>
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.textTertiary, letterSpacing: '-0.28px', lineHeight: '22px' }}>
                {result.gap_interpretation}
              </p>
            </motion.div>

            {/* ── 2열 비교 ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="flex gap-[10px]"
            >
              {/* 성격 기반 */}
              <div
                className="flex-1"
                style={{
                  padding: 16,
                  backgroundColor: C.surfaceSecondary,
                  borderRadius: 16,
                }}
              >
                <p style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: C.primaryDark, letterSpacing: '-0.24px', marginBottom: 8 }}>
                  🧠 성격 기반 미래
                </p>
                <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.textTertiary, letterSpacing: '-0.26px', lineHeight: '20px' }}>
                  {result.personality_summary}
                </p>
              </div>
              {/* 사주 기반 */}
              <div
                className="flex-1"
                style={{
                  padding: 16,
                  backgroundColor: C.surfaceSecondary,
                  borderRadius: 16,
                }}
              >
                <p style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: '#e91e63', letterSpacing: '-0.24px', marginBottom: 8 }}>
                  🔮 사주 기반 미래
                </p>
                <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.textTertiary, letterSpacing: '-0.26px', lineHeight: '20px' }}>
                  {result.saju_summary}
                </p>
              </div>
            </motion.div>

            {/* ── 위험 신호 ── */}
            {result.risk_signals && result.risk_signals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                style={{
                  padding: '20px',
                  backgroundColor: '#fef2f2',
                  borderRadius: 16,
                  border: '1px solid #fecaca',
                }}
              >
                <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: '#dc2626', letterSpacing: '-0.28px', marginBottom: 12 }}>
                  ⚠️ 당신에게 감지된 간극 신호
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.risk_signals.map((signal, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: '#ef4444', flexShrink: 0 }}>{i + 1}.</span>
                      <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: '#7f1d1d', letterSpacing: '-0.26px', lineHeight: '20px' }}>
                        {signal}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── 타이밍 맵 미리보기 (잠금) ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              style={{
                padding: '20px',
                backgroundColor: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.28px', marginBottom: 14 }}>
                📅 당신의 타이밍 맵 <span style={{ fontSize: 12, fontWeight: 400, color: C.textCaption }}>(미리보기)</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => {
                  const peak = result.peak_month || 8;
                  const now = new Date().getMonth() + 1;
                  const months = Array.from({ length: 6 }, (_, i) => {
                    const m = ((now - 1 + i) % 12) + 1;
                    const isPeak = m === peak;
                    const dist = Math.abs(m - peak);
                    const level = isPeak ? 6 : dist <= 1 ? 5 : dist <= 2 ? 3 : dist <= 3 ? 2 : 1;
                    const isLocked = i > 0;
                    return { month: m, level, isPeak, isLocked };
                  });
                  return months.map(({ month, level, isPeak, isLocked }) => (
                    <div key={month} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: C.textTertiary, width: 32, textAlign: 'right' }}>
                        {month}월
                      </span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.surfaceTertiary, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(level / 6) * 100}%`,
                          height: '100%',
                          borderRadius: 4,
                          backgroundColor: isLocked ? C.textDisabled : isPeak ? '#f59e0b' : C.primary,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span style={{ fontFamily: font, fontSize: 11, fontWeight: 500, color: isPeak && !isLocked ? '#f59e0b' : C.textCaption, width: 64, textAlign: 'left' }}>
                        {isLocked ? '🔒' : isPeak ? '절정기 🔥' : month === new Date().getMonth() + 1 ? '현재' : ''}
                      </span>
                    </div>
                  ));
                })()}
              </div>
              <p style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.textCaption, letterSpacing: '-0.22px', marginTop: 10, textAlign: 'center' }}>
                리포트에서 12개월 전체 타이밍을 확인하세요
              </p>
            </motion.div>

            {/* ── 후킹 멘트 + 리포트 목차 ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1 }}
              style={{
                padding: '20px',
                backgroundColor: C.surface,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.3px', lineHeight: '24px', marginBottom: 6, textAlign: 'center' }}>
                이 간극을 방치한 사람의 <span style={{ color: '#ef4444', fontWeight: 700 }}>80%</span>가<br /><span style={{ color: '#ef4444', fontWeight: 700 }}>1년</span> 안에 같은 실수를 반복했어요
              </p>
              <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.textCaption, letterSpacing: '-0.26px', lineHeight: '20px', marginBottom: 16, textAlign: 'center' }}>
                딱 3분이면 나만의 대응 전략을 받을 수 있어요
              </p>

              {/* 리포트 목차 */}
              <div style={{ padding: '14px 16px', backgroundColor: C.surfaceSecondary, borderRadius: 12 }}>
                <p style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.textPrimary, letterSpacing: '-0.26px', marginBottom: 10 }}>
                  📋 맞춤 대응 리포트에 포함된 내용
                </p>
                {[
                  '12개월 타이밍 가이드 (절정기는 언제?)',
                  '나만의 행동 처방전 3가지',
                  '위험 시그널 & 회피 전략',
                  '100일 액션 플랜 (체크리스트)',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: i < 3 ? 6 : 0 }}>
                    <span style={{ color: C.primary, fontSize: 13 }}>✓</span>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.textTertiary, letterSpacing: '-0.26px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── 하단 고정 CTA ── */}
        <div
          className="shrink-0"
          style={{
            padding: '12px 20px',
            backgroundColor: C.surface,
            boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
          }}
        >
          <button
            onClick={() => {
              // TODO: 결제 플로우 연결
            }}
            className="w-full flex items-center justify-center"
            style={{
              height: 56,
              borderRadius: 16,
              border: 'none',
              backgroundColor: C.primary,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.backgroundColor = C.primaryPressed; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.backgroundColor = C.primary; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.backgroundColor = C.primary; }}
          >
            <span style={{ fontFamily: font, fontSize: 16, fontWeight: 500, lineHeight: '25px', letterSpacing: '-0.32px', color: C.surface }}>
              맞춤 대응 리포트 보러가기
            </span>
          </button>
          <button
            onClick={() => navigate('/future-prediction')}
            className="w-full flex items-center justify-center"
            style={{
              height: 44,
              marginTop: 8,
              borderRadius: 16,
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontFamily: font, fontSize: 14, fontWeight: 500, letterSpacing: '-0.28px', color: C.textCaption }}>
              처음부터 다시 하기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
