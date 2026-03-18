import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Sparkles, Lock, Eye, MessageCircle, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react';
import SEO from './SEO';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const font = "'Pretendard Variable', sans-serif";

const C = {
  primary: '#48b2af',
  primaryAccent: '#41a09e',
  primaryLight: '#f0f8f8',
  primaryDark: '#368683',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#f7f8f9',
  cardBg: '#ffffff',
  cardBorder: '#f3f3f3',
  white: '#ffffff',
  love: '#ef6878',
  loveBg: '#fff6f7',
  money: '#f5a623',
  moneyBg: '#fff9f0',
  career: '#4590d6',
  careerBg: '#f0f6ff',
  health: '#8b5cf6',
  healthBg: '#f5f3ff',
  relation: '#41a09e',
  relationBg: '#f0f8f8',
} as const;

const CATEGORY_META: Record<string, { label: string; color: string; bgColor: string }> = {
  love: { label: '연애', color: C.love, bgColor: C.loveBg },
  money: { label: '재물', color: C.money, bgColor: C.moneyBg },
  career: { label: '커리어', color: C.career, bgColor: C.careerBg },
  health: { label: '건강', color: C.health, bgColor: C.healthBg },
  relation: { label: '인간관계', color: C.relation, bgColor: C.relationBg },
};

const ALL_CATEGORIES = ['love', 'money', 'career', 'health', 'relation'];

// ─── Mock Result (MVP에서는 AI 응답으로 교체) ────────────────────────────────

interface OntologyNode {
  label: string;
  type: 'attitude' | 'saju' | 'hexaco' | 'nadaum';
  relation: string;
}

interface DebateResult {
  optimist: string;
  realist: string;
  pessimist: string;
  conclusion: string;
}

interface PredictionResult {
  category: string;
  spectrumPosition: number; // 0~1 (0=파극, 1=대성)
  spectrumLabel: string;
  summary: string;
  ontologyCenter: string;
  ontologyNodes: OntologyNode[];
  debate: DebateResult;
}

function generateMockResult(category: string, score: number): PredictionResult {
  const position = Math.min(1, Math.max(0, (score - 5) / 10));
  const labels = ['정체기', '전환 초입', '전환기 진입', '성장 궤도', '상승 국면'];
  const labelIdx = Math.min(4, Math.floor(position * 5));

  const debates: Record<string, DebateResult> = {
    love: {
      optimist: '현재 애착 패턴만 인식하면 하반기에 좋은 만남이 가능해요. 당신의 감성적 깊이가 큰 무기입니다.',
      realist: '자기이해가 먼저 필요한 시기예요. 무리한 만남보다는 내면 정리에 집중하는 게 현명합니다.',
      pessimist: '올해는 내면 정리의 시기입니다. 급한 만남은 오히려 상처가 될 수 있어요.',
      conclusion: '하반기 전환점을 위해 상반기에 자기이해에 집중하는 게 유리합니다.',
    },
    money: {
      optimist: '재물 흐름이 상승 전환 중이에요. 하반기에 뜻밖의 수입 기회가 보입니다.',
      realist: '현재 소비 패턴을 점검할 시기입니다. 작은 절약이 큰 차이를 만들어요.',
      pessimist: '큰 투자보다는 안정적인 저축에 집중하세요. 리스크 관리가 핵심입니다.',
      conclusion: '상반기는 기반 다지기, 하반기에 기회를 잡을 수 있는 흐름이에요.',
    },
    career: {
      optimist: '전문성을 살린 도약의 기회가 오고 있어요. 준비된 자에게 기회가 옵니다.',
      realist: '현재 포지션에서 실력을 쌓는 게 우선이에요. 이직보다는 내실을 다지세요.',
      pessimist: '무리한 변화보다는 현재 위치에서 안정감을 찾는 게 현명합니다.',
      conclusion: '꾸준한 실력 축적이 하반기 도약의 발판이 됩니다.',
    },
    health: {
      optimist: '건강 습관을 잡기 좋은 시기예요. 작은 변화가 큰 효과를 가져올 거예요.',
      realist: '스트레스 관리에 신경 쓸 때입니다. 수면과 식습관 점검이 필요해요.',
      pessimist: '과로에 주의하세요. 몸의 신호를 무시하면 하반기에 문제가 생길 수 있어요.',
      conclusion: '상반기에 건강 루틴을 잡으면 하반기가 편안해집니다.',
    },
    relation: {
      optimist: '소통 능력이 빛을 발할 시기예요. 새로운 인맥이 좋은 기회로 연결됩니다.',
      realist: '핵심 관계에 집중하는 게 좋아요. 넓은 인맥보다 깊은 관계가 중요합니다.',
      pessimist: '에너지를 빼앗는 관계는 정리가 필요해요. 모든 관계를 유지하려 하지 마세요.',
      conclusion: '진정성 있는 관계에 집중하면 자연스럽게 좋은 인연이 모입니다.',
    },
  };

  const nodes: OntologyNode[] = [
    { label: '감성 우세', type: 'hexaco', relation: 'CHARACTERIZES' },
    { label: position > 0.5 ? '안정형 태도' : '탐색형 태도', type: 'attitude', relation: 'TENDS_TO' },
    { label: '편관 기질', type: 'saju', relation: 'INFLUENCES' },
    { label: '섬세한', type: 'nadaum', relation: 'IDENTIFIED_AS' },
    { label: '공감 능력', type: 'nadaum', relation: 'IDENTIFIED_AS' },
  ];

  return {
    category,
    spectrumPosition: position,
    spectrumLabel: labels[labelIdx],
    summary: debates[category]?.conclusion || '현재 흐름을 잘 활용하면 좋은 결과가 기다리고 있어요.',
    ontologyCenter: '탐구하는 감성인',
    ontologyNodes: nodes,
    debate: debates[category] || debates.love,
  };
}

// ─── Ontology Graph (SVG) ─────────────────────────────────────────────────────

function OntologyGraph({ center, nodes, color }: { center: string; nodes: OntologyNode[]; color: string }) {
  const typeColors: Record<string, string> = {
    attitude: '#ef6878',
    saju: '#f5a623',
    hexaco: '#4590d6',
    nadaum: '#41a09e',
  };
  const typeLabels: Record<string, string> = {
    attitude: '태도',
    saju: '사주',
    hexaco: '성향',
    nadaum: '나다움',
  };

  const cx = 160, cy = 140;
  const radius = 95;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg width="320" height="280" viewBox="0 0 320 280">
        {/* 연결선 */}
        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const nx = cx + Math.cos(angle) * radius;
          const ny = cy + Math.sin(angle) * radius;
          return (
            <motion.line
              key={`line-${i}`}
              x1={cx} y1={cy} x2={nx} y2={ny}
              stroke={typeColors[node.type] || C.gray200}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity={0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
            />
          );
        })}

        {/* 노드 */}
        {nodes.map((node, i) => {
          const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
          const nx = cx + Math.cos(angle) * radius;
          const ny = cy + Math.sin(angle) * radius;
          const nc = typeColors[node.type] || C.gray400;

          return (
            <motion.g
              key={`node-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              style={{ transformOrigin: `${nx}px ${ny}px` }}
            >
              <rect
                x={nx - 42} y={ny - 18}
                width="84" height="36"
                rx="12"
                fill={C.white}
                stroke={nc}
                strokeWidth="1.2"
              />
              <text
                x={nx} y={ny - 3}
                textAnchor="middle"
                style={{ fontFamily: font, fontSize: '10px', fontWeight: 500, fill: C.gray600 }}
              >
                {typeLabels[node.type]}
              </text>
              <text
                x={nx} y={ny + 11}
                textAnchor="middle"
                style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, fill: nc }}
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}

        {/* 중앙 노드 */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <circle cx={cx} cy={cy} r="36" fill={color} />
          <circle cx={cx} cy={cy} r="36" fill="none" stroke={C.white} strokeWidth="2" opacity={0.3} />
          <text
            x={cx} y={cy - 4}
            textAnchor="middle"
            style={{ fontFamily: font, fontSize: '10px', fontWeight: 400, fill: 'rgba(255,255,255,0.8)' }}
          >
            나
          </text>
          <text
            x={cx} y={cy + 11}
            textAnchor="middle"
            style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, fill: C.white }}
          >
            {center.length > 7 ? center.slice(0, 7) + '..' : center}
          </text>
        </motion.g>
      </svg>
    </div>
  );
}

// ─── Spectrum Bar ─────────────────────────────────────────────────────────────

function FutureSpectrumBar({ position, label, color }: { position: number; label: string; color: string }) {
  const pct = Math.max(2, Math.min(98, position * 100));

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
        <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: C.gray600 }}>
          파극
        </span>
        <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: C.gray600 }}>
          대성
        </span>
      </div>
      <div style={{ position: 'relative', height: '8px', backgroundColor: '#f0f0f3', borderRadius: '4px', overflow: 'visible' }}>
        {/* 그라디언트 트랙 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '4px',
          background: `linear-gradient(90deg, ${C.gray200} 0%, ${color}40 50%, ${color} 100%)`,
          opacity: 0.5,
        }} />
        {/* 포인터 */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${pct}%` }}
          transition={{ duration: 1, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: color,
            border: `3px solid ${C.white}`,
            boxShadow: `0 2px 8px ${color}50`,
          }}
        />
      </div>
      {/* 라벨 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex items-center justify-center"
        style={{ marginTop: '14px' }}
      >
        <div
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: `${color}12`,
            border: `1px solid ${color}25`,
          }}
        >
          <span style={{
            fontFamily: font,
            fontSize: '13px',
            fontWeight: 600,
            color: color,
          }}>
            {label}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Agent Debate ─────────────────────────────────────────────────────────────

function AgentDebate({ debate, color }: { debate: DebateResult; color: string }) {
  const agents = [
    { key: 'optimist', label: '낙관이', icon: TrendingUp, color: '#22c55e', bgColor: '#f0fdf4' },
    { key: 'realist', label: '현실이', icon: Minus, color: '#f5a623', bgColor: '#fffbeb' },
    { key: 'pessimist', label: '비관이', icon: TrendingDown, color: '#ef4444', bgColor: '#fef2f2' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {agents.map((agent, i) => {
        const IconComp = agent.icon;
        const text = debate[agent.key as keyof DebateResult];
        return (
          <motion.div
            key={agent.key}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.8 + i * 0.15 }}
            style={{
              display: 'flex',
              gap: '10px',
              padding: '14px',
              backgroundColor: agent.bgColor,
              borderRadius: '14px',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: `${agent.color}18`,
              }}
            >
              <IconComp size={16} style={{ color: agent.color }} strokeWidth={2} />
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <span style={{
                fontFamily: font,
                fontSize: '12px',
                fontWeight: 600,
                color: agent.color,
              }}>
                {agent.label}
              </span>
              <p style={{
                fontFamily: font,
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '21px',
                letterSpacing: '-0.28px',
                color: C.black,
                marginTop: '4px',
              }}>
                {text}
              </p>
            </div>
          </motion.div>
        );
      })}

      {/* 결론 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        style={{
          padding: '16px',
          backgroundColor: `${color}08`,
          borderRadius: '14px',
          border: `1px solid ${color}20`,
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
        }}
      >
        <MessageCircle size={18} style={{ color, marginTop: '2px', flexShrink: 0 }} strokeWidth={1.8} />
        <div>
          <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, color }}>
            종합 결론
          </span>
          <p style={{
            fontFamily: font,
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '21px',
            letterSpacing: '-0.28px',
            color: C.black,
            marginTop: '4px',
          }}>
            {debate.conclusion}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Locked Category Card ─────────────────────────────────────────────────────

function LockedCategoryCard({ catKey }: { catKey: string }) {
  const meta = CATEGORY_META[catKey];
  if (!meta) return null;

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#fafafa',
        borderRadius: '14px',
        border: `1px solid ${C.cardBorder}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 블러 오버레이 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
        <div className="flex items-center gap-2">
          <Lock size={14} style={{ color: C.gray400 }} strokeWidth={2} />
          <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.gray600 }}>
            {meta.label} 예측 잠금
          </span>
        </div>
      </div>

      {/* 블러 내용물 (장식용) */}
      <div style={{ opacity: 0.3 }}>
        <div style={{ height: '6px', backgroundColor: '#e5e5e5', borderRadius: '3px', marginBottom: '10px' }} />
        <div className="flex items-center justify-between">
          <div style={{ height: '4px', width: '60px', backgroundColor: '#e5e5e5', borderRadius: '2px' }} />
          <div style={{ height: '4px', width: '60px', backgroundColor: '#e5e5e5', borderRadius: '2px' }} />
        </div>
        <div style={{ height: '20px' }} />
        <div style={{ height: '4px', width: '100%', backgroundColor: '#e5e5e5', borderRadius: '2px' }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FutureResultPage() {
  const navigate = useNavigate();
  const category = sessionStorage.getItem('future_category') || 'love';
  const score = Number(sessionStorage.getItem('future_score') || '8');
  const meta = CATEGORY_META[category] || CATEGORY_META.love;

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // MVP: Mock 데이터 (추후 Edge Function 호출로 교체)
    const timer = setTimeout(() => {
      setResult(generateMockResult(category, score));
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [category, score]);

  const lockedCategories = ALL_CATEGORIES.filter(c => c !== category);

  // ─── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.white }}>
        <div className="w-full max-w-[440px] h-full flex flex-col items-center justify-center" style={{ padding: '0 40px' }}>
          {/* 로딩 스피너 */}
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `3px solid #f0f8f8`,
              borderTopColor: C.primary,
              animation: 'spin 0.8s linear infinite',
              marginBottom: '24px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{
            fontFamily: font, fontSize: '18px', fontWeight: 600,
            lineHeight: '28px', letterSpacing: '-0.36px', color: C.black,
            textAlign: 'center',
          }}>
            미래를 예측하고 있어요
          </p>
          <p style={{
            fontFamily: font, fontSize: '13px', fontWeight: 400,
            color: C.gray600, marginTop: '8px',
          }}>
            잠시만 기다려주세요
          </p>

          {/* 에이전트 표시 */}
          <div className="flex items-center gap-2" style={{ marginTop: '24px' }}>
            {[
              { label: '낙관이', c: '#22c55e' },
              { label: '현실이', c: '#f5a623' },
              { label: '비관이', c: '#ef4444' },
            ].map((agent, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                className="flex items-center gap-1"
                style={{ padding: '4px 10px', borderRadius: 20, backgroundColor: '#f7f8f9' }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: agent.c }} />
                <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 500, color: C.gray700 }}>
                  {agent.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  // ─── Result ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex justify-center" style={{ backgroundColor: C.bg }}>
      <div ref={scrollRef} className="w-full max-w-[440px] relative h-full overflow-y-auto overflow-x-hidden overscroll-y-contain">
        <SEO title={`${meta.label} 미래 예측 결과 | 나다운세`} description="AI 미래 시뮬레이션 결과" />

        {/* ─── Header ───────────────────────────────────────── */}
        <div
          className="shrink-0"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            backgroundColor: C.bg,
            padding: '4px 12px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <button
            onClick={() => navigate('/future')}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              border: 'none', backgroundColor: 'transparent',
              transition: 'background-color 0.15s ease',
            }}
            onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
            onPointerUp={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <ChevronLeft size={24} style={{ color: C.gray600 }} strokeWidth={1.7} />
          </button>
          <span style={{
            fontFamily: font, fontSize: '16px', fontWeight: 600,
            letterSpacing: '-0.32px', color: C.black,
          }}>
            {meta.label} 미래 예측
          </span>
          <div className="flex-1" />
          <button
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              border: 'none', backgroundColor: 'transparent',
            }}
          >
            <Share2 size={20} style={{ color: C.gray600 }} strokeWidth={1.7} />
          </button>
        </div>

        <div style={{ padding: '0 20px 120px' }}>

          {/* ─── 1. 온톨로지 관계도 ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              backgroundColor: C.cardBg,
              borderRadius: '16px',
              border: `1px solid ${C.cardBorder}`,
              padding: '20px 16px',
              marginBottom: '12px',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
              <Eye size={16} style={{ color: meta.color }} strokeWidth={1.8} />
              <span style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: C.black, letterSpacing: '-0.28px' }}>
                나의 성향 관계도
              </span>
            </div>
            <p style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: C.gray600, marginBottom: '12px' }}>
              사주 + 나다움 + 태도가 어떻게 연결되어 있는지
            </p>
            <OntologyGraph
              center={result.ontologyCenter}
              nodes={result.ontologyNodes}
              color={meta.color}
            />
          </motion.div>

          {/* ─── 2. 스펙트럼 바 ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              backgroundColor: C.cardBg,
              borderRadius: '16px',
              border: `1px solid ${C.cardBorder}`,
              padding: '20px',
              marginBottom: '12px',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
              <Sparkles size={16} style={{ color: meta.color }} strokeWidth={1.8} />
              <span style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: C.black, letterSpacing: '-0.28px' }}>
                {meta.label} 흐름 스펙트럼
              </span>
            </div>
            <FutureSpectrumBar
              position={result.spectrumPosition}
              label={result.spectrumLabel}
              color={meta.color}
            />
            <p style={{
              fontFamily: font, fontSize: '14px', fontWeight: 400, lineHeight: '22px',
              letterSpacing: '-0.28px', color: C.gray700, marginTop: '16px', textAlign: 'center',
            }}>
              {result.summary}
            </p>
          </motion.div>

          {/* ─── 3. AI 에이전트 토론 ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{
              backgroundColor: C.cardBg,
              borderRadius: '16px',
              border: `1px solid ${C.cardBorder}`,
              padding: '20px',
              marginBottom: '12px',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
              <MessageCircle size={16} style={{ color: meta.color }} strokeWidth={1.8} />
              <span style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: C.black, letterSpacing: '-0.28px' }}>
                AI 에이전트 토론
              </span>
            </div>
            <AgentDebate debate={result.debate} color={meta.color} />
          </motion.div>

          {/* ─── 4. 잠긴 카테고리 (FOMO) ────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ marginBottom: '16px' }}
          >
            <p style={{
              fontFamily: font, fontSize: '14px', fontWeight: 600,
              letterSpacing: '-0.28px', color: C.black, marginBottom: '10px',
            }}>
              나머지 카테고리도 궁금하다면
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lockedCategories.map(catKey => (
                <LockedCategoryCard key={catKey} catKey={catKey} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─── 하단 CTA ─────────────────────────────────────── */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] pointer-events-auto"
          style={{
            backgroundColor: C.white,
            boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
          }}
        >
          <div style={{ padding: '12px 20px' }}>
            <button
              onClick={() => {
                // TODO: 결제 플로우
              }}
              className="w-full flex items-center justify-center cursor-pointer"
              style={{
                height: '56px',
                borderRadius: '16px',
                backgroundColor: C.primaryAccent,
                border: 'none',
                transition: 'all 0.15s ease',
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.99)';
                e.currentTarget.style.backgroundColor = C.primary;
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = C.primaryAccent;
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = C.primaryAccent;
              }}
            >
              <span style={{
                fontFamily: font,
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '25px',
                letterSpacing: '-0.32px',
                color: C.white,
              }}>
                전체 카테고리 열기 · 15새싹
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
