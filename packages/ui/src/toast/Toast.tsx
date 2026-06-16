'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

export type ToastVariant = 'success' | 'danger' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const AUTO_DISMISS_MS = 4000;

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-surface border-success/40 text-text',
  danger: 'bg-surface border-danger/40 text-text',
  info: 'bg-surface border-border text-text',
};

const variantIcon: Record<ToastVariant, string> = {
  success: '✓',
  danger: '✕',
  info: 'ℹ',
};

const variantIconColor: Record<ToastVariant, string> = {
  success: 'text-success',
  danger: 'text-danger',
  info: 'text-muted',
};

function ToastItemView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = React.useCallback(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
  }, [onDismiss, toast.id]);

  React.useEffect(() => {
    scheduleClose();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleClose]);

  const handleMouseEnter = () => {
    setHovered(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    scheduleClose();
  };

  return (
    <motion.li
      key={toast.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: DURATIONS_S.base, ease: EASE_ENTER }}
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={[
        'flex items-start gap-3 px-4 py-3',
        'rounded-md border shadow-float',
        'min-w-[260px] max-w-sm',
        variantStyles[toast.variant],
        hovered ? 'opacity-100' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'text-sm font-medium mt-px select-none',
          variantIconColor[toast.variant],
        ].join(' ')}
        aria-hidden="true"
      >
        {variantIcon[toast.variant]}
      </span>
      <p className="text-sm flex-1 text-text">{toast.message}</p>
      {/* Dismiss — min 24×24 hit target (SC 2.5.8); × glyph stays small */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={[
          'inline-flex items-center justify-center min-w-[24px] min-h-[24px]',
          'text-muted hover:text-text',
          'transition-colors duration-(--metador-duration-fast)',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'rounded-xs',
          '-mr-1 -mt-0.5',
        ].join(' ')}
      >
        ×
      </button>
    </motion.li>
  );
}

/** Toast provider — wrap the app root. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
    },
    [],
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Viewport — bottom-right, z-toast */}
      <ol
        aria-label="Notifications"
        className="fixed bottom-4 right-4 flex flex-col gap-2 items-end"
        style={{ zIndex: 'var(--metador-z-toast)' }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItemView key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </ol>
    </ToastContext.Provider>
  );
}
