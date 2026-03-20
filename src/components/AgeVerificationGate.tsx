/**
 * 19금 성인 인증 게이트 컴포넌트
 * ★DESIGN_SYSTEM★ 기반 — 56px 입력, 16px 라디어스
 */

import { useState, useEffect } from 'react';

const font = "'Pretendard Variable', sans-serif";

interface AgeVerificationGateProps {
  testId: string;
  children: React.ReactNode;
}

export default function AgeVerificationGate({ testId, children }: AgeVerificationGateProps) {
  const [verified, setVerified] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');

  const storageKey = `age_verified_${testId}`;

  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored === 'true') setVerified(true);
  }, [storageKey]);

  if (verified) return <>{children}</>;

  const handleVerify = () => {
    const year = parseInt(birthYear, 10);
    if (!year || birthYear.length !== 4) {
      setError('출생연도 4자리를 입력해주세요');
      return;
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age < 19) {
      setError('만 19세 이상만 이용할 수 있습니다');
      return;
    }

    sessionStorage.setItem(storageKey, 'true');
    setVerified(true);
  };

  const isValid = birthYear.length === 4;

  return (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="w-full max-w-[440px] relative flex flex-col items-center justify-center" style={{ padding: '0 20px' }}>

        <div className="flex flex-col items-center" style={{ gap: '24px', width: '100%' }}>
          {/* 아이콘 */}
          <div
            className="flex items-center justify-center"
            style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#fff6f7' }}
          >
            <span style={{ fontSize: '32px' }}>🔞</span>
          </div>

          {/* 텍스트 */}
          <div className="flex flex-col items-center" style={{ gap: '8px' }}>
            <p style={{
              fontFamily: font, fontSize: '22px', fontWeight: 600,
              lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
              textAlign: 'center',
            }}>
              성인 인증이 필요합니다
            </p>
            <p style={{
              fontFamily: font, fontSize: '15px', fontWeight: 400,
              lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
              textAlign: 'center',
            }}>
              이 테스트는 만 19세 이상만 이용할 수 있어요
            </p>
          </div>

          {/* 입력 */}
          <div style={{ width: '100%' }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="출생연도 4자리 (예: 1995)"
              value={birthYear}
              onChange={(e) => {
                setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '16px',
                border: error ? '1px solid #d4183d' : '1px solid #e7e7e7',
                backgroundColor: '#ffffff',
                padding: '0 16px',
                fontFamily: font,
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: '20px',
                letterSpacing: '-0.45px',
                color: '#151515',
                textAlign: 'center',
                outline: 'none',
              }}
              maxLength={4}
            />
            {error && (
              <p style={{
                fontFamily: font, fontSize: '12px', color: '#d4183d',
                marginTop: '6px', textAlign: 'center',
              }}>
                {error}
              </p>
            )}
          </div>

          {/* CTA 56px */}
          <button
            onClick={handleVerify}
            disabled={!isValid}
            className="w-full flex items-center justify-center cursor-pointer"
            style={{
              height: '56px',
              borderRadius: '16px',
              backgroundColor: isValid ? '#48b2af' : '#f8f8f8',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
            onPointerDown={e => { if (isValid) e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <span style={{
              fontFamily: font, fontSize: '16px', fontWeight: 500,
              lineHeight: '25px', letterSpacing: '-0.32px',
              color: isValid ? '#ffffff' : '#b7b7b7',
            }}>
              확인
            </span>
          </button>

          {/* 안내 */}
          <p style={{
            fontFamily: font, fontSize: '11px', fontWeight: 400,
            lineHeight: '16px', color: '#b7b7b7', textAlign: 'center',
          }}>
            입력한 정보는 저장되지 않으며, 인증 확인 용도로만 사용됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
