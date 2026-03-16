/**
 * 운테 결과 페이지
 * ★DESIGN_SYSTEM★ 기반 — 결과 카드 + 공유 버튼
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { supabase } from '../lib/supabase';
import { generateShareCardBlob } from '../utils/generateShareCard';

declare global {
  interface Window {
    Kakao: { isInitialized: () => boolean; init: (key: string) => void; Share: { sendDefault: (params: Record<string, unknown>) => void } };
  }
}

const font = "'Pretendard Variable', sans-serif";

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A0';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B0';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C0';
  if (score >= 65) return 'D+';
  if (score >= 60) return 'D0';
  return 'F';
}

function formatLabel(label: string | null | undefined, score: number, format?: string): string {
  if (label) return label;
  if (format === 'grade') return scoreToGrade(score);
  if (format === 'percentage') return `${score}%`;
  if (format === 'type') return '???';
  return `${score}점`;
}

interface ResultState {
  result: {
    myResult: {
      dayMaster: string;
      element: string;
      resultTitle: string;
      resultDescription: string;
      resultImageUrl: string | null;
      shareImageUrl: string | null;
      score: number;
      resultLabel?: string | null;
      relationType?: string | null;
    };
    partnerDayMaster?: string | null;
    relationType?: string | null;
    isCompatibility?: boolean;
  };
  test: {
    id: string;
    title: string;
    template_type: string;
    result_format?: string;
  };
}

export function UnteResultPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const shareCardGenerated = useRef(false);

  const state = location.state as ResultState | undefined;
  const result = state?.result;
  const test = state?.test;
  const myResult = result?.myResult;
  const isCompatibility = result?.isCompatibility;
  const relationType = result?.relationType;

  useEffect(() => {
    window.scrollTo(0, 0);

    // 시스템 뒤로가기 / 스와이프 뒤로가기 → 운테 리스트로 이동
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      navigate('/unte', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // AI 이미지가 없을 때 Canvas로 공유 카드 생성 → Storage 업로드
  useEffect(() => {
    if (!myResult || !test) return;
    if (myResult.shareImageUrl || myResult.resultImageUrl) return;
    if (shareCardGenerated.current) return;
    shareCardGenerated.current = true;

    (async () => {
      try {
        const blob = await generateShareCardBlob({
          label: formatLabel(myResult.resultLabel, myResult.score, test.result_format),
          score: myResult.score,
          element: myResult.element,
          title: myResult.resultTitle,
          testTitle: test.title,
        });

        const path = `viral-tests/${test.id}/share-card-${myResult.dayMaster}.png`;
        const { error } = await supabase.storage
          .from('assets')
          .upload(path, blob, { contentType: 'image/png', upsert: true });

        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
          setGeneratedShareUrl(publicUrl);
        }
      } catch (e) {
        console.error('공유 카드 생성 실패:', e);
      }
    })();
  }, [myResult, test]);

  if (!myResult || !test) {
    return (
      <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-[440px] relative flex flex-col items-center justify-center" style={{ paddingTop: '120px', gap: '20px' }}>
          <div
            className="flex items-center justify-center"
            style={{ width: '76px', height: '76px', borderRadius: '24px', backgroundColor: '#f9f9f9' }}
          >
            <span style={{ fontSize: '32px' }}>😢</span>
          </div>
          <p style={{
            fontFamily: font, fontSize: '18px', fontWeight: 600,
            lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
          }}>
            결과를 찾을 수 없어요
          </p>
          <button
            onClick={() => navigate(`/unte/${slug || ''}`)}
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
              돌아가기
            </span>
          </button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/unte/${slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKakaoShare = async () => {
    if (!window.Kakao) {
      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (e) {
        console.error('카카오 SDK 로드 실패:', e);
      }
    }

    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init('da0e07cca0c104a3b59f79a24911587c');
      }
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `${test.title} - 내 결과: ${myResult.resultTitle}`,
            description: myResult.resultDescription.slice(0, 50),
            imageUrl: myResult.shareImageUrl || myResult.resultImageUrl || generatedShareUrl || `${window.location.origin}/og-image.png`,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          buttons: [{
            title: '나도 해보기',
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          }],
        });
        return;
      } catch (e) {
        console.error('카카오 공유 실패:', e);
      }
    }

    if (navigator.share) {
      navigator.share({ title: test.title, url: shareUrl }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleSaveImage = () => {
    const imageUrl = myResult.shareImageUrl || myResult.resultImageUrl || generatedShareUrl;
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${test.title}-결과.${imageUrl.endsWith('.png') ? 'png' : 'webp'}`;
    link.target = '_blank';
    link.click();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#ef6878';
    if (score >= 60) return '#48b2af';
    if (score >= 40) return '#f5a623';
    return '#b7b7b7';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return '#fff6f7';
    if (score >= 60) return '#E4F7F7';
    if (score >= 40) return '#FFF8E1';
    return '#f9f9f9';
  };

  return (
    <div className="relative min-h-screen w-full flex justify-center" style={{ backgroundColor: '#f9f9f9' }}>
      <div className="w-full max-w-[440px] relative" style={{ padding: '0 0 40px' }}>

        {/* 결과 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden"
          style={{ backgroundColor: '#ffffff', borderRadius: '0 0 24px 24px' }}
        >
          {/* 결과 비주얼 */}
          {myResult.resultImageUrl ? (
            <div style={{ aspectRatio: '3/4' }}>
              <ImageWithFallback
                src={myResult.resultImageUrl}
                alt={myResult.resultTitle}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            /* 이미지 없을 때: resultLabel 강조 비주얼 카드 */
            <ResultLabelCard
              label={formatLabel(myResult.resultLabel, myResult.score, test?.result_format)}
              score={myResult.score}
              element={myResult.element}
              title={myResult.resultTitle}
            />
          )}

          {/* 결과 텍스트 */}
          <div className="flex flex-col" style={{ padding: '24px 20px', gap: '16px' }}>
            <div className="flex items-center justify-between">
              <p style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484',
              }}>
                {test.title}
              </p>
              {/* 이미지가 있을 때만 작은 뱃지 표시 (이미지 없으면 카드에서 이미 강조) */}
              {myResult.resultImageUrl && myResult.score && (
                <span style={{
                  backgroundColor: getScoreBg(myResult.score),
                  color: getScoreColor(myResult.score),
                  fontFamily: font,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                }}>
                  {formatLabel(myResult.resultLabel, myResult.score, test?.result_format)}
                </span>
              )}
            </div>

            <p style={{
              fontFamily: font, fontSize: '22px', fontWeight: 600,
              lineHeight: '32.5px', letterSpacing: '-0.22px', color: '#151515',
            }}>
              {myResult.resultTitle}
            </p>

            <p style={{
              fontFamily: font, fontSize: '15px', fontWeight: 400,
              lineHeight: '26px', letterSpacing: '-0.3px', color: '#6d6d6d',
            }}>
              {myResult.resultDescription}
            </p>
          </div>
        </motion.div>

        {/* 궁합 관계 뱃지 */}
        {isCompatibility && relationType && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center"
            style={{
              margin: '12px 20px 0',
              padding: '12px 20px',
              borderRadius: '16px',
              backgroundColor: '#f0f8f8',
              border: '1px solid #d4eeee',
            }}
          >
            <span style={{
              fontFamily: font, fontSize: '14px', fontWeight: 500,
              lineHeight: '20px', letterSpacing: '-0.42px', color: '#41a09e',
            }}>
              💑 둘의 궁합 유형
            </span>
          </motion.div>
        )}

        {/* 공유 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col"
          style={{ margin: '16px 20px 0', gap: '8px' }}
        >
          {/* 카카오톡 */}
          <button
            onClick={handleKakaoShare}
            className="w-full flex items-center justify-center cursor-pointer"
            style={{
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#FEE500',
              border: 'none',
              gap: '8px',
              transition: 'transform 0.1s ease',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <span style={{ fontSize: '16px' }}>💬</span>
            <span style={{
              fontFamily: font, fontSize: '15px', fontWeight: 600,
              letterSpacing: '-0.3px', color: '#151515',
            }}>
              카카오톡 공유
            </span>
          </button>

          {/* 링크 복사 */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center cursor-pointer"
            style={{
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e7e7e7',
              transition: 'transform 0.1s ease',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
            onPointerUp={e => { e.currentTarget.style.transform = ''; }}
            onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            <span style={{
              fontFamily: font, fontSize: '15px', fontWeight: 500,
              letterSpacing: '-0.3px', color: copied ? '#48b2af' : '#6d6d6d',
            }}>
              {copied ? '복사 완료!' : '링크 복사'}
            </span>
          </button>

          {/* 이미지 저장 */}
          {(myResult.shareImageUrl || myResult.resultImageUrl || generatedShareUrl) && (
            <button
              onClick={handleSaveImage}
              className="w-full flex items-center justify-center cursor-pointer"
              style={{
                height: '52px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e7e7e7',
                transition: 'transform 0.1s ease',
              }}
              onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onPointerUp={e => { e.currentTarget.style.transform = ''; }}
              onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              <span style={{
                fontFamily: font, fontSize: '15px', fontWeight: 500,
                letterSpacing: '-0.3px', color: '#6d6d6d',
              }}>
                이미지 저장
              </span>
            </button>
          )}
        </motion.div>

        {/* 다른 테스트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center"
          style={{ marginTop: '24px' }}
        >
          <button
            onClick={() => navigate('/unte')}
            className="cursor-pointer"
            style={{
              background: 'none', border: 'none',
              fontFamily: font, fontSize: '14px', fontWeight: 400,
              letterSpacing: '-0.42px', color: '#b7b7b7',
            }}
          >
            다른 테스트 해보기 →
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* ── 이미지 없을 때 라벨 강조 비주얼 카드 ──────────────────────────── */

const ELEMENT_GRADIENT: Record<string, { from: string; to: string; accent: string }> = {
  '목': { from: '#e8f5e9', to: '#c8e6c9', accent: '#43a047' },
  '화': { from: '#fce4ec', to: '#f8bbd0', accent: '#e53935' },
  '토': { from: '#fff8e1', to: '#ffecb3', accent: '#f9a825' },
  '금': { from: '#f3e5f5', to: '#e1bee7', accent: '#8e24aa' },
  '수': { from: '#e3f2fd', to: '#bbdefb', accent: '#1e88e5' },
};

const ELEMENT_EMOJI: Record<string, string> = {
  '목': '🌿', '화': '🔥', '토': '🌏', '금': '⚡', '수': '💧',
};

function ResultLabelCard({
  label,
  score,
  element,
  title,
}: {
  label: string;
  score: number;
  element: string;
  title: string;
}) {
  const grad = ELEMENT_GRADIENT[element] || ELEMENT_GRADIENT['토'];
  const emoji = ELEMENT_EMOJI[element] || '✨';

  // 라벨이 %인지 판단
  const isPercentage = label.includes('%');
  const numericValue = parseInt(label.replace(/[^0-9]/g, ''), 10) || score;

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        aspectRatio: '1/1',
        background: `linear-gradient(160deg, ${grad.from} 0%, ${grad.to} 50%, #ffffff 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 장식 원 */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-20%',
        width: '60%', height: '60%', borderRadius: '50%',
        background: `radial-gradient(circle, ${grad.from} 0%, transparent 70%)`,
        opacity: 0.5,
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%',
        width: '40%', height: '40%', borderRadius: '50%',
        background: `radial-gradient(circle, ${grad.to} 0%, transparent 70%)`,
        opacity: 0.4,
      }} />

      {/* 이모지 */}
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
        style={{ fontSize: '48px', marginBottom: '12px' }}
      >
        {emoji}
      </motion.span>

      {/* 메인 라벨 (% 또는 점수) */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="flex items-baseline justify-center"
        style={{ gap: '2px' }}
      >
        <span style={{
          fontFamily: font,
          fontSize: isPercentage ? '80px' : '64px',
          fontWeight: 800,
          lineHeight: '1',
          color: grad.accent,
          letterSpacing: '-2px',
        }}>
          {isPercentage ? label.replace('%', '') : numericValue}
        </span>
        <span style={{
          fontFamily: font,
          fontSize: '32px',
          fontWeight: 700,
          color: grad.accent,
          opacity: 0.7,
        }}>
          {isPercentage ? '%' : '점'}
        </span>
      </motion.div>

      {/* 부제 */}
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontFamily: font, fontSize: '16px', fontWeight: 600,
          lineHeight: '24px', letterSpacing: '-0.32px',
          color: '#151515', marginTop: '16px',
          textAlign: 'center', padding: '0 32px',
        }}
      >
        {title}
      </motion.p>

      {/* 게이지 바 (하단) */}
      <div style={{
        width: '60%', height: '8px', borderRadius: '4px',
        backgroundColor: 'rgba(0,0,0,0.06)', marginTop: '20px',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${numericValue}%` }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: '4px',
            backgroundColor: grad.accent,
          }}
        />
      </div>
    </div>
  );
}

export default UnteResultPage;
