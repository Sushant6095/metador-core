import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

/**
 * Metador faces, loaded via next/font (subset + font-display: swap). The CSS
 * variable names match METADOR_FONT_VARS in @metador/design-system so the
 * `--metador-font-*` tokens resolve. (DESIGN.md Typography.)
 *
 * Fraunces axes pinned per elevation-spec §4.1:
 *   opsz→144 (max — high-contrast editorial sharpness)
 *   SOFT→0   (kills the crayon/soft terminals)
 *   WONK→0   (kills the playful wonk)
 * Display CSS then applies: font-variation-settings + weight 560/600
 * via the .metador-display class in atmosphere.css.
 *
 * The `axes` array must list all VF axes we want to pin; next/font embeds
 * only the specified axes in the subset. Pinning happens in CSS, not here.
 */
export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT', 'WONK'],
  weight: 'variable',
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
