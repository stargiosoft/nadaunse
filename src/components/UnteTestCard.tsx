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

  return (
    <button
      onClick={() => navigate(`/unte/${slug}`)}
      className="flex flex-col overflow-hidden rounded-2xl transform-gpu cursor-pointer w-full text-left"
      style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }}
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
            style={{ backgroundColor: '#f5f5f5' }}
          >
            <span style={{ fontSize: '32px' }}>
              {templateType === 'compatibility' ? '💑' : '🎰'}
            </span>
          </div>
        )}

        {/* 유형 뱃지 */}
        <div
          className="absolute top-2 left-2 rounded-full px-2 py-0.5"
          style={{
            backgroundColor: templateType === 'compatibility' ? '#ff6b9d' : isAdult ? '#ff4444' : '#48b2af',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          {typeLabel}
        </div>

        {/* 성인 뱃지 */}
        {isAdult && (
          <div
            className="absolute top-2 right-2 rounded-full px-2 py-0.5"
            style={{ backgroundColor: '#ff4444', color: '#fff', fontSize: '11px', fontWeight: 600 }}
          >
            19+
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="p-3 flex flex-col gap-1">
        <p
          className="line-clamp-2"
          style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', lineHeight: '1.3' }}
        >
          {title}
        </p>
        {description && (
          <p
            className="line-clamp-1"
            style={{ fontSize: '12px', color: '#888', lineHeight: '1.4' }}
          >
            {description}
          </p>
        )}
        <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
          {formatCount(playCount)}명 참여
        </p>
      </div>
    </button>
  );
}
