/**
 * Canvas + WebCodecs + mp4-muxer 기반 브라우저 MP4 렌더링
 * Chrome/Edge 전용 (WebCodecs API 필요)
 */
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { Scene, TtsAudio } from './types';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from './constants';

// ── Scene colors (same as SceneRenderer.tsx) ──

const SCENE_COLORS: Record<string, [string, string]> = {
  hook: ['#FF6B6B', '#EE5A24'],
  problem_intro: ['#4834d4', '#686de0'],
  reason_1: ['#22a6b3', '#7ed6df'],
  reason_2: ['#6ab04c', '#badc58'],
  reason_3: ['#f9ca24', '#f0932b'],
  solution: ['#30336b', '#535c68'],
  cta: ['#e056fd', '#be2edd'],
  intro: ['#4834d4', '#686de0'],
  content: ['#2d3436', '#636e72'],
  outro: ['#e056fd', '#be2edd'],
};

function getColors(type: string): [string, string] {
  const key = type.toLowerCase().replace(/\s+/g, '_');
  return SCENE_COLORS[key] || SCENE_COLORS.content;
}

// ── Draw a single frame on canvas ──

function drawFrame(
  ctx: OffscreenCanvasRenderingContext2D,
  scene: Scene,
  frameInScene: number,
  sceneDurationFrames: number,
  imageBitmap?: ImageBitmap,
) {
  const w = VIDEO_WIDTH;
  const h = VIDEO_HEIGHT;
  const progress = frameInScene / sceneDurationFrames; // 0~1

  // Clear
  ctx.clearRect(0, 0, w, h);

  if (imageBitmap) {
    // Image background with Ken Burns effect
    const scale = 1.0 + progress * 0.15;
    const offsetX = progress * (-0.03 * w);
    const offsetY = progress * (-0.02 * h);
    const drawW = w * scale;
    const drawH = h * scale;
    const drawX = (w - drawW) / 2 + offsetX;
    const drawY = (h - drawH) / 2 + offsetY;
    ctx.drawImage(imageBitmap, drawX, drawY, drawW, drawH);

    // Dark overlay for readability
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, w, h);

    // Vignette
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Background gradient
    const [c1, c2] = getColors(scene.type);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Radial highlight
    const radGrad = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.3, h * 0.2, w * 0.6);
    radGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Entry animation (first 10 frames)
  const entryAlpha = Math.min(frameInScene / 10, 1);
  // Exit animation (last 6 frames)
  const exitAlpha = Math.min((sceneDurationFrames - frameInScene) / 6, 1);
  const alpha = Math.max(0, Math.min(1, entryAlpha * exitAlpha));

  ctx.globalAlpha = alpha;

  // Scene number badge
  ctx.beginPath();
  ctx.arc(100, 100, 40, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = '800 36px "Pretendard Variable", Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(scene.scene_number), 100, 100);

  // Type label
  ctx.font = '600 28px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(scene.type.toUpperCase(), 160, 100);

  // Visual description (subtle)
  ctx.font = '400 26px "Pretendard Variable", Pretendard, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  wrapText(ctx, scene.visual, 60, 180, w - 120, 40);

  // Bottom gradient overlay for subtitle
  const bottomGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Subtitle text (with entry scale animation)
  const subtitleScale = Math.min(frameInScene / 8, 1);
  ctx.save();
  const subtitleY = h - 280;
  ctx.translate(w / 2, subtitleY);
  ctx.scale(0.85 + 0.15 * subtitleScale, 0.85 + 0.15 * subtitleScale);

  // Parse **bold** markers
  const parts = parseSubtitle(scene.subtitle);
  drawSubtitleParts(ctx, parts, 0, 0, w - 120);

  ctx.restore();

  ctx.globalAlpha = 1;
}

function parseSubtitle(text: string): { text: string; bold: boolean }[] {
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

function drawSubtitleParts(
  ctx: OffscreenCanvasRenderingContext2D,
  parts: { text: string; bold: boolean }[],
  x: number,
  y: number,
  maxWidth: number,
) {
  // Simple: draw full text centered, bold parts in yellow
  const fullText = parts.map(p => p.text).join('');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  // Check if any bold parts exist
  const hasBold = parts.some(p => p.bold);

  if (!hasBold) {
    ctx.font = '700 56px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillStyle = 'white';
    wrapTextCentered(ctx, fullText, x, y, maxWidth, 80);
  } else {
    // Draw whole text in white first, then overlay bold parts in yellow
    ctx.font = '700 56px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillStyle = 'white';
    wrapTextCentered(ctx, fullText, x, y, maxWidth, 80);

    // For bold parts, redraw in yellow
    // Simple approach: just draw the full text with bold highlighted
    ctx.font = '900 64px "Pretendard Variable", Pretendard, sans-serif';
    ctx.fillStyle = '#FFD93D';
    for (const part of parts) {
      if (part.bold) {
        wrapTextCentered(ctx, part.text, x, y, maxWidth, 80);
      }
    }
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function wrapText(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split('');
  let line = '';
  let currentY = y;

  for (const char of words) {
    const testLine = line + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

function wrapTextCentered(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const chars = text.split('');
  let line = '';
  const lines: string[] = [];

  for (const char of chars) {
    const testLine = line + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const totalHeight = lines.length * lineHeight;
  const startY = y - totalHeight / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }
}

// ── Decode TTS audio to PCM ──

async function decodeTtsAudio(
  ttsAudios: TtsAudio[],
  scenes: Scene[],
): Promise<{ pcmData: Float32Array; sampleRate: number }> {
  const audioCtx = new OfflineAudioContext(1, 1, 44100);

  // Decode all audio buffers
  const buffers: { buffer: AudioBuffer; offsetSeconds: number }[] = [];
  let offset = 0;

  for (const scene of scenes) {
    const tts = ttsAudios.find(a => a.sceneNumber === scene.scene_number);
    if (tts) {
      const base64 = tts.dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const buffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
      buffers.push({ buffer, offsetSeconds: offset });
      offset += tts.durationInSeconds;
    } else {
      offset += scene.duration;
    }
  }

  const totalDuration = offset;
  const sampleRate = 44100;
  const totalSamples = Math.ceil(totalDuration * sampleRate);

  // Mix all audio into one buffer
  const mixedCtx = new OfflineAudioContext(1, totalSamples, sampleRate);

  for (const { buffer, offsetSeconds } of buffers) {
    const source = mixedCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(mixedCtx.destination);
    source.start(offsetSeconds);
  }

  const rendered = await mixedCtx.startRendering();
  return {
    pcmData: rendered.getChannelData(0),
    sampleRate,
  };
}

// ── Main render function ──

export async function renderVideoToMp4(
  scenes: Scene[],
  ttsAudios: TtsAudio[],
  onProgress: (progress: number) => void,
): Promise<Blob> {
  // Compute scene durations from TTS
  const sceneDurations = scenes.map((scene) => {
    const tts = ttsAudios.find(a => a.sceneNumber === scene.scene_number);
    return tts ? tts.durationInSeconds : scene.duration;
  });
  const totalDuration = sceneDurations.reduce((a, b) => a + b, 0);
  const totalFrames = Math.round(totalDuration * VIDEO_FPS);

  // Setup canvas
  const canvas = new OffscreenCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
  const ctx = canvas.getContext('2d')!;

  // Setup mp4 muxer
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
    },
    audio: {
      codec: 'aac',
      numberOfChannels: 1,
      sampleRate: 44100,
    },
    fastStart: 'in-memory',
  });

  // Video encoder
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('VideoEncoder error:', e),
  });

  videoEncoder.configure({
    codec: 'avc1.42E01E',
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    bitrate: 4_000_000,
    framerate: VIDEO_FPS,
  });

  // Audio encoder
  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => console.error('AudioEncoder error:', e),
  });

  audioEncoder.configure({
    codec: 'mp4a.40.2',
    numberOfChannels: 1,
    sampleRate: 44100,
    bitrate: 128000,
  });

  // Pre-load scene background images as ImageBitmap
  const sceneImageBitmaps = new Map<number, ImageBitmap>();
  for (const scene of scenes) {
    if (scene.backgroundImageUrl) {
      try {
        const response = await fetch(scene.backgroundImageUrl);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        sceneImageBitmaps.set(scene.scene_number, bitmap);
      } catch (err) {
        console.warn(`Failed to decode image for scene ${scene.scene_number}`, err);
      }
    }
  }

  // Decode and mix audio
  let audioData: Float32Array | null = null;
  if (ttsAudios.length > 0) {
    const decoded = await decodeTtsAudio(ttsAudios, scenes);
    audioData = decoded.pcmData;
  }

  // Render video frames
  let globalFrame = 0;
  for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
    const scene = scenes[sceneIdx];
    const sceneDurFrames = Math.round(sceneDurations[sceneIdx] * VIDEO_FPS);
    const bitmap = sceneImageBitmaps.get(scene.scene_number);

    for (let f = 0; f < sceneDurFrames; f++) {
      drawFrame(ctx, scene, f, sceneDurFrames, bitmap);

      const frame = new VideoFrame(canvas, {
        timestamp: (globalFrame / VIDEO_FPS) * 1_000_000, // microseconds
        duration: (1 / VIDEO_FPS) * 1_000_000,
      });

      const keyFrame = f === 0; // keyframe at scene start
      videoEncoder.encode(frame, { keyFrame });
      frame.close();

      globalFrame++;

      // Report progress (video is 70% of total)
      if (globalFrame % 10 === 0) {
        onProgress((globalFrame / totalFrames) * 0.7);
      }

      // Yield to prevent blocking
      if (globalFrame % 30 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  await videoEncoder.flush();
  onProgress(0.75);

  // Encode audio in chunks
  if (audioData) {
    const chunkSize = 1024;
    for (let i = 0; i < audioData.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, audioData.length);
      const chunk = audioData.slice(i, end);

      const audioDataObj = new AudioData({
        format: 'f32-planar',
        sampleRate: 44100,
        numberOfFrames: chunk.length,
        numberOfChannels: 1,
        timestamp: (i / 44100) * 1_000_000,
        data: chunk,
      });

      audioEncoder.encode(audioDataObj);
      audioDataObj.close();

      if (i % (chunkSize * 100) === 0) {
        onProgress(0.75 + (i / audioData.length) * 0.2);
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  await audioEncoder.flush();
  onProgress(0.95);

  // Finalize
  videoEncoder.close();
  audioEncoder.close();
  muxer.finalize();

  onProgress(1);

  return new Blob([target.buffer], { type: 'video/mp4' });
}

// ── Check browser support ──

export function isWebCodecsSupported(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined';
}
