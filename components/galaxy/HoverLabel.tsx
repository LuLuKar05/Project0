/**
 * @file components/HoverLabel.tsx
 * Floating tooltip that appears above a hovered planet.
 *
 * Position is driven by a DOM ref whose `style.left/top` is updated
 * directly by the Three.js animation loop via `updatePosition()`.
 * This avoids triggering a React re-render on every animation frame.
 *
 * Visibility is controlled by React state (the `project` prop) — only
 * position tracking needs per-frame DOM updates.
 */

'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import type { Project } from '@/lib/types';

// ─────────────────────────────────────────────
//  Imperative handle API
// ─────────────────────────────────────────────

/**
 * Methods exposed to parent via `ref` so the Three.js loop can
 * update the label position without causing a React re-render.
 */
export interface HoverLabelHandle {
  /**
   * Set the CSS position of the label container.
   * Called every animation frame while a planet is hovered.
   *
   * @param x - CSS `left` value in pixels
   * @param y - CSS `top` value in pixels
   */
  setPosition: (x: number, y: number) => void;
}

//Properties Structure of this component
interface HoverLabelProps {
  /** The currently hovered project; null = tooltip hidden */
  project: Project | null;
}

/**
 * Floating planet tooltip.
 * Uses `forwardRef` + `useImperativeHandle` so the parent can call
 * `setPosition()` imperatively (bypassing React state for per-frame updates).
 */
const HoverLabel = forwardRef<HoverLabelHandle, HoverLabelProps>(
  function HoverLabel({ project }, ref) {
    /** Direct ref to the container element for imperative position updates */
    const containerRef = useRef<HTMLDivElement>(null);
    const LABEL_OFFSET_Y = 130; // pixels to shift label above planet center

    // Expose position setter to parent via ref
    useImperativeHandle(ref, () => ({
      setPosition(x: number, y: number) {
        if (!containerRef.current) return;
        containerRef.current.style.left = `${x}px`;
        containerRef.current.style.top  = `${y - LABEL_OFFSET_Y}px`; // offset above planet
      },
    }));

    const isVisible = project !== null;

    return (
      <div
        ref={containerRef}
        id="hover-label"
        className={`hl-wrap${isVisible ? ' visible' : ''}`}
        aria-hidden={!isVisible}
      >
        {/* Tooltip card */}
        <div className="hl-box" aria-live="polite">
          <div className="hl-cat">{project?.category ?? ''}</div>
          <div className="hl-ttl">{project?.title    ?? ''}</div>
          <div className="hl-dsc">{project?.shortDesc      ?? ''}</div>
        </div>
        {/* Vertical connector line between tooltip and planet */}
        <div className="hl-con" />
      </div>
    );
  },
);

HoverLabel.displayName = 'HoverLabel';
export default HoverLabel;
