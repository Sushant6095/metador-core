/**
 * Metador — main landing page (apps/web).
 * Server component. Composes all landing sections.
 *
 * Section order (landing premium pass, founder build-list + choreography.md §8).
 * World rhythm = dark → pale → dark → pale → dark(×3) → pale → dark(×2) → pale→dark:
 *   1  Nav            — floating pill (fixed, over the hero)
 *   2  Hero           — dark, full-viewport graded composition + monumental Inter claim
 *   3  Flagship App   — PALE; real screenshot of our marketplace in a dark frame
 *   4  Custody problem — dark; hook/problem statement
 *   5  Four Walls     — PALE; four chain-enforced walls
 *   6  Activity Feed  — dark surface; live feed + budget meter
 *   7  Stat Band      — dark; count-up on enter, tabular Inter numerals
 *   8  Stack          — dark; original isometric four-layer diagram
 *   9  Value props    — PALE; Maya + Leo
 *   10 Red-team       — dark, ramps toward --metador-revoke
 *   11 Builders band  — dark surface
 *   12 Waitlist       — PALE → dark base footer
 *      Footer         — pale top + dark base (giant Inter wordmark)
 *
 * LenisProvider (client) wraps main — enables smooth scroll for the full
 * landing surface, no-ops under prefers-reduced-motion.
 * All other client interactivity lives in child 'use client' components.
 * No motion/3D imports in this server file.
 */

import { LenisProvider } from './components/smooth-scroll/LenisProvider';
import { HeroSection } from './components/hero/HeroSection';
import { FlagshipAppSection } from './components/flagship-app/FlagshipAppSection';
import { CustodyProblemSection } from './components/custody-problem/CustodyProblemSection';
import { FourWallsSection } from './components/four-walls/FourWallsSection';
import { ActivityFeedSection } from './components/activity-feed/ActivityFeedSection';
import { StatBand } from './components/stats/StatBand';
import { StackSection } from './components/stack/StackSection';
import { ValuePropsSection } from './components/value-props/ValuePropsSection';
import { RedTeamTeaser } from './components/red-team/RedTeamTeaser';
import { BuildersBand } from './components/builders-band/BuildersBand';
import { WaitlistSection } from './components/waitlist/WaitlistSection';
import { SiteFooter } from './components/footer/SiteFooter';
import { SiteNav } from './components/nav/SiteNav';

export default function HomePage() {
  return (
    <>
      <SiteNav />
      {/* LenisProvider enables smooth scroll; no-ops under prefers-reduced-motion */}
      <LenisProvider>
      <main id="main-content">
        {/* Hero — 100vh, dark graded composition, monumental Inter claim */}
        <HeroSection />

        {/* Flagship App — PALE world-flip; real product screenshot, dark frame */}
        <FlagshipAppSection />

        {/* Custody problem — dark world; hook/problem statement */}
        <CustodyProblemSection />

        {/* Four Walls — PALE world-flip; four chain-enforced walls */}
        <FourWallsSection />

        {/* Safety made visible — dark surface; live feed + budget meter */}
        <ActivityFeedSection />

        {/* Proof stat band — dark bg; count-up on enter, tabular mono */}
        <StatBand />

        {/* The Stack — dark; original isometric four-layer diagram */}
        <StackSection />

        {/* Maya + Leo value props — PALE world-flip */}
        <ValuePropsSection />

        {/* Red-team teaser — dark, gradient toward --metador-revoke */}
        <RedTeamTeaser />

        {/* Builders band — dark --metador-surface */}
        <BuildersBand />

        {/* Waitlist — PALE (data-theme="light" inside WaitlistSection) */}
        <WaitlistSection />
      </main>
      </LenisProvider>

      {/* Footer — pale top + dark base (world ramp inside SiteFooter) */}
      <SiteFooter />
    </>
  );
}
