/* ── OrbitRing ── */
/* Decorative rotating orbital ring with a dot marker */

const OrbitRing = ({ size = 500, duration = 60, opacity = 0.06, style = {} }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `1px solid rgba(255,255,255,${opacity})`,
    position: 'absolute', pointerEvents: 'none',
    animation: `orbitSpin ${duration}s linear infinite`,
    ...style,
  }}>
    <div style={{
      width: 5, height: 5, borderRadius: '50%',
      background: 'rgba(255,255,255,0.25)',
      position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
    }} />
  </div>
);

window.OrbitRing = OrbitRing;
