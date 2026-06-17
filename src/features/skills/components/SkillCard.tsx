'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────────── */

export interface SkillCategory {
  name: string;
  skills: string[];
}

interface StarNode {
  x: number;
  y: number;
  label: string;
  twinkleDelay: string;
}

interface ConstellationLink {
  fromIndex: number;
  toIndex: number;
  length: number;
}

/* ── Default skill data ─────────────────────────────────────────────────────── */
// Replace this array (or pass a `categories` prop) to change what the grid shows.

/* ── SVG layout constants ───────────────────────────────────────────────────── */

const SVG_WIDTH      = 340;
const NODE_MARGIN    = 30;
const GRID_COLS      = 2;
const ROW_HEIGHT     = 60;
const TOP_PADDING    = 26;
const LABEL_OFFSET_Y = 16;

/* ── Mulberry32 seeded PRNG ─────────────────────────────────────────────────── */
// Deterministic: same seed always produces the same constellation layout.

function createSeededRng(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Compute star node positions ────────────────────────────────────────────── */

function computeStarLayout(
  skills: string[],
  seedBase: number,
): { nodes: StarNode[]; svgHeight: number } {
  const rng       = createSeededRng(seedBase * 99 + 7);
  const count     = skills.length;
  const rows      = Math.ceil(count / GRID_COLS);
  const cellWidth = (SVG_WIDTH - NODE_MARGIN * 2) / GRID_COLS;
  const svgHeight = TOP_PADDING * 2 + (rows - 1) * ROW_HEIGHT + LABEL_OFFSET_Y + 14;

  const nodes: StarNode[] = skills.map((label, i) => {
    const col       = i % GRID_COLS;
    const row       = Math.floor(i / GRID_COLS);
    const rowCount  = Math.min(GRID_COLS, count - row * GRID_COLS);
    const rowOffset = (GRID_COLS - rowCount) * cellWidth / 2;

    const x = NODE_MARGIN + rowOffset + col * cellWidth + cellWidth * 0.5 + (rng() - 0.5) * cellWidth * 0.22;
    const y = TOP_PADDING + row * ROW_HEIGHT + (rng() - 0.5) * 10;

    return { x, y, label, twinkleDelay: (rng() * 4).toFixed(2) };
  });

  return { nodes, svgHeight };
}

/* ── Compute constellation links ────────────────────────────────────────────── */
// Sequential chain + one nearest-neighbour per node for a subtle mesh effect.

function computeConstellationLinks(nodes: StarNode[]): ConstellationLink[] {
  const links: ConstellationLink[] = [];

  const addLink = (a: number, b: number) => {
    const length = Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y);
    links.push({ fromIndex: a, toIndex: b, length });
  };

  for (let i = 0; i < nodes.length - 1; i++) addLink(i, i + 1);

  for (let a = 0; a < nodes.length; a++) {
    let nearestIndex = -1, nearestDist = Infinity;
    for (let b = 0; b < nodes.length; b++) {
      if (b === a || b === a + 1 || b === a - 1) continue;
      const dx = nodes[a].x - nodes[b].x;
      const dy = nodes[a].y - nodes[b].y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) { nearestDist = dist; nearestIndex = b; }
    }
    if (nearestIndex >= 0 && a < nearestIndex) addLink(a, nearestIndex);
  }

  return links;
}

/* ── SkillCategoryCard ──────────────────────────────────────────────────────── */

interface SkillCategoryCardProps {
  category: SkillCategory;
  index: number;
}

function SkillCategoryCard({ category, index }: SkillCategoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);

  const [isRevealed,      setIsRevealed]      = useState(false);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);

  const { nodes, svgHeight } = useMemo(
    () => computeStarLayout(category.skills, index + 1),
    [category.skills, index],
  );

  const links = useMemo(() => computeConstellationLinks(nodes), [nodes]);

  /* Reveal card when scrolled into view */
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setIsRevealed(true); observer.disconnect(); }
      },
      { threshold: 0.2 },
    );
    observer.observe(card);

    // Safety fallback — reveal anything still hidden after 600 ms
    const fallback = setTimeout(() => setIsRevealed(true), 600);

    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, []);

  /* Animate constellation lines once the card is revealed */
  useEffect(() => {
    if (!isRevealed || !svgRef.current) return;
    const lines = svgRef.current.querySelectorAll<SVGLineElement>('.c-link');
    lines.forEach((line, i) => {
      line.style.transition = `stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1) ${(0.3 + i * 0.04).toFixed(2)}s`;
      requestAnimationFrame(() => { line.style.strokeDashoffset = '0'; });
    });
  }, [isRevealed]);

  return (
    <div
      ref={cardRef}
      className={`mod${isRevealed ? ' in' : ''}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
      onMouseLeave={() => setActiveNodeIndex(null)}
    >
      {/* HUD corner brackets */}
      <span className="crn tl" /><span className="crn tr" />
      <span className="crn bl" /><span className="crn br" />

      {/* Card header */}
      <div className="flex flex-col gap-1 mb-2">
        <span className="text text-nasalization text-white/55">{category.name}</span>
      </div>
      <div className="mod-count">{category.skills.length} systems online</div>

      {/* Constellation SVG */}
      <svg
        ref={svgRef}
        className="constel"
        viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connection lines */}
        <g>
          {links.map((link, i) => (
            <line
              key={i}
              className="c-link"
              x1={nodes[link.fromIndex].x}
              y1={nodes[link.fromIndex].y}
              x2={nodes[link.toIndex].x}
              y2={nodes[link.toIndex].y}
              strokeDasharray={link.length}
              strokeDashoffset={link.length}
            />
          ))}
        </g>

        {/* Star nodes */}
        {nodes.map((node, i) => (
          <g
            key={i}
            className={`c-star${activeNodeIndex === i ? ' hot' : activeNodeIndex !== null ? ' dim' : ''}`}
            onMouseEnter={() => setActiveNodeIndex(i)}
          >
            <circle className="c-halo" cx={node.x} cy={node.y} r={9} />
            <circle
              className="c-node"
              cx={node.x}
              cy={node.y}
              r={2.6}
              style={{ animation: `twinkle 3.5s ease-in-out ${node.twinkleDelay}s infinite` }}
            />
            <text
              className="c-label"
              x={node.x}
              y={node.y + LABEL_OFFSET_Y}
              textAnchor="middle"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── SkillsGrid (default export) ────────────────────────────────────────────── */
// Pass a `categories` prop to override the default data, or add items to
// SKILL_CATEGORIES above. The grid renders one SkillCategoryCard per entry.

interface SkillsGridProps {
  categories: SkillCategory[];
}

export default function SkillsGrid({ categories }: SkillsGridProps) {
  return (
    <div className="grid" id="grid">
      {categories.map((category, index) => (
        <SkillCategoryCard
          key={category.name}
          category={category}
          index={index}
        />
      ))}
    </div>
  );
}
