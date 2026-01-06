import { toast as sonnerToast, ExternalToast } from 'sonner@2.0.3';
import { Toast, ToastType } from '../components/ui/Toast';

const showToast = (type: ToastType, message: string, options?: ExternalToast) => {
  sonnerToast.custom((t) => (
    <Toast type={type} message={message} />
  ), {
    duration: 3000,
    ...options,
  });
};

export const toast = {
  success: (message: string, options?: ExternalToast) => showToast('positive', message, options),
  error: (message: string, options?: ExternalToast) => showToast('negative', message, options),
  warning: (message: string, options?: ExternalToast) => showToast('warning', message, options),
  info: (message: string, options?: ExternalToast) => showToast('info', message, options),
  dismiss: sonnerToast.dismiss,
};
