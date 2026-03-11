import { useNavigate } from 'react-router-dom';
import { getAuthUser } from '../lib/supabase';
import { hasUsedConsult } from '../lib/consultLimitService';
import { useState } from 'react';
import LoginBottomSheet from '../components/LoginBottomSheet';
import { trackConsultLoginClick, trackConsultStartClick } from '../utils/analytics';

const C = {
  primary: '#48b2af',
  black: '#000000',
  charcoal: '#151515',
  gray750: '#6d6d6d',
  gray800: '#525252',
  gray900: '#151515',
  bgCard: '#f7f8f9',
  bgBadge: '#F8F8F8',
  white: '#ffffff',
} as const;

const font = "'Pretendard Variable', sans-serif";

export default function ConsultTypeSelectPage() {
  const navigate = useNavigate();
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [pendingType, setPendingType] = useState<'saju' | 'taro' | null>(null);

  const handleSelect = async (type: 'saju' | 'taro') => {
    const { data: { user } } = await getAuthUser();
    if (!user && hasUsedConsult()) {
      setPendingType(type);
      setShowLoginSheet(true);
      return;
    }
    trackConsultStartClick(type);
    navigate(type === 'saju' ? '/saju-consult' : '/taro-consult');
  };

  return (
    <div
      className="flex flex-col w-full min-h-screen"
      style={{ backgroundColor: C.white, maxWidth: 440, margin: '0 auto' }}
    >
      {/* 상단 네비게이션 */}
      <div
        className="flex items-center w-full shrink-0"
        style={{ height: 52, padding: '4px 12px' }}
      >
        <button
          className="flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: 12, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: 4, WebkitTapHighlightColor: 'transparent', transition: 'background-color 0.15s ease-out' }}
          onClick={() => navigate(-1)}
          onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#F4F4F4'; const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement; if (inner) inner.style.transform = 'scale(0.88)'; }}
          onPointerUp={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement; if (inner) inner.style.transform = 'scale(1)'; }}
          onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement; if (inner) inner.style.transform = 'scale(1)'; }}
          onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement; if (inner) inner.style.transform = 'scale(1)'; }}
        >
          <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="#848484" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" />
            </svg>
          </span>
        </button>
      </div>

      {/* 본문 */}
      <div className="flex flex-col w-full" style={{ gap: 14, paddingTop: 0 }}>
        {/* 타이틀 */}
        <div
          className="flex items-center w-full"
          style={{ padding: '10px 26px' }}
        >
          <p
            className="w-full text-center"
            style={{ fontFamily: font, fontSize: 20, fontWeight: 600, color: C.charcoal, letterSpacing: '-0.2px', lineHeight: '28px' }}
          >
            어떤 방식으로 마음을 상담받을까요?
          </p>
        </div>

        {/* 선택 카드 */}
        <div
          className="flex items-center w-full"
          style={{ gap: 12, padding: '0 24px' }}
        >
          {/* 사주 카드 */}
          <button
            className="flex flex-1 items-center justify-center"
            style={{
              height: 152,
              backgroundColor: C.bgCard,
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              padding: '10px 10px 8px',
            }}
            onClick={() => handleSelect('saju')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eeeff0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.bgCard; }}
            onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#e5e6e7'; }}
            onPointerUp={(e) => { e.currentTarget.style.backgroundColor = '#eeeff0'; }}
            onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.bgCard; }}
          >
            <div className="flex flex-col items-center" style={{ gap: 11, width: 145 }}>
              <img src="/consult/crystal-ball.svg" alt="사주" style={{ width: 44, height: 44, objectFit: 'contain' }} />
              <div className="flex flex-col items-center text-center" style={{ paddingBottom: 1 }}>
                <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: C.gray900, letterSpacing: '-0.32px', lineHeight: '28.5px' }}>
                  사주
                </p>
                <p style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: C.gray750, lineHeight: '19.5px', whiteSpace: 'nowrap' }}>
                  운의 흐름을 분석
                </p>
              </div>
            </div>
          </button>

          {/* 타로 카드 */}
          <button
            className="flex flex-1 items-center justify-center"
            style={{
              height: 152,
              backgroundColor: C.bgCard,
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              padding: '10px 10px 8px',
            }}
            onClick={() => handleSelect('taro')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eeeff0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.bgCard; }}
            onPointerDown={(e) => { e.currentTarget.style.backgroundColor = '#e5e6e7'; }}
            onPointerUp={(e) => { e.currentTarget.style.backgroundColor = '#eeeff0'; }}
            onPointerCancel={(e) => { e.currentTarget.style.backgroundColor = C.bgCard; }}
          >
            <div className="flex flex-col items-center" style={{ gap: 11, width: 145 }}>
              <img src="/consult/the-lover.svg" alt="타로" style={{ width: 42, height: 42, objectFit: 'contain' }} />
              <div className="flex flex-col items-center text-center" style={{ paddingBottom: 1, width: 145 }}>
                <p style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: C.gray900, letterSpacing: '-0.32px', lineHeight: '28.5px' }}>
                  타로
                </p>
                <p style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: C.gray750, lineHeight: '19.5px', whiteSpace: 'nowrap' }}>
                  카드로 마음 확인
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="flex flex-col w-full mt-auto" style={{ gap: 2, padding: '0 24px 40px' }}>
        <div className="flex flex-col w-full" style={{ gap: 7 }}>
          {/* 익명 상담 뱃지 */}
          <div
            className="flex items-center shrink-0 self-start"
            style={{ backgroundColor: C.bgBadge, borderRadius: 999, padding: '4px 8px', gap: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L10.5 2.8V6.5C10.5 8.9 8.5 11 6 11.5C3.5 11 1.5 8.9 1.5 6.5V2.8L6 1Z" fill="#4CAF50" />
              <path d="M4 6.5L5.5 8L8 5" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: font, fontSize: 11, fontWeight: 500, color: C.gray800, lineHeight: '16px', whiteSpace: 'nowrap', paddingTop: 1.5 }}>
              익명 상담
            </span>
          </div>

          {/* 제목 */}
          <div style={{ padding: '0 4px' }}>
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: '#696969', letterSpacing: '-0.3px', lineHeight: '28.5px' }}>
              데일리 상담 방식
            </p>
          </div>
        </div>

        {/* 안내 목록 */}
        <div className="flex flex-col w-full" style={{ gap: 3 }}>
          {[
            '데일리 상담은 하루에 한 번 받을 수 있어요.',
            '상담은 익명으로 진행되며 대화 내용은 저장되지 않아요.',
            '상담 결과는 오늘까지만 확인할 수 있고 다음 날이 되면 초기화돼요.',
            '상담은 AI가 현재 상황을 바탕으로 조언을 제공해요.',
            '답변은 질문을 바탕으로 상황을 함께 정리해 드려요.',
          ].map((text, i) => (
            <ul key={i} className="block w-full" style={{ margin: 0, padding: 0 }}>
              <li
                className="list-disc"
                style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: '#909090', letterSpacing: '-0.28px', lineHeight: '24px', marginLeft: 21 }}
              >
                {text}
              </li>
            </ul>
          ))}
        </div>
      </div>

      <LoginBottomSheet
        isOpen={showLoginSheet}
        onClose={() => setShowLoginSheet(false)}
        redirectPath="/consult-type-select"
        onLoginClick={() => trackConsultLoginClick('home')}
        icon="/key-icon.svg"
        title={
          <>
            <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#151515', fontFamily: font, width: '100%' }}>로그인하면</p>
            <p style={{ fontSize: '22px', fontWeight: 700, lineHeight: '32.5px', letterSpacing: '-0.22px', textAlign: 'center', color: '#151515', fontFamily: font, width: '100%' }}>매일 상담 받을 수 있어요</p>
          </>
        }
        description={
          <p style={{ fontSize: '15px', fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.45px', textAlign: 'center', color: '#848484', fontFamily: font }}>
            비회원은 1회만 이용 가능해요
          </p>
        }
      />
    </div>
  );
}
