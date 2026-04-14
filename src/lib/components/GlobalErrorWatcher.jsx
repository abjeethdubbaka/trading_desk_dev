import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

function normalizeErrorMessage(errorLike) {
  if (!errorLike) return 'Unexpected runtime error';
  if (typeof errorLike === 'string') return errorLike;
  if (typeof errorLike.message === 'string' && errorLike.message.trim()) {
    return errorLike.message.trim();
  }
  return String(errorLike);
}

export default function GlobalErrorWatcher() {
  const lastErrorRef = useRef({ message: '', at: 0 });

  useEffect(() => {
    const emitErrorToast = (message) => {
      const normalized = normalizeErrorMessage(message);
      const now = Date.now();

      // Avoid repeating the same toast rapidly for noisy loops.
      if (
        lastErrorRef.current.message === normalized &&
        now - lastErrorRef.current.at < 3000
      ) {
        return;
      }

      lastErrorRef.current = { message: normalized, at: now };
      toast.error(normalized);
    };

    const handleWindowError = (event) => {
      emitErrorToast(event?.error || event?.message);
    };

    const handleUnhandledRejection = (event) => {
      emitErrorToast(event?.reason);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
