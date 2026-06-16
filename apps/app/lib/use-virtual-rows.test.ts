import { describe, expect, it } from 'vitest';
import { computeRange } from './use-virtual-rows';

const opts = { count: 500, rowHeight: 40, viewportHeight: 720, overscan: 8 };

describe('computeRange (windowed virtualization)', () => {
  it('windows from the top at scrollTop 0', () => {
    const r = computeRange(0, opts);
    expect(r.start).toBe(0);
    // ceil(720/40)=18 visible + 8 overscan
    expect(r.end).toBe(26);
    expect(r.padTop).toBe(0);
    expect(r.padBottom).toBe((500 - 26) * 40);
  });

  it('keeps the DOM row count bounded well under 120', () => {
    const r = computeRange(4000, opts);
    expect(r.end - r.start).toBeLessThanOrEqual(120);
    // visible(18) + 2*overscan(16) = 34 at most
    expect(r.end - r.start).toBeLessThanOrEqual(34);
  });

  it('preserves total scroll height via spacers', () => {
    const r = computeRange(4000, opts);
    const windowPx = (r.end - r.start) * opts.rowHeight;
    expect(r.padTop + windowPx + r.padBottom).toBe(opts.count * opts.rowHeight);
  });

  it('clamps to the dataset end', () => {
    const r = computeRange(opts.count * opts.rowHeight, opts);
    expect(r.end).toBe(opts.count);
    expect(r.padBottom).toBe(0);
  });

  it('renders all rows when the dataset is empty or unmeasured', () => {
    expect(computeRange(0, { ...opts, count: 0 }).end).toBe(0);
    expect(computeRange(0, { ...opts, viewportHeight: 0 }).end).toBe(opts.count);
  });
});
