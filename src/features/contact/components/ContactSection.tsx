'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ContactMessageForm from './ContactMessageForm';

const ResumeViewer = dynamic(() => import('./ResumeViewer'), { ssr: false });

export default function ContactSection() {
  const [activeModal, setActiveModal] = useState<'dossier' | 'message' | null>(null);
  const [revealed, setRevealed]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!activeModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveModal(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeModal]);

  useEffect(() => {
    document.body.style.overflow = activeModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeModal]);

  const cls = revealed ? 'in' : '';

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden flex flex-col"
      aria-label="Contact — get in touch"
    >

      {/* ── Main layout — mirrors HeroSection two-column grid ── */}
      <div className="relative z-10 w-full min-h-screen flex flex-col md:flex-row">

        {/* ── Left: headline + actions (3/4) ── */}
        <div className="
          w-full md:w-3/4
          flex flex-col justify-center gap-4
          px-5 sm:px-8 lg:px-12
          pt-20 pb-4 md:py-0
        ">

          {/* Status badge — identical pattern to hero */}
          <div className="
            inline-flex self-start items-center gap-2
            font-nasalization tracking-[0.15em] uppercase text-white/55
            text-[0.72rem] sm:text-[0.9rem] md:text-[1.1rem] lg:text-[1.4rem] xl:text-[1.75rem]
          ">
            <span className="
              w-2 h-2 rounded-full bg-primary shrink-0
              animate-[hero-dot-pulse_2s_ease-in-out_infinite]
            " />
            Contact & Contracts
          </div>

          {/* Headline — fluid type, same scale as hero name */}
          <h1
            className="font-nasalization font-bold text-left tracking-wide leading-[0.88] m-0 text-white"
            style={{ fontSize: 'clamp(2.6rem, 7vw, 9rem)' }}
          >
            Get In
            <br />
            <span className="text-primary">Touch.</span>
          </h1>

          {/* Quote tagline */}
          <p
            className="font-nasalization text-white/35 text-[0.72rem] sm:text-[0.9rem] md:text-[1.1rem] lg:text-[1.4rem] xl:text-[1.75rem] mt-1"
          >
            &ldquo;May the <span className="text-primary/60">Force </span> be with you.&rdquo;
          </p>

          {/* CTA buttons */}
          <div className={`ct-actions ${cls} mt-6`} style={{ maxWidth: 480, margin: '24px 0 0' }}>
            <button className="ct-btn" onClick={() => setActiveModal('dossier')}>
              <svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4z"/><path d="M14 4v5h5"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="16" x2="13" y2="16"/></svg>
              View Dossier
            </button>
            <button className="ct-btn primary" onClick={() => setActiveModal('message')}>
              <svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
              Transmit Contract
            </button>
          </div>
        </div>

        {/* ── Right: contact channels (1/4) ── */}
        <div className="
          w-full md:w-1/4
          flex flex-col items-stretch justify-center
          px-5 sm:px-8 md:px-6 lg:px-8
          pb-20 md:pb-0
        ">
          <div className={`chan-col ${cls}`}>
            <a className="chan" href={process.env.NEXT_PUBLIC_LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="7.5" y1="10.5" x2="7.5" y2="17"/><circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none"/><path d="M11 17v-3.5a2 2 0 0 1 4 0V17"/><line x1="11" y1="10.5" x2="11" y2="17"/></svg>
              <span className="chan-text">
                <span className="chan-label">LinkedIn</span>
                <span className="chan-sub">/MyoMyatThiha</span>
              </span>
            </a>
            <a className="chan" href={process.env.NEXT_PUBLIC_GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>
              <span className="chan-text">
                <span className="chan-label">GitHub</span>
                <span className="chan-sub">/LuLuKar05</span>
              </span>
            </a>
            <a className="chan" href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></svg>
              <span className="chan-text">
                <span className="chan-label">Email</span>
                <span className="chan-sub">Direct Signal</span>
              </span>
            </a>
          </div>
        </div>

      </div>

      {/* ── Dossier Modal ── */}
      <div
        className={`modal-overlay ${activeModal === 'dossier' ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
      >
        <div className="modal" style={{ maxWidth: 990, height: '90vh' }}>
          {/* Corner brackets */}
          <span className="modal-crn tl" aria-hidden="true" />
          <span className="modal-crn tr" aria-hidden="true" />
          <span className="modal-crn bl" aria-hidden="true" />
          <span className="modal-crn br" aria-hidden="true" />

          {/* HUD header */}
          <div className="modal-hdr">
            <span className="modal-tag">SYS-07 &nbsp;·&nbsp; Dossier</span>
            <button className="modal-close" onClick={() => setActiveModal(null)}>
              <svg viewBox="0 0 10 10" aria-hidden="true"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
              ESC
            </button>
          </div>

          {/* PDF viewer body — react-pdf canvas render, no browser toolbar */}
          <div className="modal-body dossier-body">
            {activeModal === 'dossier' && (
              <ResumeViewer url={process.env.NEXT_PUBLIC_DOSSIER_URL!} />
            )}
          </div>

          {/* Footer bar */}
          <div className="dossier-foot flex items-center justify-center gap-10 mt-4">
            <a className="ct-btn primary" href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}>
              <svg viewBox="0 0 24 24" strokeWidth="1.6" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
              Recruit the Hunter
            </a>
            <a
              className="ct-btn"
              href={process.env.NEXT_PUBLIC_DOSSIER_URL}
              download="MyoMyatThiha_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" strokeWidth="1.6" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Resume
            </a>
          </div>
        </div>
      </div>

      {/* ── Message Modal ── */}
      <div
        className={`modal-overlay ${activeModal === 'message' ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
      >
        <div className="modal" style={{ maxWidth: 560 }}>
          {/* Corner brackets */}
          <span className="modal-crn tl" aria-hidden="true" />
          <span className="modal-crn tr" aria-hidden="true" />
          <span className="modal-crn bl" aria-hidden="true" />
          <span className="modal-crn br" aria-hidden="true" />

          {/* HUD header */}
          <div className="modal-hdr">
            <span className="modal-tag">SYS-07 &nbsp;·&nbsp; Transmission</span>
            <button className="modal-close" onClick={() => setActiveModal(null)}>
              <svg viewBox="0 0 10 10" aria-hidden="true"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>
              ESC
            </button>
          </div>

          {/* Scrollable body */}
          <div className="modal-body">
            <div className="form-inner">
              <div className="form-title">Transmit a Contract</div>
              <p className="form-sub">Brief the hunter on your mission. All transmissions are received on a secure channel.</p>
              <ContactMessageForm />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
