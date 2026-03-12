/**
 * 운테 테스트 생성 페이지
 * 아이디어 입력 → AI 생성 → 검토/승인
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
}

interface GeneratedTest {
  testId: string;
  slug: string;
  title: string;
  description: string;
  templateType: string;
  isAdult: boolean;
  results: GeneratedResult[];
}

type Step = 'input' | 'generating' | 'review' | 'publishing';

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

      const data = await response.json();

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
      // 제목/설명 수정 반영
      if (editTitle !== generated.title || editDescription !== generated.description) {
        await supabase.from('viral_tests').update({
          title: editTitle,
          description: editDescription,
          updated_at: new Date().toISOString(),
        }).eq('id', generated.testId);
      }

      // 게시
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        // 비로그인 — 직접 업데이트
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* 헤더 */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div className="max-w-[440px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none', fontSize: '20px' }}
          >
            ←
          </button>
          <p style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a' }}>테스트 만들기</p>
        </div>
      </div>

      <div className="max-w-[440px] mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: 아이디어 입력 */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', lineHeight: '1.4' }}>
                  어떤 테스트를<br />만들고 싶으세요?
                </p>
                <p style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
                  아이디어만 입력하면 AI가 자동으로 만들어줘요
                </p>
              </div>

              <textarea
                value={idea}
                onChange={(e) => { setIdea(e.target.value); setError(''); }}
                placeholder="예: 미래 남편 얼굴은?, 바람끼 테스트, 최애와 나의 궁합은?"
                rows={4}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1.5px solid #e5e5e5',
                  fontSize: '15px',
                  resize: 'none',
                  outline: 'none',
                  backgroundColor: '#fff',
                  lineHeight: '1.5',
                }}
              />

              {error && (
                <p style={{ fontSize: '13px', color: '#ff4444' }}>{error}</p>
              )}

              {/* 예시 아이디어 */}
              <div className="flex flex-col gap-2">
                <p style={{ fontSize: '13px', color: '#aaa', fontWeight: 600 }}>아이디어 예시</p>
                <div className="flex flex-wrap gap-2">
                  {['미래 남편 얼굴은?', '바람끼 테스트', '난 테무인간인걸까', '최애와 나의 궁합', '전생에 나는 뭐였을까'].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setIdea(ex)}
                      className="px-3 py-1.5 rounded-full cursor-pointer"
                      style={{
                        backgroundColor: '#f5f5f5',
                        border: 'none',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!idea.trim()}
                className="w-full py-4 rounded-2xl cursor-pointer"
                style={{
                  backgroundColor: idea.trim() ? '#48b2af' : '#ddd',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                AI로 만들기
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
              className="flex flex-col items-center justify-center py-20 gap-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                style={{ fontSize: '48px' }}
              >
                🎰
              </motion.div>
              <div className="text-center">
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                  테스트를 만들고 있어요
                </p>
                <p style={{ fontSize: '14px', color: '#888', marginTop: '8px' }}>
                  AI가 10가지 유형의 결과를 생성 중...
                </p>
              </div>
              <motion.div
                className="w-48 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: '#e5e5e5' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: '#48b2af' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 15, ease: 'easeOut' }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Step 3: 검토 */}
          {step === 'review' && generated && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 pb-24"
            >
              <div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                  테스트가 완성됐어요!
                </p>
                <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
                  제목과 설명을 수정할 수 있어요
                </p>
              </div>

              {/* 제목 수정 */}
              <div>
                <label style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e5e5',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  maxLength={50}
                />
              </div>

              {/* 설명 수정 */}
              <div>
                <label style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>설명</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    marginTop: '6px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e5e5',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none',
                  }}
                  maxLength={100}
                />
              </div>

              {/* 유형 표시 */}
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: '#f0f8f8',
                    color: '#48b2af',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {generated.templateType === 'compatibility' ? '궁합 테스트' :
                   generated.templateType === 'adult' ? '19+ 테스트' : '슬롯머신 테스트'}
                </span>
                {generated.isAdult && (
                  <span
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#fff0f0', color: '#ff4444', fontSize: '12px', fontWeight: 600 }}
                  >
                    성인
                  </span>
                )}
              </div>

              {/* 10개 결과 미리보기 */}
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>
                  10가지 유형 결과
                </p>
                <div className="flex flex-col gap-3">
                  {generated.results.map((r) => (
                    <div
                      key={r.day_master}
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '20px' }}>{elementEmoji[r.day_master] || '✨'}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>
                            {r.result_title}
                          </span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: r.score >= 70 ? '#e8f5e9' : r.score >= 40 ? '#fff8e1' : '#fce4ec',
                            color: r.score >= 70 ? '#2e7d32' : r.score >= 40 ? '#f57f17' : '#c62828',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {r.score}점
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                        {r.result_description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p style={{ fontSize: '13px', color: '#ff4444' }}>{error}</p>}

              {/* 게시 버튼 */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] p-4" style={{ backgroundColor: '#fff', borderTop: '1px solid #f0f0f0' }}>
                <button
                  onClick={handlePublish}
                  className="w-full py-4 rounded-2xl cursor-pointer"
                  style={{
                    backgroundColor: '#48b2af',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 700,
                    border: 'none',
                  }}
                >
                  게시하기
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
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                style={{ fontSize: '48px' }}
              >
                🚀
              </motion.div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>
                게시하는 중...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UnteCreatePage;
