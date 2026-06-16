'use client';

/**
 * PlpRiskPanel — "Is PLP safe?" panel.
 *
 * Shows:
 *   1. Utilization meter (plpUtilizationBps — bigint, no float)
 *   2. Idle vs allocated capital breakdown
 *   3. Payout liability vs total capital
 *   4. ±σ "what-if" on PLP NAV (purely illustrative — labelled as such)
 *
 * All money stays in bigint until the final display format call.
 * The ±σ sim is display-only geometry (floats fine) — clearly labelled
 * "illustrative" per CLAUDE.md claim discipline.
 */

import * as React from 'react';
import { motion } from 'motion/react';
import { springMeter, DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import {
  formatDusdc,
  formatBps,
  plpUtilizationBps,
} from '@metador/deepbook';
import type { PlpState } from '@metador/deepbook';

interface PlpRiskPanelProps {
  plp: PlpState;
  className?: string;
}

// ── Utilization bar ───────────────────────────────────────────────────────────

function utilizationColor(bps: bigint): string {
  if (bps >= 9000n) return 'var(--metador-danger)';
  if (bps >= 7500n) return 'var(--metador-warn)';
  return 'var(--metador-primary)';
}

function utilizationLabel(bps: bigint): string {
  if (bps >= 9000n) return 'CRITICAL';
  if (bps >= 7500n) return 'HIGH';
  if (bps >= 5000n) return 'MODERATE';
  return 'HEALTHY';
}

// ── ±σ what-if scenarios (display-only, illustrative) ─────────────────────────
// PLP NAV = idle + allocated − payoutLiability.
// A +1σ move (typical sub-hour BTC ≈ 1.5%) fully pays out a fraction of liability.
// These are rough illustrative bands, clearly labelled, not risk model outputs.

interface Scenario {
  label: string;
  description: string;
  navImpactBps: number; // basis points of NAV impact (illustrative)
  color: string;
}

function buildScenarios(plp: PlpState): Scenario[] {
  // NAV = idle + allocated − liability
  const nav = plp.idleBalance + plp.allocatedCapital - plp.payoutLiability;
  // liability as fraction of nav (display-only float)
  const liabilityFrac =
    nav > 0n ? Number(plp.payoutLiability) / Number(nav) : 0;

  return [
    {
      label: '+2σ adverse',
      description:
        'BTC moves sharply into most live ranges — ~60% of payout liability triggers.',
      navImpactBps: -Math.round(liabilityFrac * 60 * 100),
      color: 'var(--metador-danger)',
    },
    {
      label: '+1σ adverse',
      description:
        'BTC moves moderately — ~25% of payout liability triggers.',
      navImpactBps: -Math.round(liabilityFrac * 25 * 100),
      color: 'var(--metador-warn)',
    },
    {
      label: 'Flat / neutral',
      description:
        'BTC ends outside all open ranges — full premium retained by PLP.',
      navImpactBps: Math.round(
        Number(plp.allocatedCapital * 100n) / Number(nav > 0n ? nav : 1n),
      ),
      color: 'var(--metador-success)',
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlpRiskPanel({ plp, className }: PlpRiskPanelProps) {
  const utilBps = plpUtilizationBps(plp);
  const utilPct = Number(utilBps) / 100; // display-only
  const fillColor = utilizationColor(utilBps);
  const fillLabel = utilizationLabel(utilBps);
  const totalCapital = plp.idleBalance + plp.allocatedCapital;
  const nav = totalCapital - plp.payoutLiability;
  const scenarios = buildScenarios(plp);

  // Liability as % of total capital (display-only)
  const liabilityPct =
    totalCapital > 0n
      ? Number((plp.payoutLiability * 10000n) / totalCapital) / 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
      className={['flex flex-col gap-4', className].filter(Boolean).join(' ')}
      aria-label="PLP risk panel"
    >
      {/* Utilization meter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xs uppercase tracking-widest text-muted">
            Pool utilization
          </span>
          <span
            className="text-2xs font-mono font-medium uppercase tracking-widest"
            style={{ color: fillColor, fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {fillLabel}
          </span>
        </div>
        <div
          className="relative h-1.5 rounded-full bg-raised overflow-hidden"
          role="progressbar"
          aria-valuenow={utilPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`PLP utilization: ${formatBps(utilBps)}`}
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: utilPct / 100 }}
            transition={springMeter}
            aria-hidden="true"
            style={{ backgroundColor: fillColor }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-2xs text-muted font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
            {formatBps(utilBps)} utilized
          </span>
          <span className="text-2xs text-faint font-mono" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
            ${formatDusdc(totalCapital, 0)} total
          </span>
        </div>
      </div>

      {/* Capital breakdown */}
      <div className="grid grid-cols-2 gap-2">
        <CapitalStat
          label="Idle"
          value={`$${formatDusdc(plp.idleBalance, 0)}`}
          color="var(--metador-success)"
          note="Available for withdrawal"
        />
        <CapitalStat
          label="Allocated"
          value={`$${formatDusdc(plp.allocatedCapital, 0)}`}
          color="var(--metador-primary)"
          note="Backing active expiries"
        />
        <CapitalStat
          label="Payout liability"
          value={`$${formatDusdc(plp.payoutLiability, 0)}`}
          color="var(--metador-warn)"
          note={`${liabilityPct.toFixed(1)}% of capital`}
        />
        <CapitalStat
          label="Net pool NAV"
          value={nav >= 0n ? `$${formatDusdc(nav, 0)}` : `-$${formatDusdc(-nav, 0)}`}
          color={nav >= 0n ? 'var(--metador-text)' : 'var(--metador-danger)'}
          note="Capital − liability"
        />
      </div>

      {/* ±σ what-if scenarios */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xs uppercase tracking-widest text-muted">
            ±σ NAV impact
          </span>
          <span
            className="px-1.5 py-px text-2xs rounded-xs border"
            style={{
              borderColor: 'var(--metador-warn)',
              color: 'var(--metador-warn)',
              backgroundColor: 'var(--metador-tint-warn)',
            }}
          >
            Illustrative only
          </span>
        </div>
        <ul className="flex flex-col gap-1" aria-label="PLP NAV impact scenarios">
          {scenarios.map((s) => (
            <li
              key={s.label}
              className="flex items-start gap-3 px-3 py-2 rounded-xs bg-raised border border-border"
            >
              <span
                className="font-mono text-xs font-medium shrink-0 mt-px"
                style={{
                  color: s.color,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  minWidth: '80px',
                }}
              >
                {s.navImpactBps >= 0 ? '+' : ''}
                {(s.navImpactBps / 100).toFixed(1)}%
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-text font-medium">{s.label}</span>
                <span className="text-2xs text-muted leading-snug">{s.description}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-2xs text-faint leading-relaxed">
          Impact estimates assume uniform distribution of BTC move across open
          ranges. Actual payouts depend on settlement price. Not a risk model —
          for orientation only.
        </p>
      </div>
    </motion.div>
  );
}

function CapitalStat({
  label,
  value,
  color,
  note,
}: {
  label: string;
  value: string;
  color: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-raised rounded-xs px-3 py-2 border border-border">
      <span className="text-2xs uppercase tracking-widest text-muted">{label}</span>
      <span
        className="font-mono text-sm font-medium"
        style={{ color, fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {value}
      </span>
      <span className="text-2xs text-faint">{note}</span>
    </div>
  );
}
