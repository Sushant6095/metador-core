'use client';

/**
 * ActivityFeedSection — "Watch safety work."
 * The signature element: a faked live activity feed auto-cycling every ~3s.
 * Shows the rejected-by-policy row prominently — that rejection IS the proof.
 * Motion: new row slides in from top (translateY + opacity). Max 6 visible.
 * Fixture data only — no backend (state-only, TODO: replace with live chain data).
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import { ActivityRow } from '@metador/ui';
import type { ActivityRowProps } from '@metador/ui';

type FeedItem = Pick<ActivityRowProps, 'kind' | 'title' | 'detail' | 'timestamp'>;

/**
 * Fixed base epoch for deterministic SSR. Using Date.now() at module load or
 * in initial render causes a hydration text mismatch (React #418) because the
 * server and client compute different absolute times. The initial rows render
 * from this static base so server and client markup are byte-identical; only
 * rows injected post-mount (client-only, in the interval) read live time.
 * Chosen to render as a stable UTC HH:MM:SS in ActivityRow's fixed-TZ format.
 */
const BASE_EPOCH_MS = 1_750_000_000_000;

/** Fixture feed items — cycles through in order, wrapping. Static timestamps. */
const FEED_FIXTURE: readonly FeedItem[] = [
  {
    kind: 'order',
    title: 'Buy 1,200 SUI',
    detail: 'SUI/USDC · limit $3.42 · filled',
    timestamp: BASE_EPOCH_MS - 2_000,
  },
  {
    kind: 'order',
    title: 'Sell 800 SUI',
    detail: 'SUI/USDC · market · filled',
    timestamp: BASE_EPOCH_MS - 14_000,
  },
  {
    kind: 'rejected',
    title: 'Sell 50,000 USDC → DEEP',
    detail: 'Rejected — market not in scope (SUI/USDC only)',
    timestamp: BASE_EPOCH_MS - 27_000,
  },
  {
    kind: 'deposit',
    title: 'Deposit 500 USDC',
    detail: 'Maya deposited · shares issued',
    timestamp: BASE_EPOCH_MS - 45_000,
  },
  {
    kind: 'rejected',
    title: 'Buy 3,000 SUI',
    detail: 'Rejected — daily budget ceiling reached ($500)',
    timestamp: BASE_EPOCH_MS - 61_000,
  },
  {
    kind: 'order',
    title: 'Buy 600 SUI',
    detail: 'SUI/USDC · limit $3.38 · filled',
    timestamp: BASE_EPOCH_MS - 78_000,
  },
  {
    kind: 'withdraw',
    title: 'Withdraw 200 USDC',
    detail: 'Shares redeemed · funds returned',
    timestamp: BASE_EPOCH_MS - 95_000,
  },
  {
    kind: 'rejected',
    title: 'Withdraw 10,000 USDC to 0xdeadbeef…',
    detail: 'Rejected — withdrawals go only to depositor address',
    timestamp: BASE_EPOCH_MS - 112_000,
  },
] as const;

const MAX_VISIBLE = 6;
const CYCLE_INTERVAL_MS = 3_000;

interface LiveRowItem extends FeedItem {
  /** Unique key for AnimatePresence tracking */
  key: string;
}

/**
 * Build the initial rows deterministically (SSR-safe): the key is derived from
 * the fixture index only and the timestamp is the fixture's static value, so
 * server and client render identical markup.
 */
function makeInitialRow(item: FeedItem, idx: number): LiveRowItem {
  return { ...item, key: `init-${idx}` };
}

/**
 * Build a live row injected by the post-mount interval (client-only). Safe to
 * read Date.now() here because these rows never exist during SSR/hydration.
 */
function makeLiveRow(item: FeedItem, uid: number): LiveRowItem {
  return { ...item, key: `live-${uid}`, timestamp: Date.now() };
}

export function ActivityFeedSection() {
  const reducedMotion = useReducedMotion();

  // Start with the first MAX_VISIBLE items — deterministic for SSR/hydration.
  const [rows, setRows] = React.useState<LiveRowItem[]>(() =>
    FEED_FIXTURE.slice(0, MAX_VISIBLE).map((item, i) => makeInitialRow(item, i)),
  );

  const cycleIndexRef = React.useRef<number>(MAX_VISIBLE % FEED_FIXTURE.length);
  // Monotonic uid for live-row keys (client-only, post-mount).
  const liveUidRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (reducedMotion) return;

    const timer = setInterval(() => {
      const nextIdx = cycleIndexRef.current;
      const nextItem = FEED_FIXTURE[nextIdx % FEED_FIXTURE.length];
      cycleIndexRef.current = (nextIdx + 1) % FEED_FIXTURE.length;

      if (nextItem === undefined) return;

      setRows((prev) => {
        liveUidRef.current += 1;
        const newRow = makeLiveRow(nextItem, liveUidRef.current);
        const next = [newRow, ...prev].slice(0, MAX_VISIBLE);
        return next;
      });
    }, CYCLE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [reducedMotion]);

  return (
    <section
      id="activity-feed"
      aria-labelledby="activity-feed-heading"
      style={{
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-surface)',
        borderTop: '1px solid var(--metador-border)',
        borderBottom: '1px solid var(--metador-border)',
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div
          className="grid gap-12"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
            gap: 'var(--metador-space-12)',
            alignItems: 'start',
          }}
        >
          {/* Left: heading + explanation */}
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
          >
            <p
              className="metador-eyebrow"
              style={{ marginBottom: 'var(--metador-space-2)' }}
            >
              Live activity
            </p>
            <h2
              id="activity-feed-heading"
              style={{
                fontFamily: 'var(--metador-font-display)',
                fontSize: 'clamp(1.8rem, 4vw + 0.5rem, var(--metador-text-3xl))',
                lineHeight: 'var(--metador-text-3xl--line-height)',
                fontWeight: 'var(--metador-weight-semibold)',
                color: 'var(--metador-text)',
                letterSpacing: '-0.02em',
                marginBottom: 'var(--metador-space-4)',
              }}
            >
              Watch safety work.
            </h2>
            <p
              style={{
                fontFamily: 'var(--metador-font-text)',
                fontSize: 'var(--metador-text-base)',
                lineHeight: 'var(--metador-text-base--line-height)',
                color: 'var(--metador-muted)',
                marginBottom: 'var(--metador-space-4)',
              }}
            >
              Every action the vault attempts — including every rejected one — is
              visible in real time. The rejections are the proof. The policy walls
              work even when nobody is watching.
            </p>
            <p
              style={{
                fontFamily: 'var(--metador-font-text)',
                fontSize: 'var(--metador-text-sm)',
                lineHeight: 'var(--metador-text-base--line-height)',
                /* --metador-faint fails SC 1.4.3 at 14px (3.33:1); switch to --metador-muted */
                color: 'var(--metador-muted)',
              }}
            >
              This feed is a preview. On the live app, events stream from the chain
              within seconds of confirmation.
            </p>
          </motion.div>

          {/* Right: live feed panel */}
          <motion.div
            initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER, delay: 0.08 }}
          >
            <div
              style={{
                backgroundColor: 'var(--metador-bg)',
                border: '1px solid var(--metador-border)',
                borderRadius: 'var(--metador-radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Feed header */}
              <div
                className="flex items-center justify-between"
                style={{
                  padding: 'var(--metador-space-3) var(--metador-space-4)',
                  borderBottom: '1px solid var(--metador-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  {/* Live status dot */}
                  <span
                    aria-label="Live"
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 'var(--metador-radius-full)',
                      backgroundColor: 'var(--metador-success)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--metador-font-text)',
                      fontSize: 'var(--metador-text-xs)',
                      color: 'var(--metador-muted)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Activity feed · live
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--metador-font-mono)',
                    fontSize: 'var(--metador-text-2xs)',
                    /* --metador-faint fails SC 1.4.3 at 12px (3.33:1); switch to --metador-muted */
                    color: 'var(--metador-muted)',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  testnet preview
                </span>
              </div>

              {/* Feed rows with AnimatePresence for slide-in */}
              <ul
                aria-label="Recent vault activity"
                aria-live="polite"
                aria-atomic="false"
                style={{ overflow: 'hidden' }}
              >
                <AnimatePresence initial={false}>
                  {rows.map((row) => (
                    <motion.li
                      key={row.key}
                      initial={
                        reducedMotion
                          ? { opacity: 1 }
                          : { opacity: 0, y: -16 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 8 }
                      }
                      transition={{
                        duration: DURATIONS_S.base,
                        ease: EASE_ENTER,
                      }}
                      style={{ listStyle: 'none' }}
                    >
                      <ActivityRow
                        kind={row.kind}
                        title={row.title}
                        detail={row.detail}
                        timestamp={row.timestamp}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
