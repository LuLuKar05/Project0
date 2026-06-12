'use client';

import React from 'react';
import type { Project } from '@/lib/types';

/*
This is the left-side navBar that lists all the projects.
Receives the projects array as a prop — the page fetches it server-side
(services/getProjects) and passes it down, so there is no client fetch or
loading state here.
I added the Upcomiing Missons Section (upcoming projects) which are currently represntes as the dead orbits right now since there isn't much project yet.
(This is going to be 2 as hardcoded for now and is going to hide if there is more than 20 active projects)
*/


// Properties for this component
interface SidebarNavProps {
  /** Active projects fetched server-side, in orbit order */
  projects: Project[];
  /** Index of the currently selected planet (-1 = overview mode) */
  activeIdx: number;
  /** Whether the entry animation has completed (controls visibility) */
  revealed: boolean;
  /** Called when the user clicks an active project in the sidebar */
  onSelectProject: (idx: number) => void;
}

export default function SidebarNav({ projects, activeIdx, revealed, onSelectProject }: SidebarNavProps) {
  //currenlty all the projects are going to be active active, but gonna use the filter for consistency and future proofing when we have more projects and want to show only the one of the best projects in the active section.
  const activeProjects   = projects.map((project, i) => ({ project, i })).filter(x => x.project.active);
  // Will be 2 for now, if there is more than 20 projects in atcive section, going to hide the dead orbits.
  const inactiveProjects = activeProjects.length > 20 ? 0 : 2; // if 20+ active, hide dead orbits to save space; otherwise show 2 dead orbits

  return (
    //will reveal after the entry animation completes, and then the user can interact with it to select a project.
    <nav
      id="project-sidebar"
      //add the animation class to trigger the CSS transition after the entry animation completes
      className={`sb-nav${revealed ? ' revealed' : ''}`}
      //
      aria-label="Project navigation"
    >
      {/* ── Completed Missions ── */}
      <section className="sb-sec">
        <div className="sb-hd">Completed Missions</div>
        {activeProjects.map( ( { project, i } ) => (
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

      {/* ── Upcoming Missions ── */}
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
