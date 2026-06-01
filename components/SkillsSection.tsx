'use client';
import { useEffect, useRef } from 'react';
import Head from 'next/head';
import SkillsGrid from '@/components/skillsCard';

interface StarData {
  x: number;
  y: number;
  r: number;
  vy: number;
  a: number;
  tw: number;
}


export default function SkillsSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars: StarData[] = [];
    let rafId: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 140; i++) {
      stars.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        r:  Math.random() * 1.3 + 0.3,
        vy: Math.random() * 0.08 + 0.02,
        a:  Math.random() * 0.4 + 0.15,
        tw: Math.random() * Math.PI * 2,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y += s.vy;
        s.tw += 0.02;
        if (s.y > canvas!.height + 2) { s.y = -2; s.x = Math.random() * canvas!.width; }
        const alpha = s.a * (0.6 + 0.4 * Math.sin(s.tw));
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(120, 200, 245, ' + alpha + ')';
        ctx!.fill();
      }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <Head>
        <title >Systems Arsenal — Myo Myat Thiha</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Orbitron:wght@500;600;700;800&family=Barlow:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Background particle canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      />

      {/* Ambient blue haze — complex radial gradient, stays inline */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(20,80,140,0.14) 0%, transparent 70%),' +
            'radial-gradient(ellipse 90% 60% at 50% 110%, rgba(15,60,110,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-[5] max-w-[1320px] mx-auto px-[clamp(24px,5vw,72px)] py-[clamp(64px,9vw,130px)]">

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

        <SkillsGrid />
      </div>

      {/* Footer */}
      <footer className="relative z-5 text-center px-6 pt-10 pb-14 font-nasalization text-[10px] tracking-[0.15em] text-[rgba(79,195,247,0.18)] uppercase">
        Ad astra per aspera · Diagnostic readout nominal
      </footer>

      {/* Holographic scanline overlay — ::after animation handled in CARD_STYLES */}
      <div
        id="scanlines"
        className="fixed inset-0 z-50 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(79,195,247,0.018) 2px, rgba(79,195,247,0.018) 4px)',
        }}
      />
    </>
  );
}
