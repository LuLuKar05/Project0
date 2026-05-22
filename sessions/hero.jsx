/* ── Hero Section ── */
/* Full-screen space landing with orbit rings and moon */

const SpHero = () => (
  <section style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', position: 'relative', overflow: 'hidden',
    padding: '0 var(--sp-pad)',
  }}>
    {/* Orbit rings */}
    <OrbitRing size={600} duration={80} opacity={0.04} style={{ top: '10%', right: '-10%' }} />
    <OrbitRing size={900} duration={120} opacity={0.03} style={{ top: '-5%', right: '-20%' }} />

    {/* Moon */}
    <div style={{ position: 'absolute', top: '8%', right: '8%', zIndex: 1 }} className="hero-planet-pos">
      <SpaceFade delay={0.6} y={0}>
        <Planet type="moon" size={280} style={{ animationDelay: '-5s' }} />
      </SpaceFade>
    </div>

    {/* Content */}
    <div style={{ position: 'relative', zIndex: 2, maxWidth: 900 }}>
      <SpaceFade delay={0.2}>
        <div style={{
          fontFamily: 'var(--sp-mono)', fontSize: 12, letterSpacing: '0.25em',
          color: 'var(--sp-orange)', textTransform: 'uppercase', marginBottom: 32,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sp-orange)', animation: 'blink 2s ease-in-out infinite' }} />
          Mission Active — Full-Stack Developer &amp; DevOps
        </div>
      </SpaceFade>

      <SpaceFade delay={0.4}>
        <h1 style={{
          fontFamily: 'var(--sp-display)', fontSize: 'clamp(56px, 11vw, 150px)',
          fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.03em',
          margin: 0, color: '#fff',
        }}>
          <span style={{ display: 'block' }}>MYO MYAT</span>
          <span style={{ display: 'block', color: 'var(--sp-orange)' }}>THIHA</span>
        </h1>
      </SpaceFade>

      <SpaceFade delay={0.6}>
        <p style={{
          fontFamily: 'var(--sp-body)', fontSize: 18, lineHeight: 1.7,
          color: 'rgba(200,210,235,0.5)', maxWidth: 520, margin: '32px 0 0 0',
        }}>
          Engineering systems at the intersection of AI, privacy, and decentralized technology — from the ground up.
        </p>
      </SpaceFade>

      <SpaceFade delay={0.8}>
        <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
          <GlowButton href="#projects" primary>Explore missions</GlowButton>
          <GlowButton href="#contact">Transmit signal</GlowButton>
        </div>
      </SpaceFade>
    </div>

    {/* Scroll indicator */}
    <div style={{
      position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontFamily: 'var(--sp-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
        Scroll to descend
      </span>
      <div style={{
        width: 1, height: 40, background: 'linear-gradient(to bottom, var(--sp-orange), transparent)',
        opacity: 0.4, animation: 'scrollPulse3 2.5s ease-in-out infinite',
      }} />
    </div>
  </section>
);

window.SpHero = SpHero;
