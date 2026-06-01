/**
 * @file components/DetailPanel.tsx
 * Right-side sliding panel that shows full details for the selected project.
 *
 * Slides in from the right when `project` is non-null (visible) and slides
 * out when it is null.  The transition is driven by a CSS class toggle
 * (`visible`) rather than inline styles, keeping animation logic in CSS.
 */
/** 
 * Project's Detail Session, exist on the right side of the screen, and will slide in when the project is selected.
 * Will get the properties (Selected Project Details) and Handler functions from the parent component, which controls the selected state and camera controls.
 * 
 * The project object structure is defined in the useProjects hook and it does the same as the database schema.
 * 
 *  Props:
 *  project  - The selected Project, or null when no planet is selected
 *  onClose  - callback to fly the camera back to overview.
 *  onPrev, onNext  - Navigate to the previous and next projects.
 */

'use client';

import React from 'react';
import {Project} from '@/lib/types';


//Properties Structure of this component
interface DetailPanelProps {
  project: Project | null;
  //Handler functions for the back button and prev/next navigation buttons. 
  //These are passed down from the parent component (Galaxy/projects) which manages the selected project state and camera controls.
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}


/**
 * Sliding detail panel for a selected project.
 * Always in the DOM; `.visible` class controls whether it's on-screen.
 */
export default function DetailPanel({ project, onClose, onPrev, onNext }: DetailPanelProps) {
  const isVisible = project !== null;
  // const tags = (project as (Project & { tags?: string[] }) | null)?.tags ?? [];
  return (
    <div
      id="detail-panel"
      className={`dp-panel${isVisible ? ' visible' : ''}`}
      role="dialog"
      aria-modal={isVisible}
      aria-label={project ? `Project: ${project.title}` : 'Project detail panel'}
    >
      {/* ── Back button ── */}
      <button className="dp-back" onClick={onClose} aria-label="Back to sector view">
        ← Back to Sector View
      </button>

      {/* ── Project content (rendered when a project is selected) ── */}
      {project && (
        <>
          {/* Category badge */}
          <div className="dp-cat">{project.category}</div>

          {/* Title */}
          <h2 className="dp-ttl">{project.title}</h2>

          {/* Year — project.date is a Date object from Prisma; extract the year */}
          <div className="dp-yr">{new Date(project.date).getFullYear()}</div>

          {/* Full description */}
          <p className="dp-desc">{project.fullDesc || project.shortDesc}</p>

          {/* Tech stack label */}
          <div className="dp-tl">Tech Stack</div>
          
          {/* Tech stack chips */}
          <div className="dp-tags">
          {project.tags.map((tag) => (
            <span key={tag.id} className="dp-tag" style={{ backgroundColor: tag.color }}>
              {tag.name}
            </span>))}
          </div>


          {/* External links section */}
          <div className="dp-links">
            {project.githubURL && (
              <a
                className="dp-lnk"
                href={project.githubURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub →
              </a>
            )}
            {project.deployedURL && (
              <a
                className="dp-lnk"
                href={project.deployedURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Live Demo →
              </a>
            )}
            {!project.githubURL && !project.deployedURL && (
              <span className="dp-lnk off">Links classified</span>
            )}
          </div>
        </>
      )}

      {/* ── Prev / Next navigation ── */}
      <div className="dp-nav">
        <button className="dp-nb" onClick={onPrev} aria-label="Previous project">
          ← Prev
        </button>
        <button className="dp-nb" onClick={onNext} aria-label="Next project">
          Next →
        </button>
      </div>
    </div>
  );
}
