import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#41a09e',
  white: '#ffffff',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── 후킹 질문 Ticker 데이터 ────────────────────────────────────────────────
const HOOKING_QUESTIONS = [
  '올해 연애운은 어떨까?',
  '이직하면 잘될까, 망할까?',
  '내 재물운은 상승 중일까?',
  '시험에 합격할 수 있을까?',
  '올해 안에 연인이 생길까?',
  '투자하면 돈을 벌 수 있을까?',
  '이 관계, 계속 가도 될까?',
  '내 적성에 맞는 직업은 뭘까?',
  '올해 승진할 수 있을까?',
  '좋아하는 사람이 나를 좋아할까?',
  '주식, 지금 사도 될까?',
  '대학원 진학, 맞는 선택일까?',
  '이 사업 아이템, 성공할까?',
  '내년에는 더 나아질까?',
  '전 애인이 돌아올까?',
  '내 재능으로 돈을 벌 수 있을까?',
  '공무원 시험, 올해 붙을까?',
  '이사하면 운이 바뀔까?',
  '창업하면 잘 될까?',
  '나는 어떤 사람과 잘 맞을까?',
  '올해 하반기 운세는?',
  '취업, 언제쯤 될까?',
];

// 두 줄로 나눠서 서로 다른 속도로 스크롤
const ROW1 = HOOKING_QUESTIONS.slice(0, 11);
const ROW2 = HOOKING_QUESTIONS.slice(11);

function TickerRow({ items, duration, reverse }: { items: string[]; duration: number; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <motion.div
        animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
        style={{ display: 'flex', gap: 10, whiteSpace: 'nowrap' }}
      >
        {doubled.map((q, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(4px)',
              fontFamily: font,
              fontSize: 14,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '-0.28px',
              flexShrink: 0,
            }}
          >
            {q}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── FuturePredictionLandingPage ────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  '연애': '연애',
  '재물': '재물',
  '학업': '학업',
  '직장': '직장',
  '커리어': '커리어',
};

export function FuturePredictionLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [matchCode, setMatchCode] = useState<string | null>(null);
  const [matchCategory, setMatchCategory] = useState<string | null>(null);

  // match 파라미터 감지 → sessionStorage에 저장
  useEffect(() => {
    const match = searchParams.get('match');
    if (match) {
      sessionStorage.setItem('fp_match_code', match);
      setMatchCode(match);
      // 카테고리 조회 (get_result 모드)
      (async () => {
        try {
          const { projectId } = await import('../utils/supabase/info');
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/generate-future-compatibility`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'get_result', match_code: match }),
            }
          );
          const data = await res.json();
          if (data.success) {
            if (data.status === 'completed') {
              // 이미 분석 완료 → 바로 결과 페이지로
              sessionStorage.setItem('fp_compatibility_result', JSON.stringify(data.compatibility));
              sessionStorage.setItem('fp_compatibility_category', data.inviter_category || '');
              navigate('/future-prediction/compatibility', { replace: true });
              return;
            }
            setMatchCategory(data.category || data.inviter_category || null);
          }
        } catch { /* ignore */ }
      })();
    }
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #0f1923 0%, #1a2a3a 40%, #1e3a3a 100%)',
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ── 상단 뒤로가기 ── */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <button
            onClick={() => navigate(-1)}
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
            }}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── 헤드라인 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p style={{ fontSize: 14, fontWeight: 500, color: C.primary, fontFamily: font, letterSpacing: '-0.28px', marginBottom: 12 }}>
              {matchCode ? '궁합 분석 초대' : 'AI 미래 시뮬레이션'}
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, color: C.white, fontFamily: font, letterSpacing: '-0.52px', lineHeight: '38px' }}>
              {matchCode ? (
                <>
                  친구가 {matchCategory ? CATEGORY_LABELS[matchCategory] : ''} 궁합
                  <br />
                  분석을 초대했어요
                </>
              ) : (
                <>
                  망할지 잘될지,
                  <br />
                  미래가 궁금하세요?
                </>
              )}
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.55)', fontFamily: font, letterSpacing: '-0.3px', lineHeight: '24px', marginTop: 12 }}>
              {matchCode ? (
                <>
                  같은 테스트를 완료하면
                  <br />
                  두 사람의 궁합 결과를 볼 수 있어요
                </>
              ) : (
                <>
                  당신의 성격 유형과 사주로
                  <br />
                  AI 에이전트가 미래를 예측합니다
                </>
              )}
            </p>
          </motion.div>

          {/* ── 질문 Ticker ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 40 }}
          >
            <TickerRow items={ROW1} duration={30} />
            <TickerRow items={ROW2} duration={35} reverse />
          </motion.div>
        </div>

        {/* ── 하단 CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ padding: '0 20px 40px', flexShrink: 0 }}
        >
          <button
            onClick={() => navigate('/future-prediction/category')}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg, ${C.primary} 0%, #357f7d 100%)`,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 4px 16px rgba(65,160,158,0.3)',
            }}
          >
            <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: C.white, letterSpacing: '-0.32px' }}>
              {matchCode ? '궁합 분석 시작하기' : '미래 예측 시작하기'}
            </p>
          </button>
          <p style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.24px', textAlign: 'center', marginTop: 10 }}>
            비회원도 무료로 체험 가능
          </p>
        </motion.div>
      </div>
    </div>
  );
}
