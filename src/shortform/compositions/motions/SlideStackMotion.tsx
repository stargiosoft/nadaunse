import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function SlideStackMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      {keywords.map((kw, index) => {
        const delay = index * 10;
        const entrySpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, mass: 0.7 } });
        const fromLeft = index % 2 === 0;
        const translateX = interpolate(entrySpring, [0, 1], [fromLeft ? -120 : 120, 0]);
        const opacity = interpolate(entrySpring, [0, 1], [0, 1]);
        const total = keywords.length;
        const positions = total === 1 ? [50] : total === 2 ? [42, 58] : [35, 50, 65];
        const topPercent = positions[index] || 50;

        return (
          <div key={index} style={{
            position: 'absolute', left: '50%', top: `${topPercent}%`,
            transform: `translate(-50%, -50%) translateX(${translateX}%)`,
            opacity, textAlign: 'center', width: '85%',
          }}>
            <div style={{
              display: 'inline-block', padding: '12px 32px',
              backgroundColor: `${accent}20`, borderRadius: 16,
              borderLeft: `6px solid ${accent}`,
            }}>
              <span style={{
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                fontSize: total === 1 ? 100 : total === 2 ? 80 : 64,
                fontWeight: 800, color: 'white',
                textShadow: `0 2px 12px rgba(0,0,0,0.4)`,
                letterSpacing: '-1px', lineHeight: 1.2, wordBreak: 'keep-all',
              }}>
                {kw}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
