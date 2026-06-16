import { describe, expect, it } from 'vitest';
import { sparkGeometry } from './sparkline';

describe('sparkGeometry', () => {
  it('signs by the last point', () => {
    expect(sparkGeometry([0, 10, 50], 56, 22).sign).toBe('pos');
    expect(sparkGeometry([0, -10, -50], 56, 22).sign).toBe('neg');
    expect(sparkGeometry([0, 5, 0], 56, 22).sign).toBe('zero');
  });

  it('emits one point per series element', () => {
    const g = sparkGeometry([0, 10, 20, 30], 60, 24);
    expect(g.points.split(' ')).toHaveLength(4);
  });

  it('spans the full width across the series', () => {
    const g = sparkGeometry([0, 100], 56, 22);
    const xs = g.points.split(' ').map((p) => Number(p.split(',')[0]));
    expect(xs[0]).toBe(0);
    expect(xs[xs.length - 1]).toBeCloseTo(56, 1);
  });

  it('keeps y within the padded box', () => {
    const g = sparkGeometry([0, 500, -500, 200], 56, 22, 2);
    for (const pt of g.points.split(' ')) {
      const y = Number(pt.split(',')[1]);
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(20);
    }
  });

  it('handles a flat series without dividing by zero', () => {
    const g = sparkGeometry([0, 0, 0], 56, 22);
    for (const pt of g.points.split(' ')) {
      expect(Number.isFinite(Number(pt.split(',')[1]))).toBe(true);
    }
  });

  it('degrades to a flat midline for a single point', () => {
    const g = sparkGeometry([42], 56, 22);
    expect(g.points).toBe('0,11 56,11');
  });
});
