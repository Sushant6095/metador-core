/**
 * app-shots.ts — screenshot every app route for the premium-consistency
 * sweep (founder STEP 3). Captures all 8 routes at 1440 plus the
 * detail / revoked / cockpit at 390 → docs/research/metador-shots/app-parity/round-N/.
 *
 * Usage: pnpm --filter @metador/reference-lab tsx src/app-shots.ts <round>
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const BASE = 'http://localhost:3001';

// Active vault id (Deep Blue DCA) + revoked Harbor vault id.
const ACTIVE_VAULT = '0xa11ce00000000000000000000000000000000000000000000000000000000001';
const REVOKED_VAULT = '0xa11ce00000000000000000000000000000000000000000000000000000000004';

interface Shot {
  slug: string;
  url: string;
  vp: { width: number; height: number };
  fullPage?: boolean;
}

const SHOTS: Shot[] = [
  { slug: 'marketplace-1440', url: `${BASE}/`, vp: { width: 1440, height: 1200 }, fullPage: true },
  { slug: 'screener-1440', url: `${BASE}/screener`, vp: { width: 1440, height: 1200 }, fullPage: true },
  { slug: 'vault-active-1440', url: `${BASE}/vault/${ACTIVE_VAULT}`, vp: { width: 1440, height: 1400 }, fullPage: true },
  { slug: 'vault-revoked-1440', url: `${BASE}/vault/${REVOKED_VAULT}`, vp: { width: 1440, height: 1400 }, fullPage: true },
  // Cockpit demo view (?demo=1) renders the full leader cockpit without a
  // wallet so the density grammar is reachable in screenshots + review.
  { slug: 'cockpit-1440', url: `${BASE}/cockpit?demo=1`, vp: { width: 1440, height: 1400 }, fullPage: true },
  { slug: 'portfolio-1440', url: `${BASE}/portfolio`, vp: { width: 1440, height: 1000 }, fullPage: true },
  { slug: 'create-1440', url: `${BASE}/create`, vp: { width: 1440, height: 1200 }, fullPage: true },
  { slug: 'safety-1440', url: `${BASE}/safety`, vp: { width: 1440, height: 1600 }, fullPage: true },
  { slug: 'kitchen-sink-1440', url: `${BASE}/kitchen-sink`, vp: { width: 1440, height: 2400 }, fullPage: true },
  // Reachable async state — vault detail loading skeleton.
  { slug: 'vault-loading-1440', url: `${BASE}/vault/${ACTIVE_VAULT}?loading=1`, vp: { width: 1440, height: 900 }, fullPage: true },
  // 390 key routes
  { slug: 'vault-active-390', url: `${BASE}/vault/${ACTIVE_VAULT}`, vp: { width: 390, height: 1600 }, fullPage: true },
  { slug: 'vault-revoked-390', url: `${BASE}/vault/${REVOKED_VAULT}`, vp: { width: 390, height: 1600 }, fullPage: true },
  { slug: 'cockpit-390', url: `${BASE}/cockpit?demo=1`, vp: { width: 390, height: 1400 }, fullPage: true },
];

async function main(): Promise<void> {
  const round = process.argv[2] ?? '1';
  const outDir = path.join(REPO_ROOT, 'docs/research/keel-shots/app-parity', `round-${round}`);
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  for (const shot of SHOTS) {
    const page = await browser.newPage({ viewport: shot.vp });
    try {
      await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(1400); // let staggered entrances + spring settle
      const file = path.join(outDir, `${shot.slug}.png`);
      await page.screenshot({ path: file, fullPage: shot.fullPage ?? false });
      console.log(`shot ${shot.slug} → ${file}`);
    } catch (error: unknown) {
      console.error(`shot ${shot.slug} FAILED`, error);
    } finally {
      await page.close();
    }
  }
  await browser.close();
  console.log('app-shots: done');
}

main();
