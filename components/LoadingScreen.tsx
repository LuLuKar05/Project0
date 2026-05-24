'use client';

/**
 * @file components/LoadingScreen.tsx
 * @description Full-screen hyperdrive sequence shown once on first page load.
 *
 * ─── WHAT IT LOOKS LIKE ──────────────────────────────────────────────────────
 *
 * Pure black background with 1 200 stars blazing at full warp speed.
 * No UI chrome — just the raw hyperdrive effect.
 * After 2 seconds it fades out over 1 second, revealing the actual page.
 *
 * ─── LAYER STACK (z-index) ───────────────────────────────────────────────────
 *
 *   99  warp Starfield  — dedicated Three.js instance, warp=1 from frame 1
 *   98  solid black backdrop — hides the page AND the background Starfield
 *   ──────────────────────────────────────────────────────────────────────
 *    1  page content    (hidden behind the backdrop during loading)
 *    0  background Starfield (idle/frozen; completely hidden by the backdrop)
 *
 * ─── TWO-STATE VISIBILITY APPROACH ──────────────────────────────────────────
 *
 * The component uses TWO boolean states instead of one:
 *
 *   visible  (true → false)  Controls CSS opacity via a transition.
 *            Flips at HOLD_MS to start the fade-out animation.
 *
 *   mounted  (true → false)  Controls whether the component returns JSX at all.
 *            Flips at HOLD_MS + FADE_MS, after the CSS transition has finished.
 *
 * Why two states?  Because if we unmounted immediately (removed from DOM),
 * the CSS fade-out transition would never play — the element disappears
 * instantly.  We need to keep it mounted while it fades, then unmount it
 * once the animation is complete so the DOM is clean and the Three.js
 * renderer inside the loading Starfield is properly disposed.
 *
 * ─── TIMELINE ────────────────────────────────────────────────────────────────
 *
 *        0 ms  mount → setWarp(1) on the loading Starfield → full hyperdrive
 *    2 000 ms  visible = false → CSS opacity 1→0 starts (HOLD_MS)
 *    3 000 ms  transition ends → setWarp(0) on background Starfield → unmount
 *              (HOLD_MS + FADE_MS)
 *
 * ─── TWO STARFIELD INSTANCES ─────────────────────────────────────────────────
 *
 *   localRef    → the loading Starfield at z-index 99 (this component)
 *                 Blazes at warp=1 immediately.
 *                 Disposed automatically when this component unmounts.
 *
 *   bgStarfield → the background Starfield at z-index 0 (StarfieldProvider)
 *                 Remains frozen (idle) during loading — it is hidden behind
 *                 the backdrop anyway.  Called setWarp(0) on unmount so it
 *                 stays properly idle after the loading screen disappears.
 */

import { useEffect, useRef, useState } from 'react';
import Starfield, { type StarfieldHandle } from './Starfield';
import { useStarfield } from './StarfieldProvider';

// ─── timing ────────────────────────────────────────────────────────────────────

/** How long (ms) to hold full-warp before starting the fade-out. */
const HOLD_MS = 2_000;

/**
 * Duration (ms) of the CSS opacity fade-out transition.
 * The component stays mounted for this long after visible flips to false
 * so the animation has time to complete before the DOM node is removed.
 */
const FADE_MS = 1_000;

// ─── component ─────────────────────────────────────────────────────────────────

export default function LoadingScreen() {
  /** Ref to the loading-screen's own dedicated Starfield instance. */
  const localRef = useRef<StarfieldHandle>(null);

  /**
   * The background Starfield's handle, accessed via context.
   * We call setWarp(0) on it when unmounting so it stays properly idle
   * now that the override lock has been set (see Starfield.tsx note on setWarp).
   */
  const bgStarfield = useStarfield();

  /** true = fully visible · false = fading out (triggers CSS transition) */
  const [visible, setVisible] = useState(true);

  /** true = render JSX · false = return null (component removed from DOM) */
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // Engage hyperdrive on the loading Starfield from the very first frame.
    // We call setWarp on localRef (not bgStarfield) because bgStarfield is
    // the permanent background one — we don't want it to warp; it's hidden.
    localRef.current?.setWarp(1);

    // After the hold period, begin the CSS fade-out by clearing the visible flag.
    const fadeTimer = setTimeout(() => setVisible(false), HOLD_MS);

    // After hold + fade, clean up: idle the background Starfield and remove
    // this component from the DOM (which also triggers Starfield cleanup/dispose).
    const unmountTimer = setTimeout(() => {
      bgStarfield?.setWarp(0); // ensure background stays frozen when revealed
      setMounted(false);
    }, HOLD_MS + FADE_MS);

    // If the component unmounts early (e.g. React Strict Mode double-invoke),
    // cancel the pending timers to avoid state updates on an unmounted component.
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };

    // bgStarfield is a stable getter function (never changes identity).
    // Adding it to deps would cause the effect to re-run unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once mounted flips to false, remove all JSX from the DOM.
  // The Starfield cleanup (cancelAnimationFrame, renderer.dispose, etc.)
  // runs automatically via Starfield's own useEffect cleanup.
  if (!mounted) return null;

  return (
    <>
      {/*
       * ── Layer 1: Solid black backdrop (z-index 98) ────────────────────────
       *
       * Covers both the page content (z-index 1+) and the background Starfield
       * (z-index 0) so neither is visible during the loading sequence.
       *
       * opacity transitions from 1 → 0 when `visible` flips to false.
       * The transition must last exactly FADE_MS so the component doesn't
       * unmount before the animation finishes.
       */}
      <div
        aria-hidden="true"
        style={{
          position:   'fixed',
          inset:      0,
          zIndex:     98,
          background: '#000000',
          opacity:    visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
        }}
      />

      {/*
       * ── Layer 2: Loading Starfield (z-index 99) ───────────────────────────
       *
       * A completely separate Starfield instance from the background one.
       * Lives above the backdrop so its warp stars are the only thing visible.
       *
       * starCount={1200} — more stars than the background (800) for a denser,
       * more dramatic hyperdrive effect during the loading sequence.
       *
       * zIndex={99} — the mount div's stacking context sits above the backdrop
       * (z-index 98) so the warp canvas is visible.  See Starfield.tsx for why
       * the wrapper div z-index must match the prop.
       *
       * Note: this Starfield does NOT fade out separately — the backdrop fading
       * out reveals the background Starfield underneath, creating the illusion
       * of a seamless transition from "loading warp" to "idle background".
       */}
      <Starfield
        ref={localRef}
        zIndex={99}
        starCount={1200}
      />
    </>
  );
}
