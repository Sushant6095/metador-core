import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Anchor to the monorepo root so Next does not walk up to /Users/vyapar
  // and pick up a stray package-lock.json there (multi-lockfile warning).
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@metador/analytics', '@metador/design-system', '@metador/ui'],
};

export default nextConfig;
