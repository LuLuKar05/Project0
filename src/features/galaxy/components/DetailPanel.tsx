/**
 * @file src/features/galaxy/components/DetailPanel.tsx
 * Right-side sliding panel for the selected project (bottom-sheet on mobile).
 *
 * Structure: sticky top bar (back · position · copy) → scrolling body (header
 * with per-planet accent, collapsible description, award badges, tech chips,
 * links) → sticky footer (prev/next). Accent colour is derived from the
 * planet's orbit slot so each project feels distinct.
 *
 * Keyboard: Esc closes, ←/→ navigate. Focus moves to the panel on open and is
 * restored on close.
 */

'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Project } from '@/lib/types';
import { planetColors } from '@/features/galaxy/lib/derive';

interface DetailPanelProps {
  project: Project | null;
  index: number;   // 0-based selected index
  total: number;   // total selectable projects
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const LONG_DESC_CHARS = 220;
const pad2 = (n: number) => String(n).padStart(2, '0');

// ── inline icons (no dependency) ──────────────────────────────────────────────
const I = { w: 14, h: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 } as const;
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" {...I}><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" /></svg>
);
const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" {...I}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" {...I}><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>
);
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" {...I}><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" /><path d="M10 14h4M9 20h6M12 14v6" /></svg>
);

export default function DetailPanel({ project, index, total, onClose, onPrev, onNext }: DetailPanelProps) {
  const isVisible = project !== null;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const expanded = project ? expandedId === project.id : false;
  const copied = project ? copiedId === project.id : false;

  // Keyboard: Esc / arrows while open.
  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, onClose, onPrev, onNext]);

  // Move focus into the panel on open; restore it on close.
  useEffect(() => {
    if (isVisible) {
      restoreRef.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else {
      restoreRef.current?.focus?.();
    }
  }, [isVisible]);

  const accent = project ? planetColors(project.order).surface : '#ff6200';
  const fullText = project ? (project.fullDesc || project.shortDesc) : '';
  const paragraphs = fullText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const isLong = fullText.length > LONG_DESC_CHARS || paragraphs.length > 1;
  const clamped = isLong && !expanded;

  const awards = project ? project.tags.filter((t) => t.category === 'achievement') : [];
  const tech = project ? project.tags.filter((t) => t.category !== 'achievement') : [];
  const copyUrl = project?.deployedURL || project?.githubURL || '';

  const onCopy = () => {
    if (!project || !copyUrl) return;
    navigator.clipboard?.writeText(copyUrl).then(() => {
      setCopiedId(project.id);
      setTimeout(() => setCopiedId((id) => (id === project.id ? null : id)), 1600);
    });
  };

  return (
    <div
      ref={panelRef}
      id="detail-panel"
      tabIndex={-1}
      className={`dp-panel${isVisible ? ' visible' : ''}`}
      style={{ ['--dp-accent' as keyof CSSProperties]: accent } as CSSProperties}
      role="dialog"
      aria-modal={isVisible}
      aria-label={project ? `Project: ${project.title}` : 'Project detail panel'}
    >
      {/* corner brackets */}
      <span className="dp-crn tl" aria-hidden="true" />
      <span className="dp-crn tr" aria-hidden="true" />
      <span className="dp-crn bl" aria-hidden="true" />
      <span className="dp-crn br" aria-hidden="true" />

      {/* ── Sticky top bar ── */}
      <div className="dp-top">
        <button className="dp-back" onClick={onClose} aria-label="Back to sector view">← Sector view</button>
        <span className="dp-pos">{pad2(index + 1)} <i>/</i> {pad2(total)}</span>
        {copyUrl && (
          <button className="dp-icon" onClick={onCopy} aria-label="Copy project link">
            <CopyIcon />{copied && <span className="dp-copied">Copied</span>}
          </button>
        )}
      </div>

      {project && (
        /* key on id → re-runs the staggered reveal & resets scroll per project */
        <div className="dp-body" key={project.id}>
          {/* Header */}
          <header className="dp-head dp-reveal">
            <span className="dp-index" aria-hidden="true">{pad2(index + 1)}</span>
            <div className="dp-meta">
              <span className="dp-cat">{project.category}</span>
              <span className="dp-meta-sep" aria-hidden="true">·</span>
              <span className="dp-yr">{new Date(project.date).getFullYear()}</span>
            </div>
            <h2 className="dp-ttl">{project.title}</h2>
            <span className="dp-bar" aria-hidden="true" />
          </header>

          {/* Awards */}
          {awards.length > 0 && (
            <div className="dp-awards dp-reveal">
              {awards.map((a) => (
                <span key={a.id} className="dp-award" style={{ color: a.color, borderColor: a.color }}>
                  <TrophyIcon />{a.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="dp-reveal">
            <div className={`dp-desc${clamped ? ' dp-desc--clamped' : ''}`}>
              {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
            </div>
            {isLong && (
              <button
                type="button"
                className={`dp-more${expanded ? ' open' : ''}`}
                onClick={() => setExpandedId(expanded ? null : project.id)}
                aria-expanded={expanded}
              >
                {expanded ? 'Show less' : 'Read more'}<span className="dp-chev" aria-hidden="true">▾</span>
              </button>
            )}
          </div>

          {/* Tech stack */}
          {tech.length > 0 && (
            <div className="dp-reveal">
              <div className="dp-tl">Tech Stack</div>
              <div className="dp-tags">
                {tech.map((tag) => (
                  <span key={tag.id} className="dp-chip">
                    <span className="dp-chip-dot" style={{ background: tag.color }} />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links — Live Demo (primary) + GitHub (secondary), 50/50 */}
          <div className="dp-links dp-reveal">
            {project.deployedURL && (
              <a className="dp-lnk primary" href={project.deployedURL} target="_blank" rel="noopener noreferrer">
                <ExternalIcon /> Live Demo
              </a>
            )}
            {project.githubURL && (
              <a className="dp-lnk" href={project.githubURL} target="_blank" rel="noopener noreferrer">
                <GithubIcon /> GitHub
              </a>
            )}
            {!project.githubURL && !project.deployedURL && (
              <span className="dp-lnk off">Links classified</span>
            )}
          </div>
        </div>
      )}

      {/* ── Sticky footer ── */}
      <div className="dp-foot">
        <button className="dp-nb" onClick={onPrev} aria-label="Previous project">← Prev</button>
        <button className="dp-nb" onClick={onNext} aria-label="Next project">Next →</button>
      </div>
    </div>
  );
}
