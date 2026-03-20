import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Player } from '@remotion/player';
import { supabaseUrl } from '../lib/supabase';
import ArrowLeft from '../components/ArrowLeft';
import ShortFormVideo, { computeTotalFrames } from '../shortform/compositions/ShortFormVideo';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from '../shortform/constants';
import { renderVideoToMp4, isWebCodecsSupported } from '../shortform/renderVideo';
import type { Scene, ScriptResult, TtsAudio, BgmAudio } from '../shortform/types';
import { BGM_MOODS } from '../shortform/types';
import { generateCapcutZip } from '../capcut/generateCapcutProject';

// ── Types ──

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// ── Constants ──

const DURATIONS = [15, 30, 60] as const;

const PLATFORMS = [
  { id: 'reels', label: '릴스' },
  { id: 'shorts', label: '쇼츠' },
  { id: 'tiktok', label: '틱톡' },
] as const;

const VIDEO_TYPES = [
  { id: 'image', label: '이미지 기반', desc: 'AI 이미지 배경' },
  { id: 'motion', label: '모션 그래픽', desc: '텍스트 + 애니메이션' },
] as const;

const I2V_MODELS = [
  { id: 'kling', label: 'Kling 2.0', desc: '고품질 · ~$2.10/영상', cost: '$0.35/씬' },
  { id: 'minimax', label: 'Minimax Hailuo', desc: '가성비 · ~$0.70/영상', cost: '$0.12/씬' },
] as const;

type VideoType = 'image' | 'motion';
type I2vModel = typeof I2V_MODELS[number]['id'];
type Step = 'input' | 'review' | 'result';
type VideoPhase = 'tts' | 'bgm' | 'images' | 'videos' | 'preview' | 'rendering' | 'done';

// ── Design System Tokens ──

const C = {
  primary: '#48b2af',
  primaryDark: '#41a09e',
  primaryPressed: '#389998',
  primaryLight: '#f0f8f8',
  primaryTint: '#E4F7F7',
  surface: '#ffffff',
  surfaceDisabled: '#f8f8f8',
  surfaceSecondary: '#f9f9f9',
  surfaceTertiary: '#f3f3f3',
  surfaceInput: '#f3f3f5',
  borderDefault: '#e7e7e7',
  borderDivider: '#f3f3f3',
  textPrimary: '#151515',
  textBlack: '#000000',
  textSecondary: '#525252',
  textTertiary: '#6d6d6d',
  textCaption: '#848484',
  textDisabled: '#b7b7b7',
  textWhite: '#ffffff',
  destructive: '#d4183d',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

const font = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

// ── Main Page ──

export default function ShortFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('input');
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [duration, setDuration] = useState<number>(30);
  const [platform, setPlatform] = useState<string>('reels');
  const [videoType, setVideoType] = useState<VideoType>('image');
  const [i2vModel, setI2vModel] = useState<I2vModel>('kling');
  const [bgmMood, setBgmMood] = useState<string>('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat revision
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Video / TTS state
  const [videoPhase, setVideoPhase] = useState<VideoPhase>('tts');
  const [ttsAudios, setTtsAudios] = useState<TtsAudio[]>([]);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingCapcut, setIsExportingCapcut] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [videoGenProgress, setVideoGenProgress] = useState(0);
  const [bgmAudio, setBgmAudio] = useState<BgmAudio | null>(null);
  const [bgmLoading, setBgmLoading] = useState(false);
  const ttsAbortRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Helper: call edge function ──

  const callEdgeFunction = async (name: string, body: Record<string, unknown>) => {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `${name} 호출 실패`);
    return data;
  };

  // ── Step 1: Generate script ──

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setChatMessages([]);

    try {
      const data = await callEdgeFunction('generate-short-form', {
        topic: topic.trim(),
        duration,
        platform,
        videoType,
      });
      setResult(data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Step 2: Revise via chat ──

  const handleRevise = async () => {
    if (!chatInput.trim() || !result) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsRevising(true);
    setError(null);

    try {
      const currentScript = JSON.stringify(result, null, 2);
      const data = await callEdgeFunction('generate-short-form', {
        topic: `기존 대본:\n${currentScript}\n\n수정 요청: ${userMsg}\n\n위 대본을 수정 요청에 맞게 수정해줘. 전체 길이(${result.total_duration}초)와 씬 수는 유지.`,
        duration: result.total_duration,
        platform,
      });
      setResult(data);
      setChatMessages(prev => [...prev, { role: 'assistant', content: '대본을 수정했습니다. 확인해주세요!' }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '오류';
      setChatMessages(prev => [...prev, { role: 'assistant', content: `수정 실패: ${errMsg}` }]);
      setError(errMsg);
    } finally {
      setIsRevising(false);
    }
  };

  // ── Step 3: TTS Generation ──

  const generateAllTts = useCallback(async (scenes: Scene[]) => {
    setVideoPhase('tts');
    setTtsAudios([]);
    setTtsProgress(0);
    setError(null);
    ttsAbortRef.current = false;

    const audios: TtsAudio[] = [];

    for (let i = 0; i < scenes.length; i++) {
      if (ttsAbortRef.current) return;
      const scene = scenes[i];

      try {
        const data = await callEdgeFunction('generate-tts', {
          text: scene.narration,
          voice: 'nova',
          speed: 1.0,
        });

        // Decode audio to get actual duration
        const base64 = data.audio.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);

        const audioCtx = new AudioContext();
        const buffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        await audioCtx.close();

        audios.push({
          sceneNumber: scene.scene_number,
          dataUrl: data.audio,
          durationInSeconds: buffer.duration,
        });

        setTtsAudios([...audios]);
        setTtsProgress((i + 1) / scenes.length);
      } catch (err) {
        setError(`씬 ${scene.scene_number} TTS 실패: ${err instanceof Error ? err.message : '오류'}`);
        return;
      }
    }

    // BGM 선택했으면 BGM 단계로, 아니면 이미지/미리보기로
    if (bgmMood !== 'none') {
      setVideoPhase('bgm');
    } else {
      setVideoPhase(videoType === 'image' ? 'images' : 'preview');
    }
  }, [videoType, bgmMood]);

  // Auto-start TTS when entering Step 3
  useEffect(() => {
    if (step === 'result' && result && videoPhase === 'tts' && ttsAudios.length === 0) {
      generateAllTts(result.scenes);
    }
  }, [step, result, videoPhase, ttsAudios.length, generateAllTts]);

  // ── Step 3-A+: BGM Generation ──

  const generateBgm = useCallback(async (mood: string, targetDuration: number) => {
    setBgmLoading(true);
    setError(null);

    try {
      const data = await callEdgeFunction('generate-bgm', {
        mood,
        duration: targetDuration,
      });

      if (data.audio && data.track) {
        // Decode to get actual duration
        const base64 = data.audio.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);

        const audioCtx = new AudioContext();
        const buffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        await audioCtx.close();

        setBgmAudio({
          dataUrl: data.audio,
          durationInSeconds: buffer.duration,
          track: data.track,
        });
      }
    } catch (err) {
      console.warn('BGM 생성 실패 (무시하고 계속):', err);
      // BGM 실패해도 영상 제작은 계속 진행
    } finally {
      setBgmLoading(false);
      setVideoPhase(videoType === 'image' ? 'images' : 'preview');
    }
  }, [videoType]);

  // Auto-start BGM generation
  useEffect(() => {
    if (step === 'result' && result && videoPhase === 'bgm' && !bgmLoading && !bgmAudio) {
      generateBgm(bgmMood, result.total_duration);
    }
  }, [step, result, videoPhase, bgmLoading, bgmAudio, bgmMood, generateBgm]);

  // ── Step 3-A2: Generate scene background images ──

  const generateSceneImages = useCallback(async (scenes: Scene[]) => {
    setImageProgress(0);
    setError(null);

    const updatedScenes = [...scenes];

    // 2개씩 병렬 처리 (429 방지)
    for (let i = 0; i < scenes.length; i += 2) {
      if (ttsAbortRef.current) return;
      const batch = scenes.slice(i, Math.min(i + 2, scenes.length));

      const results = await Promise.allSettled(
        batch.map(async (scene) => {
          const data = await callEdgeFunction('generate-card-image', {
            slide_context: {
              headline: scene.subtitle.replace(/\*\*/g, ''),
              body: scene.narration,
              type: scene.type === 'hook' ? 'cover' : scene.type === 'cta' ? 'cta' : 'content',
              topic: topic,
            },
            aspect_ratio: '9:16',
          });
          return { sceneNumber: scene.scene_number, image: data.image, mimeType: data.mimeType };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.image) {
          const { sceneNumber, image, mimeType } = r.value;
          const dataUrl = `data:${mimeType || 'image/png'};base64,${image}`;
          const idx = updatedScenes.findIndex(s => s.scene_number === sceneNumber);
          if (idx >= 0) updatedScenes[idx] = { ...updatedScenes[idx], backgroundImageUrl: dataUrl };
        }
      }

      setImageProgress(Math.min(i + batch.length, scenes.length) / scenes.length);
    }

    setResult(prev => prev ? { ...prev, scenes: updatedScenes } : prev);
    setVideoPhase('videos');
  }, [topic]);

  // Auto-start image generation
  useEffect(() => {
    if (step === 'result' && result && videoPhase === 'images') {
      generateSceneImages(result.scenes);
    }
  }, [step, result, videoPhase, generateSceneImages]);

  // ── Step 3-A3: Generate scene background videos (fal.ai Image-to-Video) ──

  const generateSceneVideos = useCallback(async (scenes: Scene[]) => {
    setVideoGenProgress(0);
    setError(null);

    const scenesWithImages = scenes.filter(s => s.backgroundImageUrl);
    if (scenesWithImages.length === 0) {
      setVideoPhase('preview');
      return;
    }

    // 1. Submit all scenes to fal.ai queue (2개씩 배치)
    const submissions: { sceneNumber: number; requestId: string }[] = [];

    for (let i = 0; i < scenesWithImages.length; i += 2) {
      if (ttsAbortRef.current) return;
      const batch = scenesWithImages.slice(i, Math.min(i + 2, scenesWithImages.length));

      const results = await Promise.allSettled(
        batch.map(async (scene) => {
          const data = await callEdgeFunction('generate-scene-video', {
            action: 'submit',
            model: i2vModel,
            image_data_url: scene.backgroundImageUrl,
            prompt: `Subtle cinematic motion with gentle zoom and smooth camera drift. Scene: ${scene.visual}`,
          });
          return { sceneNumber: scene.scene_number, requestId: data.request_id as string };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.requestId) {
          submissions.push(r.value);
        }
      }

      // 배치 간 1초 딜레이 (rate limit 방지)
      if (i + 2 < scenesWithImages.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (submissions.length === 0) {
      setVideoPhase('preview');
      return;
    }

    // 2. Poll all in parallel until all complete (최대 5분)
    const completed = new Set<number>();
    const updatedScenes = [...scenes];

    for (let attempt = 0; attempt < 60; attempt++) {
      if (ttsAbortRef.current) return;
      if (completed.size >= submissions.length) break;

      await new Promise(r => setTimeout(r, 5000)); // 5초 간격 폴링

      for (const sub of submissions) {
        if (completed.has(sub.sceneNumber)) continue;

        try {
          const data = await callEdgeFunction('generate-scene-video', {
            action: 'poll',
            model: i2vModel,
            request_id: sub.requestId,
          });

          if (data.status === 'COMPLETED' && data.video_url) {
            completed.add(sub.sceneNumber);
            const idx = updatedScenes.findIndex(s => s.scene_number === sub.sceneNumber);
            if (idx >= 0) {
              updatedScenes[idx] = { ...updatedScenes[idx], backgroundVideoUrl: data.video_url as string };
            }
            setVideoGenProgress(completed.size / submissions.length);
          }

          if (data.status === 'FAILED') {
            completed.add(sub.sceneNumber); // 실패한 씬은 이미지 배경으로 폴백
            setVideoGenProgress(completed.size / submissions.length);
          }
        } catch (err) {
          console.warn(`Poll failed for scene ${sub.sceneNumber}:`, err);
        }
      }
    }

    setResult(prev => prev ? { ...prev, scenes: updatedScenes } : prev);
    setVideoPhase('preview');
  }, [i2vModel]);

  // Auto-start video generation
  useEffect(() => {
    if (step === 'result' && result && videoPhase === 'videos') {
      generateSceneVideos(result.scenes);
    }
  }, [step, result, videoPhase, generateSceneVideos]);

  // ── Step 3: Render video ──

  const handleRenderVideo = async () => {
    if (!result) return;
    setVideoPhase('rendering');
    setRenderProgress(0);
    setError(null);

    try {
      const blob = await renderVideoToMp4(result.scenes, ttsAudios, (p) => setRenderProgress(p), bgmAudio);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setVideoPhase('done');
    } catch (err) {
      setError(`영상 렌더링 실패: ${err instanceof Error ? err.message : '오류'}`);
      setVideoPhase('preview');
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl || !result) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${result.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().slice(0, 30) || 'short-form'}.mp4`;
    a.click();
  };

  // ── Build text for download/copy ──

  const buildScriptText = (): string => {
    if (!result) return '';
    const lines: string[] = [];
    lines.push(`제목: ${result.title}`);
    lines.push(`후킹: ${result.hook}`);
    lines.push(`총 길이: ${result.total_duration}초`);
    lines.push('');
    lines.push('─── 씬 대본 ───');
    lines.push('');
    for (const scene of result.scenes) {
      lines.push(`[씬 ${scene.scene_number}] ${scene.type} (${scene.duration}초)`);
      lines.push(`나레이션: ${scene.narration}`);
      lines.push(`자막: ${scene.subtitle}`);
      lines.push(`비주얼: ${scene.visual}`);
      lines.push(`전환: ${scene.transition}`);
      lines.push('');
    }
    lines.push(`해시태그: ${result.hashtags.map(h => `#${h}`).join(' ')}`);
    lines.push(`BGM 분위기: ${result.bgm_mood}`);
    lines.push(`썸네일 텍스트: ${result.thumbnail_text}`);
    return lines.join('\n');
  };

  const handleDownloadTxt = () => {
    const text = buildScriptText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${result?.title?.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().slice(0, 30) || 'short-form'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleCopy = async () => {
    const text = buildScriptText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다');
    }
  };

  const handleExportCapcut = async () => {
    if (!result || ttsAudios.length === 0) return;
    setIsExportingCapcut(true);
    setError(null);
    try {
      const blob = await generateCapcutZip(result, result.scenes, ttsAudios);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().slice(0, 30) || 'capcut-project'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`CapCut 내보내기 실패: ${err instanceof Error ? err.message : '오류'}`);
    } finally {
      setIsExportingCapcut(false);
    }
  };

  const resetAll = () => {
    ttsAbortRef.current = true;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setStep('input');
    setTopic('');
    setDuration(30);
    setPlatform('reels');
    setVideoType('image');
    setResult(null);
    setError(null);
    setChatMessages([]);
    setChatInput('');
    setCopied(false);
    setVideoPhase('tts');
    setTtsAudios([]);
    setTtsProgress(0);
    setRenderProgress(0);
    setImageProgress(0);
    setVideoGenProgress(0);
    setVideoUrl(null);
    setBgmAudio(null);
    setBgmLoading(false);
  };

  const goToResult = () => {
    setVideoPhase('tts');
    setTtsAudios([]);
    setTtsProgress(0);
    setRenderProgress(0);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setBgmAudio(null);
    setBgmLoading(false);
    setStep('result');
  };

  // ── CTA Button helper ──
  const ctaButton = (label: string, onClick: () => void, disabled: boolean) => {
    const bg = disabled ? C.surfaceDisabled : C.primary;
    const color = disabled ? C.textDisabled : C.textWhite;
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center justify-center"
        style={{
          height: '56px', borderRadius: '16px', backgroundColor: bg,
          border: 'none', transition: 'all 0.15s ease', cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.99)'; }}
        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
      >
        <span style={{
          fontFamily: font, fontSize: '16px', fontWeight: 500,
          lineHeight: '25px', letterSpacing: '-0.32px', color,
        }}>
          {label}
        </span>
      </button>
    );
  };

  // ── Helper: format seconds ──
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`;
  };

  // ── Compute cumulative time for timeline ──
  const getCumulativeTime = (scenes: Scene[], index: number) => {
    let t = 0;
    for (let i = 0; i < index; i++) t += scenes[i].duration;
    return t;
  };

  // ── Render ──

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative pb-[140px]" style={{ fontFamily: font }}>

        {/* ── NavigationHeader ── */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20 fixed top-0 left-1/2 -translate-x-1/2 max-w-[440px]">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={() => navigate(-1)} />
              <p style={{
                fontFamily: font, fontSize: '18px', fontWeight: 600,
                lineHeight: '25.5px', letterSpacing: '-0.36px',
                color: C.textBlack, textAlign: 'center',
              }}>
                {step === 'input' ? 'AI 숏폼 메이커' : step === 'review' ? '대본 검토' : '영상 제작'}
              </p>
              <div className="w-[44px]" />
            </div>
          </div>
        </div>

        {/* 헤더 높이 여백 */}
        <div className="h-[60px]" />

        {/* ── Main Content ── */}
        <div style={{ padding: '0 20px' }}>

          {/* ════ STEP 1: Input ════ */}
          {step === 'input' && (
            <>
              {/* Title */}
              <div style={{ marginBottom: '28px', marginTop: '8px' }}>
                <h1 style={{
                  fontFamily: font, fontSize: '22px', fontWeight: 600,
                  lineHeight: '32.5px', letterSpacing: '-0.22px',
                  color: C.textPrimary, margin: 0,
                }}>
                  AI 숏폼 메이커
                </h1>
                <p style={{
                  fontFamily: font, fontSize: '15px', fontWeight: 400,
                  lineHeight: '20px', letterSpacing: '-0.45px',
                  color: C.textTertiary, marginTop: '8px',
                }}>
                  주제를 입력하면 AI가 대본 + 나레이션 + 영상을 만들어줘요
                </p>
              </div>

              {/* Topic */}
              <section style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '8px',
                }}>
                  주제
                </label>
                <div
                  className="w-full"
                  style={{
                    backgroundColor: C.surface, border: `1px solid ${C.borderDefault}`,
                    borderRadius: '16px', padding: '12px',
                  }}
                >
                  <textarea
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="예: 직장인이 퇴근 후 월 100만원 버는 부업 3가지"
                    rows={4}
                    className="w-full outline-none bg-transparent resize-none"
                    style={{
                      fontFamily: font, fontSize: '15px', fontWeight: 400,
                      lineHeight: '20px', letterSpacing: '-0.45px',
                      color: C.textPrimary, border: 'none',
                    }}
                  />
                </div>
              </section>

              {/* Duration */}
              <section style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '10px',
                }}>
                  영상 길이
                </label>
                <div className="flex" style={{ gap: '10px' }}>
                  {DURATIONS.map(d => {
                    const isSelected = duration === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className="flex-1 flex items-center justify-center"
                        style={{
                          height: '48px', borderRadius: '16px',
                          fontFamily: font, fontSize: '15px', fontWeight: isSelected ? 600 : 400,
                          letterSpacing: '-0.3px',
                          color: isSelected ? C.textWhite : C.textTertiary,
                          backgroundColor: isSelected ? C.primary : C.surface,
                          border: isSelected ? 'none' : `1px solid ${C.borderDefault}`,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        {d}초
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Platform */}
              <section style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '10px',
                }}>
                  플랫폼
                </label>
                <div className="flex" style={{ gap: '10px' }}>
                  {PLATFORMS.map(p => {
                    const isSelected = platform === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className="flex-1 flex items-center justify-center"
                        style={{
                          height: '48px', borderRadius: '16px',
                          fontFamily: font, fontSize: '15px', fontWeight: isSelected ? 600 : 400,
                          letterSpacing: '-0.3px',
                          color: isSelected ? C.textWhite : C.textTertiary,
                          backgroundColor: isSelected ? C.primary : C.surface,
                          border: isSelected ? 'none' : `1px solid ${C.borderDefault}`,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Video Type */}
              <section style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '10px',
                }}>
                  영상 타입
                </label>
                <div className="flex" style={{ gap: '10px' }}>
                  {VIDEO_TYPES.map(vt => {
                    const isSelected = videoType === vt.id;
                    return (
                      <button
                        key={vt.id}
                        onClick={() => setVideoType(vt.id)}
                        className="flex-1 flex flex-col items-center justify-center"
                        style={{
                          height: '64px', borderRadius: '16px',
                          fontFamily: font,
                          backgroundColor: isSelected ? C.primary : C.surface,
                          border: isSelected ? 'none' : `1px solid ${C.borderDefault}`,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          gap: '2px',
                        }}
                        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        <span style={{
                          fontSize: '15px', fontWeight: isSelected ? 600 : 400,
                          letterSpacing: '-0.3px',
                          color: isSelected ? C.textWhite : C.textTertiary,
                        }}>
                          {vt.label}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: 400,
                          color: isSelected ? 'rgba(255,255,255,0.7)' : C.textCaption,
                        }}>
                          {vt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* I2V Model (이미지 기반일 때만) */}
              {videoType === 'image' && (
                <section style={{ marginBottom: '32px' }}>
                  <label style={{
                    display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                    lineHeight: '16px', letterSpacing: '-0.24px',
                    color: C.textCaption, marginBottom: '10px',
                  }}>
                    영상 배경 AI 모델
                  </label>
                  <div className="flex" style={{ gap: '10px' }}>
                    {I2V_MODELS.map(m => {
                      const isSelected = i2vModel === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setI2vModel(m.id)}
                          className="flex-1 flex flex-col items-center justify-center"
                          style={{
                            height: '72px', borderRadius: '16px',
                            fontFamily: font,
                            backgroundColor: isSelected ? C.primary : C.surface,
                            border: isSelected ? 'none' : `1px solid ${C.borderDefault}`,
                            cursor: 'pointer', transition: 'all 0.15s ease',
                            gap: '2px',
                          }}
                          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                          onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                          onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                        >
                          <span style={{
                            fontSize: '14px', fontWeight: isSelected ? 600 : 400,
                            letterSpacing: '-0.3px',
                            color: isSelected ? C.textWhite : C.textPrimary,
                          }}>
                            {m.label}
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: 400,
                            color: isSelected ? 'rgba(255,255,255,0.7)' : C.textCaption,
                          }}>
                            {m.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    color: C.textCaption, marginTop: '6px', paddingLeft: '4px',
                  }}>
                    fal.ai Image-to-Video · 씬별 5초 AI 영상 배경 생성
                  </p>
                </section>
              )}

              {/* BGM */}
              <section style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '10px',
                }}>
                  배경음악 (BGM)
                </label>
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: C.surface,
                    border: `1px solid ${C.borderDefault}`,
                    borderRadius: '16px',
                  }}
                >
                  <select
                    value={bgmMood}
                    onChange={e => setBgmMood(e.target.value)}
                    className="w-full"
                    style={{
                      height: '48px', padding: '0 16px',
                      borderRadius: '16px', border: 'none', outline: 'none',
                      backgroundColor: 'transparent',
                      fontFamily: font, fontSize: '15px', fontWeight: 400,
                      letterSpacing: '-0.3px', color: C.textPrimary,
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                    }}
                  >
                    {BGM_MOODS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  {/* 드롭다운 화살표 */}
                  <div style={{
                    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', color: C.textCaption,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                {bgmMood !== 'none' && (
                  <p style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    color: C.textCaption, marginTop: '6px', paddingLeft: '4px',
                  }}>
                    Jamendo 로열티 프리 음원 (CC 라이선스)
                  </p>
                )}
              </section>

              {/* Generate CTA */}
              {ctaButton(
                isGenerating ? '대본 생성 중...' : '대본 생성하기',
                handleGenerate,
                !topic.trim() || isGenerating,
              )}
            </>
          )}

          {/* ════ STEP 2: Script Review ════ */}
          {step === 'review' && result && (
            <>
              {/* Title + Hook Card */}
              <div style={{
                padding: '16px 20px', backgroundColor: C.primaryLight, borderRadius: '16px',
                marginBottom: '20px', marginTop: '8px',
              }}>
                <div style={{
                  fontFamily: font, fontSize: '16px', fontWeight: 600,
                  lineHeight: '25px', letterSpacing: '-0.32px', color: C.primaryDark,
                }}>
                  {result.title}
                </div>
                <div style={{
                  fontFamily: font, fontSize: '13px', fontWeight: 400,
                  lineHeight: '20px', color: C.textTertiary, marginTop: '6px',
                }}>
                  {result.hook}
                </div>
                <div style={{
                  fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', color: C.textCaption, marginTop: '8px',
                }}>
                  {result.total_duration}초 · {result.scenes.length}씬
                </div>
              </div>

              {/* Scene Timeline */}
              <div className="flex flex-col" style={{ gap: '8px', marginBottom: '16px' }}>
                {result.scenes.map((scene, idx) => {
                  const startTime = getCumulativeTime(result.scenes, idx);
                  return (
                    <div
                      key={scene.scene_number}
                      className="flex items-start"
                      style={{
                        padding: '14px 16px', backgroundColor: C.surfaceSecondary,
                        borderRadius: '16px', border: `1px solid ${C.borderDivider}`,
                        gap: '12px',
                      }}
                    >
                      <div className="flex flex-col items-center shrink-0" style={{ gap: '4px' }}>
                        <div className="flex items-center justify-center" style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          backgroundColor: scene.type === 'hook' ? C.primary : scene.type === 'cta' ? C.primaryDark : C.surfaceTertiary,
                          color: scene.type === 'hook' || scene.type === 'cta' ? C.textWhite : C.textTertiary,
                          fontFamily: font, fontSize: '12px', fontWeight: 700,
                        }}>
                          {scene.scene_number}
                        </div>
                        <span style={{
                          fontFamily: font, fontSize: '10px', fontWeight: 500,
                          color: C.textCaption,
                        }}>
                          {formatTime(startTime)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center" style={{ gap: '6px', marginBottom: '4px' }}>
                          <span style={{
                            fontFamily: font, fontSize: '10px', fontWeight: 600,
                            textTransform: 'uppercase' as const, padding: '1px 4px', borderRadius: '4px',
                            backgroundColor: scene.type === 'hook' ? C.primaryTint : scene.type === 'cta' ? C.primaryLight : C.surfaceTertiary,
                            color: scene.type === 'hook' ? C.primary : scene.type === 'cta' ? C.primaryDark : C.textCaption,
                          }}>
                            {scene.type}
                          </span>
                          <span style={{
                            fontFamily: font, fontSize: '10px', fontWeight: 400,
                            color: C.textCaption,
                          }}>
                            {scene.duration}초 · {scene.transition}
                          </span>
                        </div>
                        <div style={{
                          fontFamily: font, fontSize: '14px', fontWeight: 500,
                          lineHeight: '20px', letterSpacing: '-0.45px', color: C.textPrimary,
                          marginBottom: '6px',
                        }}>
                          {scene.narration}
                        </div>
                        <div style={{
                          fontFamily: font, fontSize: '12px', fontWeight: 600,
                          lineHeight: '18px', color: C.primaryDark, marginBottom: '4px',
                        }}>
                          자막: {scene.subtitle}
                        </div>
                        <div style={{
                          fontFamily: font, fontSize: '12px', fontWeight: 400,
                          lineHeight: '18px', color: C.textCaption,
                        }}>
                          비주얼: {scene.visual}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Meta Info */}
              <div style={{
                padding: '14px 16px', backgroundColor: C.surfaceTertiary,
                borderRadius: '16px', marginBottom: '20px',
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{
                    fontFamily: font, fontSize: '11px', fontWeight: 600,
                    color: C.textCaption, textTransform: 'uppercase' as const,
                  }}>해시태그</span>
                  <div style={{
                    fontFamily: font, fontSize: '13px', fontWeight: 400,
                    lineHeight: '20px', color: C.primary, marginTop: '4px',
                    wordBreak: 'break-all',
                  }}>
                    {result.hashtags.map(h => `#${h}`).join(' ')}
                  </div>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{
                    fontFamily: font, fontSize: '11px', fontWeight: 600,
                    color: C.textCaption, textTransform: 'uppercase' as const,
                  }}>BGM 분위기</span>
                  <div style={{
                    fontFamily: font, fontSize: '13px', fontWeight: 400,
                    lineHeight: '20px', color: C.textSecondary, marginTop: '4px',
                  }}>
                    {result.bgm_mood}
                  </div>
                </div>
                <div>
                  <span style={{
                    fontFamily: font, fontSize: '11px', fontWeight: 600,
                    color: C.textCaption, textTransform: 'uppercase' as const,
                  }}>썸네일 텍스트</span>
                  <div style={{
                    fontFamily: font, fontSize: '13px', fontWeight: 600,
                    lineHeight: '20px', color: C.textPrimary, marginTop: '4px',
                  }}>
                    {result.thumbnail_text}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div style={{
                  backgroundColor: C.surfaceTertiary, borderRadius: '16px',
                  padding: '16px', marginBottom: '16px', maxHeight: '200px', overflow: 'auto',
                }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="flex flex-col" style={{
                      marginBottom: i < chatMessages.length - 1 ? '12px' : 0,
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        padding: '8px 12px', borderRadius: '12px',
                        fontFamily: font, fontSize: '13px', fontWeight: 400,
                        lineHeight: '20px', maxWidth: '85%',
                        backgroundColor: msg.role === 'user' ? C.primary : C.surface,
                        color: msg.role === 'user' ? C.textWhite : C.textPrimary,
                        border: msg.role === 'assistant' ? `1px solid ${C.borderDefault}` : 'none',
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Revision Input */}
              <div className="flex" style={{ gap: '8px', marginBottom: '20px' }}>
                <div className="flex-1 flex items-center" style={{
                  height: '48px', backgroundColor: C.surface,
                  border: `1px solid ${C.borderDefault}`, borderRadius: '16px', padding: '0 12px',
                }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRevise(); } }}
                    placeholder="수정 요청을 입력하세요"
                    disabled={isRevising}
                    className="w-full outline-none bg-transparent"
                    style={{
                      fontFamily: font, fontSize: '15px', fontWeight: 400,
                      lineHeight: '20px', letterSpacing: '-0.45px', color: C.textPrimary,
                    }}
                  />
                </div>
                <button
                  onClick={handleRevise}
                  disabled={!chatInput.trim() || isRevising}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    height: '48px', padding: '0 16px', borderRadius: '16px',
                    fontFamily: font, fontSize: '15px', fontWeight: 500,
                    letterSpacing: '-0.45px',
                    backgroundColor: !chatInput.trim() || isRevising ? C.surfaceDisabled : C.primary,
                    color: !chatInput.trim() || isRevising ? C.textDisabled : C.textWhite,
                    border: 'none', cursor: !chatInput.trim() || isRevising ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onPointerDown={e => { if (chatInput.trim() && !isRevising) e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  {isRevising ? '수정 중...' : '수정'}
                </button>
              </div>

              {/* Proceed & Back */}
              <div className="flex" style={{ gap: '10px' }}>
                <button
                  onClick={() => { setStep('input'); setResult(null); }}
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    height: '56px', width: '80px', borderRadius: '16px',
                    backgroundColor: C.primaryLight, border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <span style={{
                    fontFamily: font, fontSize: '13px', fontWeight: 500,
                    color: C.primary,
                  }}>처음으로</span>
                </button>
                <button
                  onClick={goToResult}
                  className="flex-1 flex items-center justify-center"
                  style={{
                    height: '56px', borderRadius: '16px',
                    backgroundColor: C.primary, border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <span style={{
                    fontFamily: font, fontSize: '16px', fontWeight: 500,
                    lineHeight: '25px', letterSpacing: '-0.32px', color: C.textWhite,
                  }}>영상 만들기</span>
                </button>
              </div>
            </>
          )}

          {/* ════ STEP 3: Video Production ════ */}
          {step === 'result' && result && (
            <>
              {/* Header */}
              <div style={{ marginTop: '8px', marginBottom: '20px' }}>
                <h2 style={{
                  fontFamily: font, fontSize: '18px', fontWeight: 600,
                  lineHeight: '26px', letterSpacing: '-0.36px',
                  color: C.textPrimary, margin: 0, marginBottom: '4px',
                }}>
                  {result.title}
                </h2>
                <p style={{
                  fontFamily: font, fontSize: '14px', fontWeight: 400,
                  lineHeight: '20px', color: C.textTertiary,
                }}>
                  {result.total_duration}초 · {result.scenes.length}씬 · {PLATFORMS.find(p => p.id === platform)?.label}
                </p>
              </div>

              {/* ── Phase A: TTS Generation ── */}
              {videoPhase === 'tts' && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    padding: '24px 20px', backgroundColor: C.surfaceSecondary,
                    borderRadius: '16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, margin: '0 auto 16px',
                      border: `3px solid ${C.borderDefault}`,
                      borderTop: `3px solid ${C.primary}`,
                      borderRadius: '50%', animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 600,
                      color: C.textPrimary, marginBottom: '8px',
                    }}>
                      나레이션 음성 생성 중...
                    </div>
                    <div style={{
                      fontFamily: font, fontSize: '14px', fontWeight: 400,
                      color: C.textCaption, marginBottom: '16px',
                    }}>
                      {ttsAudios.length} / {result.scenes.length} 씬
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      height: '6px', backgroundColor: C.surfaceTertiary,
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', backgroundColor: C.primary,
                        width: `${ttsProgress * 100}%`, transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Phase A+: BGM Generation ── */}
              {videoPhase === 'bgm' && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    padding: '24px 20px', backgroundColor: C.surfaceSecondary,
                    borderRadius: '16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, margin: '0 auto 16px',
                      border: `3px solid ${C.borderDefault}`,
                      borderTop: `3px solid ${C.primary}`,
                      borderRadius: '50%', animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 600,
                      color: C.textPrimary, marginBottom: '8px',
                    }}>
                      배경음악 검색 중...
                    </div>
                    <div style={{
                      fontFamily: font, fontSize: '14px', fontWeight: 400,
                      color: C.textCaption,
                    }}>
                      {bgmMood} 분위기의 BGM
                    </div>
                  </div>
                </div>
              )}

              {/* ── Phase A-2: Image Generation ── */}
              {videoPhase === 'images' && result && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    padding: '24px 20px', backgroundColor: C.surfaceSecondary,
                    borderRadius: '16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, margin: '0 auto 16px',
                      border: `3px solid ${C.borderDefault}`,
                      borderTop: `3px solid ${C.primary}`,
                      borderRadius: '50%', animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 600,
                      color: C.textPrimary, marginBottom: '8px',
                    }}>
                      AI 배경 이미지 생성 중...
                    </div>
                    <div style={{
                      fontFamily: font, fontSize: '14px', fontWeight: 400,
                      color: C.textCaption, marginBottom: '16px',
                    }}>
                      {Math.round(imageProgress * result.scenes.length)} / {result.scenes.length} 씬
                    </div>
                    <div style={{
                      height: '6px', backgroundColor: C.surfaceTertiary,
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', backgroundColor: C.primary,
                        width: `${imageProgress * 100}%`, transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Phase A-3: Video Generation (fal.ai I2V) ── */}
              {videoPhase === 'videos' && result && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    padding: '24px 20px', backgroundColor: C.surfaceSecondary,
                    borderRadius: '16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, margin: '0 auto 16px',
                      border: `3px solid ${C.borderDefault}`,
                      borderTop: `3px solid ${C.primary}`,
                      borderRadius: '50%', animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 600,
                      color: C.textPrimary, marginBottom: '8px',
                    }}>
                      AI 영상 배경 생성 중...
                    </div>
                    <div style={{
                      fontFamily: font, fontSize: '14px', fontWeight: 400,
                      color: C.textCaption, marginBottom: '8px',
                    }}>
                      {Math.round(videoGenProgress * result.scenes.length)} / {result.scenes.length} 씬
                    </div>
                    <div style={{
                      fontFamily: font, fontSize: '12px', fontWeight: 400,
                      color: C.textCaption, marginBottom: '16px',
                    }}>
                      씬당 1~2분 소요 · {I2V_MODELS.find(m => m.id === i2vModel)?.label || 'Kling'}
                    </div>
                    <div style={{
                      height: '6px', backgroundColor: C.surfaceTertiary,
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', backgroundColor: C.primary,
                        width: `${videoGenProgress * 100}%`, transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Phase B: Preview ── */}
              {videoPhase === 'preview' && ttsAudios.length > 0 && (
                <>
                  {/* Remotion Player */}
                  <div className="flex justify-center" style={{ marginBottom: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '280px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.borderDefault}` }} className="transform-gpu">
                      <Player
                        component={ShortFormVideo}
                        inputProps={{ scenes: result.scenes, ttsAudios, bgmAudio }}
                        durationInFrames={Math.max(1, computeTotalFrames(result.scenes, ttsAudios))}
                        fps={VIDEO_FPS}
                        compositionWidth={VIDEO_WIDTH}
                        compositionHeight={VIDEO_HEIGHT}
                        style={{ width: '100%' }}
                        controls
                        autoPlay={false}
                      />
                    </div>
                  </div>

                  {/* BGM Track Info */}
                  {bgmAudio && (
                    <div style={{
                      padding: '12px 16px', backgroundColor: C.primaryLight,
                      borderRadius: '12px', marginBottom: '16px',
                    }}>
                      <div style={{
                        fontFamily: font, fontSize: '12px', fontWeight: 600,
                        color: C.primary, marginBottom: '4px',
                      }}>
                        BGM
                      </div>
                      <div style={{
                        fontFamily: font, fontSize: '13px', fontWeight: 400,
                        color: C.textSecondary,
                      }}>
                        {bgmAudio.track.name} — {bgmAudio.track.artist}
                      </div>
                      <div style={{
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        color: C.textCaption, marginTop: '2px',
                      }}>
                        CC License · Jamendo
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col" style={{ gap: '10px' }}>
                    {isWebCodecsSupported() ? (
                      ctaButton('MP4 영상 다운로드', handleRenderVideo, false)
                    ) : (
                      <div style={{
                        padding: '14px 18px', backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA', borderRadius: '16px',
                        fontFamily: font, fontSize: '14px', color: C.destructive,
                      }}>
                        이 브라우저는 영상 렌더링을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.
                      </div>
                    )}

                    <div className="flex" style={{ gap: '8px' }}>
                      <button
                        onClick={handleDownloadTxt}
                        className="flex-1 flex items-center justify-center"
                        style={{
                          height: '48px', borderRadius: '16px',
                          backgroundColor: C.primaryLight, border: 'none', cursor: 'pointer',
                        }}
                        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        <span style={{
                          fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primary,
                        }}>대본 (.txt)</span>
                      </button>
                      <button
                        onClick={handleExportCapcut}
                        disabled={isExportingCapcut}
                        className="flex-1 flex items-center justify-center"
                        style={{
                          height: '48px', borderRadius: '16px',
                          backgroundColor: isExportingCapcut ? C.surfaceDisabled : '#1a1a2e',
                          border: 'none',
                          cursor: isExportingCapcut ? 'not-allowed' : 'pointer',
                        }}
                        onPointerDown={e => { if (!isExportingCapcut) e.currentTarget.style.transform = 'scale(0.99)'; }}
                        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        <span style={{
                          fontFamily: font, fontSize: '13px', fontWeight: 500,
                          color: isExportingCapcut ? C.textDisabled : C.textWhite,
                        }}>{isExportingCapcut ? '내보내는 중...' : 'CapCut 내보내기'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Phase C: Rendering ── */}
              {videoPhase === 'rendering' && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    padding: '24px 20px', backgroundColor: C.surfaceSecondary,
                    borderRadius: '16px', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 48, height: 48, margin: '0 auto 16px',
                      border: `3px solid ${C.borderDefault}`,
                      borderTop: `3px solid ${C.primary}`,
                      borderRadius: '50%', animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 600,
                      color: C.textPrimary, marginBottom: '8px',
                    }}>
                      영상 렌더링 중...
                    </div>
                    <div style={{
                      fontFamily: font, fontSize: '14px', fontWeight: 400,
                      color: C.textCaption, marginBottom: '16px',
                    }}>
                      {Math.round(renderProgress * 100)}%
                    </div>
                    <div style={{
                      height: '6px', backgroundColor: C.surfaceTertiary,
                      borderRadius: '3px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', backgroundColor: C.primary,
                        width: `${renderProgress * 100}%`, transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Phase D: Done ── */}
              {videoPhase === 'done' && videoUrl && (
                <>
                  {/* Video player */}
                  <div className="flex justify-center" style={{ marginBottom: '20px' }}>
                    <video
                      src={videoUrl}
                      controls
                      style={{
                        width: '100%', maxWidth: '280px',
                        borderRadius: '16px', border: `1px solid ${C.borderDefault}`,
                      }}
                      className="transform-gpu"
                    />
                  </div>

                  {/* Download buttons */}
                  <div className="flex flex-col" style={{ gap: '10px' }}>
                    {ctaButton('MP4 다운로드', handleDownloadVideo, false)}

                    <div className="flex" style={{ gap: '8px' }}>
                      <button
                        onClick={handleDownloadTxt}
                        className="flex-1 flex items-center justify-center"
                        style={{
                          height: '48px', borderRadius: '16px',
                          backgroundColor: C.primaryLight, border: 'none', cursor: 'pointer',
                        }}
                        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        <span style={{
                          fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primary,
                        }}>대본 (.txt)</span>
                      </button>
                      <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center"
                        style={{
                          height: '48px', borderRadius: '16px',
                          backgroundColor: C.primaryLight, border: 'none', cursor: 'pointer',
                        }}
                        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                        onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                        onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                      >
                        <span style={{
                          fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primary,
                        }}>{copied ? '복사 완료!' : '클립보드 복사'}</span>
                      </button>
                    </div>

                    <button
                      onClick={handleExportCapcut}
                      disabled={isExportingCapcut}
                      className="w-full flex items-center justify-center"
                      style={{
                        height: '48px', borderRadius: '16px',
                        backgroundColor: isExportingCapcut ? C.surfaceDisabled : '#1a1a2e',
                        border: 'none',
                        cursor: isExportingCapcut ? 'not-allowed' : 'pointer',
                      }}
                      onPointerDown={e => { if (!isExportingCapcut) e.currentTarget.style.transform = 'scale(0.99)'; }}
                      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                    >
                      <span style={{
                        fontFamily: font, fontSize: '13px', fontWeight: 500,
                        color: isExportingCapcut ? C.textDisabled : C.textWhite,
                      }}>{isExportingCapcut ? '내보내는 중...' : 'CapCut 프로젝트 내보내기'}</span>
                    </button>

                    <button
                      onClick={resetAll}
                      className="w-full flex items-center justify-center"
                      style={{
                        height: '48px', background: 'none', border: 'none',
                        fontFamily: font, fontSize: '14px', fontWeight: 400,
                        color: C.textCaption, cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      새 영상 만들기
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '16px', padding: '14px 18px',
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: '16px',
              fontFamily: font, fontSize: '14px', fontWeight: 400,
              color: C.destructive,
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
