/**
 * 운테 테스트 생성 페이지
 * ★DESIGN_SYSTEM★ 기반 — 아이디어 입력 → AI 생성 → 검토/승인
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { NavigationHeader } from '../components/NavigationHeader';

interface GeneratedResult {
  day_master: string;
  result_title: string;
  result_description: string;
  score: number;
  result_label?: string;
  result_image_url?: string | null;
}

interface GeneratedTest {
  testId: string;
  slug: string;
  title: string;
  description: string;
  templateType: string;
  isAdult: boolean;
  resultFormat?: string;
  results: GeneratedResult[];
  imageStyleGuide?: string;
}

type Step = 'input' | 'generating' | 'review' | 'publishing';

const font = "'Pretendard Variable', sans-serif";

export function UnteCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('input');
  const [idea, setIdea] = useState('');
  const [generated, setGenerated] = useState<GeneratedTest | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generatedRef = useRef<GeneratedTest | null>(null);
  const [pollTrigger, setPollTrigger] = useState(0);
  const [regeneratingDayMasters, setRegeneratingDayMasters] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // generated 상태를 ref에도 동기화 (cleanup에서 최신값 참조용)
  useEffect(() => {
    generatedRef.current = generated;
  }, [generated]);

  // 미게시 테스트 정리 (discard)
  const discardTest = useCallback(async (testId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      await fetch(`${supabaseUrl}/functions/v1/viral-test-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'discard', testId }),
      });
    } catch (err) {
      console.error('테스트 정리 실패:', err);
    }
  }, []);

  // 이탈 시 미게시 테스트 정리
  useEffect(() => {
    return () => {
      const gen = generatedRef.current;
      if (gen?.testId && !published) {
        // 컴포넌트 언마운트 시 discard (sendBeacon 폴백)
        const token = document.cookie; // sendBeacon용으로는 사용 불가, fire-and-forget fetch
        discardTest(gen.testId);
      }
    };
  }, [published, discardTest]);

  // 레퍼런스 이미지 preview URL 정리
  useEffect(() => {
    return () => {
      if (referencePreview) URL.revokeObjectURL(referencePreview);
    };
  }, [referencePreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 10MB 제한
    if (file.size > 10 * 1024 * 1024) {
      setError('이미지는 10MB 이하만 가능해요');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 첨부할 수 있어요');
      return;
    }

    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceImage(file);
    setReferencePreview(URL.createObjectURL(file));
    setError('');
  }, [referencePreview]);

  const handleRemoveImage = useCallback(() => {
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceImage(null);
    setReferencePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [referencePreview]);

  // 검토 단계에서 결과 이미지 폴링 (pollTrigger로 명시적 시작만)
  useEffect(() => {
    if (step !== 'review' || !generated || pollTrigger === 0) return;

    const hasAllImages = generated.results.every(r => r.result_image_url);
    if (hasAllImages) {
      setImagesLoading(false);
      setRegeneratingDayMasters(new Set());
      return;
    }

    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('viral_test_results')
        .select('day_master, result_image_url')
        .eq('test_id', generated.testId);

      if (!data) return;

      const imageMap = new Map(data.map(d => [d.day_master, d.result_image_url]));
      const allDone = data.every(d => d.result_image_url);

      setGenerated(prev => prev ? {
        ...prev,
        results: prev.results.map(r => ({
          ...r,
          result_image_url: imageMap.get(r.day_master) || r.result_image_url,
        })),
      } : prev);

      // 재생성 완료된 일간 제거
      setRegeneratingDayMasters(prev => {
        const next = new Set(prev);
        for (const d of data) {
          if (d.result_image_url && next.has(d.day_master)) {
            next.delete(d.day_master);
          }
        }
        return next.size === prev.size ? prev : next;
      });

      if (allDone) {
        setImagesLoading(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, generated?.testId, pollTrigger]);

  // 레퍼런스 이미지 base64 변환 헬퍼
  const getBase64 = useCallback(async (): Promise<string | undefined> => {
    if (!referenceImage) return undefined;
    const buffer = await referenceImage.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:${referenceImage.type};base64,${btoa(binary)}`;
  }, [referenceImage]);

  const handleGenerate = async () => {
    if (!idea.trim() || idea.trim().length < 2) {
      setError('아이디어를 2글자 이상 입력해주세요');
      return;
    }

    setStep('generating');
    setError('');

    try {
      const referenceImageBase64 = await getBase64();

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-viral-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea.trim(),
          creatorId: userId,
          ...(referenceImageBase64 && { referenceImage: referenceImageBase64 }),
        }),
      });

      if (!response.ok && response.status === 413) {
        throw new Error('이미지가 너무 커요. 더 작은 이미지를 사용해주세요.');
      }

      const text = await response.text().catch(() => '') || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('응답 파싱 실패:', text.slice(0, 300));
        throw new Error('서버 응답을 처리할 수 없습니다. 다시 시도해주세요.');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI 생성에 실패했습니다.');
      }

      setGenerated(data);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setStep('review');
    } catch (err) {
      console.error('생성 실패:', err);
      setError(err instanceof Error ? err.message : '생성에 실패했습니다.');
      setStep('input');
    }
  };

  const handlePublish = async () => {
    if (!generated) return;

    setStep('publishing');

    try {
      if (editTitle !== generated.title || editDescription !== generated.description) {
        await supabase.from('viral_tests').update({
          title: editTitle,
          description: editDescription,
          updated_at: new Date().toISOString(),
        }).eq('id', generated.testId);
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        await supabase.from('viral_tests').update({
          status: 'live',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', generated.testId);
      } else {
        const adminResponse = await fetch(`${supabaseUrl}/functions/v1/viral-test-admin`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'publish', testId: generated.testId }),
        });

        const adminData = await adminResponse.json();
        if (!adminData.success) throw new Error(adminData.error);
      }

      setPublished(true);
      navigate(`/unte/${generated.slug}`);
    } catch (err) {
      console.error('게시 실패:', err);
      setError(err instanceof Error ? err.message : '게시에 실패했습니다.');
      setStep('review');
    }
  };

  // 기획 다시하기 (Step 1+2 재실행, 기존 testId 재활용)
  const handleRegenerate = async () => {
    if (!generated) return;
    setStep('generating');
    setError('');

    try {
      const referenceImageBase64 = await getBase64();

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-viral-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea.trim(),
          creatorId: userId,
          testId: generated.testId,
          ...(referenceImageBase64 && { referenceImage: referenceImageBase64 }),
        }),
      });

      const text = await response.text().catch(() => '') || '';
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }
      if (!data.success) throw new Error(data.error || 'AI 생성에 실패했습니다.');

      setGenerated(data);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setRegeneratingDayMasters(new Set());
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : '기획 다시하기에 실패했습니다.');
      setStep('review');
    }
  };

  // 이미지 전체 다시 만들기
  const handleRegenerateImages = async () => {
    if (!generated) return;

    // 로컬 이미지 초기화
    setGenerated(prev => prev ? {
      ...prev,
      results: prev.results.map(r => ({ ...r, result_image_url: null })),
    } : prev);
    setImagesLoading(true);
    setRegeneratingDayMasters(new Set(generated.results.map(r => r.day_master)));

    // DB 이미지 URL 초기화 (폴링이 새 이미지만 감지하도록)
    await supabase.from('viral_test_results')
      .update({ result_image_url: null, share_image_url: null })
      .eq('test_id', generated.testId);
    await supabase.from('viral_tests')
      .update({ thumbnail_url: null })
      .eq('id', generated.testId);

    // 이미지 생성 API 호출 (fire-and-forget)
    const referenceImageBase64 = await getBase64();
    fetch(`${supabaseUrl}/functions/v1/generate-viral-test-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: generated.testId,
        ...(referenceImageBase64 && { referenceImage: referenceImageBase64 }),
      }),
    }).catch(console.error);

    setPollTrigger(c => c + 1);
  };

  // 개별 이미지 다시 만들기
  const handleRegenerateSingleImage = async (dayMaster: string) => {
    if (!generated) return;

    // 해당 이미지만 초기화
    setGenerated(prev => prev ? {
      ...prev,
      results: prev.results.map(r =>
        r.day_master === dayMaster ? { ...r, result_image_url: null } : r
      ),
    } : prev);
    setRegeneratingDayMasters(prev => new Set([...prev, dayMaster]));
    setImagesLoading(true);

    // DB 이미지 URL 초기화
    await supabase.from('viral_test_results')
      .update({ result_image_url: null, share_image_url: null })
      .eq('test_id', generated.testId)
      .eq('day_master', dayMaster);

    // 이미지 생성 API 호출 (해당 일간만)
    const referenceImageBase64 = await getBase64();
    fetch(`${supabaseUrl}/functions/v1/generate-viral-test-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: generated.testId,
        dayMasters: [dayMaster],
        ...(referenceImageBase64 && { referenceImage: referenceImageBase64 }),
      }),
    }).catch(console.error);

    setPollTrigger(c => c + 1);
  };

  const elementEmoji: Record<string, string> = {
    '갑': '🌳', '을': '🍃', '병': '☀️', '정': '🕯️', '무': '⛰️',
    '기': '🌾', '경': '⚔️', '신': '💎', '임': '🌊', '계': '💧',
  };

  const inputStyle: React.CSSProperties = {
    height: '56px',
    backgroundColor: '#ffffff',
    border: '1px solid #e7e7e7',
    borderRadius: '16px',
    padding: '0 16px',
    fontFamily: font,
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '-0.45px',
    color: '#151515',
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: font,
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '-0.24px',
    color: '#848484',
    display: 'block',
    marginBottom: '6px',
  };

  const isValid = idea.trim().length >= 2;
  const hasAnyImage = generated?.results.some(r => r.result_image_url) ?? false;

  return (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="w-full max-w-[440px] relative">

        {/* 헤더 — NavigationHeader 공통 컴포넌트 */}
        <NavigationHeader title="테스트 만들기" onBack={() => {
          if (generated?.testId && !published) {
            discardTest(generated.testId);
          }
          navigate(-1);
        }} />

        <div style={{ padding: '24px 20px 100px', paddingTop: '84px', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {/* Step 1: 아이디어 입력 */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col"
                style={{ gap: '24px' }}
              >
                <div>
                  <p style={{
                    fontFamily: font, fontSize: '22px', fontWeight: 600,
                    lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
                  }}>
                    어떤 테스트를<br />만들고 싶으세요?
                  </p>
                  <p style={{
                    fontFamily: font, fontSize: '15px', fontWeight: 400,
                    lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
                    marginTop: '8px',
                  }}>
                    아이디어만 입력하면 AI가 자동으로 만들어줘요
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>아이디어</label>
                  <textarea
                    value={idea}
                    onChange={(e) => { setIdea(e.target.value); setError(''); }}
                    placeholder="예: 미래 남편 얼굴은?, 바람끼 테스트"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid #e7e7e7',
                      fontFamily: font,
                      fontSize: '15px',
                      fontWeight: 400,
                      lineHeight: '22px',
                      letterSpacing: '-0.45px',
                      color: '#151515',
                      resize: 'none',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>

                {/* 레퍼런스 이미지 첨부 */}
                <div>
                  <label style={labelStyle}>레퍼런스 이미지 (선택)</label>
                  <p style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    lineHeight: '18px', letterSpacing: '-0.24px', color: '#b7b7b7',
                    marginBottom: '8px',
                  }}>
                    첨부하면 이 이미지 스타일을 참고해서 결과 이미지를 생성해요
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {referencePreview ? (
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid #e7e7e7',
                      }}
                    >
                      <img
                        src={referencePreview}
                        alt="레퍼런스 이미지"
                        style={{
                          width: '100%',
                          maxHeight: '240px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      {/* 삭제 버튼 */}
                      <button
                        onClick={handleRemoveImage}
                        className="flex items-center justify-center cursor-pointer"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          border: 'none',
                          color: '#ffffff',
                          fontFamily: font,
                          fontSize: '14px',
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                      {/* 파일명 */}
                      <div
                        className="flex items-center"
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f9f9f9',
                          gap: '6px',
                        }}
                      >
                        <span style={{
                          fontFamily: font, fontSize: '12px', fontWeight: 400,
                          color: '#6d6d6d',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {referenceImage?.name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center cursor-pointer"
                      style={{
                        height: '120px',
                        borderRadius: '16px',
                        border: '1.5px dashed #d5d5d5',
                        backgroundColor: '#fafafa',
                        gap: '8px',
                        transition: 'border-color 0.15s ease',
                      }}
                      onPointerEnter={e => { e.currentTarget.style.borderColor = '#48b2af'; }}
                      onPointerLeave={e => { e.currentTarget.style.borderColor = '#d5d5d5'; }}
                    >
                      <span style={{ fontSize: '28px', lineHeight: 1 }}>🖼️</span>
                      <span style={{
                        fontFamily: font, fontSize: '13px', fontWeight: 400,
                        lineHeight: '18px', letterSpacing: '-0.26px', color: '#848484',
                      }}>
                        이미지를 첨부해주세요
                      </span>
                      <span style={{
                        fontFamily: font, fontSize: '11px', fontWeight: 400,
                        color: '#b7b7b7',
                      }}>
                        JPG, PNG, WEBP · 최대 10MB
                      </span>
                    </button>
                  )}
                </div>

                {error && (
                  <p style={{ fontFamily: font, fontSize: '12px', color: '#d4183d' }}>{error}</p>
                )}

                {/* 예시 아이디어 */}
                <div className="flex flex-col" style={{ gap: '8px' }}>
                  <p style={{
                    fontFamily: font, fontSize: '12px', fontWeight: 400,
                    lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484',
                  }}>
                    아이디어 예시
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['미래 남편 얼굴은?', '바람끼 테스트', '난 테무인간인걸까', '최애와 나의 궁합', '전생에 나는 뭐였을까'].map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setIdea(ex)}
                        className="flex items-center justify-center cursor-pointer"
                        style={{
                          height: '28px',
                          padding: '0 12px',
                          borderRadius: '9999px',
                          backgroundColor: '#f9f9f9',
                          border: '1px solid #e7e7e7',
                          fontFamily: font,
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#6d6d6d',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA 56px */}
                <button
                  onClick={handleGenerate}
                  disabled={!isValid}
                  className="w-full flex items-center justify-center cursor-pointer"
                  style={{
                    height: '56px',
                    borderRadius: '16px',
                    backgroundColor: isValid ? '#48b2af' : '#f8f8f8',
                    border: 'none',
                    transition: 'all 0.15s ease',
                    marginTop: '8px',
                  }}
                  onPointerDown={e => { if (isValid) e.currentTarget.style.transform = 'scale(0.99)'; }}
                  onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                >
                  <span style={{
                    fontFamily: font, fontSize: '16px', fontWeight: 500,
                    lineHeight: '25px', letterSpacing: '-0.32px',
                    color: isValid ? '#ffffff' : '#b7b7b7',
                  }}>
                    AI로 만들기
                  </span>
                </button>
              </motion.div>
            )}

            {/* Step 2: 생성 중 */}
            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center"
                style={{ paddingTop: '120px', gap: '24px' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#E4F7F7' }}
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    style={{ fontSize: '32px' }}
                  >
                    🎰
                  </motion.span>
                </div>

                <div className="flex flex-col items-center" style={{ gap: '8px' }}>
                  <p style={{
                    fontFamily: font, fontSize: '18px', fontWeight: 600,
                    lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
                    textAlign: 'center',
                  }}>
                    테스트를 만들고 있어요
                  </p>
                  <p style={{
                    fontFamily: font, fontSize: '15px', fontWeight: 400,
                    lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
                    textAlign: 'center',
                  }}>
                    AI가 10가지 유형의 결과를 생성 중...
                  </p>
                </div>

                <div
                  className="overflow-hidden"
                  style={{ width: '200px', height: '4px', borderRadius: '2px', backgroundColor: '#f3f3f3' }}
                >
                  <motion.div
                    style={{ height: '100%', borderRadius: '2px', backgroundColor: '#48b2af' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 15, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: 검토 */}
            {step === 'review' && generated && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
                style={{ gap: '20px', paddingBottom: '80px' }}
              >
                <div>
                  <p style={{
                    fontFamily: font, fontSize: '22px', fontWeight: 600,
                    lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
                  }}>
                    테스트가 완성됐어요!
                  </p>
                  <p style={{
                    fontFamily: font, fontSize: '15px', fontWeight: 400,
                    lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
                    marginTop: '4px',
                  }}>
                    제목과 설명을 수정할 수 있어요
                  </p>
                </div>

                {/* 제목 수정 */}
                <div>
                  <label style={labelStyle}>제목</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={inputStyle}
                    maxLength={50}
                  />
                </div>

                {/* 설명 수정 */}
                <div>
                  <label style={labelStyle}>설명</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid #e7e7e7',
                      fontFamily: font,
                      fontSize: '15px',
                      fontWeight: 400,
                      lineHeight: '22px',
                      letterSpacing: '-0.45px',
                      color: '#151515',
                      resize: 'none',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                    maxLength={100}
                  />
                </div>

                {/* 유형 뱃지 */}
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <span style={{
                    backgroundColor: '#f0f8f8',
                    color: '#41a09e',
                    fontFamily: font,
                    fontSize: '10px',
                    fontWeight: 600,
                    lineHeight: '15px',
                    padding: '1px 4px',
                    borderRadius: '4px',
                  }}>
                    {generated.templateType === 'compatibility' ? '궁합' :
                     generated.templateType === 'adult' ? '19+' : '테스트'}
                  </span>
                  {generated.isAdult && (
                    <span style={{
                      backgroundColor: '#fff6f7',
                      color: '#ef6878',
                      fontFamily: font,
                      fontSize: '10px',
                      fontWeight: 600,
                      lineHeight: '15px',
                      padding: '1px 4px',
                      borderRadius: '4px',
                    }}>
                      성인
                    </span>
                  )}
                </div>

                {/* 다시 만들기 버튼들 */}
                <div className="flex" style={{ gap: '8px' }}>
                  <button
                    onClick={handleRegenerate}
                    className="flex-1 flex items-center justify-center cursor-pointer"
                    style={{
                      height: '40px',
                      borderRadius: '12px',
                      border: '1px solid #e7e7e7',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.15s ease',
                    }}
                    onPointerEnter={e => { e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                    onPointerLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    <span style={{
                      fontFamily: font, fontSize: '13px', fontWeight: 500,
                      lineHeight: '18px', letterSpacing: '-0.26px', color: '#6d6d6d',
                    }}>
                      기획 다시하기
                    </span>
                  </button>
                  <button
                    onClick={handleRegenerateImages}
                    disabled={imagesLoading}
                    className="flex-1 flex items-center justify-center cursor-pointer"
                    style={{
                      height: '40px',
                      borderRadius: '12px',
                      border: '1px solid #e7e7e7',
                      backgroundColor: '#ffffff',
                      opacity: imagesLoading ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                    onPointerEnter={e => { if (!imagesLoading) e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
                    onPointerLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                  >
                    <span style={{
                      fontFamily: font, fontSize: '13px', fontWeight: 500,
                      lineHeight: '18px', letterSpacing: '-0.26px', color: '#6d6d6d',
                    }}>
                      {hasAnyImage ? '이미지 다시 만들기' : '이미지 만들기'}
                    </span>
                  </button>
                </div>

                {/* 10개 결과 미리보기 */}
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                    <p style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 600,
                      lineHeight: '22px', letterSpacing: '-0.32px', color: '#151515',
                    }}>
                      10가지 유형 결과
                    </p>
                    {imagesLoading && (
                      <span style={{
                        fontFamily: font, fontSize: '12px', fontWeight: 400, color: '#848484',
                      }}>
                        이미지 생성 중...
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col" style={{ gap: '8px' }}>
                    {generated.results.map((r) => (
                      <div
                        key={r.day_master}
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e7e7e7',
                        }}
                      >
                        {/* 결과 이미지 */}
                        {regeneratingDayMasters.has(r.day_master) ? (
                          <div
                            className="flex flex-col items-center justify-center"
                            style={{
                              marginBottom: '12px',
                              borderRadius: '12px',
                              aspectRatio: '3/4',
                              backgroundColor: '#f9f9f9',
                              gap: '8px',
                            }}
                          >
                            <motion.span
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                              style={{ fontSize: '24px' }}
                            >
                              🎨
                            </motion.span>
                            <span style={{
                              fontFamily: font, fontSize: '12px', fontWeight: 400, color: '#848484',
                            }}>
                              이미지 생성 중...
                            </span>
                          </div>
                        ) : r.result_image_url ? (
                          <div style={{ position: 'relative', marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}>
                            <img
                              src={r.result_image_url}
                              alt={r.result_title}
                              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                            />
                            <button
                              onClick={() => handleRegenerateSingleImage(r.day_master)}
                              className="flex items-center justify-center cursor-pointer"
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.45)',
                                border: 'none',
                                color: '#ffffff',
                                fontFamily: font,
                                fontSize: '16px',
                                lineHeight: 1,
                              }}
                              title="이미지 다시 만들기"
                            >
                              ↻
                            </button>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                          <div className="flex items-center" style={{ gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{elementEmoji[r.day_master] || '✨'}</span>
                            <span style={{
                              fontFamily: font, fontSize: '14px', fontWeight: 600,
                              lineHeight: '20px', letterSpacing: '-0.42px', color: '#151515',
                            }}>
                              {r.result_title}
                            </span>
                          </div>
                          <span style={{
                            backgroundColor: r.score >= 70 ? '#E4F7F7' : r.score >= 40 ? '#FFF8E1' : '#fff6f7',
                            color: r.score >= 70 ? '#41a09e' : r.score >= 40 ? '#f5a623' : '#ef6878',
                            fontFamily: font,
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                          }}>
                            {r.result_label || `${r.score}점`}
                          </span>
                        </div>
                        <p style={{
                          fontFamily: font, fontSize: '13px', fontWeight: 400,
                          lineHeight: '20px', letterSpacing: '-0.26px', color: '#6d6d6d',
                        }}>
                          {r.result_description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {error && <p style={{ fontFamily: font, fontSize: '12px', color: '#d4183d' }}>{error}</p>}

                {/* 게시 버튼 — 하단 고정 */}
                <div
                  className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px]"
                  style={{ padding: '12px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #f3f3f3' }}
                >
                  <button
                    onClick={handlePublish}
                    className="w-full flex items-center justify-center cursor-pointer"
                    style={{
                      height: '56px',
                      borderRadius: '16px',
                      backgroundColor: '#48b2af',
                      border: 'none',
                      transition: 'transform 0.1s ease',
                    }}
                    onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
                    onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                    onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
                  >
                    <span style={{
                      fontFamily: font, fontSize: '16px', fontWeight: 500,
                      lineHeight: '25px', letterSpacing: '-0.32px', color: '#ffffff',
                    }}>
                      게시하기
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: 게시 중 */}
            {step === 'publishing' && (
              <motion.div
                key="publishing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center"
                style={{ paddingTop: '120px', gap: '24px' }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#E4F7F7' }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={{ fontSize: '32px' }}
                  >
                    🚀
                  </motion.span>
                </div>
                <p style={{
                  fontFamily: font, fontSize: '18px', fontWeight: 600,
                  lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
                }}>
                  게시하는 중...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default UnteCreatePage;
