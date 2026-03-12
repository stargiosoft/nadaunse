/**
 * 운테 테스트 랜딩 페이지
 * 썸네일 + 제목 + 참여자수 + 시작 CTA
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import AgeVerificationGate from '../components/AgeVerificationGate';
import { ImageWithFallback } from '../components/ImageWithFallback';

interface TestData {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  play_count: number;
  template_type: string;
  is_adult: boolean;
}

export function UnteLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadTest();
  }, [slug]);

  const loadTest = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_tests')
        .select('id, slug, title, description, thumbnail_url, play_count, template_type, is_adult')
        .eq('slug', slug)
        .eq('status', 'live')
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setTest(data);

      // view_count 증가
      supabase.from('viral_tests')
        .update({ view_count: (data.play_count || 0) + 1 })
        .eq('id', data.id)
        .then(() => {});
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (n: number): string => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
    return n.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fafafa' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          style={{ fontSize: '40px' }}
        >
          🎰
        </motion.div>
      </div>
    );
  }

  if (notFound || !test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: '#fafafa' }}>
        <span style={{ fontSize: '48px' }}>😢</span>
        <p style={{ fontSize: '16px', color: '#888' }}>테스트를 찾을 수 없어요</p>
        <button
          onClick={() => navigate('/unte')}
          className="px-6 py-2.5 rounded-full cursor-pointer"
          style={{ backgroundColor: '#48b2af', color: '#fff', fontSize: '14px', fontWeight: 600, border: 'none' }}
        >
          다른 테스트 보기
        </button>
      </div>
    );
  }

  const content = (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="max-w-[440px] mx-auto w-full flex flex-col flex-1">
        {/* 썸네일 */}
        <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
          {test.thumbnail_url ? (
            <ImageWithFallback
              src={test.thumbnail_url}
              alt={test.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: '#2a2a4e' }}
            >
              <span style={{ fontSize: '80px' }}>
                {test.template_type === 'compatibility' ? '💑' : '🎰'}
              </span>
            </div>
          )}

          {/* 그라데이션 오버레이 */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '120px',
              background: 'linear-gradient(transparent, #1a1a2e)',
            }}
          />
        </div>

        {/* 텍스트 영역 */}
        <div className="px-6 -mt-4 relative z-10 flex flex-col gap-4 flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '26px', fontWeight: 800, color: '#fff', lineHeight: '1.3' }}
          >
            {test.title}
          </motion.h1>

          {test.description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}
            >
              {test.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              {formatCount(test.play_count)}명 참여
            </span>
          </motion.div>
        </div>

        {/* CTA 버튼 */}
        <div className="px-6 pb-8 pt-8 mt-auto">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/unte/${slug}/play`, { state: { testId: test.id, test } })}
            className="w-full py-4 rounded-2xl cursor-pointer"
            style={{
              backgroundColor: '#48b2af',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 800,
              border: 'none',
            }}
          >
            시작하기
          </motion.button>
        </div>
      </div>
    </div>
  );

  // 성인 콘텐츠면 게이트 적용
  if (test.is_adult) {
    return <AgeVerificationGate testId={test.id}>{content}</AgeVerificationGate>;
  }

  return content;
}

export default UnteLandingPage;
