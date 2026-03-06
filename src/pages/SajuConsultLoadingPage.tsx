import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import svgPaths from '../imports/svg-97glg550pf';
import lottieData from '../imports/animated-shape-effect.json';
import { supabase, getAuthUser } from '../lib/supabase';
import { toast } from '../lib/toast';
import { recordConsultUsed } from '../lib/consultLimitService';
import { DEV } from '../lib/env';
import SEO from '../components/SEO';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  black:   '#000000',
  gray600: '#848484',
  white:   '#ffffff',
  text:    '#3d3d3d',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── Back button ─────────────────────────────────────────────────────────────
function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      onTouchStart={() => {}}
      onPointerDown={(e) => {
        e.currentTarget.style.backgroundColor = '#F4F4F4';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(0.88)';
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      }}
      onPointerCancel={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      }}
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
        transition: 'background-color 0.15s ease-out',
      }}
    >
      <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}>
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
      </span>
    </button>
  );
}

// ─── SajuConsultLoadingPage ──────────────────────────────────────────────────
export function SajuConsultLoadingPage() {
  const navigate = useNavigate();
  const hasStarted = useRef(false);

  // 뒤로가기(브라우저/iOS 스와이프) → 홈으로 리다이렉트
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

    const runConsult = async () => {
      try {
        // 1. sessionStorage에서 질문 읽기
        const question = sessionStorage.getItem('saju_consult_draft');
        if (!question || question.trim().length === 0) {
          toast.error('질문이 비어있습니다.');
          navigate('/saju-consult', { replace: true });
          return;
        }

        // 2. 인증 확인
        const { data: { user } } = await getAuthUser();

        if (user) {
          // ── 로그인 유저 경로 ──
          let sajuRecordId: string | null = null;
          try {
            const cached = localStorage.getItem('primary_saju');
            if (cached) {
              const parsed = JSON.parse(cached);
              sajuRecordId = parsed.id || null;
            }
          } catch { /* ignore */ }

          if (!sajuRecordId) {
            const { data: sajuList } = await supabase
              .from('saju_records')
              .select('id, is_primary')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true });
            const primary = sajuList?.find((s: Record<string, unknown>) => s.is_primary) || sajuList?.[0];
            sajuRecordId = primary?.id || null;
          }

          if (!sajuRecordId) {
            toast.error('사주 정보를 먼저 등록해주세요.');
            navigate('/profile', { replace: true });
            return;
          }

          const { data, error } = await supabase.functions.invoke('generate-saju-consult', {
            body: { question: question.trim(), sajuRecordId, userId: user.id, devBypass: DEV }
          });

          if (data?.error === 'DAILY_CONSULT_LIMIT') {
            toast.error('상담은 하루에 한 번만 받을 수 있어요.');
            navigate('/saju-consult', { replace: true });
            return;
          }

          if (error || !data?.success || !data?.result) {
            console.error('[SajuConsultLoading] API 오류:', error || data?.error);
            toast.error('상담 결과를 생성하지 못했어요. 다시 시도해주세요.');
            navigate('/saju-consult', { replace: true });
            return;
          }

          localStorage.setItem('saju_consult_result', JSON.stringify(data.result));
          sessionStorage.removeItem('saju_consult_draft');
          navigate('/saju-consult/result', { replace: true });

        } else {
          // ── 비회원 게스트 경로 ──
          const cachedSajuStr = localStorage.getItem('cached_saju_info');
          if (!cachedSajuStr) {
            toast.error('사주 정보가 없습니다.');
            navigate('/saju-consult', { replace: true });
            return;
          }

          let birthInfo: { name: string; gender: string; birthDate: string; birthTime: string };
          try {
            const cached = JSON.parse(cachedSajuStr);
            birthInfo = {
              name: cached.name,
              gender: cached.gender,
              birthDate: cached.birthDate,
              birthTime: cached.birthTime,
            };
          } catch {
            toast.error('사주 정보가 올바르지 않습니다.');
            navigate('/saju-consult', { replace: true });
            return;
          }

          const { data, error } = await supabase.functions.invoke('generate-saju-consult', {
            body: { question: question.trim(), birthInfo }
          });

          // CONSULT_LIMIT_REACHED 처리
          if (data?.error === 'CONSULT_LIMIT_REACHED') {
            toast.error('비회원 체험은 1회까지 가능해요. 로그인해주세요.');
            navigate('/saju-consult', { replace: true });
            return;
          }

          // 로그인 유저 일일 제한
          if (data?.error === 'DAILY_CONSULT_LIMIT') {
            toast.error('상담은 하루에 한 번만 받을 수 있어요.');
            navigate('/saju-consult', { replace: true });
            return;
          }

          if (error || !data?.success || !data?.result) {
            console.error('[SajuConsultLoading] API 오류:', error || data?.error);
            toast.error('상담 결과를 생성하지 못했어요. 다시 시도해주세요.');
            navigate('/saju-consult', { replace: true });
            return;
          }

          // 비회원 성공 시 localStorage에 사용 기록
          recordConsultUsed('saju');

          localStorage.setItem('saju_consult_result', JSON.stringify(data.result));
          sessionStorage.removeItem('saju_consult_draft');
          navigate('/saju-consult/result', { replace: true });
        }

      } catch (err) {
        console.error('[SajuConsultLoading] 예외:', err);
        toast.error('오류가 발생했습니다. 다시 시도해주세요.');
        navigate('/saju-consult', { replace: true });
      }
    };

    runConsult();
  }, [navigate]);

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
      <SEO title="사주 상담 중" noIndex={true} />
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
            paddingTop: 4,
            paddingBottom: 4,
            backgroundColor: C.white,
            flexShrink: 0,
          }}
        >
          <BackButton onPress={() => navigate('/', { replace: true })} />
          <p
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: font,
              fontSize: 18,
              fontWeight: 600,
              color: C.black,
              letterSpacing: '-0.36px',
              lineHeight: '25.5px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            사주 상담
          </p>
          <div style={{ width: 44, flexShrink: 0 }} />
        </div>

        {/* ── 로딩 콘텐츠 ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 48,
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 48,
          }}
        >
          <div style={{ width: 160, height: 160, flexShrink: 0, transform: 'translateZ(0)' }}>
            <style>{`.lottie-crystal svg { overflow: visible !important; }`}</style>
            <div className="lottie-crystal">
              <Lottie
                animationData={lottieData}
                loop
                autoplay
                renderer="svg"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <p
              style={{
                fontFamily: font,
                fontSize: 15.5,
                fontWeight: 400,
                color: C.text,
                letterSpacing: '-0.31px',
                lineHeight: '25.5px',
                textAlign: 'center',
                width: 302,
              }}
            >
              지금의 마음을 읽고 있어요
            </p>
            <p
              style={{
                fontFamily: font,
                fontSize: 15.5,
                fontWeight: 400,
                color: C.text,
                letterSpacing: '-0.31px',
                lineHeight: '25.5px',
                textAlign: 'center',
                width: 302,
              }}
            >
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
