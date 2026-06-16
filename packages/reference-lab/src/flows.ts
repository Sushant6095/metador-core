/**
 * flows.ts — nav link graph, page tree, headings outline → ia.md
 * (BOOTSTRAP Phase E §4).
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import type { CaptureTarget } from './types';
import { shimEvaluateHelpers } from './util';

interface PageOutline {
  navLinks: Array<{ text: string; href: string }>;
  headings: Array<{ level: number; text: string }>;
  title: string;
}

export async function mapFlows(target: CaptureTarget, outDir: string): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  let outline: PageOutline | null = null;
  try {
    await shimEvaluateHelpers(page);
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(target.settleMs ?? 5_000);
    outline = await page.evaluate((): PageOutline => {
      const navLinks = Array.from(document.querySelectorAll('nav a, header a'))
        .map((a) => ({
          text: (a.textContent ?? '').trim().slice(0, 60),
          href: a.getAttribute('href') ?? '',
        }))
        .filter((l) => l.text.length > 0)
        .slice(0, 60);
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h) => ({
          level: Number(h.tagName[1]),
          text: (h.textContent ?? '').trim().slice(0, 100),
        }))
        .filter((h) => h.text.length > 0)
        .slice(0, 80);
      return { navLinks, headings, title: document.title };
    });
  } catch {
    outline = null;
  } finally {
    await context.close();
    await browser.close();
  }

  const lines: string[] = [`# IA — ${target.label}`, '', `Source: ${target.url}`, ''];
  if (!outline) {
    lines.push('CAPTURE FAILED — page did not load or evaluation was blocked.');
  } else {
    lines.push(`Title: ${outline.title}`, '', '## Nav links', '');
    for (const link of outline.navLinks) lines.push(`- [${link.text}](${link.href})`);
    lines.push('', '## Headings outline', '');
    for (const h of outline.headings) lines.push(`${'  '.repeat(h.level - 1)}- h${h.level}: ${h.text}`);
  }
  await writeFile(path.join(outDir, 'ia.md'), lines.join('\n'));
}
