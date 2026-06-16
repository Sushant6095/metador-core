/**
 * metador-web-shots.ts — Design Loop capture for the rebuilt Metador home page.
 *
 * Captures, at 390 and 1440:
 *   (a) hero viewport shot after a 3s settle
 *   (b) a stepped-scroll pass (600px steps, 700ms settle so whileInView fires),
 *       one shot per step
 *   (c) a final full-page shot after the scroll pass
 *
 * Output: docs/research/metador-shots/web-v2/<vw>-{hero,scroll-NN,full}.png
 *
 * Run from repo root:
 *   pnpm --filter @metador/reference-lab exec tsx src/metador-web-shots.ts
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

const TARGET_URL = process.env.METADOR_WEB_URL ?? 'http://localhost:3000';
const OUT_DIR = path.resolve(
  import.meta.dirname,
  '../../../docs/research/metador-shots/web-v2',
);

const HERO_SETTLE_MS = 3_000;
const SCROLL_STEP_PX = 600;
const SCROLL_SETTLE_MS = 700;
const MAX_SCROLL_STEPS = 24;

interface Shot {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: readonly Shot[] = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 },
] as const;

async function pageHeight(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight);
}

async function captureViewport(vw: Shot): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: vw.width, height: vw.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60_000 });

    // (a) hero viewport shot after settle
    await page.waitForTimeout(HERO_SETTLE_MS);
    await page.screenshot({
      path: path.join(OUT_DIR, `${vw.name}-hero.png`),
    });

    // (b) stepped-scroll pass
    const height = await pageHeight(page);
    const steps = Math.min(MAX_SCROLL_STEPS, Math.ceil(height / SCROLL_STEP_PX));
    for (let i = 0; i < steps; i++) {
      const y = i * SCROLL_STEP_PX;
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y);
      await page.waitForTimeout(SCROLL_SETTLE_MS);
      await page.screenshot({
        path: path.join(OUT_DIR, `${vw.name}-scroll-${String(i).padStart(2, '0')}.png`),
      });
    }

    // (c) final full-page shot
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(SCROLL_SETTLE_MS);
    await page.screenshot({
      path: path.join(OUT_DIR, `${vw.name}-full.png`),
      fullPage: true,
    });

    process.stdout.write(`captured ${vw.name}: hero + ${steps} steps + full\n`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  for (const vw of VIEWPORTS) {
    await captureViewport(vw);
  }
  process.stdout.write(`done → ${OUT_DIR}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`capture failed: ${String(error)}\n`);
  process.exit(1);
});
