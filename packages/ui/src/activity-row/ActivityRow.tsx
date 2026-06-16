import * as React from 'react';

export type ActivityKind =
  | 'order'
  | 'rejected'
  | 'revoked'
  | 'deposit'
  | 'withdraw';

export interface ActivityRowProps {
  kind: ActivityKind;
  title: string;
  detail?: string;
  /** Unix ms timestamp */
  timestamp: number;
  txHash?: string;
  className?: string;
}

/** Format timestamp to compact HH:MM:SS UTC */
function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

const kindConfig: Record<
  ActivityKind,
  {
    rowBg: string;
    rule: string;
    chip: React.ReactNode | null;
    textColor: string;
  }
> = {
  rejected: {
    rowBg: 'bg-[var(--metador-tint-danger)]',
    rule: 'border-l-2 border-danger',
    chip: (
      <span className="text-2xs font-medium uppercase tracking-widest text-danger bg-danger/10 px-1.5 py-0.5 rounded-xs">
        rejected by policy
      </span>
    ),
    textColor: 'text-text',
  },
  revoked: {
    rowBg: 'bg-[var(--metador-tint-revoke)]',
    rule: 'border-l-2 border-revoke',
    chip: null,
    textColor: 'text-revoke',
  },
  order: {
    rowBg: '',
    rule: '',
    chip: null,
    textColor: 'text-text',
  },
  deposit: {
    rowBg: '',
    rule: '',
    chip: null,
    textColor: 'text-text',
  },
  withdraw: {
    rowBg: '',
    rule: '',
    chip: null,
    textColor: 'text-text',
  },
};

/**
 * Activity feed row — styled per kind.
 * rejected → tint-danger + danger left rule + chip.
 * revoked  → tint-revoke terminal styling, revoke text.
 * others   → plain surface row.
 * Designed to be wrapped in a Motion-animated list in the consuming feed component.
 */
export function ActivityRow({
  kind,
  title,
  detail,
  timestamp,
  txHash,
  className,
}: ActivityRowProps) {
  const { rowBg, rule, chip, textColor } = kindConfig[kind];

  return (
    <li
      className={[
        'flex items-start gap-3 px-4 py-2',
        'border-b border-border/50',
        rowBg,
        rule,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={[
              'text-sm font-medium truncate',
              textColor,
              kind === 'revoked' ? 'font-semibold' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {title}
          </span>
          {chip}
        </div>
        {detail && (
          <span className="text-xs text-muted truncate">{detail}</span>
        )}
        {txHash && (
          <span
            /* text-faint fails SC 1.4.3 at 12px (2.97–3.33:1); switch to text-muted */
            className="text-2xs font-mono text-muted truncate"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {txHash}
          </span>
        )}
      </div>

      {/* Timestamp */}
      {/* text-faint fails SC 1.4.3 at 12px (3.33:1 dark, 2.97:1 over danger tint); switch to text-muted */}
      <time
        dateTime={new Date(timestamp).toISOString()}
        className="text-2xs font-mono text-muted shrink-0 mt-0.5"
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {formatTimestamp(timestamp)}
      </time>
    </li>
  );
}
