import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

/**
 * Metador faces, loaded via next/font (subset + font-display: swap). The CSS
 * variable names match METADOR_FONT_VARS in @metador/design-system so the
 * `--metador-font-*` tokens resolve. (DESIGN.md Typography.)
 *
 * Fraunces is the warm old-style optical serif (brand voice). Its optical
 * size, softness, and wonk axes are enabled so the display face reads warm
 * and human, deliberately unlike a high-contrast cut.
 */
export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT', 'WONK'],
});

/** Geist Sans — all UI and body text. Sharp, mechanical neo-grotesque. */
export const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
});

/** Geist Mono — every numeral on money/market surfaces, addresses, code. */
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});
