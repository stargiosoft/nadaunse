/**
 * SearchPillIcon - Lottie 애니메이션 알약 검색 아이콘
 *
 * @example
 * <SearchPillIcon size={40} />
 * <SearchPillIcon size={60} autoplay loop />
 */

import Lottie from 'lottie-react';
import searchPillAnimation from '../../assets/searchPill.json';

interface SearchPillIconProps {
  /** 아이콘 크기 (width, height 동일) */
  size?: number;
  /** 커스텀 className */
  className?: string;
  /** 자동 재생 여부 (기본: true) */
  autoplay?: boolean;
  /** 반복 재생 여부 (기본: true) */
  loop?: boolean;
}

export default function SearchPillIcon({
  size = 40,
  className = '',
  autoplay = true,
  loop = true,
}: SearchPillIconProps) {
  return (
    <Lottie
      animationData={searchPillAnimation}
      loop={loop}
      autoplay={autoplay}
      style={{
        width: size,
        height: size,
      }}
      className={className}
    />
  );
}
