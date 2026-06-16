import type { Page } from 'playwright';

/**
 * tsx/esbuild `keepNames` injects `__name(...)` helper calls into compiled
 * page.evaluate callbacks; the helper doesn't exist in the browser. Shim it
 * before navigation. Must be called before page.goto().
 */
export async function shimEvaluateHelpers(page: Page): Promise<void> {
  await page.addInitScript('globalThis.__name = globalThis.__name || ((f) => f);');
}
