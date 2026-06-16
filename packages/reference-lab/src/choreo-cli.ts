/**
 * choreo-cli.ts — run the deep choreography study on hyperfoundation.org.
 * Usage: pnpm --filter @metador/reference-lab choreo
 * Frames captured on the slow pass at 390 and 1440 only.
 */
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEEDS, studyChoreography } from './choreo';
import { G0_TARGETS, VIEWPORTS } from './types';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function main(): Promise<void> {
  const target = G0_TARGETS.find((t) => t.slug === 'hyperfoundation.org');
  if (!target) throw new Error('hyperfoundation.org target missing');
  const outDir = path.join(REPO_ROOT, 'docs/research/refs', target.slug);
  const log = path.join(outDir, 'capture-log.md');
  await appendFile(log, `\n## Choreo study ${new Date().toISOString()}\n`);

  for (const viewport of VIEWPORTS) {
    for (const speed of SPEEDS) {
      const captureFrames = speed.name === 'slow' && viewport.name !== '768';
      console.log(`-- ${viewport.name} @ ${speed.name}${captureFrames ? ' +frames' : ''}`);
      const result = await studyChoreography(target, viewport, speed, outDir, captureFrames);
      const line =
        `- ${viewport.name}/${speed.name}: steps=${result.steps} frames=${result.frames} ` +
        `video=${result.video ? 'ok' : 'FAIL'}` +
        (result.errors.length > 0 ? ` errors: ${result.errors.join(' | ')}` : '') +
        '\n';
      await appendFile(log, line);
      console.log(line.trim());
    }
  }
  console.log('choreo: done');
}

main().catch((error: unknown) => {
  console.error('choreo: fatal', error);
  process.exitCode = 1;
});
