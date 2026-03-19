import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function RadialBurstMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrySpring = spring({ frame, fps, config: { damping: 10, mass: 1.2 } });
  const scale = interpolate(entrySpring, [0, 1], [0, 1]);
  const opacity = interpolate(entrySpring, [0, 1], [0, 1]);

  // Radial lines
  const lineCount = 12;
  const lineProgress = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 16, mass: 0.4 } });

  // Pulse after entry
  const pulse = frame > 20 ? 1 + Math.sin(frame * 0.1) * 0.02 : 1;

  const mainKeyword = keywords[0] || '';

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '48%',
      transform: `translate(-50%, -50%) scale(${scale * pulse})`,
      opacity, width: 800, height: 800,
    }}>
      {/* Radial lines */}
      {Array.from({ length: lineCount }, (_, i) => {
        const angle = (i / lineCount) * 360;
        const len = interpolate(lineProgress, [0, 1], [0, 250 + (i % 3) * 40]);
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            width: len, height: 3,
            backgroundColor: `${accent}${i % 2 === 0 ? '40' : '25'}`,
            transformOrigin: '0% 50%',
            transform: `rotate(${angle}deg)`,
            borderRadius: 2,
          }} />
        );
      })}

      {/* Center circle glow */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 200, height: 200, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`,
      }} />

      {/* Main keyword */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', width: '90%',
      }}>
        <span style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: keywords.length === 1 ? 110 : 80,
          fontWeight: 900, color: 'white',
          textShadow: `0 0 50px ${accent}60, 0 4px 20px rgba(0,0,0,0.5)`,
          letterSpacing: '-2px', lineHeight: 1.2, wordBreak: 'keep-all',
        }}>
          {mainKeyword}
        </span>
        {keywords.length > 1 && (
          <div style={{
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            fontSize: 56, fontWeight: 700, color: accent,
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            marginTop: 16,
          }}>
            {keywords.slice(1).join(' ')}
          </div>
        )}
      </div>
    </div>
  );
}
