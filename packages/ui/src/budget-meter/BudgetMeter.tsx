'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { springMeter } from '@metador/design-system';
import { formatBaseUnits } from '@metador/deepbook';

export interface BudgetMeterProps {
  spent: bigint;
  budget: bigint;
  quoteDecimals: number;
  quoteSymbol: string;
  className?: string;
}

/**
 * Compute fill percentage using pure bigint math (CLAUDE.md §1).
 * Returns a value in [0, 100].
 * Guard: if budget === 0n returns 0 (no divide by zero).
 */
export function computeFillPercent(spent: bigint, budget: bigint): number {
  if (budget === 0n) return 0;
  // Multiply by 10000 first to get 2 decimal places of precision, then divide
  const tenThousandths = (spent * 10000n) / budget;
  // Cap at 10000 (100%) — spent can exceed budget at 100% locked
  const capped = tenThousandths > 10000n ? 10000n : tenThousandths;
  return Number(capped) / 100;
}

/** Returns 'normal' | 'warn' | 'locked' based on fill pct. */
function fillState(pct: number): 'normal' | 'warn' | 'locked' {
  if (pct >= 100) return 'locked';
  if (pct >= 80) return 'warn';
  return 'normal';
}

const WarnIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    className="inline-block align-middle"
  >
    <path
      d="M6 1L11 10H1L6 1z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M6 5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
  </svg>
);

/**
 * Budget meter — live depleting bar for spent-vs-ceiling.
 * Fill animates via springMeter (scaleX from origin-left — NOT width).
 * ≥80% → warn color + icon; 100% → locked.
 * Below bar: "spent / ceiling" in mono with formatted values.
 */
export function BudgetMeter({
  spent,
  budget,
  quoteDecimals,
  quoteSymbol,
  className,
}: BudgetMeterProps) {
  const pct = computeFillPercent(spent, budget);
  const state = fillState(pct);

  const barColor =
    state === 'locked'
      ? 'bg-faint'
      : state === 'warn'
        ? 'bg-warn'
        : 'bg-primary';

  const labelColor =
    state === 'locked'
      ? 'text-faint'
      : state === 'warn'
        ? 'text-warn'
        : 'text-muted';

  const spentFormatted = formatBaseUnits(spent, quoteDecimals);
  const budgetFormatted = budget === 0n ? '0' : formatBaseUnits(budget, quoteDecimals);

  return (
    <div
      className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Budget used: ${spentFormatted} of ${budgetFormatted} ${quoteSymbol} spent`}
    >
      {/* Track */}
      <div className="relative h-1.5 rounded-full bg-raised overflow-hidden">
        <motion.div
          className={['absolute inset-y-0 left-0 w-full origin-left rounded-full', barColor].join(' ')}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={springMeter}
          aria-hidden="true"
        />
      </div>

      {/* Labels */}
      <div
        className={[
          'flex items-center justify-between text-xs font-mono',
          labelColor,
        ].join(' ')}
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        <span className="flex items-center gap-1">
          {state === 'warn' && <WarnIcon />}
          <span>
            {spentFormatted}
            <span className="text-faint mx-1">/</span>
            {budgetFormatted}
            <span className="ml-1 text-faint">{quoteSymbol}</span>
          </span>
        </span>
        <span
          className={[
            'text-2xs uppercase tracking-widest',
            state === 'locked' ? 'text-faint' : labelColor,
          ].join(' ')}
        >
          {state === 'locked' ? 'LOCKED' : `${pct.toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
}
