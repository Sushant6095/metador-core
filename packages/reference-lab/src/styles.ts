/**
 * styles.ts — computed-styles walk → measurements.json (BOOTSTRAP Phase E §2).
 * Records frequency tables for type, color, spacing, radii, shadows.
 * Measurements may ship into Metador; assets never do (CLAUDE.md §8).
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import type { CaptureTarget, StyleMeasurements, Viewport } from './types';
import { shimEvaluateHelpers } from './util';

type FrequencyTables = Omit<StyleMeasurements, 'url' | 'viewport' | 'capturedAt'>;

export async function measureStyles(
  target: CaptureTarget,
  viewport: Viewport,
  outDir: string,
): Promise<StyleMeasurements | null> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();
  try {
    await shimEvaluateHelpers(page);
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(target.settleMs ?? 5_000);

    const tables = await page.evaluate((): FrequencyTables => {
      const bump = (table: Record<string, number>, key: string): void => {
        if (!key || key === 'none' || key === 'normal' || key === 'auto') return;
        table[key] = (table[key] ?? 0) + 1;
      };
      const t: FrequencyTables = {
        fontFamilies: {},
        fontSizes: {},
        fontWeights: {},
        lineHeights: {},
        colors: {},
        backgroundColors: {},
        spacingSamples: {},
        radii: {},
        shadows: {},
      };
      const elements = Array.from(document.querySelectorAll('body *')).slice(0, 5000);
      for (const el of elements) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        bump(t.fontFamilies, cs.fontFamily);
        bump(t.fontSizes, cs.fontSize);
        bump(t.fontWeights, cs.fontWeight);
        bump(t.lineHeights, cs.lineHeight);
        bump(t.colors, cs.color);
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          bump(t.backgroundColors, cs.backgroundColor);
        }
        for (const v of [cs.paddingTop, cs.paddingLeft, cs.marginTop, cs.gap]) {
          if (v && v !== '0px') bump(t.spacingSamples, v);
        }
        if (cs.borderRadius !== '0px') bump(t.radii, cs.borderRadius);
        bump(t.shadows, cs.boxShadow);
      }
      return t;
    });

    const sortTable = (table: Record<string, number>): Record<string, number> =>
      Object.fromEntries(
        Object.entries(table)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 40),
      );

    const measurements: StyleMeasurements = {
      url: target.url,
      viewport: viewport.name,
      capturedAt: new Date().toISOString(),
      fontFamilies: sortTable(tables.fontFamilies),
      fontSizes: sortTable(tables.fontSizes),
      fontWeights: sortTable(tables.fontWeights),
      lineHeights: sortTable(tables.lineHeights),
      colors: sortTable(tables.colors),
      backgroundColors: sortTable(tables.backgroundColors),
      spacingSamples: sortTable(tables.spacingSamples),
      radii: sortTable(tables.radii),
      shadows: sortTable(tables.shadows),
    };

    const file = path.join(outDir, `measurements-${viewport.name}.json`);
    await writeFile(file, JSON.stringify(measurements, null, 2));
    return measurements;
  } catch (error: unknown) {
    console.error(`measureStyles failed (${target.slug} @ ${viewport.name}):`, error);
    return null;
  } finally {
    await context.close();
    await browser.close();
  }
}
