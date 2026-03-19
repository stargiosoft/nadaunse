import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import type { MotionComponentProps } from './types';

export default function TypewriterMotion({ scene, accent }: MotionComponentProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const text = scene.subtitle.replace(/\*\*/g, '');
  const charsPerFrame = 1.2; // ~36 chars/sec at 30fps
  const visibleChars = Math.min(Math.floor(frame * charsPerFrame), text.length);
  const displayText = text.slice(0, visibleChars);
  const showCursor = frame % 16 < 10; // blinking cursor

  const entryOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '45%',
      transform: 'translate(-50%, -50%)',
      width: '80%', textAlign: 'center', opacity: entryOpacity,
    }}>
      <span style={{
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        fontSize: 72, fontWeight: 800, color: 'white',
        textShadow: `0 0 30px ${accent}50, 0 4px 16px rgba(0,0,0,0.5)`,
        lineHeight: 1.3, wordBreak: 'keep-all', letterSpacing: '-1px',
      }}>
        {displayText}
        {visibleChars < text.length && (
          <span style={{ color: accent, opacity: showCursor ? 1 : 0 }}>|</span>
        )}
      </span>
    </div>
  );
}
