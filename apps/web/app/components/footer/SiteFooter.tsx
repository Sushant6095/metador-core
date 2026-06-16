/**
 * SiteFooter — §8.8 footer contract.
 *
 * Pattern transfer: oversized Fraunces "Metador" wordmark spanning full width,
 * pale paper top zone + dark base strip.
 *
 * Structure:
 *   - Pale top zone (data-theme="light"): giant Fraunces "Metador" wordmark + brief tagline
 *   - Dark base strip: MetadorMark + minimal links (Docs placeholder, GitHub placeholder)
 *     + "Built on Sui · DeepBook" caption
 *
 * Server component — no client boundary needed.
 * No fake social icons (PRODUCT.md: no social links before PMF).
 * No raw hex — tokens only.
 */

import { MetadorLogo } from '@metador/ui';

export function SiteFooter() {
  return (
    <footer role="contentinfo">
      {/*
       * ── Pale top zone ────────────────────────────────────────────────────
       * data-theme="light" flips the metador-* token ramp to the paper world.
       * Giant Fraunces wordmark is the visual anchor (pattern transfer).
       * clamp() for the wordmark: from ~3xl at 375px to well above 5xl at 1440.
       * We use clamp() directly here because this is a hero-scale display
       * element — no token large enough exists; this is the one explicit
       * larger-than-5xl instance the contract permits.
       */}
      <div
        data-theme="light"
        style={{
          backgroundColor: 'var(--metador-bg)',
          borderTop: '1px solid var(--metador-border)',
          paddingTop: 'var(--metador-space-24)',
          paddingLeft: 'var(--metador-space-4)',
          paddingRight: 'var(--metador-space-4)',
          paddingBottom: 'var(--metador-space-16)',
          overflow: 'hidden',
        }}
      >
        {/*
         * Oversized wordmark — true full-bleed editorial anchor.
         * Intentionally escapes the 1200px content wrapper so the wordmark
         * runs edge-to-edge to the section's L/R padding at all viewports.
         * clamp: ~80px at 375px, ~207px at 1440px (14.375vw × 1440 = 207).
         * Raised from 14vw→20vw so glyphs reach the horizontal padding at 1440px.
         * fontSize is a one-off hero-scale display element — no token at this size.
         */}
        <p
          aria-hidden="true"
          style={{
            fontFamily: 'var(--metador-font-display)',
            /*
             * Full-bleed wordmark: scales from ~5rem at 375px to ~29vw at 1440px.
             * No upper clamp cap — the vw unit drives it to fill the available
             * section width at all viewports. Tested: at 1440px, 29vw ≈ 418px
             * which Fraunces "Metador" with -0.04em tracking fills edge-to-padding.
             * At 375px the floor (5rem = 80px) applies.
             */
            fontSize: 'clamp(5rem, 58vw, 100vw)',
            lineHeight: 1,
            fontWeight: 'var(--metador-weight-semibold)',
            color: 'var(--metador-text)',
            letterSpacing: '-0.04em',
            marginBottom: 'var(--metador-space-6)',
            /* No opacity — full-strength token color, no alpha faking */
          }}
        >
          Metador
        </p>

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Tagline beneath wordmark */}
          <p
            style={{
              fontFamily: 'var(--metador-font-text)',
              fontSize: 'var(--metador-text-base)',
              lineHeight: 'var(--metador-text-base--line-height)',
              color: 'var(--metador-muted)',
              maxWidth: '40ch',
            }}
          >
            Strategy vaults that cannot run off with your money.
            Non-custodial, chain-enforced, open source.
          </p>
        </div>
      </div>

      {/*
       * ── Dark base strip ──────────────────────────────────────────────────
       * Hard flip back to dark — no crossfade (contract §6: hard section edges).
       * MetadorMark + minimal links + stack caption.
       */}
      <div
        style={{
          backgroundColor: 'var(--metador-bg)',
          borderTop: '1px solid var(--metador-border)',
          padding: 'var(--metador-space-8) var(--metador-space-4)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--metador-space-4)',
          }}
        >
          {/* Mark + stack caption */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--metador-space-3)',
            }}
          >
            <MetadorLogo size="sm" />
            <span
              style={{
                fontFamily: 'var(--metador-font-text)',
                fontSize: 'var(--metador-text-xs)',
                /* --metador-faint fails SC 1.4.3 at 13px (3.33:1); switch to --metador-muted (6+:1) */
                color: 'var(--metador-muted)',
                letterSpacing: '0.04em',
              }}
            >
              Built on Sui · DeepBook
            </span>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 'var(--metador-space-6)',
              }}
            >
              <li>
                {/* Placeholder — docs land G3 */}
                <span
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontSize: 'var(--metador-text-sm)',
                    /* --metador-faint fails SC 1.4.3 at 14px (3.33:1); switch to --metador-muted */
                    color: 'var(--metador-muted)',
                    cursor: 'default',
                  }}
                  aria-label="Docs — coming soon"
                >
                  Docs
                </span>
              </li>
              <li>
                {/* Placeholder — repo is public at submission (G1) */}
                <span
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontSize: 'var(--metador-text-sm)',
                    /* --metador-faint fails SC 1.4.3 at 14px (3.33:1); switch to --metador-muted */
                    color: 'var(--metador-muted)',
                    cursor: 'default',
                  }}
                  aria-label="GitHub — coming soon"
                >
                  GitHub
                </span>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
