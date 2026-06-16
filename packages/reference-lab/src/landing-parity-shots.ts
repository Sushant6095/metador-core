/**
 * landing-parity-shots.ts — Design Loop capture for the landing premium pass.
 *
 * Captures hero + 2 scroll points at 1440 and 390 into a round directory:
 *   docs/research/keel-shots/landing-parity/round-<N>/
 *     1440-hero.png · 1440-scroll-1.png · 1440-scroll-2.png · 1440-full.png
 *      390-hero.png ·  390-scroll-1.png ·  390-scroll-2.png
 *
 * Usage: tsx src/landing-parity-shots.ts <roundNumber>
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';

const TARGET_URL = process.env.METADOR_WEB_URL ?? 'http://localhost:3000';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const HERO_SETTLE_MS = 3_000;
const SCROLL_SETTLE_MS = 900;

interface Viewport {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: readonly Viewport[] = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
] as const;

async function scrollTo(page: Page, y: number): Promise<void> {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y);
  await page.waitForTimeout(SCROLL_SETTLE_MS);
}

async function captureViewport(vw: Viewport, outDir: string): Promise<void> {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({
    viewport: { width: vw.width, height: vw.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(HERO_SETTLE_MS);
    await page.screenshot({ path: path.join(outDir, `${vw.name}-hero.png`) });

    // Scroll to named sections so whileInView reveals fire, then shoot.
    async function shootSection(id: string, file: string): Promise<void> {
      await page.evaluate((sectionId) => {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
        }
      }, id);
      await page.waitForTimeout(SCROLL_SETTLE_MS);
      await page.screenshot({ path: path.join(outDir, file) });
    }

    await shootSection('flagship-app', `${vw.name}-flagship.png`);
    await shootSection('stack', `${vw.name}-stack.png`);

    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await scrollTo(page, Math.round(height * 0.32));
    await page.screenshot({ path: path.join(outDir, `${vw.name}-scroll-1.png`) });
    await scrollTo(page, Math.round(height * 0.62));
    await page.screenshot({ path: path.join(outDir, `${vw.name}-scroll-2.png`) });

    if (vw.name === '1440') {
      await scrollTo(page, 0);
      await page.screenshot({ path: path.join(outDir, `${vw.name}-full.png`), fullPage: true });
    }
    process.stdout.write(`captured ${vw.name}\n`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main(): Promise<void> {
  const round = process.argv[2] ?? '0';
  const outDir = path.join(REPO_ROOT, 'docs/research/keel-shots/landing-parity', `round-${round}`);
  await mkdir(outDir, { recursive: true });
  for (const vw of VIEWPORTS) {
    await captureViewport(vw, outDir);
  }
  process.stdout.write(`done → ${outDir}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`capture failed: ${String(error)}\n`);
  process.exit(1);
});
