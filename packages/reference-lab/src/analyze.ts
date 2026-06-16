/**
 * analyze.ts — re-run the cheap analysis steps (measurements, stack, ia)
 * for every G0 target without redoing screenshots/video.
 * Usage: pnpm --filter @metador/reference-lab analyze [slug-filter]
 */
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapFlows } from './flows';
import { detectStack } from './stack';
import { measureStyles } from './styles';
import { G0_TARGETS, VIEWPORTS } from './types';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REFS_ROOT = path.join(REPO_ROOT, 'docs/research/refs');

async function main(): Promise<void> {
  const filter = process.argv[2];
  const targets = filter ? G0_TARGETS.filter((t) => t.slug.includes(filter)) : G0_TARGETS;
  for (const target of targets) {
    const outDir = path.join(REFS_ROOT, target.slug);
    await mkdir(outDir, { recursive: true });
    const log = path.join(outDir, 'capture-log.md');
    await appendFile(log, `\n## Analyze ${new Date().toISOString()}\n`);
    console.log(`=== ${target.label} ===`);
    for (const viewport of VIEWPORTS) {
      const measurements = await measureStyles(target, viewport, outDir);
      await appendFile(log, `- ${viewport.name}: measurements=${measurements ? 'ok' : 'FAIL'}\n`);
      console.log(`-- ${viewport.name}: measurements ${measurements ? 'ok' : 'FAIL'}`);
    }
    const stack = await detectStack(target, outDir);
    await mapFlows(target, outDir);
    await appendFile(log, `- stack: ${stack.length} signals · ia.md rewritten\n`);
    console.log(`-- stack: ${stack.length} signals`);
  }
}

main().catch((error: unknown) => {
  console.error('analyze: fatal', error);
  process.exitCode = 1;
});
