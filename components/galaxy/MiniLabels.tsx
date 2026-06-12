'use client';
/**
 * @file components/MiniLabels.tsx
 * Always-visible small planet name labels rendered in the HTML overlay layer.
 *
 * Receives the projects array as a prop — fetched server-side by the page
 * (services/getProjects) and passed down, so there is no client fetch here.
 *
 * Label positions are updated every frame by the Three.js loop via an
 * imperative ref (bypassing React state to avoid 60 fps re-renders).
 *
 * Labels fade out when a project is selected (camera zoomed in).
 * Dead-orbit planets show "• • •" instead of their classified title.
 */

import {
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';

import type { Project } from '@/lib/types';

// ─────────────────────────────────────────────
//  Imperative handle API
// ─────────────────────────────────────────────

/**
 * Methods exposed to the parent via `ref` so the Three.js loop can
 * update label positions and visibility without React re-renders.
 */
export interface MiniLabelsHandle {
  /**
   * Update the position and opacity of a single planet label.
   *
   * @param idx     - Planet index (matches PROJECTS order)
   * @param x       - CSS `left` in pixels (planet screen X + horizontal offset)
   * @param y       - CSS `top` in pixels (planet screen Y + vertical offset)
   * @param opacity - 0 (hidden) or 1 (visible)
   */
  setLabel: (idx: number, x: number, y: number, opacity: number) => void;
}

interface MiniLabelsProps {
  /** Projects fetched server-side, in the same order as the planets array */
  projects: Project[];
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

/**
 * Renders one `<div>` per planet as an HTML overlay above the canvas.
 * Position is updated imperatively every frame by the Three.js loop.
 */
const MiniLabels = forwardRef<MiniLabelsHandle, MiniLabelsProps>(
  function MiniLabels({ projects }, ref) {
    /** One ref per label element, indexed by planet order */
    const labelRefs = useRef<Array<HTMLDivElement | null>>([]);

    // Expose setLabel() to the parent component
    useImperativeHandle(ref, () => ({
      setLabel(idx: number, x: number, y: number, opacity: number) {
        const el = labelRefs.current[idx];
        if (!el) return;
        el.style.left    = `${x}px`;
        el.style.top     = `${y + 18}px`; // offset below planet centre
        el.style.opacity = String(opacity);
      },
    }));

    if (projects.length === 0) return null;

    return (
      <>
        {projects.map((proj, i) => (
          <div
            key={proj.id}
            ref={(el) => { labelRefs.current[i] = el; }}
            className={`mlbl${proj.active ? '' : ' dead'}`}
            style={{ opacity: 0 }} // hidden until entry animation completes
            aria-hidden="true"      // decorative — not read by screen readers
          >
            {/* Active planets show their title; inactive show bullet dots */}
            {proj.active ? proj.title : '• • •'}
          </div>
        ))}
      </>
    );
  },
);

MiniLabels.displayName = 'MiniLabels';
export default MiniLabels;
