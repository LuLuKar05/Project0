'use client';
import { useState, useEffect, useRef } from 'react';
import ContactMessageForm from './ui/ContactMessageForm';

interface StarData {
  x: number; y: number; r: number; vy: number; a: number; tw: number;
}

export default function ContactSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeModal, setActiveModal]     = useState<'dossier' | 'message' | null>(null);
  const [revealed, setRevealed]           = useState(false);

  /* Background starfield */
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

    for (let i = 0; i < 160; i++) {
      stars.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        r:  Math.random() * 1.4 + 0.3,
        vy: Math.random() * 0.1 + 0.02,
        a:  Math.random() * 0.45 + 0.15,
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
        ctx!.fillStyle = `rgba(120, 200, 245, ${alpha})`;
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

  /* Entry reveal — slight delay so transition is visible */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const t = setTimeout(() => setRevealed(true), 120);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Escape key closes modal */
  useEffect(() => {
    if (!activeModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveModal(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeModal]);

  /* Body scroll lock while modal is open */
  useEffect(() => {
    document.body.style.overflow = activeModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeModal]);

  function openMessage() {
    setActiveModal('message');
  }

  const cls = revealed ? 'in' : '';

  return (
    <>
      {/* Background canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none" />

      {/* Ambient haze */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 12%, rgba(20,80,140,0.16) 0%, transparent 70%),' +
            'radial-gradient(ellipse 60% 50% at 80% 90%, rgba(255,140,40,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Page content */}
      <div className="relative z-[5] max-w-[1080px] mx-auto px-[clamp(22px,5vw,64px)] py-[clamp(48px,7vw,96px)] flex flex-col items-center min-h-screen justify-center">

        {/* Header label */}
        <div className="flex items-center gap-[14px] mb-[26px]">
          <span className="font-gx-mono text-[12px] tracking-[0.22em] text-gx-cyan uppercase">SEC-07</span>
          <span className="w-10 h-px bg-[rgba(79,195,247,0.35)]" />
          <span className="font-gx-mono text-[12px] tracking-[0.16em] text-[rgba(142,236,255,0.34)] uppercase">Guild Commission Terminal</span>
        </div>

        {/* Title */}
        <h1 className="font-gx-display text-[clamp(40px,7vw,82px)] font-extrabold tracking-[-0.02em] leading-[0.98] text-center text-[rgba(214,240,255,0.96)] mb-[20px]">
          Hire the{' '}
          <span className="text-gx-bright [text-shadow:0_0_34px_rgba(142,236,255,0.55)]">Hunter</span>
        </h1>

        <p className="font-gx-body text-[clamp(15px,1.7vw,19px)] text-[rgba(142,236,255,0.5)] max-w-[600px] text-center leading-[1.7] mb-[clamp(40px,5vw,60px)]">
          A full-stack bounty hunter for hire — tracking down complex problems across AI, privacy, and decentralized space. Review the dossier, open a comm channel, or transmit a contract.
        </p>


        {/* Comm Channels */}
        <div className={`channels ${cls}`}>
          <a className="chan" href={process.env.NEXT_PUBLIC_LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="7.5" y1="10.5" x2="7.5" y2="17"/><circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none"/><path d="M11 17v-3.5a2 2 0 0 1 4 0V17"/><line x1="11" y1="10.5" x2="11" y2="17"/></svg>
            <span className="chan-label">LinkedIn</span>
            <span className="chan-sub">/MyoMyatThiha</span>
          </a>
          <a className="chan" href={process.env.NEXT_PUBLIC_GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>
            <span className="chan-label">GitHub</span>
            <span className="chan-sub">/LuLuKar05</span>
          </a>
          <a className="chan" href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></svg>
            <span className="chan-label">Email</span>
            <span className="chan-sub">Direct Signal</span>
          </a>
        </div>

        {/* Primary Actions */}
        <div className={`ct-actions ${cls}`}>
          <button className="ct-btn" onClick={() => setActiveModal('dossier')}>
            <svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4z"/><path d="M14 4v5h5"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="16" x2="13" y2="16"/></svg>
            View Dossier
          </button>
          <button className="ct-btn primary" onClick={openMessage}>
            <svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
            Transmit Contract
          </button>
        </div>

        <p className="mt-10 font-gx-mono text-[10px] tracking-[0.16em] text-[rgba(79,195,247,0.2)] uppercase text-center">
          Encrypted channel · Guild protocol active · Ad astra per aspera
        </p>
      </div>

      {/* ── Dossier Modal ── */}
      <div
        className={`modal-overlay ${activeModal === 'dossier' ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
      >
        <div className="modal" style={{ maxWidth: 990, height: '900vh' }}>
          <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
            <iframe
            src={process.env.NEXT_PUBLIC_DOSSIER_URL}
            title="Resume"
            className="w-full h-full px-10 py-10 bg-white/5 backdrop-blur-sm"
            style={{ border: 'none', display: 'block' }}
            />
            <div className="dossier-foot">
              <a className="ct-btn primary" href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>Recruit the Hunter</a>
              <a
                className="ct-btn"
                href={process.env.NEXT_PUBLIC_DOSSIER_URL}
                download="MyoMyatThiha_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Resume
              </a>
            </div>
        </div>
      </div>

      {/* ── Message Modal ── */}
      {/* This would be great to used the Form Component */}
      <div
        className={`modal-overlay ${activeModal === 'message' ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
      >
        <div className="modal" style={{ maxWidth: 560 }}>
          <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
          <div className="form-inner">
            <div className="form-title">Transmit a Contract</div>
            <p className="form-sub">Brief the hunter on your mission. All transmissions are received on a secure channel.</p>
            <ContactMessageForm />
          </div>
        </div>
      </div>

      {/* Scanline overlay */}
      <div
        id="scanlines"
        className="fixed inset-0 z-[60] pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(79,195,247,0.016) 2px 4px)',
        }}
      />
    </>
  );
}