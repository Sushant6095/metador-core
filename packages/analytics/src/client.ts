/**
 * PostHog client wrapper. Env-gated: without NEXT_PUBLIC_POSTHOG_KEY every
 * call is a silent no-op so local dev and CI never emit. Browser-only —
 * call from client components.
 */
import posthog from 'posthog-js';
import type { MetadorEventName } from './events';

let initialized = false;

function ensureInit(): boolean {
  if (typeof window === 'undefined') return false;
  if (initialized) return true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: false, // we send page_view explicitly via track()
    autocapture: false, // registry-only events (CLAUDE.md sync contract)
  });
  initialized = true;
  return true;
}

export function track(
  event: MetadorEventName,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!ensureInit()) return;
  posthog.capture(event, properties);
}
