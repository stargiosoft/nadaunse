/**
 * 운테 테스트 랜딩 페이지
 * ★DESIGN_SYSTEM★ 기반 — 썸네일 + 제목 + 참여자수 + 시작 CTA
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import AgeVerificationGate from '../components/AgeVerificationGate';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Skeleton } from '../components/ui/skeleton';
import { TopNavigation } from '../components/FreeContentDetailComponents';

const font = "'Pretendard Variable', sans-serif";

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

  // 시스템 뒤로가기 / 스와이프 뒤로가기 → 운테 리스트로 이동
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      navigate('/unte', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

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

  /* 로딩 */
  if (loading) {
    return (
      <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-[440px] relative">
          <Skeleton className="w-full" style={{ aspectRatio: '1/1', borderRadius: 0 }} />
          <div style={{ padding: '20px' }}>
            <Skeleton style={{ height: '28px', width: '70%', borderRadius: '8px' }} />
            <Skeleton style={{ height: '18px', width: '90%', borderRadius: '6px', marginTop: '12px' }} />
            <Skeleton style={{ height: '14px', width: '30%', borderRadius: '4px', marginTop: '12px' }} />
          </div>
        </div>
      </div>
    );
  }

  /* 404 */
  if (notFound || !test) {
    return (
      <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-[440px] relative flex flex-col items-center justify-center" style={{ paddingTop: '120px', gap: '20px' }}>
          <div
            className="flex items-center justify-center"
            style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#f9f9f9' }}
          >
            <span style={{ fontSize: '32px' }}>😢</span>
          </div>
          <div className="flex flex-col items-center" style={{ gap: '8px' }}>
            <p style={{
              fontFamily: font, fontSize: '18px', fontWeight: 600,
              lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
              textAlign: 'center',
            }}>
              테스트를 찾을 수 없어요
            </p>
            <p style={{
              fontFamily: font, fontSize: '15px', fontWeight: 400,
              lineHeight: '26px', letterSpacing: '-0.3px', color: '#848484',
              textAlign: 'center',
            }}>
              삭제되었거나 존재하지 않는 테스트예요
            </p>
          </div>
          <button
            onClick={() => navigate('/unte')}
            className="flex items-center justify-center cursor-pointer"
            style={{
              height: '48px', padding: '0 32px', borderRadius: '16px',
              backgroundColor: '#48b2af', border: 'none', transition: 'transform 0.1s ease',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <span style={{
              fontFamily: font, fontSize: '15px', fontWeight: 500,
              lineHeight: '20px', letterSpacing: '-0.45px', color: '#ffffff',
            }}>
              다른 테스트 보기
            </span>
          </button>
        </div>
      </div>
    );
  }

  const typeBg = test.template_type === 'compatibility' ? '#fff6f7' : '#f0f8f8';
  const typeColor = test.template_type === 'compatibility' ? '#ef6878' : '#41a09e';
  const typeLabel = test.template_type === 'compatibility' ? '궁합' : '테스트';

  const content = (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="w-full max-w-[440px] relative flex flex-col min-h-screen">

        {/* 공통 헤더 */}
        <TopNavigation
          title="운세 테스트"
          onBack={() => navigate('/unte')}
          onHome={() => navigate('/')}
        />

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
              style={{ backgroundColor: '#f9f9f9' }}
            >
              <span style={{ fontSize: '80px' }}>
                {test.template_type === 'compatibility' ? '💑' : '🎰'}
              </span>
            </div>
          )}

          {/* 뱃지 */}
          <div className="absolute" style={{ top: '12px', left: '12px' }}>
            <span style={{
              backgroundColor: typeBg,
              color: typeColor,
              fontFamily: font,
              fontSize: '10px',
              fontWeight: 600,
              lineHeight: '15px',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              {typeLabel}
            </span>
          </div>
        </div>

        {/* 텍스트 + CTA */}
        <div className="flex flex-col flex-1" style={{ padding: '20px 20px 0' }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col" style={{ gap: '8px' }}
          >
            <p style={{
              fontFamily: font, fontSize: '22px', fontWeight: 600,
              lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
            }}>
              {test.title}
            </p>

            {test.description && (
              <p style={{
                fontFamily: font, fontSize: '15px', fontWeight: 400,
                lineHeight: '26px', letterSpacing: '-0.3px', color: '#6d6d6d',
              }}>
                {test.description}
              </p>
            )}

            <p style={{
              fontFamily: font, fontSize: '12px', fontWeight: 400,
              lineHeight: '16px', letterSpacing: '-0.24px', color: '#b7b7b7',
              marginTop: '4px',
            }}>
              {formatCount(test.play_count)}명 참여
            </p>
          </motion.div>
        </div>

        {/* CTA — 하단 고정 */}
        <div style={{ padding: '16px 20px 32px' }}>
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate(`/unte/${slug}/play`, { state: { testId: test.id, test } })}
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
              시작하기
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );

  if (test.is_adult) {
    return <AgeVerificationGate testId={test.id}>{content}</AgeVerificationGate>;
  }

  return content;
}

export default UnteLandingPage;
