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

  // 바텀시트 닫힐 때 복사 상태 초기화
  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

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

  // 공유 링크 생성
  const getShareUrl = useCallback(() => {
    if (isLoggedIn && status?.referralCode) {
      return generateShareLink(contentId, status.referralCode);
    }
    return `${window.location.origin}/product/${contentId}`;
  }, [contentId, isLoggedIn, status?.referralCode]);

  // 링크 복사
  const handleCopyLink = async () => {
    const url = getShareUrl();
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
    const shareUrl = getShareUrl();

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
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        {/* Handle bar (커스텀) */}
        <div className="shrink-0 flex items-center justify-center py-[12px]">
          <div style={{ width: '48px', height: '4px', backgroundColor: '#d4d4d4', borderRadius: '9999px' }} />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center" style={{ padding: '16px 20px 0 20px' }}>
          {/* Title */}
          <p style={{
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: '30px',
            letterSpacing: '-0.2px',
            textAlign: 'center',
            color: '#151515',
          }}>
            공유하면 <span style={{ color: '#48b2af' }}>30새싹</span> 받아요
          </p>

          {/* Subtitle */}
          <p style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: '20px',
            letterSpacing: '-0.28px',
            textAlign: 'center',
            color: '#999',
            marginTop: '10px',
          }}>
            {isLoggedIn
              ? '친구 1명이 가입하면 바로 적립돼요'
              : '로그인 후 공유하면 바로 적립돼요'}
          </p>

          {/* 자세히 보기 (로그인만) — pill 버튼 */}
          {isLoggedIn && (
            <button
              onClick={handleDetailClick}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                lineHeight: '18px',
                letterSpacing: '-0.26px',
                color: '#151515',
                marginTop: '16px',
                background: 'none',
                border: '1px solid #d4d4d4',
                borderRadius: '9999px',
                cursor: 'pointer',
                padding: '8px 20px',
              }}
            >
              자세히 보기
            </button>
          )}

          {/* Share buttons */}
          <div className="flex items-center justify-center" style={{ gap: '24px', marginTop: '32px', marginBottom: '16px' }}>
            {/* 링크 복사 */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center"
              style={{ gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: '88px', height: '88px', borderRadius: '22px', backgroundColor: '#f5f5f5' }}
              >
                <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
                  <path d="M7 12.8333C7 9.53401 7 7.88318 8.0255 6.85884C9.04983 5.83334 10.7007 5.83334 14 5.83334H17.5C20.7993 5.83334 22.4502 5.83334 23.4745 6.85884C24.5 7.88318 24.5 9.53401 24.5 12.8333V18.6667C24.5 21.966 24.5 23.6168 23.4745 24.6412C22.4502 25.6667 20.7993 25.6667 17.5 25.6667H14C10.7007 25.6667 9.04983 25.6667 8.0255 24.6412C7 23.6168 7 21.966 7 18.6667V12.8333Z" stroke="#999999" strokeWidth="1.5"/>
                  <path d="M7 22.1667C6.07174 22.1667 5.1815 21.7979 4.52513 21.1416C3.86875 20.4852 3.5 19.5949 3.5 18.6667V11.6667C3.5 7.26718 3.5 5.06684 4.86733 3.70068C6.23467 2.33451 8.43383 2.33334 12.8333 2.33334H17.5C18.4283 2.33334 19.3185 2.70209 19.9749 3.35847C20.6313 4.01485 21 4.90509 21 5.83334" stroke="#999999" strokeWidth="1.5"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 400, lineHeight: '18px', color: '#999' }}>
                {copied ? '복사 완료!' : '링크 복사'}
              </span>
            </button>

            {/* 카카오톡 공유 */}
            <button
              onClick={handleKakaoShare}
              className="flex flex-col items-center"
              style={{ gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: '88px', height: '88px', borderRadius: '22px', backgroundColor: '#FEE500' }}
              >
                <svg width="32" height="30" viewBox="0 0 25 23" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.0878 0C5.41326 0 0 4.27889 0 9.55729C0 12.9921 2.29413 16.0034 5.73533 17.6883C5.48148 18.6323 4.8199 21.1073 4.68821 21.6372C4.52321 22.294 4.9262 22.2861 5.19273 22.1084C5.40057 21.9703 8.50542 19.8602 9.84604 18.948C10.5727 19.0559 11.3215 19.113 12.0894 19.113C18.7655 19.113 24.1788 14.8341 24.1788 9.55729C24.1788 4.27889 18.764 0 12.0878 0Z" fill="#1F1F1F"/>
                </svg>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 400, lineHeight: '18px', color: '#999' }}>
                카카오톡 공유
              </span>
            </button>
          </div>
        </div>

        {/* 로그아웃: CTA 버튼 */}
        {!isLoggedIn && (
          <div className="shrink-0 w-full" style={{ padding: '12px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px' }}>
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
              whileTap={{ scale: 0.96 }}
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
          <div style={{ height: 'calc(32px + env(safe-area-inset-bottom, 0px))' }} />
        )}
      </DrawerContent>
    </Drawer>
  );
}
