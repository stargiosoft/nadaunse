import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import SEO from '../components/SEO';
import { NavigationHeader } from '../components/NavigationHeader';
import { supabase } from '../lib/supabase';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#41a09e',
  primaryLight: '#e8f5f5',
  black: '#151515',
  gray700: '#6d6d6d',
  gray600: '#848484',
  gray400: '#b7b7b7',
  gray200: '#e7e7e7',
  bg: '#f7f8f9',
  white: '#ffffff',
  red: '#ef4444',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── 사주 정보 타입 ─────────────────────────────────────────────────────────
interface SajuInfo {
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD
  birthTime: string | null; // HH:MM or null
  calendarType: 'solar' | 'lunar';
}

// ─── FuturePredictionSajuInputPage ──────────────────────────────────────────
export function FuturePredictionSajuInputPage() {
  const navigate = useNavigate();
  const [existingSaju, setExistingSaju] = useState<SajuInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 입력 폼 상태
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [birthTimeInput, setBirthTimeInput] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [error, setError] = useState('');

  // 기존 사주 확인
  useEffect(() => {
    const checkResult = localStorage.getItem('future_prediction_result');
    if (!checkResult) {
      navigate('/future-prediction', { replace: true });
      return;
    }

    const checkExistingSaju = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from('saju_records')
          .select('birth_date, birth_time, gender, calendar_type')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();

        if (data) {
          const datePart = (data.birth_date as string)?.includes('T')
            ? (data.birth_date as string).split('T')[0]
            : (data.birth_date as string)?.split(' ')[0] || '';
          setExistingSaju({
            gender: data.gender,
            birthDate: datePart,
            birthTime: data.birth_time || null,
            calendarType: data.calendar_type || 'solar',
          });
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    checkExistingSaju();
  }, [navigate]);

  const formatBirthDate = (raw: string): string | null => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (year < 1920 || year > 2020 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${m}-${d}`;
  };

  const formatBirthTime = (raw: string): string | null => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 4) return null;
    const h = parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(2, 4), 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };

  const handleSubmit = (sajuInfo: SajuInfo) => {
    sessionStorage.setItem('fp_saju_info', JSON.stringify(sajuInfo));
    navigate('/future-prediction/loading?phase=gap');
  };

  const handleFormSubmit = () => {
    setError('');

    if (!gender) { setError('성별을 선택해주세요.'); return; }

    const formattedDate = formatBirthDate(birthDateInput);
    if (!formattedDate) { setError('생년월일 8자리를 올바르게 입력해주세요. (예: 19990315)'); return; }

    let formattedTime: string | null = null;
    if (!unknownTime) {
      if (!birthTimeInput) { setError('태어난 시간을 입력하거나 "모르겠어요"를 선택해주세요.'); return; }
      formattedTime = formatBirthTime(birthTimeInput);
      if (!formattedTime) { setError('태어난 시간 4자리를 올바르게 입력해주세요. (예: 1430)'); return; }
    }

    handleSubmit({
      gender,
      birthDate: formattedDate,
      birthTime: formattedTime,
      calendarType,
    });
  };

  if (loading) return null;

  // 기존 사주 있으면 요약 표시
  if (existingSaju) {
    const genderLabel = existingSaju.gender === 'male' ? '남성' : '여성';
    const timeLabel = existingSaju.birthTime || '모름';
    const calLabel = existingSaju.calendarType === 'lunar' ? '음력' : '양력';

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: C.bg, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
        <SEO title="사주 정보 확인" noIndex={true} />
        <div style={{ width: '100%', maxWidth: 440, minWidth: 320, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.bg, overflow: 'hidden' }}>
          <NavigationHeader title="사주 정보" onBack={() => navigate('/future-prediction/result')} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: C.black, letterSpacing: '-0.44px', lineHeight: '32px', textAlign: 'center' }}>
                내 사주는 어떤 미래를
                <br />
                그리고 있을까?
              </p>
              <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray600, letterSpacing: '-0.28px', textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
                등록된 사주 정보로 간극 분석을 진행합니다
              </p>

              {/* 기존 사주 요약 카드 */}
              <div style={{ padding: '20px', backgroundColor: C.white, borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray600 }}>성별</span>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.black }}>{genderLabel}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray600 }}>생년월일</span>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.black }}>{calLabel} {existingSaju.birthDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray600 }}>태어난 시간</span>
                    <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.black }}>{timeLabel}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSubmit(existingSaju)}
                style={{
                  width: '100%',
                  padding: '16px',
                  marginTop: 24,
                  borderRadius: 14,
                  border: 'none',
                  backgroundColor: C.primary,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, letterSpacing: '-0.3px' }}>
                  이 정보로 진행
                </p>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // 입력 폼
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: C.bg, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
      <SEO title="사주 정보 입력" noIndex={true} />
      <div style={{ width: '100%', maxWidth: 440, minWidth: 320, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: C.bg, overflowX: 'hidden', overflowY: 'auto' }}>
        <NavigationHeader title="사주 정보" onBack={() => navigate('/future-prediction/result')} />

        <div style={{ padding: '80px 24px 40px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p style={{ fontFamily: font, fontSize: 22, fontWeight: 700, color: C.black, letterSpacing: '-0.44px', lineHeight: '32px' }}>
              내 사주는 어떤 미래를
              <br />
              그리고 있을까?
            </p>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 400, color: C.gray600, letterSpacing: '-0.28px', marginTop: 8, marginBottom: 32 }}>
              성격 기반 예측과 사주 기반 예측의 간극을 분석합니다
            </p>
          </motion.div>

          {/* 성별 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.28px', marginBottom: 10 }}>
              성별
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['male', 'female'] as const).map(g => {
                const isSelected = gender === g;
                return (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? C.primary : C.gray200}`,
                      backgroundColor: isSelected ? C.primaryLight : C.white,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <p style={{ fontFamily: font, fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.primary : C.gray700 }}>
                      {g === 'male' ? '남성' : '여성'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 달력 유형 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.28px', marginBottom: 10 }}>
              달력 유형
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['solar', 'lunar'] as const).map(ct => {
                const isSelected = calendarType === ct;
                return (
                  <button
                    key={ct}
                    onClick={() => setCalendarType(ct)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? C.primary : C.gray200}`,
                      backgroundColor: isSelected ? C.primaryLight : C.white,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <p style={{ fontFamily: font, fontSize: 14, fontWeight: isSelected ? 600 : 400, color: isSelected ? C.primary : C.gray700 }}>
                      {ct === 'solar' ? '양력' : '음력'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 생년월일 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.28px', marginBottom: 10 }}>
              생년월일 (8자리)
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={birthDateInput}
              onChange={(e) => setBirthDateInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="19990315"
              maxLength={8}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${C.gray200}`,
                backgroundColor: C.white,
                fontFamily: font,
                fontSize: 15,
                fontWeight: 400,
                color: C.black,
                letterSpacing: '1px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.primary; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.gray200; }}
            />
          </div>

          {/* 태어난 시간 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: '-0.28px', marginBottom: 10 }}>
              태어난 시간 (4자리, 24시)
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={birthTimeInput}
              onChange={(e) => setBirthTimeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1430"
              maxLength={4}
              disabled={unknownTime}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: `1.5px solid ${C.gray200}`,
                backgroundColor: unknownTime ? C.bg : C.white,
                fontFamily: font,
                fontSize: 15,
                fontWeight: 400,
                color: unknownTime ? C.gray400 : C.black,
                letterSpacing: '1px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { if (!unknownTime) e.currentTarget.style.borderColor = C.primary; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.gray200; }}
            />
            <button
              onClick={() => { setUnknownTime(!unknownTime); if (!unknownTime) setBirthTimeInput(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `1.5px solid ${unknownTime ? C.primary : C.gray400}`,
                  backgroundColor: unknownTime ? C.primary : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                {unknownTime && (
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                    <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.gray600, letterSpacing: '-0.26px' }}>
                모르겠어요
              </span>
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p style={{ fontFamily: font, fontSize: 13, fontWeight: 400, color: C.red, letterSpacing: '-0.26px', marginBottom: 16 }}>
              {error}
            </p>
          )}

          {/* 제출 버튼 */}
          <button
            onClick={handleFormSubmit}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: 'none',
              backgroundColor: C.primary,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <p style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: C.white, letterSpacing: '-0.3px' }}>
              간극 분석 시작
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
