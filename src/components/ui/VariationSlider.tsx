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

interface VariationSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  getHelperText: (v: number) => string;
  endLabels: [string, string];
}

export function VariationSlider({
  label,
  value,
  onChange,
  getHelperText,
  endLabels,
}: VariationSliderProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = SLIDER_CSS;
    document.head.appendChild(style);
  }, []);

  const fillGradient = `linear-gradient(to right, #48b2af 0%, #48b2af ${value}%, #e7e7e7 ${value}%, #e7e7e7 100%)`;
  const sliderStyle = { ['--ndu-vslider-fill' as any]: fillGradient } as CSSProperties;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          paddingLeft: '2px',
        }}
      >
        <label
          style={{
            fontFamily: font,
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: '17px',
            letterSpacing: '-0.24px',
            color: '#151515',
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontFamily: font,
            fontSize: '11px',
            fontWeight: 500,
            color: '#48b2af',
            letterSpacing: '-0.22px',
          }}
        >
          {value}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ndu-vslider"
        style={sliderStyle}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          paddingLeft: '2px',
          paddingRight: '2px',
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontSize: '10px',
            fontWeight: 400,
            color: '#9a9a9a',
            letterSpacing: '0.78px',
          }}
        >
          {endLabels[0]}
        </span>
        <span
          style={{
            fontFamily: font,
            fontSize: '10px',
            fontWeight: 400,
            color: '#9a9a9a',
            letterSpacing: '0.78px',
          }}
        >
          {endLabels[1]}
        </span>
      </div>

      <p
        style={{
          fontFamily: font,
          fontSize: '10px',
          fontWeight: 400,
          color: '#9a9a9a',
          marginTop: '8px',
          paddingLeft: '2px',
          letterSpacing: '0.78px',
        }}
      >
        {getHelperText(value)}
      </p>
    </div>
  );
}
