import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseUrl } from '../lib/supabase';
import ArrowLeft from '../components/ArrowLeft';

// ── Types ──

type Step = 'input' | 'result';

type GeneratedImage = {
  id: number;
  src: string; // data:image/...;base64,...
};

// ── Constants ──

const font = "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

const C = {
  primary: '#48b2af',
  primaryDark: '#41a09e',
  primaryLight: '#f0f8f8',
  surface: '#ffffff',
  surfaceDisabled: '#f8f8f8',
  surfaceSecondary: '#f9f9f9',
  borderDefault: '#e7e7e7',
  borderDivider: '#f3f3f3',
  textPrimary: '#151515',
  textBlack: '#000000',
  textSecondary: '#525252',
  textTertiary: '#6d6d6d',
  textCaption: '#848484',
  textDisabled: '#b7b7b7',
  textWhite: '#ffffff',
};

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', desc: '유튜브 썸네일', width: 1280, height: 720 },
  { id: '3:4', label: '3:4', desc: '네이버 블로그', width: 900, height: 1200 },
  { id: '1:1', label: '1:1', desc: '인스타 정사각', width: 1080, height: 1080 },
  { id: '9:16', label: '9:16', desc: '릴스·쇼츠·틱톡', width: 1080, height: 1920 },
] as const;

const REFERENCE_MODES = [
  { id: 'style_only', label: '스타일만 참고', desc: '색감·구도·분위기만 따라감' },
  { id: 'style_and_character', label: '캐릭터+스타일', desc: '캐릭터·인물까지 유지' },
] as const;

const IMAGE_COUNTS = [1, 2, 3, 4] as const;

// ── Component ──

export default function ThumbnailPage() {
  const navigate = useNavigate();

  // Step
  const [step, setStep] = useState<Step>('input');

  // Input
  const [prompt, setPrompt] = useState('');
  const [ratioId, setRatioId] = useState<string>('16:9');
  const [referenceMode, setReferenceMode] = useState<string>('style_only');
  const [imageCount, setImageCount] = useState<number>(2);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [referenceBase64, setReferenceBase64] = useState<string | null>(null);

  // Result
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── Handlers ──

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지는 10MB 이하만 업로드 가능해요');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setReferencePreview(dataUrl);
      // base64 부분만 추출 (data:image/png;base64, 뒤)
      const base64 = dataUrl.split(',')[1];
      setReferenceBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeReference = () => {
    setReferencePreview(null);
    setReferenceBase64(null);
  };

  const callGenerateApi = async (): Promise<{ image: string; mimeType: string }> => {
    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio: ratioId,
    };
    if (referenceBase64) {
      body.reference_image = referenceBase64;
      body.reference_mode = referenceMode;
    }
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '이미지 생성 실패');
    return data as { image: string; mimeType: string };
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setImages([]);
    setGeneratedCount(0);
    setStep('result');

    const results: GeneratedImage[] = [];

    for (let i = 0; i < imageCount; i++) {
      try {
        const data = await callGenerateApi();
        const img: GeneratedImage = {
          id: i + 1,
          src: `data:${data.mimeType};base64,${data.image}`,
        };
        results.push(img);
        setImages([...results]);
        setGeneratedCount(i + 1);
      } catch (err) {
        console.error(`Image ${i + 1} failed:`, err);
        if (results.length === 0) {
          setError(err instanceof Error ? err.message : '이미지 생성에 실패했어요');
        }
      }
    }

    setGenerating(false);
  }, [prompt, ratioId, referenceBase64, referenceMode, imageCount]);

  const handleRegenerate = useCallback(async (targetId: number) => {
    setError(null);
    setImages(prev => prev.map(img =>
      img.id === targetId ? { ...img, src: '' } : img
    ));
    try {
      const data = await callGenerateApi();
      setImages(prev => prev.map(img =>
        img.id === targetId ? { ...img, src: `data:${data.mimeType};base64,${data.image}` } : img
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '재생성 실패');
      // 실패 시 원래 이미지 복구 불가 — 빈 상태로 두기
    }
  }, [prompt, ratioId, referenceBase64, referenceMode]);

  const handleDownload = (img: GeneratedImage) => {
    if (!img.src) return;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `thumbnail-${img.id}.png`;
    a.click();
  };

  const handleDownloadAll = () => {
    images.forEach(img => {
      if (img.src) handleDownload(img);
    });
  };

  const selectedRatio = ASPECT_RATIOS.find(r => r.id === ratioId)!;
  const headerTitle = step === 'input' ? 'AI 썸네일 메이커' : '생성 결과';
  const canGenerate = prompt.trim().length > 0;

  // ── Render ──

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative" style={{ fontFamily: font }}>

        {/* NavigationHeader */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20 fixed top-0 left-1/2 -translate-x-1/2 max-w-[440px]">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={() => {
                if (step === 'result') { setStep('input'); return; }
                navigate(-1);
              }} />
              <p style={{
                fontFamily: font, fontSize: '18px', fontWeight: 600,
                lineHeight: '25.5px', letterSpacing: '-0.36px',
                color: C.textBlack, textAlign: 'center',
              }}>
                {headerTitle}
              </p>
              <div className="w-[44px]" />
            </div>
          </div>
        </div>

        {/* 헤더 여백 */}
        <div className="h-[60px]" />

        {/* ════════ STEP: INPUT ════════ */}
        {step === 'input' && (
          <div style={{ padding: '0 20px', paddingBottom: '140px' }}>

            {/* Title */}
            <div style={{ marginTop: '8px', marginBottom: '24px' }}>
              <h1 style={{
                fontFamily: font, fontSize: '22px', fontWeight: 600,
                lineHeight: '32.5px', letterSpacing: '-0.22px',
                color: C.textPrimary, margin: 0,
              }}>
                AI 썸네일 메이커
              </h1>
              <p style={{
                fontFamily: font, fontSize: '15px', fontWeight: 400,
                lineHeight: '20px', letterSpacing: '-0.45px',
                color: C.textTertiary, marginTop: '8px',
              }}>
                레퍼런스를 넣고 명령하면 AI가 썸네일을 만들어요
              </p>
            </div>

            {/* ── 명령어 입력 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '15px', fontWeight: 600,
                lineHeight: '20px', letterSpacing: '-0.3px',
                color: C.textPrimary, display: 'block', marginBottom: '10px',
              }}>
                명령어 <span style={{ color: C.primary }}>*</span>
              </label>
              <div style={{
                borderRadius: '16px', border: `1px solid ${C.borderDefault}`,
                padding: '14px 16px', backgroundColor: C.surface,
              }}>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="예: 유튜브 먹방 썸네일, 맛있는 치킨 앞에서 놀란 표정의 남자, 큰 글씨로 '역대급 치킨 먹방' 텍스트"
                  rows={4}
                  className="w-full outline-none bg-transparent resize-none"
                  style={{
                    fontFamily: font, fontSize: '15px', fontWeight: 400,
                    lineHeight: '22px', letterSpacing: '-0.45px',
                    color: C.textPrimary, border: 'none',
                  }}
                />
              </div>
            </div>

            {/* ── 레퍼런스 이미지 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '15px', fontWeight: 600,
                lineHeight: '20px', letterSpacing: '-0.3px',
                color: C.textPrimary, display: 'block', marginBottom: '10px',
              }}>
                레퍼런스 이미지
              </label>

              {referencePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={referencePreview}
                    alt="레퍼런스"
                    style={{
                      width: '120px', height: '120px', objectFit: 'cover',
                      borderRadius: '12px', border: `1px solid ${C.borderDefault}`,
                    }}
                  />
                  <button
                    onClick={removeReference}
                    style={{
                      position: 'absolute', top: '-8px', right: '-8px',
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: '#ff4d4f', border: 'none',
                      color: C.textWhite, fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: '120px', borderRadius: '16px',
                  border: `2px dashed ${C.borderDefault}`, backgroundColor: C.surfaceSecondary,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  gap: '8px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.textDisabled} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span style={{
                    fontFamily: font, fontSize: '13px', fontWeight: 400,
                    color: C.textCaption,
                  }}>
                    이미지를 업로드하세요 (10MB 이하)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            {/* ── 레퍼런스 모드 (레퍼런스가 있을 때만) ── */}
            {referencePreview && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontFamily: font, fontSize: '15px', fontWeight: 600,
                  lineHeight: '20px', letterSpacing: '-0.3px',
                  color: C.textPrimary, display: 'block', marginBottom: '10px',
                }}>
                  참고 방식
                </label>
                <div className="flex" style={{ gap: '8px' }}>
                  {REFERENCE_MODES.map(mode => {
                    const selected = referenceMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setReferenceMode(mode.id)}
                        className="flex-1"
                        style={{
                          padding: '12px 8px', borderRadius: '12px',
                          backgroundColor: selected ? C.primaryLight : C.surface,
                          border: `1.5px solid ${selected ? C.primary : C.borderDefault}`,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        <p style={{
                          fontFamily: font, fontSize: '14px', fontWeight: selected ? 600 : 400,
                          color: selected ? C.primary : C.textPrimary,
                          letterSpacing: '-0.28px',
                        }}>
                          {mode.label}
                        </p>
                        <p style={{
                          fontFamily: font, fontSize: '11px', fontWeight: 400,
                          color: C.textCaption, marginTop: '4px',
                          letterSpacing: '-0.22px',
                        }}>
                          {mode.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 이미지 비율 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '15px', fontWeight: 600,
                lineHeight: '20px', letterSpacing: '-0.3px',
                color: C.textPrimary, display: 'block', marginBottom: '10px',
              }}>
                이미지 비율
              </label>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {ASPECT_RATIOS.map(ratio => {
                  const selected = ratioId === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => setRatioId(ratio.id)}
                      style={{
                        height: '40px', padding: '0 14px', borderRadius: '12px',
                        fontFamily: font, fontSize: '13px', fontWeight: selected ? 600 : 400,
                        letterSpacing: '-0.26px',
                        color: selected ? C.textWhite : C.textTertiary,
                        backgroundColor: selected ? C.primary : C.surface,
                        border: selected ? 'none' : `1px solid ${C.borderDefault}`,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>
              <p style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                color: C.textCaption, marginTop: '8px',
                letterSpacing: '-0.24px',
              }}>
                {selectedRatio.desc} ({selectedRatio.width}×{selectedRatio.height}px)
              </p>
            </div>

            {/* ── 생성 개수 ── */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontFamily: font, fontSize: '15px', fontWeight: 600,
                lineHeight: '20px', letterSpacing: '-0.3px',
                color: C.textPrimary, display: 'block', marginBottom: '10px',
              }}>
                생성 개수
              </label>
              <div className="flex" style={{ gap: '8px' }}>
                {IMAGE_COUNTS.map(count => {
                  const selected = imageCount === count;
                  return (
                    <button
                      key={count}
                      onClick={() => setImageCount(count)}
                      style={{
                        width: '48px', height: '40px', borderRadius: '12px',
                        fontFamily: font, fontSize: '14px', fontWeight: selected ? 600 : 400,
                        color: selected ? C.textWhite : C.textTertiary,
                        backgroundColor: selected ? C.primary : C.surface,
                        border: selected ? 'none' : `1px solid ${C.borderDefault}`,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                    >
                      {count}장
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 스펙 요약 ── */}
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              backgroundColor: C.surfaceSecondary, marginBottom: '24px',
            }}>
              <p style={{
                fontFamily: font, fontSize: '13px', fontWeight: 400,
                lineHeight: '20px', color: C.textCaption, letterSpacing: '-0.26px',
              }}>
                {selectedRatio.label} · {selectedRatio.width}×{selectedRatio.height}px · {imageCount}장
                {referencePreview && ` · 레퍼런스 ${referenceMode === 'style_only' ? '스타일' : '캐릭터+스타일'}`}
              </p>
            </div>

            {/* ── CTA Button ── */}
            <div style={{
              position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              maxWidth: '440px', width: '100%', padding: '12px 20px 32px',
              backgroundColor: C.surface,
              borderTop: `1px solid ${C.borderDivider}`,
            }}>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                  width: '100%', height: '56px', borderRadius: '16px',
                  backgroundColor: canGenerate ? C.primary : C.surfaceDisabled,
                  border: 'none', cursor: canGenerate ? 'pointer' : 'default',
                  fontFamily: font, fontSize: '16px', fontWeight: 500,
                  color: canGenerate ? C.textWhite : C.textDisabled,
                  letterSpacing: '-0.32px',
                  transition: 'all 0.15s ease',
                }}
                onPointerDown={e => { if (canGenerate) e.currentTarget.style.transform = 'scale(0.99)'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
              >
                썸네일 생성하기
              </button>
            </div>
          </div>
        )}

        {/* ════════ STEP: RESULT ════════ */}
        {step === 'result' && (
          <div style={{ padding: '0 20px', paddingBottom: '140px' }}>

            {/* Progress */}
            {generating && (
              <div style={{
                padding: '16px', borderRadius: '12px',
                backgroundColor: C.primaryLight, marginBottom: '16px', marginTop: '8px',
              }}>
                <p style={{
                  fontFamily: font, fontSize: '14px', fontWeight: 500,
                  color: C.primaryDark, letterSpacing: '-0.28px',
                }}>
                  {generatedCount}/{imageCount}장 생성 중...
                </p>
                <div style={{
                  width: '100%', height: '4px', borderRadius: '2px',
                  backgroundColor: '#d4eceb', marginTop: '8px',
                }}>
                  <div style={{
                    width: `${(generatedCount / imageCount) * 100}%`,
                    height: '100%', borderRadius: '2px',
                    backgroundColor: C.primary,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '14px 16px', borderRadius: '12px',
                backgroundColor: '#fff2f0', border: '1px solid #ffccc7',
                marginBottom: '16px', marginTop: generating ? '0' : '8px',
              }}>
                <p style={{
                  fontFamily: font, fontSize: '13px', fontWeight: 400,
                  color: '#cf1322', letterSpacing: '-0.26px',
                }}>
                  {error}
                </p>
              </div>
            )}

            {/* Images */}
            <div className="flex flex-col" style={{ gap: '20px', marginTop: generating ? '0' : '8px' }}>
              {images.map(img => (
                <div key={img.id}>
                  {/* Label + Actions */}
                  <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                    <span style={{
                      fontFamily: font, fontSize: '14px', fontWeight: 600,
                      color: C.textPrimary, letterSpacing: '-0.28px',
                    }}>
                      #{img.id}
                    </span>
                    {img.src && (
                      <div className="flex" style={{ gap: '8px' }}>
                        <button
                          onClick={() => handleRegenerate(img.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px',
                            border: `1px solid ${C.borderDefault}`,
                            backgroundColor: C.surface, cursor: 'pointer',
                            fontFamily: font, fontSize: '12px', fontWeight: 500,
                            color: C.textSecondary, letterSpacing: '-0.24px',
                          }}
                        >
                          재생성
                        </button>
                        <button
                          onClick={() => handleDownload(img)}
                          style={{
                            padding: '6px 12px', borderRadius: '8px',
                            border: 'none',
                            backgroundColor: C.primary, cursor: 'pointer',
                            fontFamily: font, fontSize: '12px', fontWeight: 500,
                            color: C.textWhite, letterSpacing: '-0.24px',
                          }}
                        >
                          다운로드
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Image Container */}
                  <div
                    className="transform-gpu"
                    style={{
                      width: '100%',
                      aspectRatio: `${selectedRatio.width}/${selectedRatio.height}`,
                      borderRadius: '12px',
                      backgroundColor: C.surfaceSecondary,
                      overflow: 'hidden',
                      border: `1px solid ${C.borderDefault}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {img.src ? (
                      <img
                        src={img.src}
                        alt={`썸네일 ${img.id}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="flex flex-col items-center" style={{ gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          border: `3px solid ${C.borderDefault}`,
                          borderTopColor: C.primary,
                          animation: 'spin 1s linear infinite',
                        }} />
                        <p style={{
                          fontFamily: font, fontSize: '14px', fontWeight: 400,
                          color: C.textCaption,
                        }}>
                          재생성 중...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Generating placeholders for remaining */}
            {generating && images.length < imageCount && (
              <div className="flex flex-col" style={{ gap: '20px', marginTop: images.length > 0 ? '20px' : '8px' }}>
                {Array.from({ length: imageCount - images.length }, (_, i) => (
                  <div key={`pending-${i}`}>
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{
                        fontFamily: font, fontSize: '14px', fontWeight: 600,
                        color: C.textDisabled, letterSpacing: '-0.28px',
                      }}>
                        #{images.length + i + 1}
                      </span>
                    </div>
                    <div
                      className="transform-gpu"
                      style={{
                        width: '100%',
                        aspectRatio: `${selectedRatio.width}/${selectedRatio.height}`,
                        borderRadius: '12px',
                        backgroundColor: C.surfaceSecondary,
                        overflow: 'hidden',
                        border: `1px solid ${C.borderDefault}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <div className="flex flex-col items-center" style={{ gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          border: `3px solid ${C.borderDefault}`,
                          borderTopColor: C.primary,
                          animation: 'spin 1s linear infinite',
                        }} />
                        <p style={{
                          fontFamily: font, fontSize: '14px', fontWeight: 400,
                          color: C.textCaption,
                        }}>
                          대기 중...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Buttons */}
            {!generating && images.length > 0 && (
              <div style={{
                position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                maxWidth: '440px', width: '100%', padding: '12px 20px 32px',
                backgroundColor: C.surface,
                borderTop: `1px solid ${C.borderDivider}`,
              }}>
                <div className="flex" style={{ gap: '8px' }}>
                  <button
                    onClick={() => setStep('input')}
                    style={{
                      flex: 1, height: '56px', borderRadius: '16px',
                      backgroundColor: C.surface,
                      border: `1.5px solid ${C.borderDefault}`,
                      cursor: 'pointer',
                      fontFamily: font, fontSize: '16px', fontWeight: 500,
                      color: C.textSecondary, letterSpacing: '-0.32px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    처음으로
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    style={{
                      flex: 1, height: '56px', borderRadius: '16px',
                      backgroundColor: C.primary, border: 'none',
                      cursor: 'pointer',
                      fontFamily: font, fontSize: '16px', fontWeight: 500,
                      color: C.textWhite, letterSpacing: '-0.32px',
                      transition: 'all 0.15s ease',
                    }}
                    onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                    onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                    onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                  >
                    전체 다운로드
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
