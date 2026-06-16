/**
 * cli.ts — run the full Phase E pipeline for every G0 target × viewport.
 * Usage: pnpm --filter @metador/reference-lab capture [slug-filter]
 * Output: docs/research/refs/<slug>/
 */
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureTarget } from './capture';
import { mapFlows } from './flows';
import { detectStack } from './stack';
import { measureStyles } from './styles';
import { G0_TARGETS, SPRINT_TARGETS, VIEWPORTS } from './types';

const ALL_TARGETS = [...G0_TARGETS, ...SPRINT_TARGETS];

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REFS_ROOT = path.join(REPO_ROOT, 'docs/research/refs');

async function main(): Promise<void> {
  const filter = process.argv[2];
  const targets = filter ? ALL_TARGETS.filter((t) => t.slug.includes(filter)) : ALL_TARGETS;
  if (targets.length === 0) {
    console.error(`no targets match "${filter}"`);
    process.exitCode = 1;
    return;
  }

  for (const target of targets) {
    const outDir = path.join(REFS_ROOT, target.slug);
    await mkdir(outDir, { recursive: true });
    const log = path.join(outDir, 'capture-log.md');
    await appendFile(log, `\n## Run ${new Date().toISOString()}\n`);
    console.log(`\n=== ${target.label} (${target.url}) ===`);

    for (const viewport of VIEWPORTS) {
      console.log(`-- viewport ${viewport.name}`);
      const capture = await captureTarget(target, viewport, outDir);
      await appendFile(
        log,
        `- ${viewport.name}: fullPage=${capture.fullPageShot ? 'ok' : 'FAIL'} ` +
          `scrollShots=${capture.scrollShots} video=${capture.video ? 'ok' : 'FAIL'} ` +
          `trace=${capture.trace ? 'ok' : 'FAIL'}` +
          (capture.errors.length > 0 ? ` errors: ${capture.errors.join(' | ')}` : '') +
          '\n',
      );
      const measurements = await measureStyles(target, viewport, outDir);
      await appendFile(log, `- ${viewport.name}: measurements=${measurements ? 'ok' : 'FAIL'}\n`);
    }

    const stack = await detectStack(target, outDir);
    await appendFile(log, `- stack: ${stack.length} signals\n`);
    await mapFlows(target, outDir);
    await appendFile(log, `- ia.md written\n`);
  }
  console.log('\nreference-lab: done');
}

main().catch((error: unknown) => {
  console.error('reference-lab: fatal', error);
  process.exitCode = 1;
});
