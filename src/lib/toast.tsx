import { toast as sonnerToast, ExternalToast } from 'sonner';
import { Toast, ToastType, ToastVariant } from '../components/ui/Toast';

interface ToastOptions extends ExternalToast {
  subtitle?: string;
  variant?: ToastVariant;
}

const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
  const { subtitle, variant, ...rest } = options || {};
  sonnerToast.custom((t) => (
    <Toast type={type} message={message} subtitle={subtitle} variant={variant} />
  ), {
    duration: 3000,
    unstyled: true,
    ...rest,
  });
};

export const toast = {
  success: (message: string, options?: ToastOptions) => showToast('positive', message, options),
  error: (message: string, options?: ToastOptions) => showToast('negative', message, options),
  warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
  info: (message: string, options?: ToastOptions) => showToast('info', message, options),
  dismiss: sonnerToast.dismiss,
};
