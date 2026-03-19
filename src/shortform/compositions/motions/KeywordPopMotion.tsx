import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function KeywordPopMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      {keywords.map((kw, index) => {
        const delay = index * 6;
        const entrySpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12, mass: 0.8 } });
        const scale = interpolate(entrySpring, [0, 1], [0.3, 1]);
        const opacity = interpolate(entrySpring, [0, 1], [0, 1]);
        const translateY = interpolate(entrySpring, [0, 1], [60, 0]);
        const total = keywords.length;
        const positions = total === 1 ? [50] : total === 2 ? [42, 58] : [35, 50, 65];
        const topPercent = positions[index] || 50;
        const pulse = frame > delay + 15 ? 1 + Math.sin((frame - delay) * 0.08) * 0.03 : 1;

        return (
          <div key={index} style={{
            position: 'absolute', left: '50%', top: `${topPercent}%`,
            transform: `translate(-50%, -50%) scale(${scale * pulse}) translateY(${translateY}px)`,
            opacity, textAlign: 'center', width: '85%',
          }}>
            <span style={{
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: total === 1 ? 120 : total === 2 ? 96 : 80,
              fontWeight: 900, color: 'white',
              textShadow: `0 0 40px ${accent}60, 0 4px 20px rgba(0,0,0,0.5)`,
              letterSpacing: '-2px', lineHeight: 1.2, wordBreak: 'keep-all',
            }}>
              {kw}
            </span>
          </div>
        );
      })}
    </>
  );
}
