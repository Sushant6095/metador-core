/** Shared types for the Metador reference lab (BOOTSTRAP Phase E). */

export interface CaptureTarget {
  /** Folder name under docs/research/refs/ */
  slug: string;
  url: string;
  /** Human label used in generated docs. */
  label: string;
  /** Extra settle time for heavy SPAs, ms. */
  settleMs?: number;
}

export interface Viewport {
  name: string;
  width: number;
  height: number;
}

export const VIEWPORTS: readonly Viewport[] = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
] as const;

/** Design-sprint additions (founder directive 2026-06-12). */
export const SPRINT_TARGETS: readonly CaptureTarget[] = [
  {
    slug: 'hyperscreener.asxn.xyz',
    url: 'https://hyperscreener.asxn.xyz/home',
    label: 'Hyperscreener — home (screener density benchmark)',
    settleMs: 10_000,
  },
  {
    slug: 'hl-docs',
    url: 'https://hyperliquid.gitbook.io/hyperliquid-docs',
    label: 'Hyperliquid Docs — GitBook (docs IA benchmark)',
    settleMs: 8_000,
  },
] as const;

/** G0 capture set (CLAUDE.md §5). G2 adds screener/docs/Sui-native targets. */
export const G0_TARGETS: readonly CaptureTarget[] = [
  {
    slug: 'app.hyperliquid.xyz-vaults',
    url: 'https://app.hyperliquid.xyz/vaults',
    label: 'Hyperliquid — Vaults',
    settleMs: 12_000,
  },
  {
    slug: 'app.hyperliquid.xyz-trade',
    url: 'https://app.hyperliquid.xyz/trade',
    label: 'Hyperliquid — Trade',
    settleMs: 12_000,
  },
  {
    slug: 'hyperfoundation.org',
    url: 'https://hyperfoundation.org',
    label: 'Hyper Foundation — main site',
    settleMs: 6_000,
  },
] as const;

export interface StyleMeasurements {
  url: string;
  viewport: string;
  capturedAt: string;
  fontFamilies: Record<string, number>;
  fontSizes: Record<string, number>;
  fontWeights: Record<string, number>;
  lineHeights: Record<string, number>;
  colors: Record<string, number>;
  backgroundColors: Record<string, number>;
  spacingSamples: Record<string, number>;
  radii: Record<string, number>;
  shadows: Record<string, number>;
}
