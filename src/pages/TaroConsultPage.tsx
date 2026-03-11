import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import svgPaths from '../imports/svg-97glg550pf';
import { TextareaInput } from '../components/TextareaInput';
import { getAuthUser } from '../lib/supabase';
import { hasUsedConsult } from '../lib/consultLimitService';
import LoginBottomSheet from '../components/LoginBottomSheet';
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
const DRAFT_KEY = 'taro_consult_draft';

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
        width: 44, height: 44, borderRadius: 12, border: 'none',
        backgroundColor: 'transparent', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent', flexShrink: 0, padding: 4,
        transition: 'background-color 0.15s ease-out',
      }}
    >
      <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path d={svgPaths.p2a5cd480} stroke={C.gray600} strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.7" />
        </svg>
      </span>
    </button>
  );
}

// ─── TaroConsultPage ──────────────────────────────────────────────────────────
export function TaroConsultPage() {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState<string>(() => sessionStorage.getItem(DRAFT_KEY) ?? '');
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  const handleChange = (val: string) => {
    if (val.length <= MAX_LEN) {
      setText(val);
      sessionStorage.setItem(DRAFT_KEY, val);
    }
  };

  const isActive = text.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!isActive) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await getAuthUser();
      if (!user && hasUsedConsult()) {
        setShowLoginSheet(true);
        return;
      }
      trackConsultSubmit('taro', !!user);
      navigate('/taro-consult/loading');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: C.white, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
      <SEO
        title="AI 타로 상담 - 무료 타로카드 뽑기"
        description="AI 타로 상담으로 연애운, 진로, 고민을 풀어보세요. 무료타로사이트 나다운세에서 타로카드뽑기와 오늘타로운세를 무료로 경험하세요."
        keywords="타로카드뽑기, 무료타로사이트, AI타로, 타로연애운, 오늘타로운세, 무료타로, 타로점"
        canonical="/taro-consult"
      />
      <div style={{ width: '100%', maxWidth: 440, minWidth: 320, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.white, position: 'relative' }}>
        {/* ── 상단 네비게이션 ── */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, backgroundColor: C.white, flexShrink: 0 }}>
          <BackButton onPress={() => { if (text.trim().length > 0) { setShowExitModal(true); } else { navigate(-1); } }} />
        </div>

        {/* ── 본문 스크롤 영역 ── */}
        <div
          style={{ flex: 1, overflowY: 'auto', paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80, transition: 'padding-bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1)', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}
          onTouchStart={() => { const el = textareaRef.current; if (!el) return; if (document.activeElement === el) return; el.focus(); setTimeout(() => { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 350); }}
        >
          <div style={{ backgroundColor: C.white, paddingTop: 16, paddingBottom: 12, paddingLeft: 20, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#f7f8f9', borderRadius: 16, padding: 14, display: 'inline-flex', alignSelf: 'flex-start' }}>
              <img src="/consult/the-lover.png" alt="" style={{ width: 36, height: 36, objectFit: 'contain', marginTop: -2 }} />
            </div>
            <div style={{ paddingLeft: 4, paddingRight: 4 }}>
              <p style={{ fontFamily: font, fontSize: 17, fontWeight: 500, color: C.black, letterSpacing: '-0.34px', lineHeight: '24px' }}>
                오늘, 어떤 일이 가장 마음에 걸리나요?
              </p>
            </div>
          </div>
          <div style={{ paddingLeft: 20, paddingRight: 20 }}>
            <TextareaInput ref={textareaRef} autoFocus value={text} onChange={handleChange} maxLength={MAX_LEN} rows={8} placeholder={`편하게 적어주세요\n예를 들면 이런 질문도 좋아요\n\n• 요즘 일이 잘 안 풀리는 이유가 궁금해요\n• 이직을 해도 괜찮을지 알고 싶어요\n• 그 사람과 다시 잘 될 수 있을까요?`} />
          </div>
        </div>

        {/* ── 하단 CTA ── */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: keyboardHeight, transition: 'bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: C.white, boxShadow: `0px -8px 16px 0px ${C.shadow}`, flexShrink: 0 }}>
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              disabled={!isActive}
              onTouchStart={() => {}}
              onClick={handleSubmit}
              onPointerDown={(e) => { if (!isActive) return; e.currentTarget.style.transform = 'scale(0.995) translateZ(0)'; e.currentTarget.style.backgroundColor = C.primaryPressed; }}
              onPointerUp={(e) => { if (!isActive) return; e.currentTarget.style.transform = 'scale(1) translateZ(0)'; e.currentTarget.style.backgroundColor = C.primary; }}
              onPointerLeave={(e) => { if (!isActive) return; e.currentTarget.style.transform = 'scale(1) translateZ(0)'; e.currentTarget.style.backgroundColor = C.primary; }}
              onPointerCancel={(e) => { if (!isActive) return; e.currentTarget.style.transform = 'scale(1) translateZ(0)'; e.currentTarget.style.backgroundColor = C.primary; }}
              style={{ width: '100%', maxWidth: 400, height: 56, borderRadius: 20, border: 'none', backgroundColor: isActive ? C.primary : '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isActive ? 'pointer' : 'default', transition: 'background-color 0.2s ease, transform 0.15s ease-out', WebkitTapHighlightColor: 'transparent', transform: 'scale(1) translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <span style={{ fontFamily: font, fontSize: 16, fontWeight: 400, color: isActive ? C.white : C.gray200, letterSpacing: '-0.32px', lineHeight: '25px', transition: 'color 0.2s ease' }}>
                상담 요청하기
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 이탈 확인 모달 ── */}
      {showExitModal && (
        <div onClick={() => setShowExitModal(false)} onTouchStart={() => {}} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 320, backgroundColor: C.white, borderRadius: 24, overflow: 'hidden', border: '1px solid #f3f3f3' }}>
            <div style={{ padding: '32px 28px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontFamily: font, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: '-0.36px', lineHeight: '25.5px' }}>나가시겠어요?</p>
              <p style={{ fontFamily: font, fontSize: 16, fontWeight: 400, color: C.gray600, letterSpacing: '-0.32px', lineHeight: '28.5px' }}>지금 나가면 작성한 내용이 사라져요</p>
            </div>
            <div style={{ padding: '4px 24px 20px', display: 'flex', gap: 10 }}>
              <button onTouchStart={() => {}} onClick={() => setShowExitModal(false)} onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#e8e8e8'; }} onPointerUp={(e) => { e.currentTarget.style.backgroundColor = '#f3f3f3'; }} onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f3f3'; }} onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = '#f3f3f3'; }} style={{ flex: 1, height: 48, borderRadius: 16, border: 'none', backgroundColor: '#f3f3f3', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'background-color 0.15s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: font, fontSize: 15, fontWeight: 500, color: '#525252', letterSpacing: '-0.45px', lineHeight: '20px', whiteSpace: 'nowrap' }}>계속 작성하기</span>
              </button>
              <button onTouchStart={() => {}} onClick={() => { sessionStorage.removeItem(DRAFT_KEY); setShowExitModal(false); navigate('/', { replace: true }); }} onPointerDown={(e) => { e.currentTarget.style.backgroundColor = C.primaryPressed; }} onPointerUp={(e) => { e.currentTarget.style.backgroundColor = C.primary; }} onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = C.primary; }} onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.primary; }} style={{ flex: 1, height: 48, borderRadius: 16, border: 'none', backgroundColor: C.primary, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'background-color 0.15s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: font, fontSize: 15, fontWeight: 500, color: C.white, letterSpacing: '-0.45px', lineHeight: '20px', whiteSpace: 'nowrap' }}>나갈래요</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 로그인 유도 바텀시트 ── */}
      <LoginBottomSheet
        isOpen={showLoginSheet}
        onClose={() => setShowLoginSheet(false)}
        redirectPath="/taro-consult"
        onLoginClick={() => trackConsultLoginClick('taro_consult')}
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
