import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@remotion/player';
import { supabaseUrl } from '../lib/supabase';
import ArrowLeft from '../components/ArrowLeft';
import MemeAdVideo, { computeTotalMemeAdFrames } from '../meme-ad/compositions/MemeAdVideo';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, AD_DURATIONS, MAX_HOOK_DURATION, MIN_HOOK_DURATION, MAX_HOOK_FILE_SIZE, HOOK_SITES } from '../meme-ad/constants';
import { renderMemeAdVideoToMp4 } from '../meme-ad/renderMemeAdVideo';
import { isWebCodecsSupported } from '../shortform/renderVideo';
import type { Scene, ScriptResult, TtsAudio, BgmAudio } from '../meme-ad/types';
import type { TransitionType } from '../meme-ad/compositions/TransitionOverlay';

// ── Types ──

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Step = 'input' | 'review' | 'result';
type VideoPhase = 'tts' | 'images' | 'preview' | 'rendering' | 'done';

// ── Design Tokens ──

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
};

const font = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const PLATFORMS = [
  { id: 'reels', label: '릴스' },
  { id: 'shorts', label: '쇼츠' },
  { id: 'tiktok', label: '틱톡' },
] as const;

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'fade', label: '페이드' },
  { id: 'flash', label: '플래시' },
  { id: 'glitch', label: '글리치' },
  { id: 'zoom', label: '줌' },
];

// ── Main Page ──

export default function MemeAdPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('input');

  // Step 1 inputs
  const [hookFile, setHookFile] = useState<File | null>(null);
  const [hookUrl, setHookUrl] = useState<string | null>(null);
  const [hookDuration, setHookDuration] = useState<number>(0);
  const [brandInfo, setBrandInfo] = useState('');
  const [adDuration, setAdDuration] = useState<number>(10);
  const [platform, setPlatform] = useState<string>('reels');
  const [transitionType, setTransitionType] = useState<TransitionType>('fade');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Video state
  const [videoPhase, setVideoPhase] = useState<VideoPhase>('tts');
  const [ttsAudios, setTtsAudios] = useState<TtsAudio[]>([]);
  const [ttsProgress, setTtsProgress] = useState(0);
  const [imageProgress, setImageProgress] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ttsAbortRef = useRef(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Hook video upload handler ──

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('video/')) {
      setError('MP4 영상 파일만 업로드할 수 있습니다');
      return;
    }
    if (file.size > MAX_HOOK_FILE_SIZE) {
      setError(`파일 크기가 ${MAX_HOOK_FILE_SIZE / 1024 / 1024}MB를 초과합니다`);
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const dur = video.duration;
      if (dur < MIN_HOOK_DURATION) {
        setError(`영상이 너무 짧습니다 (최소 ${MIN_HOOK_DURATION}초)`);
        URL.revokeObjectURL(url);
        return;
      }
      if (dur > MAX_HOOK_DURATION) {
        setError(`영상이 너무 깁니다 (최대 ${MAX_HOOK_DURATION}초)`);
        URL.revokeObjectURL(url);
        return;
      }

      if (hookUrl) URL.revokeObjectURL(hookUrl);
      setHookFile(file);
      setHookUrl(url);
      setHookDuration(dur);
    };

    video.onerror = () => {
      setError('영상을 읽을 수 없습니다');
      URL.revokeObjectURL(url);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Edge function helper ──

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

  // ── Step 1: Generate ad script ──

  const handleGenerate = async () => {
    if (!brandInfo.trim() || !hookFile) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setChatMessages([]);

    try {
      const data = await callEdgeFunction('generate-meme-ad', {
        brandInfo: brandInfo.trim(),
        adDuration,
        platform,
        hookDuration: Math.round(hookDuration),
      });
      setResult(data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Step 2: Revise ──

  const handleRevise = async () => {
    if (!chatInput.trim() || !result) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsRevising(true);
    setError(null);

    try {
      const currentScript = JSON.stringify(result, null, 2);
      const data = await callEdgeFunction('generate-meme-ad', {
        brandInfo: `기존 대본:\n${currentScript}\n\n수정 요청: ${userMsg}\n\n위 대본을 수정 요청에 맞게 수정해줘. 전체 길이(${result.total_duration}초)와 씬 수는 유지.`,
        adDuration: result.total_duration,
        platform,
        hookDuration: Math.round(hookDuration),
      });
      setResult(data);
      setChatMessages(prev => [...prev, { role: 'assistant', content: '대본을 수정했습니다!' }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '오류';
      setChatMessages(prev => [...prev, { role: 'assistant', content: `수정 실패: ${errMsg}` }]);
    } finally {
      setIsRevising(false);
    }
  };

  // ── Step 3: TTS ──

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

    // 이미지 생성 후 미리보기로
    setVideoPhase('images');
  }, []);

  useEffect(() => {
    if (step === 'result' && result && videoPhase === 'tts' && ttsAudios.length === 0) {
      generateAllTts(result.scenes);
    }
  }, [step, result, videoPhase, ttsAudios.length, generateAllTts]);

  // ── Step 3-A2: Generate scene images ──

  const generateSceneImages = useCallback(async (scenes: Scene[]) => {
    setImageProgress(0);
    setError(null);

    const updatedScenes = [...scenes];

    for (let i = 0; i < scenes.length; i += 2) {
      if (ttsAbortRef.current) return;
      const batch = scenes.slice(i, Math.min(i + 2, scenes.length));

      const results = await Promise.allSettled(
        batch.map(async (scene) => {
          const data = await callEdgeFunction('generate-card-image', {
            slide_context: {
              headline: scene.subtitle.replace(/\*\*/g, ''),
              body: scene.narration,
              type: scene.type === 'cta' ? 'cta' : 'content',
              topic: brandInfo,
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
    setVideoPhase('preview');
  }, [brandInfo]);

  useEffect(() => {
    if (step === 'result' && result && videoPhase === 'images') {
      generateSceneImages(result.scenes);
    }
  }, [step, result, videoPhase, generateSceneImages]);

  // ── Step 3: Render ──

  const handleRenderVideo = async () => {
    if (!result || !hookFile) return;
    setVideoPhase('rendering');
    setRenderProgress(0);
    setError(null);

    try {
      const blob = await renderMemeAdVideoToMp4(
        hookFile,
        hookDuration,
        result.scenes,
        ttsAudios,
        (p) => setRenderProgress(p),
      );
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setVideoPhase('done');
    } catch (err) {
      setError(`렌더링 실패: ${err instanceof Error ? err.message : '오류'}`);
      setVideoPhase('preview');
    }
  };

  const handleDownloadVideo = () => {
    if (!videoUrl || !result) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${result.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().slice(0, 30) || 'meme-ad'}.mp4`;
    a.click();
  };

  const buildScriptText = (): string => {
    if (!result) return '';
    const lines: string[] = [];
    lines.push(`제목: ${result.title}`);
    lines.push(`훅 영상: ${hookDuration.toFixed(1)}초`);
    lines.push(`광고: ${result.total_duration}초`);
    lines.push('');
    for (const scene of result.scenes) {
      lines.push(`[씬 ${scene.scene_number}] ${scene.type} (${scene.duration}초)`);
      lines.push(`나레이션: ${scene.narration}`);
      lines.push(`자막: ${scene.subtitle}`);
      lines.push('');
    }
    lines.push(`해시태그: ${result.hashtags.map(h => `#${h}`).join(' ')}`);
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildScriptText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('클립보드 복사 실패');
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([buildScriptText()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${result?.title?.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().slice(0, 30) || 'meme-ad'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const resetAll = () => {
    ttsAbortRef.current = true;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setStep('input');
    setBrandInfo('');
    setAdDuration(15);
    setPlatform('reels');
    setResult(null);
    setError(null);
    setChatMessages([]);
    setChatInput('');
    setCopied(false);
    setVideoPhase('tts');
    setTtsAudios([]);
    setTtsProgress(0);
    setImageProgress(0);
    setRenderProgress(0);
    setVideoUrl(null);
    // Keep hook file for reuse
  };

  const goToResult = () => {
    setVideoPhase('tts');
    setTtsAudios([]);
    setTtsProgress(0);
    setImageProgress(0);
    setRenderProgress(0);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setStep('result');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`;
  };

  const getCumulativeTime = (scenes: Scene[], index: number) => {
    let t = 0;
    for (let i = 0; i < index; i++) t += scenes[i].duration;
    return t;
  };

  // ── CTA Button ──
  const ctaButton = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center"
      style={{
        height: '56px', borderRadius: '16px',
        backgroundColor: disabled ? C.surfaceDisabled : C.primary,
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
      }}
      onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.99)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      <span style={{
        fontFamily: font, fontSize: '16px', fontWeight: 500,
        lineHeight: '25px', letterSpacing: '-0.32px',
        color: disabled ? C.textDisabled : C.textWhite,
      }}>{label}</span>
    </button>
  );

  // ── Render ──

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative pb-[140px]" style={{ fontFamily: font }}>

        {/* NavigationHeader */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20 fixed top-0 left-1/2 -translate-x-1/2 max-w-[440px]">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={() => navigate(-1)} />
              <p style={{
                fontFamily: font, fontSize: '18px', fontWeight: 600,
                lineHeight: '25.5px', letterSpacing: '-0.36px',
                color: C.textBlack, textAlign: 'center',
              }}>
                {step === 'input' ? '밈광고 메이커' : step === 'review' ? '광고 대본 검토' : '영상 제작'}
              </p>
              <div className="w-[44px]" />
            </div>
          </div>
        </div>

        <div className="h-[60px]" />

        <div style={{ padding: '0 20px' }}>

          {/* ════ STEP 1: Input ════ */}
          {step === 'input' && (
            <>
              <div style={{ marginBottom: '28px', marginTop: '8px' }}>
                <h1 style={{
                  fontFamily: font, fontSize: '22px', fontWeight: 600,
                  lineHeight: '32.5px', letterSpacing: '-0.22px',
                  color: C.textPrimary, margin: 0,
                }}>
                  밈광고 메이커
                </h1>
                <p style={{
                  fontFamily: font, fontSize: '15px', fontWeight: 400,
                  lineHeight: '20px', letterSpacing: '-0.45px',
                  color: C.textTertiary, marginTop: '8px',
                }}>
                  밈 후크 영상 + AI 광고를 합쳐 바이럴 영상을 만들어요
                </p>
              </div>

              {/* Hook Video Upload */}
              <section style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '8px',
                }}>
                  후크 밈 영상 (1~{MAX_HOOK_DURATION}초, MP4)
                </label>

                {hookUrl ? (
                  <div style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.borderDefault}`, marginBottom: '8px' }} className="transform-gpu">
                    <video
                      src={hookUrl}
                      controls
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#000' }}
                    />
                    <div className="flex items-center justify-between" style={{ padding: '10px 14px', backgroundColor: C.surfaceSecondary }}>
                      <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.textSecondary }}>
                        {hookFile?.name} ({hookDuration.toFixed(1)}초)
                      </span>
                      <button
                        onClick={() => {
                          if (hookUrl) URL.revokeObjectURL(hookUrl);
                          setHookFile(null);
                          setHookUrl(null);
                          setHookDuration(0);
                        }}
                        style={{
                          fontFamily: font, fontSize: '12px', fontWeight: 500,
                          color: C.destructive, background: 'none', border: 'none', cursor: 'pointer',
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center"
                    style={{
                      height: '160px', borderRadius: '16px',
                      border: `2px dashed ${C.borderDefault}`,
                      backgroundColor: C.surfaceSecondary,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎬</div>
                    <span style={{
                      fontFamily: font, fontSize: '14px', fontWeight: 500,
                      color: C.textTertiary, marginBottom: '4px',
                    }}>
                      클릭 또는 드래그하여 업로드
                    </span>
                    <span style={{
                      fontFamily: font, fontSize: '12px', fontWeight: 400,
                      color: C.textCaption,
                    }}>
                      MP4, 최대 {MAX_HOOK_FILE_SIZE / 1024 / 1024}MB
                    </span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />

                {/* External hook site links */}
                <div style={{ marginTop: '12px' }}>
                  <span style={{
                    fontFamily: font, fontSize: '11px', fontWeight: 500,
                    color: C.textCaption,
                  }}>
                    후크 영상 다운로드 사이트
                  </span>
                  <div className="flex flex-wrap" style={{ gap: '6px', marginTop: '6px' }}>
                    {HOOK_SITES.map(site => (
                      <a
                        key={site.name}
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '4px 10px', borderRadius: '8px',
                          backgroundColor: C.primaryLight,
                          fontFamily: font, fontSize: '11px', fontWeight: 500,
                          color: C.primaryDark, textDecoration: 'none',
                          gap: '4px',
                        }}
                      >
                        {site.name}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </section>

              {/* Brand Info */}
              <section style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '8px',
                }}>
                  브랜드 / 제품 정보
                </label>
                <div style={{
                  backgroundColor: C.surface, border: `1px solid ${C.borderDefault}`,
                  borderRadius: '16px', padding: '12px',
                }}>
                  <textarea
                    value={brandInfo}
                    onChange={e => setBrandInfo(e.target.value)}
                    placeholder="예: 나다운세 - AI 타로/사주 운세 서비스. 매일 무료 운세 제공, 정확한 사주풀이"
                    rows={3}
                    className="w-full outline-none bg-transparent resize-none"
                    style={{
                      fontFamily: font, fontSize: '15px', fontWeight: 400,
                      lineHeight: '20px', letterSpacing: '-0.45px',
                      color: C.textPrimary, border: 'none',
                    }}
                  />
                </div>
              </section>

              {/* Ad Duration */}
              <section style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '10px',
                }}>
                  광고 길이
                </label>
                <div className="flex" style={{ gap: '10px' }}>
                  {AD_DURATIONS.map(d => {
                    const isSelected = adDuration === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setAdDuration(d)}
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
                {hookDuration > 0 && (
                  <p style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    color: C.textCaption, marginTop: '6px', paddingLeft: '4px',
                  }}>
                    총 영상: {formatTime(Math.round(hookDuration + adDuration))} (밈 {hookDuration.toFixed(1)}초 + 광고 {adDuration}초)
                  </p>
                )}
              </section>

              {/* Platform */}
              <section style={{ marginBottom: '24px' }}>
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

              {/* Transition Type */}
              <section style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block', fontFamily: font, fontSize: '12px', fontWeight: 400,
                  lineHeight: '16px', letterSpacing: '-0.24px',
                  color: C.textCaption, marginBottom: '10px',
                }}>
                  밈 → 광고 전환 효과
                </label>
                <div className="flex" style={{ gap: '10px' }}>
                  {TRANSITIONS.map(t => {
                    const isSelected = transitionType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTransitionType(t.id)}
                        className="flex-1 flex items-center justify-center"
                        style={{
                          height: '48px', borderRadius: '16px',
                          fontFamily: font, fontSize: '14px', fontWeight: isSelected ? 600 : 400,
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
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Generate CTA */}
              {ctaButton(
                isGenerating ? '대본 생성 중...' : '광고 대본 생성하기',
                handleGenerate,
                !brandInfo.trim() || !hookFile || isGenerating,
              )}
            </>
          )}

          {/* ════ STEP 2: Review ════ */}
          {step === 'review' && result && (
            <>
              {/* Title Card */}
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
                  밈 {hookDuration.toFixed(1)}초 + 광고 {result.total_duration}초 · {result.scenes.length}씬
                </div>
              </div>

              {/* Hook preview */}
              {hookUrl && (
                <div style={{
                  padding: '12px', backgroundColor: C.surfaceTertiary, borderRadius: '12px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    fontFamily: font, fontSize: '11px', fontWeight: 600,
                    color: C.textCaption, marginBottom: '8px', textTransform: 'uppercase' as const,
                  }}>
                    밈 후크 클립
                  </div>
                  <video
                    src={hookUrl}
                    controls
                    style={{
                      width: '100%', maxHeight: '150px', borderRadius: '8px',
                      objectFit: 'contain', backgroundColor: '#000',
                    }}
                    className="transform-gpu"
                  />
                </div>
              )}

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
                          backgroundColor: scene.type === 'intro' ? C.primary : scene.type === 'cta' ? C.primaryDark : C.surfaceTertiary,
                          color: scene.type === 'intro' || scene.type === 'cta' ? C.textWhite : C.textTertiary,
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
                            backgroundColor: scene.type === 'intro' ? C.primaryTint : scene.type === 'cta' ? C.primaryLight : C.surfaceTertiary,
                            color: scene.type === 'intro' ? C.primary : scene.type === 'cta' ? C.primaryDark : C.textCaption,
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
                          lineHeight: '18px', color: C.primaryDark,
                        }}>
                          자막: {scene.subtitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Meta */}
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

              {/* Chat */}
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

              {/* Revision input */}
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
                    backgroundColor: !chatInput.trim() || isRevising ? C.surfaceDisabled : C.primary,
                    color: !chatInput.trim() || isRevising ? C.textDisabled : C.textWhite,
                    border: 'none', cursor: !chatInput.trim() || isRevising ? 'not-allowed' : 'pointer',
                  }}
                  onPointerDown={e => { if (chatInput.trim() && !isRevising) e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  {isRevising ? '수정 중...' : '수정'}
                </button>
              </div>

              {/* CTAs */}
              <div className="flex" style={{ gap: '10px' }}>
                <button
                  onClick={() => { setStep('input'); setResult(null); }}
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    height: '56px', width: '80px', borderRadius: '16px',
                    backgroundColor: C.primaryLight, border: 'none', cursor: 'pointer',
                  }}
                  onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: C.primary }}>처음으로</span>
                </button>
                <button
                  onClick={goToResult}
                  className="flex-1 flex items-center justify-center"
                  style={{
                    height: '56px', borderRadius: '16px',
                    backgroundColor: C.primary, border: 'none', cursor: 'pointer',
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
                  밈 {hookDuration.toFixed(1)}초 + 광고 {result.total_duration}초 · {result.scenes.length}씬
                </p>
              </div>

              {/* Phase A: TTS */}
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

              {/* Phase A-2: Images */}
              {videoPhase === 'images' && (
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

              {/* Phase B: Preview */}
              {videoPhase === 'preview' && ttsAudios.length > 0 && hookUrl && (
                <>
                  <div className="flex justify-center" style={{ marginBottom: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '280px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.borderDefault}` }} className="transform-gpu">
                      <Player
                        component={MemeAdVideo}
                        inputProps={{
                          hookVideoUrl: hookUrl,
                          hookDurationInSeconds: hookDuration,
                          scenes: result.scenes,
                          ttsAudios,
                          transitionType,
                        }}
                        durationInFrames={Math.max(1, computeTotalMemeAdFrames(hookDuration, result.scenes, ttsAudios))}
                        fps={VIDEO_FPS}
                        compositionWidth={VIDEO_WIDTH}
                        compositionHeight={VIDEO_HEIGHT}
                        style={{ width: '100%' }}
                        controls
                        autoPlay={false}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col" style={{ gap: '10px' }}>
                    {isWebCodecsSupported() ? (
                      ctaButton('MP4 영상 다운로드', handleRenderVideo, false)
                    ) : (
                      <div style={{
                        padding: '14px 18px', backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA', borderRadius: '16px',
                        fontFamily: font, fontSize: '14px', color: C.destructive,
                      }}>
                        Chrome 또는 Edge를 사용해주세요.
                      </div>
                    )}

                    <button
                      onClick={handleDownloadTxt}
                      className="w-full flex items-center justify-center"
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
                  </div>
                </>
              )}

              {/* Phase C: Rendering */}
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

              {/* Phase D: Done */}
              {videoPhase === 'done' && videoUrl && (
                <>
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
