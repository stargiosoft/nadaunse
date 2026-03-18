import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Lottie from 'lottie-react';
import lottieData from '../imports/animated-shape-effect.json';
import { supabase, getAuthUser } from '../lib/supabase';
import { toast } from '../lib/toast';
import { projectId } from '../utils/supabase/info';
import SEO from '../components/SEO';
import svgPaths from '../imports/svg-97glg550pf';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  black: '#151515',
  gray600: '#848484',
  white: '#ffffff',
  primary: '#41a09e',
} as const;

const font = "'Pretendard Variable', sans-serif";

const LOADING_MESSAGES_PREDICTION = [
  'AI가 당신의 미래를 시뮬레이션하고 있어요',
  '3명의 에이전트가 토론 중이에요',
  '성향 데이터와 태그를 분석하고 있어요',
  '거의 다 됐어요, 조금만 기다려주세요',
];

const LOADING_MESSAGES_GAP = [
  '사주 데이터를 분석하고 있어요',
  '성격 기반 예측과 비교 중이에요',
  '간극을 계산하고 있어요',
  '거의 다 됐어요, 조금만 기다려주세요',
];

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

// ─── FuturePredictionLoadingPage ────────────────────────────────────────────
export function FuturePredictionLoadingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phase = searchParams.get('phase') || 'prediction';
  const hasStarted = useRef(false);
  const messageIdx = useRef(0);
  const messageRef = useRef<HTMLParagraphElement>(null);

  const messages = phase === 'gap' ? LOADING_MESSAGES_GAP : LOADING_MESSAGES_PREDICTION;

  // 로딩 메시지 순환
  useEffect(() => {
    const interval = setInterval(() => {
      messageIdx.current = (messageIdx.current + 1) % messages.length;
      if (messageRef.current) {
        messageRef.current.textContent = messages[messageIdx.current];
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [messages]);

  // 뒤로가기 → 홈으로 리다이렉트
  useEffect(() => {
    const onPopState = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigate]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (phase === 'gap') {
      runGapAnalysis();
    } else {
      runPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Phase 1: Prediction ──────────────────────────────────────
  const runPrediction = async () => {
    try {
      const category = sessionStorage.getItem('fp_category');
      const answersStr = sessionStorage.getItem('future_prediction_answers');
      const selectedTagsStr = sessionStorage.getItem('fp_selected_tags');
      const customQuestion = sessionStorage.getItem('fp_custom_question') || '';

      if (!category || !answersStr) {
        toast.error('예측 데이터가 없습니다.');
        navigate('/future-prediction/category', { replace: true });
        return;
      }

      const attitude_answers = JSON.parse(answersStr);
      const selected_tags: string[] = selectedTagsStr ? JSON.parse(selectedTagsStr) : [];

      // 인증 확인 (optional - 비회원도 가능)
      let authToken: string | null = null;
      let sajuRecordId: string | null = null;

      try {
        const { data: { user } } = await getAuthUser();
        if (user) {
          const { data: { session } } = await supabase.auth.getSession();
          authToken = session?.access_token || null;

          // 사주 레코드 ID 가져오기 (있으면)
          try {
            const cached = localStorage.getItem('primary_saju');
            if (cached) {
              sajuRecordId = JSON.parse(cached).id || null;
            }
          } catch { /* ignore */ }

          if (!sajuRecordId) {
            const { data: sajuList } = await supabase
              .from('saju_records')
              .select('id, is_primary')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true });
            const primary = sajuList?.find(
              (s: Record<string, unknown>) => s.is_primary
            ) || sajuList?.[0];
            sajuRecordId = primary?.id || null;
          }
        }
      } catch { /* 비회원 진행 */ }

      // Edge Function 호출
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-future-prediction`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            category,
            attitude_answers,
            saju_record_id: sajuRecordId,
            selected_tags,
            custom_question: customQuestion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('[FuturePredictionLoading] API 오류:', data.error);
        toast.error(data.error || '예측 생성에 실패했어요. 다시 시도해주세요.');
        navigate('/future-prediction/category', { replace: true });
        return;
      }

      // 결과 저장 + 이동
      localStorage.setItem('future_prediction_result', JSON.stringify(data.prediction));
      sessionStorage.removeItem('fp_category');
      sessionStorage.removeItem('future_prediction_answers');
      sessionStorage.removeItem('fp_selected_tags');
      sessionStorage.removeItem('fp_custom_question');
      navigate('/future-prediction/result', { replace: true });
    } catch (err) {
      console.error('[FuturePredictionLoading] 예외:', err);
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
      navigate('/future-prediction/category', { replace: true });
    }
  };

  // ─── Phase 2: Gap Analysis ────────────────────────────────────
  const runGapAnalysis = async () => {
    try {
      const predictionStr = localStorage.getItem('future_prediction_result');
      const sajuInfoStr = sessionStorage.getItem('fp_saju_info');

      if (!predictionStr || !sajuInfoStr) {
        toast.error('분석 데이터가 없습니다.');
        navigate('/future-prediction/result', { replace: true });
        return;
      }

      const predictionResult = JSON.parse(predictionStr);
      const sajuInfo = JSON.parse(sajuInfoStr);

      // 인증 토큰 (optional)
      let authToken: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch { /* 비회원 진행 */ }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-future-gap`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prediction_result: predictionResult,
            saju_info: sajuInfo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('[FuturePredictionLoading] Gap API 오류:', data.error);
        toast.error(data.error || '간극 분석에 실패했어요. 다시 시도해주세요.');
        navigate('/future-prediction/result', { replace: true });
        return;
      }

      localStorage.setItem('future_gap_result', JSON.stringify(data.gap));
      sessionStorage.removeItem('fp_saju_info');
      navigate('/future-prediction/gap', { replace: true });
    } catch (err) {
      console.error('[FuturePredictionLoading] Gap 예외:', err);
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
      navigate('/future-prediction/result', { replace: true });
    }
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
      <SEO title="미래 시뮬레이션 중" noIndex={true} />
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.white,
        }}
      >
        {/* ── 상단 네비게이션 ── */}
        <div
          style={{
            height: 52,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            paddingRight: 12,
            flexShrink: 0,
          }}
        >
          <BackButton onPress={() => navigate('/', { replace: true })} />
        </div>

        {/* ── 로딩 콘텐츠 ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 80,
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 140, height: 140 }}>
              <Lottie
                animationData={lottieData}
                loop
                autoplay
                renderer="svg"
                rendererSettings={{ progressiveLoad: false }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <p
              style={{
                fontFamily: font,
                fontSize: 18,
                fontWeight: 600,
                color: C.black,
                letterSpacing: '-0.36px',
                textAlign: 'center',
              }}
            >
              {phase === 'gap' ? '🔮 간극을 분석 중' : '🔮 미래를 시뮬레이션 중'}
            </p>
            <p
              ref={messageRef}
              style={{
                fontFamily: font,
                fontSize: 14,
                fontWeight: 400,
                color: C.gray600,
                letterSpacing: '-0.28px',
                lineHeight: '22px',
                textAlign: 'center',
                transition: 'opacity 0.3s ease',
              }}
            >
              {messages[0]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
