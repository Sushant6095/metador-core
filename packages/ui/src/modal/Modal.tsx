'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Rendered in the modal's aria-labelledby */
  title: string;
  /** Accessible description (aria-describedby) */
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Focus trap: returns the first and last focusable elements in a container. */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  );
}

/**
 * Portal modal — scrim via --metador-overlay (flat opacity, no backdrop-filter per
 * DESIGN.md), panel bg-raised shadow-modal radius-lg.
 * Motion: scale .96→1 + opacity 0→1 on enter; reversed on exit.
 * Focus trap: first focusable on open, restore on close, Escape closes.
 *
 * Accessibility structure:
 *   Portal root
 *   ├── scrim div  aria-hidden="true"  (decorative backdrop, click-to-close)
 *   └── role="dialog"  aria-modal  aria-labelledby  (keyboard + AT target)
 *
 * The scrim and the dialog panel are SIBLINGS so aria-hidden on the scrim
 * does NOT hide the dialog from the accessibility tree (WAI-ARIA §aria-hidden).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const labelId = React.useId();
  const descId = React.useId();
  const triggerRef = React.useRef<HTMLElement | null>(null);

  // Capture the element that triggered open so we can restore focus on close
  React.useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Focus the first focusable element when the panel mounts
  const handlePanelMount = React.useCallback((node: HTMLDivElement | null) => {
    (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (node) {
      const focusable = getFocusableElements(node);
      focusable[0]?.focus();
    }
  }, []);

  // Restore focus on close
  React.useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [open]);

  // Trap focus inside the modal
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        /*
         * Wrapper: positions both children (scrim + dialog) as siblings in
         * the same stacking context. The wrapper itself has no ARIA role.
         */
        <div
          className="fixed inset-0"
          style={{ zIndex: 'var(--metador-z-modal)' }}
        >
          {/* Scrim — decorative backdrop only; aria-hidden so AT ignores it */}
          <motion.div
            key="modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATIONS_S.fast, ease: EASE_ENTER }}
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--metador-overlay)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — the dialog sits as a sibling of the scrim */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={handlePanelMount}
              key="modal-panel"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{
                duration: DURATIONS_S.slow,
                ease: EASE_ENTER,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelId}
              aria-describedby={description ? descId : undefined}
              onKeyDown={handleKeyDown}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className={[
                'relative bg-raised rounded-lg shadow-modal pointer-events-auto',
                'w-full max-w-lg max-h-[90vh] overflow-y-auto',
                'focus-visible:outline-none',
                className,
              ]
                .filter(Boolean)
                .join(' ')}
              // Panel itself needs to be keyboard-accessible for the trap
              tabIndex={-1}
            >
              <h2
                id={labelId}
                className="sr-only"
              >
                {title}
              </h2>
              {description && (
                <p id={descId} className="sr-only">
                  {description}
                </p>
              )}
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
