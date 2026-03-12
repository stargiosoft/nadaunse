/**
 * 19금 성인 인증 게이트 컴포넌트
 * sessionStorage에 인증 상태 저장
 */

import { useState, useEffect } from 'react';

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

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#1a1a2e' }}>
      <div
        className="w-full max-w-sm p-8 rounded-3xl flex flex-col items-center gap-6"
        style={{ backgroundColor: '#fff' }}
      >
        <div style={{ fontSize: '48px' }}>🔞</div>

        <div className="text-center">
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
            성인 인증이 필요합니다
          </p>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
            이 테스트는 만 19세 이상만 이용할 수 있어요
          </p>
        </div>

        <div className="w-full">
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
            className="w-full"
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              border: error ? '1.5px solid #ff4444' : '1.5px solid #e5e5e5',
              fontSize: '16px',
              textAlign: 'center',
              outline: 'none',
            }}
            maxLength={4}
          />
          {error && (
            <p style={{ fontSize: '12px', color: '#ff4444', marginTop: '6px', textAlign: 'center' }}>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleVerify}
          className="w-full py-3.5 rounded-2xl cursor-pointer"
          style={{
            backgroundColor: '#48b2af',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
          }}
        >
          확인
        </button>

        <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center' }}>
          입력한 정보는 저장되지 않으며, 인증 확인 용도로만 사용됩니다.
        </p>
      </div>
    </div>
  );
}
