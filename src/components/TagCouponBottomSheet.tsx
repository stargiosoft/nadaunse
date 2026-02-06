/**
 * 태그 쿠폰 안내 바텀시트
 *
 * @description
 * - 프로모션 모드 (기본): 태그 5개 모으면 무료 쿠폰 지급 안내
 * - 태그 모으기 유도 모드 (remainingTags 제공 시): 남은 태그 수 안내
 * - 나다움 기록하기 페이지에서 태그 선택 유도용
 *
 * @props
 * - isOpen: boolean - 바텀시트 열림 상태
 * - onClose: () => void - 닫기 버튼 클릭 시
 * - onSelectTag: () => void - 태그 선택하기 버튼 클릭 시
 * - remainingTags?: number - 남은 태그 수 (1~4). 제공 시 태그 모으기 유도 모드
 */

import { AnimatePresence, motion } from 'motion/react';

// 쿠폰 아이콘 (public 폴더에서 로드)
const couponIconSrc = '/coupon-icon.svg';

interface TagCouponBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOverlayClick?: () => void; // 바텀시트 외부 클릭 시 (기본: onClose)
  onSelectTag: () => void;
  remainingTags?: number; // 남은 태그 수 (1~4) - 제공 시 태그 모으기 유도 모드
}

export default function TagCouponBottomSheet({
  isOpen,
  onClose,
  onOverlayClick,
  onSelectTag,
  remainingTags,
}: TagCouponBottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onOverlayClick || onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div
              className="w-full max-w-[440px] flex flex-col bg-white overflow-hidden"
              style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
            >
              {/* Handle */}
              <div
                className="flex items-center justify-center w-full shrink-0"
                style={{
                  padding: '12px 10px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '4px',
                    backgroundColor: '#d4d4d4',
                    borderRadius: '999px',
                  }}
                />
              </div>

              {/* Content Container */}
              <div
                className="flex flex-col items-center w-full"
                style={{
                  backgroundColor: '#ffffff',
                  padding: '36px 20px 34px 20px',
                }}
              >
                <div
                  className="flex flex-col items-center justify-center w-full"
                  style={{ gap: '24px' }}
                >
                  {/* Coupon Icon */}
                  <div
                    className="shrink-0"
                    style={{ width: '80px', height: '80px' }}
                  >
                    <img
                      src={couponIconSrc}
                      alt="쿠폰 아이콘"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  {/* Text Container */}
                  <div
                    className="flex flex-col items-center justify-center w-full"
                    style={{ gap: '7px', padding: '0 2px' }}
                  >
                    {/* Title */}
                    <p
                      className="text-center w-full"
                      style={{
                        fontFamily: 'Pretendard Variable, sans-serif',
                        fontWeight: 700,
                        fontSize: '22px',
                        lineHeight: '32.5px',
                        letterSpacing: '-0.22px',
                        color: '#151515',
                      }}
                    >
                      {remainingTags ? (
                        <>
                          <span>무료 쿠폰까지 </span>
                          <span style={{ color: '#FF6678' }}>태그 {remainingTags}개</span>
                          <span> 남았어요</span>
                        </>
                      ) : (
                        <>
                          <span>태그 5개</span>
                          <span>를 모으면 </span>
                          <span style={{ color: '#ff6678' }}>무료 쿠폰</span>
                          <span> 지급 !</span>
                        </>
                      )}
                    </p>

                    {/* Subtitle */}
                    <div
                      className="flex items-center justify-center"
                      style={{ padding: '0 2px' }}
                    >
                      <p
                        className="text-center"
                        style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontWeight: 400,
                          fontSize: '16px',
                          lineHeight: '25px',
                          letterSpacing: '-0.32px',
                          color: '#525252',
                        }}
                      >
                        {remainingTags
                          ? '태그 5개를 모으면 무료 쿠폰 지급돼요'
                          : '지금, 첫 태그를 선택해 보세요'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Button Container */}
              <div
                className="flex flex-col items-start w-full shrink-0"
                style={{
                  boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
                }}
              >
                <div
                  className="flex flex-col items-center justify-center w-full"
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px 20px',
                  }}
                >
                  {/* Button Group */}
                  <div
                    className="flex items-start w-full"
                    style={{ gap: '12px' }}
                  >
                    {/* Close Button (Secondary) */}
                    <motion.button
                      onClick={onClose}
                      className="flex-1 flex items-center justify-center"
                      style={{
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: '#FFF6F7',
                        padding: '0 12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span
                        style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '25px',
                          letterSpacing: '-0.32px',
                          color: '#FF6678',
                        }}
                      >
                        닫기
                      </span>
                    </motion.button>

                    {/* Select Tag Button (Primary) */}
                    <motion.button
                      onClick={onSelectTag}
                      className="flex-1 flex items-center justify-center"
                      style={{
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: '#FF6678',
                        padding: '0 12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span
                        style={{
                          fontFamily: 'Pretendard Variable, sans-serif',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '25px',
                          letterSpacing: '-0.32px',
                          color: '#ffffff',
                        }}
                      >
                        태그 선택하기
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Safe Area (for iPhone home indicator) */}
              <div
                style={{
                  height: 'env(safe-area-inset-bottom, 0px)',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
