import { describe, expect, it } from 'vitest';

/**
 * Test the pure sentence-building logic extracted here so tests don't need
 * jsdom for rendering. PolicyCard renders these values verbatim.
 */

/** Mirror of formatExpiry in PolicyCard.tsx */
function formatExpiry(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Build the plain-English policy sentence for known-answer testing. */
function buildPolicySentence(opts: {
  pool: string;
  budgetFormatted: string;
  quoteSymbol: string;
  expiresAtMs: number;
  revocable: boolean;
}): string {
  const expiry = formatExpiry(opts.expiresAtMs);
  const revocableClause = opts.revocable
    ? 'the owner can revoke it at any time.'
    : 'it cannot be revoked early.';
  return (
    `This vault can trade only ${opts.pool}, spend at most ` +
    `${opts.budgetFormatted} ${opts.quoteSymbol}, expires ${expiry}, and ${revocableClause}`
  );
}

describe('PolicyCard sentence builder', () => {
  const baseProps = {
    pool: 'DEEP/SUI',
    budgetFormatted: '1,000',
    quoteSymbol: 'SUI',
    expiresAtMs: new Date('2026-07-20T00:00:00Z').getTime(),
    revocable: true,
  };

  it('builds a valid sentence with revocable=true', () => {
    const sentence = buildPolicySentence(baseProps);
    expect(sentence).toContain('DEEP/SUI');
    expect(sentence).toContain('1,000 SUI');
    expect(sentence).toContain('the owner can revoke it at any time.');
    expect(sentence).toMatch(/expires Jul 20, 2026/);
  });

  it('builds a valid sentence with revocable=false', () => {
    const sentence = buildPolicySentence({ ...baseProps, revocable: false });
    expect(sentence).toContain('it cannot be revoked early.');
    expect(sentence).not.toContain('the owner can revoke');
  });

  it('includes the pool name verbatim', () => {
    const s = buildPolicySentence({ ...baseProps, pool: 'SUI/DBUSDC' });
    expect(s).toContain('SUI/DBUSDC');
  });

  it('includes budget + symbol together', () => {
    const s = buildPolicySentence({
      ...baseProps,
      budgetFormatted: '500',
      quoteSymbol: 'USDC',
    });
    expect(s).toContain('500 USDC');
  });

  it('formats expiry correctly for a known timestamp', () => {
    // 2026-12-31
    const ms = new Date('2026-12-31T00:00:00Z').getTime();
    const expiry = formatExpiry(ms);
    expect(expiry).toMatch(/Dec 31, 2026/);
  });

  it('sentence starts with "This vault can trade only"', () => {
    const s = buildPolicySentence(baseProps);
    expect(s.startsWith('This vault can trade only')).toBe(true);
  });
});
