import * as React from 'react';

export interface PolicyCardProps {
  pool: string;
  budgetFormatted: string;
  quoteSymbol: string;
  expiresAtMs: number;
  revocable: boolean;
  status?: 'active' | 'revoked';
  className?: string;
}

/** Format expiry ms to "Mon D, YYYY" */
function formatExpiry(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const WallIcons = {
  scope: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  budget: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  expiry: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 1v3M10 1v3M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  revoke: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 7s1.5-4 5-4 5 4 5 4-1.5 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  ),
};

/**
 * PolicyCard — the four walls as a single plain-English sentence.
 * Key numeric/identifier values are in mono brass.
 * status='revoked' stamps a REVOKED overlay (rotated text, revoke red,
 * tint-revoke background).
 */
export function PolicyCard({
  pool,
  budgetFormatted,
  quoteSymbol,
  expiresAtMs,
  revocable,
  status = 'active',
  className,
}: PolicyCardProps) {
  const isRevoked = status === 'revoked';
  const expiry = formatExpiry(expiresAtMs);

  return (
    <div
      className={[
        'relative rounded-md border bg-surface overflow-hidden',
        isRevoked ? 'border-revoke/40' : 'border-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={isRevoked ? { backgroundColor: 'var(--metador-tint-revoke)' } : undefined}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Plain-English sentence */}
        <p className="text-sm text-text leading-relaxed">
          {'This vault can trade only '}
          <MonoBrass>{pool}</MonoBrass>
          {', spend at most '}
          <MonoBrass>
            {budgetFormatted} {quoteSymbol}
          </MonoBrass>
          {', expires '}
          <MonoBrass>{expiry}</MonoBrass>
          {', and '}
          {revocable
            ? 'the owner can revoke it at any time.'
            : 'it cannot be revoked early.'}
        </p>

        {/* Wall icon row */}
        <div className="flex flex-wrap gap-4" role="list" aria-label="Policy walls">
          <WallBadge
            icon={WallIcons.scope}
            label="Scope"
            value={pool}
            revoked={isRevoked}
          />
          <WallBadge
            icon={WallIcons.budget}
            label="Budget"
            value={`${budgetFormatted} ${quoteSymbol}`}
            revoked={isRevoked}
          />
          <WallBadge
            icon={WallIcons.expiry}
            label="Expiry"
            value={expiry}
            revoked={isRevoked}
          />
          <WallBadge
            icon={WallIcons.revoke}
            label="Revocable"
            value={revocable ? 'Yes' : 'No'}
            revoked={isRevoked}
          />
        </div>
      </div>

      {/* REVOKED stamp overlay */}
      {isRevoked && (
        <div
          aria-label="Revoked"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span
            className="text-revoke text-2xl font-semibold tracking-widest uppercase opacity-25 select-none"
            style={{
              fontFamily: 'var(--metador-font-display)',
              transform: 'rotate(-12deg)',
              letterSpacing: '0.2em',
            }}
          >
            REVOKED
          </span>
        </div>
      )}
    </div>
  );
}

function MonoBrass({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-primary"
      style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
    >
      {children}
    </span>
  );
}

function WallBadge({
  icon,
  label,
  value,
  revoked,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  revoked: boolean;
}) {
  return (
    <div className="flex flex-col gap-1" role="listitem">
      <div
        className={[
          'flex items-center gap-1',
          revoked ? 'text-revoke/70' : 'text-muted',
        ].join(' ')}
      >
        {icon}
        <span className="text-2xs font-medium uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span
        className={[
          'text-xs font-mono',
          revoked ? 'text-revoke/60' : 'text-text',
        ].join(' ')}
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {value}
      </span>
    </div>
  );
}
