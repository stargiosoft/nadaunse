import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig, Img } from 'remotion';
import type { Scene } from '../types';
import { MOTION_REGISTRY } from './motions';

// ── Color Schemes per scene type ──

const SCENE_THEMES: Record<string, { bg: [string, string]; accent: string; icon: string }> = {
  hook: { bg: ['#1a1a2e', '#16213e'], accent: '#FF6B6B', icon: '🔥' },
  problem_intro: { bg: ['#1a1a2e', '#0f3460'], accent: '#e74c3c', icon: '⚠️' },
  problem: { bg: ['#1a1a2e', '#0f3460'], accent: '#e74c3c', icon: '❌' },
  reason_1: { bg: ['#0d1117', '#161b22'], accent: '#FF6B6B', icon: '1️⃣' },
  reason_2: { bg: ['#0d1117', '#161b22'], accent: '#f39c12', icon: '2️⃣' },
  reason_3: { bg: ['#0d1117', '#161b22'], accent: '#e056fd', icon: '3️⃣' },
  reason: { bg: ['#0d1117', '#161b22'], accent: '#FF6B6B', icon: '💡' },
  solution: { bg: ['#0d1117', '#1b4332'], accent: '#2ecc71', icon: '✅' },
  tip: { bg: ['#0d1117', '#1b4332'], accent: '#2ecc71', icon: '💡' },
  cta: { bg: ['#2d1b69', '#4a1a8a'], accent: '#e056fd', icon: '👉' },
  intro: { bg: ['#1a1a2e', '#16213e'], accent: '#4ecdc4', icon: '✨' },
  content: { bg: ['#0d1117', '#21262d'], accent: '#58a6ff', icon: '📌' },
  outro: { bg: ['#2d1b69', '#4a1a8a'], accent: '#e056fd', icon: '🎯' },
};

function getTheme(type: string) {
  const key = type.toLowerCase().replace(/\s+/g, '_');
  return SCENE_THEMES[key] || SCENE_THEMES.content;
}

// ── Extract keywords from subtitle ──

function extractKeywords(subtitle: string): string[] {
  const boldRegex = /\*\*(.+?)\*\*/g;
  const bolds: string[] = [];
  let match;
  while ((match = boldRegex.exec(subtitle)) !== null) {
    bolds.push(match[1]);
  }
  if (bolds.length > 0) return bolds.slice(0, 3);

  const cleaned = subtitle.replace(/\*\*/g, '');
  const particles = ['은', '는', '이', '가', '을', '를', '의', '에', '에서', '도', '만', '와', '과', '로', '으로', '하고', '라고', '때문에'];
  const words = cleaned.split(/\s+/).filter(w => w.length >= 2 && !particles.includes(w));
  return words.slice(0, 3);
}

// ── Floating Shape component ──

function FloatingShape({ x, y, size, color, delay, shape }: {
  x: number; y: number; size: number; color: string; delay: number; shape: 'circle' | 'diamond' | 'line' | 'dot';
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrySpring = spring({ frame: Math.max(0, frame - delay * fps), fps, config: { damping: 12, mass: 0.6 } });
  const float = Math.sin((frame + delay * 30) * 0.03) * 15;
  const rotation = interpolate(frame, [0, 300], [0, 360]);
  const opacity = interpolate(entrySpring, [0, 1], [0, 0.4]);

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    opacity,
    transform: `translateY(${float}px) scale(${entrySpring})`,
  };

  if (shape === 'circle') {
    return (
      <div style={{
        ...baseStyle,
        width: size, height: size, borderRadius: '50%',
        border: `3px solid ${color}`,
      }} />
    );
  }
  if (shape === 'diamond') {
    return (
      <div style={{
        ...baseStyle,
        width: size, height: size,
        border: `3px solid ${color}`,
        transform: `translateY(${float}px) scale(${entrySpring}) rotate(${rotation}deg)`,
        borderRadius: 4,
      }} />
    );
  }
  if (shape === 'dot') {
    return (
      <div style={{
        ...baseStyle,
        width: size * 0.4, height: size * 0.4, borderRadius: '50%',
        backgroundColor: color,
      }} />
    );
  }
  // line
  return (
    <div style={{
      ...baseStyle,
      width: size * 1.5, height: 3,
      backgroundColor: color,
      borderRadius: 2,
      transform: `translateY(${float}px) scale(${entrySpring}) rotate(${15 + delay * 20}deg)`,
    }} />
  );
}

// ── Icon badge with animation ──

function TypeIcon({ icon, accent }: { icon: string; accent: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrySpring = spring({ frame, fps, config: { damping: 10, mass: 1.2 } });
  const scale = interpolate(entrySpring, [0, 1], [0, 1]);
  const bounce = frame > 15 ? 1 + Math.sin(frame * 0.1) * 0.05 : 1;

  return (
    <div style={{
      position: 'absolute',
      top: 80,
      right: 80,
      width: 100,
      height: 100,
      borderRadius: 28,
      backgroundColor: `${accent}30`,
      border: `3px solid ${accent}50`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 52,
      transform: `scale(${scale * bounce})`,
    }}>
      {icon}
    </div>
  );
}

// ── X-Mark overlay for problem scenes ──

function XMarkOverlay({ accent }: { accent: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1 = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 10, mass: 0.5 } });
  const line2 = spring({ frame: Math.max(0, frame - 14), fps, config: { damping: 10, mass: 0.5 } });

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: 300,
      height: 300,
      opacity: 0.15,
    }}>
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${line1 * 100}%`,
        height: 8,
        backgroundColor: accent,
        transform: 'translate(-50%, -50%) rotate(45deg)',
        borderRadius: 4,
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${line2 * 100}%`,
        height: 8,
        backgroundColor: accent,
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        borderRadius: 4,
      }} />
    </div>
  );
}

// ── Check overlay for solution scenes ──

function CheckOverlay({ accent }: { accent: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 12, mass: 0.6 } });
  const scale = interpolate(progress, [0, 1], [0, 1]);

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: 250,
      height: 250,
      borderRadius: '50%',
      border: `6px solid ${accent}25`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.2,
    }}>
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

// ── Accent line divider ──

function AccentLine({ accent }: { accent: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 14 } });

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '75%',
      transform: 'translateX(-50%)',
      width: `${w * 40}%`,
      height: 4,
      backgroundColor: accent,
      borderRadius: 2,
      opacity: 0.5,
    }} />
  );
}

// ── Particle burst for hook/cta scenes ──

function ParticleBurst({ accent }: { accent: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const delay = i * 2;
    const progress = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, mass: 0.3 } });
    const dist = interpolate(progress, [0, 1], [0, 120 + i * 15]);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const size = 6 + (i % 3) * 4;
    const opacity = interpolate(progress, [0, 0.5, 1], [0, 0.6, 0.2]);

    return (
      <div key={i} style={{
        position: 'absolute',
        left: '50%',
        top: '45%',
        width: size,
        height: size,
        borderRadius: i % 2 === 0 ? '50%' : 2,
        backgroundColor: accent,
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${i * 45}deg)`,
        opacity,
      }} />
    );
  });

  return <>{particles}</>;
}

// ── Shapes seed based on scene number ──

function getShapes(sceneNumber: number, accent: string) {
  const shapes: Array<{ x: number; y: number; size: number; color: string; delay: number; shape: 'circle' | 'diamond' | 'line' | 'dot' }> = [];
  const seed = sceneNumber * 7;
  const shapeTypes: Array<'circle' | 'diamond' | 'line' | 'dot'> = ['circle', 'diamond', 'line', 'dot'];

  for (let i = 0; i < 6; i++) {
    const hash = (seed + i * 13) % 100;
    shapes.push({
      x: 5 + (hash * 7) % 90,
      y: 10 + ((hash * 3 + i * 17) % 80),
      size: 20 + (hash % 30),
      color: accent,
      delay: 0.2 + i * 0.15,
      shape: shapeTypes[(hash + i) % shapeTypes.length],
    });
  }
  return shapes;
}

// ── Main SceneRenderer ──

export default function SceneRenderer({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const theme = getTheme(scene.type);
  const [c1, c2] = theme.bg;

  // Entry
  const entryProgress = spring({ frame, fps, config: { damping: 20 } });

  // Transition
  const transition = scene.transition?.toLowerCase() || 'cut';
  let transform = '';
  let opacity = 1;

  if (transition === 'fade') {
    opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  } else if (transition === 'zoom') {
    const scale = interpolate(entryProgress, [0, 1], [1.15, 1]);
    transform = `scale(${scale})`;
  } else if (transition === 'slide') {
    const tx = interpolate(entryProgress, [0, 1], [100, 0]);
    transform = `translateX(${tx}%)`;
  }

  // Exit fade
  const exitStart = durationInFrames - 6;
  const exitOpacity = interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const keywords = extractKeywords(scene.subtitle);
  const shapes = getShapes(scene.scene_number, theme.accent);
  const sceneType = scene.type.toLowerCase().replace(/\s+/g, '_');
  const isProblem = ['problem', 'problem_intro', 'reason_1', 'reason_2', 'reason_3', 'reason'].includes(sceneType);
  const isSolution = ['solution', 'tip'].includes(sceneType);
  const isHookOrCta = ['hook', 'cta', 'outro'].includes(sceneType);

  const hasImage = !!scene.backgroundImageUrl;

  // Ken Burns effect for image backgrounds
  const kenBurnsScale = hasImage ? interpolate(frame, [0, durationInFrames], [1.0, 1.15], { extrapolateRight: 'clamp' }) : 1;
  const kenBurnsX = hasImage ? interpolate(frame, [0, durationInFrames], [0, -3], { extrapolateRight: 'clamp' }) : 0;
  const kenBurnsY = hasImage ? interpolate(frame, [0, durationInFrames], [0, -2], { extrapolateRight: 'clamp' }) : 0;

  // Resolve motion component
  const motionStyle = scene.motion_style || 'keyword_pop';
  const MotionComponent = MOTION_REGISTRY[motionStyle] || MOTION_REGISTRY.keyword_pop;

  // Use scene.icon if provided, else theme default
  const displayIcon = scene.icon || theme.icon;

  return (
    <AbsoluteFill style={{ opacity: opacity * exitOpacity, transform }}>
      {/* ── Background Layer ── */}
      {hasImage ? (
        <>
          {/* AI-generated image background with Ken Burns */}
          <AbsoluteFill style={{ overflow: 'hidden' }}>
            <Img
              src={scene.backgroundImageUrl!}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${kenBurnsScale}) translate(${kenBurnsX}%, ${kenBurnsY}%)`,
              }}
            />
          </AbsoluteFill>
          {/* Dark overlay for text readability */}
          <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
          {/* Vignette */}
          <AbsoluteFill style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
          }} />
        </>
      ) : (
        <>
          {/* Gradient background */}
          <AbsoluteFill style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }} />
          {/* Subtle radial glow */}
          <AbsoluteFill style={{
            background: `radial-gradient(ellipse at 50% 40%, ${theme.accent}12 0%, transparent 60%)`,
          }} />
          {/* Grid pattern overlay */}
          <AbsoluteFill style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            opacity: interpolate(entryProgress, [0, 1], [0, 1]),
          }} />
        </>
      )}

      {/* Floating shapes (reduced opacity with image background) */}
      <div style={{ opacity: hasImage ? 0.3 : 1 }}>
        {shapes.map((s, i) => (
          <FloatingShape key={i} {...s} />
        ))}
      </div>

      {/* Type-specific overlays (hidden with image background) */}
      {!hasImage && isProblem && <XMarkOverlay accent={theme.accent} />}
      {!hasImage && isSolution && <CheckOverlay accent={theme.accent} />}
      {!hasImage && isHookOrCta && <ParticleBurst accent={theme.accent} />}

      {/* Type icon badge */}
      <TypeIcon icon={displayIcon} accent={theme.accent} />

      {/* Scene number + type label */}
      <div style={{
        position: 'absolute', top: 88, left: 60,
        display: 'flex', alignItems: 'center', gap: 16,
        opacity: interpolate(entryProgress, [0, 1], [0, 0.8]),
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: `${theme.accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 22, fontWeight: 800, color: theme.accent,
        }}>
          {scene.scene_number}
        </div>
        <span style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 24, fontWeight: 600, color: `${theme.accent}80`,
          textTransform: 'uppercase', letterSpacing: 3,
        }}>
          {scene.type}
        </span>
      </div>

      {/* ── Motion Graphics: Dynamic Component ── */}
      <MotionComponent scene={scene} accent={theme.accent} keywords={keywords} />

      {/* Accent line */}
      <AccentLine accent={theme.accent} />

      {/* Visual description (subtle, top area) */}
      <div style={{
        position: 'absolute', top: 160, left: 60, right: 60,
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,0.18)',
        lineHeight: 1.5,
        opacity: interpolate(entryProgress, [0, 1], [0, 1]),
      }}>
        {scene.visual}
      </div>
    </AbsoluteFill>
  );
}
