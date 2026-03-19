import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';

function parseSubtitle(text: string) {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }
  if (parts.length === 0) parts.push({ text, bold: false });
  return parts;
}

export default function SubtitleOverlay({ subtitle }: { subtitle: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entryScale = spring({ frame, fps, config: { damping: 15, mass: 0.8 } });
  const scale = interpolate(entryScale, [0, 1], [0.85, 1]);
  const opacity = interpolate(entryScale, [0, 1], [0, 1]);

  // Subtle breathing animation
  const breathe = 1 + Math.sin(frame * 0.04) * 0.01;

  const parts = parseSubtitle(subtitle);

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 260 }}>
      {/* Shadow backdrop gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        pointerEvents: 'none',
      }} />

      {/* Subtitle container */}
      <div style={{
        transform: `scale(${scale * breathe})`,
        opacity,
        textAlign: 'center',
        padding: '16px 50px',
        position: 'relative',
        zIndex: 1,
        maxWidth: '90%',
      }}>
        {/* Frosted background pill */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
        }} />

        <span style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 50,
          fontWeight: 700,
          color: 'white',
          lineHeight: 1.5,
          wordBreak: 'keep-all',
          position: 'relative',
          zIndex: 1,
        }}>
          {parts.map((part, i) => (
            <span key={i} style={{
              fontWeight: part.bold ? 900 : 700,
              color: part.bold ? '#FFD93D' : 'white',
              fontSize: part.bold ? 58 : 50,
              textShadow: part.bold
                ? '0 0 20px rgba(255,217,61,0.4), 0 2px 8px rgba(0,0,0,0.5)'
                : '0 2px 8px rgba(0,0,0,0.5)',
            }}>
              {part.text}
            </span>
          ))}
        </span>
      </div>
    </AbsoluteFill>
  );
}
