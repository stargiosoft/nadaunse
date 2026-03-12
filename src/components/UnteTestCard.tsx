/**
 * 운테 테스트 카드 컴포넌트
 * 홈 목록에서 테스트를 표시하는 카드
 */

import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';

interface UnteTestCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  playCount: number;
  templateType: string;
  isAdult?: boolean;
}

export default function UnteTestCard({
  slug,
  title,
  description,
  thumbnailUrl,
  playCount,
  templateType,
  isAdult,
}: UnteTestCardProps) {
  const navigate = useNavigate();

  const formatCount = (n: number): string => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
    return n.toString();
  };

  const typeLabel = templateType === 'compatibility' ? '궁합' : templateType === 'adult' ? '19+' : '테스트';
  const typeBg = templateType === 'compatibility' ? '#fff6f7' : isAdult ? '#fff6f7' : '#f0f8f8';
  const typeColor = templateType === 'compatibility' ? '#ef6878' : isAdult ? '#ef6878' : '#41a09e';

  return (
    <button
      onClick={() => navigate(`/unte/${slug}`)}
      className="flex flex-col overflow-hidden transform-gpu cursor-pointer w-full text-left"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e7e7e7',
        borderRadius: '16px',
        transition: 'transform 0.1s ease',
      }}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      {/* 썸네일 */}
      <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
        {thumbnailUrl ? (
          <ImageWithFallback
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: '#f9f9f9' }}
          >
            <span style={{ fontSize: '36px' }}>
              {templateType === 'compatibility' ? '💑' : '🎰'}
            </span>
          </div>
        )}

        {/* 유형 뱃지 — ContentTags 스타일 */}
        <div
          className="absolute flex items-center gap-1"
          style={{ top: '8px', left: '8px' }}
        >
          <span
            style={{
              backgroundColor: typeBg,
              color: typeColor,
              fontFamily: "'Pretendard Variable', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              lineHeight: '15px',
              padding: '1px 4px',
              borderRadius: '4px',
            }}
          >
            {typeLabel}
          </span>
          {isAdult && (
            <span
              style={{
                backgroundColor: '#fff6f7',
                color: '#ef6878',
                fontFamily: "'Pretendard Variable', sans-serif",
                fontSize: '10px',
                fontWeight: 600,
                lineHeight: '15px',
                padding: '1px 4px',
                borderRadius: '4px',
              }}
            >
              19+
            </span>
          )}
        </div>
      </div>

      {/* 텍스트 */}
      <div className="flex flex-col" style={{ padding: '10px 12px 12px' }}>
        <p
          className="line-clamp-2"
          style={{
            fontFamily: "'Pretendard Variable', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            lineHeight: '20px',
            letterSpacing: '-0.42px',
            color: '#151515',
          }}
        >
          {title}
        </p>
        {description && (
          <p
            className="line-clamp-1"
            style={{
              fontFamily: "'Pretendard Variable', sans-serif",
              fontSize: '12px',
              fontWeight: 400,
              lineHeight: '16px',
              letterSpacing: '-0.24px',
              color: '#848484',
              marginTop: '4px',
            }}
          >
            {description}
          </p>
        )}
        <p
          style={{
            fontFamily: "'Pretendard Variable', sans-serif",
            fontSize: '11px',
            fontWeight: 400,
            lineHeight: '16px',
            color: '#b7b7b7',
            marginTop: '6px',
          }}
        >
          {formatCount(playCount)}명 참여
        </p>
      </div>
    </button>
  );
}
