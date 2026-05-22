/**
 * @file components/DetailPanel.tsx
 * Right-side sliding panel that shows full details for the selected project.
 *
 * Slides in from the right when `project` is non-null (visible) and slides
 * out when it is null.  The transition is driven by a CSS class toggle
 * (`visible`) rather than inline styles, keeping animation logic in CSS.
 *
 * Props:
 *  project  - The selected Project, or null when no planet is selected
 *  onClose  - Callback to fly the camera back to overview
 *  onPrev   - Navigate to the previous project
 *  onNext   - Navigate to the next project
 */

'use client';

import React from 'react';
import { Projects}  from '@/hooks/useProjects';

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────

interface DetailPanelProps {
  /** The currently selected project; null = panel is hidden */
  project: Projects | null;
  /** Called when the user clicks "Back to Sector View" */
  onClose: () => void;
  /** Navigate to the previous active project */
  onPrev: () => void;
  /** Navigate to the next active project */
  onNext: () => void;
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

/**
 * Sliding detail panel for a selected project.
 * Always in the DOM; `.visible` class controls whether it's on-screen.
 */
export default function DetailPanel({ project, onClose, onPrev, onNext }: DetailPanelProps) {
  const isVisible = project !== null;

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

          {/* Year */}
          <div className="dp-yr">{project.year}</div>

          {/* Full description */}
          <p className="dp-desc">{project.full || project.desc}</p>

          {/* Tech stack label */}
          <div className="dp-tl">Tech Stack</div>

          {/* Tech stack chips */}
          <div className="dp-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="dp-tag">
                {tag}
              </span>
            ))}
          </div>

          {/* External links section */}
          <div className="dp-links">
            {project.github && (
              <a
                className="dp-lnk"
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub →
              </a>
            )}
            {project.live && (
              <a
                className="dp-lnk"
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
              >
                Live Demo →
              </a>
            )}
            {!project.github && !project.live && (
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
