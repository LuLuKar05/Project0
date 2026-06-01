'use client';
import { useState, useEffect, useRef } from 'react';

interface StarData {
  x: number; y: number; r: number; vy: number; a: number; tw: number;
}
interface FormFields {
  name: string; email: string; type: string; brief: string;
}
interface FormErrors {
  name: boolean; email: boolean; brief: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_EMAIL = 'mmyat1137@gmail.com';

const BOUNTIES = [
  { title: 'Drift Land 154',  desc: 'Enterprise event management & ticketing platform with real-time QR validation.', meta: '2026 · Platform' },
  { title: 'NutriShield',     desc: 'Zero-knowledge biodefense assistant with threat-adapted meal planning.',          meta: '2026 · AI'       },
  { title: 'Afterverse',      desc: 'Multi-agent automation of post-death legal workflows.',                           meta: '2025 · 1st Place' },
  { title: 'VeriLoan',        desc: 'Under-collateralized lending via cross-chain cryptographic identity.',            meta: '2025 · Web3'     },
];
const COMMENDATIONS = [
  { title: 'UCL AgentVerse — 1st Place',  desc: 'Multi-agent AI · 700 participants.',    meta: '2026' },
  { title: 'Encode Hackathon — Dual Prize', desc: 'DeFi identity · cross-chain protocol.', meta: '2025' },
];
const ARSENAL = ['Python','TypeScript','React','Next.js','Node.js','FastAPI','LangGraph','Solidity','Ethereum','MongoDB','Docker'];

export default function ContactSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeModal, setActiveModal]   = useState<'dossier' | 'message' | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [fields, setFields]             = useState<FormFields>({ name: '', email: '', type: 'Full-time role', brief: '' });
  const [errors, setErrors]             = useState<FormErrors>({ name: false, email: false, brief: false });
  const [formSuccess, setFormSuccess]   = useState(false);
  const [successDetail, setSuccessDetail] = useState('');
  const [mailtoHref, setMailtoHref]     = useState('#');

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
    if (formSuccess) {
      setFormSuccess(false);
      setFields({ name: '', email: '', type: 'Full-time role', brief: '' });
      setErrors({ name: false, email: false, brief: false });
    }
    setActiveModal('message');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: FormErrors = {
      name:  !fields.name,
      email: !EMAIL_RE.test(fields.email),
      brief: !fields.brief,
    };
    setErrors(next);
    if (next.name || next.email || next.brief) return;

    const subject = `[Guild Contract] ${fields.type} — ${fields.name}`;
    const body    = `Client Designation: ${fields.name}\nComm Channel: ${fields.email}\nContract Type: ${fields.type}\n\nMission Brief:\n${fields.brief}`;
    setMailtoHref(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setSuccessDetail(`Contract logged for ${fields.name}. The hunter will respond to ${fields.email} within 24 hours.`);
    setFormSuccess(true);
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

        {/* Hunter Creed */}
        <div className={`creed ${cls}`}>
          <span className="crn tl" /><span className="crn tr" /><span className="crn bl" /><span className="crn br" />
          <div className="creed-status"><span className="dot" /> Available for Contracts</div>
          <span className="creed-mark">&ldquo;</span>
          <div className="creed-quote">
            Point me at the <span className="acc">impossible</span> — I&apos;ll bring it back <span className="acc">shipped</span>, signed, and ahead of schedule.
          </div>
          <div className="creed-attr">
            <span className="ln" /> The Hunter&apos;s Creed · Sector 07 <span className="ln" />
          </div>
        </div>

        {/* Comm Channels */}
        <div className={`channels ${cls}`}>
          <a className="chan" href="https://www.linkedin.com/in/MyoMyatThiha" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="7.5" y1="10.5" x2="7.5" y2="17"/><circle cx="7.5" cy="7" r="0.6" fill="currentColor" stroke="none"/><path d="M11 17v-3.5a2 2 0 0 1 4 0V17"/><line x1="11" y1="10.5" x2="11" y2="17"/></svg>
            <span className="chan-label">LinkedIn</span>
            <span className="chan-sub">/MyoMyatThiha</span>
          </a>
          <a className="chan" href="https://github.com/LuLuKar05" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" strokeWidth="1.6"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>
            <span className="chan-label">GitHub</span>
            <span className="chan-sub">/LuLuKar05</span>
          </a>
          <a className="chan" href={`mailto:${CONTACT_EMAIL}`}>
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
        <div className="modal" style={{ maxWidth: 760 }}>
          <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
          <div className="dossier-inner">
            <div className="dossier-head">
              <div>
                <div className="dossier-name">MYO MYAT THIHA</div>
                <div className="dossier-role">FULL-STACK BOUNTY HUNTER · GUILD ID #LK-05</div>
              </div>
              <div className="dossier-stamp">★ Classified Dossier</div>
            </div>

            <div className="d-sec">
              <div className="d-sec-title">Field Summary</div>
              <p className="d-bio">BSc Computing hunter operating at the intersection of AI, privacy, and decentralized technology. Predicted First-Class Honours (77% avg) at Coventry University. Multiple hackathon victories across UCL, Imperial, and Encode. Builds production systems from the ground up — and closes contracts fast.</p>
            </div>

            <div className="d-sec">
              <div className="d-sec-title">Bounties Closed</div>
              {BOUNTIES.map((b) => (
                <div key={b.title} className="d-row">
                  <div className="d-row-main">
                    <div className="d-row-t">{b.title}</div>
                    <div className="d-row-d">{b.desc}</div>
                  </div>
                  <div className="d-row-meta">{b.meta}</div>
                </div>
              ))}
            </div>

            <div className="d-sec">
              <div className="d-sec-title">Commendations</div>
              {COMMENDATIONS.map((c) => (
                <div key={c.title} className="d-row">
                  <div className="d-row-main">
                    <div className="d-row-t">{c.title}</div>
                    <div className="d-row-d">{c.desc}</div>
                  </div>
                  <div className="d-row-meta">{c.meta}</div>
                </div>
              ))}
            </div>

            <div className="d-sec">
              <div className="d-sec-title">Training</div>
              <div className="d-row">
                <div className="d-row-main">
                  <div className="d-row-t">BSc Computing</div>
                  <div className="d-row-d">Coventry University · Predicted First-Class Honours.</div>
                </div>
                <div className="d-row-meta">77% avg</div>
              </div>
            </div>

            <div className="d-sec">
              <div className="d-sec-title">Arsenal</div>
              <div className="d-arsenal">
                {ARSENAL.map((tag) => <span key={tag} className="d-tag">{tag}</span>)}
              </div>
            </div>

            <div className="dossier-foot">
              <a className="ct-btn primary" href={`mailto:${CONTACT_EMAIL}`}>Recruit the Hunter</a>
              <button className="ct-btn" onClick={() => window.print()}>Download Dossier</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Message Modal ── */}
      <div
        className={`modal-overlay ${activeModal === 'message' ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
      >
        <div className="modal" style={{ maxWidth: 560 }}>
          <button className="modal-close" onClick={() => setActiveModal(null)}>✕</button>
          <div className="form-inner">
            {!formSuccess ? (
              <>
                <div className="form-title">Transmit a Contract</div>
                <p className="form-sub">Brief the hunter on your mission. All transmissions are received on a secure channel.</p>
                <form onSubmit={handleSubmit} noValidate>
                  <div className={`field ${errors.name ? 'error' : ''}`}>
                    <label htmlFor="in-name">Client Designation</label>
                    <input id="in-name" type="text" placeholder="Your name or org"
                      value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} />
                    <div className="err-msg">Designation required.</div>
                  </div>
                  <div className={`field ${errors.email ? 'error' : ''}`}>
                    <label htmlFor="in-email">Comm Channel</label>
                    <input id="in-email" type="email" placeholder="you@channel.com"
                      value={fields.email} onChange={(e) => setFields({ ...fields, email: e.target.value })} />
                    <div className="err-msg">Valid comm channel required.</div>
                  </div>
                  <div className="field">
                    <label htmlFor="in-type">Contract Type</label>
                    <select id="in-type" value={fields.type} onChange={(e) => setFields({ ...fields, type: e.target.value })}>
                      <option>Full-time role</option>
                      <option>Contract / Freelance</option>
                      <option>Collaboration</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className={`field ${errors.brief ? 'error' : ''}`}>
                    <label htmlFor="in-brief">Mission Brief</label>
                    <textarea id="in-brief" placeholder="Describe the bounty..."
                      value={fields.brief} onChange={(e) => setFields({ ...fields, brief: e.target.value })} />
                    <div className="err-msg">A brief is required.</div>
                  </div>
                  <button type="submit" className="ct-btn primary form-submit">Transmit Contract →</button>
                </form>
              </>
            ) : (
              <div className="form-success">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div className="success-t">Transmission Received</div>
                <div className="success-d">{successDetail}</div>
                <a className="ct-btn primary" href={mailtoHref}>Open in Mail Client</a>
              </div>
            )}
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