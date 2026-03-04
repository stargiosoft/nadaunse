import { forwardRef, useState } from 'react';

const font = "'Pretendard Variable', sans-serif";

// ─── 상태별 토큰 (피그마 시안 1:1 대응) ────────────────────────────────────────
// 기본:     border #f9f9f9 (배경과 동일 = 숨김)
// 포커스:   border #48b2af
// 입력중:   border #48b2af + 카운터 숫자 #48b2af SemiBold
// 입력완료: border #f9f9f9 + 카운터 숫자 #48b2af SemiBold
// 비활성:   border #f9f9f9 + 라벨/placeholder/카운터 모두 흐리게

export interface TextareaInputProps {
  /** 입력창 위 라벨 (옵션) — 14px, #6d6d6d */
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  /** 최대 글자수 (기본 200) */
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  /** textarea 행 수 (기본 6) */
  rows?: number;
  id?: string;
  /** 외부 래퍼에 추가할 className */
  wrapperClassName?: string;
}

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  function TextareaInput(
    {
      label,
      placeholder = '',
      value,
      onChange,
      maxLength = 200,
      disabled = false,
      autoFocus = false,
      rows = 6,
      id,
      wrapperClassName = '',
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const hasContent = value.length > 0;

    // ── 상태 계산 ───────────────────────────────────────────────────────────────
    const borderColor = isFocused && !disabled ? '#48b2af' : '#f9f9f9';
    const labelColor  = disabled ? '#b7b7b7' : '#6d6d6d';

    // ── 글자수 카운터 렌더링 ────────────────────────────────────────────────────
    const CounterNode = () => {
      if (disabled) {
        return (
          <span
            style={{
              fontFamily: font,
              fontSize: 13,
              fontWeight: 400,
              color: '#d4d4d4',
              letterSpacing: '-0.26px',
              lineHeight: '19px',
              whiteSpace: 'nowrap',
            }}
          >
            {value.length}/{maxLength}자
          </span>
        );
      }
      if (hasContent) {
        // 입력중 / 입력완료: 숫자만 teal SemiBold
        return (
          <span
            style={{
              fontFamily: font,
              fontSize: 13,
              fontWeight: 400,
              color: '#999999',
              letterSpacing: '-0.26px',
              lineHeight: '19px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontWeight: 600, color: '#48b2af' }}>{value.length}</span>
            /{maxLength}자
          </span>
        );
      }
      // 기본 / 포커스: 전체 #999
      return (
        <span
          style={{
            fontFamily: font,
            fontSize: 13,
            fontWeight: 400,
            color: '#999999',
            letterSpacing: '-0.26px',
            lineHeight: '19px',
            whiteSpace: 'nowrap',
          }}
        >
          {value.length}/{maxLength}자
        </span>
      );
    };

    // placeholder 색상 (CSS 클래스로 처리)
    const placeholderClass = disabled
      ? 'nds-textarea nds-textarea--disabled'
      : 'nds-textarea';

    return (
      <div
        className={`flex flex-col w-full ${wrapperClassName}`}
        style={{ gap: 4 }}
      >
        {/* ── 라벨 ── */}
        {label && (
          <div style={{ paddingLeft: 4, paddingRight: 4 }}>
            <p
              style={{
                fontFamily: font,
                fontSize: 14,
                fontWeight: 400,
                color: labelColor,
                letterSpacing: '-0.42px',
                lineHeight: '22px',
              }}
            >
              {label}
            </p>
          </div>
        )}

        {/* ── 콘텐츠 박스 ── */}
        <div
          style={{
            backgroundColor: '#f9f9f9',
            borderRadius: 20,
            border: `1px solid ${borderColor}`,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'border-color 0.15s ease',
            position: 'relative',
          }}
        >
          {/* textarea */}
          <textarea
            ref={ref}
            id={id}
            autoFocus={autoFocus}
            value={value}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            className={placeholderClass}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                onChange(e.target.value);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              resize: 'none',
              fontFamily: font,
              fontSize: 15,
              fontWeight: 400,
              color: '#000000',
              letterSpacing: '-0.3px',
              lineHeight: '25.5px',
              padding: '0 4px',
              opacity: 1,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />

          {/* 글자수 카운터 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 4 }}>
            <CounterNode />
          </div>
        </div>

        {/* placeholder 색상 CSS */}
        <style>{`
          .nds-textarea::placeholder            { color: #b7b7b7; }
          .nds-textarea--disabled::placeholder  { color: #d4d4d4; }
        `}</style>
      </div>
    );
  }
);
