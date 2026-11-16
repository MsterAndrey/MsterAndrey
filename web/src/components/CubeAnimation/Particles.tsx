import { memo, type CSSProperties } from 'react';
import styles from './CubeAnimation.module.css';

// Posiciones deterministas (sin Math.random): el render es estable y no se recalcula.
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 137.508 * Math.PI) / 180; // ángulo áureo
  const r = 26 + ((i * 53) % 22);
  return {
    left: 50 + r * Math.cos(a),
    top: 50 + r * Math.sin(a) * 0.82,
    size: 1.5 + ((i * 7) % 3) * 0.6,
    dur: 9 + ((i * 5) % 8),
    delay: -((i * 1.7) % 12),
    o: 0.35 + ((i * 3) % 5) * 0.1,
  };
});

export const Particles = memo(function Particles() {
  return (
    <div className={styles.particles} aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={styles.particle}
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              '--size': `${p.size}px`,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
              '--o': p.o,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
});
