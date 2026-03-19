import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

/** Extract numbers from keywords, or show keywords as-is */
export default function CounterMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entrySpring = spring({ frame, fps, config: { damping: 15, mass: 1 } });

  // Find a number in the keywords
  const numberKw = keywords.find(kw => /\d/.test(kw));
  const targetNum = numberKw ? parseInt(numberKw.replace(/[^\d]/g, ''), 10) : 0;

  // Count up to target number over first 60% of scene
  const countEnd = Math.floor(durationInFrames * 0.6);
  const currentNum = targetNum > 0
    ? Math.min(Math.round(interpolate(frame, [0, countEnd], [0, targetNum], { extrapolateRight: 'clamp' })), targetNum)
    : 0;

  const suffix = numberKw ? numberKw.replace(/[\d,]/g, '') : '';
  const labelKw = keywords.find(kw => kw !== numberKw) || '';

  const scale = interpolate(entrySpring, [0, 1], [0.5, 1]);
  const opacity = interpolate(entrySpring, [0, 1], [0, 1]);

  // Pulse when reaching target
  const atTarget = currentNum === targetNum && targetNum > 0;
  const pulse = atTarget ? 1 + Math.sin(frame * 0.15) * 0.04 : 1;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '48%',
      transform: `translate(-50%, -50%) scale(${scale * pulse})`,
      opacity, textAlign: 'center', width: '85%',
    }}>
      {targetNum > 0 ? (
        <>
          <div style={{
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            fontSize: 140, fontWeight: 900, color: accent,
            textShadow: `0 0 60px ${accent}40, 0 4px 20px rgba(0,0,0,0.4)`,
            lineHeight: 1, letterSpacing: '-4px',
          }}>
            {currentNum.toLocaleString()}{suffix}
          </div>
          {labelKw && (
            <div style={{
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: 56, fontWeight: 700, color: 'white',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              marginTop: 20, letterSpacing: '-1px',
            }}>
              {labelKw}
            </div>
          )}
        </>
      ) : (
        // Fallback: show keywords like keyword_pop
        keywords.map((kw, i) => (
          <div key={i} style={{
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            fontSize: 100, fontWeight: 900, color: 'white',
            textShadow: `0 0 40px ${accent}60, 0 4px 20px rgba(0,0,0,0.5)`,
            lineHeight: 1.3,
          }}>
            {kw}
          </div>
        ))
      )}
    </div>
  );
}
