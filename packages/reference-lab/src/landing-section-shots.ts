/**
 * landing-section-shots.ts — verify specific sections render on real scroll
 * (activity feed + footer) into the current round dir.
 * Usage: tsx src/landing-section-shots.ts <round> <id1> <id2> ...
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const TARGET_URL = process.env.METADOR_WEB_URL ?? 'http://localhost:3000';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function main(): Promise<void> {
  const round = process.argv[2] ?? '0';
  const ids = process.argv.slice(3);
  const outDir = path.join(REPO_ROOT, 'docs/research/keel-shots/landing-parity', `round-${round}`);
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);
    for (const id of ids) {
      await page.evaluate((sectionId) => {
        const el =
          document.getElementById(sectionId) ??
          (sectionId === 'footer' ? document.querySelector('footer') : null);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
        }
      }, id);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, `1440-${id}.png`) });
      process.stdout.write(`shot ${id}\n`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((e: unknown) => {
  process.stderr.write(`section shots failed: ${String(e)}\n`);
  process.exit(1);
});
