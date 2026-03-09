import { toast as sonnerToast, ExternalToast } from 'sonner';
import { Toast, ToastType, ToastVariant } from '../components/ui/Toast';

interface ToastOptions extends ExternalToast {
  subtitle?: string;
  variant?: ToastVariant;
  /**
   * 하단 고정 CTA가 있을 때 CTA 높이를 지정 (px)
   * 예: bottomOffset: 80 → Toast가 CTA 위 12px (= 80 + 12)에 표시됨
   */
  bottomOffset?: number;
}

const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
  const { subtitle, variant, bottomOffset, onDismiss, onAutoClose, ...rest } = options || {};

  // ⭐ bottomOffset 지정 시 설정, 없으면 즉시 리셋 (이전 CTA 오프셋 제거)
  if (bottomOffset !== undefined) {
    setToastBottomOffset(bottomOffset);
  } else {
    resetToastBottomOffset();
  }

  sonnerToast.custom((t) => (
    <Toast type={type} message={message} subtitle={subtitle} variant={variant} />
  ), {
    duration: 3000,
    unstyled: true,
    // ⭐ 토스트 사라질 때 오프셋 리셋 (CTA 위 토스트가 끝난 후 기본값 복원)
    onDismiss: (t) => {
      if (bottomOffset !== undefined) resetToastBottomOffset();
      onDismiss?.(t);
    },
    onAutoClose: (t) => {
      if (bottomOffset !== undefined) resetToastBottomOffset();
      onAutoClose?.(t);
    },
    ...rest,
  });
};

/**
 * Toast 위치를 동적으로 조정하기 위한 CSS 변수 설정
 * @param offset CTA 높이 등 하단 여백 (px)
 */
export const setToastBottomOffset = (ctaHeight: number) => {
  document.documentElement.style.setProperty('--toast-bottom-offset', `${ctaHeight + 12}px`);
};

/**
 * Toast 위치를 기본값으로 리셋 (safe-area + 16px 복원)
 */
export const resetToastBottomOffset = () => {
  document.documentElement.style.removeProperty('--toast-bottom-offset');
};

export const toast = {
  success: (message: string, options?: ToastOptions) => showToast('positive', message, options),
  error: (message: string, options?: ToastOptions) => showToast('negative', message, options),
  warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
  info: (message: string, options?: ToastOptions) => showToast('info', message, options),
  dismiss: sonnerToast.dismiss,
  setBottomOffset: setToastBottomOffset,
  resetBottomOffset: resetToastBottomOffset,
};
