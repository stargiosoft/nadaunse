import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import svgPaths from '../imports/svg-97glg550pf';
import { TextareaInput } from '../components/TextareaInput';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';
import { hasUsedConsult } from '../lib/consultLimitService';
import LoginBottomSheet from '../components/LoginBottomSheet';
import FreeBirthInfoInput from '../components/FreeBirthInfoInput';
import SEO from '../components/SEO';
import { trackConsultLoginClick, trackConsultSubmit } from '../utils/analytics';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:        '#48b2af',
  primaryPressed: '#41A09E',
  black:          '#000000',
  charcoal:       '#151515',
  gray600:        '#848484',
  gray400:        '#999999',
  gray200:        '#b7b7b7',
  inputBg:        '#f9f9f9',
  white:          '#ffffff',
  shadow:         'rgba(255,255,255,0.76)',
} as const;

const font = "'Pretendard Variable', sans-serif";
const MAX_LEN = 300;
const DRAFT_KEY = 'saju_consult_draft';

// ─── Keyboard height hook ─────────────────────────────────────────────────────
function useKeyboardHeight(): number {
  const [kh, setKh] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setKh(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return kh;
}

// ─── Back button ──────────────────────────────────────────────────────────────
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

// ─── SajuConsultPage ──────────────────────────────────────────────────────────
export function SajuConsultPage() {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState<string>(() => sessionStorage.getItem(DRAFT_KEY) ?? '');
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [step, setStep] = useState<'question' | 'birth-info'>('question');
  const keyboardHeight = useKeyboardHeight();

  const handleChange = (val: string) => {
    if (val.length <= MAX_LEN) {
      setText(val);
      sessionStorage.setItem(DRAFT_KEY, val);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const isActive = text.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!isActive) return;
    setSubmitting(true);

    try {
      // getSession()으로 세션 확실히 로드 (로그인 직후 타이밍 이슈 방지)
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (user) {
        // 로그인 유저: localStorage 캐시 → 없으면 DB 조회
        let hasSaju = false;
        try {
          const cached = localStorage.getItem('primary_saju');
          if (cached) {
            const parsed = JSON.parse(cached);
            hasSaju = !!parsed.id;
          }
        } catch { /* ignore */ }

        if (!hasSaju) {
          const { data: sajuList, error: sajuError } = await supabase
            .from('saju_records')
            .select('id, is_primary')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          if (sajuError) {
            console.error('❌ [SajuConsult] DB 사주 조회 에러:', sajuError.message, sajuError.code);
          }
          if (sajuList && sajuList.length > 0) {
            hasSaju = true;
          }
        }

        if (!hasSaju) {
          // 사주 정보 없으면 사주 입력 페이지로 이동
          setStep('birth-info');
          return;
        }

        trackConsultSubmit('saju', true);
        navigate('/saju-consult/loading');
      } else {
        // 비로그인 유저
        if (hasUsedConsult()) {
          setShowLoginSheet(true);
          return;
        }

        // 캐시된 사주 정보가 있으면 바로 로딩, 없으면 birth-info 단계
        const cachedSaju = localStorage.getItem('cached_saju_info');
        if (cachedSaju) {
          trackConsultSubmit('saju', false);
          navigate('/saju-consult/loading');
        } else {
          setStep('birth-info');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── birth-info 단계: 비회원 사주 정보 입력 ──
  if (step === 'birth-info') {
    return (
      <FreeBirthInfoInput
        productId=""
        onBack={() => setStep('question')}
        mode="consult"
        onConsultComplete={() => {
          trackConsultSubmit('saju', false);
          navigate('/saju-consult/loading');
        }}
      />
    );
  }

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
      <SEO
        title="AI 사주 상담 - 생년월일 사주풀이"
        description="AI가 생년월일 사주팔자를 분석해드립니다. 사주연애운, 사주결혼시기, 이직운세, 재물운까지 비대면사주 상담을 경험하세요."
        keywords="AI사주, 비대면사주, 생년월일운세, 사주풀이, 사주연애운, 이직운세, 사주결혼시기, 온라인사주추천, 사주잘보는곳"
        canonical="/saju-consult"
      />
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.white,
          position: 'relative',
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
          <BackButton onPress={() => {
            if (text.trim().length > 0) {
              setShowExitModal(true);
            } else {
              navigate(-1);
            }
          }} />
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

        {/* ── 본문 스크롤 영역 ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80,
            transition: 'padding-bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          }}
          onTouchStart={() => {
            const el = textareaRef.current;
            if (!el) return;
            if (document.activeElement === el) return;
            el.focus();
            setTimeout(() => {
              el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }, 350);
          }}
        >
          {/* 질문 문구 */}
          <div
            style={{
              backgroundColor: C.white,
              paddingTop: 16,
              paddingBottom: 12,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            <p
              style={{
                fontFamily: font,
                fontSize: 17,
                fontWeight: 500,
                color: C.black,
                letterSpacing: '-0.34px',
                lineHeight: '24px',
              }}
            >
              오늘, 어떤 일이 가장 마음에 걸리나요?
            </p>
          </div>

          {/* 입력 영역 */}
          <div style={{ paddingLeft: 20, paddingRight: 20 }}>
            <TextareaInput
              ref={textareaRef}
              autoFocus
              value={text}
              onChange={handleChange}
              maxLength={MAX_LEN}
              rows={8}
              placeholder={`편하게 적어주세요\n예를 들면 이런 질문도 좋아요\n\n• 요즘 일이 잘 안 풀리는 이유가 궁금해요\n• 이직을 해도 괜찮을지 알고 싶어요\n• 그 사람과 다시 잘 될 수 있을까요?`}
            />
          </div>
        </div>

        {/* ── 하단 CTA (키보드 위에 고정) ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: keyboardHeight,
            transition: 'bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: C.white,
            boxShadow: `0px -8px 16px 0px ${C.shadow}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              disabled={!isActive}
              onTouchStart={() => {}}
              onClick={handleSubmit}
              onPointerDown={(e) => {
                if (!isActive) return;
                e.currentTarget.style.transform = 'scale(0.995) translateZ(0)';
                e.currentTarget.style.backgroundColor = C.primaryPressed;
              }}
              onPointerUp={(e) => {
                if (!isActive) return;
                e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                e.currentTarget.style.backgroundColor = C.primary;
              }}
              onPointerLeave={(e) => {
                if (!isActive) return;
                e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                e.currentTarget.style.backgroundColor = C.primary;
              }}
              onPointerCancel={(e) => {
                if (!isActive) return;
                e.currentTarget.style.transform = 'scale(1) translateZ(0)';
                e.currentTarget.style.backgroundColor = C.primary;
              }}
              style={{
                width: '100%',
                maxWidth: 400,
                height: 56,
                borderRadius: 20,
                border: 'none',
                backgroundColor: isActive ? C.primary : '#f8f8f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isActive ? 'pointer' : 'default',
                transition: 'background-color 0.2s ease, transform 0.15s ease-out',
                WebkitTapHighlightColor: 'transparent',
                transform: 'scale(1) translateZ(0)',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: font,
                  fontSize: 16,
                  fontWeight: 500,
                  color: isActive ? C.white : C.gray200,
                  letterSpacing: '-0.32px',
                  lineHeight: '25px',
                  transition: 'color 0.2s ease',
                }}
              >
                상담 요청하기
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 이탈 확인 모달 ── */}
      {showExitModal && (
        <div
          onClick={() => setShowExitModal(false)}
          onTouchStart={() => {}}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 320,
              backgroundColor: C.white,
              borderRadius: 24,
              overflow: 'hidden',
              border: '1px solid #f3f3f3',
            }}
          >
            <div style={{ padding: '32px 28px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontFamily: font, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px' }}>
                나가시겠어요?
              </p>
              <p style={{ fontFamily: font, fontSize: 16, fontWeight: 400, color: C.gray600, letterSpacing: '-0.32px', lineHeight: '28.5px' }}>
                지금 나가면 작성한 내용이 사라져요
              </p>
            </div>
            <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10 }}>
              <button
                onTouchStart={() => {}}
                onClick={() => setShowExitModal(false)}
                onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#e8e8e8'; }}
                onPointerUp={(e) => { e.currentTarget.style.backgroundColor = '#f3f3f3'; }}
                onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f3f3'; }}
                onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = '#f3f3f3'; }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 16,
                  border: 'none',
                  backgroundColor: '#f3f3f3',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.15s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: font, fontSize: 15, fontWeight: 500, color: '#525252', letterSpacing: '-0.45px', lineHeight: '20px', whiteSpace: 'nowrap' }}>
                  계속 작성하기
                </span>
              </button>
              <button
                onTouchStart={() => {}}
                onClick={() => {
                  sessionStorage.removeItem(DRAFT_KEY);
                  setShowExitModal(false);
                  navigate('/', { replace: true });
                }}
                onPointerDown={(e) => { e.currentTarget.style.backgroundColor = C.primaryPressed; }}
                onPointerUp={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
                onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
                onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.primary; }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 16,
                  border: 'none',
                  backgroundColor: C.primary,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background-color 0.15s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: font, fontSize: 15, fontWeight: 500, color: C.white, letterSpacing: '-0.45px', lineHeight: '20px', whiteSpace: 'nowrap' }}>
                  나갈래요
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 로그인 유도 바텀시트 ── */}
      <LoginBottomSheet
        isOpen={showLoginSheet}
        onClose={() => setShowLoginSheet(false)}
        redirectPath="/saju-consult"
        onLoginClick={() => trackConsultLoginClick('saju_consult')}
        icon="/key-icon.svg"
        title={
          <>
            <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#151515', fontFamily: "'Pretendard Variable', sans-serif", width: '100%' }}>로그인하면</p>
            <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#151515', fontFamily: "'Pretendard Variable', sans-serif", width: '100%' }}>매일 상담 받을 수 있어요</p>
          </>
        }
        description={
          <p style={{ fontSize: '15px', fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.45px', textAlign: 'center', color: '#848484', fontFamily: "'Pretendard Variable', sans-serif" }}>
            비회원은 1회만 이용 가능해요
          </p>
        }
      />
    </div>
  );
}
