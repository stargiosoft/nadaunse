import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function GlitchMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrySpring = spring({ frame, fps, config: { damping: 8, mass: 0.6 } });
  const mainKeyword = keywords[0] || '';
  const total = keywords.length;

  // Glitch offsets — active in bursts
  const glitchActive = (frame % 30 < 4) || (frame % 45 < 3);
  const glitchX = glitchActive ? Math.sin(frame * 7) * 12 : 0;
  const glitchY = glitchActive ? Math.cos(frame * 11) * 6 : 0;

  // RGB split offset
  const rgbOffset = glitchActive ? 4 + Math.sin(frame * 5) * 3 : 0;

  const scale = interpolate(entrySpring, [0, 1], [0.8, 1]);
  const opacity = interpolate(entrySpring, [0, 1], [0, 1]);

  // Scan line effect
  const scanY = (frame * 8) % 1920;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '48%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity, width: '85%', textAlign: 'center',
    }}>
      {/* Scan line */}
      <div style={{
        position: 'absolute', left: '-10%', width: '120%',
        top: scanY - 960, height: 3,
        backgroundColor: `${accent}15`,
        boxShadow: `0 0 20px ${accent}10`,
      }} />

      {keywords.map((kw, index) => {
        const positions = total === 1 ? [0] : total === 2 ? [-40, 40] : [-60, 0, 60];
        const yOffset = positions[index] || 0;

        return (
          <div key={index} style={{
            position: 'relative', marginTop: index > 0 ? 16 : 0,
            transform: `translate(${glitchX}px, ${glitchY + yOffset}px)`,
          }}>
            {/* Red channel (offset) */}
            <span style={{
              position: 'absolute', left: 0, top: 0, width: '100%',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: total === 1 ? 110 : total === 2 ? 88 : 72,
              fontWeight: 900, color: 'rgba(255,0,0,0.4)',
              transform: `translate(${rgbOffset}px, -${rgbOffset / 2}px)`,
              letterSpacing: '-2px', lineHeight: 1.2,
              mixBlendMode: 'screen',
            }}>
              {kw}
            </span>
            {/* Cyan channel (offset) */}
            <span style={{
              position: 'absolute', left: 0, top: 0, width: '100%',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: total === 1 ? 110 : total === 2 ? 88 : 72,
              fontWeight: 900, color: 'rgba(0,255,255,0.4)',
              transform: `translate(-${rgbOffset}px, ${rgbOffset / 2}px)`,
              letterSpacing: '-2px', lineHeight: 1.2,
              mixBlendMode: 'screen',
            }}>
              {kw}
            </span>
            {/* Main text */}
            <span style={{
              position: 'relative',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: total === 1 ? 110 : total === 2 ? 88 : 72,
              fontWeight: 900, color: 'white',
              textShadow: `0 0 20px ${accent}40`,
              letterSpacing: '-2px', lineHeight: 1.2, wordBreak: 'keep-all',
            }}>
              {kw}
            </span>
          </div>
        );
      })}
    </div>
  );
}
