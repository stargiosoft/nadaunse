/**
 * Canvas + WebCodecs + mp4-muxer 기반 브라우저 MP4 렌더링
 * Chrome/Edge 전용 (WebCodecs API 필요)
 * SceneRenderer.tsx와 동기화된 시각 효과
 */
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { Scene, TtsAudio, BgmAudio } from './types';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from './constants';

// ── Enhanced Scene Themes (synced with SceneRenderer.tsx) ──

const SCENE_THEMES: Record<string, { bg: [string, string, string]; accent: string; glow: string }> = {
  hook:          { bg: ['#1a0a2e', '#2d1b69', '#16213e'], accent: '#FF6B6B', glow: '#ff6b6b' },
  problem_intro: { bg: ['#1a0a1e', '#2d0a3e', '#0f1a40'], accent: '#e74c3c', glow: '#ff4757' },
  problem:       { bg: ['#1a0a1e', '#2d0a3e', '#0f1a40'], accent: '#e74c3c', glow: '#ff4757' },
  reason_1:      { bg: ['#0d0a17', '#1a1125', '#0d1a2d'], accent: '#FF6B6B', glow: '#ff6b6b' },
  reason_2:      { bg: ['#0d0a17', '#1a1525', '#1a1020'], accent: '#f39c12', glow: '#feca57' },
  reason_3:      { bg: ['#0d0a17', '#1a1030', '#1a0d2d'], accent: '#e056fd', glow: '#e056fd' },
  reason:        { bg: ['#0d0a17', '#1a1125', '#0d1a2d'], accent: '#FF6B6B', glow: '#ff6b6b' },
  solution:      { bg: ['#0a1a15', '#0d2820', '#0a2030'], accent: '#2ecc71', glow: '#00d2d3' },
  tip:           { bg: ['#0a1a15', '#0d2820', '#0a2030'], accent: '#2ecc71', glow: '#00d2d3' },
  cta:           { bg: ['#1a0a30', '#2d1b69', '#4a1a6a'], accent: '#e056fd', glow: '#ff6b9d' },
  intro:         { bg: ['#0a1a2e', '#162a4e', '#0d2040'], accent: '#4ecdc4', glow: '#4ecdc4' },
  content:       { bg: ['#0d0d17', '#151525', '#0d1a2d'], accent: '#58a6ff', glow: '#58a6ff' },
  outro:         { bg: ['#1a0a30', '#2d1b69', '#4a1a6a'], accent: '#e056fd', glow: '#ff6b9d' },
};

type Theme = { bg: [string, string, string]; accent: string; glow: string };

function getTheme(type: string): Theme {
  const key = type.toLowerCase().replace(/\s+/g, '_');
  return SCENE_THEMES[key] || SCENE_THEMES.content;
}

// ── Helpers ──

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function easeSpring(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.exp(-6 * t) * Math.cos(4 * t);
}

function easeOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function extractKeywords(subtitle: string): string[] {
  const boldRegex = /\*\*(.+?)\*\*/g;
  const bolds: string[] = [];
  let m;
  while ((m = boldRegex.exec(subtitle)) !== null) bolds.push(m[1]);
  if (bolds.length > 0) return bolds.slice(0, 3);
  const cleaned = subtitle.replace(/\*\*/g, '');
  const stop = ['은','는','이','가','을','를','의','에','에서','도','만','와','과','로','으로','하고','라고','때문에'];
  return cleaned.split(/\s+/).filter(w => w.length >= 2 && !stop.includes(w)).slice(0, 3);
}

const FONT = '"Pretendard Variable", Pretendard, sans-serif';

// ── Background Drawing ──

function drawBackground(
  ctx: OffscreenCanvasRenderingContext2D, scene: Scene, frame: number, duration: number,
  imageBitmap: ImageBitmap | undefined, theme: Theme,
) {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  const progress = frame / duration;

  if (imageBitmap) {
    const scale = 1.0 + progress * 0.15;
    const offX = progress * (-0.03 * w), offY = progress * (-0.02 * h);
    const dw = w * scale, dh = h * scale;
    ctx.drawImage(imageBitmap, (w - dw) / 2 + offX, (h - dh) / 2 + offY, dw, dh);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, w, h);
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
    vig.addColorStop(0, 'transparent'); vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
  } else {
    const [c1, c2, c3] = theme.bg;
    const angle = (160 + Math.sin(frame * 0.008) * 20) * Math.PI / 180;
    const cx = w / 2, cy = h / 2, len = Math.sqrt(w * w + h * h) / 2;
    const grad = ctx.createLinearGradient(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    grad.addColorStop(0, c1); grad.addColorStop(0.5, c2); grad.addColorStop(1, c3);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    // Ambient glows
    const g1x = (0.45 + Math.sin(frame * 0.01) * 0.15) * w, g1y = (0.3 + Math.cos(frame * 0.008) * 0.12) * h;
    const glow1 = ctx.createRadialGradient(g1x, g1y, 0, g1x, g1y, w * 0.45);
    glow1.addColorStop(0, hexToRgba(theme.glow, 0.08)); glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1; ctx.fillRect(0, 0, w, h);
    const g2x = (0.55 + Math.cos(frame * 0.012) * 0.18) * w, g2y = (0.65 + Math.sin(frame * 0.009) * 0.1) * h;
    const glow2 = ctx.createRadialGradient(g2x, g2y, 0, g2x, g2y, w * 0.4);
    glow2.addColorStop(0, hexToRgba(theme.accent, 0.05)); glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2; ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)'; ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 80) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (let gy = 0; gy < h; gy += 80) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

    // Bokeh orbs
    for (let i = 0; i < 8; i++) {
      const bx = seededRandom(scene.scene_number * 100 + i * 17) * w;
      const by = seededRandom(scene.scene_number * 100 + i * 31) * h;
      const bs = 30 + seededRandom(scene.scene_number * 100 + i * 47) * 50;
      const bsp = 0.6 + seededRandom(scene.scene_number * 100 + i * 61) * 0.8;
      const bd = 0.1 + i * 0.12;
      const be = easeOut((frame / VIDEO_FPS - bd) * 2);
      const bfY = Math.sin((frame + bd * 50) * bsp * 0.02) * 25;
      const bfX = Math.cos((frame + bd * 30) * bsp * 0.015) * 15;
      const bp = 1 + Math.sin((frame + bd * 20) * 0.04) * 0.2;
      const br = bs * be * bp;
      if (br <= 0) continue;
      const px = bx + bfX, py = by + bfY;
      const bg = ctx.createRadialGradient(px, py, 0, px, py, br);
      bg.addColorStop(0, hexToRgba(theme.glow, 0.12)); bg.addColorStop(0.5, hexToRgba(theme.glow, 0.04)); bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg; ctx.fillRect(px - br, py - br, br * 2, br * 2);
    }

    // Sparkles
    for (let i = 0; i < 7; i++) {
      const sx = (0.08 + seededRandom(scene.scene_number * 200 + i * 23) * 0.84) * w;
      const sy = (0.08 + seededRandom(scene.scene_number * 200 + i * 37) * 0.84) * h;
      const ss = 2 + seededRandom(scene.scene_number * 200 + i * 43) * 3;
      const sd = 0.3 + i * 0.18;
      const se = easeOut((frame / VIDEO_FPS - sd) * 3);
      const st = 0.2 + Math.abs(Math.sin((frame + sd * 40) * 0.15)) * 0.8;
      const sa = se * st * 0.6;
      if (sa <= 0) continue;
      ctx.save(); ctx.globalAlpha = sa; ctx.shadowColor = theme.accent; ctx.shadowBlur = ss * 4;
      ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    // Floating shapes
    for (let i = 0; i < 8; i++) {
      const fx = (0.05 + seededRandom(scene.scene_number * 300 + i * 19) * 0.9) * w;
      const fy = (0.08 + seededRandom(scene.scene_number * 300 + i * 29) * 0.84) * h;
      const fs = 8 + seededRandom(scene.scene_number * 300 + i * 41) * 16;
      const fd = 0.15 + i * 0.1;
      const fe = easeOut((frame / VIDEO_FPS - fd) * 2.5);
      const ff = Math.sin((frame + fd * 30) * 0.03) * 15;
      const fa = fe * 0.2;
      if (fa <= 0) continue;
      ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = hexToRgba(theme.accent, 0.5); ctx.lineWidth = 2;
      const st = Math.floor(seededRandom(scene.scene_number * 300 + i * 53) * 3);
      if (st === 0) { ctx.beginPath(); ctx.arc(fx, fy + ff, fs, 0, Math.PI * 2); ctx.stroke(); }
      else if (st === 1) { ctx.save(); ctx.translate(fx, fy + ff); ctx.rotate(frame * 0.01); ctx.beginPath(); ctx.moveTo(0, -fs); ctx.lineTo(fs, 0); ctx.lineTo(0, fs); ctx.lineTo(-fs, 0); ctx.closePath(); ctx.stroke(); ctx.restore(); }
      else { ctx.fillStyle = hexToRgba(theme.accent, 0.3); ctx.beginPath(); ctx.arc(fx, fy + ff, fs * 0.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }
}

// ── Motion Drawing Functions ──

type MotionDrawFn = (ctx: OffscreenCanvasRenderingContext2D, scene: Scene, frame: number, duration: number, theme: Theme, keywords: string[]) => void;

const drawMotionKeywordPop: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  const pos = keywords.length === 1 ? [0.5] : keywords.length === 2 ? [0.42, 0.58] : [0.35, 0.5, 0.65];
  keywords.forEach((kw, i) => {
    const t = easeSpring((frame - i * 6) / 15); if (t <= 0) return;
    const y = h * pos[i], p = 1 + Math.sin((frame - i * 6) * 0.08) * 0.03;
    const bg = ctx.createRadialGradient(w / 2, y, 0, w / 2, y, 200);
    bg.addColorStop(0, hexToRgba(theme.accent, 0.15 * t)); bg.addColorStop(1, 'transparent');
    ctx.fillStyle = bg; ctx.fillRect(w / 2 - 200, y - 200, 400, 400);
    ctx.save(); ctx.translate(w / 2, y); ctx.scale(t * p, t * p);
    ctx.shadowColor = theme.accent; ctx.shadowBlur = 40;
    ctx.font = `800 ${keywords.length > 2 ? 72 : 100}px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(kw, 0, 0); ctx.restore();
  });
};

const drawMotionTypewriter: MotionDrawFn = (ctx, scene, frame, duration, theme) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  const text = scene.subtitle.replace(/\*\*/g, '');
  const vis = Math.min(Math.floor(frame * (text.length / (duration * 0.7))), text.length);
  const fx = 80, fy = h * 0.3, fw = w - 160, fh = h * 0.35;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.strokeStyle = hexToRgba(theme.accent, 0.3); ctx.lineWidth = 2;
  roundRect(ctx, fx, fy, fw, fh, 16); ctx.fill(); ctx.stroke();
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fx + 24 + i * 22, fy + 20, 6, 0, Math.PI * 2); ctx.fill(); });
  ctx.font = `500 48px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  wrapText(ctx, '> ' + text.slice(0, vis), fx + 24, fy + 50, fw - 48, 64);
  if (vis < text.length && frame % 16 < 10) { ctx.shadowColor = theme.accent; ctx.shadowBlur = 12; ctx.fillStyle = theme.accent; ctx.fillRect(fx + 28 + ctx.measureText('> ' + text.slice(0, vis)).width, fy + 52, 3, 44); ctx.shadowBlur = 0; }
  ctx.restore();
};

const drawMotionSlideStack: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  keywords.forEach((kw, i) => {
    const t = easeSpring((frame - i * 8) / 15); if (t <= 0) return;
    const tx = (1 - t) * (i % 2 === 0 ? -200 : 200), y = h * 0.35 + i * 120;
    ctx.save(); ctx.globalAlpha = t; ctx.translate(tx, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.strokeStyle = hexToRgba(theme.accent, 0.15); ctx.lineWidth = 1;
    roundRect(ctx, 80, y, w - 160, 96, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = theme.accent; roundRect(ctx, 80, y, 6, 96, 3); ctx.fill();
    ctx.font = `600 48px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(kw, 120, y + 48);
    ctx.restore();
  });
};

const drawMotionCounter: MotionDrawFn = (ctx, scene, frame, duration, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  const text = scene.subtitle.replace(/\*\*/g, '');
  const num = parseInt((text.match(/[\d,]+/) || ['100'])[0].replace(/,/g, ''), 10);
  const cp = Math.min(frame / (duration * 0.6), 1), cur = Math.floor(num * easeOut(cp));
  const cx = w / 2, cy = h * 0.45, r = 140;
  ctx.save();
  ctx.strokeStyle = hexToRgba(theme.accent, 0.15); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = theme.accent; ctx.shadowColor = theme.accent; ctx.shadowBlur = 20; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeOut(cp)); ctx.stroke(); ctx.shadowBlur = 0;
  const p = cp >= 1 ? 1 + Math.sin(frame * 0.15) * 0.04 : 1;
  ctx.translate(cx, cy); ctx.scale(p, p);
  ctx.font = `800 120px ${FONT}`; ctx.fillStyle = theme.accent; ctx.shadowColor = theme.accent; ctx.shadowBlur = 30;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(cur.toLocaleString(), 0, 0);
  ctx.shadowBlur = 0; ctx.font = `600 44px ${FONT}`; ctx.fillStyle = 'white'; ctx.fillText(keywords[0] || '', 0, 80);
  ctx.restore();
};

const drawMotionSplitCompare: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  const lt = easeSpring(frame / 15), rt = easeSpring((frame - 8) / 15), dt = easeSpring((frame - 4) / 15);
  ctx.save(); ctx.globalAlpha = lt;
  let lg = ctx.createLinearGradient(0, 0, w / 2, 0); lg.addColorStop(0, hexToRgba('#FF6B6B', 0.12)); lg.addColorStop(1, 'transparent');
  ctx.fillStyle = lg; ctx.fillRect(0, h * 0.3, w / 2, h * 0.35);
  ctx.font = `700 64px ${FONT}`; ctx.fillStyle = '#FF6B6B'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(keywords[0] || 'Before', w * 0.25, h * 0.48); ctx.restore();
  ctx.save(); ctx.globalAlpha = rt;
  lg = ctx.createLinearGradient(w / 2, 0, w, 0); lg.addColorStop(0, 'transparent'); lg.addColorStop(1, hexToRgba('#4ecdc4', 0.12));
  ctx.fillStyle = lg; ctx.fillRect(w / 2, h * 0.3, w / 2, h * 0.35);
  ctx.font = `700 64px ${FONT}`; ctx.fillStyle = '#4ecdc4'; ctx.textAlign = 'center';
  ctx.fillText(keywords[1] || keywords[0] || 'After', w * 0.75, h * 0.48); ctx.restore();
  ctx.save(); ctx.globalAlpha = dt; ctx.shadowColor = theme.accent; ctx.shadowBlur = 15; ctx.fillStyle = theme.accent;
  const dh2 = h * 0.35 * dt * 0.6; ctx.fillRect(w / 2 - 3, h * 0.48 - dh2 / 2, 6, dh2);
  ctx.beginPath(); ctx.arc(w / 2, h * 0.48, 36, 0, Math.PI * 2); ctx.fill();
  ctx.font = `900 28px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VS', w / 2, h * 0.48); ctx.restore();
};

const drawMotionRadialBurst: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, cx = w / 2, cy = h * 0.45, t = easeSpring(frame / 18);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, ll = (150 + (i % 4) * 40) * t;
    ctx.save(); ctx.globalAlpha = (i % 2 === 0 ? 0.25 : 0.15) * t; ctx.strokeStyle = theme.accent; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); ctx.lineTo(cx + Math.cos(a) * ll, cy + Math.sin(a) * ll); ctx.stroke();
    ctx.fillStyle = theme.glow; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * ll, cy + Math.sin(a) * ll, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  for (let r = 0; r < 2; r++) { const rt2 = easeOut((frame - r * 6) / 20); if (rt2 <= 0) continue; ctx.save(); ctx.globalAlpha = (1 - rt2) * 0.4; ctx.strokeStyle = theme.accent; ctx.shadowColor = theme.accent; ctx.shadowBlur = 10; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, rt2 * 180, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.shadowColor = theme.accent; ctx.shadowBlur = 30; ctx.font = `800 80px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = t; ctx.fillText(keywords[0] || '', cx, cy); ctx.restore();
};

const drawMotionListReveal: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  keywords.forEach((kw, i) => {
    const t = easeSpring((frame - i * 12) / 15); if (t <= 0) return;
    const y = h * 0.33 + i * 130, tx = (1 - t) * -60;
    ctx.save(); ctx.globalAlpha = t; ctx.translate(tx, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(ctx, 80, y, w - 160, 100, 14); ctx.fill();
    ctx.beginPath(); ctx.arc(140, y + 50, 28, 0, Math.PI * 2); ctx.fillStyle = theme.accent; ctx.shadowColor = theme.accent; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
    ctx.font = `800 28px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), 140, y + 50);
    ctx.font = `600 44px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(kw, 190, y + 52); ctx.restore();
    if (i > 0) { const pt = easeSpring((frame - (i - 1) * 12 - 6) / 10); if (pt > 0) { ctx.save(); ctx.globalAlpha = pt * 0.3; ctx.strokeStyle = theme.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(140, y - 30); ctx.lineTo(140, y + 22); ctx.stroke(); ctx.restore(); } }
  });
};

const drawMotionZoomImpact: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, cx = w / 2, cy = h * 0.45;
  const zt = easeSpring(frame / 12), scale = 4 - 3 * zt;
  if (frame >= 3 && frame <= 6) { ctx.save(); ctx.globalAlpha = (1 - (frame - 3) / 3) * 0.6; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, w, h); ctx.restore(); }
  let sx = 0, sy = 0; if (frame > 8 && frame < 25) { const d = Math.exp(-(frame - 8) * 0.2); sx = Math.sin(frame * 2.5) * 15 * d; sy = Math.cos(frame * 3) * 10 * d; }
  for (let r = 0; r < 3; r++) { const rt = easeOut((frame - 5 - r * 4) / 15); if (rt <= 0) continue; ctx.save(); ctx.globalAlpha = (1 - rt) * 0.3; ctx.strokeStyle = theme.accent; ctx.shadowColor = theme.accent; ctx.shadowBlur = 8; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx + sx, cy + sy, rt * 250, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(cx + sx, cy + sy); ctx.scale(scale, scale); ctx.globalAlpha = zt; ctx.shadowColor = theme.accent; ctx.shadowBlur = 40;
  ctx.font = `900 100px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(keywords[0] || '', 0, 0);
  if (keywords[1]) { ctx.shadowBlur = 15; ctx.font = `600 52px ${FONT}`; ctx.fillStyle = theme.accent; ctx.fillText(keywords[1], 0, 70); } ctx.restore();
};

const drawMotionGlitch: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, gl = (frame % 30 < 4) || (frame % 45 < 3), t = easeSpring(frame / 12);
  keywords.forEach((kw, i) => {
    const y = h * (keywords.length === 1 ? 0.45 : 0.38 + i * 0.14);
    const gx = gl ? Math.sin(frame * 7 + i) * 8 : 0, gy = gl ? Math.cos(frame * 5 + i) * 4 : 0;
    const fs = keywords.length > 2 ? 60 : 80;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${fs}px ${FONT}`;
    if (gl) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#ff0000'; ctx.fillText(kw, w / 2 - 5 + gx, y + gy); ctx.fillStyle = '#00ffff'; ctx.fillText(kw, w / 2 + 5 + gx, y - gy); }
    ctx.globalAlpha = t; ctx.fillStyle = 'white'; ctx.shadowColor = theme.accent; ctx.shadowBlur = gl ? 20 : 10; ctx.fillText(kw, w / 2 + gx, y + gy); ctx.restore();
  });
  if (gl) { ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = 'white'; ctx.fillRect(0, (frame * 8) % h, w, 3); ctx.fillRect(0, ((frame * 8) + h / 3) % h, w, 2);
    for (let n = 0; n < 3; n++) { ctx.globalAlpha = 0.08; ctx.fillRect(0, seededRandom(frame * 7 + n * 31) * h, w, 4 + seededRandom(frame * 11 + n * 17) * 20); } ctx.restore(); }
};

const drawMotionWave: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, text = keywords[0] || '', chars = text.split('');
  const fs = chars.length > 8 ? 60 : 80, tw = chars.length * fs * 0.6, sx = (w - tw) / 2;
  ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.moveTo(0, h * 0.6);
  for (let x = 0; x <= w; x += 10) ctx.lineTo(x, Math.sin(x * 0.008 + frame * 0.04) * 40 + h * 0.5);
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill(); ctx.restore();
  chars.forEach((c, i) => {
    const t = easeSpring((frame - i * 2) / 12); if (t <= 0) return;
    const wy = Math.sin(frame * 0.12 + i * 0.5) * 18, x = sx + i * fs * 0.6, y = h * 0.45 + wy;
    const hue = ((i * 20) + frame * 0.8) % 360;
    ctx.save(); ctx.globalAlpha = t; ctx.font = `700 ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = `hsl(${hue}, 70%, 75%)`; ctx.shadowColor = `hsl(${hue}, 70%, 60%)`; ctx.shadowBlur = 15;
    ctx.fillText(c === ' ' ? '' : c, x, y); ctx.restore();
  });
};

const drawMotionSpotlight: MotionDrawFn = (ctx, _s, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, cx = w / 2, cy = h * 0.45;
  const t = easeOut(frame / 20), r = t * 350;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-out';
  const jx = Math.sin(frame * 0.07) * 5, jy = Math.cos(frame * 0.09) * 3;
  const sg = ctx.createRadialGradient(cx + jx, cy + jy, r * 0.7, cx + jx, cy + jy, r);
  sg.addColorStop(0, 'rgba(0,0,0,1)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h); ctx.restore();
  if (t > 0.3) { const tt = easeSpring((t - 0.3) / 0.7); ctx.save(); ctx.globalAlpha = tt; ctx.shadowColor = theme.accent; ctx.shadowBlur = 25;
    ctx.font = `800 80px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(keywords[0] || '', cx, cy); ctx.restore(); }
};

const drawMotionCardFlip: MotionDrawFn = (ctx, _s, frame, duration, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, cx = w / 2, cy = h * 0.45;
  const fp = Math.min(frame / (duration * 0.4), 1), fa = fp * Math.PI, isFront = fa < Math.PI / 2, scaleX = Math.abs(Math.cos(fa)) || 0.01;
  const cw2 = 350, ch2 = 175;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(scaleX, 1);
  const cg = ctx.createLinearGradient(-cw2, 0, cw2, 0); cg.addColorStop(0, hexToRgba(theme.accent, 0.15)); cg.addColorStop(1, hexToRgba(theme.glow, 0.1));
  ctx.fillStyle = cg; ctx.strokeStyle = hexToRgba(theme.accent, 0.3); ctx.lineWidth = 2;
  roundRect(ctx, -cw2, -ch2, cw2 * 2, ch2 * 2, 24); ctx.fill(); ctx.stroke();
  ctx.font = `800 72px ${FONT}`; ctx.fillStyle = isFront ? 'rgba(255,255,255,0.8)' : 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = theme.accent; ctx.shadowBlur = isFront ? 0 : 20;
  ctx.fillText(isFront ? (keywords[0] || '?') : (keywords[1] || keywords[0] || '!'), 0, 0); ctx.restore();
  if (fp > 0.45 && fp < 0.55) { ctx.save(); ctx.globalAlpha = 0.3 * (1 - Math.abs(fp - 0.5) / 0.05);
    const fl = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300); fl.addColorStop(0, 'white'); fl.addColorStop(1, 'transparent');
    ctx.fillStyle = fl; ctx.fillRect(0, 0, w, h); ctx.restore(); }
};

const drawMotionProgressBar: MotionDrawFn = (ctx, _s, frame, duration, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, bw = w - 200, bh = 36, bx = 100, by = h * 0.48;
  const fp = easeOut(Math.min(frame / (duration * 0.65), 1)), pct = Math.floor(fp * 100);
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
  const fw2 = bw * fp;
  if (fw2 > 0) { const fg = ctx.createLinearGradient(bx, 0, bx + fw2, 0); fg.addColorStop(0, theme.accent); fg.addColorStop(1, theme.glow);
    ctx.fillStyle = fg; ctx.shadowColor = theme.accent; ctx.shadowBlur = 15; roundRect(ctx, bx, by, fw2, bh, bh / 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + fw2 - 2, by + bh / 2, 8, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill(); } ctx.shadowBlur = 0;
  ctx.font = `800 96px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = theme.accent; ctx.shadowBlur = 20;
  ctx.fillText(`${pct}%`, w / 2, by - 80); ctx.shadowBlur = 0;
  ctx.font = `600 40px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(keywords[0] || '', w / 2, by + bh + 50); ctx.restore();
};

const drawMotionEmojiRain: MotionDrawFn = (ctx, scene, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, emoji = scene.icon || '✨';
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const ex = seededRandom(i * 47 + 13) * w, sp = 0.5 + seededRandom(i * 31 + 7) * 1.5, es = 20 + seededRandom(i * 23 + 3) * 30;
    const sd = seededRandom(i * 19 + 11) * 30, wb = Math.sin((frame + i * 17) * 0.06) * 20;
    const ey = ((frame - sd) * sp * 3) % (h + 100) - 50;
    if (frame < sd || ey < -50) continue;
    ctx.globalAlpha = 0.5 + seededRandom(i * 37) * 0.3; ctx.font = `${es}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(emoji, ex + wb, ey);
  }
  ctx.restore();
  const t = easeSpring(frame / 15);
  ctx.save(); ctx.globalAlpha = t; ctx.shadowColor = theme.accent; ctx.shadowBlur = 30;
  ctx.font = `900 88px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(keywords[0] || '', w / 2, h * 0.45); ctx.restore();
};

const drawMotionParallaxLayers: MotionDrawFn = (ctx, scene, frame, _d, theme, keywords) => {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  ctx.save(); ctx.globalAlpha = 0.1;
  for (let i = 0; i < 3; i++) {
    const bx2 = seededRandom(scene.scene_number * 50 + i * 11) * w - frame * 0.3;
    const by2 = (0.2 + seededRandom(scene.scene_number * 50 + i * 23) * 0.6) * h;
    const bs2 = 80 + seededRandom(scene.scene_number * 50 + i * 37) * 80;
    const px = ((bx2 % (w + 200)) + w + 200) % (w + 200) - 100;
    const bg2 = ctx.createRadialGradient(px, by2, 0, px, by2, bs2);
    bg2.addColorStop(0, hexToRgba(theme.glow, 0.3)); bg2.addColorStop(1, 'transparent');
    ctx.fillStyle = bg2; ctx.fillRect(px - bs2, by2 - bs2, bs2 * 2, bs2 * 2);
  } ctx.restore();
  const t = easeSpring(frame / 15);
  ctx.save(); ctx.globalAlpha = t; ctx.font = `800 80px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = theme.accent; ctx.shadowBlur = 20; ctx.fillText(keywords[0] || '', w / 2 - frame * 0.2, h * 0.45);
  if (keywords[1]) { ctx.font = `600 48px ${FONT}`; ctx.fillStyle = theme.accent; ctx.fillText(keywords[1], w / 2 - frame * 0.15, h * 0.53); } ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.25;
  for (let i = 0; i < 12; i++) {
    const px2 = ((seededRandom(i * 29 + 7) * w * 2 - frame * (1.5 + seededRandom(i * 13) * 1.5)) % (w + 100) + w + 100) % (w + 100) - 50;
    const py2 = seededRandom(i * 41 + 3) * h, ps = 2 + seededRandom(i * 53) * 4;
    ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.arc(px2, py2, ps, 0, Math.PI * 2); ctx.fill();
  } ctx.restore();
};

const MOTION_DRAWERS: Record<string, MotionDrawFn> = {
  keyword_pop: drawMotionKeywordPop, typewriter: drawMotionTypewriter, slide_stack: drawMotionSlideStack,
  counter: drawMotionCounter, split_compare: drawMotionSplitCompare, radial_burst: drawMotionRadialBurst,
  list_reveal: drawMotionListReveal, zoom_impact: drawMotionZoomImpact, glitch: drawMotionGlitch,
  wave: drawMotionWave, spotlight: drawMotionSpotlight, card_flip: drawMotionCardFlip,
  progress_bar: drawMotionProgressBar, emoji_rain: drawMotionEmojiRain, parallax_layers: drawMotionParallaxLayers,
};

// ── Subtitle Drawing ──

function parseSubtitle(text: string): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), bold: false });
  if (parts.length === 0) parts.push({ text, bold: false });
  return parts;
}

function drawSubtitle(ctx: OffscreenCanvasRenderingContext2D, scene: Scene, frame: number) {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  const bottomGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
  bottomGrad.addColorStop(0, 'transparent'); bottomGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = bottomGrad; ctx.fillRect(0, h * 0.55, w, h * 0.45);
  const st = easeSpring(frame / 10); if (st <= 0) return;
  const sy = h - 280, parts = parseSubtitle(scene.subtitle);
  const words: { word: string; bold: boolean; idx: number }[] = [];
  let idx = 0;
  for (const part of parts) for (const wd of part.text.split(/\s+/).filter(Boolean)) words.push({ word: wd, bold: part.bold, idx: idx++ });
  const wws = words.map(wd => { ctx.font = wd.bold ? `900 56px ${FONT}` : `700 48px ${FONT}`; return ctx.measureText(wd.word).width; });
  const maxW = w - 120, gap = 12;
  const lines: { words: typeof words; widths: number[] }[] = [];
  let cl: typeof words = [], cw: number[] = [], lw = 0;
  words.forEach((wd, i) => {
    if (lw + wws[i] + (cl.length > 0 ? gap : 0) > maxW && cl.length > 0) { lines.push({ words: cl, widths: cw }); cl = [wd]; cw = [wws[i]]; lw = wws[i]; }
    else { cl.push(wd); cw.push(wws[i]); lw += wws[i] + (cl.length > 1 ? gap : 0); }
  });
  if (cl.length > 0) lines.push({ words: cl, widths: cw });
  const lh = 76, totalH = lines.length * lh, startY = sy - totalH / 2;
  ctx.save(); ctx.globalAlpha = st * 0.3; ctx.fillStyle = 'rgba(0,0,0,1)';
  roundRect(ctx, (w - Math.min(maxW, 900)) / 2, startY - 18, Math.min(maxW, 900), totalH + 36, 20); ctx.fill(); ctx.restore();
  lines.forEach((line, li) => {
    const tlw = line.widths.reduce((a, b) => a + b, 0) + (line.words.length - 1) * gap;
    let dx = (w - tlw) / 2;
    const dy = startY + li * lh + lh / 2;
    line.words.forEach((wd, wi) => {
      const wt = easeSpring((frame - wd.idx * 2) / 10); if (wt <= 0) { dx += line.widths[wi] + gap; return; }
      const wy = dy + (1 - wt) * 14, bp = wd.bold ? 1 + Math.sin((frame - wd.idx * 2) * 0.08) * 0.03 : 1;
      ctx.save(); ctx.globalAlpha = wt; ctx.font = wd.bold ? `900 56px ${FONT}` : `700 48px ${FONT}`;
      ctx.fillStyle = wd.bold ? '#FFD93D' : 'white'; ctx.shadowColor = wd.bold ? 'rgba(255,217,61,0.5)' : 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = wd.bold ? 20 : 10; ctx.shadowOffsetY = wd.bold ? 0 : 3; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.translate(dx + line.widths[wi] / 2, wy); ctx.scale(bp, bp); ctx.translate(-(dx + line.widths[wi] / 2), -wy);
      ctx.fillText(wd.word, dx, wy); ctx.restore(); dx += line.widths[wi] + gap;
    });
  });
}

// ── Transition + Helpers ──

function applyTransition(ctx: OffscreenCanvasRenderingContext2D, transition: string, frame: number, entryT: number): { pre?: () => void } {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT;
  if (transition === 'zoom') return { pre: () => { ctx.translate(w / 2, h / 2); ctx.scale(1.2 - 0.2 * entryT, 1.2 - 0.2 * entryT); ctx.translate(-w / 2, -h / 2); } };
  if (transition === 'slide') return { pre: () => { ctx.translate((1 - entryT) * w, 0); } };
  if (transition === 'scale_rotate') { const s = 0.5 + 0.5 * entryT, r = (-15 + 15 * entryT) * Math.PI / 180; return { pre: () => { ctx.translate(w / 2, h / 2); ctx.scale(s, s); ctx.rotate(r); ctx.translate(-w / 2, -h / 2); } }; }
  if (transition === 'wipe_left') { const cw2 = Math.min(frame / 12, 1) * w; return { pre: () => { ctx.beginPath(); ctx.rect(0, 0, cw2, h); ctx.clip(); } }; }
  return {};
}

function roundRect(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function wrapText(ctx: OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = '', curY = y;
  for (const c of text.split('')) { const t = line + c; if (ctx.measureText(t).width > maxWidth && line) { ctx.fillText(line, x, curY); line = c; curY += lineHeight; } else line = t; }
  ctx.fillText(line, x, curY);
}

// ── Main drawFrame ──

function drawFrame(ctx: OffscreenCanvasRenderingContext2D, scene: Scene, frameInScene: number, sceneDurationFrames: number, imageBitmap?: ImageBitmap) {
  const w = VIDEO_WIDTH, h = VIDEO_HEIGHT, theme = getTheme(scene.type), keywords = extractKeywords(scene.subtitle);
  ctx.clearRect(0, 0, w, h);
  const entryAlpha = Math.min(frameInScene / 10, 1), exitAlpha = Math.min((sceneDurationFrames - frameInScene) / 8, 1);
  const alpha = Math.max(0, Math.min(1, entryAlpha * exitAlpha));
  const transition = scene.transition?.toLowerCase() || 'cut';
  const entryT = easeOut(Math.min(frameInScene / 12, 1));
  if (transition === 'fade') ctx.globalAlpha = Math.min(frameInScene / 10, 1) * exitAlpha;
  else if (transition === 'blur_in') ctx.globalAlpha = Math.min(frameInScene / 6, 1) * exitAlpha;
  else ctx.globalAlpha = alpha;
  const { pre } = applyTransition(ctx, transition, frameInScene, entryT);
  ctx.save(); if (pre) pre();
  drawBackground(ctx, scene, frameInScene, sceneDurationFrames, imageBitmap, theme);
  // Scene label
  ctx.save(); ctx.globalAlpha = Math.min(1, entryT) * 0.7;
  ctx.fillStyle = hexToRgba(theme.accent, 0.25); roundRect(ctx, 60, 78, 44, 44, 12); ctx.fill();
  ctx.font = `800 22px ${FONT}`; ctx.fillStyle = theme.accent; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(scene.scene_number), 82, 100);
  ctx.font = `600 24px ${FONT}`; ctx.fillStyle = hexToRgba(theme.accent, 0.6); ctx.textAlign = 'left'; ctx.fillText(scene.type.toUpperCase(), 120, 100); ctx.restore();
  // Visual desc
  ctx.save(); ctx.globalAlpha = entryT * 0.12; ctx.font = `400 22px ${FONT}`; ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  wrapText(ctx, scene.visual, 60, 160, w - 120, 34); ctx.restore();
  // Particle burst for hook/cta
  const st = scene.type.toLowerCase().replace(/\s+/g, '_');
  if (['hook', 'cta', 'outro'].includes(st) && !imageBitmap) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, pd = i * 1.5, pt = easeOut((frameInScene - pd) / 15); if (pt <= 0) continue;
      const dist = pt * (130 + (i % 4) * 35);
      ctx.save(); ctx.globalAlpha = (1 - pt) * 0.5; ctx.fillStyle = i % 3 === 0 ? theme.glow : theme.accent;
      ctx.shadowColor = theme.accent; ctx.shadowBlur = 6; ctx.beginPath();
      ctx.arc(w / 2 + Math.cos(a) * dist, h * 0.45 + Math.sin(a) * dist, 3 + (i % 3) * 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  // Icon badge
  const icon = scene.icon || '';
  if (icon) { const it = easeSpring(frameInScene / 15); ctx.save(); ctx.globalAlpha = it; ctx.translate(w - 130, 130); ctx.scale(it, it);
    ctx.fillStyle = hexToRgba(theme.accent, 0.25); ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.fill();
    ctx.font = '48px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, 0, 0); ctx.restore(); }
  // Motion
  const drawer = MOTION_DRAWERS[scene.motion_style || 'keyword_pop'] || MOTION_DRAWERS.keyword_pop;
  drawer(ctx, scene, frameInScene, sceneDurationFrames, theme, keywords);
  // Accent line
  const lt = easeOut((frameInScene - 5) / 12);
  if (lt > 0) { const lg2 = ctx.createLinearGradient(w * 0.3, 0, w * 0.7, 0); lg2.addColorStop(0, 'transparent'); lg2.addColorStop(0.5, hexToRgba(theme.accent, 0.5)); lg2.addColorStop(1, 'transparent');
    ctx.fillStyle = lg2; ctx.fillRect(w * (0.5 - lt * 0.2), h * 0.75, w * lt * 0.4, 3); }
  drawSubtitle(ctx, scene, frameInScene);
  ctx.restore(); ctx.globalAlpha = 1;
}

// ── Audio ──

function decodeBase64ToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]; const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function decodeTtsAudio(ttsAudios: TtsAudio[], scenes: Scene[], bgmAudio?: BgmAudio | null): Promise<{ pcmData: Float32Array; sampleRate: number }> {
  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const buffers: { buffer: AudioBuffer; offsetSeconds: number }[] = [];
  let offset = 0;
  for (const scene of scenes) {
    const tts = ttsAudios.find(a => a.sceneNumber === scene.scene_number);
    if (tts) { const bytes = decodeBase64ToBytes(tts.dataUrl); const buffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0)); buffers.push({ buffer, offsetSeconds: offset }); offset += tts.durationInSeconds; }
    else offset += scene.duration;
  }
  const totalDuration = offset, sampleRate = 44100, totalSamples = Math.ceil(totalDuration * sampleRate);
  const mixedCtx = new OfflineAudioContext(1, totalSamples, sampleRate);
  for (const { buffer, offsetSeconds } of buffers) { const source = mixedCtx.createBufferSource(); source.buffer = buffer; source.connect(mixedCtx.destination); source.start(offsetSeconds); }
  const ttsRendered = await mixedCtx.startRendering();
  const ttsPcm = ttsRendered.getChannelData(0);
  if (!bgmAudio) return { pcmData: ttsPcm, sampleRate };
  const bgmCtx = new OfflineAudioContext(1, 1, sampleRate);
  const bgmBytes = decodeBase64ToBytes(bgmAudio.dataUrl);
  const bgmBuffer = await bgmCtx.decodeAudioData(bgmBytes.buffer.slice(0));
  const bgmMixCtx = new OfflineAudioContext(1, totalSamples, sampleRate);
  const bgmSource = bgmMixCtx.createBufferSource(); bgmSource.buffer = bgmBuffer;
  const bgmGain = bgmMixCtx.createGain(); bgmGain.gain.value = 0.25;
  bgmGain.gain.setValueAtTime(0, 0); bgmGain.gain.linearRampToValueAtTime(0.25, 1.0);
  const fadeOutStart = Math.max(0, totalDuration - 2.0);
  bgmGain.gain.setValueAtTime(0.25, fadeOutStart); bgmGain.gain.linearRampToValueAtTime(0, totalDuration);
  bgmSource.connect(bgmGain); bgmGain.connect(bgmMixCtx.destination); bgmSource.start(0);
  const bgmRendered = await bgmMixCtx.startRendering();
  const bgmPcm = bgmRendered.getChannelData(0);
  const mixed = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) mixed[i] = Math.max(-1, Math.min(1, (i < ttsPcm.length ? ttsPcm[i] : 0) + (i < bgmPcm.length ? bgmPcm[i] : 0)));
  return { pcmData: mixed, sampleRate };
}

// ── Main render ──

export async function renderVideoToMp4(scenes: Scene[], ttsAudios: TtsAudio[], onProgress: (progress: number) => void, bgmAudio?: BgmAudio | null): Promise<Blob> {
  const sceneDurations = scenes.map(s => { const tts = ttsAudios.find(a => a.sceneNumber === s.scene_number); return tts ? tts.durationInSeconds : s.duration; });
  const totalDuration = sceneDurations.reduce((a, b) => a + b, 0);
  const totalFrames = Math.round(totalDuration * VIDEO_FPS);
  const canvas = new OffscreenCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
  const ctx = canvas.getContext('2d')!;
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'avc', width: VIDEO_WIDTH, height: VIDEO_HEIGHT }, audio: { codec: 'aac', numberOfChannels: 1, sampleRate: 44100 }, fastStart: 'in-memory' });
  const videoEncoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => console.error('VideoEncoder error:', e) });
  videoEncoder.configure({ codec: 'avc1.640028', width: VIDEO_WIDTH, height: VIDEO_HEIGHT, bitrate: 4_000_000, framerate: VIDEO_FPS });
  const audioEncoder = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: (e) => console.error('AudioEncoder error:', e) });
  audioEncoder.configure({ codec: 'mp4a.40.2', numberOfChannels: 1, sampleRate: 44100, bitrate: 128000 });
  const sceneImageBitmaps = new Map<number, ImageBitmap>();
  for (const scene of scenes) {
    if (scene.backgroundImageUrl) {
      try { const r = await fetch(scene.backgroundImageUrl); const b = await r.blob(); sceneImageBitmaps.set(scene.scene_number, await createImageBitmap(b)); }
      catch (err) { console.warn(`Failed to decode image for scene ${scene.scene_number}`, err); }
    }
  }
  let audioData: Float32Array | null = null;
  if (ttsAudios.length > 0) audioData = (await decodeTtsAudio(ttsAudios, scenes, bgmAudio)).pcmData;
  let globalFrame = 0;
  for (let si = 0; si < scenes.length; si++) {
    const scene = scenes[si], sdf = Math.round(sceneDurations[si] * VIDEO_FPS), bitmap = sceneImageBitmaps.get(scene.scene_number);
    for (let f = 0; f < sdf; f++) {
      drawFrame(ctx, scene, f, sdf, bitmap);
      const frame = new VideoFrame(canvas, { timestamp: (globalFrame / VIDEO_FPS) * 1_000_000, duration: (1 / VIDEO_FPS) * 1_000_000 });
      videoEncoder.encode(frame, { keyFrame: f === 0 }); frame.close(); globalFrame++;
      if (globalFrame % 10 === 0) onProgress((globalFrame / totalFrames) * 0.7);
      if (globalFrame % 30 === 0) await new Promise(r => setTimeout(r, 0));
    }
  }
  await videoEncoder.flush(); onProgress(0.75);
  if (audioData) {
    const cs = 1024;
    for (let i = 0; i < audioData.length; i += cs) {
      const chunk = audioData.slice(i, Math.min(i + cs, audioData.length));
      const ad = new AudioData({ format: 'f32-planar', sampleRate: 44100, numberOfFrames: chunk.length, numberOfChannels: 1, timestamp: (i / 44100) * 1_000_000, data: chunk });
      audioEncoder.encode(ad); ad.close();
      if (i % (cs * 100) === 0) { onProgress(0.75 + (i / audioData.length) * 0.2); await new Promise(r => setTimeout(r, 0)); }
    }
  }
  await audioEncoder.flush(); onProgress(0.95);
  videoEncoder.close(); audioEncoder.close(); muxer.finalize(); onProgress(1);
  return new Blob([target.buffer], { type: 'video/mp4' });
}

export function isWebCodecsSupported(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined';
}
