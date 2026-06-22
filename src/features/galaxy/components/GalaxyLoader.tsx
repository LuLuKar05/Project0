'use client';

/**
 * @file src/features/galaxy/components/GalaxyLoader.tsx
 * Full-section loading overlay. Covers the galaxy (z-40, above HUD/sidebar/panel)
 * until everything is ready, then fades out and unmounts — so the user only ever
 * sees the galaxy once the PlanetSystem's textures have actually loaded.
 *
 * "Ready" is driven by drei's `useProgress`, which tracks the real texture loads
 * (useTexture / useKTX2). We wait for a load cycle to *finish* — not just for the
 * camera to settle — so planets never pop in after the reveal. Fallbacks ensure
 * it never gets stuck if textures are cached or there's nothing to load.
 */

import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';

interface GalaxyLoaderProps {
  /** The galaxy section has scrolled into view (textures start loading). */
  inView: boolean;
  /** The camera fly-in has settled. */
  revealed: boolean;
}

export default function GalaxyLoader({ inView, revealed }: GalaxyLoaderProps) {
  const { active, progress } = useProgress();
  const [fading, setFading] = useState(false);
  const [gone, setGone]     = useState(false);
  // Remember once any texture load has actually begun, so we can tell
  // "still warming up" from "everything is already loaded / cached".
  const startedRef = useRef(false);

  useEffect(() => {
    if (active) startedRef.current = true;
  }, [active]);

  // Reveal the galaxy once the scene is in view, the fly-in has settled, and the
  // textures have finished loading.
  useEffect(() => {
    if (fading || !inView || !revealed) return;
    if (active) return; // a load is in flight — keep waiting

    // Not loading: ready if a load cycle finished, else give cached/empty a beat.
    const delay = startedRef.current ? 300 : 1200;
    const t = setTimeout(() => setFading(true), delay);
    return () => clearTimeout(t);
  }, [fading, inView, revealed, active, progress]);

  // Safety net — never leave the loader stuck if progress never resolves.
  useEffect(() => {
    if (!inView || !revealed) return;
    const t = setTimeout(() => setFading(true), 8000);
    return () => clearTimeout(t);
  }, [inView, revealed]);

  // Unmount after the fade so the spinner stops doing work.
  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setGone(true), 650);
    return () => clearTimeout(t);
  }, [fading]);

  if (gone) return null;

  return (
    <div className={`gx-loader${fading ? ' gx-loader--hidden' : ''}`} aria-hidden={fading} role="status">
      <div className="gx-loader__ring" />
      <p className="gx-loader__label">Initializing Project Galaxy</p>
      <span className="gx-loader__pct">{Math.min(100, Math.round(progress))}%</span>
    </div>
  );
}
