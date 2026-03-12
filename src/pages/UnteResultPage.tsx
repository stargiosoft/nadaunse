/**
 * 운테 결과 페이지
 * 결과 카드 + 공유 버튼
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/ImageWithFallback';

declare global {
  interface Window {
    Kakao: { isInitialized: () => boolean; init: (key: string) => void; Share: { sendDefault: (params: Record<string, unknown>) => void } };
  }
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
    };
    partnerResult?: {
      dayMaster: string;
      element: string;
      resultTitle: string;
      resultDescription: string;
      resultImageUrl: string | null;
      score: number;
    } | null;
  };
  test: {
    id: string;
    title: string;
    template_type: string;
  };
}

export function UnteResultPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const state = location.state as ResultState | undefined;
  const result = state?.result;
  const test = state?.test;
  const myResult = result?.myResult;
  const partnerResult = result?.partnerResult;

  useEffect(() => {
    // 스크롤 리셋
    window.scrollTo(0, 0);
  }, []);

  if (!myResult || !test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#fafafa' }}>
        <p style={{ fontSize: '14px', color: '#888' }}>결과를 찾을 수 없어요</p>
        <button
          onClick={() => navigate(`/unte/${slug || ''}`)}
          className="px-6 py-2 rounded-full cursor-pointer"
          style={{ backgroundColor: '#48b2af', color: '#fff', fontSize: '14px', border: 'none' }}
        >
          돌아가기
        </button>
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
            imageUrl: myResult.shareImageUrl || myResult.resultImageUrl || `${window.location.origin}/og-image.png`,
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

    // fallback
    if (navigator.share) {
      navigator.share({ title: test.title, url: shareUrl }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleSaveImage = () => {
    const imageUrl = myResult.shareImageUrl || myResult.resultImageUrl;
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${test.title}-결과.webp`;
    link.target = '_blank';
    link.click();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#ff6b9d';
    if (score >= 60) return '#48b2af';
    if (score >= 40) return '#f5a623';
    return '#888';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="max-w-[440px] mx-auto px-4 py-6 pb-24">
        {/* 결과 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: '#fff' }}
        >
          {/* 결과 이미지 */}
          {myResult.resultImageUrl && (
            <div style={{ aspectRatio: '3/4' }}>
              <ImageWithFallback
                src={myResult.resultImageUrl}
                alt={myResult.resultTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 결과 텍스트 */}
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p style={{ fontSize: '12px', color: '#888' }}>{test.title}</p>
              {myResult.score && (
                <div
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: getScoreColor(myResult.score),
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 800,
                  }}
                >
                  {myResult.score}점
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', lineHeight: '1.3' }}>
              {myResult.resultTitle}
            </h2>

            <p style={{ fontSize: '15px', color: '#444', lineHeight: '1.7' }}>
              {myResult.resultDescription}
            </p>
          </div>
        </motion.div>

        {/* 궁합 상대 결과 */}
        {partnerResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-6 rounded-3xl"
            style={{ backgroundColor: '#fff' }}
          >
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>상대방 결과</p>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
              {partnerResult.resultTitle}
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', lineHeight: '1.6' }}>
              {partnerResult.resultDescription}
            </p>
          </motion.div>
        )}

        {/* 공유 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-col gap-3"
        >
          <button
            onClick={handleKakaoShare}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#FEE500', color: '#1a1a1a', fontSize: '15px', fontWeight: 700, border: 'none' }}
          >
            <span style={{ fontSize: '18px' }}>💬</span>
            카카오톡 공유
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '15px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {copied ? '복사 완료!' : '링크 복사'}
          </button>

          {(myResult.shareImageUrl || myResult.resultImageUrl) && (
            <button
              onClick={handleSaveImage}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 500, border: 'none' }}
            >
              이미지 저장
            </button>
          )}
        </motion.div>

        {/* 다른 테스트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => navigate('/unte')}
            className="cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}
          >
            다른 테스트 해보기 →
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default UnteResultPage;
