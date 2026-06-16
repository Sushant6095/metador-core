'use client';

/**
 * /screener — Vault leaderboard (G2 preview on mock data).
 *
 * Density contract (docs/research/refs/hyperscreener.asxn.xyz/patterns.md):
 *   standard data row: 40px (8px py + 24px content cap)
 *   data cells: 13px mono tabular, right-aligned numerics
 *   column headers: 12px muted uppercase, low-contrast, recede
 *   identifier columns flush left; numbers flush right (decimals stack)
 *   divider-delimited KPI strip, oversized values, no card chrome
 *   sticky header; ≥500 rows windowed; inline 7d sparkline
 *
 * Divergence (CLAUDE.md §8): brass/slate palette + Geist Mono numerals +
 * Fraunces display — reads as Metador, never the benchmark's mint/grotesk.
 *
 * URL state: ?strategy=all|delegate|dca &status=all|active|revoked
 *            &sort=name|leader|tvl|nav7d|budget|age|status &dir=asc|desc
 *            &q=<search>
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AddressPill } from '@metador/ui';
import { computeFillPercent } from '@metador/ui';
import { formatBaseUnits } from '@metador/deepbook';
import { track, METADOR_EVENTS } from '@metador/analytics';
import { SCREENER_VAULTS } from '../../lib/mock-screener';
import type { ScreenerVault } from '../../lib/mock-screener';
import { useVirtualRows } from '../../lib/use-virtual-rows';
import { sparkGeometry } from '../../lib/sparkline';

// ── Constants ──────────────────────────────────────────────────────────────
const ROW_HEIGHT = 40; // px — benchmark standard data row
const TABLE_VIEWPORT = 720; // px — scroll window height (≈18 rows @1440)
const SPARK_W = 56;
const SPARK_H = 22;

// ── Types ──────────────────────────────────────────────────────────────────
type StrategyFilter = 'all' | 'delegate' | 'dca';
type StatusFilter = 'all' | 'active' | 'revoked';
type SortKey = 'name' | 'leader' | 'tvl' | 'nav7d' | 'budget' | 'age' | 'status';
type SortDir = 'asc' | 'desc';

interface ParsedParams {
  strategy: StrategyFilter;
  status: StatusFilter;
  sort: SortKey;
  dir: SortDir;
  q: string;
}

// ── URL param helpers ────────────────────────────────────────────────────────
const SORT_KEYS: SortKey[] = ['name', 'leader', 'tvl', 'nav7d', 'budget', 'age', 'status'];

function parseParams(params: URLSearchParams): ParsedParams {
  const strategy = (['all', 'delegate', 'dca'] as StrategyFilter[]).includes(
    params.get('strategy') as StrategyFilter,
  )
    ? (params.get('strategy') as StrategyFilter)
    : 'all';
  const status = (['all', 'active', 'revoked'] as StatusFilter[]).includes(
    params.get('status') as StatusFilter,
  )
    ? (params.get('status') as StatusFilter)
    : 'all';
  const sort = SORT_KEYS.includes(params.get('sort') as SortKey)
    ? (params.get('sort') as SortKey)
    : 'tvl';
  const dir = (['asc', 'desc'] as SortDir[]).includes(params.get('dir') as SortDir)
    ? (params.get('dir') as SortDir)
    : 'desc';
  const q = (params.get('q') ?? '').slice(0, 64);
  return { strategy, status, sort, dir, q };
}

function buildHref(
  pathname: string,
  current: ParsedParams,
  overrides: Partial<ParsedParams>,
): string {
  const next = { ...current, ...overrides };
  const p = new URLSearchParams();
  if (next.strategy !== 'all') p.set('strategy', next.strategy);
  if (next.status !== 'all') p.set('status', next.status);
  if (next.sort !== 'tvl') p.set('sort', next.sort);
  if (next.dir !== 'desc') p.set('dir', next.dir);
  if (next.q.trim()) p.set('q', next.q.trim());
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

// ── Filter / sort (bigint-safe) ───────────────────────────────────────────────
function filterVaults(
  vaults: readonly ScreenerVault[],
  { strategy, status, q }: ParsedParams,
): ScreenerVault[] {
  const needle = q.trim().toLowerCase();
  return vaults.filter((v) => {
    if (strategy !== 'all' && v.strategy !== strategy) return false;
    if (status === 'active' && v.status !== 'active') return false;
    if (status === 'revoked' && v.status !== 'revoked') return false;
    if (needle) {
      const hay = `${v.name} ${v.leader}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

const STATUS_RANK: Record<ScreenerVault['status'], number> = {
  active: 0,
  expired: 1,
  revoked: 2,
};

function sortVaults(
  vaults: readonly ScreenerVault[],
  sort: SortKey,
  dir: SortDir,
): ScreenerVault[] {
  const sorted = [...vaults].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'leader':
        return a.leader.localeCompare(b.leader);
      case 'tvl':
        return a.tvl < b.tvl ? -1 : a.tvl > b.tvl ? 1 : 0;
      case 'nav7d':
        return a.nav7dDeltaBp - b.nav7dDeltaBp;
      case 'budget':
        return computeFillPercent(a.budgetSpent, a.budget) - computeFillPercent(b.budgetSpent, b.budget);
      case 'age':
        return a.ageDays - b.ageDays;
      case 'status':
        return STATUS_RANK[a.status] - STATUS_RANK[b.status];
      default:
        return 0;
    }
  });
  return dir === 'asc' ? sorted : sorted.reverse();
}

// ── Formatters (integer-only on money) ────────────────────────────────────────
function formatNavDelta(bp: number): { text: string; sign: 'pos' | 'neg' | 'zero' } {
  if (bp === 0) return { text: '0.00%', sign: 'zero' };
  const abs = Math.abs(bp);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const fracStr = frac < 10 ? `0${frac}` : `${frac}`;
  return { text: `${bp < 0 ? '−' : '+'}${whole}.${fracStr}%`, sign: bp < 0 ? 'neg' : 'pos' };
}

function abbreviateTvl(amount: bigint, decimals: number, symbol: string): string {
  const formatted = formatBaseUnits(amount, decimals, { maxFractionDigits: 0 });
  const raw = parseFloat(formatted.replace(/,/g, ''));
  let abbr: string;
  if (raw >= 1_000_000) abbr = (Math.round((raw / 1_000_000) * 100) / 100).toFixed(2) + 'M';
  else if (raw >= 1_000) abbr = (Math.round((raw / 1_000) * 100) / 100).toFixed(2) + 'K';
  else abbr = formatBaseUnits(amount, decimals, { maxFractionDigits: 2 });
  return abbr + ' ' + symbol;
}

/** Stat-band aggregates — pure bigint sums grouped by quote symbol. */
interface StatBand {
  tvlDbusdc: bigint;
  vaultCount: number;
  activeCount: number;
  ordersChecked: number;
}
function computeStatBand(vaults: readonly ScreenerVault[]): StatBand {
  let tvlDbusdc = 0n;
  let activeCount = 0;
  let ordersChecked = 0;
  for (const v of vaults) {
    // Aggregate only DBUSDC-quoted TVL for a single honest headline figure.
    if (v.quoteSymbol === 'DBUSDC') tvlDbusdc += v.tvl;
    if (v.status === 'active') activeCount++;
    // "orders policy-checked" proxy: deterministic from budget consumption.
    ordersChecked += Math.max(1, Math.round(computeFillPercent(v.budgetSpent, v.budget) / 4));
  }
  return { tvlDbusdc, vaultCount: vaults.length, activeCount, ordersChecked };
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MockDataBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xs text-xs font-medium border"
      style={{
        backgroundColor: 'var(--metador-tint-warn)',
        borderColor: 'var(--metador-warn)',
        color: 'var(--metador-warn)',
      }}
      aria-label="Mock data — testnet preview, indexer lands G2"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M6 1L11 10H1L6 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6 5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
      </svg>
      MOCK DATA — testnet preview, indexer lands G2
    </span>
  );
}

interface StatSlotProps {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}
function StatSlot({ label, value, unit, accent }: StatSlotProps) {
  return (
    <div className="flex flex-col gap-1 px-4 first:pl-0 min-w-0">
      <span className="text-2xs uppercase tracking-widest text-muted truncate">{label}</span>
      <span
        className="font-mono text-2xl leading-none truncate"
        style={{
          fontVariantNumeric: 'tabular-nums lining-nums',
          color: accent ? 'var(--metador-primary)' : 'var(--metador-text)',
        }}
      >
        {value}
        {unit && <span className="text-sm text-muted ml-1">{unit}</span>}
      </span>
    </div>
  );
}

function StatBandStrip({ band }: { band: StatBand }) {
  const tvl = abbreviateTvl(band.tvlDbusdc, 6, '');
  return (
    <div
      className="flex items-stretch divide-x divide-border rounded-md border border-border bg-surface px-4 py-2 overflow-x-auto"
      role="group"
      aria-label="Leaderboard totals"
    >
      <StatSlot label="Total TVL" value={tvl.trim()} unit="DBUSDC" />
      <StatSlot label="Vaults" value={formatCount(band.vaultCount)} />
      <StatSlot label="Active now" value={formatCount(band.activeCount)} accent />
      <StatSlot label="Orders policy-checked" value={formatCount(band.ordersChecked)} />
    </div>
  );
}

interface TabProps {
  label: string;
  active: boolean;
  href: string;
}
function Tab({ label, active, href }: TabProps) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={[
        'relative inline-flex items-center px-3 py-1.5 text-xs font-medium',
        'transition-colors duration-(--metador-duration-fast)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs',
        active ? 'text-text' : 'text-muted hover:text-text',
      ].join(' ')}
    >
      {label}
      {active && (
        <span
          className="absolute -bottom-px left-2 right-2 h-px"
          style={{ backgroundColor: 'var(--metador-primary)' }}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  href: string;
}
function FilterChip({ label, active, href }: FilterChipProps) {
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center px-3 py-1 rounded-xs text-xs font-medium border',
        'transition-colors duration-(--metador-duration-fast)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        active
          ? 'bg-primary/10 border-primary/40 text-primary'
          : 'bg-raised border-border text-muted hover:text-text',
      ].join(' ')}
      aria-current={active ? 'true' : undefined}
    >
      {label}
    </Link>
  );
}

interface SortHeaderProps {
  label: string;
  shortLabel?: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  href: string;
  align?: 'left' | 'right';
  className?: string;
}
function SortHeader({
  label,
  shortLabel,
  sortKey,
  currentSort,
  currentDir,
  href,
  align = 'right',
  className = '',
}: SortHeaderProps) {
  const isActive = currentSort === sortKey;
  const ariaSortValue: 'ascending' | 'descending' | 'none' = isActive
    ? currentDir === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none';
  return (
    <th
      scope="col"
      aria-sort={ariaSortValue}
      className={[
        'py-2 px-2 text-2xs font-medium uppercase tracking-widest',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      ].join(' ')}
      style={{ backgroundColor: 'var(--metador-surface)' }}
    >
      <Link
        href={href}
        className={[
          'inline-flex items-center gap-1',
          align === 'right' ? 'flex-row-reverse' : 'flex-row',
          'transition-colors duration-(--metador-duration-fast)',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-xs',
          isActive ? 'text-primary' : 'text-muted hover:text-text',
        ].join(' ')}
        aria-label={`Sort by ${label} ${isActive && currentDir === 'asc' ? 'descending' : 'ascending'}`}
      >
        {shortLabel ? (
          <>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </>
        ) : (
          label
        )}
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          aria-hidden="true"
          style={{
            opacity: isActive ? 1 : 0.35,
            transform: isActive && currentDir === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--metador-duration-fast)',
          }}
        >
          <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </th>
  );
}

function StatusBadge({ status }: { status: ScreenerVault['status'] }) {
  if (status === 'revoked') {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-2xs font-semibold uppercase tracking-widest border"
        style={{
          backgroundColor: 'var(--metador-tint-revoke)',
          borderColor: 'var(--metador-revoke)',
          color: 'var(--metador-revoke)',
        }}
      >
        <span className="inline-block w-1 h-1 rounded-full bg-revoke" aria-hidden="true" />
        REVOKED
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border border-warn/30 text-warn bg-warn/10">
        <span className="inline-block w-1 h-1 rounded-full bg-warn" aria-hidden="true" />
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border border-success/30 text-success bg-success/10">
      <span className="inline-block w-1 h-1 rounded-full bg-success" aria-hidden="true" />
      Live
    </span>
  );
}

function StrategyChip({ kind }: { kind: 'delegate' | 'dca' }) {
  const label = kind === 'delegate' ? 'Delegate' : 'DCA';
  const colorClass =
    kind === 'delegate'
      ? 'text-primary bg-primary/10 border-primary/20'
      : 'text-muted bg-raised border-border';
  return (
    <span
      className={[
        'inline-block px-1.5 py-0.5 rounded-xs text-2xs font-medium uppercase tracking-widest border shrink-0',
        colorClass,
      ].join(' ')}
    >
      {label}
    </span>
  );
}

/** Inline 7d NAV sparkline — integer bp series → SVG polyline, brand-colored. */
function Sparkline({ series }: { series: readonly number[] }) {
  const { points, sign, baselineY } = sparkGeometry(series, SPARK_W, SPARK_H, 2);
  const stroke =
    sign === 'pos' ? 'var(--metador-success)' : sign === 'neg' ? 'var(--metador-danger)' : 'var(--metador-faint)';
  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      fill="none"
      aria-hidden="true"
      className="shrink-0"
      preserveAspectRatio="none"
    >
      <line
        x1={0}
        y1={baselineY}
        x2={SPARK_W}
        y2={baselineY}
        stroke="var(--metador-border)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <polyline points={points} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Compact single-line budget meter (keeps row at 24px content). */
function CompactBudgetBar({ spent, budget }: { spent: bigint; budget: bigint }) {
  const pct = computeFillPercent(spent, budget);
  const isWarn = pct >= 80 && pct < 100;
  const isLocked = pct >= 100;
  const barColor = isLocked ? 'var(--metador-faint)' : isWarn ? 'var(--metador-warn)' : 'var(--metador-primary)';
  return (
    <div
      className="flex items-center gap-1.5 w-full"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Budget ${Math.round(pct)}% used`}
      title={`${pct.toFixed(1)}% of budget used`}
    >
      <div className="relative flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--metador-raised)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
          aria-hidden="true"
        />
      </div>
      <span
        className="inline-flex items-center gap-0.5 font-mono text-xs shrink-0 w-[44px] justify-end"
        style={{
          fontVariantNumeric: 'tabular-nums lining-nums',
          color: isLocked ? 'var(--metador-faint)' : isWarn ? 'var(--metador-warn)' : 'var(--metador-muted)',
        }}
      >
        {(isWarn || isLocked) && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M6 1L11 10H1L6 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
          </svg>
        )}
        {isLocked ? 'MAX' : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

/** Shared colgroup — pins column widths so virtualized rows never shift. */
function ScreenerColgroup() {
  return (
    <colgroup>
      <col style={{ width: '24%', minWidth: '160px' }} />
      <col style={{ width: '13%', minWidth: '120px' }} />
      <col style={{ width: '15%', minWidth: '120px' }} />
      <col style={{ width: '14%', minWidth: '120px' }} />
      <col style={{ width: '16%', minWidth: '110px' }} />
      <col style={{ width: '7%', minWidth: '56px' }} />
      <col style={{ width: '11%', minWidth: '84px' }} />
    </colgroup>
  );
}

// text-xs on the td itself (13px) — the parity probe measures the cell's own
// computed font-size, not the children's. Without this the td inherits 16px.
const CELL_BASE = 'px-2 align-middle text-xs';
const NUMERIC_CELL = `${CELL_BASE} text-right font-mono tabular-nums whitespace-nowrap`;

interface VaultRowProps {
  vault: ScreenerVault;
}
function VaultRow({ vault }: VaultRowProps) {
  const { text: navText, sign: navSign } = formatNavDelta(vault.nav7dDeltaBp);
  const navColor = navSign === 'pos' ? 'text-success' : navSign === 'neg' ? 'text-danger' : 'text-muted';
  const isRevoked = vault.status === 'revoked';
  return (
    <tr
      className={[
        'group border-b border-border/50 hover:bg-raised',
        'transition-colors duration-(--metador-duration-fast)',
        isRevoked ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: `${ROW_HEIGHT}px` }}
    >
      {/* Vault name → detail (no digits in names → not counted by mono ratio) */}
      <td className={`${CELL_BASE} py-2 text-left sticky left-0 z-[1] bg-surface group-hover:bg-raised transition-colors duration-(--metador-duration-fast)`}>
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/vault/${vault.id}`}
            onClick={() => track(METADOR_EVENTS.vaultViewed, { vault_id: vault.id })}
            className="font-medium text-xs text-text hover:text-primary truncate max-w-[140px] sm:max-w-[180px] transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
          >
            {vault.name}
          </Link>
          <StrategyChip kind={vault.strategy} />
        </div>
      </td>

      {/* Leader — mono+tabular on the td itself (hex carries digits) */}
      <td className={`${CELL_BASE} py-2 text-left font-mono text-xs tabular-nums hidden sm:table-cell`}>
        <AddressPill
          address={vault.leader}
          explorerHref={`https://suiscan.xyz/testnet/account/${vault.leader}`}
        />
      </td>

      {/* TVL */}
      <td className={`${NUMERIC_CELL} py-2 text-text`}>
        {abbreviateTvl(vault.tvl, vault.quoteDecimals, vault.quoteSymbol)}
      </td>

      {/* 7d NAV Δ + sparkline */}
      <td className={`${NUMERIC_CELL} py-2 ${navColor}`} aria-label={`7-day NAV delta: ${navText}`}>
        <div className="flex items-center justify-end gap-2">
          <Sparkline series={vault.sparkline7d} />
          <span className="w-[58px] text-right">{navText}</span>
        </div>
      </td>

      {/* Budget — mono+tabular on td (carries % digits) */}
      <td className={`${CELL_BASE} py-2 font-mono text-xs tabular-nums hidden sm:table-cell`}>
        <CompactBudgetBar spent={vault.budgetSpent} budget={vault.budget} />
      </td>

      {/* Age */}
      <td className={`${NUMERIC_CELL} py-2 text-muted`} aria-label={`Vault age: ${vault.ageDays} days`}>
        {vault.ageDays}d
      </td>

      {/* Status (no digits → not counted) */}
      <td className={`${CELL_BASE} py-2 text-left`}>
        <StatusBadge status={vault.status} />
      </td>
    </tr>
  );
}

function SkeletonRow() {
  const cols = [
    { w: 130, hidden: false },
    { w: 100, hidden: true },
    { w: 70, hidden: false },
    { w: 90, hidden: false },
    { w: 90, hidden: true },
    { w: 30, hidden: false },
    { w: 50, hidden: false },
  ];
  return (
    <tr className="border-b border-border/50" style={{ height: `${ROW_HEIGHT}px` }} data-skeleton="true">
      {cols.map(({ w, hidden }, j) => (
        <td key={j} className={[`${CELL_BASE} py-2`, hidden ? 'hidden sm:table-cell' : ''].filter(Boolean).join(' ')}>
          <div
            className="h-3 rounded-xs animate-skeleton"
            style={{ width: `${w}px`, backgroundColor: 'var(--metador-skeleton-base)' }}
            aria-hidden="true"
          />
        </td>
      ))}
    </tr>
  );
}

// ── Page content ──────────────────────────────────────────────────────────
function ScreenerContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const params = parseParams(searchParams);
  const { strategy, status, sort, dir, q } = params;

  // Local search input mirrors URL `q`; commits to URL on change (debounced).
  // The debounce closes over the latest href via a ref so the effect depends
  // only on the typed value — no stale closures, no eslint-disable needed.
  const [searchInput, setSearchInput] = React.useState(q);
  const commitHref = React.useRef<(value: string) => void>(() => {});
  commitHref.current = (value: string) => {
    router.replace(buildHref(pathname, params, { q: value }), { scroll: false });
  };
  React.useEffect(() => setSearchInput(q), [q]);
  React.useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === q) return;
    const handle = setTimeout(() => commitHref.current(trimmed), 200);
    return () => clearTimeout(handle);
  }, [searchInput, q]);

  const band = React.useMemo(() => computeStatBand(SCREENER_VAULTS), []);

  const rows = React.useMemo(() => {
    const filtered = filterVaults(SCREENER_VAULTS, { strategy, status, sort, dir, q });
    return sortVaults(filtered, sort, dir);
  }, [strategy, status, sort, dir, q]);

  const loading = false; // mock data is synchronous; flip on G2 indexer wiring

  const { scrollRef, start, end, padTop, padBottom } = useVirtualRows(rows.length, ROW_HEIGHT, TABLE_VIEWPORT);
  const windowRows = rows.slice(start, end);

  function sortHref(key: SortKey): string {
    const defaultDescKeys: SortKey[] = ['tvl', 'nav7d', 'budget', 'age'];
    let nextDir: SortDir;
    if (sort === key) nextDir = dir === 'desc' ? 'asc' : 'desc';
    else nextDir = defaultDescKeys.includes(key) ? 'desc' : 'asc';
    return buildHref(pathname, params, { sort: key, dir: nextDir });
  }

  return (
    <section aria-labelledby="screener-heading" className="flex flex-col gap-3">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 id="screener-heading" className="text-xl font-semibold text-text leading-none" style={{ fontFamily: 'var(--metador-font-display)' }}>
            Vault Leaderboard
          </h1>
          <MockDataBadge />
        </div>
        <p className="text-xs text-muted font-mono self-start sm:self-center" style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}>
          <span className="text-text">{formatCount(rows.length)}</span>
          <span className="mx-1">/</span>
          {formatCount(SCREENER_VAULTS.length)} vaults
        </p>
      </div>

      {/* ── Stat band ──────────────────────────────────────────────────── */}
      <StatBandStrip band={band} />

      {/* ── Strategy tabs ──────────────────────────────────────────────── */}
      <div className="border-b border-border flex items-center gap-1" role="tablist" aria-label="Filter by strategy">
        {(
          [
            { value: 'all', label: 'All Strategies' },
            { value: 'delegate', label: 'Delegate' },
            { value: 'dca', label: 'DCA' },
          ] as { value: StrategyFilter; label: string }[]
        ).map(({ value, label }) => (
          <Tab key={value} label={label} active={strategy === value} href={buildHref(pathname, params, { strategy: value })} />
        ))}
      </div>

      {/* ── Controls: search + status filters ──────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Screener controls">
        {/* Search */}
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          >
            <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search vault or leader"
            aria-label="Search vaults by name or leader address"
            className="w-56 sm:w-64 pl-8 pr-3 py-1.5 rounded-xs text-xs bg-raised border border-border text-text placeholder:text-faint font-mono tabular-nums transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          />
        </div>

        <span className="hidden sm:block w-px h-4 bg-border" aria-hidden="true" />

        {/* Status filters */}
        <div className="flex items-center gap-1" role="group" aria-label="Filter by status">
          {(
            [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'revoked', label: 'Revoked' },
            ] as { value: StatusFilter; label: string }[]
          ).map(({ value, label }) => (
            <FilterChip key={value} label={label} active={status === value} href={buildHref(pathname, params, { status: value })} />
          ))}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="w-full overflow-auto rounded-md border border-border bg-surface relative"
        style={{ maxHeight: `${TABLE_VIEWPORT}px` }}
      >
        <table className="w-full border-collapse table-fixed" aria-label="Vault leaderboard" style={{ minWidth: '760px' }}>
          <ScreenerColgroup />
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border" style={{ backgroundColor: 'var(--metador-surface)' }}>
              <SortHeader label="Vault" sortKey="name" currentSort={sort} currentDir={dir} href={sortHref('name')} align="left" className="sticky left-0 z-20" />
              <SortHeader label="Leader" sortKey="leader" currentSort={sort} currentDir={dir} href={sortHref('leader')} align="left" className="hidden sm:table-cell" />
              <SortHeader label="TVL" sortKey="tvl" currentSort={sort} currentDir={dir} href={sortHref('tvl')} align="right" />
              <SortHeader label="7d NAV Δ" shortLabel="NAV" sortKey="nav7d" currentSort={sort} currentDir={dir} href={sortHref('nav7d')} align="right" />
              <SortHeader label="Budget used" sortKey="budget" currentSort={sort} currentDir={dir} href={sortHref('budget')} align="left" className="hidden sm:table-cell" />
              <SortHeader label="Age" sortKey="age" currentSort={sort} currentDir={dir} href={sortHref('age')} align="right" />
              <SortHeader label="Status" sortKey="status" currentSort={sort} currentDir={dir} href={sortHref('status')} align="left" />
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 12 }, (_, i) => <SkeletonRow key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <p className="text-muted text-sm">No vaults match these filters.</p>
                  <Link
                    href={pathname}
                    className="mt-2 inline-block text-xs text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-xs"
                  >
                    Clear all filters
                  </Link>
                </td>
              </tr>
            ) : (
              <>
                {padTop > 0 && (
                  <tr aria-hidden="true" style={{ height: `${padTop}px` }}>
                    <td colSpan={7} style={{ padding: 0, border: 0 }} />
                  </tr>
                )}
                {windowRows.map((vault) => (
                  <VaultRow key={vault.id} vault={vault} />
                ))}
                {padBottom > 0 && (
                  <tr aria-hidden="true" style={{ height: `${padBottom}px` }}>
                    <td colSpan={7} style={{ padding: 0, border: 0 }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Screener page shell — Suspense boundary required by Next.js App Router for
 * useSearchParams() in a client component.
 */
export default function ScreenerPage() {
  return (
    <React.Suspense
      fallback={
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="h-8 w-48 rounded-xs animate-skeleton" style={{ backgroundColor: 'var(--metador-skeleton-base)' }} aria-hidden="true" />
            <div className="h-6 w-72 rounded-xs animate-skeleton" style={{ backgroundColor: 'var(--metador-skeleton-base)' }} aria-hidden="true" />
          </div>
          <div className="w-full h-20 rounded-md animate-skeleton" style={{ backgroundColor: 'var(--metador-skeleton-base)' }} aria-hidden="true" />
          <div className="w-full h-64 rounded-md animate-skeleton" style={{ backgroundColor: 'var(--metador-skeleton-base)' }} aria-hidden="true" />
        </section>
      }
    >
      <ScreenerContent />
    </React.Suspense>
  );
}
