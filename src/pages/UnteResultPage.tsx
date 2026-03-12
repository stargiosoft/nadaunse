/**
 * 운테 결과 페이지
 * ★DESIGN_SYSTEM★ 기반 — 결과 카드 + 공유 버튼
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

const font = "'Pretendard Variable', sans-serif";

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
    window.scrollTo(0, 0);
  }, []);

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
          <div className="flex flex-col" style={{ padding: '24px 20px', gap: '16px' }}>
            <div className="flex items-center justify-between">
              <p style={{
                fontFamily: font, fontSize: '12px', fontWeight: 400,
                lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484',
              }}>
                {test.title}
              </p>
              {myResult.score && (
                <span style={{
                  backgroundColor: getScoreBg(myResult.score),
                  color: getScoreColor(myResult.score),
                  fontFamily: font,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                }}>
                  {myResult.score}점
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

        {/* 궁합 상대 결과 */}
        {partnerResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              margin: '12px 20px 0',
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e7e7e7',
            }}
          >
            <p style={{
              fontFamily: font, fontSize: '12px', fontWeight: 400,
              lineHeight: '16px', letterSpacing: '-0.24px', color: '#848484',
              marginBottom: '8px',
            }}>
              상대방 결과
            </p>
            <p style={{
              fontFamily: font, fontSize: '18px', fontWeight: 600,
              lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#151515',
            }}>
              {partnerResult.resultTitle}
            </p>
            <p style={{
              fontFamily: font, fontSize: '14px', fontWeight: 400,
              lineHeight: '22px', letterSpacing: '-0.42px', color: '#6d6d6d',
              marginTop: '8px',
            }}>
              {partnerResult.resultDescription}
            </p>
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
          {(myResult.shareImageUrl || myResult.resultImageUrl) && (
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

export default UnteResultPage;
