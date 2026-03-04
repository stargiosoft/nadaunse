/**
 * 알림톡 정보 입력 페이지 (퍼블리싱 테스트)
 * - Figma 디자인 시안 기반 UI 구현
 * - 로직 없이 퍼블리싱만 적용
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeft from './ArrowLeft';

// 카카오 말풍선 아이콘 SVG
const KakaoIcon = () => (
  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.0001 0C4.47725 0 0 3.57389 0 7.98391C0 10.7889 1.84347 13.2519 4.62064 14.6584L3.44767 18.5044C3.33439 18.8636 3.74936 19.1502 4.06262 18.9365L8.65766 15.8453C9.09736 15.9151 9.54539 15.9531 10.0001 15.9531C15.5226 15.9531 20 12.3939 20 7.98391C20 3.57389 15.5226 0 10.0001 0Z"
      fill="#191919"
    />
  </svg>
);

export default function AlimtalkInfoInputPageTest() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');

  // 휴대폰 번호 입력 핸들러 (숫자만)
  const handlePhoneNumberChange = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 11) {
      setPhoneNumber(numbers);
    }
  };

  // 유효성 검사 (11자리, 01로 시작)
  const isValidPhoneNumber = phoneNumber.length === 11 && phoneNumber.startsWith('01');

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative pb-[140px]">

        {/* 상단 네비게이션 */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={handleBack} />
              <p
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  lineHeight: '25.5px',
                  letterSpacing: '-0.36px',
                  color: '#000000',
                  textAlign: 'center',
                }}
              >
                알림톡 정보 입력
              </p>
              <div className="w-[44px]" />
            </div>
          </div>
        </div>

        {/* 네비게이션 높이만큼 여백 */}
        <div style={{ height: '60px' }} />

        {/* 메인 콘텐츠 */}
        <div style={{ padding: '12px 20px 40px 20px' }}>
          <div className="flex flex-col w-full" style={{ gap: '36px' }}>

            {/* 상단 안내 섹션 */}
            <div className="flex flex-col w-full" style={{ gap: '20px' }}>

              {/* 카카오 아이콘 */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: '#fee500',
                  borderRadius: '16px',
                  border: '1px solid #fee500',
                }}
              >
                <KakaoIcon />
              </div>

              {/* 타이틀 & 서브타이틀 */}
              <div className="flex flex-col w-full" style={{ gap: '6px', padding: '0 2px' }}>
                <p
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '22px',
                    fontWeight: 600,
                    lineHeight: '32.5px',
                    letterSpacing: '-0.22px',
                    color: '#151515',
                  }}
                >
                  결과가 나오면{' '}
                  <span style={{ fontWeight: 700, color: '#41a09e' }}>알림톡</span>{' '}
                  보내드릴게요
                </p>

                <div className="flex items-center justify-center w-full" style={{ padding: '0 2px' }}>
                  <p
                    style={{
                      fontFamily: 'Pretendard Variable, sans-serif',
                      fontSize: '15px',
                      fontWeight: 400,
                      lineHeight: '20px',
                      letterSpacing: '-0.45px',
                      color: '#6d6d6d',
                      width: '100%',
                    }}
                  >
                    고객 정보는 알림톡 발송에만 사용돼요
                  </p>
                </div>
              </div>
            </div>

            {/* 휴대폰 번호 입력 필드 */}
            <div className="flex flex-col w-full" style={{ gap: '4px' }}>

              {/* 라벨 */}
              <div className="flex items-center w-full" style={{ padding: '0 4px' }}>
                <label
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: '16px',
                    letterSpacing: '-0.24px',
                    color: '#848484',
                  }}
                >
                  휴대폰 번호
                </label>
              </div>

              {/* 입력 필드 */}
              <div
                className="flex items-center w-full"
                style={{
                  height: '56px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e7e7e7',
                  borderRadius: '16px',
                  padding: '0 12px',
                }}
              >
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  placeholder="'-'하이픈 없이 숫자만 입력해 주세요"
                  className="w-full outline-none bg-transparent"
                  style={{
                    fontFamily: 'Pretendard Variable, sans-serif',
                    fontSize: '15px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    letterSpacing: '-0.45px',
                    color: phoneNumber ? '#151515' : '#b7b7b7',
                  }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white"
          style={{
            boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
          }}
        >
          <div style={{ padding: '12px 20px' }}>
            <button
              disabled={!isValidPhoneNumber}
              className="w-full flex items-center justify-center transition-colors"
              style={{
                height: '56px',
                borderRadius: '16px',
                backgroundColor: isValidPhoneNumber ? '#48b2af' : '#f8f8f8',
                cursor: isValidPhoneNumber ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'Pretendard Variable, sans-serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  lineHeight: '25px',
                  letterSpacing: '-0.32px',
                  color: isValidPhoneNumber ? '#ffffff' : '#b7b7b7',
                }}
              >
                다음
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
