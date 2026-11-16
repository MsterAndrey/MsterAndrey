import { useInView } from '../../hooks/useInView';
import styles from './Security.module.css';

const ORGS = [
  { x: 130, label: 'Organización A', tone: 'blue' },
  { x: 390, label: 'Organización B', tone: 'violet' },
] as const;

/** Jerarquía de claves: cada organización tiene su propia raíz; no existe una clave por encima. */
export function KeyHierarchy() {
  const [ref, inView] = useInView<SVGSVGElement>({ once: true, threshold: 0.3 });
  return (
    <svg
      ref={ref}
      className={styles.keys}
      data-visible={inView}
      viewBox="0 0 520 250"
      role="img"
      aria-label="Dos organizaciones con jerarquías de claves separadas: clave raíz en HSM, claves por área y una clave por objeto. No existe una clave común por encima de ambas."
    >
      <line x1="260" y1="30" x2="260" y2="240" className={styles.divider} />
      <text x="260" y="18" textAnchor="middle" className={styles.dividerLabel}>AISLAMIENTO</text>

      {ORGS.map((o) => (
        <g key={o.label} className={styles.tree} data-tone={o.tone}>
          {[-62, 62].map((dx) => (
            <g key={dx}>
              <path d={`M${o.x} 86V112H${o.x + dx}V138`} className={styles.edge} pathLength={1} />
              {[-26, 0, 26].map((ox) => (
                <g key={ox}>
                  <path d={`M${o.x + dx} 170V188H${o.x + dx + ox}V202`} className={styles.edge} pathLength={1} />
                  <rect x={o.x + dx + ox - 7} y={204} width={14} height={14} rx={3} className={styles.leaf} />
                </g>
              ))}
              <rect x={o.x + dx - 44} y={138} width={88} height={32} rx={8} className={styles.box} />
              <text x={o.x + dx} y={159} textAnchor="middle" className={styles.boxText}>Área</text>
            </g>
          ))}
          <rect x={o.x - 92} y={40} width={184} height={46} rx={10} className={styles.root} />
          <text x={o.x} y={60} textAnchor="middle" className={styles.rootTitle}>{o.label}</text>
          <text x={o.x} y={77} textAnchor="middle" className={styles.rootSub}>clave raíz · HSM</text>
          <text x={o.x} y={240} textAnchor="middle" className={styles.leafLabel}>una clave por objeto</text>
        </g>
      ))}
    </svg>
  );
}
