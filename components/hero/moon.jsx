/* ── Planet ── */
/* Pure CSS photorealistic spheres with atmosphere glow */

const PLANET_PRESETS = {
  moon: {
    bg: `
      radial-gradient(circle at 35% 35%, rgba(200,200,190,0.9), rgba(120,120,115,0.6) 50%, rgba(60,60,58,0.9)),
      radial-gradient(circle at 65% 40%, rgba(160,158,150,0.4) 0%, transparent 40%),
      radial-gradient(circle at 25% 60%, rgba(90,88,82,0.6) 0%, transparent 30%),
      radial-gradient(circle at 70% 70%, rgba(100,98,92,0.5) 0%, transparent 25%),
      radial-gradient(circle at 45% 25%, rgba(180,178,170,0.3) 0%, transparent 20%),
      radial-gradient(circle at 55% 55%, rgba(80,78,72,0.4) 0%, transparent 15%)
    `,
    shadow: '0 0 60px rgba(200,200,190,0.15), inset -30px -15px 40px rgba(0,0,0,0.7), inset 8px 8px 20px rgba(255,255,240,0.08)',
    glow: 'rgba(200,200,190,0.08)',
  },
  earth: {
    bg: `
      radial-gradient(circle at 35% 35%, rgba(60,130,200,0.9), rgba(20,60,120,0.7) 50%, rgba(5,15,40,0.95)),
      radial-gradient(circle at 30% 45%, rgba(50,160,80,0.5) 0%, transparent 30%),
      radial-gradient(circle at 55% 35%, rgba(50,140,70,0.4) 0%, transparent 25%),
      radial-gradient(circle at 65% 55%, rgba(40,100,180,0.5) 0%, transparent 35%),
      radial-gradient(circle at 40% 65%, rgba(45,120,60,0.3) 0%, transparent 20%),
      radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)
    `,
    shadow: '0 0 80px rgba(60,130,220,0.2), inset -30px -15px 40px rgba(0,0,0,0.7), inset 6px 6px 25px rgba(100,180,255,0.1)',
    glow: 'rgba(60,130,220,0.1)',
  },
  mars: {
    bg: `
      radial-gradient(circle at 35% 35%, rgba(210,120,60,0.9), rgba(160,70,30,0.7) 50%, rgba(80,30,10,0.95)),
      radial-gradient(circle at 45% 40%, rgba(180,100,50,0.4) 0%, transparent 35%),
      radial-gradient(circle at 60% 60%, rgba(140,60,20,0.5) 0%, transparent 30%),
      radial-gradient(circle at 30% 55%, rgba(190,110,55,0.3) 0%, transparent 25%),
      radial-gradient(circle at 50% 20%, rgba(220,150,80,0.2) 0%, transparent 20%),
      radial-gradient(ellipse at 65% 30%, rgba(100,40,15,0.6) 0%, transparent 25%)
    `,
    shadow: '0 0 60px rgba(210,120,60,0.15), inset -30px -15px 40px rgba(0,0,0,0.7), inset 6px 6px 20px rgba(255,160,80,0.08)',
    glow: 'rgba(210,120,60,0.08)',
  },
  saturn: {
    bg: `
      radial-gradient(circle at 35% 35%, rgba(220,190,140,0.9), rgba(180,150,100,0.7) 50%, rgba(80,65,40,0.95)),
      radial-gradient(circle at 50% 45%, rgba(200,170,120,0.4) 0%, transparent 35%),
      radial-gradient(circle at 40% 30%, rgba(210,180,130,0.3) 0%, transparent 25%),
      radial-gradient(ellipse at 50% 50%, rgba(160,130,80,0.4) 0%, transparent 40%)
    `,
    shadow: '0 0 60px rgba(220,190,140,0.12), inset -30px -15px 40px rgba(0,0,0,0.7), inset 6px 6px 20px rgba(255,220,160,0.06)',
    glow: 'rgba(220,190,140,0.06)',
  },
};

const Planet = ({ type = 'moon', size = 300, style = {}, className = '' }) => {
  const p = PLANET_PRESETS[type] || PLANET_PRESETS.moon;

  return (
    <div className={className} style={{
      width: size, height: size, borderRadius: '50%',
      background: p.bg, boxShadow: p.shadow,
      position: 'relative', flexShrink: 0,
      animation: 'planetFloat 20s ease-in-out infinite',
      ...style,
    }}>
      {/* Atmosphere glow */}
      <div style={{
        position: 'absolute', inset: -20, borderRadius: '50%',
        background: `radial-gradient(circle, ${p.glow} 50%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {/* Saturn ring */}
      {type === 'saturn' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) rotateX(75deg)',
          width: size * 1.8, height: size * 1.8, borderRadius: '50%',
          border: '12px solid rgba(200,170,120,0.15)',
          boxShadow: '0 0 0 6px rgba(180,150,100,0.08), 0 0 0 20px rgba(160,130,80,0.05)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
};

window.Planet = Planet;
window.PLANET_PRESETS = PLANET_PRESETS;
