'use client';

import * as React from 'react';
import { shortenAddress } from '@metador/deepbook';

export interface AddressPillProps {
  address: string;
  /** Number of visible hex chars at each end (default 4) */
  visible?: number;
  /** Suiscan testnet explorer href — if provided shows external link icon */
  explorerHref?: string;
  className?: string;
}

const COPIED_RESET_MS = 1200;

const CopyIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M2 8V2a1 1 0 011-1h6"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExternalIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 1h3v3M9 1L5 5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 2H2a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V6"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Address pill — rounded-xs chip, mono, copy-to-clipboard with
 * inline copied! state (1.2s, no toast), optional explorer link.
 */
export function AddressPill({
  address,
  visible = 4,
  explorerHref,
  className,
}: AddressPillProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const shortened = shortenAddress(address, visible);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // clipboard API not available — silently ignore
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const pillBase = [
    'inline-flex items-center gap-1',
    'px-2 py-0.5 rounded-xs',
    'bg-raised border border-border',
    'font-mono text-xs text-muted',
    'transition-colors duration-(--metador-duration-fast)',
  ].join(' ');

  return (
    <span
      className={['inline-flex items-center gap-1', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={pillBase}
        title={address}
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {shortened}
      </span>

      {/* Copy button — min 24×24 hit target (SC 2.5.8); icon stays 12px */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied!' : `Copy address ${shortened}`}
        className={[
          'inline-flex items-center justify-center min-w-[24px] min-h-[24px] rounded-xs',
          copied ? 'text-success' : 'text-faint hover:text-muted',
          'transition-colors duration-(--metador-duration-fast)',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        ].join(' ')}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>

      {explorerHref && (
        /* Explorer link — min 24×24 hit target (SC 2.5.8); icon stays 10px */
        <a
          href={explorerHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${shortened} on Suiscan explorer (opens in new tab)`}
          className={[
            'inline-flex items-center justify-center min-w-[24px] min-h-[24px] rounded-xs',
            'text-faint hover:text-muted',
            'transition-colors duration-(--metador-duration-fast)',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          ].join(' ')}
        >
          <ExternalIcon />
        </a>
      )}
    </span>
  );
}
