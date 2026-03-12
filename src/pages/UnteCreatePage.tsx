/**
 * 운테 테스트 생성 페이지
 * ★DESIGN_SYSTEM★ 기반 — 아이디어 입력 → AI 생성 → 검토/승인
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, supabaseUrl } from '../lib/supabase';

interface GeneratedResult {
  day_master: string;
  result_title: string;
  result_description: string;
  score: number;
  result_label?: string;
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const handleGenerate = async () => {
    if (!idea.trim() || idea.trim().length < 2) {
      setError('아이디어를 2글자 이상 입력해주세요');
      return;
    }

    setStep('generating');
    setError('');

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-viral-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), creatorId: userId }),
      });

      const text = await response.text();
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

      navigate(`/unte/${generated.slug}`);
    } catch (err) {
      console.error('게시 실패:', err);
      setError(err instanceof Error ? err.message : '게시에 실패했습니다.');
      setStep('review');
    }
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

  return (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="w-full max-w-[440px] relative">

        {/* 헤더 — 52px */}
        <div
          className="sticky top-0 z-10"
          style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f3f3f3' }}
        >
          <div
            className="flex items-center"
            style={{ height: '52px', padding: '0 20px', gap: '12px' }}
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: '32px', height: '32px',
                background: 'none', border: 'none',
                fontFamily: font, fontSize: '18px', color: '#151515',
              }}
            >
              ←
            </button>
            <span style={{
              fontFamily: font, fontSize: '18px', fontWeight: 600,
              lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
            }}>
              테스트 만들기
            </span>
          </div>
        </div>

        <div style={{ padding: '24px 20px 100px', overflow: 'hidden' }}>
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

                {/* 10개 결과 미리보기 */}
                <div>
                  <p style={{
                    fontFamily: font, fontSize: '16px', fontWeight: 600,
                    lineHeight: '22px', letterSpacing: '-0.32px', color: '#151515',
                    marginBottom: '12px',
                  }}>
                    10가지 유형 결과
                  </p>
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
