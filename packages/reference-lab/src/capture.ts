/**
 * capture.ts — full-page screenshot, stepped scroll shots, scroll video,
 * Playwright trace (BOOTSTRAP Phase E §1).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';
import type { CaptureTarget, Viewport } from './types';
import { shimEvaluateHelpers } from './util';

const SCROLL_STEP_PX = 800;
const SCROLL_SETTLE_MS = 600;
const MAX_SCROLL_SHOTS = 14;

async function pageHeight(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight);
}

export interface CaptureResult {
  fullPageShot: string | null;
  scrollShots: number;
  video: string | null;
  trace: string | null;
  errors: string[];
}

export async function captureTarget(
  target: CaptureTarget,
  viewport: Viewport,
  outDir: string,
): Promise<CaptureResult> {
  const errors: string[] = [];
  const shotsDir = path.join(outDir, 'shots');
  const videoDir = path.join(outDir, 'video');
  await mkdir(shotsDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: { dir: videoDir, size: { width: viewport.width, height: viewport.height } },
  });
  await context.tracing.start({ screenshots: true, snapshots: true });

  const result: CaptureResult = {
    fullPageShot: null,
    scrollShots: 0,
    video: null,
    trace: null,
    errors,
  };

  const page = await context.newPage();
  try {
    await shimEvaluateHelpers(page);
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(target.settleMs ?? 5_000);

    // Stepped scroll shots — also records scroll-triggered animation on video.
    const height = await pageHeight(page);
    const steps = Math.min(MAX_SCROLL_SHOTS, Math.ceil(height / SCROLL_STEP_PX));
    for (let i = 0; i < steps; i++) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), i * SCROLL_STEP_PX);
      await page.waitForTimeout(SCROLL_SETTLE_MS);
      const shotPath = path.join(shotsDir, `${viewport.name}-scroll-${String(i).padStart(2, '0')}.png`);
      await page.screenshot({ path: shotPath });
      result.scrollShots++;
    }

    // Full-page screenshot from the top.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(SCROLL_SETTLE_MS);
    const fullPath = path.join(shotsDir, `${viewport.name}-full.png`);
    try {
      await page.screenshot({ path: fullPath, fullPage: true, timeout: 30_000 });
      result.fullPageShot = fullPath;
    } catch (error: unknown) {
      // Some canvas-heavy SPAs reject fullPage; keep the viewport shot.
      errors.push(`fullPage screenshot failed: ${String(error)}`);
      await page.screenshot({ path: fullPath });
      result.fullPageShot = fullPath;
    }
  } catch (error: unknown) {
    errors.push(`capture failed: ${String(error)}`);
  } finally {
    const tracePath = path.join(outDir, `trace-${viewport.name}.zip`);
    try {
      await context.tracing.stop({ path: tracePath });
      result.trace = tracePath;
    } catch (error: unknown) {
      errors.push(`trace failed: ${String(error)}`);
    }
    const video = page.video();
    await context.close();
    await browser.close();
    if (video) {
      try {
        const videoPath = await video.path();
        result.video = videoPath;
      } catch (error: unknown) {
        errors.push(`video failed: ${String(error)}`);
      }
    }
  }
  return result;
}
