import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import svgPaths from '../imports/svg-785lw9iqbw';
import svgPathsSearch from '../imports/svg-0xbeh2zzam';
import svgPathsEmpty from '../imports/svg-s8czvl35mx';
import svgPathsCnax from '../imports/svg-cnaxp9yhnd';
import { ALL_ITEMS, LabelBadge, EyeIcon, type FortuneItem } from './FortuneAllPage';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  black:    '#000000',
  charcoal: '#151515',
  gray400:  '#999999',
  gray600:  '#848484',
  inputBg:  '#f8f8f8',
  white:    '#ffffff',
} as const;

const font = "'Pretendard Variable', sans-serif";

// ─── Icons ────────────────────────────────────────────────────────────────────
function ArrowLeftIcon() {
  return (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path
        d={svgPaths.p2a5cd480}
        stroke="#848484"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SearchIcon({ color = '#B7B7B7' }: { color?: string }) {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path
        d={svgPaths.p1cd7af0}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M16.5 16.5L15 15"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M8.5 1.5L1.5 8.5M1.5 1.5L8.5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Keyboard height hook (모바일 전용) ───────────────────────────────────────
function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (!isMobile || !window.visualViewport) return;

    const vv = window.visualViewport;

    const update = () => {
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kh);
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return keyboardHeight;
}

// ─── Search Result Row Item (순위 배지 없음) ──────────────────────────────────
function SearchResultItem({ item, onClick }: { item: FortuneItem; onClick?: () => void }) {
  return (
    <div
      className="w-full cursor-pointer"
      style={{
        backgroundColor: C.white,
        transition: 'background-color 0.15s ease',
      }}
      onTouchStart={() => {}}
      onPointerDown={(e) => {
        e.currentTarget.style.backgroundColor = '#FBFBFB';
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.backgroundColor = '';
        onClick?.();
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
      onPointerCancel={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      <div
        className="flex items-start"
        style={{ padding: '10px 20px', gap: 12 }}
      >
        {/* 썸네일 */}
        <div
          className="pointer-events-none relative rounded-[8px] shrink-0"
          style={{ width: 69, height: 47 }}
        >
          <img
            alt={item.title}
            className="absolute inset-0 max-w-none object-cover rounded-[8px] size-full"
            src={item.img}
          />
          <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[9px]" />
        </div>

        {/* 텍스트 영역 */}
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 4 }}>
          <p
            className="w-full overflow-hidden"
            style={{
              fontFamily: font,
              fontSize: 14,
              fontWeight: 500,
              color: C.black,
              letterSpacing: '-0.42px',
              lineHeight: '22px',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {item.title}
          </p>
          <div className="flex items-center" style={{ gap: 3 }}>
            {item.labels.map((l) => <LabelBadge key={l} type={l} />)}
          </div>
          <div className="flex items-center" style={{ gap: 2 }}>
            <EyeIcon />
            <span style={{ fontFamily: font, fontSize: 11, fontWeight: 400, color: C.gray400, lineHeight: '16px' }}>
              {item.views}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 검색 결과 없음 UI ─────────────────────────────────────────────────────────
function EmptyResult({ query }: { query: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ padding: '60px 20px', gap: 16 }}
    >
      {/* 돋보기 + X 아이콘 */}
      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0, overflow: 'hidden' }}>
        {/* 손잡이 */}
        <div style={{ position: 'absolute', inset: '55.36% 12.5% 12.5% 55.36%' }}>
          <svg style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 20.5667 20.566">
            <path d={svgPathsCnax.p2e8d380} fill="#D4D4D4" />
          </svg>
        </div>
        {/* 외곽 링 */}
        <div style={{ position: 'absolute', inset: '12.5% 29.17% 29.17% 12.5%' }}>
          <svg style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 37.3333 37.3333">
            <path d={svgPathsCnax.p12fbf9a0} fill="#999999" />
          </svg>
        </div>
        {/* X 마크 */}
        <div style={{ position: 'absolute', inset: '31.25% 46.85% 46.83% 31.25%' }}>
          <svg style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 14.0153 14.0293">
            <path d={svgPathsCnax.pf506180} fill="#D4D4D4" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        <p
          style={{
            fontFamily: font,
            fontSize: 16,
            fontWeight: 500,
            color: C.gray400,
            letterSpacing: '-0.32px',
            lineHeight: '28.5px',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          '{query}'에 대한 검색 결과가 없어요
        </p>
        <p
          style={{
            fontFamily: font,
            fontSize: 14,
            fontWeight: 400,
            color: '#b7b7b7',
            letterSpacing: '-0.42px',
            lineHeight: '22px',
            textAlign: 'center',
          }}
        >
          다른 키워드로 검색해보세요
        </p>
      </div>
    </div>
  );
}

// ─── SearchPage ───────────────────────────────────────────────────────────────
export function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const keyboardHeight = useKeyboardHeight();

  // Fuse 인스턴스
  const fuse = useMemo(
    () =>
      new Fuse(ALL_ITEMS, {
        keys: [
          { name: 'title',    weight: 0.6 },
          { name: 'keywords', weight: 0.4 },
        ],
        threshold: 0.45,
        distance: 200,
        minMatchCharLength: 1,
        ignoreLocation: true,
        useExtendedSearch: false,
      }),
    []
  );

  const filteredItems: FortuneItem[] = useMemo(() => {
    if (!submittedQuery.trim()) return [];
    return fuse.search(submittedQuery).map((r) => r.item);
  }, [submittedQuery, fuse]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = () => {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    if (trimmed) {
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setSubmittedQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim() === '') {
      setSubmittedQuery('');
    }
  };

  const hasSubmitted = submittedQuery.trim() !== '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: C.white,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minWidth: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.white,
        }}
      >
        {/* ── 상단 검색 바 ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 16,
            backgroundColor: C.white,
            flexShrink: 0,
          }}
        >
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => navigate(-1)}
            onTouchStart={() => {}}
            onPointerDown={(e) => {
              e.currentTarget.style.backgroundColor = '#F4F4F4';
              const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
              if (inner) inner.style.transform = 'scale(0.88)';
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
              if (inner) inner.style.transform = 'scale(1)';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
              if (inner) inner.style.transform = 'scale(1)';
            }}
            onPointerCancel={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              const inner = e.currentTarget.querySelector('.btn-icon-inner') as HTMLElement;
              if (inner) inner.style.transform = 'scale(1)';
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
              padding: 4,
              transition: 'background-color 0.15s ease-out',
            }}
          >
            <span className="btn-icon-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}>
              <ArrowLeftIcon />
            </span>
          </button>

          {/* 검색 인풋 필드 */}
          <div
            style={{
              flex: 1,
              backgroundColor: C.inputBg,
              borderRadius: 16,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 운세를 검색해보세요"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontFamily: font,
                fontSize: 15,
                fontWeight: 400,
                color: C.charcoal,
                lineHeight: '25.5px',
                letterSpacing: '-0.3px',
                minWidth: 0,
              } as React.CSSProperties}
            />

            {query ? (
              <button
                onPointerDown={e => e.preventDefault()}
                onClick={handleClear}
                style={{
                  width: 18,
                  height: 18,
                  border: 'none',
                  backgroundColor: '#cccccc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <ClearIcon />
              </button>
            ) : (
              <SearchIcon />
            )}
          </div>
        </div>

        {/* ── 콘텐츠 영역 ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: keyboardHeight,
            transition: 'padding-bottom 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* 검색 전: 빈 안내 상태 */}
          {!hasSubmitted && (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: '60px 20px', gap: 20 }}
            >
              {/* 돋보기 일러스트 */}
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '37.5% 54.17% 45.83% 29.17%' }}>
                  <svg style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 10.6667">
                    <path d={svgPathsSearch.p9f04000} fill="#D4D4D4" />
                  </svg>
                </div>
                <div style={{ position: 'absolute', inset: '55.36% 12.5% 12.5% 55.36%' }}>
                  <svg style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 20.5667 20.566">
                    <path d={svgPathsSearch.p2e8d380} fill="#D4D4D4" />
                  </svg>
                </div>
                <div style={{ position: 'absolute', inset: '12.5% 29.17% 29.17% 12.5%' }}>
                  <svg style={{ position: 'absolute', display: 'block', width: '100%', height: '100%' }} fill="none" preserveAspectRatio="none" viewBox="0 0 37.3333 37.3333">
                    <path d={svgPathsSearch.p12fbf9a0} fill="#999999" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col" style={{ gap: 8, width: '100%', textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: font,
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#999999',
                    letterSpacing: '-0.32px',
                    lineHeight: '28.5px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {'찾고 싶은 운세를 검색해\n 원하는 주제만 모아볼 수 있어요'}
                </p>
                <p
                  style={{
                    fontFamily: font,
                    fontSize: 14,
                    fontWeight: 400,
                    color: '#b7b7b7',
                    letterSpacing: '-0.42px',
                    lineHeight: '22px',
                  }}
                >
                  예) 짝사랑, 이직, 금전운 등
                </p>
              </div>
            </div>
          )}

          {/* 검색 후: 결과 없음 */}
          {hasSubmitted && filteredItems.length === 0 && (
            <EmptyResult query={submittedQuery} />
          )}

          {/* 검색 후: 결과 리스트 */}
          {hasSubmitted && filteredItems.length > 0 && (
            <div className="flex flex-col w-full" style={{ backgroundColor: C.white }}>
              {filteredItems.map((item, index) => (
                <div key={item.rank}>
                  {index > 0 && (
                    <div style={{ height: 1, backgroundColor: '#F9F9F9' }} />
                  )}
                  <SearchResultItem item={item} />
                </div>
              ))}
              <div style={{ height: 40 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
