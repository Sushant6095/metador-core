/**
 * SiteFooter — §8.8 footer contract.
 *
 * Pattern transfer: oversized Inter "Metador" wordmark spanning full width,
 * pale paper top zone + dark base strip (ADR-010: Inter everywhere, green identity).
 *
 * Structure:
 *   - Pale top zone (data-theme="light"): giant Inter "Metador" wordmark + brief tagline
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
       * Giant Inter wordmark is the visual anchor (pattern transfer, ADR-010).
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
         * Oversized Inter wordmark — full-bleed editorial anchor (ADR-010).
         * Intentionally escapes the 1200px content wrapper so the wordmark
         * runs edge-to-edge to the section's L/R padding at all viewports.
         * fontSize is a one-off hero-scale display element — no token at this size.
         * Inter at -0.04em tracking fills the section width at 1440px.
         */}
        <p
          aria-hidden="true"
          style={{
            fontFamily: 'var(--metador-font-display)',
            /*
             * Full-bleed wordmark: scales from ~5rem at 375px to fill viewport width.
             * No upper clamp cap — the vw unit drives it to fill the available
             * section width at all viewports. Inter at -0.04em tracking fills
             * edge-to-padding at 1440px. At 375px the floor (5rem = 80px) applies.
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
