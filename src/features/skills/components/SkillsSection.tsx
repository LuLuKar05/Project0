/**
 * @file src/features/skills/components/SkillsSection.tsx
 * Server Component — receives skill categories as a prop from the page
 * (fetched server-side via services/getSkills) instead of fetching
 * client-side. No 'use client' needed: the only interactive part is
 * SkillsGrid, which declares its own client boundary.
 */

import SkillsGrid from '@/features/skills/components/SkillCard';
import type { SkillCategory } from '@/features/skills/components/SkillCard';

interface SkillsSectionProps {
  categories: SkillCategory[];
}

export default function SkillsSection({ categories }: SkillsSectionProps) {
  return (
    <section className="relative">
      {/* Main content */}
      <div className="relative z-[5] w-full mx-auto px-[clamp(24px,5vw,72px)] py-[clamp(64px,9vw,130px)]">

        {/* Section label row */}
        <div className="flex items-center gap-2 mb-[22px] leading-0">
          <span className="font-nasalization text-[12px] tracking-[0.2em] text-primary uppercase">
            SYS-03
          </span>
          <span className="w-3 h-px bg-white/55" />
          <span className="font-nasalization text-[12px] tracking-[0.15em] text-white/55 uppercase">
            Systems Arsenal
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-nasalization text-[6vw] tracking-widest leading-[1.02] text-[000000]" >
          Tech{' '}
          <span className="text-primary tracking-widest">
            Stack
          </span>
        </h1>

        {/* Sub-heading */}
        <p className="font-nasalization text-[1.25vw] text-white/55 max-w-140 leading-[1.7] mb-[clamp(48px,6vw,76px)]">
          Every cluster a constellation of mastered systems — charted across the same sector as the missions.
        </p>

        <SkillsGrid categories={categories} />
      </div>

      {/* Footer */}
      <footer className="relative z-5 text-center px-6 pt-10 pb-14 font-nasalization text-[10px] tracking-[0.15em] text-[rgba(79,195,247,0.18)] uppercase">
        Ad astra per aspera · Diagnostic readout nominal
      </footer>

      {/* Holographic scanline overlay — ::after animation handled in CARD_STYLES */}
      {/* <div
        id="scanlines"
        className="absolute inset-0 z-50 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(79,195,247,0.018) 2px, rgba(79,195,247,0.018) 4px)',
        }}
      /> */}
    </section>
  );
}
