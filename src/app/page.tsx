/**
 * @file src/app/page.tsx
 * @description Root page — the entry point visitors see at "/".
 *
 * ─── DATA FLOW (server-first) ─────────────────────────────────────────────────
 *
 * This is an async Server Component. All DB data is fetched here at render
 * time via the services layer (Prisma directly — no internal API round-trip)
 * and passed down to client components as props.
 *
 * `revalidate = 3600` makes the page static with ISR: it is generated once,
 * served from cache, and regenerated at most once per hour. Admin edits (in
 * /admin) call revalidatePath('/') so new/changed projects appear immediately
 * without waiting for the ISR window.
 *
 * ─── PAGE STRUCTURE ───────────────────────────────────────────────────────────
 *
 *   <HeroSection>     Full-viewport intro. Starfield background is provided
 *                     automatically by StarfieldProvider in layout.tsx.
 *
 *   <Galaxy>          The Project Galaxy (react-three-fiber). #galaxy-section
 *                     is the scroll target for HeroSection's CTA button.
 *
 *   <SkillsSection>   Constellation skill cards.
 *
 *   <ContactSection>  Contact channels + dossier/message modals.
 *
 * ─── Z-INDEX STACK ────────────────────────────────────────────────────────────
 *
 *   z-0   background Starfield  (StarfieldProvider — layout.tsx)
 *   z-10  hero content
 *   z-20+ galaxy UI (HUD, sidebar, detail panel, labels)
 */

import HeroSection from '@/features/hero/components/HeroSection';
import Galaxy from '@/features/galaxy/components/Galaxy';
import SkillsSection from '@/features/skills/components/SkillsSection';
import ContactSection from '@/features/contact/components/ContactSection';
import { getSkills } from '@/server/getSkills';
import { getProjects } from '@/server/getProjects';

/** ISR — serve from cache, regenerate at most once per hour. */
export const revalidate = 3600;

export default async function HomePage() {
  const [projects, skillCategories] = await Promise.all([
    getProjects(),
    getSkills(),
  ]);

  return (
    <main className="relative">
      <HeroSection />
      <Galaxy projects={projects} />
      <SkillsSection categories={skillCategories} />
      <ContactSection />
    </main>
  );
}
