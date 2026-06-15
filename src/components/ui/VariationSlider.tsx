import type { CSSProperties } from 'react';
import { useEffect } from 'react';

const STYLE_ID = 'ndu-variation-slider-styles';
const SLIDER_CSS = `
.ndu-vslider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 24px;
  background: transparent;
  outline: none;
  margin: 0;
  padding: 0;
  cursor: pointer;
  display: block;
}
.ndu-vslider:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
.ndu-vslider:focus { outline: none; }

/* WebKit / Blink */
.ndu-vslider::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  cursor: pointer;
  background: var(--ndu-vslider-fill, #e7e7e7);
}
.ndu-vslider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #48b2af;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  transition: transform 0.12s ease;
  margin-top: -6px;
}
.ndu-vslider::-webkit-slider-thumb:hover {
  transform: scale(1.12);
}
.ndu-vslider:active::-webkit-slider-thumb {
  transform: scale(1.18);
}

/* Firefox */
.ndu-vslider::-moz-range-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  cursor: pointer;
  background: #e7e7e7;
  border: none;
}
.ndu-vslider::-moz-range-progress {
  height: 4px;
  border-radius: 2px;
  background: #48b2af;
}
.ndu-vslider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #48b2af;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
}
`;

const font = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const STEPS = [0, 25, 50, 75, 100];

interface LockCheckbox {
  checked: boolean;
  onChange: (v: boolean) => void;
}

interface VariationSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  getHelperText: (v: number) => string;
  endLabels: [string, string];
  lockCheckbox?: LockCheckbox;
}

export function VariationSlider({
  label,
  value,
  onChange,
  getHelperText,
  endLabels,
  lockCheckbox,
}: VariationSliderProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = SLIDER_CSS;
    document.head.appendChild(style);
  }, []);

  const locked = lockCheckbox?.checked ?? false;
  const displayValue = locked ? 0 : value;
  const fillGradient = `linear-gradient(to right, #48b2af 0%, #48b2af ${displayValue}%, #e7e7e7 ${displayValue}%, #e7e7e7 100%)`;
  const sliderStyle = { ['--ndu-vslider-fill' as any]: fillGradient } as CSSProperties;

  return (
    <div>
      {/* 헤더 라인 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingLeft: '2px',
      }}>
        <label style={{
          fontFamily: font,
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: '17px',
          letterSpacing: '-0.24px',
          color: '#151515',
        }}>
          {label}
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 커스텀 체크박스: [값:0 텍스트] [체크박스] */}
          {lockCheckbox && (
            <div
              onClick={() => lockCheckbox.onChange(!locked)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              <span style={{
                fontFamily: font,
                fontSize: '10px',
                fontWeight: 400,
                color: locked ? '#48b2af' : '#b0b0b0',
                letterSpacing: '-0.2px',
              }}>
                값:0
              </span>
              {/* 커스텀 체크박스 박스 */}
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '10px',
                backgroundColor: locked ? '#48b2af' : 'transparent',
                border: locked ? 'none' : '1.5px solid #c8c8c8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}>
                {locked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* 현재 값 (locked일 때 숨김) */}
          {!locked && (
            <span style={{
              fontFamily: font,
              fontSize: '11px',
              fontWeight: 500,
              color: '#48b2af',
              letterSpacing: '-0.22px',
              minWidth: '20px',
              textAlign: 'right',
            }}>
              {displayValue}
            </span>
          )}
        </div>
      </div>

      {/* 슬라이더 */}
      <input
        type="range"
        min={0}
        max={100}
        step={25}
        value={displayValue}
        disabled={locked}
        onChange={e => onChange(Number(e.target.value))}
        className="ndu-vslider"
        style={sliderStyle}
      />

      {/* 5단계 점 표시 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '4px', paddingLeft: '1px', paddingRight: '1px',
      }}>
        {STEPS.map(step => (
          <div
            key={step}
            style={{
              width: '4px', height: '4px',
              borderRadius: '50%',
              backgroundColor: !locked && displayValue >= step ? '#48b2af' : '#e0e0e0',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* 끝 라벨 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '6px',
        paddingLeft: '2px',
        paddingRight: '2px',
      }}>
        <span style={{
          fontFamily: font, fontSize: '10px', fontWeight: 400,
          color: '#9a9a9a', letterSpacing: '0.78px',
        }}>
          {endLabels[0]}
        </span>
        <span style={{
          fontFamily: font, fontSize: '10px', fontWeight: 400,
          color: '#9a9a9a', letterSpacing: '0.78px',
        }}>
          {endLabels[1]}
        </span>
      </div>

      {/* 헬퍼 텍스트 */}
      <p style={{
        fontFamily: font, fontSize: '10px', fontWeight: 400,
        color: '#9a9a9a', marginTop: '8px',
        paddingLeft: '2px', letterSpacing: '0.78px',
      }}>
        {locked ? '앵글·이미지 변주 없음 — 모든 컷 동일하게 생성' : getHelperText(displayValue)}
      </p>
    </div>
  );
}
