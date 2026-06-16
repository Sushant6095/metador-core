/**
 * flagship-shot.ts — capture OUR app marketplace at 1440 for the landing
 * flagship-app section (founder build-list #3).
 *
 * Output: apps/web/public/flagship-app.png  (the <Image> source)
 * Also a preview into docs/research/keel-shots/landing-parity/flagship-preview.png
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const APP_URL = process.env.METADOR_APP_URL ?? 'http://localhost:3001';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(REPO_ROOT, 'apps/web/public/flagship-app.png');
const PREVIEW = path.join(
  REPO_ROOT,
  'docs/research/keel-shots/landing-parity/flagship-preview.png',
);

async function main(): Promise<void> {
  await mkdir(path.dirname(OUT), { recursive: true });
  await mkdir(path.dirname(PREVIEW), { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  // deviceScaleFactor 1 keeps the PNG light; 1440×900 is the framed crop.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: OUT });
    await page.screenshot({ path: PREVIEW });
    process.stdout.write(`flagship → ${OUT}\n`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`flagship capture failed: ${String(error)}\n`);
  process.exit(1);
});
