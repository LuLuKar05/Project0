/**
 * @file components/SidebarNav.tsx
 * Persistent left-side navigation listing all projects by orbital zone.
 *
 * Active projects are clickable (trigger camera flyTo).
 * Dead-orbit / classified entries are displayed greyed-out and are non-interactive.
 *
 * The sidebar is revealed (`.revealed` class) after the entry animation
 * completes, driven by the `revealed` prop from GalaxyCanvas.
 */

'use client';

import React from 'react';
import useProjects from '@/hooks/useProjects';

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────

interface SidebarNavProps {
  /** Index of the currently selected planet (-1 = overview mode) */
  activeIdx: number;
  /** Whether the entry animation has completed (controls visibility) */
  revealed: boolean;
  /** Called when the user clicks an active project in the sidebar */
  onSelectProject: (idx: number) => void;
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

/**
 * Left-side navigation sidebar listing active missions and dead orbits.
 */
export default function SidebarNav({ activeIdx, revealed, onSelectProject }: SidebarNavProps) {
  const { projects } = useProjects();

  // Split projects into active (live missions) and inactive (dead orbits)
  const activeProjects   = projects?.map((project, i) => ({ project, i})).filter(x => x.project.active);
  const inactiveProjects = activeProjects && activeProjects.length > 20 ? 0 : 2; // if 20+ active, hide dead orbits to save space; otherwise show 2 dead orbits

  return (
    <nav
      id="project-sidebar"
      //add the animation class to trigger the CSS transition after the entry animation completes
      className={`sb-nav${revealed ? ' revealed' : ''}`}
      //
      aria-label="Project navigation"
    >
      {/* ── Active Missions section ── */}
      <section className="sb-sec">
        <div className="sb-hd">Past Missions</div>
        {activeProjects?.map( ( { project, i } ) => (
          <button
            key={project.id}
            className={`sb-it${i === activeIdx ? ' act' : ''}`}
            onClick={() => onSelectProject( i )}
            aria-current={i === activeIdx ? 'true' : undefined}
          >
            <span className="sb-dt" />
            <span className="sb-nm">{project.title}</span>
          </button>
        ))}
      </section>

      {/* ── Dead Orbits section ── */}
      <section className="sb-sec">
        <div className="sb-hd">Upcoming Missions</div>
        {Array.from({ length: inactiveProjects }).map((_, i ) => (
          // Dead orbits are not interactive — rendered as div, not button
          <div key={i} className="sb-it dead" aria-disabled="true">
            <span className="sb-dt" />
            <span className="sb-nm">Classified</span>
          </div>
        ))}

      </section>
    </nav>
  );
}
