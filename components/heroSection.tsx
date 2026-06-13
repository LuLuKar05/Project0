/**
 * @file components/heroSection.tsx
 * @description Full-viewport hero — fully responsive across mobile, iPad, desktop.
 *
 * ─── LAYOUT ───────────────────────────────────────────────────────────────────
 *
 *   Mobile  (< 768 px)    → single column, text top, planet centred below
 *   Tablet  (768–1023 px) → two columns, text left (3/4), planet right (1/4)
 *   Desktop (1024 px +)   → two columns, text left (3/4), planet right (1/4)
 *
 * ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
 *
 *   h1 uses CSS clamp() for fluid scaling — no hard breakpoint jumps:
 *     clamp(2.6rem, 10vw, 11.25rem)  →  ~42 px on small phone → 180 px on desktop
 *
 * ─── PLANET SIZE ──────────────────────────────────────────────────────────────
 *
 *   Computed in JS from window.innerWidth so the Three.js canvas is always
 *   pixel-perfect. A resize listener keeps it in sync.
 *
 *     < 480 px   → 58 % of vw          (phone portrait)
 *     480–767 px → 45 % of vw          (phone landscape)
 *     768–1023 px→ 24 % of vw          (tablet)
 *     1024–1279 px→ 20 % of vw         (small desktop)
 *     ≥ 1280 px  → 17 % of vw, max 320 px (large desktop)
 */

'use client';

import { useEffect, useState } from 'react';
import Planet3D from './hero/Planet3D';
import { useStarfield } from './StarfieldProvider';
// ─── constants ─────────────────────────────────────────────────────────────────

const WARP_DURATION_MS = 1_200;

// ─── helpers ───────────────────────────────────────────────────────────────────

function useExploreHandler() {
  const starfield = useStarfield();
  return () => {
    starfield?.setWarp(1);
    setTimeout(() => starfield?.setWarp(0), WARP_DURATION_MS);
    document.getElementById('galaxy-section')?.scrollIntoView({ behavior: 'smooth' });
  };
}

function calcPlanetSize(w: number): number {
  let s: number;
  if      (w < 480)  s = Math.round(w * 0.58);
  else if (w < 768)  s = Math.round(w * 0.45);
  else if (w < 1024) s = Math.round(w * 0.52);
  else if (w < 1280) s = Math.round(w * 0.52);   // laptop  → ~440–535 px
  else               s = Math.min(Math.round(w * 0.45), 800); // desktop → up to 800 px
  return Math.max(s, 100);
}

// ─── component ─────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const handleExplore = useExploreHandler();
  const [planetSize, setPlanetSize] = useState(800);
  useEffect(() => {
    const update = () => setPlanetSize(calcPlanetSize(window.innerWidth));
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden flex flex-col"
      aria-label="Hero — introduction"
    >

      {/* ── Main content ──────────────────────────────────────────────────────
       *  flex-col on mobile  → text above, planet below
       *  md:flex-row          → text left (3/4), planet right (1/4)
       ──────────────────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full min-h-screen flex flex-col md:flex-row">

        {/* ── Text ─────────────────────────────────────────────────────────── */}
        <div className="
          w-full md:w-3/4
          flex flex-col justify-center gap-3
          px-5 sm:px-8 lg:px-12
          pt-20 pb-4 md:py-0
        ">

          {/* Status badge */}
          <div className="
            inline-flex self-start items-center gap-2
            font-nasalization tracking-[0.15em] uppercase text-white/55
            text-[0.72rem] sm:text-[0.9rem] md:text-[1.1rem] lg:text-[1.4rem] xl:text-[1.75rem]
          ">
            <span className="
              w-2 h-2 rounded-full bg-primary shrink-0
              animate-[hero-dot-pulse_2s_ease-in-out_infinite]
            " />
            Full-Stack Developer
          </div>

          {/* Name — fluid type scale */}
          <h1
            className="font-nasalization font-bold text-left tracking-wide leading-[0.88] m-0 text-white"
            style={{ fontSize: 'clamp(2.6rem, 10vw, 11.25rem)' }}
          >
            Myo Myat
            <br />
            <span className="text-primary"> Thiha</span>
          </h1>

        </div>

        {/* ── Planet ───────────────────────────────────────────────────────── */}
        {/*
         *  Mobile: full-width, centred, below the text. pb-20 keeps it clear of
         *  the scroll indicator.
         *  md+: right-quarter column, vertically centred.
         */}
        <div
          className="w-full md:w-1/4 flex items-center justify-center pb-20 md:pb-0"
          aria-hidden="true"
        >
          {/* <Planet3D
            size={planetSize}
            rotationSpeed={0.001}
            modelUrl="/models/death_star.glb"
            axialTilt={0.80}
          /> */}
        </div>

      </div>

      {/* ── Scroll indicator ─────────────────────────────────────────────────
       *  The hero-scroll-bounce keyframe applies translateX(-50%) internally
       *  so no extra -translate-x-1/2 class is needed.
       ──────────────────────────────────────────────────────────────────────── */}
      <button
        className="
          absolute bottom-8 left-1/2
          flex flex-col items-center gap-1
          bg-transparent border-0 cursor-pointer text-white/35
          animate-[hero-scroll-bounce_2.4s_ease-in-out_infinite]
          z-10
        "
        onClick={handleExplore}
        aria-label="Scroll down to projects"
      >
        <span className="font-nasalization text-[0.6rem] tracking-[0.2em] uppercase">
          Scroll
        </span>
        <span className="text-base" aria-hidden="true">↓</span>
      </button>

    </section>
  );
}
