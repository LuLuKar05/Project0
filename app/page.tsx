/**
 * @file app/page.tsx
 * @description Root page — the entry point visitors see at "/".
 *
 * ─── DATA FLOW (server-first) ─────────────────────────────────────────────────
 *
 * This is an async Server Component. All DB data is fetched here at render
 * time via the services layer (Prisma directly — no internal API round-trip)
 * and passed down to client components as props.
 *
 * `revalidate = 3600` makes the page static with ISR: it is generated once,
 * served from cache, and regenerated at most once per hour. Creating a
 * project through POST /api/v1/postProjects also calls revalidatePath('/')
 * so new projects appear immediately without waiting for the ISR window.
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
 */

import HeroSection from '@/components/heroSection';
// import SkillsSection from '@/components/SkillsSection';
import ContactSection from '@/components/ContactSection';
// import { getSkills }   from '@/services/getSkills';
// import { getProjects } from '@/services/getProjects';

/** ISR — serve from cache, regenerate at most once per hour. */
export const revalidate = 3600;

export default async function HomePage() {
  // Server-side data fetching — uncomment alongside the sections that use it:
  // const skillCategories = await getSkills();
  // const projects        = await getProjects();

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
         * inside (or alongside) this section — pass them `projects`
         * fetched above (SidebarNav and MiniLabels now take it as a prop).
         */}
        {/* <p className="text-white/20 font-mono text-sm tracking-widest uppercase">
          Galaxy sector — loading…
        </p>
      </section> */}
      {/* <SkillsSection categories={skillCategories} /> */}
      <ContactSection />

    </main>
  );
}