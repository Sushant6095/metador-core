// One-off screenshot helper for the UI-overhaul /design-review loop.
// Usage: node scripts/shoot.mjs <url> <outPrefix>  → writes <outPrefix>-1440.png and -390.png
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:3001/screener';
const prefix = process.argv[3] ?? '/tmp/metador-shots/shot';

const browser = await chromium.launch();
try {
  for (const [w, h, tall] of [
    [1440, 900, true],
    [390, 844, true],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(Number(process.env.SETTLE_MS || 700)); // let entrance/chart init settle
    await page.screenshot({ path: `${prefix}-${w}.png`, fullPage: tall, animations: 'disabled', timeout: 30000 });
    await ctx.close();
    console.log(`shot ${w} → ${prefix}-${w}.png`);
  }
} finally {
  await browser.close();
}
