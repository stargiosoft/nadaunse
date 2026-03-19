import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function ZoomImpactMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainKeyword = keywords[0] || '';
  const subKeywords = keywords.slice(1);

  // Dramatic zoom from very large to normal
  const zoomSpring = spring({ frame, fps, config: { damping: 8, mass: 1.5 } });
  const scale = interpolate(zoomSpring, [0, 1], [4, 1]);
  const opacity = interpolate(zoomSpring, [0, 0.3, 1], [0, 1, 1]);

  // Shake after landing
  const shake = frame > 15 && frame < 25
    ? Math.sin(frame * 2) * (25 - frame) * 0.8
    : 0;

  // Subtle breath after settling
  const breath = frame > 30 ? 1 + Math.sin(frame * 0.06) * 0.015 : 1;

  // Ring expansion
  const ringSpring = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 20, mass: 0.3 } });
  const ringScale = interpolate(ringSpring, [0, 1], [0, 3]);
  const ringOpacity = interpolate(ringSpring, [0, 1], [0.5, 0]);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '48%',
      transform: 'translate(-50%, -50%)',
      width: '90%', textAlign: 'center',
    }}>
      {/* Impact ring */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${ringScale})`,
        width: 200, height: 200, borderRadius: '50%',
        border: `4px solid ${accent}`,
        opacity: ringOpacity,
      }} />

      {/* Main keyword */}
      <div style={{
        transform: `scale(${scale * breath}) translateX(${shake}px)`,
        opacity,
      }}>
        <span style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 120, fontWeight: 900, color: 'white',
          textShadow: `0 0 60px ${accent}50, 0 6px 24px rgba(0,0,0,0.6)`,
          letterSpacing: '-3px', lineHeight: 1, wordBreak: 'keep-all',
        }}>
          {mainKeyword}
        </span>
      </div>

      {/* Sub keywords */}
      {subKeywords.map((kw, i) => {
        const subSpring = spring({ frame: Math.max(0, frame - 20 - i * 6), fps, config: { damping: 12 } });
        return (
          <div key={i} style={{
            marginTop: 20,
            opacity: interpolate(subSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(subSpring, [0, 1], [30, 0])}px)`,
          }}>
            <span style={{
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: 64, fontWeight: 700, color: accent,
              textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}>
              {kw}
            </span>
          </div>
        );
      })}
    </div>
  );
}
