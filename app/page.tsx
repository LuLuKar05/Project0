/**
 * @file app/page.tsx
 * @description Root page — the entry point visitors see at "/".
 *
 * ─── PAGE STRUCTURE ───────────────────────────────────────────────────────────
 *
 *   <HeroSection>     Full-viewport intro. Starfield background is provided
 *                     automatically by StarfieldProvider in layout.tsx.
 *
 *   <section id="galaxy-section">
 *                     The Three.js galaxy canvas and project UI will live here.
 *                     The id is the scroll target for HeroSection's CTA button.
 *
 * ─── Z-INDEX STACK ────────────────────────────────────────────────────────────
 *
 *   z-0   background Starfield  (StarfieldProvider — layout.tsx)
 *   z-10  hero content
 *   z-10+ galaxy UI (sidebar, detail panel, hover labels…)
 *
 * ─── NOTE ─────────────────────────────────────────────────────────────────────
 *
 * This file is a Server Component by default (no 'use client').
 * HeroSection is a Client Component (it imports useStarfield) — Next.js
 * handles the boundary automatically when it is imported here.
 */

import HeroSection from '@/components/heroSection';
import SkillsSection from '../components/SkillsSection';
import ContactSection from '@/components/ContactSection';

export default function HomePage() {
  return (
    <main className="relative">

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Section 2: Galaxy (placeholder — Three.js canvas mounts here) ── */}
      {/* <section
        id="galaxy-section"
        className="relative min-h-screen flex items-center justify-center"
        aria-label="Project galaxy"
      > */}
        {/*
         * TODO: Mount the Galaxy component here once it is built.
         * The Three.js renderer will attach its canvas to this section.
         * SidebarNav, HoverLabel, DetailPanel and MiniLabels all live
         * inside (or alongside) this section.
         */}
        {/* <p className="text-white/20 font-mono text-sm tracking-widest uppercase">
          Galaxy sector — loading…
        </p>
      </section> */}
      {/* <SkillsSection /> */}
      <ContactSection />

    </main>
  );
}
