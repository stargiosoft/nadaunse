import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import svgPaths from '../imports/svg-785lw9iqbw';
import svgPathsSearch from '../imports/svg-0xbeh2zzam';
import svgPathsCnax from '../imports/svg-cnaxp9yhnd';
import { LabelBadge, EyeIcon } from './FortuneAllPage';
import { supabase } from '../lib/supabase';
import { isContentNew } from '../components/ContentTags';
import { logger } from '../lib/logger';
import SEO from '../components/SEO';

type LabelType = 'New' | '무료' | '심화' | '유료';

interface SearchItem {
  id: string;
  title: string;
  contentType: 'free' | 'paid';
  labels: LabelType[];
  views: number;
  img: string;
}

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
function SearchResultItem({ item, onClick }: { item: SearchItem; onClick?: () => void }) {
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
        style={{ padding: '8px 20px 5px', gap: 12 }}
      >
        {/* 썸네일 */}
        <div
          className="pointer-events-none relative shrink-0"
          style={{ width: 69, height: 47, borderRadius: 10 }}
        >
          <img
            alt={item.title}
            className="absolute inset-0 max-w-none object-cover size-full"
            style={{ borderRadius: 10 }}
            src={item.img}
          />
          <div aria-hidden="true" className="absolute border border-[#f9f9f9] border-solid inset-[-1px]" style={{ borderRadius: 11 }} />
        </div>

        {/* 텍스트 영역 */}
        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2, marginTop: -2 }}>
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
      style={{ padding: '44px 20px', gap: 16 }}
    >
      {/* 돋보기 + X 아이콘 */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
        <line x1="38.5" y1="38.5" x2="54.5" y2="54.5" stroke="#E7E7E7" strokeWidth="4.3" strokeLinecap="round"/>
        <circle cx="26.6667" cy="26.6667" r="16" stroke="#D4D4D4" strokeWidth="4.3"/>
        <path d="M30.2778 27.0146L33.3145 23.975C34.2488 23.0397 34.2488 21.6367 33.3145 20.7015C32.3801 19.7662 30.9786 19.7662 30.0443 20.7015L27.0076 23.7411L23.971 20.7015C23.0366 19.7662 21.6351 19.7662 20.7008 20.7015C19.7664 21.6367 19.7664 23.0397 20.7008 23.975L23.7374 27.0146L20.7008 30.0543C19.7664 30.9896 19.7664 32.3925 20.7008 33.3278C21.6351 34.2631 23.0366 34.2631 23.971 33.3278L27.0076 30.2881L30.0443 33.3278C30.9786 34.2631 32.3801 34.2631 33.3145 33.3278C34.2488 32.3925 34.2488 30.9896 33.3145 30.0543L30.2778 27.0146Z" fill="#E7E7E7" transform="translate(27,27) scale(0.82) translate(-27,-27)"/>
      </svg>

      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        <p
          style={{
            fontFamily: font,
            fontSize: 16,
            fontWeight: 500,
            color: '#6D6D6D',
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

// ─── Supabase 검색 (ILIKE 부분 일치) ─────────────────────────────────────────
async function searchContents(q: string): Promise<SearchItem[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  // OR 조건: title, category_main ILIKE, 해시태그(무료/심화) 매칭
  const orParts: string[] = [
    `title.ilike.%${trimmed}%`,
    `category_main.ilike.%${trimmed}%`,
  ];
  if (trimmed.includes('무료')) orParts.push('content_type.eq.free');
  if (trimmed.includes('심화')) orParts.push('content_type.eq.paid');

  const { data, error } = await supabase
    .from('master_contents')
    .select('id, title, content_type, thumbnail_url, weekly_clicks, created_at')
    .eq('status', 'deployed')
    .or(orParts.join(','))
    .order('weekly_clicks', { ascending: false })
    .limit(30);

  if (error) {
    logger.error('검색 실패:', error.message);
    return [];
  }
  if (!data) return [];

  return data.map((row) => {
    const labels: LabelType[] = [];
    if (isContentNew(row.created_at)) labels.push('New');
    labels.push(row.content_type === 'free' ? '무료' : '심화');
    return {
      id: row.id,
      title: row.title,
      contentType: row.content_type as 'free' | 'paid',
      labels,
      views: row.weekly_clicks,
      img: row.thumbnail_url || '/home-v2/card-1.png',
    };
  });
}

/** 클릭 추적 */
async function trackClick(contentId: string) {
  try {
    const { data } = await supabase
      .from('master_contents')
      .select('view_count, weekly_clicks')
      .eq('id', contentId)
      .single();
    if (data) {
      await supabase
        .from('master_contents')
        .update({
          view_count: data.view_count + 1,
          weekly_clicks: data.weekly_clicks + 1,
        })
        .eq('id', contentId);
    }
  } catch (_) { /* silent */ }
}

// ─── SearchPage ───────────────────────────────────────────────────────────────
export function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searched, setSearched] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 디바운스 검색 (300ms)
  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const items = await searchContents(trimmed);
      setResults(items);
      setSearched(true);
    }, 300);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Enter 누르면 즉시 검색 + 키보드 닫기
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = query.trim();
      if (trimmed) {
        searchContents(trimmed).then((items) => {
          setResults(items);
          setSearched(true);
        });
        inputRef.current?.blur();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    doSearch(val);
  };

  const handleItemClick = (item: SearchItem) => {
    trackClick(item.id);
    navigate(
      item.contentType === 'free'
        ? `/free/content/${item.id}`
        : `/master/content/detail/${item.id}`,
    );
  };

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
      <SEO title="검색" noIndex={true} />
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
              className="search-input"
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
          {!searched && (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: '44px 20px', gap: 20 }}
            >
              {/* 돋보기 일러스트 */}
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
                <line x1="38.5" y1="38.5" x2="54.5" y2="54.5" stroke="#E7E7E7" strokeWidth="4.3" strokeLinecap="round"/>
                <circle cx="26.6667" cy="26.6667" r="16" stroke="#D4D4D4" strokeWidth="4.3"/>
                <path d="M26.6641 34.6667C22.2534 34.6667 18.6641 31.0773 18.6641 26.6667C18.6641 25.1947 19.8587 24 21.3307 24C22.8027 24 23.9974 25.1947 23.9974 26.6667C23.9974 28.136 25.1947 29.3333 26.6641 29.3333C28.1361 29.3333 29.3307 30.528 29.3307 32C29.3307 33.472 28.1361 34.6667 26.6641 34.6667Z" fill="#E7E7E7" transform="translate(24,29.3) scale(0.82) translate(-24,-29.3)"/>
              </svg>

              <div className="flex flex-col" style={{ gap: 8, width: '100%', textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: font,
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#B7B7B7',
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
          {searched && results.length === 0 && (
            <EmptyResult query={query.trim()} />
          )}

          {/* 검색 후: 결과 리스트 */}
          {searched && results.length > 0 && (
            <div className="flex flex-col w-full" style={{ backgroundColor: C.white }}>
              {results.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && (
                    <div style={{ height: 1, backgroundColor: '#F9F9F9' }} />
                  )}
                  <SearchResultItem item={item} onClick={() => handleItemClick(item)} />
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
