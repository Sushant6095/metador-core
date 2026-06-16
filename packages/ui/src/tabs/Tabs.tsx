'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { DURATIONS_S, EASE_STANDARD } from '@metador/design-system';

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** Stable id for layoutId — must be unique per page if multiple Tabs exist */
  layoutId?: string;
  className?: string;
}

/**
 * Derive the DOM id used for a tab button.
 * Callers place `id={tabId(layoutId, value)}` on the tab button (internal).
 */
function tabId(layoutId: string, value: string): string {
  return `${layoutId}-tab-${value}`;
}

/**
 * Derive the DOM id used for the associated tab panel.
 * Export so callers can wire `id` + `aria-labelledby` on their panel elements:
 *
 *   <div
 *     role="tabpanel"
 *     id={tabPanelId('my-tabs', 'overview')}
 *     aria-labelledby={tabPanelId('my-tabs', 'overview').replace('panel', 'tab')}
 *   >
 *
 * Or simpler: use the exported helper pair together.
 */
export function tabPanelId(layoutId: string, value: string): string {
  return `${layoutId}-panel-${value}`;
}

/**
 * Roving tabindex tabs with brass underline indicator via Motion layoutId.
 * Indicator animates on transform only (no width/position animation).
 *
 * Accessibility:
 *   - role="tablist" on wrapper
 *   - Each button: role="tab" aria-selected aria-controls={panelId} id={tabId}
 *   - Callers MUST add role="tabpanel" id={tabPanelId(layoutId, value)}
 *     aria-labelledby={tabId(layoutId, value)} to their panel content.
 *   - Use tabPanelId() export to derive the panel id in consuming code.
 */
export function Tabs({
  items,
  value,
  onChange,
  layoutId = 'tabs-indicator',
  className,
}: TabsProps) {
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleKeyDown = (e: React.KeyboardEvent, currentValue: string) => {
    const idx = items.findIndex((t) => t.value === currentValue);
    let nextIdx: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % items.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = items.length - 1;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      const nextItem = items[nextIdx];
      if (nextItem) {
        onChange(nextItem.value);
        tabRefs.current.get(nextItem.value)?.focus();
      }
    }
  };

  return (
    <div
      role="tablist"
      className={[
        'flex items-end gap-0 border-b border-border relative',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((tab) => {
        const isSelected = tab.value === value;
        const tid = tabId(layoutId, tab.value);
        const panelId = tabPanelId(layoutId, tab.value);
        return (
          <button
            key={tab.value}
            id={tid}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.value, el);
              else tabRefs.current.delete(tab.value);
            }}
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, tab.value)}
            className={[
              'relative px-4 py-2 text-sm font-medium',
              'transition-colors duration-(--metador-duration-fast)',
              isSelected ? 'text-primary' : 'text-muted',
              'hover:text-text',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'rounded-t-xs',
            ].join(' ')}
          >
            {tab.label}
            {/* Brass underline — animate via layoutId (transform only) */}
            {isSelected && (
              <motion.span
                layoutId={layoutId}
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
                transition={{
                  duration: DURATIONS_S.fast,
                  ease: EASE_STANDARD,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
