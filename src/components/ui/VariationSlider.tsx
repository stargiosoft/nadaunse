const font = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const STEPS = [0, 25, 50, 75, 100];

interface VariationSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  getHelperText: (v: number) => string;
  endLabels: [string, string];
  disabled?: boolean;
}

export function VariationSlider({
  label,
  value,
  onChange,
  getHelperText,
  endLabels,
  disabled = false,
}: VariationSliderProps) {
  return (
    <div style={{ opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s ease' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px', paddingLeft: '2px',
      }}>
        <label style={{
          fontFamily: font, fontSize: '12px', fontWeight: 400,
          lineHeight: '17px', letterSpacing: '-0.24px', color: '#151515',
        }}>
          {label}
        </label>
        <span style={{
          fontFamily: font, fontSize: '11px', fontWeight: 500,
          color: disabled ? '#b0b0b0' : '#48b2af', letterSpacing: '-0.22px',
        }}>
          {disabled ? 0 : value}
        </span>
      </div>

      {/* 5단계 세그먼트 바 */}
      <div style={{ display: 'flex', gap: '4px', height: '6px' }}>
        {STEPS.map((stepVal, i) => {
          const active = !disabled && value / 25 >= i;
          return (
            <div
              key={stepVal}
              onClick={() => { if (!disabled) onChange(stepVal); }}
              style={{
                flex: 1, height: '6px', borderRadius: '3px',
                backgroundColor: active ? '#48b2af' : '#e7e7e7',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            />
          );
        })}
      </div>

      {/* 끝 라벨 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '8px', paddingLeft: '2px', paddingRight: '2px',
      }}>
        <span style={{ fontFamily: font, fontSize: '10px', color: '#9a9a9a', letterSpacing: '0.78px' }}>
          {endLabels[0]}
        </span>
        <span style={{ fontFamily: font, fontSize: '10px', color: '#9a9a9a', letterSpacing: '0.78px' }}>
          {endLabels[1]}
        </span>
      </div>

      {/* 헬퍼 텍스트 */}
      <p style={{
        fontFamily: font, fontSize: '10px', color: '#9a9a9a',
        marginTop: '8px', paddingLeft: '2px', letterSpacing: '0.78px',
      }}>
        {disabled ? '값:0 고정 — 모든 컷 동일하게 생성' : getHelperText(value)}
      </p>
    </div>
  );
}
