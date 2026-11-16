import { memo, useId } from 'react';
import styles from './CipherCore.module.css';

/** Geometría compartida con el isotipo (scripts/build-brand.mjs): hexágono de nodos a r=27. */
const NODES = Array.from({ length: 6 }, (_, k) => {
  const a = ((-90 + 60 * k) * Math.PI) / 180;
  return [50 + 27 * Math.cos(a), 50 + 27 * Math.sin(a)] as const;
});
const HEX = `M${NODES.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
const RING_R = 45;
const SEG = (2 * Math.PI * RING_R) / 12;

export type CoreState = 'idle' | 'processing';

type Props = {
  size?: number;
  state?: CoreState;
  /** false = versión estática (iconos pequeños, listas). */
  animated?: boolean;
  className?: string;
  label?: string;
};

/**
 * Núcleo neuronal de CIPHER AI.
 * idle: rotación lenta del anillo y respiración del núcleo.
 * processing: flujo de datos por los radios hacia el núcleo y nodos activándose en secuencia.
 */
export const CipherCore = memo(function CipherCore({
  size = 120, state = 'idle', animated = true, className = '', label,
}: Props) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      className={`${styles.core} ${className}`}
      data-state={state}
      data-animated={animated}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`${uid}-ring`} x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
        <radialGradient id={`${uid}-core`} cx="50" cy="50" r="11" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#2563EB" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="50" cy="50" r="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38BDF8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className={styles.glow} cx="50" cy="50" r="30" fill={`url(#${uid}-glow)`} />

      <g className={styles.ring}>
        <circle
          cx="50" cy="50" r={RING_R} fill="none" stroke={`url(#${uid}-ring)`} strokeWidth="2.6"
          strokeDasharray={`${(SEG - 4).toFixed(2)} 4`} transform="rotate(-88 50 50)"
        />
      </g>
      <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(100,116,139,0.45)" strokeWidth="1" />

      <path
        d={`M${NODES[0]!.join(' ')}L${NODES[2]!.join(' ')}L${NODES[4]!.join(' ')}Z`}
        fill="none" stroke="rgba(167,139,250,0.35)" strokeWidth="1.2"
      />
      <path d={HEX} fill="none" stroke="rgba(148,197,255,0.45)" strokeWidth="1.6" strokeLinejoin="round" />

      <g className={styles.spokes}>
        {NODES.map(([x, y], i) => (
          <line key={i} x1={x} y1={y} x2="50" y2="50" stroke="rgba(148,197,255,0.45)" strokeWidth="1.6" />
        ))}
      </g>
      <g className={styles.flow}>
        {NODES.map(([x, y], i) => (
          <line key={i} x1={x} y1={y} x2="50" y2="50" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" />
        ))}
      </g>

      <g className={styles.nodes}>
        {NODES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.2" fill={i % 2 ? '#A78BFA' : '#38BDF8'} />
        ))}
      </g>

      <circle className={styles.halo} cx="50" cy="50" r="15.5" fill="none" stroke="rgba(56,189,248,0.55)" strokeWidth="1.2" />
      <circle className={styles.nucleus} cx="50" cy="50" r="11" fill={`url(#${uid}-core)`} />
    </svg>
  );
});
