/**
 * metador-web-reduced-motion.ts — verify prefers-reduced-motion collapses motion.
 *
 * Under reduced-motion the Three.js scene must NOT mount (ArmatureSlot bails),
 * leaving the static ArmaturePoster (brass MetadorMark) visible. This captures the
 * hero at 390 and 1440 with reducedMotion forced, to judge the poster path.
 *
 * Output: docs/research/metador-shots/web-v2/<vw>-hero-reduced.png
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET_URL = process.env.METADOR_WEB_URL ?? 'http://localhost:3000';
const OUT_DIR = path.resolve(
  import.meta.dirname,
  '../../../docs/research/metador-shots/web-v2',
);

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1440', width: 1440, height: 900 },
] as const;

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  for (const vw of VIEWPORTS) {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: vw.width, height: vw.height },
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3_000);
    await page.screenshot({
      path: path.join(OUT_DIR, `${vw.name}-hero-reduced.png`),
    });
    // Count canvas elements — must be 0 under reduced motion (scene never mounts)
    const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
    process.stdout.write(`${vw.name}: canvas count under reduced-motion = ${canvasCount}\n`);
    await context.close();
    await browser.close();
  }
  process.stdout.write(`done → ${OUT_DIR}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`reduced-motion capture failed: ${String(error)}\n`);
  process.exit(1);
});
