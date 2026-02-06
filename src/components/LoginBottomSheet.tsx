/**
 * @file LoginBottomSheet.tsx
 * @description 비회원 일일 제한 도달 시 로그인 유도 바텀시트
 *
 * @pattern CouponBottomSheetNew.tsx 동일
 * - createPortal + framer-motion AnimatePresence
 * - 드래그 닫기 (80px threshold)
 * - body scroll lock + theme-color 딤 처리 (#808080)
 * - transform-gpu (iOS Safari 대응)
 *
 * @figma Figma 디자인 스펙 기반
 */

import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { useEffect } from "react";

interface LoginBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
}

export default function LoginBottomSheet({
  isOpen,
  onClose,
  contentId,
}: LoginBottomSheetProps) {
  // 로그인 후 돌아올 경로 저장 + 로그인 페이지 이동
  const handleNavigateToLogin = () => {
    localStorage.setItem('redirectAfterLogin', `/free/content/${contentId}`);
    window.location.href = '/login/new';
  };

  // ⭐ 상태바 딤 처리 및 스크롤 잠금 (CouponBottomSheetNew와 동일 패턴)
  useEffect(() => {
    if (isOpen) {
      // 1. Body 스크롤 잠금
      document.body.style.overflow = 'hidden';

      // 2. 모바일 상태바 딤 처리 (meta theme-color 변경)
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      const originalThemeColor = metaThemeColor.getAttribute('content');
      metaThemeColor.setAttribute('content', '#808080');

      return () => {
        document.body.style.overflow = '';
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', originalThemeColor || '#ffffff');
        }
      };
    }
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-none">
          {/* Background overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 touch-none pointer-events-auto"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ touchAction: 'none' }}
          />

          {/* Bottom sheet */}
          <motion.div
            className="relative w-full max-w-[440px] mx-auto bg-white rounded-t-[16px] flex flex-col overflow-hidden pointer-events-auto z-[10000] transform-gpu"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) {
                onClose();
              }
            }}
          >
            {/* Handle bar */}
            <div className="shrink-0 flex items-center justify-center py-[12px] cursor-grab active:cursor-grabbing">
              <div style={{ width: '48px', height: '4px', backgroundColor: '#d4d4d4', borderRadius: '9999px' }} />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center" style={{ padding: '28px 20px 24px 20px' }}>
              {/* Lock icon */}
              <div style={{ width: '74px', height: '77px', marginBottom: '16px' }}>
                <img
                  src="/lock-icon.svg"
                  alt="잠금 아이콘"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* 제목 */}
              <p style={{
                fontSize: '22px',
                fontWeight: 700,
                lineHeight: '32.5px',
                letterSpacing: '-0.22px',
                textAlign: 'center',
                color: '#151515',
                fontFamily: "'Pretendard Variable', sans-serif",
              }}>
                로그인하면 <span style={{ color: '#48b2af' }}>무제한 이용 가능</span>
              </p>

              {/* 부제 */}
              <div className="flex flex-col items-center" style={{ gap: '5px', marginTop: '12px' }}>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: '20px',
                  letterSpacing: '-0.45px',
                  textAlign: 'center',
                  color: '#848484',
                  fontFamily: "'Pretendard Variable', sans-serif",
                }}>
                  비회원은 하루 3개까지만 볼 수 있어요
                </p>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: '20px',
                  letterSpacing: '-0.45px',
                  textAlign: 'center',
                  color: '#848484',
                  fontFamily: "'Pretendard Variable', sans-serif",
                }}>
                  로그인하면 더 볼 수 있어요
                </p>
              </div>
            </div>

            {/* Button */}
            <div className="shrink-0 w-full bg-white" style={{ padding: '12px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px' }}>
              <motion.button
                onClick={handleNavigateToLogin}
                className="w-full flex items-center justify-center"
                style={{
                  height: '56px',
                  backgroundColor: '#48b2af',
                  borderRadius: '16px',
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
                  fontFamily: "'Pretendard Variable', sans-serif",
                }}>
                  로그인 하기
                </p>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
