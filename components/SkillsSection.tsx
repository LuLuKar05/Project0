'use client';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import SkillsGrid from '@/components/skillsCard';
import {SkillCategory} from '@/components/skillsCard';

export default function SkillsSection() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);

  useEffect(() => {
    fetch('/api/v1/getSkills')
      .then((response) => response.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        console.error('Error fetching skills:', error);
      });
  }, []);

  return (
    <section className="relative">
      <Head>
        <title >Systems Arsenal — Myo Myat Thiha</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Orbitron:wght@500;600;700;800&family=Barlow:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Main content */}
      <div className="relative z-[5] w-full mx-auto px-[clamp(24px,5vw,72px)] py-[clamp(64px,9vw,130px)]">

        {/* Section label row */}
        <div className="flex items-center gap-2 mb-[22px] leading-0">
          <span className="font-nasalization text-[12px] tracking-[0.2em] text-primary uppercase">
            SYS-03
          </span>
          <span className="w-3 h-px bg-white/55" />
          <span className="font-nasalization text-[12px] tracking-[0.15em] text-white/55 uppercase">
            Systems Arsenal
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-nasalization text-[6vw] tracking-widest leading-[1.02] text-[000000]" >
          Tech{' '}
          <span className="text-primary tracking-widest">
            Stack
          </span>
        </h1>

        {/* Sub-heading */}
        <p className="font-nasalization text-[1.25vw] text-white/55 max-w-140 leading-[1.7] mb-[clamp(48px,6vw,76px)]">
          Every cluster a constellation of mastered systems — charted across the same sector as the missions.
        </p>

        <SkillsGrid categories={categories} />
      </div>

      {/* Footer */}
      <footer className="relative z-5 text-center px-6 pt-10 pb-14 font-nasalization text-[10px] tracking-[0.15em] text-[rgba(79,195,247,0.18)] uppercase">
        Ad astra per aspera · Diagnostic readout nominal
      </footer>

      {/* Holographic scanline overlay — ::after animation handled in CARD_STYLES */}
      {/* <div
        id="scanlines"
        className="absolute inset-0 z-50 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(79,195,247,0.018) 2px, rgba(79,195,247,0.018) 4px)',
        }}
      /> */}
    </section>
  );
}
