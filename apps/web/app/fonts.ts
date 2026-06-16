import { Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Metador faces (ADR-010, Hyperliquid-aligned). Inter carries all UI, body, and
 * numerals (tabular-nums); JetBrains Mono is the real monospace for addresses,
 * tx hashes, and code only. Loaded via next/font (subset + font-display: swap).
 * CSS variable names match METADOR_FONT_VARS in @metador/design-system so the
 * `--metador-font-*` tokens resolve.
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/** JetBrains Mono — addresses, tx hashes, code blocks only (never numerals). */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});
