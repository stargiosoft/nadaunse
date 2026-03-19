import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function ListRevealMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '46%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
    }}>
      {keywords.map((kw, index) => {
        const delay = index * 12;
        const entrySpring = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, mass: 0.6 } });
        const translateX = interpolate(entrySpring, [0, 1], [-60, 0]);
        const opacity = interpolate(entrySpring, [0, 1], [0, 1]);

        // Check mark animation (appears after text)
        const checkSpring = spring({ frame: Math.max(0, frame - delay - 8), fps, config: { damping: 10, mass: 0.4 } });

        return (
          <div key={index} style={{
            display: 'flex', alignItems: 'center', gap: 24,
            marginBottom: 28, opacity,
            transform: `translateX(${translateX}px)`,
          }}>
            {/* Number circle */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              backgroundColor: `${accent}25`, border: `3px solid ${accent}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `scale(${interpolate(checkSpring, [0, 1], [0.5, 1])})`,
            }}>
              <span style={{
                fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                fontSize: 28, fontWeight: 900, color: accent,
              }}>
                {index + 1}
              </span>
            </div>

            {/* Text */}
            <span style={{
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: keywords.length <= 2 ? 72 : 56,
              fontWeight: 800, color: 'white',
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
              lineHeight: 1.2, wordBreak: 'keep-all', letterSpacing: '-1px',
            }}>
              {kw}
            </span>
          </div>
        );
      })}
    </div>
  );
}
