import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function SplitCompareMotion({ keywords, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftSpring = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const rightSpring = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, mass: 0.8 } });
  const dividerSpring = spring({ frame: Math.max(0, frame - 4), fps, config: { damping: 12 } });

  const left = keywords[0] || '';
  const right = keywords[1] || keywords[0] || '';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center',
    }}>
      {/* Left side */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `translateX(${interpolate(leftSpring, [0, 1], [-80, 0])}px)`,
        opacity: interpolate(leftSpring, [0, 1], [0, 1]),
      }}>
        <span style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 72, fontWeight: 900, color: '#FF6B6B',
          textShadow: '0 0 30px rgba(255,107,107,0.3), 0 4px 16px rgba(0,0,0,0.4)',
          textAlign: 'center', wordBreak: 'keep-all',
        }}>
          {left}
        </span>
      </div>

      {/* Center divider */}
      <div style={{
        width: 6, backgroundColor: `${accent}80`,
        height: `${interpolate(dividerSpring, [0, 1], [0, 60])}%`,
        borderRadius: 3, boxShadow: `0 0 20px ${accent}40`,
        flexShrink: 0,
      }} />

      {/* VS badge */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${interpolate(dividerSpring, [0, 1], [0, 1])})`,
        width: 64, height: 64, borderRadius: '50%',
        backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 24px ${accent}60`,
        zIndex: 1,
      }}>
        <span style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 24, fontWeight: 900, color: 'white',
        }}>VS</span>
      </div>

      {/* Right side */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `translateX(${interpolate(rightSpring, [0, 1], [80, 0])}px)`,
        opacity: interpolate(rightSpring, [0, 1], [0, 1]),
      }}>
        <span style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 72, fontWeight: 900, color: '#4ecdc4',
          textShadow: '0 0 30px rgba(78,205,196,0.3), 0 4px 16px rgba(0,0,0,0.4)',
          textAlign: 'center', wordBreak: 'keep-all',
        }}>
          {right}
        </span>
      </div>
    </div>
  );
}
