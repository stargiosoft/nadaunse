import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';

const NebulaOntologyGraph = lazy(() =>
  import('../components/NebulaOntologyGraph').then(m => ({ default: m.NebulaOntologyGraph }))
);

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
  optimist: '#4CAF50',
  optimistBg: '#f1f8f1',
  realist: '#2196F3',
  realistBg: '#f0f6ff',
  pessimist: '#FF9800',
  pessimistBg: '#fff8e1',
  conclusionBg: '#f8f5ff',
  conclusion: '#7c3aed',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface OntologyNode {
  id: string;
  label: string;
  type: string;
  group: string;
}

interface OntologyEdge {
  from: string;
  to: string;
  relation: string;
}

interface PredictionResult {
  id: string;
  category: string;
  attitude: { score: number; type: string; description: string };
  ontology: { center: string; nodes: OntologyNode[]; edges: OntologyEdge[] };
  spectrum: { category: string; position: number; label: string; summary: string };
  debate: { optimist: string; realist: string; pessimist: string; conclusion: string };
  is_paid: boolean;
  created_at: string;
}

// ─── SpectrumBar 컴포넌트 ───────────────────────────────────────────────────
function FutureSpectrumBar({ position, label, summary }: { position: number; label: string; summary: string }) {
  const percentage = position * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      style={{
        padding: '20px',
        backgroundColor: C.white,
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: '#FF5722', letterSpacing: '-0.24px' }}>파극</span>
        <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.primary, letterSpacing: '-0.26px' }}>{label}</span>
        <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: C.optimist, letterSpacing: '-0.24px' }}>대성</span>
      </div>

      <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'linear-gradient(to right, #FF5722, #FF9800, #FFC107, #8BC34A, #4CAF50)' }}>
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 1, delay: 1, type: 'spring', stiffness: 60 }}
          style={{
            position: 'absolute',
            top: -6,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: C.white,
            border: `3px solid ${C.primary}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray700, letterSpacing: '-0.28px', lineHeight: '22px', marginTop: 16, textAlign: 'center' }}>
        {summary}
      </p>
    </motion.div>
  );
}

// ─── ChatBubbleDebate 컴포넌트 (채팅형 토론) ────────────────────────────────
function ChatBubbleDebate({ debate }: { debate: PredictionResult['debate'] }) {
  const agents = [
    { key: 'optimist', emoji: '😊', name: '낙관이', text: debate.optimist, color: C.optimist, bg: C.optimistBg, side: 'left' as const },
    { key: 'pessimist', emoji: '😟', name: '비관이', text: debate.pessimist, color: C.pessimist, bg: C.pessimistBg, side: 'left' as const },
    { key: 'realist', emoji: '🧐', name: '현실이', text: debate.realist, color: C.realist, bg: C.realistBg, side: 'right' as const },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {agents.map((agent, idx) => (
        <motion.div
          key={agent.key}
          initial={{ opacity: 0, x: agent.side === 'left' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1.2 + idx * 0.5 }}
          style={{
            display: 'flex',
            flexDirection: agent.side === 'right' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          {/* 아바타 */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: agent.bg,
              border: `2px solid ${agent.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {agent.emoji}
          </div>

          {/* 말풍선 */}
          <div style={{ maxWidth: '75%' }}>
            <span
              style={{
                fontFamily: font,
                fontSize: 12,
                fontWeight: 600,
                color: agent.color,
                letterSpacing: '-0.24px',
                display: 'block',
                marginBottom: 4,
                textAlign: agent.side === 'right' ? 'right' : 'left',
              }}
            >
              {agent.name}
            </span>
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: agent.bg,
                borderRadius: agent.side === 'left' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray700, letterSpacing: '-0.28px', lineHeight: '22px' }}>
                {agent.text}
              </p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* 종합 결론 (전폭) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2.7 }}
        style={{
          padding: '16px',
          backgroundColor: C.conclusionBg,
          borderRadius: 16,
          borderLeft: `3px solid ${C.conclusion}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>📋</span>
          <span style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.conclusion, letterSpacing: '-0.28px' }}>종합 결론</span>
        </div>
        <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray700, letterSpacing: '-0.28px', lineHeight: '22px' }}>
          {debate.conclusion}
        </p>
      </motion.div>
    </div>
  );
}

// ─── FuturePredictionResultPage ─────────────────────────────────────────────
export function FuturePredictionResultPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('future_prediction_result');
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

  const CATEGORY_EMOJIS: Record<string, string> = {
    '연애': '💕',
    '재물': '💰',
    '학업': '📚',
    '직장': '💼',
    '커리어': '🚀',
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
      <SEO title={`${result.category} 미래 예측 결과`} noIndex={true} />
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
          title={`${CATEGORY_EMOJIS[result.category] || '🔮'} ${result.category} 미래 예측`}
          onBack={() => navigate('/future-prediction')}
        />

        <div style={{ padding: '76px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 태도 유형 배지 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              padding: '16px 20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ padding: '6px 12px', backgroundColor: C.primaryLight, borderRadius: 8 }}>
              <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.primary, letterSpacing: '-0.26px' }}>
                {result.attitude.type}
              </span>
            </div>
            <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray700, letterSpacing: '-0.26px', flex: 1 }}>
              {result.attitude.description}
            </p>
          </motion.div>

          {/* 온톨로지 네뷸러 그래프 */}
          <div>
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.black, letterSpacing: '-0.3px', marginBottom: 8, paddingLeft: 4 }}>
              나의 성향 관계도
            </p>
            <Suspense fallback={<div className="flex items-center justify-center" style={{ height: 380, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13 }}>3D 그래프 로딩중...</div>}>
              <NebulaOntologyGraph
                center={result.ontology.center}
                nodes={result.ontology.nodes}
                edges={result.ontology.edges || []}
              />
            </Suspense>
          </div>

          {/* 스펙트럼 바 */}
          <div>
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.black, letterSpacing: '-0.3px', marginBottom: 8, paddingLeft: 4 }}>
              미래 흐름 스펙트럼
            </p>
            <FutureSpectrumBar position={result.spectrum.position} label={result.spectrum.label} summary={result.spectrum.summary} />
          </div>

          {/* AI 에이전트 토론 (채팅형) */}
          <div>
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.black, letterSpacing: '-0.3px', marginBottom: 8, paddingLeft: 4 }}>
              AI 에이전트 토론
            </p>
            <ChatBubbleDebate debate={result.debate} />
          </div>

          {/* 학술 기반 뱃지 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 3.0 }}
            style={{
              padding: '12px 16px',
              backgroundColor: C.white,
              borderRadius: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path d="M8 1l2 2.5H13l-1 3L14 9l-2.5 1L10 12.5 8 11l-2 1.5L4.5 10 2 9l2-2.5-1-3h3L8 1z" fill="#3f51b5" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: '#3f51b5', letterSpacing: '-0.24px' }}>
                IPIP-HEXACO 성격 모델 기반 분석
              </p>
              <p style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray600, letterSpacing: '-0.22px', marginTop: 1 }}>
                학술적으로 검증된 성격심리학 프레임워크 결합
              </p>
            </div>
          </motion.div>

          {/* 후킹 멘트 + 다음 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 3.2 }}
            style={{
              padding: '20px',
              backgroundColor: C.white,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: C.black, letterSpacing: '-0.32px', lineHeight: '26px', marginBottom: 16 }}>
              내 사주는 어떤 미래를
              <br />
              그리고 있을까?
            </p>
            <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray600, letterSpacing: '-0.26px', lineHeight: '20px', marginBottom: 20 }}>
              성격 기반 예측과 사주 기반 예측 사이의
              <br />
              간극을 분석해보세요
            </p>
            <button
              onClick={() => navigate('/future-prediction/saju-input')}
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
                다음
              </p>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
