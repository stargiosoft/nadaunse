import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function WaveMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrySpring = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const opacity = interpolate(entrySpring, [0, 1], [0, 1]);

  const mainText = keywords.join(' ');
  const chars = mainText.split('');

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '48%',
      transform: 'translate(-50%, -50%)',
      width: '85%', textAlign: 'center', opacity,
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      gap: 0,
    }}>
      {chars.map((char, i) => {
        // Wave: each char has a phase offset
        const waveY = Math.sin((frame * 0.12) + i * 0.5) * 18;
        const waveRotate = Math.sin((frame * 0.08) + i * 0.4) * 4;

        // Stagger entry
        const charDelay = i * 2;
        const charSpring = spring({ frame: Math.max(0, frame - charDelay), fps, config: { damping: 12, mass: 0.5 } });
        const charScale = interpolate(charSpring, [0, 1], [0, 1]);
        const charOpacity = interpolate(charSpring, [0, 1], [0, 1]);

        // Color wave
        const hueShift = ((i * 20) + frame * 2) % 360;
        const isSpace = char === ' ';

        return (
          <span key={i} style={{
            display: 'inline-block',
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            fontSize: keywords.length === 1 ? 100 : 72,
            fontWeight: 900,
            color: 'white',
            textShadow: `0 0 30px ${accent}50, 0 4px 16px rgba(0,0,0,0.4)`,
            transform: `translateY(${waveY}px) rotate(${waveRotate}deg) scale(${charScale})`,
            opacity: charOpacity,
            letterSpacing: '-1px',
            lineHeight: 1.3,
            minWidth: isSpace ? 20 : undefined,
            filter: `hue-rotate(${hueShift * 0.1}deg)`,
          }}>
            {isSpace ? '\u00A0' : char}
          </span>
        );
      })}
    </div>
  );
}
