/**
 * 운테 전용 경량 사주 입력 폼
 * FreeBirthInfoInput 기반으로 간소화 — 비로그인 OK
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

    onSubmit({
      name: name.trim(),
      gender,
      birthDate: formattedDate,
      birthTime: formattedTime,
      calendarType,
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #e5e5e5',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: '#fafafa',
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#ff4444',
  };

  return (
    <div className="flex flex-col gap-4">
      {label && (
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>{label}</p>
      )}

      {/* 이름 */}
      <div>
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
          onKeyDown={(e) => e.key === 'Enter' && birthDateRef.current?.focus()}
          style={errors.name ? errorInputStyle : inputStyle}
          maxLength={10}
        />
        {errors.name && <p style={{ fontSize: '12px', color: '#ff4444', marginTop: '4px' }}>{errors.name}</p>}
      </div>

      {/* 성별 */}
      <div className="flex gap-2">
        {(['female', 'male'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className="flex-1 py-2.5 rounded-xl cursor-pointer"
            style={{
              border: gender === g ? '2px solid #48b2af' : '1.5px solid #e5e5e5',
              backgroundColor: gender === g ? '#f0f8f8' : '#fafafa',
              color: gender === g ? '#48b2af' : '#888',
              fontSize: '14px',
              fontWeight: gender === g ? 600 : 400,
            }}
          >
            {g === 'female' ? '여성' : '남성'}
          </button>
        ))}
      </div>

      {/* 양력/음력 */}
      <div className="flex gap-2">
        {(['solar', 'lunar'] as const).map((ct) => (
          <button
            key={ct}
            onClick={() => setCalendarType(ct)}
            className="flex-1 py-2 rounded-xl cursor-pointer"
            style={{
              border: calendarType === ct ? '2px solid #48b2af' : '1.5px solid #e5e5e5',
              backgroundColor: calendarType === ct ? '#f0f8f8' : '#fafafa',
              color: calendarType === ct ? '#48b2af' : '#888',
              fontSize: '13px',
              fontWeight: calendarType === ct ? 600 : 400,
            }}
          >
            {ct === 'solar' ? '양력' : '음력'}
          </button>
        ))}
      </div>

      {/* 생년월일 */}
      <div>
        <input
          ref={birthDateRef}
          type="text"
          inputMode="numeric"
          placeholder="생년월일 8자리 (19950101)"
          value={birthDate}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 8);
            setBirthDate(v);
            setErrors(prev => ({ ...prev, birthDate: '' }));
            if (v.length === 8) birthTimeRef.current?.focus();
          }}
          style={errors.birthDate ? errorInputStyle : inputStyle}
          maxLength={8}
        />
        {errors.birthDate && <p style={{ fontSize: '12px', color: '#ff4444', marginTop: '4px' }}>{errors.birthDate}</p>}
      </div>

      {/* 태어난 시간 */}
      <div>
        <input
          ref={birthTimeRef}
          type="text"
          inputMode="numeric"
          placeholder="태어난 시간 4자리 (1430)"
          value={birthTime}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
            setBirthTime(v);
            setErrors(prev => ({ ...prev, birthTime: '' }));
          }}
          style={errors.birthTime ? errorInputStyle : inputStyle}
          disabled={unknownTime}
          maxLength={4}
        />
        {errors.birthTime && <p style={{ fontSize: '12px', color: '#ff4444', marginTop: '4px' }}>{errors.birthTime}</p>}
      </div>

      {/* 시간 모름 체크박스 */}
      <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '13px', color: '#888' }}>
        <input
          type="checkbox"
          checked={unknownTime}
          onChange={(e) => {
            setUnknownTime(e.target.checked);
            if (e.target.checked) {
              setBirthTime('');
              setErrors(prev => ({ ...prev, birthTime: '' }));
            }
          }}
          style={{ accentColor: '#48b2af' }}
        />
        태어난 시간을 모르겠어요
      </label>

      {/* 제출 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-3.5 rounded-2xl cursor-pointer"
        style={{
          backgroundColor: isLoading ? '#ccc' : '#48b2af',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 700,
          border: 'none',
        }}
      >
        {isLoading ? '분석 중...' : '결과 보기'}
      </button>
    </div>
  );
}
