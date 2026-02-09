/**
 * FlowerPotIcon - Lottie 애니메이션 화분 아이콘
 *
 * @example
 * <FlowerPotIcon size={100} />
 * <FlowerPotIcon size={150} autoplay loop />
 */

import Lottie from 'lottie-react';
import flowerPotAnimation from '../../assets/flowerPot.json';

interface FlowerPotIconProps {
  /** 아이콘 크기 (width, height 동일) */
  size?: number;
  /** 커스텀 className */
  className?: string;
  /** 자동 재생 여부 (기본: true) */
  autoplay?: boolean;
  /** 반복 재생 여부 (기본: true) */
  loop?: boolean;
}

export default function FlowerPotIcon({
  size = 100,
  className = '',
  autoplay = true,
  loop = true,
}: FlowerPotIconProps) {
  return (
    <Lottie
      animationData={flowerPotAnimation}
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
