/**
 * @file ShareRewardModal.tsx
 * @description 공유 리워드 바텀시트 (로그인/로그아웃 분기)
 *
 * - 로그인: 공유 채널(카카오톡/링크복사) + "자세히 보기" 링크
 * - 로그아웃: 공유 채널 + "로그인하고 30새싹 받기" CTA
 *
 * @uses Drawer (vaul/shadcn-ui) 공통 바텀시트 컴포넌트
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Drawer, DrawerContent } from "./ui/drawer";
import { useShareRewardStatus } from "../hooks/useShareRewardStatus";
import { generateShareLink } from "../lib/shareRewardService";
import { trackShareModalOpen, trackShareLinkCopy, trackShareKakao } from "../utils/analytics";

declare global {
  interface Window {
    Kakao: any;
  }
}

interface ShareRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
}

export default function ShareRewardModal({
  isOpen,
  onClose,
  contentId,
}: ShareRewardModalProps) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('user');
  const { status } = useShareRewardStatus();
  const [copied, setCopied] = useState(false);

  // 바텀시트 열릴 때 GA 이벤트 + 닫힐 때 복사 상태 초기화
  useEffect(() => {
    if (isOpen) {
      trackShareModalOpen(contentId, isLoggedIn);
    } else {
      setCopied(false);
    }
  }, [isOpen, contentId, isLoggedIn]);

  // 모바일 상태바 딤 처리 (theme-color)
  useEffect(() => {
    if (isOpen) {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      const originalThemeColor = metaThemeColor.getAttribute('content');
      metaThemeColor.setAttribute('content', '#808080');

      return () => {
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', originalThemeColor || '#ffffff');
        }
      };
    }
  }, [isOpen]);

  // 공유 링크 생성 (UTM 파라미터 포함)
  const getShareUrl = useCallback((medium: 'kakao' | 'link_copy') => {
    const campaign = isLoggedIn ? 'reward' : 'general';
    const utm = `utm_source=share&utm_medium=${medium}&utm_campaign=${campaign}`;
    if (isLoggedIn && status?.referralCode) {
      return `${generateShareLink(contentId, status.referralCode)}&${utm}`;
    }
    return `${window.location.origin}/product/${contentId}?${utm}`;
  }, [contentId, isLoggedIn, status?.referralCode]);

  // 링크 복사
  const handleCopyLink = async () => {
    trackShareLinkCopy(contentId, isLoggedIn);
    const url = getShareUrl('link_copy');
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
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

  // 카카오톡 공유
  const handleKakaoShare = async () => {
    trackShareKakao(contentId, isLoggedIn);
    const shareUrl = getShareUrl('kakao');

    // Kakao SDK 로드 + 초기화
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
            title: '나다운세 - 나다운 운세를 만나보세요',
            description: '타로와 사주로 보는 나만의 운세',
            imageUrl: `${window.location.origin}/og-image.png`,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          buttons: [{
            title: '운세 확인하기',
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          }],
        });
        return;
      } catch (e) {
        console.error('카카오 공유 실패:', e);
      }
    }

    // fallback: Web Share API 또는 링크 복사
    if (navigator.share) {
      navigator.share({ title: '나다운세', url: shareUrl }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  // 로그인 이동
  const handleLogin = () => {
    onClose();
    localStorage.setItem('redirectAfterLogin', `/product/${contentId}`);
    navigate('/login/new');
  };

  // 자세히 보기
  const handleDetailClick = () => {
    onClose();
    navigate('/share-reward-info');
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} direction="bottom">
      <DrawerContent
        className="mx-auto max-w-[440px]"
        style={{
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}
      >
        {/* Handle bar (커스텀) */}
        <div className="shrink-0 flex items-center justify-center py-[12px]">
          <div style={{ width: '48px', height: '4px', backgroundColor: '#d4d4d4', borderRadius: '9999px' }} />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center" style={{ padding: `32px 20px ${isLoggedIn ? '0' : '32px'} 20px` }}>
          {/* Text section */}
          <div className="flex flex-col items-center w-full" style={{ gap: '10px' }}>
            {/* Title */}
            <p style={{
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: '32.5px',
              letterSpacing: '-0.22px',
              textAlign: 'center',
              color: '#151515',
            }}>
              공유하면 친구랑 나랑
              <br />
              서로 <span style={{ color: '#48b2af' }}>30새싹</span> 받아요
            </p>

            {/* Subtitle */}
            <p style={{
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '20px',
              letterSpacing: '-0.45px',
              textAlign: 'center',
              color: '#848484',
            }}>
              {isLoggedIn
                ? `친구 ${status?.requiredCount ?? 1}명이 가입하면 바로 적립돼요`
                : '로그인 후 공유하면 바로 적립돼요'}
            </p>
          </div>

          {/* 자세히 보기 (로그인만) */}
          {isLoggedIn && (
            <button
              onClick={handleDetailClick}
              style={{
                fontSize: '13px',
                fontWeight: 400,
                lineHeight: '19px',
                letterSpacing: '-0.26px',
                color: '#151515',
                marginTop: '20px',
                background: 'none',
                border: '1px solid #f3f3f3',
                borderRadius: '12px',
                cursor: 'pointer',
                padding: '6px 16px',
              }}
            >
              자세히 보기
            </button>
          )}

          {/* Share buttons */}
          <div className="flex items-center justify-center" style={{ gap: '36px', marginTop: isLoggedIn ? '36px' : '40px' }}>
            {/* 링크 복사 */}
            <motion.button
              onClick={handleCopyLink}
              className="flex flex-col items-center"
              style={{ gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f9f9f9' }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M7 12.8333C7 9.53401 7 7.88318 8.0255 6.85884C9.04983 5.83334 10.7007 5.83334 14 5.83334H17.5C20.7993 5.83334 22.4502 5.83334 23.4745 6.85884C24.5 7.88318 24.5 9.53401 24.5 12.8333V18.6667C24.5 21.966 24.5 23.6168 23.4745 24.6412C22.4502 25.6667 20.7993 25.6667 17.5 25.6667H14C10.7007 25.6667 9.04983 25.6667 8.0255 24.6412C7 23.6168 7 21.966 7 18.6667V12.8333Z" stroke="#848484" strokeWidth="1.5"/>
                  <path d="M7 22.1667C6.07174 22.1667 5.1815 21.7979 4.52513 21.1416C3.86875 20.4852 3.5 19.5949 3.5 18.6667V11.6667C3.5 7.26718 3.5 5.06684 4.86733 3.70068C6.23467 2.33451 8.43383 2.33334 12.8333 2.33334H17.5C18.4283 2.33334 19.3185 2.70209 19.9749 3.35847C20.6313 4.01485 21 4.90509 21 5.83334" stroke="#848484" strokeWidth="1.5"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 400, lineHeight: '22px', color: '#848484' }}>
                {copied ? '복사 완료!' : '링크 복사'}
              </span>
            </motion.button>

            {/* 카카오톡 공유 */}
            <motion.button
              onClick={handleKakaoShare}
              className="flex flex-col items-center"
              style={{ gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div
                className="flex items-center justify-center overflow-hidden"
                style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#FEE500' }}
              >
                <svg width="24" height="23" viewBox="0 0 25 23" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.0878 0C5.41326 0 0 4.27889 0 9.55729C0 12.9921 2.29413 16.0034 5.73533 17.6883C5.48148 18.6323 4.8199 21.1073 4.68821 21.6372C4.52321 22.294 4.9262 22.2861 5.19273 22.1084C5.40057 21.9703 8.50542 19.8602 9.84604 18.948C10.5727 19.0559 11.3215 19.113 12.0894 19.113C18.7655 19.113 24.1788 14.8341 24.1788 9.55729C24.1788 4.27889 18.764 0 12.0878 0Z" fill="#1F1F1F"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 400, lineHeight: '22px', color: '#848484' }}>
                카카오톡 공유
              </span>
            </motion.button>
          </div>
        </div>

        {/* 로그아웃: CTA 버튼 */}
        {!isLoggedIn && (
          <div
            className="shrink-0 w-full"
            style={{
              boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)',
              padding: `12px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px`,
            }}
          >
            <motion.button
              onClick={handleLogin}
              className="w-full flex items-center justify-center"
              style={{
                height: '56px',
                backgroundColor: '#48b2af',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
              }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <p style={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '25px',
                letterSpacing: '-0.32px',
                color: '#ffffff',
              }}>
                로그인하고 30새싹 받기
              </p>
            </motion.button>
          </div>
        )}

        {/* Safe area bottom padding (로그인 시) */}
        {isLoggedIn && (
          <div style={{ height: 'calc(62px + env(safe-area-inset-bottom, 0px))' }} />
        )}
      </DrawerContent>
    </Drawer>
  );
}
