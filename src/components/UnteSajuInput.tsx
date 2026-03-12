/**
 * 운테 전용 경량 사주 입력 폼
 * ★DESIGN_SYSTEM★ 기반 — 입력 필드 56px/16px radius, CTA 56px
 */

import { useState, useRef } from 'react';

export interface UnteBirthData {
  name: string;
  gender: 'female' | 'male';
  birthDate: string;
  birthTime: string;
  calendarType: 'solar' | 'lunar';
}

interface UnteSajuInputProps {
  onSubmit: (data: UnteBirthData) => void;
  isLoading?: boolean;
  label?: string;
}

const font = "'Pretendard Variable', sans-serif";

export default function UnteSajuInput({ onSubmit, isLoading, label = '내 정보 입력' }: UnteSajuInputProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const birthDateRef = useRef<HTMLInputElement>(null);
  const birthTimeRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '이름을 입력해주세요';
    if (!birthDate || birthDate.length !== 8) newErrors.birthDate = '생년월일 8자리를 입력해주세요';
    if (!unknownTime && (!birthTime || birthTime.length !== 4)) newErrors.birthTime = '태어난 시간 4자리를 입력해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const formattedDate = `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`;
    const formattedTime = unknownTime ? '12:00' : `${birthTime.slice(0, 2)}:${birthTime.slice(2, 4)}`;
    onSubmit({ name: name.trim(), gender, birthDate: formattedDate, birthTime: formattedTime, calendarType });
  };

  const inputWrapStyle = (hasError: boolean): React.CSSProperties => ({
    height: '56px',
    backgroundColor: '#ffffff',
    border: hasError ? '1px solid #d4183d' : '1px solid #e7e7e7',
    borderRadius: '16px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  });

  const inputTextStyle: React.CSSProperties = {
    fontFamily: font,
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '-0.45px',
    color: '#151515',
    width: '100%',
    outline: 'none',
    border: 'none',
    backgroundColor: 'transparent',
  };

  const isValid = name.trim() && birthDate.length === 8 && (unknownTime || birthTime.length === 4);

  return (
    <div className="flex flex-col" style={{ gap: '16px' }}>
      {label && (
        <p style={{
          fontFamily: font, fontSize: '22px', fontWeight: 600,
          lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
        }}>
          {label}
        </p>
      )}

      {/* 이름 */}
      <div>
        <label style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484', display: 'block', marginBottom: '6px' }}>
          이름
        </label>
        <div style={inputWrapStyle(!!errors.name)}>
          <input
            type="text"
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            onKeyDown={(e) => e.key === 'Enter' && birthDateRef.current?.focus()}
            style={inputTextStyle}
            maxLength={10}
          />
        </div>
        {errors.name && <p style={{ fontFamily: font, fontSize: '12px', color: '#d4183d', marginTop: '4px' }}>{errors.name}</p>}
      </div>

      {/* 성별 + 양/음력 */}
      <div className="flex" style={{ gap: '8px' }}>
        <div className="flex-1">
          <label style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484', display: 'block', marginBottom: '6px' }}>성별</label>
          <div className="flex" style={{ gap: '8px' }}>
            {(['female', 'male'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className="flex-1 flex items-center justify-center cursor-pointer"
                style={{
                  height: '48px',
                  borderRadius: '16px',
                  border: gender === g ? '1.5px solid #48b2af' : '1px solid #e7e7e7',
                  backgroundColor: gender === g ? '#f0f8f8' : '#ffffff',
                  fontFamily: font, fontSize: '14px', fontWeight: gender === g ? 600 : 400,
                  letterSpacing: '-0.42px',
                  color: gender === g ? '#48b2af' : '#6d6d6d',
                  transition: 'all 0.15s ease',
                }}
              >
                {g === 'female' ? '여성' : '남성'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '120px', flexShrink: 0 }}>
          <label style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484', display: 'block', marginBottom: '6px' }}>달력</label>
          <div className="flex" style={{ gap: '8px' }}>
            {(['solar', 'lunar'] as const).map((ct) => (
              <button
                key={ct}
                onClick={() => setCalendarType(ct)}
                className="flex-1 flex items-center justify-center cursor-pointer"
                style={{
                  height: '48px',
                  borderRadius: '16px',
                  border: calendarType === ct ? '1.5px solid #48b2af' : '1px solid #e7e7e7',
                  backgroundColor: calendarType === ct ? '#f0f8f8' : '#ffffff',
                  fontFamily: font, fontSize: '13px', fontWeight: calendarType === ct ? 600 : 400,
                  color: calendarType === ct ? '#48b2af' : '#6d6d6d',
                  transition: 'all 0.15s ease',
                }}
              >
                {ct === 'solar' ? '양력' : '음력'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 생년월일 */}
      <div>
        <label style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484', display: 'block', marginBottom: '6px' }}>
          생년월일
        </label>
        <div style={inputWrapStyle(!!errors.birthDate)}>
          <input
            ref={birthDateRef}
            type="text"
            inputMode="numeric"
            placeholder="8자리 입력 (19950101)"
            value={birthDate}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 8);
              setBirthDate(v);
              setErrors(prev => ({ ...prev, birthDate: '' }));
              if (v.length === 8) birthTimeRef.current?.focus();
            }}
            style={inputTextStyle}
            maxLength={8}
          />
        </div>
        {errors.birthDate && <p style={{ fontFamily: font, fontSize: '12px', color: '#d4183d', marginTop: '4px' }}>{errors.birthDate}</p>}
      </div>

      {/* 태어난 시간 */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
          <label style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484' }}>
            태어난 시간
          </label>
          <label className="flex items-center cursor-pointer" style={{ gap: '6px' }}>
            <input
              type="checkbox"
              checked={unknownTime}
              onChange={(e) => {
                setUnknownTime(e.target.checked);
                if (e.target.checked) { setBirthTime(''); setErrors(prev => ({ ...prev, birthTime: '' })); }
              }}
              style={{ accentColor: '#48b2af', width: '16px', height: '16px' }}
            />
            <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 400, color: '#848484' }}>모름</span>
          </label>
        </div>
        <div style={{ ...inputWrapStyle(!!errors.birthTime), opacity: unknownTime ? 0.5 : 1 }}>
          <input
            ref={birthTimeRef}
            type="text"
            inputMode="numeric"
            placeholder="4자리 입력 (1430)"
            value={birthTime}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              setBirthTime(v);
              setErrors(prev => ({ ...prev, birthTime: '' }));
            }}
            style={inputTextStyle}
            disabled={unknownTime}
            maxLength={4}
          />
        </div>
        {errors.birthTime && <p style={{ fontFamily: font, fontSize: '12px', color: '#d4183d', marginTop: '4px' }}>{errors.birthTime}</p>}
      </div>

      {/* CTA 버튼 — 디자인 시스템 56px/16px */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !isValid}
        className="w-full flex items-center justify-center cursor-pointer"
        style={{
          height: '56px',
          borderRadius: '16px',
          backgroundColor: isLoading || !isValid ? '#f8f8f8' : '#48b2af',
          border: 'none',
          transition: 'all 0.15s ease',
          marginTop: '8px',
        }}
        onPointerDown={e => { if (isValid && !isLoading) e.currentTarget.style.transform = 'scale(0.99)'; }}
        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
      >
        <span style={{
          fontFamily: font, fontSize: '16px', fontWeight: 500,
          lineHeight: '25px', letterSpacing: '-0.32px',
          color: isLoading || !isValid ? '#b7b7b7' : '#ffffff',
        }}>
          {isLoading ? '분석 중...' : '결과 보기'}
        </span>
      </button>
    </div>
  );
}
