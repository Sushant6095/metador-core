/**
 * choreo.ts — deep scroll-choreography study (founder directive 2026-06-12).
 * Three programmatic scrolls at different speeds per viewport; per-step
 * computed-style sampling (delta-only) of tracked elements + nav; frame
 * screenshots on the slow pass; video + trace per pass.
 * Output: docs/research/refs/<slug>/choreo/
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';
import type { CaptureTarget, Viewport } from './types';
import { shimEvaluateHelpers } from './util';

export interface SpeedProfile {
  name: string;
  stepPx: number;
  settleMs: number;
}

export const SPEEDS: readonly SpeedProfile[] = [
  { name: 'slow', stepPx: 80, settleMs: 400 },
  { name: 'medium', stepPx: 160, settleMs: 200 },
  { name: 'fast', stepPx: 320, settleMs: 100 },
] as const;

const MAX_STEPS = 140;
const MAX_TRACKED = 140;

interface TrackedElementInfo {
  index: number;
  tag: string;
  classes: string;
  text: string;
}

interface ElementSample {
  index: number;
  opacity?: string;
  transform?: string;
  filter?: string;
  top?: number;
}

interface StepRecord {
  scrollY: number;
  nav: { background: string; backdropFilter: string; boxShadow: string; height: number } | null;
  changes: ElementSample[];
}

interface ChoreoData {
  url: string;
  viewport: string;
  speed: string;
  scrollHeight: number;
  elements: TrackedElementInfo[];
  steps: StepRecord[];
}

async function setupTracking(page: Page): Promise<TrackedElementInfo[]> {
  return page.evaluate((maxTracked: number) => {
    // CRA/SPA pages often have NO semantic header/nav/section tags — select
    // by animation evidence + structure instead of tag names.
    interface Candidate {
      el: Element;
      animScore: number;
      area: number;
    }
    const depthOf = (el: Element): number => {
      let d = 0;
      let cur: Element | null = el;
      while (cur && cur !== document.body) {
        d++;
        cur = cur.parentElement;
      }
      return d;
    };
    const candidates: Candidate[] = [];
    const all = Array.from(document.body.querySelectorAll('*'));
    for (const el of all) {
      if (candidates.length > 4000) break;
      const rect = el.getBoundingClientRect();
      if (rect.width < 48 || rect.height < 24) continue;
      const depth = depthOf(el);
      if (depth > 10) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      let animScore = 0;
      if (cs.transitionDuration !== '0s') animScore += 2;
      if (cs.willChange !== 'auto') animScore += 2;
      if (cs.transform !== 'none') animScore += 2;
      if (Number(cs.opacity) < 1) animScore += 2;
      if (cs.animationName !== 'none') animScore += 2;
      if (cs.position === 'fixed' || cs.position === 'sticky') animScore += 1;
      if (el.tagName === 'CANVAS' || el.tagName === 'VIDEO') animScore += 1;
      candidates.push({ el, animScore, area: rect.width * rect.height });
    }
    candidates.sort((a, b) => b.animScore - a.animScore || b.area - a.area);
    const picked = candidates.slice(0, maxTracked).map((c) => c.el);
    interface TrackerWindow extends Window {
      __keelTracked?: Element[];
      __keelNav?: Element | null;
    }
    const w = window as TrackerWindow;
    w.__keelTracked = picked;
    // Nav = semantic header/nav, else the widest fixed/sticky element near the top.
    let nav: Element | null = document.querySelector('header') ?? document.querySelector('nav');
    if (!nav) {
      let bestWidth = 0;
      for (const c of candidates) {
        const cs = getComputedStyle(c.el);
        if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
        const rect = c.el.getBoundingClientRect();
        if (rect.top > 120 || rect.width < bestWidth) continue;
        bestWidth = rect.width;
        nav = c.el;
      }
    }
    w.__keelNav = nav;
    return picked.map((el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      classes: el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : '',
      text: (el.textContent ?? '').trim().slice(0, 40),
    }));
  }, MAX_TRACKED);
}

async function sampleStep(page: Page): Promise<Omit<StepRecord, 'scrollY'>> {
  return page.evaluate(() => {
    interface TrackerWindow extends Window {
      __keelTracked?: Element[];
      __keelPrev?: Record<number, string>;
    }
    const w = window as TrackerWindow;
    const tracked = w.__keelTracked ?? [];
    const prev = w.__keelPrev ?? {};
    const next: Record<number, string> = {};
    const changes: Array<{
      index: number;
      opacity?: string;
      transform?: string;
      filter?: string;
      top?: number;
    }> = [];
    tracked.forEach((el, index) => {
      const cs = getComputedStyle(el);
      const key = `${cs.opacity}|${cs.transform}|${cs.filter}`;
      next[index] = key;
      if (prev[index] !== key) {
        changes.push({
          index,
          opacity: cs.opacity,
          transform: cs.transform === 'none' ? undefined : cs.transform,
          filter: cs.filter === 'none' ? undefined : cs.filter,
          top: Math.round(el.getBoundingClientRect().top),
        });
      }
    });
    w.__keelPrev = next;
    interface NavWindow extends Window {
      __keelNav?: Element | null;
    }
    const navEl =
      (window as NavWindow).__keelNav ??
      document.querySelector('header') ??
      document.querySelector('nav');
    let nav: { background: string; backdropFilter: string; boxShadow: string; height: number } | null =
      null;
    if (navEl) {
      const ncs = getComputedStyle(navEl);
      nav = {
        background: ncs.backgroundColor,
        backdropFilter: ncs.backdropFilter,
        boxShadow: ncs.boxShadow,
        height: Math.round(navEl.getBoundingClientRect().height),
      };
    }
    return { nav, changes };
  });
}

export async function studyChoreography(
  target: CaptureTarget,
  viewport: Viewport,
  speed: SpeedProfile,
  outDir: string,
  captureFrames: boolean,
): Promise<{ steps: number; frames: number; video: string | null; errors: string[] }> {
  const errors: string[] = [];
  const choreoDir = path.join(outDir, 'choreo');
  const framesDir = path.join(choreoDir, `frames-${viewport.name}`);
  const videoDir = path.join(choreoDir, 'video');
  await mkdir(choreoDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });
  if (captureFrames) await mkdir(framesDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: { dir: videoDir, size: { width: viewport.width, height: viewport.height } },
  });
  const page = await context.newPage();
  const data: ChoreoData = {
    url: target.url,
    viewport: viewport.name,
    speed: speed.name,
    scrollHeight: 0,
    elements: [],
    steps: [],
  };
  let frames = 0;
  try {
    await shimEvaluateHelpers(page);
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(target.settleMs ?? 5_000);
    data.elements = await setupTracking(page);
    data.scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    const maxScroll = Math.max(0, data.scrollHeight - viewport.height);
    const stepCount = Math.min(MAX_STEPS, Math.ceil(maxScroll / speed.stepPx) + 1);
    for (let i = 0; i < stepCount; i++) {
      const scrollY = Math.min(i * speed.stepPx, maxScroll);
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), scrollY);
      await page.waitForTimeout(speed.settleMs);
      const sample = await sampleStep(page);
      data.steps.push({ scrollY, ...sample });
      if (captureFrames) {
        await page.screenshot({
          path: path.join(framesDir, `f${String(i).padStart(3, '0')}-y${scrollY}.png`),
        });
        frames++;
      }
      if (scrollY >= maxScroll) break;
    }
    await writeFile(
      path.join(choreoDir, `choreography-${viewport.name}-${speed.name}.json`),
      JSON.stringify(data, null, 1),
    );
  } catch (error: unknown) {
    errors.push(String(error));
    console.error(`choreo failed (${viewport.name}/${speed.name}):`, error);
  }
  const video = page.video();
  await context.close();
  await browser.close();
  let videoPath: string | null = null;
  if (video) {
    try {
      videoPath = await video.path();
    } catch (error: unknown) {
      errors.push(`video: ${String(error)}`);
    }
  }
  return { steps: data.steps.length, frames, video: videoPath, errors };
}
