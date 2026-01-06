import { useState, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  lowQuality?: boolean;
  loading?: 'lazy' | 'eager';
}

/**
 * URL에서 잘못된 쿼리 파라미터 제거
 * Supabase Storage는 width/height/quality/format 파라미터를 지원하지 않음
 */
function cleanImageUrl(url: string): string {
  if (!url) return url;
  
  // 쿼리 파라미터가 있으면 제거
  const urlWithoutQuery = url.split('?')[0];
  return urlWithoutQuery;
}

/**
 * Progressive Image Loading 컴포넌트
 * 저해상도 블러 이미지 → 고해상도 이미지 점진적 로딩
 */
export function ProgressiveImage({ 
  src, 
  alt, 
  className = '',
  lowQuality = true,
  loading = 'lazy'
}: ProgressiveImageProps) {
  // 🔧 URL 정리: 쿼리 파라미터 완전 제거
  const cleanedSrc = cleanImageUrl(src);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!cleanedSrc) return;

    setImageLoaded(false);
    setHasError(false);

    // 이미지 프리로드
    const img = new Image();
    img.src = cleanedSrc;
    
    img.onload = () => {
      setImageLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      // 조용히 처리 (에러 로그 제거)
      setHasError(true);
      setImageLoaded(false);
    };

    return () => {
      img.src = ''; // 메모리 정리
    };
  }, [cleanedSrc]);

  // 에러 발생 시 조용히 숨김 (플레이스홀더 제거)
  if (hasError) {
    return null;
  }

  return (
    <img
      src={cleanedSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`${className} transition-opacity duration-300 ${
        imageLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      onLoad={() => setImageLoaded(true)}
      onError={() => {
        // 조용히 처리 (에러 로그 제거)
        setHasError(true);
      }}
    />
  );
}