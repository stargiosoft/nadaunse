import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';
import { generateFuturePredictionCardBlob } from '../utils/generateFuturePredictionCard';
import { projectId } from '../utils/supabase/info';
import { toast } from '../lib/toast';

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
  const [shareState, setShareState] = useState<'idle' | 'generating' | 'done'>('idle');
  const [compatState, setCompatState] = useState<'idle' | 'loading'>('idle');

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

  const handleSaveImage = useCallback(async () => {
    if (!result || shareState === 'generating') return;
    setShareState('generating');
    try {
      const blob = await generateFuturePredictionCardBlob({
        category: result.category,
        attitudeType: result.attitude.type,
        attitudeDescription: result.attitude.description,
        spectrumPosition: result.spectrum.position,
        spectrumLabel: result.spectrum.label,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `나다운세_${result.category}_미래예측.png`;
      a.click();
      URL.revokeObjectURL(url);
      setShareState('done');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      setShareState('idle');
    }
  }, [result, shareState]);

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
      const shareUrl = `${window.location.origin}/future-prediction?utm_source=share&utm_medium=kakao&utm_campaign=future_prediction`;
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: `나는 "${result.attitude.type}" — ${result.category} 미래 예측`,
          description: result.attitude.description,
          imageUrl: `${window.location.origin}/og-image.png`,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [{ title: '나도 예측해보기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
      });
    } catch {
      // 카카오 실패 시 Web Share API fallback
      const shareUrl = `${window.location.origin}/future-prediction`;
      if (navigator.share) {
        navigator.share({ title: `나는 "${result.attitude.type}"`, text: result.attitude.description, url: shareUrl });
      } else {
        try { await navigator.clipboard.writeText(shareUrl); } catch { /* noop */ }
      }
    }
  }, [result]);

  const handleCompatibility = useCallback(async () => {
    if (!result || compatState === 'loading') return;
    setCompatState('loading');
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-future-compatibility`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'create_invite',
            category: result.category,
            prediction_result: {
              attitude: result.attitude,
              spectrum: result.spectrum,
              debate: result.debate,
            },
          }),
        }
      );
      const data = await response.json();
      if (!data.success || !data.match_code) {
        toast.error('궁합 초대 생성에 실패했어요.');
        setCompatState('idle');
        return;
      }

      const matchCode = data.match_code;
      const shareUrl = `${window.location.origin}/future-prediction?match=${matchCode}`;

      // 카카오톡 공유
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
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `${result.category} 궁합 분석 초대`,
            description: `나와 ${result.category} 궁합이 얼마나 될까? 테스트하고 궁합 결과를 확인해보세요!`,
            imageUrl: `${window.location.origin}/og-image.png`,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          buttons: [{ title: '궁합 분석 참여하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
        });
      } catch {
        // 카카오 실패 시 Web Share API fallback
        if (navigator.share) {
          await navigator.share({
            title: `${result.category} 궁합 분석 초대`,
            text: `나와 ${result.category} 궁합이 얼마나 될까?`,
            url: shareUrl,
          });
        } else {
          try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('링크가 복사되었어요!');
          } catch { /* noop */ }
        }
      }
      setCompatState('idle');
    } catch {
      toast.error('오류가 발생했습니다.');
      setCompatState('idle');
    }
  }, [result, compatState]);

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

          {/* 공유 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 3.1 }}
            style={{
              display: 'flex',
              gap: 10,
            }}
          >
            <button
              onClick={handleSaveImage}
              disabled={shareState === 'generating'}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 14,
                border: `1px solid ${C.gray200}`,
                backgroundColor: C.white,
                cursor: shareState === 'generating' ? 'wait' : 'pointer',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{shareState === 'done' ? '✅' : '📷'}</span>
              <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: C.gray700, letterSpacing: '-0.26px' }}>
                {shareState === 'generating' ? '생성중...' : shareState === 'done' ? '저장됨' : '이미지 저장'}
              </span>
            </button>
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

          {/* 궁합 분석하기 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 3.15 }}
          >
            <button
              onClick={handleCompatibility}
              disabled={compatState === 'loading'}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #ef6878 0%, #f5a0ab 100%)',
                cursor: compatState === 'loading' ? 'wait' : 'pointer',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 4px 16px rgba(239,104,120,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>💕</span>
              <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, letterSpacing: '-0.3px' }}>
                {compatState === 'loading' ? '초대 링크 생성 중...' : '친구와 궁합 분석하기'}
              </span>
            </button>
            <p style={{
              fontFamily: font, fontSize: 12, fontWeight: 400, color: C.gray400,
              letterSpacing: '-0.24px', textAlign: 'center', marginTop: 8,
            }}>
              카카오톡으로 친구를 초대하고 궁합 결과를 확인하세요
            </p>
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
