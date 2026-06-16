/**
 * stack.ts — detect frontend libraries from script tags, globals, and
 * network requests → stack.md (BOOTSTRAP Phase E §3).
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import type { CaptureTarget } from './types';
import { shimEvaluateHelpers } from './util';

const LIBRARY_SIGNATURES: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'three.js', pattern: /three(\.module|\.min)?\.js|\/three@|three\/build/i },
  { name: 'Spline', pattern: /spline|@splinetool/i },
  { name: 'motion / framer-motion', pattern: /framer-motion|motion-dom|motion\.dev/i },
  { name: 'GSAP', pattern: /gsap|greensock/i },
  { name: 'lenis (smooth scroll)', pattern: /lenis/i },
  { name: 'React', pattern: /react(-dom)?(\.production)?(\.min)?\.js|\/react@/i },
  { name: 'Next.js', pattern: /_next\//i },
  { name: 'Vue', pattern: /vue(\.runtime)?(\.min)?\.js/i },
  { name: 'Svelte', pattern: /svelte/i },
  { name: 'Tailwind', pattern: /tailwind/i },
  { name: 'lightweight-charts', pattern: /lightweight-charts/i },
  { name: 'TradingView', pattern: /tradingview|charting_library/i },
  { name: 'd3', pattern: /\bd3(\.min)?\.js|\/d3@/i },
  { name: 'lottie', pattern: /lottie/i },
  { name: 'WebGL/canvas (heuristic)', pattern: /webgl|regl|pixi/i },
  { name: 'Framer (site builder)', pattern: /framerusercontent|framer\.com\/sites|events\.framer/i },
  { name: 'Webflow', pattern: /webflow/i },
  { name: 'Wix', pattern: /wixstatic|parastorage/i },
];

const GLOBAL_PROBES: ReadonlyArray<{ name: string; expr: string }> = [
  { name: 'React (global hook)', expr: '!!window.__REACT_DEVTOOLS_GLOBAL_HOOK__' },
  { name: 'Next.js (window.next)', expr: '!!window.next' },
  { name: 'GSAP (window.gsap)', expr: '!!window.gsap' },
  { name: 'three.js (window.THREE)', expr: '!!window.THREE' },
  { name: 'Lenis (window.lenis)', expr: '!!window.lenis' },
];

/** String markers that survive minification inside JS bundles. */
const CONTENT_SIGNATURES: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'React (bundled)', pattern: /Minified React error|react\.production/i },
  { name: 'GSAP (bundled)', pattern: /greensock|gsap/i },
  { name: 'ScrollTrigger (bundled)', pattern: /ScrollTrigger/ },
  { name: 'framer-motion / motion (bundled)', pattern: /framer-motion|motion-dom|AnimatePresence/i },
  { name: 'lenis (bundled)', pattern: /lenis/i },
  { name: 'three.js (bundled)', pattern: /WebGLRenderer|@splinetool/i },
  { name: 'lottie (bundled)', pattern: /lottie/i },
  { name: 'react-spring (bundled)', pattern: /react-spring/i },
  { name: 'styled-components (bundled)', pattern: /styled-components/i },
  { name: 'IntersectionObserver (raw usage)', pattern: /IntersectionObserver/ },
  { name: 'requestAnimationFrame loop (raw)', pattern: /requestAnimationFrame/ },
];

const MAX_BUNDLES_SCANNED = 4;
const MAX_BUNDLE_BYTES = 4_000_000;

export async function detectStack(target: CaptureTarget, outDir: string): Promise<string[]> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const requestUrls: string[] = [];
  page.on('request', (request) => {
    requestUrls.push(request.url());
  });

  const detected = new Set<string>();
  try {
    await shimEvaluateHelpers(page);
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(target.settleMs ?? 5_000);

    const scriptSrcs = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLScriptElement>('script')).map(
        (s) => s.src || s.textContent?.slice(0, 200) || '',
      ),
    );
    const haystack = [...requestUrls, ...scriptSrcs];
    for (const { name, pattern } of LIBRARY_SIGNATURES) {
      if (haystack.some((url) => pattern.test(url))) detected.add(name);
    }
    for (const { name, expr } of GLOBAL_PROBES) {
      try {
        const present = await page.evaluate(`(() => ${expr})()`);
        if (present === true) detected.add(name);
      } catch {
        // probe blocked (CSP) — fine, signature scan above still applies
      }
    }
    const canvasCount = await page.evaluate(() => document.querySelectorAll('canvas').length);
    if (canvasCount > 0) detected.add(`<canvas> elements: ${canvasCount}`);

    // SPA bundles hide library names from URL matching — scan contents.
    const bundleUrls = requestUrls
      .filter((url) => /\.js(\?|$)/.test(url))
      .slice(0, MAX_BUNDLES_SCANNED);
    for (const bundleUrl of bundleUrls) {
      try {
        const response = await context.request.get(bundleUrl, { timeout: 30_000 });
        const body = (await response.text()).slice(0, MAX_BUNDLE_BYTES);
        for (const { name, pattern } of CONTENT_SIGNATURES) {
          if (pattern.test(body)) detected.add(name);
        }
      } catch {
        detected.add(`bundle scan skipped (fetch failed): ${bundleUrl}`);
      }
    }
  } catch (error: unknown) {
    detected.add(`DETECTION INCOMPLETE: ${String(error)}`);
  } finally {
    await context.close();
    await browser.close();
  }

  const lines = [
    `# Stack — ${target.label}`,
    '',
    `Source: ${target.url} · detected ${new Date().toISOString()}`,
    '',
    ...Array.from(detected)
      .sort()
      .map((d) => `- ${d}`),
    '',
    `Network requests sampled: ${requestUrls.length}`,
  ];
  await writeFile(path.join(outDir, 'stack.md'), lines.join('\n'));
  return Array.from(detected);
}
