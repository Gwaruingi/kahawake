import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export const toast = ({
  title,
  message,
  type = 'info',
  duration = 5000,
}: ToastOptions) => {
  switch (type) {
    case 'success':
      return sonnerToast.success(title, {
        description: message,
        duration,
      });
    case 'error':
      return sonnerToast.error(title, {
        description: message,
        duration,
      });
    case 'warning':
      return sonnerToast.warning(title, {
        description: message,
        duration,
      });
    case 'info':
    default:
      return sonnerToast.info(title, {
        description: message,
        duration,
      });
  }
};
