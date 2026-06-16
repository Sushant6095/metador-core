/**
 * Metador reference lab — Playwright capture harness (BOOTSTRAP Phase E).
 * Run: pnpm --filter @metador/reference-lab capture [slug-filter]
 * Output: docs/research/refs/<site>/ — governed by the Reference Extraction
 * Protocol (CLAUDE.md §8): capture everything, ship nothing of theirs.
 */
export { captureTarget } from './capture';
export { mapFlows } from './flows';
export { detectStack } from './stack';
export { measureStyles } from './styles';
export { G0_TARGETS, VIEWPORTS } from './types';
export type { CaptureTarget, StyleMeasurements, Viewport } from './types';
