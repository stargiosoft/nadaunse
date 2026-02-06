import { toast as sonnerToast, ExternalToast } from 'sonner';
import { Toast, ToastType, ToastVariant } from '../components/ui/Toast';

interface ToastOptions extends ExternalToast {
  subtitle?: string;
  variant?: ToastVariant;
  /**
   * 하단 고정 CTA가 있을 때 CTA 높이를 지정 (px)
   * 예: bottomOffset: 80 → Toast가 CTA 위 24px에 표시됨
   */
  bottomOffset?: number;
}

const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
  const { subtitle, variant, bottomOffset, ...rest } = options || {};

  // ⭐ bottomOffset이 있으면 CSS 변수 설정
  if (bottomOffset !== undefined) {
    setToastBottomOffset(bottomOffset);
  }

  sonnerToast.custom((t) => (
    <Toast type={type} message={message} subtitle={subtitle} variant={variant} />
  ), {
    duration: 3000,
    unstyled: true,
    ...rest,
  });
};

/**
 * Toast 위치를 동적으로 조정하기 위한 CSS 변수 설정
 * @param offset CTA 높이 등 하단 여백 (px)
 */
export const setToastBottomOffset = (offset: number) => {
  document.documentElement.style.setProperty('--toast-bottom-offset', `${offset}px`);
};

/**
 * Toast 위치를 기본값으로 리셋
 */
export const resetToastBottomOffset = () => {
  document.documentElement.style.setProperty('--toast-bottom-offset', '0px');
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
