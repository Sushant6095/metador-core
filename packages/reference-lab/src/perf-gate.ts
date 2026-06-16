/**
 * perf-gate.ts — BOOTSTRAP Phase G performance gate for the web home.
 *
 * Loads http://localhost:3000 cold (fresh context per run, no cache) and
 * collects via injected PerformanceObserver:
 *   - LCP (latest candidate)
 *   - CLS (sum of layout-shift entries without recent input)
 *   - TBT approximation (sum of longtask blocking time, duration - 50ms)
 * Plus transferred JS bytes for the initial route, split into the
 * three.js hero chunk(s) vs the rest (transferSize = gzip + headers).
 *
 * 3 cold runs → medians. Then:
 *   - verifies the three.js chunk loads only after domContentLoaded (idle defer)
 *   - verifies the three.js chunk never loads under prefers-reduced-motion
 *
 * Gate: LCP < 2.5s · CLS < 0.05 · three deferred · reduced-motion skips three.
 *
 * Run: pnpm exec tsx src/perf-gate.ts
 */

import { chromium, type Browser, type Page } from 'playwright';

const TARGET_URL = 'http://localhost:3000';
const RUNS = 3;
// rIC timeout in ArmatureSlot is 2000ms; allow chunk fetch + LCP settle.
const SETTLE_MS = 7000;
const REDUCED_MOTION_SETTLE_MS = 9000;

const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.05;

// Markers that identify the three.js library inside a served JS chunk.
const THREE_MARKERS = ['Three.js Authors', 'WebGLRenderer', 'three.module.js'];

interface JsResource {
  url: string;
  startTimeMs: number; // relative to navigationStart
  transferSize: number; // encoded bytes over the wire incl. headers
  encodedBodySize: number; // compressed body bytes
  isThree: boolean;
}

interface RunResult {
  lcpMs: number | null;
  cls: number;
  tbtMs: number;
  domContentLoadedMs: number;
  jsResources: JsResource[];
  threeBytes: number;
  restBytes: number;
  threeChunkUrls: string[];
  earliestThreeStartMs: number | null;
}

declare global {
  interface Window {
    __perf: { lcp: number | null; cls: number; tbt: number };
  }
}

const INIT_SCRIPT = `
  window.__perf = { lcp: null, cls: 0, tbt: 0 };
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) window.__perf.lcp = last.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__perf.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.tbt += Math.max(0, entry.duration - 50);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch (e) {}
`;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const hi = sorted[mid] ?? 0;
  if (sorted.length % 2 === 0) {
    const lo = sorted[mid - 1] ?? 0;
    return (lo + hi) / 2;
  }
  return hi;
}

function shortName(url: string): string {
  return url.replace(TARGET_URL, '');
}

async function collectRun(browser: Browser, reducedMotion: boolean): Promise<RunResult> {
  // Fresh context per run = cold cache, no storage carryover.
  const context = await browser.newContext({
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    viewport: { width: 1440, height: 900 },
  });
  const page: Page = await context.newPage();
  await page.addInitScript(INIT_SCRIPT);

  // Sniff every JS response body for three.js markers.
  const threeUrls = new Set<string>();
  page.on('response', (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] ?? '';
    const isJs = contentType.includes('javascript') || /\.m?js(\?|$)/.test(url);
    if (!isJs) return;
    response
      .text()
      .then((body) => {
        if (THREE_MARKERS.some((marker) => body.includes(marker))) {
          threeUrls.add(url);
        }
      })
      .catch(() => {
        /* response body may be unavailable on teardown — ignore */
      });
  });

  await page.goto(TARGET_URL, { waitUntil: 'load' });
  await page.waitForTimeout(reducedMotion ? REDUCED_MOTION_SETTLE_MS : SETTLE_MS);

  const inPage = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((entry) => entry.initiatorType === 'script' || /\.m?js(\?|$)/.test(entry.name))
      .map((entry) => ({
        url: entry.name,
        startTimeMs: entry.startTime,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
      }));
    return {
      perf: window.__perf,
      domContentLoadedMs: nav.domContentLoadedEventEnd,
      resources,
    };
  });

  await context.close();

  const jsResources: JsResource[] = inPage.resources.map((resource) => ({
    ...resource,
    isThree: threeUrls.has(resource.url),
  }));

  const threeResources = jsResources.filter((resource) => resource.isThree);
  const threeBytes = threeResources.reduce((sum, r) => sum + r.transferSize, 0);
  const restBytes = jsResources
    .filter((resource) => !resource.isThree)
    .reduce((sum, r) => sum + r.transferSize, 0);
  const earliestThreeStartMs =
    threeResources.length > 0 ? Math.min(...threeResources.map((r) => r.startTimeMs)) : null;

  return {
    lcpMs: inPage.perf.lcp,
    cls: inPage.perf.cls,
    tbtMs: inPage.perf.tbt,
    domContentLoadedMs: inPage.domContentLoadedMs,
    jsResources,
    threeBytes,
    restBytes,
    threeChunkUrls: threeResources.map((r) => shortName(r.url)),
    earliestThreeStartMs,
  };
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const runs: RunResult[] = [];

  try {
    for (let i = 0; i < RUNS; i += 1) {
      const run = await collectRun(browser, false);
      runs.push(run);
      console.log(
        `run ${i + 1}: LCP=${run.lcpMs?.toFixed(0)}ms CLS=${run.cls.toFixed(4)} ` +
          `TBT~=${run.tbtMs.toFixed(0)}ms DCL=${run.domContentLoadedMs.toFixed(0)}ms ` +
          `threeJS=${(run.threeBytes / 1024).toFixed(1)}KB restJS=${(run.restBytes / 1024).toFixed(1)}KB ` +
          `threeStart=${run.earliestThreeStartMs?.toFixed(0) ?? 'n/a'}ms ` +
          `threeChunks=[${run.threeChunkUrls.join(', ')}]`,
      );
    }

    const reduced = await collectRun(browser, true);
    console.log(
      `reduced-motion run: threeChunks=${reduced.threeChunkUrls.length} ` +
        `[${reduced.threeChunkUrls.join(', ')}] totalJS=${((reduced.threeBytes + reduced.restBytes) / 1024).toFixed(1)}KB`,
    );

    const lcpValues = runs.map((run) => run.lcpMs).filter((v): v is number => v !== null);
    const medLcp = lcpValues.length > 0 ? median(lcpValues) : NaN;
    const medCls = median(runs.map((run) => run.cls));
    const medTbt = median(runs.map((run) => run.tbtMs));
    const medThreeBytes = median(runs.map((run) => run.threeBytes));
    const medRestBytes = median(runs.map((run) => run.restBytes));

    const threeAlwaysPresent = runs.every((run) => run.threeChunkUrls.length > 0);
    const threeAlwaysAfterDcl = runs.every(
      (run) =>
        run.earliestThreeStartMs !== null && run.earliestThreeStartMs > run.domContentLoadedMs,
    );
    const reducedMotionSkipsThree = reduced.threeChunkUrls.length === 0;

    const lcpPass = lcpValues.length === RUNS && medLcp < LCP_BUDGET_MS;
    const clsPass = medCls < CLS_BUDGET;

    console.log('\n=== MEDIANS (3 cold runs) ===');
    console.log(`LCP:        ${medLcp.toFixed(0)}ms  (budget < ${LCP_BUDGET_MS}ms)  ${lcpPass ? 'PASS' : 'FAIL'}`);
    console.log(`CLS:        ${medCls.toFixed(4)}  (budget < ${CLS_BUDGET})  ${clsPass ? 'PASS' : 'FAIL'}`);
    console.log(`TBT approx: ${medTbt.toFixed(0)}ms  (longtask blocking sum)`);
    console.log(`JS three:   ${(medThreeBytes / 1024).toFixed(1)}KB transferred (gzip)`);
    console.log(`JS rest:    ${(medRestBytes / 1024).toFixed(1)}KB transferred (gzip)`);
    console.log(`Three chunk present in normal runs: ${threeAlwaysPresent ? 'yes' : 'NO'}`);
    console.log(
      `Three deferred (request start > DCL in all runs): ${threeAlwaysAfterDcl ? 'PASS' : 'FAIL'}`,
    );
    runs.forEach((run, i) =>
      console.log(
        `  run ${i + 1}: threeStart=${run.earliestThreeStartMs?.toFixed(0) ?? 'n/a'}ms vs DCL=${run.domContentLoadedMs.toFixed(0)}ms`,
      ),
    );
    console.log(`Reduced-motion skips three entirely: ${reducedMotionSkipsThree ? 'PASS' : 'FAIL'}`);

    const verdict =
      lcpPass && clsPass && threeAlwaysPresent && threeAlwaysAfterDcl && reducedMotionSkipsThree
        ? 'PASS'
        : 'FAIL';
    console.log(`\nGATE VERDICT: ${verdict}`);
    process.exitCode = verdict === 'PASS' ? 0 : 1;
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error('perf-gate failed to run:', error instanceof Error ? error.message : error);
  process.exitCode = 2;
});
